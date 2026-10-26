require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' },
});

const assert = require('node:assert/strict');
const {
  NARRATIVE_CHAT_THEME_STORAGE_KEY,
  normalizeNarrativeChatTheme,
  readNarrativeChatTheme,
  writeNarrativeChatTheme,
} = require('./narrative-chat-theme.ts');

for (const value of [null, undefined, '', 'day', 'dark', 'MIDNIGHT', true, 1, {}]) {
  assert.equal(normalizeNarrativeChatTheme(value), false);
}
assert.equal(normalizeNarrativeChatTheme('midnight'), true);
assert.equal(readNarrativeChatTheme(null), false);
assert.equal(writeNarrativeChatTheme(null, true), false);

const values = new Map();
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};
assert.equal(readNarrativeChatTheme(storage), false);
assert.equal(writeNarrativeChatTheme(storage, true), true);
assert.equal(values.get(NARRATIVE_CHAT_THEME_STORAGE_KEY), 'midnight');
assert.equal(readNarrativeChatTheme(storage), true);
assert.equal(writeNarrativeChatTheme(storage, false), true);
assert.equal(values.get(NARRATIVE_CHAT_THEME_STORAGE_KEY), 'day');
assert.equal(readNarrativeChatTheme(storage), false);

const blockedStorage = {
  getItem() {
    throw Error('Storage access blocked');
  },
  setItem() {
    throw Error('Storage quota exceeded');
  },
};
assert.equal(readNarrativeChatTheme(blockedStorage), false);
assert.equal(writeNarrativeChatTheme(blockedStorage, true), false);

console.log('Chat midnight preference: defaults, persistence, invalid values and blocked storage passed.');
