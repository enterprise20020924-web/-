<template>
  <div ref="rootElement" class="bpm-mobile-stack">
    <main
      ref="mapFrameElement"
      :class="[
        'bpm-app-root',
        `is-${currentSegment?.kind ?? 'idle'}`,
        `is-mood-${activeMood}`,
        {
          'has-portrait': npcPortraitUrl !== null && !portraitUnavailable,
          'is-shittim-open': isShittimOpen,
          'is-thinking-open': isThinkingPageOpen,
          'is-talent-open': isTalentOpen,
          'is-map-open': isCampusMapOpen,
          'is-chat-mode': narrativeViewMode === 'chat',
          'is-battle-open': inlineCombat?.visible,
        },
      ]"
      tabindex="-1"
    >
      <VectorArt kind="panel" class="bpv-mobile-frame" />
      <div class="bpm-atmosphere" aria-hidden="true">
        <span class="bpm-atmosphere-orbit bpm-atmosphere-orbit--one"></span>
        <span class="bpm-atmosphere-orbit bpm-atmosphere-orbit--two"></span>
        <span class="bpm-atmosphere-cross bpm-atmosphere-cross--one"></span>
        <span class="bpm-atmosphere-cross bpm-atmosphere-cross--two"></span>
      </div>

      <header class="bpm-topbar">
        <ReturnToBattleButton v-if="inlineCombat" class="bpm-battle-return" @resume="resumeBattle" />
        <div v-else class="bpm-brand-lockup">
          <span class="bpm-brand-mark" aria-hidden="true"></span>
          <span class="bpm-brand-copy">
            <strong>AMAMI</strong>
            <small>MOBILE STORY ARCHIVE</small>
          </span>
          <span class="bpm-brand-live" :class="{ 'is-syncing': context.during_streaming }">
            <i aria-hidden="true"></i>
            {{ context.during_streaming ? 'SYNC' : 'LIVE' }}
          </span>
        </div>

        <div class="bpm-topbar-actions">
          <button
            type="button"
            class="bpm-view-toggle"
            :class="{ 'is-chat': narrativeViewMode === 'chat' }"
            :aria-pressed="narrativeViewMode === 'chat'"
            :aria-label="narrativeViewMode === 'chat' ? '切换到 GAL 模式' : '切换到气泡聊天模式'"
            @click="toggleNarrativeViewMode"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5.5 5.5h13v9h-7l-4.5 3v-3H5.5z" />
              <path d="M9 9h6M9 11.8h4" />
            </svg>
            <span>
              <strong>{{ narrativeViewMode === 'chat' ? '气泡' : 'GAL' }}</strong>
            </span>
          </button>
          <NarrativeTextSettings mobile />
        </div>
      </header>
      <nav class="bpm-utility-nav" aria-label="剧情功能">
        <button type="button" class="bpm-campus-map-trigger" aria-label="打开校园地图" @click="openCampusMap">
          <MapIcon name="map" />校园地图
        </button>
        <button type="button" class="bpm-talent-trigger" @click="openTalentStar">
          <AmamiMark aria-hidden="true" />天赋星盘
        </button>
        <button
          type="button"
          class="bpm-shittim-trigger"
          :class="{ 'is-active': isShittimOpen }"
          aria-controls="bpm-shittim-drawer"
          :aria-expanded="isShittimOpen"
          aria-label="打开什亭之匣"
          @click="openShittimDrawer"
        >
          <span class="bpm-shittim-trigger-mark" aria-hidden="true"><i></i></span>
          <span class="bpm-shittim-trigger-copy">
            <strong>什亭之匣</strong>
          </span>
          <b>{{ relationshipContactCount }}</b>
        </button>
      </nav>

      <section
        v-show="narrativeViewMode === 'gal'"
        class="bpm-stage"
        :aria-label="`${currentSegment?.presentation === 'cameo' ? konataCameo.name : portraitSpeakerName}的剧情立绘`"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
        @touchcancel="touchStart = null"
      >
        <div class="bpm-stage-background" aria-hidden="true">
          <img
            :key="stageSceneBackgroundUrl"
            class="bpm-stage-background-image"
            :src="stageSceneBackgroundUrl"
            alt=""
            decoding="async"
            @error="handleStageSceneBackgroundError"
          />
          <span class="bpm-stage-background-shade"></span>
        </div>

        <div class="bpm-stage-index" aria-hidden="true">
          <span>SCENE</span>
          <strong>{{ paddedCurrentIndex }}</strong>
        </div>

        <button
          type="button"
          :class="['bpm-cot-trigger', { 'is-empty': !hasThinkingContent }]"
          aria-label="打开思维链"
          @click="openThinkingPage"
        >
          <span class="bpm-cot-trigger-mark">COT</span>
          <span class="bpm-cot-trigger-copy">
            <small>TRACE</small>
            <strong>{{ hasThinkingContent ? '已捕获' : '未检出' }}</strong>
          </span>
          <i aria-hidden="true"></i>
        </button>

        <div class="bpm-halo" aria-hidden="true">
          <span></span>
        </div>

        <CameoStandee v-if="currentSegment?.presentation === 'cameo'" />
        <figure v-else-if="npcPortraitUrl !== null && !portraitUnavailable" class="bpm-portrait-figure">
          <img
            :key="npcPortraitUrl"
            class="bpm-portrait-image"
            :class="{ 'is-passive': currentSegment?.kind !== 'npc' }"
            :src="npcPortraitUrl"
            :alt="portraitSpeakerName"
            decoding="async"
            @load="applyPortraitFraming"
            @error="portraitUnavailable = true"
          />
        </figure>

        <div v-else class="bpm-portrait-placeholder" aria-hidden="true">
          <span class="bpm-placeholder-halo"></span>
          <span class="bpm-placeholder-head"></span>
          <span class="bpm-placeholder-body"></span>
          <small>PORTRAIT SIGNAL</small>
        </div>

        <div v-if="currentSegment?.presentation !== 'cameo'" class="bpm-character-chip">
          <span class="bpm-character-chip-kicker">FOCUS</span>
          <strong>{{ portraitSpeakerName }}</strong>
          <small>{{ portraitAffiliation }}</small>
        </div>

        <div class="bpm-stage-context" :aria-label="`${stageLocationLabel}，${stageTimeLabel}`">
          <span class="bpm-stage-context-item is-location">
            <small>LOCATION</small>
            <strong>{{ stageLocationLabel }}</strong>
          </span>
          <i aria-hidden="true"></i>
          <span class="bpm-stage-context-item is-time">
            <small>TIME</small>
            <strong>{{ stageTimeLabel }}</strong>
          </span>
        </div>

        <div class="bpm-stage-scanline" aria-hidden="true"></div>
      </section>

      <section
        v-show="narrativeViewMode === 'gal'"
        class="bpm-dialogue-shell"
        aria-live="polite"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
        @touchcancel="touchStart = null"
      >
        <div class="bpm-dialogue-accent" aria-hidden="true"></div>

        <div class="bpm-speaker-row">
          <div class="bpm-speaker-badge">
            <span>{{ activeSpeakerName }}</span>
          </div>
          <div class="bpm-speaker-meta">
            <span>{{ activeSpeakerAffiliation }}</span>
            <small>{{ activeMoodLabel }}</small>
          </div>
        </div>

        <div :key="currentSegment?.id ?? 'empty'" class="bpm-dialogue-copy">
          <p v-if="currentSegment !== null">
            <NarrativeRgbText :text="currentSegment.text" :rgb-spans="currentSegment.rgbSpans" />
          </p>
          <div v-else class="bpm-empty-copy">
            <strong>剧情信号同步中</strong>
            <span>等待可显示的正文段落。</span>
          </div>
        </div>

        <footer class="bpm-dialogue-footer">
          <div class="bpm-progress-copy">
            <span>{{ paddedCurrentIndex }}</span>
            <i></i>
            <span>{{ paddedSegmentCount }}</span>
          </div>

          <div class="bpm-dialogue-actions">
            <button type="button" aria-label="上一段剧情" :disabled="currentIndex <= 0" @click="retreatNarrative">
              <span aria-hidden="true">‹</span>
            </button>
            <button
              class="bpm-next-button"
              type="button"
              :disabled="segments.length === 0"
              :aria-label="isAtEnd ? '重新播放剧情' : '下一段剧情'"
              @click="advanceNarrative"
            >
              <span>{{ isAtEnd ? 'REPLAY' : 'NEXT' }}</span>
              <b aria-hidden="true">›</b>
            </button>
          </div>
        </footer>

        <div class="bpm-progress-rail" aria-hidden="true">
          <span :style="{ inlineSize: `${progressPercent}%` }"></span>
        </div>
      </section>

      <section v-if="narrativeViewMode === 'chat'" class="bpm-chat-stage">
        <div class="bpm-stage-context bpm-chat-stage-context" :aria-label="`${stageLocationLabel}，${stageTimeLabel}`">
          <span class="bpm-stage-context-item is-location">
            <small>LOCATION</small>
            <strong>{{ stageLocationLabel }}</strong>
          </span>
          <i aria-hidden="true"></i>
          <span class="bpm-stage-context-item is-time">
            <small>TIME</small>
            <strong>{{ stageTimeLabel }}</strong>
          </span>
        </div>

        <NarrativeBubbleThread
          :rows="chatRows"
          :active-segment-id="currentSegment?.id ?? null"
          :is-streaming="context.during_streaming"
          :scene-background-url="stageSceneBackgroundUrl"
          layout="mobile"
          @scene-error="handleStageSceneBackgroundError"
        />
      </section>

      <div class="bpm-safe-footer" aria-hidden="true">
        <span>BLUE ARCHIVE MOBILE FRAME</span>
        <i></i>
        <span>EMBED</span>
      </div>

      <Transition name="bpm-shittim">
        <div v-if="isShittimOpen" class="bpm-shittim-layer" role="presentation" @touchstart.stop @touchend.stop>
          <ShittimBattlePanel
            id="bpm-shittim-drawer"
            :present-contacts="presentRelationshipContacts"
            :contact-factions="contactFactions"
            :selected-contact="selectedRelationshipContact"
            :battle-pending="isStartingBattle"
            :battle-notice="battleLaunchNotice?.text ?? null"
            @close="closeShittimDrawer"
            @back="closeRelationshipContact"
            @select="openRelationshipContact"
            @start="startSelectedRelationshipBattle"
          />
        </div>
      </Transition>

      <Transition name="bpm-cot-page">
        <div
          v-if="isThinkingPageOpen"
          class="bpm-cot-layer"
          role="presentation"
          @click.self="closeThinkingPage"
          @touchstart.stop
          @touchend.stop
        >
          <section class="bpm-cot-page" role="dialog" aria-modal="true" aria-labelledby="bpm-cot-title">
            <header class="bpm-cot-page-header">
              <button type="button" class="bpm-cot-back" aria-label="关闭思维链" @click="closeThinkingPage">
                <span aria-hidden="true">‹</span>
                返回正文
              </button>
              <div class="bpm-cot-title-lockup">
                <span class="bpm-cot-title-mark" aria-hidden="true">COT</span>
                <span>
                  <small>THINKING TRACE</small>
                  <strong id="bpm-cot-title">思维链档案</strong>
                </span>
              </div>
              <span :class="['bpm-cot-status', { 'is-empty': !hasThinkingContent }]">
                {{ hasThinkingContent ? 'CAPTURED' : 'EMPTY' }}
              </span>
            </header>

            <div class="bpm-cot-page-body" aria-live="polite">
              <div class="bpm-cot-trace-head">
                <span>RAW THINK BLOCK</span>
                <i></i>
                <b>{{ hasThinkingContent ? `${thinkingContent.length} CHARS` : 'NO SIGNAL' }}</b>
              </div>
              <pre v-if="hasThinkingContent" class="bpm-cot-text">{{ thinkingContent }}</pre>
              <div v-else class="bpm-cot-empty">
                <span aria-hidden="true">∅</span>
                <strong>当前楼层没有思维链记录</strong>
                <p>未读取到 &lt;think&gt;、&lt;thinking&gt; 或兼容标签内容。</p>
              </div>
            </div>
          </section>
        </div>
      </Transition>
      <InlineBattleView v-if="inlineCombat?.opened" :key="inlineCombat.id" :session="inlineCombat" />
    </main>

    <details v-if="context.parallel_events?.length" class="bpm-support-panel bpm-parallel-panel">
      <summary>
        <strong>并行事件</strong><span>{{ context.parallel_events.length }} 条</span>
      </summary>
      <article v-for="(event, index) in context.parallel_events" :key="index">
        <strong>{{ event.character }}</strong>
        <p>{{ event.description }}</p>
      </article>
    </details>
    <StandaloneSupportPanel v-if="hasChoiceOptions || context.choice_analysis" kind="choices">
      <section
        v-if="hasChoiceOptions"
        :class="['bpm-support-panel', 'bpm-choice-panel', { 'is-collapsed': isChoicePanelCollapsed }]"
        aria-labelledby="bpm-choice-panel-title"
      >
        <span class="bpm-support-corner is-top-left" aria-hidden="true"></span>
        <span class="bpm-support-corner is-bottom-right" aria-hidden="true"></span>
        <header class="bpm-support-panel-header bpm-choice-panel-header">
          <span class="bpm-support-panel-index" aria-hidden="true">01</span>
          <span class="bpm-support-panel-heading">
            <small>SELECT ROUTE</small>
            <strong id="bpm-choice-panel-title">行动选项</strong>
          </span>
          <span class="bpm-support-panel-actions">
            <span class="bpm-support-panel-count">{{ allChoiceOptions.length }} ROUTES</span>
            <button
              type="button"
              class="bpm-panel-toggle"
              :aria-expanded="!isChoicePanelCollapsed"
              aria-controls="bpm-choice-panel-body"
              @click="isChoicePanelCollapsed = !isChoicePanelCollapsed"
            >
              {{ isChoicePanelCollapsed ? '展开' : '收起' }}
              <span aria-hidden="true">⌄</span>
            </button>
          </span>
        </header>

        <Transition name="bpm-panel-collapse">
          <div v-if="!isChoicePanelCollapsed" id="bpm-choice-panel-body" class="bpm-choice-panel-body">
            <div class="bpm-choice-route-track" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="bpm-choice-grid">
              <button
                v-for="entry in choiceOptionPartition.regular"
                :key="entry.key"
                type="button"
                :class="[
                  'bpm-choice-card',
                  `is-${getChoiceOptionTone(entry.displayIndex)}`,
                  { 'is-selected': selectedChoiceOptionKey === entry.key },
                ]"
                @click="handleChoiceOptionClick(entry)"
              >
                <span class="bpm-choice-label">{{ entry.option.label }}</span>
                <span class="bpm-choice-copy">
                  <small>ROUTE {{ String(entry.displayIndex + 1).padStart(2, '0') }}</small>
                  <strong>{{ entry.option.text }}</strong>
                </span>
                <span class="bpm-choice-state" aria-hidden="true">
                  {{ selectedChoiceOptionKey === entry.key ? '✓' : '›' }}
                </span>
              </button>

              <button
                v-if="choiceOptionPartition.sexBattle !== null"
                type="button"
                :class="[
                  'bpm-choice-card',
                  'is-battle',
                  { 'is-selected': selectedChoiceOptionKey === choiceOptionPartition.sexBattle.key },
                ]"
                :disabled="isLaunchingChoiceBattle"
                @click="handleSexBattleChoiceClick(choiceOptionPartition.sexBattle)"
              >
                <span class="bpm-choice-label">E</span>
                <span class="bpm-choice-copy">
                  <small>{{ isLaunchingChoiceBattle ? 'STARTING BATTLE' : 'SPECIAL ROUTE' }}</small>
                  <strong>{{
                    isLaunchingChoiceBattle ? '正在发起性斗…' : choiceOptionPartition.sexBattle.option.text
                  }}</strong>
                </span>
                <span class="bpm-choice-state" aria-hidden="true">⚔</span>
              </button>
            </div>

            <p v-if="choiceNotice !== null" :class="['bpm-choice-notice', `is-${choiceNotice.kind}`]">
              {{ choiceNotice.text }}
            </p>
          </div>
          <button
            v-else
            type="button"
            class="bpm-panel-collapsed-summary is-choice"
            @click="isChoicePanelCollapsed = false"
          >
            <span class="bpm-collapsed-signal" aria-hidden="true"><i></i></span>
            <span
              ><small>CURRENT ROUTE SIGNAL</small><strong>{{ selectedChoiceSummary }}</strong></span
            >
            <b>展开路线 ›</b>
          </button>
        </Transition>
      </section>
    </StandaloneSupportPanel>
    <StandaloneSupportPanel v-if="jsonPatchPanel !== null" kind="variables">
      <section
        v-if="jsonPatchPanel !== null"
        :class="['bpm-support-panel', 'bpm-variable-panel', { 'is-collapsed': isJsonPatchPanelCollapsed }]"
        aria-labelledby="bpm-variable-panel-title"
      >
        <span class="bpm-support-corner is-top-left" aria-hidden="true"></span>
        <span class="bpm-support-corner is-bottom-right" aria-hidden="true"></span>
        <header class="bpm-support-panel-header bpm-variable-panel-header">
          <span class="bpm-support-panel-index" aria-hidden="true">02</span>
          <span class="bpm-support-panel-heading">
            <small>VARIABLE MIRROR</small>
            <strong id="bpm-variable-panel-title">变量更新</strong>
          </span>
          <span class="bpm-support-panel-actions">
            <span class="bpm-support-panel-count">
              {{ jsonPatchPanel.operations.length > 0 ? `${jsonPatchPanel.operations.length} OPS` : 'RAW' }}
            </span>
            <button
              type="button"
              class="bpm-panel-toggle"
              :aria-expanded="!isJsonPatchPanelCollapsed"
              aria-controls="bpm-variable-panel-body"
              @click="isJsonPatchPanelCollapsed = !isJsonPatchPanelCollapsed"
            >
              {{ isJsonPatchPanelCollapsed ? '展开' : '收起' }}
              <span aria-hidden="true">⌄</span>
            </button>
          </span>
        </header>

        <Transition name="bpm-panel-collapse">
          <div v-if="!isJsonPatchPanelCollapsed" id="bpm-variable-panel-body" class="bpm-variable-panel-body">
            <div class="bpm-variable-timeline" aria-hidden="true"><i></i></div>
            <div v-if="jsonPatchPanel.operations.length > 0" class="bpm-variable-operation-list">
              <article
                v-for="operation in jsonPatchPanel.operations"
                :key="`${operation.index}-${operation.op}-${operation.path}`"
                :class="['bpm-variable-operation', `is-${operation.tone}`]"
              >
                <span class="bpm-variable-operation-op">{{ operation.opLabel }}</span>
                <span class="bpm-variable-operation-copy">
                  <small>{{ operation.pathTrail }}</small>
                  <strong>{{ operation.title }}</strong>
                  <span
                    ><b>{{ operation.valuePrefix }}</b
                    >{{ operation.valueText ?? operation.emptyValueText }}</span
                  >
                </span>
              </article>
            </div>
            <pre v-else class="bpm-variable-raw">{{ jsonPatchPanel.rawText }}</pre>

            <div v-if="jsonPatchPanel.operations.length" class="bpm-audit">
              <button
                type="button"
                class="bpm-panel-toggle"
                :disabled="jsonPatchAudit.status === 'checking'"
                @click="handleJsonPatchAuditClick"
              >
                {{ jsonPatchAudit.status === 'checking' ? '校对中…' : '校对变量' }}
              </button>
              <p v-if="jsonPatchAudit.summary" role="status">{{ jsonPatchAudit.summary }}</p>
              <ul v-if="jsonPatchAudit.items.length">
                <li v-for="item in jsonPatchAudit.items" :key="item.index">
                  <b>{{ item.label }}</b> {{ item.message }}
                </li>
              </ul>
              <details>
                <summary>查看原始补丁</summary>
                <pre class="bpm-variable-raw">{{ context.json_patch_blocks.at(-1) }}</pre>
              </details>
            </div>
          </div>
          <button
            v-else
            type="button"
            class="bpm-panel-collapsed-summary is-variable"
            @click="isJsonPatchPanelCollapsed = false"
          >
            <span class="bpm-collapsed-signal is-variable" aria-hidden="true"><i></i></span>
            <span
              ><small>LATEST PATCH</small><strong>{{ latestJsonPatchSummary }}</strong></span
            >
            <b>展开记录 ›</b>
          </button>
        </Transition>
      </section>
    </StandaloneSupportPanel>
    <CampusMapDialog
      v-if="isCampusMapOpen"
      :frame-element="mapFrameElement"
      :location-label="stageLocationLabel"
      :time-label="stageTimeLabel"
      @close="closeCampusMap"
    />
    <TalentStarView v-if="isTalentOpen" :frame-element="mapFrameElement" @close="closeTalentStar" />
  </div>
</template>

<script setup lang="ts">
import StandaloneSupportPanel from '../modules/StandaloneSupportPanel.vue';
import NarrativeRgbText from '../modules/NarrativeRgbText.vue';
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import VectorArt from '../vector/VectorArt.vue';
import AmamiMark from '../vector/AmamiMark.vue';
import CampusMapDialog from '../map/CampusMapDialog.vue';
import MapIcon from '../map/MapIcon.vue';
import TalentStarView from '../talent/TalentStarView.vue';
import InlineBattleView from '../battle/InlineBattleView.vue';
import ReturnToBattleButton from '../battle/ReturnToBattleButton.vue';
import { showInlineCombat, useInlineCombat } from '../battle/inline-session';
import { restoreFocus } from '../desktop/overlay-focus';
import ShittimBattlePanel from '../modules/ShittimBattlePanel.vue';
import { buildNarrativeChatRows } from '../engine/narrative-chat';
import type { NarrativeChatAvatarCandidate } from '../engine/narrative-chat';
import { stripDialogueMapBlocks } from '../engine/dialogue-map';
import { cleanTextKeepingTucao } from '../engine/tucao-cameo';
import { konataCameo, resolveCameoAvatarCandidates } from '../modules/cameo-profile';
import CameoStandee from '../modules/CameoStandee.vue';
import { splitDialogueSource } from '../engine/dialogue-splitter';
import { matchesUserIdentityName } from '../engine/user-identity';
import { getRelationshipAvatarUrl } from '../assets/relationship-avatar';
import { readPlayerIdentityId } from '../identity/selection';
import { resolveIdentityPortraitProfile } from '../identity/presentation';
import { deriveKnownCharactersForContent } from '../engine/known-characters';
import { readUserPortraitGender, readUserRoleName } from '../engine/tavern-variable-runtime';
import { startConfiguredSexBattle, startManualSexBattle } from '../engine/sex-battle-runtime';
import NarrativeBubbleThread from '../modules/NarrativeBubbleThread.vue';
import NarrativeTextSettings from '../modules/NarrativeTextSettings.vue';
import { applyPortraitFraming } from '../modules/portrait-framing';
import { useNarrativeViewMode } from '../modules/narrative-view-mode';
import {
  fullbodyPortraitProfiles,
  getFullbodyPortraitUrl,
  resolveFullbodyPortraitDisplayName,
  resolveFullbodyPortraitProfile,
  resolveUserPortraitProfile,
} from '../portrait-registry';
import type { FullbodyPortraitProfile } from '../portrait-registry';
import type { ContentRendererContext } from '../types/content-renderer';
import type { DialogueMood, DialogueSegment, DialogueSource } from '../types/narrative';
import {
  createChoiceOptionKey,
  parseJsonPatchPanel,
  partitionChoiceOptions,
  type ChoiceOptionEntry,
} from '../desktop/panel-runtime';
import { useJsonPatchAudit } from '../desktop/use-jsonpatch-audit';
import {
  createRelationshipContact,
  findRelationshipContact,
  groupContactsByFaction,
  readRelationshipSystemView,
  resolveRelationshipAvatarUrl,
  showTavernNotice,
  writeTextToTavernInput,
  focusTavernInput,
} from './relationship-runtime';
import type { RelationshipContact } from './relationship-runtime';
import { readMobileStageSceneView } from './scene-runtime';
import { useStageBackground } from '../modules/use-stage-background';

type BattleLaunchNotice = {
  kind: 'success' | 'warning' | 'error';
  text: string;
};

type ChoiceNotice = {
  kind: 'success' | 'warning' | 'error';
  text: string;
};

type TavernRuntime = typeof globalThis & {
  SillyTavern?: {
    name1?: string;
    name2?: string;
  };
  substitudeMacros?: (text: string) => string;
};

const context = inject<ContentRendererContext>('content_renderer_context');
if (context === undefined) {
  throw Error('[content-chat-renderer] missing content renderer context');
}

const runtime = globalThis as TavernRuntime;
const inlineCombat = useInlineCombat(context.message_id);
const USER_FULLBODY_PORTRAITS = {
  male: getFullbodyPortraitUrl('男主_黑西装校服_普通学生.png'),
  female: getFullbodyPortraitUrl('女主.png'),
};
const rootElement = ref<HTMLElement | null>(null);
const mapFrameElement = ref<HTMLElement | null>(null);
const currentIndex = ref(0);
const { narrativeViewMode, toggleNarrativeViewMode } = useNarrativeViewMode();
const portraitUnavailable = ref(false);
let touchStart: Touch | null = null;
const isShittimOpen = ref(false);
const isThinkingPageOpen = ref(false);
const isCampusMapOpen = ref(false);
const isTalentOpen = ref(false);
const campusMapReturnFocus = ref<HTMLElement | null>(null);
const talentReturnFocus = ref<HTMLElement | null>(null);
const selectedRelationshipContact = ref<RelationshipContact | null>(null);
const isStartingBattle = ref(false);
const battleLaunchNotice = ref<BattleLaunchNotice | null>(null);
const selectedChoiceOptionKey = ref<string | null>(null);
const choiceNotice = ref<ChoiceNotice | null>(null);
const isLaunchingChoiceBattle = ref(false);
const isChoicePanelCollapsed = ref(false);
let keyboardWindow: Window | null = null;

const userAlias = computed(() =>
  firstResolvedName([safeSubstituteMacros('{{user}}'), runtime.SillyTavern?.name1, '你']),
);
const userRoleName = computed(() => readUserRoleName(context.message_id, context.variable_revision ?? 0));
const userPortraitGender = computed(() => readUserPortraitGender(context.message_id, context.variable_revision ?? 0));
const userChatSpeakerName = computed(() => userRoleName.value ?? userAlias.value);
const userChatProfile = computed(() => {
  const identity = readPlayerIdentityId(context.message_id, context.variable_revision ?? 0);
  return identity === null
    ? resolveUserPortraitProfile(userChatSpeakerName.value)
    : resolveIdentityPortraitProfile(identity);
});
const userChatPortraitUrl = computed(
  () => userChatProfile.value?.portraitUrl ?? USER_FULLBODY_PORTRAITS[userPortraitGender.value],
);
const fallbackNpcName = computed(() =>
  resolveFullbodyPortraitDisplayName(
    firstResolvedName([safeSubstituteMacros('{{char}}'), runtime.SillyTavern?.name2, '角色']),
  ),
);
const mobileStageScene = computed(() => readMobileStageSceneView(context.message_id, context.variable_revision ?? 0));
const stageTimeLabel = computed(() => mobileStageScene.value.timeLabel);
const stageLocationLabel = computed(() => mobileStageScene.value.locationLabel);
const { stageSceneBackgroundUrl, handleSceneBackgroundError: handleStageSceneBackgroundError } =
  useStageBackground(mobileStageScene);
const contentText = computed(() =>
  cleanTextKeepingTucao(safeSubstituteMacros(context.content ?? ''), stripHiddenBlocks),
);
const thinkingContent = computed(() => (context.thinking_content ?? '').trim());
const hasThinkingContent = computed(() => thinkingContent.value.length > 0);
const isOverlayOpen = computed(() => isShittimOpen.value || isThinkingPageOpen.value || isCampusMapOpen.value);
const allChoiceOptions = computed(() => context.choice_options ?? []);
const choiceOptionPartition = computed(() => partitionChoiceOptions(allChoiceOptions.value));
const hasChoiceOptions = computed(() => allChoiceOptions.value.length > 0);
const jsonPatchPanel = computed(() => parseJsonPatchPanel(context.json_patch_blocks?.at(-1)));
const { jsonPatchAudit, isJsonPatchPanelCollapsed, handleJsonPatchAuditClick } = useJsonPatchAudit(
  context,
  jsonPatchPanel,
);
const selectedChoiceSummary = computed(() => {
  const selectedKey = selectedChoiceOptionKey.value;
  if (selectedKey === null) {
    return `${allChoiceOptions.value.length} 条路线等待选择`;
  }

  const selectedOption = allChoiceOptions.value.find(
    (option, index) => createChoiceOptionKey(option, index) === selectedKey,
  );
  return selectedOption === undefined
    ? `${allChoiceOptions.value.length} 条路线等待选择`
    : `${selectedOption.label} · ${selectedOption.text}`;
});
const latestJsonPatchSummary = computed(() => {
  const latestOperation = jsonPatchPanel.value?.operations.at(-1);
  if (latestOperation === undefined) {
    return '原始变量片段已捕获';
  }

  const valueSummary = latestOperation.valueText ?? latestOperation.emptyValueText;
  return `${latestOperation.opLabel} · ${latestOperation.title} · ${valueSummary}`;
});

const dialogueSource = computed<DialogueSource>(() => ({
  id: `mobile-content-message-${context.message_id}`,
  messageId: String(context.message_id),
  content: contentText.value,
  knownCharacters: uniqueNonEmpty([
    ...deriveKnownCharactersForContent(
      contentText.value,
      fallbackNpcName.value,
      userRoleName.value ?? userAlias.value,
      runtime.SillyTavern?.name1,
    ),
    ...(context.dialogue_map ?? []).flatMap(entry => [entry.speaker, entry.focus]),
  ]),
  userAliases: uniqueNonEmpty([
    '{{user}}',
    userRoleName.value,
    userAlias.value,
    runtime.SillyTavern?.name1,
    '你',
    '我',
  ]),
  primaryUserName: userRoleName.value ?? userAlias.value,
  secondaryUserNames: [],
  dialogueMap: context.dialogue_map ?? [],
  speakerInferenceMode: context.during_streaming || context.dialogue_map.length === 0 ? 'conservative' : 'normal',
}));

const splitResult = computed(() => splitDialogueSource(dialogueSource.value));
const segments = computed(() => splitResult.value.segments);
const currentSegment = computed(() => segments.value[currentIndex.value] ?? null);
const isAtEnd = computed(() => segments.value.length > 0 && currentIndex.value >= segments.value.length - 1);
const chatRows = computed(() =>
  buildNarrativeChatRows(segments.value, {
    resolveSpeakerName: resolveMobileChatSpeakerName,
    resolveAffiliation: resolveMobileChatAffiliation,
    resolveAvatarCandidates: resolveMobileChatAvatarCandidates,
  }),
);

const relationshipSystemView = computed(() =>
  readRelationshipSystemView(context.message_id, context.variable_revision ?? 0),
);
const presentRelationshipContacts = computed(() =>
  relationshipSystemView.value.presentNames.map(name => {
    return (
      findRelationshipContact(name, relationshipSystemView.value.contacts) ?? createRelationshipContact(name, null)
    );
  }),
);
const knownRelationshipContacts = computed(() =>
  relationshipSystemView.value.contacts.filter(
    contact =>
      !relationshipSystemView.value.presentNames.some(
        presentName => findRelationshipContact(presentName, [contact]) !== null,
      ),
  ),
);
const contactFactions = computed(() => groupContactsByFaction(knownRelationshipContacts.value));
const portraitSpeakerName = computed(() => {
  for (let index = currentIndex.value; index >= 0; index -= 1) {
    const speaker = resolveNpcSpeakerFromSegment(segments.value[index]);
    if (speaker !== null) {
      return speaker;
    }
  }

  return fallbackNpcName.value;
});

const portraitProfile = computed(() => resolveCharacterProfile(portraitSpeakerName.value));
const npcPortraitUrl = computed(() => portraitProfile.value?.portraitUrl ?? null);
const portraitAffiliation = computed(() => compactAffiliation(portraitProfile.value?.affiliation) ?? 'KIVOTOS');

const activeSpeakerName = computed(() => {
  const segment = currentSegment.value;
  if (segment === null || segment.kind === 'narration') {
    return '旁白';
  }

  if (segment.kind === 'user') {
    return userChatSpeakerName.value;
  }

  return resolveFullbodyPortraitDisplayName(normalizeVisibleSpeaker(segment.speaker) ?? portraitSpeakerName.value);
});

const activeSpeakerAffiliation = computed(() => {
  const segment = currentSegment.value;
  if (segment?.presentation === 'cameo') return '';
  if (segment === null || segment.kind === 'narration') {
    return 'STORY LOG';
  }

  if (segment.kind === 'user') {
    return 'PLAYER CHANNEL';
  }

  return compactAffiliation(resolveCharacterProfile(activeSpeakerName.value)?.affiliation) ?? 'KIVOTOS';
});

const activeMood = computed<DialogueMood>(() => {
  const segment = currentSegment.value;
  if (segment === null || segment.moodConfidence < 0.55) {
    return 'neutral';
  }

  return segment.mood;
});

const activeMoodLabel = computed(() => {
  const labels: Record<DialogueMood, string> = {
    neutral: 'CALM',
    happy: 'SMILE',
    angry: 'ALERT',
    surprised: 'NOTICE',
  };
  return labels[activeMood.value];
});

const paddedCurrentIndex = computed(() =>
  String(Math.min(currentIndex.value + 1, segments.value.length || 1)).padStart(2, '0'),
);
const paddedSegmentCount = computed(() => String(Math.max(segments.value.length, 1)).padStart(2, '0'));
const progressPercent = computed(() => {
  if (segments.value.length <= 1) {
    return segments.value.length === 0 ? 0 : 100;
  }

  return (currentIndex.value / (segments.value.length - 1)) * 100;
});

watch(
  () => splitResult.value.sourceContentHash,
  () => {
    currentIndex.value = Math.min(currentIndex.value, Math.max(segments.value.length - 1, 0));
  },
);

watch(npcPortraitUrl, () => {
  portraitUnavailable.value = false;
});

watch(
  stageLocationLabel,
  locationLabel => {
    context.set_variable_refresh_needed?.(locationLabel === '地点未同步');
  },
  { immediate: true },
);

watch(
  () => context.message_id,
  () => {
    isShittimOpen.value = false;
    isThinkingPageOpen.value = false;
    selectedRelationshipContact.value = null;
    battleLaunchNotice.value = null;
    selectedChoiceOptionKey.value = null;
    choiceNotice.value = null;
    isLaunchingChoiceBattle.value = false;
    isChoicePanelCollapsed.value = false;
    isJsonPatchPanelCollapsed.value = false;
  },
);

watch(
  () => context.json_patch_blocks?.at(-1),
  () => {
    isJsonPatchPanelCollapsed.value = false;
  },
);

onMounted(() => {
  keyboardWindow = rootElement.value?.ownerDocument.defaultView ?? null;
  keyboardWindow?.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  keyboardWindow?.removeEventListener('keydown', handleKeydown);
  keyboardWindow = null;
});

function openShittimDrawer() {
  if (isShittimOpen.value) {
    closeShittimDrawer();
    return;
  }

  isThinkingPageOpen.value = false;
  isShittimOpen.value = true;
  selectedRelationshipContact.value = null;
  battleLaunchNotice.value = null;
}

function openCampusMap(event: MouseEvent) {
  campusMapReturnFocus.value = event.currentTarget as HTMLElement | null;
  isCampusMapOpen.value = true;
}

function closeCampusMap(focusInput = false) {
  isCampusMapOpen.value = false;
  if (focusInput) nextTick(focusTavernInput);
  else restoreFocus(campusMapReturnFocus.value);
  campusMapReturnFocus.value = null;
}

function openTalentStar(event: MouseEvent) {
  talentReturnFocus.value = event.currentTarget as HTMLElement | null;
  isTalentOpen.value = true;
}

function closeTalentStar() {
  isTalentOpen.value = false;
  restoreFocus(talentReturnFocus.value);
  talentReturnFocus.value = null;
}

function closeShittimDrawer() {
  isShittimOpen.value = false;
  selectedRelationshipContact.value = null;
  battleLaunchNotice.value = null;
}

function openThinkingPage() {
  closeShittimDrawer();
  isThinkingPageOpen.value = true;
}

function closeThinkingPage() {
  isThinkingPageOpen.value = false;
}

function openRelationshipContact(contact: RelationshipContact) {
  selectedRelationshipContact.value = contact;
  battleLaunchNotice.value = null;
}

function closeRelationshipContact() {
  selectedRelationshipContact.value = null;
  battleLaunchNotice.value = null;
}

async function startSelectedRelationshipBattle() {
  const contact = selectedRelationshipContact.value;
  if (contact === null || isStartingBattle.value) return;

  isStartingBattle.value = true;
  battleLaunchNotice.value = null;

  try {
    const enemyName = await startManualSexBattle(context.message_id, contact.name);
    showTavernNotice(`已向 ${enemyName} 发起性斗。`, '发起性斗', 'success');
    closeShittimDrawer();
    resumeBattle();
  } catch (error) {
    console.error('[正文前端·手机] 发起性斗失败:', error);
    const message = error instanceof Error ? error.message : '未能打开战斗页面。';
    battleLaunchNotice.value = { kind: 'error', text: message };
    showTavernNotice(message, '发起性斗失败', 'error');
  } finally {
    isStartingBattle.value = false;
  }
}

function resumeBattle() {
  closeShittimDrawer();
  isThinkingPageOpen.value = false;
  isCampusMapOpen.value = false;
  isTalentOpen.value = false;
  showInlineCombat(context.message_id);
}

function getChoiceOptionTone(index: number) {
  return index % 2 === 0 ? 'cyan' : 'navy';
}

function handleChoiceOptionClick(entry: ChoiceOptionEntry) {
  const { option } = entry;
  const optionText = option.text.trim();
  if (optionText.length === 0) {
    return;
  }

  selectedChoiceOptionKey.value = entry.key;
  if (writeTextToTavernInput(optionText)) {
    choiceNotice.value = { kind: 'success', text: `已将选项 ${option.label} 填入酒馆输入框。` };
    return;
  }

  choiceNotice.value = { kind: 'warning', text: '没有找到酒馆输入框，选项暂未填入。' };
  showTavernNotice('未找到酒馆输入框，无法填入选项。', '选项填入失败', 'warning');
}

async function handleSexBattleChoiceClick(entry: ChoiceOptionEntry) {
  if (isLaunchingChoiceBattle.value) {
    return;
  }

  selectedChoiceOptionKey.value = entry.key;
  choiceNotice.value = null;
  isLaunchingChoiceBattle.value = true;

  try {
    const enemyName = await startConfiguredSexBattle(context.message_id);
    resumeBattle();
    choiceNotice.value = { kind: 'success', text: `已向 ${enemyName} 发起性斗。` };
    showTavernNotice(`已向 ${enemyName} 发起性斗。`, '发起性斗', 'success');
  } catch (error) {
    console.error('[正文前端·手机] 启动已配置性斗失败:', error);
    const message = error instanceof Error ? error.message : '未能打开战斗页面。';
    choiceNotice.value = { kind: 'error', text: message };
    showTavernNotice(message, '发起性斗失败', 'error');
  } finally {
    isLaunchingChoiceBattle.value = false;
  }
}

function advanceNarrative() {
  if (segments.value.length === 0) {
    return;
  }

  currentIndex.value = isAtEnd.value ? 0 : currentIndex.value + 1;
}

function retreatNarrative() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (inlineCombat.value?.visible) return;
  if (event.key === 'Escape' && isThinkingPageOpen.value) {
    event.preventDefault();
    closeThinkingPage();
    return;
  }

  if (event.key === 'Escape' && isShittimOpen.value) {
    event.preventDefault();
    if (selectedRelationshipContact.value !== null) {
      closeRelationshipContact();
    } else {
      closeShittimDrawer();
    }
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target !== null && target.closest('button, input, textarea, select, a, [contenteditable="true"]') !== null) {
    return;
  }

  if (isOverlayOpen.value || isTalentOpen.value) {
    return;
  }

  if (narrativeViewMode.value !== 'gal') {
    return;
  }

  if (event.key === 'ArrowRight' || event.key === ' ') {
    event.preventDefault();
    advanceNarrative();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    retreatNarrative();
  }
}

function handleTouchStart(event: TouchEvent) {
  touchStart = event.touches.length === 1 && !(event.target as Element).closest('button') ? event.touches[0] : null;
}

function handleTouchEnd(event: TouchEvent) {
  const start = touchStart;
  const end = event.changedTouches[0];
  touchStart = null;
  if (!start || !end || end.identifier !== start.identifier || event.touches.length) return;
  const distance = end.clientX - start.clientX;
  if (Math.abs(distance) < 44 || Math.abs(distance) <= Math.abs(end.clientY - start.clientY)) return;

  if (distance < 0) {
    advanceNarrative();
  } else {
    retreatNarrative();
  }
}

function resolveNpcSpeakerFromSegment(segment: DialogueSegment | null | undefined) {
  if (segment === null || segment === undefined || segment.presentation === 'cameo') {
    return null;
  }

  if (segment.focusSpeaker !== null && segment.focusSpeaker !== undefined && !isUserSpeaker(segment.focusSpeaker)) {
    return resolveFullbodyPortraitDisplayName(segment.focusSpeaker);
  }

  if (segment.kind === 'npc' && segment.speaker !== null && !isUserSpeaker(segment.speaker)) {
    return resolveFullbodyPortraitDisplayName(segment.speaker);
  }

  return null;
}

function isUserSpeaker(speaker: string) {
  return (
    ['{{user}}', '你', '我'].includes(speaker.trim()) || matchesUserIdentityName(speaker, userChatSpeakerName.value)
  );
}

function resolveMobileChatSpeakerName(segment: DialogueSegment) {
  if (segment.kind === 'user') {
    return userChatSpeakerName.value;
  }

  return resolveFullbodyPortraitDisplayName(
    normalizeVisibleSpeaker(segment.speaker) ?? resolveNpcSpeakerFromSegment(segment) ?? fallbackNpcName.value,
  );
}

function resolveMobileChatAffiliation(segment: DialogueSegment) {
  const profile =
    segment.kind === 'user' ? userChatProfile.value : resolveCharacterProfile(resolveMobileChatSpeakerName(segment));
  return compactAffiliation(profile?.affiliation);
}

function resolveMobileChatAvatarCandidates(segment: DialogueSegment): NarrativeChatAvatarCandidate[] {
  if (segment.presentation === 'cameo') return resolveCameoAvatarCandidates();
  const speakerName = resolveMobileChatSpeakerName(segment);
  const qAvatarUrl =
    segment.kind === 'user'
      ? getRelationshipAvatarUrl(userChatProfile.value)
      : resolveRelationshipAvatarUrl(speakerName);
  const portraitUrl =
    segment.kind === 'user' ? userChatPortraitUrl.value : (resolveCharacterProfile(speakerName)?.portraitUrl ?? null);

  return [
    ...(qAvatarUrl === null ? [] : [{ url: qAvatarUrl, kind: 'avatar' as const }]),
    ...(portraitUrl === null || portraitUrl.length === 0 ? [] : [{ url: portraitUrl, kind: 'portrait' as const }]),
  ];
}

function resolveCharacterProfile(speaker: string): FullbodyPortraitProfile | null {
  return resolveFullbodyPortraitProfile(speaker);
}

function safeSubstituteMacros(text: string) {
  try {
    return runtime.substitudeMacros?.(text) ?? text;
  } catch {
    return text;
  }
}

function firstResolvedName(values: Array<string | null | undefined>) {
  return uniqueNonEmpty(values).find(value => !value.includes('{{') && !value.includes('}}')) ?? '角色';
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim() ?? '').filter(value => value.length > 0)));
}

function normalizeVisibleSpeaker(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  if (normalized.length === 0 || normalized === '{{user}}' || normalized === '我' || normalized === '你') {
    return null;
  }

  return normalized;
}

function compactAffiliation(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  if (normalized.length === 0) {
    return null;
  }

  return normalized.split(/[→/]/)[0]?.trim() ?? normalized;
}

const HIDDEN_CONTENT_BLOCK_TAGS = new Set([
  'analysis',
  'draft',
  'generate_image',
  'image',
  'image_prompt',
  'img',
  'jsonpatch',
  'nai',
  'novelai',
  'option',
  'prompt',
  'prompts',
  'reasoning',
  'redacted_reasoning',
  'scratchpad',
  'sd',
  'stable_diffusion',
  'style',
  'sum',
  'think',
  'thinking',
  'updatevariable',
  'w2p',
]);

function stripKnownControlTagBlocks(text: string) {
  let result = text;
  let previous = '';
  const pairedTagPattern = /<([A-Za-z][\w:-]*)(?:\s+[^>]*)?>[\s\S]*?<\/\1>/gi;

  while (result !== previous) {
    previous = result;
    result = result.replace(pairedTagPattern, (match, tagName: string) =>
      HIDDEN_CONTENT_BLOCK_TAGS.has(tagName.toLowerCase()) ? '' : match,
    );
  }

  return result;
}

function stripHiddenBlocks(text: string) {
  const withoutKnownBlocks = stripKnownControlTagBlocks(
    stripDialogueMapBlocks(text)
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n'),
  );

  return withoutKnownBlocks
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, tag => (/^<\/?RGB\s*>$/i.test(tag) ? tag : ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
</script>

<style scoped>
.bpm-app-root.is-talent-open > :not(.amami-talent-portal),
.bpm-app-root.is-map-open > :not(.amami-campus-map-portal),
.bpm-app-root.is-battle-open > :not(.bp-inline-battle),
.bpm-app-root.is-shittim-open > :not(.bpm-shittim-layer) {
  visibility: hidden;
}
.bpm-campus-map-trigger,
.bpm-talent-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex-shrink: 0;
  min-width: 0;
  height: 44px;
  font: inherit;
  font-size: 13px;
  font-weight: 850;
  padding: 5px 8px;
  border: 1px solid #96c7f0;
  border-radius: 3px;
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  background: linear-gradient(180deg, #ffffff, #ebf6ff);
  color: #08144a;
  box-shadow: 2px 2px 0 rgba(22, 56, 232, 0.12);
  transition:
    background 150ms ease,
    color 150ms ease,
    border-color 150ms ease;
}
.bpm-campus-map-trigger svg,
.bpm-talent-trigger svg {
  width: 19px;
  height: 19px;
  stroke: #1638e8;
  stroke-width: 1.7;
}
.bpm-campus-map-trigger:hover,
.bpm-talent-trigger:hover {
  background: linear-gradient(125deg, #08144a, #1638e8);
  border-color: #24e2f8;
  color: #ffffff;
}
.bpm-campus-map-trigger:hover svg,
.bpm-talent-trigger:hover svg {
  stroke: #24e2f8;
}
.bpm-campus-map-trigger:focus-visible,
.bpm-talent-trigger:focus-visible {
  outline: 2px solid #24e2f8;
  outline-offset: 2px;
}
.bpm-talent-trigger {
  background: linear-gradient(145deg, #ffffff, #e3f2ff);
  color: #08144a;
}
.bpm-talent-trigger svg {
  width: 24px;
  height: 19px;
  fill: #1638e8;
  stroke: none;
}
.bpm-talent-trigger:hover svg {
  fill: #24e2f8;
}
.bpm-utility-nav {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 5px;
  padding-block: 4px 6px;
}
.bpm-utility-nav .bpm-shittim-trigger {
  min-inline-size: 0;
  min-block-size: 44px;
  justify-content: center;
}
.bpm-utility-nav .bpm-shittim-trigger-copy {
  display: inline;
}
.bpm-utility-nav .bpm-shittim-trigger-copy strong {
  font-size: 13px;
}
@container bp-reading-host (max-width: 360px) {
  .bpm-utility-nav .bpm-shittim-trigger-mark {
    display: none;
  }
}
</style>

<style src="./mobile.css"></style>
