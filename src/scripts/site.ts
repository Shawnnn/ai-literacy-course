type ReadingPosition = { heading: string; offset: number; y: number };
type LearningState = { version: 1; completed: string[]; lastChapter?: string; positions: Record<string, ReadingPosition> };
const STORAGE_KEY = 'ai-literacy-course:progress:v1';
const validId = (value: unknown): value is string => typeof value === 'string' && /^(0[1-9]|1[0-5])$/.test(value);
const emptyState = (): LearningState => ({ version: 1, completed: [], positions: {} });

function loadState(): LearningState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || raw.version !== 1) return emptyState();
    const state = emptyState();
    state.completed = [...new Set<string>(Array.isArray(raw.completed) ? raw.completed.filter(validId) : [])];
    if (validId(raw.lastChapter)) state.lastChapter = raw.lastChapter;
    for (const [id, position] of Object.entries(raw.positions || {})) {
      const value = position as ReadingPosition;
      if (validId(id) && value && typeof value.heading === 'string' && value.heading.length < 300 && Number.isFinite(value.offset) && Number.isFinite(value.y)) {
        state.positions[id] = { heading: value.heading, offset: Math.max(-1000, Math.min(1e7, value.offset)), y: Math.max(0, Math.min(1e7, value.y)) };
      }
    }
    return state;
  } catch { return emptyState(); }
}

let state = loadState();
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Reading remains available when storage is blocked. */ } }
let toastTimer = 0;
function toast(message: string) {
  const element = document.getElementById('toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element.classList.remove('visible'), 2600);
}

function updateLearningUI() {
  const completed = new Set(state.completed);
  document.querySelectorAll<HTMLElement>('[data-progress-count]').forEach((element) => { element.textContent = String(completed.size); });
  document.querySelectorAll<HTMLProgressElement>('[data-course-progress]').forEach((element) => { element.value = completed.size; });
  document.querySelectorAll<HTMLElement>('[data-completion-id]').forEach((element) => { element.classList.toggle('is-complete', completed.has(element.dataset.completionId!)); });
  document.querySelectorAll<HTMLButtonElement>('[data-toggle-complete]').forEach((button) => {
    const done = completed.has(button.dataset.toggleComplete!);
    button.setAttribute('aria-pressed', String(done));
    button.querySelector('[data-complete-label]')!.textContent = done ? '已学完 · 点击撤销' : '标记这一章已学完';
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]').forEach((link) => {
    const title = link.querySelector('span:nth-child(2)')?.textContent || '';
    link.setAttribute('aria-label', `第 ${Number(link.dataset.chapterLink)} 章 ${title}${completed.has(link.dataset.chapterLink!) ? '，已学完' : ''}`);
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-continue]').forEach((link) => {
    if (!validId(state.lastChapter)) return;
    link.href = `/learn/${state.lastChapter}/?resume=1`;
    link.querySelector('[data-continue-label]')!.textContent = `继续学习 · 第 ${Number(state.lastChapter)} 章`;
  });
  const homeProgress = document.querySelector('[data-home-progress]');
  if (homeProgress && (state.lastChapter || completed.size)) homeProgress.textContent = completed.size === 15 ? '15 章，全部学完。带着这份好奇，继续用起来。' : `已学完 ${completed.size} / 15 章。慢慢来，每一章都是一步。`;
}

document.querySelectorAll<HTMLButtonElement>('[data-toggle-complete]').forEach((button) => button.addEventListener('click', () => {
  const id = button.dataset.toggleComplete;
  if (!validId(id)) return;
  const wasComplete = state.completed.includes(id);
  state.completed = wasComplete ? state.completed.filter((value) => value !== id) : [...state.completed, id];
  persist(); updateLearningUI();
  toast(wasComplete ? '已撤销这一章的完成标记' : '又学完一章，记下这一步。');
}));
window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY || event.key === null) { state = loadState(); updateLearningUI(); } });
updateLearningUI();

function showDialog(dialog: HTMLDialogElement) {
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((open) => { if (open !== dialog) open.close(); });
  if (!dialog.open) dialog.showModal();
}

const searchDialog = document.getElementById('search-dialog') as HTMLDialogElement;
let searchReady: Promise<unknown> | undefined;
async function openSearch() {
  showDialog(searchDialog);
  (document.getElementById('course-search') as HTMLInputElement).focus();
  try { await (searchReady ||= import('./search').then((module) => module.setupSearch())); }
  catch { searchReady = undefined; document.getElementById('search-status')!.textContent = '搜索暂时没能加载，请关闭后重试。你也可以直接翻阅课程目录。'; }
}
document.querySelectorAll('[data-open-search]').forEach((button) => button.addEventListener('click', openSearch));
document.querySelectorAll('[data-open-menu]').forEach((button) => button.addEventListener('click', () => showDialog(document.getElementById('menu-dialog') as HTMLDialogElement)));
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog')?.close()));
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dialog.close(); }
  }, { capture: true });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
});
document.querySelectorAll('#menu-dialog a').forEach((link) => link.addEventListener('click', () => (document.getElementById('menu-dialog') as HTMLDialogElement).close()));
document.querySelectorAll('.mobile-toc a').forEach((link) => link.addEventListener('click', () => { link.closest('details')!.open = false; }));
document.addEventListener('keydown', (event) => {
  const editing = (event.target as HTMLElement)?.matches('input, textarea, [contenteditable="true"]');
  if (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !editing && !event.metaKey && !event.ctrlKey)) {
    event.preventDefault(); if (!event.repeat) void openSearch();
  }
});
if (!/Mac|iPhone|iPad/.test(navigator.platform)) document.querySelectorAll('.search-trigger kbd').forEach((element) => { element.textContent = 'Ctrl K'; });

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const field = document.createElement('textarea'); field.value = text; field.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
    document.body.append(field); field.select();
    const success = document.execCommand('copy'); field.remove();
    if (!success) throw new Error('Clipboard unavailable');
  }
}
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  const container = button.closest('.code-shell, .prompt-template');
  const content = container?.querySelector<HTMLElement>('code, blockquote');
  if (!content) return;
  try { await copyText(content.tagName === 'CODE' ? content.textContent || '' : content.innerText.trim()); toast('已复制，可以粘贴使用了。'); }
  catch { toast('暂时无法自动复制，请选中文字后手动复制。'); }
}));

async function initializeReading() {
  const currentId = document.body.dataset.entry;
  const article = document.querySelector<HTMLElement>('.reader-main article');
  const sectionHeadings = [...document.querySelectorAll<HTMLElement>('.lesson-content h2[id], .lesson-content h3[id]')];
  let allowPositionSave = false;
  let lastSave = 0;
  let scrollFrame = 0;
  if (validId(currentId)) { state.lastChapter = currentId; persist(); updateLearningUI(); }

  const savePosition = () => {
    if (!validId(currentId) || !allowPositionSave) return;
    const y = window.scrollY;
    let heading: HTMLElement | undefined;
    for (const element of sectionHeadings) { if (element.getBoundingClientRect().top <= 140) heading = element; else break; }
    state.positions[currentId] = { heading: heading?.id || '', offset: heading ? y - (heading.getBoundingClientRect().top + y) : 0, y };
    state.lastChapter = currentId; persist();
  };
  const updateReading = () => {
    scrollFrame = 0;
    if (!article) return;
    const box = article.getBoundingClientRect();
    const value = Math.min(1, Math.max(0, (84 - box.top) / Math.max(1, box.height - window.innerHeight + 120)));
    document.documentElement.style.setProperty('--reading-progress', String(value));
    let active = sectionHeadings[0]?.id;
    for (const heading of sectionHeadings) { if (heading.getBoundingClientRect().top <= 160) active = heading.id; else break; }
    document.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((link) => link.classList.toggle('is-active', link.dataset.tocLink === active));
    if (Date.now() - lastSave > 800) { savePosition(); lastSave = Date.now(); }
  };
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateReading); }, { passive: true });
  window.addEventListener('pagehide', savePosition);
  window.addEventListener('resize', updateReading, { passive: true });

  if (document.querySelector('.mermaid')) {
    try { await import('./diagrams').then((module) => module.initializeDiagrams()); }
    catch (error) { console.error('无法载入图解模块', error); }
  }
  const url = new URL(window.location.href);
  let hashTarget: HTMLElement | null = null;
  try { if (url.hash) hashTarget = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { /* An invalid fragment should not block reading. */ }
  if (hashTarget) {
    window.scrollTo(0, Math.max(0, hashTarget.getBoundingClientRect().top + window.scrollY - 105));
  } else if (!url.hash && url.searchParams.get('resume') === '1' && validId(currentId)) {
    const position = state.positions[currentId];
    if (position) {
      const heading = position.heading ? document.getElementById(position.heading) : null;
      window.scrollTo(0, Math.max(0, heading ? heading.getBoundingClientRect().top + window.scrollY + position.offset : position.y));
    }
  }
  if (url.searchParams.has('resume')) { url.searchParams.delete('resume'); history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`); }
  allowPositionSave = true;
  updateReading();
  document.documentElement.dataset.courseReady = 'true';
}
void initializeReading();
