import { deriveMobileStageSceneView, resolveMobileStageBackgroundFiles } from './scene-runtime.ts';

function assertEqual(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) {
    throw Error(`${name}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

const scene = deriveMobileStageSceneView([
  {
    stat_data: {
      时间系统: { 日期: '2026-07-11', 星期: '5', 时间: '7:05' },
      位置系统: { 地点名称: '综合商业街' },
    },
  },
]);

assertEqual(scene.timeLabel, '2026年7月11日 星期五 07:05', 'stage time formatting');
assertEqual(scene.locationLabel, '综合商业街', 'stage location reading');
assertEqual(resolveMobileStageBackgroundFiles('综合商业街')[0], '综合商业街.png', 'direct background mapping');
assertEqual(
  resolveMobileStageBackgroundFiles('前往博览图书馆中央大厅')[0],
  '博览图书馆中央大厅.png',
  'fuzzy background mapping',
);
assertEqual(resolveMobileStageBackgroundFiles('未知地点').at(-1), '新学校入口.png', 'unknown location fallback');

const fallbackScene = deriveMobileStageSceneView([
  { stat_data: { 位置系统: { 地点名称: '初始点' } } },
  { stat_data: { 位置系统: { 地点名称: '天海学园食堂' } } },
]);
assertEqual(fallbackScene.locationLabel, '天海学园食堂', 'placeholder location ignored');

console.log('[mobile-scene-runtime] 6 cases passed');
