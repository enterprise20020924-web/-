<template>
  <div class="space-y-6 animate-slide-up">
    <!-- 模式切换按钮 -->
    <div class="flex items-center justify-between mb-4">
      <div class="text-lg font-bold text-white">选择你要扮演的角色</div>
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <i class="fas fa-user-secret text-purple-400"></i>
        <span>生活模拟模式</span>
      </div>
    </div>

    <!-- 分类选择 -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="category in categories"
        :key="category"
        @click="selectedCategory = category"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          selectedCategory === category
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
            : 'bg-white/10 text-gray-300 hover:bg-white/20',
        ]"
      >
        {{ category }}
      </button>
    </div>

    <!-- 角色网格 -->
    <div class="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-2">
      <button
        v-for="npc in filteredNpcs"
        :key="npc.id"
        @click="selectNpc(npc)"
        :class="[
          'relative group p-2 rounded-xl transition-all duration-300 border-2',
          selectedNpc?.id === npc.id
            ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30'
            : 'border-transparent bg-white/5 hover:bg-white/10 hover:border-white/20',
        ]"
      >
        <!-- 头像 -->
        <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-black/30 mb-2">
          <img
            :src="getPortraitUrl(npc.name, npc.portraitKey)"
            :alt="npc.name"
            class="w-full h-full object-cover"
            @error="handleImageError($event)"
          />
          <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5">
            Lv.{{ npc.level }}
          </div>
        </div>
        <!-- 名称 -->
        <div class="text-center text-xs text-white truncate">{{ npc.name }}</div>
        <!-- 选中标记 -->
        <div
          v-if="selectedNpc?.id === npc.id"
          class="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
        >
          <i class="fas fa-check text-white text-[10px]"></i>
        </div>
      </button>
    </div>

    <!-- 选中角色详情 -->
    <div v-if="selectedNpc" class="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <!-- 大头像 (832x1216 比例) -->
        <div
          class="w-48 aspect-[832/1216] rounded-2xl overflow-hidden bg-black/30 mb-4 ring-4 ring-purple-500/30 shadow-xl shadow-purple-500/20"
        >
          <img
            :src="getPortraitUrl(selectedNpc.name, selectedNpc.portraitKey)"
            :alt="selectedNpc.name"
            class="w-full h-full object-cover"
            @error="handleImageError($event)"
          />
        </div>
        <!-- 信息 -->
        <div class="text-center">
          <div class="text-2xl font-bold text-white mb-1">{{ selectedNpc.name }}</div>
          <div class="text-sm text-purple-400 mb-2">Lv.{{ selectedNpc.level }} · {{ selectedNpc.category }}</div>
          <div class="text-sm text-gray-400 max-w-xs">{{ selectedNpc.description }}</div>
        </div>
      </div>

      <!-- 属性预览 -->
      <div v-if="npcStats" class="mt-6 grid grid-cols-4 gap-3 text-sm">
        <div class="bg-black/30 rounded-lg p-3 text-center">
          <div class="text-purple-400 text-xs">魅力</div>
          <div class="text-white font-bold text-lg">{{ npcStats.对手魅力 }}</div>
        </div>
        <div class="bg-black/30 rounded-lg p-3 text-center">
          <div class="text-purple-400 text-xs">幸运</div>
          <div class="text-white font-bold text-lg">{{ npcStats.对手幸运 }}</div>
        </div>
        <div class="bg-black/30 rounded-lg p-3 text-center">
          <div class="text-purple-400 text-xs">性斗力</div>
          <div class="text-white font-bold text-lg">{{ npcStats.对手性斗力 }}</div>
        </div>
        <div class="bg-black/30 rounded-lg p-3 text-center">
          <div class="text-purple-400 text-xs">忍耐力</div>
          <div class="text-white font-bold text-lg">{{ npcStats.对手忍耐力 }}</div>
        </div>
      </div>
    </div>

    <!-- 未选中提示 -->
    <div v-else class="bg-white/5 border border-dashed border-white/20 rounded-xl p-8 text-center text-gray-400">
      <i class="fas fa-hand-pointer text-2xl mb-2"></i>
      <div>点击上方角色头像进行选择</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ENEMY_DATABASE, EnemyBaseData } from '../../战斗界面/enemyDatabase';
import { computed, ref } from 'vue';
import { getNpcPortraitUrl, getNpcsByCategory, NPC_CHARACTERS, NpcCategory, NpcCharacter } from '../data/npcCharacters';

const emit = defineEmits<{
  (e: 'select', npc: NpcCharacter | null): void;
}>();

// 分类
const categories = computed<NpcCategory[]>(() => {
  const grouped = getNpcsByCategory();
  return Object.keys(grouped) as NpcCategory[];
});

const selectedCategory = ref<NpcCategory>('学生会');
const selectedNpc = ref<NpcCharacter | null>(null);

// 根据分类过滤NPC
const filteredNpcs = computed(() => {
  return NPC_CHARACTERS.filter(npc => npc.category === selectedCategory.value);
});

// 获取选中NPC的属性
const npcStats = computed<EnemyBaseData | null>(() => {
  if (!selectedNpc.value) return null;
  return ENEMY_DATABASE[selectedNpc.value.dbKey] || null;
});

// 头像URL
function getPortraitUrl(name: string, portraitKey?: string): string {
  return getNpcPortraitUrl(name, portraitKey);
}

// 图片加载失败处理
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text fill="%239ca3af" x="50" y="55" text-anchor="middle" font-size="12">无头像</text></svg>';
}

// 选择NPC
function selectNpc(npc: NpcCharacter) {
  selectedNpc.value = npc;
  emit('select', npc);
}

// 暴露选中的NPC
defineExpose({
  selectedNpc,
});
</script>

<style scoped>
/* 自定义滚动条 */
.max-h-\[300px\]::-webkit-scrollbar {
  width: 4px;
}
.max-h-\[300px\]::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}
.max-h-\[300px\]::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 2px;
}
</style>
