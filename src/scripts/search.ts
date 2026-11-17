type ResultData = { url: string; excerpt: string; meta: { title?: string }; sub_results?: { url: string; title: string; excerpt: string }[] };
type Pagefind = { search: (query: string) => Promise<{ results: { data: () => Promise<ResultData> }[] }>; init: () => void };
type DevEntry = { title: string; url: string; sections: { id: string; text: string; title: string }[] };

let initialized = false;
let pagefind: Promise<Pagefind> | undefined;
let devEntries: Promise<DevEntry[]> | undefined;
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

async function developmentSearch(query: string): Promise<{ total: number; results: ResultData[] }> {
  const entries: DevEntry[] = await (devEntries ||= fetch('/search-index.json').then(async (response): Promise<DevEntry[]> => { if (!response.ok) throw new Error('Search index missing'); return await response.json() as DevEntry[]; }));
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = entries.flatMap((entry) => {
    const scored = entry.sections.map((section) => {
      const lower = `${entry.title} ${section.title} ${section.text}`.toLocaleLowerCase();
      if (!terms.every((term) => lower.includes(term))) return null;
      const score = terms.reduce((sum, term) => sum + (entry.title.toLocaleLowerCase().includes(term) ? 20 : 0) + (section.title.toLocaleLowerCase().includes(term) ? 10 : 0), 1);
      const index = Math.max(0, section.text.toLocaleLowerCase().indexOf(terms[0]) - 50);
      let excerpt = escapeHtml(section.text.slice(index, index + 170));
      for (const term of terms) excerpt = excerpt.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '<mark>$&</mark>');
      return { score, url: `${entry.url}${section.id ? `#${section.id}` : ''}`, excerpt, meta: { title: entry.title } };
    }).filter((value) => value !== null).sort((a, b) => b.score - a.score);
    return scored.length ? [scored[0]] : [];
  }).sort((a, b) => b.score - a.score);
  return { total: results.length, results: results.slice(0, 12) };
}

async function find(query: string) {
  // Astro's development server has no post-build Pagefind files. This local,
  // pre-rendered index keeps the same search flow available during editing.
  if (import.meta.env.DEV) return developmentSearch(query);
  const bundlePath = '/pagefind/pagefind.js';
  const module = await (pagefind ||= import(/* @vite-ignore */ bundlePath).then((value) => { value.init(); return value as Pagefind; }));
  const response = await module.search(query);
  return { total: response.results.length, results: await Promise.all(response.results.slice(0, 12).map((result) => result.data())) };
}

export function setupSearch() {
  if (initialized) return;
  initialized = true;
  const input = document.getElementById('course-search') as HTMLInputElement;
  const results = document.getElementById('search-results')!;
  const status = document.getElementById('search-status')!;
  const dialog = document.getElementById('search-dialog')!;
  let generation = 0;
  let timer = 0;

  async function search() {
    const request = ++generation;
    const query = input.value.trim().slice(0, 160);
    if (!query) { results.replaceChildren(); status.textContent = '在 15 章课程和附录里，找到你需要的答案。'; return; }
    status.textContent = '正在翻阅课程…';
    try {
      const response = await find(query);
      if (request !== generation) return;
      results.replaceChildren();
      status.textContent = response.total ? `找到 ${response.total} 篇相关内容${response.total > 12 ? '，先看看最相关的 12 篇' : ''}。` : '暂时没有找到，换一个更短的词试试？';
      for (const data of response.results) {
        const section = data.sub_results?.find((value) => value.url.includes('#'));
        const link = document.createElement('a'); link.className = 'search-result';
        const url = new URL(section?.url || data.url, location.origin);
        if (url.origin !== location.origin) continue;
        link.href = `${url.pathname}${url.hash}`;
        const title = document.createElement('strong'); title.textContent = data.meta.title || '课程内容';
        const excerpt = document.createElement('p');
        // Pagefind escapes source text before inserting its own <mark> tags.
        // Keep only text and marks, including for the development index.
        const parsed = new DOMParser().parseFromString(section?.excerpt || data.excerpt, 'text/html');
        for (const node of parsed.body.childNodes) {
          if (node instanceof HTMLElement && node.tagName === 'MARK') { const mark = document.createElement('mark'); mark.textContent = node.textContent; excerpt.append(mark); }
          else excerpt.append(document.createTextNode(node.textContent || ''));
        }
        link.append(title, excerpt);
        if (section?.title) { const label = document.createElement('small'); label.textContent = `定位到：${section.title}`; link.append(label); }
        results.append(link);
      }
    } catch {
      if (request !== generation) return;
      pagefind = undefined;
      results.replaceChildren(); status.textContent = '搜索暂时不可用，请稍后重试。课程目录和正文仍可直接阅读。';
    }
  }

  input.addEventListener('input', () => {
    generation++; window.clearTimeout(timer);
    results.replaceChildren(); status.textContent = input.value.trim() ? '正在翻阅课程…' : '在 15 章课程和附录里，找到你需要的答案。';
    timer = window.setTimeout(search, 180);
  });
  input.closest('form')!.addEventListener('submit', (event) => { event.preventDefault(); window.clearTimeout(timer); void search(); });
  dialog.querySelectorAll<HTMLButtonElement>('[data-search-term]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.searchTerm!; input.focus(); void search(); }));
  dialog.addEventListener('keydown', (event) => {
    if (!(event instanceof KeyboardEvent) || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const links = [...results.querySelectorAll<HTMLAnchorElement>('a')];
    if (!links.length) return;
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (document.activeElement === input || index >= 0) {
      event.preventDefault();
      if (event.key === 'ArrowDown') links[Math.min(index + 1, links.length - 1)].focus();
      else if (index <= 0) input.focus(); else links[index - 1].focus();
    }
  });
  if (input.value.trim()) void search();
}
