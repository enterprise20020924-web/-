require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
  },
});

const assert = require('node:assert/strict');
const { splitDialogueSource } = require('./dialogue-splitter.ts');
const { extractDialogueMapFromMessage } = require('./dialogue-map.ts');
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
  kind: 'npc',
  speaker: '索亚·伊万诺娃',
});

expectSegment('索亚自始至终没有抬头。', '索亚自始至终', {
  kind: 'npc',
  speaker: '索亚',
});

expectSegment(
  '索亚·伊万诺娃合上书，始终没有抬头。\n\n“唔！”',
  '“唔！”',
  {
    kind: 'npc',
    speaker: '索亚伊万诺娃',
  },
);

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
  kind: 'npc',
  speaker: '爱丽丝温特',
});

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
    { i: 1, anchor: '响木天音在记录表前停下', speaker: null, focus: '响木天音', kind: 'action' },
    { i: 2, anchor: '索亚同学，要不要老师帮帮你呀', speaker: '爱丽丝', focus: '爱丽丝', kind: 'speech' },
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
    { i: 1, anchor: '她没有退路了', speaker: '她没有退路了', focus: '二楼', kind: 'speech' },
  ]);
  const segment = findSegment(segments, '她没有退路');
  assert.ok(segment, 'missing unsafe mapped segment');
  assert.equal(segment.kind, 'narration', 'unsafe map kind');
  assert.equal(segment.speaker ?? '旁白', '旁白', 'unsafe map speaker');
  assert.equal(segment.focusSpeaker ?? null, null, 'unsafe map focus');
}

{
  const content = '<content>索亚·伊万诺娃面前那本像砖头一样厚的教材，直接从实木桌面上滑了下去。</content>';
  const bareMap =
    '[{"i":1,"anchor":"索亚·伊万诺娃面前那本像砖头一样厚的教材","speaker":null,"focus":"索亚·伊万诺娃","kind":"narration"}]';
  const extracted = extractDialogueMapFromMessage(`${content}\n${bareMap}`);
  assert.equal(extracted.found, true, 'bare dialogue_map must be extracted');
  assert.equal(extracted.cleanedMessage.includes('"speaker"'), false, 'bare dialogue_map must be cleaned from render text');
  assert.equal(extracted.entries.length, 1, 'bare dialogue_map entries');
  assert.equal(extracted.entries[0].focus, '索亚·伊万诺娃', 'bare dialogue_map focus');
}

{
  const content = '<content>"哎呀。" 爱丽丝发出了一个单音节。</content>';
  const bareMap =
    '[{"i":1,"anchor":"哎呀。","speaker":"爱丽丝","focus":"爱丽丝","kind":"speech"}]';
  const extraFrontend = '\n```html\n<body>其他前端</body>\n```';
  const extracted = extractDialogueMapFromMessage(`${content}\n${bareMap}${extraFrontend}`);
  assert.equal(extracted.found, true, 'bare dialogue_map before extra frontend must be extracted');
  assert.equal(extracted.cleanedMessage.includes('"speaker"'), false, 'bare dialogue_map before extra frontend must be cleaned');
  assert.equal(extracted.cleanedMessage.includes('其他前端'), true, 'extra frontend content must remain after map cleanup');

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
    ].join('\n'),
    [
      { i: 1, anchor: '下周的校内赛，名单出来了吗', speaker: '爱丽丝·温特', focus: '爱丽丝·温特', kind: 'speech' },
      { i: 2, anchor: '响木天音刚把手从文件夹上移开', speaker: null, focus: '响木天音', kind: 'action' },
      { i: 3, anchor: '啪嗒', speaker: null, focus: null, kind: 'sfx' },
      { i: 4, anchor: '教室后方传来一记突兀的声响', speaker: null, focus: '响木天音', kind: 'narration' },
      { i: 5, anchor: '索亚的肩膀轻微地抖了一下', speaker: null, focus: '索亚·伊万诺娃', kind: 'action' },
      { i: 6, anchor: '响木天音收回视线', speaker: null, focus: '响木天音', kind: 'action' },
      { i: 7, anchor: '名单学生会还在做最后的确认', speaker: '响木天音', focus: '响木天音', kind: 'speech' },
      { i: 8, anchor: '嗯，去吧', speaker: '爱丽丝·温特', focus: '爱丽丝·温特', kind: 'speech' },
      { i: 9, anchor: '那个', speaker: '索亚·伊万诺娃', focus: '索亚·伊万诺娃', kind: 'speech' },
      { i: 10, anchor: '索亚没有看她', speaker: null, focus: '索亚·伊万诺娃', kind: 'narration' },
      { i: 11, anchor: '刚才掉出来的', speaker: '索亚·伊万诺娃', focus: '索亚·伊万诺娃', kind: 'speech' },
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
  const segments = splitWithMap('索亚停下。\n天音抬头。', [
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
  const segments = splitWithMap('早上八点，天海高等学园正门。\n三月的风带点凉意。\n新生们三三两两地聚集在通道前。', [
    { i: 1, p: 1, anchor: '天海高等', speaker: null, focus: null, kind: 'narration' },
    { i: 2, p: 2, anchor: '风带点凉意', speaker: null, focus: null, kind: 'narration' },
    { i: 3, p: 3, anchor: '新生们三三', speaker: null, focus: null, kind: 'narration' },
  ]);
  assert.equal(segments.length, 1, 'mapped short narration should merge');
  assert.ok(segments[0].text.includes('天海高等学园正门'), 'merged mapped narration first line');
  assert.ok(segments[0].text.includes('风带点凉意'), 'merged mapped narration second line');
  assert.ok(segments[0].text.includes('新生们三三两两'), 'merged mapped narration third line');
  assert.equal(segments[0].speaker ?? '旁白', '旁白', 'merged mapped narration speaker');
  assert.equal(segments[0].speakerSource, 'map', 'merged mapped narration source');
}

{
  const segments = splitWithMap(
    '通道里的人流一阵接着一阵向前挤去，报名处前的指示牌在阳光下反着刺眼的白光。\n背后传来天音和另一个人说话的声音，很快就被周围更多的嘈杂声盖住了。\n拉杆箱的硬塑料轮子在不平整的石板路上发出连续的响声。',
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
  const segments = splitWithMap('小夜月静夜站在校门内侧。\n周围的声音很杂。\n她低头看了眼终端。', [
    { i: 1, p: 1, anchor: '站在校门', speaker: null, focus: '小夜月静夜', kind: 'action' },
    { i: 2, p: 2, anchor: '声音很杂', speaker: null, focus: null, kind: 'narration' },
    { i: 3, p: 3, anchor: '看了眼终端', speaker: null, focus: '小夜月静夜', kind: 'action' },
  ]);
  assert.equal(segments.length, 1, 'compatible focus narration should merge');
  assert.equal(segments[0].focusSpeaker, '小夜月静夜', 'merged compatible focus');
}

{
  const segments = splitWithMap('人群在通道口慢慢挪动。\n“同学。”\n风声从旗杆边掠过。', [
    { i: 1, p: 1, anchor: '人群在通道口', speaker: null, focus: null, kind: 'narration' },
    { i: 2, p: 2, anchor: '同学', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
    { i: 3, p: 3, anchor: '旗杆边掠过', speaker: null, focus: null, kind: 'narration' },
  ]);
  assert.equal(segments.length, 3, 'narration must not merge across speech');
  assert.equal(segments[1].kind, 'npc', 'speech remains separate npc segment');
  assert.equal(segments[1].speaker, '短发女生', 'speech speaker survives narration merge');
}

{
  const segments = splitWithMap('别动。\n风声掠过。', [
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
    [
      { i: 1, p: 2, anchor: '不存在', speaker: '爱丽丝', focus: '爱丽丝', kind: 'speech' },
    ],
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
  assert.equal(segments.length, 1, 'single map speech mixed paragraph should stay whole');
  assert.ok(speech, 'missing mixed paragraph mapped speech');
  assert.equal(speech.kind, 'user', 'mixed paragraph speech kind');
  assert.equal(speech.text, content, 'mixed paragraph speech should preserve trailing action text');
  assert.equal(speech.speakerSource, 'map', 'mixed paragraph speech source');
}

{
  const segments = splitWithMap(
    '眼镜男生还在坚持，他的手紧紧抓着行李箱的拉杆。\n\n“我……我没有金币。”他说，“我真的什么都不知道。”',
    [
      { i: 1, p: 2, anchor: '没有金币', speaker: '{{user}}', focus: '小夜月静夜', kind: 'speech' },
      { i: 2, p: 2, anchor: '什么都不知道', speaker: '{{user}}', focus: '小夜月静夜', kind: 'speech' },
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
  assert.ok(segment, 'missing secondary user name speech');
  assert.equal(segment.kind, 'user', 'secondary tavern persona name must be user');
  assert.equal(segment.speaker, '新生', 'secondary user name speaker');
}

{
  const segments = splitWithMap(
    '“我知道了。”静夜看着天音，语速依然平稳。\n她顺着新生的人流往中央广场走去。',
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
    { i: 2, p: 1, anchor: '银色的箱子', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'same-speaker inline quote attribution should stay in one display speech');
  assert.equal(
    segments[0].text,
    content,
    'same-speaker map speech should preserve the full display paragraph',
  );
  assert.equal(segments[0].speaker, '短发女生', 'merged inline quote speaker');
  assert.equal(segments[0].speakerSource, 'map', 'merged inline quote source');
  assert.equal(segments[0].text.includes('女生小声说'), true, 'inline quote attribution bridge should be preserved');
}

{
  const content = '“别动。”她伸手抓住箱子，“这是我的。”';
  const segments = splitWithMap(content, [
    { i: 1, p: 1, anchor: '别动', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
    { i: 2, p: 1, anchor: '这是我的', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'same-speaker speech with an action bridge should stay in one segment');
  assert.equal(segments[0].text, content, 'same-speaker action bridge should be preserved in speech display');
  assert.equal(segments[0].speaker, '短发女生', 'same-speaker action bridge speaker');
}

{
  const content =
    '“你自己买的？” 金发女生冷笑了一声，另一只手在千夏的桌子上敲了两下，“这学校里谁不知道那件衣服是限量版。就凭你一个刚入学的新生？你要是不说清楚，今天这事没完。”';
  const segments = splitWithMap(content, [
    { i: 1, p: 1, anchor: '金发女生冷笑', speaker: '金发女生', focus: '金发女生', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'single map speech paragraph should stay whole');
  assert.equal(segments[0].text, content, 'single map speech paragraph should preserve quoted speech and bridge action');
  assert.equal(segments[0].speaker, '金发女生', 'single map speech paragraph speaker');
  assert.equal(segments[0].speakerSource, 'map', 'single map speech paragraph source');
}

{
  const segments = splitWithMap('“你是谁？”男生问，“我？”女生愣住。', [
    { i: 1, p: 1, anchor: '你是谁', speaker: '男生', focus: '男生', kind: 'speech' },
    { i: 2, p: 1, anchor: '我？', speaker: '女生', focus: '女生', kind: 'speech' },
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
  assert.ok(segment, 'missing drifted paragraph mapped bystander speech');
  assert.equal(segment.kind, 'npc', 'drifted paragraph map must remain npc');
  assert.equal(segment.speaker, '路人男生', 'drifted paragraph map speaker');
  assert.equal(segment.speakerSource, 'map', 'drifted paragraph map source');
}

{
  const segments = splitWithMap(
    '“嗯。”\n风声掠过。',
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
  const segments = splitWithMap('“今天的份额还没交上来，你是想被降级吗？” 女生说。', [
    { i: 1, p: 1, anchor: '今天的份额', speaker: '红短裙女生', focus: '红短裙女生', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'trailing generic attribution should not create a second display segment');
  assert.ok(segments[0].text.includes('女生说'), 'trailing generic attribution should stay in the same display segment');
  assert.equal(segments[0].speaker, '红短裙女生', 'trailing generic attribution should keep mapped speaker');
}

{
  const segments = splitWithMap('“别再靠近了。”\n千夏的声音不大。', [
    { i: 1, p: 1, anchor: '别再靠近', speaker: '千夏', focus: '千夏', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'trailing voice note should merge into previous speech');
  assert.ok(segments[0].text.includes('千夏的声音不大'), 'voice note should stay in the same display segment');
  assert.ok(segments[0].speaker.includes('千夏'), 'trailing voice note should keep mapped speaker');
}

{
  const segments = splitWithMap('“我不知道你在说什么。”\n千夏的声音不大，\n“这是我自己买的。”', [
    { i: 1, p: 1, anchor: '我不知道你在说什么', speaker: '千夏', focus: '千夏', kind: 'speech' },
    { i: 2, p: 3, anchor: '这是我自己买的', speaker: '千夏', focus: '千夏', kind: 'speech' },
  ]);
  assert.equal(segments.length, 1, 'voice note continued speech should stay in one display segment');
  assert.ok(segments[0].text.includes('我不知道你在说什么'), 'merged voice continuation should keep first quote');
  assert.ok(segments[0].text.includes('千夏的声音不大'), 'merged voice continuation should keep voice note');
  assert.ok(segments[0].text.includes('这是我自己买的'), 'merged voice continuation should keep second quote');
  assert.ok(segments[0].speaker.includes('千夏'), 'merged voice continuation should keep same speaker');
}

{
  const segments = splitWithMap('*\n“别动。”', [
    { i: 1, p: 2, anchor: '别动', speaker: '短发女生', focus: '短发女生', kind: 'speech' },
  ]);
  assert.equal(segments.some(segment => segment.text.trim() === '*'), false, 'standalone asterisk noise should be hidden');
}

console.log('dialogue-splitter smoke: ok');
