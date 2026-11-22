<template>
  <section class="shittim-dossier" :class="`is-${detailTab}`" :aria-labelledby="titleId">
    <ShittimDossierScene />
    <header class="shittim-topline">
      <h3 :id="titleId" class="shittim-brand">
        <AmamiMark aria-hidden="true" /><span class="shittim-brand-root">什亭之匣</span
        ><i class="shittim-brand-sep" aria-hidden="true">/</i><strong class="shittim-brand-page">对手情报</strong>
      </h3>
      <button type="button" class="shittim-close" @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 6.5 5 12l5.5 5.5M5.5 12H19" /></svg
        ><span>返回正文</span>
      </button>
    </header>

    <div class="shittim-dossier-stage">
      <div
        class="shittim-portrait"
        :class="{ 'is-unavailable': portraitUnavailable || !profile?.portraitUrl }"
        aria-hidden="true"
      >
        <span class="shittim-portrait-word">{{ detailTab === 'stats' ? 'STATUS' : 'SKILL' }}</span>
        <img
          v-if="profile?.portraitUrl && !portraitUnavailable"
          :src="profile.portraitUrl"
          alt=""
          decoding="async"
          @error="portraitUnavailable = true"
        />
        <div v-else class="shittim-portrait-fallback">
          <span>{{ contact.name.slice(0, 1) }}</span
          ><small>NO PORTRAIT</small>
        </div>
      </div>

      <div class="shittim-identity-ribbon">
        <svg class="shittim-ribbon-shape" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0H1440V240H0Z" fill="#fff" />
          <path d="M0 0H1440V5H0Z" fill="#ff354f" />
          <path d="M1000 0H1440V240H880Z" fill="#dbfaff" />
          <path d="m1112 0-120 240h18L1130 0Z" fill="#42dcec" opacity=".4" />
          <path d="m1000 0-120 240h6L1006 0Z" fill="#24cde8" opacity=".24" />
        </svg>
        <div class="shittim-identity-copy">
          <p class="shittim-affiliation">{{ affiliation }}</p>
          <h4 :class="{ 'is-long': contact.name.length > 7 }">{{ contact.name }}</h4>
          <div class="shittim-identity-values">
            <span class="shittim-level"
              ><small>Lv</small><strong>{{ formatNumber(stats?.level ?? contact.level) }}</strong></span
            >
            <div class="shittim-capacity">
              <span>耐力上限</span><b>{{ formatNumber(stats?.endurance) }}</b
              ><i></i>
            </div>
            <div class="shittim-capacity is-pleasure">
              <span>快感上限</span><b>{{ formatNumber(stats?.pleasure) }}</b
              ><i></i>
            </div>
          </div>
        </div>
      </div>

      <div class="shittim-intelligence">
        <nav class="shittim-detail-tabs" aria-label="对手情报内容">
          <button
            type="button"
            :class="{ 'is-active': detailTab === 'stats' }"
            :aria-pressed="detailTab === 'stats'"
            @click="detailTab = 'stats'"
          >
            <svg viewBox="0 0 240 48" preserveAspectRatio="none" aria-hidden="true">
              <path class="tab-paper" d="M13 0H240L227 48H0Z" />
              <path class="tab-edge" d="M13 2H238L226 46" />
            </svg>
            <small>01</small><span>属性情报</span><b aria-hidden="true">›</b>
          </button>
          <button
            type="button"
            :class="{ 'is-active': detailTab === 'skills' }"
            :aria-pressed="detailTab === 'skills'"
            @click="detailTab = 'skills'"
          >
            <svg viewBox="0 0 240 48" preserveAspectRatio="none" aria-hidden="true">
              <path class="tab-paper" d="M13 0H240L227 48H0Z" />
              <path class="tab-edge" d="M13 2H238L226 46" />
            </svg>
            <small>02</small><span>技能档案</span><b>{{ skills.length }}</b>
          </button>
        </nav>

        <div v-if="detailTab === 'stats'" class="shittim-stats-layout shittim-page-enter">
          <div class="shittim-profile-record">
            <div class="shittim-relation-line">
              <span>RELATION</span><strong>{{ contact.relationType }}</strong
              ><b
                >好感 <em>{{ contact.affection }}</em></b
              >
            </div>
            <p v-if="stats?.note || contact.skillFamily">{{ stats?.note || `擅长技能系：${contact.skillFamily}` }}</p>
          </div>

          <section class="shittim-skill-overview" aria-label="技能概览">
            <svg class="shittim-overview-paper" viewBox="0 0 600 320" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient :id="`${titleId}-overview-bg`" x1="0" y1="0" x2="0.15" y2="1">
                  <stop offset="0%" stop-color="#081678" stop-opacity=".95" />
                  <stop offset="100%" stop-color="#030741" stop-opacity=".94" />
                </linearGradient>
              </defs>
              <path
                d="M16 0H600V300L578 320H0V18Z"
                :fill="`url(#${titleId}-overview-bg)`"
                stroke="#4ce8f8"
                stroke-opacity=".3"
                stroke-width="1.5"
              />
              <path d="M16 0H600V4H12Z" fill="#2dece9" />
              <path d="M16 0H58L54 4H12Z" fill="#ff354f" />
            </svg>
            <header>
              <h5>SKILL<span>技能概览</span></h5>
              <span>{{ skills.length }} <small>SKILLS</small></span>
            </header>
            <div v-if="skills.length" class="shittim-skill-slots">
              <button
                v-for="(skill, index) in overviewSkills"
                :key="`${skill.name}-${index}`"
                type="button"
                @click="openSkill(index)"
              >
                <ShittimSkillGlyph :type="skill.type" /><span>{{ skill.name }}</span
                ><b aria-hidden="true">›</b>
              </button>
            </div>
            <p v-else class="shittim-quiet-empty">暂无技能情报</p>
            <button v-if="skills.length" class="shittim-all-skills" type="button" @click="detailTab = 'skills'">
              查看完整技能档案 <span aria-hidden="true">↗</span>
            </button>
          </section>

          <div class="shittim-parameters">
            <ShittimParameterBars
              :stats="stats"
              :expanded="parametersExpanded"
              @toggle="parametersExpanded = !parametersExpanded"
            />
          </div>
        </div>

        <div v-else-if="skills.length" class="shittim-skills-layout shittim-page-enter">
          <section class="shittim-skill-catalog" aria-label="技能列表">
            <header>
              <h5>SKILL<span>技能目录</span></h5>
              <span class="shittim-catalog-cost-label">COST</span>
              <span class="shittim-catalog-swipe-label">左右滑动选择</span>
            </header>
            <div class="shittim-skill-list">
              <button
                v-for="(skill, index) in skills"
                :key="`${skill.name}-${index}`"
                type="button"
                :class="{ 'is-active': selectedSkillIndex === index }"
                :aria-pressed="selectedSkillIndex === index"
                @click="selectedSkillIndex = index"
              >
                <svg class="shittim-skill-selection" viewBox="0 0 600 64" preserveAspectRatio="none" aria-hidden="true">
                  <path class="selection-paper" d="M12 1H598L584 63H0Z" />
                  <path class="selection-edge" d="M12 2H597L584 62" />
                </svg>
                <span class="shittim-skill-order">{{ String(index + 1).padStart(2, '0') }}</span>
                <ShittimSkillGlyph class="shittim-skill-glyph" :type="skill.type" />
                <span class="shittim-skill-name"
                  ><strong>{{ skill.name }}</strong
                  ><small>{{ skill.type }}</small></span
                >
                <span class="shittim-skill-cost">{{ skill.cost }}</span>
              </button>
            </div>
          </section>

          <section
            v-if="activeSkill"
            :key="selectedSkillIndex"
            class="shittim-skill-analysis"
            aria-label="技能详情"
            aria-live="polite"
          >
            <svg class="shittim-analysis-paper" viewBox="0 0 600 640" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient :id="`${titleId}-analysis-bg`" x1="0" y1="0" x2="0.12" y2="1">
                  <stop offset="0%" stop-color="#081578" stop-opacity=".96" />
                  <stop offset="100%" stop-color="#030744" stop-opacity=".95" />
                </linearGradient>
              </defs>
              <path
                d="M20 0H600V614L566 640H0V26Z"
                :fill="`url(#${titleId}-analysis-bg)`"
                stroke="#4ce8f8"
                stroke-opacity=".32"
                stroke-width="1.5"
              />
              <path d="M20 0H600V5H15Z" fill="#2dece9" />
              <path d="M20 0H76L71 5H15Z" fill="#ff354f" />
            </svg>
            <header>
              <span
                >SKILL DATA <i>/ {{ String(selectedSkillIndex + 1).padStart(2, '0') }}</i></span
              ><ShittimSkillGlyph :type="activeSkill.type" />
              <h5>{{ activeSkill.name }}</h5>
            </header>
            <div class="shittim-skill-analysis-scroll">
              <p class="shittim-skill-effect">{{ activeSkill.effect }}</p>
              <dl class="shittim-skill-metrics">
                <div v-for="item in activeSkillMetrics" :key="item.label">
                  <dt>{{ item.label }}</dt>
                  <dd>{{ item.value }}</dd>
                </div>
              </dl>
              <div v-if="activeSkill.damageFormula !== '无'" class="shittim-skill-formula">
                <span>伤害公式</span>
                <p>{{ activeSkill.damageFormula }}</p>
              </div>
              <div v-if="activeSkill.buffs !== '无'" class="shittim-skill-formula">
                <span>附加效果</span>
                <p>{{ activeSkill.buffs }}</p>
              </div>
            </div>
          </section>
        </div>
        <div v-else class="shittim-empty shittim-page-enter">
          <span>NO SKILL DATA</span><strong>暂无技能情报</strong>
          <p v-if="contact.skillFamily">擅长 {{ contact.skillFamily }}</p>
        </div>
      </div>
    </div>

    <footer class="shittim-dossier-footer">
      <button class="shittim-back" type="button" @click="emit('back')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 6.5 5 12l5.5 5.5M5.5 12H19" /></svg
        ><span>人物列表</span>
      </button>
      <p v-if="battleNotice" class="shittim-launch-notice" role="status">{{ battleNotice }}</p>
      <p v-else class="shittim-guide">
        <strong>{{ detailTab === 'stats' ? '查看属性，选择你的对手。' : '选择技能，查看详细效果。' }}</strong>
        <span class="shittim-guide-meta"><i>GUIDE</i><em></em></span>
      </p>
      <button class="shittim-launch" type="button" :disabled="battlePending" @click="emit('start')">
        <svg viewBox="0 0 310 70" preserveAspectRatio="none" aria-hidden="true">
          <path class="launch-paper" d="M20 0H310L290 70H0Z" fill="currentColor" />
          <path class="launch-sheen" d="M188 0H228L208 70H168Z" fill="#ffffff" opacity=".24" />
          <path class="launch-slash" d="M20 0H28L8 70H0Z" fill="#ff354f" />
          <path class="launch-arrow" d="m247 17 27 17-27 18 9-18Z" fill="#041251" />
          <path class="launch-arrow-echo" d="m233 22 16 12-16 12 6-12Z" fill="#041251" opacity=".45" />
        </svg>
        <span
          ><small>MANUAL BATTLE</small><strong>{{ battlePending ? '正在发起…' : '发起性斗' }}</strong></span
        >
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import AmamiMark from '../vector/AmamiMark.vue';
import ShittimDossierScene from '../vector/ShittimDossierScene.vue';
import ShittimParameterBars from '../vector/ShittimParameterBars.vue';
import ShittimSkillGlyph from '../vector/ShittimSkillGlyph.vue';
import { resolveCharacterSkillEntries } from '../character-skills.compact';
import { resolveRelationshipBattleStats, resolveRelationshipProfile } from '../mobile/relationship-runtime';
import type { RelationshipContact } from '../mobile/relationship-runtime';

const props = defineProps<{ contact: RelationshipContact; battlePending: boolean; battleNotice: string | null }>();
const emit = defineEmits<{ close: []; back: []; start: [] }>();
const titleId = `shittim-dossier-${useId()}`;
const detailTab = ref<'stats' | 'skills'>('stats');
const selectedSkillIndex = ref(0);
const parametersExpanded = ref(true);
const portraitUnavailable = ref(false);
const profile = computed(() => resolveRelationshipProfile(props.contact.name));
const stats = computed(() => resolveRelationshipBattleStats(props.contact.name, profile.value));
const affiliation = computed(
  () =>
    profile.value?.affiliation ||
    (props.contact.faction !== '未分组' ? props.contact.faction : '') ||
    stats.value?.faction ||
    '所属未登记',
);
const skills = computed(() =>
  resolveCharacterSkillEntries([props.contact.name, stats.value?.name ?? '', ...(profile.value?.names ?? [])]),
);
const overviewSkills = computed(() => skills.value.slice(0, 6));
const activeSkill = computed(() => skills.value[selectedSkillIndex.value] ?? null);
const activeSkillMetrics = computed(() =>
  activeSkill.value === null
    ? []
    : [
        { label: '类型', value: activeSkill.value.type },
        { label: '消耗', value: activeSkill.value.cost },
        { label: '冷却', value: activeSkill.value.cooldown },
        { label: '命中', value: activeSkill.value.accuracy },
        { label: '暴击修正', value: activeSkill.value.critical },
        { label: '连击', value: activeSkill.value.combo },
      ],
);
watch(
  () => props.contact.name,
  () => {
    detailTab.value = 'stats';
    selectedSkillIndex.value = 0;
    parametersExpanded.value = true;
    portraitUnavailable.value = false;
  },
);
function openSkill(index: number) {
  selectedSkillIndex.value = index;
  detailTab.value = 'skills';
}
function formatNumber(value: number | undefined) {
  return value === undefined ? '—' : value.toLocaleString('zh-CN');
}
</script>

<style scoped src="./shittim-opponent-dossier.css"></style>
