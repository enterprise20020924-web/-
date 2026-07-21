require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
  },
});

const assert = require('node:assert/strict');
const { splitDialogueSource } = require('./dialogue-splitter.ts');
const { buildNarrativeChatRows, resolveNarrativeChatAppendAction } = require('./narrative-chat.ts');
const { resolveFullbodyPortraitDisplayName, resolveFullbodyPortraitProfile } = require('../portrait-registry.ts');
const {
  NARRATIVE_VIEW_MODE_STORAGE_KEY,
  normalizeNarrativeViewMode,
  readNarrativeViewMode,
  resolveNarrativeViewModeStorageEvent,
  writeNarrativeViewMode,
} = require('../modules/narrative-view-mode.ts');

function segment(id, kind, speaker, text, sourceIndex) {
  return {
    id,
    kind,
    side: kind === 'narration' ? 'center' : kind === 'user' ? 'left' : 'right',
    speaker,
    text,
    mood: 'neutral',
    moodConfidence: 0,
    sourceIndex,
  };
}

const rows = buildNarrativeChatRows(
  [
    segment('npc-1', 'npc', '莉音', '第一句', 0),
    segment('npc-2', 'npc', '莉音', '第二句', 1),
    segment('narration-1', 'narration', null, '走廊安静下来。', 2),
    segment('user-1', 'user', '{{user}}', '我知道了。', 3),
  ],
  {
    resolveSpeakerName: item => (item.kind === 'user' ? '老师' : (item.speaker ?? '角色')),
    resolveAffiliation: item => (item.kind === 'npc' ? '千年科技学院' : null),
    resolveAvatarCandidates: item =>
      item.kind === 'narration'
        ? []
        : [
            { url: `avatar://${item.kind}`, kind: 'avatar' },
            { url: `avatar://${item.kind}`, kind: 'portrait' },
            { url: `portrait://${item.kind}`, kind: 'portrait' },
          ],
  },
);

assert.equal(rows[0].kind, 'dialogue');
assert.equal(rows[0].side, 'left');
assert.equal(rows[0].startsGroup, true);
assert.equal(rows[0].endsGroup, false);
assert.equal(rows[0].avatarCandidates.length, 2);
assert.equal(rows[1].kind, 'dialogue');
assert.equal(rows[1].startsGroup, false);
assert.equal(rows[1].endsGroup, true);
assert.equal(rows[2].kind, 'narration');
assert.equal(rows[2].text, '走廊安静下来。');
assert.equal(rows[3].kind, 'dialogue');
assert.equal(rows[3].side, 'right');
assert.equal(rows[3].speaker, '老师');
assert.equal(rows[3].startsGroup, true);

{
  const narrationRows = buildNarrativeChatRows(
    [segment('narration-dao-noun', 'narration', null, '星野光走过通道。', 0)],
    {
      resolveSpeakerName: () => '',
      resolveAffiliation: () => null,
      resolveAvatarCandidates: () => [],
    },
  );
  assert.equal(narrationRows.length, 1, 'sentence-final 道 noun narration must not be stripped');
  assert.equal(narrationRows[0].kind, 'narration');
  assert.equal(narrationRows[0].text, '星野光走过通道。');
}

for (const text of ['星野光没有得到回应。', '星野光看完了回答。', '星野光读完了解释。', '星野光注意到墙上的提醒。']) {
  const narrationRows = buildNarrativeChatRows([segment(`narration-speech-noun-${text}`, 'narration', null, text, 0)], {
    resolveSpeakerName: () => '',
    resolveAffiliation: () => null,
    resolveAvatarCandidates: () => [],
  });
  assert.equal(narrationRows.length, 1, `speech-like noun narration must not be stripped: ${text}`);
  assert.equal(narrationRows[0].kind, 'narration');
  assert.equal(narrationRows[0].text, text);
}

{
  const mixedRows = buildNarrativeChatRows(
    [
      {
        ...segment('mapped-mixed-speech', 'npc', '莉莉安', '"同学。" 一个温和的声音从讲台方向传过来。', 0),
        mapKind: 'speech',
      },
    ],
    {
      resolveSpeakerName: item => item.speaker ?? '角色',
      resolveAffiliation: () => '教师',
      resolveAvatarCandidates: () => [],
    },
  );
  assert.equal(mixedRows.length, 2);
  assert.equal(mixedRows[0].kind, 'dialogue');
  assert.equal(mixedRows[0].text, '同学。');
  assert.equal(mixedRows[1].kind, 'narration');
  assert.equal(mixedRows[1].text, '一个温和的声音从讲台方向传过来。');
}

{
  const attributedRows = buildNarrativeChatRows(
    [
      {
        ...segment('attributed-speech', 'npc', '静夜', '静夜说：“今天先到这里。”', 0),
        mapKind: 'speech',
      },
      {
        ...segment('attribution-only', 'npc', '静夜', '静夜说，', 1),
        mapKind: 'speech',
      },
    ],
    {
      resolveSpeakerName: item => item.speaker ?? '角色',
      resolveAffiliation: () => null,
      resolveAvatarCandidates: () => [],
    },
  );
  assert.equal(attributedRows.length, 1);
  assert.equal(attributedRows[0].kind, 'dialogue');
  assert.equal(attributedRows[0].text, '今天先到这里。');
}

{
  const bareDaoRows = buildNarrativeChatRows(
    [
      {
        ...segment('bare-dao-attributed-speech', 'npc', '星野光', '星野光道：“先别动。”', 0),
        mapKind: 'speech',
      },
    ],
    {
      resolveSpeakerName: item => item.speaker ?? '角色',
      resolveAffiliation: () => null,
      resolveAvatarCandidates: () => [],
    },
  );
  assert.equal(bareDaoRows.length, 1, 'bare 道 attribution should not create an extra narration row');
  assert.equal(bareDaoRows[0].kind, 'dialogue');
  assert.equal(bareDaoRows[0].text, '先别动。');
}

{
  const quotedTermRows = buildNarrativeChatRows(
    [
      {
        ...segment('quoted-term-speech', 'npc', '星野光', '我说的“计划”很重要。', 0),
        mapKind: 'speech',
      },
    ],
    {
      resolveSpeakerName: item => item.speaker ?? '角色',
      resolveAffiliation: () => null,
      resolveAvatarCandidates: () => [],
    },
  );
  assert.equal(quotedTermRows.length, 1, 'embedded quoted term should stay in one dialogue bubble');
  assert.equal(quotedTermRows[0].kind, 'dialogue');
  assert.equal(quotedTermRows[0].text, '我说的“计划”很重要。');
}

{
  const content = '莉莉安老师看着她，点了点头。“那请你尽快去综合服务大厅完成报到手续。上课期间不要在其他班级逗留。”';
  const segments = splitDialogueSource({
    messageId: 1,
    content,
    knownCharacters: ['莉莉安', '小夜月静夜'],
    userAliases: ['{{user}}'],
    dialogueMap: [
      {
        i: 1,
        p: null,
        line_start: null,
        line_end: null,
        anchor: '莉莉安老师看着她，点了点头',
        speaker: '莉莉安',
        focus: '莉莉安',
        kind: 'speech',
      },
      {
        i: 2,
        p: null,
        line_start: null,
        line_end: null,
        anchor: '那请你尽快去综合服务大厅完成报到手续',
        speaker: '莉莉安',
        focus: '莉莉安',
        kind: 'speech',
      },
    ],
  }).segments;
  const prefaceRows = buildNarrativeChatRows(segments, {
    resolveSpeakerName: item => item.speaker ?? '莉莉安',
    resolveAffiliation: () => '教师',
    resolveAvatarCandidates: () => [],
  });
  assert.equal(prefaceRows.length, 2);
  assert.equal(prefaceRows[0].kind, 'narration');
  assert.equal(prefaceRows[0].text, '莉莉安老师看着她，点了点头。');
  assert.equal(prefaceRows[1].kind, 'dialogue');
  assert.equal(prefaceRows[1].text, '那请你尽快去综合服务大厅完成报到手续。上课期间不要在其他班级逗留。');
}
assert.deepEqual(
  buildNarrativeChatRows([], {
    resolveSpeakerName: () => '',
    resolveAffiliation: () => null,
    resolveAvatarCandidates: () => [],
  }),
  [],
);

assert.equal(
  resolveNarrativeChatAppendAction({
    isStreaming: true,
    isNearLatest: true,
    previousRowCount: 4,
    rowCount: 5,
  }),
  'follow',
);
assert.equal(
  resolveNarrativeChatAppendAction({
    isStreaming: true,
    isNearLatest: false,
    previousRowCount: 4,
    rowCount: 5,
  }),
  'notify',
);
assert.equal(
  resolveNarrativeChatAppendAction({
    isStreaming: false,
    isNearLatest: true,
    previousRowCount: 4,
    rowCount: 5,
  }),
  'none',
);

assert.equal(normalizeNarrativeViewMode(undefined), 'gal');
assert.equal(normalizeNarrativeViewMode('invalid'), 'gal');
assert.equal(normalizeNarrativeViewMode('chat'), 'chat');
assert.equal(readNarrativeViewMode({ getItem: () => 'chat', setItem: () => undefined }), 'chat');
assert.equal(
  readNarrativeViewMode({
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => undefined,
  }),
  'gal',
);

const written = new Map();
assert.equal(
  writeNarrativeViewMode(
    {
      getItem: key => written.get(key) ?? null,
      setItem: (key, value) => written.set(key, value),
    },
    'chat',
  ),
  true,
);
assert.equal(written.get(NARRATIVE_VIEW_MODE_STORAGE_KEY), 'chat');
assert.equal(
  writeNarrativeViewMode(
    {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      },
    },
    'chat',
  ),
  false,
);
assert.equal(resolveNarrativeViewModeStorageEvent('gal', NARRATIVE_VIEW_MODE_STORAGE_KEY, 'chat'), 'chat');
assert.equal(resolveNarrativeViewModeStorageEvent('chat', NARRATIVE_VIEW_MODE_STORAGE_KEY, null), 'gal');
assert.equal(resolveNarrativeViewModeStorageEvent('chat', 'unrelated-key', 'gal'), 'chat');

assert.equal(resolveFullbodyPortraitDisplayName('静夜'), '小夜月静夜');
assert.equal(resolveFullbodyPortraitDisplayName('小夜月·静夜'), '小夜月静夜');
assert.equal(resolveFullbodyPortraitDisplayName('亚衣'), '上杉亚衣');
assert.equal(resolveFullbodyPortraitProfile('响木天音')?.fileName, '响木天音_苍蓝星形态.png');

console.log('bubble-chat smoke: ok');
