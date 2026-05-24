import { getBabyTaskPresetRefs } from '../utils/baby-assistant';

export type WorkshopMode = 'baby' | 'standard' | 'pro';

export interface ModeProfile {
  id: WorkshopMode;
  title: string;
  shortTitle: string;
  summary: string;
  authority: string;
  guardrails: string[];
}

export interface TaskDefinition {
  id: string;
  title: string;
  category: '文字' | '世界书' | 'MVU' | 'EJS' | '前端' | '工具';
  modes: WorkshopMode[];
  summary: string;
  firstAction: string;
  outputs: string[];
  babySummary?: string;
  babyFirstAction?: string;
  babyOutputs?: string[];
  knowledgeRefs: string[];
  guardrails: string[];
  writePlan: string[];
}

export interface WorkshopDraft {
  targetName: string;
  userNotes: string;
  assistantNotes?: string;
}

export type ArtifactContentType = 'yaml' | 'text' | 'ts' | 'ejs' | 'json';
export type WorkshopRiskLevel = 'text' | 'config' | 'code' | 'danger';
export type WorkshopWriteTool = 'Write' | 'SetAttribute' | 'CreateLorebook' | 'Edit';
export type WorkshopExecutionPhase = 'idle' | 'dryrun' | 'ready' | 'applying' | 'applied' | 'failed';
export type WorkshopExecutionStatus = 'pending' | 'ok' | 'warning' | 'blocked' | 'skipped' | 'running' | 'applied' | 'failed';

export interface WorkshopArtifact {
  id: string;
  title: string;
  contentType: ArtifactContentType;
  targetPath: string;
  content: string;
  riskLevel: WorkshopRiskLevel;
}

export interface WorkshopWriteOperation {
  id: string;
  tool: WorkshopWriteTool;
  summary: string;
  targetPath: string;
  riskLevel: WorkshopRiskLevel;
  artifactId?: string;
  attributes?: Record<string, unknown>;
  lorebookName?: string;
  optional?: boolean;
  skipIfExists?: boolean;
  skipIfContentIncludes?: string;
}

export interface WorkshopExecutionRecord {
  id: string;
  operationId: string;
  tool: WorkshopWriteTool;
  targetPath: string;
  status: WorkshopExecutionStatus;
  title: string;
  detail: string;
  riskLevel: WorkshopRiskLevel;
  result?: unknown;
}

const modeProfiles: ModeProfile[] = [
  {
    id: 'baby',
    title: '宝宝辅食模式',
    shortTitle: '宝宝辅食',
    summary: '前端一步一步问，用户只填答案；代码、路径、世界书配置都由工具层约束。',
    authority: 'AI 只负责解释、鼓励、整理和提问，不替用户决定核心创意。',
    guardrails: [
      '不显示裸代码',
      '不让用户判断 EJS/MVU 是否正确',
      '调色盘类内容只修错字并转 YAML',
      '写入前只展示摘要和风险',
    ],
  },
  {
    id: 'standard',
    title: '标准协作模式',
    shortTitle: '标准协作',
    summary: '保留聊天协作体验，AI 负责拆任务和读知识库，前端负责校验和写入计划。',
    authority: 'AI 可以提方案，但代码和配置必须走知识库、模板、校验器和用户确认。',
    guardrails: [
      '允许查看代码但默认折叠',
      '写入前必须生成计划',
      'EJS/MVU 不绕过知识库',
      '发现结构或代码问题必须先修正',
    ],
  },
  {
    id: 'pro',
    title: '专业版模式',
    shortTitle: '专业版',
    summary: '用户用 @ref、@target、@check、@dryrun、@apply 明确指挥 AI 和工具。',
    authority: 'AI 可以执行更强的读写任务，但必须展示目标、diff、工具结果和回滚边界。',
    guardrails: [
      '无确认不覆盖',
      'Delete 需要二次确认',
      '不得生成无来源代码',
      '保留完整工具调用记录',
    ],
  },
];

const taskDefinitions: TaskDefinition[] = [
  {
    id: 'character.base',
    title: '角色基础',
    category: '文字',
    modes: ['baby', 'standard', 'pro'],
    summary: '按教程拆成基本信息、外貌特征、背景设定、关系设定。',
    firstAction: '先让用户手写答案，再做结构整理和鼓励式反馈。',
    outputs: ['角色档案 YAML', '世界书条目草案', '写入计划'],
    knowledgeRefs: ['调色盘人设与台词人设/教程'],
    guardrails: [
      '基础信息不写性格',
      '外貌只写能识别角色的特征',
      '背景只写真正影响角色的事',
      '关系写具体认识过程和互动方式',
    ],
    writePlan: ['Write /Worldbooks/<世界书>/角色/<角色名>/基础信息', 'SetAttribute 蓝灯常驻、不可递归'],
  },
  {
    id: 'worldview.write',
    title: '世界观',
    category: '文字',
    modes: ['baby', 'standard', 'pro'],
    summary: '判断真实背景、小世界、大世界，再用最少的字说清设定。',
    firstAction: '先问世界类型和必须自定义的信息，不替用户写小说式设定集。',
    outputs: ['世界观总纲', '区域/势力速览', '按需加载详情条目'],
    babySummary: '先和秋青子聊清楚世界观，再把最终整理稿贴回工作台。',
    babyFirstAction: '不知道怎么写时先去右边问秋青子；聊完后把最终整理稿放回工作台。',
    babyOutputs: ['世界观整理稿', '世界书写入计划'],
    knowledgeRefs: ['调色盘人设与台词人设/教程'],
    guardrails: [
      '世界观是提示词，不是小说设定集',
      '真实背景只写 AI 不知道的自定义信息',
      '大世界拆总纲、速览、详情、NPC',
      '压缩不能丢信息',
    ],
    writePlan: ['Write /Worldbooks/<世界书>/世界观/总纲', 'SetAttribute 角色定义前、顺序1-3'],
  },
  {
    id: 'character.palette',
    title: '性格调色盘',
    category: '文字',
    modes: ['baby', 'standard', 'pro'],
    summary: '用户手写角色“由什么构成”，AI 只做错字修正和 YAML 转化。',
    firstAction: '请用户写原始调色盘，不做 AI 代写和创意自查。',
    outputs: ['原味调色盘 YAML', '缺口提示', '写入计划'],
    knowledgeRefs: ['调色盘人设与台词人设', 'src/秋青子写卡预设/条目/📋_性格调色盘.txt'],
    guardrails: [
      '不改写用户创意',
      '不评判调色盘好坏',
      '只修错字、格式、YAML 层级',
      '反馈先夸具体优点再提问题',
    ],
    writePlan: ['Write /Worldbooks/<世界书>/角色/<角色名>/性格调色盘', 'SetAttribute 单角色蓝灯或多角色绿灯'],
  },
  {
    id: 'character.wardrobe_prompt',
    title: '衣柜精简提示词',
    category: '文字',
    modes: ['baby', 'standard', 'pro'],
    summary: '只记录穿衣风格、特殊偏爱、禁忌风格、标志性配饰。',
    firstAction: '用短问题收集风格词，不做复杂衣装系统。',
    outputs: ['衣柜提示词 YAML', '写入计划'],
    babySummary: '写角色常穿什么、喜欢什么、讨厌什么，以及一两个标志物。',
    babyFirstAction: '只收集穿衣提示词，不做复杂衣柜系统。',
    babyOutputs: ['衣柜精简提示词', '世界书写入计划'],
    knowledgeRefs: ['调色盘人设与台词人设/教程'],
    guardrails: ['保持精简', '不展开全衣柜系统', '不自动补复杂服装设定'],
    writePlan: ['Write /Worldbooks/<世界书>/角色/<角色名>/衣柜', 'SetAttribute 跟随角色详细配置'],
  },
  {
    id: 'mvu.schema',
    title: 'MVU 基础变量',
    category: 'MVU',
    modes: ['baby', 'standard', 'pro'],
    summary: '用字段编辑器生成初始变量、变量结构脚本和更新规则，并自动补齐固定格式条目。',
    firstAction: '先填写开局状态、变量类型、取值范围和更新要求；固定格式由前端自动生成。',
    outputs: ['MVU脚本本体', '变量结构脚本', 'initvar', '更新规则', '变量列表', '输出格式', '备用输出提醒'],
    babySummary: '把好感度、心情、阶段这类状态做成可更新变量；不用自己碰代码格式。',
    babyFirstAction: '先写开局时有哪些状态、初始值是什么、什么时候会变化。',
    babyOutputs: ['MVU脚本本体', '开局状态', '变量后台规则', '自动补齐的固定配置'],
    knowledgeRefs: ['写卡知识库/MVU/MVU_ZOD指南.txt', '写卡知识库/自查/MVU自查.txt'],
    guardrails: [
      'zod 4',
      '只导入 registerMvuSchema',
      'EJS/状态栏读变量必须带 stat_data',
      'JSON Patch 路径不带 stat_data',
    ],
    writePlan: ['Write /Characters/<角色>/Scripts/MVU', 'Write /Characters/<角色>/Scripts/变量结构', 'Write MVU 世界书条目与固定格式配置'],
  },
  {
    id: 'ejs.full_workflow',
    title: 'EJS 完整工作流',
    category: 'EJS',
    modes: ['standard', 'pro'],
    summary: '覆盖 EJS 基础语法、变量、getwi、装饰器、注入、正则、调试和控制器玩法。',
    firstAction: '先判断用途：动态发送、动态激活、渲染界面、Prompt 注入或调试。',
    outputs: ['EJS 条目草案', '配置建议', '代码检查结果'],
    knowledgeRefs: ['新建文件夹/EJS使用/EJS实战指南_2026_ZOD版.md', '写卡知识库/EJS/EJS基础语法.txt'],
    guardrails: [
      'getwi 必须 await',
      '变量读取用 typeof + var',
      '控制器位置跟随调用内容',
      '宝宝辅食只开放白名单模板',
    ],
    writePlan: ['Write /Worldbooks/<世界书>/EJS/<条目名>', 'SetAttribute 按用途配置位置和启用状态'],
  },
  {
    id: 'ejs.stage_palette',
    title: '多阶段人设',
    category: 'EJS',
    modes: ['baby', 'standard', 'pro'],
    summary: '根据 MVU 变量在同一个 EJS 条目中切换不同阶段的用户手写调色盘。',
    firstAction: '先确认阶段变量、阶段边界和每个阶段的用户手写调色盘。',
    outputs: ['一体化 EJS 条目', '阶段覆盖检查', '配置计划'],
    babySummary: '让好感度、关系阶段这类变量自动切换不同阶段的人设原文。',
    babyFirstAction: '先做 MVU 基础变量，再贴每个阶段的手写人设。',
    babyOutputs: ['多阶段人设切换', '世界书写入计划'],
    knowledgeRefs: ['写卡知识库/EJS/EJS调色盘多阶段人设.txt', '新建文件夹/EJS使用/EJS实战指南_2026_ZOD版.md'],
    guardrails: [
      '阶段文字由用户手写',
      '不拆成被 getwi 加载的禁用条目',
      '条目与角色详细信息同位',
      '检查阶段覆盖和默认分支',
    ],
    writePlan: ['Write 一体化 EJS 条目', 'SetAttribute 角色定义后 order 99、不可递归、防进一步递归'],
  },
  {
    id: 'frontend.mvu_status_bar',
    title: 'MVU 前端状态栏',
    category: '前端',
    modes: ['baby', 'standard', 'pro'],
    summary: '把已有 MVU 变量显示成楼层状态栏，只负责读取和展示，不修改变量。',
    firstAction: '选择要显示的变量、状态栏标题和视觉风格，再由模板生成只读状态栏。',
    outputs: ['状态栏界面', '角色正则配置', '代码检查结果'],
    babySummary: '把已经做好的 MVU 变量显示在聊天楼层里，比如好感度、心情、阶段。',
    babyFirstAction: '先写你想展示哪些变量，再选一个大概风格；代码细节交给前端检查。',
    babyOutputs: ['能显示变量的状态栏', '自动配置到角色卡', '写入前安全检查'],
    knowledgeRefs: ['写卡知识库/MVU/MVU_ZOD指南.txt', '写卡知识库/自查/MVU前端状态栏自查.txt'],
    guardrails: [
      '不用 $1 传数据',
      '不使用 DOMContentLoaded',
      '使用 getChatMessages(getCurrentMessageId())',
      '标签名必须一致',
      '只读展示，不修改 MVU 变量',
    ],
    writePlan: ['Write /Characters/<角色>/Regex/<状态栏正则>'],
  },
  {
    id: 'frontend.beautify',
    title: '前端美化',
    category: '前端',
    modes: ['baby', 'standard', 'pro'],
    summary: '把 AI 输出的文字或结构化内容渲染成美观的小型前端页面。',
    firstAction: '先确认要美化的内容类型、标签名、页面布局和视觉风格，再生成完整前端。',
    outputs: ['美化前端界面', '世界书源文件', '角色正则配置'],
    babySummary: '把文字内容变成好看的小页面，比如正文卡片、档案页、论坛帖或任务面板。',
    babyFirstAction: '先告诉我想美化哪类文字、页面像什么、颜色风格是什么；代码交给前端检查。',
    babyOutputs: ['源文件告诉 AI 怎么输出', '正则把标签内容变成页面', '写入前安全检查'],
    knowledgeRefs: ['写卡知识库/自查/前端美化自查.txt'],
    guardrails: [
      '不用 $1 传数据',
      '不使用 DOMContentLoaded',
      '使用 getChatMessages(getCurrentMessageId())',
      '标签名必须一致',
      '正文美化和结构化数据美化分开判断',
    ],
    writePlan: ['Write /Worldbooks/<世界书>/前端/<源文件>', 'SetAttribute D0 system', 'Write /Characters/<角色>/Regex/<前端美化正则>'],
  },
  {
    id: 'worldbook.configure',
    title: '世界书配置修复',
    category: '世界书',
    modes: ['standard', 'pro'],
    summary: '读取现有世界书，按单角色/多角色/世界观/EJS/MVU 规则修复配置。',
    firstAction: '先读取世界书条目和属性，生成 dryrun 计划。',
    outputs: ['配置评估', 'SetAttribute 计划', '风险提示'],
    knowledgeRefs: ['写卡知识库/世界书配置/世界书配置指南.txt', '写卡知识库/自查/世界书评估.txt'],
    guardrails: [
      '配置由前端和工具层负责',
      'EJS 控制器位置浮动',
      'D1-D998 不放任何条目',
      '写入前必须确认',
    ],
    writePlan: ['GetAttribute 读取配置', 'SetAttribute 修复启用、位置、顺序、递归、关键词'],
  },
];

const babyTaskDefaultFields: Record<string, string> = {
  'character.base': 'character.name',
  'worldview.write': 'worldview.seed',
  'character.palette': 'palette.raw',
  'character.wardrobe_prompt': 'wardrobe.daily',
  'mvu.schema': 'mvu.system',
  'ejs.stage_palette': 'ejs.variablePath',
  'frontend.mvu_status_bar': 'frontend.statusTitle',
  'frontend.beautify': 'beautify.pageTitle',
};

export const useWorkshopStore = defineStore('workshop', () => {
  const mode = ref<WorkshopMode>('baby');
  const selectedTaskId = ref('character.base');
  const babyFieldId = ref('target.worldbook');
  const babyFieldValue = ref('');
  const draft = reactive<WorkshopDraft>({
    targetName: '',
    userNotes: '',
    assistantNotes: '',
  });
  const generatedArtifacts = ref<WorkshopArtifact[]>([]);
  const generatedWritePlan = ref<WorkshopWriteOperation[]>([]);
  const executionPhase = ref<WorkshopExecutionPhase>('idle');
  const executionRecords = ref<WorkshopExecutionRecord[]>([]);

  const modes = computed(() => modeProfiles);
  const tasks = computed(() => taskDefinitions);
  const activeMode = computed(() => modeProfiles.find(item => item.id === mode.value) ?? modeProfiles[0]);
  const availableTasks = computed(() => taskDefinitions.filter(task => task.modes.includes(mode.value)));
  const selectedTask = computed(
    () => availableTasks.value.find(task => task.id === selectedTaskId.value) ?? availableTasks.value[0] ?? taskDefinitions[0],
  );
  const selectedTaskPresetRefs = computed(() => getBabyTaskPresetRefs(selectedTask.value.id));
  const generatedSummary = computed(() => {
    if (!generatedArtifacts.value.length) return '还没有前端生成产物';
    return `${generatedArtifacts.value.length} 个产物 / ${generatedWritePlan.value.length} 个写入动作`;
  });
  const blockedExecutionCount = computed(() => executionRecords.value.filter(record => record.status === 'blocked').length);
  const canApplyGeneratedPlan = computed(
    () => executionPhase.value === 'ready' && generatedWritePlan.value.length > 0 && blockedExecutionCount.value === 0,
  );

  function selectMode(nextMode: WorkshopMode) {
    if (mode.value === nextMode) return;
    mode.value = nextMode;
    const currentTask = taskDefinitions.find(task => task.id === selectedTaskId.value);
    if (!currentTask?.modes.includes(nextMode)) {
      selectedTaskId.value = availableTasks.value[0]?.id ?? taskDefinitions[0].id;
    }
    if (nextMode === 'baby') {
      babyFieldId.value = babyTaskDefaultFields[selectedTaskId.value] ?? 'notes.freeform';
      babyFieldValue.value = '';
    }
    clearGeneratedOutput();
  }

  function selectTask(taskId: string) {
    const task = taskDefinitions.find(item => item.id === taskId);
    if (!task || !task.modes.includes(mode.value)) return;
    selectedTaskId.value = taskId;
    babyFieldId.value = babyTaskDefaultFields[taskId] ?? 'notes.freeform';
    babyFieldValue.value = '';
    clearGeneratedOutput();
  }

  function setBabyField(fieldId: string, value = '') {
    babyFieldId.value = fieldId;
    babyFieldValue.value = value;
  }

  function setBabyFieldValue(value: string) {
    babyFieldValue.value = value;
  }

  function setGeneratedOutput(artifacts: WorkshopArtifact[], writePlan: WorkshopWriteOperation[]) {
    generatedArtifacts.value = artifacts;
    generatedWritePlan.value = writePlan;
    resetExecutionState();
  }

  function clearGeneratedOutput() {
    generatedArtifacts.value = [];
    generatedWritePlan.value = [];
    draft.assistantNotes = '';
    resetExecutionState();
  }

  function setExecutionState(phase: WorkshopExecutionPhase, records: WorkshopExecutionRecord[]) {
    executionPhase.value = phase;
    executionRecords.value = records;
  }

  function resetExecutionState() {
    executionPhase.value = 'idle';
    executionRecords.value = [];
  }

  function buildTaskPrompt(currentCharacterName?: string | null): string {
    const profile = activeMode.value;
    const task = selectedTask.value;
    const targetName = draft.targetName.trim() || currentCharacterName || '<请先确认目标角色或世界书>';
    const notes = draft.assistantNotes?.trim() || draft.userNotes.trim() || '用户还没有补充额外素材，请先用鼓励式问题收集必要信息。';
    const generatedSections = generatedArtifacts.value.length
      ? [
          '',
          '已生成待确认产物（请只做结构、格式、风险和知识库一致性检查；调色盘/三面性/二次解释/NSFW调色盘不得改写创意）：',
          ...generatedArtifacts.value.flatMap(artifact => [
            `## ${artifact.title}`,
            `目标路径：${artifact.targetPath}`,
            `类型：${artifact.contentType} / 风险：${artifact.riskLevel}`,
            '```' + artifact.contentType,
            artifact.content,
            '```',
          ]),
          '',
          '待确认写入计划：',
          ...generatedWritePlan.value.map(
            operation =>
              `- ${operation.tool} ${operation.targetPath}｜${operation.summary}｜风险：${operation.riskLevel}`,
          ),
        ]
      : [];

    return [
      `进入【明月秋青】${profile.title}。`,
      '',
      `当前任务：${task.title}`,
      `任务ID：${task.id}`,
      `目标：${targetName}`,
      '',
      '运行链路：',
      '- 本次任务已经由前端切换到对应写卡预设条目；请继续走当前酒馆预设和当前 API 设置。',
      '- 只有当前酒馆链路明确提供 WTC/LTC/世界书读取工具时，才按宿主工具读取写卡知识库和相关条目。',
      '',
      '模式边界：',
      `- ${profile.authority}`,
      ...profile.guardrails.map(item => `- ${item}`),
      '',
      '任务要求：',
      `- ${task.summary}`,
      `- 第一步：${task.firstAction}`,
      ...task.guardrails.map(item => `- ${item}`),
      '',
      '必须引用：',
      ...task.knowledgeRefs.map(ref => `- ${ref}`),
      '',
      '预期产物：',
      ...task.outputs.map(output => `- ${output}`),
      '',
      '写入边界：',
      ...task.writePlan.map(step => `- ${step}`),
      '',
      '用户补充：',
      notes,
      ...generatedSections,
      '',
      mode.value === 'pro'
        ? '请先 dryrun：列出 @ref、@target、@check、写入计划和风险，不要直接执行 @apply。'
        : '请先提问或生成结构化草案，不要直接写入；所有写入必须等待前端写入计划确认。',
    ].join('\n');
  }

  function buildPlanDraftPrompt(currentCharacterName?: string | null): string {
    const profile = activeMode.value;
    const task = selectedTask.value;
    const targetName = draft.targetName.trim() || currentCharacterName || '<请先确认目标角色或世界书>';
    const userGoal = draft.userNotes.trim() || draft.assistantNotes?.trim() || '用户尚未补充详细目标，请基于当前任务先起草以合理假设驱动的可执行计划；缺口只放入 questions，不要写成 todo。';

    return [
      `进入【明月秋青】${profile.title}的计划草拟流程。`,
      '',
      `当前任务：${task.title}`,
      `任务ID：${task.id}`,
      `目标：${targetName}`,
      '',
      '请根据用户目标只起草一个可执行计划。先用 1-2 句说明你起草了什么，具体 JSON 放进折叠详情。',
      'JSON schema 固定为 mingyue.plan_draft.v2。',
      '',
      '草拟阶段硬限制：',
      '- 这是“等待用户确认计划”的阶段，不是执行阶段。',
      '- 禁止开始执行任何 todo，禁止产出正文草案、世界书正文、变量正文、代码正文或写入动作。',
      '- 禁止输出 mingyue.plan_checkpoint.v2、mingyue.plan_update.v2、mingyue.plan_artifact_delta.v2、mingyue.write_plan.v2。',
      '- 输出计划草稿后必须停住，请用户在前端确认计划或编辑 todo。',
      '',
      '计划约束：',
      '- todo 数量控制在 3-7 个。',
      '- 每个 todo 必须是一次普通 assistant 回复中可产出阶段成果、给出 checkpoint、提出 plan_update 的最小工作单元。',
      '- todo 必须产出阶段成果，例如草案、整理稿、候选方案、结构清单、压缩版本、写入建议；不能只是提问、确认、等待回答或收集信息。',
      '- todo 之间应有清晰顺序和验收边界；不要把“自查”“确认”“询问”“等待用户回答”“继续下一项”写成单独 todo。',
      '- 计划模式不会由前端伪造 user 消息自动循环；用户点击继续时只会触发 /trigger，不新增 user 楼层。',
      '- 每个节点完成时必须在自然语言确认句之前输出 mingyue.plan_checkpoint.v2 与同 checkpointId 的 mingyue.plan_update.v2；二者必须成对。',
      '- 如果产生待写入正文、世界书条目、配置或代码，必须输出 mingyue.plan_artifact_delta.v2 更新产物工作区。',
      '- 协议块必须放在最终自然语言确认之前；最后可见收尾必须像“这一步我先推进到这里，你可以点继续，或直接输入要调整的意见”这种自然语言，不能用 JSON 结尾。',
      '- 不要把写入、归档、关闭计划设为 AI 自动执行；所有状态变更都必须通过 PlanUpdate，且由用户点击继续时才应用。',
      '- 所有写入必须等待前端写入计划确认。',
      '- 如果任务知识库写着“先确认/先询问”，在计划模式下必须改写为：基于现有素材做默认判断或候选方案，把待确认点放入 questions 或 assumptions，不要放进 todos。',
      '- 如果标题需要使用“确认/判定/选择”等词，detail 必须明确要求输出当前判断、候选项、默认假设和待确认清单，而不是等待用户回答。',
      '- 信息不足时仍要给出可执行 todos；缺口放入 questions，合理默认放入 assumptions。',
      '- 只有完全无法产出任何阶段成果时，confidence 才使用 needs_input；普通细节缺失不算硬阻塞。',
      '',
      '任务要求：',
      `- ${task.summary}`,
      `- 第一步：${task.firstAction}`,
      ...task.guardrails.map(item => `- ${item}`),
      '',
      '写入边界：',
      ...task.writePlan.map(step => `- ${step}`),
      '',
      '用户目标：',
      userGoal,
      '',
      '输出格式示例：',
      '<details><summary>已识别计划草稿</summary>',
      '```json',
      '{',
      '  "schema": "mingyue.plan_draft.v2",',
      '  "title": "计划标题",',
      '  "userGoal": "用户目标摘要",',
      '  "successCriteria": ["成功标准"],',
      '  "assumptions": ["必要假设"],',
      '  "todos": [{ "id": "todo-1", "title": "第一步", "detail": "执行说明", "required": true }],',
      '  "activeTodoId": "todo-1",',
      '  "blockers": [],',
      '  "writeBoundary": ["写入边界"],',
      '  "questions": [],',
      '  "confidence": "enough"',
      '}',
      '```',
      '</details>',
    ].join('\n');
  }

  return {
    mode,
    selectedTaskId,
    babyFieldId,
    babyFieldValue,
    draft,
    generatedArtifacts,
    generatedWritePlan,
    executionPhase,
    executionRecords,
    modes,
    tasks,
    activeMode,
    availableTasks,
    selectedTask,
    selectedTaskPresetRefs,
    generatedSummary,
    blockedExecutionCount,
    canApplyGeneratedPlan,
    selectMode,
    selectTask,
    setBabyField,
    setBabyFieldValue,
    setGeneratedOutput,
    clearGeneratedOutput,
    setExecutionState,
    resetExecutionState,
    buildTaskPrompt,
    buildPlanDraftPrompt,
  };
});
