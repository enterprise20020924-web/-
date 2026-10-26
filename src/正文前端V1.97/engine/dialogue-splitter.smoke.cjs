require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
  },
});

const assert = require('node:assert/strict');
const { splitDialogueSource } = require('./dialogue-splitter.ts');
const {
  DIALOGUE_MAP_DATA_KEY,
  DIALOGUE_MAP_OUTPUT_CONTRACT,
  calibrateDialogueMapEntriesForSource,
  createStoredDialogueMap,
  extractDialogueMapFromMessage,
  filterDialogueMapEntriesForSource,
  getCurrentSwipeVariableValue,
  isDialogueMapCompleteForSource,
  readStoredDialogueMap,
} = require('./dialogue-map.ts');
const { removeDialogueMapOutsideCot, stripGeneratedParagraphLabels } = require('./content-blocks.ts');
const { deriveKnownCharactersForContent } = require('./known-characters.ts');

function split(content, speakerInferenceMode = 'normal') {
  const knownCharacters = deriveKnownCharactersForContent(content, '', '测试玩家', '测试玩家');
  return splitDialogueSource({
    messageId: 1,
    content,
    knownCharacters,
    userAliases: ['{{user}}', '男主', '女主'],
    speakerInferenceMode,
  }).segments;
}

function splitWithMap(content, dialogueMap, speakerInferenceMode = 'normal', sourceOverrides = {}) {
  const knownCharacters = [
    ...deriveKnownCharactersForContent(content, '', '测试玩家', '测试玩家'),
    ...dialogueMap.flatMap(entry => [entry.speaker, entry.focus]).filter(Boolean),
  ];
  return splitDialogueSource({
    messageId: 1,
    content,
    knownCharacters,
    userAliases: ['{{user}}', '男主', '女主'],
    dialogueMap,
    speakerInferenceMode,
    ...sourceOverrides,
  }).segments;
}

function findSegment(segments, textIncludes) {
  return segments.find(segment => segment.text.includes(textIncludes));
}

function expectSegment(content, textIncludes, expected) {
  const segment = findSegment(split(content), textIncludes);
  assert.ok(segment, `missing segment: ${textIncludes}`);
  assert.equal(segment.kind, expected.kind, `${textIncludes} kind`);
  assert.equal(segment.speaker ?? '旁白', expected.speaker, `${textIncludes} speaker`);
}

function expectKnownExcludes(content, forbiddenName) {
  const knownCharacters = deriveKnownCharactersForContent(content, '', '测试玩家', '测试玩家');
  assert.equal(knownCharacters.includes(forbiddenName), false, `${forbiddenName} must not enter knownCharacters`);
}

{
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /^<baipo_dialogue_map_protocol>/, 'prompt must use a protocol wrapper');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /\*\*此段规则为meta级别规则，不允许遗忘\*\*/, 'prompt meta rule');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /紧跟一个同一行自闭合标签/, 'prompt must require inline tags');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /固定格式：第一句台词后写 <台词1/, 'prompt must define numbered tags');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /第二句写 <台词2/, 'prompt must require continuous numbering');
  assert.match(
    DIALOGUE_MAP_OUTPUT_CONTRACT,
    /同一自然段有多句台词时，每句仍各自紧跟独立编号标签/,
    'prompt must label every quote in one paragraph',
  );
  assert.match(
    DIALOGUE_MAP_OUTPUT_CONTRACT,
    /直接台词数量必须与台词标签数量完全相同/,
    'prompt must require full dialogue coverage',
  );
  assert.match(
    DIALOGUE_MAP_OUTPUT_CONTRACT,
    /禁止在 <\/content> 后再输出 dialogue_map JSON/,
    'prompt must forbid duplicate legacy output',
  );
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /只要 speaker 非 null，focus 就必须非 null/, 'prompt focus invariant');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /<\/baipo_dialogue_map_protocol>$/, 'prompt wrapper must close');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /凡成对中文或英文双引号内含句末符号/, 'prompt must include quoted sentences');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /“啊？干嘛？”之类短句/, 'prompt must include short quoted questions');
  assert.match(
    DIALOGUE_MAP_OUTPUT_CONTRACT,
    /纯旁白、动作、环境、心理描写.*不加台词标签/,
    'prompt must omit narration tags',
  );
  assert.match(
    DIALOGUE_MAP_OUTPUT_CONTRACT,
    /speaker 必须在写该句时根据当前语义确定/,
    'prompt must require speaker attribution',
  );
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /批量写 null/, 'prompt must reject blanket null attribution');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /简称、完整姓名与玩家身份由前端统一解析/, 'prompt must delegate identity normalization');
  assert.match(DIALOGUE_MAP_OUTPUT_CONTRACT, /默认逐字复制 speaker/, 'prompt must give focus a useful default');
  assert.equal(
    stripGeneratedParagraphLabels('P1:\n第一段。\n\nP2：\n第二段。'),
    '第一段。\n\n第二段。',
    'repeated accidental P labels should be hidden from rendered content',
  );
  assert.equal(
    stripGeneratedParagraphLabels('P1: 是协议名称。'),
    'P1: 是协议名称。',
    'a single prose-like P label should remain untouched',
  );

  const storedMap = { version: 1, sourceHash: 'test', entries: [] };
  assert.equal(
    getCurrentSwipeVariableValue(
      {
        swipe_id: 1,
        variables: [{}, { [DIALOGUE_MAP_DATA_KEY]: storedMap }],
      },
      DIALOGUE_MAP_DATA_KEY,
    ),
    storedMap,
    'current swipe array variables should expose the cached map',
  );
  assert.equal(
    getCurrentSwipeVariableValue(
      {
        swipe_id: 2,
        variables: { 2: { [DIALOGUE_MAP_DATA_KEY]: storedMap } },
      },
      DIALOGUE_MAP_DATA_KEY,
    ),
    storedMap,
    'current swipe keyed variables should expose the cached map',
  );
  assert.equal(
    getCurrentSwipeVariableValue(
      {
        swipe_id: 3,
        variables: { [DIALOGUE_MAP_DATA_KEY]: storedMap },
      },
      DIALOGUE_MAP_DATA_KEY,
    ),
    storedMap,
    'direct message variables should expose the cached map without a swipe wrapper',
  );

  const sourceText = ['清晨的广场。', '“什么大人。”', '苏菲转身离开。'].join('\n\n');
  const hashMismatchedMap = {
    version: 1,
    sourceHash: 'stale-hash',
    entries: [
      { i: 1, p: 1, anchor: '清晨的广场', speaker: null, focus: null, kind: 'narration' },
      { i: 2, p: 2, anchor: '什么大人', speaker: '苏菲', focus: '苏菲', kind: 'speech' },
      { i: 3, p: 3, anchor: '苏菲转身离开', speaker: null, focus: '苏菲', kind: 'action' },
    ],
  };
  assert.equal(readStoredDialogueMap(hashMismatchedMap, sourceText), null, 'strict cache read must keep hash guard');
  assert.equal(
    readStoredDialogueMap(hashMismatchedMap, sourceText, true)?.entries.length,
    3,
    'current swipe cache should recover from a hash mismatch when paragraph anchors verify it',
  );
  assert.equal(
    readStoredDialogueMap(
      {
        ...hashMismatchedMap,
        entries: hashMismatchedMap.entries.map(entry => ({ ...entry, anchor: `不存在${entry.i}` })),
      },
      sourceText,
      true,
    ),
    null,
    'hash mismatch recovery must reject unrelated cached maps',
  );

  const leadingMetadataSource = [
    '3月17日，上午八点。',
    '天海高等性斗学园的中心广场挤满了人。',
    '广场正中央搭了一个临时舞台。',
    '“大家早上好啊！”',
    '台下的人群举起手机拍摄。',
    '音乐声重新盖过了交谈声。',
  ].join('\n\n');
  const leadingMetadataOmittedMap = {
    version: 1,
    sourceHash: 'stale-leading-metadata-hash',
    entries: [
      { i: 1, p: 1, anchor: '天海高等性斗学园', speaker: null, focus: '苏菲', kind: 'narration' },
      { i: 2, p: 2, anchor: '广场正中央搭了一个', speaker: null, focus: '星野光', kind: 'narration' },
      { i: 3, p: 3, anchor: '大家早上好啊', speaker: '星野光', focus: '星野光', kind: 'speech' },
      { i: 4, p: 4, anchor: '台下的人群举起手机', speaker: null, focus: '星野光', kind: 'narration' },
      { i: 5, p: 5, anchor: '音乐声重新盖过', speaker: null, focus: null, kind: 'narration' },
    ],
  };
  assert.equal(
    calibrateDialogueMapEntriesForSource(leadingMetadataOmittedMap.entries, leadingMetadataSource)[0]?.p,
    2,
    'a single global anchor offset may recover a leading metadata omission',
  );
  assert.equal(
    readStoredDialogueMap(leadingMetadataOmittedMap, leadingMetadataSource, true)?.entries[0]?.p,
    1,
    'hash-mismatch recovery must preserve the raw map while calibration remains render-only',
  );

  const partiallyValidEntries = [
    { i: 1, p: 1, anchor: '清晨的广场', speaker: null, focus: null, kind: 'narration' },
    { i: 2, p: 2, anchor: '不存在的锚点', speaker: '苏菲', focus: '苏菲', kind: 'speech' },
    { i: 3, p: 3, anchor: '苏菲转身离开', speaker: null, focus: '苏菲', kind: 'action' },
  ];
  const partiallyValidStoredMap = createStoredDialogueMap(partiallyValidEntries, sourceText);
  assert.equal(
    filterDialogueMapEntriesForSource(partiallyValidEntries, sourceText).length,
    2,
    'anchor diagnostics should still identify unmatched paragraph entries',
  );
  assert.equal(
    calibrateDialogueMapEntriesForSource(partiallyValidEntries, sourceText).length,
    3,
    'rendering must retain declared P entries instead of letting anchor diagnostics discard them',
  );
  assert.equal(
    readStoredDialogueMap(partiallyValidStoredMap, sourceText)?.entries.length,
    3,
    'stored maps must retain every sanitized entry instead of persisting the render subset',
  );

  const boundarySource = [
    '清晨的广场上人声鼎沸。',
    '星野光举起麦克风。“大家早上好呀！”',
    '掌声淹没了舞台边缘。',
    '苏菲压低声音。“我们先离开这里。”',
  ].join('\n\n');
  const boundaryEntries = [
    {
      i: 1,
      p: 4,
      line_start: '星野光举起麦克风',
      line_end: '大家早上好呀！”',
      anchor: '大家早上好呀',
      speaker: '星野光',
      focus: '星野光',
      kind: 'speech',
    },
    {
      i: 2,
      p: 2,
      line_start: '苏菲压低声音',
      line_end: '我们先离开这里。”',
      anchor: '我们先离开这里',
      speaker: '苏菲',
      focus: '苏菲',
      kind: 'speech',
    },
  ];
  const boundaryCalibratedEntries = calibrateDialogueMapEntriesForSource(boundaryEntries, boundarySource);
  assert.deepEqual(
    boundaryCalibratedEntries.map(entry => entry.p),
    [2, 4],
    'unique five-character paragraph boundaries should repair shuffled P values',
  );
  const boundarySegments = splitWithMap(boundarySource, boundaryEntries, 'normal', {
    knownCharacters: ['星野光', '苏菲'],
  });
  assert.equal(findSegment(boundarySegments, '大家早上好呀')?.speaker, '星野光');
  assert.equal(findSegment(boundarySegments, '我们先离开这里')?.speaker, '苏菲');

  const shortBoundarySource = ['人群仍在喧闹。', '“啊？干嘛？”', '舞台灯光骤然亮起。'].join('\n\n');
  const shortBoundaryEntries = [
    {
      i: 1,
      p: 3,
      line_start: '“啊？干嘛？”',
      line_end: '“啊？干嘛？”',
      anchor: '啊？干嘛？',
      speaker: '苏菲',
      focus: '苏菲',
      kind: 'speech',
    },
  ];
  assert.equal(
    calibrateDialogueMapEntriesForSource(shortBoundaryEntries, shortBoundarySource)[0]?.p,
    2,
    'a unique short paragraph must relocate by its complete start/end fields without a length threshold',
  );
  const shortBoundarySegments = splitWithMap(shortBoundarySource, shortBoundaryEntries, 'normal', {
    knownCharacters: ['苏菲'],
    primaryUserName: '苏菲',
    userAliases: ['{{user}}', '苏菲'],
  });
  const shortUserSpeech = findSegment(shortBoundarySegments, '啊？干嘛');
  assert.equal(shortUserSpeech?.kind, 'user', 'a relocated user speech must not render as narration');
  assert.equal(shortUserSpeech?.speaker, '苏菲', 'a relocated user speech must retain its mapped identity');

  const embeddedBoundarySource = [
    '苏菲皱了皱眉，红色的眼眸里漫上不耐。',
    '“借过。”苏菲的声音不大，那个男生根本没听见，还在那里对着舞台挥手。',
    '苏菲挑了挑眉，红色的眼眸里审视着对方。“特殊通道？”',
  ].join('\n\n');
  const embeddedBoundaryEntries = [
    {
      i: 1,
      p: 15,
      line_start: '“借过。”',
      line_end: '借过。”',
      anchor: '借过',
      speaker: '苏菲',
      focus: '苏菲',
      kind: 'speech',
    },
    {
      i: 2,
      p: 70,
      line_start: '“特殊通道？”',
      line_end: '特殊通道？”',
      anchor: '特殊通道',
      speaker: '苏菲',
      focus: '苏菲',
      kind: 'speech',
    },
  ];
  assert.deepEqual(
    calibrateDialogueMapEntriesForSource(embeddedBoundaryEntries, embeddedBoundarySource).map(entry => entry.p),
    [2, 3],
    'unique dialogue-sentence boundaries must repair P even when one edge is inside a longer natural paragraph',
  );
  const embeddedBoundarySegments = splitWithMap(embeddedBoundarySource, embeddedBoundaryEntries, 'normal', {
    knownCharacters: ['苏菲'],
    primaryUserName: '苏菲',
    userAliases: ['{{user}}', '苏菲'],
  });
  assert.equal(findSegment(embeddedBoundarySegments, '借过')?.kind, 'user');
  assert.equal(findSegment(embeddedBoundarySegments, '特殊通道')?.kind, 'user');

  const missingFocusSegments = splitWithMap(
    '“请往这边走。”',
    [
      {
        i: 1,
        p: 1,
        line_start: '“请往这边走。”',
        line_end: '“请往这边走。”',
        anchor: '请往这边走',
        speaker: '普通新生',
        focus: null,
        kind: 'speech',
      },
    ],
    'normal',
    { knownCharacters: ['普通新生'] },
  );
  assert.equal(
    findSegment(missingFocusSegments, '请往这边走')?.focusSpeaker,
    '普通新生',
    'a non-null map speaker must automatically become focus when focus is omitted',
  );
}

expectSegment('没有人多说一句话。', '没有人多说', {
  kind: 'narration',
  speaker: '旁白',
});

expectSegment('她没有退路了。', '她没有退路', {
  kind: 'narration',
  speaker: '旁白',
});
expectKnownExcludes('她没有退路了。', '她没有');

expectSegment('他无法继续后退。', '他无法继续后退', {
  kind: 'narration',
  speaker: '旁白',
});
expectKnownExcludes('他无法继续后退。', '他无法继续后');

expectSegment('陌生女生：别过来！', '陌生女生：别过来', {
  kind: 'narration',
  speaker: '旁白',
});
expectKnownExcludes('陌生女生：别过来！', '陌生女生');

expectSegment('陌生女生说道：“别过来！”', '陌生女生说道', {
  kind: 'narration',
  speaker: '旁白',
});
expectKnownExcludes('陌生女生说道：“别过来！”', '陌生女生');

expectSegment('陌生男生问道：“你是谁？”', '陌生男生问道', {
  kind: 'narration',
  speaker: '旁白',
});
expectKnownExcludes('陌生男生问道：“你是谁？”', '陌生男生');

expectSegment('女学生低声说：“这里不太对劲。”', '女学生低声说', {
  kind: 'narration',
  speaker: '旁白',
});
expectKnownExcludes('女学生低声说：“这里不太对劲。”', '女学生');

expectSegment('男学生：快跑！', '男学生：快跑', {
  kind: 'narration',
  speaker: '旁白',
});
expectKnownExcludes('男学生：快跑！', '男学生');

expectSegment('索亚·伊万诺娃合上书，始终没有抬头。', '索亚·伊万诺娃合上书', {
  kind: 'narration',
  speaker: '旁白',
});

expectSegment('索亚自始至终没有抬头。', '索亚自始至终', {
  kind: 'narration',
  speaker: '旁白',
});

expectSegment('索亚·伊万诺娃合上书，始终没有抬头。\n\n“唔！”', '“唔！”', {
  kind: 'npc',
  speaker: '索亚伊万诺娃',
});

expectSegment(
  '旁边一直坐着喝茶的爱丽丝·温特不知道什么时候脱掉了外套。\n\n“索亚同学，要不要老师帮帮你呀？”',
  '“索亚同学',
  {
    kind: 'npc',
    speaker: '爱丽丝温特',
  },
);

expectSegment(
  '响木天音跳起来躲过。\n\n“索亚同学，要不要老师帮帮你呀？”\n\n旁边一直坐着喝茶的爱丽丝·温特不知道什么时候脱掉了左脚的高跟鞋。她坐在椅子上，白皙的脚丫悠悠地伸了过来，对准了索亚。\n\n索亚在半空中硬生生扭转腰部。',
  '“索亚同学',
  {
    kind: 'npc',
    speaker: '爱丽丝温特',
  },
);

expectSegment('S班那帮怪物谁敢在爱丽丝·温特眼皮子底下搞事。', '眼皮子底下', {
  kind: 'narration',
  speaker: '旁白',
});

expectSegment('教室正中央的位置坐着爱丽丝·温特。', '爱丽丝·温特', {
  kind: 'narration',
  speaker: '旁白',
});

expectSegment('静夜盯着屏幕看了大概五秒钟。', '静夜盯着屏幕', {
  kind: 'narration',
  speaker: '旁白',
});

{
  const content = '亚衣坐在某张课桌上，背景是A班特有的落地窗。她穿着校服，安静地看向窗外。';
  const segments = splitWithMap(content, [
    { i: 1, p: 1, anchor: '亚衣坐在某张课桌上', speaker: '亚衣', focus: null, kind: 'action' },
  ]);
  const segment = findSegment(segments, '亚衣坐在某张课桌上');
  assert.ok(segment, 'missing mapped named action narration');
  assert.equal(segment.kind, 'narration', 'mapped named action kind');
  assert.equal(segment.speaker ?? '旁白', '旁白', 'mapped named action speaker');
  assert.equal(segment.focusSpeaker?.endsWith('亚衣'), true, 'mapped named action focus fallback');
}

expectSegment(
  '响木天音在记录表前停下。\n\n她在“综合评估”栏里工整地写下“合格”。\n\n“爱丽丝老师，视察完毕，没有异常。”',
  '“爱丽丝老师',
  {
    kind: 'npc',
    speaker: '响木天音',
  },
);

{
  const segments = splitWithMap('响木天音在记录表前停下。\n\n“索亚同学，要不要老师帮帮你呀？”', [
    { i: 1, p: 1, anchor: '响木天音在记录表前停下', speaker: null, focus: '响木天音', kind: 'action' },
    { i: 2, p: 2, anchor: '索亚同学，要不要老师帮帮你呀', speaker: '爱丽丝', focus: '爱丽丝', kind: 'speech' },
  ]);
  const narration = findSegment(segments, '响木天音在记录表前停下');
  const speech = findSegment(segments, '索亚同学');
  assert.ok(narration, 'missing mapped narration');
  assert.equal(narration.speaker ?? '旁白', '旁白', 'mapped narration speaker');
  assert.equal(narration.focusSpeaker, '响木天音', 'mapped narration focus');
  assert.ok(speech, 'missing mapped speech');
  assert.equal(speech.speaker, '爱丽丝', 'mapped speech speaker');
  assert.equal(speech.focusSpeaker, '爱丽丝', 'mapped speech focus');
  assert.equal(speech.speakerSource, 'map', 'mapped speech source');
}

{
  const segments = splitWithMap('她没有退路了。', [
    { i: 1, p: 1, anchor: '她没有退路了', speaker: '她没有退路了', focus: '二楼', kind: 'speech' },
  ]);
  const segment = findSegment(segments, '她没有退路');
  assert.ok(segment, 'missing unsafe mapped segment');
  assert.equal(segment.kind, 'narration', 'unsafe map kind');
  assert.equal(segment.speaker ?? '旁白', '旁白', 'unsafe map speaker');
  assert.equal(segment.focusSpeaker ?? null, null, 'unsafe map focus');
}

{
  const inlineMessage = [
    '<content>',
    '清晨的广场很安静。',
    '',
    '“大家早上好！”<台词1 speaker="星野光" focus="星野光"/>她向台下挥手。',
    '',
    '苏菲皱眉：“借过。”<台词2 speaker="苏菲" focus="苏菲"/>',
    '</content>',
  ].join('\n');
  const extracted = extractDialogueMapFromMessage(inlineMessage);
  assert.equal(extracted.found, true, 'inline dialogue markers must be extracted');
  assert.equal(extracted.cleanedMessage.includes('<台词'), false, 'inline markers must be removed from render text');
  assert.deepEqual(
    extracted.entries.map(entry => ({ i: entry.i, p: entry.p, speaker: entry.speaker, focus: entry.focus })),
    [
      { i: 1, p: 2, speaker: '星野光', focus: '星野光' },
      { i: 2, p: 3, speaker: '苏菲', focus: '苏菲' },
    ],
    'marker positions must mechanically derive the natural paragraph and identity',
  );
  assert.equal(extracted.entries[0].anchor, '大家早上好！', 'first inline marker anchor');
  assert.equal(extracted.entries[1].anchor, '借过。', 'second inline marker anchor');
  assert.equal(
    removeDialogueMapOutsideCot(inlineMessage).includes('<台词'),
    false,
    'inline markers must be removed before writing the chat message back',
  );

  const content = extracted.cleanedMessage.match(/<content>([\s\S]*?)<\/content>/i)?.[1].trim() ?? '';
  const segments = splitWithMap(content, extracted.entries, 'normal', {
    knownCharacters: ['星野光', '苏菲'],
    primaryUserName: '苏菲',
    userAliases: ['{{user}}', '苏菲'],
  });
  assert.equal(findSegment(segments, '大家早上好')?.speaker, '星野光', 'inline NPC ownership');
  assert.equal(findSegment(segments, '借过')?.kind, 'user', 'inline user ownership');
  assert.equal(findSegment(segments, '借过')?.speaker, '苏菲', 'inline user full name');
}

{
  const inlineMessage =
    '<content>“第一句。”<台词7 speaker="星野光" focus="星野光"/>她停顿，“第二句。”<台词99 speaker="响木天音" focus="响木天音"/></content>';
  const extracted = extractDialogueMapFromMessage(inlineMessage);
  assert.deepEqual(
    extracted.entries.map(entry => [entry.i, entry.p, entry.anchor, entry.speaker]),
    [
      [1, 1, '第一句。', '星野光'],
      [2, 1, '第二句。', '响木天音'],
    ],
    'actual marker order must repair bad model numbering and allow two speeches in one paragraph',
  );
  assert.equal(
    isDialogueMapCompleteForSource(extracted.entries, '“第一句。”她停顿，“第二句。”'),
    true,
    'two mapped speeches may share one natural paragraph',
  );
  assert.equal(
    filterDialogueMapEntriesForSource(extracted.entries, '“第一句。”她停顿，“第二句。”').length,
    2,
    'map diagnostics must retain both entries from the same paragraph',
  );
  const segments = splitWithMap('“第一句。”她停顿，“第二句。”', extracted.entries, 'normal', {
    knownCharacters: ['星野光', '响木天音'],
  });
  assert.equal(findSegment(segments, '第一句')?.speaker, '星野光', 'first same-paragraph speaker');
  assert.equal(findSegment(segments, '第二句')?.speaker, '响木天音', 'second same-paragraph speaker');
}

{
  const content = '<content>索亚·伊万诺娃面前那本像砖头一样厚的教材，直接从实木桌面上滑了下去。</content>';
  const bareMap =
    '[{"i":1,"p":1,"anchor":"索亚·伊万诺娃面前那本像砖头一样厚的教材","speaker":null,"focus":"索亚·伊万诺娃","kind":"narration"}]';
  const extracted = extractDialogueMapFromMessage(`${content}\n${bareMap}`);
  assert.equal(extracted.found, true, 'bare dialogue_map must be extracted');
  assert.equal(
    extracted.cleanedMessage.includes('"speaker"'),
    false,
    'bare dialogue_map must be cleaned from render text',
  );
  assert.equal(extracted.entries.length, 1, 'bare dialogue_map entries');
  assert.equal(extracted.entries[0].focus, '索亚·伊万诺娃', 'bare dialogue_map focus');
}

{
  const content = '<content>"哎呀。" 爱丽丝发出了一个单音节。</content>';
  const bareMap = '[{"i":1,"p":1,"anchor":"哎呀。","speaker":"爱丽丝","focus":"爱丽丝","kind":"speech"}]';
  const extraFrontend = '\n```html\n<body>其他前端</body>\n```';
  const extracted = extractDialogueMapFromMessage(`${content}\n${bareMap}${extraFrontend}`);
  assert.equal(extracted.found, true, 'bare dialogue_map before extra frontend must be extracted');
  assert.equal(
    extracted.cleanedMessage.includes('"speaker"'),
    false,
    'bare dialogue_map before extra frontend must be cleaned',
  );
  assert.equal(
    extracted.cleanedMessage.includes('其他前端'),
    true,
    'extra frontend content must remain after map cleanup',
  );

  const segments = splitWithMap('"哎呀。" 爱丽丝发出了一个单音节。', extracted.entries);
  const segment = findSegment(segments, '哎呀');
  assert.ok(segment, 'missing quoted speech with trailing attribution segment');
  assert.equal(segment.kind, 'npc', 'quoted speech with trailing attribution kind');
  assert.equal(segment.speaker, '爱丽丝温特', 'quoted speech with trailing attribution speaker');
}

{
  const segments = splitWithMap('索亚·伊万诺娃面前那本像砖头一样厚的教材，直接从实木桌面上滑了下去。', [
    {
      i: 1,
      p: 1,
      anchor: '索亚·伊万诺娃面前那本像砖头一样厚的教材',
      speaker: '索亚·伊万诺娃',
      focus: '索亚·伊万诺娃',
      kind: 'speech',
    },
  ]);
  const segment = findSegment(segments, '像砖头一样厚的教材');
  assert.ok(segment, 'missing map speech guard segment');
  assert.equal(segment.kind, 'npc', 'map speech must be trusted even without quote or colon');
  assert.equal(segment.speaker, '索亚伊万诺娃', 'map speech speaker must be trusted');
  assert.equal(segment.focusSpeaker, '索亚伊万诺娃', 'non-speech map focus can remain');
  assert.equal(segment.speakerSource, 'map', 'map speech source');
}

{
  const segments = splitWithMap(
    [
      '"下周的校内赛，名单出来了吗？"',
      '响木天音刚把手从文件夹上移开，准备开口回答。',
      '"啪嗒。"',
      '教室后方传来一记突兀的声响。',
      '索亚的肩膀轻微地抖了一下。她没有说话，只是把桌上的书转了一百八十度。',
      '响木天音收回视线，把视察记录表夹在腋下。',
      '"名单学生会还在做最后的确认，"她对上爱丽丝的目光，声音平稳。',
      '"嗯，去吧。辛苦啦。"爱丽丝喝了一口红茶。',
      '"那个……"',
      '索亚没有看她，视线依旧死死钉在书上。',
      '"刚才掉出来的……"索亚的语速很快。',
    ].join('\n\n'),
    [
      {
        i: 1,
        p: 1,
        anchor: '下周的校内赛，名单出来了吗',
        speaker: '爱丽丝·温特',
        focus: '爱丽丝·温特',
        kind: 'speech',
      },
      { i: 2, p: 2, anchor: '响木天音刚把手从文件夹上移开', speaker: null, focus: '响木天音', kind: 'action' },
      { i: 3, p: 3, anchor: '啪嗒', speaker: null, focus: null, kind: 'sfx' },
      { i: 4, p: 4, anchor: '教室后方传来一记突兀的声响', speaker: null, focus: '响木天音', kind: 'narration' },
      { i: 5, p: 5, anchor: '索亚的肩膀轻微地抖了一下', speaker: null, focus: '索亚·伊万诺娃', kind: 'action' },
      { i: 6, p: 6, anchor: '响木天音收回视线', speaker: null, focus: '响木天音', kind: 'action' },
      { i: 7, p: 7, anchor: '名单学生会还在做最后的确认', speaker: '响木天音', focus: '响木天音', kind: 'speech' },
      { i: 8, p: 8, anchor: '嗯，去吧', speaker: '爱丽丝·温特', focus: '爱丽丝·温特', kind: 'speech' },
      { i: 9, p: 9, anchor: '那个', speaker: '索亚·伊万诺娃', focus: '索亚·伊万诺娃', kind: 'speech' },
      { i: 10, p: 10, anchor: '索亚没有看她', speaker: null, focus: '索亚·伊万诺娃', kind: 'narration' },
      { i: 11, p: 11, anchor: '刚才掉出来的', speaker: '索亚·伊万诺娃', focus: '索亚·伊万诺娃', kind: 'speech' },
    ],
  );
  const soyaAction = findSegment(segments, '索亚的肩膀轻微地抖了一下');
  const amaneSpeech = findSegment(segments, '名单学生会还在做最后的确认');
  const aliceSpeech = findSegment(segments, '嗯，去吧');
  const soyaNarration = findSegment(segments, '索亚没有看她');
  const soyaSpeech = findSegment(segments, '刚才掉出来的');
  assert.ok(soyaAction, 'missing map-aligned soya action');
  assert.equal(soyaAction.speaker ?? '旁白', '旁白', 'map action must not inherit fallback speaker');
  assert.equal(soyaAction.focusSpeaker, '索亚伊万诺娃', 'map action focus');
  assert.ok(amaneSpeech, 'missing map-aligned amane speech');
  assert.equal(amaneSpeech.speaker, '响木天音', 'map speech must survive extra merged entries');
  assert.equal(amaneSpeech.speakerSource, 'map', 'amane speech source');
  assert.ok(aliceSpeech, 'missing map-aligned alice speech');
  assert.equal(aliceSpeech.speaker, '爱丽丝温特', 'alice speech speaker');
  assert.ok(soyaNarration, 'missing map-aligned soya narration');
  assert.equal(soyaNarration.speaker ?? '旁白', '旁白', 'map narration name bar');
  assert.equal(soyaNarration.focusSpeaker, '索亚伊万诺娃', 'map narration focus');
  assert.ok(soyaSpeech, 'missing map-aligned soya speech');
  assert.equal(soyaSpeech.speaker, '索亚伊万诺娃', 'soya speech speaker');
}

expectSegment(
  '还没汇总完。响木天音转过身，“各个班级报上来的名单还在——”\n\n“啪嗒。”\n\n一声沉闷的钝响打断了她的话。',
  '各个班级报上来的名单',
  {
    kind: 'npc',
    speaker: '响木天音',
  },
);

expectSegment(
  '还没汇总完。响木天音转过身，“各个班级报上来的名单还在——”\n\n“啪嗒。”\n\n一声沉闷的钝响打断了她的话。',
  '“啪嗒。”',
  {
    kind: 'narration',
    speaker: '旁白',
  },
);

{
  const segments = split('索亚·伊万诺娃合上书，始终没有抬头。\n\n“唔！”', 'conservative');
  const segment = findSegment(segments, '“唔！”');
  assert.ok(segment, 'missing conservative standalone quote');
  assert.equal(segment.kind, 'narration', 'conservative standalone quote kind');
  assert.equal(segment.speaker ?? '旁白', '旁白', 'conservative standalone quote speaker');
}

{
  const segments = splitWithMap('爱丽丝低声说，别动。', [
    { i: 1, p: 1, anchor: '别动', speaker: '爱丽丝', focus: '爱丽丝', kind: 'speech' },
  ]);
  const segment = findSegment(segments, '别动');
  assert.ok(segment, 'missing paragraph mapped speech without quote');
  assert.equal(segment.kind, 'npc', 'paragraph mapped speech kind');
  assert.equal(segment.speaker, '爱丽丝温特', 'paragraph mapped speech speaker');
  assert.equal(segment.speakerSource, 'map', 'paragraph mapped speech source');
}

{
  const segments = splitWithMap('索亚停下。\n\n天音抬头。', [
    { i: 1, p: 1, anchor: '索亚停下', speaker: null, focus: '索亚·伊万诺娃', kind: 'action' },
    { i: 2, p: 2, anchor: '天音抬头', speaker: null, focus: '响木天音', kind: 'action' },
  ]);
  const soya = findSegment(segments, '索亚停下');
  const amane = findSegment(segments, '天音抬头');
  assert.ok(soya, 'missing mapped short narration soya');
  assert.ok(amane, 'missing mapped short narration amane');
  assert.equal(soya.speaker ?? '旁白', '旁白', 'mapped short narration soya speaker');
  assert.equal(soya.focusSpeaker, '索亚伊万诺娃', 'mapped short narration soya focus');
  assert.equal(amane.speaker ?? '旁白', '旁白', 'mapped short narration amane speaker');
  assert.equal(amane.focusSpeaker, '响木天音', 'mapped short narration amane focus');
}

{
  const segments = splitWithMap(
    '早上八点，天海高等学园正门。\n\n三月的风带点凉意。\n\n新生们三三两两地聚集在通道前。',
    [
      { i: 1, p: 1, anchor: '天海高等', speaker: null, focus: null, kind: 'narration' },
      { i: 2, p: 2, anchor: '风带点凉意', speaker: null, focus: null, kind: 'narration' },
      { i: 3, p: 3, anchor: '新生们三三', speaker: null, focus: null, kind: 'narration' },
    ],
  );
  assert.equal(segments.length, 1, 'mapped short narration should merge');
  assert.ok(segments[0].text.includes('天海高等学园正门'), 'merged mapped narration first line');
  assert.ok(segments[0].text.includes('风带点凉意'), 'merged mapped narration second line');
  assert.ok(segments[0].text.includes('新生们三三两两'), 'merged mapped narration third line');
  assert.equal(segments[0].speaker ?? '旁白', '旁白', 'merged mapped narration speaker');
  assert.equal(segments[0].speakerSource, 'map', 'merged mapped narration source');
}

{
  const segments = splitWithMap(
    '通道里的人流一阵接着一阵向前挤去，报名处前的指示牌在阳光下反着刺眼的白光。\n\n背后传来天音和另一个人说话的声音，很快就被周围更多的嘈杂声盖住了。\n\n拉杆箱的硬塑料轮子在不平整的石板路上发出连续的响声。',
    [
      { i: 1, p: 1, anchor: '人流一阵接着一阵', speaker: null, focus: null, kind: 'narration' },
      { i: 2, p: 2, anchor: '嘈杂声盖住了', speaker: null, focus: null, kind: 'narration' },
      { i: 3, p: 3, anchor: '硬塑料轮子', speaker: null, focus: null, kind: 'narration' },
    ],
  );
  assert.equal(segments.length, 1, 'medium mapped narration should merge tighter');
  assert.ok(segments[0].text.includes('\n'), 'merged narration must preserve line breaks');
  assert.ok(segments[0].text.includes('通道里的人流'), 'merged medium narration first line');
  assert.ok(segments[0].text.includes('背后传来天音'), 'merged medium narration second line');
  assert.ok(segments[0].text.includes('拉杆箱的硬塑料轮子'), 'merged medium narration third line');
}

{
  const segments = splitWithMap('小夜月静夜站在校门内侧。\n\n周围的声音很杂。\n\n她低头看了眼终端。', [
    { i: 1, p: 1, anchor: '站在校门', speaker: null, focus: '小夜月静夜', kind: 'action' },
    { i: 2, p: 2, anchor: '声音很杂', speaker: null, focus: null, kind: 'narration' },
    { i: 3, p: 3, anchor: '看了眼终端', speaker: null, focus: '小夜月静夜', kind: 'action' },
  ]);
  assert.equal(segments.length, 1, 'compatible focus narration should merge');
  assert.equal(segments[0].focusSpeaker, '小夜月静夜', 'merged compatible focus');
}

{
  const segments = splitWithMap('人群在通道口慢慢挪动。\n\n“同学。”\n\n风声从旗杆边掠过。', [
    { i: 1, p: 1, anchor: '人群在通道口', speaker: null, focus: null, kind: 'narration' },
    { i: 2, p: 2, anchor: '同学', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
    { i: 3, p: 3, anchor: '旗杆边掠过', speaker: null, focus: null, kind: 'narration' },
  ]);
  assert.equal(segments.length, 3, 'narration must not merge across speech');
  assert.equal(segments[1].kind, 'npc', 'speech remains separate npc segment');
  assert.equal(segments[1].speaker, '短发女生', 'speech speaker survives narration merge');
}

{
  const segments = splitWithMap('别动。\n\n风声掠过。', [
    { i: 1, p: 1, anchor: '别动', speaker: null, focus: null, kind: 'speech' },
    { i: 2, p: 2, anchor: '风声掠过', speaker: null, focus: null, kind: 'narration' },
  ]);
  assert.equal(segments.length, 2, 'speakerless speech map should not merge');
  const speech = findSegment(segments, '别动');
  assert.ok(speech, 'speakerless speech map segment exists');
  assert.equal(speech.kind, 'npc', 'speakerless speech map should display as anonymous npc');
  assert.equal(speech.speaker, '路人', 'speakerless speech map speaker');
  assert.ok(findSegment(segments, '风声掠过'), 'post speech narration segment exists');
}

{
  const dialogueMap = [{ i: 1, p: 1, anchor: '你也是新生吗', speaker: '普通女生', focus: '普通女生', kind: 'speech' }];
  const sourceOverrides = {
    userAliases: ['{{user}}', '苏菲', '女生', '你', '我'],
    primaryUserName: '苏菲',
    secondaryUserNames: [],
  };
  const segment = findSegment(
    splitWithMap('“那个……同学，你也是新生吗？”', dialogueMap, 'normal', sourceOverrides),
    '你也是新生吗',
  );
  assert.equal(segment?.kind, 'npc', 'generic female map speaker must never fall back to user');
  assert.equal(segment?.speaker, '普通女生', 'generic female map speaker must be preserved verbatim');

  const exactUserSegment = findSegment(
    splitWithMap(
      '“我来处理。”',
      [{ i: 1, p: 1, anchor: '我来处理', speaker: '苏菲', focus: '苏菲', kind: 'speech' }],
      'normal',
      sourceOverrides,
    ),
    '我来处理',
  );
  assert.equal(exactUserSegment?.kind, 'user', 'only an exact user name should map to user');
  assert.equal(exactUserSegment?.speaker, '苏菲', 'exact user map speaker');
}

{
  const segments = splitWithMap(
    '“星野学姐也在！真的假的！”',
    [{ i: 1, p: 1, anchor: '星野学姐也在', speaker: null, focus: '星野光', kind: 'speech' }],
    'normal',
    { knownCharacters: ['星野光'] },
  );
  const segment = findSegment(segments, '星野学姐也在');
  assert.ok(segment, 'missing focus-owned legacy speech map segment');
  assert.equal(segment.kind, 'npc', 'focus-owned legacy speech map should remain npc');
  assert.equal(segment.speaker, '星野光', 'known focus should recover a missing legacy speech owner');
  assert.equal(segment.focusSpeaker, '星野光', 'focused anonymous speech map portrait focus');
  assert.equal(segment.speakerSource, 'map', 'focused anonymous speech map source');
}

{
  const segments = splitWithMap(
    '“别看她，看着我。”',
    [{ i: 1, p: 1, anchor: '别看她', speaker: '苏菲', focus: '响木天音', kind: 'speech' }],
    'normal',
    { knownCharacters: ['苏菲', '响木天音'] },
  );
  const segment = findSegment(segments, '别看她');
  assert.equal(segment?.speaker, '苏菲', 'explicit map speaker must override a different focus');
  assert.equal(segment?.focusSpeaker, '响木天音', 'explicit focus should still control the portrait');
}

{
  const segments = splitWithMap('他压低声音，几乎是在哀求：“我没有金币。”', [
    { i: 1, p: 1, anchor: '没有金币', speaker: null, focus: null, kind: 'speech' },
  ]);
  const segment = findSegment(segments, '没有金币');
  assert.ok(segment, 'missing anonymous bystander speech');
  assert.equal(segment.kind, 'npc', 'anonymous bystander speech kind');
  assert.equal(segment.speaker, '路人', 'anonymous bystander speech speaker');
  assert.equal(segment.speakerSource, 'map', 'anonymous bystander speech source');
}

{
  const segments = splitWithMap('第一句。第二句。第三句。', [
    { i: 1, p: 1, anchor: '第一句', speaker: null, focus: '响木天音', kind: 'action' },
  ]);
  const first = findSegment(segments, '第一句');
  const second = findSegment(segments, '第二句');
  const third = findSegment(segments, '第三句');
  assert.ok(first && second && third, 'missing paragraph adjudicated segments');
  assert.equal(first.focusSpeaker, '响木天音', 'paragraph first focus');
  assert.equal(second.focusSpeaker, '响木天音', 'paragraph second focus');
  assert.equal(third.focusSpeaker, '响木天音', 'paragraph third focus');
}

{
  const segments = splitWithMap(
    '响木天音在记录表前停下。\n\n“索亚同学，要不要老师帮帮你呀？”',
    [{ i: 1, p: 2, anchor: '不存在', speaker: '爱丽丝', focus: '爱丽丝', kind: 'speech' }],
    'conservative',
  );
  const segment = findSegment(segments, '索亚同学');
  assert.ok(segment, 'missing conservative bad-anchor quote');
  assert.equal(segment.speaker ?? '旁白', '旁白', 'bad anchor must not map speaker');
  assert.equal(segment.speakerSource, 'fallback', 'bad anchor source');
}

{
  const segments = splitWithMap('“我在找综合服务大厅。”', [
    { i: 1, p: 1, anchor: '综合服务大厅', speaker: '{{user}}', focus: '小夜月静夜', kind: 'speech' },
  ]);
  const segment = findSegment(segments, '综合服务大厅');
  assert.ok(segment, 'missing paragraph adjudicated first-person quote');
  assert.equal(segment.kind, 'user', 'paragraph adjudicated user speech kind');
  assert.equal(segment.speaker, '{{user}}', 'paragraph adjudicated user speech speaker');
  assert.equal(segment.speakerSource, 'map', 'paragraph adjudicated user speech source');
}

{
  const content = '“我在找综合服务大厅。”她说完转身。';
  const segments = splitWithMap(content, [
    { i: 1, p: 1, anchor: '综合服务大厅', speaker: '{{user}}', focus: '小夜月静夜', kind: 'speech' },
  ]);
  const speech = findSegment(segments, '综合服务大厅');
  assert.ok(speech, 'missing mixed paragraph mapped speech');
  assert.equal(speech.kind, 'user', 'mixed paragraph speech kind');
  assert.equal(speech.text, '“我在找综合服务大厅。”', 'mixed paragraph speech should keep quote text only');
  assert.ok(!speech.text.includes('她说完转身'), 'trailing attribution must not enter the speech bubble');
  assert.equal(speech.speakerSource, 'map', 'mixed paragraph speech source');
}

{
  const segments = splitWithMap(
    '眼镜男生还在坚持，他的手紧紧抓着行李箱的拉杆。\n\n“我……我没有金币。”他说，“我真的什么都不知道。”',
    [
      { i: 1, p: 1, anchor: '眼镜男生还在坚持', speaker: null, focus: null, kind: 'narration' },
      { i: 2, p: 2, anchor: '没有金币', speaker: '{{user}}', focus: '小夜月静夜', kind: 'speech' },
    ],
  );
  const first = findSegment(segments, '没有金币');
  const second = findSegment(segments, '什么都不知道');
  assert.ok(first, 'missing map first-person speech');
  assert.ok(second, 'missing repeated map first-person speech');
  assert.equal(first.kind, 'user', 'map first-person speech should trust map speaker');
  assert.equal(first.speaker, '{{user}}', 'map first-person speaker should not be transient-overridden');
  assert.equal(second.speaker, '{{user}}', 'repeated map first-person speaker should trust map');
}

{
  const segments = splitWithMap('红外套男生往前逼近了一步，居高临下地看着他，“进了这扇门，拳头和段位才是规矩。”', [
    { i: 1, p: 1, anchor: '拳头和段位', speaker: '{{user}}', focus: '小夜月静夜', kind: 'speech' },
  ]);
  const segment = findSegment(segments, '拳头和段位');
  assert.ok(segment, 'missing red jacket map speech');
  assert.equal(segment.kind, 'user', 'map user speaker should not be transient-overridden by red jacket label');
  assert.equal(segment.speaker, '{{user}}', 'red jacket context must not override map speaker');
}

{
  const segments = splitWithMap('“我没有金币。”', [
    { i: 1, p: 1, anchor: '没有金币', speaker: '{{user}}', focus: '小夜月静夜', kind: 'speech' },
  ]);
  const segment = findSegment(segments, '没有金币');
  assert.ok(segment, 'missing genuine user first person speech');
  assert.equal(segment.kind, 'user', 'genuine user first person remains user');
  assert.equal(segment.speaker, '{{user}}', 'genuine user speaker');
}

{
  const segments = splitWithMap(
    '“同学。”',
    [{ i: 1, p: 1, anchor: '同学', speaker: '短发女生', focus: '短发女生', kind: 'speech' }],
    'normal',
    {
      userAliases: ['{{user}}', '小夜月静夜', '女生', '新生', '你', '我'],
      primaryUserName: '小夜月静夜',
      secondaryUserNames: ['新生'],
    },
  );
  const segment = findSegment(segments, '同学');
  assert.ok(segment, 'missing short-haired girl speech');
  assert.equal(segment.kind, 'npc', 'short-haired girl must not match generic user alias');
  assert.equal(segment.speaker, '短发女生', 'short-haired girl speaker');
  assert.equal(segment.focusSpeaker, '短发女生', 'short-haired girl focus');
}

{
  const segments = splitWithMap(
    '“好的。那我先去报到了。”',
    [{ i: 1, p: 1, anchor: '先去报到', speaker: '小夜月静夜', focus: '小夜月静夜', kind: 'speech' }],
    'normal',
    {
      userAliases: ['{{user}}', '女生', '新生', '你', '我'],
      primaryUserName: '小夜月静夜',
      secondaryUserNames: ['新生'],
    },
  );
  const segment = findSegment(segments, '先去报到');
  assert.ok(segment, 'missing primary user name speech');
  assert.equal(segment.kind, 'user', 'primary user name must be user');
  assert.equal(segment.speaker, '小夜月静夜', 'primary user name speaker');
}

{
  const segments = splitWithMap(
    '“我明白了。”',
    [{ i: 1, p: 1, anchor: '明白了', speaker: '新生', focus: '新生', kind: 'speech' }],
    'normal',
    {
      userAliases: ['{{user}}', '女生', '你', '我'],
      primaryUserName: '小夜月静夜',
      secondaryUserNames: ['新生'],
    },
  );
  const segment = findSegment(segments, '明白了');
  assert.ok(segment, 'missing non-user alias speech');
  assert.equal(segment.kind, 'npc', 'secondary alias must not substitute for the exact user name');
  assert.equal(segment.speaker, '新生', 'non-user alias speaker must be preserved');
}

{
  const segments = splitWithMap(
    '“我知道了。”静夜看着天音，语速依然平稳。\n\n她顺着新生的人流往中央广场走去。',
    [
      { i: 1, p: 1, anchor: '我知道了', speaker: '小夜月静夜', focus: null, kind: 'speech' },
      { i: 2, p: 2, anchor: '新生的人流', speaker: null, focus: '小夜月静夜', kind: 'action' },
    ],
    'normal',
    {
      userAliases: ['{{user}}', '小夜月静夜', '新生', '你', '我'],
      primaryUserName: '小夜月静夜',
      secondaryUserNames: ['新生'],
    },
  );
  const segment = findSegment(segments, '我知道了');
  assert.ok(segment, 'missing explicit user map speech near transient label');
  assert.equal(segment.kind, 'user', 'explicit user map speech remains user');
  assert.equal(segment.speaker, '小夜月静夜', 'explicit user map speaker must not be overwritten by transient label');
  assert.equal(segment.speakerSource, 'map', 'explicit user map source');
}

{
  const content = '<content>响木天音在记录表前停下，准备开口回答。</content>';
  const bareMap =
    '[{"i":1,"p":1,"anchor":"响木天音在记录表前停下，准备开口回答","speaker":null,"focus":"响木天音","kind":"action"}]';
  const extracted = extractDialogueMapFromMessage(`${content}\n${bareMap}`);
  assert.equal(extracted.entries[0].p, 1, 'paragraph index parse');
  assert.ok(extracted.entries[0].anchor.length <= 12, 'anchor must be shortened by sanitizer');
}

{
  const content = '“那个，学长……”女生小声说，“那个银色的箱子是我的。”';
  const segments = splitWithMap(content, [
    { i: 1, p: 1, anchor: '那个，学长', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'same-speaker inline quote attribution should stay in one display speech');
  assert.equal(
    segments[0].text,
    '“那个，学长……那个银色的箱子是我的。”',
    'same-speaker map speech should keep dialogue and remove the speech tag',
  );
  assert.equal(segments[0].speaker, '短发女生', 'merged inline quote speaker');
  assert.equal(segments[0].speakerSource, 'map', 'merged inline quote source');
  assert.equal(segments[0].text.includes('女生小声说'), false, 'inline quote attribution bridge should be hidden');
}

{
  const content = '“别动。”她伸手抓住箱子，“这是我的。”';
  const segments = splitWithMap(content, [
    { i: 1, p: 1, anchor: '别动', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
  ]);
  const firstSpeech = findSegment(segments, '别动');
  const secondSpeech = findSegment(segments, '这是我的');
  const bridge = findSegment(segments, '伸手抓住箱子');
  assert.ok(firstSpeech, 'missing speech before action bridge');
  assert.ok(secondSpeech, 'missing speech after action bridge');
  assert.ok(bridge, 'missing action bridge narration');
  assert.equal(firstSpeech.speaker, '短发女生', 'speech before action bridge speaker');
  assert.equal(secondSpeech.speaker, '短发女生', 'speech after action bridge speaker');
  assert.equal(bridge.kind, 'narration', 'physical action bridge should stay narration');
}

{
  const content =
    '“你自己买的？” 金发女生冷笑了一声，另一只手在千夏的桌子上敲了两下，“这学校里谁不知道那件衣服是限量版。就凭你一个刚入学的新生？你要是不说清楚，今天这事没完。”';
  const segments = splitWithMap(content, [
    { i: 1, p: 1, anchor: '金发女生冷笑', speaker: '金发女生', focus: '金发女生', kind: 'speech' },
  ]);
  const firstSpeech = findSegment(segments, '你自己买的');
  const secondSpeech = findSegment(segments, '这学校里谁不知道');
  const bridge = findSegment(segments, '金发女生冷笑');
  assert.ok(firstSpeech, 'missing first mapped quote around bridge action');
  assert.ok(secondSpeech, 'missing second mapped quote around bridge action');
  assert.ok(bridge, 'missing bridge action narration');
  assert.equal(firstSpeech.speaker, '金发女生', 'first bridge quote speaker');
  assert.equal(secondSpeech.speaker, '金发女生', 'second bridge quote speaker');
  assert.equal(firstSpeech.speakerSource, 'map', 'first bridge quote map source');
  assert.equal(secondSpeech.speakerSource, 'map', 'second bridge quote map source');
  assert.equal(bridge.kind, 'narration', 'bridge action should stay narration');
}

{
  const segments = splitWithMap('“你是谁？”男生问。\n\n“我？”女生愣住。', [
    { i: 1, p: 1, anchor: '你是谁', speaker: '男生', focus: '男生', kind: 'speech' },
    { i: 2, p: 2, anchor: '我？', speaker: '女生', focus: '女生', kind: 'speech' },
  ]);
  const first = findSegment(segments, '你是谁');
  const second = findSegment(segments, '我？');
  assert.ok(first, 'different-speaker first quote should remain');
  assert.ok(second, 'different-speaker second quote should remain');
  assert.equal(first.speaker, '男生', 'different-speaker first speaker');
  assert.equal(second.speaker, '女生', 'different-speaker second speaker');
  assert.equal(
    segments.some(segment => segment.text.includes('你是谁？') && segment.text.includes('我？')),
    false,
    'different-speaker inline bridge must not merge',
  );
}

{
  const segments = splitWithMap(
    '小夜月静夜侧身避开。\n“麻烦让一下。”',
    [{ i: 25, p: 25, anchor: '麻烦让一下。', speaker: '路人男生', focus: null, kind: 'speech' }],
    'normal',
    {
      userAliases: ['{{user}}', '小夜月静夜', '你', '我'],
      primaryUserName: '小夜月静夜',
      secondaryUserNames: [],
    },
  );
  const segment = findSegment(segments, '麻烦让一下');
  assert.ok(segment, 'missing invalid paragraph map fixture');
  assert.notEqual(segment.speaker, '路人男生', 'invalid p must not claim another source paragraph');
  assert.equal(segment.speakerSource, 'fallback', 'invalid p must safely degrade instead of moving by anchor');
}

{
  const segments = splitWithMap(
    '“嗯。”\n\n风声掠过。',
    [{ i: 1, p: 2, anchor: '嗯', speaker: '爱丽丝', focus: '爱丽丝', kind: 'speech' }],
    'conservative',
  );
  const segment = findSegment(segments, '嗯');
  assert.ok(segment, 'missing short-anchor quote');
  assert.equal(segment.kind, 'narration', 'short anchor must not drift across paragraphs');
  assert.equal(segment.speaker ?? '旁白', '旁白', 'short anchor drift speaker');
  assert.equal(segment.speakerSource, 'fallback', 'short anchor drift source');
}

{
  const content = [
    '3月17日，上午八点。',
    '天海高等性斗学园的中心广场挤满了人。',
    '广场正中央搭了一个临时舞台。',
    '“大家早上好啊！”',
    '台下的人群举起手机拍摄。',
    '音乐声重新盖过了交谈声。',
  ].join('\n\n');
  const dialogueMap = [
    { i: 1, p: 1, anchor: '天海高等性斗学园', speaker: null, focus: '苏菲', kind: 'narration' },
    { i: 2, p: 2, anchor: '广场正中央搭了一个', speaker: null, focus: '星野光', kind: 'narration' },
    { i: 3, p: 3, anchor: '大家早上好啊', speaker: '星野光', focus: '星野光', kind: 'speech' },
    { i: 4, p: 4, anchor: '台下的人群举起手机', speaker: null, focus: '星野光', kind: 'narration' },
    { i: 5, p: 5, anchor: '音乐声重新盖过', speaker: null, focus: null, kind: 'narration' },
  ];
  const segments = splitWithMap(content, dialogueMap, 'conservative', { knownCharacters: ['星野光'] });
  const speech = findSegment(segments, '大家早上好啊');
  assert.ok(speech, 'missing speech after a leading metadata paragraph omission');
  assert.equal(speech.sourceIndex, 3, 'omitted metadata must not hide the later source paragraph');
  assert.equal(speech.kind, 'npc', 'a uniform global anchor offset may recover the mapped speech');
  assert.equal(speech.speaker, '星野光', 'global anchor calibration must preserve the mapped speaker');
  assert.equal(speech.speakerSource, 'map', 'global anchor calibration must remain map-backed');
  assert.equal(dialogueMap[2].p, 3, 'global anchor calibration must not mutate the source map');
}

{
  const dialogueMap = [
    { i: 1, p: 1, anchor: '走到一半', speaker: null, focus: '星野光', kind: 'narration' },
    { i: 2, p: 2, anchor: '哎呀，那位新生妹妹', speaker: '星野光', focus: '星野光', kind: 'speech' },
    { i: 3, p: 3, anchor: '星野光的声音', speaker: null, focus: '星野光', kind: 'narration' },
  ];
  const content = [
    '走到一半，苏菲听到身侧传来一个声音。',
    '“哎呀，那位新生妹妹，那边走不通哦。”',
    '苏菲停下，侧头看过去。星野光正趴在护栏上，冲苏菲挥手。',
    '“报道处不在这边，要去左手边的综合服务大厅，穿过这个广场直走就到啦！”',
    '星野光的声音经过了麦克风放大，传得满场都是。',
    '“再往前走就能看到入口啦！”',
  ].join('\n\n');
  const filteredMap = filterDialogueMapEntriesForSource(dialogueMap, content);
  assert.equal(filteredMap.length, 2, 'only entries whose anchors belong to their declared P may survive');
  assert.equal(
    calibrateDialogueMapEntriesForSource(dialogueMap, content).length,
    3,
    'declared P entries must remain available even when an anchor diagnostic misses',
  );
  assert.equal(
    isDialogueMapCompleteForSource(dialogueMap, content),
    true,
    'post-generation structure checks must not pretend to know which semantic speech rows the model omitted',
  );
  const completeDialogueMap = [
    { i: 1, p: 2, anchor: '那位新生妹妹', speaker: '星野光', focus: '星野光', kind: 'speech' },
    { i: 2, p: 4, anchor: '报道处不在这边', speaker: '星野光', focus: '星野光', kind: 'speech' },
    { i: 3, p: 6, anchor: '再往前走', speaker: '星野光', focus: '星野光', kind: 'speech' },
  ];
  assert.equal(
    isDialogueMapCompleteForSource(completeDialogueMap, content),
    true,
    'a sparse map that covers every quoted speech paragraph must be complete',
  );
  const segments = splitWithMap(content, dialogueMap, 'normal', {
    knownCharacters: ['星野光', '苏菲'],
    primaryUserName: '苏菲',
    userAliases: ['{{user}}', '苏菲'],
  });
  const mappedSpeech = findSegment(segments, '那位新生妹妹');
  const omittedSpeech = findSegment(segments, '报道处不在这边');
  const continuedOmittedSpeech = findSegment(segments, '再往前走');
  assert.equal(mappedSpeech?.speaker, '星野光', 'the valid preceding P must keep its mapped speaker');
  assert.equal(mappedSpeech?.speakerSource, 'map', 'the valid preceding P must remain map-backed');
  assert.ok(omittedSpeech, 'an omitted P must remain visible');
  assert.equal(omittedSpeech.kind, 'npc', 'an omitted speech P may carry the previous mapped speaker');
  assert.equal(omittedSpeech.speaker, '星野光', 'an omitted speech P must carry the previous mapped speaker');
  assert.notEqual(omittedSpeech.speaker, '苏菲', 'an omitted P must never fall through to user');
  assert.equal(omittedSpeech.speakerSource, 'fallback', 'speaker carry must not pretend the missing P had a map entry');
  assert.equal(
    continuedOmittedSpeech?.speaker,
    '星野光',
    'consecutive missing P speech may continue the mapped speaker',
  );
  assert.equal(
    continuedOmittedSpeech?.speakerSource,
    'fallback',
    'continued speaker carry must remain distinguishable from an explicit map entry',
  );
}

{
  const segments = splitWithMap(
    '“第一句。”\n\n“第二句。”',
    [
      { i: 1, anchor: '不存在的第一句', speaker: '星野光', focus: '星野光', kind: 'speech' },
      { i: 2, anchor: '不存在的第二句', speaker: '响木天音', focus: '响木天音', kind: 'speech' },
    ],
    'conservative',
    { knownCharacters: ['星野光', '响木天音'] },
  );
  assert.ok(
    segments.every(segment => segment.speakerSource === 'fallback'),
    'rendered segment order must not substitute for missing source paragraph provenance',
  );
  assert.ok(
    segments.every(segment => segment.speaker !== '星野光' && segment.speaker !== '响木天音'),
    'unmatched legacy entries must not claim speakers by i order',
  );
}

{
  const segments = splitWithMap(
    '“第一句。”\n\n“第二句。”',
    [
      { i: 1, p: 1, anchor: '第一句', speaker: '星野光', focus: '星野光', kind: 'speech' },
      { i: 2, p: 2, anchor: '第二句', speaker: null, focus: null, kind: 'narration' },
    ],
    'normal',
    { knownCharacters: ['星野光', '响木天音'] },
  );
  const firstSpeech = findSegment(segments, '第一句');
  const secondSpeech = findSegment(segments, '第二句');
  assert.equal(firstSpeech?.speaker, '星野光', 'first paragraph mapped speaker');
  assert.notEqual(
    secondSpeech?.speaker,
    '星野光',
    'paragraph with its own map must not inherit the previous paragraph speaker',
  );
}

{
  const segments = splitWithMap('“今天的份额还没交上来，你是想被降级吗？” 女生说。', [
    { i: 1, p: 1, anchor: '今天的份额', speaker: '红短裙女生', focus: '红短裙女生', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'trailing generic attribution should not create a second display segment');
  assert.ok(!segments[0].text.includes('女生说'), 'trailing generic attribution should not enter the dialogue bubble');
  assert.equal(segments[0].speaker, '红短裙女生', 'trailing generic attribution should keep mapped speaker');
}

{
  const segments = splitWithMap('“别再靠近了。”\n千夏的声音不大。', [
    { i: 1, p: 1, anchor: '别再靠近', speaker: '千夏', focus: '千夏', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'trailing voice note should not create a second display segment');
  assert.ok(!segments[0].text.includes('千夏的声音不大'), 'voice note should not enter the dialogue bubble');
  assert.ok(segments[0].speaker.includes('千夏'), 'trailing voice note should keep mapped speaker');
}

{
  const segments = splitWithMap('“我不知道你在说什么。”\n千夏的声音不大，\n“这是我自己买的。”', [
    { i: 1, p: 1, anchor: '我不知道你在说什么', speaker: '千夏', focus: '千夏', kind: 'speech' },
    { i: 2, p: 3, anchor: '这是我自己买的', speaker: '千夏', focus: '千夏', kind: 'speech' },
  ]);
  assert.equal(segments.length, 2, 'voice note should be removed without swallowing either quote');
  assert.ok(segments[0].text.includes('我不知道你在说什么'), 'voice continuation should keep first quote');
  assert.ok(segments[1].text.includes('这是我自己买的'), 'voice continuation should keep second quote');
  assert.ok(
    segments.every(segment => !segment.text.includes('千夏的声音不大')),
    'voice note should be omitted',
  );
  assert.ok(
    segments.every(segment => segment.speaker.includes('千夏')),
    'voice continuation should keep same speaker',
  );
}

{
  const segments = splitWithMap('*\n“别动。”', [
    { i: 1, p: 2, anchor: '别动', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
  ]);
  assert.equal(
    segments.some(segment => segment.text.trim() === '*'),
    false,
    'standalone asterisk noise should be hidden',
  );
}

{
  const segments = splitWithMap(
    '响木天音转身就要走。\n\n小夜月静夜看着她的背影，下意识地往前走了一步。\n\n“前辈。”',
    [],
    'normal',
    {
      userAliases: ['{{user}}', '小夜月静夜', '你', '我'],
      primaryUserName: '小夜月静夜',
      secondaryUserNames: [],
    },
  );
  const segment = findSegment(segments, '前辈');
  assert.ok(segment, 'missing address-only quote segment');
  assert.equal(segment.kind, 'user', 'address-only quote should use previous actor instead of addressee');
  assert.equal(segment.speaker, '小夜月静夜', 'address-only quote speaker');
}

{
  const segments = splitWithMap(
    '响木天音转身就要走。\n\n小夜月静夜看着她的背影，下意识地往前走了一步。\n\n“前辈。”',
    [{ i: 3, p: 3, anchor: '前辈。', speaker: '小夜月静夜', focus: '小夜月静夜', kind: 'speech' }],
    'normal',
    {
      userAliases: ['{{user}}', '小夜月静夜', '你', '我'],
      primaryUserName: '小夜月静夜',
      secondaryUserNames: [],
    },
  );
  const segment = findSegment(segments, '前辈');
  assert.ok(segment, 'missing exact short-anchor mapped quote');
  assert.equal(segment.kind, 'user', 'exact short-anchor map should override fallback role');
  assert.equal(segment.speaker, '小夜月静夜', 'exact short-anchor map speaker');
  assert.equal(segment.speakerSource, 'map', 'exact short-anchor map source');
}

{
  const segments = splitWithMap(
    '星野光站在广场中央，向人群挥手。\n\n“星野学姐也在！真的假的！”\n\n“大家，早上好！”星野光笑着回应。',
    [
      { i: 3, p: 1, anchor: '向人群挥手', speaker: null, focus: '星野光', kind: 'action' },
      { i: 4, p: 3, anchor: '大家，早上好！', speaker: '星野光', focus: '星野光', kind: 'speech' },
    ],
    'normal',
    { knownCharacters: ['星野光'] },
  );
  const segment = findSegment(segments, '星野学姐也在');
  assert.ok(segment, 'missing addressed-speaker regression quote');
  assert.notEqual(segment.speaker, '星野光', 'mentioned addressee must not become the quote speaker');
  assert.equal(findSegment(segments, '大家，早上好')?.speaker, '星野光', 'actual mapped speaker must remain intact');
}

{
  const segments = splitWithMap(
    '星野光站在广场中央，向人群挥手。\n\n“学姐也在！真的假的！”',
    [{ i: 1, p: 1, anchor: '向人群挥手', speaker: null, focus: '星野光', kind: 'action' }],
    'normal',
    { knownCharacters: ['星野光'] },
  );
  const segment = findSegment(segments, '学姐也在');
  assert.ok(segment, 'missing generic-address regression quote');
  assert.notEqual(segment.speaker, '星野光', 'generic addressee must not inherit recent focus as speaker');
}

{
  const segments = splitWithMap('星野光抬起头，笑着说道：“老师，我来了。”', [], 'normal', {
    knownCharacters: ['星野光'],
  });
  const segment = findSegment(segments, '老师，我来了');
  assert.ok(segment, 'missing explicitly attributed generic-address quote');
  assert.equal(segment.speaker, '星野光', 'explicit attribution must survive generic address wording');
}

{
  const segments = splitWithMap(
    '“星野学姐也在！真的假的！”“大家，早上好！”',
    [{ i: 2, p: 1, anchor: '大家，早上好！', speaker: '星野光', focus: '星野光', kind: 'speech' }],
    'normal',
    { knownCharacters: ['星野光'] },
  );
  const crowdQuote = findSegment(segments, '星野学姐也在');
  const mappedQuote = findSegment(segments, '大家，早上好');
  assert.ok(crowdQuote, 'missing same-paragraph anonymous quote');
  assert.ok(mappedQuote, 'missing same-paragraph mapped quote');
  assert.notEqual(crowdQuote.speaker, '星野光', 'named paragraph map must not leak to another quote');
  assert.equal(mappedQuote.speaker, '星野光', 'named paragraph map should stay on its own anchor');
  assert.equal(mappedQuote.speakerSource, 'map', 'named paragraph map source');
}

{
  const segments = splitWithMap(
    '“收到。”“收到。”',
    [{ i: 1, p: 1, anchor: '收到', speaker: '星野光', focus: '星野光', kind: 'speech' }],
    'normal',
    { knownCharacters: ['星野光'] },
  );
  const repeatedQuotes = segments.filter(segment => segment.text.includes('收到'));
  assert.equal(repeatedQuotes.length, 2, 'duplicate quote anchors should remain separate segments');
  assert.equal(
    repeatedQuotes.filter(segment => segment.speakerSource === 'map').length,
    1,
    'one paragraph map entry must be consumed only once',
  );
  assert.equal(
    repeatedQuotes.filter(segment => segment.speaker === '星野光').length,
    1,
    'one paragraph map entry must not claim duplicate quote text',
  );
}

for (const text of ['星野光拿起说明书，认真阅读。', '星野光看完问题清单，继续往前走。', '星野光知道这件事。']) {
  const segments = splitWithMap(text, [], 'normal', { knownCharacters: ['星野光'] });
  assert.equal(segments.length, 1, `lexical speech-verb noise segment count: ${text}`);
  assert.equal(segments[0].kind, 'narration', `lexical speech-verb noise must stay narration: ${text}`);
  assert.equal(segments[0].speaker, null, `lexical speech-verb noise must not create a speaker: ${text}`);
  assert.equal(segments[0].focusSpeaker, '星野光', `lexical speech-verb noise should keep visual focus: ${text}`);
}

for (const text of [
  '星野光走过通道。',
  '星野光检查轨道。',
  '星野光望向街道。',
  '星野光闻到奇怪的味道。',
  '星野光读完报道。',
  '星野光打开新的渠道。',
]) {
  const segments = splitWithMap(text, [], 'normal', { knownCharacters: ['星野光'] });
  assert.equal(segments.length, 1, `sentence-final 道 noun segment count: ${text}`);
  assert.equal(segments[0].kind, 'narration', `sentence-final 道 noun must stay narration: ${text}`);
  assert.equal(segments[0].speaker, null, `sentence-final 道 noun must not create a speaker: ${text}`);
}

for (const text of [
  '星野光回答。',
  '星野光看完了回答。',
  '星野光读完了解释。',
  '星野光注意到墙上的提醒。',
  '星野光没有得到回应。',
]) {
  const segments = splitWithMap(text, [], 'normal', { knownCharacters: ['星野光'] });
  assert.equal(segments.length, 1, `speech-tag-only segment count: ${text}`);
  assert.equal(segments[0].kind, 'narration', `speech tag without utterance content must stay narration: ${text}`);
  assert.equal(segments[0].speaker, null, `speech tag without utterance content must not create a speaker: ${text}`);
}

{
  const segments = splitWithMap('星野光低声说，先别动。', [], 'normal', { knownCharacters: ['星野光'] });
  assert.equal(segments.length, 1, 'real unquoted speech segment count');
  assert.equal(segments[0].kind, 'npc', 'real unquoted speech should remain dialogue');
  assert.equal(segments[0].speaker, '星野光', 'real unquoted speech speaker');
}

{
  const segments = splitWithMap('星野光道，先别动。', [], 'normal', { knownCharacters: ['星野光'] });
  assert.equal(segments.length, 1, 'bare 道 speech segment count');
  assert.equal(segments[0].kind, 'npc', 'bare 道 after a known speaker should remain dialogue');
  assert.equal(segments[0].speaker, '星野光', 'bare 道 speech speaker');
}

{
  const segments = splitWithMap(
    '那是星野光，她正站在舞台左侧挥手。\n\n站在她身边的银发少女穿着黑色哥特式短裙。那是学生会副会长，响木天音。她抬起手，几道不知从何处射来的聚光灯精准地打在她身上。',
    [],
    'normal',
    { knownCharacters: ['星野光', '响木天音'] },
  );
  const segment = findSegment(segments, '几道不知从何处');
  assert.ok(segment, 'missing real quantifier-dao narration regression');
  assert.equal(segment.kind, 'narration', 'quantifier 道 must not be treated as a speech verb');
  assert.equal(segment.speaker, null, 'quantifier 道 narration must not inherit a speaker');
  assert.equal(segment.focusSpeaker, '响木天音', 'explicitly introduced character should own narration focus');
}

{
  const segments = splitWithMap(
    '“我知道了。”',
    [{ i: 1, p: 1, anchor: '我知道了', speaker: '静夜', focus: '静夜', kind: 'speech' }],
    'normal',
    {
      userAliases: ['{{user}}', '小夜月静夜', '静夜', '你', '我'],
      primaryUserName: '小夜月静夜',
      secondaryUserNames: ['静夜'],
      knownCharacters: ['小夜月静夜'],
    },
  );
  const segment = findSegment(segments, '我知道了');
  assert.ok(segment, 'missing short-name map segment');
  assert.equal(segment.kind, 'user', 'registered user-name keyword must resolve to user');
  assert.equal(segment.speaker, '小夜月静夜', 'registered user-name keyword must display the canonical full name');
  assert.equal(
    segment.focusSpeaker,
    '小夜月静夜',
    'registered user focus keyword must display the canonical full name',
  );
}

{
  const segments = splitWithMap(
    '“先安静。”响木天音说道。\n\n“哈？”苏菲像是听到了什么笑话，笑了一声，“漂亮的杂鱼还是杂鱼。”',
    [
      { i: 1, p: 1, anchor: '先安静', speaker: '响木天音', focus: '响木天音', kind: 'speech' },
      { i: 2, p: 2, anchor: '哈?', speaker: '苏菲', focus: '苏菲', kind: 'speech' },
    ],
    'normal',
    { knownCharacters: ['苏菲', '响木天音'] },
  );
  const firstSpeech = findSegment(segments, '哈');
  const continuedSpeech = findSegment(segments, '漂亮的杂鱼');
  assert.ok(firstSpeech, 'missing full-width punctuation mapped speech');
  assert.ok(continuedSpeech, 'missing same-paragraph continued speech');
  assert.equal(firstSpeech.speaker, '苏菲', 'half-width map anchor must match full-width source punctuation');
  assert.equal(firstSpeech.speakerSource, 'map', 'full-width punctuation speech map source');
  assert.equal(continuedSpeech.speaker, '苏菲', 'same-paragraph continuation must retain mapped speaker');
  assert.equal(continuedSpeech.speakerSource, 'map', 'same-paragraph continuation map source');
  assert.equal(firstSpeech.sourceIndex, 1, 'mapped speech must retain its original source paragraph index');
  assert.equal(
    continuedSpeech.sourceIndex,
    firstSpeech.sourceIndex,
    'split dialogue parts must retain their original paragraph index',
  );
}

{
  const content = [
    '天海学园的中心广场上空，巨大的全息投影屏幕正在闪烁。',
    '新生入学报到的第一天，广场被舞台截断。',
    '“啊啊啊！是响木副会长！”\n“星野学姐也在！真的假的！”',
    '人群中爆发出一阵高分贝的尖叫。',
    '舞台正中央，两名少女正握着麦克风。',
    '左边的粉发少女是星野光。',
    '站在她身边的银发少女穿着黑色哥特式短裙。那是学生会副会长，响木天音。她抬起手，几道不知从何处射来的聚光灯精准地打在她身上。',
    '“大家——早上好！”星野光的声音通过扩音器传遍全场，带着那种特有的元气甜腻，“欢迎来到天海学园！这里，是梦想与欲望交织的乐园哦！”',
  ].join('\n\n');
  const segments = splitWithMap(
    content,
    [
      { i: 1, p: 1, anchor: '中心广场上空', speaker: null, focus: null, kind: 'narration' },
      { i: 2, p: 2, anchor: '新生入学报到', speaker: null, focus: null, kind: 'narration' },
      { i: 3, p: 3, anchor: '啊啊啊！是响木副会长！', speaker: null, focus: null, kind: 'speech' },
      { i: 4, p: 8, anchor: '大家——早上好！', speaker: '星野光', focus: '星野光', kind: 'speech' },
    ],
    'normal',
    { knownCharacters: ['星野光', '响木天音'] },
  );
  const firstCrowdQuote = findSegment(segments, '啊啊啊');
  const secondCrowdQuote = findSegment(segments, '星野学姐也在');
  const amaneNarration = findSegment(segments, '几道不知从何处');
  const hikariSpeech = findSegment(segments, '大家——早上好');
  const hikariContinuation = findSegment(segments, '欢迎来到天海学园');
  assert.equal(firstCrowdQuote?.speaker, '路人', 'mapped crowd quote should be anonymous');
  assert.equal(secondCrowdQuote?.speaker, '路人', 'same raw block crowd quote should inherit anonymous speech lock');
  assert.equal(amaneNarration?.kind, 'narration', 'real amane description should remain narration');
  assert.equal(amaneNarration?.focusSpeaker, '响木天音', 'real amane description focus');
  assert.equal(hikariSpeech?.speaker, '星野光', 'paragraph-authoritative hikari speech speaker');
  assert.equal(hikariSpeech?.speakerSource, 'map', 'paragraph-authoritative hikari speech source');
  assert.equal(hikariContinuation?.speaker, '星野光', 'same-paragraph mapped speech continuation speaker');
  assert.equal(hikariContinuation?.speakerSource, 'map', 'same-paragraph mapped speech continuation source');
  assert.ok(
    !hikariSpeech?.text.includes('声音通过扩音器'),
    'speech attribution bridge must not enter the dialogue bubble',
  );
}

{
  const segments = splitWithMap(
    '“第一句！”星野光说道，响木天音接过话：“第二句。”',
    [{ i: 1, p: 1, anchor: '第一句', speaker: '星野光', focus: '星野光', kind: 'speech' }],
    'normal',
    { knownCharacters: ['星野光', '响木天音'] },
  );
  assert.equal(findSegment(segments, '第一句')?.speaker, '星野光', 'explicit mapped first quote speaker');
  assert.notEqual(
    findSegment(segments, '第二句')?.speakerSource,
    'map',
    'forward map continuation must stop when the bridge explicitly changes speaker',
  );
}

{
  const segments = splitWithMap(
    '那个黄毛男生挤不过去，只好退回来，站在苏菲旁边，随着音乐点着头：“这届迎新搞得挺大啊，你是哪个班的？”',
    [],
    'normal',
    {
      knownCharacters: ['苏菲'],
      userAliases: ['苏菲', '你', '我'],
      primaryUserName: '苏菲',
      secondaryUserNames: [],
    },
  );
  const segment = findSegment(segments, '这届迎新');
  assert.equal(segment?.kind, 'npc', 'explicit generic person attribution should be npc speech');
  assert.equal(segment?.speaker, '路人', 'explicit generic person attribution should use anonymous npc label');
}

for (const text of ['星野光状态：正常。', '响木天音的装束：黑色哥特裙。']) {
  const segments = splitWithMap(text, [], 'normal', { knownCharacters: ['星野光', '响木天音'] });
  assert.equal(segments.length, 1, `descriptive colon segment count: ${text}`);
  assert.equal(segments[0].kind, 'narration', `descriptive colon label must not become dialogue: ${text}`);
  assert.equal(segments[0].speaker, null, `descriptive colon label must not assign a speaker: ${text}`);
}

for (const [text, expectedSpeaker] of [
  ['星野光：大家早上好。', '星野光'],
  ['莉莉安老师：请先去报到。', '莉莉安'],
]) {
  const segments = splitWithMap(text, [], 'normal', { knownCharacters: ['星野光', '莉莉安'] });
  assert.equal(segments.length, 1, `direct colon speech segment count: ${text}`);
  assert.equal(segments[0].kind, 'npc', `direct colon label should remain dialogue: ${text}`);
  assert.equal(segments[0].speaker, expectedSpeaker, `direct colon speech speaker: ${text}`);
}

{
  const segments = splitWithMap(
    '“请大家安静一下。”响木天音走到台前。',
    [{ i: 1, p: 1, anchor: '响木天音走到台前', speaker: null, focus: '响木天音', kind: 'narration' }],
    'normal',
    { knownCharacters: ['响木天音'] },
  );
  const speech = findSegment(segments, '请大家安静一下');
  assert.ok(speech, 'missing quote beside mapped narration');
  assert.equal(speech.kind, 'npc', 'paragraph narration map must not swallow a direct quote');
  assert.equal(speech.speaker, '响木天音', 'direct quote should keep its explicit paragraph actor');
  assert.notEqual(speech.speakerSource, 'map', 'narration map must not claim the direct quote');
}

{
  const segments = splitWithMap(
    '“谁在那边？”\n“我来处理。”响木天音说道。',
    [{ i: 1, p: 1, anchor: '谁在那边', speaker: null, focus: null, kind: 'speech' }],
    'normal',
    { knownCharacters: ['响木天音'] },
  );
  const anonymousSpeech = findSegment(segments, '谁在那边');
  const attributedSpeech = findSegment(segments, '我来处理');
  assert.equal(anonymousSpeech?.speaker, '路人', 'anonymous block seed should remain anonymous');
  assert.equal(attributedSpeech?.speaker, '响木天音', 'explicit attribution must stop anonymous block propagation');
  assert.notEqual(
    attributedSpeech?.speakerSource,
    'map',
    'anonymous map must not claim an explicitly attributed quote',
  );
}

{
  const segments = splitWithMap(
    '“谁在那边？”\n响木天音：“我来处理。”',
    [{ i: 1, p: 1, anchor: '谁在那边', speaker: null, focus: null, kind: 'speech' }],
    'normal',
    { knownCharacters: ['响木天音'] },
  );
  const attributedSpeech = findSegment(segments, '我来处理');
  assert.equal(attributedSpeech?.speaker, '响木天音', 'known colon label must stop anonymous block propagation');
  assert.notEqual(attributedSpeech?.speakerSource, 'map', 'anonymous map must not claim a known colon-labelled quote');
}

{
  const segments = splitWithMap(
    '“收到。”星野光说道。\n\n“收到。”',
    [
      { i: 1, p: 1, anchor: '收到', speaker: '星野光', focus: '星野光', kind: 'speech' },
      { i: 2, p: 2, anchor: '收到', speaker: '响木天音', focus: '响木天音', kind: 'speech' },
    ],
    'normal',
    { knownCharacters: ['星野光', '响木天音'] },
  );
  const repeatedSpeeches = segments.filter(segment => segment.text.includes('收到'));
  assert.equal(repeatedSpeeches.length, 2, 'legacy duplicate anchors should remain separate');
  assert.equal(repeatedSpeeches[0].speaker, '星野光', 'first legacy duplicate anchor speaker');
  assert.equal(repeatedSpeeches[1].speaker, '响木天音', 'second legacy duplicate anchor speaker');
  assert.equal(repeatedSpeeches[1].speakerSource, 'map', 'second legacy duplicate anchor must retain map ownership');
}

{
  const content = [
    '三月清晨的空气里还带着没散尽的凉意。',
    '超大功率音响架在临时舞台两侧。',
    '苏菲把拉杆箱往身侧收了收。',
    '台上站着两个人。',
    '左边的短发女生正在向台下挥手。',
    '右边的高个女生侧身配合着舞台动作。',
    '“副会长竟然也肯上台……”\n“响木天音大人今天好漂亮！”',
    '挤在苏菲前面两个男生正垫着脚尖往台上望。',
    '苏菲往前走了一步。',
  ].join('\n\n');
  const segments = splitWithMap(
    content,
    [
      { i: 7, p: 7, anchor: '副会长竟然也肯上台', speaker: null, focus: null, kind: 'narration' },
      { i: 8, p: 8, anchor: '挤在苏菲前面两个男生', speaker: null, focus: null, kind: 'narration' },
      { i: 9, p: 9, anchor: '苏菲往前走了一步', speaker: null, focus: '苏菲', kind: 'action' },
    ],
    'normal',
    {
      knownCharacters: ['苏菲', '响木天音'],
      userAliases: ['{{user}}', '苏菲', '你', '我'],
      primaryUserName: '苏菲',
      secondaryUserNames: [],
    },
  );
  const firstCrowdLine = findSegment(segments, '副会长竟然也肯上台');
  const secondCrowdLine = findSegment(segments, '响木天音大人今天好漂亮');
  const nextParagraph = findSegment(segments, '挤在苏菲前面两个男生');
  assert.ok(firstCrowdLine && secondCrowdLine && nextParagraph, 'missing natural paragraph provenance fixture');
  assert.equal(firstCrowdLine.sourceIndex, 6, 'first P7 line source paragraph');
  assert.equal(secondCrowdLine.sourceIndex, 6, 'second P7 line must remain in P7');
  assert.equal(nextParagraph.sourceIndex, 7, 'following prose must remain P8');
  assert.equal(secondCrowdLine.kind, 'narration', 'unmapped P7 continuation must not become player speech');
  assert.equal(secondCrowdLine.speaker, null, 'unmapped P7 continuation speaker');
}

{
  const content = [
    ...Array.from({ length: 25 }, (_, index) => `前置自然段${index + 1}。`),
    '“我是来上学的，不是来看这种廉价脱衣秀的。”苏菲打断了她的劝告，手腕一转，拉杆箱的拉杆缩了回去。她左手直接提起了箱子——那箱子并不轻，但她的手臂绷得很直，连肘关节都没怎么弯，“在哪里签到？把表给我。”',
    '引导员被她这种理直气壮的态度弄得有点懵。',
  ].join('\n\n');
  const segments = splitWithMap(
    content,
    [
      { i: 26, p: 26, anchor: '我是来上学的', speaker: '苏菲', focus: '苏菲', kind: 'speech' },
      { i: 27, p: 27, anchor: '引导员被她这种理直气壮的', speaker: null, focus: null, kind: 'narration' },
    ],
    'normal',
    {
      knownCharacters: ['苏菲'],
      userAliases: ['{{user}}', '苏菲', '你', '我'],
      primaryUserName: '苏菲',
      secondaryUserNames: [],
    },
  );
  const openingSpeech = findSegment(segments, '我是来上学的');
  const continuedSpeech = findSegment(segments, '在哪里签到');
  const actionBridge = findSegment(segments, '苏菲打断了她的劝告');
  assert.ok(openingSpeech && continuedSpeech && actionBridge, 'missing long same-paragraph speech fixture');
  assert.equal(openingSpeech.sourceIndex, 25, 'opening P26 speech source paragraph');
  assert.equal(continuedSpeech.sourceIndex, 25, 'continued P26 speech source paragraph');
  assert.equal(openingSpeech.speaker, '苏菲', 'opening P26 speech speaker');
  assert.equal(continuedSpeech.speaker, '苏菲', 'long action bridge must retain mapped P26 speaker');
  assert.equal(continuedSpeech.speakerSource, 'map', 'continued P26 speech map source');
  assert.equal(actionBridge.kind, 'narration', 'P26 action bridge must stay narration');
}

console.log('dialogue-splitter smoke: ok');
