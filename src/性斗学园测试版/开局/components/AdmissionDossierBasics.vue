<template>
  <section class="sk-dossier-basics" aria-labelledby="admission-basics-title">
    <span class="sk-dossier-sheet-edge" aria-hidden="true"></span>
    <h3 id="admission-basics-title" class="sk-dossier-section-heading"><span>01</span> 基本信息</h3>

    <div class="sk-dossier-cover">
      <div class="sk-dossier-portrait" :class="{ 'has-portrait': portrait && !portraitFailed }" :data-identity-id="data.archetypeId" aria-hidden="true">
        <span class="sk-dossier-portrait-orbit"></span>
        <img
          v-if="portrait && !portraitFailed"
          :src="portrait"
          alt=""
          draggable="false"
          @error="portraitFailed = true"
        />
        <span v-else class="sk-dossier-emblem"><i class="fas fa-question"></i></span>
        <span class="sk-dossier-portrait-baseline"></span>
      </div>
      <div class="sk-dossier-nameplate">
        <span class="sk-dossier-identity-tag"><i class="fas fa-id-card" aria-hidden="true"></i>{{ identityName }}</span>
        <label for="admission-name">登记姓名 <em class="sk-required-label">必填</em></label>
        <input
          id="admission-name"
          class="sk-dossier-name-input"
          type="text"
          aria-required="true"
          :value="data.name"
          placeholder="为角色命名…"
          @input="e => emit('update-data', { name: (e.target as HTMLInputElement).value })"
        />
        <span class="sk-dossier-name-stripes" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </div>
    </div>

    <div class="sk-dossier-basic-grid">
      <div class="sk-dossier-field sk-dossier-age">
        <label for="admission-age"><i class="fas fa-graduation-cap" aria-hidden="true"></i> 年龄</label>
        <div class="sk-dossier-age-value">
          <input
            id="admission-age"
            type="number"
            min="15"
            max="25"
            :value="data.age"
            @input="e => emit('update-data', { age: parseInt((e.target as HTMLInputElement).value) || 16 })"
          />
          <span aria-hidden="true">岁</span>
        </div>
      </div>
      <div class="sk-dossier-field">
        <span id="admission-gender-label" class="sk-dossier-field-label"
          ><i class="fas fa-venus-mars" aria-hidden="true"></i> 性别</span
        >
        <div class="sk-registration-choice sk-dossier-gender" role="group" aria-labelledby="admission-gender-label">
          <button
            v-for="gender in Object.values(Gender)"
            :key="gender"
            type="button"
            :aria-pressed="data.gender === gender"
            :disabled="gender === Gender.MALE && identity?.gender === Gender.FEMALE"
            @click="emit('change-gender', gender)"
          >
            {{ gender }}
          </button>
        </div>
      </div>
      <div class="sk-dossier-field sk-dossier-difficulty">
        <label for="admission-difficulty"><i class="fas fa-flag" aria-hidden="true"></i> 游戏难度</label>
        <select
          id="admission-difficulty"
          :value="data.difficulty"
          :disabled="data.difficulty === Difficulty.CHEATER"
          @change="e => emit('update-data', { difficulty: (e.target as HTMLSelectElement).value as Difficulty })"
        >
          <option v-for="difficulty in difficulties" :key="difficulty" :value="difficulty">
            {{ difficultyLabel(difficulty) }}
          </option>
        </select>
        <p v-if="data.difficulty === Difficulty.MASOCHIST" class="sk-dossier-locked-note">
          <i class="fas fa-lock" aria-hidden="true"></i> 已选择抖M特化难度
        </p>
        <p v-if="data.difficulty === Difficulty.CHEATER" class="sk-dossier-locked-note">
          <i class="fas fa-lock" aria-hidden="true"></i> 作弊模式已激活，难度已锁定
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getIdentityById } from '../data/identityDatabase';
import { Difficulty, Gender, type CharacterData } from '../types';
import { resolveIdentityPortraitProfile } from '../../../正文前端V1.99/identity/presentation';

const props = defineProps<{
  data: CharacterData;
  difficulties: Difficulty[];
  difficultyLabel: (difficulty: Difficulty) => string;
}>();
const emit = defineEmits<{
  (e: 'update-data', fields: Partial<CharacterData>): void;
  (e: 'change-gender', gender: Gender): void;
}>();
const portraitFailed = ref(false);
const portrait = computed(() => resolveIdentityPortraitProfile(props.data.archetypeId ?? '')?.portraitUrl ?? null);
const identity = computed(() => getIdentityById(props.data.archetypeId));
const identityName = computed(() => identity.value?.name ?? '泛泛之辈');
watch(portrait, () => (portraitFailed.value = false));
</script>
