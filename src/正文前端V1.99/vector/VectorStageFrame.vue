<template>
  <g>
    <defs>
      <linearGradient :id="`${uid}-chassis`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#09164a" />
        <stop offset="50%" stop-color="#0f236e" />
        <stop offset="100%" stop-color="#071240" />
      </linearGradient>
      <linearGradient :id="`${uid}-inlay`" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stop-color="#eef5fc" />
        <stop offset="52%" stop-color="#e3eef9" />
        <stop offset="100%" stop-color="#d6e6f6" />
      </linearGradient>
      <linearGradient :id="`${uid}-rim`" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#56b8ff" />
        <stop offset=".5" stop-color="#24e2f8" />
        <stop offset="1" stop-color="#3a8ef0" />
      </linearGradient>
      <linearGradient :id="`${uid}-rail`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#153ec4" />
        <stop offset="55%" stop-color="#0c2074" />
        <stop offset="100%" stop-color="#07134b" />
      </linearGradient>
      <linearGradient :id="`${uid}-time-plate`" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0%" stop-color="#071248" />
        <stop offset="58%" stop-color="#0d227a" />
        <stop offset="100%" stop-color="#163ae0" />
      </linearGradient>
      <path :id="`${uid}-spark`" d="M0-17 4-4 17 0 4 4 0 17-4 4-17 0-4-4Z" />
      <g :id="`${uid}-corner-mark`" fill="#16388f" opacity=".62">
        <path d="M-2-14h4v9h-4ZM-2 5h4v9h-4ZM-14-2h9v4h-9ZM5-2h9v4H5Z" />
        <rect x="-2" y="-2" width="4" height="4" fill="#24e2f8" opacity="1" />
      </g>
    </defs>

    <g v-for="(layout, mode) in stageLayouts" :key="mode" :class="`bpv-frame-${mode}`">
      <!-- Layer 1: Deep Academy Navy outer chassis -->
      <path
        data-frame-outer
        :d="`${outerFramePath} ${stageWindowPath(mode)}`"
        :fill="`url(#${uid}-chassis)`"
        fill-rule="evenodd"
        stroke="#3674d8"
        stroke-opacity=".68"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Layer 2: Cool Pearl-Silver inlaid academy bezel -->
      <path
        data-frame-inlay
        :d="`${inlayFramePath} ${stageWindowPath(mode)}`"
        :fill="`url(#${uid}-inlay)`"
        fill-rule="evenodd"
        :stroke="`url(#${uid}-rim)`"
        stroke-opacity=".75"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- Inner screen structural trim: deep navy recess + crisp electric-cyan hairline -->
      <path
        data-window-outline
        :d="stageWindowPath(mode)"
        stroke="#0c2070"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path :d="stageWindowPath(mode, -5)" stroke="#88caff" stroke-opacity=".75" stroke-width="1.2" stroke-linejoin="round" />

      <g v-if="mode === 'wide'">
        <path
          data-map-slot
          :d="stageMapDockPath(stageLayouts.wide.map)"
          fill="#dceaf8"
          stroke="#7ab8eb"
          stroke-width="1.6"
        />
        <!-- Side academy navy structural rails (replacing bright sky-blue cushions) -->
        <path d="M17 336 45 358v172l-28 22Z" :fill="`url(#${uid}-rail)`" />
        <path d="m17 336 28 22v172l-28 22" stroke="#24e2f8" stroke-opacity=".82" stroke-width="1.5" />
        <path d="M1583 348 1555 370v114l28 22Z" :fill="`url(#${uid}-rail)`" />
        <path d="m1583 348-28 22v114l28 22" stroke="#24e2f8" stroke-opacity=".82" stroke-width="1.5" />
        <g fill="#e8fbff">
          <use :href="`#${uid}-spark`" transform="translate(31 444) scale(.52)" />
          <use :href="`#${uid}-spark`" transform="translate(1569 427) scale(.52)" />
        </g>
        <!-- Refined academy navy indicator rails & nodes -->
        <path d="M33 603v128M1567 557v156" stroke="#183b9e" stroke-opacity=".55" stroke-width="1.8" />
        <path d="M33 603v26M1567 557v26" stroke="#24e2f8" stroke-width="2" />
        <g fill="#0e2478">
          <rect x="29" y="576" width="8" height="8" transform="rotate(45 33 580)" />
          <rect x="1563" y="520" width="8" height="8" transform="rotate(45 1567 524)" />
        </g>
        <!-- Top-left & top-right precision academy ticks (replacing baby-blue dots) -->
        <g>
          <path d="m170 46 6-7h12l-6 7Z" fill="#0d2275" />
          <path d="m190 46 6-7h12l-6 7Z" fill="#1638e8" />
          <path d="m210 46 6-7h12l-6 7Z" fill="#24e2f8" />
          <path d="m1398 46 6-7h12l-6 7Z" fill="#24e2f8" />
          <path d="m1418 46 6-7h12l-6 7Z" fill="#1638e8" />
          <path d="m1438 46 6-7h12l-6 7Z" fill="#0d2275" />
        </g>
        <g :fill="`url(#${uid}-blue)`">
          <use :href="`#${uid}-spark`" transform="translate(61 63) scale(.88)" />
          <g class="bpv-battle-slot-decoration">
            <path d="m313 39-12 14h8l12-14Zm15 0-12 14h8l12-14Zm15 0-12 14h8l12-14Z" />
            <path d="m358 39-12 14h8l12-14Z" fill="#f43252" />
          </g>
          <path d="m1422 954-12 14h7l12-14Zm16 0-12 14h7l12-14Zm16 0-12 14h7l12-14Z" />
          <path d="m1470 954-12 14h7l12-14Z" fill="#f43252" />
          <path d="M1316 958h8v7h-8Zm17 0h8v7h-8Zm17 0h8v7h-8Z" opacity=".82" />
          <path d="M1367 958h8v7h-8Z" fill="#24e2f8" />
        </g>
        <path d="M118 962h96" stroke="#1638e8" stroke-opacity=".55" stroke-width="2" />
        <path d="M118 962h24" stroke="#24e2f8" stroke-width="2" />
        <use :href="`#${uid}-corner-mark`" transform="translate(50 959)" />
        <use :href="`#${uid}-corner-mark`" transform="translate(1548 959)" />
        <use :href="`#${uid}-corner-mark`" transform="translate(1544 66) scale(.75)" />
      </g>
      <g v-else>
        <g class="bpv-battle-slot-decoration">
          <use :href="`#${uid}-spark`" transform="translate(82 64) scale(1.4)" fill="#1638e8" />
          <path d="M118 65h201M118 87h138" stroke="#68a8e8" stroke-width="3" />
        </g>
        <use :href="`#${uid}-corner-mark`" transform="translate(70 962)" />
        <use :href="`#${uid}-corner-mark`" transform="translate(1530 962)" />
      </g>

      <g class="bpv-header-plates" stroke-linejoin="round">
        <!-- 地点牌压在时间牌后方；时间牌使用深靛结构底座自然衔接深色外甲，消除突兀白边。 -->
        <path :d="locationPlatePath(layout.location)" fill="#dceaf8" stroke="#0c1f6b" stroke-width="7" />
        <path
          data-location-plate
          :d="locationPlatePath(layout.location)"
          :fill="`url(#${uid}-glass)`"
          stroke="#5ab2f8"
          stroke-width="1.6"
        />
        <path
          :d="`M${layout.location.x + layout.location.height * 0.45 + 18} ${layout.location.y + layout.location.height - 2.5}H${layout.location.x + layout.location.width - layout.location.height * 0.45 - 18}`"
          stroke="#24e2f8"
          stroke-width="2"
          opacity=".9"
        />
        <path :d="timePlatePath(layout.clock)" fill="#081448" stroke="#09174f" stroke-width="10" />
        <path
          data-time-plate
          :d="timePlatePath(layout.clock)"
          :fill="`url(#${uid}-time-plate)`"
          stroke="#24e2f8"
          stroke-width="1.8"
        />
        <path
          :d="`M${layout.clock.x + layout.clock.height / 3 + 6} ${layout.clock.y + 2.5}H${layout.clock.x + layout.clock.height / 3 + 42}`"
          stroke="#f43252"
          stroke-width="3"
          stroke-linecap="round"
        />
      </g>
    </g>
  </g>
</template>

<script setup lang="ts">
import { stageLayouts, stageMapDockPath, stageWindowPath } from './stage-layout';
import type { StageRect } from './stage-layout';

defineProps<{ uid: string }>();

const outerFramePath = 'M45 22H1555l39 39v904l-39 35H45L6 961V61Z';
const inlayFramePath = 'M50 32H1550l33 33v894l-32 30H50l-33-32V65Z';

function timePlatePath({ x, y, width, height }: StageRect) {
  const cut = height / 3;
  return `M${x + cut} ${y}H${x + width - cut}L${x + width} ${y + height / 2}L${x + width - cut} ${y + height}H${x + cut}L${x} ${y + height / 2}Z`;
}

function locationPlatePath({ x, y, width, height }: StageRect) {
  const taper = height * 0.45;
  const radius = 6;
  const turn = (taper / height) * radius;
  const right = x + width;
  const bottom = y + height;
  return `M${x + radius} ${y}H${right - radius}Q${right} ${y} ${right - turn} ${y + radius}L${right - taper + turn} ${bottom - radius}Q${right - taper} ${bottom} ${right - taper - radius} ${bottom}H${x + taper + radius}Q${x + taper} ${bottom} ${x + taper - turn} ${bottom - radius}L${x + turn} ${y + radius}Q${x} ${y} ${x + radius} ${y}Z`;
}
</script>
