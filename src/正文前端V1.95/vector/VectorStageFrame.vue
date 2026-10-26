<template>
  <g>
    <defs>
      <linearGradient :id="`${uid}-rim`" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#c1e5ff" />
        <stop offset=".48" stop-color="#e4f2ff" />
        <stop offset="1" stop-color="#abd9ff" />
      </linearGradient>
      <linearGradient :id="`${uid}-rail`" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="#27a4ff" />
        <stop offset=".5" stop-color="#57d5ff" />
        <stop offset="1" stop-color="#16a4f7" />
      </linearGradient>
      <path :id="`${uid}-spark`" d="M0-17 4-4 17 0 4 4 0 17-4 4-17 0-4-4Z" />
      <g :id="`${uid}-pixels`" fill="#1aafff">
        <path d="M-3-20h6v6h-6ZM-3-10h6v6h-6ZM-3 0h6v6h-6ZM-3 10h6v6h-6Z" />
        <path d="M-13 0h6v6h-6ZM7 0h6v6H7ZM-13-10h6v6h-6ZM7-10h6v6H7Z" opacity=".7" />
        <path d="M-23 0h6v6h-6ZM17 0h6v6h-6Z" />
      </g>
    </defs>

    <g v-for="(layout, mode) in stageLayouts" :key="mode" :class="`bpv-frame-${mode}`">
      <path
        :d="`${outerFramePath} ${stageWindowPath(mode)}`"
        :fill="`url(#${uid}-metal)`"
        fill-rule="evenodd"
        stroke="#fff"
        stroke-width="5"
        stroke-linejoin="round"
      />
      <path
        d="M48 29H551l13-15h472l13 15h503l34 34v901l-33 29H48l-35-34V64Z"
        :stroke="`url(#${uid}-rim)`"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <path
        data-window-outline
        :d="stageWindowPath(mode)"
        stroke="#9dcaff"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <path :d="stageWindowPath(mode, -7)" stroke="#e6f2ff" stroke-width="3" stroke-linejoin="round" />

      <g v-if="mode === 'wide'">
        <path
          data-map-slot
          :d="stageMapDockPath(stageLayouts.wide.map)"
          fill="#f6fcff"
          stroke="#d7eaff"
          stroke-width="2"
        />
        <path d="M17 332 45 354v179l-28 23Z" :fill="`url(#${uid}-rail)`" />
        <path d="m17 332 28 22v179l-28 23" stroke="#b7edff" stroke-width="2" />
        <path d="M1583 332 1555 354v123l28 23Z" :fill="`url(#${uid}-rail)`" />
        <path d="m1583 332-28 22v123l28 23" stroke="#b7edff" stroke-width="2" />
        <g fill="#f6fdff">
          <use :href="`#${uid}-spark`" transform="translate(31 444) scale(.6)" />
          <use :href="`#${uid}-spark`" transform="translate(1569 433) scale(.6)" />
        </g>
        <path d="M34 603v129M1566 557v158" stroke="#259eff" stroke-width="2" />
        <path d="M34 603v21M1566 557v21" stroke="#88e1ff" stroke-width="2" />
        <g fill="#249eff">
          <circle cx="34" cy="580" r="5" />
          <circle cx="1566" cy="524" r="5" />
          <circle v-for="x in [179, 201, 223, 1403, 1425, 1447]" :key="x" :cx="x" cy="45" r="5.5" />
        </g>
        <g :fill="`url(#${uid}-blue)`">
          <use :href="`#${uid}-spark`" transform="translate(61 63)" />
          <path d="m313 37-14 17h9l14-17Zm17 0-14 17h9l14-17Zm17 0-14 17h9l14-17Z" />
          <path d="m364 37-14 17h9l14-17Z" opacity=".5" />
          <path d="m1422 958-14 15h8l14-15Zm17 0-14 15h8l14-15Zm17 0-14 15h8l14-15Zm17 0-14 15h8l14-15Z" />
          <path d="M1314 962h9v9h-9Zm19 0h9v9h-9Zm19 0h9v9h-9Zm19 0h9v9h-9Z" />
        </g>
        <path d="M118 967h110" stroke="#26b5ff" stroke-width="2" />
        <use :href="`#${uid}-pixels`" transform="translate(49 959) scale(.85)" />
        <use :href="`#${uid}-pixels`" transform="translate(1548 960) scale(.85)" />
        <use :href="`#${uid}-pixels`" transform="translate(1544 67) scale(.65)" opacity=".7" />
      </g>
      <g v-else>
        <use :href="`#${uid}-spark`" transform="translate(82 64) scale(1.6)" fill="#38baf4" />
        <path d="M118 65h201M118 87h138" stroke="#b4e1f7" stroke-width="3" />
        <use :href="`#${uid}-pixels`" transform="translate(70 962)" />
        <use :href="`#${uid}-pixels`" transform="translate(1530 962)" />
      </g>

      <g class="bpv-header-plates">
        <path :d="timePlatePath(insetStageRect(layout.clock, -6), 27)" fill="#fcfeff" stroke="#fff" stroke-width="4" />
        <path
          data-time-plate
          :d="timePlatePath(layout.clock, 24)"
          :fill="`url(#${uid}-glass)`"
          stroke="#8ccaff"
          stroke-width="1.5"
        />
        <path
          :d="locationPlatePath(insetStageRect(layout.location, -6))"
          fill="#fcfeff"
          stroke="#fff"
          stroke-width="4"
        />
        <path
          data-location-plate
          :d="locationPlatePath(layout.location)"
          :fill="`url(#${uid}-glass)`"
          stroke="#8ccaff"
          stroke-width="1.5"
        />
      </g>
    </g>
  </g>
</template>

<script setup lang="ts">
import { insetStageRect, stageLayouts, stageMapDockPath, stageWindowPath } from './stage-layout';
import type { StageRect } from './stage-layout';

defineProps<{ uid: string }>();

const outerFramePath = 'M45 22H548l16-16h472l16 16h503l39 39v904l-39 35H45L6 961V61Z';

function timePlatePath({ x, y, width, height }: StageRect, cut: number) {
  return `M${x + cut} ${y}H${x + width - cut}L${x + width} ${y + height / 2}L${x + width - cut} ${y + height}H${x + cut}L${x} ${y + height / 2}Z`;
}

function locationPlatePath({ x, y, width, height }: StageRect) {
  const taper = Math.min(22, width * 0.07);
  return `M${x + 5} ${y}H${x + width - 5}Q${x + width} ${y} ${x + width - 1} ${y + 5}L${x + width - taper} ${y + height - 4}Q${x + width - taper - 2} ${y + height} ${x + width - taper - 7} ${y + height}H${x + taper + 7}Q${x + taper + 2} ${y + height} ${x + taper} ${y + height - 4}L${x + 1} ${y + 5}Q${x} ${y} ${x + 5} ${y}Z`;
}
</script>
