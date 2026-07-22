import _ from 'lodash';
import { z } from 'zod';
import {
  MVU_SCHEMA_FIXED_CHILDREN,
  MVU_SCHEMA_ROOT_KEYS,
  isMvuCalibrationSchemaPathKnown,
  isUsingCdnMvuCalibrationStandard,
  normalizeMvuSchemaScalarValue,
  resolveMvuSchemaRelationshipField,
} from './mvu-calibration-standard.ts';
import {
  createMvuCalibrationSourceFingerprint,
  ensureMvuCalibrationStandard,
  resetMvuCalibrationStandardResolution,
} from './mvu-calibration-standard-loader.ts';

function assertEqual(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) {
    throw Error(`${name}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

const remoteSchemaSource = `
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const Schema = z.object({
  角色基础: z.object({
    经验值: z.coerce.number().min(10).prefault(10),
    新指标: z.coerce.number().transform(value => clamp(value, 0, 5)).prefault(0),
  }).prefault({}),
  关系系统: z.object({
    在场人物: z.array(z.string()).prefault([]),
  }).catchall(z.object({
    好感度: z.coerce.number().transform(value => clamp(value, 0, 100)).prefault(0),
    信赖度: z.coerce.number().transform(value => clamp(value, 0, 100)).prefault(0),
  }).prefault({})).prefault({}),
  新系统: z.object({
    阶段: z.enum(['初始', '完成']).catch('初始').prefault('初始'),
  }).prefault({}),
});
`;

const remoteBundle = 'console.info("remote schema");\n//# sourceMappingURL=index.js.map';
const remoteSourceMap = JSON.stringify({
  sources: ['src://fixture/src/性斗学园/变量结构/schema.ts'],
  sourcesContent: [remoteSchemaSource],
});

async function main() {
  resetMvuCalibrationStandardResolution();
  const requestedUrls: string[] = [];
  const remoteFetcher = async (input: string) => {
    requestedUrls.push(input);
    return new Response(input.includes('index.js.map') ? remoteSourceMap : remoteBundle, { status: 200 });
  };
  const remoteResolution = await ensureMvuCalibrationStandard({
    fetcher: remoteFetcher,
    sourceUrl: 'https://example.test/变量结构/index.js',
    localFingerprint: createMvuCalibrationSourceFingerprint('older local bundle'),
    cacheToken: 'remote-test',
    runtime: { z, lodash: _ },
  });

  assertEqual(remoteResolution.source, 'cdn', 'mismatched fingerprint selects CDN');
  assertEqual(requestedUrls.length, 2, 'CDN mismatch requests bundle and source map');
  assertEqual(isUsingCdnMvuCalibrationStandard(), true, 'CDN schema becomes active');
  assertEqual(MVU_SCHEMA_ROOT_KEYS.includes('新系统'), true, 'remote root list becomes active');
  assertEqual(MVU_SCHEMA_FIXED_CHILDREN.角色基础.includes('新指标'), true, 'remote child list becomes active');
  assertEqual(resolveMvuSchemaRelationshipField('信赖度'), '信赖度', 'remote relationship field becomes active');
  assertEqual(
    normalizeMvuSchemaScalarValue(['角色基础', '经验值'], 3).value,
    10,
    'remote minimum constraint calibrates scalar',
  );
  assertEqual(
    normalizeMvuSchemaScalarValue(['关系系统', '测试联系人', '信赖度'], 130).value,
    100,
    'remote transform calibrates relationship scalar',
  );
  assertEqual(
    normalizeMvuSchemaScalarValue(['新系统', '阶段'], '未知').value,
    '初始',
    'remote enum fallback calibrates scalar',
  );
  assertEqual(isMvuCalibrationSchemaPathKnown(['新系统', '阶段']), true, 'remote-only path is recognized');

  const matchingBundle = 'matching local bundle\n//# sourceMappingURL=index.js.map';
  let matchingRequestCount = 0;
  const matchingResolution = await ensureMvuCalibrationStandard({
    fetcher: async () => {
      matchingRequestCount += 1;
      return new Response(matchingBundle, { status: 200 });
    },
    sourceUrl: 'https://example.test/变量结构/index.js',
    localFingerprint: createMvuCalibrationSourceFingerprint(matchingBundle),
    cacheToken: 'local-test',
    runtime: { z, lodash: _ },
  });

  assertEqual(matchingResolution.source, 'local', 'matching fingerprint selects local standard');
  assertEqual(matchingRequestCount, 1, 'matching fingerprint does not request source map');
  assertEqual(isUsingCdnMvuCalibrationStandard(), false, 'matching fingerprint resets local standard');
  assertEqual(MVU_SCHEMA_ROOT_KEYS.includes('新系统'), false, 'local root list is restored');
  assertEqual(normalizeMvuSchemaScalarValue(['角色基础', '经验值'], -2).value, 0, 'local scalar rules are restored');
  assertEqual(
    normalizeMvuSchemaScalarValue(['技能系统', '主动技能', '测试技能', '基本信息', '技能等级'], 9).value,
    5,
    'matching local schema keeps deep skill constraints',
  );
  assertEqual(
    normalizeMvuSchemaScalarValue(['技能系统', '主动技能', '测试技能', '基本信息', '稀有度'], ' ex ').value,
    'EX',
    'matching local schema keeps current rarity normalization',
  );

  const fallbackResolution = await ensureMvuCalibrationStandard({
    fetcher: async input =>
      input.includes('index.js.map')
        ? new Response('unavailable', { status: 503 })
        : new Response(remoteBundle, { status: 200 }),
    sourceUrl: 'https://example.test/变量结构/index.js',
    localFingerprint: createMvuCalibrationSourceFingerprint('older local bundle'),
    cacheToken: 'fallback-test',
    runtime: { z, lodash: _ },
  });

  assertEqual(fallbackResolution.source, 'local-fallback', 'source map failure falls back to local');
  assertEqual(isUsingCdnMvuCalibrationStandard(), false, 'fallback keeps local standard active');
  assertEqual(fallbackResolution.message.includes('HTTP 503'), true, 'fallback explains CDN failure');

  resetMvuCalibrationStandardResolution();
  console.log('[mvu-calibration-standard-loader] 20 cases passed');
}

void main();
