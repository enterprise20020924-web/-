<template>
  <svg class="sk-amami-mark" viewBox="245 237 3620 2188" fill="currentColor" role="img" aria-label="AMAMI">
    <title>AMAMI</title>
    <defs>
      <filter
        :id="inkFilter"
        x="0"
        y="0"
        width="5741"
        height="2620"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.2126 -0.7152 -0.0722 0 1" />
      </filter>
      <image :id="inkImage" :href="reference" width="5741" height="2620" :filter="`url(#${inkFilter})`" />
      <mask :id="referenceInk" x="0" y="0" width="5741" height="2620" maskUnits="userSpaceOnUse" mask-type="luminance">
        <use :href="`#${inkImage}`" />
      </mask>
      <mask :id="emblemInk" x="0" y="0" width="5741" height="2620" maskUnits="userSpaceOnUse" mask-type="luminance">
        <use :href="`#${inkImage}`" />
        <rect
          v-for="(box, index) in originalLetters"
          :key="index"
          :x="box[0]"
          :y="box[1]"
          :width="box[2]"
          :height="box[3]"
          fill="#000"
        />
      </mask>
      <clipPath :id="emblemBounds">
        <rect x="245" y="237" width="2902" height="1730" />
        <rect x="2058" y="2018" width="412" height="406" />
      </clipPath>
    </defs>
    <!-- Recolor the untouched source pixels; never approximate the crescent or orbit. -->
    <rect x="0" y="0" width="5741" height="2620" :mask="`url(#${emblemInk})`" :clip-path="`url(#${emblemBounds})`" />
    <g v-for="(glyph, index) in amamiLetters" :key="index" :transform="`translate(${glyph.dx} ${glyph.dy})`">
      <rect :x="glyph.x" :y="glyph.y" :width="glyph.width" :height="glyph.height" :mask="`url(#${referenceInk})`" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import reference from '../assets/amami-reference.png?url';

const id = `amami-${useId()}`;
const inkFilter = `${id}-filter`;
const inkImage = `${id}-image`;
const referenceInk = `${id}-reference`;
const emblemInk = `${id}-emblem`;
const emblemBounds = `${id}-bounds`;

// These source bounds include antialiasing without intersecting the original emblem.
const originalLetters = [
  [1367, 1028, 438, 303],
  [1819, 1032, 400, 299],
  [2370, 1042, 270, 296],
  [2773, 1040, 271, 298],
  [3149, 1045, 392, 303],
  [3645, 1043, 540, 304],
  [4278, 1054, 272, 301],
  [4631, 1067, 399, 297],
];

// A, M and I come from the reference lettering, with translation only.
const amamiLetters = [
  { x: 1819, y: 1032, width: 400, height: 299, dx: -452, dy: 16 },
  { x: 3645, y: 1043, width: 540, height: 304, dx: -1796, dy: 0 },
  { x: 1819, y: 1032, width: 400, height: 299, dx: 652, dy: 16 },
  { x: 3645, y: 1043, width: 540, height: 304, dx: -692, dy: 0 },
  { x: 2369, y: 1041, width: 272, height: 298, dx: 1206, dy: 8 },
];
</script>
