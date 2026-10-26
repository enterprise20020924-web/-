import {
  MVU_CALIBRATION_SCHEMA_LOCAL_FINGERPRINT,
  MVU_CALIBRATION_SCHEMA_SOURCE_URL,
  activateCdnMvuCalibrationStandard,
  activateLocalMvuCalibrationSchema,
  activateLocalMvuCalibrationStandard,
} from './mvu-calibration-standard';
import { createLocalMvuCalibrationSchema } from './mvu-calibration-local-schema';

export type MvuCalibrationStandardSource = 'local' | 'cdn' | 'local-fallback';

export interface MvuCalibrationStandardResolution {
  source: MvuCalibrationStandardSource;
  checked: boolean;
  localFingerprint: string;
  remoteFingerprint: string | null;
  message: string;
}

type MvuCalibrationFetch = (input: string, init?: RequestInit) => Promise<Response>;

interface MvuCalibrationStandardLoadOptions {
  fetcher?: MvuCalibrationFetch;
  sourceUrl?: string;
  localFingerprint?: string;
  timeoutMs?: number;
  cacheToken?: string;
  runtime?: {
    z: unknown;
    lodash?: unknown;
  };
  forceRefresh?: boolean;
}

interface SourceMapLike {
  sources?: unknown;
  sourcesContent?: unknown;
}

let cachedDefaultResolution: Promise<MvuCalibrationStandardResolution> | null = null;

export function ensureMvuCalibrationStandard(
  options: MvuCalibrationStandardLoadOptions = {},
): Promise<MvuCalibrationStandardResolution> {
  const isDefaultResolution =
    options.fetcher === undefined &&
    options.sourceUrl === undefined &&
    options.localFingerprint === undefined &&
    options.timeoutMs === undefined &&
    options.cacheToken === undefined &&
    options.runtime === undefined;

  if (isDefaultResolution && options.forceRefresh !== true && cachedDefaultResolution !== null) {
    return cachedDefaultResolution;
  }

  const resolution = loadMvuCalibrationStandard(options);
  if (isDefaultResolution) {
    cachedDefaultResolution = resolution;
  }
  return resolution;
}

export function resetMvuCalibrationStandardResolution() {
  cachedDefaultResolution = null;
  activateLocalMvuCalibrationStandard();
}

export function createMvuCalibrationSourceFingerprint(source: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${source.length}:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

async function loadMvuCalibrationStandard(
  options: MvuCalibrationStandardLoadOptions,
): Promise<MvuCalibrationStandardResolution> {
  const sourceUrl = options.sourceUrl ?? MVU_CALIBRATION_SCHEMA_SOURCE_URL;
  const localFingerprint = options.localFingerprint ?? MVU_CALIBRATION_SCHEMA_LOCAL_FINGERPRINT;
  const fetcher = options.fetcher ?? resolveGlobalFetch();
  if (fetcher === null) {
    activateBundledLocalSchema(options.runtime);
    return {
      source: 'local',
      checked: false,
      localFingerprint,
      remoteFingerprint: null,
      message: '当前环境无法访问 fetch，使用本地变量结构。',
    };
  }

  try {
    const cacheToken = options.cacheToken ?? String(Date.now());
    const remoteSourceUrl = appendCacheToken(sourceUrl, cacheToken);
    const remoteSource = await fetchText(fetcher, remoteSourceUrl, options.timeoutMs);
    const remoteFingerprint = createMvuCalibrationSourceFingerprint(remoteSource);
    if (remoteFingerprint === localFingerprint) {
      activateBundledLocalSchema(options.runtime);
      return {
        source: 'local',
        checked: true,
        localFingerprint,
        remoteFingerprint,
        message: `本地变量结构与 CDN 一致（${remoteFingerprint}），本次使用本地标准。`,
      };
    }

    const sourceMapUrl = appendCacheToken(resolveSourceMapUrl(remoteSource, sourceUrl), cacheToken);
    const sourceMapText = await fetchText(fetcher, sourceMapUrl, options.timeoutMs);
    const schemaSource = readSchemaSourceFromSourceMap(sourceMapText);
    const schema = compileCdnMvuSchema(schemaSource, options.runtime);
    activateCdnMvuCalibrationStandard(schema);

    return {
      source: 'cdn',
      checked: true,
      localFingerprint,
      remoteFingerprint,
      message: `检测到 CDN 变量结构已更新（本地 ${localFingerprint} / CDN ${remoteFingerprint}），本次使用 CDN 标准。`,
    };
  } catch (error) {
    activateBundledLocalSchema(options.runtime);
    const message = error instanceof Error ? error.message : String(error);
    return {
      source: 'local-fallback',
      checked: true,
      localFingerprint,
      remoteFingerprint: null,
      message: `CDN 变量结构检查失败，已降级到本地标准：${message}`,
    };
  }
}

function resolveGlobalFetch(): MvuCalibrationFetch | null {
  if (typeof window === 'undefined' || typeof globalThis.fetch !== 'function') {
    return null;
  }
  return globalThis.fetch.bind(globalThis) as MvuCalibrationFetch;
}

async function fetchText(fetcher: MvuCalibrationFetch, url: string, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${url} 返回 HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function appendCacheToken(url: string, cacheToken: string) {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set('_mvu_schema', cacheToken);
  return parsedUrl.href;
}

function resolveSourceMapUrl(source: string, sourceUrl: string) {
  const match = source.match(/\/\/# sourceMappingURL=([^\s]+)\s*$/);
  if (match?.[1] === undefined) {
    throw new Error('CDN 变量结构没有 sourceMappingURL，无法读取远端 Schema。');
  }
  return new URL(match[1], sourceUrl).href;
}

function readSchemaSourceFromSourceMap(sourceMapText: string) {
  const sourceMap = JSON.parse(sourceMapText) as SourceMapLike;
  if (!Array.isArray(sourceMap.sources) || !Array.isArray(sourceMap.sourcesContent)) {
    throw new Error('CDN source map 缺少 sourcesContent。');
  }

  const sourceIndex = sourceMap.sources.findIndex(
    source => typeof source === 'string' && /(?:^|[\\/])变量结构[\\/]schema\.ts$/.test(source),
  );
  const source = sourceMap.sourcesContent[sourceIndex];
  if (sourceIndex < 0 || typeof source !== 'string' || source.trim().length === 0) {
    throw new Error('CDN source map 中找不到变量结构/schema.ts。');
  }
  return source;
}

function compileCdnMvuSchema(source: string, runtimeOverride: MvuCalibrationStandardLoadOptions['runtime']) {
  const { zodRuntime, lodashRuntime } = resolveSchemaRuntime(runtimeOverride);
  if (zodRuntime === undefined) {
    throw new Error('当前页面没有全局 z，无法还原 CDN Zod Schema。');
  }

  const executableSource = source
    .replace(/\bexport\s+(?=(?:const|let|var|function|class)\b)/g, '')
    .replace(/\n?export\s*\{[^}]*\};?/g, '');
  const createSchema = new Function(
    'z',
    '_',
    `"use strict";\n${executableSource}\nreturn typeof Schema === "undefined" ? null : Schema;`,
  ) as (zod: unknown, lodash: unknown) => unknown;
  const schema = createSchema(zodRuntime, lodashRuntime);
  if (schema === null || typeof schema !== 'object') {
    throw new Error('CDN schema.ts 没有生成 Schema 对象。');
  }
  return schema;
}

function activateBundledLocalSchema(runtimeOverride: MvuCalibrationStandardLoadOptions['runtime']) {
  const { zodRuntime } = resolveSchemaRuntime(runtimeOverride);
  if (zodRuntime === undefined) {
    activateLocalMvuCalibrationStandard();
    return false;
  }

  try {
    activateLocalMvuCalibrationSchema(createLocalMvuCalibrationSchema(zodRuntime));
    return true;
  } catch {
    activateLocalMvuCalibrationStandard();
    return false;
  }
}

function resolveSchemaRuntime(runtimeOverride: MvuCalibrationStandardLoadOptions['runtime']) {
  const runtime = globalThis as typeof globalThis & { z?: unknown; _?: unknown };
  return {
    zodRuntime: runtimeOverride?.z ?? runtime.z,
    lodashRuntime: runtimeOverride?.lodash ?? runtime._,
  };
}
