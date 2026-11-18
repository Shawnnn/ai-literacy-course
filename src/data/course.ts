import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type CourseEntry = {
  id: string;
  file: string;
  url: string;
  shortTitle: string;
  description: string;
  part: number;
  number?: number;
};

export const site = {
  title: 'AI小白通识课',
  subtitle: '用大白话讲透AI的15堂课',
  contentDate: '2026 年 11 月',
};

export const parts = [
  { number: 1, label: '打地基', title: 'AI 到底是什么', description: '先认识，再理解。从生活里的比喻，建立你的第一张 AI 地图。', anchor: 'foundation', range: '01—04' },
  { number: 2, label: '搭工具', title: 'AI 是怎么干活的', description: '从派活到连接工具，一步步拆开 AI 的工作方式。', anchor: 'tools', range: '05—10' },
  { number: 3, label: '用起来', title: 'AI 能为我做什么', description: '把概念带回生活和工作，找到一个真正用得上的起点。', anchor: 'practice', range: '11—15' },
];

const chapterDefinitions = [
  ['01_AI简史与生成式AI.md', 'AI简史与生成式AI', '从“会算数”到“会创作”，认识 AI、机器学习、深度学习与生成式 AI。', 1],
  ['02_LLM大语言模型.md', 'LLM 大语言模型', '认识大语言模型的训练、参数、推理、多模态与幻觉。', 1],
  ['03_Token.md', 'Token', '用乐高积木和办公桌，理解 Token、上下文窗口与计费。', 1],
  ['04_Prompt提示词.md', 'Prompt 提示词', '给天才实习生派活：五要素、上下文工程与可复制的提示词模板。', 1],
  ['05_API.md', 'API', '认识软件之间的点餐窗口，以及 Key、Token、Webhook 与 OAuth。', 2],
  ['06_Agent智能体.md', 'Agent 智能体', '从出主意的军师到能动手的员工，认识 Agent 的循环与边界。', 2],
  ['07_MCP.md', 'MCP', '认识 AI 连接工具的统一接口，理解 MCP、API 与 A2A。', 2],
  ['08_Skill与Workflow.md', 'Skill 与 Workflow', '用菜谱本和流水线，分清技能包、工作流与 Agent。', 2],
  ['09_CLI命令行.md', 'CLI 命令行', '以飞书 lark-cli 为例，分清 CLI、GUI、API、SDK、MCP 与 Skill。', 2],
  ['10_知识库_Obsidian_RAG.md', '知识库、Obsidian 与 RAG', '给 AI 配上开卷考试的资料柜，认识知识库、向量与第二大脑。', 2],
  ['11_主流Agent横评.md', '主流 Agent 横评', '先分清产品的层次，再了解 Grok、Claude、OpenClaw 与 Hermes。', 3],
  ['12_AI连接万物.md', 'AI 连接万物', '了解 AI 如何连接微信公众号、飞书、Gmail、地图与手机。', 3],
  ['13_普通人为什么要学AI.md', '普通人为什么要学 AI', '从生活、工作与学习的 30 个场景中，找到你的第一个用法。', 3],
  ['14_一人公司OPC与AI副业.md', '一人公司 OPC 与 AI 副业', '认识一人公司的机会与现实，用具体问题思考 AI 副业。', 3],
  ['15_大串讲与30天行动计划.md', '大串讲与 30 天行动计划', '用 AI 餐厅串起所有概念，带走一份 30 天上手计划。', 3],
] as const;

export const chapters: CourseEntry[] = chapterDefinitions.map(([file, shortTitle, description, part], index) => {
  const id = String(index + 1).padStart(2, '0');
  return { id, number: index + 1, file, shortTitle, description, part, url: `/learn/${id}/` };
});

export const guide: CourseEntry = { id: 'guide', file: '00_课程导读.md', url: '/', shortTitle: '课程导读', description: `${site.subtitle}。从 AI、Token、Prompt 到 Agent、MCP 与知识库，写给普通人的图文课程。`, part: 0 };
export const glossary: CourseEntry = { id: 'glossary', file: '附录A_术语速查表.md', url: '/glossary/', shortTitle: '术语速查表', description: 'AI 术语的英文全称、大白话解释和生活比喻，一页查阅。', part: 0 };
export const references: CourseEntry = { id: 'references', file: '附录B_参考资料.md', url: '/references/', shortTitle: '参考资料', description: '课程引用的来源与延伸阅读，保留原稿资料日期和链接。', part: 0 };
export const entries = [guide, ...chapters, glossary, references];

export function readSource(entry: CourseEntry): string {
  if (!entries.some((value) => value.id === entry.id && value.file === entry.file)) throw new Error('课程文件必须出现在明确的课程清单中。');
  return readFileSync(resolve(process.cwd(), entry.file), 'utf8').replace(/^\uFEFF/, '');
}

export function sourceTitle(entry: CourseEntry): string {
  return readSource(entry).match(/^# (.+)$/m)?.[1].trim() || entry.shortTitle;
}

export function courseLink(href: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return href;
  const [, rawPath, suffix = ''] = href.match(/^([^?#]+)(.*)$/) || [];
  if (!rawPath || !/\.md$/i.test(rawPath)) return href;
  const filename = decodeURIComponent(rawPath).replace(/^\.\//, '');
  const destination = entries.find((entry) => entry.file === filename);
  if (!destination) throw new Error(`没有配置此 Markdown 内链：${href}`);
  return `${destination.url}${suffix}`;
}

export function guideSection(needle: string): string {
  const sections = readSource(guide).split(/(?=^## )/m);
  const section = sections.find((value) => value.split('\n')[0].includes(needle));
  if (!section) throw new Error(`课程导读缺少章节：${needle}`);
  return section.replace(/^## .+\r?\n/, '').replace(/\n---\s*$/, '').trim();
}
