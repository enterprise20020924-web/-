<template>
  <div ref="root" class="amami-map-quick" :class="{ 'is-open': open }" @keydown.esc.stop.prevent="close(true)">
    <button
      ref="trigger"
      type="button"
      class="amami-map-quick-tab"
      :class="{ 'has-places': locations.length > 0 }"
      :aria-expanded="open"
      :aria-controls="panelId"
      aria-label="快捷地点"
      title="打开收藏的快捷地点"
      @click="emit('update:open', !open)"
    >
      <MapIcon name="bookmark" />
      <span>快捷地点</span>
      <Transition name="amami-quick-count" mode="out-in">
        <b v-if="locations.length" :key="locations.length">{{ locations.length }}</b>
      </Transition>
      <MapIcon name="chevron" />
    </button>
    <Transition name="amami-quick-drawer">
      <aside v-if="open" :id="panelId" class="amami-map-quick-panel" :aria-labelledby="headingId" @wheel.stop>
        <header class="amami-map-quick-header">
          <span class="amami-map-quick-emblem"><MapIcon name="bookmark" /></span>
          <div>
            <h3 :id="headingId">快捷地点</h3>
            <p>把常去的地方，留在手边。</p>
          </div>
          <button type="button" class="amami-map-quick-close" aria-label="收起快捷地点" @click="close(true)">
            <MapIcon name="close" />
          </button>
        </header>
        <div class="amami-map-quick-content">
          <TransitionGroup v-if="locations.length" tag="ul" name="amami-quick-row" class="amami-map-quick-list">
            <li v-for="place in locations" :key="place.id" :class="{ 'is-selected': selectedId === place.id }">
              <button
                type="button"
                class="amami-map-quick-item"
                :data-quick-place="place.id"
                :aria-label="`前往${place.name}`"
                :aria-pressed="selectedId === place.id"
                @click="emit('select', place)"
              >
                <span class="amami-map-quick-picture">
                  <img
                    v-if="pictureFor(place.id)"
                    :src="pictureFor(place.id)?.url"
                    :data-scene-id="pictureFor(place.id)?.id"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    @error="emit('image-error', $event)"
                  />
                  <MapIcon v-else name="pin" />
                  <i v-if="selectedId === place.id"><MapIcon name="check" /></i>
                </span>
                <span class="amami-map-quick-copy">
                  <strong>{{ place.name }}</strong>
                  <small>{{ place.region.name }}<span v-if="!place.landmark.anchor"> · 位置待确认</span></small>
                </span>
              </button>
              <button
                type="button"
                class="amami-map-quick-remove"
                :aria-label="`移除${place.name}的快捷收藏`"
                title="取消收藏"
                @click="removePlace(place.id)"
              >
                <MapIcon name="close" />
              </button>
            </li>
          </TransitionGroup>
          <div v-else class="amami-map-quick-empty">
            <span><MapIcon name="bookmark" /><i>+</i></span>
            <strong>还没有快捷地点</strong>
            <p>在地点详情里点击「加入快捷地点」，<br />下次就能从这里直接打开。</p>
            <button type="button" @click="emit('browse')">去找地点<MapIcon name="chevron" /></button>
          </div>
        </div>
        <footer class="amami-map-quick-footer">
          <MapIcon :name="persistent ? 'check' : 'bookmark'" />
          <span>{{ persistent ? '收藏会自动保存' : '当前环境仅保留本次会话的收藏' }}</span>
          <b v-if="locations.length">{{ locations.length }}</b>
        </footer>
      </aside>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import MapIcon from './MapIcon.vue';
import type { CampusLocation } from './campus-map-data';

const props = defineProps<{
  open: boolean;
  locations: CampusLocation[];
  selectedId: number | null;
  persistent: boolean;
  pictureFor: (id: number) => { id: string; url: string } | null;
}>();
const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [place: CampusLocation];
  remove: [id: number];
  browse: [];
  'image-error': [event: Event];
}>();
const panelId = `campus-quick-${useId()}`;
const headingId = `${panelId}-heading`;
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
let owner: Document | undefined;

function close(restoreFocus = false) {
  emit('update:open', false);
  if (restoreFocus) nextTick(() => trigger.value?.focus({ preventScroll: true }));
}
function handleOutside(event: PointerEvent) {
  if (props.open && root.value && !event.composedPath().includes(root.value)) close();
}
async function removePlace(id: number) {
  const index = props.locations.findIndex(place => place.id === id);
  emit('remove', id);
  await nextTick();
  const nextPlace = props.locations[Math.min(index, props.locations.length - 1)];
  const target = root.value?.querySelector<HTMLButtonElement>(
    nextPlace ? `[data-quick-place="${nextPlace.id}"]` : '.amami-map-quick-empty button',
  );
  target?.focus({ preventScroll: true });
}
watch(
  () => props.open,
  async open => {
    if (!open) return;
    await nextTick();
    root.value?.querySelector<HTMLButtonElement>('.amami-map-quick-close')?.focus({ preventScroll: true });
  },
);
onMounted(() => {
  owner = root.value?.ownerDocument;
  owner?.addEventListener('pointerdown', handleOutside, true);
});
onBeforeUnmount(() => owner?.removeEventListener('pointerdown', handleOutside, true));
</script>
