<template>
  <div class="bp-stage-map-dock" :style="dockStyle">
    <button
      type="button"
      class="bp-stage-talent-button"
      aria-label="天赋星盘"
      @click="emit('open-talent', $event)"
    >
      <svg class="bp-stage-talent-plate" :viewBox="`0 0 ${talentRect.width} ${talentRect.height}`" preserveAspectRatio="none" aria-hidden="true">
        <path class="bp-stage-talent-rim" :d="stageTalentDockPath(talentRect, 1.5)" />
        <path class="bp-stage-talent-surface" :d="stageTalentDockPath(talentRect, 3)" />
        <path class="bp-stage-talent-accent" :d="`M${talentRect.width / 2 - 54} ${talentRect.height - 2.5}h108`" />
      </svg>
      <span class="bp-stage-talent-copy">
        <AmamiMark class="bp-stage-talent-icon" aria-hidden="true" />
        <span>星盘</span>
      </span>
    </button>
    <button
      type="button"
      class="bp-stage-map-button"
      aria-label="地图"
      aria-haspopup="dialog"
      @click="emit('open', $event)"
    >
      <svg
        class="bp-stage-map-plate"
        :viewBox="`0 0 ${plateRect.width} ${plateRect.height}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path class="bp-stage-map-rim" :d="stageMapDockPath(plateRect, 1.5)" />
        <path class="bp-stage-map-surface" :d="stageMapDockPath(plateRect, 3)" />
        <path class="bp-stage-map-accent" :d="`M${plateRect.width / 2 - 54} ${plateRect.height - 2.5}h108`" />
      </svg>
      <span class="bp-stage-map-copy">
        <span class="bp-stage-map-chevron" aria-hidden="true"></span>
        <svg class="bp-stage-map-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" />
          <path d="M9 3v16M15 5v16" />
        </svg>
        <span class="bp-stage-map-label">地图</span>
        <span class="bp-stage-map-chevron is-right" aria-hidden="true"></span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { stageLayouts, stageMapDockPath, stageTalentDockPath, stageDockCut } from '../../vector/stage-layout';
import AmamiMark from '../../vector/AmamiMark.vue';

const plateRect = { ...stageLayouts.wide.map, x: 0, y: 0 };
const talentRect = { ...stageLayouts.wide.talent, x: 0, y: 0 };
const dockStyle = {
  '--bp-talent-dock-left': `${(stageLayouts.wide.talent.x - stageLayouts.wide.map.x) / plateRect.width * 100}%`,
  '--bp-talent-dock-top': `${(stageLayouts.wide.talent.y - stageLayouts.wide.map.y) / plateRect.height * 100}%`,
  '--bp-talent-dock-width': `${talentRect.width / plateRect.width * 100}%`,
  '--bp-talent-dock-height': `${talentRect.height / plateRect.height * 100}%`,
  '--bp-talent-cut': `${stageDockCut(talentRect) / talentRect.width * 100}%`,
  '--bp-map-cut': `${stageDockCut(plateRect) / plateRect.width * 100}%`,
};
const emit = defineEmits<{ open: [event: MouseEvent]; 'open-talent': [event: MouseEvent] }>();
</script>
