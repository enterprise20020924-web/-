<template>
  <figure class="bp-cameo-standee" :class="{ 'is-avatar-only': !konataCameo.portraitUrl }">
    <img
      v-if="konataCameo.portraitUrl"
      class="bp-cameo-fullbody"
      :src="konataCameo.portraitUrl"
      :alt="konataCameo.name"
    />
    <div v-else class="bp-cameo-medallion">
      <img :src="konataCameo.avatarUrl" :alt="`${konataCameo.name}头像`" />
      <span class="bp-cameo-name">{{ konataCameo.name }}</span>
    </div>
  </figure>
</template>
<script setup lang="ts">
import { konataCameo } from './cameo-profile';
</script>
<style scoped>
.bp-cameo-standee {
  position: absolute;
  z-index: 3;
  inset: 4% 25% 0;
  margin: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  animation: cameo-enter 280ms ease-out both;
}
.bp-cameo-fullbody {
  max-width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 10px 12px #173e6040);
}
.bp-cameo-standee.is-avatar-only {
  align-items: center;
  bottom: 30%;
}
.bp-cameo-medallion {
  display: grid;
  justify-items: center;
  width: clamp(80px, 12cqi, 150px);
  padding: 8px 8px 0;
  border: 1px solid #b6e6ff;
  border-radius: 50% 50% 12px 12px;
  background: linear-gradient(165deg, #fffffff5, #dff6fff0);
  box-shadow:
    0 6px 26px #3f88b32b,
    inset 0 0 0 4px #ffffff80;
}
.bp-cameo-medallion img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 50%;
}
.bp-cameo-medallion .bp-cameo-name {
  padding: 6px 14px 8px;
  color: #09639b;
  font-size: clamp(13px, 1.5cqi, 20px);
  font-weight: 800;
  letter-spacing: 0.12em;
}
@keyframes cameo-enter {
  from {
    opacity: 0;
    translate: 0 8px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bp-cameo-standee {
    animation: none;
  }
}
</style>
