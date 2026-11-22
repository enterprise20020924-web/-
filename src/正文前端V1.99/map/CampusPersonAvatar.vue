<template>
  <span class="amami-map-person-face">
    <img v-if="url" :src="url" alt="" width="64" height="64" decoding="async" draggable="false" @error="attempt++" />
    <span v-else aria-hidden="true">{{ person.name.slice(0, 2) }}</span>
  </span>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getCampusCharacterAvatarUrls, type CampusCharacterHabit } from './campus-character-encounters';
const props = defineProps<{ person: CampusCharacterHabit }>();
const attempt = ref(0);
const url = computed(() => getCampusCharacterAvatarUrls(props.person)[attempt.value] ?? null);
watch(
  () => props.person.name,
  () => {
    attempt.value = 0;
  },
);
</script>
