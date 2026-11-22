<template>
  <section
    v-show="session.visible"
    class="bp-inline-battle"
    :class="{
      'has-entrance': entranceVisible,
      'is-arena-revealed': arenaRevealed,
      'is-motion-reduced': header.motionReduced,
    }"
    :style="{ '--bp-battle-ui-scale': uiScale }"
    aria-label="性斗（Battle Fuck）"
    @keydown.esc.stop="returnToStory"
  >
    <header class="bp-inline-battle-header" :inert="entranceVisible" :aria-hidden="entranceVisible || undefined">
      <div class="bp-inline-battle-match" aria-live="polite">
        <div class="bp-inline-battle-route">
          <strong :title="header.playerName">{{ header.playerName }}</strong>
          <span>VS</span>
          <strong :title="header.enemyName">{{ header.enemyName }}</strong>
          <small v-if="header.isBoss" class="bp-inline-battle-boss">BOSS</small>
        </div>
        <div class="bp-inline-battle-turn">
          <small>回合</small><b>{{ String(header.turn).padStart(2, '0') }}</b
          ><span>{{ header.phase }}</span>
        </div>
      </div>
      <div class="bp-inline-battle-scale" role="group" aria-label="战斗显示大小">
        <span>显示大小</span>
        <button
          v-for="option in scaleOptions"
          :key="option.value"
          type="button"
          class="bp-inline-battle-scale-option"
          :class="{ 'is-selected': uiScale === option.value }"
          :aria-pressed="uiScale === option.value"
          @click="setUiScale(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <nav aria-label="正文与战斗切换">
        <button
          class="bp-inline-battle-motion"
          type="button"
          :disabled="phase !== 'ready'"
          :aria-label="header.motionReduced ? '开启动效' : '减少动效'"
          :title="header.motionReduced ? '开启动效' : '减少动效'"
          @click="session.api?.toggleMotion()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path v-if="header.motionReduced" d="m8 5 11 7-11 7Z" />
            <path v-else d="M7 5v14M17 5v14" />
          </svg>
        </button>
        <button type="button" @click="returnToStory">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
          返回正文
        </button>
        <span aria-current="page">战斗模式</span>
      </nav>
    </header>
    <div class="bp-inline-battle-body" :inert="entranceVisible" :aria-hidden="entranceVisible || undefined">
      <div ref="frameSlot" class="bp-inline-battle-frame-mount"></div>
      <div v-if="phase !== 'ready'" class="bp-inline-battle-loading" role="status">
        <span>{{ phase === 'error' ? '战斗页面未能打开' : '正在进入性斗（Battle Fuck）…' }}</span>
        <button v-if="phase === 'error'" type="button" @click="loadFrame">重新打开</button>
        <button type="button" @click="returnToStory">返回正文</button>
      </div>
    </div>
    <BattleEntrance
      v-if="entranceVisible"
      :key="entranceAttempt"
      class="bp-inline-battle-entrance"
      :player-name="entrancePlayerName"
      :enemy-name="session.enemyName"
      :player-portrait="entrancePlayerPortrait"
      :player-fallback-portrait="entrancePlayerFallback"
      :enemy-portrait="entranceEnemyPortrait"
      :ready="phase === 'ready'"
      :failed="phase === 'error'"
      :reduced-motion="header.motionReduced"
      @reveal="revealArena"
      @complete="completeEntrance"
      @retry="retryFrame"
      @return="returnToStory"
    />
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useBattleUiScale, type BattleUiScale } from './ui-scale';
import type { CombatFrameElement, CombatHeaderState } from '../../性斗（Battle Fuck）/integration/embedded-context';
import { createCombatGlobals } from './combat-context';
import { getBattleDocument } from './battle-document';
import {
  attachInlineCombatView,
  hideInlineCombat,
  requestPlayerRefresh,
  type InlineCombatSession,
} from './inline-session';
import BattleEntrance from './BattleEntrance.vue';
import { resolveEntrancePortrait } from './entrance-portraits';
import { readUserPortraitGender } from '../engine/tavern-variable-runtime';
import { getFullbodyPortraitUrl } from '../portrait-registry';
import { bindForkImageCache } from '../assets/image-preload-runtime';
import { readPlayerIdentityId } from '../identity/selection';
import { resolveIdentityPortraitProfile } from '../identity/presentation';
import { admissionIdentityArt } from '../opening/admission-identity-art';

const props = defineProps<{ session: InlineCombatSession }>();
const battleView = attachInlineCombatView(props.session, disposeFrame);
const entranceVisible = ref(battleView.playEntrance);
const arenaRevealed = ref(!entranceVisible.value);
const entranceAttempt = ref(0);
const entrancePlayerName = String(props.session.data.stat_data.角色基础?._姓名 || '玩家');
const entranceIdentity = readPlayerIdentityId(props.session.sourceMessageId);
const entranceDefaultPortrait = getFullbodyPortraitUrl(
    readUserPortraitGender(props.session.sourceMessageId, 0) === 'male' ? '男主_黑西装校服_普通学生.png' : '女主.png',
  ) ?? '';
const entrancePlayerFallback = entranceIdentity === null
  ? undefined
  : resolveIdentityPortraitProfile(entranceIdentity)?.portraitUrl ?? entranceDefaultPortrait;
const entrancePlayerPortrait = entranceIdentity === null
  ? resolveEntrancePortrait(entrancePlayerName, entranceDefaultPortrait)
  : admissionIdentityArt[entranceIdentity]?.battleUrl ?? entrancePlayerFallback ?? entranceDefaultPortrait;
const entranceEnemyPortrait = resolveEntrancePortrait(props.session.enemyName);
const { uiScale, setUiScale } = useBattleUiScale();
const scaleOptions: Array<{ value: BattleUiScale; label: string }> = [
  { value: 1, label: '默认' },
  { value: 1.2, label: '1.2×' },
];
watch(uiScale, value => {
  props.session.api?.setUiScale(value);
});
const frameSlot = ref<HTMLElement | null>(null);
const phase = ref<'loading' | 'ready' | 'error'>('loading');
const header = ref<CombatHeaderState>({
  playerName: props.session.data.stat_data.角色基础?._姓名 || '玩家',
  enemyName: props.session.enemyName,
  turn: 1,
  phase: '准备中',
  isBoss: false,
  motionReduced: false,
});
let frame: CombatFrameElement | undefined;
let unmount: (() => void) | undefined;
let stopHeaderSync: (() => void) | undefined;
let releaseEntrance: ((beginCombat: boolean) => void) | undefined;
let disposed = false;

function revealArena() {
  arenaRevealed.value = true;
}
function completeEntrance() {
  revealArena();
  entranceVisible.value = false;
  releaseEntrance?.(true);
  releaseEntrance = undefined;
}
function returnToStory() {
  completeEntrance();
  hideInlineCombat(props.session.sourceMessageId);
}
watch(
  () => props.session.visible,
  visible => {
    if (!visible) completeEntrance();
  },
);
function disposeFrame() {
  releaseEntrance?.(false);
  releaseEntrance = undefined;
  stopHeaderSync?.();
  stopHeaderSync = undefined;
  unmount?.();
  unmount = undefined;
  frame?.remove();
  frame = undefined;
  battleView.setApi(undefined);
}
async function loadFrame() {
  disposeFrame();
  phase.value = 'loading';
  try {
    const html = await getBattleDocument();
    if (disposed || !frameSlot.value) return;
    const host = frameSlot.value.ownerDocument.createElement('iframe') as CombatFrameElement;
    frame = host;
    host.title = `性斗（Battle Fuck） · ${props.session.enemyName}`;
    host.style.cssText = 'display:block;width:100%;height:100%;border:0';
    const entranceGate = new Promise<boolean>(resolve => {
      if (!entranceVisible.value) resolve(true);
      else releaseEntrance = resolve;
    });
    host.__crossDistanceContext = {
      bindImageCache: target => bindForkImageCache(target),
      presentation: 'inline',
      uiScale: uiScale.value,
      initialize: () => createCombatGlobals(props.session.sourceMessageId, props.session),
      waitForEntrance: () => entranceGate,
      mounted: stop => {
        if (disposed || frame !== host) stop();
        else unmount = stop;
      },
      failed: error => {
        if (disposed || frame !== host) return;
        releaseEntrance?.(false);
        releaseEntrance = undefined;
        phase.value = 'error';
        console.error('[性斗（Battle Fuck）] 战斗页面初始化失败', error);
      },
      ready: (_root, stop, api) => {
        if (disposed || frame !== host) {
          stop();
          return;
        }
        unmount = stop;
        battleView.setApi(api);
        api.setUiScale(uiScale.value);
        stopHeaderSync = api.subscribeHeader(state => {
          header.value = state;
        });
        if (props.session.playerRefreshPending) requestPlayerRefresh(props.session);
        if (phase.value !== 'error') phase.value = 'ready';
      },
    };
    host.srcdoc = html;
    frameSlot.value.append(host);
  } catch (error) {
    phase.value = 'error';
    console.error('[性斗（Battle Fuck）] 打开同层战斗失败', error);
  }
}
function retryFrame() {
  entranceAttempt.value += 1;
  arenaRevealed.value = !entranceVisible.value;
  void loadFrame();
}
onMounted(loadFrame);
onBeforeUnmount(() => {
  disposed = true;
  battleView.detach();
  disposeFrame();
});
</script>

<style scoped>
.bp-inline-battle {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #eef8fc;
  color: #102a43;
  border: 1px solid #64d8f4;
}
.bp-inline-battle-entrance {
  position: absolute;
  inset: 0;
  z-index: 5;
}
.bp-inline-battle.has-entrance:not(.is-arena-revealed) > :is(.bp-inline-battle-header, .bp-inline-battle-body) {
  opacity: 0;
  transform: scale(1.035);
}
.bp-inline-battle.is-arena-revealed > :is(.bp-inline-battle-header, .bp-inline-battle-body) {
  transition:
    opacity 700ms ease,
    transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
}
.bp-inline-battle.is-motion-reduced > :is(.bp-inline-battle-header, .bp-inline-battle-body) {
  transform: none !important;
  transition-duration: 120ms;
}
@media (prefers-reduced-motion: reduce) {
  .bp-inline-battle > :is(.bp-inline-battle-header, .bp-inline-battle-body) {
    transform: none !important;
    transition-duration: 120ms !important;
  }
}
.bp-inline-battle-header {
  zoom: var(--bp-battle-ui-scale, 1);
  min-height: 54px;
  flex: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  justify-content: space-between;
  gap: clamp(12px, 2.4vw, 32px);
  padding: 8px 16px;
  border-bottom: 3px solid #25c9ed;
  background: #102a43;
  color: #fff;
}
.bp-inline-battle-match {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 24px;
  min-width: 0;
}
.bp-inline-battle-route {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.bp-inline-battle-route strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(13px, 1.3vw, 18px);
}
.bp-inline-battle-route > span {
  color: #69dced;
  font:
    italic 900 14px/1 'Bahnschrift',
    sans-serif;
}
.bp-inline-battle-boss {
  padding: 3px 5px;
  color: #ffdf59;
  border: 1px solid #ffdf5966;
  font-size: 9px;
}
.bp-inline-battle-turn {
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}
.bp-inline-battle-turn small {
  color: #97b8ca;
  font-size: 10px;
}
.bp-inline-battle-turn b {
  color: #69dced;
  font:
    italic 900 27px/1 'Bahnschrift',
    sans-serif;
}
.bp-inline-battle-turn > span {
  border-left: 1px solid #527187;
  padding-left: 9px;
  margin-left: 3px;
  font-size: 12px;
  color: #e2f5ff;
}
.bp-inline-battle-header nav {
  display: flex;
  align-items: center;
  flex: none;
  gap: 5px;
}
.bp-inline-battle-header button,
.bp-inline-battle-header nav > span {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 6px 12px;
  border: 0;
  font-size: 12px;
  font-weight: 800;
}
.bp-inline-battle-header .bp-inline-battle-motion {
  display: grid;
  place-items: center;
  width: 32px;
  min-height: 32px;
  padding: 6px;
  clip-path: none;
  border: 1px solid #477189;
  border-radius: 50%;
  background: transparent;
  color: #69dced;
}
.bp-inline-battle-motion svg {
  width: 14px;
  height: 14px;
}
.bp-inline-battle-header .bp-inline-battle-motion:hover {
  background: #24516d;
  color: #fff;
}
.bp-inline-battle-motion:disabled {
  opacity: 0.45;
  cursor: default;
}
.bp-inline-battle-header button {
  background: #fff;
  color: #102a43;
  cursor: pointer;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.bp-inline-battle-header button:hover {
  background: #69dced;
}
.bp-inline-battle-header button:focus-visible {
  outline: 2px solid #ffdf59;
  outline-offset: -3px;
}
.bp-inline-battle-header svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
}
.bp-inline-battle-header nav > span {
  color: #69dced;
}
.bp-inline-battle-scale {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border: 1px solid #477189;
  background: #0b2235;
}
.bp-inline-battle-scale > span {
  padding: 0 7px;
  font-size: 10px;
  color: #97b8ca;
  white-space: nowrap;
}
.bp-inline-battle-header .bp-inline-battle-scale-option {
  min-height: 28px;
  min-width: 50px;
  justify-content: center;
  padding: 4px 9px;
  clip-path: none;
  background: transparent;
  color: #c8e1ee;
  font-size: 11px;
}
.bp-inline-battle-header .bp-inline-battle-scale-option:hover {
  background: #24516d;
  color: #fff;
}
.bp-inline-battle-header .bp-inline-battle-scale-option.is-selected {
  background: #69dced;
  color: #102a43;
}
.bp-inline-battle-body {
  position: relative;
  flex: 1;
  min-height: 0;
}
.bp-inline-battle-frame-mount {
  width: 100%;
  height: 100%;
}
.bp-inline-battle-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  background: #eef8fc;
  font-size: calc(14px * var(--bp-battle-ui-scale, 1));
}
.bp-inline-battle-loading button {
  zoom: var(--bp-battle-ui-scale, 1);
  border: 1px solid #80cde4;
  background: #fff;
  color: #102a43;
  padding: 10px 16px;
  cursor: pointer;
}
@media (max-width: 600px) {
  .bp-inline-battle-header {
    padding: 7px 10px;
    min-height: 58px;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }
  .bp-inline-battle-match {
    display: grid;
    gap: 5px;
    grid-column: 1;
    grid-row: 1;
  }
  .bp-inline-battle-scale {
    grid-column: 1;
    grid-row: 2;
    justify-self: start;
  }
  .bp-inline-battle-scale > span {
    display: none;
  }
  .bp-inline-battle-header .bp-inline-battle-scale-option {
    min-height: 44px;
  }
  .bp-inline-battle-header nav {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
  }
  .bp-inline-battle-route {
    gap: 7px;
  }
  .bp-inline-battle-route strong {
    font-size: 12px;
  }
  .bp-inline-battle-route > span {
    font-size: 10px;
  }
  .bp-inline-battle-turn b {
    font-size: 18px;
  }
  .bp-inline-battle-turn > span {
    font-size: 10px;
  }
  .bp-inline-battle-header .bp-inline-battle-motion {
    width: 36px;
    min-height: 44px;
    border-radius: 5px;
  }
  .bp-inline-battle-header button {
    min-height: 44px;
    padding: 7px 10px;
  }
  .bp-inline-battle-header nav > span {
    display: none;
  }
}
</style>
