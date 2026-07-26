<template>
  <section class="completion-view">
    <div class="completion-celebration">
      <span class="completion-halo" aria-hidden="true" />
      <img :src="workingImageSrc" alt="" />
      <div class="completion-copy">
        <span class="view-kicker">CARD READY</span>
        <h2>角色卡已经准备好了</h2>
        <p>世界背景、完整人设、故事第一幕和互动状态已经写入。现在可以直接打开角色卡开始使用。</p>
      </div>
      <button class="primary completion-primary" @click="emit('finish')">确定并打开角色卡</button>
    </div>

    <div class="completion-board">
      <div class="completion-summary-grid">
        <div>
          <span>保存位置</span><strong>{{ worldbookName }}</strong>
        </div>
        <div>
          <span>已生成角色</span><strong>{{ roleCount }} 个</strong>
        </div>
        <div>
          <span>格式状态</span><strong :class="{ warning: formatIssueCount > 0 }">{{ formatStatus }}</strong>
        </div>
        <div>
          <span>恢复点</span><strong>{{ hasRecovery ? '可以恢复' : '未创建' }}</strong>
        </div>
      </div>

      <section class="completion-checklist">
        <div class="section-head compact-head">
          <div>
            <h3>本次已经完成</h3>
            <p>专业组件已自动安装，无需额外配置。</p>
          </div>
        </div>
        <div class="completion-items">
          <span><i>✓</i>世界观与角色基础信息</span>
          <span><i>✓</i>性格调色盘与二次解释</span>
          <span><i>✓</i>关系阶段与互动变量</span>
          <span><i>✓</i>第一条消息与可接话钩子</span>
          <span><i>✓</i>状态栏与后台互动规则</span>
        </div>
      </section>

      <section class="completion-next-card">
        <div class="section-head compact-head">
          <div>
            <h3>第一次使用建议</h3>
            <p>先看实际聊天表现，再决定是否需要继续微调。</p>
          </div>
        </div>
        <div class="completion-next-items">
          <div>
            <i>1</i
            ><span><strong>返回聊天直接开始</strong><small>自然地说第一句话即可，互动系统会自动运行。</small></span>
          </div>
          <div>
            <i>2</i
            ><span
              ><strong>先试聊 3～5 轮</strong
              ><small>如果口吻或关系节奏不对，再回到写卡器修改，不必全部推倒重来。</small></span
            >
          </div>
        </div>
      </section>

      <div v-if="formatIssueCount" class="completion-warning-card">
        <div>
          <strong>内容已经写入，但有 {{ formatIssueCount }} 项格式提醒</strong>
          <p>生成没有中断，可以先检查并自动矫正标签。</p>
        </div>
        <button class="secondary" @click="emit('format-review')">检查格式</button>
      </div>

      <div class="completion-actions">
        <button class="secondary" @click="emit('editor')">返回修改</button>
        <button v-if="!formatIssueCount" class="secondary" @click="emit('format-review')">查看格式校验</button>
        <button class="ghost" @click="emit('rerun')">重新生成全部</button>
        <button v-if="hasRecovery" class="ghost danger-action" @click="emit('restore')">恢复生成前版本</button>
      </div>

      <p class="completion-safety-note">恢复操作会还原本次生成前的世界书、角色脚本、状态栏显示规则和角色卡状态。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  formatIssueCount: number;
  hasRecovery: boolean;
  roleCount: number;
  workingImageSrc: string;
  worldbookName: string;
}>();

const emit = defineEmits<{
  editor: [];
  finish: [];
  'format-review': [];
  rerun: [];
  restore: [];
}>();

const formatStatus = computed(() => (props.formatIssueCount ? `${props.formatIssueCount} 项提醒` : '校验通过'));
</script>
