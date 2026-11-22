<template>
  <svg class="sk-amami-mark" viewBox="245 237 3620 2188" fill="currentColor" role="img" aria-label="AMAMI">
    <title>AMAMI</title>
    <defs>
      <mask
        :id="inkMaskId"
        x="245"
        y="237"
        width="3620"
        height="2188"
        maskUnits="userSpaceOnUse"
        style="mask-type: alpha"
      >
        <g :transform="amamiVector.transform" fill="#fff" style="isolation: isolate">
          <path
            v-for="(layer, index) in amamiVector.layers"
            :key="index"
            :d="layer.d"
            :opacity="layer.opacity"
            style="mix-blend-mode: plus-lighter"
          />
        </g>
      </mask>
    </defs>
    <!-- The mask contains only traced Bezier paths; currentColor is applied once. -->
    <rect x="245" y="237" width="3620" height="2188" :mask="`url(#${inkMaskId})`" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { amamiVector } from './amami-vector';

const inkMaskId = `amami-vector-${useId()}`;
</script>
