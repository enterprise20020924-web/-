type PersonaContentArtifact = {
  label: string;
  match: string;
};

const personaContentArtifactTerms = [
  { label: '待补充', pattern: /待补充/u },
  { label: '用户手写', pattern: /用户手写/u },
  { label: '内部任务词', pattern: /当前任务/u },
  { label: '一键角色卡写卡器', pattern: /一键角色卡写卡器/u },
  { label: '工程占位词', pattern: /模板|提示词|工程词|占位符|placeholder/iu },
  {
    label: '内部标签',
    pattern: /<\/?(?:thinking|content|role_result|worldview_result|stage_early|stage_middle|stage_close|stage_common)\b/iu,
  },
  {
    label: '内置任务标签',
    pattern: /one_click_card_writer_task|selected_template_knowledge|task_scope|task_reference|template_knowledge/iu,
  },
  { label: '前端流程词', pattern: /前端会|工具会|生成器|代码会/u },
  {
    label: 'MVU/EJS 模板词',
    pattern:
      /变量输出格式|变量输出格式强调|变量更新规则|变量列表|MVU前端状态栏|mvu状态栏|mvu变量|JSON Patch|RFC 6902|Write 工具|Read 工具|Edit 工具|SetAttribute|\/Worldbooks|世界书名|工作流程|收尾操作|原封不动地输出|知识库模板|variable_output_format|status_bar_creation_guide/iu,
  },
  { label: '预设变量宏', pattern: /\{\{(?:addvar|setvar|trim|random)::/iu },
  { label: '转义提示词文本', pattern: /\\n\\n|\\\"|\\u[0-9a-f]{4}/i },
  { label: '外部教程链接', pattern: /stagedog\.github\.io|github\.com\/StageDog|JS-Slash-Runner-Doc/iu },
];

export function findPersonaContentArtifact(content: string): PersonaContentArtifact | null {
  const value = String(content || '');
  for (const term of personaContentArtifactTerms) {
    const match = value.match(term.pattern)?.[0];
    if (match) {
      return { label: term.label, match };
    }
  }
  return null;
}

export function assertPersonaContentClean(label: string, content: string): void {
  if (!String(content || '').trim()) throw new Error(`${label}为空，需重新生成`);
  const hit = findPersonaContentArtifact(content);
  if (hit) throw new Error(`${label}包含工程词或模板内容：${hit.label}（${hit.match}），需重新生成`);
}

export function isPersonaContentClean(content: string): boolean {
  return String(content || '').trim().length > 0 && !findPersonaContentArtifact(content);
}
