<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import { useWorkshopStore } from '../../stores/workshop';
import { useChatStore } from '../../stores/chat';
import { useCharacterStore } from '../../stores/character';
import { babyFieldGuides, type BabyFieldId } from '../../utils/baby-assistant';
import { createLorebookAction } from '../../utils/wtc-compat';

type VariableType = 'number' | 'string' | 'boolean' | 'enum';

interface MvuVariableDraft {
  name: string;
  type: VariableType;
  defaultValue: string;
  options: string;
  min: string;
  max: string;
  aiVisible: boolean;
  readonly: boolean;
  note: string;
}

interface EjsStageDraft {
  title: string;
  condition: string;
  entryName: string;
  rawText: string;
}

const workshopStore = useWorkshopStore();
const chatStore = useChatStore();
const characterStore = useCharacterStore();
const currentBoundWorldbook = ref('');
const worldbookSetupName = ref('');
const isWorldbookSetupBusy = ref(false);

const mvuRuntimeImport = "import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';";

const variableTypeLabels: Record<VariableType, string> = {
  number: '数字',
  string: '文字',
  boolean: '是/否',
  enum: '固定选项',
};

const baseDraft = reactive({
  name: '',
  age: '',
  gender: '',
  identity: '',
  relationShort: '',
  appearanceFeature: '',
  outfit: '',
  marker: '',
  backgroundImpact: '',
  relationOrigin: '',
  relationInteraction: '',
});

const paletteDraft = reactive({
  kind: '性格调色盘',
  rawText: '',
  note: '',
});

const worldviewDraft = reactive({
  seed: '',
  finalText: '',
  unsure: '',
});

const wardrobeDraft = reactive({
  dailyStyle: '',
  favoriteStyle: '',
  dislikedStyle: '',
  iconicItems: '',
  sceneNotes: '',
});

const mvuDraft = reactive({
  systemName: '',
  updateIntent: '',
  variables: [
    {
      name: '好感度',
      type: 'number' as VariableType,
      defaultValue: '0',
      options: '',
      min: '0',
      max: '100',
      aiVisible: true,
      readonly: false,
      note: '关系推进用数值',
    },
  ] as MvuVariableDraft[],
});

const ejsDraft = reactive({
  controllerName: '调色盘多阶段人设',
  variablePath: '',
  fallbackEntry: '',
  stages: [
    {
      title: '阶段01',
      condition: '低于30',
      entryName: '角色_阶段01',
      rawText: '',
    },
    {
      title: '阶段02',
      condition: '30到70',
      entryName: '角色_阶段02',
      rawText: '',
    },
    {
      title: '阶段03',
      condition: '70以上',
      entryName: '角色_阶段03',
      rawText: '',
    },
  ] as EjsStageDraft[],
});

const mvuStatusDraft = reactive({
  title: '角色状态',
  variables: '',
  style: '清透玉绿色、紧凑横条、适合手机阅读',
  notes: '',
});

const beautifyDraft = reactive({
  pageTitle: '正文小卡片',
  sourceTag: 'story',
  contentType: '普通正文',
  layout: '上方标题，中间正文卡片，底部留一行备注',
  style: '清透纸张、青绿色点缀、文字不要拥挤',
  notes: '',
});

const selectedTaskId = computed(() => workshopStore.selectedTask.id);
const mvuSchemaReady = ref(false);
const selectedStatusVariableKeys = ref<string[]>([]);
const selectedEjsVariableKey = ref('');
const supported = computed(() =>
  [
    'character.base',
    'worldview.write',
    'character.palette',
    'character.wardrobe_prompt',
    'mvu.schema',
    'ejs.stage_palette',
    'frontend.mvu_status_bar',
    'frontend.beautify',
  ].includes(selectedTaskId.value),
);
const hasBoundWorldbook = computed(() => Boolean(currentBoundWorldbook.value.trim()));

const mvuVariableOptions = computed(() =>
  mvuDraft.variables
    .map((variable, index) => {
      const key = mvuVariableKey(variable, index);
      const label = variable.name.trim() || `变量${index + 1}`;
      return {
        key,
        label,
        typeLabel: variableTypeLabels[variable.type],
        note: variable.note.trim(),
        path: `stat_data.${mvuSystemName()}.${key}`,
      };
    })
    .filter(item => item.key.trim()),
);

watch(
  mvuVariableOptions,
  options => {
    const keys = options.map(item => item.key);
    selectedStatusVariableKeys.value = selectedStatusVariableKeys.value.filter(key => keys.includes(key));
    if (mvuSchemaReady.value && selectedStatusVariableKeys.value.length === 0) {
      selectedStatusVariableKeys.value = keys;
    }
    if (!selectedEjsVariableKey.value || !keys.includes(selectedEjsVariableKey.value)) {
      selectedEjsVariableKey.value = keys[0] ?? '';
    }
  },
  { immediate: true },
);

function babyPlaceholder(fieldId: BabyFieldId): string {
  return babyFieldGuides[fieldId].placeholder;
}

function setBabyField(fieldId: BabyFieldId, value = '') {
  workshopStore.setBabyField(fieldId, value);
}

function updateBabyField(fieldId: BabyFieldId, event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  workshopStore.setBabyField(fieldId, target?.value ?? '');
}

function clean(value: string): string {
  return value.trim() || '待补充';
}

function currentCharacterName(fallback = '当前角色'): string {
  try {
    return characterStore.currentCharName || getCurrentCharacterName() || fallback;
  } catch {
    return characterStore.currentCharName || fallback;
  }
}

function worldbookName(fallback = '未命名世界书'): string {
  return workshopStore.draft.targetName.trim() || currentBoundWorldbook.value.trim() || worldbookSetupName.value.trim() || fallback;
}

function characterName(fallback = '未命名角色'): string {
  return baseDraft.name.trim() || currentCharacterName(fallback);
}

function cleanPathPart(value: string): string {
  return clean(value).replace(/[\\/:*?"<>|]/g, '_');
}

function suggestedWorldbookName(): string {
  const character = currentCharacterName('').trim();
  return character ? `${character}世界书` : '我的角色世界书';
}

function refreshBoundWorldbook() {
  try {
    const books = getCharWorldbookNames('current');
    currentBoundWorldbook.value = books.primary ?? '';
    if (currentBoundWorldbook.value) {
      workshopStore.draft.targetName = currentBoundWorldbook.value;
      worldbookSetupName.value = currentBoundWorldbook.value;
    } else if (!worldbookSetupName.value.trim()) {
      worldbookSetupName.value = suggestedWorldbookName();
    }
  } catch (error) {
    console.warn('[BabyWizard] refresh bound worldbook failed:', error);
    if (!worldbookSetupName.value.trim()) {
      worldbookSetupName.value = suggestedWorldbookName();
    }
  }
}

async function createAndBindWorldbook() {
  const character = currentCharacterName('').trim();
  if (!character) {
    toastr.warning('先在酒馆里打开当前角色卡，我才能绑定角色世界书。');
    return;
  }

  const target = cleanPathPart(worldbookSetupName.value || suggestedWorldbookName());
  if (!target || target === '待补充') {
    toastr.warning('先给这个角色的世界书起个名字。');
    return;
  }

  isWorldbookSetupBusy.value = true;
  try {
    if (!getWorldbookNames().includes(target)) {
      await createLorebookAction({ lorebook_name: target });
    }

    const previous = getCharWorldbookNames('current');
    await rebindCharWorldbooks('current', {
      primary: target,
      additional: (previous.additional ?? []).filter(name => name !== target),
    });

    currentBoundWorldbook.value = target;
    worldbookSetupName.value = target;
    workshopStore.draft.targetName = target;
    toastr.success(`已准备好世界书：${target}`);
  } catch (error) {
    console.error('[BabyWizard] create and bind worldbook failed:', error);
    toastr.error(error instanceof Error ? error.message : '创建或绑定世界书失败');
  } finally {
    isWorldbookSetupBusy.value = false;
  }
}

watch(
  () => characterStore.currentCharName,
  () => refreshBoundWorldbook(),
  { immediate: true },
);

function goToMvuSchemaTask() {
  workshopStore.selectTask('mvu.schema');
  toastr.info('先把 MVU 基础变量填好，我再帮你接状态栏或多阶段。');
}

function yamlScalar(value: string): string {
  return JSON.stringify(clean(value));
}

function yamlBlock(value: string, indent = 4): string[] {
  const pad = ' '.repeat(indent);
  return clean(value)
    .split(/\r?\n/)
    .map(line => `${pad}${line || ' '}`);
}

function yamlOptionalScalarLine(indent: number, key: string, value: string): string[] {
  const text = value.trim();
  return text ? [`${' '.repeat(indent)}${key}: ${JSON.stringify(text)}`] : [];
}

function yamlOptionalBlock(indent: number, key: string, value: string): string[] {
  const text = value.trim();
  if (!text) return [];
  const blockPad = ' '.repeat(indent + 2);
  return [
    `${' '.repeat(indent)}${key}: |-`,
    ...text.split(/\r?\n/).map(line => `${blockPad}${line || ' '}`),
  ];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeTagName(value: string, fallback: string): string {
  const tag = value
    .trim()
    .replace(/[^\w-]/g, '_')
    .replace(/^_+|_+$/g, '');
  return tag || fallback;
}

function regexFrontMatter(findRegex: string, replaceString: string, prefix: string): string {
  return [
    '---',
    `id: ${JSON.stringify(artifactId(prefix))}`,
    'enabled: true',
    `find_regex: ${JSON.stringify(findRegex)}`,
    'trim_strings: []',
    'source:',
    '  user_input: false',
    '  ai_output: true',
    '  slash_command: false',
    '  world_info: false',
    'destination:',
    '  display: true',
    '  prompt: false',
    'run_on_edit: true',
    'min_depth: null',
    'max_depth: null',
    '---',
    replaceString,
  ].join('\n');
}

function artifactId(prefix: string, index = 0): string {
  return `${prefix}-${Date.now()}-${index}`;
}

function noRecursionPatch() {
  return {
    prevent_incoming: true,
    prevent_outgoing: true,
  };
}

function constantAfterCharacterPatch(order = 99) {
  return {
    enabled: true,
    strategy: { type: 'constant' },
    position: { type: 'after_character_definition', order },
    recursion: noRecursionPatch(),
  };
}

function constantBeforeCharacterPatch(order = 100, enabled = true) {
  return {
    enabled,
    strategy: { type: 'constant' },
    position: { type: 'before_character_definition', order },
    recursion: noRecursionPatch(),
  };
}

function d0SystemPatch(order = 200) {
  return atDepthSystemPatch(0, order);
}

function atDepthSystemPatch(depth: number, order = 200, enabled = true) {
  return {
    enabled,
    strategy: { type: 'constant' },
    position: { type: 'at_depth', depth, role: 'system', order },
    recursion: noRecursionPatch(),
  };
}

function mvuOutputFormatPatch() {
  try {
    const preset = getPreset('in_use');
    return atDepthSystemPatch(preset.settings.max_context >= 2_000_000 ? 0 : 4, 200);
  } catch {
    return d0SystemPatch(200);
  }
}

function createLorebookOperation(target: string) {
  return {
    id: artifactId('create-lorebook'),
    tool: 'CreateLorebook' as const,
    lorebookName: target,
    targetPath: `/Worldbooks/${target}`,
    summary: '如果目标世界书不存在，则先创建空世界书',
    riskLevel: 'config' as const,
    optional: true,
    skipIfExists: true,
  };
}

function buildBaseYaml(): string {
  return [
    '角色档案:',
    '  基本信息:',
    ...yamlOptionalScalarLine(4, '姓名', baseDraft.name),
    ...yamlOptionalScalarLine(4, '年龄', baseDraft.age),
    ...yamlOptionalScalarLine(4, '性别', baseDraft.gender),
    ...yamlOptionalScalarLine(4, '身份', baseDraft.identity),
    ...yamlOptionalScalarLine(4, '与用户关系', baseDraft.relationShort),
    '  外貌特征:',
    ...yamlOptionalScalarLine(4, '偏离默认的特征', baseDraft.appearanceFeature),
    ...yamlOptionalScalarLine(4, '穿着风格', baseDraft.outfit),
    ...yamlOptionalScalarLine(4, '标志性细节', baseDraft.marker),
    '  背景设定:',
    ...yamlOptionalScalarLine(4, '关键影响', baseDraft.backgroundImpact),
    '  关系设定:',
    ...yamlOptionalScalarLine(4, '认识过程', baseDraft.relationOrigin),
    ...yamlOptionalScalarLine(4, '互动方式', baseDraft.relationInteraction),
  ].join('\n');
}

function buildPaletteYaml(): string {
  return [
    `${clean(paletteDraft.kind)}:`,
    ...yamlOptionalBlock(2, '原文', paletteDraft.rawText),
    ...yamlOptionalBlock(2, '用户说明', paletteDraft.note),
  ].join('\n');
}

function latestAssistantContent(): string {
  chatStore.refreshMessages();
  const latest = [...chatStore.messages].reverse().find(message => message.role === 'assistant' && message.content.trim());
  return latest?.content ?? '';
}

function cleanAssistantContent(content: string): string {
  const contentMatch = content.match(/<content>([\s\S]*?)<\/content>/i);
  const selected = contentMatch?.[1] ?? content;
  return selected
    .replace(/<details>[\s\S]*?<\/details>/gi, '')
    .replace(/\[(?:metacognition|love_qkll)\][\s\S]*?(?=\n\n|$)/gi, '')
    .trim();
}

function importLatestAssistantToWorldview() {
  const content = cleanAssistantContent(latestAssistantContent());
  if (!content) {
    toastr.warning('还没有读到秋青子的回复。先去右边聊一轮。');
    return;
  }

  worldviewDraft.finalText = content;
  workshopStore.draft.userNotes = content;
  setBabyField('worldview.final', content);
  toastr.success('已把秋青子最新回复放进世界观工作台');
}

function worldviewSourceText(): string {
  return worldviewDraft.finalText.trim() || workshopStore.draft.userNotes.trim() || worldviewDraft.seed.trim();
}

function buildWorldviewContent(): string {
  return worldviewSourceText().trim();
}

function buildWardrobeContent(): string {
  return [
    '衣柜精简提示词:',
    ...yamlOptionalScalarLine(2, '日常常穿', wardrobeDraft.dailyStyle),
    ...yamlOptionalScalarLine(2, '特殊偏爱', wardrobeDraft.favoriteStyle),
    ...yamlOptionalScalarLine(2, '讨厌或不要出现', wardrobeDraft.dislikedStyle),
    ...yamlOptionalScalarLine(2, '标志物', wardrobeDraft.iconicItems),
    ...yamlOptionalBlock(2, '特殊场景', wardrobeDraft.sceneNotes),
  ].join('\n');
}

function mvuSystemName(): string {
  return clean(mvuDraft.systemName === '' ? characterName('角色') : mvuDraft.systemName);
}

function mvuVariableKey(variable: MvuVariableDraft, index: number): string {
  const rawName = variable.name.trim() || `变量${index + 1}`;
  if (!variable.aiVisible && !rawName.startsWith('$')) return `$${rawName}`;
  if (variable.readonly && !rawName.startsWith('_') && !rawName.startsWith('$')) return `_${rawName}`;
  return rawName;
}

function parseMvuValue(variable: MvuVariableDraft): string | number | boolean {
  const raw = variable.defaultValue.trim();
  if (variable.type === 'number') {
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }
  if (variable.type === 'boolean') {
    return /^(true|1|是|yes)$/i.test(raw);
  }
  return raw || '待初始化';
}

function mvuValueLiteral(variable: MvuVariableDraft): string {
  return JSON.stringify(parseMvuValue(variable));
}

function mvuEnumOptions(variable: MvuVariableDraft): string[] {
  const values = variable.options
    .split(/[,，、/|\n]+/)
    .map(item => item.trim())
    .filter(Boolean);
  const defaultValue = String(parseMvuValue(variable)).trim();
  const merged = defaultValue && !values.includes(defaultValue) ? [defaultValue, ...values] : values;
  return [...new Set(merged)];
}

function mvuRangeValues(variable: MvuVariableDraft): { min: number | null; max: number | null } {
  const min = Number(variable.min);
  const max = Number(variable.max);
  if (Number.isFinite(min) && Number.isFinite(max)) {
    return { min: Math.min(min, max), max: Math.max(min, max) };
  }
  return {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
  };
}

function mvuRangeText(variable: MvuVariableDraft): string {
  const { min, max } = mvuRangeValues(variable);
  if (min !== null && max !== null) return `${min}~${max}`;
  if (min !== null) return `不低于${min}`;
  if (max !== null) return `不高于${max}`;
  return '';
}

function mvuRuleType(variable: MvuVariableDraft): string {
  if (variable.type === 'number') return 'number';
  if (variable.type === 'boolean') return 'boolean';
  if (variable.type === 'enum') {
    const options = mvuEnumOptions(variable);
    return options.length ? options.map(option => JSON.stringify(option)).join(' | ') : 'string';
  }
  return '';
}

function mvuSchemaExpression(variable: MvuVariableDraft): string {
  if (variable.type === 'number') {
    const { min, max } = mvuRangeValues(variable);
    const base = `z.coerce.number().prefault(${mvuValueLiteral(variable)})`;
    if (min !== null || max !== null) {
      return `${base}.transform(value => _.clamp(value, ${min ?? 'Number.NEGATIVE_INFINITY'}, ${max ?? 'Number.POSITIVE_INFINITY'}))`;
    }
    return base;
  }
  if (variable.type === 'boolean') {
    return `z.boolean().prefault(${mvuValueLiteral(variable)})`;
  }
  if (variable.type === 'enum') {
    const options = mvuEnumOptions(variable);
    if (options.length > 0) {
      return `z.enum([${options.map(option => JSON.stringify(option)).join(', ')}]).prefault(${mvuValueLiteral(variable)})`;
    }
  }
  return `z.string().prefault(${mvuValueLiteral(variable)})`;
}

function buildMvuSchemaContent(): string {
  const systemName = mvuSystemName();
  const fields = mvuDraft.variables.map((variable, index) => {
    return `    ${JSON.stringify(mvuVariableKey(variable, index))}: ${mvuSchemaExpression(variable)},`;
  });

  return [
    "import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';",
    '',
    'export const Schema = z.object({',
    `  ${JSON.stringify(systemName)}: z.object({`,
    ...fields,
    '  }),',
    '});',
    '',
    '$(() => {',
    '  registerMvuSchema(Schema);',
    '})',
  ].join('\n');
}

function buildMvuInitvarContent(): string {
  const systemName = mvuSystemName();
  return [
    `${systemName}:`,
    ...mvuDraft.variables.map((variable, index) => {
      const value = parseMvuValue(variable);
      return `  ${mvuVariableKey(variable, index)}: ${typeof value === 'string' ? JSON.stringify(value) : value}`;
    }),
  ].join('\n');
}

function buildMvuListContent(): string {
  return ['---', '<status_current_variables>', '{{format_message_variable::stat_data}}', '</status_current_variables>'].join(
    '\n',
  );
}

function buildMvuUpdateRulesContent(): string {
  const systemName = mvuSystemName();
  const updateIntent = clean(mvuDraft.updateIntent);
  const lines = ['---', '变量更新规则:', `  ${systemName}:`];
  let writableCount = 0;
  mvuDraft.variables.forEach((variable, index) => {
    const key = mvuVariableKey(variable, index);
    if (variable.readonly || !variable.aiVisible || key.startsWith('_') || key.startsWith('$')) return;
    writableCount += 1;
    const range = variable.type === 'number' ? mvuRangeText(variable) : '';
    const type = mvuRuleType(variable);
    lines.push(`    ${key}:`);
    if (type) lines.push(`      type: ${type}`);
    if (range) lines.push(`      range: ${range}`);
    lines.push('      check:');
    lines.push(`        - ${clean(variable.note === '' ? updateIntent : variable.note)}`);
  });
  if (writableCount === 0) return ['---', '变量更新规则: {}'].join('\n');
  return lines.join('\n');
}

function buildMvuOutputFormatContent(): string {
  return [
    '---',
    '变量输出格式:',
    '  rule:',
    '    - you must output the update analysis and the actual update commands at once in the end of the next reply',
    '    - the update commands works like the **JSON Patch (RFC 6902)** standard, must be a valid JSON array containing operation objects, but supports the following operations instead:',
    '      - replace: replace the value of existing paths',
    '      - delta: update the value of existing number paths by a delta value',
    '      - insert: insert new items into an object or array (using `-` as array index intends appending to the end)',
    '      - remove',
    '      - move',
    "    - don't update field names starts with `_` as they are readonly, such as `_变量`",
    '  format: |-',
    '    <UpdateVariable>',
    '    <Analysis>$(IN ENGLISH, no more than 80 words)',
    '    - ${calculate time passed: ...}',
    "    - ${decide whether dramatic updates are allowed as it's in a special case or the time passed is more than usual: yes/no}",
    '    - ${analyze every variable based on its corresponding `check`, according only to current reply instead of previous plots: ...}',
    '    </Analysis>',
    '    <JSONPatch>',
    '    [',
    '      { "op": "replace", "path": "${/path/to/variable}", "value": "${new_value}" },',
    '      { "op": "delta", "path": "${/path/to/number/variable}", "value": "${positive_or_negative_delta}" },',
    '      { "op": "insert", "path": "${/path/to/object/new_key}", "value": "${new_value}" },',
    '      { "op": "insert", "path": "${/path/to/array/-}", "value": "${new_value}" },',
    '      { "op": "remove", "path": "${/path/to/object/key}" },',
    '      { "op": "remove", "path": "${/path/to/array/0}" },',
    '      { "op": "move", "from": "${/path/to/variable}", "to": "${/path/to/another/path}" },',
    '      ...',
    '    ]',
    '    </JSONPatch>',
    '    </UpdateVariable>',
  ].join('\n');
}

function buildMvuOutputFormatEmphasizeContent(): string {
  return [
    '---',
    '变量输出格式强调:',
    '  rule: The following must be inserted to the end of reply, and cannot be omitted',
    '  format: |-',
    '    <UpdateVariable>',
    '    ...',
    '    </UpdateVariable>',
  ].join('\n');
}

function selectedEjsVariablePath(): string {
  const option = mvuVariableOptions.value.find(item => item.key === selectedEjsVariableKey.value);
  return option?.path ?? `stat_data.${mvuSystemName()}.${mvuVariableOptions.value[0]?.key ?? '好感度'}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ejsCondition(rawCondition: string, variablePath: string): string {
  const pathParts = variablePath.split('.').filter(Boolean);
  const pathTail = pathParts[pathParts.length - 1] ?? '好感度';
  const condition = rawCondition.trim();
  if (!condition) return 'qz_stage_value !== undefined';
  if (condition.includes('qz_stage_value')) return condition;
  if (/^[<>!=\s\d.&|()]+$/.test(condition)) return condition.replace(new RegExp(escapeRegExp(pathTail), 'g'), 'qz_stage_value');

  const normalized = condition.replace(/\s+/g, '');
  const rangeMatch = normalized.match(/(-?\d+(?:\.\d+)?)(?:到|至|~|-)(-?\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return `qz_stage_value >= ${rangeMatch[1]} && qz_stage_value < ${rangeMatch[2]}`;
  }

  const numberMatch = normalized.match(/-?\d+(?:\.\d+)?/);
  if (numberMatch) {
    const value = numberMatch[0];
    if (/低于|小于|不到|以下/.test(normalized)) return `qz_stage_value < ${value}`;
    if (/高于|大于|超过/.test(normalized)) return `qz_stage_value > ${value}`;
    if (/至少|不低于|达到|以上|及以上/.test(normalized)) return `qz_stage_value >= ${value}`;
    if (/不超过|最多|以内|及以下/.test(normalized)) return `qz_stage_value <= ${value}`;
  }

  return condition.replace(new RegExp(escapeRegExp(pathTail), 'g'), 'qz_stage_value');
}

function buildEjsStagePaletteContent(): string {
  const variablePath = selectedEjsVariablePath();
  const stages = ejsDraft.stages.map((stage, index) => ({
    ...stage,
    title: clean(stage.title === '' ? `阶段${index + 1}` : stage.title),
    condition: ejsCondition(stage.condition, variablePath),
  }));
  const lines = [
    '<%_',
    `if (typeof qz_stage_value === 'undefined') var qz_stage_value = getvar(${JSON.stringify(variablePath)}, { defaults: 0 });`,
    '_%>',
  ];

  stages.forEach((stage, index) => {
    if (index === 0) {
      lines.push(`<%_ if (${stage.condition}) { _%>`);
    } else if (index === stages.length - 1) {
      lines.push('<%_ } else { _%>');
    } else {
      lines.push(`<%_ } else if (${stage.condition}) { _%>`);
    }
    lines.push(`${stage.title}:`);
    lines.push('  用户手写阶段调色盘: |-');
    lines.push(...yamlBlock(stage.rawText, 4));
  });

  lines.push('<%_ } _%>');
  return lines.join('\n');
}

function addMvuVariable() {
  mvuDraft.variables.push({
    name: '',
    type: 'number',
    defaultValue: '0',
    options: '',
    min: '',
    max: '',
    aiVisible: true,
    readonly: false,
    note: '',
  });
}

function removeMvuVariable(index: number) {
  if (mvuDraft.variables.length <= 1) return;
  mvuDraft.variables.splice(index, 1);
}

function addEjsStage() {
  const next = ejsDraft.stages.length + 1;
  ejsDraft.stages.push({
    title: `阶段${String(next).padStart(2, '0')}`,
    condition: '',
    entryName: `角色_阶段${String(next).padStart(2, '0')}`,
    rawText: '',
  });
}

function removeEjsStage(index: number) {
  if (ejsDraft.stages.length <= 2) return;
  ejsDraft.stages.splice(index, 1);
}

function applyBaseDraft() {
  const target = cleanPathPart(worldbookName());
  const character = cleanPathPart(characterName());
  const basePath = `/Worldbooks/${target}/角色/${character}/基础信息`;
  const baseArtifactId = artifactId('character-base');
  const content = buildBaseYaml();
  workshopStore.draft.assistantNotes = [
    '【宝宝辅食结构化素材：角色基础】',
    '处理边界：按《调色盘人设与台词人设/教程》处理；不要替用户写性格；不要补用户没写的核心创意；先夸具体优点，再提示缺口。',
    '',
    '角色档案:',
    '  基本信息:',
    `    姓名: ${clean(baseDraft.name)}`,
    `    年龄: ${clean(baseDraft.age)}`,
    `    性别: ${clean(baseDraft.gender)}`,
    `    身份: ${clean(baseDraft.identity)}`,
    `    与{{user}}关系: ${clean(baseDraft.relationShort)}`,
    '  外貌特征:',
    `    偏离默认的特征: ${clean(baseDraft.appearanceFeature)}`,
    `    穿着/风格: ${clean(baseDraft.outfit)}`,
    `    标志性细节: ${clean(baseDraft.marker)}`,
    '  背景设定:',
    `    关键影响: ${clean(baseDraft.backgroundImpact)}`,
    '  关系设定:',
    `    认识过程: ${clean(baseDraft.relationOrigin)}`,
    `    互动方式: ${clean(baseDraft.relationInteraction)}`,
    '',
    '如果某项是“待补充”，请只追问这一项，不要替用户脑补。',
  ].join('\n');
  workshopStore.setGeneratedOutput(
    [
      {
        id: baseArtifactId,
        title: '角色基础整理稿',
        contentType: 'yaml',
        targetPath: basePath,
        content,
        riskLevel: 'text',
      },
    ],
    [
      createLorebookOperation(target),
      {
        id: artifactId('character-base-write'),
        tool: 'Write',
        artifactId: baseArtifactId,
        targetPath: basePath,
        summary: '写入用户已填写的基础信息，不补性格与核心创意',
        riskLevel: 'text',
      },
      {
        id: artifactId('character-base-attr'),
        tool: 'SetAttribute',
        targetPath: basePath,
        summary: '单角色默认蓝灯常驻；多角色时跟随角色详细信息；不可递归 + 防进一步递归',
        riskLevel: 'config',
        attributes: constantAfterCharacterPatch(99),
      },
    ],
  );
  toastr.success('角色基础整理稿已准备好，先检查再写入');
}

function applyPaletteDraft() {
  const target = cleanPathPart(worldbookName());
  const character = cleanPathPart(characterName());
  const paletteArtifactId = artifactId('palette');
  const palettePath = `/Worldbooks/${target}/角色/${character}/${cleanPathPart(paletteDraft.kind)}`;
  const content = buildPaletteYaml();
  workshopStore.draft.assistantNotes = [
    `【宝宝辅食结构化素材：${paletteDraft.kind}】`,
    '处理边界：这是用户手写的核心人设。禁止 AI 自查、改写、评判创意；只允许修错字、清理明显重复、转成 YAML 层级，并用鼓励方式提问缺口。',
    '',
    '用户原始手写内容:',
    clean(paletteDraft.rawText),
    '',
    '用户额外说明:',
    clean(paletteDraft.note),
  ].join('\n');
  workshopStore.setGeneratedOutput(
    [
      {
        id: paletteArtifactId,
        title: `${clean(paletteDraft.kind)}整理稿`,
        contentType: 'yaml',
        targetPath: palettePath,
        content,
        riskLevel: 'text',
      },
    ],
    [
      createLorebookOperation(target),
      {
        id: artifactId('palette-write'),
        tool: 'Write',
        artifactId: paletteArtifactId,
        targetPath: palettePath,
        summary: '写入用户手写调色盘的 YAML 化结果，只允许修错字和格式',
        riskLevel: 'text',
      },
      {
        id: artifactId('palette-attr'),
        tool: 'SetAttribute',
        targetPath: palettePath,
        summary: '单角色蓝灯；多角色角色详细信息绿灯；不可递归 + 防进一步递归',
        riskLevel: 'config',
        attributes: constantAfterCharacterPatch(99),
      },
    ],
  );
  toastr.success('调色盘已生成保留原味的整理预览');
}

function applyWorldviewDraft() {
  const target = cleanPathPart(worldbookName());
  const worldviewArtifactId = artifactId('worldview');
  const worldviewPath = `/Worldbooks/${target}/世界观/总纲`;
  const content = buildWorldviewContent();
  workshopStore.draft.assistantNotes = [
    '【宝宝辅食结构化素材：世界观】',
    '处理边界：世界观可以通过聊天慢慢聊出来；只整理用户已经确认的最终稿，不替用户扩写成小说设定集。',
    '',
    '最初想法:',
    clean(worldviewDraft.seed),
    '',
    '最终整理稿:',
    clean(worldviewSourceText()),
    '',
    '还不确定:',
    clean(worldviewDraft.unsure),
  ].join('\n');
  workshopStore.setGeneratedOutput(
    [
      {
        id: worldviewArtifactId,
        title: '世界观整理稿',
        contentType: 'yaml',
        targetPath: worldviewPath,
        content,
        riskLevel: 'text',
      },
    ],
    [
      createLorebookOperation(target),
      {
        id: artifactId('worldview-write'),
        tool: 'Write',
        artifactId: worldviewArtifactId,
        targetPath: worldviewPath,
        summary: '写入用户确认后的世界观整理稿',
        riskLevel: 'text',
      },
      {
        id: artifactId('worldview-attr'),
        tool: 'SetAttribute',
        targetPath: worldviewPath,
        summary: '世界观总纲：角色定义前 order 1；不可递归 + 防进一步递归',
        riskLevel: 'config',
        attributes: constantBeforeCharacterPatch(1),
      },
    ],
  );
  toastr.success('世界观整理稿已准备好，先检查再写入');
}

function applyWardrobeDraft() {
  const target = cleanPathPart(worldbookName());
  const character = cleanPathPart(characterName());
  const wardrobeArtifactId = artifactId('wardrobe');
  const wardrobePath = `/Worldbooks/${target}/角色/${character}/衣柜`;
  const content = buildWardrobeContent();
  workshopStore.draft.assistantNotes = [
    '【宝宝辅食结构化素材：衣柜精简提示词】',
    '处理边界：衣柜只保留风格、偏爱、禁忌和标志物；不展开复杂衣装系统。',
    '',
    `日常常穿: ${clean(wardrobeDraft.dailyStyle)}`,
    `特殊偏爱: ${clean(wardrobeDraft.favoriteStyle)}`,
    `讨厌或不要出现: ${clean(wardrobeDraft.dislikedStyle)}`,
    `标志物: ${clean(wardrobeDraft.iconicItems)}`,
    '',
    '特殊场景:',
    clean(wardrobeDraft.sceneNotes),
  ].join('\n');
  workshopStore.setGeneratedOutput(
    [
      {
        id: wardrobeArtifactId,
        title: '衣柜精简提示词',
        contentType: 'yaml',
        targetPath: wardrobePath,
        content,
        riskLevel: 'text',
      },
    ],
    [
      createLorebookOperation(target),
      {
        id: artifactId('wardrobe-write'),
        tool: 'Write',
        artifactId: wardrobeArtifactId,
        targetPath: wardrobePath,
        summary: '写入精简穿衣风格提示词',
        riskLevel: 'text',
      },
      {
        id: artifactId('wardrobe-attr'),
        tool: 'SetAttribute',
        targetPath: wardrobePath,
        summary: '跟随角色详细信息：角色定义后 order 99；不可递归 + 防进一步递归',
        riskLevel: 'config',
        attributes: constantAfterCharacterPatch(99),
      },
    ],
  );
  toastr.success('衣柜精简提示词已准备好，先检查再写入');
}

function applyMvuDraft() {
  const target = cleanPathPart(worldbookName(mvuSystemName()));
  const character = 'current';
  const runtimeArtifactId = artifactId('mvu-runtime');
  const schemaArtifactId = artifactId('mvu-schema');
  const initvarArtifactId = artifactId('mvu-initvar');
  const listArtifactId = artifactId('mvu-list');
  const rulesArtifactId = artifactId('mvu-rules');
  const formatArtifactId = artifactId('mvu-format');
  const formatEmphasisArtifactId = artifactId('mvu-format-emphasis');
  const artifacts = [
    {
      id: runtimeArtifactId,
      title: 'MVU脚本本体',
      contentType: 'ts' as const,
      targetPath: `/Characters/${character}/Scripts/MVU`,
      content: mvuRuntimeImport,
      riskLevel: 'code' as const,
    },
    {
      id: schemaArtifactId,
      title: '变量功能',
      contentType: 'ts' as const,
      targetPath: `/Characters/${character}/Scripts/变量结构`,
      content: buildMvuSchemaContent(),
      riskLevel: 'code' as const,
    },
    {
      id: initvarArtifactId,
      title: '开局状态',
      contentType: 'yaml' as const,
      targetPath: `/Worldbooks/${target}/[initvar]变量初始化勿开`,
      content: buildMvuInitvarContent(),
      riskLevel: 'config' as const,
    },
    {
      id: listArtifactId,
      title: '变量列表',
      contentType: 'text' as const,
      targetPath: `/Worldbooks/${target}/变量列表`,
      content: buildMvuListContent(),
      riskLevel: 'config' as const,
    },
    {
      id: rulesArtifactId,
      title: '更新规则',
      contentType: 'yaml' as const,
      targetPath: `/Worldbooks/${target}/[mvu_update]变量更新规则`,
      content: buildMvuUpdateRulesContent(),
      riskLevel: 'config' as const,
    },
    {
      id: formatArtifactId,
      title: '回复格式',
      contentType: 'yaml' as const,
      targetPath: `/Worldbooks/${target}/[mvu_update]变量输出格式`,
      content: buildMvuOutputFormatContent(),
      riskLevel: 'config' as const,
    },
    {
      id: formatEmphasisArtifactId,
      title: '备用更新提醒',
      contentType: 'yaml' as const,
      targetPath: `/Worldbooks/${target}/[mvu_update]变量输出格式强调`,
      content: buildMvuOutputFormatEmphasizeContent(),
      riskLevel: 'config' as const,
    },
  ];
  workshopStore.draft.assistantNotes = [
    '【宝宝辅食结构化素材：MVU基础变量】',
    '处理边界：宝宝辅食模式不让 AI 自由写 schema；请根据字段表生成完整 MVU 链路，并严格执行 MVU_ZOD 指南。',
    '',
    `变量系统名: ${clean(mvuDraft.systemName)}`,
    `当前角色: ${character}`,
    `目标世界书: ${target}`,
    `更新意图: ${clean(mvuDraft.updateIntent)}`,
    '',
    '变量字段:',
    ...mvuDraft.variables.map((variable, index) =>
      [
        `  - 序号: ${index + 1}`,
        `    名称: ${clean(variable.name)}`,
        `    类型: ${variable.type}`,
        `    开局值: ${clean(variable.defaultValue)}`,
        `    固定选项: ${clean(variable.options)}`,
        `    最小值: ${clean(variable.min)}`,
        `    最大值: ${clean(variable.max)}`,
        `    发给AI: ${variable.aiVisible ? '是' : '否，使用$前缀或等效隐藏策略'}`,
        `    只读: ${variable.readonly ? '是，使用_前缀或等效只读策略' : '否'}`,
        `    用途: ${clean(variable.note)}`,
      ].join('\n'),
    ),
    '',
    '生成要求：用户填写决定初始变量、变量更新规则和变量结构脚本；MVU脚本本体、变量列表、变量输出格式、变量输出格式强调使用固定模板直接写入。',
  ].join('\n');
  workshopStore.setGeneratedOutput(
    artifacts,
    [
      createLorebookOperation(target),
      ...artifacts.map(artifact => ({
        id: `${artifact.id}-write`,
        tool: 'Write' as const,
        artifactId: artifact.id,
        targetPath: artifact.targetPath,
        summary: `写入 ${artifact.title}`,
        riskLevel: artifact.riskLevel,
        ...(artifact.id === runtimeArtifactId ? { skipIfContentIncludes: mvuRuntimeImport } : {}),
      })),
      {
        id: artifactId('mvu-initvar-attr'),
        tool: 'SetAttribute' as const,
        targetPath: `/Worldbooks/${target}/[initvar]变量初始化勿开`,
        summary: '禁用状态；D4/system order 200；不可递归 + 防进一步递归',
        riskLevel: 'config' as const,
        attributes: atDepthSystemPatch(4, 200, false),
      },
      {
        id: artifactId('mvu-list-attr'),
        tool: 'SetAttribute' as const,
        targetPath: `/Worldbooks/${target}/变量列表`,
        summary: 'D0/system order 200；不可递归 + 防进一步递归',
        riskLevel: 'config' as const,
        attributes: d0SystemPatch(200),
      },
      {
        id: artifactId('mvu-rules-attr'),
        tool: 'SetAttribute' as const,
        targetPath: `/Worldbooks/${target}/[mvu_update]变量更新规则`,
        summary: 'D0/system order 200；不可递归',
        riskLevel: 'config' as const,
        attributes: d0SystemPatch(200),
      },
      {
        id: artifactId('mvu-format-attr'),
        tool: 'SetAttribute' as const,
        targetPath: `/Worldbooks/${target}/[mvu_update]变量输出格式`,
        summary: '按当前预设模型自动选择深度；Gemini D0，Claude D4；不可递归',
        riskLevel: 'config' as const,
        attributes: mvuOutputFormatPatch(),
      },
      {
        id: artifactId('mvu-format-emphasis-attr'),
        tool: 'SetAttribute' as const,
        targetPath: `/Worldbooks/${target}/[mvu_update]变量输出格式强调`,
        summary: '备用条目默认关闭；测试时发现 AI 不输出变量更新再开启',
        riskLevel: 'config' as const,
        attributes: atDepthSystemPatch(0, 200, false),
      },
    ],
  );
  mvuSchemaReady.value = true;
  selectedStatusVariableKeys.value = mvuVariableOptions.value.map(item => item.key);
  selectedEjsVariableKey.value = selectedEjsVariableKey.value || mvuVariableOptions.value[0]?.key || '';
  toastr.success('MVU 成套产物已生成，先让前端过一遍硬约束');
}

function applyEjsStageDraft() {
  if (!mvuSchemaReady.value) {
    goToMvuSchemaTask();
    return;
  }

  const target = cleanPathPart(worldbookName());
  const character = cleanPathPart(characterName());
  const controllerName = cleanPathPart(ejsDraft.controllerName);
  const ejsArtifactId = artifactId('ejs-stage-palette');
  const content = buildEjsStagePaletteContent();
  const selectedVariable = mvuVariableOptions.value.find(item => item.key === selectedEjsVariableKey.value);
  workshopStore.draft.assistantNotes = [
    '【宝宝辅食结构化素材：多阶段人设】',
    '处理边界：阶段人设文字由用户手写，禁止 AI 改写创意；这里使用调色盘多阶段的一体化 EJS 写法，不拆成被 getwi 加载的禁用条目。',
    '',
    `条目名: ${clean(ejsDraft.controllerName)}`,
    `用于判断阶段的变量: ${selectedVariable?.label ?? selectedEjsVariableKey.value}`,
    `内部变量路径: ${selectedEjsVariablePath()}`,
    `兜底说明: ${clean(ejsDraft.fallbackEntry)}`,
    '',
    '阶段设置:',
    ...ejsDraft.stages.map((stage, index) =>
      [
        `  - 序号: ${index + 1}`,
        `    阶段名: ${clean(stage.title)}`,
        `    条件: ${clean(stage.condition)}`,
        `    阶段标识: ${clean(stage.entryName)}`,
        '    用户手写阶段文字: |',
        ...clean(stage.rawText).split('\n').map(line => `      ${line}`),
      ].join('\n'),
    ),
    '',
    '生成要求：变量读取使用 typeof + var；MVU变量路径必须带 stat_data；只检查 EJS 结构和阶段覆盖，不检查调色盘创意本身。',
  ].join('\n');
  workshopStore.setGeneratedOutput(
    [
      {
        id: ejsArtifactId,
        title: '多阶段人设切换',
        contentType: 'ejs',
        targetPath: `/Worldbooks/${target}/角色/${character}/${controllerName}`,
        content,
        riskLevel: 'code',
      },
    ],
    [
      createLorebookOperation(target),
      {
        id: artifactId('ejs-stage-palette-write'),
        tool: 'Write',
        artifactId: ejsArtifactId,
        targetPath: `/Worldbooks/${target}/角色/${character}/${controllerName}`,
        summary: '写入多阶段人设切换条目，不拆禁用阶段条目',
        riskLevel: 'code',
      },
      {
        id: artifactId('ejs-stage-palette-attr'),
        tool: 'SetAttribute',
        targetPath: `/Worldbooks/${target}/角色/${character}/${controllerName}`,
        summary: '与角色详细信息同位：角色定义后 order 99；不可递归 + 防进一步递归',
        riskLevel: 'config',
        attributes: constantAfterCharacterPatch(99),
      },
    ],
  );
  toastr.success('多阶段人设已准备好，先检查再写入');
}

function mvuStatusVariablePaths(): string[] {
  if (mvuSchemaReady.value) {
    const selected = new Set(selectedStatusVariableKeys.value);
    return mvuVariableOptions.value.filter(item => selected.has(item.key)).map(item => item.path);
  }

  return mvuStatusDraft.variables
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function buildMvuStatusHtml(): string {
  const title = escapeHtml(clean(mvuStatusDraft.title));
  const styleText = escapeHtml(clean(mvuStatusDraft.style));
  const paths = mvuStatusVariablePaths();
  const items = paths;
  const itemMarkup = items
    .map(path => {
      const label = escapeHtml(path.split('.').filter(Boolean).pop() ?? path);
      return `      <div class="mq-status-item" data-path="${escapeHtml(path)}"><span>${label}</span><strong>读取中</strong></div>`;
    })
    .join('\n');
  const scriptClose = '</' + 'script>';

  return [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <style>',
    '    body { margin: 0; font-family: "Microsoft YaHei", system-ui, sans-serif; color: #18312c; }',
    '    .mq-status { width: 100%; box-sizing: border-box; border: 1px solid rgba(55, 132, 114, 0.28); border-radius: 8px; background: linear-gradient(135deg, #f5fffb, #e7f5ef); padding: 10px; }',
    '    .mq-status-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(55, 132, 114, 0.18); padding-bottom: 7px; }',
    '    .mq-status-head h3 { margin: 0; font-size: 15px; line-height: 1.3; }',
    '    .mq-status-head span { color: #53776f; font-size: 11px; }',
    '    .mq-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-top: 9px; }',
    '    .mq-status-item { min-width: 0; border: 1px solid rgba(55, 132, 114, 0.18); border-radius: 7px; background: rgba(255, 255, 255, 0.72); padding: 8px; }',
    '    .mq-status-item span { display: block; color: #5f7f78; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '    .mq-status-item strong { display: block; margin-top: 4px; color: #173f36; font-size: 14px; line-height: 1.35; overflow-wrap: anywhere; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <section class="mq-status">',
    '    <div class="mq-status-head">',
    `      <h3>${title}</h3>`,
    `      <span>${styleText}</span>`,
    '    </div>',
    '    <div class="mq-status-grid">',
    itemMarkup,
    '    </div>',
    '  </section>',
    '  <script>',
    `    var MQ_STATUS_PATHS = ${JSON.stringify(items)};`,
    '    function getMessageData() {',
    '      var chatMessages = getChatMessages(getCurrentMessageId());',
    '      if (!chatMessages || chatMessages.length === 0) { return ""; }',
    '      return chatMessages[0].message || "";',
    '    }',
    '    function getStatusBlock(messageText) {',
    '      var match = messageText.match(/<status_current_variables?>([\\s\\S]*?)<\\/status_current_variables?>/);',
    '      return match && match[1] ? match[1] : messageText;',
    '    }',
    '    function readPath(messageText, path) {',
    '      var keyParts = String(path).split(".");',
    '      var key = keyParts[keyParts.length - 1] || path;',
    '      var scope = getStatusBlock(messageText);',
    '      var lines = scope.split(/\\n/);',
    '      for (var i = 0; i < lines.length; i += 1) {',
    '        var line = lines[i];',
    '        var index = line.indexOf(key);',
    '        if (index < 0) { continue; }',
    "        var value = line.slice(index + key.length).replace(/^[\\s:：\\\"'|\\-]+/, '').replace(/[,，\\}\\\"'\\]]+$/, '').trim();",
    '        if (value) { return value; }',
    '      }',
    '      return "未读取";',
    '    }',
    '    function renderStatus() {',
    '      var messageText = getMessageData();',
    '      var nodes = document.querySelectorAll(".mq-status-item");',
    '      for (var i = 0; i < nodes.length; i += 1) {',
    '        var node = nodes[i];',
    '        var path = node.getAttribute("data-path") || MQ_STATUS_PATHS[i] || "";',
    '        var valueNode = node.querySelector("strong");',
    '        valueNode.textContent = readPath(messageText, path);',
    '      }',
    '    }',
    '    $(function() { renderStatus(); });',
    `  ${scriptClose}`,
    '</body>',
    '</html>',
  ].join('\n');
}

function buildBeautifyHtml(tagName: string): string {
  const title = escapeHtml(clean(beautifyDraft.pageTitle));
  const contentType = escapeHtml(clean(beautifyDraft.contentType));
  const layout = escapeHtml(clean(beautifyDraft.layout));
  const styleText = escapeHtml(clean(beautifyDraft.style));
  const scriptClose = '</' + 'script>';

  return [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <style>',
    '    body { margin: 0; font-family: "Microsoft YaHei", system-ui, sans-serif; color: #24302d; }',
    '    .mq-page { width: 100%; box-sizing: border-box; border: 1px solid rgba(68, 108, 96, 0.25); border-radius: 8px; background: #fbfdf9; padding: 14px; }',
    '    .mq-page header { border-bottom: 1px solid rgba(68, 108, 96, 0.18); padding-bottom: 9px; margin-bottom: 10px; }',
    '    .mq-page h3 { margin: 0; color: #203d35; font-size: 17px; line-height: 1.35; }',
    '    .mq-page header p { margin: 5px 0 0; color: #678079; font-size: 12px; line-height: 1.45; }',
    '    .mq-content { display: flex; flex-direction: column; gap: 8px; }',
    '    .mq-content p { margin: 0; border-radius: 7px; background: rgba(235, 246, 241, 0.82); padding: 9px 10px; color: #2d403b; font-size: 14px; line-height: 1.75; overflow-wrap: anywhere; }',
    '    .mq-note { margin-top: 10px; color: #78908a; font-size: 11px; line-height: 1.45; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <article class="mq-page">',
    '    <header>',
    `      <h3>${title}</h3>`,
    `      <p>${contentType} · ${layout}</p>`,
    '    </header>',
    '    <main class="mq-content" id="mq-content">正在读取内容...</main>',
    `    <div class="mq-note">${styleText}</div>`,
    '  </article>',
    '  <script>',
    `    var MQ_SOURCE_TAG = ${JSON.stringify(tagName)};`,
    '    function getMessageData() {',
    '      var chatMessages = getChatMessages(getCurrentMessageId());',
    '      if (!chatMessages || chatMessages.length === 0) { return ""; }',
    '      return chatMessages[0].message || "";',
    '    }',
    '    function extractContent(messageText) {',
    '      var pattern = new RegExp("<" + MQ_SOURCE_TAG + ">([\\\\s\\\\S]*?)<\\\\/" + MQ_SOURCE_TAG + ">");',
    '      var match = messageText.match(pattern);',
    '      return match && match[1] ? match[1].trim() : messageText.trim();',
    '    }',
    '    function escapeText(value) {',
    '      return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");',
    '    }',
    '    function renderPage(text) {',
    '      var container = document.getElementById("mq-content");',
    '      var paragraphs = text.split(/\\n\\s*\\n/).filter(function(item) { return item.trim(); });',
    '      if (paragraphs.length === 0) { paragraphs = ["还没有读取到内容。"]; }',
    '      container.innerHTML = paragraphs.map(function(item) {',
    '        return "<p>" + escapeText(item.trim()).replace(/\\n/g, "<br>") + "</p>";',
    '      }).join("");',
    '    }',
    '    function init() {',
    '      try { renderPage(extractContent(getMessageData())); }',
    '      catch (error) { document.getElementById("mq-content").innerHTML = "<p>读取失败：" + escapeText(error.message) + "</p>"; }',
    '    }',
    '    $(function() { init(); });',
    `  ${scriptClose}`,
    '</body>',
    '</html>',
  ].join('\n');
}

function buildBeautifySourceContent(tagName: string): string {
  return [
    `前端美化源文件：${clean(beautifyDraft.pageTitle)}`,
    '',
    `当本角色需要输出“${clean(beautifyDraft.contentType)}”时，必须把完整内容放进 <${tagName}> 和 </${tagName}> 之间。`,
    '',
    '输出格式：',
    `<${tagName}>`,
    '这里写要显示给读者看的正文或结构化内容。',
    `</${tagName}>`,
    '',
    '硬规则：',
    `- 标签名只能使用 ${tagName}，正则和前端也会读取这个标签。`,
    '- 不要使用 <think>、<thinking>、<content> 标签。',
    '- 闭合标签后不要追加其他正文。',
    '- 标签里面写实际内容，不要写代码解释。',
    '',
    '页面意图：',
    `- 页面布局：${clean(beautifyDraft.layout)}`,
    `- 视觉风格：${clean(beautifyDraft.style)}`,
    `- 额外要求：${clean(beautifyDraft.notes)}`,
  ].join('\n');
}

function applyMvuStatusDraft() {
  if (!mvuSchemaReady.value) {
    goToMvuSchemaTask();
    return;
  }
  if (!mvuStatusVariablePaths().length) {
    toastr.warning('至少选一个要显示的变量。');
    return;
  }

  const character = cleanPathPart(currentCharacterName('当前角色'));
  const statusName = cleanPathPart(mvuStatusDraft.title || 'MVU状态栏');
  const html = buildMvuStatusHtml();
  const regexContent = regexFrontMatter('/<StatusPlaceHolderImpl\\/>/g', html, 'regex-mvu-status');
  const artifact = {
    id: artifactId('mvu-status'),
    title: 'MVU 前端状态栏',
    contentType: 'text' as const,
    targetPath: `/Characters/${character}/Regex/${statusName}`,
    content: regexContent,
    riskLevel: 'code' as const,
  };

  workshopStore.draft.assistantNotes = [
    '【宝宝辅食结构化素材：MVU前端状态栏】',
    '处理边界：这是 MVU 状态栏任务，只读展示变量，不做普通前端美化，也不修改变量。',
    '',
    `状态栏标题: ${clean(mvuStatusDraft.title)}`,
    '显示变量:',
    ...mvuStatusVariablePaths().map(path => `  - ${path}`),
    `视觉风格: ${clean(mvuStatusDraft.style)}`,
    `额外要求: ${clean(mvuStatusDraft.notes)}`,
    '',
    '生成要求：必须读取“写卡知识库”的“MVU前端状态栏自查”和当前预设“📋 MVU前端状态栏”；代码必须不用 $1、不用 DOMContentLoaded、使用 getChatMessages(getCurrentMessageId())，并保持标签一致。',
  ].join('\n');

  workshopStore.setGeneratedOutput(
    [artifact],
    [
      {
        id: artifactId('mvu-status-write'),
        tool: 'Write',
        artifactId: artifact.id,
        targetPath: artifact.targetPath,
        summary: '写入只读 MVU 状态栏正则配置',
        riskLevel: 'code',
      },
    ],
  );
  toastr.success('MVU 状态栏已准备好，先检查再写入');
}

function applyBeautifyDraft() {
  const target = cleanPathPart(worldbookName());
  const character = cleanPathPart(currentCharacterName('当前角色'));
  const pageName = cleanPathPart(beautifyDraft.pageTitle || '前端美化');
  const tagName = normalizeTagName(beautifyDraft.sourceTag, 'story');
  const html = buildBeautifyHtml(tagName);
  const sourceArtifactId = artifactId('beautify-source');
  const regexArtifactId = artifactId('beautify');
  const sourcePath = `/Worldbooks/${target}/前端/[界面]${pageName}_源文件`;
  const regexContent = regexFrontMatter(`/<${tagName}>[\\s\\S]*?<\\/${tagName}>/g`, html, 'regex-beautify');
  const sourceContent = buildBeautifySourceContent(tagName);
  const sourceArtifact = {
    id: sourceArtifactId,
    title: '前端美化源文件',
    contentType: 'text' as const,
    targetPath: sourcePath,
    content: sourceContent,
    riskLevel: 'config' as const,
  };
  const regexArtifact = {
    id: regexArtifactId,
    title: '前端美化页面',
    contentType: 'text' as const,
    targetPath: `/Characters/${character}/Regex/[界面]${pageName}`,
    content: regexContent,
    riskLevel: 'code' as const,
  };

  workshopStore.draft.assistantNotes = [
    '【宝宝辅食结构化素材：前端美化】',
    '处理边界：这是文字/结构化内容的前端美化任务，不是 MVU 状态栏；如需读 MVU 变量，应切换到 MVU 前端状态栏任务。',
    '',
    `页面名称: ${clean(beautifyDraft.pageTitle)}`,
    `源文件世界书: ${target}`,
    `目标角色: ${character}`,
    `内容标签: ${tagName}`,
    `内容类型: ${clean(beautifyDraft.contentType)}`,
    `页面布局: ${clean(beautifyDraft.layout)}`,
    `视觉风格: ${clean(beautifyDraft.style)}`,
    `额外要求: ${clean(beautifyDraft.notes)}`,
    '',
    '生成要求：必须读取“写卡知识库”的“前端美化自查”和当前预设“📋 前端美化”；代码必须不用 $1、不用 DOMContentLoaded、使用 getChatMessages(getCurrentMessageId())，并保持标签一致。',
  ].join('\n');

  workshopStore.setGeneratedOutput(
    [sourceArtifact, regexArtifact],
    [
      createLorebookOperation(target),
      {
        id: artifactId('beautify-source-write'),
        tool: 'Write',
        artifactId: sourceArtifact.id,
        targetPath: sourceArtifact.targetPath,
        summary: '写入源文件，告诉 AI 用同一个标签包住要美化的内容',
        riskLevel: 'config',
      },
      {
        id: artifactId('beautify-source-attr'),
        tool: 'SetAttribute',
        targetPath: sourceArtifact.targetPath,
        summary: '源文件 D0 system 常驻；不可递归 + 防进一步递归',
        riskLevel: 'config',
        attributes: d0SystemPatch(100),
      },
      {
        id: artifactId('beautify-write'),
        tool: 'Write',
        artifactId: regexArtifact.id,
        targetPath: regexArtifact.targetPath,
        summary: '写入前端美化正则配置',
        riskLevel: 'code',
      },
    ],
  );
  toastr.success('前端美化页面已准备好，先检查再写入');
}
</script>

<template>
  <section v-if="supported" class="baby-wizard">
    <div class="worldbook-setup" :class="{ ready: hasBoundWorldbook }">
      <div class="worldbook-copy">
        <strong>第一步：准备本卡世界书</strong>
        <span>角色资料、世界观和前端源文件都会写到这里。创建并绑定后，后面的任务不用再手动填世界书名。</span>
      </div>
      <label>
        <span>世界书名</span>
        <input
          v-model="worldbookSetupName"
          :placeholder="suggestedWorldbookName()"
          @focus="setBabyField('target.worldbook', worldbookSetupName)"
          @input="updateBabyField('target.worldbook', $event)"
        >
      </label>
      <button class="wizard-action setup-action" :disabled="isWorldbookSetupBusy" @click="createAndBindWorldbook">
        <SvgIcons name="download" :size="14" />
        {{ isWorldbookSetupBusy ? '处理中' : hasBoundWorldbook ? '确认绑定' : '创建并绑定' }}
      </button>
      <small>{{ hasBoundWorldbook ? `当前已绑定：${currentBoundWorldbook}` : '还没有绑定本卡世界书' }}</small>
    </div>

    <div v-if="selectedTaskId === 'character.base'" class="wizard-body">
      <div class="form-grid two">
        <label>
          <span>姓名</span>
          <input
            v-model="baseDraft.name"
            :placeholder="babyPlaceholder('character.name')"
            @focus="setBabyField('character.name', baseDraft.name)"
            @input="updateBabyField('character.name', $event)"
          >
        </label>
        <label>
          <span>年龄</span>
          <input
            v-model="baseDraft.age"
            :placeholder="babyPlaceholder('character.age')"
            @focus="setBabyField('character.age', baseDraft.age)"
            @input="updateBabyField('character.age', $event)"
          >
        </label>
        <label>
          <span>性别</span>
          <input
            v-model="baseDraft.gender"
            :placeholder="babyPlaceholder('character.gender')"
            @focus="setBabyField('character.gender', baseDraft.gender)"
            @input="updateBabyField('character.gender', $event)"
          >
        </label>
        <label>
          <span>身份</span>
          <input
            v-model="baseDraft.identity"
            :placeholder="babyPlaceholder('character.identity')"
            @focus="setBabyField('character.identity', baseDraft.identity)"
            @input="updateBabyField('character.identity', $event)"
          >
        </label>
        <label class="wide">
          <span>与用户的一句话关系</span>
          <input
            v-model="baseDraft.relationShort"
            :placeholder="babyPlaceholder('character.relation')"
            @focus="setBabyField('character.relation', baseDraft.relationShort)"
            @input="updateBabyField('character.relation', $event)"
          >
        </label>
        <label>
          <span>偏离默认的外貌特征</span>
          <textarea
            v-model="baseDraft.appearanceFeature"
            rows="3"
            :placeholder="babyPlaceholder('character.appearance')"
            @focus="setBabyField('character.appearance', baseDraft.appearanceFeature)"
            @input="updateBabyField('character.appearance', $event)"
          />
        </label>
        <label>
          <span>穿衣/标志风格</span>
          <textarea
            v-model="baseDraft.outfit"
            rows="3"
            :placeholder="babyPlaceholder('character.outfit')"
            @focus="setBabyField('character.outfit', baseDraft.outfit)"
            @input="updateBabyField('character.outfit', $event)"
          />
        </label>
        <label class="wide">
          <span>标志性细节</span>
          <input
            v-model="baseDraft.marker"
            :placeholder="babyPlaceholder('character.marker')"
            @focus="setBabyField('character.marker', baseDraft.marker)"
            @input="updateBabyField('character.marker', $event)"
          >
        </label>
        <label class="wide">
          <span>真正影响角色的背景</span>
          <textarea
            v-model="baseDraft.backgroundImpact"
            rows="3"
            :placeholder="babyPlaceholder('character.background')"
            @focus="setBabyField('character.background', baseDraft.backgroundImpact)"
            @input="updateBabyField('character.background', $event)"
          />
        </label>
        <label>
          <span>认识过程</span>
          <textarea
            v-model="baseDraft.relationOrigin"
            rows="3"
            :placeholder="babyPlaceholder('character.origin')"
            @focus="setBabyField('character.origin', baseDraft.relationOrigin)"
            @input="updateBabyField('character.origin', $event)"
          />
        </label>
        <label>
          <span>互动方式</span>
          <textarea
            v-model="baseDraft.relationInteraction"
            rows="3"
            :placeholder="babyPlaceholder('character.interaction')"
            @focus="setBabyField('character.interaction', baseDraft.relationInteraction)"
            @input="updateBabyField('character.interaction', $event)"
          />
        </label>
      </div>
      <button class="wizard-action" @click="applyBaseDraft">
        <SvgIcons name="download" :size="14" />
        整理角色基础素材
      </button>
    </div>

    <div v-else-if="selectedTaskId === 'worldview.write'" class="wizard-body">
      <div class="wizard-notice">
        <strong>世界观先聊出来</strong>
        <span>不知道怎么写时，先去右边问秋青子。聊到你觉得“对，就是这个味道”以后，把最终回复放回下面的工作台。</span>
        <button class="secondary-mini" @click="importLatestAssistantToWorldview">
          <SvgIcons name="download" :size="14" />
          把秋青子最新回复放进来
        </button>
      </div>
      <label class="solo">
        <span>最初想法</span>
        <textarea
          v-model="worldviewDraft.seed"
          rows="4"
          :placeholder="babyPlaceholder('worldview.seed')"
          @focus="setBabyField('worldview.seed', worldviewDraft.seed)"
          @input="updateBabyField('worldview.seed', $event)"
        />
      </label>
      <label class="solo">
        <span>世界观整理稿</span>
        <textarea
          v-model="worldviewDraft.finalText"
          rows="9"
          :placeholder="babyPlaceholder('worldview.final')"
          @focus="setBabyField('worldview.final', worldviewDraft.finalText)"
          @input="updateBabyField('worldview.final', $event)"
        />
      </label>
      <label class="solo">
        <span>还不确定的地方</span>
        <textarea
          v-model="worldviewDraft.unsure"
          rows="3"
          :placeholder="babyPlaceholder('worldview.unsure')"
          @focus="setBabyField('worldview.unsure', worldviewDraft.unsure)"
          @input="updateBabyField('worldview.unsure', $event)"
        />
      </label>
      <button class="wizard-action" @click="applyWorldviewDraft">
        <SvgIcons name="download" :size="14" />
        整理世界观素材
      </button>
    </div>

    <div v-else-if="selectedTaskId === 'character.palette'" class="wizard-body">
      <div class="choice-row">
        <label>
          <span>条目类型</span>
          <select
            v-model="paletteDraft.kind"
            @focus="setBabyField('palette.kind', paletteDraft.kind)"
            @change="updateBabyField('palette.kind', $event)"
          >
            <option>性格调色盘</option>
            <option>混色</option>
            <option>三面性</option>
            <option>二次解释</option>
            <option>NSFW调色盘</option>
          </select>
        </label>
      </div>
      <label class="solo">
        <span>用户原始手写内容</span>
        <textarea
          v-model="paletteDraft.rawText"
          rows="8"
          :placeholder="babyPlaceholder('palette.raw')"
          @focus="setBabyField('palette.raw', paletteDraft.rawText)"
          @input="updateBabyField('palette.raw', $event)"
        />
      </label>
      <label class="solo">
        <span>用户额外说明</span>
        <input
          v-model="paletteDraft.note"
          :placeholder="babyPlaceholder('palette.note')"
          @focus="setBabyField('palette.note', paletteDraft.note)"
          @input="updateBabyField('palette.note', $event)"
        >
      </label>
      <button class="wizard-action" @click="applyPaletteDraft">
        <SvgIcons name="download" :size="14" />
        保留原味并整理格式
      </button>
    </div>

    <div v-else-if="selectedTaskId === 'character.wardrobe_prompt'" class="wizard-body">
      <div class="form-grid two">
        <label>
          <span>日常常穿</span>
          <input
            v-model="wardrobeDraft.dailyStyle"
            :placeholder="babyPlaceholder('wardrobe.daily')"
            @focus="setBabyField('wardrobe.daily', wardrobeDraft.dailyStyle)"
            @input="updateBabyField('wardrobe.daily', $event)"
          >
        </label>
        <label>
          <span>特别喜欢</span>
          <input
            v-model="wardrobeDraft.favoriteStyle"
            :placeholder="babyPlaceholder('wardrobe.favorite')"
            @focus="setBabyField('wardrobe.favorite', wardrobeDraft.favoriteStyle)"
            @input="updateBabyField('wardrobe.favorite', $event)"
          >
        </label>
        <label>
          <span>不喜欢或不要出现</span>
          <input
            v-model="wardrobeDraft.dislikedStyle"
            :placeholder="babyPlaceholder('wardrobe.disliked')"
            @focus="setBabyField('wardrobe.disliked', wardrobeDraft.dislikedStyle)"
            @input="updateBabyField('wardrobe.disliked', $event)"
          >
        </label>
        <label>
          <span>标志物</span>
          <input
            v-model="wardrobeDraft.iconicItems"
            :placeholder="babyPlaceholder('wardrobe.items')"
            @focus="setBabyField('wardrobe.items', wardrobeDraft.iconicItems)"
            @input="updateBabyField('wardrobe.items', $event)"
          >
        </label>
        <label class="wide">
          <span>特殊场景</span>
          <textarea
            v-model="wardrobeDraft.sceneNotes"
            rows="3"
            :placeholder="babyPlaceholder('wardrobe.scenes')"
            @focus="setBabyField('wardrobe.scenes', wardrobeDraft.sceneNotes)"
            @input="updateBabyField('wardrobe.scenes', $event)"
          />
        </label>
      </div>
      <button class="wizard-action" @click="applyWardrobeDraft">
        <SvgIcons name="download" :size="14" />
        整理衣柜提示词
      </button>
    </div>

    <div v-else-if="selectedTaskId === 'mvu.schema'" class="wizard-body">
      <div class="form-grid two">
        <label>
          <span>变量系统名</span>
          <input
            v-model="mvuDraft.systemName"
            :placeholder="babyPlaceholder('mvu.system')"
            @focus="setBabyField('mvu.system', mvuDraft.systemName)"
            @input="updateBabyField('mvu.system', $event)"
          >
        </label>
        <label>
          <span>更新意图</span>
          <input
            v-model="mvuDraft.updateIntent"
            :placeholder="babyPlaceholder('mvu.intent')"
            @focus="setBabyField('mvu.intent', mvuDraft.updateIntent)"
            @input="updateBabyField('mvu.intent', $event)"
          >
        </label>
      </div>

      <div class="variable-list">
        <div v-for="(variable, index) in mvuDraft.variables" :key="index" class="variable-row">
          <div class="variable-head">
            <strong>变量 {{ index + 1 }}</strong>
            <button :disabled="mvuDraft.variables.length <= 1" @click="removeMvuVariable(index)">
              <SvgIcons name="trash" :size="13" />
            </button>
          </div>
          <div class="form-grid four">
            <label>
              <span>名称</span>
              <input
                v-model="variable.name"
                :placeholder="babyPlaceholder('mvu.variable.name')"
                @focus="setBabyField('mvu.variable.name', variable.name)"
                @input="updateBabyField('mvu.variable.name', $event)"
              >
            </label>
            <label>
              <span>类型</span>
              <select
                v-model="variable.type"
                @focus="setBabyField('mvu.variable.type', variable.type)"
                @change="updateBabyField('mvu.variable.type', $event)"
              >
                <option value="number">数字，比如好感度、金钱</option>
                <option value="string">文字，比如心情、地点</option>
                <option value="boolean">是/否，比如是否受伤</option>
                <option value="enum">固定选项，比如阶段</option>
              </select>
            </label>
            <label>
              <span>开局值</span>
              <input
                v-model="variable.defaultValue"
                :placeholder="babyPlaceholder('mvu.variable.default')"
                @focus="setBabyField('mvu.variable.default', variable.defaultValue)"
                @input="updateBabyField('mvu.variable.default', $event)"
              >
            </label>
            <label v-if="variable.type === 'enum'">
              <span>可选状态</span>
              <input
                v-model="variable.options"
                :placeholder="babyPlaceholder('mvu.variable.options')"
                @focus="setBabyField('mvu.variable.options', variable.options)"
                @input="updateBabyField('mvu.variable.options', $event)"
              >
            </label>
            <label>
              <span>用途</span>
              <input
                v-model="variable.note"
                :placeholder="babyPlaceholder('mvu.variable.note')"
                @focus="setBabyField('mvu.variable.note', variable.note)"
                @input="updateBabyField('mvu.variable.note', $event)"
              >
            </label>
            <label>
              <span>最小值</span>
              <input
                v-model="variable.min"
                :placeholder="babyPlaceholder('mvu.variable.min')"
                @focus="setBabyField('mvu.variable.min', variable.min)"
                @input="updateBabyField('mvu.variable.min', $event)"
              >
            </label>
            <label>
              <span>最大值</span>
              <input
                v-model="variable.max"
                :placeholder="babyPlaceholder('mvu.variable.max')"
                @focus="setBabyField('mvu.variable.max', variable.max)"
                @input="updateBabyField('mvu.variable.max', $event)"
              >
            </label>
            <label class="check-label">
              <input
                v-model="variable.aiVisible"
                type="checkbox"
                @focus="setBabyField('mvu.variable.aiVisible', variable.aiVisible ? '勾选' : '未勾选')"
                @change="setBabyField('mvu.variable.aiVisible', variable.aiVisible ? '勾选' : '未勾选')"
              >
              <span>发给AI</span>
            </label>
            <label class="check-label">
              <input
                v-model="variable.readonly"
                type="checkbox"
                @focus="setBabyField('mvu.variable.readonly', variable.readonly ? '勾选' : '未勾选')"
                @change="setBabyField('mvu.variable.readonly', variable.readonly ? '勾选' : '未勾选')"
              >
              <span>只读</span>
            </label>
          </div>
        </div>
      </div>

      <div class="wizard-actions">
        <button class="secondary-mini" @click="addMvuVariable">
          <SvgIcons name="plus" :size="14" />
          添加变量
        </button>
        <button class="wizard-action" @click="applyMvuDraft">
          <SvgIcons name="download" :size="14" />
          整理 MVU 变量表
        </button>
      </div>
    </div>

    <div v-else-if="selectedTaskId === 'ejs.stage_palette'" class="wizard-body">
      <div v-if="!mvuSchemaReady" class="wizard-notice">
        <strong>先做 MVU 基础变量</strong>
        <span>多阶段要靠一个变量判断阶段。先把“好感度、阶段、关系值”这类变量做完，我会自动带上正确路径。</span>
        <button class="secondary-mini" @click="goToMvuSchemaTask">
          <SvgIcons name="send" :size="14" />
          去填 MVU 基础变量
        </button>
      </div>
      <div class="form-grid two">
        <label>
          <span>多阶段条目名</span>
          <input
            v-model="ejsDraft.controllerName"
            :placeholder="babyPlaceholder('ejs.controller')"
            @focus="setBabyField('ejs.controller', ejsDraft.controllerName)"
            @input="updateBabyField('ejs.controller', $event)"
          >
        </label>
        <label v-if="mvuSchemaReady">
          <span>用哪个变量判断阶段</span>
          <select v-model="selectedEjsVariableKey">
            <option v-for="option in mvuVariableOptions" :key="option.key" :value="option.key">
              {{ option.label }}（{{ option.typeLabel }}）
            </option>
          </select>
        </label>
        <label class="wide">
          <span>兜底说明</span>
          <input
            v-model="ejsDraft.fallbackEntry"
            :placeholder="babyPlaceholder('ejs.fallback')"
            @focus="setBabyField('ejs.fallback', ejsDraft.fallbackEntry)"
            @input="updateBabyField('ejs.fallback', $event)"
          >
        </label>
      </div>

      <div class="stage-list">
        <div v-for="(stage, index) in ejsDraft.stages" :key="index" class="stage-row">
          <div class="variable-head">
            <strong>{{ stage.title || `阶段 ${index + 1}` }}</strong>
            <button :disabled="ejsDraft.stages.length <= 2" @click="removeEjsStage(index)">
              <SvgIcons name="trash" :size="13" />
            </button>
          </div>
          <div class="form-grid two">
            <label>
              <span>阶段名</span>
              <input
                v-model="stage.title"
                :placeholder="babyPlaceholder('ejs.stage.title')"
                @focus="setBabyField('ejs.stage.title', stage.title)"
                @input="updateBabyField('ejs.stage.title', $event)"
              >
            </label>
            <label>
              <span>什么时候进入这个阶段</span>
              <input
                v-model="stage.condition"
                :placeholder="babyPlaceholder('ejs.stage.condition')"
                @focus="setBabyField('ejs.stage.condition', stage.condition)"
                @input="updateBabyField('ejs.stage.condition', $event)"
              >
            </label>
            <label class="wide">
              <span>用户手写阶段文字</span>
              <textarea
                v-model="stage.rawText"
                rows="4"
                :placeholder="babyPlaceholder('ejs.stage.raw')"
                @focus="setBabyField('ejs.stage.raw', stage.rawText)"
                @input="updateBabyField('ejs.stage.raw', $event)"
              />
            </label>
          </div>
        </div>
      </div>

      <div class="wizard-actions">
        <button class="secondary-mini" @click="addEjsStage">
          <SvgIcons name="plus" :size="14" />
          添加阶段
        </button>
        <button class="wizard-action" @click="applyEjsStageDraft">
          <SvgIcons name="download" :size="14" />
          准备多阶段人设
        </button>
      </div>
    </div>

    <div v-else-if="selectedTaskId === 'frontend.mvu_status_bar'" class="wizard-body">
      <div v-if="!mvuSchemaReady" class="wizard-notice">
        <strong>还没读到本页做好的 MVU 变量</strong>
        <span>先去“MVU 基础变量”里把变量做完，比如好感度、心情、阶段。做完后这里会自动拿来生成状态栏。</span>
        <button class="secondary-mini" @click="goToMvuSchemaTask">
          <SvgIcons name="send" :size="14" />
          去填 MVU 基础变量
        </button>
      </div>
      <div class="form-grid two">
        <label>
          <span>状态栏标题</span>
          <input
            v-model="mvuStatusDraft.title"
            :placeholder="babyPlaceholder('frontend.statusTitle')"
            @focus="setBabyField('frontend.statusTitle', mvuStatusDraft.title)"
            @input="updateBabyField('frontend.statusTitle', $event)"
          >
        </label>
        <label>
          <span>状态栏风格</span>
          <input
            v-model="mvuStatusDraft.style"
            :placeholder="babyPlaceholder('frontend.statusStyle')"
            @focus="setBabyField('frontend.statusStyle', mvuStatusDraft.style)"
            @input="updateBabyField('frontend.statusStyle', $event)"
          >
        </label>
        <div v-if="mvuSchemaReady" class="wide variable-picker">
          <span>状态栏显示哪些变量</span>
          <label v-for="option in mvuVariableOptions" :key="option.key" class="pick-label">
            <input v-model="selectedStatusVariableKeys" type="checkbox" :value="option.key">
            <strong>{{ option.label }}</strong>
            <small>{{ option.typeLabel }}{{ option.note ? ` · ${option.note}` : '' }}</small>
          </label>
        </div>
        <label class="wide">
          <span>额外显示要求</span>
          <textarea
            v-model="mvuStatusDraft.notes"
            rows="3"
            :placeholder="babyPlaceholder('frontend.statusNotes')"
            @focus="setBabyField('frontend.statusNotes', mvuStatusDraft.notes)"
            @input="updateBabyField('frontend.statusNotes', $event)"
          />
        </label>
      </div>
      <button class="wizard-action" @click="applyMvuStatusDraft">
        <SvgIcons name="download" :size="14" />
        准备 MVU 状态栏
      </button>
    </div>

    <div v-else-if="selectedTaskId === 'frontend.beautify'" class="wizard-body">
      <div class="form-grid two">
        <label>
          <span>页面名称</span>
          <input
            v-model="beautifyDraft.pageTitle"
            :placeholder="babyPlaceholder('beautify.pageTitle')"
            @focus="setBabyField('beautify.pageTitle', beautifyDraft.pageTitle)"
            @input="updateBabyField('beautify.pageTitle', $event)"
          >
        </label>
        <label>
          <span>内容类型</span>
          <input
            v-model="beautifyDraft.contentType"
            :placeholder="babyPlaceholder('beautify.contentType')"
            @focus="setBabyField('beautify.contentType', beautifyDraft.contentType)"
            @input="updateBabyField('beautify.contentType', $event)"
          >
        </label>
        <label>
          <span>输出标签</span>
          <input
            v-model="beautifyDraft.sourceTag"
            :placeholder="babyPlaceholder('beautify.sourceTag')"
            @focus="setBabyField('beautify.sourceTag', beautifyDraft.sourceTag)"
            @input="updateBabyField('beautify.sourceTag', $event)"
          >
        </label>
        <label>
          <span>视觉风格</span>
          <input
            v-model="beautifyDraft.style"
            :placeholder="babyPlaceholder('beautify.style')"
            @focus="setBabyField('beautify.style', beautifyDraft.style)"
            @input="updateBabyField('beautify.style', $event)"
          >
        </label>
        <label class="wide">
          <span>页面布局</span>
          <textarea
            v-model="beautifyDraft.layout"
            rows="4"
            :placeholder="babyPlaceholder('beautify.layout')"
            @focus="setBabyField('beautify.layout', beautifyDraft.layout)"
            @input="updateBabyField('beautify.layout', $event)"
          />
        </label>
        <label class="wide">
          <span>额外要求</span>
          <textarea
            v-model="beautifyDraft.notes"
            rows="3"
            :placeholder="babyPlaceholder('beautify.notes')"
            @focus="setBabyField('beautify.notes', beautifyDraft.notes)"
            @input="updateBabyField('beautify.notes', $event)"
          />
        </label>
      </div>
      <button class="wizard-action" @click="applyBeautifyDraft">
        <SvgIcons name="download" :size="14" />
        准备前端美化页面
      </button>
    </div>
  </section>
</template>

<style scoped>
.baby-wizard {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--ide-success-border);
  border-radius: 8px;
  background: var(--ide-success-soft);
}

.wizard-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.worldbook-setup {
  display: grid;
  grid-template-columns: minmax(180px, 1.1fr) minmax(180px, 1fr) auto;
  align-items: end;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
}

.worldbook-setup.ready {
  border-color: var(--ide-success-border);
  background: rgba(16, 185, 129, 0.08);
}

.worldbook-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.worldbook-copy strong {
  color: var(--ide-text);
  font-size: 14px;
}

.worldbook-copy span,
.worldbook-setup small {
  color: var(--ide-dim-2);
  font-size: 12px;
  line-height: 1.45;
}

.worldbook-setup small {
  grid-column: 1 / -1;
}

.setup-action {
  align-self: end;
  white-space: nowrap;
}

.setup-action:disabled {
  opacity: 0.6;
  cursor: wait;
}

.form-grid {
  display: grid;
  gap: 10px;
}

.form-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid.four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

label,
.solo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  color: var(--ide-dim-2);
  font-size: 12px;
  font-weight: 700;
}

.wide,
label.wide {
  grid-column: 1 / -1;
}

input,
textarea,
select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--ide-input-border);
  border-radius: 7px;
  background: var(--ide-input-bg);
  color: var(--ide-text);
  padding: 9px 10px;
  font: inherit;
  line-height: 1.45;
  outline: none;
}

select,
select option {
  background: var(--ide-bg2);
  color: var(--ide-text);
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--ide-success-border-strong);
}

.choice-row {
  display: grid;
  grid-template-columns: minmax(0, 240px);
}

.wizard-notice {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--ide-warning-border);
  border-radius: 8px;
  background: var(--ide-warning-soft);
  color: var(--ide-dim);
  font-size: 13px;
  line-height: 1.55;
}

.wizard-notice strong {
  color: var(--ide-warning-text);
}

.wizard-notice .secondary-mini {
  width: fit-content;
}

.variable-picker {
  display: grid;
  gap: 8px;
  color: var(--ide-dim-2);
  font-size: 12px;
  font-weight: 700;
}

.pick-label {
  display: grid;
  grid-template-columns: auto minmax(70px, auto) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--ide-border);
  border-radius: 7px;
  background: var(--ide-bg2);
}

.pick-label input {
  width: auto;
}

.pick-label strong {
  color: var(--ide-text);
  font-size: 13px;
}

.pick-label small {
  color: var(--ide-dim-2);
  font-size: 12px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.variable-list,
.stage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.variable-row,
.stage-row {
  padding: 12px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
}

.variable-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.variable-head strong {
  color: var(--ide-text);
  font-size: 13px;
}

.variable-head button,
.secondary-mini,
.wizard-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.variable-head button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--ide-danger-soft-strong);
  background: var(--ide-danger-soft);
  color: var(--ide-danger-text);
}

.variable-head button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.check-label {
  flex-direction: row;
  align-items: center;
  min-height: 36px;
}

.check-label input {
  width: auto;
}

.wizard-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.secondary-mini,
.wizard-action {
  min-height: 34px;
  padding: 0 12px;
}

.secondary-mini {
  border: 1px solid var(--ide-border);
  background: var(--ide-surface);
  color: var(--ide-dim);
}

.wizard-action {
  align-self: flex-end;
  border: 1px solid var(--ide-success-border-strong);
  background: var(--ide-bg2);
  color: var(--ide-success-text);
}

.secondary-mini:hover,
.wizard-action:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

@media (max-width: 900px) {
  .form-grid.two,
  .form-grid.four {
    grid-template-columns: 1fr;
  }

  .worldbook-setup {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .choice-row {
    grid-template-columns: 1fr;
  }

  .wizard-action {
    align-self: stretch;
  }
}
</style>
