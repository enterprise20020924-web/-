<template>
  <section class="app-view opening-workspace">
    <div class="view-heading compact-view-heading">
      <div>
        <span class="view-kicker">OPENING SCENE</span>
        <h2>设置第一幕</h2>
        <p>告诉玉藻想要的叙事质感与故事起点，生成后会自动写入角色卡第一条消息。</p>
      </div>
      <span class="opening-step-badge">最后一步 · 生成前不会写入</span>
    </div>

    <div class="opening-workspace-grid">
      <aside class="tool-panel opening-preset-panel">
        <div class="tool-panel-head compact-panel-head">
          <div>
            <span class="panel-index">03</span>
            <div>
              <h3>文风捷径</h3>
              <p>新手可以直接选一个</p>
            </div>
          </div>
        </div>

        <div class="opening-preset-list">
          <button type="button" :disabled="isBusy" @click="applyPreset('natural')">
            <strong>自然细腻</strong>
            <small>动作与对话并重，留出互动空间</small>
          </button>
          <button type="button" :disabled="isBusy" @click="applyPreset('novel')">
            <strong>视觉小说</strong>
            <small>画面清晰、节奏明确、代入感强</small>
          </button>
          <button type="button" :disabled="isBusy" @click="applyPreset('direct')">
            <strong>直接入戏</strong>
            <small>少铺垫，尽快进入人物冲突</small>
          </button>
        </div>

        <div class="opening-project-summary">
          <span>目标世界书</span>
          <strong>{{ worldbookName }}</strong>
          <small>{{ roleCount }} 个角色会参与设定约束</small>
        </div>
      </aside>

      <section class="opening-editor-stack">
        <label class="tool-panel opening-editor-card">
          <span class="opening-field-head">
            <span><b>01</b><strong>想要的文风</strong></span>
            <small>{{ openingStyle.trim().length }} 字</small>
          </span>
          <textarea
            :value="openingStyle"
            placeholder="例如：自然细腻的轻小说叙事，重视动作、环境与潜台词，不替玩家作决定。"
            @input="emit('update:openingStyle', ($event.target as HTMLTextAreaElement).value)"
          />
          <small>也可以粘贴文风参考；系统只学习表达方式，不照搬其中情节。</small>
        </label>

        <label class="tool-panel opening-editor-card opening-outline-card">
          <span class="opening-field-head">
            <span><b>02</b><strong>开场大纲</strong></span>
            <small>{{ openingOutline.trim().length }} 字</small>
          </span>
          <textarea
            :value="openingOutline"
            placeholder="写清时间、地点、在场人物、人物当前状态、正在发生的事情，以及希望玩家从哪里开始行动。"
            @input="emit('update:openingOutline', ($event.target as HTMLTextAreaElement).value)"
          />
          <small>不需要写成小说，只要把起点说清楚，玉藻会扩写并留下可接话钩子。</small>
        </label>
      </section>

      <aside class="tool-panel opening-check-panel">
        <div class="opening-check-head">
          <span class="view-kicker">READY CHECK</span>
          <h3>准备生成</h3>
          <p>确认后才会创建恢复点，并开始分阶段生成与写入。</p>
        </div>

        <div class="opening-check-list">
          <span :class="{ ready: openingStyle.trim() }"><i />文风已设置</span>
          <span :class="{ ready: openingOutline.trim() }"><i />故事起点已设置</span>
          <span class="ready"><i />角色与世界观素材已保留</span>
        </div>

        <p v-if="validationIssue" class="field-issue" role="alert">{{ validationIssue }}</p>
        <p v-else-if="draftStatus" class="draft-status">{{ draftStatus }}</p>

        <div class="opening-actions">
          <button class="primary wide" :disabled="isBusy || !canContinue" @click="emit('request-run')">
            {{ isBusy ? '处理中...' : '检查并开始生成' }}
          </button>
          <button class="ghost wide" :disabled="isBusy" @click="emit('back')">返回修改素材</button>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  openingStyle: string;
  openingOutline: string;
  worldbookName: string;
  roleCount: number;
  isBusy: boolean;
  canContinue: boolean;
  validationIssue: string;
  draftStatus: string;
}>();

const emit = defineEmits<{
  'update:openingStyle': [value: string];
  'update:openingOutline': [value: string];
  back: [];
  'request-run': [];
}>();

const stylePresets = {
  natural:
    '自然细腻的中文叙事。动作、环境、对话与潜台词保持平衡；人物主动但不替玩家作出关键决定，结尾留下自然的回应空间。',
  novel: '视觉小说式中文叙事。场景切换清晰，画面和人物表情具体，对话节奏鲜明；避免大段说明，用正在发生的事件带出设定。',
  direct:
    '简洁直接的中文叙事。减少背景铺陈，从角色正在面对的具体事件切入；快速建立冲突、目标或邀请，让玩家能够立即行动。',
} as const;

function applyPreset(key: keyof typeof stylePresets) {
  emit('update:openingStyle', stylePresets[key]);
  if (!props.openingOutline.trim()) {
    emit(
      'update:openingOutline',
      '从角色与玩家第一次需要真正回应彼此的具体场面开始。明确时间、地点和当前局势，让角色先采取一个符合人设的行动，并把下一步选择自然交给玩家。',
    );
  }
}
</script>
