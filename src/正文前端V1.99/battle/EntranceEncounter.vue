<template>
  <div class="encounter-opening" :class="{ 'is-opening': opening, 'is-reduced': reducedMotion }" aria-hidden="true">
    <div class="encounter-shell is-left"><i></i></div>
    <div class="encounter-shell is-right"><i></i></div>

    <svg class="encounter-instruments" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" fill="none">
      <g class="encounter-orbit is-outer">
        <circle class="encounter-ring-draw" cx="800" cy="500" r="354" pathLength="100" />
        <circle class="encounter-ring-segments" cx="800" cy="500" r="374" pathLength="100" />
        <path class="encounter-ring-tabs" d="M778 110h44m-44 780h44M410 478v44m780-44v44" />
      </g>
      <g class="encounter-orbit is-inner">
        <circle class="encounter-ring-ticks" cx="800" cy="500" r="306" pathLength="100" />
        <path
          class="encounter-ring-arcs"
          d="M590 285a300 300 0 0 1 330-61m111 104a300 300 0 0 1 28 316M986 736a300 300 0 0 1-329 22M540 650a300 300 0 0 1 24-335"
        />
      </g>
      <g class="encounter-registration">
        <path d="M165 375v-75h120M1435 375v-75h-120M165 625v75h120M1435 625v75h-120" />
        <path d="M800 112v38m0 700v38M412 500h38m700 0h38" />
        <path d="m106 499 9-9 9 9-9 9Zm1370 0 9-9 9 9-9 9Z" />
      </g>
    </svg>

    <div class="encounter-type-echo is-upper">ENCOUNTER</div>
    <div class="encounter-type-echo is-lower">ENCOUNTER</div>
    <div class="encounter-type">
      <div
        v-for="fragment in fragments"
        :key="fragment.index"
        class="encounter-type-fragment"
        :style="{
          '--fragment-clip': fragment.clip,
          '--fragment-x': fragment.x,
          '--fragment-y': fragment.y,
          '--fragment-out': fragment.out,
          '--fragment-delay': fragment.delay,
        }"
      >
        <span>ENCOUNTER</span>
      </div>
      <div class="encounter-type-glint"><span>ENCOUNTER</span></div>
    </div>

    <div class="encounter-overline"><i></i><span>BATTLE FUCK</span><i></i></div>
    <div class="encounter-caption"><i></i><span>对战即将开始</span><i></i></div>
    <div class="encounter-fragments">
      <i v-for="n in 6" :key="n" :style="{ '--fragment': n }"></i>
    </div>
    <svg class="encounter-cut" viewBox="0 0 1600 1000" preserveAspectRatio="none" fill="none">
      <path class="encounter-cut-halo" d="M992-10 608 1010" pathLength="100" />
      <path class="encounter-cut-core" d="M992-10 608 1010" pathLength="100" />
      <path class="encounter-cut-echo" d="M1003-10 619 1010" pathLength="100" />
    </svg>
    <div class="encounter-cross-light"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ opening: boolean; reducedMotion?: boolean }>();

// Each copy exposes a different diagonal strip; the assembled word stays crisp at every size.
const fragments = Array.from({ length: 6 }, (_, index) => {
  const start = (index * 100) / 6;
  const end = ((index + 1) * 100) / 6;
  const direction = index % 2 === 0 ? -1 : 1;
  return {
    index,
    clip: `polygon(${start - 4}% -5%, ${end - 4 + 0.15}% -5%, ${end + 4 + 0.15}% 105%, ${start + 4}% 105%)`,
    x: `${direction * (70 + index * 12)}px`,
    y: `${-direction * (24 + index * 8)}px`,
    out: `${index < 3 ? -135 : 135}%`,
    delay: `${120 + index * 38}ms`,
  };
});
</script>

<style scoped lang="scss">
.encounter-opening {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 4;
  pointer-events: none;
  container: encounter / inline-size;
  color: #e6fcff;
  --encounter-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --encounter-type: clamp(30px, 11.5cqi, 190px);
}
.encounter-shell {
  position: absolute;
  inset: -1px;
  background: radial-gradient(ellipse at 52% 45%, #075fa2 0, #07396f 32%, #061b40 63%, #04132d 100%);
  transition: transform 650ms cubic-bezier(0.72, 0, 0.2, 1);
  will-change: transform;

  &.is-left {
    clip-path: polygon(0 0, 62.1% 0, 38.1% 100%, 0 100%);
  }
  &.is-right {
    clip-path: polygon(62% 0, 100% 0, 100% 100%, 38% 100%);
  }
  i {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      131deg,
      transparent 39.9%,
      #22bded12 40%,
      #22bded12 45%,
      transparent 45.1% 67%,
      #36d6f80a 67.1% 73%,
      transparent 73.1%
    );
  }
}
.encounter-instruments {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: #57def2;
  opacity: 0.7;
  transition:
    opacity 230ms ease,
    transform 650ms var(--encounter-ease);
}
.encounter-orbit {
  transform-origin: 800px 500px;
  &.is-outer {
    animation: encounter-orbit-forward 13s linear infinite;
  }
  &.is-inner {
    animation: encounter-orbit-backward 19s linear infinite;
  }
}
.encounter-ring-draw {
  stroke: currentColor;
  stroke-width: 1.3;
  stroke-dasharray: 100;
  animation: encounter-ring-draw 670ms 70ms var(--encounter-ease) both;
}
.encounter-ring-segments {
  stroke: currentColor;
  stroke-width: 4;
  stroke-dasharray: 14 9 2 9;
  opacity: 0.35;
  animation: encounter-ring-arrive 550ms 130ms var(--encounter-ease) both;
}
.encounter-ring-tabs {
  stroke: #c6fcff;
  stroke-width: 4;
  opacity: 0.5;
}
.encounter-ring-ticks {
  stroke: #9df4ff;
  stroke-width: 10;
  stroke-dasharray: 0.16 1.84;
  opacity: 0.22;
  animation: encounter-ring-arrive 580ms 220ms var(--encounter-ease) both;
}
.encounter-ring-arcs {
  stroke: #8ceaff;
  stroke-width: 1;
  opacity: 0.4;
  animation: encounter-ring-arrive 550ms 250ms var(--encounter-ease) both;
}
.encounter-registration {
  stroke: #9ef0ff;
  stroke-width: 1.2;
  opacity: 0.45;
  transform-origin: 800px 500px;
  animation: encounter-registration 600ms 120ms var(--encounter-ease) both;
}
.encounter-type,
.encounter-type-echo {
  position: absolute;
  left: 2%;
  right: 2%;
  top: 34%;
  height: 29%;
  font-family: 'Bahnschrift', 'Arial Narrow', sans-serif;
  font-size: var(--encounter-type);
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.065em;
  line-height: 1;
  white-space: nowrap;
  transform: rotate(-5deg);
}
.encounter-type-echo {
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  -webkit-text-stroke: 1px #6bc7ed;
  opacity: 0;
  animation: encounter-echo-arrive 700ms var(--encounter-ease) both;

  &.is-upper {
    top: 22%;
    left: -5%;
    right: 5%;
    --echo-x: -12%;
    animation-delay: 70ms;
  }
  &.is-lower {
    top: 46%;
    left: 5%;
    right: -5%;
    --echo-x: 12%;
    animation-delay: 150ms;
  }
}
.encounter-type-fragment,
.encounter-type-glint {
  position: absolute;
  inset: 0;
  span {
    position: absolute;
    top: 50%;
    left: 50%;
    width: max-content;
    transform: translate(-50%, -50%);
  }
}
.encounter-type-fragment {
  clip-path: var(--fragment-clip);
  color: #f0fdff;
  text-shadow:
    0 5px 0 #005294,
    0 0 28px #30cfff29;
  animation: encounter-fragment-assemble 540ms var(--fragment-delay) var(--encounter-ease) both;
}
.encounter-type-glint {
  color: #fff;
  clip-path: polygon(-30% 0, -25% 0, -35% 100%, -40% 100%);
  animation: encounter-type-glint 400ms 550ms ease-out both;
}
.encounter-overline,
.encounter-caption {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  left: 13%;
  right: 13%;
  color: #9beeff;
  font-weight: 700;
  animation: encounter-label-in 520ms 330ms var(--encounter-ease) both;
  transition: opacity 180ms ease;
  i {
    display: block;
    height: 1px;
    width: clamp(24px, 6cqi, 100px);
    background: #79eaff70;
  }
}
.encounter-overline {
  top: 29%;
  font-size: clamp(8px, 0.8cqi, 13px);
  letter-spacing: 0.55em;
}
.encounter-caption {
  top: 70%;
  font-size: clamp(10px, 1.15cqi, 17px);
  letter-spacing: 0.65em;
  span {
    padding-left: 0.65em;
  }
}
.encounter-fragments {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.75;
  i {
    position: absolute;
    left: calc(13% + var(--fragment) * 10%);
    top: calc(20% + var(--fragment) * 8%);
    width: calc(8px + var(--fragment) * 2px);
    height: 2px;
    background: #6cecff;
    transform: rotate(-28deg);
    animation: encounter-small-fragment 700ms calc(100ms + var(--fragment) * 32ms) ease-out both;
  }
}
.encounter-cut {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition: opacity 250ms ease;
  path {
    stroke-dasharray: 100;
    animation: encounter-slash-in 450ms cubic-bezier(0.7, 0, 0.2, 1) both;
  }
}
.encounter-cut-halo {
  stroke: #21cbff;
  stroke-width: 10;
  opacity: 0.2;
}
.encounter-cut-core {
  stroke: #d5ffff;
  stroke-width: 1.8;
}
.encounter-cut-echo {
  stroke: #48cfea;
  stroke-width: 0.8;
  opacity: 0.55;
}
.encounter-cross-light {
  position: absolute;
  top: 49%;
  left: 8%;
  right: 8%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #b7faff 50%, transparent);
  transform: rotate(-5deg);
  animation: encounter-cross-light 730ms 120ms ease-out both;
}
.is-opening {
  .encounter-shell.is-left {
    transform: translateX(-110%);
  }
  .encounter-shell.is-right {
    transform: translateX(110%);
  }
  .encounter-instruments {
    opacity: 0;
    transform: scale(1.18) rotate(9deg);
  }
  .encounter-type-fragment {
    animation: encounter-fragment-release 600ms cubic-bezier(0.66, 0, 0.24, 1) both;
  }
  .encounter-type-echo {
    animation: encounter-echo-release 420ms ease-in both;
  }
  .encounter-type-glint,
  .encounter-overline,
  .encounter-caption,
  .encounter-fragments,
  .encounter-cross-light {
    visibility: hidden;
  }
  .encounter-cut {
    opacity: 0;
  }
}
.is-reduced {
  .encounter-orbit {
    animation: none;
  }
  .encounter-type-fragment {
    animation: encounter-label-in 120ms ease-out both;
  }
  .encounter-type-glint,
  .encounter-fragments,
  .encounter-cross-light {
    display: none;
  }
  .encounter-type-echo {
    animation-duration: 120ms;
    animation-delay: 0ms;
  }
  .encounter-cut path {
    animation-duration: 120ms;
  }
  .encounter-shell {
    transition-duration: 160ms;
  }
  &.is-opening {
    .encounter-type-fragment,
    .encounter-type-echo {
      animation: encounter-reduced-out 140ms ease-out both;
    }
    .encounter-instruments {
      transform: none;
      transition-duration: 140ms;
    }
  }
}
@container encounter (max-width: 600px) {
  .encounter-type,
  .encounter-type-echo {
    font-size: 11cqi;
  }
  .encounter-overline {
    top: 35%;
    font-size: 7px;
    letter-spacing: 0.35em;
  }
  .encounter-caption {
    top: 62%;
    font-size: 10px;
    letter-spacing: 0.35em;
    gap: 10px;
  }
  .encounter-type-echo.is-upper {
    top: 25%;
  }
  .encounter-type-echo.is-lower {
    top: 43%;
  }
  .encounter-instruments {
    width: 160%;
    left: -30%;
  }
}
@keyframes encounter-orbit-forward {
  to {
    transform: rotate(360deg);
  }
}
@keyframes encounter-orbit-backward {
  to {
    transform: rotate(-360deg);
  }
}
@keyframes encounter-ring-draw {
  from {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  to {
    stroke-dashoffset: 0;
    opacity: 0.75;
  }
}
@keyframes encounter-ring-arrive {
  from {
    opacity: 0;
    stroke-dashoffset: 35;
  }
}
@keyframes encounter-registration {
  from {
    opacity: 0;
    transform: scaleX(1.08);
  }
}
@keyframes encounter-echo-arrive {
  from {
    opacity: 0;
    translate: var(--echo-x) 0;
  }
  to {
    opacity: 0.19;
    translate: 0 0;
  }
}
@keyframes encounter-fragment-assemble {
  0% {
    opacity: 0;
    transform: translate(var(--fragment-x), var(--fragment-y));
  }
  70% {
    opacity: 1;
    transform: translate(0, 0);
  }
  100% {
    opacity: 1;
    transform: translate(0, 0);
  }
}
@keyframes encounter-type-glint {
  to {
    clip-path: polygon(130% 0, 135% 0, 125% 100%, 120% 100%);
  }
}
@keyframes encounter-label-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes encounter-small-fragment {
  0% {
    opacity: 0;
    translate: -40px 15px;
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    translate: 50px -20px;
  }
}
@keyframes encounter-slash-in {
  from {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  45% {
    opacity: 1;
  }
  to {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}
@keyframes encounter-cross-light {
  0% {
    opacity: 0;
    scale: 0.2 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    scale: 1.1 1;
  }
}
@keyframes encounter-fragment-release {
  from {
    opacity: 1;
    transform: translate(0, 0);
  }
  to {
    opacity: 0;
    transform: translate(var(--fragment-out), 0);
  }
}
@keyframes encounter-echo-release {
  from {
    opacity: 0.19;
    translate: 0 0;
  }
  to {
    opacity: 0;
    translate: var(--echo-x) 0;
  }
}
@keyframes encounter-reduced-out {
  to {
    opacity: 0;
  }
}
</style>
