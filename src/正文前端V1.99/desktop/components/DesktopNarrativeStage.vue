<template>
  <div
    v-if="isNarrativeMinimized"
    class="bp-narrative-minimized-stage"
    :inert="backgroundInert"
    :aria-hidden="backgroundInert ? 'true' : undefined"
  >
    <div class="bp-narrative-minidock">
      <button class="bp-narrative-minidock-restore" type="button" aria-label="恢复剧情舞台" @click="emit('restore')">
        <AronaAssistant class="bp-narrative-minidock-arona" />
        <span class="bp-narrative-minidock-kicker">SCENE</span>
        <span class="bp-narrative-minidock-location">{{ stageLocationLabel }}</span>
        <span class="bp-narrative-minidock-meta">{{ activeSpeakerName ?? '剧情待机' }}</span>
      </button>
      <button
        class="bp-narrative-minidock-battle"
        type="button"
        :aria-label="hasBattle ? '返回战斗' : '打开手动性斗'"
        @click="hasBattle ? emit('resume-battle') : emit('open-manual-battle', $event)"
      >
        <span class="bp-narrative-minidock-battle-mark" aria-hidden="true"></span>
        <span class="bp-narrative-minidock-battle-copy">
          <small>QUICK ACCESS</small>
          <strong>{{ hasBattle ? '返回战斗' : '手动性斗' }}</strong>
        </span>
      </button>
    </div>
  </div>

  <div
    class="bp-stage-frame"
    :class="{ 'has-battle': hasBattle }"
    :inert="backgroundInert"
    :aria-hidden="backgroundInert ? 'true' : undefined"
  >
    <VectorArt class="bp-stage-frame-image" />
    <ReturnToBattleButton v-if="hasBattle" class="bp-stage-battle-return" @resume="emit('resume-battle')" />
    <div class="bp-stage-utility-bay is-chest">
      <button
        class="bp-stage-function-ui-slot"
        type="button"
        aria-label="打开什亭之匣"
        @click="emit('open-function', $event)"
      >
        <span class="bp-stage-function-ui-shell" aria-hidden="true">
          <VectorArt kind="dock" class="bp-stage-function-ui" />
          <VectorArt kind="dialogue" class="bpv-compact-control-art" />
          <span class="bp-stage-function-ui-label">什亭之匣</span>
        </span>
      </button>
    </div>
    <div class="bp-stage-utility-bay is-trace">
      <button
        :class="['bp-stage-thinking-button', { 'is-empty': !hasThinkingContent }]"
        type="button"
        aria-label="打开思维链"
        @click="emit('open-thinking', $event)"
      >
        <VectorArt kind="trace" class="bp-stage-trace-ui" />
        <VectorArt kind="dialogue" class="bpv-compact-control-art" />
        <span class="bp-stage-thinking-copy" aria-hidden="true">
          <span class="bp-stage-thinking-dot"></span>
          <span class="bp-stage-thinking-button-mark">COT</span>
          <span class="bp-stage-thinking-button-text">思维链</span>
        </span>
      </button>
    </div>
    <div class="bp-stage-controls" role="group" aria-label="舞台显示控制">
      <button
        type="button"
        class="bp-stage-view-toggle"
        :class="{ 'is-chat': narrativeViewMode === 'chat' }"
        :aria-pressed="narrativeViewMode === 'chat'"
        :aria-label="narrativeViewMode === 'chat' ? '切换到 GAL 模式' : '切换到气泡聊天模式'"
        @click="emit('toggle-view-mode')"
      >
        <StageControlPlate variant="primary" :active="narrativeViewMode === 'chat'" />
        <span class="bp-stage-ctrl-inner">
          <span class="bp-stage-view-toggle-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M5 5.5h14v9.5h-7.2L7.2 18.5V15H5z" />
              <path d="M8.8 9.2h6.4M8.8 12h4.2" />
            </svg>
          </span>
          <span class="bp-stage-view-toggle-copy">
            <strong>{{ narrativeViewMode === 'chat' ? '气泡' : 'GAL' }}</strong>
          </span>
        </span>
      </button>
      <NarrativeTextSettings />
      <button
        class="bp-stage-collapse-trigger"
        type="button"
        aria-label="缩小剧情舞台"
        aria-controls="bp-narrative-panel"
        @click="emit('minimize')"
      >
        <StageControlPlate />
        <span class="bp-stage-ctrl-inner">
          <svg class="bp-stage-collapse-trigger-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6.5 6.5h11.5M4 12h16M10 17.5h10" />
          </svg>
          <span class="bp-stage-view-toggle-copy">
            <strong class="bp-stage-collapse-trigger-label">最小化</strong>
          </span>
        </span>
      </button>
    </div>
    <div class="bp-stage-frame-info bp-stage-frame-info--time">{{ stageTimeLabel }}</div>
    <div class="bp-stage-frame-info bp-stage-frame-info--location">{{ stageLocationLabel }}</div>
    <StageMapButton
      v-if="!isNarrativeMinimized"
      @open="emit('open-map', $event)"
      @open-talent="emit('open-talent', $event)"
    />
  </div>

  <div
    v-if="narrativeViewMode === 'gal'"
    class="bp-galgame-screen"
    :class="{ 'is-cameo-turn': currentSegment?.presentation === 'cameo' }"
    :inert="backgroundInert"
    :aria-hidden="backgroundInert ? 'true' : undefined"
  >
    <div class="bp-galgame-scene-bg" aria-hidden="true">
      <img
        class="bp-scene-background-image"
        :src="stageSceneBackgroundUrl"
        alt=""
        decoding="async"
        @error="emit('scene-error')"
      />
      <div class="bp-scene-overlay"></div>
    </div>

    <div v-show="currentSegment?.presentation !== 'cameo'" class="bp-galgame-sprites">
      <div
        id="bp-galgame-user-sprite"
        :class="[
          'bp-actor-sprite',
          'is-user',
          {
            'is-active': isCurrentUserSpeaking,
            'is-muted': isCurrentNpcSpeaking,
          },
        ]"
        role="button"
        tabindex="0"
        :aria-label="`查看${userAlias}立绘`"
        @click="emit('preview-portrait', 'user', $event)"
        @keydown.enter="emit('preview-portrait', 'user', $event)"
        @keydown.space.prevent="emit('preview-portrait', 'user', $event)"
      >
        <img
          v-for="layer in userPortraitLayers"
          :key="layer.id"
          class="bp-actor-portrait"
          :class="{ 'is-visible': layer.src === userPortraitUrl }"
          :src="layer.src"
          :alt="layer.src === userPortraitUrl ? `${userAlias} 立绘占位` : ''"
          :aria-hidden="layer.src === userPortraitUrl ? undefined : 'true'"
          decoding="sync"
          loading="eager"
          @load="applyPortraitFraming"
          @error="emit('portrait-error', $event, layer.fallbackUrls)"
        />
      </div>

      <div
        id="bp-galgame-npc-sprite"
        :class="[
          'bp-actor-sprite',
          'is-npc',
          {
            'is-active': isCurrentNpcSpeaking,
            'is-muted': isCurrentUserSpeaking,
          },
        ]"
        role="button"
        tabindex="0"
        :aria-label="`查看${portraitNpcLabel ?? '角色'}立绘`"
        @click="emit('preview-portrait', 'npc', $event)"
        @keydown.enter="emit('preview-portrait', 'npc', $event)"
        @keydown.space.prevent="emit('preview-portrait', 'npc', $event)"
      >
        <img
          v-for="layer in npcPortraitLayers"
          :key="layer.id"
          class="bp-actor-portrait"
          :class="{ 'is-visible': layer.src === npcPortraitUrl }"
          :src="layer.src"
          :alt="layer.src === npcPortraitUrl ? `${portraitNpcLabel ?? '角色'} 立绘占位` : ''"
          :aria-hidden="layer.src === npcPortraitUrl ? undefined : 'true'"
          decoding="sync"
          loading="eager"
          @load="applyPortraitFraming"
          @error="emit('portrait-error', $event, layer.fallbackUrls)"
        />
      </div>
    </div>

    <CameoStandee v-if="currentSegment?.presentation === 'cameo'" />
    <div
      class="bp-galgame-dialog-area"
      :class="{
        'is-user-turn': isCurrentUserSpeaking,
        'is-npc-turn': isCurrentNpcSpeaking,
      }"
      role="region"
      aria-live="polite"
      aria-label="当前剧情段落"
    >
      <div v-if="currentSegment !== null && activeSpeakerName !== null" class="bp-speaker-tag">
        <span class="bp-speaker-name">
          <DialogueVectorPlate variant="speaker" />
          <span class="bp-speaker-name-text">{{ activeSpeakerName }}</span>
        </span>
        <span v-if="activeSpeakerAffiliation !== null" class="bp-speaker-affiliation">
          <DialogueVectorPlate variant="affiliation" />
          <span class="bp-speaker-affiliation-text">{{ activeSpeakerAffiliation }}</span>
        </span>
      </div>

      <template v-if="currentSegment !== null">
        <div
          :class="[
            'bp-dialogue-panel',
            {
              'is-user-turn': isCurrentUserSpeaking,
              'is-npc-turn': isCurrentNpcSpeaking,
            },
          ]"
          :style="{
            '--bp-dialogue-progress': `${segmentCount > 0 ? Math.min(100, Math.max(0, ((currentIndex + 1) / segmentCount) * 100)) : 0}%`,
          }"
        >
          <div class="bp-dialogue-copy">
            <p class="bp-dialogue-text">
              <NarrativeRgbText :text="currentSegment.text" :rgb-spans="currentSegment.rgbSpans" dark />
            </p>

            <div class="bp-dialogue-rail">
              <div class="bp-dialogue-meta-strip">
                <div class="bp-dialogue-preview-row" aria-label="段落切换">
                  <button
                    v-for="(segment, idx) in previewSegments"
                    :id="`bp-dialogue-preview-${segment.id}`"
                    :key="segment.id"
                    type="button"
                    :class="['bp-dialogue-preview-chip', { 'is-active': segment.id === currentSegment.id }]"
                    :aria-current="segment.id === currentSegment.id ? 'step' : undefined"
                    :aria-label="`跳到第 ${idx + 1} 段（${segmentSpeakerLabel(segment)}）`"
                    :title="segmentSpeakerLabel(segment)"
                    @click="emit('jump-segment', segment.id)"
                  >
                    <DialogueVectorPlate variant="chip" :active="segment.id === currentSegment.id" />
                    <span class="bp-dialogue-preview-chip-label">{{ segmentSpeakerLabel(segment) }}</span>
                  </button>
                </div>
              </div>

              <div class="bp-dialogue-actions">
                <button
                  id="bp-dialogue-prev-button"
                  type="button"
                  class="bp-button bp-dialogue-next-button is-previous"
                  :disabled="currentIndex <= 0"
                  @click="emit('previous')"
                >
                  <DialogueVectorPlate variant="prev" />
                  <span class="bp-dialogue-btn-inner">
                    <svg class="bp-dialogue-btn-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M10.5 3.2 5.6 8l4.9 4.8" />
                      <path d="M6.8 5.2 4 8l2.8 2.8" opacity=".48" />
                    </svg>
                    <span>上一段</span>
                  </span>
                </button>

                <span class="bp-dialogue-counter">
                  <DialogueVectorPlate variant="counter" />
                  <span class="bp-dialogue-counter-inner">
                    <span class="bp-dialogue-counter-cur">{{ String(currentIndex + 1).padStart(2, '0') }}</span>
                    <span class="bp-dialogue-counter-sep" aria-hidden="true">/</span>
                    <span class="bp-dialogue-counter-total">{{ String(segmentCount).padStart(2, '0') }}</span>
                  </span>
                </span>

                <button
                  v-if="!isAtEnd"
                  id="bp-dialogue-next-button"
                  type="button"
                  class="bp-button bp-dialogue-next-button"
                  @click="emit('next')"
                >
                  <DialogueVectorPlate variant="next" />
                  <span class="bp-dialogue-btn-inner">
                    <span>下一段</span>
                    <svg class="bp-dialogue-btn-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M5.5 3.2 10.4 8l-4.9 4.8" />
                      <path d="M9.2 5.2 12 8l-2.8 2.8" opacity=".48" />
                    </svg>
                  </span>
                </button>

                <button
                  v-else
                  id="bp-dialogue-reverse-button"
                  type="button"
                  class="bp-button bp-dialogue-next-button is-restart"
                  @click="emit('reverse')"
                >
                  <DialogueVectorPlate variant="restart" />
                  <span class="bp-dialogue-btn-inner">
                    <span>重开</span>
                    <svg class="bp-dialogue-btn-arrow is-loop" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M12.5 7.8a4.6 4.6 0 1 1-1.3-3.2" />
                      <path d="M11.6 2.5v2.6H9" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="bp-empty-state">没有可显示的正文段落</div>
    </div>
  </div>

  <div v-else class="bp-chat-screen" :inert="backgroundInert" :aria-hidden="backgroundInert ? 'true' : undefined">
    <NarrativeBubbleThread
      :rows="chatRows"
      :active-segment-id="currentSegment?.id ?? null"
      :is-streaming="isStreaming"
      :scene-background-url="stageSceneBackgroundUrl"
      layout="desktop"
      @scene-error="emit('scene-error')"
    />
  </div>
</template>

<script setup lang="ts">
import CameoStandee from '../../modules/CameoStandee.vue';
import type { NarrativeChatRow } from '../../engine/narrative-chat';
import StageMapButton from './StageMapButton.vue';
import StageControlPlate from '../../vector/StageControlPlate.vue';
import DialogueVectorPlate from '../../vector/DialogueVectorPlate.vue';
import VectorArt from '../../vector/VectorArt.vue';
import AronaAssistant from '../../modules/AronaAssistant.vue';
import NarrativeBubbleThread from '../../modules/NarrativeBubbleThread.vue';
import NarrativeRgbText from '../../modules/NarrativeRgbText.vue';
import NarrativeTextSettings from '../../modules/NarrativeTextSettings.vue';
import { applyPortraitFraming } from '../../modules/portrait-framing';
import ReturnToBattleButton from '../../battle/ReturnToBattleButton.vue';
import type { DialogueSegment, NarrativeViewMode } from '../../types/narrative';
import type { PortraitLayer, PortraitPreviewSide } from '../types';

defineProps<{
  backgroundInert: boolean;
  hasBattle?: boolean;
  isNarrativeMinimized: boolean;
  stageLocationLabel: string;
  activeSpeakerName: string | null;
  hasThinkingContent: boolean;
  stageTimeLabel: string;
  stageSceneBackgroundUrl: string;
  userPortraitLayers: PortraitLayer[];
  userPortraitUrl: string | null;
  isCurrentUserSpeaking: boolean;
  userAlias: string;
  npcPortraitLayers: PortraitLayer[];
  npcPortraitUrl: string | null;
  isCurrentNpcSpeaking: boolean;
  portraitNpcLabel: string | null;
  currentSegment: DialogueSegment | null;
  activeSpeakerAffiliation: string | null;
  previewSegments: DialogueSegment[];
  currentIndex: number;
  isAtEnd: boolean;
  segmentCount: number;
  segmentSpeakerLabel: (segment: DialogueSegment) => string;
  narrativeViewMode: NarrativeViewMode;
  chatRows: NarrativeChatRow[];
  isStreaming: boolean;
}>();

const emit = defineEmits<{
  restore: [];
  minimize: [];
  'open-manual-battle': [event: MouseEvent];
  'open-function': [event: MouseEvent];
  'open-thinking': [event: MouseEvent];
  'open-map': [event: MouseEvent];
  'open-talent': [event: MouseEvent];
  'scene-error': [];
  'preview-portrait': [side: PortraitPreviewSide, event: Event];
  'portrait-error': [event: Event, fallbackUrls: string[]];
  'jump-segment': [segmentId: string];
  previous: [];
  next: [];
  reverse: [];
  'toggle-view-mode': [];
  'resume-battle': [];
}>();
</script>
