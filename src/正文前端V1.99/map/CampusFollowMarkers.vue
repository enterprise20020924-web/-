<template>
  <TransitionGroup name="amami-follow-pin" tag="div" class="amami-map-follow-markers" aria-label="关注人物的活动区域">
    <div
      v-for="group in groups"
      :key="group.region.id"
      role="group"
      class="amami-map-follow-marker"
      :class="{ 'is-below': placements[group.region.id]?.below }"
      :data-follow-region="group.region.id"
      :style="{
        left: `${(group.region.anchor[0] / 1672) * 100}%`,
        top: `${(group.region.anchor[1] / 941) * 100}%`,
        '--follow-shift-x': `${placements[group.region.id]?.shiftX ?? 0}px`,
        '--follow-offset-y': `${placements[group.region.id]?.offsetY ?? -86}px`,
      }"
      :aria-label="`${group.region.name}关注的${group.people.length}人`"
      @pointerdown.stop
      @click.stop
    >
      <div
        class="amami-map-follow-pin-body"
        :style="{ '--follow-columns': group.people.length === 4 ? 2 : Math.min(group.people.length, 3) }"
      >
        <button
          v-for="entry in group.people.slice(0, CAMPUS_FOLLOW_VISIBLE_LIMIT)"
          :key="entry.person.name"
          type="button"
          class="amami-map-follow-pin-person"
          :aria-label="`查看关注人物：${entry.person.name}，${entry.placeName}`"
          :title="`${entry.person.name} · ${entry.placeName}`"
          @click="emit('select', entry.person.name)"
        >
          <CampusPersonAvatar :person="entry.person" />
        </button>
        <button
          v-if="group.people.length > 1"
          type="button"
          class="amami-map-follow-pin-count"
          :aria-label="`查看${group.region.name}关注的全部${group.people.length}人`"
          :title="`查看全部 ${group.people.length} 人`"
          @click="emit('group', group.region.id)"
        >
          {{
            group.people.length > CAMPUS_FOLLOW_VISIBLE_LIMIT
              ? `+${group.people.length - CAMPUS_FOLLOW_VISIBLE_LIMIT}`
              : group.people.length
          }}
        </button>
        <MapIcon v-else class="amami-map-follow-pin-heart" name="heart" />
      </div>
      <span class="amami-map-follow-pin-dot" aria-hidden="true"></span>
    </div>
  </TransitionGroup>
</template>
<script setup lang="ts">
import CampusPersonAvatar from './CampusPersonAvatar.vue';
import MapIcon from './MapIcon.vue';
import {
  CAMPUS_FOLLOW_VISIBLE_LIMIT,
  type CampusFollowGroup,
  type CampusFollowMarkerPlacement,
} from './campus-following';
defineProps<{ groups: CampusFollowGroup[]; placements: Record<string, CampusFollowMarkerPlacement> }>();
const emit = defineEmits<{ select: [name: string]; group: [regionId: string] }>();
</script>
