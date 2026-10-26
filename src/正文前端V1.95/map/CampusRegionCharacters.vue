<template>
  <section class="amami-map-people" :aria-labelledby="headingId" :data-encounter-region="regionId">
    <header class="amami-map-people-heading">
      <div>
        <span class="amami-map-people-spark" aria-hidden="true">✦</span>
        <h4 :id="headingId">可能遇见</h4>
      </div>
      <span>人物导览</span>
    </header>
    <span class="amami-map-sr-only" role="status">{{ followAnnouncement }}</span>

    <template v-if="encounters.length">
      <div class="amami-map-people-filters" role="group" aria-label="人物出现方式">
        <button
          v-for="filter in filters"
          :key="filter.id"
          type="button"
          :aria-pressed="activeFilter === filter.id"
          :aria-controls="listId"
          :disabled="!filter.count"
          @click="chooseFilter(filter.id)"
        >
          {{ filter.label }}<span>{{ filter.count }}</span>
        </button>
      </div>

      <ul :id="listId" ref="peopleList" class="amami-map-people-grid">
        <template v-for="(encounter, index) in visibleEncounters" :key="encounter.person.name">
          <li :style="{ '--person-index': Math.min(index, 5) }">
            <button
              type="button"
              class="amami-map-person"
              :class="{ 'is-selected': selectedName === encounter.person.name }"
              :data-kind="encounter.kind"
              :data-person-name="encounter.person.name"
              :aria-expanded="selectedName === encounter.person.name"
              :aria-controls="selectedName === encounter.person.name ? detailId : undefined"
              :aria-label="`查看${encounter.person.name}的活动地点，${campusEncounterKinds[encounter.kind].label}`"
              @click="selectedName = selectedName === encounter.person.name ? null : encounter.person.name"
            >
              <span class="amami-map-person-portrait" :class="{ 'has-fallback': !avatarUrl(encounter) }">
                <img
                  v-if="avatarUrl(encounter)"
                  :src="avatarUrl(encounter) ?? undefined"
                  alt=""
                  width="80"
                  height="80"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  @error="onAvatarError(encounter)"
                />
                <span v-else class="amami-map-person-initial" aria-hidden="true">{{
                  encounter.person.name.slice(0, 2)
                }}</span>
                <span class="amami-map-person-kind">{{ campusEncounterKinds[encounter.kind].label }}</span>
              </span>
              <strong>{{ encounter.person.name }}</strong>
              <span class="amami-map-person-site">{{ encounter.visits[0].place }}</span>
            </button>
            <button
              type="button"
              class="amami-map-person-follow"
              :aria-label="`${isFollowing(encounter.person.name) ? '取消关注' : '关注'}${encounter.person.name}`"
              :title="isFollowing(encounter.person.name) ? '取消关注' : '关注此人'"
              :aria-pressed="isFollowing(encounter.person.name)"
              @click="toggleFollowing(encounter.person.name)"
            >
              <MapIcon name="heart" />
            </button>
          </li>
          <li
            v-if="
              selectedEncounter &&
              Math.floor(index / 3) === selectedRow &&
              (index % 3 === 2 || index === visibleEncounters.length - 1)
            "
            class="amami-map-person-expanded"
          >
            <div :id="detailId" :key="selectedEncounter.person.name" class="amami-map-person-detail" aria-live="polite">
              <div class="amami-map-person-detail-heading">
                <div>
                  <strong>{{ selectedEncounter.person.name }}</strong
                  ><span>{{ selectedEncounter.person.affiliation }}</span>
                </div>
                <button type="button" aria-label="收起人物说明" @click="closePerson"><MapIcon name="close" /></button>
              </div>
              <p v-if="!avatarUrl(selectedEncounter)" class="amami-map-person-avatar-note">Q版头像待补，暂以姓名展示</p>
              <button
                type="button"
                class="amami-map-person-follow-action"
                :aria-pressed="isFollowing(selectedEncounter.person.name)"
                @click="toggleFollowing(selectedEncounter.person.name)"
              >
                <MapIcon name="heart" />{{ isFollowing(selectedEncounter.person.name) ? '已关注' : '关注此人' }}
              </button>
              <div
                v-for="(visit, visitIndex) in selectedEncounter.visits"
                :key="visitIndex"
                class="amami-map-person-visit"
                :data-kind="visit.kind"
              >
                <div>
                  <span>{{ campusEncounterKinds[visit.kind].label }}</span
                  ><strong>{{ visit.place }}</strong>
                </div>
                <p v-if="visit.note">{{ visit.note }}</p>
                <small v-if="visit.inferred">参考推定</small>
              </div>
              <div v-if="selectedPlaces.length" class="amami-map-person-places">
                <button
                  v-for="place in selectedPlaces"
                  :key="place.id"
                  type="button"
                  class="amami-map-person-place"
                  :aria-label="`查看人物相关地点：${place.name}`"
                  @click="emit('open-location', place.id)"
                >
                  <MapIcon name="pin" /><span>{{ place.name }}</span
                  ><MapIcon name="chevron" />
                </button>
              </div>
            </div>
          </li>
        </template>
      </ul>

      <button
        v-if="filteredEncounters.length > previewCount"
        type="button"
        class="amami-map-people-more"
        :aria-expanded="expanded"
        :aria-controls="listId"
        @click="toggleExpanded"
      >
        {{ expanded ? '收起人物列表' : `展开全部 ${filteredEncounters.length} 人` }}<MapIcon name="chevron" />
      </button>
    </template>
    <p v-else class="amami-map-people-empty">这个地点暂未明确常见人物。</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import MapIcon from './MapIcon.vue';
import {
  campusEncounterKinds,
  getCampusCharacterEncounters,
  getCampusCharacterAvatarUrls,
  getCampusEncounterPlaces,
} from './campus-character-encounters';
import type { CampusCharacterEncounter } from './campus-character-encounters';
import type { CampusSchedulePeriod } from './campus-character-schedule';
import { useFollowedPeople } from './use-followed-people';

const props = defineProps<{
  regionId: string;
  locationId?: number;
  unmappedPlace?: string;
  focusPerson?: string | null;
  period?: CampusSchedulePeriod;
}>();
const emit = defineEmits<{ 'open-location': [id: number] }>();
type PeopleFilter = 'common' | 'occasional' | 'conditional';
const headingId = `map-people-${useId()}`;
const listId = `${headingId}-list`;
const detailId = `${headingId}-detail`;
const previewCount = 6;
const activeFilter = ref<PeopleFilter>('common');
const expanded = ref(false);
const selectedName = ref<string | null>(null);
const peopleList = ref<HTMLElement | null>(null);
const avatarAttempts = ref<Record<string, number>>({});
const { names: followedNames, toggle: toggleFollowedPerson } = useFollowedPeople();
const followAnnouncement = ref('');
const isFollowing = (name: string) => followedNames.value.includes(name);
function toggleFollowing(name: string) {
  followAnnouncement.value = `${name}${toggleFollowedPerson(name) ? '已关注' : '已取消关注'}`;
}
const encounters = computed(() =>
  getCampusCharacterEncounters(props.regionId, props.locationId, props.unmappedPlace, props.period),
);
const filterFor = (encounter: CampusCharacterEncounter): PeopleFilter =>
  encounter.kind === 'resident' || encounter.kind === 'regular' ? 'common' : encounter.kind;
const filters = computed(() =>
  [
    { id: 'common' as const, label: '常见人物' },
    { id: 'occasional' as const, label: '偶尔来访' },
    { id: 'conditional' as const, label: '条件出现' },
  ].map(filter => ({
    ...filter,
    count: encounters.value.filter(encounter => filterFor(encounter) === filter.id).length,
  })),
);
const filteredEncounters = computed(() =>
  encounters.value.filter(encounter => filterFor(encounter) === activeFilter.value),
);
const visibleEncounters = computed(() =>
  expanded.value ? filteredEncounters.value : filteredEncounters.value.slice(0, previewCount),
);
const selectedEncounter = computed(() =>
  visibleEncounters.value.find(encounter => encounter.person.name === selectedName.value),
);
const selectedRow = computed(() =>
  Math.floor(visibleEncounters.value.findIndex(encounter => encounter.person.name === selectedName.value) / 3),
);
const selectedPlaces = computed(() =>
  selectedEncounter.value
    ? getCampusEncounterPlaces(selectedEncounter.value).filter(place => place.id !== props.locationId)
    : [],
);

function chooseFilter(filter: PeopleFilter) {
  activeFilter.value = filter;
  expanded.value = false;
  selectedName.value = null;
}
function closePerson() {
  const card = Array.from(peopleList.value?.querySelectorAll<HTMLButtonElement>('.amami-map-person') ?? []).find(
    button => button.dataset.personName === selectedName.value,
  );
  card?.focus({ preventScroll: true });
  selectedName.value = null;
}
function toggleExpanded() {
  expanded.value = !expanded.value;
  if (!visibleEncounters.value.some(encounter => encounter.person.name === selectedName.value))
    selectedName.value = null;
}
function avatarUrl(encounter: CampusCharacterEncounter) {
  return getCampusCharacterAvatarUrls(encounter.person)[avatarAttempts.value[encounter.person.name] ?? 0] ?? null;
}
function onAvatarError(encounter: CampusCharacterEncounter) {
  const name = encounter.person.name;
  avatarAttempts.value[name] = (avatarAttempts.value[name] ?? 0) + 1;
}
watch(
  () => [props.regionId, props.locationId, props.unmappedPlace, props.focusPerson, props.period],
  () => {
    const target = encounters.value.find(entry => entry.person.name === props.focusPerson);
    chooseFilter(target ? filterFor(target) : (filters.value.find(filter => filter.count > 0)?.id ?? 'common'));
    if (target) {
      expanded.value =
        filteredEncounters.value.findIndex(entry => entry.person.name === target.person.name) >= previewCount;
      selectedName.value = target.person.name;
    }
  },
  { immediate: true },
);
</script>
