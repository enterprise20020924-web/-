<template>
  <div class="battle-start" :class="[`is-${phase}`, { 'is-reduced': reducedMotion }]" aria-hidden="true">
    <div class="start-strike"><i></i><b></b></div>

    <div v-for="side in ['left', 'right']" :key="side" class="start-shutter" :class="`is-${side}`">
      <svg class="start-chassis" viewBox="0 0 1600 1000" preserveAspectRatio="none" fill="none">
        <path class="start-facet" d="M0 0H1020L465 1000H0ZM1600 0V1000H1085L1600 70Z" />
        <path class="start-facet-alt" d="M1600 0H1090L535 1000H1030L1600 90Z" />
        <g class="start-registration" pathLength="1">
          <path d="M66 175V60h235m998 0h235v115M66 825v115h235m998 0h235V825" pathLength="1" />
          <path d="M91 160V85h125m1168 0h125v75M91 840v75h125m1168 0h125v-75" pathLength="1" />
        </g>
        <path class="start-cut-rail" d="M1083-20 503 1020M1101-20 521 1020" />
        <g class="start-calibration">
          <path d="M128 194h70m-70 8h42m-42 8h20M1472 806h-70m70-8h-42m42-8h-20" />
          <path
            d="m1107 137-11 20m20-20-11 20m20-20-11 20m20-20-11 20M493 843l11-20m-20 20 11-20m-20 20 11-20m-20 20 11-20"
          />
        </g>
      </svg>
      <div class="start-background-word">ENGAGE</div>
    </div>

    <div class="start-surges">
      <div class="start-surge surge-rim"></div>
      <div class="start-surge surge-light"></div>
      <div class="start-surge surge-blue"></div>
    </div>

    <svg class="start-orbit" viewBox="0 0 600 600" fill="none">
      <g class="start-orbit-outer">
        <circle cx="300" cy="300" r="265" pathLength="1" />
        <circle cx="300" cy="300" r="252" stroke-dasharray="34 8 2 8" />
        <path d="M300 14v37m0 498v37M14 300h37m498 0h37M98 98l20 20m364 364 20 20M98 502l20-20m364-364 20-20" />
      </g>
      <g class="start-orbit-inner">
        <circle cx="300" cy="300" r="217" stroke-dasharray="150 22 3 22" />
        <path d="m300 77 7 12h-14Zm223 223-12 7v-14ZM300 523l-7-12h14ZM77 300l12-7v14Z" />
      </g>
      <circle class="start-impact-ring" cx="300" cy="300" r="168" />
      <circle class="start-impact-ring is-second" cx="300" cy="300" r="168" />
    </svg>

    <div class="start-cross-lines"><i></i><i></i></div>

    <div class="start-title">
      <div class="start-caption"><i></i><span>性斗开始</span><i></i></div>
      <div class="start-word is-battle" data-word="BATTLE">
        <span class="start-word-echo echo-far">BATTLE</span>
        <span class="start-word-echo echo-near">BATTLE</span>
        <span
          v-for="slice in 3"
          :key="slice"
          class="start-word-slice"
          :class="`slice-${slice}`"
          :style="{ '--slice': slice - 1 }"
          >BATTLE</span
        >
      </div>
      <div class="start-word is-start" data-word="START">
        <span class="start-word-echo echo-far">START</span>
        <span class="start-word-echo echo-near">START</span>
        <span
          v-for="slice in 3"
          :key="slice"
          class="start-word-slice"
          :class="`slice-${slice}`"
          :style="{ '--slice': slice - 1 }"
          >START</span
        >
      </div>
      <div class="start-title-footer"><i></i><span>CROSS THE LINE</span><i></i></div>
    </div>

    <div class="start-debris">
      <i v-for="(fragment, index) in fragments" :key="index" :style="fragment"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  phase: 'idle' | 'cut' | 'reveal';
  reducedMotion?: boolean;
}>();

const fragments = [
  { '--x': '-33cqi', '--y': '-16cqi', '--angle': '-28deg', '--size': '2.2cqi', '--delay': '0ms' },
  { '--x': '31cqi', '--y': '15cqi', '--angle': '-28deg', '--size': '2.2cqi', '--delay': '0ms' },
  { '--x': '-26cqi', '--y': '11cqi', '--angle': '30deg', '--size': '1.1cqi', '--delay': '30ms' },
  { '--x': '27cqi', '--y': '-12cqi', '--angle': '30deg', '--size': '1.1cqi', '--delay': '30ms' },
  { '--x': '-42cqi', '--y': '-5cqi', '--angle': '-8deg', '--size': '3cqi', '--delay': '65ms' },
  { '--x': '42cqi', '--y': '5cqi', '--angle': '-8deg', '--size': '3cqi', '--delay': '65ms' },
];
</script>

<style scoped lang="scss">
.battle-start {
  --start-center-y: 47%;
  --start-ink: #052458;
  --start-cyan: #87f1ff;
  --start-ease: cubic-bezier(0.16, 1, 0.3, 1);
  position: absolute;
  inset: 0;
  z-index: 6;
  overflow: hidden;
  isolation: isolate;
  pointer-events: none;
  color: #fff;
  font-family: 'Bahnschrift', 'Microsoft YaHei', sans-serif;

  &.is-idle {
    display: none;
  }
}

.start-strike {
  position: absolute;
  left: 50%;
  top: var(--start-center-y);
  z-index: 8;
  width: 170%;
  height: 2px;
  transform: translate(-50%, -50%) rotate(-29deg);

  i,
  b {
    position: absolute;
    inset: 0;
    background: #f5feff;
    transform: scaleX(0);
    transform-origin: 50% 50%;
  }
  b {
    inset: -6px 0;
    background: linear-gradient(0deg, transparent, #42e0ff75, transparent);
  }
}

.start-shutter {
  position: absolute;
  inset: -1px;
  z-index: 1;
  background: linear-gradient(125deg, #05265e, #075b9e 58%, #042b66);
  opacity: 0;
  will-change: transform;

  &.is-left {
    clip-path: polygon(0 0, 64% 0, 36% 100%, 0 100%);
  }
  &.is-right {
    clip-path: polygon(63.9% 0, 100% 0, 100% 100%, 35.9% 100%);
  }
}
.start-chassis {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.start-facet {
  fill: #a6ecff;
  opacity: 0.025;
}
.start-facet-alt {
  fill: #00163f;
  opacity: 0.14;
}
.start-registration {
  stroke: #94e8ff;
  stroke-width: 1;
  opacity: 0.36;

  path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
  }
  path + path {
    opacity: 0.4;
  }
}
.start-cut-rail {
  stroke: #7de7ff;
  stroke-width: 1;
  opacity: 0.13;
}
.start-calibration {
  stroke: #70dbf4;
  stroke-width: 2;
  opacity: 0.4;
}
.start-background-word {
  position: absolute;
  left: 50%;
  top: var(--start-center-y);
  transform: translate(-50%, -50%) rotate(-7deg);
  font-size: 26cqi;
  font-weight: 900;
  font-style: italic;
  line-height: 1;
  letter-spacing: -0.06em;
  color: transparent;
  -webkit-text-stroke: 1px #90d9ff0d;
}
.start-surges {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
}
.start-surge {
  position: absolute;
  inset: -60%;
  transform: rotate(-29deg) scaleY(0);
  transform-origin: 50% 50%;

  &.surge-rim {
    background: #56dfff;
  }
  &.surge-light {
    background: #e3fbff;
  }
  &.surge-blue {
    background: linear-gradient(125deg, #05265e, #075b9e 58%, #042b66);
  }
}
.start-orbit {
  position: absolute;
  left: 50%;
  top: var(--start-center-y);
  z-index: 3;
  width: 52%;
  aspect-ratio: 1;
  overflow: visible;
  transform: translate(-50%, -50%);
  color: #6de0ff;
}
.start-orbit-outer,
.start-orbit-inner {
  transform-origin: 300px 300px;
  stroke: currentColor;
  stroke-width: 1;
  opacity: 0;
}
.start-orbit-outer > circle:first-child {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
.start-orbit-inner {
  stroke-width: 0.8;
}
.start-orbit-inner path {
  fill: currentColor;
  stroke: none;
}
.start-impact-ring {
  stroke: #e9fdff;
  stroke-width: 2;
  transform-origin: 300px 300px;
  opacity: 0;

  &.is-second {
    stroke: #55d7ff;
    stroke-width: 0.8;
  }
}
.start-cross-lines {
  position: absolute;
  left: 50%;
  top: var(--start-center-y);
  z-index: 3;
  width: 120%;
  height: 1px;
  transform: translate(-50%, -50%) rotate(-7deg);

  i {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, #b0f6ff80 35%, transparent 47% 53%, #b0f6ff80 65%, transparent);
    opacity: 0;
    transform: scaleX(0);
  }
  i + i {
    top: 5px;
    opacity: 0.25;
  }
}
.start-title {
  position: absolute;
  top: var(--start-center-y);
  left: 50%;
  z-index: 5;
  display: grid;
  width: 64%;
  transform: translate(-50%, -50%) rotate(-7deg);
  font-size: clamp(42px, 10.5cqi, 168px);
  font-weight: 900;
  font-style: italic;
  line-height: 0.87;
  letter-spacing: -0.055em;
}
.start-caption {
  display: flex;
  justify-content: center;
  align-items: center;
  justify-self: center;
  gap: 1.5cqi;
  margin-bottom: 2.5cqi;
  opacity: 0;
  font-size: clamp(10px, 1.1cqi, 17px);
  line-height: 1;
  font-weight: 600;
  font-style: normal;
  letter-spacing: 0.6em;
  color: #b2f1ff;

  i {
    width: 3cqi;
    height: 1px;
    background: currentColor;
  }
  span {
    padding-left: 0.6em;
  }
}
.start-word {
  position: relative;
  display: grid;
  width: max-content;
  max-width: 100%;
  will-change: transform;

  > span {
    grid-area: 1 / 1;
    padding-right: 0.12em;
  }
  &.is-battle {
    --start-exit-direction: -1;
    justify-self: start;
  }
  &.is-start {
    --start-exit-direction: 1;
    justify-self: end;
    margin-top: 0.025em;
    font-size: 1.19em;
    color: var(--start-cyan);
  }
}
.start-word-echo {
  color: transparent;
  -webkit-text-stroke: 1px #92e8ff;
  opacity: 0.36;
  pointer-events: none;

  &.echo-near {
    transform: translate(-0.022em, 0.045em);
  }
  &.echo-far {
    transform: translate(-0.055em, 0.12em);
    opacity: 0.13;
  }
}
.is-start .start-word-echo {
  -webkit-text-stroke-color: #d9faff;

  &.echo-near {
    transform: translate(0.025em, 0.045em);
  }
  &.echo-far {
    transform: translate(0.06em, 0.12em);
  }
}
.start-word-slice {
  text-shadow: 0.025em 0.035em 0 #002455;

  &.slice-1 {
    clip-path: polygon(-10% -20%, 110% -20%, 110% 34%, -10% 41%);
  }
  &.slice-2 {
    clip-path: polygon(-10% 40.5%, 110% 33.5%, 110% 68%, -10% 75%);
  }
  &.slice-3 {
    clip-path: polygon(-10% 74.5%, 110% 67.5%, 110% 120%, -10% 120%);
  }
}
.start-title-footer {
  display: flex;
  align-items: center;
  justify-self: center;
  gap: 1.4cqi;
  width: 59%;
  margin-top: 3cqi;
  color: #89daf1;
  font-size: clamp(6px, 0.55cqi, 9px);
  font-weight: 700;
  font-style: normal;
  letter-spacing: 0.32em;
  white-space: nowrap;
  opacity: 0;

  i {
    flex: 1;
    height: 2px;
    background: #74e8fb;
    transform: skewX(-30deg);
  }
}
.start-debris {
  position: absolute;
  left: 50%;
  top: var(--start-center-y);
  z-index: 4;

  i {
    position: absolute;
    width: var(--size);
    height: 3px;
    background: #d2fcff;
    clip-path: polygon(20% 0, 100% 0, 80% 100%, 0 100%);
    opacity: 0;
  }
  i:nth-child(3n) {
    height: 7px;
    background: #3ad9ff;
  }
}

.is-cut {
  .start-strike i {
    animation: start-strike 380ms ease-out both;
  }
  .start-strike b {
    animation: start-strike 420ms 25ms ease-out both;
  }
  .surge-rim {
    animation: start-surge-in 230ms 35ms cubic-bezier(0.76, 0, 0.24, 1) both;
  }
  .surge-light {
    animation: start-surge-in 240ms 60ms cubic-bezier(0.76, 0, 0.24, 1) both;
  }
  .surge-blue {
    animation: start-surge-in 245ms 85ms cubic-bezier(0.76, 0, 0.24, 1) both;
  }
  .start-shutter {
    animation: start-shutter-ready 1ms 330ms both;
  }
  .start-surges {
    animation: start-surge-retire 1ms 332ms both;
  }
  .start-registration path {
    animation: start-trace 300ms 330ms ease-out both;
  }
  .start-orbit-outer {
    animation: start-orbit-outer 550ms 220ms var(--start-ease) both;
  }
  .start-orbit-outer > circle:first-child {
    animation: start-trace 500ms 230ms ease-out both;
  }
  .start-orbit-inner {
    animation: start-orbit-inner 550ms 260ms var(--start-ease) both;
  }
  .start-impact-ring {
    animation: start-ring-impact 480ms 300ms ease-out both;
  }
  .start-impact-ring.is-second {
    animation-delay: 340ms;
  }
  .start-cross-lines i {
    animation: start-cross-spread 470ms 310ms ease-out both;
  }
  .start-cross-lines i + i {
    animation-delay: 350ms;
  }
  .start-word.is-battle {
    animation: start-word-from-left 390ms 120ms var(--start-ease) both;
  }
  .start-word.is-start {
    animation: start-word-from-right 390ms 200ms var(--start-ease) both;
  }
  .start-caption {
    animation: start-caption-in 220ms 360ms ease-out both;
  }
  .start-title-footer {
    animation: start-caption-in 250ms 400ms ease-out both;
  }
  .start-debris i {
    animation: start-fragment 440ms calc(300ms + var(--delay)) ease-out both;
  }
}

.is-reveal {
  .start-strike,
  .start-surges,
  .start-debris {
    display: none;
  }
  .start-shutter {
    opacity: 1;
  }
  .start-registration path {
    stroke-dashoffset: 0;
  }
  .start-shutter.is-left {
    animation: start-shutter-left 650ms cubic-bezier(0.65, 0, 0.2, 1) both;
  }
  .start-shutter.is-right {
    animation: start-shutter-right 650ms cubic-bezier(0.65, 0, 0.2, 1) both;
  }
  .start-orbit {
    animation: start-orbit-release 450ms ease-in both;
  }
  .start-orbit-outer {
    opacity: 0.35;
    transform: rotate(18deg);
  }
  .start-orbit-outer > circle:first-child {
    stroke-dashoffset: 0;
  }
  .start-orbit-inner {
    opacity: 0.28;
    transform: rotate(-20deg);
  }
  .start-cross-lines {
    animation: start-detail-release 180ms ease-out both;
  }
  .start-cross-lines i {
    opacity: 0.35;
    transform: scaleX(1);
  }
  .start-word-slice {
    animation: start-slice-release 460ms calc(var(--slice) * 35ms) cubic-bezier(0.55, 0, 0.8, 0.45) both;
  }
  .start-word-echo {
    animation: start-echo-release 340ms ease-in both;
  }
  .start-caption,
  .start-title-footer {
    animation: start-detail-release 200ms ease-out both;
  }
}

.is-reduced {
  .start-strike,
  .start-surges,
  .start-debris,
  .start-orbit,
  .start-cross-lines {
    display: none;
  }
  .start-word,
  .start-word-slice,
  .start-word-echo,
  .start-caption,
  .start-title-footer,
  .start-registration path {
    animation: none !important;
  }
  .start-caption,
  .start-title-footer {
    opacity: 1;
  }
  .start-shutter {
    animation: none !important;
    opacity: 1;
  }
  .start-registration path {
    stroke-dashoffset: 0;
  }
  &.is-reveal {
    animation: start-detail-release 120ms ease-out both;
  }
}

@container battle-intro (max-width: 600px) {
  .battle-start {
    --start-center-y: 45%;
  }
  .start-title {
    width: 82%;
    font-size: 14cqi;
  }
  .start-word.is-start {
    font-size: 1.21em;
  }
  .start-caption {
    gap: 3cqi;
    margin-bottom: 5cqi;
    font-size: 10px;
  }
  .start-caption i {
    width: 8cqi;
  }
  .start-title-footer {
    width: 72%;
    margin-top: 6cqi;
    font-size: 6px;
    gap: 2cqi;
  }
  .start-orbit {
    width: 94%;
  }
  .start-strike {
    width: 250%;
  }
  .start-surge {
    inset: -100%;
  }
  .start-background-word {
    font-size: 38cqi;
  }
  .start-calibration {
    display: none;
  }
}

@keyframes start-strike {
  0% {
    opacity: 0;
    transform: scaleX(0);
  }
  38% {
    opacity: 1;
    transform: scaleX(1);
  }
  75% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: scaleX(1.1);
  }
}
@keyframes start-surge-in {
  0% {
    transform: rotate(-29deg) scaleY(0);
  }
  100% {
    transform: rotate(-29deg) scaleY(1);
  }
}
@keyframes start-shutter-ready {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes start-surge-retire {
  from {
    visibility: visible;
  }
  to {
    visibility: hidden;
  }
}
@keyframes start-trace {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes start-orbit-outer {
  from {
    opacity: 0;
    transform: rotate(-35deg) scale(0.86);
  }
  to {
    opacity: 0.35;
    transform: rotate(18deg) scale(1);
  }
}
@keyframes start-orbit-inner {
  from {
    opacity: 0;
    transform: rotate(48deg) scale(1.1);
  }
  to {
    opacity: 0.28;
    transform: rotate(-20deg) scale(1);
  }
}
@keyframes start-ring-impact {
  0% {
    opacity: 0;
    transform: scale(0.65);
  }
  22% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}
@keyframes start-cross-spread {
  0% {
    opacity: 0;
    transform: scaleX(0);
  }
  45% {
    opacity: 1;
    transform: scaleX(1);
  }
  100% {
    opacity: 0.35;
    transform: scaleX(1);
  }
}
@keyframes start-word-from-left {
  0% {
    opacity: 0;
    transform: translateX(-55%) skewX(-12deg);
  }
  65% {
    opacity: 1;
    transform: translateX(2%) skewX(0);
  }
  100% {
    opacity: 1;
    transform: translateX(0) skewX(0);
  }
}
@keyframes start-word-from-right {
  0% {
    opacity: 0;
    transform: translateX(55%) skewX(12deg);
  }
  65% {
    opacity: 1;
    transform: translateX(-2%) skewX(0);
  }
  100% {
    opacity: 1;
    transform: translateX(0) skewX(0);
  }
}
@keyframes start-caption-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes start-fragment {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(var(--angle)) scaleX(0.2);
  }
  22% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: translate(var(--x), var(--y)) rotate(var(--angle)) scaleX(1.1);
  }
}
@keyframes start-shutter-left {
  0%,
  7% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-104%);
  }
}
@keyframes start-shutter-right {
  0%,
  7% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(104%);
  }
}
@keyframes start-slice-release {
  0%,
  10% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(calc(var(--start-exit-direction) * (70% + var(--slice) * 28%)), calc((var(--slice) - 1) * 38%))
      scale(1.12);
  }
}
@keyframes start-echo-release {
  from {
    opacity: 0.28;
  }
  to {
    opacity: 0;
    transform: scale(1.14);
  }
}
@keyframes start-orbit-release {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.32);
  }
}
@keyframes start-detail-release {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
