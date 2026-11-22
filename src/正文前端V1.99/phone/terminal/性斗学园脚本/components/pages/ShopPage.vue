<template>
  <slot
    v-if="$slots.storefront"
    name="storefront"
    :catalog="storefrontCatalog"
    :selected-item="selectedItem"
    :quantity="purchaseQuantity"
    :busy="isPurchasing"
    :select-item="selectItem"
    :set-quantity="(value: number) => (purchaseQuantity = value)"
    :purchase="purchaseItem"
    :price-for="getDiscountedPrice"
  />
  <div v-else class="shop-page">
    <SkylinkModuleHeader
      code="09"
      label="SUPPLY EXCHANGE"
      title="学园补给站"
      description="为下一场挑战，寻找合适的补给。"
      icon="fas fa-box-open"
    />
    <!-- 天海信用点显示 -->
    <div class="shop-header">
      <div class="gold-card">
        <i class="fas fa-coins"></i>
        <div class="gold-info">
          <span class="gold-label">天海信用点</span>
          <span class="gold-value">{{ goldCoins }}</span>
        </div>
        <button
          v-if="!isSpecialBattleUnlocked"
          class="special-battle-unlock"
          type="button"
          @click="unlockSpecialBattle"
        ></button>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="category-tab"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        <i :class="cat.icon"></i>
        <span>{{ cat.name }}</span>
      </button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar" v-if="activeCategory === 'equipment'">
      <div class="filter-group">
        <span class="filter-label">等级:</span>
        <div class="filter-options">
          <button
            v-for="grade in gradeFilters"
            :key="grade"
            class="filter-btn"
            :class="{ active: selectedGrade === grade, ['grade-' + grade.toLowerCase()]: true }"
            @click="selectedGrade = selectedGrade === grade ? '' : grade"
          >
            {{ grade }}
          </button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">部位:</span>
        <div class="filter-options">
          <button
            v-for="slot in slotFilters"
            :key="slot"
            class="filter-btn slot-btn"
            :class="{ active: selectedSlot === slot }"
            @click="selectedSlot = selectedSlot === slot ? '' : slot"
          >
            {{ slot }}
          </button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">性别:</span>
        <div class="filter-options">
          <button
            v-for="gender in genderFilters"
            :key="gender"
            class="filter-btn gender-btn"
            :class="{ active: selectedGender === gender }"
            @click="selectedGender = selectedGender === gender ? '' : gender"
          >
            {{ gender }}
          </button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">属性偏好:</span>
        <div class="filter-options">
          <button
            v-for="attr in attrFilters"
            :key="attr"
            class="filter-btn attr-btn"
            :class="{ active: selectedAttr === attr }"
            @click="selectedAttr = selectedAttr === attr ? '' : attr"
          >
            {{ attr }}
          </button>
        </div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div v-if="!selectedItem && !(fetishDecisionModalVisible && pendingFetishDecision)" class="shop-content">
      <!-- 装备类 -->
      <div v-if="activeCategory === 'equipment'" class="item-section">
        <div class="item-grid">
          <div
            v-for="item in filteredEquipments"
            :key="item.name"
            class="shop-item"
            :class="'grade-' + item.grade.toLowerCase()"
            @click="selectItem(item)"
          >
            <div class="item-icon">
              <i :class="item.icon"></i>
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <div class="item-meta">
                <span class="item-grade" :class="'grade-' + item.grade.toLowerCase()">{{ item.grade }}</span>
                <span class="item-type">{{ item.slot }}</span>
              </div>
            </div>
            <div class="item-price">
              <i class="fas fa-coins"></i>
              <template v-if="getItemDiscount(item) > 0">
                <span class="original-price">{{ item.price }}</span>
                <span class="discounted-price">{{ getDiscountedPrice(item) }}</span>
              </template>
              <template v-else>
                {{ item.price }}
              </template>
            </div>
          </div>
        </div>
        <div v-if="filteredEquipments.length === 0" class="empty-filter">
          <i class="fas fa-filter-circle-xmark"></i>
          <span>没有符合筛选条件的装备</span>
        </div>
      </div>

      <!-- 消耗品 -->
      <div v-if="activeCategory === 'consumables'" class="item-section">
        <div class="sub-category" v-for="subCat in visibleConsumableSubCategories" :key="subCat.type">
          <h4 class="sub-title consumable-title">
            <i :class="subCat.icon"></i>
            {{ subCat.name }}
          </h4>
          <div class="item-grid">
            <div
              v-for="item in subCat.items"
              :key="item.id"
              class="shop-item consumable-item"
              :class="{ 'combat-only': item.combatOnly }"
              @click="selectItem(item)"
            >
              <div class="item-icon">
                <i :class="item.icon"></i>
              </div>
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-effect">{{ item.effectText }}</span>
              </div>
              <div class="item-price">
                <i class="fas fa-coins"></i>
                <template v-if="getItemDiscount(item) > 0">
                  <span class="original-price">{{ item.price }}</span>
                  <span class="discounted-price">{{ getDiscountedPrice(item) }}</span>
                </template>
                <template v-else>
                  {{ item.price }}
                </template>
              </div>
              <span v-if="item.combatOnly" class="combat-tag">战斗用</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 转盘 -->
      <div v-if="activeCategory === 'wheel'" class="wheel-section">
        <div class="wheel-type-tabs">
          <button
            v-for="wheel in wheelTypes"
            :key="wheel.id"
            class="wheel-type-btn"
            :class="{ active: activeWheelType === wheel.id }"
            @click="activeWheelType = wheel.id"
          >
            <i :class="wheel.icon"></i>
            <span>{{ wheel.name }}</span>
          </button>
        </div>

        <div class="wheel-cost-bar">
          <div class="wheel-cost-main">
            <span class="wheel-name">{{ currentWheelConfig.name }}</span>
            <span class="wheel-cost">单抽 {{ singleDrawCostLabel }} / 十连 {{ tenDrawCostLabel }}</span>
          </div>
          <div class="wheel-cost-extra">
            <span>幸运稀有倍率 x{{ luckyRareMultiplier.toFixed(2) }}</span>
            <span v-if="currentWheelConfig.currency === 'ticket'">抽奖卷 {{ totalLotteryTickets }}</span>
          </div>
        </div>

        <div class="wheel-stage">
          <div class="wheel-pointer">
            <i class="fas fa-caret-down"></i>
          </div>
          <div class="wheel-disc" :style="wheelDiscStyle">
            <svg class="wheel-svg" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <radialGradient id="wheelSurfaceLight" cx="34%" cy="28%" r="68%">
                  <stop offset="0%" stop-color="rgba(255,255,255,0.22)" />
                  <stop offset="46%" stop-color="rgba(255,255,255,0.06)" />
                  <stop offset="100%" stop-color="rgba(0,0,0,0.16)" />
                </radialGradient>
              </defs>
              <path
                v-for="segment in wheelSegmentPaths"
                :key="segment.id"
                class="wheel-segment-path"
                :class="{ rare: segment.rare }"
                :d="segment.d"
                :fill="segment.color"
              />
              <line
                v-for="line in wheelSeparatorLines"
                :key="line.id"
                class="wheel-separator-line"
                x1="100"
                y1="100"
                :x2="line.x"
                :y2="line.y"
              />
              <circle class="wheel-surface-light" cx="100" cy="100" r="95" fill="url(#wheelSurfaceLight)" />
              <circle class="wheel-outer-ring" cx="100" cy="100" r="96" />
              <circle class="wheel-inner-ring" cx="100" cy="100" r="31" />
            </svg>
            <div
              v-for="(segment, index) in currentWheelConfig.segments"
              :key="segment.id"
              class="wheel-segment-label"
              :class="{ rare: segment.rare }"
              :style="getWheelSegmentLabelStyle(index, currentWheelConfig.segments.length)"
            >
              {{ segment.label }}
            </div>
          </div>
          <div class="wheel-center">
            <i :class="currentWheelConfig.icon"></i>
          </div>
          <div v-if="wheelSssEffect" class="wheel-sss-burst" aria-live="polite">
            <div class="wheel-sss-ring"></div>
            <i class="fas fa-crown"></i>
            <span class="wheel-sss-title">{{ wheelSssEffect.title }}</span>
            <span class="wheel-sss-name">{{ wheelSssEffect.itemText }}</span>
          </div>
        </div>

        <div class="wheel-action-row">
          <button class="wheel-draw-btn" :disabled="!canDrawSingle" @click="drawWheel(1)">
            <span>单抽</span>
            <small>{{ singleDrawCostLabel }}</small>
          </button>
          <button class="wheel-draw-btn ten" :disabled="!canDrawTen" @click="drawWheel(10)">
            <span>十连</span>
            <small>{{ tenDrawCostLabel }}</small>
          </button>
        </div>

        <div class="wheel-last-result" v-if="wheelLastResultText">
          <i class="fas fa-gift"></i>
          <span>{{ wheelLastResultText }}</span>
        </div>

        <div class="wheel-prob-panel">
          <div class="wheel-prob-header">实时概率（已计入幸运）</div>
          <div class="wheel-prob-grid">
            <div
              v-for="row in wheelProbabilityRows"
              :key="row.segment.id"
              class="wheel-prob-item"
              :class="{ rare: row.segment.rare }"
            >
              <span class="prob-name">{{ row.segment.label }}</span>
              <span class="prob-value">{{ row.probabilityText }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 性癖奖励选择弹窗 -->

    <div v-else-if="fetishDecisionModalVisible && pendingFetishDecision" class="shop-detail-view">
      <div class="detail-page-header fetish-detail-header">
        <div class="detail-title-block">
          <span class="detail-page-title">性癖奖励</span>
          <span class="detail-page-subtitle">转盘抽取结果</span>
        </div>
      </div>

      <div class="modal-content shop-detail-card fetish-detail-card">
        <div class="modal-header">
          <h3>{{ pendingFetishDecision.name }}</h3>
          <span class="modal-character">{{ pendingFetishAlignmentLabel }}</span>
        </div>
        <div class="modal-body shop-detail-body">
          <div class="fetish-name-row">
            <span class="fetish-name">{{ pendingFetishDecision.name }}</span>
            <span
              class="fetish-align-tag"
              :class="pendingFetishDecision.alignment ? 'align-' + pendingFetishDecision.alignment.toLowerCase() : ''"
            >
              {{ pendingFetishAlignmentLabel }}
            </span>
          </div>
          <div class="fetish-desc">
            {{ pendingFetishDecision.description }}
          </div>
          <div class="item-details">
            <div class="detail-title">永久加成</div>
            <div class="bonus-list">
              <div v-for="row in pendingFetishBonusRows" :key="row.key" class="bonus-item">
                <span class="bonus-name">{{ row.key }}</span>
                <span class="bonus-value" :class="row.value > 0 ? 'positive' : 'negative'">
                  {{ row.value > 0 ? '+' : '' }}{{ row.value }}
                </span>
              </div>
            </div>
          </div>
          <div class="fetish-reroll-tip">重抽不会消耗额外次数，你可以反复重抽，直到决定保留或舍弃。</div>
        </div>
        <div class="modal-footer shop-detail-footer fetish-footer">
          <button class="cancel-btn" @click="handleFetishDecision('discard')">舍弃</button>
          <button class="reroll-btn" @click="handleFetishDecision('reroll')">重抽</button>
          <button class="confirm-btn" @click="handleFetishDecision('keep')">保留</button>
        </div>
      </div>
    </div>

    <div v-else-if="selectedItem" class="shop-detail-view">
      <div class="detail-page-header">
        <button class="detail-back-btn" @click="selectedItem = null">
          <i class="fas fa-arrow-left"></i>
          <span>返回商店</span>
        </button>
      </div>

      <div class="modal-content shop-detail-card">
        <div class="modal-header">
          <h3>确认购买</h3>
        </div>
        <div class="modal-body shop-detail-body">
          <div class="selected-item-preview detail-preview">
            <div class="preview-icon" :class="selectedItem ? getItemGradeClass(selectedItem) : ''">
              <i :class="selectedItem?.icon"></i>
            </div>
            <div class="preview-info">
              <span class="preview-name">{{ selectedItem?.name }}</span>
              <span class="preview-desc">{{ selectedItem?.description }}</span>
            </div>
          </div>

          <div class="item-details" v-if="selectedItem?.bonuses">
            <div class="detail-title">属性加成</div>
            <div class="bonus-list">
              <div v-for="(value, key) in selectedItem?.bonuses" :key="key" class="bonus-item">
                <span class="bonus-name">{{ key }}</span>
                <span class="bonus-value" :class="value > 0 ? 'positive' : 'negative'">
                  {{ value > 0 ? '+' : '' }}{{ value }}
                </span>
              </div>
            </div>
          </div>

          <div class="quantity-selector" v-if="selectedItem?.category !== 'equipment'">
            <span class="qty-label">数量:</span>
            <div class="quantity-control">
              <button
                class="qty-btn"
                :disabled="isGoldInsufficient"
                @click="purchaseQuantity = Math.max(1, purchaseQuantity - 1)"
              >
                -
              </button>
              <input
                v-model.number="purchaseQuantity"
                type="number"
                min="1"
                :max="maxPurchaseQuantity || 1"
                :disabled="isGoldInsufficient"
                @blur="validatePurchaseQuantity"
              />
              <button
                class="qty-btn"
                :disabled="isGoldInsufficient || purchaseQuantity >= maxPurchaseQuantity"
                @click="purchaseQuantity = Math.min(maxPurchaseQuantity, purchaseQuantity + 1)"
              >
                +
              </button>
            </div>
            <span class="max-hint" :class="{ insufficient: isGoldInsufficient }">
              {{ isGoldInsufficient ? '天海信用点不足' : '最多可购买 ' + maxPurchaseQuantity + ' 个' }}
            </span>
          </div>

          <div class="price-summary detail-price-summary">
            <span>总价:</span>
            <span class="total-price">
              <i class="fas fa-coins"></i>
              <template v-if="selectedItem && getItemDiscount(selectedItem) > 0">
                <span class="original-price">{{ (selectedItem?.price || 0) * purchaseQuantity }}</span>
                <span class="discounted-price">{{
                  selectedItem ? getDiscountedPrice(selectedItem) * purchaseQuantity : 0
                }}</span>
                <span class="discount-tag">-{{ selectedItem ? getItemDiscount(selectedItem) : 0 }}%</span>
              </template>
              <template v-else>
                {{ (selectedItem?.price || 0) * purchaseQuantity }}
              </template>
            </span>
          </div>
        </div>
        <div class="modal-footer shop-detail-footer">
          <button class="cancel-btn" :disabled="isPurchasing" @click="selectedItem = null">取消</button>
          <button
            class="confirm-btn"
            :disabled="isPurchasing || !selectedItem || goldCoins < getDiscountedPrice(selectedItem) * purchaseQuantity"
            @click="purchaseItem"
          >
            <i class="fas fa-shopping-cart"></i>
            购买
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkylinkModuleHeader from '../../../shared/SkylinkModuleHeader.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  isSpecialBattleUnlocked as getSpecialBattleUnlocked,
  saveSpecialBattleUnlocked,
} from '../../../shared/localPreferences';
import { getCombatConsumableEffects } from '../../../shared/combatConsumables';
import { addPermanentNumericBonuses } from '../../../shared/permanentNumericBonuses';
import { getLatestMvuData, replaceLatestMvuData, runLatestMvuTransaction } from '../../../shared/mvuStore';
import { creditMoney, debitMoney } from '../../../../../money/ledger';
import { grantExperience } from '../../../shared/experience';
import { getPlayerDerivedStats } from '../../../shared/statSelectors';
import { GRAND_WHEEL_SSS_EQUIPMENT_ITEMS } from '../../../shared/legendaryEquipment';
import { grandWheelFetishPool, type FetishEntry } from '../../data/fetishPool';
import { getDailyTalentEffect } from '../../data/talentDatabase';

const props = defineProps<{
  characterData: any;
}>();

type ShopCategory = 'equipment' | 'consumables' | 'wheel';
type WheelType = 'basic' | 'advanced' | 'grand';
type WheelCurrency = 'gold' | 'ticket';
type WheelSegmentId =
  | 'basic_exp'
  | 'basic_gold'
  | 'basic_recovery'
  | 'basic_temp'
  | 'basic_exp_rare'
  | 'basic_gold_rare'
  | 'advanced_a_equipment'
  | 'advanced_s_equipment'
  | 'advanced_bonus'
  | 'advanced_gold'
  | 'advanced_skill'
  | 'advanced_ticket'
  | 'grand_s_equipment'
  | 'grand_ss_equipment'
  | 'grand_sss_equipment'
  | 'grand_attr'
  | 'grand_potential'
  | 'grand_fetish';

interface WheelSegment {
  id: WheelSegmentId;
  label: string;
  color: string;
  weight: number;
  rare?: boolean;
  rewardDesc: string;
}

interface WheelConfig {
  id: WheelType;
  name: string;
  icon: string;
  currency: WheelCurrency;
  singleCost: number;
  tenCost: number;
  segments: WheelSegment[];
}

interface ShopCategoryItem {
  id: ShopCategory;
  name: string;
  icon: string;
}

interface WheelProbabilityRow {
  segment: WheelSegment;
  probability: number;
  probabilityText: string;
}

interface WheelRewardResult {
  text: string;
  pendingFetish?: FetishEntry;
  specialEffect?: 'sssEquipment';
  itemName?: string;
}

interface WheelSssEffectState {
  title: string;
  itemText: string;
}

type FetishDecision = 'keep' | 'reroll' | 'discard';
type BonusKey =
  | '魅力加成'
  | '幸运加成'
  | '基础性斗力加成'
  | '基础性斗力成算'
  | '基础忍耐力加成'
  | '基础忍耐力成算'
  | '闪避率加成'
  | '暴击率加成';

const RARE_WEIGHT_FACTOR = 0.5;
const GRAND_WHEEL_SSS_BASE_WEIGHT = 3.285714285714286;
const BONUS_KEYS: BonusKey[] = [
  '魅力加成',
  '幸运加成',
  '基础性斗力加成',
  '基础性斗力成算',
  '基础忍耐力加成',
  '基础忍耐力成算',
  '闪避率加成',
  '暴击率加成',
];

function createEmptyBonusStats(): Record<BonusKey, number> {
  return Object.fromEntries(BONUS_KEYS.map(key => [key, 0])) as Record<BonusKey, number>;
}

function normalizeBonusStats(input: Record<string, any> | undefined | null): Partial<Record<BonusKey, number>> {
  const bonus: Partial<Record<BonusKey, number>> = {};
  for (const key of BONUS_KEYS) {
    const value = Number(input?.[key] ?? 0);
    if (Number.isFinite(value) && value !== 0) bonus[key] = value;
  }
  return bonus;
}

function ensurePermanentStatusContainer(statData: any): Record<string, any> {
  if (!statData.永久状态) statData.永久状态 = {};
  if (!statData.永久状态.状态列表 || Array.isArray(statData.永久状态.状态列表)) {
    statData.永久状态.状态列表 = {};
  }
  return statData.永久状态.状态列表;
}

// 获取当前天赋ID
const currentTalentId = computed(() => {
  const talents = props.characterData.技能系统?.$天赋;
  if (!talents || Object.keys(talents).length === 0) return undefined;
  // 返回第一个天赋的ID（玩家只能拥有一个天赋）
  return Object.keys(talents)[0];
});

// 计算商店折扣
function getItemDiscount(item: any): number {
  // 固定促销价（salePrice）视为有折扣
  if (item.salePrice != null && item.price > 0) {
    return Math.max(0, Math.min(99, Math.round(((item.price - item.salePrice) / item.price) * 100)));
  }

  const talentId = currentTalentId.value;
  if (!talentId) return 0;

  let discount = 0;

  // 全局折扣
  discount += getDailyTalentEffect(talentId, 'shop_discount_all');

  // 回复类折扣
  if (item.category === 'consumable' && (item.effect?.staminaRestore || item.effect?.pleasureReduce)) {
    discount += getDailyTalentEffect(talentId, 'shop_discount_recovery');
  }

  // 装备折扣
  if (item.category === 'equipment') {
    discount += getDailyTalentEffect(talentId, 'shop_discount_equipment');
  }

  // 永久提升类折扣
  if (item.category === 'consumable' && (item.effect?.permanent || item.effect?.permanentBonus)) {
    discount += getDailyTalentEffect(talentId, 'shop_discount_permanent');
  }

  return Math.min(discount, 50); // 最大50%折扣
}

// 获取折扣后价格
function getDiscountedPrice(item: any): number {
  // 固定促销价优先
  if (item.salePrice != null) return item.salePrice;
  const discount = getItemDiscount(item);
  return Math.floor((item.price * (100 - discount)) / 100);
}

// 天海信用点
const goldCoins = computed(() => {
  return props.characterData.物品系统?._天海信用点 || 0;
});

// 当前分类
const activeCategory = ref<ShopCategory>('equipment');

// 选中的物品
const selectedItem = ref<any>(null);
const purchaseQuantity = ref(1);

type ShopModalDragTarget = 'purchase' | 'fetish';

const purchaseModalContentRef = ref<HTMLElement | null>(null);
const fetishModalContentRef = ref<HTMLElement | null>(null);

const purchaseModalOffset = ref({ x: 0, y: 0 });
const fetishModalOffset = ref({ x: 0, y: 0 });

const purchaseModalZIndex = ref(1);
const fetishModalZIndex = ref(1);

type ShopDragMode = 'none' | 'pointer' | 'mouse' | 'touch';
const activeDragTarget = ref<ShopModalDragTarget | null>(null);
const activeDragMode = ref<ShopDragMode>('none');
const activeDragPointerId = ref<number | null>(null);
const activeDragTouchId = ref<number | null>(null);
const dragStartPoint = ref({ x: 0, y: 0 });
const dragCaptureElement = ref<HTMLElement | null>(null);

const purchaseModalStyle = computed(() => ({
  transform: `translate(${purchaseModalOffset.value.x}px, ${purchaseModalOffset.value.y}px)`,
  zIndex: purchaseModalZIndex.value,
}));

const fetishModalStyle = computed(() => ({
  transform: `translate(${fetishModalOffset.value.x}px, ${fetishModalOffset.value.y}px)`,
  zIndex: fetishModalZIndex.value,
}));

function getNextModalLayer(): number {
  const globalAny = window as any;
  const key = '__fatria_modal_layer';
  const next = Math.max(Number(globalAny[key] || 120000), 120000) + 1;
  globalAny[key] = next;
  return next;
}

function bringPurchaseModalToFront() {
  purchaseModalZIndex.value = getNextModalLayer();
}

function bringFetishModalToFront() {
  fetishModalZIndex.value = getNextModalLayer();
}

function getDragOffset(target: ShopModalDragTarget) {
  return target === 'purchase' ? purchaseModalOffset.value : fetishModalOffset.value;
}

function setDragOffset(target: ShopModalDragTarget, x: number, y: number) {
  if (target === 'purchase') {
    purchaseModalOffset.value = { x, y };
  } else {
    fetishModalOffset.value = { x, y };
  }
}

function getModalElement(target: ShopModalDragTarget): HTMLElement | null {
  return target === 'purchase' ? purchaseModalContentRef.value : fetishModalContentRef.value;
}

function clampOffsetToViewport(x: number, y: number, modalEl: HTMLElement): { x: number; y: number } {
  const rect = modalEl.getBoundingClientRect();
  const minVisible = 56;
  const viewport = modalEl.ownerDocument.defaultView!;
  const viewportWidth = viewport.innerWidth;
  const viewportHeight = viewport.innerHeight;

  const minX = -(viewportWidth + rect.width) / 2 + minVisible;
  const maxX = (viewportWidth + rect.width) / 2 - minVisible;
  const minY = -(viewportHeight + rect.height) / 2 + minVisible;
  const maxY = (viewportHeight + rect.height) / 2 - minVisible;

  const clampedX = Math.min(maxX, Math.max(minX, x));
  const clampedY = Math.min(maxY, Math.max(minY, y));
  return { x: clampedX, y: clampedY };
}

function getTouchFromList(touchList: TouchList, id: number | null): Touch | null {
  if (touchList.length <= 0) return null;
  if (id === null) return touchList[0];
  for (let i = 0; i < touchList.length; i++) {
    if (touchList[i].identifier === id) return touchList[i];
  }
  return null;
}

function isPointerEvent(event: Event): event is PointerEvent {
  return 'pointerId' in (event as PointerEvent);
}

function isTouchEvent(event: Event): event is TouchEvent {
  return 'touches' in (event as TouchEvent) || 'changedTouches' in (event as TouchEvent);
}

function getDragPoint(event: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } | null {
  if (isTouchEvent(event)) {
    const activeTouch =
      getTouchFromList(event.touches, activeDragTouchId.value) ??
      getTouchFromList(event.changedTouches, activeDragTouchId.value);
    if (!activeTouch) return null;
    return { x: activeTouch.clientX, y: activeTouch.clientY };
  }

  if ('clientX' in event && 'clientY' in event) {
    return { x: event.clientX, y: event.clientY };
  }

  return null;
}

function startModalDrag(target: ShopModalDragTarget, event: MouseEvent | TouchEvent | PointerEvent) {
  if (activeDragMode.value !== 'none') {
    stopModalDrag();
  }
  if (!isTouchEvent(event) && 'button' in event && event.button !== 0) return;

  const rawTarget = event.target;
  const targetEl =
    (rawTarget as Node | null)?.nodeType === 1 ? (rawTarget as Element) : (rawTarget as Node | null)?.parentElement;
  if (targetEl?.closest('button, input, textarea, select, a, label')) return;

  const modalEl = getModalElement(target);
  if (!modalEl) return;

  if (target === 'purchase') {
    bringPurchaseModalToFront();
  } else {
    bringFetishModalToFront();
  }

  const point = getDragPoint(event);
  if (!point) return;

  const offset = getDragOffset(target);
  activeDragTarget.value = target;
  dragStartPoint.value = {
    x: point.x - offset.x,
    y: point.y - offset.y,
  };

  if (isPointerEvent(event)) {
    activeDragMode.value = 'pointer';
    activeDragPointerId.value = event.pointerId;
    const captureEl = event.currentTarget as HTMLElement | null;
    if (captureEl?.setPointerCapture) {
      captureEl.setPointerCapture(event.pointerId);
      dragCaptureElement.value = captureEl;
    }
  } else if (isTouchEvent(event)) {
    activeDragMode.value = 'touch';
    activeDragTouchId.value = event.changedTouches[0]?.identifier ?? event.touches[0]?.identifier ?? null;
  } else {
    activeDragMode.value = 'mouse';
  }

  if (event.cancelable) event.preventDefault();
}

function startPurchaseModalDrag(event: MouseEvent | TouchEvent | PointerEvent) {
  startModalDrag('purchase', event);
}

function startFetishModalDrag(event: MouseEvent | TouchEvent | PointerEvent) {
  startModalDrag('fetish', event);
}

function handleModalDragMove(event: MouseEvent | TouchEvent | PointerEvent) {
  if (!activeDragTarget.value || activeDragMode.value === 'none') return;
  if (activeDragMode.value === 'pointer') {
    if (isTouchEvent(event)) {
      activeDragMode.value = 'touch';
      activeDragTouchId.value = event.changedTouches[0]?.identifier ?? event.touches[0]?.identifier ?? null;
    } else if (!isPointerEvent(event) || event.pointerId !== activeDragPointerId.value) {
      return;
    }
  } else if (activeDragMode.value === 'touch') {
    if (!isTouchEvent(event)) return;
  } else if (activeDragMode.value === 'mouse') {
    if (isTouchEvent(event)) {
      activeDragMode.value = 'touch';
      activeDragTouchId.value = event.changedTouches[0]?.identifier ?? event.touches[0]?.identifier ?? null;
    } else if (isPointerEvent(event)) {
      activeDragMode.value = 'pointer';
      activeDragPointerId.value = event.pointerId;
    }
  }

  const target = activeDragTarget.value;
  const modalEl = getModalElement(target);
  if (!modalEl) return;

  const point = getDragPoint(event);
  if (!point) return;

  const nextX = point.x - dragStartPoint.value.x;
  const nextY = point.y - dragStartPoint.value.y;
  const clamped = clampOffsetToViewport(nextX, nextY, modalEl);
  setDragOffset(target, clamped.x, clamped.y);

  if (event.cancelable) event.preventDefault();
}

function stopModalDrag(event?: MouseEvent | TouchEvent | PointerEvent) {
  if (activeDragMode.value === 'pointer' && event && isPointerEvent(event)) {
    if (activeDragPointerId.value !== null && event.pointerId !== activeDragPointerId.value) return;
  }
  if (
    dragCaptureElement.value &&
    activeDragPointerId.value !== null &&
    dragCaptureElement.value.releasePointerCapture
  ) {
    dragCaptureElement.value.releasePointerCapture(activeDragPointerId.value);
  }
  dragCaptureElement.value = null;
  activeDragMode.value = 'none';
  activeDragTarget.value = null;
  activeDragPointerId.value = null;
  activeDragTouchId.value = null;
}

function clampStoredModalOffsets() {
  if (purchaseModalContentRef.value) {
    const clamped = clampOffsetToViewport(
      purchaseModalOffset.value.x,
      purchaseModalOffset.value.y,
      purchaseModalContentRef.value,
    );
    purchaseModalOffset.value = clamped;
  }
  if (fetishModalContentRef.value) {
    const clamped = clampOffsetToViewport(
      fetishModalOffset.value.x,
      fetishModalOffset.value.y,
      fetishModalContentRef.value,
    );
    fetishModalOffset.value = clamped;
  }
}

// 计算最大可购买数量（基于天海信用点）
const maxPurchaseQuantity = computed(() => {
  if (!selectedItem.value) return 99;
  const unitPrice = getDiscountedPrice(selectedItem.value);
  if (unitPrice <= 0) return 99;
  const maxByGold = Math.floor(goldCoins.value / unitPrice);
  return Math.min(99, Math.max(0, maxByGold));
});

// 是否天海信用点不足
const isGoldInsufficient = computed(() => {
  if (!selectedItem.value) return false;
  const unitPrice = getDiscountedPrice(selectedItem.value);
  return goldCoins.value < unitPrice;
});

// 验证购买数量
function validatePurchaseQuantity() {
  if (!purchaseQuantity.value || purchaseQuantity.value < 1) {
    purchaseQuantity.value = 1;
  } else if (purchaseQuantity.value > maxPurchaseQuantity.value) {
    purchaseQuantity.value = maxPurchaseQuantity.value;
  }
  purchaseQuantity.value = Math.floor(purchaseQuantity.value);
}

const isSpecialBattleUnlocked = ref(false);
const shopHostWindow = window.parent;

onMounted(() => {
  isSpecialBattleUnlocked.value = getSpecialBattleUnlocked();
  shopHostWindow.addEventListener('pointermove', handleModalDragMove);
  shopHostWindow.addEventListener('pointerup', stopModalDrag);
  shopHostWindow.addEventListener('pointercancel', stopModalDrag);
  shopHostWindow.addEventListener('mousemove', handleModalDragMove);
  shopHostWindow.addEventListener('mouseup', stopModalDrag);
  shopHostWindow.addEventListener('touchmove', handleModalDragMove, { passive: false });
  shopHostWindow.addEventListener('touchend', stopModalDrag);
  shopHostWindow.addEventListener('touchcancel', stopModalDrag);
  shopHostWindow.addEventListener('resize', clampStoredModalOffsets);
});

onUnmounted(() => {
  shopHostWindow.removeEventListener('pointermove', handleModalDragMove);
  shopHostWindow.removeEventListener('pointerup', stopModalDrag);
  shopHostWindow.removeEventListener('pointercancel', stopModalDrag);
  shopHostWindow.removeEventListener('mousemove', handleModalDragMove);
  shopHostWindow.removeEventListener('mouseup', stopModalDrag);
  shopHostWindow.removeEventListener('touchmove', handleModalDragMove);
  shopHostWindow.removeEventListener('touchend', stopModalDrag);
  shopHostWindow.removeEventListener('touchcancel', stopModalDrag);
  shopHostWindow.removeEventListener('resize', clampStoredModalOffsets);
  clearWheelSssEffectTimer();
});

function unlockSpecialBattle() {
  isSpecialBattleUnlocked.value = true;
  saveSpecialBattleUnlocked();
}

// 分类列表（移除礼物）
const categories: ShopCategoryItem[] = [
  { id: 'equipment', name: '装备', icon: 'fas fa-shield-halved' },
  { id: 'consumables', name: '消耗品', icon: 'fas fa-flask' },
  { id: 'wheel', name: '转盘', icon: 'fas fa-compact-disc' },
];

// 筛选状态
const selectedGrade = ref('');
const selectedSlot = ref('');
const selectedGender = ref('');
const selectedAttr = ref('');
const gradeFilters = ['C', 'B', 'A', 'S', 'SS'];
const slotFilters = ['主装备', '副装备', '饰品', '特殊装备'];
const genderFilters = ['男', '女'];
const attrFilters = ['性斗力', '忍耐力', '魅力', '幸运', '特殊'];

// 所有装备列表（扁平化，突出性斗主题）
const allEquipments = [
  // C级装备（保持原有+增加一件饰品）
  {
    name: '情趣校服',
    slot: '主装备',
    icon: 'fas fa-shirt',
    price: 500,
    category: 'equipment',
    grade: 'C',
    gender: '女',
    attrFocus: '忍耐力',
    description: '经过特殊改良的校服，增加身体敏感度防护',
    bonuses: { 基础忍耐力加成: 5, 闪避率加成: 2 },
  },
  {
    name: '诱惑香囊',
    slot: '饰品',
    icon: 'fas fa-heart',
    price: 600,
    category: 'equipment',
    grade: 'C',
    gender: '女',
    attrFocus: '魅力',
    description: '散发迷人香气的小香囊',
    bonuses: { 魅力加成: 4, 幸运加成: 2 },
  },
  {
    name: '柔软皮鞭',
    slot: '副装备',
    icon: 'fas fa-fire',
    price: 800,
    category: 'equipment',
    grade: 'C',
    gender: '女',
    attrFocus: '性斗力',
    description: '入门级调教道具',
    bonuses: { 基础性斗力加成: 6, 暴击率加成: 2 },
  },
  {
    name: '丝绸手套',
    slot: '特殊装备',
    icon: 'fas fa-hand',
    price: 550,
    category: 'equipment',
    grade: 'C',
    gender: '女',
    attrFocus: '魅力',
    description: '触感极佳的丝绸手套',
    bonuses: { 基础性斗力加成: 3, 魅力加成: 3 },
  },
  {
    name: '蕾丝眼罩',
    slot: '饰品',
    icon: 'fas fa-eye-slash',
    price: 450,
    category: 'equipment',
    grade: 'C',
    gender: '女',
    attrFocus: '幸运',
    description: '增加神秘感的蕾丝眼罩',
    bonuses: { 闪避率加成: 3, 幸运加成: 2 },
  },
  {
    name: '束缚带',
    slot: '特殊装备',
    icon: 'fas fa-link',
    price: 700,
    category: 'equipment',
    grade: 'C',
    gender: '男',
    attrFocus: '忍耐力',
    description: '基础束缚道具',
    bonuses: { 基础忍耐力加成: 4, 基础性斗力加成: 3 },
  },
  {
    name: '幸运护符',
    slot: '饰品',
    icon: 'fas fa-clover',
    price: 550,
    category: 'equipment',
    grade: 'C',
    gender: '男',
    attrFocus: '幸运',
    description: '带来好运的护符',
    bonuses: { 幸运加成: 4, 闪避率加成: 2 },
  },

  // B级装备（保持原有+增加一件饰品）
  {
    name: '紧身战斗服',
    slot: '主装备',
    icon: 'fas fa-vest',
    price: 1500,
    category: 'equipment',
    grade: 'B',
    gender: '女',
    attrFocus: '忍耐力',
    description: '凸显身材的紧身战斗服',
    bonuses: { 基础忍耐力加成: 10, 魅力加成: 6, 闪避率加成: 4 },
  },
  {
    name: '魅惑项圈',
    slot: '饰品',
    icon: 'fas fa-ring',
    price: 1800,
    category: 'equipment',
    grade: 'B',
    gender: '女',
    attrFocus: '魅力',
    description: '带有魔力的项圈',
    bonuses: { 魅力加成: 10, 基础性斗力加成: 5, 暴击率加成: 3 },
  },
  {
    name: '电击按摩棒',
    slot: '副装备',
    icon: 'fas fa-bolt',
    price: 2000,
    category: 'equipment',
    grade: 'B',
    gender: '女',
    attrFocus: '性斗力',
    description: '带有微电流的按摩道具',
    bonuses: { 基础性斗力加成: 15, 暴击率加成: 5 },
  },
  {
    name: '情趣内衣套装',
    slot: '主装备',
    icon: 'fas fa-heart',
    price: 1600,
    category: 'equipment',
    grade: 'B',
    gender: '女',
    attrFocus: '魅力',
    description: '精致的情趣内衣',
    bonuses: { 魅力加成: 12, 闪避率加成: 5, 幸运加成: 4 },
  },
  {
    name: '羽毛逗弄器',
    slot: '副装备',
    icon: 'fas fa-feather',
    price: 1400,
    category: 'equipment',
    grade: 'B',
    gender: '男',
    attrFocus: '性斗力',
    description: '柔软的羽毛道具',
    bonuses: { 基础性斗力加成: 10, 魅力加成: 6 },
  },
  {
    name: '震动戒指',
    slot: '饰品',
    icon: 'fas fa-circle',
    price: 1700,
    category: 'equipment',
    grade: 'B',
    gender: '男',
    attrFocus: '幸运',
    description: '带有震动功能的戒指',
    bonuses: { 基础性斗力加成: 8, 暴击率加成: 4, 幸运加成: 3 },
  },
  {
    name: '皮革束缚套装',
    slot: '特殊装备',
    icon: 'fas fa-lock',
    price: 2200,
    category: 'equipment',
    grade: 'B',
    gender: '男',
    attrFocus: '忍耐力',
    description: '高级皮革束缚道具',
    bonuses: { 基础忍耐力加成: 12, 基础性斗力加成: 8 },
  },
  {
    name: '强化护腕',
    slot: '饰品',
    icon: 'fas fa-hand-fist',
    price: 1750,
    category: 'equipment',
    grade: 'B',
    gender: '男',
    attrFocus: '性斗力',
    description: '增强力量的护腕',
    bonuses: { 基础性斗力加成: 12, 暴击率加成: 4 },
  },

  // A级装备 - 女性性斗力系（主副饰品×2特殊）
  {
    name: '女王战甲',
    slot: '主装备',
    icon: 'fas fa-crown',
    price: 4000,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '性斗力',
    description: '彰显支配力的战斗装束',
    bonuses: { 基础性斗力加成: 25, 基础忍耐力加成: 15, 暴击率加成: 8 },
  },
  {
    name: '高级调教鞭',
    slot: '副装备',
    icon: 'fas fa-gavel',
    price: 5000,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '性斗力',
    description: '专业级调教道具',
    bonuses: { 基础性斗力加成: 28, 暴击率加成: 10, 基础性斗力成算: 3 },
  },
  {
    name: '淫纹刺青',
    slot: '饰品',
    icon: 'fas fa-fire-flame-curved',
    price: 4800,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '性斗力',
    description: '增强性斗力的魔法刺青',
    bonuses: { 基础性斗力加成: 22, 基础性斗力成算: 5, 暴击率加成: 6 },
  },
  {
    name: '欲望宝珠',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 4600,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '性斗力',
    description: '蕴含欲望之力的宝珠',
    bonuses: { 基础性斗力加成: 20, 暴击率加成: 8, 基础性斗力成算: 4 },
  },
  {
    name: '触手束缚器',
    slot: '特殊装备',
    icon: 'fas fa-spider',
    price: 6000,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '性斗力',
    description: '活体触手束缚道具',
    bonuses: { 基础性斗力加成: 25, 基础忍耐力加成: 15, 暴击率加成: 8 },
  },

  // A级装备 - 女性忍耐力系
  {
    name: '坚韧战衣',
    slot: '主装备',
    icon: 'fas fa-shield',
    price: 4200,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '忍耐力',
    description: '极强防护的战斗服',
    bonuses: { 基础忍耐力加成: 28, 基础性斗力加成: 12, 闪避率加成: 8 },
  },
  {
    name: '防护法杖',
    slot: '副装备',
    icon: 'fas fa-wand-magic',
    price: 4800,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '忍耐力',
    description: '提供防护的魔法杖',
    bonuses: { 基础忍耐力加成: 25, 基础忍耐力成算: 5, 闪避率加成: 6 },
  },
  {
    name: '守护之心',
    slot: '饰品',
    icon: 'fas fa-heart-pulse',
    price: 4500,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '忍耐力',
    description: '守护之力的结晶',
    bonuses: { 基础忍耐力加成: 22, 基础忍耐力成算: 4, 闪避率加成: 5 },
  },
  {
    name: '坚韧护符',
    slot: '饰品',
    icon: 'fas fa-shield-heart',
    price: 4400,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '忍耐力',
    description: '增强忍耐的护符',
    bonuses: { 基础忍耐力加成: 20, 闪避率加成: 8, 基础忍耐力成算: 3 },
  },
  {
    name: '不屈锁链',
    slot: '特殊装备',
    icon: 'fas fa-link',
    price: 5800,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '忍耐力',
    description: '永不屈服的锁链',
    bonuses: { 基础忍耐力加成: 26, 基础性斗力加成: 10, 基础忍耐力成算: 6 },
  },

  // A级装备 - 女性魅力系
  {
    name: '魅惑女王装',
    slot: '主装备',
    icon: 'fas fa-user-secret',
    price: 4100,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '魅力',
    description: '散发魅力的女王装束',
    bonuses: { 魅力加成: 28, 基础性斗力加成: 12, 暴击率加成: 6 },
  },
  {
    name: '诱惑之鞭',
    slot: '副装备',
    icon: 'fas fa-fire',
    price: 4700,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '魅力',
    description: '充满诱惑力的皮鞭',
    bonuses: { 魅力加成: 25, 基础性斗力加成: 15, 暴击率加成: 5 },
  },
  {
    name: '催情宝石吊坠',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 4500,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '魅力',
    description: '蕴含催情魔力的宝石',
    bonuses: { 魅力加成: 22, 基础性斗力加成: 10, 暴击率加成: 8 },
  },
  {
    name: '魅惑耳环',
    slot: '饰品',
    icon: 'fas fa-circle',
    price: 4300,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '魅力',
    description: '增强魅力的耳环',
    bonuses: { 魅力加成: 20, 幸运加成: 8, 暴击率加成: 6 },
  },
  {
    name: '诱惑丝带',
    slot: '特殊装备',
    icon: 'fas fa-ribbon',
    price: 5600,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '魅力',
    description: '充满诱惑的丝带',
    bonuses: { 魅力加成: 26, 基础性斗力加成: 12, 闪避率加成: 8 },
  },

  // A级装备 - 女性幸运系
  {
    name: '幸运女神装',
    slot: '主装备',
    icon: 'fas fa-clover',
    price: 4000,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '幸运',
    description: '幸运女神的祝福',
    bonuses: { 幸运加成: 25, 闪避率加成: 12, 魅力加成: 10 },
  },
  {
    name: '命运之杖',
    slot: '副装备',
    icon: 'fas fa-wand-sparkles',
    price: 4600,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '幸运',
    description: '操控命运的魔杖',
    bonuses: { 幸运加成: 22, 暴击率加成: 10, 闪避率加成: 8 },
  },
  {
    name: '魅魔之翼',
    slot: '特殊装备',
    icon: 'fas fa-wind',
    price: 5500,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '幸运',
    description: '传说中魅魔的羽翼',
    bonuses: { 幸运加成: 24, 闪避率加成: 12, 魅力加成: 10 },
  },
  {
    name: '幸运星坠',
    slot: '饰品',
    icon: 'fas fa-star',
    price: 4400,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '幸运',
    description: '幸运之星的碎片',
    bonuses: { 幸运加成: 20, 闪避率加成: 10, 暴击率加成: 6 },
  },
  {
    name: '命运之环',
    slot: '饰品',
    icon: 'fas fa-ring',
    price: 4200,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '幸运',
    description: '改变命运的戒指',
    bonuses: { 幸运加成: 18, 闪避率加成: 8, 暴击率加成: 8 },
  },

  // A级装备 - 男性性斗力系
  {
    name: '征服者战甲',
    slot: '主装备',
    icon: 'fas fa-user-ninja',
    price: 4100,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '性斗力',
    description: '征服者的强力战甲',
    bonuses: { 基础性斗力加成: 26, 基础忍耐力加成: 14, 暴击率加成: 8 },
  },
  {
    name: '支配之鞭',
    slot: '副装备',
    icon: 'fas fa-gavel',
    price: 5100,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '性斗力',
    description: '彰显支配力的皮鞭',
    bonuses: { 基础性斗力加成: 29, 暴击率加成: 11, 基础性斗力成算: 3 },
  },
  {
    name: '力量印记',
    slot: '饰品',
    icon: 'fas fa-fire',
    price: 4700,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '性斗力',
    description: '力量的象征',
    bonuses: { 基础性斗力加成: 23, 基础性斗力成算: 5, 暴击率加成: 7 },
  },
  {
    name: '战斗护腕',
    slot: '饰品',
    icon: 'fas fa-hand-fist',
    price: 4500,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '性斗力',
    description: '增强战斗力的护腕',
    bonuses: { 基础性斗力加成: 21, 暴击率加成: 9, 基础性斗力成算: 4 },
  },
  {
    name: '束缚锁链',
    slot: '特殊装备',
    icon: 'fas fa-link',
    price: 6100,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '性斗力',
    description: '强力的束缚锁链',
    bonuses: { 基础性斗力加成: 26, 基础忍耐力加成: 16, 暴击率加成: 8 },
  },

  // A级装备 - 男性忍耐力系
  {
    name: '不屈战甲',
    slot: '主装备',
    icon: 'fas fa-shield',
    price: 4300,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '忍耐力',
    description: '永不屈服的战甲',
    bonuses: { 基础忍耐力加成: 29, 基础性斗力加成: 13, 闪避率加成: 8 },
  },
  {
    name: '守护之盾',
    slot: '副装备',
    icon: 'fas fa-shield-halved',
    price: 4900,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '忍耐力',
    description: '强力的防护盾牌',
    bonuses: { 基础忍耐力加成: 26, 基础忍耐力成算: 5, 闪避率加成: 7 },
  },
  {
    name: '坚韧徽章',
    slot: '饰品',
    icon: 'fas fa-medal',
    price: 4600,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '忍耐力',
    description: '坚韧不拔的徽章',
    bonuses: { 基础忍耐力加成: 23, 基础忍耐力成算: 4, 闪避率加成: 6 },
  },
  {
    name: '防护护符',
    slot: '饰品',
    icon: 'fas fa-shield-heart',
    price: 4500,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '忍耐力',
    description: '提供防护的护符',
    bonuses: { 基础忍耐力加成: 21, 闪避率加成: 9, 基础忍耐力成算: 3 },
  },
  {
    name: '钢铁意志',
    slot: '特殊装备',
    icon: 'fas fa-dumbbell',
    price: 5900,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '忍耐力',
    description: '钢铁般的意志',
    bonuses: { 基础忍耐力加成: 27, 基础性斗力加成: 11, 基础忍耐力成算: 6 },
  },

  // A级装备 - 男性魅力系
  {
    name: '魅力绅士装',
    slot: '主装备',
    icon: 'fas fa-user-tie',
    price: 4200,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '魅力',
    description: '充满魅力的绅士装',
    bonuses: { 魅力加成: 29, 基础性斗力加成: 13, 暴击率加成: 6 },
  },
  {
    name: '诱惑之杖',
    slot: '副装备',
    icon: 'fas fa-wand-magic',
    price: 4800,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '魅力',
    description: '散发诱惑的魔杖',
    bonuses: { 魅力加成: 26, 基础性斗力加成: 16, 暴击率加成: 5 },
  },
  {
    name: '魅力宝石',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 4600,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '魅力',
    description: '增强魅力的宝石',
    bonuses: { 魅力加成: 23, 基础性斗力加成: 11, 暴击率加成: 8 },
  },
  {
    name: '诱惑戒指',
    slot: '饰品',
    icon: 'fas fa-ring',
    price: 4400,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '魅力',
    description: '充满诱惑的戒指',
    bonuses: { 魅力加成: 21, 幸运加成: 9, 暴击率加成: 6 },
  },
  {
    name: '魅惑披风',
    slot: '特殊装备',
    icon: 'fas fa-vest',
    price: 5700,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '魅力',
    description: '魅惑众生的披风',
    bonuses: { 魅力加成: 27, 基础性斗力加成: 13, 闪避率加成: 8 },
  },

  // A级装备 - 男性幸运系
  {
    name: '幸运骑士装',
    slot: '主装备',
    icon: 'fas fa-chess-knight',
    price: 4100,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运骑士的装束',
    bonuses: { 幸运加成: 26, 闪避率加成: 13, 魅力加成: 10 },
  },
  {
    name: '幸运之剑',
    slot: '副装备',
    icon: 'fas fa-khanda',
    price: 4700,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '幸运',
    description: '带来好运的宝剑',
    bonuses: { 幸运加成: 23, 暴击率加成: 11, 闪避率加成: 8 },
  },
  {
    name: '幸运徽章',
    slot: '饰品',
    icon: 'fas fa-clover',
    price: 4500,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运的象征',
    bonuses: { 幸运加成: 21, 闪避率加成: 11, 暴击率加成: 6 },
  },
  {
    name: '命运护符',
    slot: '饰品',
    icon: 'fas fa-star',
    price: 4300,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '幸运',
    description: '改变命运的护符',
    bonuses: { 幸运加成: 19, 闪避率加成: 9, 暴击率加成: 8 },
  },
  {
    name: '幸运披风',
    slot: '特殊装备',
    icon: 'fas fa-wind',
    price: 5600,
    category: 'equipment',
    grade: 'A',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运之风的披风',
    bonuses: { 幸运加成: 25, 闪避率加成: 13, 魅力加成: 10 },
  },

  // S级装备 - 女性性斗力系
  {
    name: '淫魔女王套装',
    slot: '主装备',
    icon: 'fas fa-user-secret',
    price: 10000,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '性斗力',
    description: '淫魔女王的战斗装束',
    bonuses: { 基础性斗力加成: 45, 基础忍耐力加成: 35, 魅力加成: 25, 基础性斗力成算: 8 },
  },
  {
    name: '快感增幅器',
    slot: '副装备',
    icon: 'fas fa-wave-square',
    price: 11000,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '性斗力',
    description: '能够增幅快感的神器',
    bonuses: { 基础性斗力加成: 50, 暴击率加成: 18, 基础性斗力成算: 10 },
  },
  {
    name: '欲望烙印',
    slot: '饰品',
    icon: 'fas fa-fire-flame-curved',
    price: 10500,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '性斗力',
    description: '欲望的永恒烙印',
    bonuses: { 基础性斗力加成: 42, 基础性斗力成算: 9, 暴击率加成: 14 },
  },
  {
    name: '堕落宝珠',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 10200,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '性斗力',
    description: '堕落之力的结晶',
    bonuses: { 基础性斗力加成: 40, 暴击率加成: 16, 基础性斗力成算: 8 },
  },
  {
    name: '淫纹锁链',
    slot: '特殊装备',
    icon: 'fas fa-link',
    price: 12000,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '性斗力',
    description: '刻有淫纹的锁链',
    bonuses: { 基础性斗力加成: 48, 基础忍耐力加成: 28, 暴击率加成: 15 },
  },

  // S级装备 - 女性忍耐力系
  {
    name: '不屈圣衣',
    slot: '主装备',
    icon: 'fas fa-shield',
    price: 10200,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '忍耐力',
    description: '永不屈服的圣衣',
    bonuses: { 基础忍耐力加成: 48, 基础性斗力加成: 25, 闪避率加成: 15, 基础忍耐力成算: 8 },
  },
  {
    name: '守护圣杖',
    slot: '副装备',
    icon: 'fas fa-wand-magic',
    price: 11200,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '忍耐力',
    description: '守护之力的圣杖',
    bonuses: { 基础忍耐力加成: 45, 基础忍耐力成算: 10, 闪避率加成: 12 },
  },
  {
    name: '永恒守护',
    slot: '特殊装备',
    icon: 'fas fa-shield-heart',
    price: 13000,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '忍耐力',
    description: '永恒的守护之力',
    bonuses: { 基础忍耐力加成: 50, 基础性斗力加成: 20, 基础忍耐力成算: 11, 闪避率加成: 12 },
  },
  {
    name: '坚韧之心',
    slot: '饰品',
    icon: 'fas fa-heart-pulse',
    price: 10800,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '忍耐力',
    description: '坚韧不拔之心',
    bonuses: { 基础忍耐力加成: 43, 基础忍耐力成算: 9, 闪避率加成: 10 },
  },
  {
    name: '不灭护符',
    slot: '饰品',
    icon: 'fas fa-shield-heart',
    price: 10500,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '忍耐力',
    description: '永不熄灭的护符',
    bonuses: { 基础忍耐力加成: 40, 闪避率加成: 14, 基础忍耐力成算: 8 },
  },

  // S级装备 - 女性魅力系
  {
    name: '魅魔圣装',
    slot: '主装备',
    icon: 'fas fa-user-secret',
    price: 10100,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '魅力',
    description: '魅魔的圣洁装束',
    bonuses: { 魅力加成: 48, 基础性斗力加成: 25, 暴击率加成: 12 },
  },
  {
    name: '诱惑圣鞭',
    slot: '副装备',
    icon: 'fas fa-fire',
    price: 11300,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '魅力',
    description: '至高诱惑之鞭',
    bonuses: { 魅力加成: 45, 基础性斗力加成: 28, 暴击率加成: 10 },
  },
  {
    name: '堕落之心',
    slot: '饰品',
    icon: 'fas fa-heart-crack',
    price: 12000,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '魅力',
    description: '蕴含堕落力量的心形宝石',
    bonuses: { 魅力加成: 43, 基础性斗力加成: 20, 暴击率加成: 15 },
  },
  {
    name: '魅惑宝石',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 10700,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '魅力',
    description: '魅惑众生的宝石',
    bonuses: { 魅力加成: 40, 幸运加成: 15, 暴击率加成: 12 },
  },
  {
    name: '诱惑圣带',
    slot: '特殊装备',
    icon: 'fas fa-ribbon',
    price: 12500,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '魅力',
    description: '至高诱惑的圣带',
    bonuses: { 魅力加成: 46, 基础性斗力加成: 22, 闪避率加成: 14 },
  },

  // S级装备 - 女性幸运系
  {
    name: '命运女神装',
    slot: '主装备',
    icon: 'fas fa-clover',
    price: 10000,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '幸运',
    description: '命运女神的祝福',
    bonuses: { 幸运加成: 45, 闪避率加成: 20, 魅力加成: 18 },
  },
  {
    name: '命运圣杖',
    slot: '副装备',
    icon: 'fas fa-wand-sparkles',
    price: 11100,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '幸运',
    description: '掌控命运的圣杖',
    bonuses: { 幸运加成: 42, 暴击率加成: 18, 闪避率加成: 15 },
  },
  {
    name: '幸运圣翼',
    slot: '特殊装备',
    icon: 'fas fa-wind',
    price: 12800,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '幸运',
    description: '幸运之神的羽翼',
    bonuses: { 幸运加成: 44, 闪避率加成: 22, 魅力加成: 16 },
  },
  {
    name: '命运之星',
    slot: '饰品',
    icon: 'fas fa-star',
    price: 10900,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '幸运',
    description: '命运之星的碎片',
    bonuses: { 幸运加成: 40, 闪避率加成: 18, 暴击率加成: 12 },
  },
  {
    name: '幸运圣环',
    slot: '饰品',
    icon: 'fas fa-ring',
    price: 10600,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '幸运',
    description: '幸运的圣环',
    bonuses: { 幸运加成: 38, 闪避率加成: 16, 暴击率加成: 14 },
  },

  // S级装备 - 男性性斗力系
  {
    name: '征服者圣铠',
    slot: '主装备',
    icon: 'fas fa-chess-king',
    price: 10500,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '性斗力',
    description: '征服者的至高圣铠',
    bonuses: { 基础性斗力加成: 46, 基础忍耐力加成: 36, 暴击率加成: 12, 基础性斗力成算: 8 },
  },
  {
    name: '支配圣鞭',
    slot: '副装备',
    icon: 'fas fa-gavel',
    price: 11400,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '性斗力',
    description: '绝对支配之鞭',
    bonuses: { 基础性斗力加成: 51, 暴击率加成: 19, 基础性斗力成算: 10 },
  },
  {
    name: '力量圣印',
    slot: '饰品',
    icon: 'fas fa-fire',
    price: 10800,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '性斗力',
    description: '力量的圣印',
    bonuses: { 基础性斗力加成: 44, 基础性斗力成算: 9, 暴击率加成: 15 },
  },
  {
    name: '战神护腕',
    slot: '饰品',
    icon: 'fas fa-hand-fist',
    price: 10600,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '性斗力',
    description: '战神的护腕',
    bonuses: { 基础性斗力加成: 42, 暴击率加成: 17, 基础性斗力成算: 8 },
  },
  {
    name: '支配圣链',
    slot: '特殊装备',
    icon: 'fas fa-link',
    price: 12300,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '性斗力',
    description: '支配一切的圣链',
    bonuses: { 基础性斗力加成: 49, 基础忍耐力加成: 30, 暴击率加成: 16 },
  },

  // S级装备 - 男性忍耐力系
  {
    name: '不灭圣铠',
    slot: '主装备',
    icon: 'fas fa-shield',
    price: 10600,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '忍耐力',
    description: '永不破灭的圣铠',
    bonuses: { 基础忍耐力加成: 50, 基础性斗力加成: 26, 闪避率加成: 15, 基础忍耐力成算: 8 },
  },
  {
    name: '守护圣盾',
    slot: '副装备',
    icon: 'fas fa-shield-halved',
    price: 11500,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '忍耐力',
    description: '至高守护之盾',
    bonuses: { 基础忍耐力加成: 47, 基础忍耐力成算: 10, 闪避率加成: 13 },
  },
  {
    name: '坚韧圣章',
    slot: '饰品',
    icon: 'fas fa-medal',
    price: 11000,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '忍耐力',
    description: '坚韧的圣章',
    bonuses: { 基础忍耐力加成: 44, 基础忍耐力成算: 9, 闪避率加成: 11 },
  },
  {
    name: '守护圣符',
    slot: '饰品',
    icon: 'fas fa-shield-heart',
    price: 10800,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '忍耐力',
    description: '守护的圣符',
    bonuses: { 基础忍耐力加成: 42, 闪避率加成: 15, 基础忍耐力成算: 8 },
  },
  {
    name: '绝对支配锁链',
    slot: '特殊装备',
    icon: 'fas fa-link',
    price: 13000,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '忍耐力',
    description: '无法挣脱的支配锁链',
    bonuses: { 基础忍耐力加成: 52, 基础性斗力加成: 25, 基础忍耐力成算: 11, 暴击率加成: 10 },
  },

  // S级装备 - 男性魅力系
  {
    name: '魅惑帝王装',
    slot: '主装备',
    icon: 'fas fa-user-tie',
    price: 10400,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '魅力',
    description: '魅惑帝王的装束',
    bonuses: { 魅力加成: 50, 基础性斗力加成: 26, 暴击率加成: 12 },
  },
  {
    name: '诱惑圣杖',
    slot: '副装备',
    icon: 'fas fa-wand-magic',
    price: 11600,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '魅力',
    description: '至高诱惑的圣杖',
    bonuses: { 魅力加成: 47, 基础性斗力加成: 30, 暴击率加成: 10 },
  },
  {
    name: '魅惑之王冠',
    slot: '饰品',
    icon: 'fas fa-crown',
    price: 12500,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '魅力',
    description: '魅惑之王的王冠',
    bonuses: { 魅力加成: 46, 基础性斗力加成: 22, 暴击率加成: 14 },
  },
  {
    name: '魅力圣石',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 11100,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '魅力',
    description: '魅力的圣石',
    bonuses: { 魅力加成: 44, 幸运加成: 16, 暴击率加成: 12 },
  },
  {
    name: '魅惑圣袍',
    slot: '特殊装备',
    icon: 'fas fa-vest',
    price: 12800,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '魅力',
    description: '魅惑众生的圣袍',
    bonuses: { 魅力加成: 48, 基础性斗力加成: 24, 闪避率加成: 14 },
  },

  // S级装备 - 男性幸运系
  {
    name: '幸运帝王装',
    slot: '主装备',
    icon: 'fas fa-chess-knight',
    price: 10300,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运帝王的装束',
    bonuses: { 幸运加成: 47, 闪避率加成: 21, 魅力加成: 18 },
  },
  {
    name: '命运主宰',
    slot: '副装备',
    icon: 'fas fa-dice',
    price: 11500,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '幸运',
    description: '主宰命运的神器',
    bonuses: { 幸运加成: 44, 暴击率加成: 19, 闪避率加成: 16 },
  },
  {
    name: '幸运圣章',
    slot: '饰品',
    icon: 'fas fa-clover',
    price: 11200,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运的圣章',
    bonuses: { 幸运加成: 42, 闪避率加成: 19, 暴击率加成: 12 },
  },
  {
    name: '命运圣符',
    slot: '饰品',
    icon: 'fas fa-star',
    price: 10900,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '幸运',
    description: '命运的圣符',
    bonuses: { 幸运加成: 40, 闪避率加成: 17, 暴击率加成: 14 },
  },
  {
    name: '幸运圣袍',
    slot: '特殊装备',
    icon: 'fas fa-wind',
    price: 13100,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运之风的圣袍',
    bonuses: { 幸运加成: 46, 闪避率加成: 23, 魅力加成: 16 },
  },

  // S级装备 - 春节限定·女（特殊系）
  {
    name: '瑞雪霓裳·春华',
    slot: '主装备',
    icon: 'fas fa-snowflake',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '特殊',
    description: '春节限定——以瑞雪为纱、梅花为饰的华丽霓裳，传闻穿戴者可得新年福运加身',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },
  {
    name: '红鸾折扇',
    slot: '副装备',
    icon: 'fas fa-fan',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '特殊',
    description: '春节限定——绘有鸾凤和鸣图案的朱红折扇，扇风可引来桃花运',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },
  {
    name: '金玉如意玲珑璧',
    slot: '饰品',
    icon: 'fas fa-yin-yang',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '特殊',
    description: '春节限定——金镶玉如意花纹的玲珑玉璧，佩戴可化险为夷',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },
  {
    name: '桃花结红绳',
    slot: '饰品',
    icon: 'fas fa-heart',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '特殊',
    description: '春节限定——以桃木珠与红绳编织的手链，据说能牵动桃花姻缘',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },
  {
    name: '鞭炮缠腰带',
    slot: '特殊装备',
    icon: 'fas fa-fire',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '特殊',
    description: '春节限定——以迸溅焰火为灵感的腰饰，驱邪避凶、好运连连',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },

  // S级装备 - 春节限定·男（特殊系）
  {
    name: '麒麟战袍·岁寒',
    slot: '主装备',
    icon: 'fas fa-dragon',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '特殊',
    description: '春节限定——织入麒麟瑞兽纹的墨色战袍，据传可趋吉避凶',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },
  {
    name: '爆竹焚天笏',
    slot: '副装备',
    icon: 'fas fa-wand-sparkles',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '特殊',
    description: '春节限定——唤起爆竹烈焰的金笏，一击之间驱散秽气',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },
  {
    name: '祥龙衔珠扣',
    slot: '饰品',
    icon: 'fas fa-circle',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '特殊',
    description: '春节限定——龙形衔珠腰扣，龙气护体、逢凶化吉',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },
  {
    name: '福字金锁链',
    slot: '饰品',
    icon: 'fas fa-lock',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '特殊',
    description: '春节限定——"福"字浮雕的长命金锁，锁住好运、百邪不侵',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },
  {
    name: '年兽獠牙饰环',
    slot: '特殊装备',
    icon: 'fas fa-paw',
    price: 18888,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '特殊',
    description: '春节限定——以年兽之牙磨制的臂环，威慑魔物、福运滔天',
    bonuses: { 幸运加成: 88, 魅力加成: 18, 基础性斗力成算: 8 },
  },

  // SS级装备 - 女性性斗力系
  {
    name: '魅魔女皇圣衣',
    slot: '主装备',
    icon: 'fas fa-sun',
    price: 30000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '性斗力',
    description: '魅魔女皇的至高圣衣',
    bonuses: { 基础性斗力加成: 70, 基础忍耐力加成: 60, 魅力加成: 50, 基础性斗力成算: 15, 基础忍耐力成算: 12 },
  },
  {
    name: '禁忌快感杖',
    slot: '副装备',
    icon: 'fas fa-wand-sparkles',
    price: 40000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '性斗力',
    description: '禁忌的快感魔杖',
    bonuses: { 基础性斗力加成: 85, 暴击率加成: 28, 基础性斗力成算: 18, 魅力加成: 35 },
  },
  {
    name: '终极欲望印记',
    slot: '饰品',
    icon: 'fas fa-fire-flame-curved',
    price: 32000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '性斗力',
    description: '终极欲望的烙印',
    bonuses: { 基础性斗力加成: 68, 基础性斗力成算: 16, 暴击率加成: 24 },
  },
  {
    name: '堕落神石',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 31000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '性斗力',
    description: '堕落神力的结晶',
    bonuses: { 基础性斗力加成: 65, 暴击率加成: 26, 基础性斗力成算: 15 },
  },
  {
    name: '淫纹神链',
    slot: '特殊装备',
    icon: 'fas fa-link',
    price: 38000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '性斗力',
    description: '刻有神级淫纹的锁链',
    bonuses: { 基础性斗力加成: 75, 基础忍耐力加成: 50, 暴击率加成: 22, 基础性斗力成算: 14 },
  },

  // SS级装备 - 女性忍耐力系
  {
    name: '永恒圣衣',
    slot: '主装备',
    icon: 'fas fa-shield',
    price: 31000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '忍耐力',
    description: '永恒不灭的圣衣',
    bonuses: { 基础忍耐力加成: 75, 基础性斗力加成: 45, 闪避率加成: 25, 基础忍耐力成算: 15 },
  },
  {
    name: '守护神杖',
    slot: '副装备',
    icon: 'fas fa-wand-magic',
    price: 35000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '忍耐力',
    description: '守护神力的圣杖',
    bonuses: { 基础忍耐力加成: 72, 基础忍耐力成算: 18, 闪避率加成: 22 },
  },
  {
    name: '不灭圣盾',
    slot: '特殊装备',
    icon: 'fas fa-shield-heart',
    price: 38000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '忍耐力',
    description: '永不破灭的圣盾',
    bonuses: { 基础忍耐力加成: 78, 基础性斗力加成: 40, 基础忍耐力成算: 19, 闪避率加成: 20 },
  },
  {
    name: '永恒之心',
    slot: '饰品',
    icon: 'fas fa-heart-pulse',
    price: 33000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '忍耐力',
    description: '永恒不灭之心',
    bonuses: { 基础忍耐力加成: 70, 基础忍耐力成算: 16, 闪避率加成: 18 },
  },
  {
    name: '不灭神符',
    slot: '饰品',
    icon: 'fas fa-shield-heart',
    price: 32000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '忍耐力',
    description: '永不熄灭的神符',
    bonuses: { 基础忍耐力加成: 68, 闪避率加成: 24, 基础忍耐力成算: 15 },
  },

  // SS级装备 - 女性魅力系
  {
    name: '魅魔神装',
    slot: '主装备',
    icon: 'fas fa-user-secret',
    price: 30500,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '魅力',
    description: '魅魔神级装束',
    bonuses: { 魅力加成: 75, 基础性斗力加成: 45, 暴击率加成: 20 },
  },
  {
    name: '诱惑神鞭',
    slot: '副装备',
    icon: 'fas fa-fire',
    price: 36000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '魅力',
    description: '神级诱惑之鞭',
    bonuses: { 魅力加成: 72, 基础性斗力加成: 50, 暴击率加成: 18 },
  },
  {
    name: '永恒欲望之环',
    slot: '饰品',
    icon: 'fas fa-star',
    price: 35000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '魅力',
    description: '永不熄灭的欲望之环',
    bonuses: { 魅力加成: 70, 幸运加成: 30, 暴击率加成: 25 },
  },
  {
    name: '魅惑神石',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 33500,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '魅力',
    description: '魅惑神力的宝石',
    bonuses: { 魅力加成: 68, 幸运加成: 28, 暴击率加成: 22 },
  },
  {
    name: '诱惑神带',
    slot: '特殊装备',
    icon: 'fas fa-ribbon',
    price: 39000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '魅力',
    description: '神级诱惑的圣带',
    bonuses: { 魅力加成: 73, 基础性斗力加成: 42, 闪避率加成: 24 },
  },

  // SS级装备 - 女性幸运系
  {
    name: '命运女神冠',
    slot: '主装备',
    icon: 'fas fa-clover',
    price: 30000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '幸运',
    description: '命运女神的神冠',
    bonuses: { 幸运加成: 72, 闪避率加成: 35, 魅力加成: 30 },
  },
  {
    name: '命运神杖',
    slot: '副装备',
    icon: 'fas fa-wand-sparkles',
    price: 34000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '幸运',
    description: '掌控命运的神杖',
    bonuses: { 幸运加成: 68, 暴击率加成: 30, 闪避率加成: 28 },
  },
  {
    name: '幸运神翼',
    slot: '特殊装备',
    icon: 'fas fa-wind',
    price: 40000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '幸运',
    description: '幸运之神的神翼',
    bonuses: { 幸运加成: 70, 闪避率加成: 38, 魅力加成: 28 },
  },
  {
    name: '命运神星',
    slot: '饰品',
    icon: 'fas fa-star',
    price: 34500,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '幸运',
    description: '命运神星的碎片',
    bonuses: { 幸运加成: 66, 闪避率加成: 32, 暴击率加成: 22 },
  },
  {
    name: '幸运神环',
    slot: '饰品',
    icon: 'fas fa-ring',
    price: 33000,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '幸运',
    description: '幸运的神环',
    bonuses: { 幸运加成: 64, 闪避率加成: 30, 暴击率加成: 24 },
  },

  // SS级装备 - 男性性斗力系
  {
    name: '至高征服者',
    slot: '主装备',
    icon: 'fas fa-dragon',
    price: 32000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '性斗力',
    description: '至高征服者的战甲',
    bonuses: { 基础性斗力加成: 72, 基础忍耐力加成: 62, 暴击率加成: 22, 基础性斗力成算: 15, 基础忍耐力成算: 12 },
  },
  {
    name: '支配神鞭',
    slot: '副装备',
    icon: 'fas fa-gavel',
    price: 37000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '性斗力',
    description: '绝对支配的神鞭',
    bonuses: { 基础性斗力加成: 87, 暴击率加成: 30, 基础性斗力成算: 18 },
  },
  {
    name: '力量神印',
    slot: '饰品',
    icon: 'fas fa-fire',
    price: 33500,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '性斗力',
    description: '力量神力的圣印',
    bonuses: { 基础性斗力加成: 70, 基础性斗力成算: 16, 暴击率加成: 26 },
  },
  {
    name: '战神圣腕',
    slot: '饰品',
    icon: 'fas fa-hand-fist',
    price: 32500,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '性斗力',
    description: '战神的圣腕',
    bonuses: { 基础性斗力加成: 68, 暴击率加成: 28, 基础性斗力成算: 15 },
  },
  {
    name: '支配神链',
    slot: '特殊装备',
    icon: 'fas fa-link',
    price: 39000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '性斗力',
    description: '支配一切的神链',
    bonuses: { 基础性斗力加成: 76, 基础忍耐力加成: 52, 暴击率加成: 24, 基础性斗力成算: 14 },
  },

  // SS级装备 - 男性忍耐力系
  {
    name: '不灭神铠',
    slot: '主装备',
    icon: 'fas fa-shield',
    price: 32500,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '忍耐力',
    description: '永不破灭的神铠',
    bonuses: { 基础忍耐力加成: 78, 基础性斗力加成: 48, 闪避率加成: 26, 基础忍耐力成算: 15 },
  },
  {
    name: '守护神盾',
    slot: '副装备',
    icon: 'fas fa-shield-halved',
    price: 36500,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '忍耐力',
    description: '至高守护的神盾',
    bonuses: { 基础忍耐力加成: 75, 基础忍耐力成算: 18, 闪避率加成: 24 },
  },
  {
    name: '坚韧神章',
    slot: '饰品',
    icon: 'fas fa-medal',
    price: 34000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '忍耐力',
    description: '坚韧神力的圣章',
    bonuses: { 基础忍耐力加成: 72, 基础忍耐力成算: 16, 闪避率加成: 20 },
  },
  {
    name: '守护神符',
    slot: '饰品',
    icon: 'fas fa-shield-heart',
    price: 33000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '忍耐力',
    description: '守护神力的圣符',
    bonuses: { 基础忍耐力加成: 70, 闪避率加成: 26, 基础忍耐力成算: 15 },
  },
  {
    name: '绝对服从项圈',
    slot: '特殊装备',
    icon: 'fas fa-crown',
    price: 45000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '忍耐力',
    description: '令对手绝对服从的神器',
    bonuses: { 基础忍耐力加成: 80, 基础性斗力加成: 45, 魅力加成: 40, 基础忍耐力成算: 19, 暴击率加成: 20 },
  },

  // SS级装备 - 男性魅力系
  {
    name: '魅惑神皇装',
    slot: '主装备',
    icon: 'fas fa-user-tie',
    price: 31500,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '魅力',
    description: '魅惑神皇的装束',
    bonuses: { 魅力加成: 78, 基础性斗力加成: 48, 暴击率加成: 20 },
  },
  {
    name: '诱惑神杖',
    slot: '副装备',
    icon: 'fas fa-wand-magic',
    price: 37500,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '魅力',
    description: '至高诱惑的神杖',
    bonuses: { 魅力加成: 75, 基础性斗力加成: 52, 暴击率加成: 18 },
  },
  {
    name: '至尊魅力',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 36000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '魅力',
    description: '至高无上的魅力宝石',
    bonuses: { 魅力加成: 73, 基础性斗力加成: 35, 暴击率加成: 24 },
  },
  {
    name: '魅力神石',
    slot: '饰品',
    icon: 'fas fa-gem',
    price: 34500,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '魅力',
    description: '魅力神力的宝石',
    bonuses: { 魅力加成: 70, 幸运加成: 30, 暴击率加成: 22 },
  },
  {
    name: '魅惑神袍',
    slot: '特殊装备',
    icon: 'fas fa-vest',
    price: 40000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '魅力',
    description: '魅惑众生的神袍',
    bonuses: { 魅力加成: 76, 基础性斗力加成: 44, 闪避率加成: 24 },
  },

  // SS级装备 - 男性幸运系
  {
    name: '幸运神皇装',
    slot: '主装备',
    icon: 'fas fa-chess-knight',
    price: 31000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运神皇的装束',
    bonuses: { 幸运加成: 75, 闪避率加成: 36, 魅力加成: 30 },
  },
  {
    name: '命运终结者',
    slot: '副装备',
    icon: 'fas fa-bolt',
    price: 42000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '幸运',
    description: '终结一切的命运之力',
    bonuses: { 幸运加成: 70, 暴击率加成: 32, 闪避率加成: 30 },
  },
  {
    name: '幸运神章',
    slot: '饰品',
    icon: 'fas fa-clover',
    price: 35000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运神力的圣章',
    bonuses: { 幸运加成: 68, 闪避率加成: 34, 暴击率加成: 22 },
  },
  {
    name: '命运神符',
    slot: '饰品',
    icon: 'fas fa-star',
    price: 34000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '幸运',
    description: '命运神力的圣符',
    bonuses: { 幸运加成: 66, 闪避率加成: 32, 暴击率加成: 24 },
  },
  {
    name: '幸运神袍',
    slot: '特殊装备',
    icon: 'fas fa-wind',
    price: 41000,
    category: 'equipment',
    grade: 'SS',
    gender: '男',
    attrFocus: '幸运',
    description: '幸运之风的神袍',
    bonuses: { 幸运加成: 72, 闪避率加成: 40, 魅力加成: 28 },
  },

  // 华夏新年 & 特色装备
  {
    name: '财运红内裤',
    slot: '特殊装备',
    icon: 'fas fa-socks',
    price: 188,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '特殊',
    description:
      '用本命年大红色染就的丁字裤，剥开后露出的红色布料紧贴脚心和私处，吐息间透出隐秘的红色诱惑——据说能带来好运',
    bonuses: { 幸运加成: 10, 基础忍耐力加成: 5 },
  },
  {
    name: '恭喜发财铜钱乳夹',
    slot: '饰品',
    icon: 'fas fa-coins',
    price: 666,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '特殊',
    description:
      '铜钱形状的金属夹子严密地夺住两粒敦起的乳尖，夹子下垂的红色流苏随身体摇曳而颤动，每一步都牵动乳尖带来酢麻快感，无比色情',
    bonuses: { 魅力加成: 12, 幸运加成: 8, 基础忍耐力加成: -5 },
  },
  {
    name: '金元宝跳蛋',
    slot: '副装备',
    icon: 'fas fa-egg',
    price: 888,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '特殊',
    description: '金元宝形状的冰凉跳蛋，浓厚的金属质感和沁入骨髓的冰凉在能够带来极致的刺激，振动模式可以让人瞒间崩溃',
    bonuses: { 基础性斗力加成: 35, 幸运加成: 20, 基础性斗力成算: 5 },
  },
  {
    name: '华夏色情僵尸服(带符咒版)',
    slot: '主装备',
    icon: 'fas fa-skull',
    price: 6666,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '特殊',
    description:
      '色情的僵尸装只遮住乳尖和私处的最小面积，符咒纸贴在额头散发神秘的光芒，穿戴时胸部会不断膨胀，身体逐渐变得刺骨性感——似乎有小概率恶堕变成巨乳女僵尸',
    bonuses: { 魅力加成: 50, 基础忍耐力加成: 40, 幸运加成: -10, 基础忍耐力成算: 10 },
  },
  {
    name: '色情红绳旗袍',
    slot: '主装备',
    icon: 'fas fa-person-dress',
    price: 8888,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '特殊',
    description:
      '高开叉的红色旗袍内藏红绳绑缚，红绳从胸前穿过胡桃夹住肯豆再通过膛间绕臀结系，每一步走动红绳都会摩擦敏感点，让穿戴者既兴奋又难耐',
    bonuses: { 基础性斗力加成: 45, 幸运加成: 25, 基础忍耐力加成: -10, 暴击率加成: 15 },
  },
  {
    name: '华夏痴女萝莉仙子服',
    slot: '主装备',
    icon: 'fas fa-child-dress',
    price: 12888,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '特殊',
    description:
      '轻纱如翅的小仙子装，半透明的纱衣若隐若现地勾勒娇小的身体曲线，穿戴时修炼有可能增加顿悟技能，但会逐渐变得呢喝娇憎，身体缩小变成可爱的笨蛋萝莉',
    bonuses: { 魅力加成: 60, 幸运加成: 40, 基础性斗力成算: 12, 基础忍耐力成算: -5 },
  },
  {
    name: '色情肚兜',
    slot: '特殊装备',
    icon: 'fas fa-shield-heart',
    price: 1666,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '特殊',
    description:
      '刺绣着牡丹的红缎肚兜，只遮住胸前一小片，两侧乳肉从肚兜边缘溢出，绑带系在背后的结只需轻轻一拉就能彻底解放',
    bonuses: { 魅力加成: 15, 基础性斗力加成: 8, 闪避率加成: 5 },
  },
  {
    name: '马屌假阳具',
    slot: '副装备',
    icon: 'fas fa-horse-head',
    price: 666,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '特殊',
    description: '以真实马屌为原型铸造的粗大假阳具，复刻了马龟头和青筋的细节，插入时的撑胀感能让任何穿戴者呢喊求饶',
    bonuses: { 基础性斗力加成: 18, 魅力加成: 5 },
  },

  // DLC限定装备 - 期中考试与夏日休学旅行
  {
    name: '「考神庇佑」透视及膝及胸比基尼',
    slot: '特殊装备',
    icon: 'fas fa-award',
    price: 42000,
    salePrice: 14700,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '特殊',
    description:
      '由薄如蝉翼的特制高弹透明欧根纱缝制，仅在关键部位贴着两枚金灿灿的“满分100”烫金印章贴纸。稍微出汗或沾水，印章贴纸就会呈现出半透明的微湿感；在笔试或考场中穿戴时，监考老师对你的注意力提升200%。',
    bonuses: { 魅力加成: 82, 幸运加成: 35, 基础忍耐力加成: -15, 暴击率加成: 18, 基础性斗力成算: 12 },
  },
  {
    name: '「加油应援水手服」',
    slot: '主装备',
    icon: 'fas fa-person-dress',
    price: 5800,
    salePrice: 2030,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '魅力',
    description:
      '超短款露脐水手服，百褶裙短到刚好露出一半臀缝。上衣内侧完全无内衣设计，随着挥手加油的动作，饱满的胸部会在下摆间若隐若现。',
    bonuses: { 魅力加成: 24, 幸运加成: 9, 基础性斗力加成: 10, 闪避率加成: 4 },
  },
  {
    name: '「偷梁换柱微型小抄卷轴」',
    slot: '副装备',
    icon: 'fas fa-scroll',
    price: 6200,
    salePrice: 2170,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '幸运',
    description:
      '绑在大腿内侧最深处的肉色硅胶卷轴。每次想要拉出小抄看答案，都必须将裙摆掀至腰部，用手指深入大腿根部拨动带有微弱震动效果的微型轴轮。',
    bonuses: { 幸运加成: 31, 闪避率加成: 7, 魅力加成: 8, 基础忍耐力加成: -6 },
  },
  {
    name: '「教导主任的戒尺」',
    slot: '主装备',
    icon: 'fas fa-ruler',
    price: 15400,
    salePrice: 5390,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '性斗力',
    description: '黑檀木雕琢的重型戒尺。抽击在皮肤上不伤筋骨，却会留下极其敏感红肿的痕迹。',
    bonuses: { 基础性斗力加成: 54, 暴击率加成: 21, 魅力加成: 14, 基础忍耐力加成: -8 },
  },
  {
    name: '「海星黏附式露点微型比基尼」',
    slot: '特殊装备',
    icon: 'fas fa-star-of-life',
    price: 46000,
    salePrice: 16100,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '魅力',
    description:
      '完全没有绑带，由两只活体肉感软体海星与一条极窄的软硅胶海草组成。海星会根据穿戴者的心跳与兴奋度，用细小吸盘轻轻揉弄敏感点。',
    bonuses: { 魅力加成: 86, 基础性斗力加成: 42, 暴击率加成: 24, 基础忍耐力成算: -6 },
  },
  {
    name: '「海洋之心·深海催情泪滴」',
    slot: '饰品',
    icon: 'fas fa-droplet',
    price: 6900,
    salePrice: 2415,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '魅力',
    description:
      '镶嵌在肚脐眼上的深蓝色水滴状晶石，贴合皮肤的一面会不断分泌带有咸甜大海气息的催情黏液，沿着小腹缓缓流向私处。对海洋魔物娘吸引力提高。',
    bonuses: { 魅力加成: 30, 基础忍耐力加成: 10, 幸运加成: 6, 闪避率加成: -3 },
  },
  {
    name: '「仿章鱼触手·软体支配鞭」',
    slot: '主装备',
    icon: 'fas fa-worm',
    price: 7600,
    salePrice: 2660,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '性斗力',
    description:
      '由软硅胶与真章鱼触手组织合成的连骨长鞭，表面布满能够分泌润滑黏液的粉嫩吸盘。抛出后可自动缠绕目标的四肢与敏感部位。',
    bonuses: { 基础性斗力加成: 32, 暴击率加成: 9, 魅力加成: 9, 基础忍耐力加成: -5 },
  },
  {
    name: '「塞壬的魅惑螺号」',
    slot: '副装备',
    icon: 'fas fa-music',
    price: 16800,
    salePrice: 5880,
    category: 'equipment',
    grade: 'S',
    gender: '女',
    attrFocus: '魅力',
    description: '粉紫色海螺构造的吹奏器具，吹响后会发出高频湿润的魅惑水声，削弱听者的意志。',
    bonuses: { 魅力加成: 58, 幸运加成: 18, 暴击率加成: 13, 基础性斗力成算: 7 },
  },
  {
    name: '「部落风情·黑桃Q露臀草裙」',
    slot: '特殊装备',
    icon: 'fas fa-leaf',
    price: 43800,
    salePrice: 15330,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '魅力',
    description:
      '由海岛特产褐色麻线与编织干草制成，前摆极短，后摆完全开叉，腰带正面绣着黑色黑桃Q与BWO印记，草裙内侧绒毛带有微量刺痒催情毒素。',
    bonuses: { 魅力加成: 88, 幸运加成: 24, 闪避率加成: 18, 基础忍耐力加成: -12, 基础性斗力成算: 10 },
  },
  {
    name: '「太阳部落·黑檀巨根神杖」',
    slot: '主装备',
    icon: 'fas fa-staff-snake',
    price: 52000,
    salePrice: 18200,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '性斗力',
    description:
      '迦南祭司亲自开光的黑檀木雕巨型双头法器，长达35cm，油亮黑硕，表面刻满带有温热体感与搏动效果的BWO活体圣纹。',
    bonuses: { 基础性斗力加成: 92, 暴击率加成: 31, 魅力加成: 38, 基础性斗力成算: 16, 闪避率加成: -8 },
  },
  {
    name: '「希安的银铃脚环」',
    slot: '饰品',
    icon: 'fas fa-bell',
    price: 6500,
    salePrice: 2275,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '幸运',
    description: '带有一串微型银铃的黑皮脚环，戴在脚踝上。每走一步或在足交、颜面压制时都会发出诱人的清脆叮当声。',
    bonuses: { 幸运加成: 28, 闪避率加成: 11, 魅力加成: 11, 基础性斗力加成: -4 },
  },
  {
    name: '「龙君的半露胸鲛人骨玉色情礼服」',
    slot: '特殊装备',
    icon: 'fas fa-crown',
    price: 50000,
    salePrice: 17500,
    category: 'equipment',
    grade: 'SS',
    gender: '女',
    attrFocus: '忍耐力',
    description:
      '庄方宜专用的龙宫至高礼服。由半透明黑蓝色鲛丝织成，胸前完全敞开，仅用一根细细的龙鳞锁链横系，水光流转间尽显龙宫王权。',
    bonuses: { 基础忍耐力加成: 88, 魅力加成: 55, 基础忍耐力成算: 17, 闪避率加成: 16, 幸运加成: -8 },
  },
  {
    name: '「金O棒·海渊定海神针」',
    slot: '主装备',
    icon: 'fas fa-wand-magic-sparkles',
    price: 19600,
    salePrice: 6860,
    category: 'equipment',
    grade: 'S',
    gender: '男',
    attrFocus: '性斗力',
    description:
      '看似金光闪闪的定海神针，实则能够根据使用者或对手的尺寸自由伸缩。棒身带有螺旋状凹凸龙纹与恒温热感，适合施展“定海捣穴”。',
    bonuses: { 基础性斗力加成: 60, 暴击率加成: 20, 基础性斗力成算: 9, 基础忍耐力加成: -6 },
  },
  {
    name: '「爱莲的鲨鱼锯齿震动假阳具套筒」',
    slot: '副装备',
    icon: 'fas fa-teeth',
    price: 7200,
    salePrice: 2520,
    category: 'equipment',
    grade: 'A',
    gender: '女',
    attrFocus: '性斗力',
    description:
      '鲨鱼娘侍卫长爱莲推荐的战斗套筒。外壁带有软硅胶倒钩锯齿与高速震动马达，进入瞬间能把穴壁刮擦得又痛又爽、汁液横飞。',
    bonuses: { 基础性斗力加成: 34, 暴击率加成: 8, 基础性斗力成算: 4, 基础忍耐力加成: -7 },
  },
];

// 筛选后的装备列表
const filteredEquipments = computed(() => {
  return allEquipments.filter(item => {
    if (selectedGrade.value && item.grade !== selectedGrade.value) return false;
    if (selectedSlot.value && item.slot !== selectedSlot.value) return false;
    if (selectedGender.value && item.gender !== selectedGender.value) return false;
    if (selectedAttr.value && item.attrFocus !== selectedAttr.value) return false;
    return true;
  });
});

// 消耗品子分类
const consumableSubCategories = [
  {
    type: 'recovery',
    name: '恢复类用品',
    icon: 'fas fa-heart-pulse',
    items: [
      {
        id: 'con_r_1',
        name: '耐力药剂',
        icon: 'fas fa-flask',
        price: 200,
        category: 'consumable',
        combatOnly: true,
        effectText: '耐力+30',
        effect: { staminaRestore: 30 },
        description: '恢复30点耐力',
      },
      {
        id: 'con_r_2',
        name: '高级耐力药剂',
        icon: 'fas fa-flask-vial',
        price: 380,
        category: 'consumable',
        combatOnly: true,
        effectText: '耐力+60',
        effect: { staminaRestore: 60 },
        description: '恢复60点耐力',
      },
      {
        id: 'con_r_3',
        name: '冷静剂',
        icon: 'fas fa-snowflake',
        price: 300,
        category: 'consumable',
        combatOnly: true,
        effectText: '快感-25',
        effect: { pleasureReduce: 25 },
        description: '降低25点快感',
      },
      {
        id: 'con_r_4',
        name: '高级冷静剂',
        icon: 'fas fa-temperature-low',
        price: 550,
        category: 'consumable',
        combatOnly: true,
        effectText: '快感-50',
        effect: { pleasureReduce: 50 },
        description: '降低50点快感',
      },
      {
        id: 'con_r_5',
        name: '全恢复药剂',
        icon: 'fas fa-prescription-bottle-medical',
        price: 888,
        category: 'consumable',
        combatOnly: true,
        effectText: '耐力+100 快感-50',
        effect: { staminaRestore: 100, pleasureReduce: 50 },
        description: '恢复100耐力并降低50快感',
      },
      {
        id: 'con_s_1',
        name: '意志奇点',
        icon: 'fas fa-infinity',
        price: 2000,
        category: 'consumable',
        combatOnly: true,
        effectText: '清除自身所有状态并回复行动',
        effect: {},
        description: '立即清除自己身上的所有buff与debuff并在当前回合回复行动',
      },

      {
        id: 'con_neg_1',
        name: '中枢神经兴奋剂',
        icon: 'fas fa-vial',
        price: 100,
        category: 'consumable',
        combatOnly: true,
        effectText: '快感+80',
        effect: { pleasureReduce: -80 },
        description: '直接增加玩家80的快感',
      },
      {
        id: 'con_neg_2',
        name: '强力媚药',
        icon: 'fas fa-droplet',
        price: 100,
        category: 'consumable',
        combatOnly: true,
        effectText: '忍耐力成算-80 (3回合)',
        effect: { buff: { 基础忍耐力成算: -80 }, duration: 3 },
        description: '直接减少玩家80的忍耐力成算（持续3回合）',
      },
      {
        id: 'con_neg_3',
        name: '致幻剂',
        icon: 'fas fa-smog',
        price: 100,
        category: 'consumable',
        combatOnly: true,
        effectText: '全属性-90 (3回合)',
        effect: {
          buff: {
            魅力加成: -90,
            幸运加成: -90,
            基础性斗力成算: -90,
            基础忍耐力成算: -90,
            闪避率加成: -90,
            暴击率加成: -90,
          },
          duration: 3,
        },
        description: '直接减少玩家全属性90（持续3回合）',
      },
    ],
  },
  {
    type: 'combat_debuff',
    name: '战斗干扰用品',
    icon: 'fas fa-vial-circle-check',
    items: [
      {
        id: 'con_d_1',
        name: '强力春药',
        icon: 'fas fa-droplet',
        price: 1560,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方敏感+35%、持续快感+12 (3回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_1'),
        },
        description: '战斗用强效刺激药剂，使对手更容易积累快感，持续3回合',
      },
      {
        id: 'con_d_2',
        name: '虚弱药剂',
        icon: 'fas fa-flask',
        price: 1080,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方性斗力-20% (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_2'),
        },
        description: '削弱对手攻势的基础药剂，持续2回合',
      },
      {
        id: 'con_d_3',
        name: '强力虚弱药剂',
        icon: 'fas fa-flask-vial',
        price: 2280,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方性斗力-35%、暴击-15 (3回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_3'),
        },
        description: '更稳定的压制型药剂，降低对手输出和爆发，持续3回合',
      },
      {
        id: 'con_d_4',
        name: '虚脱浓缩液',
        icon: 'fas fa-prescription-bottle',
        price: 2700,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方耐力-20、忍耐力-30% (3回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_4'),
        },
        description: '让对手短时间陷入虚软状态，立即削减耐力并降低忍耐，持续3回合',
      },
      {
        id: 'con_d_5',
        name: '麻痹药水',
        icon: 'fas fa-bolt',
        price: 2460,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方束缚1回合、闪避-20 (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_5'),
        },
        description: '限制对手行动并削弱闪避，适合抢节奏',
      },
      {
        id: 'con_d_6',
        name: '出糗粉末',
        icon: 'fas fa-cloud',
        price: 1440,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方乏力35%、幸运-15 (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_6'),
        },
        description: '干扰对手判断和节奏，使其更容易行动失败，持续2回合',
      },
      {
        id: 'con_d_7',
        name: '迟钝迷雾',
        icon: 'fas fa-smog',
        price: 1680,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方迷离35%、闪避-15 (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_7'),
        },
        description: '制造短暂认知迟钝，让对手更可能误判行动，持续2回合',
      },
      {
        id: 'con_d_8',
        name: '狂乱春药',
        icon: 'fas fa-wand-sparkles',
        price: 2940,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方敏感+50%、迷离25% (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_8'),
        },
        description: '高风险高收益的强刺激药剂，适合配合爆发回合',
      },
      {
        id: 'con_d_9',
        name: '狼狈香水',
        icon: 'fas fa-spray-can-sparkles',
        price: 1920,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方魅力-30、幸运-20、敏感+20% (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_9'),
        },
        description: '让对手仪态失衡，降低魅力和幸运并提高受击快感，持续2回合',
      },
      {
        id: 'con_d_10',
        name: '恍惚药丸',
        icon: 'fas fa-capsules',
        price: 2100,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方乏力45% (1回合)、暴击-25 (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_10'),
        },
        description: '短促但强力的行动干扰药丸，同时压低对手暴击，持续1到2回合',
      },
      {
        id: 'con_d_11',
        name: '束缚胶囊',
        icon: 'fas fa-link',
        price: 3600,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方束缚2回合',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_11'),
        },
        description: '昂贵但直接的控制道具，尝试束缚对手2回合',
      },
      {
        id: 'con_d_12',
        name: '破防滴剂',
        icon: 'fas fa-droplet-slash',
        price: 1860,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方忍耐力-25% (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_12'),
        },
        description: '降低对手抗压能力，适合接高伤害技能',
      },
      {
        id: 'con_d_13',
        name: '失衡喷雾',
        icon: 'fas fa-wind',
        price: 1620,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方闪避-35 (2回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_13'),
        },
        description: '削弱对手闪避能力，帮助关键技能命中',
      },
      {
        id: 'con_d_14',
        name: '漏电贴片',
        icon: 'fas fa-plug-circle-bolt',
        price: 2040,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方持续快感+8 (4回合)、暴击-10 (3回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_14'),
        },
        description: '持续干扰型贴片，小幅但稳定地累积快感并压低爆发',
      },
      {
        id: 'con_d_15',
        name: '反应迟缓剂',
        icon: 'fas fa-hourglass-half',
        price: 2340,
        category: 'consumable',
        combatOnly: true,
        effectText: '敌方乏力20%、迷离20% (3回合)',
        effect: {
          battleEffects: getCombatConsumableEffects('con_d_15'),
        },
        description: '长效干扰剂，低概率但持续扰乱对手行动，持续3回合',
      },
    ],
  },
  {
    type: 'temp_buff',
    name: '临时状态提升',
    icon: 'fas fa-arrow-trend-up',
    items: [
      {
        id: 'con_t_3',
        name: '魅惑香水',
        icon: 'fas fa-spray-can',
        price: 400,
        category: 'consumable',
        combatOnly: true,
        effectText: '魅力+20 (3回合)',
        effect: { buff: { 魅力加成: 20 }, duration: 3 },
        description: '临时提升20点魅力，持续3回合',
      },
      {
        id: 'con_t_4',
        name: '幸运符',
        icon: 'fas fa-clover',
        price: 300,
        category: 'consumable',
        combatOnly: true,
        effectText: '幸运+15 (3回合)',
        effect: { buff: { 幸运加成: 15 }, duration: 3 },
        description: '临时提升15点幸运，持续3回合',
      },
      {
        id: 'con_t_5',
        name: '疾风药剂',
        icon: 'fas fa-wind',
        price: 450,
        category: 'consumable',
        combatOnly: true,
        effectText: '闪避+10% (3回合)',
        effect: { buff: { 闪避率加成: 10 }, duration: 3 },
        description: '临时提升10%闪避率，持续3回合',
      },
      {
        id: 'con_t_6',
        name: '精准药剂',
        icon: 'fas fa-bullseye',
        price: 450,
        category: 'consumable',
        combatOnly: true,
        effectText: '暴击+12% (3回合)',
        effect: { buff: { 暴击率加成: 12 }, duration: 3 },
        description: '临时提升12%暴击率，持续3回合',
      },
      {
        id: 'con_t_7',
        name: '全能强化剂',
        icon: 'fas fa-bolt-lightning',
        price: 800,
        category: 'consumable',
        combatOnly: true,
        effectText: '魅力+8 幸运+8 (3回合)',
        effect: { buff: { 魅力加成: 8, 幸运加成: 8 }, duration: 3 },
        description: '临时提升魅力和幸运，持续3回合',
      },
    ],
  },
  {
    type: 'permanent',
    name: '永久提升用品（购买后自动使用）',
    icon: 'fas fa-infinity',
    items: [
      {
        id: 'con_p_3',
        name: '魅力精华',
        icon: 'fas fa-heart',
        price: 3500,
        category: 'consumable',
        combatOnly: false,
        effectText: '基础魅力+2',
        effect: { permanent: { 魅力: 2 } },
        description: '永久提升2点基础魅力',
      },
      {
        id: 'con_p_4',
        name: '幸运草精华',
        icon: 'fas fa-clover',
        price: 2500,
        category: 'consumable',
        combatOnly: false,
        effectText: '基础幸运+2',
        effect: { permanent: { 幸运: 2 } },
        description: '永久提升2点基础幸运',
      },
      {
        id: 'con_p_5',
        name: '潜力觉醒药',
        icon: 'fas fa-star',
        price: 8000,
        category: 'consumable',
        combatOnly: false,
        effectText: '潜力+0.1',
        effect: { permanent: { _潜力: 0.1 } },
        description: '永久提升0.1点潜力值（极其珍贵）',
      },
      {
        id: 'con_p_6',
        name: '高级潜力觉醒药',
        icon: 'fas fa-sun',
        price: 22000,
        category: 'consumable',
        combatOnly: false,
        effectText: '潜力+0.3',
        effect: { permanent: { _潜力: 0.3 } },
        description: '永久提升0.3点潜力值（传说级）',
      },
      {
        id: 'con_p_7',
        name: '战斗本能觉醒剂',
        icon: 'fas fa-fist-raised',
        price: 12000,
        category: 'consumable',
        combatOnly: false,
        effectText: '性斗力成算+2',
        effect: { permanentBonus: { 基础性斗力成算: 2 } },
        description: '永久提升2点基础性斗力成算',
      },
      {
        id: 'con_p_8',
        name: '意志强化精华',
        icon: 'fas fa-shield-alt',
        price: 12000,
        category: 'consumable',
        combatOnly: false,
        effectText: '忍耐力成算+2',
        effect: { permanentBonus: { 基础忍耐力成算: 2 } },
        description: '永久提升2点基础忍耐力成算',
      },
      {
        id: 'con_p_lucky_envelope',
        name: '幸运红包',
        icon: 'fas fa-envelope',
        price: 888,
        category: 'consumable',
        combatOnly: false,
        effectText: '随机属性+1 或 随机天海信用点',
        effect: { luckyEnvelope: true },
        description: '象征好运的红包，有概率获得随机永久属性提升+1或随机天海信用点',
      },
    ],
  },
  {
    type: 'special_battle',
    name: '特殊战斗道具',
    icon: 'fas fa-medal',
    items: [
      {
        id: 'con_s_medal_muxinlan',
        name: '刻有沐芯兰名字的三好学生荣誉勋章',
        icon: 'fas fa-medal',
        price: 99999999999999,
        category: 'consumable',
        combatOnly: true,
        effectText: '跳过沐芯兰第二阶段',
        effect: {},
        description: '仅在与沐芯兰的战斗中可用：第一阶段使用后，将在阶段转换时跳过第二阶段，直接进入第三阶段。',
      },
    ],
  },
];

const visibleConsumableSubCategories = computed(() => {
  if (isSpecialBattleUnlocked.value) return consumableSubCategories;
  return consumableSubCategories.filter(sc => sc.type !== 'special_battle');
});
// 地图店面与手机补给站使用同一份商品、折扣和购买处理。
const storefrontCatalog = computed(() => [
  ...allEquipments.map(item => ({ ...item, shelf: 'equipment', key: `equipment:${item.name}` })),
  ...visibleConsumableSubCategories.value.flatMap(group =>
    group.items.map(item => ({ ...item, shelf: group.type, key: item.id })),
  ),
]);

const wheelAEquipmentPool = allEquipments.filter(item => item.grade === 'A');
const wheelSEquipmentPool = allEquipments.filter(item => item.grade === 'S');
const wheelSSEquipmentPool = allEquipments.filter(item => item.grade === 'SS');
const wheelSSSEquipmentPool = GRAND_WHEEL_SSS_EQUIPMENT_ITEMS.map(item => ({
  name: item.name,
  slot: item.slot,
  icon: item.icon,
  price: 0,
  category: 'equipment',
  grade: item.grade,
  gender: '通用',
  attrFocus: item.attrFocus,
  description: item.description,
  bonuses: item.bonuses,
}));
const wheelItemPool: any[] = consumableSubCategories
  .filter(subCat => ['recovery', 'combat_debuff'].includes(subCat.type))
  .flatMap(subCat => subCat.items as any[]);
const wheelTempBuffPool: any[] = (consumableSubCategories.find(subCat => subCat.type === 'temp_buff')?.items ??
  []) as any[];

const wheelTypes = [
  { id: 'basic' as WheelType, name: '基础转盘', icon: 'fas fa-dice-one' },
  { id: 'advanced' as WheelType, name: '进阶转盘', icon: 'fas fa-dice-three' },
  { id: 'grand' as WheelType, name: '大转盘', icon: 'fas fa-crown' },
];

const wheelConfigs: Record<WheelType, WheelConfig> = {
  basic: {
    id: 'basic',
    name: '基础转盘',
    icon: 'fas fa-dice-one',
    currency: 'gold',
    singleCost: 1000,
    tenCost: 9000,
    segments: [
      { id: 'basic_exp', label: '经验', color: '#3b82f6', weight: 30, rewardDesc: '随机经验值' },
      { id: 'basic_gold', label: '天海信用点', color: '#f59e0b', weight: 38, rewardDesc: '随机天海信用点' },
      {
        id: 'basic_recovery',
        label: '道具',
        color: '#14b8a6',
        weight: 12,
        rewardDesc: '恢复或战斗干扰道具随机一件',
      },
      {
        id: 'basic_temp',
        label: '临时强化',
        color: '#8b5cf6',
        weight: 12,
        rewardDesc: '临时状态提升用品随机一件',
      },
      { id: 'basic_exp_rare', label: '大量经验', color: '#ec4899', weight: 5, rare: true, rewardDesc: '高额经验值' },
      { id: 'basic_gold_rare', label: '天海信用点暴击', color: '#f97316', weight: 3, rare: true, rewardDesc: '高额天海信用点' },
    ],
  },
  advanced: {
    id: 'advanced',
    name: '进阶转盘',
    icon: 'fas fa-dice-three',
    currency: 'gold',
    singleCost: 5000,
    tenCost: 45000,
    segments: [
      {
        id: 'advanced_a_equipment',
        label: 'A级装备',
        color: '#8b5cf6',
        weight: 26,
        rewardDesc: '随机A级装备',
      },
      {
        id: 'advanced_s_equipment',
        label: 'S级装备',
        color: '#f59e0b',
        weight: 11,
        rewardDesc: '随机S级装备',
      },
      {
        id: 'advanced_bonus',
        label: '永久加算',
        color: '#0ea5e9',
        weight: 20,
        rewardDesc: '随机魅力/幸运/基础性斗力/基础忍耐力加算',
      },
      {
        id: 'advanced_gold',
        label: '天海信用点奖励',
        color: '#f97316',
        weight: 19,
        rewardDesc: '随机天海信用点',
      },
      {
        id: 'advanced_skill',
        label: '技能点',
        color: '#22c55e',
        weight: 15,
        rewardDesc: '随机技能点',
      },
      {
        id: 'advanced_ticket',
        label: '抽奖卷',
        color: '#ec4899',
        weight: 9,
        rare: true,
        rewardDesc: '随机抽奖卷',
      },
    ],
  },
  grand: {
    id: 'grand',
    name: '大转盘',
    icon: 'fas fa-crown',
    currency: 'ticket',
    singleCost: 1,
    tenCost: 10,
    segments: [
      {
        id: 'grand_s_equipment',
        label: 'S级装备',
        color: '#f59e0b',
        weight: 25,
        rewardDesc: '随机S级装备',
      },
      {
        id: 'grand_ss_equipment',
        label: 'SS级装备',
        color: '#ec4899',
        weight: 13,
        rare: true,
        rewardDesc: '随机SS级装备',
      },
      {
        id: 'grand_sss_equipment',
        label: 'SSS装备',
        color: '#d4af37',
        weight: GRAND_WHEEL_SSS_BASE_WEIGHT,
        rare: true,
        rewardDesc: '随机SSS装备',
      },
      {
        id: 'grand_attr',
        label: '属性点',
        color: '#3b82f6',
        weight: 21,
        rewardDesc: '随机属性点',
      },
      {
        id: 'grand_potential',
        label: '潜力提升',
        color: '#14b8a6',
        weight: 18,
        rewardDesc: '随机潜力提升',
      },
      {
        id: 'grand_fetish',
        label: '色情性癖',
        color: '#8b5cf6',
        weight: 20,
        rare: true,
        rewardDesc: '随机色情性癖永久状态',
      },
    ],
  },
};

const activeWheelType = ref<WheelType>('basic');
const wheelRotation = ref(0);
const wheelLastResultText = ref('');
const wheelSssEffect = ref<WheelSssEffectState | null>(null);
const isWheelDrawing = ref(false);
const isPurchasing = ref(false);
const fetishDecisionModalVisible = ref(false);
const pendingFetishDecision = ref<FetishEntry | null>(null);
const fetishDecisionResolver = ref<((choice: FetishDecision) => void) | null>(null);
let wheelSssEffectTimer: ReturnType<typeof setTimeout> | null = null;

const currentWheelConfig = computed(() => wheelConfigs[activeWheelType.value]);
const luckyRareMultiplier = computed(() => {
  const luck = getPlayerDerivedStats(props.characterData || {}).luck;
  return getRareMultiplierByLuck(luck);
});
const totalLotteryTickets = computed(() => {
  return getTicketCountFromBackpack(props.characterData.物品系统?.背包 || {});
});
const singleDrawCostLabel = computed(() => {
  const config = currentWheelConfig.value;
  return config.currency === 'gold' ? `${config.singleCost} 天海信用点` : `${config.singleCost} 抽奖卷`;
});
const tenDrawCostLabel = computed(() => {
  const config = currentWheelConfig.value;
  return config.currency === 'gold' ? `${config.tenCost} 天海信用点` : `${config.tenCost} 抽奖卷`;
});
const canDrawSingle = computed(() => {
  if (isWheelDrawing.value || isPurchasing.value) return false;
  const config = currentWheelConfig.value;
  if (config.currency === 'gold') return goldCoins.value >= config.singleCost;
  return totalLotteryTickets.value >= config.singleCost;
});
const canDrawTen = computed(() => {
  if (isWheelDrawing.value || isPurchasing.value) return false;
  const config = currentWheelConfig.value;
  if (config.currency === 'gold') return goldCoins.value >= config.tenCost;
  return totalLotteryTickets.value >= config.tenCost;
});
const wheelProbabilityRows = computed(() =>
  buildWheelSegmentProbabilities(currentWheelConfig.value.segments, luckyRareMultiplier.value),
);
const wheelDiscStyle = computed(() => {
  return {
    transform: `rotate(${wheelRotation.value}deg)`,
  };
});
const wheelSegmentPaths = computed(() => {
  const segments = currentWheelConfig.value.segments;
  const segmentAngle = 360 / segments.length;
  return segments.map((segment, index) => {
    const startAngle = index * segmentAngle;
    const endAngle = (index + 1) * segmentAngle;
    return {
      id: segment.id,
      color: segment.color,
      rare: segment.rare,
      d: describeWheelSegment(100, 100, 96, startAngle, endAngle),
    };
  });
});
const wheelSeparatorLines = computed(() => {
  const segments = currentWheelConfig.value.segments;
  const segmentAngle = 360 / segments.length;
  return segments.map((segment, index) => {
    const point = polarToPoint(100, 100, 96, index * segmentAngle);
    return {
      id: `${segment.id}_separator`,
      x: point.x.toFixed(3),
      y: point.y.toFixed(3),
    };
  });
});
const pendingFetishBonusRows = computed(() => {
  if (!pendingFetishDecision.value) return [];
  return Object.entries(pendingFetishDecision.value.bonuses).map(([key, value]) => ({
    key,
    value: Number(value) || 0,
  }));
});
const pendingFetishAlignmentLabel = computed(() => {
  const align = pendingFetishDecision.value?.alignment;
  if (align === 'M') return '抖M';
  if (align === 'S') return '抖S';
  return '可切换';
});

function getWheelSegmentLabelStyle(index: number, segmentCount: number) {
  const segmentAngle = 360 / segmentCount;
  const centerAngle = ((index * segmentAngle + segmentAngle / 2) * Math.PI) / 180;
  return {
    left: `${50 + Math.sin(centerAngle) * 32}%`,
    top: `${50 - Math.cos(centerAngle) * 32}%`,
    transform: 'translate(-50%, -50%)',
  };
}

function polarToPoint(cx: number, cy: number, radius: number, angleDeg: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function describeWheelSegment(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToPoint(cx, cy, radius, startAngle);
  const end = polarToPoint(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

function getBaseSegmentWeight(segment: WheelSegment): number {
  const rawWeight = Number(segment.weight) || 0;
  if (rawWeight <= 0) return 0;
  return segment.rare ? rawWeight * RARE_WEIGHT_FACTOR : rawWeight;
}

function getDrawSegmentWeight(segment: WheelSegment, rareMultiplier: number): number {
  const baseWeight = getBaseSegmentWeight(segment);
  if (baseWeight <= 0) return 0;
  return segment.rare ? baseWeight * rareMultiplier : baseWeight;
}

function buildWheelSegmentProbabilities(segments: WheelSegment[], rareMultiplier: number): WheelProbabilityRow[] {
  const weightRows = segments.map(segment => ({
    segment,
    weight: getDrawSegmentWeight(segment, rareMultiplier),
  }));
  const totalWeight = weightRows.reduce((sum, row) => sum + row.weight, 0);

  return weightRows.map(row => {
    const probability = totalWeight > 0 ? (row.weight / totalWeight) * 100 : 0;
    return {
      segment: row.segment,
      probability,
      probabilityText: `${probability.toFixed(2)}%`,
    };
  });
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomFetish(previousName?: string): FetishEntry {
  if (!previousName) return pickRandom(grandWheelFetishPool);
  const candidates = grandWheelFetishPool.filter(fetish => fetish.name !== previousName);
  if (candidates.length <= 0) return pickRandom(grandWheelFetishPool);
  return pickRandom(candidates);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clearWheelSssEffectTimer() {
  if (!wheelSssEffectTimer) return;
  clearTimeout(wheelSssEffectTimer);
  wheelSssEffectTimer = null;
}

function triggerWheelSssEffect(itemNames: string[]) {
  clearWheelSssEffectTimer();
  wheelSssEffect.value = {
    title: itemNames.length > 1 ? `SSS装备命中 x${itemNames.length}` : 'SSS装备命中',
    itemText: itemNames.join('、'),
  };
  wheelSssEffectTimer = setTimeout(() => {
    wheelSssEffect.value = null;
    wheelSssEffectTimer = null;
  }, 3600);
}

function openFetishDecisionModal(fetish: FetishEntry): Promise<FetishDecision> {
  pendingFetishDecision.value = fetish;
  fetishDecisionModalVisible.value = true;
  return new Promise(resolve => {
    fetishDecisionResolver.value = resolve;
  });
}

function handleFetishDecision(choice: FetishDecision) {
  const resolver = fetishDecisionResolver.value;
  fetishDecisionResolver.value = null;
  fetishDecisionModalVisible.value = false;
  if (resolver) resolver(choice);
}

function ensureShopStatData(statData: any) {
  if (!statData.角色基础) statData.角色基础 = {};
  if (!statData.核心状态) statData.核心状态 = {};
  if (!statData.基础属性) statData.基础属性 = {};
  ensurePermanentStatusContainer(statData);
  if (!statData.物品系统) statData.物品系统 = {};
  if (!statData.物品系统.背包) statData.物品系统.背包 = {};
  if (typeof statData.物品系统._天海信用点 !== 'number') {
    statData.物品系统._天海信用点 = Number(statData.物品系统._天海信用点 || 0);
  }
}

function isLotteryTicket(itemName: string): boolean {
  return itemName.includes('抽奖卷') || itemName.includes('抽奖券');
}

function getTicketCountFromBackpack(backpack: Record<string, any>): number {
  return Object.entries(backpack).reduce((total, [itemName, itemData]) => {
    if (!isLotteryTicket(itemName)) return total;
    return total + Math.max(0, Number(itemData?.数量 || 0));
  }, 0);
}

function consumeLotteryTickets(backpack: Record<string, any>, needed: number): boolean {
  const available = getTicketCountFromBackpack(backpack);
  if (available < needed) return false;

  let remain = needed;
  const ticketKeys = Object.keys(backpack)
    .filter(isLotteryTicket)
    .sort((a, b) => a.localeCompare(b));
  for (const key of ticketKeys) {
    if (remain <= 0) break;
    const item = backpack[key];
    const quantity = Math.max(0, Number(item?.数量 || 0));
    if (quantity <= 0) continue;

    const consume = Math.min(quantity, remain);
    item.数量 = quantity - consume;
    if (item.数量 <= 0) {
      delete backpack[key];
    }
    remain -= consume;
  }

  return remain <= 0;
}

function addLotteryTickets(backpack: Record<string, any>, quantity: number) {
  const ticketKey = '幸运抽奖卷';
  const existing = backpack[ticketKey];
  if (existing) {
    existing.数量 = (existing.数量 || 0) + quantity;
    return;
  }
  backpack[ticketKey] = {
    类型: '其他',
    等级: 'A',
    描述: '可用于商店大转盘抽奖',
    数量: quantity,
  };
}

function addEquipmentToBackpack(statData: any, equipment: any) {
  const itemData = {
    类型: '装备',
    等级: equipment.grade,
    描述: equipment.description,
    加成属性: equipment.bonuses || {},
    部位: getSlotType(equipment.slot),
  };
  const existing = statData.物品系统.背包[equipment.name];
  if (existing && typeof existing === 'object' && existing.类型 === '装备') {
    const currentQuantity = Math.max(1, Number(existing.数量 ?? 1) || 1);
    statData.物品系统.背包[equipment.name] = {
      ...existing,
      ...itemData,
      数量: currentQuantity + 1,
    };
    return;
  }

  statData.物品系统.背包[equipment.name] = {
    ...itemData,
    数量: 1,
  };
}

function isOwnedInventoryEntry(entry: any): boolean {
  if (!entry) return false;
  if (typeof entry !== 'object') return true;
  const quantity = Number(entry.数量 ?? 1);
  return !Number.isFinite(quantity) || quantity > 0;
}

function isEquipmentOwned(statData: any, equipmentName: string): boolean {
  const backpack = statData?.物品系统?.背包;
  if (backpack && typeof backpack === 'object') {
    const directEntry = backpack[equipmentName];
    if (isOwnedInventoryEntry(directEntry)) return true;

    const hasNamedEntry = Object.values(backpack).some((entry: any) => {
      if (!isOwnedInventoryEntry(entry)) return false;
      return String(entry?.名称 || entry?.name || '') === equipmentName;
    });
    if (hasNamedEntry) return true;
  }

  const equipmentSlots = statData?.物品系统?._装备栏;
  if (equipmentSlots && typeof equipmentSlots === 'object') {
    return Object.values(equipmentSlots).some((slot: any) => String(slot?.名称 || slot?.name || '') === equipmentName);
  }

  return false;
}

function pickWheelSSSEquipmentReward(statData: any) {
  const missingPool = wheelSSSEquipmentPool.filter(equipment => !isEquipmentOwned(statData, equipment.name));
  return pickRandom(missingPool.length > 0 ? missingPool : wheelSSSEquipmentPool);
}

function syncConsumableDefinition(entry: any, consumable: any, description = consumable.description) {
  entry.类型 = '消耗品';
  entry.等级 ??= 'C';
  entry.描述 = description;
  entry.战斗用品 = consumable.combatOnly || false;

  delete entry.耐力增加;
  delete entry.快感降低;
  delete entry.快感增加;
  delete entry.加成属性;
  delete entry.战斗效果列表;
  if (consumable.effect?.staminaRestore !== undefined) entry.耐力增加 = consumable.effect.staminaRestore;
  if (consumable.effect?.pleasureReduce !== undefined) entry.快感降低 = consumable.effect.pleasureReduce;
  if (consumable.effect?.pleasureIncrease !== undefined) entry.快感增加 = consumable.effect.pleasureIncrease;
  if (consumable.effect?.buff) entry.加成属性 = consumable.effect.buff;
  if (consumable.effect?.battleEffects) entry.战斗效果列表 = consumable.effect.battleEffects;
}

function addConsumableToBackpack(statData: any, consumable: any, quantity: number) {
  const existing = statData.物品系统.背包[consumable.name];
  if (existing) {
    syncConsumableDefinition(existing, consumable);
    existing.数量 = (existing.数量 || 0) + quantity;
    return;
  }

  const data: any = {
    数量: quantity,
  };
  syncConsumableDefinition(data, consumable);

  statData.物品系统.背包[consumable.name] = data;
}

function addPermanentBonus(statData: any, key: string, value: number) {
  if (!BONUS_KEYS.includes(key as BonusKey)) return;
  addPermanentNumericBonuses(statData, { [key]: value });
}

function addPermanentState(statData: any, stateName: string, bonus: Record<string, any> = {}, description = '') {
  const statusList = ensurePermanentStatusContainer(statData);
  const current = statusList[stateName] || { 加成: createEmptyBonusStats(), 描述: description };
  statusList[stateName] = {
    加成: {
      ...createEmptyBonusStats(),
      ...normalizeBonusStats(current.加成),
      ...normalizeBonusStats(bonus),
    },
    描述: description || current.描述 || '',
  };
}

async function resolveFetishReward(initialFetish: FetishEntry): Promise<{ text: string; keptFetish?: FetishEntry }> {
  let current = initialFetish;
  while (true) {
    const choice = await openFetishDecisionModal(current);
    if (choice === 'discard') {
      pendingFetishDecision.value = null;
      return { text: `放弃永久状态「${current.name}」` };
    }
    if (choice === 'keep') {
      pendingFetishDecision.value = null;
      return { text: `永久状态「${current.name}」`, keptFetish: current };
    }
    current = pickRandomFetish(current.name);
    if (typeof toastr !== 'undefined') {
      toastr.info(`已重roll：${current.name}`, '性癖重roll');
    }
  }
}

function getRareMultiplierByLuck(luck: number): number {
  const normalizedLuck = Math.max(0, Math.min(200, Number(luck) || 0));
  return 1 + normalizedLuck / 200;
}

function rollWheelSegment(segments: WheelSegment[], rareMultiplier: number): WheelSegment {
  const weightedList = segments.map(segment => ({
    ...segment,
    adjustedWeight: getDrawSegmentWeight(segment, rareMultiplier),
  }));
  const totalWeight = weightedList.reduce((sum, segment) => sum + segment.adjustedWeight, 0);
  let random = Math.random() * totalWeight;

  for (const segment of weightedList) {
    random -= segment.adjustedWeight;
    if (random <= 0) return segment;
  }

  return weightedList[weightedList.length - 1];
}

function spinWheelToSegment(segmentId: WheelSegmentId, segments: WheelSegment[], isTenDraw: boolean) {
  const segmentIndex = segments.findIndex(segment => segment.id === segmentId);
  if (segmentIndex < 0) return;

  const segmentAngle = 360 / segments.length;
  const centerAngle = segmentIndex * segmentAngle + segmentAngle / 2;
  const normalizedCurrent = ((wheelRotation.value % 360) + 360) % 360;
  const normalizedTarget = (360 - centerAngle) % 360;
  const rounds = isTenDraw ? 9 : 6;
  const delta = ((normalizedTarget - normalizedCurrent + 360) % 360) + rounds * 360;
  wheelRotation.value += delta;
}

function applyWheelReward(segmentId: WheelSegmentId, mvuData: Mvu.MvuData): WheelRewardResult {
  const statData = mvuData.stat_data;
  switch (segmentId) {
    case 'basic_exp': {
      const exp = randomInt(25, 50);
      grantExperience(mvuData, exp);
      return { text: `经验值 +${exp}` };
    }
    case 'basic_gold': {
      const gold = randomInt(800, 1800);
      creditMoney(mvuData, gold, 'lottery');
      return { text: `天海信用点 +${gold}` };
    }
    case 'basic_recovery': {
      if (wheelItemPool.length <= 0) return { text: '道具池为空' };
      const reward = pickRandom(wheelItemPool);
      addConsumableToBackpack(statData, reward, 1);
      return { text: `道具「${reward.name}」 x1` };
    }
    case 'basic_temp': {
      if (wheelTempBuffPool.length <= 0) return { text: '临时状态提升池为空' };
      const reward = pickRandom(wheelTempBuffPool);
      addConsumableToBackpack(statData, reward, 1);
      return { text: `临时强化「${reward.name}」 x1` };
    }
    case 'basic_exp_rare': {
      const exp = randomInt(75, 175);
      grantExperience(mvuData, exp);
      return { text: `大量经验 +${exp}` };
    }
    case 'basic_gold_rare': {
      const gold = randomInt(2000, 5000);
      creditMoney(mvuData, gold, 'lottery');
      return { text: `天海信用点暴击 +${gold}` };
    }
    case 'advanced_a_equipment': {
      if (wheelAEquipmentPool.length <= 0) return { text: 'A级装备池为空' };
      const reward = pickRandom(wheelAEquipmentPool);
      addEquipmentToBackpack(statData, reward);
      return { text: `A级装备「${reward.name}」` };
    }
    case 'advanced_s_equipment': {
      if (wheelSEquipmentPool.length <= 0) return { text: 'S级装备池为空' };
      const reward = pickRandom(wheelSEquipmentPool);
      addEquipmentToBackpack(statData, reward);
      return { text: `S级装备「${reward.name}」` };
    }
    case 'advanced_bonus': {
      const bonusPool = [
        { key: '魅力加成', label: '魅力加成' },
        { key: '幸运加成', label: '幸运加成' },
        { key: '基础性斗力加成', label: '基础性斗力加成' },
        { key: '基础忍耐力加成', label: '基础忍耐力加成' },
      ];
      const reward = pickRandom(bonusPool);
      const value = randomInt(1, 5);
      addPermanentBonus(statData, reward.key, value);
      return { text: `${reward.label} +${value}` };
    }
    case 'advanced_gold': {
      const gold = randomInt(4000, 10000);
      creditMoney(mvuData, gold, 'lottery');
      return { text: `天海信用点 +${gold}` };
    }
    case 'advanced_skill': {
      const skillPoint = randomInt(1, 3);
      statData.核心状态.$技能点 = (statData.核心状态.$技能点 || 0) + skillPoint;
      return { text: `技能点 +${skillPoint}` };
    }
    case 'advanced_ticket': {
      const ticketCount = randomInt(1, 2);
      addLotteryTickets(statData.物品系统.背包, ticketCount);
      return { text: `抽奖卷 +${ticketCount}` };
    }
    case 'grand_s_equipment': {
      if (wheelSEquipmentPool.length <= 0) return { text: 'S级装备池为空' };
      const reward = pickRandom(wheelSEquipmentPool);
      addEquipmentToBackpack(statData, reward);
      return { text: `S级装备「${reward.name}」` };
    }
    case 'grand_ss_equipment': {
      if (wheelSSEquipmentPool.length <= 0) return { text: 'SS级装备池为空' };
      const reward = pickRandom(wheelSSEquipmentPool);
      addEquipmentToBackpack(statData, reward);
      return { text: `SS级装备「${reward.name}」` };
    }
    case 'grand_sss_equipment': {
      if (wheelSSSEquipmentPool.length <= 0) return { text: 'SSS装备池为空' };
      const reward = pickWheelSSSEquipmentReward(statData);
      addEquipmentToBackpack(statData, reward);
      return { text: `SSS装备「${reward.name}」`, specialEffect: 'sssEquipment', itemName: reward.name };
    }
    case 'grand_attr': {
      const attrPoint = randomInt(1, 3);
      statData.核心状态.$属性点 = (statData.核心状态.$属性点 || 0) + attrPoint;
      return { text: `属性点 +${attrPoint}` };
    }
    case 'grand_potential': {
      const increaseOptions = [0.1, 0.2, 0.3];
      const increase = pickRandom(increaseOptions);
      const current = Number(statData.核心状态._潜力 || 5);
      const next = Math.min(10, Number((current + increase).toFixed(2)));
      const actualIncrease = Number((next - current).toFixed(2));
      statData.核心状态._潜力 = next;
      if (actualIncrease <= 0) return { text: '潜力已达上限' };
      return { text: `潜力 +${actualIncrease.toFixed(2)}` };
    }
    case 'grand_fetish': {
      const fetish = pickRandomFetish();
      return {
        text: `性癖候选「${fetish.name}」`,
        pendingFetish: fetish,
      };
    }
    default:
      return { text: '未命中奖励' };
  }
}

async function drawWheel(times: 1 | 10) {
  if (isWheelDrawing.value || isPurchasing.value) return;

  const isTenDraw = times === 10;

  isWheelDrawing.value = true;
  clearWheelSssEffectTimer();
  wheelSssEffect.value = null;
  try {
    const drawResults: Array<{ segment: WheelSegment } & WheelRewardResult> = [];
    const pendingFetishRewards: Array<{ resultIndex: number; fetish: FetishEntry }> = [];
    let drawnSegments: WheelSegment[] = [];

    await runLatestMvuTransaction('商店转盘抽取', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData || !mvuData.stat_data) return;

      ensureShopStatData(mvuData.stat_data);
      const config = currentWheelConfig.value;
      const cost = isTenDraw ? config.tenCost : config.singleCost;
      drawnSegments = config.segments;

      if (config.currency === 'gold') {
        if ((mvuData.stat_data.物品系统._天海信用点 || 0) < cost) {
          if (typeof toastr !== 'undefined') toastr.error('天海信用点不足，无法抽奖', '抽奖失败');
          return;
        }
        debitMoney(mvuData, cost, 'lottery');
      } else if (!consumeLotteryTickets(mvuData.stat_data.物品系统.背包, cost)) {
        if (typeof toastr !== 'undefined') toastr.error('抽奖卷不足，无法抽奖', '抽奖失败');
        return;
      }

      const luck = getPlayerDerivedStats(mvuData.stat_data || {}).luck;
      const rareMultiplier = getRareMultiplierByLuck(luck);

      for (let i = 0; i < times; i++) {
        const hitSegment = rollWheelSegment(config.segments, rareMultiplier);
        const rewardResult = applyWheelReward(hitSegment.id, mvuData);
        drawResults.push({ segment: hitSegment, ...rewardResult });
        if (rewardResult.pendingFetish) {
          pendingFetishRewards.push({ resultIndex: i, fetish: rewardResult.pendingFetish });
        }
      }

      // 先提交扣费和不依赖用户选择的奖励，避免动画阻塞其他 MVU 操作。
      await replaceLatestMvuData(mvuData);
    });

    if (drawResults.length === 0 || drawnSegments.length === 0) return;

    spinWheelToSegment(drawResults[0].segment.id, drawnSegments, isTenDraw);
    await delay(isTenDraw ? 2600 : 2200);

    const keptFetishes: FetishEntry[] = [];
    for (const pending of pendingFetishRewards) {
      const resolved = await resolveFetishReward(pending.fetish);
      drawResults[pending.resultIndex].text = resolved.text;
      if (resolved.keptFetish) {
        keptFetishes.push(resolved.keptFetish);
      }
    }

    if (keptFetishes.length > 0) {
      await runLatestMvuTransaction('保存转盘性癖奖励', async () => {
        const mvuData = await getLatestMvuData();
        if (!mvuData?.stat_data) return;

        ensureShopStatData(mvuData.stat_data);
        for (const fetish of keptFetishes) {
          addPermanentState(mvuData.stat_data, fetish.name, fetish.bonuses, '商店大转盘获得的永久状态');
        }
        await replaceLatestMvuData(mvuData);
      });
    }

    const previewText = drawResults.map(result => result.text).join('、');
    wheelLastResultText.value = isTenDraw ? `十连结果：${previewText}` : `获得：${drawResults[0].text}`;
    const sssRewardNames = drawResults
      .filter(result => result.specialEffect === 'sssEquipment' && result.itemName)
      .map(result => result.itemName as string);
    if (sssRewardNames.length > 0) {
      triggerWheelSssEffect(sssRewardNames);
    }

    const rareCount = drawResults.filter(result => result.segment.rare).length;
    if (typeof toastr !== 'undefined') {
      const summary =
        drawResults.length <= 5
          ? previewText
          : `${drawResults
              .slice(0, 5)
              .map(result => result.text)
              .join('、')}...`;
      toastr.success(`${summary}${rareCount > 0 ? `（稀有命中 ${rareCount} 次）` : ''}`, '抽奖完成');
    }
  } catch (error) {
    console.error('[商店] 抽奖失败:', error);
    if (typeof toastr !== 'undefined') toastr.error('抽奖失败，请重试', '错误');
  } finally {
    fetishDecisionModalVisible.value = false;
    pendingFetishDecision.value = null;
    fetishDecisionResolver.value = null;
    isWheelDrawing.value = false;
  }
}

// 选择物品
function selectItem(item: any) {
  selectedItem.value = item;
  purchaseQuantity.value = 1;
}

// 获取物品等级样式
function getItemGradeClass(item: any) {
  if (item.grade) return 'grade-' + item.grade.toLowerCase();
  if (item.tier) return 'tier-' + item.tier;
  return '';
}

// 购买物品
async function purchaseItem() {
  if (isPurchasing.value || isWheelDrawing.value || !selectedItem.value) return;

  const item = selectedItem.value;
  isPurchasing.value = true;

  try {
    await runLatestMvuTransaction('商店购买', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData || !mvuData.stat_data) return;

      // 确保物品系统存在
      if (!mvuData.stat_data.物品系统) mvuData.stat_data.物品系统 = {};
      if (!mvuData.stat_data.物品系统.背包) mvuData.stat_data.物品系统.背包 = {};

      let quantity = purchaseQuantity.value;

      // 永久提升类购买保护（潜力上限、禁购阈值、批量购买不浪费）
      if (
        item.category === 'consumable' &&
        item.effect?.permanent &&
        Object.prototype.hasOwnProperty.call(item.effect.permanent, '_潜力')
      ) {
        if (!mvuData.stat_data.核心状态) mvuData.stat_data.核心状态 = {};
        const currentPotentialRaw = mvuData.stat_data.核心状态._潜力 ?? 0;
        const currentPotential = Number(currentPotentialRaw) || 0;
        const delta = Number(item.effect.permanent._潜力) || 0;

        if (item.id === 'con_p_6' && currentPotential >= 9.8) {
          if (typeof toastr !== 'undefined') {
            toastr.warning('潜力已接近上限（>=9.8），无法购买高级潜力觉醒药', '购买限制');
          }
          return;
        }
        if (item.id === 'con_p_5' && currentPotential >= 10) {
          if (typeof toastr !== 'undefined') {
            toastr.warning('潜力已达上限（10），无法购买潜力觉醒药', '购买限制');
          }
          return;
        }

        const remaining = Math.max(0, 10 - currentPotential);
        const maxUsable = delta > 0 ? Math.floor((remaining + 1e-9) / delta) : 0;

        if (maxUsable <= 0) {
          if (typeof toastr !== 'undefined') {
            toastr.warning('潜力提升空间不足，本次购买不会产生收益', '购买限制');
          }
          return;
        }

        if (quantity > maxUsable) {
          quantity = maxUsable;
          if (typeof toastr !== 'undefined') {
            toastr.info(`潜力最高为10，已自动将购买数量调整为 ${quantity}`, '数量调整');
          }
        }
      }

      const discountedUnitPrice = getDiscountedPrice(item);
      const totalPrice = discountedUnitPrice * quantity;
      const currentGold = Number(mvuData.stat_data.物品系统._天海信用点 || 0);
      if (currentGold < totalPrice) {
        if (typeof toastr !== 'undefined') {
          toastr.error('天海信用点不足！', '购买失败');
        }
        return;
      }

      // 扣除天海信用点（按折扣后价格扣费）
      debitMoney(mvuData, totalPrice, 'shopping');

      // 根据物品类型处理
      if (item.category === 'equipment') {
        addEquipmentToBackpack(mvuData.stat_data, item);
      } else if (item.category === 'gift') {
        // 礼物类：添加到背包（使用name作为key）
        const itemKey = item.name;
        const existing = mvuData.stat_data.物品系统.背包[itemKey];
        if (existing) {
          existing.数量 = (existing.数量 || 0) + quantity;
        } else {
          mvuData.stat_data.物品系统.背包[itemKey] = {
            类型: '其他',
            等级: 'C',
            描述: item.description,
            数量: quantity,
          };
        }
      } else if (item.category === 'consumable') {
        // 消耗品类（使用name作为key）
        const itemKey = item.id === 'con_s_medal_muxinlan' ? 'honor_medal_muxinlan' : item.name;
        const existing = mvuData.stat_data.物品系统.背包[itemKey];

        if (existing) {
          syncConsumableDefinition(
            existing,
            item,
            item.id === 'con_s_medal_muxinlan' ? '刻有沐芯兰名字的三好学生荣誉勋章' : item.description,
          );
          existing.数量 = (existing.数量 || 0) + quantity;
        } else {
          const consumableData: any = {
            类型: '消耗品',
            等级: 'C',
            描述: item.id === 'con_s_medal_muxinlan' ? '刻有沐芯兰名字的三好学生荣誉勋章' : item.description,
            战斗用品: item.combatOnly || false,
            数量: quantity,
          };

          // 添加效果
          if (item.effect) {
            if (item.effect.staminaRestore) consumableData.耐力增加 = item.effect.staminaRestore;
            if (item.effect.pleasureReduce) consumableData.快感降低 = item.effect.pleasureReduce;
            if (item.effect.pleasureIncrease) consumableData.快感增加 = item.effect.pleasureIncrease;
            // 临时buff：存入背包的加成属性，在战斗中使用时才写入临时状态
            if (item.effect.buff) consumableData.加成属性 = item.effect.buff;
            if (item.effect.battleEffects) consumableData.战斗效果列表 = item.effect.battleEffects;

            // 幸运红包特殊处理：随机属性+1 或 随机天海信用点
            if (item.effect.luckyEnvelope) {
              if (!mvuData.stat_data.核心状态) mvuData.stat_data.核心状态 = {};
              if (!mvuData.stat_data.基础属性) mvuData.stat_data.基础属性 = {};
              const results: string[] = [];
              for (let i = 0; i < quantity; i++) {
                const roll = Math.random();
                if (roll < 0.5) {
                  // 50% 概率：随机属性+1
                  const statPool = [
                    { key: '基础性斗力成算', label: '性斗力成算', target: 'bonus' },
                    { key: '基础忍耐力成算', label: '忍耐力成算', target: 'bonus' },
                    { key: '_魅力', label: '基础魅力', target: 'base' },
                    { key: '_幸运', label: '基础幸运', target: 'base' },
                  ];
                  const chosen = statPool[Math.floor(Math.random() * statPool.length)];
                  if (chosen.target === 'bonus') {
                    addPermanentBonus(mvuData.stat_data, chosen.key, 1);
                  } else {
                    mvuData.stat_data.基础属性[chosen.key] = (mvuData.stat_data.基础属性[chosen.key] || 0) + 1;
                  }
                  results.push(`${chosen.label}+1`);
                } else {
                  // 50% 概率：随机天海信用点 100~1000
                  const goldReward = Math.floor(Math.random() * 901) + 100;
                  creditMoney(mvuData, goldReward, 'envelope');
                  results.push(`天海信用点+${goldReward}`);
                }
              }
              await replaceLatestMvuData(mvuData);
              if (typeof toastr !== 'undefined') {
                toastr.success(`红包开启：${results.join(', ')}`, '🧧 恭喜发财');
              }
              selectedItem.value = null;
              return;
            }

            if (item.effect.permanent) {
              // 永久提升类：直接应用到持久事实字段
              if (!mvuData.stat_data.核心状态) mvuData.stat_data.核心状态 = {};
              if (!mvuData.stat_data.基础属性) mvuData.stat_data.基础属性 = {};
              const baseAttributeKeyMap: Record<string, string> = {
                魅力: '_魅力',
                幸运: '_幸运',
                闪避率: '_闪避率',
                暴击率: '_暴击率',
              };
              for (const [key, value] of Object.entries(item.effect.permanent)) {
                if (key === '_潜力') {
                  const currentPotentialRaw = mvuData.stat_data.核心状态._潜力 ?? 0;
                  const currentPotential = Number(currentPotentialRaw) || 0;
                  const nextPotential = Math.min(10, currentPotential + (Number(value) || 0) * quantity);
                  mvuData.stat_data.核心状态._潜力 = nextPotential;
                } else if (baseAttributeKeyMap[key]) {
                  const baseKey = baseAttributeKeyMap[key];
                  mvuData.stat_data.基础属性[baseKey] =
                    (mvuData.stat_data.基础属性[baseKey] || 0) + (value as number) * quantity;
                } else {
                  mvuData.stat_data.核心状态[key] =
                    (mvuData.stat_data.核心状态[key] || 0) + (value as number) * quantity;
                }
              }
              // 永久提升不存入背包，直接生效
              await replaceLatestMvuData(mvuData);

              if (typeof toastr !== 'undefined') {
                toastr.success(`永久属性提升成功！`, '购买成功');
              }
              selectedItem.value = null;
              return;
            }

            if (item.effect.permanentBonus) {
              // 永久数值提升直接累加到基础属性。
              for (const [key, value] of Object.entries(item.effect.permanentBonus)) {
                addPermanentBonus(mvuData.stat_data, key, (value as number) * quantity);
              }
              // 永久提升不存入背包，直接生效
              await replaceLatestMvuData(mvuData);

              if (typeof toastr !== 'undefined') {
                toastr.success(`永久属性提升成功！`, '购买成功');
              }
              selectedItem.value = null;
              return;
            }
          }

          mvuData.stat_data.物品系统.背包[itemKey] = consumableData;
        }
      }

      // 写回MVU
      await replaceLatestMvuData(mvuData);

      if (typeof toastr !== 'undefined') {
        toastr.success(`成功购买 ${item.name} x${quantity}`, '购买成功');
      }

      selectedItem.value = null;
    });
  } catch (error) {
    console.error('[商店] 购买失败:', error);
    if (typeof toastr !== 'undefined') {
      toastr.error('购买失败，请重试', '错误');
    }
  } finally {
    isPurchasing.value = false;
  }
}

// 获取装备槽位类型
function getSlotType(slot: string): '主装备' | '副装备' | '饰品' | '特殊装备' {
  const slotMap: Record<string, '主装备' | '副装备' | '饰品' | '特殊装备'> = {
    主装备: '主装备',
    副装备: '副装备',
    饰品: '饰品',
    特殊装备: '特殊装备',
  };
  return slotMap[slot] || '饰品';
}
</script>

<style scoped lang="scss">
.shop-page {
  position: relative;
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.shop-header {
  margin-bottom: 16px;
  position: relative;
}

.special-battle-unlock {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  opacity: 0.08;
  cursor: pointer;
  transition: opacity 0.2s;
}

.special-battle-unlock:hover {
  opacity: 0.2;
}

.gold-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(251, 191, 36, 0.08));
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 16px;
  position: relative;
  backdrop-filter: blur(10px);

  > i {
    font-size: 28px;
    color: var(--sk-warning);
  }

  .gold-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .gold-label {
    font-size: 12px;
    color: var(--sk-muted);
  }

  .gold-value {
    font-size: 26px;
    font-weight: 700;
    color: var(--sk-warning);
  }
}

.shop-detail-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-page-header {
  display: flex;
  align-items: center;
}

.detail-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: var(--sk-soft);
  color: var(--sk-ink);
  cursor: pointer;
}

.detail-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--sk-ink);
}

.detail-page-subtitle {
  font-size: 12px;
  color: var(--sk-muted);
}

.fetish-detail-header {
  justify-content: space-between;
}

.fetish-detail-card {
  max-width: 760px;
}

.shop-detail-card {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1e1e2e, #151520);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
}

.detail-preview {
  margin: 16px;
  margin-bottom: 0;
}

.shop-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-price-summary {
  margin-bottom: 0;
}

.shop-detail-footer {
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(30, 30, 46, 0.98), rgba(21, 21, 32, 0.98));
  backdrop-filter: blur(10px);
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 3px;
  }
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--sk-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  i {
    font-size: 14px;
  }

  &:hover {
    background: var(--sk-soft);
    color: var(--sk-ink);
  }

  &.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: transparent;
    color: var(--sk-ink);
  }
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--sk-soft);
  border-radius: 12px;
  margin-bottom: 16px;
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
  min-width: 36px;
}

.filter-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 4px 10px;
  font-size: 11px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--sk-muted);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--sk-soft);
    color: var(--sk-ink);
  }

  &.active {
    color: var(--sk-ink);

    &.grade-c {
      background: rgba(156, 163, 175, 0.4);
      border-color: #9ca3af;
    }
    &.grade-b {
      background: rgba(96, 165, 250, 0.4);
      border-color: #60a5fa;
    }
    &.grade-a {
      background: rgba(167, 139, 250, 0.4);
      border-color: #a78bfa;
    }
    &.grade-s {
      background: rgba(251, 191, 36, 0.4);
      border-color: #fbbf24;
    }
    &.grade-ss {
      background: rgba(244, 114, 182, 0.4);
      border-color: #f472b6;
    }
  }

  &.slot-btn.active {
    background: rgba(102, 126, 234, 0.4);
    border-color: #667eea;
  }
}

.empty-filter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px;
  color: var(--sk-muted);

  i {
    font-size: 24px;
  }
  span {
    font-size: 13px;
  }
}

.shop-content {
  min-height: 200px;
}

.item-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub-category {
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-grade {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;

  &.grade-c {
    background: rgba(156, 163, 175, 0.3);
    color: var(--sk-muted);
  }
  &.grade-b {
    background: rgba(96, 165, 250, 0.3);
    color: var(--sk-blue);
  }
  &.grade-a {
    background: rgba(167, 139, 250, 0.3);
    color: var(--sk-violet);
  }
  &.grade-s {
    background: rgba(251, 191, 36, 0.3);
    color: var(--sk-warning);
  }
  &.grade-ss {
    background: rgba(244, 114, 182, 0.3);
    color: var(--sk-pink);
  }
}

.sub-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-ink);
  margin-bottom: 12px;

  i {
    font-size: 14px;
  }
}

.grade-badge,
.tier-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.grade-c .grade-badge {
  background: rgba(156, 163, 175, 0.3);
  color: var(--sk-muted);
}
.grade-b .grade-badge {
  background: rgba(96, 165, 250, 0.3);
  color: var(--sk-blue);
}
.grade-a .grade-badge {
  background: rgba(167, 139, 250, 0.3);
  color: var(--sk-violet);
}
.grade-s .grade-badge {
  background: rgba(251, 191, 36, 0.3);
  color: var(--sk-warning);
}
.grade-ss .grade-badge {
  background: rgba(244, 114, 182, 0.3);
  color: var(--sk-pink);
}

.tier-basic .tier-badge {
  background: rgba(156, 163, 175, 0.3);
  color: var(--sk-muted);
}
.tier-fine .tier-badge {
  background: rgba(96, 165, 250, 0.3);
  color: var(--sk-blue);
}
.tier-precious .tier-badge {
  background: rgba(167, 139, 250, 0.3);
  color: var(--sk-violet);
}
.tier-special .tier-badge {
  background: rgba(251, 191, 36, 0.3);
  color: var(--sk-warning);
}

.item-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--sk-soft);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: var(--sk-soft);
    transform: translateX(4px);
  }

  &.grade-c {
    border-left: 3px solid #9ca3af;
  }
  &.grade-b {
    border-left: 3px solid #60a5fa;
  }
  &.grade-a {
    border-left: 3px solid #a78bfa;
  }
  &.grade-s {
    border-left: 3px solid #fbbf24;
  }
  &.grade-ss {
    border-left: 3px solid #f472b6;
  }

  &.tier-basic {
    border-left: 3px solid #9ca3af;
  }
  &.tier-fine {
    border-left: 3px solid #60a5fa;
  }
  &.tier-precious {
    border-left: 3px solid #a78bfa;
  }
  &.tier-special {
    border-left: 3px solid #fbbf24;
  }
}

.item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sk-soft);
  border-radius: 10px;

  i {
    font-size: 18px;
    color: var(--sk-ink);
  }
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-type,
.item-effect {
  font-size: 11px;
  color: var(--sk-muted);
}

.item-price {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-warning);

  i {
    font-size: 11px;
  }

  .original-price {
    text-decoration: line-through;
    opacity: 0.5;
    font-size: 11px;
    color: var(--sk-muted);
  }

  .discounted-price {
    color: var(--sk-success);
    font-weight: 700;
  }

  .discount-tag {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: var(--sk-ink);
    font-size: 9px;
    padding: 2px 5px;
    border-radius: 4px;
    font-weight: 700;
    margin-left: 4px;
  }
}

.combat-tag {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 9px;
  padding: 2px 6px;
  background: rgba(239, 68, 68, 0.3);
  color: var(--sk-danger);
  border-radius: 4px;
}

/* 购买弹窗 */
.purchase-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120000;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right))
    max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
}

.modal-content {
  width: 100%;
  max-width: 340px;
  max-height: calc(100dvh - 20px);
  background: linear-gradient(180deg, #1e1e2e, #151520);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--sk-ink);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--sk-soft);
    border: none;
    border-radius: 8px;
    color: var(--sk-muted);
    cursor: pointer;

    &:hover {
      background: var(--sk-soft);
      color: var(--sk-ink);
    }
  }
}

.modal-body {
  padding: 20px;
  min-height: 0;
  overflow-y: auto;
}

.modal-drag-handle {
  cursor: grab;
  user-select: none;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
}

.selected-item-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--sk-soft);
  border-radius: 12px;
  margin-bottom: 16px;
}

.preview-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sk-soft);
  border-radius: 12px;

  i {
    font-size: 22px;
    color: var(--sk-ink);
  }

  &.grade-c {
    border: 2px solid #9ca3af;
  }
  &.grade-b {
    border: 2px solid #60a5fa;
  }
  &.grade-a {
    border: 2px solid #a78bfa;
  }
  &.grade-s {
    border: 2px solid #fbbf24;
  }
  &.grade-ss {
    border: 2px solid #f472b6;
  }
}

.preview-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--sk-ink);
}

.preview-desc {
  font-size: 12px;
  color: var(--sk-muted);
  line-height: 1.4;
}

.item-details {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--sk-soft);
  border-radius: 10px;
}

.detail-title {
  font-size: 12px;
  color: var(--sk-muted);
  margin-bottom: 8px;
}

.bonus-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bonus-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 4px 8px;
  background: var(--sk-soft);
  border-radius: 6px;
}

.bonus-name {
  color: var(--sk-muted);
}

.bonus-value {
  font-weight: 600;

  &.positive {
    color: var(--sk-success);
  }
  &.negative {
    color: var(--sk-danger);
  }
}

.quantity-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;

  .qty-label {
    color: var(--sk-ink);
    font-size: 13px;
  }

  .quantity-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;

    input {
      width: 80px;
      padding: 10px;
      background: var(--sk-soft);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: var(--sk-ink);
      font-size: 16px;
      font-weight: 600;
      text-align: center;

      &:focus {
        outline: none;
        border-color: rgba(139, 92, 246, 0.5);
      }

      /* 隐藏数字输入框的spin按钮 */
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      appearance: textfield;
      -moz-appearance: textfield;
    }
  }

  .qty-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--sk-soft);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: var(--sk-ink);
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--sk-soft);
    }
  }

  .max-hint {
    font-size: 11px;
    color: var(--sk-muted);

    &.insufficient {
      color: var(--sk-danger);
      font-weight: 500;
    }
  }

  .qty-btn:disabled,
  input:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.price-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 10px;

  span {
    color: var(--sk-ink);
    font-size: 14px;
  }

  .total-price {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 20px;
    font-weight: 700;
    color: var(--sk-warning);

    i {
      font-size: 16px;
    }
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--sk-ink);

  &:hover {
    background: var(--sk-soft);
    color: var(--sk-ink);
  }
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  color: var(--sk-ink);

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.fetish-modal-content {
  max-width: 420px;
}

.fetish-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.fetish-name {
  color: var(--sk-ink);
  font-size: 16px;
  font-weight: 700;
}

.fetish-align-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;

  &.align-m {
    color: var(--sk-pink);
    background: rgba(236, 72, 153, 0.2);
    border: 1px solid rgba(236, 72, 153, 0.35);
  }

  &.align-s {
    color: var(--sk-blue);
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.35);
  }

  &.align-switch {
    color: var(--sk-warning);
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.35);
  }
}

.fetish-desc {
  color: var(--sk-ink);
  font-size: 12px;
  line-height: 1.6;
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.fetish-reroll-tip {
  color: rgba(191, 219, 254, 0.88);
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(96, 165, 250, 0.28);
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.45;
  padding: 8px 10px;
  margin-top: 10px;
}

.fetish-footer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.reroll-btn {
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--sk-ink);
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.reroll-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
}

.wheel-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px;
  background: var(--sk-soft);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.wheel-type-tabs {
  display: flex;
  gap: 8px;
}

.wheel-type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: var(--sk-soft);
  color: var(--sk-ink);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--sk-soft);
    color: var(--sk-ink);
  }

  &.active {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border-color: transparent;
    color: var(--sk-ink);
  }
}

.wheel-cost-bar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(2, 132, 199, 0.15);
  border: 1px solid rgba(14, 165, 233, 0.3);
}

.wheel-cost-main,
.wheel-cost-extra {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wheel-name {
  color: var(--sk-ink);
  font-size: 13px;
  font-weight: 700;
}

.wheel-cost,
.wheel-cost-extra span {
  color: var(--sk-ink);
  font-size: 11px;
}

.wheel-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320px;
  isolation: isolate;
}

.wheel-disc {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;
  background: #07111f;
  border: 7px solid rgba(226, 232, 240, 0.42);
  box-shadow:
    0 18px 38px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(250, 204, 21, 0.12),
    inset 0 0 0 2px rgba(255, 255, 255, 0.16),
    inset 0 0 36px rgba(2, 6, 23, 0.46);
  transition: transform 2.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.wheel-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.wheel-segment-path {
  stroke: none;
  stroke-linejoin: round;

  &.rare {
    filter: saturate(1.12) brightness(1.04);
  }
}

.wheel-surface-light {
  opacity: 0.74;
  mix-blend-mode: screen;
  pointer-events: none;
}

.wheel-separator-line {
  stroke: rgba(2, 6, 23, 0.8);
  stroke-width: 1.45;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.wheel-outer-ring,
.wheel-inner-ring {
  fill: none;
  pointer-events: none;
  vector-effect: non-scaling-stroke;
}

.wheel-outer-ring {
  stroke: rgba(248, 250, 252, 0.72);
  stroke-width: 2.2;
}

.wheel-inner-ring {
  stroke: rgba(2, 6, 23, 0.72);
  stroke-width: 2.6;
  pointer-events: none;
}

.wheel-segment-label {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 76px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--sk-ink);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  line-height: 1.2;

  &.rare {
    color: var(--sk-warning);
  }
}

.wheel-pointer {
  position: absolute;
  top: 2px;
  z-index: 3;
  color: var(--sk-warning);
  font-size: 34px;
  text-shadow:
    0 3px 8px rgba(0, 0, 0, 0.58),
    0 0 12px rgba(250, 204, 21, 0.42);
}

.wheel-center {
  position: absolute;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.24), transparent 30%),
    linear-gradient(135deg, #334155, #020617);
  border: 3px solid rgba(248, 250, 252, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  font-size: 18px;
  z-index: 2;
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.34),
    0 0 0 4px rgba(2, 6, 23, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.wheel-sss-burst {
  position: absolute;
  inset: 18px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  text-align: center;
  pointer-events: none;
  color: #fffbeb;
  animation: wheel-sss-burst-fade 3.6s ease forwards;

  &::before {
    content: '';
    position: absolute;
    inset: 24px;
    border-radius: 50%;
    background:
      radial-gradient(circle, rgba(254, 243, 199, 0.26) 0%, rgba(250, 204, 21, 0.14) 36%, transparent 68%),
      conic-gradient(
        from 20deg,
        rgba(56, 189, 248, 0.04),
        rgba(250, 204, 21, 0.72),
        rgba(236, 72, 153, 0.42),
        rgba(56, 189, 248, 0.28),
        rgba(250, 204, 21, 0.72),
        rgba(56, 189, 248, 0.04)
      );
    filter: blur(0.2px);
    opacity: 0.94;
    animation: wheel-sss-halo-spin 1.45s linear infinite;
  }

  i,
  span {
    position: relative;
    z-index: 1;
  }

  i {
    font-size: 44px;
    color: var(--sk-warning);
    text-shadow:
      0 0 10px rgba(250, 204, 21, 0.9),
      0 0 22px rgba(236, 72, 153, 0.38),
      0 2px 6px rgba(0, 0, 0, 0.45);
    animation: wheel-sss-crown-pop 0.72s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
}

.wheel-sss-ring {
  position: absolute;
  width: 210px;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid rgba(254, 243, 199, 0.76);
  box-shadow:
    0 0 0 8px rgba(250, 204, 21, 0.08),
    0 0 34px rgba(250, 204, 21, 0.58),
    inset 0 0 28px rgba(56, 189, 248, 0.2);
  animation: wheel-sss-ring-pulse 1.15s ease-out infinite;
}

.wheel-sss-title {
  font-size: 18px;
  font-weight: 800;
  color: #fff7ed;
  text-shadow:
    0 0 9px rgba(250, 204, 21, 0.82),
    0 2px 7px rgba(0, 0, 0, 0.48);
}

.wheel-sss-name {
  max-width: 230px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(254, 243, 199, 0.56);
  background: rgba(15, 23, 42, 0.72);
  color: var(--sk-warning);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
  box-shadow: 0 8px 18px rgba(2, 6, 23, 0.28);
}

.wheel-action-row {
  display: flex;
  gap: 10px;
}

.wheel-draw-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  border-radius: 10px;
  padding: 10px;
  color: var(--sk-ink);
  background: linear-gradient(135deg, #f59e0b, #f97316);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s,
    opacity 0.2s;

  small {
    font-size: 10px;
    color: var(--sk-ink);
    font-weight: 500;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &.ten {
    background: linear-gradient(135deg, #d946ef, #8b5cf6);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.wheel-last-result {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--sk-success);
  font-size: 12px;
  line-height: 1.35;

  i {
    margin-top: 1px;
  }
}

.wheel-prob-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.25);
}

.wheel-prob-header {
  font-size: 11px;
  color: var(--sk-blue);
  font-weight: 700;
}

.wheel-prob-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.wheel-prob-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.08);

  &.rare {
    border-color: rgba(251, 191, 36, 0.45);
    background: rgba(251, 191, 36, 0.12);
  }
}

.prob-name {
  font-size: 10px;
  color: var(--sk-ink);
}

.prob-value {
  font-size: 11px;
  color: var(--sk-blue);
  font-weight: 700;
}

@keyframes wheel-sss-burst-fade {
  0% {
    opacity: 0;
    transform: scale(0.86);
  }
  12%,
  78% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.08);
  }
}

@keyframes wheel-sss-halo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes wheel-sss-crown-pop {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.72);
  }
  70% {
    opacity: 1;
    transform: translateY(-2px) scale(1.08);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes wheel-sss-ring-pulse {
  0% {
    opacity: 0.82;
    transform: scale(0.82);
  }
  100% {
    opacity: 0;
    transform: scale(1.18);
  }
}

@media (max-width: 768px) {
  .wheel-stage {
    height: 290px;
  }

  .wheel-disc {
    width: 250px;
    height: 250px;
  }

  .wheel-segment-label {
    width: 66px;
    font-size: 9px;
  }

  .wheel-sss-burst {
    inset: 12px;

    i {
      font-size: 38px;
    }
  }

  .wheel-sss-ring {
    width: 184px;
  }

  .wheel-sss-title {
    font-size: 16px;
  }

  .wheel-sss-name {
    max-width: 204px;
  }
}

.consumable-title {
  color: var(--sk-success);

  i {
    color: var(--sk-success);
  }
}
</style>
