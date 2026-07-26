<template>
  <section class="beginner-workspace">
    <section class="beginner-form-panel">
      <div class="beginner-heading">
        <div>
          <span class="view-kicker">QUICK START</span>
          <h2>告诉玉藻，你想遇见怎样的人</h2>
          <p>只需回答三个问题，其余世界观、关系阶段和互动系统会自动补全。</p>
        </div>
        <button type="button" class="ghost compact-button" :disabled="isBusy" @click="applyExample">填入示例</button>
      </div>

      <div class="beginner-question-list">
        <section class="beginner-question required-question">
          <span class="question-index">01</span>
          <label class="question-copy" for="beginner-concept">
            <strong>这个角色最核心的点子是什么？</strong>
            <small>一句话也可以。身份、气质、矛盾感，想到什么写什么。</small>
          </label>
          <textarea
            id="beginner-concept"
            :value="concept"
            placeholder="例如：表面温柔可靠，实际上很怕被抛下的狐妖医生。"
            @input="emitValue('update:concept', $event)"
          />
        </section>

        <section class="beginner-question">
          <span class="question-index">02</span>
          <label class="question-copy" for="beginner-relationship">
            <strong>她和玩家是什么关系？</strong>
            <small>不确定可以留空，系统会设计一个适合展开故事的初始关系。</small>
          </label>
          <input
            id="beginner-relationship"
            :value="relationship"
            placeholder="例如：刚签订契约的御主、重逢的旧友、互相提防的搭档"
            @input="emitValue('update:relationship', $event)"
          />
        </section>

        <section class="beginner-question">
          <span class="question-index">03</span>
          <label class="question-copy" for="beginner-experience">
            <strong>你希望聊天时有什么感觉？</strong>
            <small>描述相处氛围、剧情方向或你最想体验的关系变化。</small>
          </label>
          <span class="experience-chips" aria-label="体验方向示例">
            <button
              v-for="option in experienceOptions"
              :key="option"
              type="button"
              :class="{ active: experience === option }"
              :aria-pressed="experience === option"
              @click="emit('update:experience', option)"
            >
              {{ option }}
            </button>
          </span>
          <textarea
            id="beginner-experience"
            :value="experience"
            class="experience-textarea"
            placeholder="例如：前期互相试探，熟悉后嘴硬心软，亲密后有明显保护欲。"
            @input="emitValue('update:experience', $event)"
          />
        </section>
      </div>

      <section class="beginner-world-card">
        <div class="section-head compact-head">
          <div>
            <h3>故事发生在哪里？</h3>
            <p>默认交给玉藻自动安排，也可以指定原作或自己的世界。</p>
          </div>
          <span class="optional-badge">可跳过</span>
        </div>
        <div class="world-mode-options">
          <button
            type="button"
            :class="{ active: worldMode === 'auto' }"
            :aria-pressed="worldMode === 'auto'"
            @click="emit('update:worldMode', 'auto')"
          >
            <strong>自动安排</strong><small>最适合第一次使用</small>
          </button>
          <button
            type="button"
            :class="{ active: worldMode === 'existing' }"
            :aria-pressed="worldMode === 'existing'"
            @click="emit('update:worldMode', 'existing')"
          >
            <strong>原作或已有世界</strong><small>沿用你熟悉的背景</small>
          </button>
          <button
            type="button"
            :class="{ active: worldMode === 'custom' }"
            :aria-pressed="worldMode === 'custom'"
            @click="emit('update:worldMode', 'custom')"
          >
            <strong>自己指定</strong><small>写下一句话世界设定</small>
          </button>
        </div>
        <textarea
          v-if="worldMode !== 'auto'"
          :value="worldHint"
          class="world-hint-textarea"
          :placeholder="
            worldMode === 'existing'
              ? '例如：FGO 第七特异点，或现代都市圣杯战争'
              : '例如：妖怪与人类共同生活的现代海滨城市'
          "
          @input="emitValue('update:worldHint', $event)"
        />
      </section>
    </section>

    <aside class="beginner-summary-panel">
      <div class="beginner-readiness">
        <span :class="['readiness-orb', { ready: canRun }]">{{ canRun ? '✓' : '1' }}</span>
        <div>
          <strong>{{ canRun ? '可以设置第一幕' : '还差角色点子' }}</strong
          ><small>其余内容都可以交给系统补全</small>
        </div>
      </div>

      <div class="beginner-target-card">
        <span>将写入这张角色卡</span>
        <strong>{{ currentCharacter }}</strong>
        <small>保存位置：{{ worldbookName }}</small>
      </div>

      <div class="beginner-plan-list">
        <span><i>1</i>理解角色点子与玩家关系</span>
        <span><i>2</i>自动构建适合展开故事的世界</span>
        <span><i>3</i>设置第一幕的文风与故事起点</span>
        <span><i>4</i>生成完整人设、开场白与状态系统</span>
      </div>

      <div class="beginner-call-note"><strong>预计 3 次生成</strong><span>世界观 + 角色 + 开场白</span></div>

      <p v-if="validationIssue" class="field-issue beginner-issue" role="alert">{{ validationIssue }}</p>
      <button
        type="button"
        class="primary wide beginner-generate-button"
        :disabled="isBusy || !canRun"
        @click="emit('request-run')"
      >
        {{ isBusy ? '正在准备...' : '继续设置第一幕' }}
      </button>
      <button type="button" class="ghost wide" :disabled="isBusy" @click="emit('open-advanced')">展开高级编辑</button>
      <button type="button" class="ghost wide quiet-action" :disabled="isBusy" @click="emit('back')">
        返回项目设置
      </button>
      <p v-if="draftStatus" class="draft-status command-draft-status">{{ draftStatus }}</p>
    </aside>
  </section>
</template>

<script setup lang="ts">
type WorldMode = 'auto' | 'existing' | 'custom';

defineProps<{
  canRun: boolean;
  concept: string;
  currentCharacter: string;
  draftStatus: string;
  experience: string;
  isBusy: boolean;
  relationship: string;
  validationIssue: string;
  worldHint: string;
  worldMode: WorldMode;
  worldbookName: string;
}>();

const emit = defineEmits<{
  back: [];
  'open-advanced': [];
  'request-run': [];
  'update:concept': [value: string];
  'update:experience': [value: string];
  'update:relationship': [value: string];
  'update:worldHint': [value: string];
  'update:worldMode': [value: WorldMode];
}>();

const experienceOptions = ['温柔陪伴', '欢喜冤家', '危险拉扯', '冒险搭档', '慢热治愈'];

function emitValue(
  event: 'update:concept' | 'update:relationship' | 'update:experience' | 'update:worldHint',
  input: Event,
) {
  emit(event, (input.target as HTMLInputElement | HTMLTextAreaElement).value);
}

function applyExample() {
  emit('update:concept', '表面温柔从容，实际上很害怕再次失去重要之人的狐妖医生。');
  emit('update:relationship', '刚刚签订契约、还在互相观察的搭档');
  emit('update:experience', '前期礼貌试探，熟悉后嘴硬心软，亲密后展现明显保护欲。');
  emit('update:worldMode', 'auto');
}
</script>
