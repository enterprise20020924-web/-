<template>
  <svg class="archive-welcome-seal" viewBox="0 0 420 370" fill="none" aria-hidden="true">
    <defs>
      <linearGradient :id="paperGradient" x1="113" y1="38" x2="337" y2="335" gradientUnits="userSpaceOnUse">
        <stop stop-color="#fff" />
        <stop offset="1" stop-color="#eef8ff" />
      </linearGradient>
      <linearGradient :id="blueGradient" x1="137" y1="121" x2="291" y2="255" gradientUnits="userSpaceOnUse">
        <stop stop-color="#087cde" />
        <stop offset="1" stop-color="#1465bd" />
      </linearGradient>
    </defs>

    <circle cx="218" cy="190" r="163" fill="#e4f4fc" />
    <path d="M44 190H398M218 12V366" stroke="#c3e1ee" stroke-width="1" />
    <circle cx="218" cy="190" r="176" stroke="#bad9eb" stroke-width="1" stroke-dasharray="3 9" />
    <path d="M44 163A176 176 0 0 1 159 24M276 356A176 176 0 0 0 394 203" stroke="#37cee6" stroke-width="5" />
    <path d="M19 105h16m-8-8v16M382 291h16m-8-8v16" stroke="#087cde" stroke-width="1.5" />
    <path d="m351 39 6 9 10 3-9 6-3 10-6-9-10-3 9-6Z" fill="#37cee6" />
    <circle cx="58" cy="303" r="5" fill="#dce95e" />

    <g transform="rotate(8 216 185)">
      <path d="M103 48h181l36 36v246H103Z" fill="#8ab6cf" opacity=".12" transform="translate(5 7)" />
      <path d="M103 48h181l36 36v246H103Z" :fill="`url(#${paperGradient})`" stroke="#b1d2e5" stroke-width="1.3" />
      <path d="M284 48v36h36" fill="#d9effb" stroke="#b1d2e5" stroke-width="1.3" />
      <path d="M103 48h12v282h-12Z" fill="#163f61" />
      <path d="M133 76h94M133 82h63" stroke="#9dbccd" stroke-width="2" />
      <path d="M133 98h159" stroke="#c8e0ed" />

      <circle cx="217" cy="190" r="76" :fill="`url(#${blueGradient})`" />
      <circle cx="217" cy="190" r="86" stroke="#72d5e6" stroke-width="1" />
      <circle cx="217" cy="190" r="92" stroke="#087cde" stroke-width="1" stroke-dasharray="38 9 4 9" />
      <circle cx="217" cy="104" r="4" fill="#37cee6" />
      <circle cx="217" cy="276" r="4" fill="#dce95e" />
      <AmamiMark
        x="151"
        y="148"
        width="132"
        height="80"
        style="position: static; width: 132px; height: 80px; color: #fff; transform: none; opacity: 1"
      />
      <path d="M188 240h58" stroke="#8ce8f1" stroke-width="1.5" />
      <text x="217" y="255" text-anchor="middle" fill="#fff" font-size="8" letter-spacing="3">AMAMI ACADEMY</text>

      <path d="M136 295h54M136 303h33" stroke="#adcbdc" stroke-width="2" />
      <path d="M265 290v16m4-16v16m5-16v16m3-16v16m6-16v16m4-16v16m3-16v16" stroke="#163f61" stroke-width="2" />
    </g>

    <g transform="rotate(-7 103 285)">
      <path d="M30 265h140l13 13v31H30Z" fill="#163f61" />
      <path d="M30 265h5v44h-5Z" fill="#dce95e" />
      <text x="49" y="284" fill="#fff" font-size="13" font-weight="700" letter-spacing="2">入学档案</text>
      <text x="49" y="299" fill="#98ddef" font-size="7" letter-spacing="2">STUDENT RECORD</text>
    </g>
    <path d="m322 114 8-8 8 8-8 8Z" fill="#dce95e" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import AmamiMark from '../../../正文前端V1.99/vector/AmamiMark.vue';

const id = `admission-cover-${useId()}`;
const paperGradient = `${id}-paper`;
const blueGradient = `${id}-blue`;
</script>
