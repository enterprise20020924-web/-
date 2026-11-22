<template>
  <section
    ref="root"
    class="gyaru24-store"
    :class="{ 'is-reviewing': reviewing }"
    aria-label="辣妹24便利店"
    @keydown.esc.stop.prevent="goBack"
  >
    <img
      class="gyaru24-background"
      :src="gyaru24ArtworkUrl"
      alt="辣妹24便利店，金发店员在柜台后微笑招手"
      draggable="false"
    />
    <header class="gyaru24-header">
      <button type="button" class="gyaru24-back" aria-label="返回校园地图" @click="$emit('back')">
        <MapIcon name="back" />
      </button>
      <div class="gyaru24-brand">
        <strong>辣妹<span>24</span></strong
        ><small>GYARU 24</small>
      </div>
      <span class="gyaru24-open">OPEN <b>24H</b></span>
      <div class="gyaru24-wallet">
        <span class="gyaru24-coin">CP</span><small>天海信用点</small><strong>{{ format(wallet) }}</strong>
      </div>
    </header>

    <div ref="layout" class="gyaru24-layout">
      <section class="gyaru24-catalog gyaru24-panel" aria-labelledby="gyaru24-products">
        <svg class="gyaru24-panel-frame" viewBox="0 0 600 700" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M14 1H578L599 22V677L578 699H1V14Z"
            fill="#f7fbff"
            fill-opacity=".95"
            stroke="#fff"
            stroke-width="2"
          />
          <path d="M1 14 14 1h98l-9 6H9v60H1Z" fill="#38c4ec" />
          <path d="M548 699h30l21-22v-53h-5v50l-19 19h-27Z" fill="#38c4ec" />
        </svg>
        <header class="gyaru24-panel-heading">
          <MapIcon name="shop" />
          <div>
            <small>SHOP / LINEUP</small>
            <h2 id="gyaru24-products">商品陈列</h2>
          </div>
          <span>{{ filtered.length }}<small> 件商品</small></span>
        </header>
        <div class="gyaru24-catalog-tools">
          <nav class="gyaru24-categories" aria-label="商品分类">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              :aria-pressed="activeCategory === category.id"
              :class="{ active: activeCategory === category.id }"
              @click="activeCategory = category.id"
            >
              {{ category.name }}
            </button>
          </nav>
          <div class="gyaru24-search">
            <MapIcon name="search" /><input
              v-model="query"
              type="search"
              placeholder="寻找需要的商品…"
              aria-label="搜索商品"
            /><select v-if="activeCategory === 'equipment'" v-model="grade" aria-label="装备等级">
              <option value="">全部等级</option>
              <option v-for="value in ['C', 'B', 'A', 'S', 'SS']" :key="value">{{ value }}</option>
            </select>
          </div>
        </div>
        <div class="gyaru24-product-scroll">
          <div v-if="filtered.length" class="gyaru24-product-grid">
            <button
              v-for="item in filtered"
              :key="item.key"
              type="button"
              class="gyaru24-product"
              :class="{ selected: selectedItem?.key === item.key }"
              :aria-pressed="selectedItem?.key === item.key"
              @click="selectProduct(item, $event)"
            >
              <div class="gyaru24-product-picture">
                <span class="gyaru24-grade">{{ item.grade ?? 'ITEM' }}</span
                ><ProductGlyph :item="item" /><span class="gyaru24-owned">持有 {{ ownedFor(item) }}</span
                ><span v-if="selectedItem?.key === item.key" class="gyaru24-selected-mark"
                  ><MapIcon name="check"
                /></span>
              </div>
              <strong class="gyaru24-product-name">{{ item.name }}</strong
              ><span class="gyaru24-product-effect">{{ item.effectText ?? `${item.grade}级 · ${item.slot}` }}</span>
              <div class="gyaru24-product-price">
                <span class="gyaru24-coin"> CP</span><strong>{{ format(priceFor(item)) }}</strong
                ><del v-if="priceFor(item) < item.price">{{ format(item.price) }}</del
                ><MapIcon name="plus" />
              </div>
            </button>
          </div>
          <div v-else class="gyaru24-no-products">
            <MapIcon name="search" /><strong>没有找到这件商品</strong><span>试试其他名称或分类吧。</span>
          </div>
        </div>
        <footer class="gyaru24-catalog-footer">
          <span><i></i> 欢迎光临，慢慢挑选吧。</span><small>GYARU 24 · CAMPUS STORE</small>
        </footer>
      </section>

      <aside class="gyaru24-checkout gyaru24-panel" aria-labelledby="gyaru24-checkout-title">
        <svg class="gyaru24-panel-frame" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M12 1H581L599 19V201L581 219H1V12Z"
            fill="#f8fcff"
            fill-opacity=".97"
            stroke="#fff"
            stroke-width="2"
          />
          <path d="M1 12 12 1h88l-8 6H8v42H1Z" fill="#38c4ec" />
          <path d="M548 219h33l18-18v-33h-5v30l-16 16h-30Z" fill="#38c4ec" />
        </svg>
        <header class="gyaru24-checkout-heading">
          <MapIcon name="basket" />
          <h2 id="gyaru24-checkout-title">购物结算</h2>
          <small>CHECKOUT</small>
          <button ref="browseButton" type="button" class="gyaru24-browse" @click="returnToProducts">继续选购</button>
        </header>
        <template v-if="selectedItem">
          <div class="gyaru24-selection">
            <div class="gyaru24-selection-art"><ProductGlyph :item="selectedItem" /></div>
            <div class="gyaru24-selection-copy">
              <strong>{{ selectedItem.name }}</strong>
              <p>{{ selectedItem.description }}</p>
              <span v-if="selectedItem.shelf === 'permanent'">购买后自动使用</span
              ><span v-else>持有 {{ ownedFor(selectedItem) }} 件</span>
            </div>
            <div class="gyaru24-quantity">
              <button
                type="button"
                aria-label="减少购买数量"
                :disabled="quantity <= 1 || busy"
                @click="$emit('quantity', quantity - 1)"
              >
                <MapIcon name="minus" /></button
              ><span>{{ quantity }}</span
              ><button
                type="button"
                aria-label="增加购买数量"
                :disabled="busy || selectedItem.category === 'equipment'"
                @click="$emit('quantity', quantity + 1)"
              >
                <MapIcon name="plus" />
              </button>
            </div>
          </div>
          <footer class="gyaru24-checkout-footer">
            <div>
              <span>合计金额</span><strong>{{ format(total) }}<small> CP</small></strong>
            </div>
            <button type="button" class="gyaru24-buy" :disabled="busy || wallet < total" @click="$emit('purchase')">
              {{ busy ? '请稍候…' : wallet < total ? '天海信用点不足' : '确认购买' }}<MapIcon name="chevron" />
            </button>
          </footer>
        </template>
        <template v-else
          ><div class="gyaru24-empty-selection">
            <MapIcon name="basket" />
            <div><strong>今天想买些什么？</strong><span>点选商品，查看详情与购买数量。</span></div>
          </div>
          <footer class="gyaru24-checkout-footer">
            <div>
              <span>合计金额</span><strong>0<small> CP</small></strong>
            </div>
            <button type="button" class="gyaru24-buy" disabled>请选择商品<MapIcon name="chevron" /></button></footer
        ></template>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import MapIcon from '../map/MapIcon.vue';
import ProductGlyph from './ProductGlyph.vue';
import { gyaru24ArtworkUrl } from './artwork';
import type { StoreItem } from './types';
const props = defineProps<{
  catalog: StoreItem[];
  selectedItem: StoreItem | null;
  quantity: number;
  busy: boolean;
  wallet: number;
  priceFor: (item: StoreItem) => number;
  ownedFor: (item: StoreItem) => number;
}>();
const emit = defineEmits<{ back: []; select: [item: StoreItem]; quantity: [value: number]; purchase: [] }>();
const root = ref<HTMLElement | null>(null);
const layout = ref<HTMLElement | null>(null);
const browseButton = ref<HTMLButtonElement | null>(null);
const reviewing = ref(false);
let selectedButton: HTMLButtonElement | null = null;
let catalogScroll = 0;
async function selectProduct(item: StoreItem, event: MouseEvent) {
  emit('select', item);
  if (!root.value || root.value.clientWidth >= 760 || !layout.value) return;
  selectedButton = event.currentTarget as HTMLButtonElement;
  catalogScroll = layout.value.scrollTop;
  reviewing.value = true;
  await nextTick();
  layout.value.scrollTop = 0;
  browseButton.value?.focus({ preventScroll: true });
}
async function returnToProducts() {
  reviewing.value = false;
  await nextTick();
  if (layout.value) layout.value.scrollTop = catalogScroll;
  selectedButton?.focus({ preventScroll: true });
}
function goBack() {
  if (reviewing.value && root.value && root.value.clientWidth < 760) void returnToProducts();
  else emit('back');
}
const activeCategory = ref('recovery');
const query = ref('');
const grade = ref('');
const categoryNames: Record<string, string> = {
  all: '全部',
  recovery: '恢复',
  equipment: '装备',
  combat_debuff: '战斗',
  temp_buff: '强化',
  permanent: '成长',
  special_battle: '特殊',
};
const categories = computed(() =>
  Object.entries(categoryNames)
    .filter(([id]) => id === 'all' || props.catalog.some(item => item.shelf === id))
    .map(([id, name]) => ({ id, name })),
);
const filtered = computed(() =>
  props.catalog.filter(
    item =>
      (activeCategory.value === 'all' || item.shelf === activeCategory.value) &&
      (activeCategory.value !== 'equipment' || !grade.value || item.grade === grade.value) &&
      (!query.value.trim() || `${item.name} ${item.description}`.includes(query.value.trim())),
  ),
);
const total = computed(() => (props.selectedItem ? props.priceFor(props.selectedItem) * props.quantity : 0));
const format = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
onMounted(async () => {
  await nextTick();
  root.value?.querySelector<HTMLButtonElement>('.gyaru24-back')?.focus({ preventScroll: true });
});
</script>
