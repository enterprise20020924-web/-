# 三明月 IDE 标准模式计划 / To-do 系统实现计划书

## 摘要

目标是在 `src/三明月IDE` 内为“明月秋青”的标准模式实现类似主流 agent 的计划模式：用户给出简短目标后，AI 起草计划，用户确认后激活；激活计划会进入每次生成的 prompt，包括普通发送、`/trigger`、`/continue`；AI 后续只能提出计划更新建议，真正修改 todo、关闭计划、归档计划都必须由用户在前端确认。

v1 只优先覆盖标准模式和普通聊天入口，宝宝辅食模式暂不接入。源码修改限定在 `src/三明月IDE/伪IDE` 和 `src/三明月IDE/条目`。执行前必须创建备份，并保留最近 10 个备份批次。

## 核心设计

计划数据不写入世界书，也不写入 MVU。计划真源保存在当前聊天变量里，避免跨聊天串味。

聊天变量 key 固定为：

```ts
const PLAN_STATE_KEY = '明月秋青_计划模式_v1';
```

状态机固定为：

```ts
type PlanStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'ready_to_complete'
  | 'completed'
  | 'archived';

type TodoStatus = 'todo' | 'doing' | 'blocked' | 'done' | 'skipped';
```

当前计划生命周期：

```text
无计划
→ AI 生成 PlanDraft
→ 用户确认采用
→ active
→ AI 生成 PlanUpdate 建议
→ 用户确认应用或拒绝
→ AI 可建议 ready_to_complete
→ 用户确认完成
→ completed + archive
→ activePlanId 清空，prompt 不再注入计划
```

计划完成判定采用“建议 + 确认”，不允许 AI 自动关闭计划。满足以下条件时，AI 可以建议 `ready_to_complete`：

```text
所有 required todo 都是 done 或 skipped
成功标准已满足或被用户明确取消
没有未解决 blocker
用户明确表示完成，或 AI 有充分证据建议完成
```

最终关闭只能由用户点击“确认完成计划”或发送明确完成意图后在前端确认。

## 数据模型

新增 Pinia store：[stores/plan.ts](F:/酒馆模板/src/三明月IDE/伪IDE/stores/plan.ts)

保存结构：

```ts
interface PlanModeState {
  enabled: boolean;
  activePlanId: string | null;
  plans: Record<string, AgentPlan>;
  pendingDraft: PlanDraft | null;
  pendingUpdate: PlanUpdateProposal | null;
  archives: PlanArchive[];
  settings: {
    injectEnabled: boolean;
    standardOnly: boolean;
    maxPromptTodos: number;
    maxArchives: number;
    maxHistoryEvents: number;
  };
}

interface AgentPlan {
  id: string;
  status: PlanStatus;
  title: string;
  taskId: string;
  taskTitle: string;
  targetName: string;
  userGoal: string;
  successCriteria: string[];
  assumptions: string[];
  todos: PlanTodo[];
  activeTodoId: string | null;
  blockers: string[];
  writeBoundary: string[];
  promptNotes: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  history: PlanHistoryEvent[];
}

interface PlanTodo {
  id: string;
  title: string;
  detail: string;
  status: TodoStatus;
  required: boolean;
  evidence: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanDraft {
  schema: 'mingyue.plan_draft.v1';
  title: string;
  userGoal: string;
  successCriteria: string[];
  assumptions: string[];
  todos: Array<Pick<PlanTodo, 'id' | 'title' | 'detail' | 'required'>>;
  activeTodoId: string | null;
  blockers: string[];
  writeBoundary: string[];
  questions: string[];
  confidence: 'enough' | 'needs_input';
}

interface PlanUpdateProposal {
  schema: 'mingyue.plan_update.v1';
  planId: string;
  statusSuggestion: 'continue' | 'ready_to_complete' | 'pause' | 'blocked';
  summary: string;
  ops: PlanUpdateOperation[];
  questions: string[];
}
```

默认设置：

```ts
settings: {
  injectEnabled: true,
  standardOnly: true,
  maxPromptTodos: 7,
  maxArchives: 10,
  maxHistoryEvents: 20,
}
```

归档规则：

```text
完成计划时，把 active plan 复制为 archive
archives 只保留最近 10 个
activePlanId 设为 null
enabled 设为 false
pendingDraft 和 pendingUpdate 清空
```

## Prompt 注入

新增计划提示词模板：[🧭_计划模式上下文.txt](F:/酒馆模板/src/三明月IDE/条目/🧭_计划模式上下文.txt)

这个条目源文件不在完成后删除。它是静态规则模板，运行时由前端读取并拼接当前 active plan，再通过 `injectPrompts` 注入本轮生成。没有 active plan 或计划模式关闭时，不注入任何内容。

新增工具：[utils/plan-context.ts](F:/酒馆模板/src/三明月IDE/伪IDE/utils/plan-context.ts)

注入方式：

```text
监听 tavern_events.GENERATION_AFTER_COMMANDS
如果不是 dry_run，且当前聊天有 active plan，且 injectEnabled=true
调用 injectPrompts(..., { once: true })
position 使用 in_chat
depth 使用 0
role 使用 system
```

注入内容结构：

```text
<mingyue_plan_context>
计划模式已开启。以下计划是当前任务的工作记忆。
你必须优先遵循 active_todo 和 success_criteria。
你不能擅自修改计划，只能在回复末尾提出 <PlanUpdate> JSON 建议。
你不能擅自关闭计划，只能建议 ready_to_complete。

当前计划：
标题：...
目标：...
状态：active
当前步骤：T002 ...
成功标准：
- ...
未完成待办：
- [doing] T002 ...
- [todo] T003 ...
阻塞：
- ...
写入边界：
- ...
</mingyue_plan_context>
```

prompt 压缩规则：

```text
最多注入 7 条未完成 todo
done/skipped 只注入最近 2 条作为上下文，不完整展开
整体计划上下文控制在约 1800 字符以内
超出时优先保留 active_todo、successCriteria、blockers、writeBoundary
```

## AI 输出协议

计划草稿协议固定为可见 JSON 块：

```text
<PlanDraft>
{
  "schema": "mingyue.plan_draft.v1",
  "title": "完成角色基础并写入世界书",
  "userGoal": "整理当前角色基础信息，形成可写入世界书的条目",
  "successCriteria": [
    "角色基础信息结构完整",
    "缺失信息已向用户确认或写入 assumptions",
    "写入边界明确"
  ],
  "assumptions": [],
  "todos": [
    {
      "id": "T001",
      "title": "确认目标角色和世界书",
      "detail": "检查用户是否已提供角色名、世界书名",
      "required": true
    }
  ],
  "activeTodoId": "T001",
  "blockers": [],
  "writeBoundary": [
    "未确认前不直接写入世界书",
    "只整理用户提供的信息，不擅自扩写核心创意"
  ],
  "questions": [],
  "confidence": "enough"
}
</PlanDraft>
```

计划更新协议固定为：

```text
<PlanUpdate>
{
  "schema": "mingyue.plan_update.v1",
  "planId": "plan-...",
  "statusSuggestion": "continue",
  "summary": "已确认世界书名，可以进入整理角色基础信息。",
  "ops": [
    {
      "op": "set_todo_status",
      "todoId": "T001",
      "status": "done",
      "evidence": "用户已提供目标世界书。"
    },
    {
      "op": "set_active_todo",
      "todoId": "T002"
    }
  ],
  "questions": []
}
</PlanUpdate>
```

支持的 update op 固定为：

```ts
type PlanUpdateOperation =
  | { op: 'set_todo_status'; todoId: string; status: TodoStatus; evidence?: string }
  | { op: 'add_todo'; todoId?: string; title: string; detail?: string; required?: boolean }
  | { op: 'edit_todo'; todoId: string; title?: string; detail?: string; required?: boolean }
  | { op: 'set_active_todo'; todoId: string | null }
  | { op: 'add_blocker'; text: string }
  | { op: 'clear_blocker'; text: string }
  | { op: 'add_success_criterion'; text: string }
  | { op: 'add_assumption'; text: string };
```

前端应用规则：

```text
AI 输出 PlanDraft 后，只保存为 pendingDraft，不自动激活
AI 输出 PlanUpdate 后，只保存为 pendingUpdate，不自动应用
用户点击“采用草稿”后才创建 active plan
用户点击“应用更新”后才修改 active plan
用户点击“拒绝更新”后清空 pendingUpdate
AI 提议 ready_to_complete 时，前端只把状态设为 ready_to_complete 并显示确认完成按钮
用户确认完成后才归档并停止注入
```

## 标准模式 UI

新增组件：[PlanModePanel.vue](F:/酒馆模板/src/三明月IDE/伪IDE/components/workshop/PlanModePanel.vue)

接入位置：[WorkshopHome.vue](F:/酒馆模板/src/三明月IDE/伪IDE/components/workshop/WorkshopHome.vue)

只在 `workshopStore.mode !== 'baby'` 时显示。宝宝辅食模式暂不显示计划模式卡片。

面板状态：

```text
无 active plan：
显示“开启计划模式”
显示“根据当前任务草拟计划”
显示目标输入、临时素材摘要、当前任务名

有 pendingDraft：
显示草稿标题、成功标准、todo 列表、缺失问题
按钮：采用为当前计划、拒绝草稿、继续补充信息

有 active plan：
显示计划标题、状态、当前步骤、剩余 todo、阻塞项
按钮：暂停/恢复、手动新增 todo、标记当前步骤完成、确认完成计划

有 pendingUpdate：
显示 AI 建议摘要和每个 op 的影响
按钮：应用更新、拒绝更新、手动编辑后应用

ready_to_complete：
突出显示“AI 建议完成”
按钮：确认完成并归档、继续执行
```

手动编辑能力 v1 必须包含：

```text
新增 todo
修改 todo 标题和详情
切换 todo 状态
设置当前 active todo
删除未开始 todo
暂停/恢复计划
确认完成计划
```

## 标准模式起草流程

新增方法在 [stores/workshop.ts](F:/酒馆模板/src/三明月IDE/伪IDE/stores/workshop.ts)：

```ts
buildPlanDraftPrompt(currentCharacterName?: string | null): string
```

起草 prompt 必须包含：

```text
当前模式：标准模式
当前任务 task.id / task.title / task.summary
当前任务 outputs / guardrails / writePlan / knowledgeRefs
目标角色或世界书
用户临时素材
前端生成状态
要求 AI 输出 <PlanDraft> JSON
如果用户输入很短，允许基于当前任务自动理解默认计划
如果缺关键字段，confidence 设为 needs_input，并提出最多 3 个问题
```

判定是否可激活：

```text
title 非空
userGoal 非空
successCriteria 至少 1 条
todos 至少 1 条
activeTodoId 必须存在于 todos，或为空时前端自动选择第一条 required todo
confidence=needs_input 时仍可采用，但必须把 questions 显示为 blocker
```

## 普通聊天和继续生成

修改 [stores/chat.ts](F:/酒馆模板/src/三明月IDE/伪IDE/stores/chat.ts) 时不把计划文本拼进用户输入，避免聊天记录重复膨胀。

计划进入 prompt 的唯一 v1 通道是 `injectPrompts`。因此以下入口都能拿到计划：

```text
标准模式“发送给秋青子”
普通聊天发送
ChatPanel 的 /trigger
ChatPanel 的 /continue
```

在 [App.vue](F:/酒馆模板/src/三明月IDE/伪IDE/App.vue) 统一注册：

```text
CHAT_CHANGED：重新从聊天变量加载 plan state
GENERATION_AFTER_COMMANDS：注入当前 active plan
CHARACTER_MESSAGE_RENDERED 或 GENERATION_ENDED：解析最新 assistant 消息里的 PlanDraft / PlanUpdate
```

## 解析与校验

新增工具：[utils/plan-protocol.ts](F:/酒馆模板/src/三明月IDE/伪IDE/utils/plan-protocol.ts)

职责：

```text
extractPlanDraft(message: string): PlanDraft | null
extractPlanUpdate(message: string): PlanUpdateProposal | null
validatePlanDraft(value: unknown): PlanDraft
validatePlanUpdate(value: unknown): PlanUpdateProposal
applyPlanUpdate(plan: AgentPlan, proposal: PlanUpdateProposal): AgentPlan
```

解析规则：

```text
只读取最后一个 <PlanDraft>...</PlanDraft>
只读取最后一个 <PlanUpdate>...</PlanUpdate>
JSON.parse 失败时不修改状态，只 toast 提示解析失败
schema 不匹配时忽略
planId 不等于 activePlanId 时忽略 PlanUpdate
todoId 缺失或冲突时由前端生成下一个 T### id
未知 op 忽略，并在 pendingUpdate 预览里标红
```

## 备份要求

实现前创建备份批次，备份所有将修改的旧文件。新增文件不需要旧文件备份，但要写入本批次 manifest。

备份位置：

```text
src/三明月IDE/伪IDE/_backups/计划模式/YYYYMMDD-HHMMSS/
src/三明月IDE/条目/_backups/计划模式/YYYYMMDD-HHMMSS/
```

保留策略：

```text
每个 _backups/计划模式 目录只保留最近 10 个时间戳批次
超过 10 个时删除最旧批次
manifest 记录：时间、变更原因、备份文件列表、新增文件列表
```

## 预期改动清单

新增：

```text
src/三明月IDE/伪IDE/stores/plan.ts
src/三明月IDE/伪IDE/utils/plan-context.ts
src/三明月IDE/伪IDE/utils/plan-protocol.ts
src/三明月IDE/伪IDE/components/workshop/PlanModePanel.vue
src/三明月IDE/条目/🧭_计划模式上下文.txt
```

修改：

```text
src/三明月IDE/伪IDE/App.vue
src/三明月IDE/伪IDE/components/workshop/WorkshopHome.vue
src/三明月IDE/伪IDE/stores/workshop.ts
src/三明月IDE/伪IDE/stores/chat.ts 仅在必要时补充计划解析触发，不拼接计划文本
```

不修改：

```text
dist/
build/
.vite/
node_modules/
打包后的 index.html
压缩后的 JS/CSS
MVU 条目和变量结构
宝宝辅食表单逻辑
```

## 测试计划

静态检查：

```text
运行 npm run build
如 build 失败，修复源码后重跑
不运行会改写文件的 format 或 lint:fix
```

本地页面验证：

```text
打开 http://127.0.0.1:8000/
进入明月秋青
切换标准模式
选择一个标准任务，例如“角色基础”
输入简短目标
点击草拟计划
确认 AI 回复出现 <PlanDraft>
确认前端显示 pendingDraft
点击采用为当前计划
发送普通消息
确认下一轮生成前 active plan 被注入
让 AI 输出 <PlanUpdate>
确认前端显示 pendingUpdate 且未自动应用
点击应用更新
确认 todo 状态变化并持久化到当前聊天变量
点击继续 /trigger
确认 active plan 仍会注入
点击确认完成计划
确认 activePlanId 清空，archives 增加，后续生成不再注入计划
```

持久化验证：

```text
刷新页面后 active plan 仍存在
切换到另一个聊天后不复用上一个聊天的 active plan
切回原聊天后恢复该聊天自己的 active plan
完成计划后刷新页面仍保持 completed/archive，不恢复 active 注入
archives 超过 10 个时只保留最近 10 个
```

边界验证：

```text
AI 输出损坏 JSON 时不修改计划
AI 输出旧 planId 的 PlanUpdate 时忽略
AI 试图 ready_to_complete 时不自动完成，只显示确认按钮
计划暂停时不注入 prompt
计划关闭时不注入 prompt
宝宝辅食模式不显示计划面板
```

## 验收标准

计划模式开启后，AI 每次生成都能看到当前 active plan，而不是只依赖人类记忆。

`/send`、`/trigger`、`/continue` 都走同一套注入机制。

AI 不能自动改 todo，所有 PlanDraft 和 PlanUpdate 都必须经用户确认。

计划完成后不会删除静态条目，只归档聊天变量并停止注入。

当前聊天和其他聊天的计划互不污染。

`npm run build` 通过。

最终报告只需要说明改了哪些文件、移动或新增了哪些选择器、build 是否通过，不粘贴 CSS 原文或大段命令输出。

## 默认假设

v1 只做标准模式，宝宝辅食后续再接。

计划数据绑定当前聊天变量，不绑定角色卡、世界书或全局变量。

提示词进入 prompt 采用 `injectPrompts`，不把计划正文拼进用户输入。

静态计划条目作为源码模板长期保留，完成计划时不删除条目。

AI 可以起草、建议更新、建议完成，但不能自动激活、自动修改、自动关闭计划。

如果后续需要把完成计划写成长期项目档案，再新增“导出到世界书”功能，不纳入 v1。
