require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' } });
const assert = require('node:assert/strict');
const { stripNarrativeDisplayBlocks } = require('./content-blocks.ts');
const { splitDialogueSource } = require('./dialogue-splitter.ts');
const { buildNarrativeChatRows } = require('./narrative-chat.ts');

const aside = 'Master，这个学园很“特别”哦！\n\n「不要把引号里的话分给别人。」我会继续围观。';
const cleaned = stripNarrativeDisplayBlocks(
  `如月诗乃：「先去教室吧。」\n\n<tucao>${aside}</tucao>\n\n小夜月静夜：「好的，我知道了。」`,
);
assert.ok(cleaned.includes('<tucao>'));
const source = {
  id: 'cameo-check',
  messageId: '0',
  content: cleaned,
  knownCharacters: ['如月诗乃', '小夜月静夜'],
  userAliases: ['小夜月静夜'],
  primaryUserName: '小夜月静夜',
  dialogueMap: [],
};
const result = splitDialogueSource(source);
const cameo = result.segments.filter(segment => segment.presentation === 'cameo');
assert.equal(cameo.length, 1);
assert.equal(cameo[0].speaker, '泉此方');
assert.equal(cameo[0].text, aside);
assert.equal(cameo[0].side, 'center');
assert.ok(result.segments.some(segment => segment.kind === 'user' && segment.speaker === '小夜月静夜'));
const rows = buildNarrativeChatRows(result.segments, {
  resolveSpeakerName: s => s.speaker || '',
  resolveAffiliation: () => null,
  resolveAvatarCandidates: () => [{ url: 'avatar://konata', kind: 'avatar' }],
});
const row = rows.find(row => row.kind === 'dialogue' && row.speaker === '泉此方');
assert.equal(row.side, 'center');
assert.equal(row.text, aside);
assert.equal(rows.filter(row => row.kind === 'dialogue' && row.speaker === '泉此方').length, 1);
assert.ok(rows.some(row => row.kind === 'dialogue' && row.speaker === '小夜月静夜' && row.side === 'right'));

const inline = splitDialogueSource({
  ...source,
  content: stripNarrativeDisplayBlocks('旁白在前。<tucao>第一条。</tucao>旁白在后。\n\n<tucao>第二条。</tucao>'),
});
assert.deepEqual(
  inline.segments.filter(s => s.presentation === 'cameo').map(s => s.text),
  ['第一条。', '第二条。'],
);
assert.ok(inline.segments.every(s => !s.text.includes('<tucao>') && !s.text.includes('AMAMI_TUCAO')));
console.log('Tucao cameo: whole text, centered chat, adjacent player dialogue and inline blocks passed.');

const { extractDialogueMapFromMessage } = require('./dialogue-map.ts');
const raw =
  '如月诗乃：「欢迎来到学园。」<台词1 speaker="如月诗乃" focus="如月诗乃"/>\n\n<tucao>Master，记住“新同学”这个称呼哦！\n\n别走丢了。</tucao>\n\n小夜月静夜：「我明白了。」<台词2 speaker="小夜月静夜" focus="小夜月静夜"/>';
const extracted = extractDialogueMapFromMessage(raw);
const mapped = splitDialogueSource({
  ...source,
  content: stripNarrativeDisplayBlocks(extracted.cleanedMessage),
  dialogueMap: extracted.entries,
});
assert.equal(mapped.segments.find(s => s.text.includes('我明白了'))?.kind, 'user');
assert.equal(mapped.segments.find(s => s.presentation === 'cameo')?.speaker, '泉此方');
console.log('Existing dialogue markers still identify speakers across a multi-paragraph cameo.');
