export interface PresetPromptItem {
  name: string;
  displayName: string;
  enabled: boolean;
  role: string;
  hasContent: boolean;
  section: PresetPromptSection;
}

type PresetPromptSection = 'general' | 'mvu';

interface SectionPromptMeta {
  name: string;
  section: PresetPromptSection;
}

const SECTION_START: Record<string, PresetPromptSection> = {
  '【一般条目】': 'general',
  '【MVU条目】': 'mvu',
};

const SECTION_END = new Set(['【/一般条目】', '【/MVU条目】']);

function displayPromptName(name: string): string {
  return name.replace(/^[^\p{L}\p{N}]+/u, '').trim() || name;
}

function collectSectionPrompts(rawPrompts: unknown[]): SectionPromptMeta[] {
  const result: SectionPromptMeta[] = [];
  let currentSection: PresetPromptSection | null = null;

  for (const prompt of rawPrompts) {
    const candidate = prompt as any;
    if (!(isPresetNormalPrompt(candidate) || isPresetSystemPrompt(candidate))) continue;
    const name = candidate.name ?? '';
    const nextSection = SECTION_START[name];

    if (nextSection) {
      currentSection = nextSection;
      continue;
    }

    if (SECTION_END.has(name)) {
      currentSection = null;
      continue;
    }

    if (currentSection) {
      result.push({ name, section: currentSection });
    }
  }

  return result;
}

export const usePresetStore = defineStore('preset', () => {
  const prompts = ref<PresetPromptItem[]>([]);
  const currentPresetName = ref('');

  function refresh() {
    try {
      currentPresetName.value = getLoadedPresetName();
      const preset = getPreset('in_use');
      const sectionPrompts = collectSectionPrompts(preset.prompts);
      prompts.value = sectionPrompts.flatMap(meta => {
        const p = preset.prompts.find(
          p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === meta.name,
        );
        if (!p) return [];
        return [{
          name: p.name,
          displayName: displayPromptName(p.name),
          enabled: p.enabled,
          role: p.role ?? 'system',
          hasContent: 'content' in p,
          section: meta.section,
        }];
      });
    } catch (e) {
      console.warn('[IDE] preset refresh failed:', e);
    }
  }

  /** 切换条目开关 */
  async function togglePrompt(name: string) {
    try {
      await updatePresetWith('in_use', preset => {
        const p = preset.prompts.find(
          p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === name,
        );
        if (p) p.enabled = !p.enabled;
        return preset;
      });
      refresh();
    } catch (e) {
      console.error('[IDE] togglePrompt failed:', e);
    }
  }

  /** 激活本次写卡任务条目：只切换【一般条目】和【MVU条目】区间，核心预设骨架不动。 */
  async function activateWriteMode(targetNames: string | string[]) {
    const targets = new Set((Array.isArray(targetNames) ? targetNames : [targetNames]).filter(Boolean));
    const activatedNames: string[] = [];

    try {
      await updatePresetWith('in_use', preset => {
        const sectionPromptNames = new Set(collectSectionPrompts(preset.prompts).map(item => item.name));
        for (const p of preset.prompts) {
          if (!(isPresetNormalPrompt(p) || isPresetSystemPrompt(p))) continue;
          if (!sectionPromptNames.has(p.name)) continue;
          p.enabled = targets.has(p.name);
          if (p.enabled) {
            activatedNames.push(p.name);
          }
        }
        return preset;
      });
      refresh();
    } catch (e) {
      console.error('[IDE] activateWriteMode failed:', e);
    }

    return activatedNames;
  }

  /** 获取一般条目列表：严格来自【一般条目】区间。 */
  const generalPrompts = computed(() => prompts.value.filter(p => p.section === 'general'));

  const mvuPrompts = computed(() => prompts.value.filter(p => p.section === 'mvu'));

  /**
   * 提示词模板（ST-Prompt-Template / EjsTemplate, DOM: #pt_enabled）
   * + 酒馆助手宏（TavernHelper Macro, DOM: #TH-macro-disabled）
   *
   * 联合开关：写卡时需要禁用这两个功能
   * - 提示词模板: #pt_enabled checked=true 表示启用
   * - 酒馆助手宏: #TH-macro-disabled checked=true 表示「禁用宏」（注意是反逻辑）
   *
   * "enabled" 状态表示两个功能都处于正常工作状态（模板启用 + 宏未禁用）
   */
  const templateAndMacroEnabled = ref(true);

  function refreshTemplateAndMacroStatus() {
    try {
      /* 检测提示词模板: #pt_enabled checked=true 表示启用 */
      const ptEl = $('#pt_enabled')[0] as HTMLInputElement | undefined;
      const templateOn = ptEl ? ptEl.checked : true;

      /* 检测酒馆助手宏: #TH-macro-disabled checked=true 表示宏被禁用 */
      const macroEl = $('#TH-macro-disabled')[0] as HTMLInputElement | undefined;
      const macroDisabled = macroEl ? macroEl.checked : false;
      const macroOn = !macroDisabled;

      /* 两者都启用才算 enabled */
      templateAndMacroEnabled.value = templateOn && macroOn;
    } catch {
      /* 检测失败，保持默认 */
    }
  }

  /** 切换提示词模板 + 酒馆助手宏 */
  function toggleTemplateAndMacro() {
    const newState = !templateAndMacroEnabled.value;

    /* 1. 切换提示词模板（#pt_enabled）: newState=true 时启用, false 时禁用 */
    try {
      const $pt = $('#pt_enabled');
      if ($pt.length) {
        $pt.prop('checked', newState).trigger('input').trigger('change');
      }
      /* 也通过 API 同步 */
      if (typeof EjsTemplate !== 'undefined' && EjsTemplate.setFeatures) {
        EjsTemplate.setFeatures({ enabled: newState });
      }
    } catch (e) {
      console.warn('[IDE] Failed to toggle Prompt Template:', e);
    }

    /* 2. 切换酒馆助手宏（#TH-macro-disabled）: newState=true 时宏启用→需要 unchecked; false 时宏禁用→需要 checked */
    try {
      const $macro = $('#TH-macro-disabled');
      if ($macro.length) {
        $macro.prop('checked', !newState).trigger('input').trigger('change');
      }
    } catch (e) {
      console.warn('[IDE] Failed to toggle TavernHelper Macro:', e);
    }

    templateAndMacroEnabled.value = newState;
    toastr.success(
      newState
        ? 'Prompt Template & TH Macro: Enabled'
        : 'Prompt Template & TH Macro: Disabled (safe for card editing)',
    );
  }

  /* 初始化时检测状态 */
  refreshTemplateAndMacroStatus();

  return {
    prompts,
    currentPresetName,
    generalPrompts,
    mvuPrompts,
    refresh,
    togglePrompt,
    activateWriteMode,
    templateAndMacroEnabled,
    toggleTemplateAndMacro,
  };
});
