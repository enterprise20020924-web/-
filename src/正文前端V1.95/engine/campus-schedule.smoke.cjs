require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' } });
const assert = require('node:assert/strict');
const { ref, computed } = require('vue');
const { campusDailySchedules, getCampusSchedulePeriod } = require('../map/campus-character-schedule.ts');
const {
  campusCharacterHabits,
  getCampusCharacterEncounters,
  getCampusRegionPlaceGroups,
  getCampusUnmappedPlaceGroups,
} = require('../map/campus-character-encounters.ts');
const { campusLocations, campusRegions } = require('../map/campus-map-data.ts');
const { getCampusFollowedPeople, resolveCampusFollowedPerson } = require('../map/campus-following.ts');

for (const [time, expected] of [
  ['00:00', 'home'],
  ['07:59', 'home'],
  ['08:00', 'daytime'],
  ['15:59', 'daytime'],
  ['16:00', 'afterSchool'],
  ['23:59', 'afterSchool'],
  ['24:00', 'home'],
  ['2026年10月3日 星期六 16:00', 'afterSchool'],
  ['2026年10月3日 星期六 07：59', 'home'],
  ['时间未同步', 'daytime'],
  ['2026-10-03', 'daytime'],
  ['25:00', 'daytime'],
  ['16:60', 'daytime'],
  ['24:01', 'daytime'],
  ['99:00', 'daytime'],
])
  assert.equal(getCampusSchedulePeriod(time), expected, time);

const names = campusCharacterHabits.map(person => person.name);
assert.deepEqual(Object.keys(campusDailySchedules).sort(), [...names].sort(), 'every named person has a route');
const homes = new Set([27, 30, 31, 32, 33, 34, 49, 50]);
const fixedLocations = new Map([
  ['伊甸阿斯莫德', 17],
  ['艾琳海德', 16],
  ['响木天音', 16],
  ['克莉丝汀', 16],
  ['神崎凛', 16],
  ['爱丽丝温特', 16],
  ['黑崎晴雯', 16],
]);
for (const [name, schedule] of Object.entries(campusDailySchedules)) {
  assert.equal(
    !!schedule.fixed,
    fixedLocations.has(name),
    `${name}: only confirmed fixed residents skip the daily route`,
  );
  if (fixedLocations.has(name)) {
    for (const period of ['home', 'daytime', 'afterSchool']) {
      assert.equal(
        resolveCampusFollowedPerson(name, period).locationId,
        fixedLocations.get(name),
        `${name}: fixed all day`,
      );
      assert.equal(resolveCampusFollowedPerson(name, period).visit.kind, 'resident');
    }
  } else assert.ok(homes.has(schedule.home), `${name}: rest at a residence, not a classroom or public square`);
  for (const stop of [schedule.afterSchool, schedule.home]) {
    if (typeof stop === 'number')
      assert.ok(
        campusLocations.some(place => place.id === stop),
        `${name}: valid stop`,
      );
    else assert.ok(campusRegions.some(region => region.id === stop.region) && stop.place, `${name}: named interior`);
  }
}

const before = JSON.stringify(campusCharacterHabits);
for (const period of ['home', 'daytime', 'afterSchool']) {
  const allCards = campusRegions.flatMap(region =>
    getCampusCharacterEncounters(region.id, undefined, undefined, period),
  );
  assert.equal(allCards.length, names.length, `${period}: each person occurs in exactly one region`);
  assert.equal(new Set(allCards.map(entry => entry.person.name)).size, names.length);
  const allPlaces = campusRegions
    .flatMap(region => [
      ...getCampusRegionPlaceGroups(region.id, period),
      ...getCampusUnmappedPlaceGroups(region.id, period),
    ])
    .flatMap(group => group.people);
  assert.equal(allPlaces.length, names.length, `${period}: no duplicated or missing sub-location cards`);
  for (const name of names) {
    const target = resolveCampusFollowedPerson(name, period);
    assert.ok(target, name);
    assert.ok(
      getCampusCharacterEncounters(target.region.id, target.locationId, target.unmappedPlace, period).some(
        entry => entry.person.name === name,
      ),
      `${name}: follow bubble opens their current card`,
    );
  }
}
assert.equal(JSON.stringify(campusCharacterHabits), before, 'routing leaves source habits untouched');
for (const [name, daytime, afternoon, home] of [
  ['星野光', 2, 36, 33],
  ['蓝原结衣', 2, 7, 32],
  ['猫宫宁宁', 1, 40, 33],
  ['早坂蕾娜', 2, 33, 33],
  ['白石响子', 5, 34, 34],
  ['风音', 50, 7, 50],
  ['夏洛特', undefined, 37, 30],
  ['玛德琳', undefined, 35, 30],
]) {
  for (const [period, id] of [
    ['daytime', daytime],
    ['afterSchool', afternoon],
    ['home', home],
  ]) {
    assert.equal(resolveCampusFollowedPerson(name, period).locationId, id, `${name} ${period}`);
  }
}
assert.equal(resolveCampusFollowedPerson('句星兰熙', 'afterSchool').unmappedPlace, '园艺社温室');
assert.equal(resolveCampusFollowedPerson('青鸢', 'afterSchool').unmappedPlace, '研究会酒吧');
assert.equal(
  resolveCampusFollowedPerson('菲奥娜', 'afterSchool').visit.kind,
  'conditional',
  'clock never unlocks visitors',
);

// Model the actual reactive clock prop: crossing a boundary must invalidate cards and follows together.
const clock = ref('15:59');
const period = computed(() => getCampusSchedulePeriod(clock.value));
const follows = computed(() => getCampusFollowedPeople(['星野光', '蓝原结衣'], period.value));
const classRoster = computed(() => getCampusCharacterEncounters('teaching', 2, undefined, period.value));
assert.ok(classRoster.value.some(entry => entry.person.name === '星野光'));
clock.value = '16:00';
assert.deepEqual(
  follows.value.map(entry => entry.locationId),
  [36, 7],
);
assert.ok(!classRoster.value.some(entry => entry.person.name === '星野光'));
clock.value = '00:00';
assert.deepEqual(
  follows.value.map(entry => entry.locationId),
  [33, 32],
);
clock.value = '08:00';
assert.deepEqual(
  follows.value.map(entry => entry.locationId),
  [2, 2],
);
console.log(
  `Campus schedule passed: ${names.length} routes, clock boundaries, single presence, residences and reactive follow targets.`,
);
