<template>
  <img class="bp-arona-assistant" :src="aronaUrl" alt="" aria-hidden="true" decoding="async" draggable="false" />
</template>

<script setup lang="ts">
import { resolveFullbodyAssetUrl } from '../portrait-registry';

const aronaUrl = resolveFullbodyAssetUrl('阿洛娜.png');
</script>

<style>
.bp-arona-assistant {
  display: block;
  object-fit: contain;
  object-position: center;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 5px 9px rgb(36 151 217 / 16%));
  animation: bp-arona-float 4.5s ease-in-out infinite;
}

@keyframes bp-arona-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bp-arona-assistant {
    animation: none;
  }
}
</style>
