import mermaid from 'mermaid';

function expandedClone(source: SVGSVGElement): SVGSVGElement {
  const clone = source.cloneNode(true) as SVGSVGElement;
  const nodes: Element[] = [clone, ...clone.querySelectorAll('*')];
  const idMap = new Map(nodes.filter((element) => element.id).map((element) => [element.id, `expanded-${element.id}`]));
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`#(${[...idMap.keys()].sort((a, b) => b.length - a.length).map(escape).join('|')})(?![\\w-])`, 'g');
  const rewrite = (value: string) => value.replace(matcher, (_match, id) => `#${idMap.get(id)}`);
  for (const element of nodes) {
    if (element.id) element.id = idMap.get(element.id)!;
    for (const attribute of [...element.attributes]) {
      if (attribute.name === 'id') continue;
      let value = rewrite(attribute.value);
      if (attribute.name.startsWith('aria-')) value = value.split(' ').map((id) => idMap.get(id) || id).join(' ');
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
    if (element.tagName.toLowerCase() === 'style') element.textContent = rewrite(element.textContent || '');
  }
  return clone;
}

export async function initializeDiagrams() {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
    themeVariables: {
      fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif', fontSize: '14px',
      primaryColor: '#e5ecd9', primaryTextColor: '#334b35', primaryBorderColor: '#a4b68e',
      secondaryColor: '#f5ecd9', secondaryTextColor: '#4e4939', secondaryBorderColor: '#c4b590',
      tertiaryColor: '#eef1e7', tertiaryBorderColor: '#bdc9ac', lineColor: '#7e926d',
      textColor: '#334b35', mainBkg: '#e5ecd9', nodeBorder: '#a4b68e', clusterBkg: '#f2f4e9', clusterBorder: '#ced8bc',
      edgeLabelBackground: '#fafbf5', actorBkg: '#e5ecd9', actorBorder: '#a4b68e', actorTextColor: '#334b35',
      signalColor: '#5e7752', signalTextColor: '#334b35', noteBkgColor: '#f5ecd9', noteBorderColor: '#c4b590', noteTextColor: '#514b3e',
    },
    flowchart: { htmlLabels: true, useMaxWidth: true, curve: 'linear', nodeSpacing: 28, rankSpacing: 42 },
    sequence: { useMaxWidth: true, actorFontSize: 14, noteFontSize: 13, messageFontSize: 13 },
  });

  const dialog = document.getElementById('diagram-dialog') as HTMLDialogElement;
  const canvas = dialog.querySelector('.diagram-canvas') as HTMLElement;
  const output = dialog.querySelector('output')!;
  let expanded: SVGSVGElement | undefined;
  let baseWidth = 700;
  let scale = 1;
  function zoom() {
    if (!expanded) return;
    expanded.style.width = `${Math.round(baseWidth * scale)}px`;
    expanded.setAttribute('width', String(Math.round(baseWidth * scale)));
    output.textContent = `${Math.round(scale * 100)}%`;
  }
  dialog.querySelector('[data-zoom-in]')!.addEventListener('click', () => { scale = Math.min(3, scale + .25); zoom(); });
  dialog.querySelector('[data-zoom-out]')!.addEventListener('click', () => { scale = Math.max(.5, scale - .25); zoom(); });
  dialog.addEventListener('close', () => { canvas.replaceChildren(); expanded = undefined; });

  for (const node of document.querySelectorAll<HTMLElement>('.mermaid')) {
    const figure = node.closest<HTMLElement>('[data-diagram]')!;
    const source = node.textContent || '';
    figure.dataset.diagramState = 'loading';
    try {
      await mermaid.run({ nodes: [node], suppressErrors: false });
      const svg = node.querySelector<SVGSVGElement>('svg');
      if (!svg) throw new Error('图解没有生成 SVG。');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', '课程概念关系与流程图，支持放大查看');
      figure.dataset.diagramState = 'ready';
      const button = figure.querySelector<HTMLButtonElement>('[data-diagram-expand]')!;
      button.disabled = false;
      button.addEventListener('click', () => {
        expanded = expandedClone(svg);
        baseWidth = Math.max(660, svg.viewBox.baseVal.width || svg.getBoundingClientRect().width);
        scale = 1;
        canvas.replaceChildren(expanded);
        zoom(); dialog.showModal();
        canvas.scrollTo(0, 0);
      });
    } catch (error) {
      figure.dataset.diagramState = 'error';
      console.error('图解渲染失败', error);
      const note = document.createElement('p'); note.className = 'diagram-error'; note.textContent = '图解暂时无法展开，以下保留原稿内容。';
      const original = document.createElement('pre'); original.textContent = source;
      node.replaceChildren(note, original);
    }
  }
}
