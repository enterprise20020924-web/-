import { creditMoney, debitMoney, getMoneyBalance, type MoneyData } from '../money/ledger';
import { getAmamiState, readAmamiState } from '../state/model';
import { hydrateAmamiState } from '../state/persistence';
export const BANK_STATE_KEY = 'bank';
export const BANK_ANNUAL_RATE = 0.028;
export const BANK_PERIOD_FLOORS = 30;
export const BANK_YEAR_FLOORS = 360;
export const bankArtworkUrl = new URL(
  '如月银行.png',
  'https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/天海附加背景/',
).href;

export type BankRepaymentMode = 'instalments' | 'maturity';
export interface BankLoan {
  id: string;
  principal: number;
  balance: number;
  terms: number;
  mode: BankRepaymentMode;
  annualRate: number;
  periodFloors: number;
  yearFloors: number;
  startFloor: number;
  settledFloor: number;
  interestDue: number;
  interestPaid: number;
}
export interface BankState {
  version: 1;
  loans: BankLoan[];
}
export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function getBankState(data: Record<string, any>): BankState {
  hydrateAmamiState(data);
  const state: BankState = readAmamiState(data)?.bank ?? { version: 1, loans: [] };
  for (const loan of state.loans) {
    loan.annualRate ??= BANK_ANNUAL_RATE;
    loan.periodFloors ??= BANK_PERIOD_FLOORS;
    loan.yearFloors ??= BANK_YEAR_FLOORS;
  }
  return state;
}
export function getBankWallet(data: Record<string, any>): number {
  return getMoneyBalance(data as MoneyData);
}
export function canRepayAtMaturity(data: Record<string, any>) {
  return Number(data.stat_data?.关系系统?.如月诗乃?.好感度 ?? 0) >= 80;
}
export function isLoanOpen(loan: BankLoan) {
  return loan.balance > 0 || money(loan.interestDue) > 0;
}
export function quoteLoan(
  principal: number,
  terms: number,
  mode: BankRepaymentMode = 'instalments',
  contract?: Pick<BankLoan, 'annualRate' | 'periodFloors' | 'yearFloors'>,
) {
  const periodicRate = contract
    ? (contract.annualRate * contract.periodFloors) / contract.yearFloors
    : BANK_ANNUAL_RATE / 12;
  if (mode === 'maturity') {
    const interest = money(principal * periodicRate * terms);
    return {
      rows: [{ period: terms, principal, interest, total: money(principal + interest) }],
      interest,
      total: money(principal + interest),
    };
  }
  let balance = principal;
  const instalment = money(principal / terms);
  const rows = Array.from({ length: terms }, (_, index) => {
    const interest = money(balance * periodicRate);
    const capital = index === terms - 1 ? balance : instalment;
    balance = money(balance - capital);
    return { period: index + 1, principal: capital, interest, total: money(capital + interest) };
  });
  const interest = money(rows.reduce((sum, row) => sum + row.interest, 0));
  return { rows, interest, total: money(principal + interest) };
}
export function paidPeriods(loan: BankLoan) {
  return loan.balance <= 0
    ? loan.terms
    : Math.min(
        loan.terms,
        Math.floor((money(loan.principal - loan.balance) + 0.011) / money(loan.principal / loan.terms)),
      );
}
function duePrincipal(loan: BankLoan, floor: number) {
  if (loan.mode === 'maturity') return floor >= loan.startFloor + loan.terms * loan.periodFloors ? loan.balance : 0;
  const periods = Math.min(loan.terms, Math.floor((floor - loan.startFloor) / loan.periodFloors));
  const target = periods >= loan.terms ? loan.principal : money(loan.principal / loan.terms) * periods;
  return money(Math.max(0, target - money(loan.principal - loan.balance)));
}
export function nextLoanPayment(loan: BankLoan, floor: number) {
  const completed = paidPeriods(loan);
  const dueAt =
    loan.startFloor + (loan.mode === 'maturity' ? loan.terms : Math.min(loan.terms, completed + 1)) * loan.periodFloors;
  const capital =
    loan.mode === 'maturity'
      ? loan.balance
      : Math.min(loan.balance, Math.max(duePrincipal(loan, floor), money(loan.principal / loan.terms)));
  const interest = money(
    loan.interestDue + (loan.balance * loan.annualRate * Math.max(0, dueAt - floor)) / loan.yearFloors,
  );
  return { capital, interest, total: money(capital + interest), dueAt, remainingFloors: Math.max(0, dueAt - floor) };
}

/** 只统计已产生正文的 AI 楼层；输入、系统消息和同楼 swipe 不增加计息时间。 */
export function countNarrativeFloors(messages: { message_id: number; role: string; message: string }[]) {
  return messages.filter(message => {
    if (message.role !== 'assistant' || message.message_id === 0) return false;
    const text = message.message
      .replace(/<(UpdateVariable|thinking|think|analysis|sum|option|w2p|dialogue_map)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
    return text.length > 0;
  }).length;
}

function pay(data: Record<string, any>, loan: BankLoan, capital: number) {
  const interest = money(loan.interestDue);
  const total = money(capital + interest);
  if (getBankWallet(data) < total) return false;
  debitMoney(data as MoneyData, capital, 'bankPrincipal');
  debitMoney(data as MoneyData, interest, 'bankInterest');
  loan.balance = money(loan.balance - capital);
  loan.interestPaid = money(loan.interestPaid + interest);
  loan.interestDue = 0;
  return true;
}

/** 每个到期边界先计息、再还本金；余额不足保留应还款，不另加罚息。 */
export function settleBank(data: Record<string, any>, floor: number, autoPay = true) {
  const restored = hydrateAmamiState(data);
  if (!readAmamiState(data)?.bank || !data.stat_data) return restored;
  let changed = restored;
  for (const loan of getBankState(data).loans) {
    if (!isLoanOpen(loan) || floor < loan.settledFloor) continue;
    while (loan.settledFloor < floor) {
      const boundary =
        loan.startFloor +
        (Math.floor((loan.settledFloor - loan.startFloor) / loan.periodFloors) + 1) * loan.periodFloors;
      const next = Math.min(boundary, floor);
      loan.interestDue += (loan.balance * loan.annualRate * (next - loan.settledFloor)) / loan.yearFloors;
      loan.settledFloor = next;
      changed = true;
      if (autoPay && next === boundary) {
        const capital = duePrincipal(loan, next);
        if (capital > 0) pay(data, loan, capital);
      }
      if (!isLoanOpen(loan)) break;
    }
    const overdueCapital = duePrincipal(loan, floor);
    if (autoPay && overdueCapital > 0 && pay(data, loan, overdueCapital)) changed = true;
  }
  return changed;
}

export function borrowFromBank(
  data: Record<string, any>,
  principal: number,
  terms: number,
  floor: number,
  id: string,
  mode: BankRepaymentMode = 'instalments',
) {
  if (!Number.isFinite(principal) || principal < 1 || !Number.isInteger(terms) || terms < 1 || terms > 12)
    throw new Error('请输入有效金额与 1～12 期的还款期限。');
  settleBank(data, floor);
  const state = getBankState(data);
  const loan: BankLoan = {
    id,
    principal: money(principal),
    balance: money(principal),
    terms,
    mode: mode === 'maturity' && canRepayAtMaturity(data) ? 'maturity' : 'instalments',
    annualRate: BANK_ANNUAL_RATE,
    periodFloors: BANK_PERIOD_FLOORS,
    yearFloors: BANK_YEAR_FLOORS,
    startFloor: floor,
    settledFloor: floor,
    interestDue: 0,
    interestPaid: 0,
  };
  state.loans.push(loan);
  getAmamiState(data).bank = state;
  creditMoney(data as MoneyData, loan.principal, 'loans');
  return loan;
}

export function repayBankLoan(data: Record<string, any>, id: string, floor: number, fully: boolean) {
  settleBank(data, floor, false);
  const loan = getBankState(data).loans.find(item => item.id === id);
  if (!loan || !isLoanOpen(loan)) return;
  const capital = fully ? loan.balance : nextLoanPayment(loan, floor).capital;
  if (!pay(data, loan, capital)) throw new Error('持有天海信用点不足，暂时无法完成这笔还款。');
}
