<template>
  <div ref="root" class="amami-map-followed" :class="{ 'is-open': open }" @keydown.esc.stop.prevent="close(true)">
    <button
      ref="trigger"
      type="button"
      class="amami-map-quick-tab amami-map-follow-tab"
      :class="{ 'has-places': people.length > 0 }"
      aria-label="关注的人"
      title="打开关注的人"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="emit('update:open', !open)"
    >
      <MapIcon name="heart" /><span>关注的人</span><b v-if="people.length">{{ people.length }}</b
      ><MapIcon name="chevron" />
    </button>
    <Transition name="amami-quick-drawer">
      <aside
        v-if="open"
        :id="panelId"
        class="amami-map-quick-panel amami-map-follow-panel"
        :aria-labelledby="headingId"
        @wheel.stop
      >
        <header class="amami-map-quick-header">
          <span class="amami-map-quick-emblem"><MapIcon name="heart" /></span>
          <h3 :id="headingId">关注的人</h3>
          <button type="button" class="amami-map-quick-close" aria-label="收起关注的人" @click="close(true)">
            <MapIcon name="close" />
          </button>
        </header>
        <div v-if="filterName" class="amami-map-follow-filter">
          <span>{{ filterName }}</span
          ><button type="button" @click="emit('clear-filter')">查看全部<MapIcon name="close" /></button>
        </div>
        <div class="amami-map-quick-content">
          <TransitionGroup
            v-if="visiblePeople.length"
            tag="ul"
            name="amami-quick-row"
            class="amami-map-quick-list amami-map-follow-list"
          >
            <li
              v-for="entry in visiblePeople"
              :key="entry.person.name"
              :class="{ 'is-selected': selectedName === entry.person.name }"
            >
              <button
                type="button"
                class="amami-map-quick-item"
                :data-followed-name="entry.person.name"
                :aria-label="`前往${entry.person.name}的活动地点：${entry.placeName}`"
                @click="emit('select', entry.person.name)"
              >
                <CampusPersonAvatar :person="entry.person" />
                <span class="amami-map-quick-copy"
                  ><strong>{{ entry.person.name }}</strong
                  ><small>{{ entry.placeName }}</small></span
                >
              </button>
              <button
                type="button"
                class="amami-map-quick-remove amami-map-follow-remove"
                :aria-label="`取消关注${entry.person.name}`"
                title="取消关注"
                @click="removePerson(entry.person.name)"
              >
                <MapIcon name="heart" />
              </button>
            </li>
          </TransitionGroup>
          <div v-else class="amami-map-quick-empty">
            <span><MapIcon name="heart" /></span
            ><strong>{{ filterName ? '这里还没有关注的人' : '还没有关注的人' }}</strong>
            <button type="button" @click="emit('browse')">去关注人物<MapIcon name="chevron" /></button>
          </div>
        </div>
      </aside>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import MapIcon from './MapIcon.vue';
import CampusPersonAvatar from './CampusPersonAvatar.vue';
import { campusRegions } from './campus-map-data';
import type { CampusFollowedPerson } from './campus-following';
const props = defineProps<{
  open: boolean;
  people: CampusFollowedPerson[];
  selectedName: string | null;
  filterRegion: string | null;
}>();
const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [name: string];
  remove: [name: string];
  browse: [];
  'clear-filter': [];
}>();
const panelId = `campus-followed-${useId()}`;
const headingId = `${panelId}-heading`;
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const visiblePeople = computed(() =>
  props.filterRegion ? props.people.filter(entry => entry.region.id === props.filterRegion) : props.people,
);
const filterName = computed(() => campusRegions.find(region => region.id === props.filterRegion)?.name ?? '');
let owner: Document | undefined;
function close(restoreFocus = false) {
  emit('update:open', false);
  if (restoreFocus) nextTick(() => trigger.value?.focus({ preventScroll: true }));
}
function handleOutside(event: PointerEvent) {
  if (props.open && root.value && !event.composedPath().includes(root.value)) close();
}
async function removePerson(name: string) {
  const index = visiblePeople.value.findIndex(entry => entry.person.name === name);
  emit('remove', name);
  await nextTick();
  const next = visiblePeople.value[Math.min(index, visiblePeople.value.length - 1)];
  const target =
    Array.from(root.value?.querySelectorAll<HTMLButtonElement>('[data-followed-name]') ?? []).find(
      button => button.dataset.followedName === next?.person.name,
    ) ?? root.value?.querySelector<HTMLButtonElement>('.amami-map-quick-empty button');
  target?.focus({ preventScroll: true });
}
watch(
  () => props.open,
  async open => {
    if (open) {
      await nextTick();
      root.value?.querySelector<HTMLButtonElement>('.amami-map-quick-close')?.focus({ preventScroll: true });
    }
  },
);
onMounted(() => {
  owner = root.value?.ownerDocument;
  owner?.addEventListener('pointerdown', handleOutside, true);
});
onBeforeUnmount(() => owner?.removeEventListener('pointerdown', handleOutside, true));
</script>
