<template>
  <div class="inventory-page">
    <SkylinkModuleHeader
      code="04"
      label="EQUIPMENT BAY"
      title="物资整备库"
      description="装备就位，准备下一次行动。"
      icon="fas fa-cubes"
    />
    <!-- 天海信用点显示 -->
    <div class="coins-card">
      <div class="coins-icon">
        <i class="fas fa-coins"></i>
      </div>
      <div class="coins-info">
        <span class="coins-label">天海信用点</span>
        <span class="coins-amount">{{ formatNumber(characterData.物品系统?._天海信用点 || 0) }}</span>
      </div>
    </div>

    <!-- 装备栏 -->
    <div class="section-card">
      <h3 class="section-title"><i class="fas fa-shield"></i> 装备栏</h3>
      <div class="equipment-grid">
        <div
          class="equipment-slot"
          v-for="slot in equipmentSlots"
          :key="slot.key"
          :class="{ empty: !slot.value || !slot.value.名称 }"
          @mouseenter="showEquipmentTooltip(slot.value, $event)"
          @mouseleave="hideTooltip"
          @touchstart="showEquipmentTooltipMobile(slot.value, $event)"
          @touchend="hideTooltip"
        >
          <div class="slot-icon">
            <i :class="slot.icon"></i>
          </div>
          <div class="slot-info">
            <div class="slot-label">{{ slot.label }}</div>
            <div class="slot-value">{{ slot.value?.名称 || '空' }}</div>
            <div v-if="slot.value?.名称" class="slot-level" :class="getItemRarityClass(slot.value.等级)">
              <span class="rarity-text">{{ slot.value.等级 }}</span>
            </div>
          </div>
          <button v-if="slot.value?.名称" class="unequip-btn" @click.stop="unequipItem(slot.key)" title="卸下装备">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 装备加成汇总 -->
    <div class="section-card" v-if="hasEquipmentBonuses">
      <h3 class="section-title"><i class="fas fa-chart-line"></i> 装备加成汇总</h3>
      <div class="bonus-grid">
        <div v-for="(value, key) in equipmentBonuses" :key="key" class="bonus-item" v-show="value !== 0">
          <span class="bonus-label">{{ formatBonusLabel(String(key)) }}</span>
          <span class="bonus-value" :class="getBonusClass(Number(value))">
            {{ formatBonusValue(Number(value)) }}{{ isPercentBonus(String(key)) ? '%' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 背包物品 -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-header-top">
          <h3 class="section-title">
            <i class="fas fa-box"></i> 背包
            <span class="item-count">{{ Object.keys(filteredItems).length }} 件物品</span>
          </h3>
          <button class="bulk-sell-btn" :disabled="bulkSellItemCount <= 0" @click="bulkSellFilteredItems">
            <i class="fas fa-coins"></i>
            批量售出（{{ bulkSellItemCount }}件 / +{{ formatNumber(bulkSellGoldGain) }}）
          </button>
        </div>

        <!-- 分类筛选 -->
        <div class="filter-tabs">
          <!-- 类型筛选 -->
          <div class="filter-group">
            <span class="filter-label">类型:</span>
            <button
              v-for="type in itemTypes"
              :key="type"
              class="filter-btn"
              :class="{ active: selectedType === type }"
              @click="selectedType = type"
            >
              {{ type }}
            </button>
          </div>

          <!-- 等级筛选 -->
          <div class="filter-group">
            <span class="filter-label">等级:</span>
            <button
              v-for="level in itemLevels"
              :key="level"
              class="filter-btn"
              :class="{ active: selectedLevel === level }"
              @click="selectedLevel = level"
            >
              {{ level }}
            </button>
          </div>
        </div>
      </div>

      <div class="inventory-list" v-if="Object.keys(filteredItems).length > 0">
        <div
          class="inventory-item"
          v-for="(item, itemKey) in filteredItems"
          :key="itemKey"
          :class="getItemRarityClass(item.等级)"
          @mouseenter="showTooltip(itemKey, item, $event)"
          @mouseleave="hideTooltip"
          @touchstart="showTooltipMobile(itemKey, item, $event)"
          @touchend="hideTooltip"
        >
          <button class="discard-btn" @click.stop="discardItem(itemKey)" title="售卖">
            <i class="fas fa-times"></i>
          </button>
          <div class="item-header">
            <div class="item-name">
              <span class="item-name-text">{{ itemKey }}</span>
            </div>
            <div class="item-badges">
              <span class="item-level" :class="getItemRarityClass(item.等级)">
                <span class="rarity-text">{{ item.等级 }}</span>
              </span>
              <span class="item-count" v-if="item.数量 !== undefined && item.数量 > 1">×{{ item.数量 }}</span>
            </div>
          </div>
          <div class="item-meta">
            <span class="item-type">{{ item.类型 }}</span>
            <span v-if="item.部位" class="item-slot">{{ item.部位 }}</span>
          </div>
          <div class="item-desc" v-if="item.描述">
            {{ item.描述 }}
          </div>
          <div
            v-if="item.类型 === '装备' && item.加成属性 && Object.keys(item.加成属性).length > 0"
            class="item-bonus-inline"
          >
            <div v-for="(value, key) in item.加成属性" :key="key" class="item-bonus-inline-row" v-show="value !== 0">
              <span>{{ formatBonusLabel(String(key)) }}</span>
              <strong :class="getBonusClass(Number(value))">
                {{ formatBonusValue(Number(value)) }}{{ isPercentBonus(String(key)) ? '%' : '' }}
              </strong>
            </div>
          </div>

          <div
            v-if="item.类型 === '消耗品' && hasPermanentConsumableEffect(itemKey, item)"
            class="item-permanent-inline"
          >
            <i class="fas fa-sparkles"></i>
            <span>永久效果：{{ describePermanentConsumableEffect(itemKey, item) }}</span>
          </div>

          <!-- 装备按钮（仅装备类型显示） -->
          <button v-if="item.类型 === '装备' && item.部位" class="equip-btn" @click.stop="equipItem(itemKey, item)">
            <i class="fas fa-hand-sparkles"></i> 装备
          </button>
          <button
            v-if="item.类型 === '消耗品' && hasPermanentConsumableEffect(itemKey, item)"
            class="use-consumable-btn"
            @click.stop="usePermanentConsumable(itemKey, item)"
          >
            <i class="fas fa-wand-magic-sparkles"></i> 使用
          </button>
        </div>
      </div>

      <div class="empty-state" v-else>
        <i class="fas fa-box-open"></i>
        <p>背包空空如也</p>
        <span>去学园商店逛逛吧</span>
      </div>
    </div>

    <!-- 工具提示 -->
    <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="tooltip-title">{{ tooltip.name }}</div>
      <div class="tooltip-level" :class="getItemRarityClass(tooltip.level)">
        <span class="rarity-text">{{ tooltip.level }}</span>
      </div>
      <div class="tooltip-bonuses" v-if="tooltip.bonuses && Object.keys(tooltip.bonuses).length > 0">
        <div v-for="(value, key) in tooltip.bonuses" :key="key" class="tooltip-bonus-item" v-show="value !== 0">
          <span>{{ formatBonusLabel(String(key)) }}</span>
          <span :class="getBonusClass(Number(value))">
            {{ formatBonusValue(Number(value)) }}{{ isPercentBonus(String(key)) ? '%' : '' }}
          </span>
        </div>
      </div>
      <div class="tooltip-desc" v-if="tooltip.desc">{{ tooltip.desc }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { creditMoney } from '../../../../../money/ledger';
import SkylinkModuleHeader from '../../../shared/SkylinkModuleHeader.vue';
import { computed, ref } from 'vue';
import { getLatestMvuData, replaceLatestMvuData, runLatestMvuTransaction } from '../../../shared/mvuStore';
import {
  applyPermanentConsumableEffect,
  describePermanentConsumableEffect,
  hasPermanentConsumableEffect,
} from '../../../shared/permanentConsumables';
import { calculateEquipmentBonus } from '../../../shared/statSelectors';

const props = defineProps<{
  characterData: any;
}>();

// 调试：检查背包数据
const debugBackpack = computed(() => {
  const backpack = props.characterData?.物品系统?.背包;
  console.log('[背包界面] 背包数据:', backpack);
  console.log('[背包界面] 背包类型:', typeof backpack);
  console.log('[背包界面] 背包键值:', backpack ? Object.keys(backpack) : []);
  return backpack;
});

// 筛选状态
const selectedType = ref<string>('全部');
const selectedLevel = ref<string>('全部');
const ITEM_RARITY_ORDER = ['C', 'B', 'A', 'S', 'SS', 'SSS', 'EX'];

// 工具提示
const tooltip = ref({
  visible: false,
  name: '',
  level: 'C',
  bonuses: {} as Record<string, number>,
  desc: '',
  x: 0,
  y: 0,
});

const TOOLTIP_WIDTH = 260;
const TOOLTIP_HEIGHT = 220;
const TOOLTIP_GAP = 10;
const TOOLTIP_CONTAINER_PADDING = 8;

function clampTooltipCoordinate(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getTooltipPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  const container = target?.closest('.inventory-page') as HTMLElement | null;

  if (!container) {
    return { x: TOOLTIP_CONTAINER_PADDING, y: TOOLTIP_CONTAINER_PADDING };
  }

  const containerRect = container.getBoundingClientRect();
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;
  const minX = scrollLeft + TOOLTIP_CONTAINER_PADDING;
  const minY = scrollTop + TOOLTIP_CONTAINER_PADDING;
  const maxX = scrollLeft + container.clientWidth - TOOLTIP_WIDTH - TOOLTIP_CONTAINER_PADDING;
  const maxY = scrollTop + container.clientHeight - TOOLTIP_HEIGHT - TOOLTIP_CONTAINER_PADDING;

  if (event instanceof MouseEvent) {
    const rect = target?.getBoundingClientRect();
    const rawX =
      rect && rect.right - containerRect.left + TOOLTIP_GAP + TOOLTIP_WIDTH <= container.clientWidth
        ? rect.right - containerRect.left + scrollLeft + TOOLTIP_GAP
        : (rect?.left ?? event.clientX) - containerRect.left + scrollLeft - TOOLTIP_WIDTH - TOOLTIP_GAP;
    const rawY = rect ? rect.top - containerRect.top + scrollTop : scrollTop + TOOLTIP_CONTAINER_PADDING;

    return {
      x: clampTooltipCoordinate(rawX, minX, maxX),
      y: clampTooltipCoordinate(rawY, minY, maxY),
    };
  }

  const touch = event.touches[0] || event.changedTouches[0];
  const rawX = (touch?.clientX ?? containerRect.left) - containerRect.left + scrollLeft + TOOLTIP_GAP;
  const rawY = (touch?.clientY ?? containerRect.top) - containerRect.top + scrollTop + TOOLTIP_GAP;

  return {
    x: clampTooltipCoordinate(rawX, minX, maxX),
    y: clampTooltipCoordinate(rawY, minY, maxY),
  };
}

// 物品类型列表
const itemTypes = computed(() => {
  const types = new Set<string>(['全部']);
  const items = props.characterData?.物品系统?.背包 || {};
  Object.values(items).forEach((item: any) => {
    if (item?.类型) types.add(item.类型);
  });
  return Array.from(types);
});

// 物品等级列表
const itemLevels = computed(() => {
  const levels = new Set<string>(['全部']);
  const items = props.characterData?.物品系统?.背包 || {};
  Object.values(items).forEach((item: any) => {
    if (item?.等级) levels.add(item.等级);
  });
  return Array.from(levels).sort(compareItemRarity);
});

function getItemRarityRank(level: string): number {
  if (level === '全部') return -1;
  const index = ITEM_RARITY_ORDER.indexOf(level);
  return index >= 0 ? index : ITEM_RARITY_ORDER.length;
}

function compareItemRarity(a: string, b: string): number {
  const rarityDiff = getItemRarityRank(a) - getItemRarityRank(b);
  if (rarityDiff !== 0) return rarityDiff;
  return a.localeCompare(b, 'zh-Hans-CN');
}

// 装备栏槽位
const equipmentSlots = computed(() => {
  const equipment = props.characterData.物品系统?._装备栏 || {};
  return [
    { key: '主装备', label: '主装备', value: equipment.主装备, icon: 'fas fa-wand-magic-sparkles' },
    { key: '副装备', label: '副装备', value: equipment.副装备, icon: 'fas fa-hand-fist' },
    { key: '饰品1', label: '饰品 1', value: equipment.饰品1, icon: 'fas fa-ring' },
    { key: '饰品2', label: '饰品 2', value: equipment.饰品2, icon: 'fas fa-gem' },
    { key: '特殊装备', label: '特殊装备', value: equipment.特殊装备, icon: 'fas fa-star' },
  ];
});

// 装备加成汇总
const equipmentBonuses = computed(() => {
  return calculateEquipmentBonus(props.characterData);
});

const hasEquipmentBonuses = computed(() => {
  const bonuses = equipmentBonuses.value;
  return Object.values(bonuses).some((v: any) => v !== 0);
});

// 背包物品（过滤后）
const filteredItems = computed(() => {
  // 确保使用可选链操作符
  const items = props.characterData?.物品系统?.背包 || {};

  // 调试日志
  if (Object.keys(items).length > 0) {
    console.log('[背包界面] 原始背包数据:', items);
    console.log('[背包界面] 背包物品数量:', Object.keys(items).length);
    Object.entries(items).forEach(([key, item]: [string, any]) => {
      console.log(`[背包界面] 物品 "${key}":`, item, '类型:', item?.类型, '等级:', item?.等级);
    });
  } else {
    console.log('[背包界面] 背包为空或未找到数据');
    console.log('[背包界面] characterData:', props.characterData);
    console.log('[背包界面] 物品系统:', props.characterData?.物品系统);
  }

  const entries = Object.entries(items);

  const filtered = entries
    .filter(([_, item]: [string, any]) => {
      // 类型筛选
      if (selectedType.value !== '全部' && item?.类型 !== selectedType.value) {
        return false;
      }
      // 等级筛选
      if (selectedLevel.value !== '全部' && item?.等级 !== selectedLevel.value) {
        return false;
      }
      return true;
    })
    .sort(([keyA, itemA]: [string, any], [keyB, itemB]: [string, any]) => {
      const rarityDiff = compareItemRarity(String(itemA?.等级 || ''), String(itemB?.等级 || ''));
      if (rarityDiff !== 0) return rarityDiff;
      return keyA.localeCompare(keyB, 'zh-Hans-CN');
    })
    .reduce(
      (acc, [key, item]) => {
        acc[key] = item;
        return acc;
      },
      {} as Record<string, any>,
    );

  console.log('[背包界面] 过滤后的物品:', filtered);
  console.log('[背包界面] 过滤后的数量:', Object.keys(filtered).length);

  return filtered;
});

const SELL_PRICE_PER_ITEM = 50;
const bulkSellItemCount = computed(() => {
  return Object.values(filteredItems.value).reduce((sum, item: any) => {
    const quantity = Number(item?.数量 ?? 1) || 1;
    return sum + Math.max(1, quantity);
  }, 0);
});
const bulkSellGoldGain = computed(() => bulkSellItemCount.value * SELL_PRICE_PER_ITEM);

// 格式化数字
function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

// 格式化加成标签
function formatBonusLabel(key: string): string {
  const labelMap: Record<string, string> = {
    魅力加成: '魅力',
    幸运加成: '幸运',
    基础性斗力加成: '性斗力+',
    基础性斗力成算: '性斗力%',
    基础忍耐力加成: '忍耐力+',
    基础忍耐力成算: '忍耐力%',
    闪避率加成: '闪避率',
    暴击率加成: '暴击率',
  };
  return labelMap[key] || key;
}

// 判断是否为百分比加成
function isPercentBonus(key: string): boolean {
  return key.includes('成算') || key.includes('率');
}

// 格式化加成值
function formatBonusValue(value: number): string {
  if (value === 0) return '0';
  if (value > 0) return `+${value}`;
  return `${value}`;
}

// 获取加成值的样式类
function getBonusClass(value: number): string {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

// 获取物品稀有度样式
function getItemRarityClass(level: string): string {
  const rarityMap: Record<string, string> = {
    C: 'rarity-c',
    B: 'rarity-b',
    A: 'rarity-a',
    S: 'rarity-s',
    SS: 'rarity-ss',
    EX: 'rarity-ex',
  };
  return rarityMap[level] || 'rarity-c';
}

// 显示工具提示（背包物品）
function showTooltip(itemKey: string, item: any, event: MouseEvent) {
  if (item.类型 !== '装备' || !item.加成属性) {
    return;
  }

  const position = getTooltipPosition(event);
  tooltip.value = {
    visible: true,
    name: itemKey,
    level: item.等级 || 'C',
    bonuses: item.加成属性 || {},
    desc: item.描述 || '',
    x: position.x,
    y: position.y,
  };
}

// 移动端显示工具提示（背包物品）
function showTooltipMobile(itemKey: string, item: any, event: TouchEvent) {
  if (item.类型 !== '装备' || !item.加成属性) {
    return;
  }

  const position = getTooltipPosition(event);
  tooltip.value = {
    visible: true,
    name: itemKey,
    level: item.等级 || 'C',
    bonuses: item.加成属性 || {},
    desc: item.描述 || '',
    x: position.x,
    y: position.y,
  };

  // 3秒后自动隐藏
  setTimeout(() => {
    tooltip.value.visible = false;
  }, 3000);
}

// 显示装备槽位的工具提示
function showEquipmentTooltip(equippedItem: any, event: MouseEvent) {
  if (!equippedItem || !equippedItem.名称 || !equippedItem.加成属性) {
    return;
  }

  const position = getTooltipPosition(event);
  tooltip.value = {
    visible: true,
    name: equippedItem.名称,
    level: equippedItem.等级 || 'C',
    bonuses: equippedItem.加成属性 || {},
    desc: equippedItem.描述 || '',
    x: position.x,
    y: position.y,
  };
}

// 移动端显示装备槽位的工具提示
function showEquipmentTooltipMobile(equippedItem: any, event: TouchEvent) {
  if (!equippedItem || !equippedItem.名称 || !equippedItem.加成属性) {
    return;
  }

  const position = getTooltipPosition(event);
  tooltip.value = {
    visible: true,
    name: equippedItem.名称,
    level: equippedItem.等级 || 'C',
    bonuses: equippedItem.加成属性 || {},
    desc: equippedItem.描述 || '',
    x: position.x,
    y: position.y,
  };

  // 3秒后自动隐藏
  setTimeout(() => {
    tooltip.value.visible = false;
  }, 3000);
}

// 隐藏工具提示
function hideTooltip() {
  tooltip.value.visible = false;
}

// 创建完整的加成属性对象（确保包含所有字段）
function createFullBonusAttributes(partial?: any): Record<string, number> {
  const defaultBonuses = {
    魅力加成: 0,
    幸运加成: 0,
    基础性斗力加成: 0,
    基础性斗力成算: 0,
    基础忍耐力加成: 0,
    基础忍耐力成算: 0,
    闪避率加成: 0,
    暴击率加成: 0,
  };

  if (!partial || typeof partial !== 'object') {
    return defaultBonuses;
  }

  // 合并部分加成属性，确保所有字段都存在
  return {
    ...defaultBonuses,
    ...partial,
  };
}

function addEquipmentBackToBackpack(statData: any, itemName: string, itemData: any) {
  if (!statData.物品系统.背包) {
    statData.物品系统.背包 = {};
  }

  const existing = statData.物品系统.背包[itemName];
  if (existing && typeof existing === 'object' && existing.类型 === '装备') {
    const currentQuantity = Math.max(1, Number(existing.数量 ?? 1) || 1);
    statData.物品系统.背包[itemName] = {
      ...existing,
      ...itemData,
      数量: currentQuantity + 1,
    };
    return;
  }

  statData.物品系统.背包[itemName] = {
    ...itemData,
    数量: 1,
  };
}

function consumeOneBackpackEquipment(statData: any, itemKey: string) {
  const backpackItem = statData.物品系统.背包?.[itemKey];
  if (!backpackItem) return;

  const currentQuantity = Math.max(1, Number(backpackItem.数量 ?? 1) || 1);
  if (currentQuantity > 1) {
    backpackItem.数量 = currentQuantity - 1;
    return;
  }

  delete statData.物品系统.背包[itemKey];
}

async function usePermanentConsumable(itemKey: string, item: any) {
  if (item?.类型 !== '消耗品' || !hasPermanentConsumableEffect(itemKey, item)) {
    return;
  }

  try {
    await runLatestMvuTransaction('使用永久消耗品', async () => {
      const mvuData = await getLatestMvuData();
      const statData = mvuData?.stat_data;
      const currentItem = statData?.物品系统?.背包?.[itemKey];
      if (!mvuData || !statData || !currentItem || currentItem.类型 !== '消耗品') {
        return;
      }

      const parsedQuantity = Math.floor(Number(currentItem.数量 ?? 1));
      if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
        return;
      }
      const currentQuantity = parsedQuantity;
      const result = applyPermanentConsumableEffect(statData, itemKey, currentItem, 1);
      if (!result.changed) {
        return;
      }

      if (currentQuantity > 1) {
        currentItem.数量 = currentQuantity - 1;
      } else {
        delete statData.物品系统.背包[itemKey];
      }

      await replaceLatestMvuData(mvuData);
      if (typeof toastr !== 'undefined') {
        toastr.success(`${itemKey} 已使用，永久效果：${result.summary}`, '永久属性提升');
      }
      window.dispatchEvent(new CustomEvent('mvu-data-updated'));
    });
  } catch (error) {
    console.error('[背包界面] 使用永久消耗品失败:', error);
    if (typeof toastr !== 'undefined') {
      toastr.error('使用失败，请重试');
    }
  }
}

// 装备物品
async function equipItem(itemKey: string, item: any) {
  if (item.类型 !== '装备' || !item.部位) {
    return;
  }

  try {
    await runLatestMvuTransaction('装备物品', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData || !mvuData.stat_data) {
        console.error('[背包界面] 无法获取 MVU 数据');
        return;
      }

      const statData = mvuData.stat_data;

      // 确保物品系统结构存在
      if (!statData.物品系统) {
        statData.物品系统 = {};
      }

      // 确定装备槽位
      let slotKey = '';
      if (item.部位 === '主装备') {
        slotKey = '主装备';
      } else if (item.部位 === '副装备') {
        slotKey = '副装备';
      } else if (item.部位 === '饰品') {
        // 优先使用空的饰品槽位
        if (!statData.物品系统._装备栏?.饰品1?.名称) {
          slotKey = '饰品1';
        } else if (!statData.物品系统._装备栏?.饰品2?.名称) {
          slotKey = '饰品2';
        } else {
          slotKey = '饰品1'; // 默认替换第一个
        }
      } else if (item.部位 === '特殊装备') {
        slotKey = '特殊装备';
      } else {
        console.error('[背包界面] 未知的装备部位:', item.部位);
        return;
      }

      // 如果目标槽位已有装备，先卸下到背包
      const currentEquipped = statData.物品系统._装备栏?.[slotKey];
      if (currentEquipped?.名称) {
        // 将当前装备放回背包
        addEquipmentBackToBackpack(statData, currentEquipped.名称, {
          类型: '装备',
          等级: currentEquipped.等级 || 'C',
          加成属性: createFullBonusAttributes(currentEquipped.加成属性),
          部位: item.部位,
          描述: currentEquipped.描述 || '',
        });
      }

      // 从背包移除
      consumeOneBackpackEquipment(statData, itemKey);

      // 装备到槽位
      if (!statData.物品系统._装备栏) {
        statData.物品系统._装备栏 = {
          主装备: { 名称: '', 等级: 'C', 加成属性: createFullBonusAttributes({}), 描述: '' },
          副装备: { 名称: '', 等级: 'C', 加成属性: createFullBonusAttributes({}), 描述: '' },
          饰品1: { 名称: '', 等级: 'C', 加成属性: createFullBonusAttributes({}), 描述: '' },
          饰品2: { 名称: '', 等级: 'C', 加成属性: createFullBonusAttributes({}), 描述: '' },
          特殊装备: { 名称: '', 等级: 'C', 加成属性: createFullBonusAttributes({}), 描述: '' },
        };
      }

      statData.物品系统._装备栏[slotKey] = {
        名称: itemKey,
        等级: item.等级 || 'C',
        加成属性: createFullBonusAttributes(item.加成属性),
        描述: item.描述 || '',
      };

      // 更新 MVU
      await replaceLatestMvuData(mvuData);

      // 显示成功提示
      if (typeof toastr !== 'undefined') {
        toastr.success(`已装备 ${itemKey}`);
      }

      // 触发页面更新（通过父组件）
      window.dispatchEvent(new CustomEvent('mvu-data-updated'));
    });
  } catch (error) {
    console.error('[背包界面] 装备失败:', error);
    if (typeof toastr !== 'undefined') {
      toastr.error('装备失败，请重试');
    }
  }
}

async function discardItem(itemKey: string) {
  const ok = confirm(`确认售卖「${itemKey}」吗？每件固定 50 天海信用点`);
  if (!ok) return;

  try {
    await runLatestMvuTransaction('售卖物品', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData || !mvuData.stat_data) {
        console.error('[背包界面] 无法获取 MVU 数据');
        return;
      }

      const statData = mvuData.stat_data;
      if (!statData.物品系统?.背包 || !statData.物品系统.背包[itemKey]) {
        return;
      }

      // 扣除物品数量（优先按数量-1，数量不足则删除条目）
      const item = statData.物品系统.背包[itemKey];
      const currentQty = Number(item?.数量 ?? 1) || 1;
      if (currentQty > 1) {
        item.数量 = currentQty - 1;
      } else {
        delete statData.物品系统.背包[itemKey];
      }

      // 增加天海信用点（每件固定50）
      if (!statData.物品系统) statData.物品系统 = {};
      creditMoney(mvuData, 50, 'sales');

      await replaceLatestMvuData(mvuData);

      if (typeof toastr !== 'undefined') {
        toastr.success(`已售卖 ${itemKey}，获得 50 天海信用点`);
      }

      window.dispatchEvent(new CustomEvent('mvu-data-updated'));
    });
  } catch (error) {
    console.error('[背包界面] 丢弃失败:', error);
    if (typeof toastr !== 'undefined') {
      toastr.error('丢弃失败，请重试');
    }
  }
}

async function bulkSellFilteredItems() {
  if (bulkSellItemCount.value <= 0) return;

  const filteredKeys = Object.keys(filteredItems.value);
  if (filteredKeys.length <= 0) return;

  const ok = confirm(
    `确认批量售卖当前筛选结果吗？\n共 ${filteredKeys.length} 种、${bulkSellItemCount.value} 件，预计获得 ${bulkSellGoldGain.value} 天海信用点。`,
  );
  if (!ok) return;

  try {
    await runLatestMvuTransaction('批量售卖物品', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData || !mvuData.stat_data) {
        console.error('[背包界面] 无法获取 MVU 数据');
        return;
      }

      const statData = mvuData.stat_data;
      if (!statData.物品系统) statData.物品系统 = {};
      if (!statData.物品系统.背包) statData.物品系统.背包 = {};

      let soldTypes = 0;
      let soldCount = 0;
      for (const itemKey of filteredKeys) {
        const item = statData.物品系统.背包[itemKey];
        if (!item) continue;
        const quantity = Math.max(1, Number(item?.数量 ?? 1) || 1);
        soldTypes += 1;
        soldCount += quantity;
        delete statData.物品系统.背包[itemKey];
      }

      if (soldCount <= 0) {
        if (typeof toastr !== 'undefined') {
          toastr.info('当前筛选结果没有可售卖物品');
        }
        return;
      }

      const gainedCoins = soldCount * SELL_PRICE_PER_ITEM;
      creditMoney(mvuData, gainedCoins, 'sales');

      await replaceLatestMvuData(mvuData);

      if (typeof toastr !== 'undefined') {
        toastr.success(`已批量售卖 ${soldTypes} 种共 ${soldCount} 件，获得 ${gainedCoins} 天海信用点`);
      }

      window.dispatchEvent(new CustomEvent('mvu-data-updated'));
    });
  } catch (error) {
    console.error('[背包界面] 批量售卖失败:', error);
    if (typeof toastr !== 'undefined') {
      toastr.error('批量售卖失败，请重试');
    }
  }
}

// 卸下装备
async function unequipItem(slotKey: string) {
  try {
    console.log('[背包界面] 开始卸下装备，槽位:', slotKey);
    await runLatestMvuTransaction('卸下装备', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData || !mvuData.stat_data) {
        console.error('[背包界面] 无法获取 MVU 数据');
        return;
      }

      const statData = mvuData.stat_data;

      // 确保物品系统结构存在
      if (!statData.物品系统) {
        statData.物品系统 = {};
      }
      if (!statData.物品系统._装备栏) {
        console.error('[背包界面] 装备栏不存在');
        return;
      }

      const equippedItem = statData.物品系统._装备栏[slotKey];

      console.log('[背包界面] 当前装备:', equippedItem);

      if (!equippedItem || !equippedItem.名称) {
        console.warn('[背包界面] 该槽位没有装备');
        return;
      }

      // 添加到背包
      if (!statData.物品系统.背包) {
        statData.物品系统.背包 = {};
      }

      // 确定装备部位（用于背包中的装备）
      let itemSlot = '主装备';
      if (slotKey === '副装备') itemSlot = '副装备';
      else if (slotKey === '饰品1' || slotKey === '饰品2') itemSlot = '饰品';
      else if (slotKey === '特殊装备') itemSlot = '特殊装备';

      // 创建完整的背包物品对象
      const backpackItem = {
        类型: '装备' as const,
        等级: equippedItem.等级 || 'C',
        加成属性: createFullBonusAttributes(equippedItem.加成属性),
        部位: itemSlot,
        描述: equippedItem.描述 || '',
      };

      console.log('[背包界面] 添加到背包的物品:', backpackItem);

      addEquipmentBackToBackpack(statData, equippedItem.名称, backpackItem);

      // 清空装备槽位（使用完整的结构）
      statData.物品系统._装备栏[slotKey] = {
        名称: '',
        等级: 'C',
        加成属性: createFullBonusAttributes({}),
        描述: '',
      };

      console.log('[背包界面] 装备槽位已清空');

      // 更新 MVU
      await replaceLatestMvuData(mvuData);

      console.log('[背包界面] MVU 数据已更新');

      // 显示成功提示
      if (typeof toastr !== 'undefined') {
        toastr.success(`已卸下 ${equippedItem.名称}`);
      }

      // 触发页面更新
      window.dispatchEvent(new CustomEvent('mvu-data-updated'));
    });
  } catch (error) {
    console.error('[背包界面] 卸下失败:', error);
    console.error('[背包界面] 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
    if (typeof toastr !== 'undefined') {
      toastr.error('卸下失败，请重试');
    }
  }
}
</script>

<style scoped lang="scss">
.inventory-page {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  position: relative;
}

.coins-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.05));
  border-radius: 16px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  margin-bottom: 20px;

  .coins-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 24px;
      color: var(--sk-ink);
    }
  }

  .coins-info {
    display: flex;
    flex-direction: column;
  }

  .coins-label {
    font-size: 12px;
    color: var(--sk-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .coins-amount {
    font-size: 28px;
    font-weight: 700;
    color: var(--sk-warning);
    font-family: 'JetBrains Mono', monospace;
  }
}

.section-card {
  background: var(--sk-soft);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  margin-bottom: 16px;
}

.section-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-ink);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 14px;
    color: var(--sk-violet);
  }

  .item-count {
    margin-left: auto;
    font-size: 11px;
    color: var(--sk-muted);
    font-weight: 400;
  }
}

.section-header-top .section-title {
  margin-bottom: 0;
}

.bulk-sell-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.15);
  color: var(--sk-warning);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(251, 191, 36, 0.24);
    border-color: rgba(251, 191, 36, 0.5);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  i {
    font-size: 10px;
  }
}

.filter-tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 11px;
  color: var(--sk-muted);
  font-weight: 500;
  min-width: 40px;
}

.filter-btn {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--sk-muted);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--sk-soft);
    color: var(--sk-ink);
  }

  &.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: #667eea;
    color: var(--sk-ink);
  }
}

.equipment-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.equipment-slot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--sk-soft);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: var(--sk-soft);
  }

  &.empty {
    opacity: 0.5;
  }

  .slot-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 16px;
      color: var(--sk-violet);
    }
  }

  .slot-info {
    flex: 1;
    min-width: 0;
  }

  .slot-label {
    font-size: 10px;
    color: var(--sk-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .slot-value {
    font-size: 14px;
    color: var(--sk-ink);
    font-weight: 500;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .slot-level {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 6px;
    margin-top: 4px;
    display: inline-block;
    font-weight: 600;

    &.rarity-c {
      background: rgba(156, 163, 175, 0.2);
      color: var(--sk-muted);
    }

    &.rarity-b {
      background: rgba(96, 165, 250, 0.2);
      color: var(--sk-blue);
    }

    &.rarity-a {
      background: rgba(167, 139, 250, 0.2);
      color: var(--sk-violet);
    }

    &.rarity-s {
      background: rgba(251, 191, 36, 0.2);
      color: var(--sk-warning);
    }

    &.rarity-ss {
      background: rgba(248, 113, 113, 0.2);
      color: var(--sk-danger);
    }
  }

  .unequip-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(248, 113, 113, 0.2);
    border: 1px solid rgba(248, 113, 113, 0.3);
    color: var(--sk-danger);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: rgba(248, 113, 113, 0.3);
      transform: scale(1.1);
    }

    i {
      font-size: 12px;
    }
  }
}

.bonus-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.bonus-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--sk-soft);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.bonus-label {
  font-size: 12px;
  color: var(--sk-muted);
}

.bonus-value {
  font-size: 14px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;

  &.positive {
    color: var(--sk-success);
  }

  &.negative {
    color: var(--sk-danger);
  }

  &.neutral {
    color: var(--sk-muted);
  }
}

.inventory-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inventory-item {
  padding: 14px;
  background: var(--sk-soft);
  border-radius: 12px;
  border-left: 3px solid;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: var(--sk-soft);
    transform: translateX(4px);
  }

  &.rarity-c {
    border-left-color: #9ca3af;
  }

  &.rarity-b {
    border-left-color: #60a5fa;
  }

  &.rarity-a {
    border-left-color: #a78bfa;
  }

  &.rarity-s {
    border-left-color: #fbbf24;
  }

  &.rarity-ss {
    border-left-color: #f87171;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .item-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--sk-ink);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-badges {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
    margin-right: 22px;
  }

  .discard-btn {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: rgba(248, 113, 113, 0.9);
    border: 1px solid rgba(248, 113, 113, 0.9);
    color: var(--sk-ink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;

    &:hover {
      transform: scale(1.08);
      background: rgba(248, 113, 113, 1);
    }

    &:active {
      transform: scale(1);
    }

    i {
      font-size: 10px;
      line-height: 1;
    }
  }

  .item-level {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;

    &.rarity-c {
      background: rgba(156, 163, 175, 0.2);
      color: var(--sk-muted);
    }

    &.rarity-b {
      background: rgba(96, 165, 250, 0.2);
      color: var(--sk-blue);
    }

    &.rarity-a {
      background: rgba(167, 139, 250, 0.2);
      color: var(--sk-violet);
    }

    &.rarity-s {
      background: rgba(251, 191, 36, 0.2);
      color: var(--sk-warning);
    }

    &.rarity-ss {
      background: rgba(248, 113, 113, 0.2);
      color: var(--sk-danger);
    }
  }

  .item-count {
    font-size: 12px;
    color: var(--sk-muted);
    font-family: 'JetBrains Mono', monospace;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .item-type {
    font-size: 11px;
    color: var(--sk-muted);
  }

  .item-slot {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(102, 126, 234, 0.2);
    color: var(--sk-violet);
    font-weight: 500;
  }

  .item-desc {
    font-size: 12px;
    color: var(--sk-muted);
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .item-bonus-inline {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 10px;
    margin: 8px 0;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(12, 18, 30, 0.28);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .item-bonus-inline-row {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-size: 11px;
    color: var(--sk-muted);

    span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      flex-shrink: 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;

      &.positive {
        color: var(--sk-success);
      }

      &.negative {
        color: var(--sk-danger);
      }

      &.neutral {
        color: var(--sk-muted);
      }
    }
  }

  .item-permanent-inline {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 8px 0;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(52, 211, 153, 0.08);
    border: 1px solid rgba(52, 211, 153, 0.2);
    color: var(--sk-success);
    font-size: 11px;
    line-height: 1.45;

    i {
      flex-shrink: 0;
      margin-top: 1px;
      color: var(--sk-success);
    }
  }

  .equip-btn {
    margin-top: 8px;
    padding: 6px 12px;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    color: var(--sk-ink);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:active {
      transform: translateY(0);
    }

    i {
      font-size: 11px;
    }
  }

  .use-consumable-btn {
    margin-top: 8px;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(52, 211, 153, 0.18);
    border: 1px solid rgba(52, 211, 153, 0.4);
    color: var(--sk-success);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      background: rgba(52, 211, 153, 0.28);
      box-shadow: 0 4px 12px rgba(52, 211, 153, 0.18);
    }

    &:active {
      transform: translateY(0);
    }

    i {
      font-size: 11px;
    }
  }
}

.empty-state {
  padding: 40px 20px;
  text-align: center;

  i {
    font-size: 48px;
    color: var(--sk-muted);
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    color: var(--sk-muted);
    margin-bottom: 4px;
  }

  span {
    font-size: 12px;
    color: var(--sk-muted);
  }
}

@media (max-width: 768px) {
  .section-header-top {
    flex-direction: column;
    align-items: stretch;
  }

  .bulk-sell-btn {
    justify-content: center;
  }
}

.tooltip {
  position: absolute;
  z-index: 60;
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box;
  width: min(260px, calc(100vw - 16px));
  max-width: calc(100vw - 16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  pointer-events: none;

  .tooltip-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--sk-ink);
    margin-bottom: 6px;
  }

  .tooltip-level {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    margin-bottom: 8px;

    &.rarity-c {
      background: rgba(156, 163, 175, 0.2);
      color: var(--sk-muted);
    }

    &.rarity-b {
      background: rgba(96, 165, 250, 0.2);
      color: var(--sk-blue);
    }

    &.rarity-a {
      background: rgba(167, 139, 250, 0.2);
      color: var(--sk-violet);
    }

    &.rarity-s {
      background: rgba(251, 191, 36, 0.2);
      color: var(--sk-warning);
    }

    &.rarity-ss {
      background: rgba(248, 113, 113, 0.2);
      color: var(--sk-danger);
    }
  }

  .tooltip-bonuses {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  .tooltip-bonus-item {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--sk-ink);

    .positive {
      color: var(--sk-success);
      font-weight: 600;
    }

    .negative {
      color: var(--sk-danger);
      font-weight: 600;
    }
  }

  .tooltip-desc {
    font-size: 11px;
    color: var(--sk-muted);
    line-height: 1.4;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>
