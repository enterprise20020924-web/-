<template>
  <div
    class="battle-entrance"
    :class="[`is-${stage}`, { 'is-reduced': reduceMotion }]"
    role="region"
    aria-label="对战开场"
  >
    <div class="entrance-scene">
      <div class="entrance-sky"></div>
      <svg class="entrance-orbits" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g class="entrance-orbit-turn" fill="none" stroke="currentColor">
          <circle cx="800" cy="500" r="330" stroke-width="1" />
          <circle cx="800" cy="500" r="350" stroke-width="2" stroke-dasharray="130 16 2 16" />
          <circle cx="800" cy="500" r="395" stroke-width="1" />
          <path
            d="M800 80v60m0 720v60M380 500h60m720 0h60M516 216l28 28m512 512 28 28M516 784l28-28m512-512 28-28"
            stroke-width="3"
          />
        </g>
        <path d="M-80 850 1100-50M500 1050 1680 150" fill="none" stroke="currentColor" stroke-width="48" opacity=".1" />
      </svg>
      <span class="entrance-watermark" aria-hidden="true">BATTLE FUCK</span>

      <div class="entrance-fighter is-player">
        <div class="entrance-fighter-inner">
          <span class="entrance-side-word" aria-hidden="true">CHALLENGER</span>
          <div class="entrance-image-window">
            <img
              v-if="playerImage"
              :src="playerImage"
              :alt="playerName"
              :class="{ 'is-loaded': playerLoaded, 'is-standee': isStandee(playerImage) }"
              @load="playerLoaded = true"
              @error="portraitError('player')"
            />
            <span v-else class="entrance-monogram" aria-hidden="true">{{ playerName.slice(0, 1) }}</span>
          </div>
          <div class="entrance-fighter-shade"></div>
          <span class="entrance-edge"></span>
        </div>
      </div>
      <div class="entrance-fighter is-enemy">
        <div class="entrance-fighter-inner">
          <span class="entrance-side-word" aria-hidden="true">OPPONENT</span>
          <div class="entrance-image-window">
            <img
              v-if="enemyImage"
              :src="enemyImage"
              :alt="enemyName"
              :class="{ 'is-loaded': enemyLoaded, 'is-standee': isStandee(enemyImage) }"
              @load="enemyLoaded = true"
              @error="portraitError('enemy')"
            />
            <span v-else class="entrance-monogram" aria-hidden="true">{{ enemyName.slice(0, 1) }}</span>
          </div>
          <div class="entrance-fighter-shade"></div>
          <span class="entrance-edge"></span>
        </div>
      </div>

      <div class="entrance-versus" aria-hidden="true">
        <svg class="entrance-impact" viewBox="0 0 400 400" fill="none">
          <path
            d="M200 18 217 165 354 78 236 185 386 200 236 216 320 352 215 237 200 386 184 237 48 320 164 216 14 200 164 184 78 46 184 163Z"
            fill="currentColor"
          />
          <circle cx="200" cy="200" r="120" stroke="currentColor" stroke-width="1" />
        </svg>
        <div class="entrance-vs-diamond"></div>
        <span class="entrance-vs-echo">VS</span><strong>VS</strong>
        <small>CROSS THE LINE</small>
      </div>

      <div class="entrance-nameplate is-player">
        <small><i></i> CHALLENGER</small>
        <strong :title="playerName" :class="{ 'is-long': playerName.length > 7 }">{{ playerName }}</strong>
        <span>以此刻，回应挑战。</span>
      </div>
      <div class="entrance-nameplate is-enemy">
        <small>OPPONENT <i></i></small>
        <strong :title="enemyName" :class="{ 'is-long': enemyName.length > 7 }">{{ enemyName }}</strong>
        <span>性斗，于此开始。</span>
      </div>

      <div class="entrance-topline" aria-hidden="true"><span>ENCOUNTER / 对战即将开始</span><i></i><b>天海学园</b></div>
      <div class="entrance-bottomline" aria-hidden="true"><i></i><span>READY TO CROSS</span><i></i></div>
      <div class="entrance-speed-lines" aria-hidden="true">
        <i v-for="n in 5" :key="n" :style="{ '--line': n }"></i>
      </div>
      <EntranceEncounter :opening="stage !== 'arrival'" :reduced-motion="reduceMotion" />
    </div>

    <EntranceBattleStart
      :phase="stage === 'cut' || stage === 'reveal' ? stage : 'idle'"
      :reduced-motion="reduceMotion"
    />

    <nav v-if="stage !== 'reveal'" class="entrance-controls" aria-label="开场控制">
      <button type="button" @click="emit('return')">返回正文</button>
      <button v-if="!failed" type="button" @click="skip">
        <span>{{ skipRequested && !ready ? '准备中…' : '跳过演出' }}</span
        ><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 6 5-6 5V5Zm9 0v10" /></svg>
      </button>
    </nav>
    <div v-if="failed" class="entrance-status" role="status">
      <span>战场暂未就绪</span><button type="button" @click="emit('retry')">重新进入</button>
    </div>
    <div v-else-if="dwellComplete && !ready" class="entrance-status" role="status">
      <i></i><span>正在准备战场…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getEntranceFallbackPortrait } from './entrance-portraits';
import EntranceEncounter from './EntranceEncounter.vue';
import EntranceBattleStart from './EntranceBattleStart.vue';

const props = defineProps<{
  playerName: string;
  enemyName: string;
  playerPortrait: string;
  playerFallbackPortrait?: string;
  enemyPortrait: string;
  ready: boolean;
  failed: boolean;
  reducedMotion?: boolean;
}>();
const emit = defineEmits<{ reveal: []; complete: []; retry: []; return: [] }>();
const stage = ref<'arrival' | 'faceoff' | 'cut' | 'reveal'>('arrival');
const systemReduced = ref(false);
const reduceMotion = computed(() => props.reducedMotion || systemReduced.value);
const playerImage = ref(props.playerPortrait);
const enemyImage = ref(props.enemyPortrait);
const playerLoaded = ref(!props.playerPortrait);
const enemyLoaded = ref(!props.enemyPortrait);
const arrivalComplete = ref(false);
const dwellComplete = ref(false);
const skipRequested = ref(false);
const timers = new Set<ReturnType<typeof setTimeout>>();
let motionQuery: MediaQueryList | undefined;
function isStandee(url: string) {
  return /全身立绘|%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/i.test(url);
}

function later(action: () => void, delay: number) {
  const timer = setTimeout(() => {
    timers.delete(timer);
    action();
  }, delay);
  timers.add(timer);
}
function portraitError(side: 'player' | 'enemy') {
  const source = side === 'player' ? playerImage : enemyImage;
  const loaded = side === 'player' ? playerLoaded : enemyLoaded;
  const fallback = side === 'player' && props.playerFallbackPortrait !== undefined
    ? props.playerFallbackPortrait
    : getEntranceFallbackPortrait(side === 'player' ? props.playerName : props.enemyName);
  if (fallback && source.value !== fallback) source.value = fallback;
  else {
    source.value = '';
    loaded.value = true;
  }
}
function enterFaceoff() {
  if (stage.value !== 'arrival' || !arrivalComplete.value) return;
  stage.value = 'faceoff';
  later(
    () => {
      dwellComplete.value = true;
      tryReveal();
    },
    reduceMotion.value ? 900 : 3000,
  );
}
function tryReveal() {
  if (
    !props.ready ||
    props.failed ||
    (!dwellComplete.value && !skipRequested.value) ||
    stage.value === 'cut' ||
    stage.value === 'reveal'
  )
    return;
  stage.value = 'cut';
  later(
    () => {
      stage.value = 'reveal';
      emit('reveal');
      later(() => emit('complete'), reduceMotion.value ? 240 : 760);
    },
    reduceMotion.value ? 140 : 800,
  );
}
function skip() {
  skipRequested.value = true;
  tryReveal();
}
function updateMotion(event: MediaQueryListEvent) {
  systemReduced.value = event.matches;
}
watch([playerLoaded, enemyLoaded, arrivalComplete], ([player, enemy, arrived]) => {
  if (player && enemy && arrived) enterFaceoff();
});
watch(() => [props.ready, props.failed], tryReveal);
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  systemReduced.value = motionQuery.matches;
  motionQuery.addEventListener('change', updateMotion);
  later(
    () => {
      arrivalComplete.value = true;
    },
    reduceMotion.value ? 100 : 900,
  );
  later(enterFaceoff, 1800);
});
onBeforeUnmount(() => {
  timers.forEach(clearTimeout);
  motionQuery?.removeEventListener('change', updateMotion);
});
</script>

<style scoped lang="scss">
.battle-entrance {
  position: absolute;
  inset: 0;
  z-index: 100;
  overflow: hidden;
  isolation: isolate;
  container: battle-intro / inline-size;
  color: #fff;
  font-family: 'Bahnschrift', 'Microsoft YaHei', sans-serif;
  --intro-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
.entrance-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #051935;
}
.entrance-sky {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 48% 45%, #0c7bbb 0, #063c78 38%, #061a3c 74%);
}
.entrance-orbits {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: #5de8ff;
  opacity: 0.4;
}
.entrance-orbit-turn {
  transform-origin: 800px 500px;
  animation: intro-orbit 30s linear infinite;
}
.entrance-watermark {
  position: absolute;
  left: 3%;
  top: 9%;
  white-space: nowrap;
  font-size: 11.5cqi;
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.06em;
  color: #a3efff0e;
}
.entrance-fighter {
  position: absolute;
  top: 9%;
  bottom: 11%;
  width: 55%;
  overflow: hidden;
}
.entrance-fighter-inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.entrance-fighter.is-player {
  left: 0;
  clip-path: polygon(0 0, 100% 0, 78% 100%, 0 100%);
  transform: translateX(-105%);
}
.entrance-fighter.is-enemy {
  right: 0;
  clip-path: polygon(22% 0, 100% 0, 100% 100%, 0 100%);
  transform: translateX(105%);
}
.is-player .entrance-fighter-inner {
  background: linear-gradient(120deg, #b1edff, #259aca 68%, #064375);
}
.is-enemy .entrance-fighter-inner {
  background: linear-gradient(120deg, #123b6b, #316aac 65%, #baccec);
}
.entrance-image-window {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.entrance-image-window img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 20%;
  opacity: 0;
  transition: opacity 0.3s;
}
.entrance-image-window img.is-loaded {
  opacity: 1;
}
.entrance-image-window img.is-standee {
  object-fit: contain;
  object-position: 50% 0;
  padding-top: 3%;
}
.is-player .entrance-image-window {
  right: 6%;
}
.is-enemy .entrance-image-window {
  left: 6%;
}
.entrance-fighter-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, #031b46ee, transparent 38%), linear-gradient(90deg, #00b9e522, transparent 45%);
}
.is-enemy .entrance-fighter-shade {
  background: linear-gradient(0deg, #071c43ee, transparent 38%), linear-gradient(270deg, #213cb144, transparent 45%);
}
.entrance-edge {
  position: absolute;
  width: 3px;
  inset-block: 0;
  left: 88%;
  background: #5ef2ff;
  transform: skewX(-16deg);
  box-shadow: 0 0 18px #00d8ff;
}
.is-enemy .entrance-edge {
  left: 11%;
  background: #e6f9ff;
}
.entrance-side-word {
  position: absolute;
  inset: 2% auto auto 6%;
  font-size: 5.8cqi;
  font-style: italic;
  font-weight: 900;
  color: #05285424;
}
.is-enemy .entrance-side-word {
  left: auto;
  right: 5%;
}
.entrance-monogram {
  position: absolute;
  inset: 10% 0;
  display: grid;
  place-items: center;
  font-size: 23cqi;
  font-weight: 900;
  color: #d6f8ff33;
}
.entrance-versus {
  position: absolute;
  left: 50%;
  top: 47%;
  width: 19%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%) scale(2);
  opacity: 0;
}
.entrance-vs-diamond {
  position: absolute;
  inset: 19%;
  background: #07387ecf;
  border: 1px solid #8eeeff;
  transform: rotate(45deg);
  box-shadow:
    0 0 0 5px #07295f77,
    0 0 0 6px #4adaff44;
}
.entrance-versus strong,
.entrance-vs-echo {
  position: absolute;
  font-size: 12cqi;
  font-style: italic;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.1em;
  padding-right: 0.1em;
}
.entrance-versus strong {
  color: #fff;
  text-shadow: 3px 5px 0 #0873b9;
}
.entrance-vs-echo {
  color: transparent;
  -webkit-text-stroke: 1px #5be5ff;
  transform: translate(-8%, 8%) scale(1.13);
}
.entrance-versus small {
  position: absolute;
  top: 89%;
  font-size: 0.65cqi;
  font-weight: 800;
  letter-spacing: 0.27em;
  white-space: nowrap;
}
.entrance-impact {
  position: absolute;
  inset: -40%;
  width: 180%;
  height: 180%;
  color: #9defff;
  opacity: 0;
}
.entrance-nameplate {
  position: absolute;
  bottom: 16%;
  width: 38%;
  z-index: 3;
  opacity: 0;
}
.entrance-nameplate.is-player {
  left: 4.5%;
  transform: translateX(-35px);
}
.entrance-nameplate.is-enemy {
  right: 4.5%;
  text-align: right;
  transform: translateX(35px);
}
.entrance-nameplate small {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1cqi;
  font-size: clamp(8px, 0.9cqi, 13px);
  font-weight: 800;
  letter-spacing: 0.25em;
  color: #82efff;
}
.entrance-nameplate.is-enemy small {
  justify-content: flex-end;
  color: #d2e8ff;
}
.entrance-nameplate small i {
  width: 22px;
  height: 3px;
  background: currentColor;
}
.entrance-nameplate strong {
  display: block;
  font-size: clamp(20px, 4cqi, 62px);
  font-weight: 900;
  line-height: 1.15;
  text-shadow: 0 2px 12px #06152699;
  overflow-wrap: anywhere;
}
.entrance-nameplate strong.is-long {
  font-size: clamp(18px, 2.8cqi, 42px);
}
.entrance-nameplate > span {
  display: block;
  margin-top: 1.2cqi;
  font-size: clamp(9px, 1cqi, 15px);
  letter-spacing: 0.24em;
  color: #d2edff;
}
.entrance-topline {
  position: absolute;
  top: 4%;
  left: 4.5%;
  right: 4.5%;
  display: flex;
  gap: 20px;
  align-items: center;
  font-size: clamp(8px, 0.75cqi, 12px);
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #8cdbf5;
}
.entrance-topline i {
  flex: 1;
  height: 1px;
  background: #80dafa55;
}
.entrance-topline b {
  margin-right: 180px;
  font-weight: 700;
}
.entrance-bottomline {
  position: absolute;
  bottom: 5%;
  left: 5%;
  right: 5%;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: clamp(8px, 0.7cqi, 12px);
  letter-spacing: 0.5em;
  color: #92daef;
}
.entrance-bottomline i {
  height: 1px;
  flex: 1;
  background: #69cbef40;
}
.entrance-bottomline i:first-child {
  background: linear-gradient(90deg, transparent, #6be6ff);
}
.entrance-bottomline i:last-child {
  background: linear-gradient(90deg, #6be6ff, transparent);
}
.entrance-speed-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.entrance-speed-lines i {
  position: absolute;
  top: calc(12% + var(--line) * 15%);
  left: -30%;
  width: 28%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #b4f9ff, transparent);
  transform: rotate(-12deg);
  opacity: 0;
}
.is-faceoff,
.is-cut,
.is-reveal {
  .entrance-fighter.is-player {
    animation: intro-player 0.95s var(--intro-ease) both;
  }
  .entrance-fighter.is-enemy {
    animation: intro-enemy 0.95s 0.12s var(--intro-ease) both;
  }
  .entrance-image-window {
    animation: intro-portrait-drift 5s 0.6s ease-out both;
  }
  .entrance-versus {
    animation: intro-vs 0.6s 0.65s var(--intro-ease) both;
  }
  .entrance-impact {
    animation: intro-impact 0.7s 0.8s ease-out both;
  }
  .entrance-nameplate {
    animation: intro-name 0.7s 0.8s var(--intro-ease) both;
  }
  .entrance-speed-lines i {
    animation: intro-speed 0.8s calc(0.45s + var(--line) * 0.09s) ease-out both;
  }
}
.is-reveal {
  .entrance-scene {
    visibility: hidden;
  }
}
.entrance-controls {
  position: absolute;
  top: 2.6%;
  right: 3%;
  z-index: 10;
  display: flex;
  gap: 8px;
}
.entrance-controls button,
.entrance-status button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 7px 12px;
  background: #051f46bb;
  color: #e6faff;
  border: 1px solid #7ccce466;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}
.entrance-controls button:hover,
.entrance-status button:hover {
  background: #1772a6;
  border-color: #b0f3ff;
}
.entrance-controls button:focus-visible,
.entrance-status button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}
.entrance-controls svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  stroke-width: 1.5;
}
.entrance-status {
  position: absolute;
  bottom: 6%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 16px;
  background: #071d40ed;
  color: #cff7ff;
  font-size: 12px;
  white-space: nowrap;
}
.entrance-status > i {
  width: 6px;
  height: 6px;
  background: #63e7ff;
  border-radius: 50%;
  animation: intro-wait 1s ease-in-out infinite alternate;
}
.is-reduced {
  .entrance-orbit-turn,
  .entrance-image-window,
  .entrance-speed-lines i,
  .entrance-impact {
    animation: none !important;
  }
  .entrance-fighter,
  .entrance-versus,
  .entrance-nameplate {
    animation-duration: 0.15s !important;
    animation-delay: 0s !important;
  }
}
@container battle-intro (max-width:600px) {
  .entrance-fighter {
    top: 17%;
    bottom: 16%;
    width: 58%;
  }
  .entrance-image-window img {
    object-position: 50% 16%;
  }
  .entrance-nameplate {
    bottom: 20%;
    width: 38%;
  }
  .entrance-nameplate strong {
    font-size: clamp(20px, 5.2cqi, 30px);
  }
  .entrance-nameplate strong.is-long {
    font-size: clamp(15px, 4cqi, 24px);
  }
  .entrance-nameplate small {
    font-size: 7px;
    letter-spacing: 0.12em;
    gap: 4px;
  }
  .entrance-nameplate small i {
    width: 12px;
  }
  .entrance-nameplate > span {
    font-size: 8px;
    letter-spacing: 0.08em;
  }
  .entrance-topline {
    top: 11.5%;
    gap: 12px;
    font-size: 7px;
  }
  .entrance-topline b {
    margin-right: 0;
  }
  .entrance-versus {
    width: 24%;
    top: 45%;
  }
  .entrance-versus strong,
  .entrance-vs-echo {
    font-size: 16cqi;
  }
  .entrance-versus small {
    display: none;
  }
  .entrance-controls {
    top: 2%;
    right: 4%;
  }
  .entrance-controls button {
    min-height: 40px;
    padding: 8px 10px;
    font-size: 11px;
  }
  .entrance-bottomline {
    bottom: 10%;
    font-size: 7px;
    letter-spacing: 0.25em;
  }
}
@keyframes intro-orbit {
  to {
    transform: rotate(360deg);
  }
}
@keyframes intro-player {
  from {
    transform: translateX(-105%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes intro-enemy {
  from {
    transform: translateX(105%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes intro-portrait-drift {
  from {
    transform: scale(1.065);
  }
  to {
    transform: scale(1);
  }
}
@keyframes intro-vs {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2);
  }
  65% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
@keyframes intro-impact {
  0% {
    opacity: 0;
    transform: scale(0.35) rotate(-20deg);
  }
  25% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: scale(1.45) rotate(8deg);
  }
}
@keyframes intro-name {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes intro-speed {
  20% {
    opacity: 0.8;
  }
  to {
    opacity: 0;
    transform: translateX(550%) rotate(-12deg);
  }
}
@keyframes intro-wait {
  to {
    opacity: 0.25;
  }
}
</style>
