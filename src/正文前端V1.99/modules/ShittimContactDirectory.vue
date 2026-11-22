<template>
  <div class="ContentChatRenderer shittim-directory-legacy" role="region" :aria-labelledby="titleId">
    <section class="bp-function-page-card bp-shittim-card">
      <span
        v-for="corner in ['top-left', 'top-right', 'bottom-left', 'bottom-right']"
        :key="corner"
        class="bp-shittim-corner"
        :class="corner"
        aria-hidden="true"
      ></span>
      <div class="bp-shittim-watermark" aria-hidden="true"></div>
      <button type="button" class="bp-function-page-close" aria-label="关闭什亭之匣" @click="emit('close')">
        返回
      </button>
      <header class="bp-function-page-header">
        <div class="bp-function-page-heading">
          <p class="bp-function-page-kicker">Shittim Chest</p>
          <h3 :id="titleId" class="bp-function-page-title">
            什亭之匣<span class="bp-title-decorator" aria-hidden="true"></span>
          </h3>
        </div>
      </header>
      <nav class="bp-function-page-tabs" aria-label="什亭之匣标签页">
        <button
          type="button"
          :class="['bp-function-page-tab', { 'is-active': activeTab === 'manual' }]"
          :aria-pressed="activeTab === 'manual'"
          @click="activeTab = 'manual'"
        >
          <svg v-if="activeTab === 'manual'" class="bp-tab-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor" />
          </svg>
          手动性斗
        </button>
        <button
          type="button"
          :class="['bp-function-page-tab', { 'is-active': activeTab === 'pending-one' }]"
          :aria-pressed="activeTab === 'pending-one'"
          @click="activeTab = 'pending-one'"
        >
          敬请期待
        </button>
        <button
          type="button"
          :class="['bp-function-page-tab', { 'is-active': activeTab === 'pending-two' }]"
          :aria-pressed="activeTab === 'pending-two'"
          @click="activeTab = 'pending-two'"
        >
          敬请期待
        </button>
      </nav>
      <section class="bp-function-page-content" aria-live="polite">
        <div v-if="activeTab === 'manual'" class="bp-manual-battle-panel">
          <section class="bp-manual-battle-section">
            <div class="bp-manual-battle-section-head">
              <div>
                <p class="bp-manual-battle-kicker">CURRENT SCENE <span class="bp-kicker-dots">....</span></p>
                <h4 class="bp-function-page-content-title">当前在场</h4>
              </div>
              <span class="bp-manual-battle-count">{{ presentContacts.length }}</span>
            </div>
            <div v-if="presentContacts.length > 0" class="bp-manual-battle-grid is-present">
              <button
                v-for="contact in presentContacts"
                :key="`present-${contact.name}`"
                type="button"
                class="bp-manual-battle-contact is-present"
                @click="emit('select', contact)"
              >
                <span class="bp-manual-battle-avatar" :class="{ 'has-image': contact.avatarUrl !== null }">
                  <img
                    v-if="contact.avatarUrl !== null"
                    class="bp-manual-battle-avatar-image"
                    :src="contact.avatarUrl"
                    :alt="`${contact.name} Q版头像`"
                    decoding="async"
                    loading="lazy"
                    @error="handleAvatarError"
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
              <span class="bp-manual-battle-count">{{ archiveCount }}</span>
            </div>
            <div v-if="contactFactions.length > 0" class="bp-manual-battle-factions" aria-label="联系人阵营">
              <button
                v-for="group in contactFactions"
                :key="group.name"
                type="button"
                :class="['bp-manual-battle-faction-tab', { 'is-active': selectedFaction === group.name }]"
                :aria-pressed="selectedFaction === group.name"
                @click="activeFaction = group.name"
              >
                <span>{{ group.name }}</span
                ><span>{{ group.contacts.length }}</span>
              </button>
            </div>
            <div v-if="selectedKnownContacts.length > 0" class="bp-manual-battle-grid">
              <button
                v-for="contact in selectedKnownContacts"
                :key="`known-${contact.name}`"
                type="button"
                class="bp-manual-battle-contact"
                @click="emit('select', contact)"
              >
                <span class="bp-manual-battle-avatar" :class="{ 'has-image': contact.avatarUrl !== null }">
                  <img
                    v-if="contact.avatarUrl !== null"
                    class="bp-manual-battle-avatar-image"
                    :src="contact.avatarUrl"
                    :alt="`${contact.name} Q版头像`"
                    decoding="async"
                    loading="lazy"
                    @error="handleAvatarError"
                  />
                  <span class="bp-manual-battle-avatar-fallback">{{ contact.name.slice(0, 1) }}</span>
                </span>
                <span class="bp-manual-battle-name">{{ contact.name }}</span>
              </button>
            </div>
            <p v-else class="bp-manual-battle-empty">暂无可显示的已知联系人。</p>
          </section>
        </div>
        <template v-else
          ><h4 class="bp-function-page-content-title">敬请期待</h4>
          <p class="bp-function-page-content-copy">该标签页暂未开放。</p></template
        >
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import type { ContactFaction, RelationshipContact } from '../mobile/relationship-runtime';

const props = defineProps<{ presentContacts: RelationshipContact[]; contactFactions: ContactFaction[] }>();
const emit = defineEmits<{ close: []; select: [contact: RelationshipContact] }>();
const titleId = `shittim-directory-${useId()}`;
const activeTab = ref<'manual' | 'pending-one' | 'pending-two'>('manual');
const activeFaction = ref<string | null>(null);
const archiveCount = computed(() => props.contactFactions.reduce((total, group) => total + group.contacts.length, 0));
const selectedFaction = computed(() =>
  props.contactFactions.some(group => group.name === activeFaction.value)
    ? activeFaction.value
    : (props.contactFactions[0]?.name ?? null),
);
const selectedKnownContacts = computed(
  () => props.contactFactions.find(group => group.name === selectedFaction.value)?.contacts ?? [],
);
function handleAvatarError(event: Event) {
  (event.currentTarget as HTMLImageElement).closest('.bp-manual-battle-avatar')?.classList.add('is-fallback');
}
</script>

<style scoped>
.shittim-directory-legacy {
  container: bp-host / inline-size;
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
</style>
