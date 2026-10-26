require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' },
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { computed, effectScope, ref } = require('vue');
const {
  stageBackgrounds,
  defaultStageBackgroundUrl,
  resolveStageBackground,
  resolveStageBackgroundFiles,
  resolveStageBackgroundUrls,
  loadStageBackgroundUrls,
} = require('./stage-backgrounds.ts');
const { deriveMobileStageSceneView } = require('../mobile/scene-runtime.ts');
const { useStageBackground } = require('../modules/use-stage-background.ts');
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../学园/背景/天海学园补全_最新版/最新版文件清单.json'), 'utf8'),
);

function sceneAt(name) {
  return deriveMobileStageSceneView([{ stat_data: { 位置系统: { 地点名称: name } } }]);
}

async function main() {
  assert.equal(stageBackgrounds.length, 50);
  assert.equal(stageBackgrounds.filter(scene => scene.source === 'supplement').length, 35);
  assert.equal(stageBackgrounds.filter(scene => scene.source === 'embedded').length, 0);
  for (const item of manifest.files) {
    const match = resolveStageBackground(item.name);
    assert.equal(match?.id, Number(item.id), item.name);
    if (Number(item.id) === 36) {
      assert.equal(match.file, '新学校入口.png', 'user-selected older plaza backdrop');
      continue;
    }
    assert.equal(match.file, item.file, item.name);
    const urls = sceneAt(item.name).backgroundUrls;
    assert.ok(decodeURI(urls[0]).endsWith(`/天海附加背景/${item.file}`), item.name);
    assert.ok(urls[1].startsWith('https://raw.githubusercontent.com/'), item.name);
  }

  for (const [label, expected] of [
    ['A／B班进阶教室', 2],
    ['AB班进阶教室', 2],
    [' S_A 班教师办公室 ', 4],
    ['体育联盟-综合训练场', 8],
    ['权力之塔瞭望塔', 15],
    ['权力之塔瞭望塔监控室', 15],
    ['学生会最高监控中心', 18],
    ['天文台主监控室', 18],
    ['男性自保联盟秘密集会点', 19],
    ['女王宫殿-女权协会总部', 26],
    ['女王宫殿-女权协会生活区', 27],
    ['国际交流会馆 A 栋', 30],
    ['学生宿舍B栋单人间', 33],
    ['天海学园食堂', 35],
    ['前往博览图书馆中央大厅', 7],
    ['学院后山 / 风铃神社', 50],
    ['综合服务大厅 / 心理健康中心', 44],
    ['后山入口', 46],
    ['后山温泉', 13],
    ['私人海滩 / 沙滩排球场', 14],
  ])
    assert.equal(resolveStageBackground(label)?.id, expected, label);

  for (const label of ['教室', '宿舍', '监控室', '权力之塔', '学生会', '未知地点', '']) {
    assert.equal(resolveStageBackground(label), null, label);
    assert.deepEqual(resolveStageBackgroundUrls(label), [defaultStageBackgroundUrl], label);
  }
  assert.equal(resolveStageBackgroundFiles('学院正门')[0], '新学校入口.png');
  for (const label of ['餐厅', '学生互助联盟秘密集会点']) {
    const urls = await loadStageBackgroundUrls(label);
    assert.ok(urls[0].startsWith('https://raw.githubusercontent.com/'), label);
    assert.equal(urls.at(-1), defaultStageBackgroundUrl);
  }

  const scope = effectScope();
  const scene = ref(sceneAt('中心广场'));
  const background = scope.run(() => useStageBackground(computed(() => scene.value)));
  background.handleSceneBackgroundError();
  assert.equal(background.stageSceneBackgroundUrl.value, scene.value.backgroundUrls[1], 'same-image origin fallback');
  scene.value = { ...scene.value, timeLabel: '10:00' };
  assert.equal(background.stageSceneBackgroundUrl.value, scene.value.backgroundUrls[1], 'clock update keeps fallback');
  scene.value = sceneAt('学生会最高监控中心');
  assert.equal(background.stageSceneBackgroundUrl.value, scene.value.backgroundUrls[0], 'new location resets fallback');
  scene.value = sceneAt('餐厅');
  scene.value = sceneAt('风铃神社');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(
    background.stageSceneBackgroundUrl.value,
    scene.value.backgroundUrls[0],
    'location changes use the latest remote background',
  );
  scope.stop();
  console.log(
    '[stage-backgrounds] 50 destinations, 35 new images, the plaza override, aliases and loading transitions passed',
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
