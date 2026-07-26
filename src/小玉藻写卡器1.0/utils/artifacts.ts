import type { RoleResult, WriterArtifacts, WorldviewResult } from '../types';

const writerMarker = 'one-click-card-writer';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonString(value: string): string {
  return JSON.stringify(value);
}

function yamlBlock(value: string, indent: number): string[] {
  const prefix = ' '.repeat(indent);
  return value.trim().split(/\r?\n/).map(line => `${prefix}${line}`);
}

function tagWrap(tag: string, content: string): string {
  return `<${tag}>\n${content.trim()}\n</${tag}>`;
}

function noRecursion() {
  return { prevent_incoming: true, prevent_outgoing: true, delay_until: null };
}

function baseEntry(
  name: string,
  content: string,
  strategy: WorldbookEntry['strategy'],
  position: WorldbookEntry['position'],
  enabled = true,
): PartialDeep<WorldbookEntry> {
  return {
    name,
    enabled,
    strategy,
    position,
    content,
    probability: 100,
    recursion: noRecursion(),
    effect: { sticky: null, cooldown: null, delay: null },
    extra: { source: writerMarker },
  };
}

function constantStrategy(): WorldbookEntry['strategy'] {
  return {
    type: 'constant',
    keys: [],
    keys_secondary: { logic: 'and_any', keys: [] },
    scan_depth: 'same_as_global',
  };
}

function selectiveStrategy(keys: string[]): WorldbookEntry['strategy'] {
  return {
    type: 'selective',
    keys,
    keys_secondary: { logic: 'and_any', keys: [] },
    scan_depth: 2,
  };
}

function beforeCharacter(order: number): WorldbookEntry['position'] {
  return { type: 'before_character_definition', role: 'system', depth: 0, order };
}

function afterCharacter(order: number): WorldbookEntry['position'] {
  return { type: 'after_character_definition', role: 'system', depth: 0, order };
}

function atDepth(depth: number, order: number): WorldbookEntry['position'] {
  return { type: 'at_depth', role: 'system', depth, order };
}

function safeTagName(value: string): string {
  return value.replace(/[^\p{L}\p{N}_-]/gu, '_').replace(/^_+|_+$/g, '') || '角色';
}

function roleStrategy(role: RoleResult, isMultiRole: boolean): WorldbookEntry['strategy'] {
  return isMultiRole ? selectiveStrategy(role.aliases) : constantStrategy();
}

function buildRoleOverview(roles: RoleResult[]): string {
  return [
    '角色总览:',
    ...roles.flatMap(role => yamlBlock(role.quickView.replace(/^角色总览:\s*/u, '').trim(), 2)),
  ].join('\n');
}

export function buildMvuSchemaScript(roles: RoleResult[]): string {
  const roleObjects = roles.flatMap(role => [
    `  ${jsonString(role.name)}: z.object({`,
    '    好感度: z.coerce.number().prefault(0).transform(value => _.clamp(value, 0, 100)),',
    '  }).prefault({ 好感度: 0 }),',
  ]);
  return [
    "import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';",
    '',
    'export const Schema = z.object({',
    '  世界: z.object({',
    "    当前时间: z.string().prefault('开局'),",
    "    当前地点: z.string().prefault('待定'),",
    "  }).prefault({ 当前时间: '开局', 当前地点: '待定' }),",
    ...roleObjects,
    '});',
    '',
    '$(() => {',
    '  registerMvuSchema(Schema);',
    '});',
  ].join('\n');
}

function buildMvuInitvar(roles: RoleResult[]): string {
  return [
    '世界:',
    '  当前时间: 开局',
    '  当前地点: 待定',
    ...roles.flatMap(role => [String(role.name) + ':', '  好感度: 0']),
  ].join('\n');
}

function buildMvuRules(roles: RoleResult[]): string {
  return [
    '---',
    '变量更新规则:',
    '  世界:',
    '    当前时间:',
    '      check:',
    '        - 每次事件推进、休息、等待或场景切换后更新，保持时间流逝合理',
    '    当前地点:',
    '      check:',
    '        - 场景发生明确移动或地点变化时更新',
    ...roles.flatMap(role => [
      `  ${role.name}:`,
      '    好感度:',
      '      type: number',
      '      range: 0~100',
      '      check:',
      `        - 根据${role.name}对<user>当前行为的感知调整，只有${role.name}知晓或受到影响时才更新`,
      '        - 单次互动最多增加 +1；没有明确正向互动时不得增加',
      '        - 同一剧情日内累计最多增加 +5；达到当天上限后只能持平或下降',
      '        - 下降必须有当前回复内的明确负面依据，不要为了凑更新而改动',
    ]),
  ].join('\n');
}

function buildMvuList(): string {
  return ['---', '<status_current_variable>', '{{format_message_variable::stat_data}}', '</status_current_variable>'].join(
    '\n',
  );
}

function buildMvuOutputFormat(): string {
  return [
    '---',
    '变量输出格式:',
    '  rule:',
    '    - you must output the update analysis and the actual update commands at once in the end of the next reply',
    '    - the update commands works like the JSON Patch standard, must be a valid JSON array containing operation objects',
    '    - supported ops: replace, delta, insert, remove, move',
    "    - don't update field names starts with `_` as they are readonly",
    '  format: |-',
    '    <UpdateVariable>',
    '    <Analysis>$(IN ENGLISH, no more than 80 words)',
    '    - ${calculate time passed: ...}',
    '    - ${decide whether dramatic updates are allowed as it is in a special case or the time passed is more than usual: yes/no}',
    '    - ${check affection caps: every single interaction may increase at most +1, and the same in-story day may increase at most +5}',
    '    - ${analyze every variable based on its corresponding check, according only to current reply: ...}',
    '    </Analysis>',
    '    <JSONPatch>',
    '    [',
    '      { "op": "replace", "path": "${/path/to/variable}", "value": "${new_value}" },',
    '      { "op": "delta", "path": "${/path/to/number/variable}", "value": "${positive_or_negative_delta}" },',
    '      { "op": "insert", "path": "${/path/to/object/new_key}", "value": "${new_value}" },',
    '      { "op": "insert", "path": "${/path/to/array/-}", "value": "${new_value}" },',
    '      { "op": "remove", "path": "${/path/to/object/key}" },',
    '      { "op": "remove", "path": "${/path/to/array/0}" },',
    '      { "op": "move", "from": "${/path/to/variable}", "to": "${/path/to/another/path}" }',
    '    ]',
    '    </JSONPatch>',
    '    </UpdateVariable>',
  ].join('\n');
}

function buildMvuOutputFormatEmphasize(): string {
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

function buildEjsStagePersona(role: RoleResult, index: number): string {
  const variablePath = `stat_data.${role.name}.好感度`;
  const variableName = `qz_stage_value_${index + 1}`;
  const common = role.stagePersonas.common.trim();
  return [
    '<%_',
    `if (typeof ${variableName} === 'undefined') var ${variableName} = getvar(${jsonString(variablePath)}, { defaults: 0 });`,
    '_%>',
    '',
    '性格调色盘：人的性格就像调色盘，由多种性格衍生组合而成才是活生生的人',
    '',
    `<%_ if (${variableName} <= 30) { _%>`,
    `${role.name} 初识期:`,
    '  阶段内容: |-',
    ...yamlBlock(role.stagePersonas.early, 4),
    `<%_ } else if (${variableName} <= 70) { _%>`,
    `${role.name} 熟悉期:`,
    '  阶段内容: |-',
    ...yamlBlock(role.stagePersonas.middle, 4),
    '<%_ } else { _%>',
    `${role.name} 亲近期:`,
    '  阶段内容: |-',
    ...yamlBlock(role.stagePersonas.close, 4),
    '<%_ } _%>',
    ...(common
      ? [
          `${role.name} 通用阶段内容:`,
          '  衍生与二次解释: |-',
          ...yamlBlock(common, 4),
        ]
      : []),
  ].join('\n');
}

export function buildStatusRegexHtml(roles: RoleResult[]): string {
  const statusRoles = roles.map(role => ({
    name: role.name,
    affectionPath: `stat_data.${role.name}.好感度`,
    avatarUrl: role.draft.statusAvatarUrl.trim(),
    backgroundUrl: role.draft.statusBackgroundUrl.trim(),
  }));
  const scriptClose = '</' + 'script>';
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <style>',
    '    :root { --qz-cold: #325c9d; --qz-sky: #4eb9e7; --qz-soft: #f5b7c9; --qz-hot: #bd2d3a; }',
    '    body { margin: 0; padding: 0; font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif; color: #18211f; }',
    '    .qz-card-status { width: 100%; box-sizing: border-box; border: 1px solid rgba(31,45,42,.13); border-radius: 8px; background: linear-gradient(135deg, rgba(247,245,239,.96), rgba(230,236,232,.96)); padding: 10px; box-shadow: 0 12px 30px rgba(21,29,27,.12); }',
    '    .qz-card-status-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }',
    '    .qz-card-status-head h3 { margin: 0; font-size: 15px; line-height: 1.3; font-weight: 700; }',
    '    .qz-card-status-head p { margin: 3px 0 0; color: #66736d; font-size: 11px; line-height: 1.4; }',
    '    .qz-card-status-scene { display: grid; gap: 3px; min-width: 96px; color: #66736d; font-size: 11px; text-align: right; }',
    '    .qz-role-list { display: grid; gap: 8px; }',
    '    .qz-status-role { position: relative; isolation: isolate; display: grid; grid-template-columns: 1fr; align-items: center; min-height: 82px; overflow: hidden; border: 1px solid rgba(255,255,255,.58); border-radius: 8px; background: linear-gradient(135deg, rgba(255,255,255,.72), rgba(238,242,239,.72)); box-shadow: inset 0 0 0 1px rgba(31,45,42,.05); }',
    '    .qz-status-role.has-avatar { grid-template-columns: auto 1fr; }',
    '    .qz-status-role.has-bg { color: #fff; background-size: cover; background-position: center; border-color: rgba(255,255,255,.22); }',
    '    .qz-status-role::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: linear-gradient(90deg, rgba(255,255,255,.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,.14), transparent 52%); }',
    '    .qz-status-avatar { width: 78px; padding: 10px 0 10px 10px; }',
    '    .qz-status-avatar img { display: block; width: 58px; height: 58px; object-fit: cover; border: 1px solid rgba(255,255,255,.68); border-radius: 8px; background: rgba(255,255,255,.18); box-shadow: 0 8px 18px rgba(18,26,24,.18); }',
    '    .qz-status-role-body { display: grid; gap: 9px; min-width: 0; padding: 12px; }',
    '    .qz-role-name { margin: 0; overflow: hidden; color: currentColor; font-size: 16px; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }',
    '    .qz-affection-row { display: grid; grid-template-columns: 58px minmax(88px,1fr) 40px; align-items: center; gap: 9px; min-width: 0; }',
    '    .qz-heartline { display: block; width: 58px; height: 24px; color: color-mix(in srgb, var(--qz-affection-color, #4eb9e7) 88%, currentColor); filter: drop-shadow(0 2px 7px color-mix(in srgb, var(--qz-affection-color, #4eb9e7) 40%, transparent)); }',
    '    .qz-progress { position: relative; min-width: 0; height: 10px; overflow: hidden; border-radius: 999px; background: rgba(31,45,42,.1); box-shadow: inset 0 0 0 1px rgba(31,45,42,.09); }',
    '    .qz-status-role.has-bg .qz-progress { background: rgba(255,255,255,.28); box-shadow: inset 0 0 0 1px rgba(255,255,255,.28); }',
    '    .qz-progress-fill { position: relative; display: block; width: calc(var(--qz-affection, 0) * 1%); height: 100%; overflow: hidden; border-radius: inherit; box-shadow: 0 0 16px color-mix(in srgb, var(--qz-affection-color, #4eb9e7) 34%, transparent); }',
    '    .qz-progress-fill::before { content: ""; position: absolute; inset: 0 auto 0 0; width: var(--qz-gradient-width, 100%); min-width: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--qz-cold) 0%, var(--qz-sky) 40%, var(--qz-soft) 72%, var(--qz-hot) 100%); }',
    '    .qz-affection-value { min-width: 40px; color: var(--qz-affection-color, #4eb9e7); font-size: 21px; font-weight: 700; line-height: 1; text-align: right; text-shadow: 0 6px 18px color-mix(in srgb, var(--qz-affection-color, #4eb9e7) 22%, transparent); }',
    '    .qz-role-foot { color: color-mix(in srgb, currentColor 58%, transparent); font-size: 11px; }',
    '    .qz-status-pager { display: none; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 9px; }',
    '    .qz-status-pager.active { display: flex; }',
    '    .qz-status-pager button { min-width: 30px; height: 26px; border: 0; border-radius: 6px; background: rgba(50,92,157,.12); color: #325c9d; font: inherit; cursor: pointer; }',
    '    .qz-status-pager button:disabled { cursor: default; opacity: .45; }',
    '    .qz-status-pager span { color: #66736d; font-size: 11px; }',
    '    @media (max-width: 480px) { .qz-card-status { padding: 8px; } .qz-card-status-scene { display: none; } .qz-status-role.has-avatar { grid-template-columns: 1fr; } .qz-status-avatar { width: auto; padding: 10px 10px 0; } .qz-status-avatar img { width: 52px; height: 52px; } .qz-affection-row { grid-template-columns: 48px minmax(80px,1fr) 34px; gap: 7px; } .qz-heartline { width: 48px; } .qz-affection-value { font-size: 19px; min-width: 34px; } }',
    '  </style>',
    '  <script type="module">',
    `    const QZ_STATUS_ROLES = ${JSON.stringify(statusRoles)};`,
    '    const QZ_PAGE_SIZE = 4;',
    '    let qzStatusPage = 0;',
    '    function qzClampNumber(value, min, max) {',
    '      const number = Number(value);',
    '      if (!Number.isFinite(number)) return min;',
    '      return Math.min(max, Math.max(min, number));',
    '    }',
    '    function qzAffectionColor(value) {',
    "      if (value <= 33) return '#325c9d';",
    "      if (value <= 58) return '#4eb9e7';",
    "      if (value <= 82) return '#f5b7c9';",
    "      return '#bd2d3a';",
    '    }',
    '    function qzHeartbeatSvg() {',
    '      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");',
    '      svg.setAttribute("class", "qz-heartline");',
    '      svg.setAttribute("viewBox", "0 0 120 40");',
    '      svg.setAttribute("aria-label", "好感度");',
    '      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");',
    '      path.setAttribute("d", "M4 22 H22 L31 8 L42 33 L55 16 L66 22 H84");',
    '      path.setAttribute("fill", "none");',
    '      path.setAttribute("stroke", "currentColor");',
    '      path.setAttribute("stroke-width", "3.2");',
    '      path.setAttribute("stroke-linecap", "round");',
    '      path.setAttribute("stroke-linejoin", "round");',
    '      svg.append(path);',
    '      return svg;',
    '    }',
    '    function qzSetText(selector, value) {',
    '      const node = document.querySelector(selector);',
    '      if (node) node.textContent = value;',
    '    }',
    '    function qzCreateRoleCard(role, variables) {',
    '      const value = qzClampNumber(_.get(variables, role.affectionPath, 0), 0, 100);',
    '      const card = document.createElement("article");',
    '      card.className = "qz-status-role";',
    '      if (role.avatarUrl) card.classList.add("has-avatar");',
    '      if (role.backgroundUrl) {',
    '        card.classList.add("has-bg");',
    '        card.style.backgroundImage = `linear-gradient(90deg, rgba(9,14,18,.74), rgba(9,14,18,.52) 48%, rgba(9,14,18,.24)), url("${String(role.backgroundUrl).replaceAll(\'"\', \'\\\\\\"\')}")`;',
    '      }',
    '      card.style.setProperty("--qz-affection", String(value));',
    '      card.style.setProperty("--qz-gradient-width", `${10000 / Math.max(value, 1)}%`);',
    '      card.style.setProperty("--qz-affection-color", qzAffectionColor(value));',
    '      if (role.avatarUrl) {',
    '        const avatar = document.createElement("aside");',
    '        avatar.className = "qz-status-avatar";',
    '        const image = document.createElement("img");',
    '        image.src = role.avatarUrl;',
    '        image.alt = "";',
    '        avatar.append(image);',
    '        card.append(avatar);',
    '      }',
    '      const body = document.createElement("div");',
    '      body.className = "qz-status-role-body";',
    '      const title = document.createElement("h4");',
    '      title.className = "qz-role-name";',
    '      title.textContent = role.name;',
    '      const row = document.createElement("div");',
    '      row.className = "qz-affection-row";',
    '      const progress = document.createElement("div");',
    '      progress.className = "qz-progress";',
    '      const fill = document.createElement("span");',
    '      fill.className = "qz-progress-fill";',
    '      progress.append(fill);',
    '      const valueNode = document.createElement("strong");',
    '      valueNode.className = "qz-affection-value";',
    '      valueNode.textContent = String(value);',
    '      row.append(qzHeartbeatSvg(), progress, valueNode);',
    '      const foot = document.createElement("div");',
    '      foot.className = "qz-role-foot";',
    '      foot.textContent = "好感度";',
    '      body.append(title, row, foot);',
    '      card.append(body);',
    '      return card;',
    '    }',
    '    function populateCharacterData() {',
    '      const variables = getAllVariables();',
    '      qzSetText("#qz-status-time", String(_.get(variables, "stat_data.世界.当前时间", "开局")));',
    '      qzSetText("#qz-status-place", String(_.get(variables, "stat_data.世界.当前地点", "待定")));',
    '      const list = document.querySelector("#qz-role-list");',
    '      if (!list) return;',
    '      list.textContent = "";',
    '      const totalPages = Math.max(1, Math.ceil(QZ_STATUS_ROLES.length / QZ_PAGE_SIZE));',
    '      qzStatusPage = Math.min(qzStatusPage, totalPages - 1);',
    '      const pageRoles = QZ_STATUS_ROLES.slice(qzStatusPage * QZ_PAGE_SIZE, (qzStatusPage + 1) * QZ_PAGE_SIZE);',
    '      pageRoles.forEach(role => list.append(qzCreateRoleCard(role, variables)));',
    '      const pager = document.querySelector("#qz-status-pager");',
    '      const pageInfo = document.querySelector("#qz-page-info");',
    '      const prev = document.querySelector("#qz-page-prev");',
    '      const next = document.querySelector("#qz-page-next");',
    '      if (pager) pager.classList.toggle("active", totalPages > 1);',
    '      if (pageInfo) pageInfo.textContent = `${qzStatusPage + 1}/${totalPages}`;',
    '      if (prev) prev.disabled = qzStatusPage <= 0;',
    '      if (next) next.disabled = qzStatusPage >= totalPages - 1;',
    '    }',
    '    async function init() {',
    "      await waitGlobalInitialized('Mvu');",
    '      document.querySelector("#qz-page-prev")?.addEventListener("click", () => { qzStatusPage -= 1; populateCharacterData(); });',
    '      document.querySelector("#qz-page-next")?.addEventListener("click", () => { qzStatusPage += 1; populateCharacterData(); });',
    '      populateCharacterData();',
    '      eventOn(Mvu.events.VARIABLE_INITIALIZED, populateCharacterData);',
    '      eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, populateCharacterData);',
    '    }',
    '    $(errorCatched(init));',
    `  ${scriptClose}`,
    '</head>',
    '<body>',
    '  <section class="qz-card-status">',
    '    <div class="qz-card-status-head">',
    '      <div>',
    '        <h3>角色状态</h3>',
    '        <p>CURRENT STATUS</p>',
    '      </div>',
    '      <div class="qz-card-status-scene">',
    '        <span id="qz-status-time">开局</span>',
    '        <span id="qz-status-place">待定</span>',
    '      </div>',
    '    </div>',
    '    <div id="qz-role-list" class="qz-role-list">',
    '    </div>',
    '    <div id="qz-status-pager" class="qz-status-pager">',
    '      <button id="qz-page-prev" type="button">‹</button>',
    '      <span id="qz-page-info">1/1</span>',
    '      <button id="qz-page-next" type="button">›</button>',
    '    </div>',
    '  </section>',
    '</body>',
    '</html>',
  ].join('\n');
}

export function buildWorldviewEntries(worldview: WorldviewResult): PartialDeep<WorldbookEntry>[] {
  return [
    baseEntry(
      '世界观',
      tagWrap('世界观_id1', worldview.content),
      constantStrategy(),
      beforeCharacter(1),
    ),
  ];
}

export function buildRoleOverviewEntries(roles: RoleResult[]): PartialDeep<WorldbookEntry>[] {
  return [
    baseEntry(
      '角色速览',
      tagWrap('角色速览_id0', buildRoleOverview(roles)),
      constantStrategy(),
      beforeCharacter(4),
    ),
  ];
}

export function buildRoleEntries(role: RoleResult, index: number, isMultiRole: boolean): PartialDeep<WorldbookEntry>[] {
  const tagId = 2 + index * 4;
  const roleTag = (suffix: string, offset: number) => `${safeTagName(role.name)}_${suffix}_id${tagId + offset}`;
  return [
    baseEntry(
      `${role.name}_基础信息`,
      tagWrap(roleTag('基础信息', 0), role.basic),
      roleStrategy(role, isMultiRole),
      afterCharacter(99),
    ),
    baseEntry(
      `${role.name}_性格调色盘`,
      tagWrap(roleTag('性格调色盘', 1), role.palette),
      roleStrategy(role, isMultiRole),
      afterCharacter(99),
    ),
    baseEntry(
      `${role.name}_二次解释`,
      tagWrap(roleTag('二次解释', 2), role.reinterpret),
      isMultiRole ? selectiveStrategy(role.aliases) : constantStrategy(),
      atDepth(0, index + 1),
    ),
    baseEntry(
      `${role.name}_EJS调色盘多阶段人设`,
      tagWrap(roleTag('EJS调色盘多阶段人设', 3), buildEjsStagePersona(role, index)),
      roleStrategy(role, isMultiRole),
      afterCharacter(99),
    ),
  ];
}

export function buildFixedMvuEntries(roles: RoleResult[]): PartialDeep<WorldbookEntry>[] {
  return [
    baseEntry('[initvar]变量初始化勿开', buildMvuInitvar(roles), constantStrategy(), atDepth(4, 200), false),
    baseEntry('变量列表', buildMvuList(), constantStrategy(), atDepth(0, 200)),
    baseEntry('[mvu_update]变量更新规则', buildMvuRules(roles), constantStrategy(), atDepth(0, 200)),
    baseEntry('[mvu_update]变量输出格式', buildMvuOutputFormat(), constantStrategy(), atDepth(0, 200)),
    baseEntry('[mvu_update]变量输出格式强调', buildMvuOutputFormatEmphasize(), constantStrategy(), atDepth(0, 200), false),
  ];
}

export function buildArtifacts(worldview: WorldviewResult, roles: RoleResult[]): WriterArtifacts {
  const isMultiRole = roles.length > 1;
  const entries: PartialDeep<WorldbookEntry>[] = [
    ...buildWorldviewEntries(worldview),
    ...buildRoleOverviewEntries(roles),
    ...roles.flatMap((role, index) => buildRoleEntries(role, index, isMultiRole)),
    ...buildFixedMvuEntries(roles),
  ];

  return {
    entries,
    mvuSchemaScript: buildMvuSchemaScript(roles),
    statusRegexHtml: buildStatusRegexHtml(roles),
  };
}

export function writerEntryMarker(): string {
  return writerMarker;
}
