import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { load } from 'cheerio';
import { gunzipSync } from 'node:zlib';
import MarkdownIt from 'markdown-it';
import { entries, readSource, courseLink } from '../src/data/course.ts';

const md = new MarkdownIt({ html: true });
const dist = resolve('dist');
assert(existsSync(dist), '先运行 npm run build，再检查构建产物。');
const routeFile = (path) => path === '/404.html' ? join(dist, '404.html') : join(dist, path.replace(/^\//, ''), 'index.html');
const documents = new Map();
const counts = { pages: 0, diagrams: 0, tables: 0, answers: 0, links: 0, templates: 0 };
const expected = { diagrams: 0, tables: 0, answers: 0 };

for (const entry of entries) {
  const path = routeFile(entry.url);
  assert(existsSync(path), `缺少页面 ${entry.url}`);
  const $ = load(readFileSync(path, 'utf8'));
  documents.set(entry.url, $);
  assert.equal($('h1').length, 1, `${entry.url} 应只有一个 h1`);
  assert.equal($('html').attr('lang'), 'zh-CN');
  assert.equal($('body').attr('data-entry'), entry.id);
  assert($('meta[name="description"]').attr('content'));
  const ids = $('[id]').toArray().map((element) => $(element).attr('id'));
  assert.equal(new Set(ids).size, ids.length, `${entry.url} 出现重复 ID`);
  counts.pages++;
  counts.diagrams += $('[data-diagram]').length;
  counts.tables += $('main table').length;
  counts.answers += $('.lesson-content details').length;
  counts.templates += $('.prompt-template').length;
  const source = readSource(entry);
  const tokens = md.parse(source, {});
  expected.diagrams += tokens.filter((token) => token.type === 'fence' && token.info.trim() === 'mermaid').length;
  expected.tables += tokens.filter((token) => token.type === 'table_open').length;
  expected.answers += (source.match(/<details>/g) || []).length;
  for (const token of tokens) {
    for (const child of token.children || []) {
      if (child.type !== 'link_open') continue;
      const href = child.attrGet('href');
      if (href && !href.startsWith('#')) assert($('a').toArray().some((element) => $(element).attr('href') === courseLink(href)), `${entry.file} 的链接没有保留：${href}`);
    }
  }
}
assert.equal(counts.pages, 18);
assert.equal(counts.diagrams, expected.diagrams, '图解数量与源稿不一致');
assert.equal(counts.tables, expected.tables, '表格数量与源稿不一致');
assert.equal(counts.answers, expected.answers, '答案数量与源稿不一致');
assert.equal(counts.templates, 5, '第 4 章应提供 5 个可复制模板');

for (const [path, $] of documents) {
  for (const element of $('a[href]').toArray()) {
    const href = $(element).attr('href');
    if (!href || !/^(\/|#)/.test(href) || href.startsWith('//')) continue;
    const target = new URL(href, `http://course.local${path}`);
    assert(!target.pathname.endsWith('.md'), `${path} 留有未转换的 Markdown 链接`);
    const targetDocument = documents.get(target.pathname);
    assert(targetDocument, `${path} 存在站内死链 ${href}`);
    if (target.hash) {
      const id = decodeURIComponent(target.hash.slice(1));
      assert(targetDocument('[id]').toArray().some((node) => targetDocument(node).attr('id') === id), `${path} 存在失效锚点 ${href}`);
    }
    counts.links++;
  }
  for (const element of $('[src], link[rel="stylesheet"], link[rel="icon"]').toArray()) {
    const url = $(element).attr('src') || $(element).attr('href');
    if (url?.startsWith('/') && !url.startsWith('//')) assert(existsSync(join(dist, url.slice(1))), `缺少资源 ${url}`);
  }
}
assert(existsSync(join(dist, 'pagefind', 'pagefind.js')), '缺少 Pagefind 生产索引');
const searchManifest = JSON.parse(readFileSync(join(dist, 'pagefind', 'pagefind-entry.json'), 'utf8'));
assert.equal(searchManifest.languages['zh-cn'].page_count, entries.length, '搜索索引页面数不完整');
const metadata = readFileSync(join(dist, 'pagefind', `pagefind.${searchManifest.languages['zh-cn'].hash}.pf_meta`));
assert(metadata.length > 0, '搜索元数据为空，请重新构建索引');
assert(gunzipSync(metadata).length > 0, '搜索元数据压缩文件损坏');
assert(existsSync(join(dist, 'share-cover.png')), '缺少分享封面');
assert(existsSync(join(dist, '404.html')), '缺少 404 页面');
const findHtml = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? findHtml(join(directory, entry.name)) : entry.name.endsWith('.html') ? [entry.name] : []);
assert.equal(findHtml(dist).length, 19, '只应生成 18 个内容页面和 1 个 404 页面');
console.log(JSON.stringify({ result: 'passed', ...counts, sourceCounts: expected }, null, 2));
