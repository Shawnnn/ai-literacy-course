import { load } from 'cheerio';
import { entries } from '../data/course';
import { renderEntry } from '../lib/markdown';

export function GET() {
  const index = entries.map((entry) => {
    const { html, title } = renderEntry(entry);
    const $ = load(html);
    $('[data-diagram], .code-toolbar, .template-toolbar').remove();
    const sections: { id: string; title: string; text: string }[] = [];
    let current = { id: '', title, text: '' };
    $('body').children().each((_index, element) => {
      if (/^h[23]$/.test(element.tagName || '')) { sections.push(current); current = { id: $(element).attr('id') || '', title: $(element).text(), text: '' }; }
      current.text += ` ${$(element).text()}`;
    });
    sections.push(current);
    return { title, url: entry.url, sections: sections.map((section) => ({ ...section, text: section.text.replace(/\s+/g, ' ').trim() })) };
  });
  return Response.json(index);
}
