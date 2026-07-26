<template>
  <div v-if="open" class="dialog-backdrop" role="presentation" @click.self="emit('close')">
    <section class="preflight-dialog" role="dialog" aria-modal="true" aria-labelledby="preflight-title">
      <div class="dialog-head">
        <div>
          <span class="view-kicker">PRE-FLIGHT CHECK</span>
          <h2 id="preflight-title">确认生成与写入</h2>
          <p>开始前会自动保存恢复点。生成过程中会分阶段写入，失败后可以从当前步骤继续。</p>
        </div>
        <button class="icon-button close-button" aria-label="关闭执行检查" :disabled="isBusy" @click="emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <div class="preflight-summary-grid">
        <div>
          <span>目标角色卡</span><strong>{{ currentCharacter }}</strong>
        </div>
        <div>
          <span>目标世界书</span><strong>{{ worldbookName }}</strong>
        </div>
        <div>
          <span>有效角色</span><strong>{{ roleCount }} 个</strong>
        </div>
        <div>
          <span>角色卡面</span><strong>{{ hasAvatar ? '将写入' : '不修改' }}</strong>
        </div>
        <div>
          <span>基础生成</span><strong>{{ roleCount + 2 }} 次起</strong>
        </div>
        <div>
          <span>连接模式</span><strong>{{ generationModeLabel }}</strong>
        </div>
      </div>

      <div class="write-manifest">
        <h3>将执行以下操作</h3>
        <ul>
          <li>保存当前角色卡、世界书、后台脚本和状态栏规则作为恢复点</li>
          <li>生成并保存故事世界、完整人设和关系阶段</li>
          <li>按文风与大纲生成第一幕，并写入角色卡第一条消息</li>
          <li>安装互动状态、关系变量和状态栏显示能力</li>
          <li v-if="hasAvatar">把当前选择的图片设置为角色卡面</li>
        </ul>
        <details class="technical-manifest">
          <summary>查看专业组件</summary>
          <p>世界书条目、调色盘、二次解释、EJS 多阶段人设、MVU、ZOD 变量结构和角色局部正则。</p>
        </details>
      </div>

      <div class="dialog-note">
        <strong>不会修改手写内容</strong>
        <span>只更新本写卡器标记的旧条目；长素材蒸馏或截断续传可能增加调用次数。</span>
      </div>

      <div class="dialog-actions">
        <button class="ghost" :disabled="isBusy" @click="emit('close')">返回检查</button>
        <button class="primary" :disabled="isBusy" @click="emit('confirm')">
          {{ isBusy ? '正在启动...' : '确认并开始生成' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GenerationMode } from '../ui-types';

const props = defineProps<{
  open: boolean;
  currentCharacter: string;
  worldbookName: string;
  roleCount: number;
  hasAvatar: boolean;
  isBusy: boolean;
  generationMode: GenerationMode;
}>();

const generationModeLabel = computed(() => {
  if (props.generationMode === 'stream') return '流式保活';
  if (props.generationMode === 'fake-stream') return '截断续传';
  return '稳定完整';
});

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>
