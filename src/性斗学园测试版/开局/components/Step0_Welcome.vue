<template>
  <div class="opening-step opening-step-welcome archive-welcome">
    <section class="archive-welcome-cover" aria-labelledby="archive-welcome-title">
      <div class="archive-welcome-cover-copy">
        <span class="archive-welcome-eyebrow"><i aria-hidden="true"></i> 天海学园 · 新生登记</span>
        <h3 id="archive-welcome-title" class="archive-welcome-title">你的故事，<br /><em>从这里入档。</em></h3>
        <p class="archive-welcome-intro">从一个名字，到独一无二的你。<br />写下你的来历，开启属于你的学园生活。</p>
        <span class="archive-welcome-cover-caption"><b>01</b> 新的篇章，等待落笔。</span>
      </div>
      <slot name="cover-visual"><AdmissionCampusSeal /></slot>
      <div class="archive-welcome-cover-footer" aria-hidden="true">
        <span>ADMISSION FILE / AMAMI</span><i></i><span>YOUR STORY BEGINS</span>
      </div>
    </section>
    <details class="archive-welcome-environment" :data-status="environmentStatus">
      <summary>
        <i :class="['fas', statusIcon(environmentStatus), 'archive-welcome-environment-icon']" aria-hidden="true"></i>
        <span class="archive-welcome-environment-copy"
          ><strong>{{ environmentStatusLabel }}</strong
          ><small>登记环境</small></span
        >
        <span class="archive-welcome-environment-count"
          >{{ environmentPassedCount }} / {{ environmentChecks.length }}</span
        >
        <i class="fas fa-chevron-down archive-welcome-chevron" aria-hidden="true"></i>
      </summary>
      <div class="archive-welcome-environment-body">
        <div class="archive-welcome-check-heading">
          <p>酒馆助手、提示词模板与 MVU 变量的准备情况。</p>
          <button class="archive-welcome-recheck" type="button" :disabled="isChecking" @click="runEnvironmentCheck">
            <i :class="['fas', isChecking ? 'fa-spinner animate-spin' : 'fa-rotate-right', 'mr-2']"></i>
            重新检测
          </button>
        </div>

        <div class="archive-welcome-check-list">
          <div
            v-for="item in environmentChecks"
            :key="item.id"
            class="archive-welcome-check-item"
            :data-status="item.status"
          >
            <i :class="['fas', statusIcon(item.status)]" aria-hidden="true"></i>
            <div>
              <div class="archive-welcome-check-item-title">
                <strong>{{ item.label }}</strong
                ><span>{{ statusText(item.status) }}</span>
              </div>
              <p>{{ item.detail }}</p>
            </div>
          </div>
        </div>
        <p v-if="environmentSummary" class="archive-welcome-check-note">{{ environmentSummary }}</p>
      </div>
    </details>

    <header class="archive-welcome-library-heading">
      <h3>填报资料室</h3>
      <span>需要时，随手翻阅。</span><i aria-hidden="true"></i>
    </header>
    <section class="archive-welcome-library" aria-label="填报资料室">
      <details class="archive-welcome-help" open>
        <summary>
          <span><i class="fas fa-heart" aria-hidden="true"></i> 制作信息与发布入口</span>
        </summary>
        <div class="space-y-4 text-sm leading-relaxed text-gray-200">
          <p>
            你好，这里是前端作者“𝒱𝒾𝓃
            ”，本卡由“芙芙可爱捏”，“𝒱𝒾𝓃”与“114514·Remilia”共同创作，仅在类脑与旅程免费发布/更新。
          </p>
          <div class="flex flex-col gap-2">
            <a
              class="text-secondary decoration-secondary/40 underline underline-offset-4 hover:decoration-secondary"
              href="https://discord.com/channels/1134557553011998840/1423668401422729452"
              target="_blank"
              rel="noreferrer"
            >
              类脑发布帖
            </a>
            <a
              class="text-secondary decoration-secondary/40 underline underline-offset-4 hover:decoration-secondary"
              href="https://discord.com/channels/1291925535324110879/1415162247139037304"
              target="_blank"
              rel="noreferrer"
            >
              旅程发布帖
            </a>
          </div>
        </div>
      </details>

      <details class="archive-welcome-help" open>
        <summary>
          <span><i class="fas fa-sliders" aria-hidden="true"></i> 已测试模型与预设</span>
        </summary>
        <div class="space-y-2 text-sm text-gray-200">
          <div>Claude opus 4.6: Ny/Mur鹿鹿预设</div>
          <div>Gemini 3.1 pro: Izumi</div>
        </div>
      </details>

      <details class="archive-welcome-help" open>
        <summary>
          <span><i class="fas fa-circle-check" aria-hidden="true"></i> 开始前的准备事项</span>
        </summary>
        <div class="space-y-2 text-sm text-gray-200">
          <div class="text-base">
            1. 酒馆助手与提示词模板已安装并更新到<span class="font-bold text-red-400">最新版本</span>
          </div>
          <div>2. 酒馆助手渲染已开启且小白x渲染已关闭</div>
          <div>3. 开梯子！开梯子！开梯子！</div>
          <div>4. 世界书有COT，请自行缝进预设，帖子内看标注有教程，不行去答疑区问。</div>
        </div>
      </details>

      <details class="archive-welcome-help" open>
        <summary>
          <span><i class="fas fa-circle-question" aria-hidden="true"></i> 常见问题与使用帮助</span>
        </summary>
        <div class="space-y-4 text-sm leading-relaxed text-gray-200">
          <div>
            <div class="font-semibold text-white">Q: 我为什么看不到前端？</div>
            <div>
              A: 如果你确保开了梯子的话，那就是你网络太差了。去正则把
              正文UI/并行事件UI/选项UI/变量更新UI/战斗UI/开局美化
              一共6个正则关闭，并拉到局部正则最下面开启对应的6个备用正则。
            </div>
          </div>

          <div>
            <div class="font-semibold text-white">Q: 我为什么找不到状态栏？</div>
            <div>A: 状态栏现在通过屏幕上的小手机悬浮球开启，拖到顺手的位置后会记住。</div>
          </div>

          <div>
            <div class="font-semibold text-white">Q: 世界书好多灰色条目，需要开吗？</div>
            <div>A: 别动，不需要开。</div>
          </div>

          <div>
            <div class="font-semibold text-white">Q: 不同的难度有什么影响？会不会很难啊？</div>
            <div>A: 难度直接影响开局点数，升级所需经验与敌人数值，会直接大幅度影响体验。</div>
          </div>

          <div>
            <div class="font-semibold text-white">Q: 我为什么无法进入性斗？我需要从哪里进入性斗？</div>
            <div>
              A:
              请确保你的选项UI的外观与其他UI一致，如果不一致就说明你的正则冲突了，其他的选项正则把我的正则覆盖掉了，请自行寻找查找正则表达式带&lt;option&gt;的全局/预设正则并关闭。（正文UI同理，但正文UI没那么重要）
            </div>
          </div>

          <div>
            <div class="font-semibold text-white">Q: 为什么我看不到立绘/cg？</div>
            <div>A: 所有立绘与cg皆在性斗中查看，部分角色暂无cg。想知道哪些角色有cg可以自行在对应帖子下查找。</div>
          </div>

          <div>
            <div class="font-semibold text-white">Q: 为什么明明AI更新了xxx变量，我却没有在状态栏中看到？</div>
            <div>
              A: 绝大部分变量不由AI管理也不能管理，皆有脚本操控。对于目前AI可影响的变量请自行查看“Zod 变量结构”脚本。
            </div>
          </div>

          <div>
            <div class="font-semibold text-white">Q: 为什么AI说的和我的状态栏不一样？</div>
            <div>A: 以状态栏为主，AI会口胡。</div>
          </div>

          <div>
            <div class="font-semibold text-white">Q: 更新后需要重开吗？</div>
            <div>A: 不需要，只需要重新读取一遍初始变量即可。</div>
          </div>

          <div class="pt-2 text-gray-300">如果你已经阅读完毕，欢迎进入下一页。</div>
        </div>
      </details>
    </section>
  </div>
</template>

<script setup lang="ts">
import { compare } from 'compare-versions';
import { computed, onMounted, ref } from 'vue';
import AdmissionCampusSeal from './AdmissionCampusSeal.vue';
import './admission-welcome.scss';

type CheckStatus = 'checking' | 'pass' | 'fail' | 'warn';

type EnvironmentCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

const REQUIRED_TAVERN_HELPER_VERSION = '4.8.4';
const isChecking = ref(false);
const environmentChecks = ref<EnvironmentCheck[]>([
  {
    id: 'tavern-helper',
    label: '酒馆助手版本',
    status: 'checking',
    detail: `需要酒馆助手版本大于 ${REQUIRED_TAVERN_HELPER_VERSION}。`,
  },
  {
    id: 'prompt-template',
    label: '提示词模板',
    status: 'checking',
    detail: '正在检测提示词模板插件是否安装并开启渲染。',
  },
  {
    id: 'mvu',
    label: 'MVU 脚本',
    status: 'checking',
    detail: '正在检测 MVU 脚本是否开启，并确认已读取性斗学园初始变量。',
  },
]);

const environmentSummary = computed(() => {
  if (isChecking.value) {
    return '';
  }
  const failed = environmentChecks.value.filter(item => item.status === 'fail');
  if (failed.length === 0) {
    return '';
  }
  return `检测到 ${failed.length} 项环境异常，请先修正后再继续开局。`;
});

const environmentPassedCount = computed(() => environmentChecks.value.filter(item => item.status === 'pass').length);
const environmentStatus = computed<CheckStatus>(() => {
  if (isChecking.value || environmentChecks.value.some(item => item.status === 'checking')) return 'checking';
  if (environmentChecks.value.some(item => item.status === 'fail')) return 'fail';
  if (environmentChecks.value.some(item => item.status === 'warn')) return 'warn';
  return 'pass';
});
const environmentStatusLabel = computed(
  () =>
    ({
      checking: '正在准备登记环境…',
      pass: '一切就绪，随时开始',
      fail: '有项目需要处理，展开查看',
      warn: '有项目需要确认，展开查看',
    })[environmentStatus.value],
);

function updateCheck(id: string, patch: Partial<EnvironmentCheck>) {
  environmentChecks.value = environmentChecks.value.map(item => (item.id === id ? { ...item, ...patch } : item));
}

function statusIcon(status: CheckStatus): string {
  if (status === 'pass') return 'fa-check';
  if (status === 'fail') return 'fa-xmark';
  if (status === 'warn') return 'fa-triangle-exclamation';
  return 'fa-spinner animate-spin';
}

function statusText(status: CheckStatus): string {
  if (status === 'pass') return '通过';
  if (status === 'fail') return '未通过';
  if (status === 'warn') return '需确认';
  return '检测中';
}

async function runEnvironmentCheck() {
  isChecking.value = true;
  environmentChecks.value = environmentChecks.value.map(item => ({ ...item, status: 'checking' }));

  await Promise.all([checkTavernHelperVersion(), checkPromptTemplate(), checkMvu()]);
  isChecking.value = false;
}

async function checkTavernHelperVersion() {
  try {
    const globalAny = window as any;
    const versionGetter = globalAny.getTavernHelperVersion;
    if (typeof versionGetter !== 'function') {
      updateCheck('tavern-helper', {
        status: 'fail',
        detail: '未检测到 getTavernHelperVersion，请确认酒馆助手已安装并启用。',
      });
      return;
    }

    const version = String(await versionGetter());
    const isCompatible = compare(version, REQUIRED_TAVERN_HELPER_VERSION, '>');
    updateCheck('tavern-helper', {
      status: isCompatible ? 'pass' : 'fail',
      detail: isCompatible
        ? `当前版本 ${version}，满足 > ${REQUIRED_TAVERN_HELPER_VERSION}。`
        : `当前版本 ${version}，需要升级到大于 ${REQUIRED_TAVERN_HELPER_VERSION}。`,
    });
  } catch (error) {
    updateCheck('tavern-helper', {
      status: 'fail',
      detail: `酒馆助手版本读取失败：${formatError(error)}`,
    });
  }
}

async function checkPromptTemplate() {
  try {
    const globalAny = window as any;
    await waitGlobal(globalAny, 'EjsTemplate');

    const template = globalAny.EjsTemplate;
    if (!template || typeof template.getFeatures !== 'function') {
      updateCheck('prompt-template', {
        status: 'fail',
        detail: '未检测到提示词模板插件 EjsTemplate，请确认插件已安装。',
      });
      return;
    }

    const features = template.getFeatures();
    const enabled = Boolean(features?.enabled);
    const renderEnabled = Boolean(features?.render_enabled);
    updateCheck('prompt-template', {
      status: enabled && renderEnabled ? 'pass' : 'fail',
      detail:
        enabled && renderEnabled
          ? '提示词模板已安装，插件与楼层渲染均已开启。'
          : `提示词模板已安装，但${enabled ? '' : '插件未开启'}${!enabled && !renderEnabled ? '，且' : ''}${
              renderEnabled ? '' : '楼层渲染未开启'
            }。`,
    });
  } catch (error) {
    updateCheck('prompt-template', {
      status: 'fail',
      detail: `提示词模板检测失败：${formatError(error)}`,
    });
  }
}

async function checkMvu() {
  try {
    const globalAny = window as any;
    await waitGlobal(globalAny, 'Mvu');

    const mvu = globalAny.Mvu;
    if (!mvu || typeof mvu.getMvuData !== 'function') {
      updateCheck('mvu', {
        status: 'fail',
        detail: '未检测到 MVU 全局对象，请确认 MVU 脚本已安装并开启。',
      });
      return;
    }

    const mvuData = mvu.getMvuData({ type: 'message', message_id: 'latest' });
    const initializedLorebooks = Object.keys(mvuData?.initialized_lorebooks ?? {});
    const statData = mvuData?.stat_data ?? {};
    const hasSexBattleVars =
      initializedLorebooks.includes('性斗学园') ||
      Boolean(statData?.角色基础 || statData?.核心状态 || statData?.性斗系统);

    updateCheck('mvu', {
      status: hasSexBattleVars ? 'pass' : 'warn',
      detail: hasSexBattleVars
        ? 'MVU 脚本已开启，并已检测到性斗学园变量数据。'
        : 'MVU 脚本已开启，但未检测到性斗学园初始变量；请重新读取初始变量或确认“变量结构”脚本已启用。',
    });
  } catch (error) {
    updateCheck('mvu', {
      status: 'fail',
      detail: `MVU 检测失败：${formatError(error)}`,
    });
  }
}

async function waitGlobal(globalAny: any, key: string) {
  if (typeof globalAny.waitGlobalInitialized === 'function') {
    try {
      await Promise.race([
        globalAny.waitGlobalInitialized(key),
        new Promise(resolve => {
          setTimeout(resolve, 3000);
        }),
      ]);
    } catch (error) {
      console.warn(`[开局环境监测] 等待 ${key} 初始化时出现异常:`, error);
    }
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

onMounted(() => {
  void runEnvironmentCheck();
});
</script>
