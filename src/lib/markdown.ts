import MarkdownIt, { type Token } from 'markdown-it';
import GithubSlugger from 'github-slugger';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import powershell from 'highlight.js/lib/languages/powershell';
import markdown from 'highlight.js/lib/languages/markdown';
import { courseLink, readSource, sourceTitle, type CourseEntry } from '../data/course.ts';

hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('markdown', markdown);

export type Heading = { id: string; text: string; level: number };
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });
const originalLinkOpen = md.renderer.rules.link_open || ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options));
md.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index];
  const href = courseLink(String(token.attrGet('href') || ''));
  token.attrSet('href', href);
  if (/^https?:\/\//i.test(href)) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
  }
  return originalLinkOpen(tokens, index, options, env, self);
};
md.renderer.rules.fence = (tokens, index) => {
  const { content, info } = tokens[index];
  const language = info.trim().split(/\s+/)[0].toLowerCase();
  if (language === 'mermaid') {
    return `<figure class="diagram" data-diagram data-pagefind-ignore><div class="mermaid">${escapeHtml(content)}</div><figcaption><span>图解 · 点击右侧放大阅读</span><button type="button" class="diagram-expand" data-diagram-expand disabled aria-label="放大图表">放大查看 <span aria-hidden="true">↗</span></button></figcaption></figure>`;
  }
  const highlighted = hljs.getLanguage(language) ? hljs.highlight(content, { language, ignoreIllegals: true }).value : escapeHtml(content);
  return `<div class="code-shell"><div class="code-toolbar"><span>${escapeHtml(language || 'text')}</span><button type="button" class="copy-button" data-copy>复制代码</button></div><pre tabindex="0"><code class="hljs language-${escapeHtml(language || 'text')}">${highlighted}</code></pre></div>`;
};
md.renderer.rules.table_open = () => '<div class="table-scroll" tabindex="0" role="region" aria-label="数据表格，可左右滚动"><table>';
md.renderer.rules.table_close = () => '</table></div>';

function inlineText(token: Token): string {
  if (!token.children) return token.content;
  return token.children.map((child) => child.type === 'html_inline' ? '' : child.type === 'softbreak' || child.type === 'hardbreak' ? ' ' : child.content).join('');
}

export function renderMarkdown(source: string, entry: CourseEntry, options: { stripTitle?: boolean; stripNavigation?: boolean } = {}) {
  let tokens = md.parse(source, {});
  if (options.stripNavigation !== false) {
    for (let index = tokens.length - 3; index >= 0; index--) {
      if (tokens[index].type !== 'paragraph_open' || tokens[index + 1]?.type !== 'inline') continue;
      const content = tokens[index + 1].content;
      if (/[⬅➡🏠👉]/u.test(content) && /\]\([^)]*\.md\)/.test(content) && /上一章|下一章|课程导读|准备好了吗/.test(content)) {
        // Only remove the last, standalone navigation paragraph, never a link in the lesson.
        if (tokens.slice(index + 3).every((token) => token.type === 'hr')) tokens.splice(index, 3);
      }
      break;
    }
  }
  if (options.stripTitle !== false && tokens[0]?.type === 'heading_open' && tokens[0].tag === 'h1') tokens = tokens.slice(3);
  while (tokens[tokens.length - 1]?.type === 'hr') tokens.pop();

  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let templateSection = false;
  let quoteDepth = 0;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'heading_open') {
      const level = Number(token.tag.slice(1));
      const text = inlineText(tokens[index + 1]);
      const clean = text.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim();
      const id = slugger.slug(clean) || `section-${headings.length + 1}`;
      token.attrSet('id', id);
      if (level === 2) templateSection = entry.id === '04' && text.includes('可直接复制');
      if (level >= 2 && level <= 3) headings.push({ id, text, level });
    }
    if (token.type === 'blockquote_open') {
      if (templateSection && quoteDepth === 0) {
        const wrapper = new MarkdownIt.Token('html_block', '', 0);
        wrapper.content = '<div class="prompt-template"><div class="template-toolbar"><span>可直接使用的提示词</span><button type="button" class="copy-button" data-copy>复制提示词</button></div>';
        tokens.splice(index, 0, wrapper);
        index++;
        token.meta = { template: true };
      }
      quoteDepth++;
    }
    if (token.type === 'blockquote_close') {
      quoteDepth--;
      if (templateSection && quoteDepth === 0) {
        const wrapper = new MarkdownIt.Token('html_block', '', 0);
        wrapper.content = '</div>';
        tokens.splice(index + 1, 0, wrapper);
        index++;
      }
    }
  }
  return { html: md.renderer.render(tokens, md.options, {}), headings };
}

export function renderEntry(entry: CourseEntry) {
  const source = readSource(entry);
  return { entry, title: sourceTitle(entry), source, ...renderMarkdown(source, entry) };
}
