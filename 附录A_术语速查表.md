# 附录A 术语速查表 📖

> 按"学习顺序"排列。忘了某个词，来这里查一下就好。

## 基础概念

| 术语 | 英文全称 | 大白话解释 | 生活比喻 | 章节 |
|---|---|---|---|---|
| AI 人工智能 | Artificial Intelligence | 让机器做需要人类智慧的事 | 会思考的机器大家族 | 1 |
| 机器学习 ML | Machine Learning | 让机器从大量例子中自己找规律 | 刷题总结套路 | 1 |
| 深度学习 DL | Deep Learning | 用多层神经网络学习 | 神经元一层层传话 | 1 |
| 神经网络 | Neural Network | 模仿大脑神经元连接的数学结构 | 一张巨大的传话网 | 1 |
| 生成式AI | Generative AI | 能创造新内容的 AI | 从做选择题到写作文 | 1 |
| AIGC | AI Generated Content | AI 生成的内容 | 厨艺做出来的菜 | 1 |
| 判别式AI | Discriminative AI | 做判断、分类的 AI | 考官 | 1 |
| 扩散模型 | Diffusion Model | 从噪点一步步"擦"出图片 | 雕塑家去掉多余的石头 | 1 |
| 多模态 | Multimodal | 能同时处理文字、图片、声音、视频 | 能看能听能说 | 2 |

## 大模型

| 术语 | 英文全称 | 大白话解释 | 生活比喻 | 章节 |
|---|---|---|---|---|
| LLM 大语言模型 | Large Language Model | 处理文字的超大生成式模型 | 超级接龙王 | 2 |
| GPT | Generative Pre-trained Transformer | 生成式预训练 Transformer | ChatGPT 的"发动机型号" | 2 |
| Transformer | Transformer | 2017 年提出的模型架构 | 大模型的发动机图纸 | 2 |
| 注意力机制 | Attention | 读每个字时回看最相关的词 | 读书会划重点 | 2 |
| 参数 | Parameters | 模型内部可调整的数值 | 调音台上的旋钮 | 2 |
| 预训练 | Pre-training | 用海量文本训练基础能力 | 读万卷书 | 2 |
| 指令微调 SFT | Supervised Fine-Tuning | 用示范数据教模型当助手 | 岗前培训 | 2 |
| RLHF | Reinforcement Learning from Human Feedback | 根据人类评分调整模型 | 师傅打分 | 2 |
| 基座模型 | Base Model | 只经过预训练的模型 | 满腹经纶但不会说话的书生 | 2 |
| 推理模型 | Reasoning Model | 先思考再回答的模型 | 先打草稿再交卷 | 2 |
| 思维链 CoT | Chain of Thought | 一步步推理的过程 | 草稿纸 | 2 |
| 温度 | Temperature | 控制回答随机性的参数 | 老会计 vs 微醺诗人 | 2 |
| 幻觉 | Hallucination | 编造不存在的内容 | 一本正经胡说八道 | 2 |
| 知识截止 | Knowledge Cutoff | 训练数据的截止日期 | 闭关修炼的大师 | 2 |
| 开放权重 / 开源 | Open-weight / Open-source | 模型文件公开可下载 | 公开菜谱 | 2 |
| 闭源 | Closed-source | 只能通过官方使用 | 只能去店里吃 | 2 |
| 端侧模型 / 本地模型 | On-device / Local Model | 在手机或电脑本地运行的模型 | 家里的小厨房 | 2 |

## Token 与提示词

| 术语 | 英文全称 | 大白话解释 | 生活比喻 | 章节 |
|---|---|---|---|---|
| Token | Token | AI 处理文字的最小单位 | 乐高积木块 | 3 |
| 分词器 | Tokenizer | 把文字切成 Token 的工具 | 切词刀 | 3 |
| 上下文窗口 | Context Window | 一次能处理的 Token 总量 | AI 的办公桌 | 3 |
| 输入 / 输出 Token | Input / Output Tokens | 发给 AI 的 / AI 写出来的 | 读的字 / 写的字（写更贵） | 3 |
| 提示词 | Prompt | 给 AI 的指令 | 派活说明 | 4 |
| 提示词工程 | Prompt Engineering | 研究怎么写好提示词 | 研究怎么交代工作 | 4 |
| 系统提示词 | System Prompt | 长期生效的设定 | 岗位说明书 | 4 |
| 少样本提示 | Few-shot Prompting | 给 AI 几个示例 | 照着样板做 | 4 |
| 上下文工程 | Context Engineering | 为 AI 准备完整的资料和工具 | 准备入职资料夹 | 4 |

## 连接与干活

| 术语 | 英文全称 | 大白话解释 | 生活比喻 | 章节 |
|---|---|---|---|---|
| API | Application Programming Interface | 软件之间的调用接口 | 点餐窗口 | 5 |
| API Key | API Key | 调用 API 的身份凭证 | 会员卡 / 钱包 | 5 |
| Webhook | Webhook | 有事件时主动推送通知 | 快递到了发短信 | 5 |
| OAuth | Open Authorization | 授权而不交出密码 | 代驾钥匙 | 5 |
| API Token / Access Token 访问令牌 | API Token / Access Token | 证明身份的凭证，常有有效期、权限可细分；**和计费的 Token 不是一回事** | 有效期门票 / 代驾钥匙本身 | 5 |
| Bearer Token | Bearer Token | 调用 API 时附带的凭证，谁持有谁就能用 | 认票不认人的门票 | 5 |
| App ID / App Secret | App ID / App Secret | 开放平台给应用的"账号 + 密码"，用来换取 Access Token | 换门票用的身份证和密码 | 5 |
| OpenAI 兼容接口 | OpenAI-compatible API | 和 OpenAI 格式一致的接口 | 统一规格的插头 | 5 |
| Agent 智能体 | AI Agent | 能自主使用工具完成目标的 AI | 能动手的员工 | 6 |
| ReAct | Reasoning + Acting | 边推理边行动的方法 | 想一步做一步 | 6 |
| 工具调用 | Tool Use / Function Calling | AI 调用外部工具 | 员工拿起电话、电脑 | 6 |
| 人在回路（关键一步人来拍板） | Human in the Loop（HITL） | 关键步骤由人确认，也叫人工确认、人机协同 | 大额支出要老板签字 | 6 |
| 提示词注入 | Prompt Injection | 在内容里藏恶意指令诱导 AI | 往文件里夹假命令 | 6 |
| 多智能体 | Multi-Agent | 多个 Agent 分工协作 | 一个 AI 团队 | 6 |
| Computer Use / GUI Agent | Computer Use / GUI Agent | 看屏幕、点鼠标操作软件的 AI | 坐到电脑前替你操作 | 6、12 |
| MCP | Model Context Protocol | AI 连接工具和数据的统一标准 | USB-C | 7 |
| MCP Server | MCP Server | 把工具包装成 MCP 标准的程序 | USB-C 配件 | 7 |
| 连接器 | Connectors | 产品里一键连接外部服务的入口 | 门禁卡 | 7、12 |
| A2A | Agent2Agent Protocol | Agent 之间相互协作的协议 | 员工之间打电话 | 7 |
| Skill 技能包 | Agent Skills | 可复用的做事方法说明 | SOP 手册 / 菜谱 | 8 |
| 渐进式加载 | Progressive Disclosure | 先看目录，用到再展开 | 图书馆目录卡 | 8 |
| 工作流 | Workflow | 预设的自动化步骤 | 地铁 / 流水线 | 8 |
| CLI 命令行界面 | Command-Line Interface | 用文字命令操作软件；也指某软件的命令行版本 | 发短信指令 | 9 |
| GUI 图形界面 | Graphical User Interface | 用鼠标点窗口和按钮操作 | 银行柜台 | 9 |
| 终端 | Terminal | 输入命令的窗口 | 短信 App | 9 |
| Shell | Shell | 听懂并执行命令的程序，如 PowerShell、zsh | 接线员 | 9 |
| 命令参数（≠ 模型参数） | Arguments / Flags | 命令后面的补充说明，常以 `--` 开头 | 短信里的"加急" | 9 |
| 标准输入 stdin | Standard Input | 把内容"喂"给命令，而不是写在命令里 | 当面递纸条，不写在明信片上 | 9 |
| SDK 软件开发工具包 | Software Development Kit | 给程序员写代码用的工具箱，底层调用 API | 企业专用对接套件 | 9 |
| lark-cli | Lark / Feishu CLI | 飞书 / Lark 的命令行工具 | 飞书的遥控器 | 9 |

## 知识与记忆

| 术语 | 英文全称 | 大白话解释 | 生活比喻 | 章节 |
|---|---|---|---|---|
| 知识库 | Knowledge Base | 给 AI 查阅的资料集合 | 资料柜 | 10 |
| RAG | Retrieval-Augmented Generation | 先检索资料再生成回答 | 开卷考试 | 10 |
| 切块 | Chunking | 把文档切成小段 | 把书拆成卡片 | 10 |
| 向量化 | Embedding | 按意思给文字分配坐标 | 超市按用途摆货 | 10 |
| 向量数据库 | Vector Database | 存放向量的数据库 | 按意思排列的货架 | 10 |
| 微调 | Fine-tuning | 用特定数据再训练模型 | 送去进修 | 10 |
| Markdown | Markdown | 一种简洁的文本排版格式 | AI 最爱读的格式 | 10 |
| 双向链接 | Bidirectional Link | 笔记之间互相链接 | 知识蜘蛛网 | 10 |
| 第二大脑 | Second Brain | 外部的个人知识系统 | 永不遗忘的笔记本 | 10 |

## 产品、趋势与商业

| 术语 | 英文全称 | 大白话解释 | 生活比喻 | 章节 |
|---|---|---|---|---|
| 心跳机制 | Heartbeat | Agent 定期醒来主动检查任务 | 管家定时巡房 | 11 |
| 自部署 | Self-hosting | 把软件装在自己的设备或服务器上 | 自家厨房 | 11 |
| 沙盒 / 容器 | Sandbox / Container | 隔离的运行环境 | 给龙虾池加盖子 | 6、11 |
| Vibe Coding | Vibe Coding | 用自然语言描述让 AI 写程序 | 说出想法就有软件 | 14 |
| OPC 一人公司 | One Person Company | 一个核心人物 + AI 完成团队的工作 | 网球单打 | 14 |
| MVP | Minimum Viable Product | 最小可用产品 | 先做一道招牌菜试卖 | 14 |
| 独立开发者 | Indie Hacker | 独立运营产品的开发者 | 一人小馆子 | 14 |

---

⬅️ 返回 [课程导读](00_课程导读.md)
