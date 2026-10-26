require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' } });
const assert = require('node:assert/strict');
const { campusLocations } = require('../map/campus-map-data.ts');
const { campusCharacterHabits } = require('../map/campus-character-encounters.ts');
const {
  getCampusTravelDestination,
  getCampusInteriorDestination,
  getCampusTravelCandidates,
  createCampusTravelDraft,
} = require('../map/campus-travel.ts');
// Input delivery does not use the browser-only portrait/stat payloads or their top-level await.
for (const [modulePath, exports] of [
  ['../character-stats.compact.ts', { characterBattleStats: {} }],
  ['../portrait-registry.ts', { fullbodyPortraitProfiles: {} }],
]) {
  const filename = require.resolve(modulePath);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}
const { writeTextToTavernInput, focusTavernInput } = require('../mobile/relationship-runtime.ts');

const before = JSON.stringify(campusCharacterHabits);
const council = getCampusTravelDestination(16);
assert.equal(getCampusTravelDestination(-1), null);
assert.equal(getCampusInteriorDestination('missing', '温室'), null);
assert.equal(getCampusInteriorDestination('research', ''), null);
const specific = createCampusTravelDraft(council, 'afterSchool', '爱丽丝温特', () => {
  throw Error('Specific choice must not roll');
});
assert.equal(specific.mode, 'specific');
assert.equal(specific.personName, '爱丽丝温特');
assert.equal(specific.text, '我前往「权力之塔学生会总部」，专程去见爱丽丝温特。');
let rolls = 0;
getCampusTravelCandidates(council, 'afterSchool');
assert.equal(rolls, 0, 'reading the roster does not roll an encounter');
const random = createCampusTravelDraft(council, 'home', null, () => {
  rolls++;
  return 0.99999;
});
assert.equal(rolls, 1);
assert.equal(random.personName, '黑崎晴雯');
assert.equal(random.mode, 'random');
assert.match(random.text, /随意逛逛，看看会不会偶遇黑崎晴雯/);
assert.throws(() => createCampusTravelDraft(council, 'daytime', '星野光'), /重新选择/);
assert.throws(() => createCampusTravelDraft(getCampusTravelDestination(2), 'afterSchool', '星野光'), /重新选择/);
const garden = getCampusInteriorDestination('research', '园艺社温室');
assert.equal(createCampusTravelDraft(garden, 'afterSchool', '句星兰熙').personName, '句星兰熙');
const empty = createCampusTravelDraft(getCampusTravelDestination(38), 'daytime', null, () => {
  throw Error('Empty place must not roll');
});
assert.equal(empty.personName, null);
assert.equal(empty.text, '我前往「学院正门」，随意逛逛，看看那里有什么。');
for (const period of ['home', 'daytime', 'afterSchool']) {
  for (const location of campusLocations) {
    const target = getCampusTravelDestination(location.id);
    const names = getCampusTravelCandidates(target, period).map(entry => entry.person.name);
    for (const roll of [0, 0.5, 0.999999, 1]) {
      const draft = createCampusTravelDraft(target, period, null, () => roll);
      assert.ok(
        names.length ? names.includes(draft.personName) : draft.personName === null,
        'random selection stays inside this location and time',
      );
    }
  }
}
assert.equal(JSON.stringify(campusCharacterHabits), before);

// Preparing a trip uses only the draft input. It never sends, generates, or writes story variables.
let sent = 0;
const originalDocument = globalThis.document;
const originalSlash = globalThis.executeSlashCommand;
const originalMvu = globalThis.Mvu;
const originalQuery = globalThis.$;
let focused = false;
const events = [];
const input = {
  tagName: 'TEXTAREA',
  value: '',
  focus() {
    focused = true;
  },
  setSelectionRange() {},
  dispatchEvent(event) {
    events.push(event.type);
  },
};
try {
  delete globalThis.$;
  globalThis.document = { querySelector: selector => (selector === '#send_textarea' ? input : null) };
  globalThis.executeSlashCommand = () => {
    sent++;
  };
  globalThis.Mvu = {
    replaceMvuData() {
      throw Error('Travel must not teleport via MVU');
    },
  };
  assert.equal(writeTextToTavernInput(specific.text), true);
  assert.equal(input.value, specific.text);
  assert.deepEqual(events, ['input', 'change']);
  focused = false;
  assert.equal(focusTavernInput(), true);
  assert.equal(focused, true);
  assert.equal(sent, 0);
  globalThis.document = { querySelector: () => null };
  assert.equal(writeTextToTavernInput(specific.text), false, 'missing input is reported instead of claiming success');
} finally {
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if (originalSlash === undefined) delete globalThis.executeSlashCommand;
  else globalThis.executeSlashCommand = originalSlash;
  if (originalMvu === undefined) delete globalThis.Mvu;
  else globalThis.Mvu = originalMvu;
  if (originalQuery === undefined) delete globalThis.$;
  else globalThis.$ = originalQuery;
}
console.log(
  'Campus travel passed: scheduled choices, fixed council residents, random/empty interiors, stale choice rejection and draft-only delivery.',
);
