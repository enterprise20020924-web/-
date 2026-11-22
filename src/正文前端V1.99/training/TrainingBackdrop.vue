<template>
  <svg class="amami-training-backdrop" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient :id="`${id}-field`" cx=".65" cy=".4" r=".9">
        <stop stop-color="#b30c20" />
        <stop offset=".5" stop-color="#710514" />
        <stop offset="1" stop-color="#190108" />
      </radialGradient>
      <radialGradient :id="`${id}-planet`" cx=".7" cy=".3" r=".8">
        <stop stop-color="#d71a29" />
        <stop offset=".55" stop-color="#81030e" />
        <stop offset="1" stop-color="#2c0007" />
      </radialGradient>
      <linearGradient :id="`${id}-horizon`">
        <stop stop-color="#ffdbbd" stop-opacity="0" />
        <stop offset=".5" stop-color="#ffe7d4" />
        <stop offset="1" stop-color="#ffdbbd" stop-opacity="0" />
      </linearGradient>
      <clipPath :id="`${id}-clip`"><circle cx="350" cy="415" r="650" /></clipPath>
    </defs>
    <path d="M0 0h1600v900H0Z" :fill="`url(#${id}-field)`" />
    <circle cx="350" cy="415" r="650" :fill="`url(#${id}-planet)`" />
    <g :clip-path="`url(#${id}-clip)`" fill="none" stroke="#f75c4b" stroke-opacity=".12">
      <ellipse cx="350" cy="415" rx="650" ry="260" />
      <ellipse cx="350" cy="415" rx="650" ry="460" />
      <ellipse cx="350" cy="415" rx="220" ry="650" />
      <ellipse cx="350" cy="415" rx="450" ry="650" />
      <path d="M-300 415h1300M350-235v1300" />
      <path
        d="m75 20 80 80 110-25 110 50-20 125-96 85 18 115 120 80-20 95-100 20-75-95-90-20-30-110-110-75-30-115 40-120Z"
        fill="#47030c"
        stroke="none"
        opacity=".45"
      />
      <path
        d="m640 100 130 45 85 135-105 105-55 160-95 45-65-110 25-130-60-125Z"
        fill="#47030c"
        stroke="none"
        opacity=".45"
      />
    </g>
    <circle cx="350" cy="415" r="649" fill="none" stroke="#f65549" stroke-opacity=".28" />
    <g class="amami-training-sigil" transform="translate(1330 425)" fill="none" stroke="#f76b5a">
      <g class="amami-training-sigil-orbit">
        <circle r="385" stroke-opacity=".2" />
        <circle r="371" stroke-opacity=".35" />
        <circle r="308" stroke-opacity=".16" />
        <path
          v-for="index in 24"
          :key="index"
          :transform="`rotate(${index * 15})`"
          d="M0-375V-345m-4-22h8"
          stroke-opacity=".45"
        />
        <path
          v-for="index in 12"
          :key="`ray-${index}`"
          :transform="`rotate(${index * 30})`"
          d="m0-350 18 265 85-18-85 35L0 350l-18-368-85-35 85 18Z"
          stroke-opacity=".2"
        />
        <path
          d="m0-290 62 180 189-35-141 145 141 145-189-35L0 290l-62-180-189 35L-110 0l-141-145 189 35Z"
          stroke-opacity=".5"
        />
        <path d="M-385 0h770M0-385v770m-273-273 546 546m0-546-546 546" stroke-opacity=".16" />
        <circle r="120" stroke-opacity=".3" />
        <circle r="98" stroke-opacity=".3" />
      </g>
    </g>
    <path d="M0 720h1600" :stroke="`url(#${id}-horizon)`" stroke-opacity=".3" />
    <path d="M0 742h1600" stroke="#f96655" stroke-opacity=".13" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
const id = `training-field-${useId()}`;
</script>
