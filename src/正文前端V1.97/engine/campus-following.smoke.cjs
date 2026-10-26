require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' } });
const assert = require('node:assert/strict');
const { normalizeFollowedPeople, CAMPUS_FOLLOWED_PEOPLE_KEY } = require('../map/use-followed-people.ts');
const { CAMPUS_QUICK_PLACES_KEY } = require('../map/use-quick-places.ts');
const { campusCharacterHabits, getCampusCharacterEncounters } = require('../map/campus-character-encounters.ts');
const { campusLocations } = require('../map/campus-map-data.ts');
const {
  resolveCampusFollowedPerson,
  getCampusFollowedPeople,
  groupCampusFollowedPeople,
  getCampusFollowMarkerPlacement,
} = require('../map/campus-following.ts');

assert.notEqual(CAMPUS_FOLLOWED_PEOPLE_KEY, CAMPUS_QUICK_PLACES_KEY, 'following never overwrites favorite places');
assert.deepEqual(normalizeFollowedPeople(['如月诗乃', '不存在的人', 42, '如月诗乃', '风音']), ['如月诗乃', '风音']);
assert.deepEqual(normalizeFollowedPeople({ name: '风音' }), []);
assert.equal(resolveCampusFollowedPerson('不存在的人'), null);
const shrineRegion = resolveCampusFollowedPerson('风音').region;
const compactView = { boardTop: 0, boardLeft: 0, boardWidth: 326.94, boardHeight: 184, width: 460, height: 184 };
assert.equal(
  getCampusFollowMarkerPlacement(shrineRegion, compactView, 1).below,
  true,
  'compact map keeps the shrine avatar below the toolbar',
);
assert.equal(
  getCampusFollowMarkerPlacement(
    shrineRegion,
    { ...compactView, boardWidth: 1672, boardHeight: 941, width: 1672, height: 941 },
    1,
  ).below,
  false,
  'full-size map keeps its normal upward bubble',
);
const teachingRegion = resolveCampusFollowedPerson('索菲亚').region;
for (const height of [184, 240, 600]) {
  for (const width of [320, 460, 1200]) {
    const view = { ...compactView, width, height, boardWidth: width, boardHeight: height };
    const pin = getCampusFollowMarkerPlacement(teachingRegion, view, 5);
    const x = (teachingRegion.anchor[0] / 1672) * width;
    const y = (teachingRegion.anchor[1] / 941) * height;
    const bubbleWidth = width <= 700 ? 166 : 190;
    const bubbleHeight = width <= 700 ? 114 : 130;
    assert.ok(x - bubbleWidth / 2 + pin.shiftX >= 8, 'all five portraits clear the left edge');
    assert.ok(x + bubbleWidth / 2 + pin.shiftX <= width - 8, 'all five portraits clear the right edge');
    assert.ok(y + pin.offsetY >= 8, 'the top row stays visible');
    assert.ok(y + pin.offsetY + bubbleHeight <= height - 8, 'the bottom row stays visible');
  }
}
for (const [name, id] of [
  ['如月诗乃', 42],
  ['弗洛拉梅斯梅尔', 44],
  ['爱丽丝温特', 16],
  ['沐芯兰', 45],
  ['风音', 50],
]) {
  assert.equal(
    resolveCampusFollowedPerson(name)?.locationId,
    id,
    `${name}: main activity wins over secondary encounters`,
  );
}
const visitsBefore = JSON.stringify(campusCharacterHabits);
for (const person of campusCharacterHabits) {
  const target = resolveCampusFollowedPerson(person.name);
  assert.ok(target, person.name);
  if (target.locationId !== undefined)
    assert.equal(campusLocations.find(location => location.id === target.locationId)?.region.id, target.region.id);
  assert.ok(
    getCampusCharacterEncounters(target.region.id, target.locationId, target.unmappedPlace).some(
      entry => entry.person.name === person.name,
    ),
    `${person.name}: marker always leads to a matching character card`,
  );
}
assert.equal(
  JSON.stringify(campusCharacterHabits),
  visitsBefore,
  'finding main locations must not reorder the world-book visits',
);
const followed = getCampusFollowedPeople(['如月诗乃', '爱丽丝温特', '风音', '如月诗乃', '不存在的人']);
assert.equal(followed.length, 3);
const groups = groupCampusFollowedPeople(followed);
assert.equal(groups.length, 3);
assert.deepEqual(
  groups.find(group => group.region.id === 'teaching').people.map(entry => entry.person.name),
  ['如月诗乃'],
);
assert.deepEqual(
  groups.find(group => group.region.id === 'central').people.map(entry => entry.person.name),
  ['爱丽丝温特'],
);
assert.equal(resolveCampusFollowedPerson('天宫院抚子').unmappedPlace, 'S班教学区域');
assert.equal(resolveCampusFollowedPerson('伊甸阿斯莫德').person.avatarFile, null);
const classmates = ['索菲亚', '阿米莉亚安斯华斯', '樱井结衣', '伊尼亚德瓦卢瓦', '莉莉安', '佐藤健'];
const savedClassmates = normalizeFollowedPeople(JSON.parse(JSON.stringify(classmates)));
assert.deepEqual(savedClassmates, classmates, 'saving follows keeps five or more people at the same location');
const classroomGroup = groupCampusFollowedPeople(getCampusFollowedPeople(savedClassmates));
assert.equal(classroomGroup.length, 1);
assert.deepEqual(
  classroomGroup[0].people.map(entry => entry.person.name),
  classmates,
);
assert.ok(classroomGroup[0].people.every(entry => entry.locationId === 1));
console.log(
  'Campus following passed: isolated preferences, canonical names, main locations, grouped markers and reachable character details.',
);
