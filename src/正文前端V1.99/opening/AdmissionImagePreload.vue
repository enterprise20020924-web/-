<template>
  <aside class="admission-image-preload" :data-state="progress.status" aria-label="阿洛娜 · 图片预载助手">
    <div class="image-preload-assistant">
      <img
        class="image-preload-arona"
        :src="preloadAssistantPortraitUrls[portraitIndex]"
        alt="阿洛娜"
        width="695"
        height="1252"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        draggable="false"
        @error="tryNextPortrait"
      />
    </div>

    <section class="image-preload-panel" aria-label="图片预载进度">
      <div class="image-preload-heading">
        <span class="image-preload-caption" role="status" aria-live="polite"
          ><i aria-hidden="true"></i> {{ badgeLabel }}</span
        >
        <span class="image-preload-percent" aria-hidden="true">{{ percent }}<small>%</small></span>
      </div>
      <div
        class="image-preload-track"
        role="progressbar"
        aria-label="图片自动预载进度"
        :aria-valuenow="progress.loaded"
        :aria-valuemin="0"
        :aria-valuemax="progress.total"
        :aria-valuetext="`${progress.loaded} / ${progress.total} 张已就绪，${progress.failed} 张待重试`"
      >
        <i :style="{ width: `${percent}%` }"></i>
      </div>
      <div class="image-preload-count">
        <b>{{ progress.loaded }}</b
        ><span>/ {{ progress.total }}</span>
      </div>

      <details class="image-preload-details">
        <summary>{{ progress.failed ? `${progress.failed} 张待重试 · ` : '' }}预载详情</summary>
        <dl class="image-preload-groups">
          <div v-for="group in progress.groups" :key="group.id">
            <dt>{{ group.label }}</dt>
            <dd>{{ group.loaded }} / {{ group.total }}</dd>
          </div>
        </dl>
        <div class="image-preload-actions">
          <button v-if="progress.status === 'running'" type="button" @click="controller.pause()">暂停预载</button>
          <button v-else-if="progress.status === 'paused'" type="button" @click="start">继续预载</button>
          <button v-else-if="progress.status === 'partial'" type="button" @click="start">重试未完成图片</button>
        </div>
        <ul v-if="progress.failures.length" class="image-preload-failures" aria-label="未加载的图片">
          <li v-for="item in progress.failures" :key="item.url">
            <a :href="item.url" target="_blank" rel="noreferrer">{{ item.label }}</a
            ><span>{{ item.reason }}</span>
          </li>
        </ul>
      </details>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import type { ImagePreloadController } from '../assets/image-preload-types';
import { preloadAssistantPortraitUrls } from '../assets/preload-assistant';

const props = defineProps<{ controller: ImagePreloadController }>();
const progress = shallowRef(props.controller.snapshot());
const unsubscribe = props.controller.subscribe(value => (progress.value = value));
onBeforeUnmount(unsubscribe);
const portraitIndex = ref(0);
function tryNextPortrait() {
  if (portraitIndex.value < preloadAssistantPortraitUrls.length - 1) portraitIndex.value++;
}
const percent = computed(() =>
  progress.value.total ? Math.floor((progress.value.loaded / progress.value.total) * 100) : 0,
);
const badgeLabel = computed(() => {
  if (progress.value.status === 'restoring') return '读取已有缓存';
  if (progress.value.status === 'complete') return '准备完成';
  if (progress.value.status === 'paused') return '已暂停';
  if (progress.value.status === 'partial') return '预载待补全';
  return '后台预载中';
});
function start() {
  void props.controller.start();
}
</script>

<style scoped lang="scss">
.admission-image-preload {
  width: 100%;
  min-width: 0;
  margin-top: 28px;
  padding-bottom: 24px;
  color: #08164e;
  text-wrap: pretty;
}
.image-preload-assistant {
  position: relative;
  display: grid;
  justify-items: center;
  padding: 0 2px;
}
.image-preload-arona {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 10px 12px #081b9b35);
  user-select: none;
}
.image-preload-panel {
  position: relative;
  z-index: 1;
  margin-top: -24px;
  padding: 12px 12px 10px;
  border: 1px solid #b6faff;
  background: linear-gradient(145deg, #f5feff, #dceeff);
  box-shadow: 0 5px 0 #081b9b30;
}
.image-preload-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.image-preload-caption {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #1645b5;
  font-size: 9px;
  font-weight: 800;
  i {
    width: 5px;
    height: 5px;
    background: #1c8be7;
    border-radius: 50%;
  }
}
[data-state='running'] .image-preload-caption i {
  animation: preload-breathe 2s ease-in-out infinite;
}
.image-preload-percent {
  flex: 0 0 auto;
  color: #1634eb;
  font-size: 23px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  small {
    font-size: 10px;
    margin-left: 1px;
  }
}
.image-preload-track {
  height: 5px;
  margin-top: 12px;
  overflow: hidden;
  background: #bcd9f3;
  i {
    display: block;
    height: 100%;
    background: #1634eb;
    transition: width 0.25s ease;
  }
}
.image-preload-count {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  b {
    color: #1634eb;
    font-size: 12px;
  }
  span {
    color: #385783;
  }
}
.image-preload-details {
  border-top: 1px solid #b9d9ee;
  margin-top: 10px;
  padding-top: 7px;
  font-size: 9px;
  summary {
    width: fit-content;
    padding: 5px 0;
    color: #355991;
    cursor: pointer;
  }
  summary:focus-visible {
    outline: 2px solid #1634eb;
    outline-offset: 3px;
  }
}
.image-preload-groups {
  display: grid;
  gap: 7px;
  margin: 10px 0;
  > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 4px;
  }
  dt {
    color: #29466f;
  }
  dd {
    margin: 0;
    color: #1634eb;
    font-variant-numeric: tabular-nums;
  }
}
.image-preload-actions button {
  display: block;
  width: 100%;
  min-height: 36px;
  margin: 8px 0 0;
  border: 1px solid #99c6e8;
  background: #eaf6ff;
  color: #1634b8;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  &:hover {
    background: #d6edff;
  }
  &:active {
    background: #c5e3ff;
  }
  &:focus-visible {
    outline: 2px solid #1634eb;
    outline-offset: 2px;
  }
}
.image-preload-failures {
  max-height: 140px;
  overflow-y: auto;
  margin: 10px 0 0;
  padding-left: 14px;
  li {
    margin: 7px 0;
    overflow-wrap: anywhere;
  }
  a {
    color: #1634eb;
    text-decoration: underline;
  }
  li span {
    display: block;
    margin-top: 3px;
    color: #53638d;
  }
}
@keyframes preload-breathe {
  50% {
    opacity: 0.35;
  }
}
@media (max-width: 900px) {
  .admission-image-preload {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    align-items: end;
    gap: 12px;
    margin-top: 18px;
    padding-bottom: 0;
  }
  .image-preload-panel {
    margin-top: 0;
    padding: 12px 14px 8px;
  }
  .image-preload-caption,
  .image-preload-details {
    font-size: 10px;
  }
  .image-preload-groups {
    grid-template-columns: 1fr 1fr;
    gap: 8px 14px;
  }
}
@media (max-width: 600px) {
  .admission-image-preload {
    display: block;
    position: relative;
    margin: 0;
    max-height: min(155px, calc(var(--admission-chat-height, 680px) * 0.3));
    overflow-y: auto;
    background: #eaf7ff;
  }
  .image-preload-assistant {
    position: absolute;
    inset: 0 auto auto 0;
    width: 38px;
    height: 42px;
    overflow: hidden;
  }
  .image-preload-arona {
    width: 50px;
    max-width: none;
    transform: translateY(-9px);
  }
  .image-preload-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0 10px;
    padding: 0 8px 0 40px;
    background: transparent;
    box-shadow: none;
    border: 0;
  }
  .image-preload-heading {
    grid-column: 1;
    grid-row: 1;
    padding-bottom: 4px;
  }
  .image-preload-percent {
    font-size: 13px;
  }
  .image-preload-track {
    grid-area: 1 / 1;
    align-self: center;
    height: 3px;
    margin: 20px 0 0;
  }
  .image-preload-count {
    display: none;
  }
  .image-preload-details {
    display: contents;
    summary {
      grid-area: 1 / 2;
      align-content: center;
      min-height: 44px;
    }
    > :not(summary) {
      grid-column: 1 / -1;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-state='running'] .image-preload-caption i {
    animation: none;
  }
  .image-preload-track i {
    transition: none;
  }
}
</style>
