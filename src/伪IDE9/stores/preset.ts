export interface PresetPromptItem {
  name: string;
  displayName: string;
  enabled: boolean;
  role: string;
  hasContent: boolean;
}

export const usePresetStore = defineStore('preset', () => {
  const prompts = ref<PresetPromptItem[]>([]);
  const currentPresetName = ref('');

  function refresh() {
    try {
      currentPresetName.value = getLoadedPresetName();
      const preset = getPreset('in_use');
      prompts.value = preset.prompts
        .filter(p => isPresetNormalPrompt(p) || isPresetSystemPrompt(p))
        .map(p => ({
          name: p.name,
          displayName: p.name.replace(/^[^\p{L}\p{N}]+/u, '').trim() || p.name,
          enabled: p.enabled,
          role: p.role ?? 'system',
          hasContent: 'content' in p,
        }));
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

  /** 激活某个写卡条目（关闭其他一般条目，开启目标） */
  async function activateWriteMode(targetName: string) {
    const templateNames = prompts.value.map(p => p.name);
    try {
      await updatePresetWith('in_use', preset => {
        for (const p of preset.prompts) {
          if (!(isPresetNormalPrompt(p) || isPresetSystemPrompt(p))) continue;
          if (!templateNames.includes(p.name)) continue;
          p.enabled = p.name === targetName;
        }
        return preset;
      });
      refresh();
    } catch (e) {
      console.error('[IDE] activateWriteMode failed:', e);
    }
  }

  /** 获取一般条目列表（排除 MVU/系统条目） */
  const generalPrompts = computed(() =>
    prompts.value.filter(p => !p.name.includes('MVU') && !p.name.includes('EJS')),
  );

  const mvuPrompts = computed(() =>
    prompts.value.filter(p => p.name.includes('MVU') || p.name.includes('EJS')),
  );

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
