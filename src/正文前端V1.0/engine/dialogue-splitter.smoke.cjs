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

function split(content) {
  const knownCharacters = deriveKnownCharactersForContent(content, '', '测试玩家', '测试玩家');
  return splitDialogueSource({
    messageId: 1,
    content,
    knownCharacters,
    userAliases: ['{{user}}', '男主', '女主'],
  }).segments;
}

function splitWithMap(content, dialogueMap) {
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
  const segment = findSegment(segments, '爱丽丝发出了一个单音节');
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
  assert.equal(segment.kind, 'narration', 'non-speech map kind must be downgraded');
  assert.equal(segment.speaker ?? '旁白', '旁白', 'non-speech map speaker must be downgraded');
  assert.equal(segment.focusSpeaker, '索亚伊万诺娃', 'non-speech map focus can remain');
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

console.log('dialogue-splitter smoke: ok');
