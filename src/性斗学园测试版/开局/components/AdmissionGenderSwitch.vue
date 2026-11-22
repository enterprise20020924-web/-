<template>
  <div class="sk-character-gender-switch" role="group" aria-label="角色性别">
    <button
      v-for="gender in genders"
      :key="gender"
      type="button"
      :aria-pressed="selectedGender === gender"
      @click="emit('update-gender', gender)"
    >
      <i :class="gender === Gender.MALE ? 'fas fa-mars' : 'fas fa-venus'" aria-hidden="true"></i>
      <span>{{ gender }}</span>
      <i class="fas fa-check sk-character-gender-check" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Gender } from '../types';
import type { AdmissionGender } from '../utils/admissionCharacterSelection';

defineProps<{ selectedGender: AdmissionGender }>();
const emit = defineEmits<{ (e: 'update-gender', gender: AdmissionGender): void }>();
const genders = [Gender.MALE, Gender.FEMALE] as const;
</script>
