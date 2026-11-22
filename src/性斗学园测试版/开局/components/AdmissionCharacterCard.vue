<template>
  <div v-if="card.kind === 'empty'" class="sk-character-card sk-character-card-empty" aria-hidden="true">
    <span class="sk-character-card-art"></span>
    <span class="sk-character-card-info"></span>
    <span class="sk-character-card-stripe"></span>
  </div>
  <button
    v-else
    type="button"
    class="sk-character-card"
    :class="{ 'sk-character-card-custom': card.kind === 'custom' }"
    :aria-label="card.kind === 'custom' ? '选择泛泛之辈' : `选择身份：${card.name}`"
    @click="selectCard"
  >
    <span class="sk-character-card-index" aria-hidden="true">{{ String(card.position).padStart(2, '0') }}</span>
    <span class="sk-character-card-kind">{{ card.kind === 'custom' ? '新档案' : '校园身份' }}</span>
    <span class="sk-character-card-art" :class="{ 'sk-custom-character-art': card.kind === 'custom' }">
      <template v-if="card.kind === 'custom'">
        <span class="sk-custom-character-sheet" aria-hidden="true">
          <i class="fas fa-user"></i><span></span><span></span><span></span>
        </span>
        <span class="sk-custom-character-add" aria-hidden="true"><i class="fas fa-plus"></i></span>
        <span class="sk-custom-character-orbit" aria-hidden="true"></span>
      </template>
      <template v-else-if="portrait && !portraitFailed">
        <span class="sk-character-art-ring" aria-hidden="true"></span>
        <img :src="portrait" alt="" loading="lazy" draggable="false" @error="portraitFailed = true" />
        <span class="sk-character-art-corner" aria-hidden="true"></span>
      </template>
      <span
        v-else
        class="sk-character-identity-placeholder absolute inset-x-3 top-12 bottom-6 flex flex-col items-center justify-center gap-3"
        aria-hidden="true"
      >
        <svg class="min-h-0 max-h-[62%] w-3/4" viewBox="0 0 180 208" fill="none">
          <path d="M28 18H141L164 41V196H28V18Z" fill="#D0E4F1" />
          <path d="M16 8H129L152 31V184H16V8Z" fill="white" stroke="#9EBDD2" />
          <path d="M16 8H129L143 22H16V8Z" fill="#087CDE" />
          <path d="M129 8V31H152" fill="#E6F2FA" stroke="#9EBDD2" />
          <rect x="29" y="38" width="110" height="96" rx="2" fill="#EAF4FA" />
          <circle cx="84" cy="76" r="21" fill="white" stroke="#80AAC6" stroke-width="1.5" />
          <path
            d="M49 123C51 103 63 94 84 94C105 94 117 103 119 123"
            fill="white"
            stroke="#80AAC6"
            stroke-width="1.5"
          />
          <path d="M29 46V38H37M131 38H139V46M29 126V134H37M131 134H139V126" stroke="#087CDE" stroke-width="2" />
          <path d="M31 149H100M31 157H125M31 165H76" stroke="#B5CEDF" stroke-width="3" />
          <path
            d="M107 163V175M111 163V175M117 163V175M120 163V175M126 163V175M131 163V175M135 163V175"
            stroke="#163F61"
          />
          <circle cx="151" cy="127" r="17" fill="#F2DF6A" stroke="white" stroke-width="4" />
          <path
            d="m144 127 5 5 9-10"
            stroke="#163F61"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M5 77H0M2.5 74.5V79.5M169 61H179M174 56V66" stroke="#37CEE6" stroke-width="2" />
        </svg>
        <strong>{{ card.name }}</strong>
        <small>校园身份档案</small>
      </span>
    </span>
    <span class="sk-character-card-info">
      <strong>{{ card.kind === 'custom' ? '泛泛之辈' : card.name }}</strong>
      <small v-if="card.kind === 'custom'">从空白档案开始</small>
      <small v-else
        >{{ gender }}<span v-if="card.preset?.age"> / {{ card.preset.age }} 岁</span></small
      >
      <span class="sk-character-card-action"><i class="fas fa-arrow-right" aria-hidden="true"></i></span>
    </span>
    <span class="sk-character-card-stripe" aria-hidden="true"></span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { resolveAdmissionPortrait } from '../utils/admissionPortrait';
import type {
  AdmissionCharacterCard,
  AdmissionGender,
  AdmissionIdentityChoice,
} from '../utils/admissionCharacterSelection';

const props = defineProps<{ card: AdmissionCharacterCard; gender: AdmissionGender }>();
const emit = defineEmits<{
  (e: 'select-custom', gender: AdmissionGender): void;
  (e: 'select-identity', choice: AdmissionIdentityChoice): void;
}>();
const portraitFailed = ref(false);
const portrait = computed(() => {
  if (props.card.kind !== 'identity') return null;
  const name = props.card.characterName || props.card.preset?.characterName || props.card.preset?.name;
  return name ? resolveAdmissionPortrait(name) : null;
});
watch(portrait, () => (portraitFailed.value = false));

function selectCard() {
  if (props.card.kind === 'custom') emit('select-custom', props.gender);
  else if (props.card.kind === 'identity') {
    emit('select-identity', {
      gender: props.gender,
      archetypeId: props.card.archetypeId,
      presetName: props.card.preset?.name,
    });
  }
}
</script>
