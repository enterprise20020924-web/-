require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' },
});
const assert = require('node:assert/strict');
const { campusLocations, campusRegions } = require('../map/campus-map-data.ts');
const {
  campusCharacterHabits,
  getCampusCharacterEncounters,
  getCampusCharacterAvatarUrls,
  getCampusRegionPlaceGroups,
  getCampusUnmappedPlaceGroups,
} = require('../map/campus-character-encounters.ts');

assert.equal(
  new Set(campusCharacterHabits.map(person => person.name)).size,
  campusCharacterHabits.length,
  'unique canonical names',
);
for (const person of campusCharacterHabits) {
  assert.ok(person.visits.length, person.name);
  for (const visit of person.visits) {
    assert.ok(
      campusRegions.some(region => region.id === visit.region),
      `${person.name}: region exists`,
    );
    assert.ok(visit.kind !== 'conditional' || visit.note, `${person.name}: condition is explained`);
    for (const id of visit.ids)
      assert.equal(
        campusLocations.find(place => place.id === id)?.region.id,
        visit.region,
        `${person.name}: location ${id} belongs to region`,
      );
  }
}
for (const region of campusRegions) {
  const people = getCampusCharacterEncounters(region.id);
  // Quiet regions can now be empty: each person has one scheduled stop, not every possible visit.
  assert.equal(people.length, new Set(people.map(entry => entry.person.name)).size, 'one card per person per region');
  const groups = getCampusRegionPlaceGroups(region.id);
  assert.deepEqual(
    groups.map(group => group.location.id),
    campusLocations.filter(place => place.region.id === region.id).map(place => place.id),
    'every secondary location has an entry, including quiet locations',
  );
  for (const group of groups) {
    for (const entry of group.people)
      assert.ok(
        entry.visits.every(visit => visit.ids.length === 1 && visit.ids[0] === group.location.id),
        'secondary page only contains its own activity records',
      );
  }
  const assigned = new Set([
    ...groups.flatMap(group => group.people.map(entry => entry.person.name)),
    ...getCampusUnmappedPlaceGroups(region.id).flatMap(group => group.people.map(entry => entry.person.name)),
  ]);
  assert.deepEqual(
    [...assigned].sort(),
    people.map(entry => entry.person.name).sort(),
    'grouping never drops unassigned people',
  );
}
const namesAt = (region, id) => getCampusCharacterEncounters(region, id).map(entry => entry.person.name);
assert.deepEqual(getCampusCharacterEncounters('unknown'), []);
assert.deepEqual(getCampusCharacterEncounters('central', 50), [], 'never leak another region into a location');
assert.ok(namesAt('mountain', 50).includes('风音') && namesAt('mountain', 50).includes('铃音'));
assert.ok(!namesAt('teaching', 3).includes('天宫院抚子'), 'S class is not the private tutoring room');
assert.equal(
  getCampusCharacterEncounters('teaching', 4).find(entry => entry.person.name === '爱丽丝温特')?.kind,
  undefined,
  'tutoring resident is not also present in a secondary office',
);
assert.deepEqual(
  getCampusCharacterEncounters('teaching', 42)
    .filter(entry => entry.kind === 'resident')
    .map(entry => entry.person.name),
  ['如月诗乃', '森莉花'],
  'service hall is staffed only by its own employees',
);
assert.deepEqual(
  getCampusCharacterEncounters('teaching', 44)
    .filter(entry => entry.kind === 'resident')
    .map(entry => entry.person.name),
  ['弗洛拉梅斯梅尔'],
  'psychologist is in the health center',
);
assert.equal(
  getCampusCharacterEncounters('teaching', undefined, 'S班教学区域').length,
  4,
  'general S class stays in its own subgroup',
);
assert.ok(
  getCampusCharacterEncounters('teaching', undefined, 'S班教学区域').every(entry =>
    entry.visits.every(visit => visit.ids.length === 0 && visit.place === 'S班教学区域'),
  ),
);
assert.ok(!namesAt('clubs', 24).includes('维斯伊尔'), 'independent art club is not Butterfly');
for (const name of ['阿米莉亚安斯华斯', '樱井结衣']) {
  assert.equal(
    getCampusCharacterEncounters('teaching', 42).find(entry => entry.person.name === name)?.kind,
    undefined,
    'listed students are at class instead of appearing at a second location',
  );
}
assert.equal(
  getCampusCharacterEncounters('central', 36).find(entry => entry.person.name === '爱丽丝温特')?.kind,
  undefined,
  'possible orientation visit is not simultaneous with the tutoring room',
);
assert.equal(
  getCampusCharacterEncounters('dormitory', 33).find(entry => entry.person.name === '白川千夏')?.kind,
  undefined,
  'secondary dorm encounter is not simultaneous with the association headquarters',
);
assert.equal(
  getCampusCharacterEncounters('sports', undefined, undefined, 'afterSchool').find(
    entry => entry.person.name === '菲奥娜',
  )?.kind,
  'conditional',
  'foreign visitors are not default residents',
);
for (const [name, file] of [
  ['墨染', '墨柒.png'],
  ['铃音', '铃音.png'],
  ['艾米丽威廉姆斯', '艾米莉威廉姆斯.png'],
]) {
  const person = campusCharacterHabits.find(person => person.name === name);
  assert.ok(decodeURI(getCampusCharacterAvatarUrls(person)[0]).endsWith('/' + file), name);
}
assert.deepEqual(
  getCampusCharacterAvatarUrls(campusCharacterHabits.find(person => person.name === '伊甸阿斯莫德')),
  [],
  'never use Eden Funing as the headmaster avatar',
);
console.log(
  `Campus encounters passed: ${campusCharacterHabits.length} characters / ${campusRegions.length} regions, location membership, conditional visitors and exact avatar identities.`,
);
