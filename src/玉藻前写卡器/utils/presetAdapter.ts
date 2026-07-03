import originalPresetRaw from '../../秋青子写卡预设/秋青子写卡预设.json?raw';

interface OriginalPrompt {
  identifier: string;
  name?: string;
  enabled: boolean;
  role?: 'system' | 'assistant' | 'user';
  content?: string;
}

interface OriginalPromptOrderItem {
  identifier: string;
  enabled: boolean;
}

interface OriginalPreset {
  prompts: OriginalPrompt[];
  prompt_order: { order: OriginalPromptOrderItem[] }[];
}

const preset = JSON.parse(originalPresetRaw) as OriginalPreset;

const knowledgeIds = new Set(
  Array.from({ length: 29 }, (_, index) => String(index + 12)),
);

const promptsById = new Map(preset.prompts.map(prompt => [String(prompt.identifier), prompt]));

export function getPresetKnowledge(ids: string[]): string {
  return ids
    .map(id => promptsById.get(id)?.content ?? '')
    .map(content => content.replace(/^\uFEFF/, '').trim())
    .filter(Boolean)
    .join('\n\n');
}

function adaptThinkingPrompt(id: string, content: string): string {
  if (id === '41') {
    return [
      '- 每次正文前保留 <thinking>、[metacognition]、</thinking> 标签。',
      '- 这里不是完整隐藏推理，只输出简短任务自检摘要，最多8行。',
      '<thinking>',
      '[metacognition]',
    ].join('\n');
  }
  if (id === '42') {
    return [
      '- 检查本轮类型：世界观、角色人设、角色速览、MVU/EJS固定产物。',
      '- 检查本轮启用的知识条目是否与任务对应。',
      '- 区分用户明确设定与合理化补充，补充不得推翻用户明确内容。',
      '- 检查输出是否适合直接写入世界书或角色脚本。',
      '- 检查标签、YAML、XML块是否闭合。',
    ].join('\n');
  }
  if (id === '43') return '\n</thinking>';
  if (id === '44') {
    return [
      '输出格式要求（强制执行）',
      '',
      '每次回复必须严格遵守以下结构：',
      '<thinking>',
      '[metacognition]',
      '[简短任务自检摘要，不展开隐藏推理]',
      '</thinking>',
      '',
      '<content>',
      '[实际输出内容]',
      '</content>',
      '',
      '铁律：',
      '- 不得在标签外输出任何内容。',
      '- <content> 内必须使用本轮指定的 XML 标签。',
      '- 所有开标签必须闭合。',
    ].join('\n');
  }
  if (id === '48') {
    return [
      '好的，我都理解了。我会先输出简短任务自检摘要，然后只在 <content> 内给出可写入成品。',
      '<thinking>',
    ].join('\n');
  }
  return content;
}

function normalPrompt(prompt: OriginalPrompt, userInput: string): RolePrompt | null {
  const role = prompt.role;
  if (!role) return null;
  const content = adaptThinkingPrompt(String(prompt.identifier), prompt.content ?? '')
    .replace(/\{\{lastUserMessage\}\}/g, userInput)
    .trim();
  if (!content) return null;
  return { role, content };
}

export function buildAdaptedOrderedPrompts(options: {
  userInput: string;
  taskInstruction: string;
  knowledge: string;
}): RolePrompt[] {
  const ordered: RolePrompt[] = [];
  const order = preset.prompt_order[0]?.order ?? [];
  let insertedTaskKnowledge = false;

  for (const item of order) {
    const id = String(item.identifier);
    if (knowledgeIds.has(id)) {
      if (!insertedTaskKnowledge) {
        ordered.push({
          role: 'system',
          content: [
            '<task_scope>',
            options.taskInstruction.trim(),
            '</task_scope>',
            '',
            '<task_reference>',
            options.knowledge.trim(),
            '</task_reference>',
          ].join('\n'),
        });
        insertedTaskKnowledge = true;
      }
      continue;
    }

    const prompt = promptsById.get(id);
    if (!item.enabled || prompt?.enabled === false) continue;

    if (!prompt) continue;
    const rolePrompt = normalPrompt(prompt, options.userInput);
    if (rolePrompt) ordered.push(rolePrompt);
  }

  if (!insertedTaskKnowledge) {
    ordered.push({ role: 'system', content: options.taskInstruction });
  }

  return ordered;
}
