import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const batchesDir = path.join(__dirname, "locales");

const b1 = JSON.parse(fs.readFileSync(path.join(batchesDir, "zh_b1.json"), "utf8"));
const b2 = JSON.parse(fs.readFileSync(path.join(batchesDir, "zh_b2.json"), "utf8"));
const b3 = JSON.parse(fs.readFileSync(path.join(batchesDir, "zh_b3.json"), "utf8"));
const b4 = JSON.parse(fs.readFileSync(path.join(batchesDir, "zh_b4.json"), "utf8"));
const mainUtils = JSON.parse(fs.readFileSync(path.join(batchesDir, "zh_main_utils.json"), "utf8"));
const tmpl4 = JSON.parse(fs.readFileSync(path.join(batchesDir, "zh_templates.json"), "utf8"));
const v0111Path = path.join(batchesDir, "zh_v0111.json");
const v0111 = fs.existsSync(v0111Path)
  ? JSON.parse(fs.readFileSync(v0111Path, "utf8"))
  : { exact: {}, templates: {} };

// High-priority curated dictionary to ensure 100% consistent terminology across all primary navigation, settings, menus, and buttons
const curatedExact = {
  // Settings sections & navigation
  "Settings": "设置",
  "Settings content": "设置内容",
  "Settings sections": "设置分类",
  "Search settings": "搜索设置",
  "Search settings...": "搜索设置...",
  "Search settings…": "搜索设置…",
  "Restore device defaults": "恢复设备默认设置",
  "Restore default settings?": "恢复默认设置？",
  "General": "通用",
  "Appearance": "外观",
  "Chat": "聊天",
  "Diffs & pull requests": "差异与拉取请求",
  "Keybindings": "快捷键",
  "Navigation": "导航",
  "Composer": "输入框",
  "Preview & diff": "预览与差异对比",
  "Focus Next Workspace Area": "聚焦下一个工作区区域",
  "Focus Previous Workspace Area": "聚焦上一个工作区区域",
  "Sidebar: Toggle": "侧边栏：切换显示/隐藏",
  "Navigation: Back": "导航：后退",
  "Navigation: Forward": "导航：前进",
  "Terminal: Toggle": "终端：切换显示/隐藏",
  "Terminal: Split": "终端：水平分屏",
  "Terminal: Split Vertical": "终端：垂直分屏",
  "Terminal: New": "终端：新建终端",
  "Terminal: Close": "终端：关闭终端",
  "Right Panel: Toggle": "右侧面板：切换显示/隐藏",
  "Right Panel: New": "右侧面板：新建标签页",
  "Right Panel: Toggle Maximized": "右侧面板：切换最大化",
  "Right Panel: Close": "右侧面板：关闭标签页",
  "Thread Panel: Toggle": "对话详情面板：切换显示/隐藏",
  "Reopen Closed Tab": "重新打开已关闭的标签页",
  "Pull Request: Copy Number": "拉取请求：复制编号",
  "Pull Request: Copy Link or Thread": "拉取请求：复制链接或对话",
  "Diff: Toggle": "差异对比：切换显示/隐藏",
  "Preview: Toggle": "预览：切换显示/隐藏",
  "Preview: Refresh": "预览：刷新",
  "Preview: Focus URL": "预览：聚焦地址栏",
  "Preview: Zoom In": "预览：放大",
  "Preview: Zoom Out": "预览：缩小",
  "Preview: Reset Zoom": "预览：重置缩放",
  "Command Palette: Toggle": "命令面板：打开/关闭",
  "File Picker: Toggle": "文件选择器：打开/关闭",
  "Project Search: Toggle": "项目搜索：打开/关闭",
  "Usage: Open": "用量：打开用量统计",
  "Usage: Cost": "用量：按费用查看",
  "Usage: Tokens": "用量：按 Token 查看",
  "Usage: Limits": "用量：按限额查看",
  "Usage: Period: Past 24h": "用量：统计周期：过去 24 小时",
  "Usage: Period: 7 days": "用量：统计周期：7 天",
  "Usage: Period: 30 days": "用量：统计周期：30 天",
  "Usage: Period: 90 days": "用量：统计周期：90 天",
  "Theme: Select": "主题：选择配色主题",
  "Appearance: Cycle": "外观：切换浅色/深色模式",
  "Theme Editor: Toggle": "主题编辑器：打开/关闭",
  "Composer: Stash": "输入框：暂存草稿",
  "Composer: Opposite Queue or Steer Action": "输入框：执行相反的排队或引导操作",
  "Composer: Start in Background": "输入框：在后台启动",
  "Composer: Send and Start New Thread": "输入框：发送并新建对话",
  "Composer: Host": "输入框：选择主机环境",
  "Composer: Cycle Host": "输入框：循环切换主机环境",
  "Composer: Effort": "输入框：选择思考强度",
  "Composer: Increase Effort": "输入框：提高思考强度",
  "Composer: Decrease Effort": "输入框：降低思考强度",
  "Composer: Mode": "输入框：切换交互模式",
  "Composer: Workspace": "输入框：选择工作区模式",
  "Composer: Previous Worktree": "输入框：切换到上一个工作树",
  "Composer: Branch": "输入框：选择分支",
  "Chat: New": "聊天：新建对话",
  "Chat: New Local": "聊天：在本地新建对话",
  "Chat: New Without Project": "聊天：新建无项目临时对话",
  "Chat: Find": "聊天：在对话中查找",
  "Editor: Open Favorite": "编辑器：在首选编辑器中打开",
  "Model Picker: Toggle": "模型选择器：打开/关闭",
  "Model Picker: Previous Provider": "模型选择器：上一个提供商",
  "Model Picker: Next Provider": "模型选择器：下一个提供商",
  "Model Picker: Jump: 1": "模型选择器：跳转到第 1 个模型",
  "Model Picker: Jump: 2": "模型选择器：跳转到第 2 个模型",
  "Model Picker: Jump: 3": "模型选择器：跳转到第 3 个模型",
  "Model Picker: Jump: 4": "模型选择器：跳转到第 4 个模型",
  "Model Picker: Jump: 5": "模型选择器：跳转到第 5 个模型",
  "Model Picker: Jump: 6": "模型选择器：跳转到第 6 个模型",
  "Model Picker: Jump: 7": "模型选择器：跳转到第 7 个模型",
  "Model Picker: Jump: 8": "模型选择器：跳转到第 8 个模型",
  "Model Picker: Jump: 9": "模型选择器：跳转到第 9 个模型",
  "Thread: Stop": "对话：停止运行",
  "Queue: Send First Queued Message": "队列：立即发送第一条排队消息",
  "Queue: Edit Last Queued Message": "队列：编辑最后一条排队消息",
  "Thread: Previous": "对话：切换到上一个对话",
  "Thread: Next": "对话：切换到下一个对话",
  "Thread: Settle": "对话：归置/取消归置对话",
  "Thread: Pin": "对话：置顶/取消置顶对话",
  "Thread: Undo": "对话：撤销上一步操作",
  "Thread: Jump: 1": "对话：跳转到第 1 个对话",
  "Thread: Jump: 2": "对话：跳转到第 2 个对话",
  "Thread: Jump: 3": "对话：跳转到第 3 个对话",
  "Thread: Jump: 4": "对话：跳转到第 4 个对话",
  "Thread: Jump: 5": "对话：跳转到第 5 个对话",
  "Thread: Jump: 6": "对话：跳转到第 6 个对话",
  "Thread: Jump: 7": "对话：跳转到第 7 个对话",
  "Thread: Jump: 8": "对话：跳转到第 8 个对话",
  "Thread: Jump: 9": "对话：跳转到第 9 个对话",
  "When": "触发条件",
  "Condition": "条件",
  "Not": "非 (!)",
  "And": "且 (&&)",
  "Or": "或 (||)",
  "Clear all conditions": "清除所有条件",
  "Remove condition": "移除条件",
  "Remove group and its conditions": "移除条件组及其内部条件",
  "Use variables with !, &&, ||, and parentheses.": "请使用变量配合 !、&&、|| 和括号编写条件表达式。",
  "T3 Code does not recognize this condition yet. It can still be saved, but it may not match unless the runtime provides it.": "T3 Code 暂未识别此条件变量。您仍可保存它，但除非运行时提供该变量，否则可能不会生效。",
  " The most recent matching binding wins when both conditions can apply.": " 当两个触发条件同时满足时，后定义的快捷键将优先生效。",
  "SnapShots": "快照 (SnapShots)",
  "Agents": "智能体",
  "Providers": "提供商",
  "Threads": "对话",
  "Browser": "浏览器",
  "Devices": "设备",
  "Scheduled tasks": "定时任务",
  "Code": "代码",
  "Projects": "项目",
  "Source control": "源代码管理",
  "Worktrees": "工作树 (Worktrees)",
  "Connections": "连接",
  "Environments": "环境",
  "Sharing & access": "共享与访问",
  "Secrets": "密钥",
  "Maintenance": "维护",
  "Labs": "实验室",
  "About": "关于",
  "Archive": "归档",
  "Diagnostics": "诊断",

  // Language switcher in General -> Display & headers
  "UI language": "界面语言",
  "Language": "语言",
  "Choose the display language for the T3 Code interface.": "选择 T3 Code 客户端界面的显示语言（切换后自动刷新生效）。",
  "Switch to English (切换语言)": "Switch to English (切换语言)",
  "切换为简体中文": "切换为简体中文",
  "Display": "显示",
  "Notifications": "通知",
  "Sidebar": "侧边栏",
  "Confirmations": "确认提示",
  "Legal": "法律信息",
  "System default": "系统默认",
  "12-hour": "12 小时制",
  "24-hour": "24 小时制",
  "Time format": "时间格式",
  "Timestamp format": "时间戳格式",
  "System default follows your browser or OS clock preference.": "系统默认将遵循您的浏览器或操作系统时钟偏好。",
  "Last user message": "最后一条用户消息时间",
  "Created at": "创建时间",
  "Manual": "手动排序",
  "Direct": "直接退出",
  "Hold": "长按退出",
  "Double press": "连按两次退出",
  "Stacked": "上下堆叠",
  "Split": "左右分栏",
  "Follow system": "跟随系统",
  "Theme mix": "主题混合",
  "Project Grouping": "项目分组",
  "Diff whitespace changes": "显示空白字符差异",
  "Context window indicator": "上下文窗口指示器",
  "New thread mode": "新建对话模式",
  "New worktrees start from remote": "新建工作树从远程分支开始",
  "Browser viewport": "浏览器视口",
  "Browser zoom": "浏览器缩放",
  "Browser appearance": "浏览器外观",
  "Recording frame rate": "录制帧率",
  "Recording key presses": "录制按键操作",
  "Recording mouse presses": "录制鼠标点击",
  "Floating preview": "悬浮预览",
  "Environment scope": "环境范围",

  // Main composer & chat
  "Ask anything. @ files, $ skills, / commands": "输入任何问题… 使用 @ 引用文件，$ 调用技能，/ 执行命令",
  "Ask anything...": "输入任何问题...",
  "Ask anything…": "输入任何问题…",
  "Message": "发送消息",
  "Send a message...": "发送消息...",
  "Send a message…": "发送消息…",
  "Expand composer": "展开输入框",
  "Send feedback to decline this request": "发送反馈以拒绝此请求",
  "Send a message to decline and redirect the agent": "发送消息以拒绝并重新引导智能体",
  "Choose an option above": "请在上方选择一个选项",
  "Type your own answer, or leave this blank to use the selected option": "输入您的自定义回答，或留空以使用所选选项",
  "Add feedback to refine the plan, or leave this blank to implement it": "添加反馈以完善计划，或留空以直接执行该计划",
  "Choose a project above to start a thread": "请在上方选择一个项目以开始对话",
  "Enable a provider in Settings to send a message": "请在“设置”中启用提供商以发送消息",
  "Leave empty to auto-generate": "留空以自动生成",
  "Drop files to attach": "拖放文件以添加附件",
  "Compact and continue": "压缩上下文并继续",
  "Untitled thread": "未命名对话",
  "The draft has new content.": "草稿中有新内容。",
  "Queue follow-ups while the agent runs or steer the current run. ": "在智能体运行时将后续消息加入队列，或直接引导当前运行。 ",
  "Queue follow-ups while the agent runs or steer the current run.": "在智能体运行时将后续消息加入队列，或直接引导当前运行。",

  // Main sidebar & topbar
  "New thread": "新建对话",
  "Add project": "添加项目",
  "Pull requests": "拉取请求",
  "Usage": "用量",
  "Search": "搜索",
  "Search threads": "搜索对话",
  "Search threads...": "搜索对话...",
  "Search threads…": "搜索对话…",
  "Clear thread search": "清除对话搜索",
  "Toggle main sidebar": "切换主侧边栏",
  "Toggle Sidebar": "切换侧边栏",
  "T3 Code home": "T3 Code 首页",
  "Recent Threads": "最近对话",
  "All projects": "所有项目",
  "All environments": "所有环境",
  "All providers": "所有提供商",
  "Active": "进行中",
  "Working": "运行中",
  "Snoozed": "已暂缓",
  "Settled": "已归置",
  "Pinned": "已置顶",
  "Archived": "已归档",
  "Archived ": "已归档 ",
  " · Created ": " · 创建于 ",
  "No projects yet": "暂无项目",
  "No matching projects.": "没有匹配的项目。",
  "Search projects": "搜索项目",
  "Search projects...": "搜索项目...",
  "Search projects…": "搜索项目…",

  // Thread status & actions
  "Waiting": "等待中",
  "Approval": "待批准",
  "Pending Approval": "待批准",
  "Awaiting Input": "等待输入",
  "Guest Request": "访客请求",
  "Input": "输入",
  "Request": "请求",
  "Limited": "受限",
  "Failed": "失败",
  "Woke": "已唤醒",
  "Wake": "唤醒",
  "Done": "完成",
  "Completed": "已完成",
  "Stopped": "已停止",
  "Queued": "排队中",
  "Running": "运行中",
  "Connecting": "连接中",
  "Plan Ready": "计划已就绪",
  "Idle · resumable": "空闲 · 可恢复",
  "Unsent draft": "未发送草稿",
  "Regenerating title": "正在重新生成标题",
  "Wake thread": "唤醒对话",
  "Wake thread now": "立即唤醒对话",
  "Pin thread": "置顶对话",
  "Unpin thread": "取消置顶对话",
  "Settle thread": "归置对话",
  "Un-settle thread": "取消归置对话",
  "Snooze thread": "暂缓对话",
  "Rename thread": "重命名对话",
  "Archive thread": "归档对话",
  "Delete thread": "删除对话",
  "Mark unread": "标记为未读",
  "Share with guest": "分享给访客",
  "Turn into project": "转换为项目",
  "Find in thread": "在对话中查找",
  "Find in current thread": "在当前对话中查找",
  "Discard draft": "丢弃草稿",
  "Project settings": "项目设置",
  "Copy path": "复制路径",
  "Pin project": "置顶项目",
  "Unpin project": "取消置顶项目",
  "Open project": "打开项目",
  "Remove project": "移除项目",

  // Thread Details Menu
  "Show in thread details": "在对话详情中显示",
  "Environment and worktree": "环境与工作树",
  "Open in editor": "在编辑器中打开",
  "Project scripts": "项目脚本",
  "Branch and pull request": "分支与拉取请求",
  "Git actions": "Git 操作",
  "Servers": "服务器",
  "Automations": "自动化",
  "Lineage": "对话谱系",
  "Side chats": "侧边聊天",
  "Usage limits": "用量限制",
  "Context window": "上下文窗口",

  // Common actions & buttons
  "Open": "打开",
  "Open with": "打开方式",
  "Close": "关闭",
  "Cancel": "取消",
  "Confirm": "确认",
  "Approve": "批准",
  "Decline": "拒绝",
  "Always allow this session": "在本次会话中始终允许",
  "More approval options": "更多批准选项",
  "Retry": "重试",
  "Save": "保存",
  "Saving…": "正在保存…",
  "Saving...": "正在保存...",
  "Saved": "已保存",
  "Delete": "删除",
  "Deleting…": "正在删除…",
  "Edit": "编辑",
  "Add": "添加",
  "Adding…": "正在添加…",
  "Create": "创建",
  "Remove": "移除",
  "Dismiss": "忽略",
  "Reset": "重置",
  "Reset to default": "重置为默认值",
  "Reset to inherited value": "重置为继承值",
  "Copy": "复制",
  "Copied": "已复制",
  "Copy Link": "复制链接",
  "Copy link": "复制链接",
  "Copy command": "复制命令",
  "Paste": "粘贴",
  "Cut": "剪切",
  "Select all": "全选",
  "Select none": "全不选",
  "Continue": "继续",
  "Back": "返回",
  "Next": "下一步",
  "Previous": "上一步",
  "Send": "发送",
  "Stop": "停止",
  "Run": "运行",
  "Refresh": "刷新",
  "Reload": "重新加载",
  "Reload app": "重新加载应用",
  "Install": "安装",
  "Update": "更新",
  "Download": "下载",
  "Import": "导入",
  "Export": "导出",
  "Share": "分享",
  "Sign in": "登录",
  "Sign out": "退出登录",
  "Enabled": "已启用",
  "Disabled": "已禁用",
  "On": "开启",
  "Off": "关闭",
  "Yes": "是",
  "No": "否",
  "All": "全部",
  "None": "无",
  "Default": "默认",
  "Custom": "自定义",
  "Custom…": "自定义…",
  "Optional": "可选",
  "Required": "必填",
  "Loading": "加载中",
  "Loading…": "加载中…",
  "Loading...": "加载中...",
  "Checking...": "正在检查...",
  "Checking…": "正在检查…",
  "Restarting…": "正在重启…",
  "Publishing...": "正在发布...",
  "Publishing repository to ": "正在将代码仓库发布到 ",
  "Ready": "就绪",
  "Offline": "离线",
  "Online": "在线",
  "Connected": "已连接",
  "Disconnected": "已断开",
  "Unavailable": "不可用",
  "Mixed": "混合",
  "Other": "其他",
  "System": "跟随系统",
  "Light": "浅色",
  "Dark": "深色",
  "Fast": "快速",
  "Fast mode": "快速模式",
  "Fast Mode": "快速模式",
  "No reasoning": "无推理",
  "Ultrafast": "极速",
  "Standard": "标准",
  "Thinking Level": "思考强度",
  "Thinking level": "思考强度",
  "Thought Level": "思考强度",
  "Thought level": "思考强度",
  "Reasoning Effort": "思考强度",
  "Reasoning effort": "思考强度",
  "Reasoning": "推理强度",
  "Thinking": "深度思考",
  "Effort": "思考强度",
  "Service Tier": "服务等级",
  "Service tier": "服务等级",
  "Speed": "速度",
  "Context Window": "上下文窗口",
  "Interaction Mode": "交互模式",
  "Interaction mode": "交互模式",
  "Collaboration Mode": "协作模式",
  "Collaboration mode": "协作模式",
  "Auto": "自动",
  "Minimal": "最低",
  "Low": "低",
  "Medium": "中",
  "High": "高",
  "Extra High": "超高",
  "Max": "最大",
  "Ultra": "极高",
  "Ultracode": "Ultracode（极限编码）",
  "Ultrathink": "Ultrathink（极限思考）",
  "xhigh effort plus multi-agent workflow orchestration": "超高思考强度 + 多智能体工作流编排",
  "Your prompt contains \"ultrathink\" in the text. Remove it to change this option.": "您的提示词中包含“ultrathink”。移除该词后即可更改此选项。",
  "Summarize the conversation and reduce context usage": "总结当前对话并减少上下文占用",
  "Optional instructions": "可选指令",
  "Set a goal Codex keeps working toward until it is done": "设定一个目标，让 Codex 持续推进直至完成",
  "Objective, or pause, resume, clear": "输入目标内容，或输入 pause / resume / clear",
  "Send this thread and Codex logs to OpenAI": "将此对话及 Codex 日志发送给 OpenAI",
  "Describe the issue (optional)": "描述问题（可选）",
  "Allow once": "仅允许一次",
  "Allow for this thread": "在此对话中允许",
  "Allow all edits this session": "在本次会话中允许所有编辑",
  "Always allow": "始终允许",
  "Submit empty value": "提交空值",
  "Keep full history": "保留完整历史记录",
  "Monthly credit limit": "月度额度上限",
  "Monthly spend": "月度支出",
  "Weekly": "每周",
  "ChatGPT usage": "ChatGPT 用量",
  "Go · Session": "Go · 会话",
  "Go · Weekly": "Go · 每周",
  "Go · Monthly": "Go · 每月",
  "Todo list": "待办列表",
  "User input": "用户输入",
  "Action required": "需要操作",
  "Generating commit message...": "正在生成提交说明...",
  "Committing...": "正在提交...",
  "Preparing feature branch...": "正在准备功能分支...",
  "Pushing...": "正在推送...",
  "Interrupted": "已中断",
  "Workspace ready": "工作区已就绪",
  "Workspace preparation cancelled": "工作区准备已取消",
  "Workspace preparation failed": "工作区准备失败",
  "Workspace preparation interrupted": "工作区准备已中断",
  "Interrupt requested": "已请求中断",
  "Answer delivery not confirmed": "回答投递未确认",
  "Queued provider could not start": "排队中的提供商无法启动",
  "Provider signed out": "提供商已退出登录",
  "Couldn't recreate thread workspace": "无法重新创建对话工作区",
  "Thread mode is above the policy limit": "对话模式超出策略限制",
  "Provider turn recovery failed": "提供商轮次恢复失败",
  "Provider session failed to open": "无法打开提供商会话",
  "Provider turn failed to start": "无法启动提供商轮次",
  "Sign in with Google to use Antigravity.": "请使用 Google 账号登录以使用 Antigravity。",
  "Antigravity is installed. Google account access is not checked yet.": "Antigravity 已安装，尚未检查 Google 账号访问权限。",
  "Checking Antigravity access and models.": "正在检查 Antigravity 访问权限与模型列表。",
  "Waiting for Google to finish sign-in.": "正在等待 Google 完成登录。",
  "Google sign-in was cancelled by sign-out.": "Google 登录已因退出操作而取消。",
  "You have reached your Antigravity quota for this period.": "您已达到本周期的 Antigravity 配额上限。",
  "Antigravity stopped this turn because of an error.": "Antigravity 因发生错误停止了当前轮次。",
  "Sign in with Google to see Antigravity limits.": "请使用 Google 登录以查看 Antigravity 用量限制。",
  "Antigravity did not return usable quota information.": "Antigravity 未返回可用的配额信息。",
  "Could not read Antigravity limits. Refresh provider status to retry.": "无法读取 Antigravity 用量限制，请刷新提供商状态以重试。",
  "Commit": "提交",
  "Push": "推送",
  "Pull": "拉取",
  "Merge": "合并",
  "Branch": "分支",
  "Branches": "分支",
  "Repository": "代码仓库",
  "Repositories": "代码仓库",
  "Directory": "目录",
  "Directories": "目录",
  "Folder": "文件夹",
  "Folders": "文件夹",
  "File": "文件",
  "Files": "文件",
  "Path": "路径",
  "Terminal": "终端",
  "Preview": "预览",
  "Diff": "差异对比",
  "Changes": "变更",
  "History": "历史记录",
  "Version": "版本",
  "Permissions": "权限",
  "Model": "模型",
  "Models": "模型",
  "Workspace": "工作区",
  "Machine": "机器",
  "This machine": "本机",
  "Environment": "环境",
  "Thread": "对话",
  "Project": "项目",
  "Copy relative path": "复制相对路径",
  "Copy URL": "复制 URL",
  "Add an optional comment...": "添加可选评论...",
  "Could not open the cited response": "无法打开引用的回复",
  "Click the citation to try again.": "请点击引用重试。",
  "The quoted text has changed": "引用的文本已发生变更",
  "Showing the source response. The saved quote is unchanged.": "正在显示源回复。已保存的引用保持不变。",
  "View instructions": "查看指令",
  "Accessibility data": "辅助功能数据",
  "Structured accessibility elements were included, but they have no readable names or values.": "已包含结构化辅助功能元素，但没有可读的名称或值。",
  "The app or capture backend did not provide verified accessibility data.": "应用或捕获后端未提供已验证的辅助功能数据。",
  "Code block actions": "代码块操作",
  "Copy as Markdown": "复制为 Markdown",
  "Copy as CSV": "复制为 CSV",
  "Loading image": "正在加载图片",
  "Full path": "完整路径",
  "Relative path": "相对路径",
  "Use template": "使用模板",
  "Note": "注意",
  "Tip": "提示",
  "Important": "重要",
  "Caution": "警告",
  "Media unavailable": "媒体不可用",
  "Unable to open link in browser": "无法在浏览器中打开链接",
  "Toggle task": "切换任务状态",
  "This context is no longer available. Remove it or attach it again.": "此上下文已不再可用。请将其移除或重新添加。",
  "Search languages": "搜索语言",
  "No matching languages.": "没有匹配的语言。",
  "Typeset LaTeX math, such as $x^2$ or \\[x^2\\], in messages and Markdown previews. The composer keeps TeX source editable.": "在消息和 Markdown 预览中排版 LaTeX 数学公式（如 $x^2$ 或 \\[x^2\\]）。输入框中仍保留可编辑的 TeX 源码。",
  "Equals": "等于",
  "Exists": "存在",
  "equals": "等于",
  "exists": "存在",
  "Find in PDF": "在 PDF 中查找",
  "Fit width": "适应宽度",
  "minutes, optional": "分钟（可选）",
  "template, optional": "模板（可选）",
  "seconds, 10–3600": "秒（10–3600）",
  "Match Case": "区分大小写",
  "Whole Word": "全字匹配",
  "Don't show this again": "不再显示",
  "Don't ask again": "不再询问",
  "Remember my choice": "记住我的选择",
  "Need a pairing link?": "需要配对链接？",
  "Or use your own credentials": "或使用您自己的凭据",
  "or, update manually using": "或者，使用以下命令手动更新",
  "Disable auto-merge": "禁用自动合并",
  "Host state": "主机状态",
  "Collection health": "采集健康状态",
  " CPU average": " CPU 平均负载",
  " I/O reads": " I/O 读取",
  " I/O writes": " I/O 写入",
  "Agent tools are ready.": "智能体工具已就绪。",
  "T3 Code downloads and manages Codex for you.": "T3 Code 会为您自动下载并管理 Codex。",
  "Signed out locally.": "已在本地退出登录。",
  "Could not reach this environment. Try again.": "无法连接到此环境，请重试。",
  "Reorder routes": "调整路由顺序",
  "T3 Connect linked": "T3 Connect 已关联",
  "T3 Connect tunnel disabled": "T3 Connect 隧道已禁用",
  "T3 Connect unlinked": "T3 Connect 已取消关联",
  "T3 Connect keeps webhook requests for up to 24 hours while this environment is offline.": "当此环境离线时，T3 Connect 最多可将 Webhook 请求保留 24 小时。",
  "T3 Connect is on, but other devices cannot reach this environment.": "T3 Connect 已开启，但其他设备无法访问此环境。",
  "T3 Connect is on. Reachability has not been checked yet.": "T3 Connect 已开启，尚未检查连通性。",
  "SSH host or alias is required.": "必须填写 SSH 主机或别名。",
  "SSH port must be between 1 and 65535.": "SSH 端口必须在 1 到 65535 之间。",
  "Enter a backend host.": "请输入后端主机地址。",
  "Enter a pairing code.": "请输入配对码。",
  "The device returned an empty screenshot. Try again.": "设备返回了空截图，请重试。",
  "Allow new agent sessions in this environment to start and control local and remote devices, with required tools set up automatically.": "允许此环境中的新智能体会话启动并控制本地与远程设备，并自动配置所需工具。",
  "Diff file contents are unavailable for this selection.": "当前所选内容的差异文件不可用。",
  "File path": "文件路径",
  "The file could not be loaded. Try again.": "无法加载该文件，请重试。",
  "The file could not be loaded. Reconnect and try again.": "无法加载该文件，请重新连接后重试。",
  "This connection cannot test device hosts.": "此连接无法测试设备主机。",
  "Multiple hosts match this SSH destination. Select the environment to edit its hosts.": "有多个主机匹配此 SSH 目标，请选择相应环境以编辑其主机。",
  "Session minutes": "会话时长（分钟）",
  "Idle minutes": "空闲时长（分钟）",
  "Lease minutes": "租约时长（分钟）",
  "Could not open System Settings. Try Allow again.": "无法打开系统设置，请再次点击“允许”重试。",
  "Browser profile data is not available to clear.": "没有可清除的浏览器配置文件数据。",
  "Browser profile limit reached.": "已达到浏览器配置文件数量上限。",
  "A tradeoff to weigh": "需要权衡的取舍",
  "A contract to check": "需要核对的契约",
  "A product call": "产品决策点",
  "A risk to judge": "需要评估的风险",
  "Check the review guide model in Settings → Source control.": "请在“设置 → 源代码管理”中检查审查指南模型。",
  "A guide is a tour of the change: stops through the code in reading order, with the calls only a maintainer can make.": "审查指南是对本次变更的导览：按阅读顺序串联代码关键节点，并标注需要维护者拍板的决策点。",
  "No merge method is available for this repository.": "此代码仓库没有可用的合并方式。",
  "This file contains binary data and cannot be shown as text.": "此文件包含二进制数据，无法作为文本显示。",
  "This file is not UTF-8 text. Open it in another app to view its contents.": "此文件不是 UTF-8 文本，请在其他应用中打开以查看其内容。",
  "Unable to copy screenshot path": "无法复制截图路径",
  "Unable to copy screenshot": "无法复制截图",
  "Reply could not be posted": "无法发布回复",
  "Not connected:": "未连接：",
  "Loading scheduled tasks on": "正在加载定时任务：",
  "Could not load scheduled tasks:": "无法加载定时任务：",
  "No tasks on": "暂无定时任务：",
  "Rotate this webhook URL? The current URL stops working.": "要轮换此 Webhook URL 吗？当前 URL 将停止工作。",
  "Webhook URL": "Webhook URL",
  "Scheduled task is incomplete": "定时任务信息不完整",
  "Add a title, prompt, project, and model.": "请填写标题、提示词、项目和模型。",
  "Invalid filter": "筛选条件无效",
  "Signing secret is required": "必须填写签名密钥",
  "Enter the signature header and secret.": "请输入签名请求头和密钥。",
  "Invalid interval": "时间间隔无效",
  "Enter an interval of at least one minute.": "请输入至少 1 分钟的时间间隔。",
  "Once is not available here": "当前环境不支持单次执行",
  "This environment runs an older T3 Code. Update it to schedule a one-time task, or pick another schedule.": "此环境运行的是旧版 T3 Code。请更新后再创建单次任务，或选择其他调度方式。",
  "Checkout path is required": "必须填写检出路径",
  "Enter the path of the checkout to run in.": "请输入要运行任务的检出目录路径。",
  "Could not save scheduled task": "无法保存定时任务",
  "Notifications need a supported browser over HTTPS, or the desktop app. Sound only is still available.": "通知功能需要通过 HTTPS 访问受支持的浏览器或使用桌面客户端。仅声音提醒仍然可用。",
  "Notifications are unavailable in this browser. Sound only is still available.": "此浏览器不支持通知功能，但仅声音提醒仍然可用。",
  "Allow notifications in your browser or system settings, then choose this option again. Sound only is still available.": "请在浏览器或系统设置中允许通知权限，然后重新选择此选项。仅声音提醒仍然可用。",
  "Uses custom intervals.": "使用自定义时间间隔。",
  "This app's updates are off here, so reinstall it yourself to switch.": "当前已关闭应用自动更新，请手动重新安装以切换通道。",
  "If T3 Code does not reopen after it restarts, open it again.": "如果 T3 Code 重启后未自动重新打开，请手动打开它。",
  "Could not unlink T3 Chat": "无法取消关联 T3 Chat",
  "Name your theme first.": "请先为您的主题命名。",
  "Theme saved, but it could not be made active. Try again.": "主题已保存，但无法设为当前启用主题，请重试。",
  "Third-party notices": "第三方开源声明",
  "Commands that run in this project's checkout or its worktree, with optional shortcuts.": "在此项目的检出目录或工作树中运行的命令（可配置快捷键）。",
  "Could not open the sign-in page. Copy the link and open it in your browser.": "无法打开登录页面，请复制链接并在浏览器中打开。",
  "Could not copy the sign-in link.": "无法复制登录链接。",
  "The provider sign-in terminal is no longer available.": "提供商登录终端已不再可用。",
  "That model is already built in.": "该模型已是内置模型。",
  "Model slugs must be 256 characters or less.": "模型标识符长度不能超过 256 个字符。",
  "That custom model is already saved.": "该自定义模型已保存。",
  "Enter a model slug.": "请输入模型标识符 (slug)。",
  "Could not list ACP sessions": "无法列出 ACP 会话",
  "ACP session imported": "ACP 会话已导入",
  "ACP session already imported": "ACP 会话此前已导入",
  "Could not import ACP session": "无法导入 ACP 会话",
  "Could not delete ACP session": "无法删除 ACP 会话",
  "Could not configure ACP provider": "无法配置 ACP 提供商",
  "Could not disable ACP provider": "无法禁用 ACP 提供商",
  "Could not log out of ACP agent": "无法退出登录 ACP 智能体",
  "Provider setup failed. Try again.": "提供商配置失败，请重试。",
  "Removing runtime": "正在移除运行时",
  "Cancelling installation": "正在取消安装",
  "Starting installation": "正在开始安装",
  "Couldn't check capture setup": "无法检查捕获配置",
  "Add a letter, number, or function key to your shortcut.": "请在快捷键中添加字母、数字或功能键。",
  "Permission status unavailable": "权限状态不可用",
  "Couldn't save capture settings": "无法保存捕获设置",
  "Couldn't allow app text capture": "无法授权应用文本捕获",
  "Couldn't verify capture access": "无法验证捕获访问权限",
  "Couldn't close capture setup": "无法关闭捕获设置向导",
  "A far higher GitHub API rate limit than a personal token or gh login.": "提供远高于个人访问令牌 (PAT) 或 gh 登录的 GitHub API 速率限制。",
  "Waiting for approval · code expires at ": "等待批准 · 验证码过期时间：",
  "Map to a different model.": "映射到其他模型。",
  "This model already has a row. Edit its prices there.": "此模型已存在配置行，请直接在该行编辑价格。",
  "Could not read Usage page preferences.": "无法读取用量页面偏好设置。",
  "Could not save Usage page preferences.": "无法保存用量页面偏好设置。",
  "Requires access to your Cursor login in macOS Keychain.": "需要访问 macOS 钥匙串中的 Cursor 登录凭据。",
  "Streaming file previews are unavailable in this runtime.": "当前运行时不支持流式文件预览。",
  "Unable to load video.": "无法加载视频。",
  "Custom preview viewport requires width and height": "自定义预览视口需要指定宽度和高度",
  "Recording canvas is unavailable.": "录制画布不可用。",
  "The project did not appear in the desktop app.": "该项目未显示在桌面应用中。",
  "Invalid keybinding.": "快捷键无效。",
  "This connection cannot change project actions.": "此连接无法修改项目操作。",
  "Name is required.": "必须填写名称。",
  "Command is required.": "必须填写命令。",
  "Those threads and any archived threads are deleted from T3 Code. Provider sessions are kept.": "这些对话及所有已归档对话都将从 T3 Code 中删除。提供商会话将予以保留。",
  "Any archived threads are deleted from T3 Code. Provider sessions are kept.": "所有已归档对话都将从 T3 Code 中删除。提供商会话将予以保留。",
  "Enter the full owner/repository name.": "请输入完整的 owner/repository 仓库名称。",
  "Select a project to choose one of its checkouts.": "请先选择一个项目以选择其检出目录。",
  "This environment is no longer available.": "此环境已不再可用。",
  "This checkout's environment is no longer available.": "此检出目录所属的环境已不再可用。",
  "Upload timed out": "上传超时",
  "Upload cancelled": "上传已取消",
  "This connection cannot change threads or projects.": "此连接无法修改对话或项目。",
  "Could not check permissions. We'll try again automatically.": "无法检查权限，稍后将自动重试。",
  "Could not read persisted panel width.": "无法读取已保存的面板宽度。",
  "Could not persist panel width.": "无法保存面板宽度。",
  "The agent is actively controlling these browsers. Closing them may interrupt the current browser actions.": "智能体正在控制这些浏览器，关闭它们可能会中断当前的浏览器操作。",
  "The environment returned an invalid attachment URL.": "环境返回了无效的附件 URL。",
  "This message has an attachment that cannot be restored.": "此消息包含无法恢复的附件。",
  "The thread has changed. Select a message to rewind again.": "对话已发生变更，请重新选择一条消息进行回退。",
  "Timed out waiting for the thread to rewind.": "等待对话回退超时。",
  "Scan limit reached. Some projects or conversations may be missing.": "已达到扫描上限，部分项目或对话可能未显示。",
  "T3 Code collects anonymous usage data to help us improve it.": "T3 Code 会收集匿名使用数据以帮助我们持续改进产品。",
  "Codex setup settings": "Codex 配置设置",
  "This connection cannot import projects or thread history.": "此连接无法导入项目或对话历史记录。",
  "Could not import thread history.": "无法导入对话历史记录。",
  "No environment is selected.": "未选择环境。",
  "This connection cannot restart the resource monitor.": "此连接无法重启资源监控器。",
  "The open-source license manifest has an unsupported format.": "开源许可证清单格式不受支持。",
  "A community color theme for your editor.": "适用于编辑器的社区配色主题。",
  "Could not read that file. Paste the JSON below instead.": "无法读取该文件，请在下方直接粘贴 JSON 内容。",
  "Theme added, but it could not be selected. Try again.": "主题已添加，但无法选中，请重试。",
  "Pull requests are not available for this project.": "此项目不可用拉取请求功能。",
  "Pull requests could not be read for this project.": "无法读取此项目的拉取请求。",
  "The attachment limit has been reached.": "已达到附件数量上限。",
  "The draft rejected this attachment (duplicate or attachment limit reached).": "草稿拒绝了此附件（重复添加或已达附件上限）。",
  "You can attach up to 100 files per message.": "每条消息最多可添加 100 个文件附件。",
  "A message can have at most 100 attachments.": "每条消息最多可包含 100 个附件。",
  "This permanently clears conversation history for this thread.": "这将永久清除此对话的历史记录。",
  "This permanently clears its conversation history.": "这将永久清除其对话历史记录。",
  "The side chat was created, but it did not reach this client.": "侧边聊天已创建，但尚未同步到此客户端。",
  "Could not run automation": "无法运行自动化任务",
  "Unable to open in browser": "无法在浏览器中打开",
  "Unable to open preview": "无法打开预览",
  "Could not stop server": "无法停止服务器",
  "Could not switch machine": "无法切换机器",
  "Messages from apps need a started thread.": "来自应用的消息需要先启动一个对话。",
  "Wait for attachments to finish uploading, or remove failed uploads.": "请等待附件上传完成，或移除上传失败的附件。",
  "Script not found.": "未找到脚本。",
  "Retry or remove failed uploads before saving.": "保存前请重试或移除上传失败的附件。",
  "Send approval feedback without attachments or added context.": "发送审批反馈时不能包含附件或额外上下文。",
  "Retry or remove failed uploads before sending.": "发送前请重试或移除上传失败的附件。",
  "Select a base branch before sending in New worktree mode.": "在“新建工作树”模式下发送前，请先选择基准分支。",
  "The fork was created, but its thread data did not reach this client. Reconnect and try opening it from the sidebar.": "分支对话已创建，但数据尚未同步到此客户端。请重新连接并尝试从侧边栏打开。",
  "Interrupt the current turn before reverting checkpoints.": "回退检查点之前，请先中断当前轮次。",
  "This provider does not support reverting conversation history. Start a new thread instead.": "此提供商不支持回退对话历史记录，请改为新建对话。",
  "This server does not support file attachments.": "此服务器不支持文件附件。",
  "Make room for this message's attachments in the composer before rewinding.": "回退前请先在输入框中为此消息的附件腾出空间。",
  "Wait for attachments to finish preparing before rewinding.": "回退前请等待附件准备完成。",
  "The previous request may already be running. Check its thread first. Allow another send that could create a duplicate thread?": "上一个请求可能已在运行中，请先检查对应对话。是否允许再次发送（可能会创建重复对话）？",
  "The previous request may have started. Open its thread to check before sending again.": "上一个请求可能已经启动，再次发送前请先打开对应对话进行确认。",
  "No active project is available for this pull request.": "此拉取请求没有可用的活动项目。",
  "The upload was refused.": "上传被拒绝。",

  // Split-array sentence fragments in JSX children:[...]
  " accounts in T3 Code.": " 账号。",
  " on the computer that opened this page. Only approve a sign-in you just started.": "（在打开此页面的电脑上）。请仅批准您刚刚发起的登录请求。",
  ". Only approve a sign-in you just started there.": "。请仅批准您刚刚在那里发起的登录请求。",
  "on this machine.": "（在本机上运行）。",
  "attempt ": "第 ",
  " to free it.": " 以释放配额。",
  " of them.": " 个文件。",
  " byte file.": " 字节的文件。",
  ". Check the link's path or locate the file in Files.": "。请检查链接路径或在“文件”面板中查找该文件。",
  " remaining)": " 个剩余)",
  " hidden)": " 个已隐藏)",
  " lines ": " 第 ",
  " are not in the loaded diff.": " 行不在已加载的差异内容中。",
  "showing ": "正在显示 ",
  "diff lines": "行差异",
  " hidden": " 个已隐藏",
  ", then select Refresh.": "，然后选择“刷新”。",
  ", reconnecting…": "，正在重新连接…",
  ", then create the draft thread in the main repo or in a dedicated worktree.": "，然后在主仓库或独立工作树中创建草稿对话。",
  ". Sending will continue on": "。继续发送将在以下分支进行：",
  " using ": "，合并方式：",
  " dropped": " 已拖入",
  " actions.": " 操作。",
  "downloads": "次下载",
  " endpoint": " 端点",
  ". While it is off, every guest link stops working.": "。关闭后，所有访客链接都将停止工作。",
  ". While it is off, nothing new starts over a link; tasks already running finish.": "。关闭后，不会再通过链接启动新任务；已在运行的任务将继续完成。",
  ". An alpha that may change or break. T3 Code never installs Simlock.": "。此功能处于 Alpha 阶段，后续可能会变更或中断。T3 Code 不会自动安装 Simlock。",
  "in your browser.": "（在浏览器中输入）。",
  ", which is not available in this build. Its configuration is preserved.": "，但当前构建版本不支持该驱动。其配置已保留。",
  " to free up the keys.": " 中移除该快捷键以释放按键。",
  " on the server host, then rescan to choose accounts here.": "（在服务器主机上运行），然后重新扫描以在此处选择账号。",
  " login is used.": " 登录账号。",
  " unpriced records.": " 条未定价记录。",
  "files.": "文件。",
  ". Save the file to read it in full.": "。请保存文件以阅读完整内容。",
  ". T3 Code passes your response to the local SSH process and keeps it in memory to reuse for this host. T3 Code does not write it to disk.": "。T3 Code 会将您的输入传递给本地 SSH 进程并保存在内存中以供该主机复用，不会将其写入磁盘。",
  " locally.": "（本地安装）。",
  ". Read the prompt before you send it.": "。请在发送前仔细检查提示词内容。",
  ". Go home to choose a project or start a thread.": "。请返回首页以选择项目或开始新对话。",
  " to clear. Shortcuts are environment-wide. Projects using the same action share its shortcut.": " 可清除快捷键。快捷键在整个环境中生效，使用相同操作的项目将共享该快捷键。",
  "exit ": "退出码 ",
  " in the full diff": " 个文件（位于完整差异对比中）",
  ". The agent can use that link as it is; change its access in Settings → Connections.": "。智能体可直接使用该连接；如需修改访问权限，请前往“设置 → 连接”。",
  ". You can set": "。您可以稍后在“设置”中配置",
  " up later from Settings.": "。",
  ", see our": "，请参阅我们的",
  ", then run:": "，然后运行：",
  " instead.": "。",
  " in this terminal.": "（在此终端中运行）。",
  "Theme": "主题",
  "Identity": "身份凭证",
  "Conversation": "对话",
  "Skill": "技能",
  "Preparing workspace": "正在准备工作区",
  "(empty response)": "（空响应）",
  " banked": " 已储备",
  " image": " 张图片",
  " entries": " 个条目",
  " columns": " 列",
  " login, so ": " 登录状态，因此 ",
  " works without the ": " 无需依赖 ",
  "A token saved here is used before": "此处保存的令牌优先级高于",
  ". Give it": " 即可工作。请为其授予",
  "read and write access to pull requests and contents": "拉取请求和仓库内容的读写权限",
  " and how to opt out": "以及如何退出统计",
  " tunnels. ": " 条隧道。",
  " to Premier for": " 至 Premier 套餐即可支持最多",
  " for more tunnels": " 以获取更多隧道配额",
  "Pro · up to ": "Pro · 最多支持 ",
  "Upgrade on T3 Chat": "在 T3 Chat 上升级",
  " per environment": "（每个环境单独配置）",
  " when its": "（当其 ",
  " is this gateway.": " 指向此网关时）。",
  "Enter a name.": "请输入名称。",
  "Enter the 1Password account.": "请输入 1Password 账号。",
  "The name needs at least one letter or digit.": "名称至少需要包含一个字母或数字。",
  "A secret provider with this name exists.": "已存在同名的密钥提供商。",
  "Google account": "Google 账号",
  "Gemini Enterprise": "Gemini 企业版",
  "Gemini API key": "Gemini API 密钥",
  "Agent Platform (Vertex AI)": "智能体平台 (Vertex AI)",
  "ACP Registry": "ACP 注册表",
  "Local command": "本地命令",
  "Registry default": "注册表默认值",
  "Your signed-in server": "您已登录的服务器",
  "Add argument": "添加参数",
  "Executable": "可执行文件",
  "Executable name or path on this environment.": "当前环境中的可执行文件名称或路径。",
  "Reveal in Finder": "在访达 (Finder) 中显示",
  "Reveal in File Explorer": "在文件资源管理器中显示",
  "Reveal in Files": "在文件管理器中显示",
  "This media is unavailable. Try reopening the preview.": "此媒体文件不可用，请尝试重新打开预览。",
  "Reconnect to this environment and try again.": "请重新连接此环境后再试。",
  "The environment returned an invalid media URL.": "环境返回了无效的媒体 URL。",
  "Image copying is unavailable. Use a secure browser connection or save the image.": "当前无法复制图片，请使用安全的浏览器连接或直接保存图片。",
  "Could not open media menu": "无法打开媒体菜单",
  "The media action failed.": "媒体操作失败。",
  "Video unavailable": "视频不可用",
  "Retry video": "重试加载视频",
  "Video preview": "视频预览",
  "Video preview unavailable": "视频预览不可用",
  "Loading video": "正在加载视频",
  "Audio unavailable": "音频不可用",
  "Image unavailable": "图片不可用",
  "Enter to save the citation comment; Command/Ctrl+Enter to save and send; Shift+Enter for a new line.": "按 Enter 保存引用评论；按 Command/Ctrl+Enter 保存并发送；按 Shift+Enter 换行。",
  "Comments can contain up to ": "评论最多可包含 ",
  "Shorten comment": "缩短评论内容",
  "Add comment to citation": "为引用内容添加评论",
  "On another machine, so this machine's agent can't read it. Remove it or switch back to send.": "该内容位于另一台机器上，当前机器的智能体无法读取。请移除该内容或切回原机器后再发送。",
  "Thread no longer available": "该对话已不可用",
  "The diagram could not be rendered.": "无法渲染图表。",
  "The diagram renderer failed to load.": "图表渲染器加载失败。",
  "Unable to render diagram: ": "无法渲染图表：",
  "Show diagram": "显示图表",
  "Copy table": "复制表格",
  "Archive contents": "压缩包内容",
  "This file took too long to preview. Close it and try again.": "文件预览超时，请关闭后重试。",
  "Could not load the file viewer. Close it and try again.": "无法加载文件预览器，请关闭后重试。",
  "The file could not be loaded. Close it and try again.": "无法加载该文件，请关闭后重试。",
  "The file is unavailable.": "该文件不可用。",
  "This document took too long to preview. Open it in another app.": "此文档预览耗时过长，请在其他应用中打开。",
  "Could not load the Office viewer. Close the file and try again.": "无法加载 Office 预览器，请关闭文件后重试。",
  "Could not load the Office viewer.": "无法加载 Office 预览器。",
  "Could not read the Office viewer response.": "无法读取 Office 预览器响应。",
  "The text viewer stopped.": "文本预览器已停止运行。",
  "Could not load the text viewer. Close the file and try again.": "无法加载文本预览器，请关闭文件后重试。",
  "Another copy is in progress.": "另一个复制操作正在进行中。",
  "The font could not be loaded.": "无法加载该字体。",
  "Font previews are limited to 10 MB.": "字体预览大小限制为 10 MB。",
  "The font is unavailable.": "该字体不可用。",
  "The font could not be decoded.": "无法解码该字体。",
  "The font took too long to load.": "字体加载超时。",
  "This browser cannot draw slides.": "当前浏览器无法绘制幻灯片。",
  "This workbook has no visible sheets.": "此工作簿没有可见的工作表。",
  "This sheet could not be opened.": "无法打开此工作表。",
  "These cells could not be drawn. Try scrolling to another area.": "无法绘制这些单元格，请尝试滚动到其他区域。",
  "These cells could not be drawn.": "无法绘制这些单元格。",
  "Select fewer than 200,000 cells to copy.": "请选择少于 200,000 个单元格进行复制。",
  "The selected cells could not be copied.": "无法复制所选单元格。",
  "No cells": "无单元格",
  "Webhook URL": "Webhook 地址",
  "Rotate this webhook URL?\nThe current URL stops working.": "要轮换此 Webhook 地址吗？\n当前地址将立即失效。",
  "Switch tracks in About → Update track": "可在“关于 → 更新通道”中切换版本通道",
  "T3 Code will restart and start only the WSL backend. Your Windows-side projects won't be accessible until you turn this off again.": "T3 Code 将重启并仅启动 WSL 后端。在您重新关闭此选项前，Windows 侧的项目将无法访问。",
  "T3 Code will restart and bring the Windows backend back up alongside WSL.": "T3 Code 将重启并同时恢复 Windows 后端与 WSL。",
  "Simulators": "模拟器",
  "Fold shape": "折叠形态",
  "Device control timed out. Its position is unknown.": "设备控制超时，当前位置未知。",
  "Device is disconnected.": "设备已断开连接。",
  "Device 3D asset could not load": "无法加载设备 3D 模型资源",
  "No video received from the device. Reconnect to try again.": "未收到设备视频流，请重新连接后再试。",
  "Could not receive the device stream. Reconnect to try again.": "无法接收设备画面流，请重新连接后再试。",
  "Could not display the device stream. Reconnect to try again.": "无法显示设备画面流，请重新连接后再试。",
  "Video decoder restarted.": "视频解码器已重启。",
  "Switching to WebRTC.": "正在切换至 WebRTC。",
  "Unable to open link.": "无法打开链接。",
  "Unable to open System Settings.": "无法打开系统设置。",
  "Local API not found": "未找到本地 API",
  "Failing checks:": "未通过的检查：",
  "Git URL": "Git 仓库地址",
  "The pull request is not available in this environment.": "此环境中无法访问该拉取请求。",
  "This environment does not support linking this pull request.": "此环境不支持关联该拉取请求。",
  "The environment returned an invalid asset URL.": "环境返回了无效的资源 URL。",
  "VS Code theme": "VS Code 主题",
  "Extension manifest": "扩展清单 (Manifest)",
  "The operation was aborted.": "操作已中止。",
  "That theme file is not valid JSON.": "该主题文件不是有效的 JSON。",
  "Theme files must contain a JSON object.": "主题文件必须包含一个 JSON 对象。",
  "That extension has no compatible color themes.": "该扩展不包含兼容的颜色主题。",

  // --- v0.1.8 & v0.1.9 New Features: Voice / Dictation, Text Generators, Welcome, Settings & Keybindings ---
  "Voice": "语音",
  "Composer: Start or Finish Dictation": "输入框：开始或结束语音听写",
  "Thread: Regenerate Title": "对话：重新生成标题",

  // Voice & Speech Input
  "Transcription": "语音转写",
  "Transcribe with": "转写方式",
  "Dictation shortcut": "语音听写快捷键",
  "Dictation shortcut mode": "听写快捷键触发模式",
  "How the dictation shortcut starts and stops recording.": "设置语音听写快捷键启动和停止录音的方式。",
  "Auto: press to toggle, hold to record": "自动：短按切换录音，长按说话松开结束",
  "Hold: record while held": "按住说话：按住期间录音，松开停止",
  "Toggle: press to start, press again to stop": "切换模式：按一下开始，再按一下停止",
  "Transcription language": "转写语言",
  "Dictionary": "个人词典",
  "Project dictionary": "项目词典",
  "Shared dictionary": "共享词典",
  "Add words or phrases, separated by commas or line breaks": "添加词语或短语，用逗号或换行分隔",
  "Misspelling": "易错拼写",
  "Alias": "替换别名",
  "Cleanup model": "润色整理模型",
  "Model for transcript cleanup, such as a cheaper or faster one. When disabled, use the text generation model configured for this environment.": "用于整理语音转写文本的模型（例如更轻量或更快的模型）。关闭时使用当前环境配置的文本生成模型。",
  "Use a separate cleanup model": "使用独立的润色整理模型",
  "Clean up transcripts": "自动润色转写文本",
  "Cleanup instructions": "润色指令",
  "Use the built-in instructions or write your own.": "使用内置润色指令，或编写自定义指令。",
  "Built-in": "内置",
  "Custom cleanup instructions": "自定义润色指令",
  "Correction cue": "口头纠错提示词",
  "The word or phrase you say to flag a correction, like “sorry” or “scratch that”. Cleanup applies the correction only where one is meant, and hears the cue as a hint.": "您在口述时用于标记更正的词语或短语（例如“不对”、“说错了”或“sorry”）。润色模型仅在确实需要更正处生效，并将该提示词作为线索。",
  "Silence filtering": "静音过滤",
  "Skip silence and other non-speech audio before transcription, keeping a short buffer so words aren’t cut off.": "转写前自动跳过静音与非人声片段，并保留短暂缓冲以防截断字词。",
  "OpenAI handles silence automatically.": "OpenAI 会自动处理静音片段。",
  "The cloud provider can detect your language automatically.": "云端服务商可自动识别您的说话语言。",
  "Choose an environment above to see the languages its transcription model supports.": "请先在上方选择一个环境，以查看其转写模型支持的语言。",
  "Translate to English": "翻译为英文",
  "Speak any language and get English text.": "使用任意语言说话并直接输出英文文本。",
  "Translate": "翻译",
  "Live preview": "实时预览",
  "Shows words in your draft as you speak, before the recording finishes.": "在录音结束前，边说边在草稿框中实时显示识别出的文字。",
  "Live transcription": "实时语音转写",
  "Transcription models": "语音转写模型",
  "Transcription hardware and model unloading": "转写硬件与模型卸载",
  "Transcription hardware": "转写计算硬件",
  "Hardware": "计算硬件",
  "Selected GPU": "所选 GPU",
  "Auto uses the environment’s GPU when it has one.": "“自动”模式会在当前环境拥有可用 GPU 时优先使用 GPU。",
  "Unload model": "自动卸载模型",
  "Immediately": "立即卸载",
  "After 2 minutes": "2 分钟后",
  "After 5 minutes": "5 分钟后",
  "After 10 minutes": "10 分钟后",
  "After 15 minutes": "15 分钟后",
  "After 1 hour": "1 小时后",
  "Smallest download": "下载体积最小",
  "Fastest transcription": "转写速度最快",
  "Recommended": "推荐",
  "A good default pick for the languages it covers.": "在其覆盖的语种下表现均衡的默认首选模型。",
  "Selected": "已选",
  "Use model": "使用此模型",
  "Use": "使用",
  "Languages": "支持语言",
  "Browse models by language": "按语言浏览模型",
  "All languages": "所有语言",
  "No languages match.": "没有匹配的语言。",
  "All models": "所有模型",
  "Search models": "搜索模型",
  "Search transcription models": "搜索语音转写模型",
  "No transcription model matches.": "没有匹配的语音转写模型。",
  "Sort by": "排序方式",
  "Speed:": "速度：",
  "Already downloaded elsewhere? Paste the model file or folder path": "已在其他位置下载过？粘贴模型文件或文件夹路径",
  "Use existing": "使用已有模型",
  "Verifying download…": "正在校验下载文件…",
  "Test microphone": "测试麦克风",
  "Cancel microphone test": "取消麦克风测试",
  "Recording time": "录音时长",
  "Microphone input level": "麦克风输入音量",
  "Opening microphone…": "正在打开麦克风…",
  "Recording playback position": "录音回放进度",
  "Record again": "重新录音",
  "Could not play this recording. Try recording again.": "无法播放此段录音，请重新录制后再试。",
  "Microphone testing is unavailable in this browser. Use HTTPS or the desktop app.": "当前浏览器不支持麦克风测试，请使用 HTTPS 连接或桌面客户端。",
  "No audio was recorded. Try again.": "未录制到任何音频，请重试。",
  "Could not record microphone audio. Try again.": "无法录制麦克风音频，请重试。",
  "The microphone disconnected.": "麦克风连接已断开。",
  "Could not access the microphone.": "无法访问麦克风。",
  "Refresh microphones": "刷新麦克风列表",
  "Selected microphone (unavailable)": "所选麦克风（不可用）",
  "Selected microphone (Unavailable)": "所选麦克风（不可用）",
  "The selected microphone is unavailable. Choose another or use the system default.": "所选麦克风当前不可用，请更换其他麦克风或使用系统默认设备。",
  "Test model": "测试模型",
  "Test transcript": "测试转写结果",
  "No speech recognized. Try again.": "未识别到语音内容，请重试。",
  "Waiting for the environment to connect": "正在等待环境连接",
  "On an environment": "在指定环境中运行",
  "Chosen environment (unavailable)": "所选环境（不可用）",
  "OpenRouter model": "OpenRouter 模型",
  "Manage OpenRouter": "管理 OpenRouter",
  "Manage OpenRouter dictation": "管理 OpenRouter 语音听写",
  "Manage key": "管理密钥",
  "Replace API key": "更换 API 密钥",
  "Enter API key": "输入 API 密钥",
  "Enter an API key, not a URL or secret reference.": "请输入直接的 API 密钥，而非 URL 或密钥引用。",
  "Leave blank to keep the saved key.": "留空则保留已保存的密钥。",
  "Retry loading API key": "重试加载 API 密钥",
  "Checking for an API key…": "正在检查 API 密钥…",
  "Retry loading models": "重试加载模型列表",
  "Loading transcription models…": "正在加载语音转写模型…",
  "This choice applies only to this device. Choose Off to stop sharing.": "此选项仅对当前设备生效。选择“关闭”即可停止共享。",
  "Couldn’t save this change. Check your connection and try again.": "无法保存此更改，请检查连接后重试。",
  "Could not load transcription models": "无法加载语音转写模型",
  "Could not change transcription hardware": "无法更改转写计算硬件",
  "Could not change when the model unloads": "无法更改模型卸载时间",
  "Could not download the model": "无法下载该模型",
  "Could not select the model": "无法选择该模型",
  "Could not cancel the download": "无法取消下载",
  "Could not delete the model": "无法删除该模型",
  "Could not use a model from that path": "无法从该路径加载模型",
  "Start voice input": "开始语音输入",
  "Start dictating": "开始语音听写",
  "Dismiss voice input error": "关闭语音输入错误提示",
  "Voice input is not available": "语音输入不可用",
  "Voice transcription was cancelled.": "语音转写已取消。",
  "Microphone access is required for voice input. Allow access in your browser or system settings and try again.": "语音输入需要麦克风权限。请在浏览器或系统设置中允许访问麦克风后再试。",
  "Silero (1.2 MB), used for silence filtering and pause detection, downloads alongside the speech model. An installed copy is reused.": "用于静音过滤与停顿检测的 Silero 组件（1.2 MB）将随语音模型一并下载；若已安装则直接复用。",
  "Speech model download progress": "语音模型下载进度",
  "Speak and transcribe in multiple languages or translate into English, and get names and technical terms right with the dictionary in Voice settings.": "支持多语种语音转写或直接翻译为英文，并可在“语音”设置中通过词典精准识别人名与专业术语。",
  "Cancel download": "取消下载",
  "Customize in Voice settings": "在“语音”设置中自定义",
  "Transcript cleanup failed": "转写文本润色失败",
  "The original transcript was added.": "已直接填入原始转写文本。",
  "The model downloaded, but this environment could not select it. Try again.": "模型已下载完成，但当前环境无法选中它，请重试。",

  // Providers -> Text Generators
  "Text generators": "文本生成器",
  "Add generator": "添加生成器",
  "Add a text generator": "添加文本生成器",
  "No text generators yet": "暂无文本生成器",
  "Add a model API to write thread titles, commit messages, and other short text without starting a coding agent.": "添加模型 API 以生成对话标题、提交说明及其他短文本，无需启动完整的编码智能体。",
  "Show models": "显示模型列表",
  "Voice transcript cleanup": "语音转写文本润色",
  "Base URL": "接口地址 (Base URL)",
  "API key (optional)": "API 密钥（可选）",
  "Name (optional)": "名称（可选）",
  "e.g. My local model": "例如：我的本地模型",
  "Use it": "立即使用",
  "Follows the text generation model": "跟随默认文本生成模型",
  "The model list couldn't load.": "无法加载模型列表。",
  "Loading the model list.": "正在加载模型列表…",
  "Custom (OpenAI-compatible)": "自定义（兼容 OpenAI 接口）",
  "For thread titles and other generated text. Source control has its own setting. Text generators from Providers also appear here.": "用于生成对话标题及其他短文本。源代码管理拥有独立配置；在“提供商”中添加的文本生成器也会显示在此处。",

  // Chat, Labs, Source Control & Settings Search Additions
  "Tool calls in chat": "聊天中的工具调用显示",
  "Activity": "完整动态",
  "Zen": "简洁专注 (Zen)",
  "Screen reader announcements": "屏幕阅读器播报",
  "Status only": "仅状态变更",
  "Status and messages": "状态与消息",
  "Everything": "全部步骤详情",
  "What a screen reader hears from the open thread: a turn starting, needing you, and ending. Status and messages adds what the agent writes before its last message. Everything adds each step.": "控制屏幕阅读器在当前对话中播报的内容：轮次开始、需要您操作以及结束。“状态与消息”会额外播报智能体在最终回复前的输出；“全部步骤详情”会播报每一步操作。",
  "Clones go to github.com/owner/repo under the folder above, like ghq.": "克隆仓库时将按类似 ghq 的目录结构存放于上方文件夹下的 github.com/owner/repo 路径中。",
  "Suggest next prompt": "推荐下一条提示词",
  "Fast worktree checkout": "快速工作树检出",
  "On a Mac, clone new worktrees from a checkout cached in the T3 home folder instead of writing every file. Uses Git’s normal checkout when it can’t. Turning it off deletes the cache.": "在 Mac 上从 T3 主目录缓存的检出副本快速克隆新工作树，避免逐个写入文件；不支持时自动回退至普通 Git 检出。关闭此项将清除缓存。",
  "Share a thread with a guest who watches it live in a browser and sends messages you approve. Sign in to T3 Connect to use guest links.": "将对话分享给访客，访客可在浏览器中实时观看并发送需经您批准的消息。登录 T3 Connect 后即可使用访客链接。",
  "Share a thread with a guest who watches it live in a browser and sends messages you approve. Needs T3 Connect: sign in and link this machine in": "将对话分享给访客，在浏览器中实时观看并发送需经您批准的消息。需要使用 T3 Connect：请先登录并在以下位置关联此设备：",
  ". Turning it off stops every guest link.": "。关闭后将停止所有访客链接。",
  ". While off, nothing new starts over a link; running tasks finish.": "。关闭期间不会通过链接启动新任务，已在运行的任务将继续完成。",
  "Commits & pull requests": "提交与拉取请求",
  "Follow pull request templates": "遵循拉取请求模板",
  "Use the repository's pull request template when it has one.": "当仓库存在拉取请求模板时自动套用该模板。",
  "Conventional Commit prefixes, with short pull request titles and descriptions.": "使用约定式提交（Conventional Commits）前缀，并生成简明的拉取请求标题与描述。",
  "Your instructions shape commit messages and pull request titles and descriptions.": "您的自定义指令将决定提交说明及拉取请求标题与描述的生成风格。",
  "Keep commit subjects under 60 characters. Keep pull request descriptions short and plain.": "将提交标题控制在 60 个字符以内，保持拉取请求描述简明扼要。",
  "Custom commit and pull request instructions": "自定义提交与拉取请求生成指令",
  "Must be a coding agent: it reads the pull request over many steps. Off uses the writer model, or Codex or Claude if that model is a text generator.": "必须选择编码智能体：它会分多步深入阅读拉取请求代码。关闭时将使用撰写模型（若撰写模型是纯文本生成器，则回退至 Codex 或 Claude）。",
  "Model for commit messages, pull request text, and branch or bookmark names. When disabled, use the text generation model configured for this environment.": "用于生成提交说明、拉取请求正文及分支/书签名称的模型。关闭时使用当前环境配置的默认文本生成模型。",

  // Welcome Page, Fresh Session, Storage Reclaim & Misc UI
  "Welcome page": "欢迎页",
  "Welcome": "欢迎",
  "Welcome to T3 Code": "欢迎使用 T3 Code",
  "See your agents, import projects, and set up your phone.": "查看您的智能体、导入项目并配置手机端连接。",
  "Finishing setup": "正在完成设置",
  "One moment.": "请稍候。",
  "Start without an agent": "暂不配置智能体，直接开始",
  "Set up": "立即配置",
  "Add more agents": "添加更多智能体",
  "More agents in the ACP Registry": "在 ACP 注册表中浏览更多智能体",
  "Browse": "浏览",
  "This connection cannot manage agents.": "当前连接无权管理智能体。",
  "T3 Code collects anonymous usage data to improve the app.": "T3 Code 会收集匿名使用数据以改进应用体验。",
  "To opt out, see the": "如需退出统计，请参阅",
  "Scan with your phone to get the app.": "使用手机扫码获取移动端应用。",
  "T3 Code app for iPhone and Android": "适用于 iPhone 与 Android 的 T3 Code 应用",
  "Checking T3 Connect…": "正在检查 T3 Connect…",
  "Could not check T3 Connect.": "无法检查 T3 Connect 状态。",
  "Check T3 Connect": "检查 T3 Connect",
  "Your phone can reach this computer. Sign in to the app with the same account.": "您的手机已可访问此电脑，请在手机应用中使用同一账号登录。",
  "T3 Connect is on, but the app cannot reach this computer.": "T3 Connect 已开启，但手机应用暂无法连接此电脑。",
  "Signed in. Share this computer so the app can reach it.": "已登录。请开启此电脑的远程共享以便手机应用连接。",
  "Sign in to T3 Connect here, then in the app with the same account.": "请先在此处登录 T3 Connect，随后在手机应用中使用同一账号登录。",
  "Could not save Codex setup": "无法保存 Codex 配置",
  "Add to PATH": "添加到 PATH",
  "New session": "新会话",
  "Your next message starts a fresh session": "您的下一条消息将开启全新会话",
  "The agent won't see earlier messages in this thread.": "智能体将不会看到此对话中的早期消息。",
  "Start a fresh session; earlier messages stay visible": "开启全新会话（早期消息仍保留在画面中供查阅）",
  "Background work": "后台任务",
  "Image attachment": "图片附件",
  "Could not apply model selection": "无法应用所选模型",
  "change model": "切换模型",
  "Restart and reclaim": "重启并回收空间",
  "Reclaim": "回收空间",
  "Reclaim ": "回收 ",
  "Search all threads...": "搜索所有对话...",
  "No threads found.": "未找到匹配的对话。",
  "Deleting the thread also deletes this task.": "删除该对话也会同时删除此定时任务。",
  "Stop this action when the thread settles": "当对话归置时自动停止此操作",
  "Closed issue": "已关闭的议题",
  "Mention a user": "提及用户 (@)",
  "Reference an issue or change request": "引用议题或变更请求",
  "Check this address": "检查此地址",
  "The linked item is not in the loaded activity.": "关联条目不在当前已加载的动态中。",
  "Showing access for": "当前显示的访问权限：",
  "Follow settings": "跟随设置",
  "Could not check provider updates": "无法检查提供商更新",
  "Access goes to": "访问权限将授予",
  "Only approve a sign-in you just started.": "请仅批准您刚刚亲自发起的登录请求。",
  "Sign-in code": "登录验证码",
  "Paste a code": "粘贴验证码",
  "Your T3 Connect account is out of tunnels.": "您的 T3 Connect 账号可用隧道配额已用尽。",
  "T3 Connect is not available in this build.": "当前构建版本不支持 T3 Connect。",
  "Which app?": "要连接哪个应用？",
  "Something else…": "其他应用…",
  "Apps that require their own client ID cannot connect.": "要求使用专属客户端 ID 的应用无法直接连接。",
  "Could not copy": "无法复制",
  "Use Set up another way.": "请改用“其他配置方式”。",
  "The code expired.": "验证码已过期。",
  "Use T3 Code in another app (MCP)": "在其他应用中使用 T3 Code (MCP)",
  "Use in another app (MCP)": "在其他应用中使用 (MCP)",
  "This sign-in link is incomplete": "此登录链接不完整",
  "For your safety, agent sign-ins cannot be approved inside another site.": "为了您的账号安全，不能在其他网站内嵌页面中批准智能体登录请求。",
  "Connecting to T3 Connect": "正在连接 T3 Connect",
  "One moment while your account loads.": "正在加载您的账号信息，请稍候。",
  "Sign in to approve": "登录以批准",
  "Sign in to T3 Connect with the account this environment is linked to.": "请使用与此环境关联的 T3 Connect 账号登录。",
  "Use a sign-in code instead": "改用登录验证码",
  "Use another account": "使用其他账号",
  "This image could not be loaded.": "无法加载此图片。",
  "Image unavailable. The file may have been moved or deleted.": "图片不可用，文件可能已被移动或删除。",
  "Click to zoom in or return to fit. Pinch or Ctrl+scroll to zoom, scroll or drag to pan. Use Enter to toggle zoom, plus or minus to zoom, and 0 to fit.": "点击可放大或恢复自适应大小。双指捏合或按住 Ctrl 滚动可缩放，滚动或拖拽可平移；按 Enter 切换缩放，按 +/- 调整比例，按 0 恢复自适应。",
  "Searching…": "正在搜索…",
  "This app cannot confirm it is one of your machines. The pairing code you paste is sent there.": "应用无法确认该地址是否属于您的设备，您粘贴的配对码将被发送至该地址。",

  // Split JSX array fragments in v0.1.8 & v0.1.9
  "OpenRouter no longer lists ": "OpenRouter 已不再提供 ",
  ". Dictation stays off until you choose another model.": "。在您选择其他模型前，语音听写将保持关闭。",
  " to use OpenRouter dictation.": " 以使用 OpenRouter 语音听写。",
  "Uses the API key saved on ": "使用保存在 ",
  ". This choice applies only to this device.": " 上的 API 密钥。此选择仅对当前设备生效。",
  "Ask an administrator on ": "请联系 ",
  " to add an API key.": " 的管理员添加 API 密钥。",
  "This environment can’t transcribe audio: ": "此环境无法转写音频：",
  " can’t transcribe audio locally. Choose a different destination.": " 无法在本地转写音频，请选择其他转写目标。",
  "Cloud via ": "云端（通过 ",
  "Models for ": "适用模型：",
  "% error)": "% 词错率)",
  "This deletes the API key stored on ": "这将删除保存在 ",
  ". Anything set to use this generator falls back to the text generation model.": " 上的 API 密钥。所有使用此生成器的功能都将回退至默认文本生成模型。",
  ". Switch any of these to it, or keep what they use now.": "。您可以将以下任意功能切换为使用该生成器，或保持它们当前的配置。",
  " answered. It works.": " 已成功响应，连接正常。",
  "Nothing reads from ": "当前没有任何配置读取自 ",
  "These read from ": "以下配置读取自 ",
  ". The secrets themselves are untouched.": "。密钥本身不会被修改或删除。",
  " and will be unset. The secrets themselves are untouched.": "，移除后将被清空重置。密钥本身不会被修改或删除。",
  "T3 Code on ": "位于 ",
  " stops, rebuilds its database, and starts again. It will be offline for about ": " 上的 T3 Code 将停止运行、重建数据库并重新启动，预计离线约 ",
  " min. Running agents stop when it restarts.": " 分钟。重启期间正在运行的智能体将会停止。",
  "Setting up ": "正在配置 ",
  "Looking for projects in your ": "正在从您的 ",
  " history…": " 历史记录中查找项目…",
  "Could not check projects again. ": "无法重新检查项目列表。",
  "Added to ": "已添加到 ",
  ". Open a new terminal to use ": "。请打开新终端以在任意位置使用 ",
  " from any terminal. Adds one line to": " 命令（将在以下配置文件中添加一行：",
  "Skip the install if you already have ": "如果您已安装 ",
  " is not found after installing, add the folder the installer names to your PATH.": " 安装后仍提示找不到命令，请将安装程序提示的目录添加到您的 PATH 环境变量中。",
  ". Microphone audio is sent there for transcription, as chosen in Voice settings.": "。根据“语音”设置中的选择，麦克风音频将发送至该处进行转写。",
  "Recommended for ": "推荐用于 ",

  // --- Comprehensive Voice, SpeechInput & Settings Fixes (v0.1.9) ---
  // Voice Settings (_chat.settings.voice & useEnvironmentSpeechInput)
  "System default follows your operating system. Record a ten-second test and play it back here. Test audio stays on this device and is never transcribed.": "“系统默认”将遵循您的操作系统设置。可录制一段 10 秒的测试音频并在此回放；测试音频仅保留在本机，绝不会进行语音转写。",
  "Transcription options": "语音转写选项",
  "Remove filler words": "移除口头禅（语气词）",
  "Remove filler words like “um” and “uh” from transcripts.": "从转写文本中移除“um”、“uh”等口头停顿词。",
  "Remove filler words like \"um\" and \"uh\" from transcripts.": "从转写文本中移除“um”、“uh”等口头停顿词。",
  "Pause recording": "暂停回放",
  "Play recording": "播放录音",
  "Updating the key keeps dictation enabled.": "更新密钥期间语音听写将保持启用状态。",
  "Remove key…": "移除密钥…",
  "Remove key": "移除密钥",
  "Save and enable": "保存并启用",
  "Save key": "保存密钥",
  "Manage OpenRouter dictation": "管理 OpenRouter 语音听写",
  "Manage OpenRouter": "管理 OpenRouter",
  "OpenRouter model": "OpenRouter 模型",
  "update server": "需更新服务器",
  "not benchmarked": "未参与基准测试",
  "Can write English text from speech in another language. Turn on Translate to English to use it.": "可将其他语言的语音直接转写为英文文本。开启“翻译为英文”即可使用。",
  "Using your file at ": "正在使用本地文件：",
  "Saved on the environment and used in every project there, along with each person’s own dictionary. Pick a project above to limit these words to one project.": "保存在当前环境中并应用于该环境下的所有项目（与每个人的个人词典合并生效）。在上方选择具体项目即可将这些词条仅限定于单个项目。",
  "Saved on the environment and used in every project there, along with each person's own dictionary. Pick a project above to limit these words to one project.": "保存在当前环境中并应用于该环境下的所有项目（与每个人的个人词典合并生效）。在上方选择具体项目即可将这些词条仅限定于单个项目。",
  "Cleanup model not saved": "未保存润色整理模型",
  "Connect an environment first.": "请先连接一个环境。",
  "Release the model’s memory on the environment after it sits idle.": "模型在环境中空闲指定时间后自动释放内存。",
  "Release the model's memory on the environment after it sits idle.": "模型在环境中空闲指定时间后自动释放内存。",
  "Downloaded only": "仅显示已下载",
  ", downloaded only": "（仅已下载）",
  "Path to a model file or folder already on this environment": "此环境中已有模型文件或文件夹的路径",
  "Say a sentence in the language above. Cleanup is skipped, so you see exactly what the model heard. The transcript stays on this page.": "请用上方所选语言说一句话。测试会跳过自动润色，直接展示模型识别到的原始文本；测试结果仅保留在当前页面。",
  "Close model test": "关闭模型测试",
  "Names and terms transcription should spell your way, saved on this device. Add an alias when it keeps hearing a term wrong. The name of the project you dictate in is also sent as a hint.": "希望语音转写按指定方式拼写的人名与专有术语（保存在当前设备）。若某个词经常被听错，可为其添加替换别名；听写所在项目的名称也会自动作为提示词发送。",
  "Fixes punctuation, numbers, and spoken corrections with the cleanup model on the draft’s environment. Sends the transcript and nearby draft text, never audio.": "使用草稿所属环境上的润色模型修正标点、数字和口头改口。仅发送转写文本及上下文草稿片段，绝不发送音频。",
  "Fixes punctuation, numbers, and spoken corrections with the cleanup model on the draft's environment. Sends the transcript and nearby draft text, never audio.": "使用草稿所属环境上的润色模型修正标点、数字和口头改口。仅发送转写文本及上下文草稿片段，绝不发送音频。",
  "Could not list microphones. You can still use the system default.": "无法获取麦克风列表，您仍可使用系统默认麦克风。",
  "your transcription environment": "您的语音转写环境",
  "Ready to dictate": "已就绪，可开始语音听写",
  "Set up voice input": "配置语音输入",
  "Starting download…": "正在开始下载…",
  "Download model": "下载模型",
  "Choose another model or language": "选择其他模型或语言",
  "Choose a model or language": "选择模型或语言",
  "Ask an environment admin to download": "请联系环境管理员下载模型",
  "Voice transcription is not prepared.": "语音转写尚未准备就绪。",
  "Microphone processing failed.": "麦克风音频处理失败。",
  "Microphone capture did not stop.": "麦克风采集未能正常停止。",
  "Voice transcription failed. Check the destination in Settings → Voice.": "语音转写失败，请在“设置 → 语音”中检查转写目标配置。",
  "Choose an OpenRouter model in Settings → Voice.": "请在“设置 → 语音”中选择一个 OpenRouter 模型。",
  "The draft's environment is unavailable for transcript cleanup.": "当前草稿所属环境不可用，无法执行转写文本润色。",
  "No model matches your language. Choose a model or change the language in Voice settings.": "没有匹配当前语言的模型。请在“语音”设置中选择模型或更改识别语言。",
  "Could not load transcription models. Check the connection and try again.": "无法加载语音转写模型列表，请检查连接后重试。",
  "Could not start voice input": "无法启动语音输入",
  "Could not start voice recording.": "无法开始语音录制。",
  "Could not send microphone audio.": "无法发送麦克风音频。",
  "Voice transcription on this environment failed.": "此环境上的语音转写失败。",
  "The draft changed while voice input was running. The transcript was not added.": "语音输入期间草稿已发生更改，未自动插入转写文本。",
  "The model is not ready. Try downloading it again.": "模型尚未就绪，请尝试重新下载。",
  "Could not download the model. Check this environment's connection and try again.": "无法下载模型，请检查此环境的网络连接后重试。",
  "The model downloaded, but this environment could not select it. Try again.": "模型已下载完成，但此环境无法选中该模型，请重试。",
  "Transcript cleanup failed": "转写文本润色失败",
  "The original transcript was added.": "已插入原始转写文本。",
  "Preparing voice input": "正在准备语音输入",
  "Could not update annotation voice input": "无法更新标注语音输入",

  // Settings: General, Chat, Labs, Providers, Source Control, Projects, Storage, Connections, Scheduled Tasks, Appearance, SnapShots
  "Clone into host folders": "按托管平台目录结构克隆",
  "Hide successful": "隐藏已成功项",
  "Hide all": "全部隐藏",
  "Hide the commands, edits, and searches agents run. Hide successful keeps failures. Zen shows only final answers. Approvals, questions, and errors always show.": "隐藏智能体执行的命令、编辑和搜索过程。“隐藏已成功项”仍会保留失败项；“简洁专注 (Zen)”仅显示最终回复。审批请求、提问和错误始终显示。",
  "Show folder threads on two lines: the title, then the branch, pull request, and agent.": "将文件夹下的对话分为两行显示：第一行显示标题，第二行显示分支、拉取请求和智能体。",
  "Show a predicted next message in the empty composer after a Claude or Codex turn. Tab uses it. Each is an extra cached request on your plan. Needs Codex 0.165+. Claude threads update on restart.": "在 Claude 或 Codex 完成一轮回复后，在空输入框中显示预测的下一条消息（按 Tab 采纳）。每次预测会消耗一次缓存请求额度；需 Codex 0.165+，Claude 对话将在重启后生效。",
  "Thread titles and other generated text": "对话标题及其他生成文本",
  "Commit messages, pull requests, and branch names": "提交说明、拉取请求与分支名称",
  "Writes thread titles, commit messages, and other short text without starting a coding agent. Your API key is stored on this environment.": "无需启动编码智能体即可生成对话标题、提交说明及其他短文本。您的 API 密钥保存在当前环境中。",
  "Save and continue": "保存并继续",
  "Failed to refresh providers": "刷新提供商失败",
  "Failed to save checkout grouping rule": "保存检出分组规则失败",
  "Failed to rename project": "重命名项目失败",
  "Failed to update project icon": "更新项目图标失败",
  "Approve the app on GitHub to finish signing in.": "请在 GitHub 上批准该应用以完成登录。",
  "Commit messages and pull request titles and descriptions match each project's history.": "使提交说明以及拉取请求的标题和描述自动契合各项目的历史风格。",
  "Commit and pull request writing": "提交与拉取请求撰写",
  " tool on the server host to enable change request features.": " 工具（在服务器主机上安装）以启用变更请求功能。",
  " Run the command on each machine to reclaim it. It restarts the background service. Quit the desktop app first if it hosts the environment.": " 请在每台机器上运行该命令以回收空间（将重启后台服务）。若当前桌面端承载该环境，请先退出桌面应用。",
  "Folder where new worktrees are created, on any drive, such as D:\\worktrees or ~/worktrees. Existing worktrees stay where they are. Leave empty to use the T3 home folder.": "新建工作树的存放目录（支持任意磁盘，例如 D:\\worktrees 或 ~/worktrees）。已有工作树保持原位不变；留空则使用 T3 主目录。",
  "T3 Code will restart without running a server on this computer. Any agents and terminals running here will stop, and other devices will no longer be able to connect to this computer. Your projects, history, and remote environments are unaffected.": "T3 Code 将重启并不再在此电脑上运行本地服务器。此处正在运行的智能体和终端将会停止，其他设备也将无法连接到此电脑；您的项目、历史记录和远程环境不受影响。",
  "T3 Code will restart and start running a server on this computer again.": "T3 Code 将重启并重新在此电脑上运行本地服务器。",
  "T3 Connect is out of sync. This environment is linked only to publish agent activity, so other devices cannot connect. Turn T3 Connect on to repair it.": "T3 Connect 状态未同步。此环境目前仅关联用于发布智能体动态，其他设备无法连接；请重新开启 T3 Connect 以修复连接。",
  "Run `t3 connect link` on the host, then restart T3 Code there.": "请在主机上运行 `t3 connect link`，然后重启该主机上的 T3 Code。",
  "T3 Code will restart on the Windows backend. Threads and projects opened against WSL stay safe inside the distro and become available again when you re-enable WSL.": "T3 Code 将切换至 Windows 后端并重启。在 WSL 中打开的对话和项目仍安全保存在对应发行版内，重新启用 WSL 后即可恢复访问。",
  "T3 Code will restart the WSL backend on the new distro. Sessions still running on the current distro will be interrupted.": "T3 Code 将在新发行版上重启 WSL 后端，当前发行版中仍在运行的会话将会中断。",
  "Enable this environment to open simulators and emulators, whether they run here or on a remote device host.": "允许此环境打开模拟器与仿真器（无论运行在本机还是远程设备主机上）。",
  "New thread each run": "每次运行新建对话",
  "One thread, continuing the conversation": "同一对话，延续历史上下文",
  "One thread, fresh session each run": "同一对话，每次开启全新会话",
  "Started by the first run": "由首次运行自动创建",
  "The first run starts a thread with the workspace and model below. Later runs continue that conversation.": "首次运行将使用下方的工作区和模型创建对话，后续运行将继续该对话。",
  "The first run starts a thread with the workspace and model below. Later runs post there, each in a fresh session without earlier runs' context.": "首次运行将使用下方的工作区和模型创建对话；后续运行仍发送到该对话中，但每次均开启不含历史上下文的全新会话。",
  "Each run starts a fresh session in this thread, without earlier runs' context.": "每次运行均在此对话中开启全新会话，不包含此前运行的上下文。",
  "Destination thread": "目标对话",
  "opened, reopened": "新建、重新打开时",
  "Open VSX search is unavailable right now.": "Open VSX 搜索服务当前不可用。",
  "Open VSX returned an unexpectedly large response.": "Open VSX 返回的响应体积超出预期。",
  "Open VSX returned an unreadable response.": "Open VSX 返回了无法解析的响应。",
  "Open VSX returned an unreadable search response.": "Open VSX 返回了无法解析的搜索响应。",
  "Open VSX theme details are unavailable right now.": "当前无法获取 Open VSX 主题详情。",
  "That VS Code theme has no \"editor.background\" color, so there is nothing to build a palette from.": "该 VS Code 主题未定义 \"editor.background\" 背景色，无法据此生成配色方案。",
  "Theme path is not a safe relative package path.": "主题路径不是安全的包内相对路径。",
  "Theme path escapes the extension package.": "主题路径超出了扩展包目录范围。",
  "That extension package has no ZIP directory.": "该扩展包缺少 ZIP 目录结构。",
  "That extension package has an invalid ZIP directory.": "该扩展包的 ZIP 目录结构无效。",
  "That extension package has too many files.": "该扩展包内包含的文件过多。",
  "That extension package has unsupported ZIP64 metadata.": "该扩展包使用了不受支持的 ZIP64 元数据。",
  "That extension package expands beyond the safe import limit.": "该扩展包解压后的大小超出了安全导入上限。",
  "That extension package has an unsafe compression ratio.": "该扩展包的压缩比异常，存在安全风险。",
  "Theme includes are nested too deeply.": "主题引用（include）嵌套层级过深。",
  "Theme includes contain a cycle.": "主题引用（include）存在循环依赖。",
  "That extension references too many theme files.": "该扩展引用了过多的主题文件。",
  "That Open VSX theme could not be downloaded.": "无法下载该 Open VSX 主题。",
  "That theme extension is too large to import safely.": "该主题扩展体积过大，无法安全导入。",
  "That Open VSX extension has no readable manifest.": "该 Open VSX 扩展缺少可读取的清单文件。",
  "That Open VSX extension manifest is too large.": "该 Open VSX 扩展的清单文件体积过大。",
  "That extension does not contain color themes.": "该扩展不包含任何颜色主题。",
  "That extension contains too many color themes to import safely.": "该扩展包含的颜色主题过多，无法安全导入。",
  "That Open VSX theme has no readable checksum.": "无法读取该 Open VSX 主题的校验和。",
  "That Open VSX checksum response is invalid.": "Open VSX 返回的校验和响应无效。",
  "That Open VSX theme has an invalid checksum.": "该 Open VSX 主题的校验和无效。",
  "That Open VSX theme failed its integrity check.": "该 Open VSX 主题未能通过完整性校验。",
  "That Open VSX extension package could not be opened.": "无法打开该 Open VSX 扩展包。",
  "That extension package does not match the selected Open VSX theme.": "该扩展包与所选的 Open VSX 主题不匹配。",
  "That extension package does not match its advertised license.": "该扩展包与其声明的许可证不符。",
  "One or more color themes in that extension could not be imported safely.": "该扩展中的一个或多个颜色主题无法安全导入。",
  "Last Seen": "最近出现时间",
  "A custom --config or NIRI_CONFIG can change its location.": "若使用了自定义 --config 或 NIRI_CONFIG，其配置文件路径可能有所不同。",
  "This setting is saved on a server, and the hosted app is not anchored to one. Change it from the desktop app or from the server's own address.": "此设置保存在服务器端，而当前网页端未绑定固定服务器。请在桌面端应用中，或通过服务器自身的访问地址修改此设置。",
  "Could not add t3 to PATH": "无法将 t3 添加到 PATH",
  "EAS host not removed everywhere": "未能从所有环境中移除 EAS 主机",
  "EAS host not saved everywhere": "未能在所有环境中保存 EAS 主机",
  "Simlock host not saved everywhere": "未能在所有环境中保存 Simlock 主机",
  "Simlock host not removed everywhere": "未能从所有环境中移除 Simlock 主机",
  "available on some": "部分环境可用",

  // Main Chat, Sidebar, Welcome, Connect, Provider Dialogs & Viewers
  "Clear color": "清除颜色",
  "Provider sign-in link": "提供商登录链接",
  "Could not send input to the provider sign-in terminal.": "无法向提供商登录终端发送输入。",
  "Remove connection": "移除连接",
  "Could not finish sign-in on this computer. Try again or paste the redirect URL below.": "无法在此电脑上完成登录。请重试，或在下方粘贴重定向 URL。",
  "Could not open the provider link.": "无法打开提供商链接。",
  "Could not load the sign-in terminal. Cancel and retry sign-in.": "无法加载登录终端，请取消后重新登录。",
  "Using ChatGPT plan": "正在使用 ChatGPT 订阅计划",
  "Fast and Ultrafast are unavailable with this ChatGPT connection. Use an existing Codex CLI login for speed options your account supports.": "当前 ChatGPT 连接不支持 Fast 与 Ultrafast 速度模式。请改用已有的 Codex CLI 登录以使用您账号支持的加速选项。",
  "You've reached your workspace's limit for using your ChatGPT plan in other apps.": "您所在的工作区已达到在第三方应用中使用 ChatGPT 订阅计划的额度上限。",
  "Codex feedback thread ID": "Codex 反馈对话 ID",
  "Keep the current session": "保留当前会话",
  "This thread has not loaded yet.": "此对话尚未加载完成。",
  "The side chat is no longer available.": "该侧边聊天已不可用。",
  "Could not set the side chat's permission mode.": "无法设置侧边聊天的权限模式。",
  "Could not start a side chat.": "无法启动侧边聊天。",
  "Could not send the side chat message.": "无法发送侧边聊天消息。",
  "Could not send the app's message.": "无法发送应用消息。",
  "Failed to compact context.": "压缩上下文失败。",
  "Thread actions unavailable": "对话操作暂不可用",
  "Message input": "消息输入框",
  "Terminal input": "终端输入",
  "Terminal scrollback": "终端回滚缓冲区",
  "Failed to move cursor": "移动光标失败",
  "Failed to clear terminal": "清空终端失败",
  "Failed to delete terminal input": "删除终端输入失败",
  "3D is unavailable on this browser": "当前浏览器不支持 3D 视图",
  "Failed to cancel clone": "取消克隆失败",
  "Failed to retry clone": "重试克隆失败",
  "Failed to resume goal.": "恢复目标任务失败。",
  "Failed to clear goal.": "清除目标任务失败。",
  "Update this server before starting multiple models.": "请先更新此服务器，然后再同时启动多个模型。",
  "Downloading it from the source failed.": "从源地址下载失败。",
  "Steer · waiting to be read": "引导指令 · 等待智能体读取",
  "Waiting for the agent to read this. It reads steers between steps, after a running command finishes.": "正在等待智能体读取此引导指令。智能体会在当前运行命令结束后、步骤切换之间读取引导消息。",
  "Attachment still uploading": "附件仍在上传中",
  "Attachments still uploading": "附件仍在上传中",
  "Set up one agent to start.": "请先配置一个智能体以开始使用。",
  "Set up an agent": "配置智能体",
  "Import projects and their threads": "导入项目及其对话记录",
  "From your ": "来自您的 ",
  "Use T3 Code on your phone": "在手机上使用 T3 Code",
  "See the": "请参阅",
  "Open this page in its own window": "在独立窗口中打开此页面",
  "Open Settings -> Source control": "打开“设置 -> 源代码管理”",
  "Read it before you send.": "请在发送前仔细检查内容。",
  "needs a newer desktop app": "需要更新版本的桌面端应用",
  "switch the Mac app on that Mac": "请在那台 Mac 上切换桌面端应用版本",
  "Delete the worktree too?": "是否同时删除工作树？",
  "pull request link": "拉取请求链接",
  "PR link copied": "已复制拉取请求链接",
  "Could not start update download": "无法开始下载更新",
  "Could not start without a project": "无法在未选择项目的情况下启动",
  "Sign in to T3 Connect before enabling this.": "启用此功能前请先登录 T3 Connect。",
  "Open chatgpt.com/plugins on the web, then + and Add custom MCP server.": "请在浏览器中打开 chatgpt.com/plugins，点击“+”并选择“Add custom MCP server”。",
  "Create it as a plugin, then install it.": "将其创建为插件并完成安装。",
  "Open the Control UI, then + and Plugins, and choose Add MCP server.": "打开控制面板 (Control UI)，依次点击“+”与“Plugins”，然后选择“Add MCP server”。",
  "Select Sign in for it under Settings → MCP.": "请在“Settings → MCP”下找到该项并选择“Sign in”。",
  "Run hermes mcp login t3code.": "请运行命令：hermes mcp login t3code。",
  "the app": "该应用",
  "another app": "其他应用",
  "Turn on": "开启",
  "Set up another way": "其他配置方式",
  "find in files": "在文件中查找",
  "Choose a folder on the other machine.": "请在另一台设备上选择文件夹。",
  "T3 Connect route added": "已添加 T3 Connect 路由",
  "Remove an attachment, then try this capture again.": "请先移除一个附件，然后再重新尝试捕获。",
  "The desktop app's primary local environment is not connected.": "桌面端应用的主本地环境尚未连接。",
  "Could not start linking": "无法启动关联流程",
  "T3 Connect timed out. Try again.": "连接 T3 Connect 超时，请重试。",
  "Could not reach T3 Connect. Check your network.": "无法连接到 T3 Connect，请检查网络。",
  "T3 Connect is unavailable. Try again.": "T3 Connect 暂不可用，请重试。",
  "Could not reach that environment through T3 Connect with this account.": "当前账号无法通过 T3 Connect 访问该环境。",
  "Could not check relay client availability.": "无法检查中继客户端可用状态。",
  "Could not confirm relay client installation.": "无法确认中继客户端安装状态。",
  "Could not install the relay client.": "无法安装中继客户端。",
  "Could not reach the environment.": "无法连接到该环境。",
  "Could not read environment cloud link state.": "无法读取环境的云端关联状态。",
  "Disconnected locally, but T3 Connect did not confirm it removed this environment": "已在本地断开关联，但 T3 Connect 未确认已移除此环境",
  "Could not obtain environment link proof.": "无法获取环境关联凭证。",
  "Could not configure environment relay access.": "无法配置环境中继访问。",
  "Connect this device to the internet. T3 Code reconnects on its own.": "请将此设备连接到互联网，T3 Code 会自动重新连接。",
  "Wait a moment. T3 Code retries on its own.": "请稍候，T3 Code 会自动重试连接。",
  "If it keeps waiting, reload or restart T3 Code on this device.": "如果持续处于等待状态，请在此设备上刷新或重启 T3 Code。",
  "A VPN, firewall, or ad blocker on this device can block T3 Connect.": "此设备上的 VPN、防火墙或广告拦截器可能会阻断 T3 Connect 连接。",
  "A VPN, firewall, or DNS filter on this device can block the tunnel.": "此设备上的 VPN、防火墙或 DNS 过滤软件可能会阻断隧道连接。",
  "Failed to load archived threads.": "加载已归档对话失败。",
  "Skipped a thread event type this client does not know.": "已跳过当前客户端版本暂不识别的对话事件类型。",
  "Guest links are off. Turn them on in Settings > Labs.": "访客链接功能已关闭，请在“设置 > 实验室”中开启。",
  "Failed to read the shared thread.": "读取共享对话失败。",
  "The guest link changed while it was being created.": "创建过程中访客链接发生了变更。",
  "Failed to stop the workflow.": "停止工作流失败。",
  "Failed to force stop the agent.": "强制停止智能体失败。",
  "Failed to read the subagent's work.": "读取子智能体执行结果失败。",
  "Could not update the link request.": "无法更新关联请求。",
  "Not installed on this machine.": "未安装在此设备上。",
  "Quit the browser first so its cookie database can be read.": "请先退出该浏览器，以便读取其 Cookie 数据库。",
  "Importing from this browser isn't possible on this platform.": "当前系统平台不支持从该浏览器导入数据。",
  "There is not enough free disk space on its device host.": "其设备主机上的可用磁盘空间不足。",
  "This server shares a process group with T3 Code, an agent, or a terminal shell, so it can't be stopped on its own.": "此服务器与 T3 Code、智能体或终端 Shell 共享同一进程组，无法单独停止。",
  "Stopping servers is not supported on this environment's platform.": "此环境所在的系统平台不支持停止服务器操作。",
  "Checking out files": "正在检出文件",
  "Check out files": "检出文件",
  "Run setup script": "运行初始化脚本",
  "Thread on another machine": "其他设备上的对话",
  "Hint: Try again. If it still fails, clock skew may be the cause; check that automatic date and time is enabled on both devices.": "提示：请重试。若仍然失败，可能是设备间时钟偏差所致，请检查两台设备是否均已开启自动日期与时间同步。",
  "Relay has no active link for this environment. If it was deregistered from T3 Connect, link it again on that machine.": "中继服务器没有此环境的有效关联记录。如果该环境已从 T3 Connect 注销，请在那台设备上重新关联。",
  "Ask to link": "请求关联",
  "Asking to link": "正在请求关联",
  "Asked to link": "已发送关联请求",
  "ask to link": "请求关联",
  "your server": "您的服务器",
  "Stopped watching": "已停止关注",
  "thread fork": "对话分支 (Fork)",
  "Download started": "已开始下载",
  "Image copied": "已复制图片",
  "Play video": "播放视频",
  "Back to reference ": "返回引用处 ",
  "Comment on selected text": "对所选文本发表评论",
  "Edit citation comment": "编辑引用评论",
  "Run in terminal": "在终端中运行",
  "Preview media": "预览媒体文件",
  "Preview annotation": "预览标注",
  "This connection cannot reveal files on this environment.": "当前连接无权在此环境中定位显示文件。",
  "Preview access is unavailable for this client.": "当前客户端无法使用预览访问功能。",
  "Environment is not connected.": "环境尚未连接。",
  "Preview limited to files under 50 MB.": "仅支持预览 50 MB 以内的文件。",
  "Preview limited to 1,000 pages.": "预览上限为 1,000 页。",
  "Preview limited to 2,000 pages. Save this PDF to read it in full.": "预览上限为 2,000 页，请保存此 PDF 文件以阅读完整内容。",
  "Preview limited: this Word document has too much expanded markup.": "预览受限：此 Word 文档包含过多展开标记。",
  "Next matching page": "下一个匹配页",
  "Previous page": "上一页",
  "Next page": "下一页",
  "Open issue": "打开议题 (Issue)",
  "Couldn't search users on the host": "无法在托管平台上搜索用户",
  "Couldn't search the host": "无法搜索托管平台",
  "Searching users...": "正在搜索用户...",
  "No matching users": "没有匹配的用户",
  "No matching issues or change requests": "没有匹配的议题或变更请求",
  "Failed to open diff file in editor.": "无法在编辑器中打开差异文件。",
  "Showing tracked changes. Untracked changes could not be loaded. Refresh to retry.": "当前仅显示已跟踪文件的更改；未能加载未跟踪文件，请刷新重试。",
  "Showing tracked changes. Checking untracked files...": "当前显示已跟踪文件的更改，正在检查未跟踪文件...",
  "Review submitted": "已提交评审",
  " loaded; open it on the host to read the rest.": " 已加载；请在代码托管平台上打开以阅读其余内容。",
  "The comment could not be saved": "无法保存评论",
  "The conversation could not be updated": "无法更新讨论状态",
  "Link update interrupted.": "关联更新已中断。",
  "hide empty description": "隐藏空白描述",
  "Could not load earlier turns. Try again.": "无法加载更早的对话轮次，请重试。",
  "Something went wrong. Try again.": "出了点问题，请重试。",
  "Refresh failed.": "刷新失败。",
  "Missing data URL payload.": "缺少 Data URL 数据内容。",
  "This inline media could not be decoded.": "无法解码此内联媒体文件。",
  "This link returned a web page instead of media. Open the original URL.": "此链接返回的是网页而非媒体文件，请直接打开原始链接。",
  "The browser could not decode this image for copying. Try saving it instead.": "浏览器无法解码此图片以进行复制，请尝试直接保存图片。",
  "This image is too large or has no usable dimensions. Try saving it instead.": "此图片尺寸过大或缺少有效宽高信息，请尝试直接保存图片。",
  "Image copying is unavailable in this browser.": "当前浏览器不支持复制图片。",
  "The image could not be converted to PNG.": "无法将该图片转换为 PNG 格式。",
  "Reconnect to this environment and open the media again.": "请重新连接此环境后再打开该媒体文件。",
  "Unexpected Android fold response.": "收到异常的 Android 折叠状态响应。",
  "Could not read the device accessibility tree.": "无法读取设备的无障碍组件树。",
  "This browser cannot play this device's WebRTC stream.": "当前浏览器无法播放此设备的 WebRTC 视频流。",
  "This browser cannot receive the device's WebRTC stream.": "当前浏览器无法接收此设备的 WebRTC 视频流。",
  "This Device Hub does not provide fixed Duo display feeds.": "此设备中心 (Device Hub) 不提供固定的双屏画面流。",
  "Device stream stopped receiving video. Reconnecting…": "设备画面流已中断，正在重新连接…",
  "Device stream stalled. Reconnecting…": "设备画面流卡顿停滞，正在重新连接…",
  "Device stream connection failed. Reconnecting…": "设备画面流连接失败，正在重新连接…",
  "Device stream found no network candidates yet. Retrying…": "设备画面流暂未发现可用网络候选路径，正在重试…",
  "Device stream returned an invalid answer. Retrying…": "设备画面流返回了无效的握手应答，正在重试…",
  "This browser cannot decode the Android stream (WebCodecs unavailable).": "当前浏览器无法解码 Android 画面流（WebCodecs 不可用）。",
  "This browser cannot decode this device's stream (WebCodecs unavailable).": "当前浏览器无法解码此设备的画面流（WebCodecs 不可用）。",
  "Vocabulary": "自定义词库",
  "Voice input failed": "语音输入失败",
  "Speech options are too large.": "语音配置参数体积过大。",
  "Live transcription stopped responding.": "实时语音转写已停止响应。",
  "Voice consent was revoked.": "语音使用授权已被撤销。",
  "Unexpected speech stream response.": "收到异常的语音流响应。",
  "Invalid speech stream response.": "无效的语音流响应。",
  "The voice connection closed. Please record again.": "语音连接已断开，请重新录音。",
  "Could not connect to live transcription.": "无法连接到实时语音转写服务。",
  "Voice recordings are limited to five minutes.": "单次语音录音最长不超过 5 分钟。",
  "Could not finish live transcription.": "无法完成实时语音转写。",

  // --- v0.1.10 & v0.1.11 Curated Additions & Chinglish Fixes ---
  "Thinking Level": "思考深度",
  "Thinking level": "思考深度",
  "Effort Level": "思考强度",
  "Effort level": "思考强度",
  "Reasoning Effort": "推理强度",
  "Reasoning effort": "推理强度",
  "Thinking Budget": "思考预算",
  "Squash and merge": "压缩并合并",
  "Rebase and merge": "变基并合并",
  "Auto-merge (squash and merge)": "自动合并（压缩并合并）",
  "Auto-merge (rebase and merge)": "自动合并（变基并合并）",
  "Auto-merge (merge commit)": "自动合并（合并提交）",
  "Auto-merge (fast-forward)": "自动合并（快进合并）",
  "connection diagnostics": "连接诊断信息",
  "update command": "更新命令",
  "relaunch command": "重启命令",
  "terminal selection": "终端选中内容",
  "admin request": "管理员请求",
  "branch name": "分支名称",
  "failed message": "失败消息",
  "pull request link": "拉取请求链接",
  "Unable to link pull request": "无法关联拉取请求",
  "Unable to unlink pull request": "无法取消关联拉取请求",
  "Custom commit and pull request instructions for all selected environments": "所有所选环境共用的自定义提交与拉取请求说明",
  "Clipboard API is unavailable while copying pull request link.": "复制拉取请求链接时剪贴板 API 不可用。",
  "Failed to copy pull request link to the clipboard.": "无法将拉取请求链接复制到剪贴板。",
  "Pull request routing preferences are unavailable on this client.": "此客户端暂不支持拉取请求路由偏好设置。",
  "a linked environment": "已关联环境",
  "this environment": "当前环境",
  "a selected environment": "所选环境",
  "the primary environment": "主环境",
  "the workspace": "当前工作区",
  "Delegated from a linked environment. Connect to it to open the parent thread.": "由已关联环境委派。连接到该环境即可打开父会话。",
  "This connection cannot change projects in this environment.": "此连接无法修改当前环境中的项目。",
  "This model is unavailable on a selected environment. Select that environment to choose its model separately.": "此模型在所选环境上不可用。请单独选择该环境以配置其模型。",
  "This connection lacks permission to change settings on the primary environment.": "此连接无权修改主环境上的设置。",
  "The account shorthand, sign-in address without https://, or ID that op account list shows.": "即 `op account list` 显示的账号简称、不含 https:// 的登录地址或账号 ID。",
  "Additional CLI arguments passed to codex app-server on session start.": "会话启动时传递给 `codex app-server` 的额外命令行参数。",
  "Path to the Muse Code binary on this environment. Sign in with muse login on that host.": "当前环境上 Muse Code 可执行文件的路径。请在该主机上运行 `muse login` 登录。",
  "Additional CLI arguments passed to pi --mode rpc on session start.": "会话启动时传递给 `pi --mode rpc` 的额外命令行参数。",
  "Run hermes mcp login t3code.": "请运行 `hermes mcp login t3code`。",
  "The environment's server signs in to Expo and starts the sessions. Without a token here it uses EXPO_TOKEN, then its eas login.": "环境的服务器将登录 Expo 并启动会话。若此处未填写令牌，将优先使用 `EXPO_TOKEN`，其次使用其 `eas login` 登录状态。",
  "Could not finish sign-in on this computer. Try again.": "无法在此电脑上完成登录，请重试。",
  "OpenCode agent name": "OpenCode 智能体名称",
  "Could not list ACP providers": "无法获取 ACP 提供商列表",
  "Sensitive values are stored separately and never returned to the app. Enter a new value to rename a saved one or make it plain text.": "敏感值将独立存储且绝不会返回给应用。如需重命名已保存的值或改为明文，请输入新值。",
  "This instance uses": "此实例使用",
  "Shadow home path": "影子主目录路径",
  "Account-specific home sharing the Codex state above.": "共享上方 Codex 状态的账号专属主目录。",
  "This instance uses the shared Codex home directly.": "此实例直接使用共享的 Codex 主目录。",
  "Codex shadow home path": "Codex 影子主目录路径",
  "Not used": "未使用",
  "No device has connected through T3 Connect yet.": "尚无设备通过 T3 Connect 连接。",
  "link several environments": "关联多个环境",
  "Link several…": "批量关联…",
  "Link several environments": "关联多个环境",
  "Machines": "设备主机",
  "Machine": "设备主机",
  "Checking which machines are already linked…": "正在检查哪些设备已关联…",
  "Agents here can then launch, message and wait on threads there. It appears under Authorized clients in that environment's Sharing & access, where it can be revoked.": "配置后，当前环境的智能体即可在目标环境启动、发送消息并等待会话结果。该连接会显示在目标环境“共享与访问”的“已授权客户端”中，可随时撤销。",
  "Sign-in refused": "登录被拒绝",
  "The host refused this device's sign-in. Pair this address again with Add route.": "主机拒绝了此设备的登录请求。请通过“添加路由”重新配对该地址。",
  "Require approval for new devices": "新设备连接需审批",
  "The device has to be approved here before it can connect again.": "该设备必须先在此处获批后才能再次连接。",
  "Reading device settings…": "正在读取设备设置…",
  "Insufficient spend permission": "消费额度权限不足",
  "Redirecting to Coinbase Wallet...": "正在跳转至 Coinbase Wallet...",
  "Already available locally": "本地已就绪",
  "Check account": "检查账号",
  "Expo Simulators needs a paid Expo account. A session runs for up to 115 minutes and stops early when it is idle for the idle minutes, so idle minutes must be less than session minutes.": "Expo 模拟器需要付费 Expo 账号。单次会话最长运行 115 分钟，若连续空闲达到设定的空闲分钟数则会提前结束，因此空闲时长必须小于会话总时长。",
  "Saving restarts this host and stops its running sessions.": "保存后将重启此主机并停止其正在运行的会话。",
  "Issues": "议题",
  "Closes this issue": "关闭此议题",
  "Load older comments": "加载更早的评论",
  "Nothing has happened here yet.": "此处暂无动态。",
  "Assignee": "负责人",
  "The labels could not be read": "无法读取标签列表",
  "The people could not be read": "无法读取成员列表",
  "No trackers to read": "暂无可读取的问题跟踪器",
  "Nothing matches that.": "没有匹配的结果。",
  "No issues under these filters.": "当前筛选条件下没有议题。",
  "The page asks for a file.": "页面请求选择文件。",
  "Forward to this machine, for any app here": "转发到此设备（供本机任意应用访问）",
  "Then": "然后",
  "Overview": "概览",
  "Find on page": "在页面中查找",
  "Enter a valid value. It was not saved.": "请输入有效的值，更改尚未保存。",
  "Save current view…": "保存当前视图…",
  "Update saved view": "更新已保存视图",
  "Rename view…": "重命名视图…",
  "Save your search, filters, and sort order on this device.": "在此设备上保存当前的搜索词、筛选条件与排序方式。",
  "View name": "视图名称",
  "System default follows your browser or OS language.": "“系统默认”将跟随您的浏览器或操作系统语言设置。",
  "Saved with this theme and included when you export it. Web and desktop only. Rules that load remote files are ignored.": "随当前主题一并保存并在导出时包含（仅限网页端与桌面端；加载远程文件的规则将被忽略）。",
  "Includes a 1.2 MB silence detector.": "包含 1.2 MB 的静音检测模型。",
  "That microphone is unplugged. Pick another one.": "该麦克风已断开连接，请选择其他麦克风。",
  "Voice settings": "语音设置",
  "Speed: not benchmarked": "速度：暂无基准测试数据",
  "CPU average": "CPU 平均占用",
  "I/O reads": "I/O 读取",
  "I/O writes": "I/O 写入",
  "Span": "调用跨度",
  "Stored on the server.": "保存在服务器端。",
  "Offer when adding or publishing a project": "在添加或发布项目时提供此选项",
  "save source control providers": "保存源代码管理提供商",
  "Reaches every repository your Atlassian account can. Give it read and write access to repositories and pull requests, plus read:user:bitbucket and read:workspace:bitbucket.": "可访问您 Atlassian 账号权限范围内的所有仓库。请授予仓库和拉取请求的读写权限，以及 read:user:bitbucket 与 read:workspace:bitbucket 权限。",
  "Save it to open in an app that supports this format files.": "请将其保存后使用支持此格式的应用打开。",
  "Grok, Composer, and Auto use this allowance.": "Grok、Composer 与 Auto 共享此额度。",
  "Usage allowance for third-party models such as Claude, GPT, and Gemini.": "Claude、GPT、Gemini 等第三方模型的用量额度。",
  "This app has no address for a machine that another machine can reach. Enter its https or Tailscale address.": "当前应用没有可供其他设备访问的本机地址。请输入其 HTTPS 或 Tailscale 地址。",
  "T3 Connect is on for this computer. Sign in to the app with the same account.": "此电脑已开启 T3 Connect。请使用同一账号登录应用。",
  "· name set by the app": "· 名称由应用指定",
  "Custom...": "自定义...",
  "Custom…": "自定义…",
  "In 1 hour": "1 小时后",
  "In 2 hours": "2 小时后",
  "In 3 hours": "3 小时后",
  "In 4 hours": "4 小时后",
  "This evening": "今天晚上",
  "Tonight": "今晚",
  "Follow settings": "跟随设置",
  "Auto-settle behavior": "自动归置行为",
  "Wake thread": "唤醒对话",
  "Un-settle thread": "取消归置对话",
  "Settle thread": "归置对话",
  "Turn into project": "转为独立项目",
  "Share with guest": "分享给访客",
  "Copy mention": "复制 @引用",
  "Add to chat": "添加到对话",
  "Open in file viewer": "在文件查看器中打开",
  "Preview media": "预览媒体文件",
  "Close others": "关闭其他标签页",
  "Close to the right": "关闭右侧标签页",
  "Close all": "关闭全部标签页",
  "Open with": "打开方式",
  "Discard draft": "丢弃草稿",
  "Code from the Antigravity page": "来自 Antigravity 页面的授权码",
  "Claude API Key": "Claude API 密钥",
  "Kiro account": "Kiro 账号",
  "Grok account": "Grok 账号",
  "Weekly reset": "每周重置",
  "Fable reset": "Fable 额度重置",
  "Full reset": "完全重置",
  "change request": "变更请求",
  "Close permission helper": "关闭权限助手",
  "↑ Drag T3 Code into the list above": "↑ 将 T3 Code 拖入上方列表中",
  "Drag T3 Code to System Settings, or click to reveal in Finder": "将 T3 Code 拖入系统设置，或点击在访达中显示",
  "Unnamed passkey": "未命名通行密钥",
  "No trusted authority issued this certificate.": "此证书并非由受信任的证书颁发机构签发。",
  "This certificate is not for this address.": "此证书与当前访问地址不匹配。",
  "This certificate has expired or is not valid yet.": "此证书已过期或尚未生效。",
  "Trust and Remember": "信任并记住",
  "Trust it only if you know this certificate belongs to the site. Clearing this browser profile's cookies forgets it.": "请仅在确认此证书属于该网站时选择信任。清除此浏览器配置的 Cookie 将取消信任记忆。",
  "T3 Code could not save this approval, so the page stays blocked. Check that the disk is not full and its data folder is writable, then try again.": "T3 Code 无法保存此信任授权，页面仍处于拦截状态。请检查磁盘空间未满且数据目录可写后重试。",
  "Browser preview": "浏览器预览",
  "WSL backend is still unavailable": "WSL 后端仍不可用",
  "T3 Code will use the Windows backend for this launch and retry WSL the next time the app starts.": "本次启动将改用 Windows 后端，并在下次启动时重新尝试连接 WSL。",
  "WSL backend couldn't start": "无法启动 WSL 后端",
  "Falling back to the Windows backend so T3 Code can open. Re-enable the WSL backend from Settings > Sharing & access once the WSL distro is fixed.": "已回退至 Windows 后端以确保 T3 Code 正常打开。修复 WSL 发行版后，可在“设置 > 共享与访问”中重新启用 WSL 后端。",
  "This T3 home is unavailable": "此 T3 主目录不可用",
  "Desktop config": "桌面端配置",
  "A new version of T3 Code is available.": "发现新版本 T3 Code。",
  "A new version of T3 Code is already downloading.": "新版本 T3 Code 正在下载中。",
  "A new version of T3 Code is ready to install.": "新版本 T3 Code 已准备就绪，可供安装。",
  "T3 Code will restart to install it. Any running tasks will be interrupted.": "T3 Code 将重启以完成安装，正在运行的任务将被中断。",
  "Checking for a newer version…": "正在检查新版本…",
  "Get a different version from the releases page.": "从版本发布页面获取其他版本。",
  "Open releases": "打开发布页面",
  "Your organization's managed policy stopped T3 Code from starting. Send the details below to your IT administrator.": "您所在组织的托管策略阻止了 T3 Code 启动。请将下方详情发送给 IT 管理员。",
  "The server wrote no output.": "服务端未输出任何日志。",
  "T3 Code failed to start": "T3 Code 启动失败"
};

const baseExactMap = {
  ...v0111.exact,
  ...b4,
  ...b3,
  ...b2,
  ...b1,
  ...mainUtils.exact,
  ...curatedExact
};

const baseTemplateMap = {
  ...v0111.templates,
  ...tmpl4,
  ...mainUtils.templates,
  "New thread on ${}": "在 ${} 上新建对话",
  "Filter by ${}": "按 ${} 筛选",
  "Open on ${}": "在 ${} 上打开",
  "Could not open in ${}": "无法在 ${} 中打开",
  "${} wants to continue in Base Account": "${} 请求使用 Base 账号继续",
  "Reset ${} to default": "将 ${} 重置为默认值",
  "Reconnect ${} to change its settings.": "重新连接 ${} 以更改其设置。",
  "${} requires a supporting environment. Choose one to continue.": "${} 需要支持该功能的环境。请选择一个环境以继续。",
  "${} requires a supporting environment. Connect or update an environment to continue.": "${} 需要支持该功能的环境。请连接或更新环境以继续。",
  "${} is not available for the selected target. Choose its owning scope to continue.": "${} 对当前所选目标不可用。请选择其所属范围以继续。",
  "About ${}": "关于 ${}",
  "Hide ${}": "隐藏 ${}",
  "Quit ${}": "退出 ${}",
  "Usage: ${}": "用量：${}",
  "Usage: Period: ${}": "用量：统计周期：${}",
  "Run Script: ${}": "运行脚本：${}",
  "Unknown condition: ${}": "未知条件变量：${}",
  "Unknown conditions: ${}": "未知条件变量：${}",
  "Conflicts with ${}.": "与“${}”存在快捷键冲突。",
  "Negate ${}": "对 ${} 取反 (!)",
  "yesterday at ${}": "昨天 ${}",
  "tomorrow at ${}": "明天 ${}",
  "Expires in ${}": "${}后过期",
  "${} server": "${} 服务器",
  "You don't have ${}": "您尚未配置 ${}",
  "Stack ${}, layer ${} of ${}": "堆栈 ${}，第 ${} / ${} 层",
  "Searching every host for “${}”": "正在所有主机中搜索“${}”",
  "Actions for ${}": "“${}”的操作",
  "More actions for ${}": "“${}”的更多操作",
  "File options for ${}": "“${}”的文件选项",
  "Show ${} in the model picker": "在模型选择器中显示 ${}",
  "Permanently delete native ACP session \"${}\"?": "永久删除原生 ACP 会话“${}”？",
  "Disable ACP provider \"${}\"?": "禁用 ACP 提供商“${}”？",
  "Select ${}": "选择 ${}",
  "Enable ${}": "启用 ${}",
  "Connect ${}": "连接 ${}",
  "Save ${}": "保存 ${}",
  "Update ${}": "更新 ${}",
  "Zoom ${}": "缩放 ${}",
  "Model: ${}": "模型：${}",
  "${} Workspace": "${} 工作区",
  "${} MB download.": "需下载 ${} MB。",
  "Reset the ${} provider to its defaults?": "将 ${} 提供商重置为默认设置？",
  "T3 Code already uses this for \"${}\".": "T3 Code 已将此快捷键用于“${}”。",
  "${} maps this model. Remove it from \"Apply to\" or clear its mapping first.": "${} 已映射此模型。请先将其从“应用于”中移除或清除其映射。",
  "Today, ${}": "今天，${}",
  "${}, selected": "${}（已选）",
  "${} to undo": "按 ${} 撤销",
  "Not back after ${} minutes": "超过 ${} 分钟仍未恢复",
  "This app: ${}": "当前应用：${}",
  "${}. Show where this value comes from": "${}。查看此设置值的来源",
  "${} accounts and token": "${} 账号与令牌",
  "${} credentials": "${} 凭据",
  "${}: No accounts reported.": "${}：未报告任何账号。",
  "${} additions, ${} deletions": "${} 处新增，${} 处删除",
  "${} Start a new thread to use this model.": "${} 请新建对话以使用此模型。",
  "Workflow started: ${}": "工作流已启动：${}",
  "${} reopened": "${} 已重新打开",
  "Path: ${}": "路径：${}",
  "Environment: ${}": "环境：${}",
  "This removes ${} grouped project entries.": "这将移除 ${} 个分组项目条目。",
  "${} is not authenticated. Open Source Control settings for setup guidance.": "${} 尚未认证。请打开“源代码管理”设置查看配置指南。",
  "${} is not configured.": "${} 尚未配置。",
  "${} of ${} running": "${} / ${} 运行中",
  "${} of ${} awaiting action": "${} / ${} 等待处理",
  "${} of ${} failing": "${} / ${} 未通过",
  "${} of ${} passing": "${} / ${} 已通过",
  "${} of ${} failed": "${} / ${} 失败",
  "${}: Disabled in settings.": "${}：已在设置中禁用。",
  "${} provider is unavailable.": "${} 提供商不可用。",
  "${} provider has limited availability.": "${} 提供商可用性受限。",
  "${} is unauthenticated": "${} 尚未登录认证",
  "${} provider status": "${} 提供商状态",
  "Refresh ${} provider status": "刷新 ${} 提供商状态",
  "${} is unavailable in this thread. Start a new thread to switch providers.": "当前对话无法使用 ${}。请新建对话以切换提供商。",
  "${} Select one environment or choose a shared model to edit effort.": "${} 请选择单个环境或选择共享模型以修改思考强度。",
  "Connect ${} and try again.": "请连接 ${} 后再试。",
  "This connection cannot change projects in ${}.": "此连接无法修改 ${} 中的项目。",
  "Confirm deregistration of ${}": "确认注销 ${}",
  "This will reset: ${}.": "这将重置：${}。",
  "${} (one environment)": "${}（单个环境）",
  "${} Shared policy: ${}.": "${} 共享策略：${}。",
  "${} Switch this task to a time or an interval, or turn it off, to save it.": "${} 请将此任务切换为定时或间隔触发，或将其关闭后再保存。",
  "Thread details: ${} of ${} on": "对话详情：已开启 ${} / ${} 项",
  "Premier · up to ${} tunnels": "Premier · 最多支持 ${} 条隧道",
  "Remove ${} from this device?\nThis forgets its pairing, credentials, and cached threads here. Switch it off instead to keep it saved.": "要从此设备移除 ${} 吗？\n这将清除其在此处的配对信息、凭据和缓存对话。如需保留配置，请直接将其关闭。",

  // --- v0.1.8 & v0.1.9 New Templates ---
  "Voice · ${}": "语音 · ${}",
  "${} API key": "${} API 密钥",
  "${} API key reference": "${} API 密钥引用",
  "Remove the ${} key?": "确定要移除 ${} 密钥吗？",
  "Everyone using ${} for dictation on ${} will lose access.": "在 ${2} 上使用 ${1} 进行语音听写的所有用户都将失去访问权限。",
  "Stop using your ${} file; the file stays on disk": "停止使用您的 ${} 模型文件（原文件仍保留在磁盘上）",
  "Saved with ${} on its environment. Everyone who dictates in this project gets these spellings, along with their own dictionary. Project spellings win when the two overlap.": "随 ${} 保存在其所属环境中。在此项目中使用语音听写的所有成员都会共享这些拼写词条（同时保留各自的个人词典）；当两者冲突时，以项目词典为准。",
  "Sort and filter models: ${}": "排序与筛选模型：${}",
  "${} download progress": "${} 下载进度",
  "Cancel ${} download": "取消下载 ${}",
  "${}% downloaded": "已下载 ${}%",
  "Best ${} accuracy": "${}识别准确率最高",
  "Delete ${}": "删除 ${}",
  "Add a word or phrase to the ${}": "向${}添加词语或短语",
  "Alias for ${}": "${} 的替换别名",
  "Add an alias for ${}": "为 ${} 添加替换别名",
  "Manage ${} key": "管理 ${} 密钥",
  "Use ${} for dictation?": "要将 ${} 用于语音听写吗？",
  "Anyone with dictation access to ${} can bill this key.": "任何拥有 ${} 语音听写访问权限的用户都将消耗此密钥额度。",
  "Anyone with dictation access to ${} can use this API key.": "任何拥有 ${} 语音听写访问权限的用户都可使用此 API 密钥。",
  "${} via ${}": "${}（通过 ${}）",
  "Couldn't load ${} models": "无法加载 ${} 模型列表",
  "Set up: ${}": "配置：${}",
  "Re-authorize ${}": "重新授权 ${}",
  "T3 Code there restarts and is back in about ${} min.": "该设备上的 T3 Code 将重启，预计约 ${} 分钟后恢复连接。",
  "Copy URL and open ${}": "复制链接并打开 ${}",
  "Copy message and open ${}": "复制消息并打开 ${}",
  "What can ${} do?": "${} 可以执行哪些操作？",
  "save ${} settings": "保存 ${} 设置",
  "save ${} account settings": "保存 ${} 账号设置",
  "sign out of ${}": "退出登录 ${}",
  "save ${} token": "保存 ${} 令牌",
  "${} token": "${} 令牌",
  "${} detects the language automatically.": "${} 可自动识别语言。",
  "${} uses one fixed language.": "${} 使用单一固定语言。"
};

// Purge overly broad / destructive templates that mangle multi-word sentences or internal errors
// (Numeric/count forms like Turn 1, Page 2, 3 files, 5 entries are handled strictly in Step 4 fast-paths)
const BANNED_TEMPLATES = new Set([
  "${} on ${}",
  "${} changed ${}",
  "Changed ${}",
  "Changed ${} ${}",
  "Expected ${}",
  "Expected ${}, got ${}",
  "Failed to ${}",
  "Invalid data ${}",
  "block ${}",
  "Turn ${}",
  "Page ${}",
  "Line ${}",
  "Week ${}",
  "Cell ${}",
  "Option ${}",
  "Argument ${}",
  "Thread ${}",
  "Message ${}",
  "Read ${} ${}",
  "Read ${}${}",
  "Received ${} ${}",
  "Skipped ${}",
  "Tried to ${}",
  "Declined to ${}",
  "${} files",
  "${} environments",
  "${} providers",
  "${} entries",
  "${} pages",
  "${} sheets",
  "${} slides",
  "${} notices",
  "${} results",
  "${} conversations",
  "${} earlier changes",
  "${} languages",
  "${} queued",
  "${} selected"
]);

export function compileRuntimeSource({ extraExact = {}, extraTemplates = {} } = {}) {
  const exactMap = {
    ...extraExact,
    ...baseExactMap
  };
  for (const [k, v] of Object.entries(exactMap)) {
    if (!v || k === v || typeof v !== "string") {
      delete exactMap[k];
    }
  }

  const templateMap = {
    ...extraTemplates,
    ...baseTemplateMap
  };
  for (const k of BANNED_TEMPLATES) {
    delete templateMap[k];
  }
  for (const [k, v] of Object.entries(templateMap)) {
    if (!v || k === v || typeof v !== "string" || !k.includes("${}")) {
      delete templateMap[k];
    }
  }

  console.log("Merged exactMap entries:", Object.keys(exactMap).length);
  console.log("Merged templateMap entries:", Object.keys(templateMap).length);

  // Build template rules with prefix/suffix fast-path filters & literal-skeleton specificity
  const templateRules = [];
  for (const [tmpl, zhTmpl] of Object.entries(templateMap)) {
    const parts = tmpl.split("${}");
    if (!parts.some(p => /[A-Za-z]{2,}/.test(p))) continue;
    const escParts = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    let pattern = "^";
    for (let i = 0; i < escParts.length; i++) {
      pattern += escParts[i];
      if (i < escParts.length - 1) {
        pattern += (i === escParts.length - 2 && escParts[i + 1] === "") ? "(.+)" : "(.+?)";
      }
    }
    pattern += "$";
    const prefix = parts[0] || "";
    const suffix = parts[parts.length - 1] || "";
    let longestLit = "";
    let litLetters = 0;
    for (const p of parts) {
      if (p.length > longestLit.length) longestLit = p;
      const m = p.match(/[A-Za-z]/g);
      if (m) litLetters += m.length;
    }
    const hasQuotedSlot =
      /["'“‘`]\$\{\}["'”’`]/.test(tmpl) ||
      /^(?:Actions|More actions|File options|Run Script|Unknown conditions?|Negate|Alias for|Add an alias for|Cancel|Confirm deregistration of|What can|New thread on|Filter by|Open on|Could not open in|Branch:|Push to|Checks:|Searched|Cloning|Running|Editing|Forget|Unmute|Authenticated ·|Not authenticated ·)/.test(tmpl);
    templateRules.push({
      p: pattern,
      r: zhTmpl,
      pre: prefix.slice(0, 12),
      suf: suffix.slice(-12),
      mid: longestLit,
      lit: litLetters,
      q: hasQuotedSlot ? 1 : 0
    });
  }

  templateRules.sort((a, b) => b.mid.length - a.mid.length || b.lit - a.lit);
  console.log("Compiled templateRules:", templateRules.length);

  return `// T3 Code Simplified Chinese (zh-CN) Localization Runtime
(() => {
  if (globalThis.__t3I18nInitialized) return;
  globalThis.__t3I18nInitialized = true;

  const LOCALE_STORAGE_KEY = "t3code:locale";
  const GT_BOOT_SYNC_KEY = "__t3code:gt-boot-synced";
  const REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");

  function getLocale() {
    try {
      const saved = globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY);
      if (saved === "en" || saved === "zh-CN") return saved;
    } catch {}
    return "zh-CN";
  }

  async function syncNativeClientLanguage(targetZh) {
    try {
      const bridge = globalThis.desktopBridge;
      if (!bridge?.getClientSettings || !bridge?.setClientSettings) return false;
      const settings = await bridge.getClientSettings();
      if (!settings || typeof settings !== "object") return false;
      const desired = targetZh ? "zh" : "en";
      if (settings.language === desired) return false;
      await bridge.setClientSettings({ ...settings, language: desired });
      return true;
    } catch {
      return false;
    }
  }

  function setLocale(nextLocale) {
    const normalized = nextLocale === "en" ? "en" : "zh-CN";
    try {
      globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, normalized);
    } catch {}
    try {
      globalThis.desktopBridge?.setUiLocale?.(normalized);
    } catch {}
    syncNativeClientLanguage(normalized !== "en").finally(() => {
      if (typeof window !== "undefined" && window.location) {
        window.location.reload();
      }
    });
  }

  function toggleLocale() {
    setLocale(getLocale() === "en" ? "zh-CN" : "en");
  }

  globalThis.__t3GetLocale = getLocale;
  globalThis.__t3SetLocale = setLocale;

  // Bidirectional sync between T3 Code native language setting (v0.1.10+ gt-react) and t3code:locale
  try {
    if (typeof window !== "undefined") {
      window.addEventListener("DOMContentLoaded", () => {
        try {
          globalThis.desktopBridge?.setUiLocale?.(getLocale());
        } catch {}

        // Initial check against T3 Code client-settings.json
        (async () => {
          try {
            const bridge = globalThis.desktopBridge;
            if (!bridge?.getClientSettings || !bridge?.setClientSettings) return;
            const s = await bridge.getClientSettings();
            if (!s || typeof s !== "object") return;
            const cur = getLocale();
            if (cur === "zh-CN" && (!s.language || s.language === "system")) {
              if (!globalThis.sessionStorage?.getItem(GT_BOOT_SYNC_KEY)) {
                globalThis.sessionStorage?.setItem(GT_BOOT_SYNC_KEY, "1");
                await bridge.setClientSettings({ ...s, language: "zh" });
                window.location.reload();
                return;
              }
            } else if (s.language === "en" && cur !== "en") {
              globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, "en");
              bridge.setUiLocale?.("en");
            } else if (s.language === "zh" && cur !== "zh-CN") {
              globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, "zh-CN");
              bridge.setUiLocale?.("zh-CN");
            }
          } catch {}
        })();

        // Watch <html lang="..."> updates driven by Settings -> General -> Display -> Language dropdown
        if (document?.documentElement && typeof MutationObserver !== "undefined") {
          const htmlObs = new MutationObserver(() => {
            const htmlLang = document.documentElement.lang || "";
            if (!htmlLang) return;
            const bridge = globalThis.desktopBridge;
            if (!bridge?.getClientSettings) return;
            bridge.getClientSettings().then(s => {
              if (!s || typeof s !== "object" || !s.language || s.language === "system") return;
              const cur = getLocale();
              if (s.language === "zh" && cur === "en") {
                globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, "zh-CN");
                bridge.setUiLocale?.("zh-CN");
                window.location.reload();
              } else if (s.language !== "zh" && cur === "zh-CN") {
                globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, "en");
                bridge.setUiLocale?.("en");
                window.location.reload();
              }
            }).catch(() => {});
          });
          htmlObs.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
        }
      }, { once: true });
    }
  } catch {}

  const EXACT = ${JSON.stringify(exactMap)};
  const DO_NOT_TRANSLATE = new Set([
    "Open Sans",
    "Tokyo Night",
    "Claude Code",
    "Grok Build",
    "Muse Code",
    "T3 Code",
    "T3 Connect",
    "T3 Chat",
    "Tailscale Serve",
    "Live Activities",
    "Face ID",
    "Touch ID",
    "App Store",
    "Google Play"
  ]);
  const STOPWORD_ARGS = new Set([
    "a", "an", "the", "to", "in", "on", "at", "by", "for", "of", "with", "from",
    "and", "or", "as", "is", "are", "was", "were", "be", "been", "not", "only", "it", "this", "that"
  ]);

  // Build lowercase lookup map for case-insensitive fallback (e.g. "Reset project grouping to default")
  const LOWER_EXACT = Object.create(null);
  for (const k in EXACT) {
    const low = k.toLowerCase();
    if (!(low in LOWER_EXACT)) {
      LOWER_EXACT[low] = EXACT[k];
    }
  }

  const RAW_TEMPLATES = ${JSON.stringify(templateRules)};
  let compiledTemplates = null;
  function getCompiledTemplates() {
    if (compiledTemplates) return compiledTemplates;
    compiledTemplates = RAW_TEMPLATES.map(item => ({
      re: new RegExp(item.p),
      r: item.r,
      pre: item.pre,
      suf: item.suf,
      mid: item.mid,
      lit: item.lit,
      q: item.q
    }));
    return compiledTemplates;
  }

  // Returns true only when an untranslated placeholder looks like a dynamic identifier, number, shortcut, or proper noun — NEVER lowercase English prose
  function isEntityLikeArg(val) {
    if (!val) return true;
    if (val.length > 48) return false;
    if (STOPWORD_ARGS.has(val.toLowerCase())) return false;
    // Numeric / version / size / percentage / unit
    if (/^[vV#]?\\d[\\d.,:%/+-]*(?:\\s*(?:B|KB|MB|GB|TB|KiB|MiB|GiB|ms|s|sec|m|min|h|hr|d|px|%))?$/i.test(val)) return true;
    // Quoted literal or parenthesized shortcut
    if (/^(?:["'“‘\`].*["'”’\`]|\\([A-Za-z0-9⌘⇧⌥⌃+ -]+\\))$/.test(val)) return true;
    // Single code/path/CLI/slug token containing digits, punctuation, ALL-CAPS, or camelCase
    if (!/\\s/.test(val)) {
      if (/[0-9./\\\\:@#$_+-]/.test(val)) return true;
      if (/^[A-Z0-9]{2,}$/.test(val)) return true;
      if (/^[a-z]+[A-Z][A-Za-z0-9]*$/.test(val)) return true;
    }
    // Short Proper Noun / Product / Model / Device name (1–4 words, every word starts with uppercase, digit, or v-number like v3)
    const words = val.split(/\\s+/);
    if (words.length >= 1 && words.length <= 4) {
      if (words.every(w => /^(?:[A-Z0-9⌘⇧⌥⌃]|v\\d)[A-Za-z0-9._+/()-]*$/.test(w))) return true;
    }
    return false;
  }

  const cache = new Map();
  const MAX_CACHE = 8000;

  function translateCore(str) {
    if (!str || typeof str !== "string") return str;
    if (str.length < 2 || str.length > 400) return str;
    // Fast skip if no ASCII letters
    if (!/[A-Za-z]/.test(str)) return str;
    if (DO_NOT_TRANSLATE.has(str)) return str;

    // 1. Direct exact match
    const direct = EXACT[str];
    if (direct !== undefined) return direct;

    // 2. Check runtime cache
    const cached = cache.get(str);
    if (cached !== undefined) return cached;

    // 3. Preserve leading/trailing whitespace & bullet separator around trimmed string
    const leadingMatch = str.match(/^(\\s*(?:·\\s*)?)/);
    const trailingMatch = str.match(/((?:\\s*·)?\\s*)$/);
    const lead = leadingMatch ? leadingMatch[1] : "";
    const trail = trailingMatch ? trailingMatch[1] : "";
    const core = str.slice(lead.length, str.length - trail.length);

    if (!core || DO_NOT_TRANSLATE.has(core)) return str;

    let res = EXACT[core];
    if (res === undefined && !/^[A-Z0-9_.-]+$/.test(core)) {
      res = LOWER_EXACT[core.toLowerCase()];
    }

    // 4. Common fast-path numeric / relative-time / plural / indexed patterns
    if (res === undefined) {
      let m;
      if (core === "just now") res = "刚刚";
      else if (core === "ago") res = "前";
      else if ((m = /^(\\d+)\\s*s(?:ec(?:ond)?s?)?\\s+ago$/i.exec(core))) res = m[1] + " 秒前";
      else if ((m = /^(\\d+)\\s*m(?:in(?:ute)?s?)?\\s+ago$/i.exec(core))) res = m[1] + " 分钟前";
      else if ((m = /^(\\d+)\\s*h(?:(?:ou)?rs?)?\\s+ago$/i.exec(core))) res = m[1] + " 小时前";
      else if ((m = /^(\\d+)\\s*d(?:ays?)?\\s+ago$/i.exec(core))) res = m[1] + " 天前";
      else if ((m = /^(\\d+)\\s*w(?:eeks?)?\\s+ago$/i.exec(core))) res = m[1] + " 周前";
      else if ((m = /^(\\d+)\\s*mo(?:nths?)?\\s+ago$/i.exec(core))) res = m[1] + " 个月前";
      else if ((m = /^(\\d+)\\s*y(?:ears?)?\\s+ago$/i.exec(core))) res = m[1] + " 年前";
      else if ((m = /^(\\d[\\d,.]*)\\s+threads?$/i.exec(core))) res = m[1] + " 个对话";
      else if ((m = /^(\\d[\\d,.]*)\\s+projects?$/i.exec(core))) res = m[1] + " 个项目";
      else if ((m = /^(\\d[\\d,.]*)\\s+files?$/i.exec(core))) res = m[1] + " 个文件";
      else if ((m = /^(\\d[\\d,.]*)\\s+commits?$/i.exec(core))) res = m[1] + " 次提交";
      else if ((m = /^(\\d[\\d,.]*)\\s+branches$/i.exec(core))) res = m[1] + " 个分支";
      else if ((m = /^(\\d[\\d,.]*)\\s+environments?$/i.exec(core))) res = m[1] + " 个环境";
      else if ((m = /^(\\d[\\d,.]*)\\s+providers?$/i.exec(core))) res = m[1] + " 个提供商";
      else if ((m = /^(\\d[\\d,.]*)\\s+models?$/i.exec(core))) res = m[1] + " 个模型";
      else if ((m = /^(\\d[\\d,.]*)\\s+entries$/i.exec(core))) res = m[1] + " 个词条";
      else if ((m = /^(\\d[\\d,.]*)\\s+pages?$/i.exec(core))) res = m[1] + " 页";
      else if ((m = /^(\\d[\\d,.]*)\\s+sheets?$/i.exec(core))) res = m[1] + " 个工作表";
      else if ((m = /^(\\d[\\d,.]*)\\s+slides?$/i.exec(core))) res = m[1] + " 张幻灯片";
      else if ((m = /^(\\d[\\d,.]*)\\s+notices?$/i.exec(core))) res = m[1] + " 项声明";
      else if ((m = /^(\\d[\\d,.]*)\\s+results?$/i.exec(core))) res = m[1] + " 个结果";
      else if ((m = /^(\\d[\\d,.]*)\\s+conversations?$/i.exec(core))) res = m[1] + " 个讨论";
      else if ((m = /^(\\d[\\d,.]*)\\s+earlier\\s+changes?$/i.exec(core))) res = m[1] + " 处早期更改";
      else if ((m = /^(\\d[\\d,.]*)\\s+languages?$/i.exec(core))) res = m[1] + " 种语言";
      else if ((m = /^(\\d[\\d,.]*)\\s+queued$/i.exec(core))) res = m[1] + " 条排队中";
      else if ((m = /^(\\d[\\d,.]*)\\s+days?$/i.exec(core))) res = m[1] + " 天";
      else if ((m = /^(\\d[\\d,.]*)\\s+hours?$/i.exec(core))) res = m[1] + " 小时";
      else if ((m = /^(\\d[\\d,.]*)\\s+minutes?$/i.exec(core))) res = m[1] + " 分钟";
      else if ((m = /^(\\d[\\d,.]*)\\s+seconds?$/i.exec(core))) res = m[1] + " 秒";
      else if ((m = /^(\\d[\\d,.]*)\\s+rows?$/i.exec(core))) res = m[1] + " 行";
      else if ((m = /^\\((\\d[\\d,.]*)\\s+rows?\\)$/i.exec(core))) res = "(" + m[1] + " 行)";
      else if ((m = /^In\\s+(\\d+)\\s+minutes?$/i.exec(core))) res = m[1] + " 分钟后";
      else if ((m = /^In\\s+(\\d+)\\s+hours?$/i.exec(core))) res = m[1] + " 小时后";
      else if ((m = /^In\\s+(\\d+)\\s+hours?\\s*\\(([^)]+)\\)$/i.exec(core))) res = m[1] + " 小时后 (" + translateCore(m[2]) + ")";
      else if ((m = /^(This evening|Tonight|Tomorrow|Next week)\\s*\\(([^)]+)\\)$/i.exec(core))) res = translateCore(m[1]) + " (" + translateCore(m[2]) + ")";
      else if ((m = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\\s+(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?)$/i.exec(core))) {
        const dayMap = { mon: "周一", tue: "周二", wed: "周三", thu: "周四", fri: "周五", sat: "周六", sun: "周日" };
        res = (dayMap[m[1].toLowerCase()] || m[1]) + " " + m[2];
      }
      else if ((m = /^(\\d[\\d,.]*)\\s+selected$/i.exec(core))) res = "已选择 " + m[1] + " 项";
      else if ((m = /^(\\d+)\\s+of\\s+(\\d+)\\s+selected$/i.exec(core))) res = "已选择 " + m[1] + " / " + m[2] + " 项";
      else if ((m = /^Turn\\s+(\\d+)$/.exec(core))) res = "第 " + m[1] + " 轮";
      else if ((m = /^Page\\s+(\\d+(?:\\s+of\\s+\\d+)?)$/i.exec(core))) res = "第 " + m[1].replace(/\\s+of\\s+/i, " / ") + " 页";
      else if ((m = /^Line\\s+(\\d+)$/i.exec(core))) res = "第 " + m[1] + " 行";
      else if ((m = /^Week\\s+(\\d+)$/i.exec(core))) res = "第 " + m[1] + " 周";
      else if ((m = /^Cell\\s+([A-Z0-9]+)$/i.exec(core))) res = "单元格 " + m[1];
      else if ((m = /^Option\\s+([A-Z0-9#_-]+)$/i.exec(core))) res = "选项 " + (m[1].toLowerCase() === "id" ? "ID" : m[1]);
      else if ((m = /^Argument\\s+(\\d+)$/i.exec(core))) res = "参数 " + m[1];
      else if ((m = /^Thread\\s+(#?\\d+)$/i.exec(core))) res = "对话 " + m[1];
    }

    // 5. Template rules matching (with smart placeholder guard against half-translated English prose)
    if (res === undefined) {
      const rules = getCompiledTemplates();
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (rule.pre && !core.startsWith(rule.pre)) continue;
        if (rule.suf && !core.endsWith(rule.suf)) continue;
        if (rule.mid && !core.includes(rule.mid)) continue;
        const m = rule.re.exec(core);
        if (m) {
          const isAnchoredSentence = rule.lit >= 22;
          const renderedArgs = new Array(m.length - 1);
          let ok = true;
          for (let a = 1; a < m.length; a++) {
            const val = m[a] ?? "";
            if (!val) {
              renderedArgs[a - 1] = "";
              continue;
            }
            if (!isAnchoredSentence && STOPWORD_ARGS.has(val.toLowerCase())) {
              ok = false;
              break;
            }
            const known = DO_NOT_TRANSLATE.has(val)
              ? val
              : (EXACT[val] ?? (!/^[A-Z0-9_.-]+$/.test(val) ? LOWER_EXACT[val.toLowerCase()] : undefined));
            if (known !== undefined) {
              renderedArgs[a - 1] = known;
              continue;
            }
            const sub = isAnchoredSentence ? translateCore(val) : val;
            const isSingleIdentifierToken =
              rule.lit >= 11 && !/\\s/.test(val) && !STOPWORD_ARGS.has(val.toLowerCase());
            if (rule.q === 1 || sub !== val || isEntityLikeArg(val) || isSingleIdentifierToken) {
              renderedArgs[a - 1] = sub;
            } else {
              ok = false;
              break;
            }
          }
          if (ok) {
            let seqIdx = 0;
            res = rule.r.replace(/\\$\\{(\\d*)\\}/g, (_full, pos) => {
              const slot = pos ? (Number(pos) - 1) : seqIdx++;
              return renderedArgs[slot] ?? "";
            });
            // Remove awkward spaces inserted between two Chinese characters by "\${} 选项" / "下载 \${}" templates
            res = res.replace(/([\\u4e00-\\u9fff])[ ]+([\\u4e00-\\u9fff])/g, "$1$2");
            break;
          }
        }
      }
    }

    const finalOut = res !== undefined ? (lead + res + trail) : str;
    if (cache.size >= MAX_CACHE) cache.clear();
    cache.set(str, finalOut);
    return finalOut;
  }

  function tr(str) {
    if (getLocale() === "en") return str;
    return translateCore(str);
  }

  globalThis.__t3Tr = tr;
  globalThis.__t3TrForceZh = translateCore;

  function trMenuItems(items) {
    if (getLocale() === "en" || !Array.isArray(items)) return items;
    return items.map(item => {
      if (!item || typeof item !== "object") return item;
      const next = { ...item };
      if (typeof next.label === "string") {
        next.label = translateCore(next.label);
      }
      if (typeof next.detail === "string") {
        next.detail = translateCore(next.detail);
      }
      if (Array.isArray(next.children)) {
        next.children = trMenuItems(next.children);
      }
      if (Array.isArray(next.submenu)) {
        next.submenu = trMenuItems(next.submenu);
      }
      return next;
    });
  }
  globalThis.__t3TrMenuItems = trMenuItems;

  // Skip code/pre/style/script tags and sensitive label comparisons
  const SKIP_TAGS = new Set(["code", "pre", "style", "script", "kbd"]);
  // Source strings left untranslated inside T3 Code's official zh catalog that our EXACT map covers
  const GT_UNTRANSLATED_SOURCE = new Set([
    "Branch",
    "Link",
    "Span",
    "API token",
    "Git URL",
    "change request",
    "Whoosh",
    "Whoosh "
  ]);
  const PROTECTED_LABELS = new Set(["Browser", "Fast", "Ultrafast", "Commit", "Push"]);
  const TRANSLATABLE_PROPS = [
    "title",
    "description",
    "placeholder",
    "data-placeholder",
    "aria-label",
    "ariaLabel",
    "aria-description",
    "aria-roledescription",
    "alt",
    "tooltip",
    "revealTooltip",
    "hideTooltip",
    "emptyMessage",
    "confirmLabel",
    "cancelLabel",
    "actionLabel",
    "heading",
    "subtitle",
    "headline",
    "hint",
    "rightPanelUnavailableLabel",
    "expandLabel",
    "collapseLabel",
    "statusLabel",
    "sourceLabel",
    "pickerLabel",
    "labelMonthDropdown",
    "labelNext",
    "labelPrevious",
    "labelYearDropdown",
    "labelNav",
    "labelWeekNumberHeader"
  ];

  function translateChildrenArray(arr) {
    // Check common split-array sentence patterns first
    if (arr.length === 2 && arr[0] === "Cloud via ") {
      return ["云端（通过 ", arr[1], "）"];
    }
    if (arr.length === 3 && typeof arr[0] === "string" && typeof arr[2] === "string") {
      if (arr[0] === "Reconnect " && arr[2] === " to change its settings.") {
        return ["重新连接 ", arr[1], " 以更改其设置。"];
      }
      if (arr[0] === "No hosts match \\"" && arr[2] === "\\".") {
        return ["没有匹配“", arr[1], "”的主机。"];
      }
      if (arr[0] === "Not connected, so setup skips " && arr[2] === ".") {
        return ["未连接，因此设置向导将跳过 ", arr[1], "。"];
      }
      if (arr[0] === "Update " && arr[2] === " to use OpenRouter dictation.") {
        return ["请更新 ", arr[1], " 以使用 OpenRouter 语音听写。"];
      }
      if (arr[0] === "Connect to " && arr[2] === " with dictation access to continue.") {
        return ["请连接到拥有语音听写权限的 ", arr[1], " 以继续。"];
      }
      if (arr[0].startsWith("Pick languages to see models that support all of them.") && arr[2] === ".") {
        return ["选择语言即可筛选同时支持这些语言的模型。准确率以词错率或字错率衡量（越低越好）；速度为在 Handy 基准测试 ", arr[1], " 上转写 30 秒音频的耗时。"];
      }
      if (arr[2] === "”") {
        if (arr[0] === "Reading thread “") return ["正在读取会话“", arr[1], "”"];
        if (arr[0] === "Read thread “") return ["已读取会话“", arr[1], "”"];
        if (arr[0] === "Failed to read thread “") return ["读取会话“", arr[1], "”失败"];
        if (arr[0] === "Declined to read thread “") return ["已拒绝读取会话“", arr[1], "”"];
        if (arr[0] === "Stopped reading thread “") return ["已停止读取会话“", arr[1], "”"];
      }
    }
    if (arr.length === 4 && arr[1] === " of " && arr[3] === " selected") {
      return ["已选择 ", arr[0], " / ", arr[2]];
    }
    // Never partially mutate array children that contain General Translation (<Var>/<Num>/etc.) markers
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      if (el && typeof el === "object" && typeof el.type === "function" && typeof el.type._gtt === "string") {
        return arr;
      }
    }
    let changed = false;
    const out = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (typeof item === "string") {
        const t = translateCore(item);
        if (t !== item) changed = true;
        out[i] = t;
      } else if (Array.isArray(item)) {
        const tArr = translateChildrenArray(item);
        if (tArr !== item) changed = true;
        out[i] = tArr;
      } else {
        out[i] = item;
      }
    }
    return changed ? out : arr;
  }

  function createReactEl(marker, type, key, props) {
    return {
      $$typeof: marker,
      type,
      key,
      ref: null,
      props
    };
  }

  function injectLanguageControls(type, props, elementMarker) {
    if (!elementMarker || !props || typeof props !== "object") return props;
    const isEn = getLocale() === "en";

    // 1. Settings top header bar prominent language switcher button (zero bundle regexes!)
    if (
      type === "header" &&
      typeof props.className === "string" &&
      props.className.includes("border-b") &&
      Array.isArray(props.children) &&
      typeof window !== "undefined" &&
      window.location?.pathname?.startsWith("/settings")
    ) {
      const rightIdx = props.children.findIndex(
        c => c && typeof c === "object" && c.type === "div" && typeof c.props?.className === "string" && c.props.className.includes("ms-auto")
      );
      if (rightIdx !== -1) {
        const rightDiv = props.children[rightIdx];
        const existingKids = Array.isArray(rightDiv.props.children)
          ? rightDiv.props.children
          : [rightDiv.props.children];
        if (!existingKids.some(c => c && typeof c === "object" && c.key === "__t3-zh-lang-btn")) {
          const btn = createReactEl(elementMarker, "button", "__t3-zh-lang-btn", {
            id: "__t3-zh-lang-btn",
            type: "button",
            className:
              "inline-flex h-6 items-center justify-center rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-accent cursor-pointer",
            title: "切换界面语言 / Switch UI Language",
            onClick: toggleLocale,
            children: isEn ? "🌐 简体中文" : "🌐 English"
          });
          const nextRight = {
            ...rightDiv,
            props: {
              ...rightDiv.props,
              className: rightDiv.props.className.replace("gap-1", "gap-1.5"),
              children: [btn, ...existingKids]
            }
          };
          const nextHeaderKids = props.children.slice();
          nextHeaderKids[rightIdx] = nextRight;
          return { ...props, children: nextHeaderKids };
        }
      }
    }

    // 2. Sidebar footer 1-click [中/EN] icon button using live FooterButton component reference
    if (type === REACT_FRAGMENT_TYPE && Array.isArray(props.children) && props.children.length >= 2) {
      const first = props.children[0];
      const last = props.children[props.children.length - 1];
      const firstLabel = first?.props?.label;
      const lastLabel = last?.props?.label;
      if (
        first &&
        typeof first.type === "function" &&
        (firstLabel === "Settings" || firstLabel === "设置") &&
        last &&
        (lastLabel === "Usage" || lastLabel === "用量") &&
        !props.children.some(c => c && typeof c === "object" && c.key === "__t3-sidebar-lang-btn")
      ) {
        const iconSpan = createReactEl(elementMarker, "span", null, {
          className: "text-[11px] font-bold leading-none tracking-tighter",
          children: isEn ? "中" : "EN"
        });
        const footerLangBtn = createReactEl(elementMarker, first.type, "__t3-sidebar-lang-btn", {
          icon: iconSpan,
          label: isEn ? "切换为简体中文" : "Switch to English (切换语言)",
          onClick: toggleLocale
        });
        return { ...props, children: [...props.children, footerLangBtn] };
      }
    }

    // 3. Optional 1Password button in built-in browser toolbar (only when --with-1password enabled)
    if (
      globalThis.__t3Enable1PasswordToolbar &&
      type === "form" &&
      props["data-surface-subheader"] === true &&
      Array.isArray(props.children) &&
      props.children.length >= 4 &&
      !props.children.some(c => c && typeof c === "object" && c.key === "__t3-1password-btn")
    ) {
      const svgEl = createReactEl(elementMarker, "svg", null, {
        viewBox: "0 0 24 24",
        fill: "none",
        className: "size-4",
        children: [
          createReactEl(elementMarker, "circle", "c1", { cx: "12", cy: "12", r: "10", fill: "#0A85EA" }),
          createReactEl(elementMarker, "circle", "c2", { cx: "12", cy: "12", r: "7.3", stroke: "#FFFFFF", strokeWidth: "1.6" }),
          createReactEl(elementMarker, "rect", "r1", { x: "10.7", y: "7.2", width: "2.6", height: "4", rx: "1.1", fill: "#FFFFFF" }),
          createReactEl(elementMarker, "path", "p1", { d: "M10.9 12.2H13.1L13.5 16.5H10.5L10.9 12.2Z", fill: "#FFFFFF" })
        ]
      });
      const opBtn = createReactEl(elementMarker, "button", "__t3-1password-btn", {
        type: "button",
        "aria-label": "1Password",
        "data-t3-1password-toolbar-btn": true,
        title: isEn ? "1Password Autofill (⌘\\\\)" : "1Password 自动填充 (⌘\\\\)",
        className: "inline-flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-accent cursor-pointer",
        onClick: () => {
          globalThis.desktopBridge?.toggle1PasswordPopup?.().then(r => {
            if (!r || !r.sentToWebview) globalThis.__t3ToggleMain1PasswordPopup?.();
          });
        },
        children: svgEl
      });
      const nextKids = props.children.slice();
      nextKids.splice(3, 0, opBtn);
      return { ...props, children: nextKids };
    }

    return props;
  }

  function transformProps(type, rawProps, elementMarker) {
    if (!rawProps || typeof rawProps !== "object") return rawProps;
    const props = injectLanguageControls(type, rawProps, elementMarker);
    if (getLocale() === "en") return props;

    // Respect T3 Code's native gt-react <T> / <Var> components (type._gtt) so source-children hashes never break!
    const isGtComponent = typeof type === "function" && typeof type._gtt === "string";
    const isNativeGtZhLoaded =
      typeof document !== "undefined" && document.documentElement?.lang === "zh";

    const isGtUntranslatedFallback =
      isGtComponent && typeof props.children === "string" && GT_UNTRANSLATED_SOURCE.has(props.children);
    const isSkipTag =
      (typeof type === "string" && SKIP_TAGS.has(type)) ||
      (isGtComponent && isNativeGtZhLoaded && !isGtUntranslatedFallback);
    let cloned = null;

    // 1. Translate children
    if (!isSkipTag && props.children !== undefined) {
      const ch = props.children;
      if (typeof ch === "string") {
        // Keep the brand word "Code" in "T3 Code" logo intact while translating "Code" elsewhere
        if (ch === "Code" && typeof props.className === "string" && props.className.includes("text-sidebar-foreground")) {
          // do not translate brand logo
        } else if (ch === "Input" && typeof props.className === "string" && props.className.includes("text-indigo-600")) {
          cloned = { ...props, children: "待输入" };
        } else {
          const t = translateCore(ch);
          if (t !== ch) {
            cloned = { ...props, children: t };
          }
        }
      } else if (Array.isArray(ch) && !isGtComponent) {
        if (ch.length === 2 && ch[1] === "Input" && typeof props.className === "string" && props.className.includes("text-indigo-600")) {
          cloned = { ...props, children: [ch[0], "待输入"] };
        } else {
          const tArr = translateChildrenArray(ch);
          if (tArr !== ch) {
            cloned = { ...props, children: tArr };
          }
        }
      }
    }

    // 2. Translate display props
    for (let i = 0; i < TRANSLATABLE_PROPS.length; i++) {
      const key = TRANSLATABLE_PROPS[i];
      const val = props[key];
      if (typeof val === "string") {
        const t = translateCore(val);
        if (t !== val) {
          if (!cloned) cloned = { ...props };
          cloned[key] = t;
        }
      }
    }

    // 3. Translate props.label only when not in PROTECTED_LABELS
    if (typeof props.label === "string" && !PROTECTED_LABELS.has(props.label)) {
      const t = translateCore(props.label);
      if (t !== props.label) {
        if (!cloned) cloned = { ...props };
        cloned.label = t;
      }
    }

    return cloned || props;
  }

  globalThis.__t3TransformProps = transformProps;

  // Lightweight DOM attribute & text fallback observer for portals/non-React primitives
  try {
    if (typeof window !== "undefined" && typeof MutationObserver !== "undefined") {
      const ATTR_LIST = ["placeholder", "data-placeholder", "title", "aria-label"];
      const SKIP_SELECTOR = "code, pre, script, style, kbd, textarea, [contenteditable=\\"true\\"], .ProseMirror, .monaco-editor, .xterm";

      function processElement(el) {
        if (!el || el.nodeType !== 1) return;
        for (let i = 0; i < ATTR_LIST.length; i++) {
          const attr = ATTR_LIST[i];
          if (el.hasAttribute(attr)) {
            const val = el.getAttribute(attr);
            if (val) {
              const t = translateCore(val);
              if (t !== val) el.setAttribute(attr, t);
            }
          }
        }
      }

      window.addEventListener("DOMContentLoaded", () => {
        if (getLocale() === "en" || !document.body) return;
        const obs = new MutationObserver(mutations => {
          if (getLocale() === "en") return;
          for (let i = 0; i < mutations.length; i++) {
            const m = mutations[i];
            if (m.type === "attributes" && m.target && m.target.nodeType === 1) {
              processElement(m.target);
            } else if (m.type === "childList" && m.addedNodes.length > 0) {
              for (let j = 0; j < m.addedNodes.length; j++) {
                const node = m.addedNodes[j];
                if (node.nodeType === 1) {
                  if (node.matches && node.matches(SKIP_SELECTOR)) continue;
                  processElement(node);
                }
              }
            }
          }
        });
        obs.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ATTR_LIST
        });
      }, { once: true });
    }
  } catch {}
})();
`;
}

export function buildI18nBundle(customOutPath, extraOptions = {}) {
  const runtimeSource = compileRuntimeSource(extraOptions);
  const outPath = customOutPath || path.join(__dirname, "dist", "zh-cn-i18n.js");
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, runtimeSource, "utf8");
    console.log("Wrote zh-cn-i18n.js:", fs.statSync(outPath).size, "bytes");
  } catch (err) {
    // Fallback if package directory is read-only (e.g. global/nix store)
    console.warn("Notice: using in-memory i18n bundle (", err.message, ")");
  }
  return runtimeSource;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildI18nBundle();
}
