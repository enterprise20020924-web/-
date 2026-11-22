<template>
  <section
    ref="root"
    class="amami-jobs"
    :class="{ 'has-selection': selectedJob }"
    aria-label="招工启事"
    @keydown.esc.stop.prevent="goBack"
  >
    <img
      class="amami-jobs-background"
      :src="recruitmentArtworkUrl"
      alt="如月诗乃在信息服务中心柜台后，指向左侧招工公告板"
      draggable="false"
    />
    <header class="amami-jobs-header">
      <button ref="backButton" type="button" class="amami-jobs-back" aria-label="返回校园地图" @click="emit('back')">
        <MapIcon name="back" />
      </button>
      <span class="amami-jobs-header-mark"><MapIcon name="work" /></span>
      <div>
        <h1>招工启事</h1>
        <span>信息服务中心</span>
      </div>
      <span class="amami-jobs-header-note">校园兼职 · 从这里开始</span>
    </header>

    <div ref="layout" class="amami-jobs-layout">
      <section class="amami-jobs-board" aria-labelledby="amami-jobs-board-title">
        <header class="amami-jobs-board-heading">
          <div>
            <span class="amami-jobs-eyebrow">寻找适合你的工作</span>
            <h2 id="amami-jobs-board-title">校园招工公告板</h2>
          </div>
          <span class="amami-jobs-count"
            ><b>{{ campusJobs.length.toString().padStart(2, '0') }}</b
            >个岗位</span
          >
        </header>
        <div class="amami-jobs-filters" role="group" aria-label="岗位类别">
          <button
            v-for="item in categories"
            :key="item"
            type="button"
            :aria-pressed="category === item"
            @click="category = item"
          >
            {{ item }}
          </button>
        </div>
        <div class="amami-jobs-postings">
          <button
            v-for="job in visibleJobs"
            :key="job.id"
            type="button"
            class="amami-job-posting"
            :class="{ 'is-selected': selectedJob?.id === job.id }"
            :aria-pressed="selectedJob?.id === job.id"
            :data-job-id="job.id"
            @click="selectJob(job)"
          >
            <span class="amami-job-posting-top"
              ><span class="amami-job-number">{{ jobNumber(job) }}</span
              ><span>{{ job.category }}</span
              ><i aria-hidden="true"></i
            ></span>
            <span class="amami-job-posting-main"
              ><span class="amami-job-glyph"><JobGlyph :name="job.icon" /></span
              ><span
                ><strong>{{ job.title }}</strong
                ><small>{{ job.workplace }}</small></span
              ></span
            >
            <span class="amami-job-posting-footer"
              ><span>{{ job.tags.join(' / ') }}</span
              ><MapIcon :name="selectedJob?.id === job.id ? 'check' : 'chevron'"
            /></span>
          </button>
        </div>
        <footer class="amami-jobs-board-footer">
          <MapIcon name="labels" /><span>选择一份启事，了解岗位内容。</span>
        </footer>
      </section>

      <aside class="amami-jobs-service" :class="{ 'is-detail': selectedJob }" aria-label="岗位详情">
        <div class="amami-jobs-attendant"><span>服务专员</span><strong>如月诗乃</strong><i aria-hidden="true"></i></div>
        <section v-if="selectedJob" ref="detail" class="amami-job-detail" tabindex="-1" aria-live="polite">
          <button type="button" class="amami-job-detail-back" @click="clearSelection">
            <MapIcon name="back" />返回岗位列表
          </button>
          <div class="amami-job-detail-heading">
            <span class="amami-job-glyph"><JobGlyph :name="selectedJob.icon" /></span>
            <div>
              <small>{{ selectedJob.workplace }}</small>
              <h2>{{ selectedJob.title }}</h2>
            </div>
          </div>
          <div class="amami-job-detail-scroll">
            <p class="amami-job-summary">{{ selectedJob.summary }}</p>
            <div class="amami-job-location">
              <MapIcon name="pin" /><span>{{ selectedJob.area }}</span>
            </div>
            <h3>工作内容</h3>
            <ul>
              <li v-for="duty in selectedJob.duties" :key="duty">{{ duty }}</li>
            </ul>
          </div>
          <div class="amami-job-actions">
            <button type="button" class="amami-job-consult" @click="emit('consult', selectedJob)">
              向诗乃咨询<MapIcon name="chevron" />
            </button>
            <button type="button" class="amami-job-locate" @click="emit('locate', selectedJob.locationId)">
              <MapIcon name="map" />在地图查看
            </button>
          </div>
          <p v-if="error" class="amami-job-error" role="alert">{{ error }}</p>
        </section>
        <div v-else class="amami-jobs-welcome">
          <span class="amami-jobs-quote" aria-hidden="true">“</span>
          <p>选好感兴趣的工作，<br />就过来和我聊聊吧。</p>
          <small>从公告板上选择一份招工启事</small>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import MapIcon from '../map/MapIcon.vue';
import JobGlyph from './JobGlyph.vue';
import { campusJobs, recruitmentArtworkUrl, type CampusJob } from './catalog';
defineProps<{ error?: string }>();
const emit = defineEmits<{ back: []; locate: [id: number]; consult: [job: CampusJob] }>();
const root = ref<HTMLElement | null>(null);
const layout = ref<HTMLElement | null>(null);
const detail = ref<HTMLElement | null>(null);
const backButton = ref<HTMLButtonElement | null>(null);
const categories = ['全部岗位', '商业服务', '校园服务'] as const;
const category = ref<(typeof categories)[number]>('全部岗位');
const selectedJob = ref<CampusJob | null>(null);
let boardScrollTop = 0;
const visibleJobs = computed(() =>
  campusJobs.filter(job => category.value === '全部岗位' || job.category === category.value),
);
const jobNumber = (job: CampusJob) => (campusJobs.indexOf(job) + 1).toString().padStart(2, '0');
async function selectJob(job: CampusJob) {
  boardScrollTop = layout.value?.scrollTop ?? 0;
  selectedJob.value = job;
  await nextTick();
  if (root.value && root.value.clientWidth < 760) {
    if (layout.value) layout.value.scrollTop = 0;
    detail.value?.focus({ preventScroll: true });
  }
}
async function clearSelection() {
  const id = selectedJob.value?.id;
  selectedJob.value = null;
  await nextTick();
  if (layout.value && root.value && root.value.clientWidth < 760) layout.value.scrollTop = boardScrollTop;
  root.value?.querySelector<HTMLButtonElement>(`[data-job-id="${id}"]`)?.focus({ preventScroll: true });
}
function goBack() {
  if (selectedJob.value) void clearSelection();
  else emit('back');
}
onMounted(() => backButton.value?.focus({ preventScroll: true }));
</script>
