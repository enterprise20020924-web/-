<template>
  <div class="shittim-parameter-panel" :class="{ 'is-collapsed': !expanded }">
    <button
      class="parameter-toggle"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="panelId"
      :aria-label="expanded ? '收起基础属性，查看立绘' : '展开基础属性'"
      @click="emit('toggle')"
    >
      <svg class="parameter-heading-paper" viewBox="0 0 590 48" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient :id="`${panelId}-head-bg`" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stop-color="#0f25a8" stop-opacity=".96" />
            <stop offset="100%" stop-color="#071066" stop-opacity=".95" />
          </linearGradient>
        </defs>
        <path d="M12 0H590L587 48H10Z" :fill="`url(#${panelId}-head-bg)`" />
        <path d="M12 0H590L586 5H8Z" fill="#3bf4f5" />
        <path d="M12 0H52L49 5H8Z" fill="#ff354f" />
        <path d="M10 47.2H587" stroke="#42f3ee" stroke-opacity=".35" stroke-width="1.2" />
      </svg>
      <span class="parameter-heading">PARAMETERS</span>
      <span class="parameter-caption">基础属性</span>
      <span class="parameter-action">{{ expanded ? '收起' : '展开' }}</span>
      <svg class="parameter-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 7-7 7 7" /></svg>
    </button>
    <div v-show="expanded" :id="panelId" class="parameter-body">
      <svg viewBox="0 0 590 280" class="shittim-parameter-svg" role="img" :aria-label="accessibleLabel">
        <defs>
          <linearGradient :id="`${panelId}-body-bg`" x1="0" y1="0" x2="0.1" y2="1">
            <stop offset="0%" stop-color="#0b158d" stop-opacity=".95" />
            <stop offset="100%" stop-color="#050a57" stop-opacity=".96" />
          </linearGradient>
          <linearGradient :id="`${panelId}-bar-fill`" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#1596ff" />
            <stop offset="62%" stop-color="#29eef2" />
            <stop offset="100%" stop-color="#84fffb" />
          </linearGradient>
        </defs>
        <path
          d="M10 0H587L568 280H0Z"
          :fill="`url(#${panelId}-body-bg)`"
          stroke="#42f3ee"
          stroke-opacity=".28"
          stroke-width="1.5"
        />
        <g v-for="(stat, index) in rows" :key="stat.key" class="parameter-row" :transform="`translate(0 ${4 + index * 44})`">
          <title>{{ stat.label }}：{{ stat.display }}；条形以资料库同项最高值 {{ stat.maximum }} 对照。</title>
          <path class="parameter-row-bg" d="M12 1H581L578 41H9Z" />
          <text x="24" y="23" class="parameter-label">{{ stat.label }}</text>
          <text x="202" y="25" text-anchor="end" class="parameter-value">{{ stat.display }}</text>
          <path d="M227 9H562L557 26H222Z" fill="#030843" stroke="#2c53a8" stroke-opacity=".45" stroke-width="1" />
          <g opacity=".34" stroke="#5e87db" stroke-width="1">
            <path v-for="tick in 4" :key="tick" :d="`M${227 + tick * 67} 9l-5 17`" />
          </g>
          <path
            v-if="stat.value !== undefined && stat.value > 0"
            :d="barPath(stat.value, stat.maximum)"
            :fill="`url(#${panelId}-bar-fill)`"
          />
          <path
            v-if="stat.value !== undefined && stat.value > 0"
            :d="capPath(stat.value, stat.maximum)"
            fill="#f4ff79"
          />
          <path
            v-if="stat.value !== undefined && stat.value > 0"
            :d="glintPath(stat.value, stat.maximum)"
            fill="#ffffff"
            opacity=".72"
          />
        </g>
      </svg>
      <p v-if="stats === null" class="parameter-empty">这位人物尚无基础属性情报。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import type { CharacterBattleStats } from '../character-stats';
import { characterBattleStats } from '../character-stats.compact';

type ParameterKey = 'power' | 'resilience' | 'charm' | 'luck' | 'evasion' | 'critical';
const parameters: Array<{ key: ParameterKey; label: string; suffix?: string }> = [
  { key: 'power', label: '性斗力' },
  { key: 'resilience', label: '忍耐力' },
  { key: 'charm', label: '魅力' },
  { key: 'luck', label: '幸运' },
  { key: 'evasion', label: '闪避率', suffix: '%' },
  { key: 'critical', label: '暴击率', suffix: '%' },
];
const maxima = Object.fromEntries(
  parameters.map(({ key }) => [key, Math.max(1, ...characterBattleStats.map(stats => stats[key]))]),
) as Record<ParameterKey, number>;
const props = defineProps<{ stats: CharacterBattleStats | null; expanded: boolean }>();
const emit = defineEmits<{ toggle: [] }>();
const panelId = `shittim-parameters-${useId()}`;
const rows = computed(() =>
  parameters.map(parameter => {
    const value = props.stats?.[parameter.key];
    return {
      ...parameter,
      value,
      maximum: maxima[parameter.key],
      display: value === undefined ? '—' : `${value.toLocaleString('zh-CN')}${parameter.suffix ?? ''}`,
    };
  }),
);
const accessibleLabel = computed(() => rows.value.map(row => `${row.label} ${row.display}`).join('，'));
function endX(value: number, maximum: number) {
  return 227 + (value / maximum) * 335;
}
function barPath(value: number, maximum: number) {
  const end = endX(value, maximum);
  return `M227 9H${end}l-5 17H222Z`;
}
function capPath(value: number, maximum: number) {
  const end = endX(value, maximum);
  return `M${Math.max(227, end - 5)} 9H${end}l-5 17h-5Z`;
}
function glintPath(value: number, maximum: number) {
  const end = endX(value, maximum);
  return `M${Math.max(227, end - 1.8)} 9H${end}l-5 17h-1.8Z`;
}
</script>

<style scoped>
.shittim-parameter-panel {
  width: 100%;
}
.parameter-toggle {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: 0.65em;
  box-sizing: border-box;
  width: 100%;
  height: clamp(36px, 3.8cqw, 56px);
  margin: 0;
  padding: 0 4%;
  border: 0;
  border-radius: 0;
  background: none;
  color: #fff;
  font: inherit;
  cursor: pointer;
  box-shadow: none;
}
.parameter-toggle:hover {
  filter: brightness(1.15);
}
.parameter-toggle:focus-visible {
  outline: 2px solid #fbff9b;
  outline-offset: -4px;
}
.parameter-heading-paper {
  position: absolute;
  z-index: -1;
  inset: 0;
  width: 100%;
  height: 100%;
}
.parameter-heading {
  color: #53f8f5;
  font:
    italic 900 clamp(14px, 1.55cqw, 25px) 'Arial Narrow',
    'Impact',
    sans-serif;
  letter-spacing: 1px;
}
.parameter-caption {
  margin-left: auto;
  color: #9cdcff;
  font-size: clamp(10px, 1.05cqw, 15px);
  letter-spacing: 0.08em;
}
.parameter-action {
  padding: 0.14em 0.55em;
  background: rgba(66, 243, 238, 0.14);
  border: 1px solid rgba(66, 243, 238, 0.36);
  color: #e5ffff;
  font-size: clamp(10px, 0.95cqw, 13px);
  font-weight: 700;
  transform: skewX(-12deg);
  transition: background 140ms ease, border-color 140ms ease;
}
.parameter-toggle:hover .parameter-action {
  background: rgba(66, 243, 238, 0.26);
  border-color: rgba(130, 255, 255, 0.72);
}
.parameter-chevron {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #53f8f5;
  stroke-width: 2.2;
  transition: transform 160ms ease;
}
.is-collapsed {
  display: flex;
  justify-content: flex-end;
}
.is-collapsed .parameter-toggle {
  width: clamp(160px, 16cqw, 230px);
  min-height: 40px;
}
.is-collapsed .parameter-heading {
  display: none;
}
.is-collapsed .parameter-caption {
  margin-left: 0;
  margin-right: auto;
}
.is-collapsed .parameter-chevron {
  transform: rotate(180deg);
}
.parameter-empty {
  margin: 0;
  padding: 0.7em 1.2em;
  background: #060848;
  color: #bfd9f8;
}
.shittim-parameter-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 8px 20px rgba(3, 7, 52, 0.35));
}
.parameter-row-bg {
  fill: #42f3ee;
  fill-opacity: 0;
  transition: fill-opacity 120ms ease;
}
.parameter-row:hover .parameter-row-bg {
  fill-opacity: 0.1;
}
text {
  fill: #fff;
  font-family: inherit;
}
.parameter-label {
  fill: #71ffff;
  font-size: 22px;
  font-weight: 900;
}
.parameter-value {
  font:
    italic 800 29px 'Bahnschrift',
    'Arial Narrow',
    sans-serif;
}
@container shittim-panel (max-width: 720px) {
  .parameter-toggle {
    height: 44px;
  }
  .is-collapsed .parameter-toggle {
    width: 170px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .parameter-chevron {
    transition: none;
  }
}
</style>
