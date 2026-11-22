<template>
  <section
    class="amami-map-entrance"
    :class="{ 'is-revealing': revealing, 'is-warm': warmStart, 'is-reduced': reducedMotion }"
    aria-label="正在打开校园地图"
  >
    <div class="amami-atlas-backdrop" aria-hidden="true"></div>

    <div class="amami-atlas-center">
      <div class="amami-atlas-object" aria-hidden="true">
        <svg class="amami-atlas-pages" viewBox="0 0 480 340" fill="none">
          <defs>
            <linearGradient
              :id="`${atlasId}-paper-left`"
              x1="55"
              y1="170"
              x2="240"
              y2="170"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#f5faff" />
              <stop offset=".28" stop-color="#fff" />
              <stop offset=".82" stop-color="#f4f9fc" />
              <stop offset="1" stop-color="#c0d3df" />
            </linearGradient>
            <linearGradient
              :id="`${atlasId}-paper-right`"
              x1="240"
              y1="170"
              x2="425"
              y2="170"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#b2cbdc" />
              <stop offset=".12" stop-color="#e6f0f6" />
              <stop offset=".5" stop-color="#f9fcff" />
              <stop offset="1" stop-color="#e8f3fa" />
            </linearGradient>
            <linearGradient :id="`${atlasId}-binding`" x1="228" y1="0" x2="252" y2="0" gradientUnits="userSpaceOnUse">
              <stop stop-color="#325776" stop-opacity="0" />
              <stop offset=".5" stop-color="#325776" stop-opacity=".3" />
              <stop offset="1" stop-color="#325776" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M38 77Q139 44 240 84Q341 44 442 77V282Q341 254 240 291Q139 254 38 282Z"
            fill="#123c60"
            stroke="#93bdd2"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M48 70Q145 41 240 81V279Q145 242 48 269Z" fill="#d4e1eb" />
          <path d="M240 81Q335 41 432 70V269Q335 242 240 279Z" fill="#b7ccd9" />
          <path d="M55 57Q153 34 240 75V270Q153 232 55 255Z" :fill="`url(#${atlasId}-paper-left)`" />
          <path d="M240 75Q327 34 425 57V255Q327 232 240 270Z" :fill="`url(#${atlasId}-paper-right)`" />
          <g stroke="#b9dbe9" stroke-width="1.5">
            <path d="M48 262Q145 235 233 274M247 274Q335 235 432 262M48 269Q145 243 233 281M247 281Q335 243 432 269" />
            <path d="M240 79V270" stroke="#6f94ad" stroke-width="1" />
            <path d="M60 62Q153 40 234 78M246 78Q327 40 420 62" stroke="#fff" />
          </g>
          <g class="amami-atlas-map" stroke-linejoin="round">
            <path
              d="m78 94 48-7 13 42-55 8Zm77-3 57 17v34l-49-11Zm-66 68 53-10 9 40-53 10Zm80-4 43 10v67l-35-9Z"
              fill="#d6e7ee"
            />
            <path
              d="m267 104 45-16 6 38-51 13Zm69-21 64-9v38l-59 9Zm-66 80 48-13 5 36-53 15Zm73-20 56-8v41l-51 8Zm-61 78 38-12 5 26-43 11Z"
              fill="#c3dfe8"
            />
            <path
              d="m72 148 80-14 68 20m-76-72 23 147M259 151l150-30m-83-45 17 163M266 212l139-23"
              stroke="#9ec8d8"
              stroke-width="3"
            />
            <path
              class="amami-atlas-route"
              d="m108 209 43-10 12-55 90 17 48-14 45 8"
              stroke="#237fa8"
              stroke-width="2.4"
              stroke-dasharray="6 6"
            />
            <circle cx="108" cy="209" r="5" fill="#fff" stroke="#237fa8" stroke-width="2" />
            <path d="M87 75v15m-7-7h14m-7-8-3 5h6Z" stroke="#80a9bc" stroke-width="1.2" />
            <g class="amami-atlas-pin">
              <path
                d="M346 101a22 22 0 0 0-22 22c0 16 22 37 22 37s22-21 22-37a22 22 0 0 0-22-22Z"
                fill="#168db8"
                stroke="#fff"
                stroke-width="3"
              />
              <circle cx="346" cy="123" r="7" fill="#fff" />
            </g>
          </g>
          <path d="m228 71 12 4 12-4v195l-12 4-12-4Z" :fill="`url(#${atlasId}-binding)`" />
          <path d="m219 252 11 4v40l-6-8-5 4Z" fill="#2ca7c5" />
          <path d="m222 255 0 30" stroke="#85d4e5" stroke-width="1" />
        </svg>
        <div class="amami-atlas-cover-position">
          <svg class="amami-atlas-cover" viewBox="0 0 200 260" fill="none">
            <defs>
              <linearGradient :id="`${atlasId}-cover`" x1="31" y1="9" x2="191" y2="230" gradientUnits="userSpaceOnUse">
                <stop stop-color="#205c83" />
                <stop offset=".52" stop-color="#123d63" />
                <stop offset="1" stop-color="#0b2948" />
              </linearGradient>
            </defs>
            <path
              d="M18 8h161l12 12v225H19q-11 0-11-12V21Q8 8 18 8Z"
              fill="#032753"
              stroke="#9abacb"
              stroke-width="1.5"
            />
            <path d="M24 9v226M25 235h157v10H25q-8 0-8-5t8-5Z" fill="#e7f5fb" stroke="#9bcfdf" stroke-width="2" />
            <path d="M31 9h147l11 12v210H31Z" :fill="`url(#${atlasId}-cover)`" />
            <path d="M38 17h133l10 10v192H38Z" stroke="#b1d2df" stroke-width=".8" />
            <path d="M41 22h127l8 8v184H41Z" stroke="#b1d2df" stroke-opacity=".25" stroke-width=".6" />
            <path d="M28 16v210" stroke="#061f39" stroke-width="3" />
            <path
              d="m65 83 28-11 30 11 29-11v72l-29 11-30-11-28 11Zm28-11v72m30-61v72"
              stroke="#fff"
              stroke-width="2.8"
              stroke-linejoin="round"
            />
            <path
              d="M109 96c-8 0-14 6-14 14 0 10 14 24 14 24s14-14 14-24c0-8-6-14-14-14Z"
              fill="#c1f3ff"
              stroke="#0874af"
              stroke-width="3"
            />
            <circle cx="109" cy="110" r="4" fill="#0874af" />
            <text x="109" y="187" fill="#fff" text-anchor="middle" font-size="15" font-weight="800" letter-spacing="2">
              天海学园
            </text>
            <path d="M83 201h52" stroke="#7edff3" stroke-width="2" />
          </svg>
        </div>
      </div>
      <h3>校园地图</h3>
      <div class="amami-atlas-status" role="status">
        <i v-if="!failed && !ready" aria-hidden="true"></i>
        <span>{{ failed ? '地图暂时未能展开' : ready ? '地图已就绪' : '正在展开地图…' }}</span>
        <button v-if="failed" type="button" @click="emit('retry')">重试</button>
      </div>
    </div>

    <button v-if="!revealing" type="button" class="amami-atlas-return" @click="emit('return')">
      <MapIcon name="back" />返回正文
    </button>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import MapIcon from './MapIcon.vue';

const props = defineProps<{ ready: boolean; failed: boolean; warmStart?: boolean; reducedMotion?: boolean }>();
const emit = defineEmits<{ reveal: []; complete: []; retry: []; return: [] }>();
const atlasId = `campus-atlas-${useId()}`;
const revealing = ref(false);
let openingFinished = false;
let openingTimer: ReturnType<typeof setTimeout> | undefined;
let releaseTimer: ReturnType<typeof setTimeout> | undefined;

function revealWhenReady() {
  if (!openingFinished || !props.ready || props.failed || revealing.value) return;
  revealing.value = true;
  emit('reveal');
  releaseTimer = setTimeout(() => emit('complete'), props.reducedMotion ? 160 : 500);
}

watch(() => [props.ready, props.failed], revealWhenReady);
onMounted(() => {
  openingTimer = setTimeout(
    () => {
      openingFinished = true;
      revealWhenReady();
    },
    props.reducedMotion ? 180 : props.warmStart ? 680 : 1150,
  );
});
onBeforeUnmount(() => {
  clearTimeout(openingTimer);
  clearTimeout(releaseTimer);
});
</script>
