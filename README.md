# AI小白通识课

用大白话讲透 AI 的 15 堂课。作者：**[Shawnnn](https://github.com/Shawnnn)**。

本工程将根目录原有的 18 份 Markdown 生成为静态课程网站：首页、15 个章节页、术语速查表、参考资料，以及独立的 404 页面。课程正文继续以 Markdown 为内容来源。

## 本地运行

使用 **Node.js 26.x**。在当前工程根目录打开终端：

```sh
npm ci
npm run dev
```

打开终端显示的本地地址，默认是 `http://127.0.0.1:4321/`。修改 Markdown 或页面源码后，开发服务会重新生成页面。

查看可部署的生产版本：

```sh
npm run build
npm run preview
```

`dist/` 是构建产物。搜索需要通过 HTTP 加载索引，请使用预览服务提供的地址访问。

希望关掉当前终端后仍能查看网站时，使用独立后台预览：

```sh
npm run preview:background
```

启动成功后，当前电脑的 Chrome 或 Codex 内置浏览器都可以访问 `http://127.0.0.1:4321/`。这个地址需要本机预览服务保持运行；电脑重启或手动停止后，请重新执行上面的后台启动命令。

查看状态和停止后台预览：

```sh
npm run preview:status
npm run preview:stop
```

后台预览读取现有 `dist/`；修改课程后先运行 `npm run build`。开发时仍可使用 `npm run dev`，并保持它所在的终端运行。Vercel 发布完成后，再使用公开网站地址进行长期访问。

## 已实现的学习功能

- 中文与英文术语全文搜索；搜索结果显示命中片段，可跳到对应章节位置。按 `Ctrl+K` / `⌘K` 或 `/` 打开搜索。
- 电脑端三栏阅读；中等宽度隐藏右侧栏，手机端提供抽屉目录与可展开的本章目录。
- Mermaid 图解、放大弹层和缩放按钮；超宽表格、代码在自身容器内滚动。
- 手动标记学完、撤销完成、15 章进度以及继续学习。状态仅保存在当前浏览器；清理站点数据或更换设备后不会自动同步。
- “继续学习”恢复上次阅读位置；带锚点的分享链接以链接指定的位置为准。
- 代码复制、第 4 章五个提示词模板复制、原有测验答案折叠。
- 页面标题、描述、分享封面、网站图标、键盘操作和 404 页面。

生产搜索使用 **Pagefind Extended** 的中文分词索引。开发服务使用同一批课程生成的静态 JSON 内容索引，便于修改时直接搜索；正式验收以 `npm run build` 后的 Pagefind 版本为准。

## 更新内容与设计

正文直接修改根目录对应的 Markdown。原稿文件名、章节顺序、短标题、摘要和网页地址在 `src/data/course.ts` 中明确配置，不会将 README 等工程文档自动收进课程。

主要入口：

| 内容 | 位置 |
| --- | --- |
| 课程清单、站名、署名、内容日期 | `src/data/course.ts` |
| 首页 | `src/pages/index.astro` |
| 章节与附录的阅读布局 | `src/components/Reader.astro` |
| Markdown、内链、表格和模板适配 | `src/lib/markdown.ts` |
| 颜色、字体、排版和响应式规则 | `src/styles/global.css` |
| 进度、复制、搜索和图解交互 | `src/scripts/` |
| 分享封面与图标 | `public/` |

新增章节或调整文件名时，需要同步课程清单和固定章节数的验收脚本。原稿内容日期显示为“2026 年 11 月”；更新原稿日期后，请同步课程配置中的 `contentDate`。页面构建日期单独生成，不代表内容已重新核查。

颜色与字体均在本地样式中配置，字体使用系统中文字体栈。网页运行不依赖外部字体或图表 CDN。分享封面已经提供 PNG 和 SVG；需要重新生成时运行 `node scripts/create-cover.mjs`。

## 上传 GitHub

对应仓库：[Shawnnn/ai-literacy-course](https://github.com/Shawnnn/ai-literacy-course)（公有）。

**当前工程文件夹**作为仓库根目录，包含原有 18 份 Markdown、工程源码、`package.json` 和 `package-lock.json`。后续修改后可在工程根目录提交并推送：

```sh
git status
git add .
git commit -m "Update course content"
git push
```

`.gitignore` 已排除 `node_modules/`、`dist/`、`.astro/`、`.qa/`、`.vercel/`、`.env` 等本机依赖、缓存和环境文件。

GitHub 仓库用于保存课程原稿与网站源码。Vercel 网站发布按下一节的步骤配置。

## 部署到 Vercel

在 Vercel 中导入对应的 GitHub 仓库，检查以下设置：

| 配置 | 值 |
| --- | --- |
| Framework Preset | Astro |
| Root Directory | 工程根目录 |
| Node.js | 26.x（由 `package.json` 声明） |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

工程自带 `vercel.json`。它生成静态 HTML，阅读和学习进度无需数据库或服务端账号系统。

在 Vercel 环境变量中可设置 `SITE_URL` 为最终公开地址，例如 `https://你的域名`，用于 canonical 与分享链接。未设置时使用 Vercel 提供的 `VERCEL_PROJECT_PRODUCTION_URL`；请确认项目已启用系统环境变量访问。本地没有公开地址时不输出 canonical。域名变化后重新部署。参见 [Vercel 系统环境变量说明](https://vercel.com/docs/environment-variables/system-environment-variables#vercel_project_production_url)。

首次上线后，请在真实地址重新检查首页、章节深链、中文搜索、分享封面和手机阅读。后续推送是否自动发布，取决于你在 Vercel 中配置的 Git 集成和分支。

官方部署参考：[Astro → Vercel](https://docs.astro.build/en/guides/deploy/vercel/)。

## 检查与验收

```sh
npm run build
npm run typecheck
npm run check
npm run test:browser
```

- `typecheck`：检查 TypeScript 源码。
- `check`：检查全部内容页面、内链和锚点、资源、图表／表格／答案数量、五个复制模板，以及 Pagefind 元数据的 gzip 完整性。
- `test:browser`：通过临时静态服务访问 `dist/`，逐页验证 40 张图，并检查搜索、剪贴板、答案折叠、图表放大、进度持久化与恢复、手机目录、320／390／768／1440 宽度和存储被禁用的情况。测试结束后关闭临时服务和浏览器。

Windows 默认使用已安装的 Microsoft Edge；其他环境可先运行 `npx playwright install chromium`，或通过 `COURSE_BROWSER` 指定已安装的 Playwright 浏览器通道。截图和浏览器报告位于 `.qa/`，不纳入 Git 提交。

若受限沙盒阻止 Pagefind 原生程序写入文件，需要在有工程目录写入权限的环境重新运行构建；`npm run check` 会检查空索引和损坏的元数据。

## 内容说明

原稿中的知识内容、资料链接和时效说明保留。网页对课程导读中的阅读工具说明、导航和格式进行了适配。本次网页制作没有逐条重新核实课程涉及的产品功能、版本、价格或政策；页面构建与功能验收不代表这些内容已完成事实复核。
