<template>
  <div
    v-if="isNarrativeMinimized"
    class="bp-narrative-minimized-stage"
    :inert="backgroundInert"
    :aria-hidden="backgroundInert ? 'true' : undefined"
  >
    <button class="bp-narrative-minidock" type="button" aria-label="恢复剧情舞台" @click="emit('restore')">
      <img class="bp-narrative-minidock-arona" :src="minimizedAronaUrl" alt="" decoding="async" />
      <span class="bp-narrative-minidock-kicker">SCENE</span>
      <span class="bp-narrative-minidock-location">{{ stageLocationLabel }}</span>
      <span class="bp-narrative-minidock-meta">{{ activeSpeakerName ?? '剧情待机' }}</span>
    </button>
  </div>

  <div class="bp-stage-frame" :inert="backgroundInert" :aria-hidden="backgroundInert ? 'true' : undefined">
    <img class="bp-stage-frame-image" :src="frameBackgroundUrl" alt="" decoding="async" />
    <button
      class="bp-stage-minimize-button"
      type="button"
      aria-label="最小化剧情舞台"
      aria-controls="bp-narrative-panel"
      @click="emit('minimize')"
    >
      <span class="bp-stage-minimize-mark" aria-hidden="true"></span>
    </button>
    <button
      class="bp-stage-function-ui-slot"
      type="button"
      aria-label="打开什亭之匣"
      @click="emit('open-function', $event)"
    >
      <span class="bp-stage-function-ui-shell" aria-hidden="true">
        <img class="bp-stage-function-ui" :src="functionUiUrl" alt="" decoding="async" />
        <span class="bp-stage-function-ui-label">什亭之匣</span>
      </span>
    </button>
    <button
      :class="['bp-stage-thinking-button', { 'is-empty': !hasThinkingContent }]"
      type="button"
      aria-label="打开思维链"
      @click="emit('open-thinking', $event)"
    >
      <span class="bp-stage-thinking-button-mark">COT</span>
      <span class="bp-stage-thinking-button-text">思维链</span>
    </button>
    <div class="bp-stage-frame-info bp-stage-frame-info--time">{{ stageTimeLabel }}</div>
    <div class="bp-stage-frame-info bp-stage-frame-info--location">{{ stageLocationLabel }}</div>
  </div>

  <div class="bp-galgame-screen" :inert="backgroundInert" :aria-hidden="backgroundInert ? 'true' : undefined">
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

    <div class="bp-galgame-sprites">
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
        :aria-label="`查看${userAlias} 512宽立绘`"
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
        :aria-label="`查看${portraitNpcLabel ?? '角色'} 512宽立绘`"
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
          @error="emit('portrait-error', $event, layer.fallbackUrls)"
        />
      </div>
    </div>

    <div class="bp-galgame-dialog-area" role="region" aria-live="polite" aria-label="当前剧情段落">
      <div v-if="currentSegment !== null && activeSpeakerName !== null" class="bp-speaker-tag">
        <span class="bp-speaker-name">{{ activeSpeakerName }}</span>
        <span v-if="activeSpeakerAffiliation !== null" class="bp-speaker-affiliation">{{
          activeSpeakerAffiliation
        }}</span>
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
        >
          <div class="bp-dialogue-copy">
            <p class="bp-dialogue-text">{{ currentSegment.text }}</p>

            <div class="bp-dialogue-rail">
              <div class="bp-dialogue-meta-strip">
                <span class="bp-dialogue-counter">{{ currentIndex + 1 }} / {{ segmentCount }}</span>

                <div class="bp-dialogue-preview-row" aria-label="段落切换">
                  <button
                    v-for="segment in previewSegments"
                    :id="`bp-dialogue-preview-${segment.id}`"
                    :key="segment.id"
                    type="button"
                    :class="['bp-dialogue-preview-chip', { 'is-active': segment.id === currentSegment.id }]"
                    :aria-current="segment.id === currentSegment.id ? 'step' : undefined"
                    :aria-label="`跳到${segmentSpeakerLabel(segment)}的段落`"
                    @click="emit('jump-segment', segment.id)"
                  >
                    <span>{{ segmentSpeakerLabel(segment) }}</span>
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
                  上一段
                </button>

                <button
                  v-if="!isAtEnd"
                  id="bp-dialogue-next-button"
                  type="button"
                  class="bp-button bp-dialogue-next-button"
                  @click="emit('next')"
                >
                  下一段
                </button>

                <button
                  v-else
                  id="bp-dialogue-reverse-button"
                  type="button"
                  class="bp-button bp-dialogue-next-button is-restart"
                  @click="emit('reverse')"
                >
                  重开
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="bp-empty-state">没有可显示的正文段落</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DialogueSegment } from '../../types/narrative';
import type { PortraitLayer, PortraitPreviewSide } from '../types';

defineProps<{
  backgroundInert: boolean;
  isNarrativeMinimized: boolean;
  minimizedAronaUrl: string;
  stageLocationLabel: string;
  activeSpeakerName: string | null;
  frameBackgroundUrl: string;
  functionUiUrl: string;
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
}>();

const emit = defineEmits<{
  restore: [];
  minimize: [];
  'open-function': [event: MouseEvent];
  'open-thinking': [event: MouseEvent];
  'scene-error': [];
  'preview-portrait': [side: PortraitPreviewSide, event: Event];
  'portrait-error': [event: Event, fallbackUrls: string[]];
  'jump-segment': [segmentId: string];
  previous: [];
  next: [];
  reverse: [];
}>();
</script>
