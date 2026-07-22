<template>
  <section
    v-if="parallelEvents.length > 0"
    :class="['bp-parallel-events-mirror', { 'is-collapsed': isParallelEventsCollapsed }]"
    :inert="backgroundInert"
    :aria-hidden="backgroundInert ? 'true' : undefined"
    aria-labelledby="bp-parallel-events-title"
  >
    <div class="bp-ba-frame-corner top-left"></div>
    <div class="bp-ba-frame-corner top-right"></div>
    <div class="bp-ba-frame-corner bottom-left"></div>
    <div class="bp-ba-frame-corner bottom-right"></div>
    <div class="bp-ba-frame-cross cross-top-left"></div>
    <div class="bp-ba-frame-cross cross-top-right"></div>
    <div class="bp-ba-frame-cross cross-bottom-left"></div>
    <div class="bp-ba-frame-cross cross-bottom-right"></div>

    <button
      type="button"
      class="bp-parallel-events-header"
      :aria-expanded="String(!isParallelEventsCollapsed)"
      aria-controls="bp-parallel-events-list"
      @click="emit('toggle-parallel')"
    >
      <span class="bp-parallel-events-icon" aria-hidden="true"><span></span><span></span><span></span></span>
      <span class="bp-parallel-events-heading">
        <span class="bp-parallel-events-kicker">PARALLEL LOG <span class="bp-kicker-dots">........</span></span>
        <span id="bp-parallel-events-title" class="bp-parallel-events-title">并行事件</span>
      </span>
      <span class="bp-parallel-events-count">{{ parallelEvents.length }}</span>
      <span class="bp-parallel-events-toggle" aria-hidden="true"></span>
    </button>

    <div v-show="!isParallelEventsCollapsed" id="bp-parallel-events-list" class="bp-parallel-events-list">
      <article
        v-for="(event, index) in parallelEvents"
        :key="`${event.character}-${index}-${event.description}`"
        class="bp-parallel-event-card"
      >
        <header class="bp-parallel-event-identity">
          <span class="bp-parallel-event-avatar" aria-hidden="true">
            <img
              v-if="resolveParallelEventAvatarUrl(event.character) !== null"
              class="bp-parallel-event-avatar-image"
              :src="resolveParallelEventAvatarUrl(event.character) ?? ''"
              alt=""
              decoding="async"
              loading="lazy"
              @error="emit('parallel-avatar-error', $event)"
            />
            <span class="bp-parallel-event-avatar-mark">{{ event.character.slice(0, 1) }}</span>
          </span>
          <span class="bp-parallel-event-persona">
            <span class="bp-parallel-event-name">{{ event.character }}</span>
            <span class="bp-parallel-event-affiliation">{{ resolveParallelEventAffiliation(event.character) }}</span>
          </span>
        </header>
        <p class="bp-parallel-event-description">{{ event.description }}</p>
        <span class="bp-parallel-event-index">SYNC {{ String(index + 1).padStart(2, '0') }}</span>
      </article>
    </div>
  </section>

  <section
    v-if="choiceOptions.length > 0"
    class="bp-choice-options-mirror"
    :inert="backgroundInert"
    :aria-hidden="backgroundInert ? 'true' : undefined"
    aria-labelledby="bp-choice-options-title"
  >
    <div class="bp-ba-frame-corner top-left"></div>
    <div class="bp-ba-frame-corner top-right"></div>
    <div class="bp-ba-frame-corner bottom-left"></div>
    <div class="bp-ba-frame-corner bottom-right"></div>
    <div class="bp-ba-frame-cross top-left"></div>
    <div class="bp-ba-frame-cross top-right"></div>
    <div class="bp-ba-frame-cross bottom-left"></div>
    <div class="bp-ba-frame-cross bottom-right"></div>
    <header class="bp-choice-options-header">
      <span class="bp-choice-options-kicker">SELECT ROUTE <span class="bp-kicker-dots">........</span></span>
      <h3 id="bp-choice-options-title" class="bp-choice-options-title">行动选项</h3>
    </header>
    <div class="bp-choice-options-grid">
      <button
        v-for="entry in choiceOptions"
        :key="entry.key"
        type="button"
        :class="[
          'bp-choice-option-card',
          `is-${getChoiceOptionVariant(entry.displayIndex)}`,
          { 'is-selected': selectedChoiceOptionKey === entry.key },
        ]"
        :aria-label="`选择 ${entry.option.label}：${entry.option.text}`"
        @click="emit('select-choice', entry)"
      >
        <img
          class="bp-choice-option-frame"
          :src="getChoiceOptionFrameUrl(entry.displayIndex)"
          alt=""
          decoding="async"
          loading="lazy"
        />
        <span class="bp-choice-option-copy">
          <span class="bp-choice-option-label">{{ entry.option.label }}</span>
          <span class="bp-choice-option-text">{{ entry.option.text }}</span>
        </span>
      </button>
    </div>
  </section>

  <section
    v-if="sexBattleChoiceEntry !== null"
    class="bp-choice-sex-battle-panel"
    :inert="backgroundInert"
    :aria-hidden="backgroundInert ? 'true' : undefined"
    aria-label="选项 E 发起性斗"
  >
    <button
      type="button"
      :class="['bp-choice-sex-battle-button', { 'is-selected': selectedChoiceOptionKey === sexBattleChoiceEntry.key }]"
      @click="emit('select-sex-battle', sexBattleChoiceEntry)"
    >
      <span class="bp-choice-sex-battle-kicker">OPTION E <span class="bp-kicker-dots">........</span></span>
      <span class="bp-choice-sex-battle-title">发起性斗</span>
      <span class="bp-choice-sex-battle-text">{{ sexBattleChoiceEntry.option.text }}</span>
    </button>
  </section>

  <section
    v-if="jsonPatchPanel !== null"
    :class="['bp-jsonpatch-panel', { 'is-collapsed': isJsonPatchPanelCollapsed }]"
    :inert="backgroundInert"
    :aria-hidden="backgroundInert ? 'true' : undefined"
    aria-labelledby="bp-jsonpatch-panel-title"
  >
    <header class="bp-jsonpatch-panel-header">
      <span class="bp-jsonpatch-panel-kicker">VARIABLE PATCH <span class="bp-kicker-dots">........</span></span>
      <h3 id="bp-jsonpatch-panel-title" class="bp-jsonpatch-panel-title">变量更新</h3>
      <span class="bp-jsonpatch-panel-count">
        {{ jsonPatchPanel.operations.length > 0 ? `${jsonPatchPanel.operations.length} OPS` : 'RAW' }}
      </span>
      <button
        type="button"
        class="bp-jsonpatch-collapse-button"
        :aria-expanded="!isJsonPatchPanelCollapsed"
        aria-controls="bp-jsonpatch-panel-body"
        @click="emit('toggle-jsonpatch')"
      >
        <span>{{ isJsonPatchPanelCollapsed ? '展开' : '收起' }}</span>
        <span class="bp-jsonpatch-collapse-icon" aria-hidden="true"></span>
      </button>
      <button
        v-if="jsonPatchPanel.operations.length > 0"
        type="button"
        class="bp-jsonpatch-audit-button"
        :disabled="jsonPatchAudit.status === 'checking'"
        @click="emit('audit-jsonpatch')"
      >
        {{ jsonPatchAudit.status === 'checking' ? '校对中' : '校对变量' }}
      </button>
    </header>
    <div v-if="!isJsonPatchPanelCollapsed" id="bp-jsonpatch-panel-body" class="bp-jsonpatch-panel-body">
      <div
        v-if="jsonPatchAudit.status !== 'idle'"
        :class="['bp-jsonpatch-audit-summary', `is-${jsonPatchAudit.status}`]"
      >
        <span class="bp-jsonpatch-audit-summary-label">PATH CHECK</span>
        <span class="bp-jsonpatch-audit-summary-text">{{ jsonPatchAudit.summary }}</span>
      </div>
      <div v-if="jsonPatchPanel.operations.length > 0" class="bp-jsonpatch-operation-list">
        <article
          v-for="operation in jsonPatchPanel.operations"
          :key="`${operation.index}-${operation.op}-${operation.path}`"
          :class="['bp-jsonpatch-operation-card', `is-${operation.tone}`]"
        >
          <span :class="['bp-jsonpatch-operation-op', `is-${operation.tone}`]">{{ operation.opLabel }}</span>
          <span class="bp-jsonpatch-operation-body">
            <span class="bp-jsonpatch-operation-route">{{ operation.pathTrail }}</span>
            <span class="bp-jsonpatch-operation-title">{{ operation.title }}</span>
            <span class="bp-jsonpatch-operation-value">
              <span class="bp-jsonpatch-operation-value-prefix">{{ operation.valuePrefix }}</span>
              <span class="bp-jsonpatch-operation-value-text">{{
                operation.valueText ?? operation.emptyValueText
              }}</span>
            </span>
          </span>
        </article>
      </div>
      <div v-if="jsonPatchAudit.items.length > 0" class="bp-jsonpatch-audit-list">
        <span
          v-for="item in jsonPatchAudit.items"
          :key="`${item.index}-${item.status}-${item.path}`"
          :class="['bp-jsonpatch-audit-item', `is-${item.status}`]"
        >
          <span class="bp-jsonpatch-audit-item-label">{{ item.label }}</span>
          <span class="bp-jsonpatch-audit-item-text">{{ item.message }}</span>
        </span>
      </div>
      <details v-if="jsonPatchPanel.operations.length > 0" class="bp-jsonpatch-raw-details">
        <summary>查看原始补丁</summary>
        <pre class="bp-jsonpatch-raw">{{ jsonPatchPanel.rawText }}</pre>
      </details>
      <pre v-else class="bp-jsonpatch-raw">{{ jsonPatchPanel.rawText }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ChoiceOptionEntry, JsonPatchAuditView, JsonPatchPanelView } from '../panel-runtime';
import type { ParallelEvent } from '../../types/content-renderer';

const props = defineProps<{
  backgroundInert: boolean;
  parallelEvents: ParallelEvent[];
  isParallelEventsCollapsed: boolean;
  choiceOptions: ChoiceOptionEntry[];
  sexBattleChoiceEntry: ChoiceOptionEntry | null;
  selectedChoiceOptionKey: string | null;
  aronaOptionFrameUrl: string;
  planaOptionFrameUrl: string;
  jsonPatchPanel: JsonPatchPanelView | null;
  jsonPatchAudit: JsonPatchAuditView;
  isJsonPatchPanelCollapsed: boolean;
  resolveParallelEventAvatarUrl: (characterName: string) => string | null;
  resolveParallelEventAffiliation: (characterName: string) => string;
}>();

const emit = defineEmits<{
  'toggle-parallel': [];
  'select-choice': [entry: ChoiceOptionEntry];
  'select-sex-battle': [entry: ChoiceOptionEntry];
  'toggle-jsonpatch': [];
  'audit-jsonpatch': [];
  'parallel-avatar-error': [event: Event];
}>();

function getChoiceOptionVariant(index: number) {
  return index % 2 === 0 ? 'arona' : 'plana';
}

function getChoiceOptionFrameUrl(index: number) {
  return getChoiceOptionVariant(index) === 'arona' ? props.aronaOptionFrameUrl : props.planaOptionFrameUrl;
}
</script>
