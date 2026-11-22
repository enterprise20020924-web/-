<template>
  <section ref="root" class="kisaragi-bank" aria-label="如月银行" @keydown.esc.stop.prevent="$emit('back')">
    <img
      class="kisaragi-bank-background"
      :src="bankArtworkUrl"
      alt="如月银行柜员手持借贷合同，在明亮的蓝白柜台后接待"
      draggable="false"
    />
    <header class="kisaragi-bank-header">
      <button type="button" class="kisaragi-back" aria-label="返回校园地图" @click="$emit('back')">
        <MapIcon name="back" />
      </button>
      <div class="kisaragi-bank-brand"><strong>如月银行</strong><small>KISARAGI BANK</small></div>
      <div class="kisaragi-wallet">
        <span class="kisaragi-coin" aria-hidden="true">CP</span><small>持有天海信用点</small
        ><strong>{{ format(wallet) }}</strong>
      </div>
    </header>

    <div class="kisaragi-bank-layout" :class="{ 'shows-account': bankPage === 'account' }">
      <div class="kisaragi-page-switch" role="group" aria-label="银行业务">
        <button
          type="button"
          :aria-pressed="bankPage === 'apply'"
          aria-controls="kisaragi-apply"
          @click="changePage('apply')"
        >
          <MapIcon name="bank" />借款办理
        </button>
        <button
          type="button"
          :aria-pressed="bankPage === 'account'"
          aria-controls="kisaragi-account"
          @click="changePage('account')"
        >
          <MapIcon name="bookmark" />我的借款
        </button>
      </div>
      <section id="kisaragi-apply" class="kisaragi-panel kisaragi-application" aria-labelledby="kisaragi-apply-title">
        <BankPanelArt />
        <header class="kisaragi-panel-heading">
          <MapIcon name="bank" />
          <div>
            <small>LOAN APPLICATION</small>
            <h2 id="kisaragi-apply-title">借款办理</h2>
          </div>
          <span>01</span>
        </header>
        <div class="kisaragi-panel-content">
          <div class="kisaragi-rate">
            <div>
              <small>年利率</small><strong>2.8<span>%</span></strong>
            </div>
            <p>{{ repaymentMode === 'maturity' ? '到期还清' : '等额本金' }}<span>随借随还 · 按剩余本金计息</span></p>
          </div>
          <label class="kisaragi-field-label" for="kisaragi-amount">借款金额 <small>天海信用点</small></label>
          <div class="kisaragi-amount-input">
            <span class="kisaragi-coin" aria-hidden="true"> CP</span
            ><input
              id="kisaragi-amount"
              v-model.number="amount"
              type="number"
              min="1"
              step="100"
              inputmode="numeric"
              @input="confirming = false"
            />
          </div>
          <div class="kisaragi-presets">
            <button
              v-for="value in [1000, 5000, 10000]"
              :key="value"
              type="button"
              :class="{ active: amount === value }"
              @click="
                amount = value;
                confirming = false;
              "
            >
              {{ format(value, 0) }}
            </button>
          </div>
          <div class="kisaragi-field-label">还款期限 <small>30 个正文楼层 / 期</small></div>
          <div class="kisaragi-term-control">
            <button
              type="button"
              aria-label="减少期数"
              :disabled="terms <= 1"
              @click="
                terms--;
                confirming = false;
              "
            >
              <MapIcon name="minus" />
            </button>
            <div>
              <strong>{{ terms }}</strong
              ><span>期</span>
            </div>
            <button
              type="button"
              aria-label="增加期数"
              :disabled="terms >= 12"
              @click="
                terms++;
                confirming = false;
              "
            >
              <MapIcon name="plus" />
            </button>
          </div>
          <div class="kisaragi-term-presets">
            <button
              v-for="term in [1, 3, 6, 12]"
              :key="term"
              type="button"
              :class="{ active: terms === term }"
              @click="
                terms = term;
                confirming = false;
              "
            >
              {{ term }} 期
            </button>
          </div>
          <div v-if="maturityAvailable && terms > 1" class="kisaragi-mode-choice" aria-label="还款方式">
            <button
              type="button"
              :class="{ active: repaymentMode === 'instalments' }"
              @click="
                repaymentMode = 'instalments';
                confirming = false;
              "
            >
              分期还款
            </button>
            <button
              type="button"
              :class="{ active: repaymentMode === 'maturity' }"
              @click="
                repaymentMode = 'maturity';
                confirming = false;
              "
            >
              到期还清
            </button>
          </div>
          <div class="kisaragi-quote">
            <div>
              <span>{{ terms === 1 || repaymentMode === 'maturity' ? '到期应还' : '首期应还' }}</span
              ><strong>{{ format(quote.rows[0]?.total ?? 0) }}<small> CP</small></strong>
            </div>
            <div>
              <span>预计总利息</span><b>{{ format(quote.interest) }} G</b>
            </div>
          </div>
          <p class="kisaragi-rule">
            {{ repaymentMode === 'maturity' ? '在最后一期一次归还本金及利息。' : '每期自动归还等额本金及利息。'
            }}<br />提前结清，利息只算实际经过的正文楼层。
          </p>
        </div>
        <div class="kisaragi-application-action">
          <p v-if="confirming" class="kisaragi-confirm-quote">
            借款 {{ format(safeAmount, 0) }} CP · {{ terms }} 期 · 本息合计 {{ format(quote.total) }} CP
          </p>
          <button
            type="button"
            class="kisaragi-primary"
            :disabled="busy || !validAmount || !ready"
            @click="requestLoan"
          >
            <MapIcon :name="confirming ? 'check' : 'bank'" />{{ confirming ? '确认签约并领取天海信用点' : '申请借款'
            }}<MapIcon name="chevron" /></button
          ><button v-if="confirming" type="button" class="kisaragi-cancel" @click="confirming = false">返回修改</button>
        </div>
      </section>

      <div class="kisaragi-counter-space" aria-hidden="true"></div>

      <section id="kisaragi-account" class="kisaragi-panel kisaragi-account" aria-labelledby="kisaragi-account-title">
        <BankPanelArt />
        <header class="kisaragi-panel-heading">
          <MapIcon name="bookmark" />
          <div>
            <small>MY LOAN</small>
            <h2 id="kisaragi-account-title">我的借款</h2>
          </div>
          <span>02</span>
        </header>
        <div class="kisaragi-panel-content">
          <template v-if="loan">
            <div class="kisaragi-contract-heading">
              <span class="kisaragi-status" :class="{ settled: !isLoanOpen(loan) }">{{
                isLoanOpen(loan) ? '还款中' : '已结清'
              }}</span
              ><select v-if="loans.length > 1" v-model="selectedId" aria-label="选择借款合同">
                <option v-for="(item, index) in loans" :key="item.id" :value="item.id">
                  借款 {{ index + 1 }} · {{ format(item.principal, 0) }} G
                </option></select
              ><small v-else>贷款合同</small>
            </div>
            <div class="kisaragi-account-total">
              <span>借款总额</span><strong>{{ format(loan.principal, 0) }}<small> CP</small></strong>
            </div>
            <dl class="kisaragi-account-rows">
              <div>
                <dt>已还本金</dt>
                <dd>{{ format(loan.principal - loan.balance) }} G</dd>
              </div>
              <div>
                <dt>剩余本金</dt>
                <dd>{{ format(loan.balance) }} G</dd>
              </div>
              <div>
                <dt>已付利息</dt>
                <dd>{{ format(loan.interestPaid) }} G</dd>
              </div>
              <div>
                <dt>当前利息</dt>
                <dd>{{ format(loan.interestDue) }} G</dd>
              </div>
            </dl>
            <div v-if="loan.terms > 1 && loan.mode !== 'maturity'" class="kisaragi-progress">
              <div>
                <span>还款进度</span
                ><strong
                  >{{ paidPeriods(loan) }}<small> / {{ loan.terms }} 期</small></strong
                >
              </div>
              <div class="kisaragi-progress-track">
                <i :style="{ width: `${(1 - loan.balance / loan.principal) * 100}%` }"></i>
              </div>
            </div>
            <div v-if="isLoanOpen(loan)" class="kisaragi-next-payment">
              <span
                >{{ loan.terms === 1 || loan.mode === 'maturity' ? '到期应还' : '下期应还'
                }}<small>{{
                  nextPayment.remainingFloors > 0 ? `剩余 ${nextPayment.remainingFloors} 个正文楼层` : '已到还款时间'
                }}</small></span
              ><strong>{{ format(nextPayment.total) }}<small> CP</small></strong>
            </div>
            <div v-else class="kisaragi-repaid"><MapIcon name="check" /><strong>这笔借款已全部还清</strong></div>
            <div v-if="isLoanOpen(loan)" class="kisaragi-repayment-actions">
              <button type="button" class="kisaragi-primary" :disabled="busy" @click="repay(false)">
                {{ loan.terms === 1 || loan.mode === 'maturity' ? '偿还借款' : '偿还一期' }}</button
              ><button
                v-if="loan.terms > 1 && loan.mode !== 'maturity'"
                type="button"
                class="kisaragi-secondary"
                :disabled="busy"
                @click="repay(true)"
              >
                提前结清 <strong>{{ format(loan.balance + loan.interestDue) }} G</strong>
              </button>
            </div>
          </template>
          <template v-else>
            <div class="kisaragi-empty">
              <div class="kisaragi-empty-icon"><MapIcon name="bookmark" /><MapIcon name="check" /></div>
              <h3>当前没有借款</h3>
              <p>在「借款办理」中选择金额与期限，<br />即可查看还款计划。</p>
            </div>
            <div class="kisaragi-plan-preview">
              <span>当前方案预览</span>
              <dl class="kisaragi-account-rows">
                <div>
                  <dt>借款金额</dt>
                  <dd>{{ format(safeAmount, 0) }} G</dd>
                </div>
                <div>
                  <dt>预计利息</dt>
                  <dd>{{ format(quote.interest) }} G</dd>
                </div>
                <div>
                  <dt>本息合计</dt>
                  <dd>{{ format(quote.total) }} G</dd>
                </div>
              </dl>
            </div>
          </template>
          <details v-if="!loan || isLoanOpen(loan)" class="kisaragi-schedule">
            <summary>查看{{ loan ? '原定' : '预计' }}还款计划<MapIcon name="chevron" /></summary>
            <div class="kisaragi-schedule-list">
              <div v-for="row in displaySchedule" :key="row.period">
                <span>{{ row.period }} 期</span
                ><span
                  >本金 {{ format(row.principal) }}<small>利息 {{ format(row.interest) }}</small></span
                ><strong>{{ format(row.total) }} G</strong>
              </div>
            </div>
          </details>
          <p class="kisaragi-account-footnote">年利率 2.8%<span>12 期 = 360 个正文楼层</span></p>
        </div>
      </section>
    </div>
    <div v-if="notice" class="kisaragi-notice" role="status">{{ notice }}</div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import MapIcon from '../map/MapIcon.vue';
import BankPanelArt from './BankPanelArt.vue';
import {
  bankArtworkUrl,
  borrowFromBank,
  canRepayAtMaturity,
  getBankState,
  getBankWallet,
  isLoanOpen,
  nextLoanPayment,
  paidPeriods,
  quoteLoan,
  repayBankLoan,
} from './loan';
import type { BankState, BankRepaymentMode } from './loan';
import { updateBank } from './runtime';

defineEmits<{ back: [] }>();
const root = ref<HTMLElement | null>(null);
const amount = ref<number>(10000);
const terms = ref(1);
const repaymentMode = ref<BankRepaymentMode>('instalments');
const maturityAvailable = ref(false);
const wallet = ref(0);
const floor = ref(0);
const state = ref<BankState>({ version: 1, loans: [] });
const busy = ref(false);
const ready = ref(false);
const confirming = ref(false);
const bankPage = ref<'apply' | 'account'>('apply');
function changePage(page: 'apply' | 'account') {
  bankPage.value = page;
  confirming.value = false;
}
const selectedId = ref('');
const notice = ref('');
const validAmount = computed(() => Number.isFinite(amount.value) && amount.value >= 1);
const safeAmount = computed(() => (validAmount.value ? amount.value : 0));
const quote = computed(() => quoteLoan(safeAmount.value, terms.value, repaymentMode.value));
const loans = computed(() => state.value.loans);
const loan = computed(
  () =>
    loans.value.find(item => item.id === selectedId.value) ??
    [...loans.value].reverse().find(isLoanOpen) ??
    loans.value.at(-1),
);
const nextPayment = computed(() =>
  loan.value ? nextLoanPayment(loan.value, floor.value) : { total: 0, remainingFloors: 0 },
);
const displaySchedule = computed(() =>
  loan.value ? quoteLoan(loan.value.principal, loan.value.terms, loan.value.mode, loan.value).rows : quote.value.rows,
);
const format = (value: number, decimals = 2) =>
  value.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
const listeners: { stop: () => void }[] = [];

function showNotice(message: string) {
  notice.value = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.value = '';
  }, 4000);
}
async function refresh(operation?: Parameters<typeof updateBank>[0]) {
  const snapshot = await updateBank(operation);
  if (disposed) return;
  state.value = getBankState(snapshot.data);
  wallet.value = getBankWallet(snapshot.data);
  floor.value = snapshot.floor;
  maturityAvailable.value = canRepayAtMaturity(snapshot.data);
  if (!ready.value && maturityAvailable.value) repaymentMode.value = 'maturity';
  if (!maturityAvailable.value) repaymentMode.value = 'instalments';
  ready.value = true;
}
async function requestLoan() {
  if (!confirming.value) {
    confirming.value = true;
    return;
  }
  busy.value = true;
  try {
    const id = crypto.randomUUID();
    await refresh((data, currentFloor) =>
      borrowFromBank(data, amount.value, terms.value, currentFloor, id, repaymentMode.value),
    );
    selectedId.value = id;
    changePage('account');
    showNotice(`${format(amount.value, 0)} 天海信用点已到账。`);
  } catch (error) {
    showNotice((error as Error).message);
  } finally {
    busy.value = false;
  }
}
async function repay(fully: boolean) {
  if (!loan.value) return;
  busy.value = true;
  const id = loan.value.id;
  try {
    await refresh((data, currentFloor) => repayBankLoan(data, id, currentFloor, fully));
    showNotice(fully || !isLoanOpen(loan.value) ? '借款已结清，感谢您的光临。' : '本次还款已完成。');
  } catch (error) {
    showNotice((error as Error).message);
  } finally {
    busy.value = false;
  }
}
onMounted(async () => {
  await nextTick();
  root.value?.querySelector<HTMLButtonElement>('.kisaragi-back')?.focus({ preventScroll: true });
  try {
    await refresh();
  } catch (error) {
    showNotice((error as Error).message);
  }
  if (disposed) return;
  const schedule = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      void refresh().catch(error => showNotice(error.message));
    }, 100);
  };
  for (const event of [
    tavern_events.MESSAGE_RECEIVED,
    tavern_events.MESSAGE_DELETED,
    tavern_events.MESSAGE_SWIPED,
    'mag_before_message_update',
  ])
    listeners.push(eventOn(event, schedule));
});
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(noticeTimer);
  clearTimeout(refreshTimer);
  listeners.forEach(listener => listener.stop());
});
</script>
