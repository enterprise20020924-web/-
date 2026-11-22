import { safeString, uniqueStrings } from './text';

export interface SecondaryPhoneApiSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  models: string[];
}

export interface SecondaryApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: (File | string)[];
}

export interface SecondaryGenerateOptions {
  maxTokens?: number;
}

const SECONDARY_API_STORAGE_KEY = 'fatria-backstreet-secondary-api-v1';
const SECONDARY_API_GLOBAL_KEY = '__fatriaBackstreetSecondaryApiSettings';
export const SECONDARY_PHONE_API_UPDATED_EVENT = 'fatria-backstreet-secondary-api-updated';
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;
const MAX_OUTPUT_TOKENS_LIMIT = 8192;

export const DEFAULT_SECONDARY_PHONE_API_SETTINGS: SecondaryPhoneApiSettings = {
  enabled: false,
  baseUrl: '',
  apiKey: '',
  model: '',
  models: [],
};

function normalizeBaseUrl(value: string): string {
  return safeString(value)
    .replace(/\/+$/g, '')
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/models$/i, '');
}

function buildEndpoint(baseUrl: string, path: string): string {
  const base = normalizeBaseUrl(baseUrl);
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizeSettings(settings: Partial<SecondaryPhoneApiSettings> | null | undefined): SecondaryPhoneApiSettings {
  const models = Array.isArray(settings?.models) ? uniqueStrings(settings.models) : [];
  const selectedModel = safeString(settings?.model);
  const model = selectedModel && models.includes(selectedModel) ? selectedModel : '';
  return {
    enabled: Boolean(settings?.enabled),
    baseUrl: safeString(settings?.baseUrl),
    apiKey: safeString(settings?.apiKey),
    model,
    models,
  };
}

function readGlobalSettings(): SecondaryPhoneApiSettings | null {
  const globalAny = window as any;
  const value = globalAny[SECONDARY_API_GLOBAL_KEY];
  if (!value || typeof value !== 'object') return null;
  return normalizeSettings(value as Partial<SecondaryPhoneApiSettings>);
}

function writeGlobalSettings(settings: SecondaryPhoneApiSettings): void {
  const globalAny = window as any;
  globalAny[SECONDARY_API_GLOBAL_KEY] = normalizeSettings(settings);
}

function readLocalSettings(): SecondaryPhoneApiSettings | null {
  try {
    const raw = window.localStorage?.getItem(SECONDARY_API_STORAGE_KEY);
    if (!raw) return null;
    return normalizeSettings(JSON.parse(raw) as Partial<SecondaryPhoneApiSettings>);
  } catch {
    return null;
  }
}

function buildHeaders(apiKey: string, json = false): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const key = safeString(apiKey);
  if (key) headers.Authorization = key.toLowerCase().startsWith('bearer ') ? key : `Bearer ${key}`;
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function normalizeMaxOutputTokens(value: unknown): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_OUTPUT_TOKENS;
  return Math.min(parsed, MAX_OUTPUT_TOKENS_LIMIT);
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  if (!text) return `${response.status} ${response.statusText}`;
  try {
    const parsed = JSON.parse(text);
    return safeString(parsed?.error?.message || parsed?.message || text);
  } catch {
    return text;
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

async function imageInputToUrl(input: File | string): Promise<string> {
  if (typeof input === 'string') return input;
  return fileToDataUrl(input);
}

async function buildSecondaryApiMessagePayload(message: SecondaryApiMessage): Promise<Record<string, unknown>> {
  const images = Array.isArray(message.images) ? message.images.filter(Boolean) : [];
  if (images.length === 0) {
    return { role: message.role, content: message.content };
  }

  const imageUrls = await Promise.all(images.map(imageInputToUrl));
  return {
    role: message.role,
    content: [
      { type: 'text', text: message.content || '请查看随本条消息发送的图片并回复。' },
      ...imageUrls.filter(Boolean).map(url => ({ type: 'image_url', image_url: { url } })),
    ],
  };
}

export function loadSecondaryPhoneApiSettings(): SecondaryPhoneApiSettings {
  const localSettings = readLocalSettings();
  if (localSettings) {
    writeGlobalSettings(localSettings);
    return localSettings;
  }

  const globalSettings = readGlobalSettings();
  if (globalSettings) return globalSettings;

  return { ...DEFAULT_SECONDARY_PHONE_API_SETTINGS };
}

export function saveSecondaryPhoneApiSettings(settings: SecondaryPhoneApiSettings): void {
  const normalized = normalizeSettings(settings);
  writeGlobalSettings(normalized);
  try {
    window.localStorage?.setItem(
      SECONDARY_API_STORAGE_KEY,
      JSON.stringify({
        enabled: normalized.enabled,
        baseUrl: normalized.baseUrl,
        apiKey: normalized.apiKey,
        model: normalized.model,
        models: normalized.models,
      }),
    );
  } catch {
    // localStorage 不可用时保持当前运行态设置即可。
  }
  window.dispatchEvent(new CustomEvent(SECONDARY_PHONE_API_UPDATED_EVENT, { detail: normalized }));
}

export function isSecondaryPhoneApiReady(settings = loadSecondaryPhoneApiSettings()): boolean {
  return Boolean(settings.enabled && normalizeBaseUrl(settings.baseUrl) && safeString(settings.model));
}

export function getSecondaryPhoneApiStatus(settings = loadSecondaryPhoneApiSettings()): {
  ready: boolean;
  settings: SecondaryPhoneApiSettings;
  reason: string;
} {
  if (!settings.enabled) return { ready: false, settings, reason: '未启用第二 API' };
  if (!normalizeBaseUrl(settings.baseUrl)) return { ready: false, settings, reason: '未填写第二 API URL' };
  if (!safeString(settings.model)) return { ready: false, settings, reason: '未选择第二 API 模型' };
  return { ready: true, settings, reason: '第二 API 已就绪' };
}

export async function fetchSecondaryPhoneApiModels(settings: SecondaryPhoneApiSettings): Promise<string[]> {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  if (!baseUrl) throw new Error('请先填写第二 API URL');

  const response = await fetch(buildEndpoint(baseUrl, '/models'), {
    method: 'GET',
    headers: buildHeaders(settings.apiKey),
  });
  if (!response.ok) {
    throw new Error(`读取模型失败：${await readErrorMessage(response)}`);
  }

  const payload = await response.json();
  const rawModels = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : Array.isArray(payload)
        ? payload
        : [];
  const models = uniqueStrings(
    rawModels
      .map((item: unknown) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const source = item as Record<string, unknown>;
          return safeString(source.id || source.name || source.model);
        }
        return '';
      })
      .filter(Boolean),
  );

  if (models.length === 0) throw new Error('模型列表为空或格式无法识别');
  return models;
}

export async function generateWithSecondaryPhoneApi(
  messages: SecondaryApiMessage[],
  options: SecondaryGenerateOptions = {},
  settingsOverride?: SecondaryPhoneApiSettings,
): Promise<string> {
  const settings = normalizeSettings(settingsOverride || loadSecondaryPhoneApiSettings());
  if (!isSecondaryPhoneApiReady(settings)) throw new Error('第二 API 未启用或尚未选择模型');

  const maxTokens = normalizeMaxOutputTokens(options.maxTokens);
  const messagePayloads = await Promise.all(messages.map(buildSecondaryApiMessagePayload));
  const response = await fetch(buildEndpoint(settings.baseUrl, '/chat/completions'), {
    method: 'POST',
    headers: buildHeaders(settings.apiKey, true),
    body: JSON.stringify({
      model: settings.model,
      messages: messagePayloads,
      stream: false,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`第二 API 生成失败：${await readErrorMessage(response)}`);
  }

  const payload = await response.json();
  return safeString(
    payload?.choices?.[0]?.message?.content ||
      payload?.choices?.[0]?.text ||
      payload?.output_text ||
      payload?.text ||
      payload?.message,
  );
}
