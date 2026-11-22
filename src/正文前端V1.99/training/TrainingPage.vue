<template>
  <section class="amami-training" aria-label="特训与特殊战" @keydown="handleKeydown">
    <TrainingBackdrop />
    <header class="amami-training-header">
      <button
        ref="backButton"
        type="button"
        class="amami-training-back"
        aria-label="返回校园地图"
        @click="emit('back')"
      >
        <MapIcon name="back" /><span>返回</span>
      </button>
      <div class="amami-training-heading">
        <span></span>
        <h1>特训与特殊战</h1>
      </div>
      <div class="amami-training-modes" role="group" aria-label="挑战类型">
        <button type="button" :aria-pressed="mode === 'training'" @click="mode = 'training'">
          <MapIcon name="target" />特训
        </button>
        <button type="button" :aria-pressed="mode === 'special'" @click="mode = 'special'">
          <MapIcon name="battle" />特殊战
        </button>
      </div>
    </header>

    <div class="amami-training-scene">
      <div class="amami-training-character" aria-hidden="true">
        <img :src="trainingDisplayCharacter.fullbodyUrl" alt="" draggable="false" />
      </div>

      <nav class="amami-training-stages" aria-label="预留关卡">
        <div class="amami-training-stages-heading">
          <span>{{ modeLabel }}</span
          ><small>选择挑战</small><i></i>
        </div>
        <button
          type="button"
          class="amami-training-step is-previous"
          aria-label="上一个关卡"
          :disabled="selectedIndex === 0"
          @click="move(-1)"
        >
          <svg viewBox="0 0 48 28" aria-hidden="true"><path d="m5 22 19-16 19 16m-38 0 19-8 19 8" /></svg>
        </button>
        <div class="amami-training-stage-list">
          <button
            v-for="(stage, index) in stages"
            :key="stage.id"
            type="button"
            class="amami-training-stage"
            :class="{ 'is-selected': selectedIndex === index }"
            :aria-pressed="selectedIndex === index"
            :data-stage-id="stage.id"
            @click="selectedIndex = index"
          >
            <svg class="amami-training-stage-frame" viewBox="0 0 420 140" preserveAspectRatio="none" aria-hidden="true">
              <path class="amami-training-stage-fill" d="M18 1h384l17 17v104l-17 17H18L1 122V18Z" />
              <path class="amami-training-stage-rim" d="M21 7h378l14 14v98l-14 14H21L7 119V21Z" />
              <path class="amami-training-stage-edge" d="M18 1h384l17 17v104l-17 17H18L1 122V18Z" />
            </svg>
            <TrainingEmblem :kind="stage.emblem" />
            <span class="amami-training-stage-copy"
              ><small>{{ modeLabel }} · {{ formatNumber(index + 1) }}</small
              ><strong>{{ stage.title }}</strong
              ><span>预留关卡</span></span
            >
            <span class="amami-training-stage-number" aria-hidden="true">{{ formatNumber(index + 1) }}</span>
            <span v-if="selectedIndex === index" class="amami-training-stage-selected" aria-hidden="true"></span>
          </button>
        </div>
        <button
          type="button"
          class="amami-training-step is-next"
          aria-label="下一个关卡"
          :disabled="selectedIndex === stages.length - 1"
          @click="move(1)"
        >
          <svg viewBox="0 0 48 28" aria-hidden="true"><path d="m5 6 19 16L43 6M5 6l19 8L43 6" /></svg>
        </button>
        <div class="amami-training-pagination">
          <span v-for="(_, index) in stages" :key="index" :class="{ active: selectedIndex === index }"></span
          ><small>{{ formatNumber(selectedIndex + 1) }} / {{ formatNumber(stages.length) }}</small>
        </div>
      </nav>

      <div class="amami-training-feature-mark" aria-hidden="true"><TrainingEmblem :kind="selectedStage.emblem" /></div>
      <div class="amami-training-character-caption">
        <span>看板娘</span><strong>{{ trainingDisplayCharacter.name }}</strong>
      </div>
      <section class="amami-training-feature" aria-live="polite" aria-label="当前关卡">
        <div :key="selectedStage.id" class="amami-training-feature-name">
          <span>{{ modeLabel }} · 第 {{ formatNumber(selectedIndex + 1) }} 关</span>
          <h2>{{ selectedStage.title }}</h2>
          <div class="amami-training-feature-rule"><i></i><small>关卡待编排</small><i></i></div>
        </div>
        <div class="amami-training-launch">
          <span><i></i>预留挑战入口</span
          ><button type="button" disabled>
            <MapIcon name="battle" /><strong>挑战准备中</strong><MapIcon name="chevron" />
          </button>
        </div>
      </section>
    </div>
    <footer class="amami-training-footer"><span>特训与特殊战</span><span>关卡预览</span></footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import MapIcon from '../map/MapIcon.vue';
import TrainingBackdrop from './TrainingBackdrop.vue';
import TrainingEmblem from './TrainingEmblem.vue';
import { trainingStages, trainingDisplayCharacter, type TrainingMode } from './catalog';

const emit = defineEmits<{ back: [] }>();
const backButton = ref<HTMLButtonElement | null>(null);
const mode = ref<TrainingMode>('special');
const selectedIndex = ref(1);
const stages = computed(() => trainingStages[mode.value]);
const selectedStage = computed(() => stages.value[selectedIndex.value]);
const modeLabel = computed(() => (mode.value === 'training' ? '特训' : '特殊战'));
const formatNumber = (value: number) => value.toString().padStart(2, '0');
function move(offset: number) {
  selectedIndex.value = Math.max(0, Math.min(stages.value.length - 1, selectedIndex.value + offset));
}
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('back');
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    move(event.key === 'ArrowUp' ? -1 : 1);
  }
}
onMounted(() => backButton.value?.focus({ preventScroll: true }));
</script>
