<template>
  <ShopPage :character-data="statData">
    <template #storefront="shop">
      <Gyaru24Storefront
        :catalog="shop.catalog"
        :selected-item="shop.selectedItem"
        :quantity="shop.quantity"
        :busy="shop.busy || !ready"
        :wallet="wallet"
        :price-for="shop.priceFor"
        :owned-for="ownedFor"
        @back="$emit('back')"
        @select="shop.selectItem"
        @quantity="shop.setQuantity"
        @purchase="purchase(shop.purchase)"
      />
    </template>
  </ShopPage>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import ShopPage from '../phone/terminal/性斗学园脚本/components/pages/ShopPage.vue';
import { getLatestStatData } from '../phone/terminal/shared/mvuStore';
import Gyaru24Storefront from './Gyaru24Storefront.vue';
import type { StoreItem } from './types';
defineEmits<{ back: [] }>();
const statData = ref<Record<string, any>>({});
const ready = ref(false);
const wallet = computed(() => Number(statData.value.物品系统?._天海信用点 ?? 0));
let disposed = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners: { stop: () => void }[] = [];
function ownedFor(item: StoreItem) {
  const bag = statData.value.物品系统?.背包 ?? {};
  if (item.id === 'con_s_medal_muxinlan') return Number(bag.honor_medal_muxinlan?.数量 ?? 0);
  return Object.entries<Record<string, any>>(bag).reduce(
    (count, [name, entry]) =>
      name === item.name || (item.category === 'equipment' && name.startsWith(`${item.name}_`))
        ? count + Number(entry.数量 ?? 1)
        : count,
    0,
  );
}
async function refresh() {
  const data = await getLatestStatData();
  if (!disposed && data) {
    statData.value = data;
    ready.value = true;
  }
}
async function purchase(action: () => Promise<void>) {
  await action();
  await refresh();
}
onMounted(() => {
  void refresh();
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void refresh();
    }, 100);
  };
  for (const event of ['mag_before_message_update', tavern_events.MESSAGE_SWIPED, tavern_events.MESSAGE_DELETED])
    listeners.push(eventOn(event, schedule));
});
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(timer);
  listeners.forEach(listener => listener.stop());
});
</script>
