<template>
  <div
    v-if="isFunctionPageOpen"
    ref="functionPageOverlay"
    class="bp-function-page-overlay"
    role="dialog"
    :aria-modal="selectedRelationshipContact === null ? 'true' : undefined"
    :aria-hidden="selectedRelationshipContact !== null ? 'true' : undefined"
    :inert="selectedRelationshipContact !== null"
    aria-labelledby="bp-function-page-title"
    tabindex="-1"
    @click.self="emit('close-function')"
    @keydown="handleFunctionPageKeydown"
  >
    <section class="bp-function-page-card">
      <!-- BA Style Outer Frame Decorative Elements -->
      <div class="bp-ba-frame-corner top-left"></div>
      <div class="bp-ba-frame-corner top-right"></div>
      <div class="bp-ba-frame-corner bottom-left"></div>
      <div class="bp-ba-frame-corner bottom-right"></div>

      <div class="bp-ba-frame-cross top-left"></div>
      <div class="bp-ba-frame-cross top-right"></div>
      <div class="bp-ba-frame-cross bottom-left"></div>
      <div class="bp-ba-frame-cross bottom-right"></div>

      <!-- Large Background Logo / Watermark -->
      <div class="bp-function-page-watermark">
        <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 80 L80 80 L120 20 L80 20 Z" fill="url(#watermark-grad)" />
          <path d="M120 80 L160 80 L200 20 L160 20 Z" fill="url(#watermark-grad)" />
          <path d="M20 50 L180 50" stroke="url(#watermark-grad)" stroke-width="2" stroke-dasharray="4 4" />
          <defs>
            <linearGradient id="watermark-grad" x1="0" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#00A0E9" stop-opacity="0.06" />
              <stop offset="100%" stop-color="#00A0E9" stop-opacity="0.01" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <button type="button" class="bp-function-page-close" aria-label="关闭什亭之匣" @click="emit('close-function')">
        返回
      </button>

      <header class="bp-function-page-header">
        <p class="bp-function-page-kicker">Shittim Chest</p>
        <h3 id="bp-function-page-title" class="bp-function-page-title">
          什亭之匣
          <span class="bp-title-decorator"></span>
        </h3>
      </header>

      <nav class="bp-function-page-tabs" aria-label="什亭之匣标签页">
        <button
          type="button"
          :class="['bp-function-page-tab', { 'is-active': activeFunctionTab === 'manual-sex-battle' }]"
          @click="setFunctionTab('manual-sex-battle')"
        >
          <svg v-if="activeFunctionTab === 'manual-sex-battle'" class="bp-tab-icon" viewBox="0 0 16 16" fill="none">
            <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor" />
          </svg>
          手动性斗
        </button>
        <button
          type="button"
          :class="['bp-function-page-tab', { 'is-active': activeFunctionTab === 'pending-one' }]"
          @click="setFunctionTab('pending-one')"
        >
          敬请期待
        </button>
        <button
          type="button"
          :class="['bp-function-page-tab', { 'is-active': activeFunctionTab === 'pending-two' }]"
          @click="setFunctionTab('pending-two')"
        >
          敬请期待
        </button>
      </nav>

      <section class="bp-function-page-content" aria-live="polite">
        <template v-if="activeFunctionTab === 'manual-sex-battle'">
          <div class="bp-manual-battle-panel">
            <section class="bp-manual-battle-section">
              <div class="bp-manual-battle-section-head">
                <div>
                  <p class="bp-manual-battle-kicker">CURRENT SCENE <span class="bp-kicker-dots">....</span></p>
                  <h4 class="bp-function-page-content-title">当前在场</h4>
                </div>
                <span class="bp-manual-battle-count">{{ presentRelationshipContacts.length }}</span>
              </div>

              <div v-if="presentRelationshipContacts.length > 0" class="bp-manual-battle-grid is-present">
                <button
                  v-for="contact in presentRelationshipContacts"
                  :key="`present-${contact.name}`"
                  type="button"
                  class="bp-manual-battle-contact is-present"
                  @click="emit('open-contact', contact)"
                >
                  <span class="bp-manual-battle-avatar" :class="{ 'has-image': contact.avatarUrl !== null }">
                    <img
                      v-if="contact.avatarUrl !== null"
                      class="bp-manual-battle-avatar-image"
                      :src="contact.avatarUrl"
                      :alt="`${contact.name} Q版头像`"
                      decoding="async"
                      loading="lazy"
                      @error="emit('relationship-avatar-error', $event)"
                    />
                    <span class="bp-manual-battle-avatar-fallback">{{ contact.name.slice(0, 1) }}</span>
                  </span>
                  <span class="bp-manual-battle-name">{{ contact.name }}</span>
                </button>
              </div>
              <p v-else class="bp-manual-battle-empty">当前楼层没有同步在场人物。</p>
            </section>

            <section class="bp-manual-battle-section">
              <div class="bp-manual-battle-section-head">
                <div>
                  <p class="bp-manual-battle-kicker">CONTACT ARCHIVE <span class="bp-kicker-dots">....</span></p>
                  <h4 class="bp-function-page-content-title">已知联系人</h4>
                </div>
                <span class="bp-manual-battle-count">{{ knownRelationshipCount }}</span>
              </div>

              <div v-if="contactFactions.length > 0" class="bp-manual-battle-factions" aria-label="联系人阵营">
                <button
                  v-for="faction in contactFactions"
                  :key="faction.name"
                  type="button"
                  :class="['bp-manual-battle-faction-tab', { 'is-active': selectedContactFaction === faction.name }]"
                  @click="activeContactFaction = faction.name"
                >
                  <span>{{ faction.name }}</span>
                  <span>{{ faction.contacts.length }}</span>
                </button>
              </div>

              <div v-if="selectedKnownContacts.length > 0" class="bp-manual-battle-grid">
                <button
                  v-for="contact in selectedKnownContacts"
                  :key="`known-${contact.name}`"
                  type="button"
                  class="bp-manual-battle-contact"
                  @click="emit('open-contact', contact)"
                >
                  <span class="bp-manual-battle-avatar" :class="{ 'has-image': contact.avatarUrl !== null }">
                    <img
                      v-if="contact.avatarUrl !== null"
                      class="bp-manual-battle-avatar-image"
                      :src="contact.avatarUrl"
                      :alt="`${contact.name} Q版头像`"
                      decoding="async"
                      loading="lazy"
                      @error="emit('relationship-avatar-error', $event)"
                    />
                    <span class="bp-manual-battle-avatar-fallback">{{ contact.name.slice(0, 1) }}</span>
                  </span>
                  <span class="bp-manual-battle-name">{{ contact.name }}</span>
                </button>
              </div>
              <p v-else class="bp-manual-battle-empty">暂无可显示的已知联系人。</p>
            </section>
          </div>
        </template>
        <template v-else>
          <h4 class="bp-function-page-content-title">敬请期待</h4>
          <p class="bp-function-page-content-copy">该标签页暂未开放。</p>
        </template>
      </section>
    </section>
  </div>

  <div
    v-if="isThinkingPageOpen"
    ref="thinkingPageOverlay"
    class="bp-function-page-overlay bp-thinking-page-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bp-thinking-page-title"
    tabindex="-1"
    @click.self="emit('close-thinking')"
    @keydown="handleThinkingPageKeydown"
  >
    <section class="bp-function-page-card bp-thinking-page-card">
      <div class="bp-ba-frame-corner top-left"></div>
      <div class="bp-ba-frame-corner top-right"></div>
      <div class="bp-ba-frame-corner bottom-left"></div>
      <div class="bp-ba-frame-corner bottom-right"></div>
      <div class="bp-ba-frame-cross top-left"></div>
      <div class="bp-ba-frame-cross top-right"></div>
      <div class="bp-ba-frame-cross bottom-left"></div>
      <div class="bp-ba-frame-cross bottom-right"></div>

      <button type="button" class="bp-function-page-close" aria-label="关闭思维链" @click="emit('close-thinking')">
        返回
      </button>

      <header class="bp-function-page-header">
        <p class="bp-function-page-kicker">Thinking Trace</p>
        <h3 id="bp-thinking-page-title" class="bp-function-page-title">
          思维链
          <span class="bp-title-decorator"></span>
        </h3>
      </header>

      <section class="bp-function-page-content bp-thinking-page-content" aria-live="polite">
        <div class="bp-thinking-page-head">
          <p class="bp-manual-battle-kicker">RAW THINK BLOCK <span class="bp-kicker-dots">....</span></p>
          <span :class="['bp-thinking-page-status', { 'is-empty': !hasThinkingContent }]">
            {{ hasThinkingContent ? '已读取' : '未检出' }}
          </span>
        </div>

        <pre v-if="hasThinkingContent" class="bp-thinking-page-text">{{ thinkingContent }}</pre>
        <p v-else class="bp-thinking-page-empty">当前楼层没有读取到 &lt;think&gt; / &lt;thinking&gt; 标签内容。</p>
      </section>
    </section>
  </div>

  <div
    v-if="isFunctionPageOpen && selectedRelationshipContact !== null"
    ref="relationshipDetailOverlay"
    class="bp-character-detail-overlay"
    role="dialog"
    aria-modal="true"
    :aria-label="`${selectedRelationshipContact.name} 角色详情`"
    tabindex="-1"
    @click.self="emit('close-contact')"
    @keydown="handleFunctionPageKeydown"
  >
    <section class="bp-character-detail-shell">
      <button type="button" class="bp-character-detail-exit" aria-label="退出角色详情" @click="emit('close-contact')">
        退出
      </button>
      <img
        class="bp-character-detail-ui-image"
        :src="characterDetailUiUrl"
        :alt="`${selectedRelationshipContact.name} 角色详情UI`"
        decoding="async"
        loading="eager"
      />
      <div class="bp-character-detail-content">
        <div class="bp-character-detail-standee-zone">
          <img
            v-if="selectedRelationshipPortraitUrl !== null"
            class="bp-character-detail-standee"
            :src="selectedRelationshipPortraitUrl"
            :alt="`${selectedRelationshipDisplayName} 全身立绘`"
            decoding="async"
            loading="eager"
          />
        </div>
        <div class="bp-character-detail-status">
          <strong>{{ selectedRelationshipDisplayName }}</strong>
          <span v-if="selectedRelationshipAffiliation !== null">{{ selectedRelationshipAffiliation }}</span>
        </div>
        <div class="bp-character-detail-level-strip">
          <span v-for="item in selectedRelationshipLevelItems" :key="item.label">
            <b>{{ item.label }}</b>
            <strong>{{ item.value }}</strong>
          </span>
        </div>
        <div class="bp-character-detail-stat-grid">
          <section
            v-for="block in selectedRelationshipStatBlocks"
            :key="block.id"
            class="bp-character-detail-stat-block"
            :class="`is-${block.id}`"
          >
            <p v-for="stat in block.stats" :key="stat.label">
              <span>{{ stat.label }}</span>
              <strong>{{ stat.value }}</strong>
            </p>
          </section>
        </div>
        <section class="bp-character-detail-skill-panel" aria-label="角色技能">
          <span class="bp-character-detail-skill-kicker">SKILL</span>
          <div class="bp-character-detail-skill-grid" role="list" aria-label="技能列表">
            <button
              v-for="(skill, index) in selectedRelationshipSkills"
              :key="`${skill.name}-${index}`"
              type="button"
              class="bp-character-detail-skill-option"
              role="listitem"
              @click="selectedRelationshipSkillDetailIndex = index"
            >
              <span>{{ skill.name }}</span>
            </button>
            <p v-if="selectedRelationshipSkills.length === 0" class="bp-character-detail-skill-empty">
              该角色暂无技能表记录
            </p>
          </div>
          <section
            v-if="selectedRelationshipActiveSkill !== null"
            class="bp-character-detail-skill-detail"
            aria-label="技能详情"
          >
            <button
              type="button"
              class="bp-character-detail-skill-detail-close"
              aria-label="关闭技能详情"
              @click="selectedRelationshipSkillDetailIndex = null"
            >
              ×
            </button>
            <strong>{{ selectedRelationshipActiveSkill.name }}</strong>
            <p>{{ selectedRelationshipSkillEffectText }}</p>
            <small v-if="selectedRelationshipSkillDamageText.length > 0" class="bp-character-detail-skill-damage">
              {{ selectedRelationshipSkillDamageText }}
            </small>
            <dl>
              <div v-for="item in selectedRelationshipSkillBonusItems" :key="item.label">
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>
            <small v-if="selectedRelationshipSkillBonusText.length > 0" class="bp-character-detail-skill-buffs">
              {{ selectedRelationshipSkillBonusText }}
            </small>
          </section>
        </section>
        <div class="bp-character-detail-actions" aria-label="角色操作">
          <button type="button" class="bp-character-detail-action-button" @click="emit('show-coming-soon', '使用道具')">
            使用道具
          </button>
          <button type="button" class="bp-character-detail-action-button" @click="emit('show-coming-soon', '誓约')">
            誓约
          </button>
          <button type="button" class="bp-character-detail-action-button is-primary" @click="emit('start-sex-battle')">
            发起性斗
          </button>
        </div>
      </div>
    </section>
  </div>

  <div
    v-if="portraitPreview !== null"
    ref="portraitPreviewOverlay"
    class="bp-portrait-preview-overlay"
    role="dialog"
    aria-modal="true"
    :aria-label="`${portraitPreview.label} 立绘预览`"
    tabindex="-1"
    @click.self="emit('close-portrait')"
    @keydown="handlePortraitPreviewKeydown"
  >
    <div class="bp-portrait-preview-card" tabindex="-1">
      <button type="button" class="bp-portrait-preview-close" aria-label="关闭立绘预览" @click="emit('close-portrait')">
        关闭
      </button>
      <img
        class="bp-portrait-preview-image"
        :src="portraitPreview.src"
        :alt="`${portraitPreview.label} 512宽立绘预览`"
        decoding="sync"
        loading="eager"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CharacterSkillEntry } from '../../character-skills';
import type { ContactFaction, RelationshipContact } from '../../mobile/relationship-runtime';
import { focusOverlayAfterRender, trapFocusWithin } from '../overlay-focus';
import type { CharacterDetailStatBlock, CharacterDetailStatItem, PortraitPreview } from '../types';

type FunctionPageTab = 'manual-sex-battle' | 'pending-one' | 'pending-two';

const props = defineProps<{
  isFunctionPageOpen: boolean;
  isThinkingPageOpen: boolean;
  thinkingContent: string;
  hasThinkingContent: boolean;
  presentRelationshipContacts: RelationshipContact[];
  contactFactions: ContactFaction[];
  selectedRelationshipContact: RelationshipContact | null;
  characterDetailUiUrl: string;
  selectedRelationshipPortraitUrl: string | null;
  selectedRelationshipDisplayName: string;
  selectedRelationshipAffiliation: string | null;
  selectedRelationshipLevelItems: CharacterDetailStatItem[];
  selectedRelationshipStatBlocks: CharacterDetailStatBlock[];
  selectedRelationshipSkills: CharacterSkillEntry[];
  portraitPreview: PortraitPreview | null;
}>();

const emit = defineEmits<{
  'close-function': [];
  'close-thinking': [];
  'open-contact': [contact: RelationshipContact];
  'close-contact': [];
  'relationship-avatar-error': [event: Event];
  'show-coming-soon': [featureLabel: string];
  'start-sex-battle': [];
  'close-portrait': [];
}>();

const functionPageOverlay = ref<HTMLElement | null>(null);
const thinkingPageOverlay = ref<HTMLElement | null>(null);
const relationshipDetailOverlay = ref<HTMLElement | null>(null);
const portraitPreviewOverlay = ref<HTMLElement | null>(null);
const activeFunctionTab = ref<FunctionPageTab>('manual-sex-battle');
const activeContactFaction = ref<string | null>(null);
const selectedRelationshipSkillDetailIndex = ref<number | null>(null);

const selectedContactFaction = computed(() => {
  const activeFaction = activeContactFaction.value;
  if (activeFaction !== null && props.contactFactions.some(faction => faction.name === activeFaction)) {
    return activeFaction;
  }
  return props.contactFactions[0]?.name ?? null;
});

const selectedKnownContacts = computed(
  () => props.contactFactions.find(faction => faction.name === selectedContactFaction.value)?.contacts ?? [],
);
const knownRelationshipCount = computed(() =>
  props.contactFactions.reduce((total, faction) => total + faction.contacts.length, 0),
);
const selectedRelationshipActiveSkill = computed(() =>
  selectedRelationshipSkillDetailIndex.value === null
    ? null
    : (props.selectedRelationshipSkills[selectedRelationshipSkillDetailIndex.value] ?? null),
);
const selectedRelationshipSkillEffectText = computed(() => {
  const skill = selectedRelationshipActiveSkill.value;
  return skill === null ? '' : formatSkillEffectText(skill);
});
const selectedRelationshipSkillBonusItems = computed(() => {
  const skill = selectedRelationshipActiveSkill.value;
  if (skill === null) {
    return [];
  }

  return [
    { label: '类型', value: skill.type },
    { label: '消耗', value: skill.cost },
    { label: '冷却', value: skill.cooldown },
    { label: '命中', value: skill.accuracy },
    { label: '暴击', value: formatSignedSkillValue(skill.critical) },
    { label: '连击', value: skill.combo },
  ].filter(item => item.value.length > 0 && item.value !== '无');
});
const selectedRelationshipSkillDamageText = computed(() => {
  const skill = selectedRelationshipActiveSkill.value;
  return skill === null || skill.damageFormula.length === 0 || skill.damageFormula === '无直接伤害'
    ? ''
    : '伤害：' + skill.damageFormula;
});
const selectedRelationshipSkillBonusText = computed(() => {
  const skill = selectedRelationshipActiveSkill.value;
  return skill !== null && skill.buffs.length > 0 && skill.buffs !== '无' ? '状态：' + skill.buffs : '';
});

watch(
  () => props.selectedRelationshipContact,
  contact => {
    selectedRelationshipSkillDetailIndex.value = null;
    if (contact !== null) {
      focusOverlayAfterRender(() => relationshipDetailOverlay.value);
    } else if (props.isFunctionPageOpen) {
      focusOverlayAfterRender(() => functionPageOverlay.value);
    }
  },
);

watch(
  () => props.selectedRelationshipSkills,
  skills => {
    if (
      selectedRelationshipSkillDetailIndex.value !== null &&
      selectedRelationshipSkillDetailIndex.value >= skills.length
    ) {
      selectedRelationshipSkillDetailIndex.value = null;
    }
  },
  { immediate: true },
);

watch(
  () => props.isFunctionPageOpen,
  isOpen => {
    if (isOpen && props.selectedRelationshipContact === null) {
      focusOverlayAfterRender(() => functionPageOverlay.value);
    }
  },
  { immediate: true },
);

watch(
  () => props.isThinkingPageOpen,
  isOpen => {
    if (isOpen) {
      focusOverlayAfterRender(() => thinkingPageOverlay.value);
    }
  },
  { immediate: true },
);

watch(
  () => props.portraitPreview,
  preview => {
    if (preview !== null) {
      focusOverlayAfterRender(() => portraitPreviewOverlay.value);
    }
  },
  { immediate: true },
);

function setFunctionTab(tab: FunctionPageTab) {
  activeFunctionTab.value = tab;
  emit('close-contact');
}

function handleFunctionPageKeydown(event: KeyboardEvent) {
  trapFocusWithin(
    event,
    props.selectedRelationshipContact === null ? functionPageOverlay.value : relationshipDetailOverlay.value,
  );
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    if (props.selectedRelationshipContact === null) {
      emit('close-function');
    } else {
      emit('close-contact');
    }
  }
}

function handleThinkingPageKeydown(event: KeyboardEvent) {
  trapFocusWithin(event, thinkingPageOverlay.value);
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('close-thinking');
  }
}

function handlePortraitPreviewKeydown(event: KeyboardEvent) {
  trapFocusWithin(event, portraitPreviewOverlay.value);
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('close-portrait');
  }
}

function formatSkillEffectText(skill: CharacterSkillEntry) {
  if (skill.effect.length > 0 && skill.effect !== '无') {
    return skill.effect;
  }
  if (skill.damageFormula.length > 0 && skill.damageFormula !== '无直接伤害') {
    return '伤害公式：' + skill.damageFormula;
  }
  return '该技能没有直接伤害，主要依靠状态、控制或辅助效果。';
}

function formatSignedSkillValue(value: string) {
  const normalizedValue = value.trim();
  if (normalizedValue.length === 0 || normalizedValue === '无') {
    return normalizedValue;
  }
  return /^[+-]/.test(normalizedValue) ? normalizedValue : '+' + normalizedValue;
}
</script>
