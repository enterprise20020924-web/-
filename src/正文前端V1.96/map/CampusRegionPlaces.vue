<template>
  <section class="amami-map-people amami-map-place-directory" :aria-labelledby="headingId">
    <header class="amami-map-people-heading">
      <div>
        <span class="amami-map-people-spark" aria-hidden="true">✦</span>
        <h4 :id="headingId">区域内地点</h4>
      </div>
    </header>
    <ul class="amami-map-place-list">
      <li
        v-for="(group, index) in placeGroups"
        :key="group.location.id"
        :style="{ '--place-index': Math.min(index, 5) }"
      >
        <button
          type="button"
          class="amami-map-place-card"
          :data-location-id="group.location.id"
          :aria-label="`查看地点：${group.location.name}`"
          @click="emit('open-location', group.location.id)"
        >
          <span class="amami-map-place-heading">
            <span class="amami-map-place-number">{{ String(group.location.id).padStart(2, '0') }}</span>
            <strong>{{ group.location.name }}</strong
            ><MapIcon name="chevron" />
          </span>
          <span v-if="group.preview.length" class="amami-map-place-people">
            <span class="amami-map-place-avatars" aria-hidden="true">
              <span v-for="entry in group.preview.slice(0, 3)" :key="entry.person.name" class="amami-map-place-avatar">
                <img
                  v-if="avatarUrl(entry)"
                  :src="avatarUrl(entry) ?? undefined"
                  alt=""
                  width="42"
                  height="42"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  @error="onAvatarError(entry)"
                />
                <span v-else>{{ entry.person.name.slice(0, 1) }}</span>
              </span>
            </span>
            <span class="amami-map-place-roster">
              <span class="amami-map-place-roster-label"
                >{{ group.label }} <b>{{ group.preview.length }}</b></span
              >
              <span
                >{{
                  group.preview
                    .slice(0, 3)
                    .map(entry => entry.person.name)
                    .join(' · ')
                }}{{ group.preview.length > 3 ? '…' : '' }}</span
              >
            </span>
          </span>
        </button>
      </li>
    </ul>
    <details
      v-if="unmappedGroups.length"
      class="amami-map-other-places"
      :open="otherPlacesOpen"
      @toggle="otherPlacesOpen = ($event.target as HTMLDetailsElement).open"
    >
      <summary>其他活动地点<MapIcon name="chevron" /></summary>
      <details
        v-for="group in unmappedGroups"
        :key="group.place"
        class="amami-map-unmapped-place"
        :open="openedPlaces[group.place]"
        @toggle="onPlaceToggle(group.place, $event)"
      >
        <summary>
          <MapIcon name="pin" /><span>{{ group.place }}</span
          ><MapIcon name="chevron" />
        </summary>
        <CampusRegionCharacters
          v-if="openedPlaces[group.place]"
          :region-id="regionId"
          :unmapped-place="group.place"
          :focus-person="focusPerson"
          :period="period"
        />
      </details>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import MapIcon from './MapIcon.vue';
import CampusRegionCharacters from './CampusRegionCharacters.vue';
import {
  getCampusRegionPlaceGroups,
  getCampusUnmappedPlaceGroups,
  getCampusCharacterAvatarUrls,
} from './campus-character-encounters';
import type { CampusCharacterEncounter } from './campus-character-encounters';
import type { CampusSchedulePeriod } from './campus-character-schedule';

const props = defineProps<{
  regionId: string;
  focusPerson?: string | null;
  focusPlace?: string | null;
  period?: CampusSchedulePeriod;
}>();
const emit = defineEmits<{ 'open-location': [id: number] }>();
const headingId = `map-place-directory-${useId()}`;
const avatarAttempts = ref<Record<string, number>>({});
const openedPlaces = ref<Record<string, boolean>>({});
const otherPlacesOpen = ref(false);
const placeGroups = computed(() =>
  getCampusRegionPlaceGroups(props.regionId, props.period).map(group => {
    const common = group.people.filter(entry => entry.kind === 'resident' || entry.kind === 'regular');
    const occasional = group.people.filter(entry => entry.kind === 'occasional');
    return {
      ...group,
      preview: common.length ? common : occasional.length ? occasional : group.people,
      label: common.length ? '常见' : occasional.length ? '偶遇' : '条件出现',
    };
  }),
);
const unmappedGroups = computed(() => getCampusUnmappedPlaceGroups(props.regionId, props.period));
watch(
  () => [props.regionId, props.focusPerson, props.focusPlace, props.period],
  () => {
    if (!props.focusPerson) return;
    const group = unmappedGroups.value.find(
      group => group.place === props.focusPlace && group.people.some(entry => entry.person.name === props.focusPerson),
    );
    if (group) {
      otherPlacesOpen.value = true;
      openedPlaces.value[group.place] = true;
    }
  },
  { immediate: true },
);
function onPlaceToggle(place: string, event: Event) {
  openedPlaces.value[place] = (event.target as HTMLDetailsElement).open;
}
function avatarUrl(entry: CampusCharacterEncounter) {
  return getCampusCharacterAvatarUrls(entry.person)[avatarAttempts.value[entry.person.name] ?? 0] ?? null;
}
function onAvatarError(entry: CampusCharacterEncounter) {
  const name = entry.person.name;
  avatarAttempts.value[name] = (avatarAttempts.value[name] ?? 0) + 1;
}
</script>
