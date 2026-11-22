<template>
  <div class="profile-page">
    <button class="help-btn" @click="showHelp = true" title="玩法说明">
      <i class="fas fa-question"></i>
    </button>
    <button
      class="avatar-reset-btn"
      type="button"
      :disabled="!hasCustomAvatar"
      title="恢复默认头像"
      aria-label="恢复默认头像"
      @click="resetAvatarToDefault"
    >
      <i class="fas fa-rotate-left"></i>
    </button>

    <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
      <div class="help-modal" @click.stop>
        <div class="help-header">
          <div class="help-title">玩法说明</div>
          <button class="help-close" @click="showHelp = false" title="关闭">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="help-body">
          <div class="help-section">
            <div class="help-section-title">核心资源</div>
            <div class="help-text">
              <div>属性点：用于在“属性加点”中提升基础属性与上限。</div>
              <div>技能点：用于学习/升级技能（在技能页消耗）。</div>
              <div>经验值：累计保存，由脚本按固定阈值确定等级；经验条显示本级进度。100级封顶。</div>
              <div>每级自由属性点：先取潜力一半的整数，再减半；半点保留，天赋异秉额外加1点。技能点仍取潜力整数。</div>
              <div>耐力、快感上限和魅力、幸运按等级与当前潜力自动成长、多退少补；自由点和手动加点不抵扣成长。</div>
            </div>
          </div>

          <div class="help-section">
            <div class="help-section-title">基础属性</div>
            <div class="help-text">
              <div>加点修改的是基础值；最终显示值 = 基础属性 + 状态加成 + 装备加成 + 天赋加成。</div>
              <div>魅力与幸运从“基础属性”读取基础值，装备和状态只保留各自事实，页面实时计算总值。</div>
            </div>
          </div>

          <div class="help-section">
            <div class="help-section-title">战斗相关</div>
            <div class="help-text">
              <div>当前性斗力 = round( (基础性斗力 + 加成和) × (1 + 成算和/100) )。</div>
              <div>
                其中：加成和 = 临时.基础性斗力加成 + 永久.基础性斗力加成 + 装备.基础性斗力加成；成算和 =
                临时.基础性斗力成算 + 永久.基础性斗力成算 + 装备.基础性斗力成算。
              </div>
              <div>当前忍耐力 = round( (基础忍耐力 + 加成和) × (1 + 成算和/100) )。</div>
              <div>
                其中：加成和 = 临时.基础忍耐力加成 + 永久.基础忍耐力加成 + 装备.基础忍耐力加成；成算和 =
                临时.基础忍耐力成算 + 永久.基础忍耐力成算 + 装备.基础忍耐力成算。
              </div>
              <div>
                闪避率（上限70） = 基础闪避率 + (临时.闪避率加成) + (永久.闪避率加成) +
                (装备.闪避率加成)。前60%用于闪避50%快感，超过60%的部分用于完全闪避。
              </div>
              <div>
                暴击率（上限100） = clamp( 基础暴击率 + (临时.暴击率加成) + (永久.暴击率加成) + (装备.暴击率加成),
                0..100 )。
              </div>
              <div>段位：独立的进阶评价，不随等级自动变化。退魔仍在50级解锁。</div>
              <div>战斗判定（来自战斗计算）：</div>
              <div>
                - 闪避判定：战斗开始时按闪避率固定两种闪避的构成，前60%为闪避50%快感，60%~70%为完全闪避。
                每次攻击再按技能命中率和攻击者幸运计算有效总闪避率，并同比缩放两种闪避，比例不会改变。
              </div>
              <div>- 暴击判定：最终暴击率 = 攻击者暴击率 + (攻击者幸运/8) + 技能暴击修正</div>
              <div>
                - 忍耐减伤：减伤后伤害 = floor( 基础伤害 × 40 / (目标忍耐力 + 100 + 5*max(0, 敌方等级 - 玩家等级))
                )，最低为 1。
              </div>
            </div>
          </div>

          <div class="help-section">
            <div class="help-section-title">核心状态条</div>
            <div class="help-text">
              <div>耐力：行动与持续对抗的资源。显示为 当前耐力 / 最大耐力。</div>
              <div>快感：累积到上限会导致失败/高潮等结果（依战斗规则）。显示为 当前快感 / 最大快感。</div>
              <div>堕落度：代表角色当前倾向变化（以百分比显示），能够直接影响代表角色的“罪孽”（此处暂且保密）。</div>
            </div>
          </div>

          <div class="help-section">
            <div class="help-section-title">状态与加成</div>
            <div class="help-text">
              <div>永久状态：长期生效的标签/效果，每个状态携带自己的加成。</div>
              <div>临时状态：按“回合数”持续，结束后失效，同样可能产生临时加成。</div>
              <div>页面展示的加成汇总由状态列表实时计算，不写回变量。</div>
            </div>
          </div>

          <div class="help-section">
            <div class="help-section-title">装备与最终数值</div>
            <div class="help-text">
              <div>装备会提供加成属性，页面从装备栏实时汇总装备加成。</div>
              <div>常见口径：最终属性 ≈ 基础属性（基础xxx / 上限） + 永久加成 + 临时加成 + 装备加成。</div>
              <div>提示：具体公式以脚本结算为准；界面显示的是结算后的最终/实时结果。</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色头像 -->
    <div class="profile-header">
      <div class="profile-avatar" @click="handleAvatarClick">
        <div class="avatar-inner">
          <img v-if="avatarUrl" :src="avatarUrl" alt="头像" class="avatar-image" @error="handleImageError" />
          <i v-else class="fas fa-user"></i>
        </div>
        <div class="avatar-upload-hint">
          <i class="fas fa-camera"></i>
        </div>
      </div>
      <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="handleAvatarChange" />
      <div class="profile-summary">
        <div class="profile-name-panel">
          <span class="profile-field-caption">STUDENT PROFILE</span>
          <h2 class="profile-name">学员档案</h2>
        </div>
        <div class="profile-level">
          <span class="level-badge">
            <small>等级</small>
            <strong>Lv.{{ characterData.角色基础?._等级 || 1 }}</strong>
          </span>
          <span class="potential-badge">
            <small>潜力</small>
            <strong>{{ (characterData.核心状态?._潜力 || 5.0).toFixed(1) }}</strong>
          </span>
        </div>
        <div class="profile-pending-row" aria-label="档案信息">
          <span class="profile-pending-item">
            <small>学园段位</small>
            <strong>{{ characterData.角色基础?._段位 || '未定级' }}</strong>
          </span>
          <span class="profile-pending-item">
            <small>当前难度</small>
            <strong>{{ characterData.角色基础?.难度 || '普通' }}</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- 可用点数显示 -->
    <div class="points-section">
      <div class="points-card attribute-points">
        <i class="fas fa-star"></i>
        <div class="points-info">
          <span class="points-label">属性点</span>
          <span class="points-value">{{ characterData.核心状态?.$属性点 || 0 }}</span>
        </div>
      </div>
      <div class="points-card skill-points">
        <i class="fas fa-book-sparkles"></i>
        <div class="points-info">
          <span class="points-label">技能点</span>
          <span class="points-value">{{ characterData.核心状态?.$技能点 || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- 可加点属性 -->
    <div class="detail-card" v-if="availablePoints > 0">
      <div class="upgrade-card-header">
        <h3 class="detail-title">
          <i class="fas fa-plus-circle"></i> 属性加点
          <span class="points-remaining">(剩余 {{ availablePoints }} 点)</span>
        </h3>
        <div class="upgrade-mode-toggle" aria-label="属性加点倍率">
          <button
            type="button"
            :class="{ active: pointCostMultiplier === 1 }"
            title="每次消耗1点属性点"
            @click="setPointCostMultiplier(1)"
          >
            x1
          </button>
          <button
            type="button"
            :class="{ active: pointCostMultiplier === 10 }"
            :disabled="availablePoints < 10"
            title="每次消耗10点属性点"
            @click="setPointCostMultiplier(10)"
          >
            x10
          </button>
        </div>
      </div>
      <div class="attribute-upgrade-grid">
        <div class="upgrade-item" v-for="attr in upgradeableAttributes" :key="attr.key">
          <div class="upgrade-info">
            <i :class="['fas', attr.icon]"></i>
            <span class="upgrade-label">{{ attr.label }}</span>
            <span class="upgrade-value">{{ getAttributeValue(attr.key) }}</span>
          </div>
          <button
            class="upgrade-btn"
            :disabled="availablePoints < pointCostMultiplier || isUpgrading"
            :title="`消耗${pointCostMultiplier}点属性点`"
            @click="upgradeAttribute(attr.key, pointCostMultiplier)"
          >
            <i class="fas fa-plus"></i>
            <span>+{{ attr.increment * pointCostMultiplier }}{{ attr.isPercent ? '%' : '' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 核心属性卡片 -->
    <div class="stats-grid">
      <div class="stat-card charm">
        <div class="stat-icon"><i class="fas fa-heart"></i></div>
        <div class="stat-info">
          <div class="stat-label">魅力</div>
          <div class="stat-value">{{ derivedStats.charm }}</div>
        </div>
      </div>
      <div class="stat-card luck">
        <div class="stat-icon"><i class="fas fa-clover"></i></div>
        <div class="stat-info">
          <div class="stat-label">幸运</div>
          <div class="stat-value">{{ derivedStats.luck }}</div>
        </div>
      </div>
      <div class="stat-card combat">
        <div class="stat-icon"><i class="fas fa-fire"></i></div>
        <div class="stat-info">
          <div class="stat-label">性斗力</div>
          <div class="stat-value">{{ derivedStats.sexPower }}</div>
        </div>
      </div>
      <div class="stat-card endurance">
        <div class="stat-icon"><i class="fas fa-shield-halved"></i></div>
        <div class="stat-info">
          <div class="stat-label">忍耐力</div>
          <div class="stat-value">{{ derivedStats.endurance }}</div>
        </div>
      </div>
    </div>

    <!-- 核心状态 -->
    <div class="detail-card">
      <h3 class="detail-title"><i class="fas fa-chart-line"></i> 核心状态</h3>
      <div class="detail-list">
        <div class="progress-item">
          <div class="progress-header">
            <span><i class="fas fa-bolt"></i> 耐力</span>
            <span class="progress-value">
              {{ characterData.核心状态?.$耐力 || 100 }} / {{ characterData.核心状态?.$最大耐力 || 100 }}
            </span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill stamina"
              :style="{
                width: `${getPercentage(characterData.核心状态?.$耐力 || 100, characterData.核心状态?.$最大耐力 || 100)}%`,
              }"
            ></div>
          </div>
        </div>

        <div class="progress-item">
          <div class="progress-header">
            <span><i class="fas fa-heart-pulse"></i> 快感</span>
            <span class="progress-value">
              {{ characterData.核心状态?.$快感 || 0 }} / {{ characterData.核心状态?.$最大快感 || 100 }}
            </span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill lust"
              :style="{
                width: `${getPercentage(characterData.核心状态?.$快感 || 0, characterData.核心状态?.$最大快感 || 100)}%`,
              }"
            ></div>
          </div>
        </div>

        <div class="progress-item">
          <div class="progress-header">
            <span><i class="fas fa-star"></i> {{ experienceProgress.isMaxLevel ? '经验 · 已满级' : '本级经验' }}</span>
            <span class="progress-value">{{
              experienceProgress.isMaxLevel
                ? 'Lv.100'
                : `${experienceProgress.current} / ${experienceProgress.required}`
            }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill exp" :style="{ width: `${experienceProgress.percentage}%` }"></div>
          </div>
          <div class="progress-header">
            <span>累计 {{ experienceProgress.total }} 经验</span>
            <span v-if="!experienceProgress.isMaxLevel">距下一级 {{ experienceProgress.remaining }}</span>
            <span v-else>新增溢出经验转为天海信用点</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="identityMeters.length" class="detail-card">
      <h3 class="detail-title"><i class="fas fa-id-card"></i> 身份机制</h3>
      <div class="detail-list">
        <div v-for="meter in identityMeters" :key="meter.id" class="progress-item" :title="meter.description">
          <div class="progress-header">
            <span><i class="fas fa-heart"></i> {{ meter.name }}</span>
            <span class="progress-value">{{ meter.value }} / {{ meter.max }}</span>
          </div>
          <div
            class="progress-bar"
            role="progressbar"
            :aria-label="meter.name"
            :aria-valuenow="meter.value"
            :aria-valuemin="0"
            :aria-valuemax="meter.max"
          >
            <div class="progress-fill lust" :style="{ width: `${getPercentage(meter.value, meter.max)}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 战斗属性 -->
    <div class="detail-card">
      <h3 class="detail-title"><i class="fas fa-swords"></i> 战斗属性</h3>
      <div class="attribute-grid">
        <div class="attribute-item">
          <span class="attribute-label">闪避率</span>
          <span class="attribute-value dodge">{{ derivedStats.evasion }}%</span>
        </div>
        <div class="attribute-item">
          <span class="attribute-label">暴击率</span>
          <span class="attribute-value crit">{{ derivedStats.crit }}%</span>
        </div>
        <div class="attribute-item">
          <span class="attribute-label">堕落度</span>
          <span class="attribute-value corruption">{{ characterData.核心状态?.堕落度 || 0 }}%</span>
        </div>
        <div class="attribute-item">
          <span class="attribute-label">段位</span>
          <span class="attribute-value rank">{{ characterData.角色基础?._段位 || '无段位' }}</span>
        </div>
      </div>
    </div>

    <!-- 永久状态 -->
    <div class="detail-card" v-if="permanentStates && permanentStates.length > 0">
      <h3 class="detail-title"><i class="fas fa-gem"></i> 永久状态</h3>
      <div class="states-list">
        <span v-for="(state, index) in permanentStates" :key="index" class="state-tag permanent">
          <i class="fas fa-sparkles"></i> {{ state }}
        </span>
      </div>
      <!-- 加成汇总 -->
      <div v-if="hasPermanentBonuses" class="bonus-section">
        <div class="bonus-header">加成效果</div>
        <div class="bonus-grid">
          <div v-for="(value, key) in permanentBonuses" :key="key" class="bonus-item" v-show="value !== 0">
            <span class="bonus-label">{{ formatBonusLabel(String(key)) }}</span>
            <span class="bonus-value" :class="getBonusClass(Number(value))">
              {{ formatBonusValue(Number(value)) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 临时状态 -->
    <div class="detail-card" v-if="hasTempStates">
      <h3 class="detail-title"><i class="fas fa-clock"></i> 临时状态</h3>
      <div class="states-list">
        <span v-for="state in tempStates" :key="state.name" class="state-tag temp">
          <i class="fas fa-hourglass-half"></i> {{ state.name }}
          <span class="turns-badge">{{ state.turns }}回合</span>
        </span>
      </div>
      <!-- 临时加成汇总 -->
      <div v-if="hasTempBonuses" class="bonus-section">
        <div class="bonus-header">临时加成</div>
        <div class="bonus-grid">
          <div v-for="(value, key) in tempBonuses" :key="key" class="bonus-item" v-show="value !== 0">
            <span class="bonus-label">{{ formatBonusLabel(String(key)) }}</span>
            <span class="bonus-value" :class="getBonusClass(Number(value))">
              {{ formatBonusValue(Number(value)) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  clearStoredPlayerAvatar,
  resolveStoredPlayerAvatar,
  saveStoredPlayerAvatarBlob,
} from '../../../shared/localPreferences';
import { getLatestMvuData, replaceLatestMvuData, runLatestMvuTransaction } from '../../../shared/mvuStore';
import { allocateAttributePoints } from '../../../shared/attribute-growth';
import { getPermanentBonus, getPlayerDerivedStats, getTemporaryBonus } from '../../../shared/statSelectors';
import { getExperienceProgress } from '../../../shared/experience';
import { getDefaultPlayerAvatarUrl } from '../../phone/backstreetAvatarSettings';
import { readPlayerIdentityId } from '../../../../../identity/selection';
import { readIdentityMechanismMeters } from '../../../../../identity/mechanisms';
import { resolveIdentityPortraitProfile } from '../../../../../identity/presentation';
import { getRelationshipAvatarUrl } from '../../../../../assets/relationship-avatar';

const props = defineProps<{
  characterData: any;
  combatData: any;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const avatarUrl = ref<string>('');
const hasCustomAvatar = ref(false);
const showHelp = ref(false);
const isUpgrading = ref(false); // 防抖锁，防止快速点击
const pointCostMultiplier = ref<1 | 10>(1);

const derivedStats = computed(() => getPlayerDerivedStats(props.characterData || {}));
const identityId = computed(() => {
  void props.characterData;
  return readPlayerIdentityId('latest') ?? '';
});
const identityMeters = computed(() =>
  readIdentityMechanismMeters({ stat_data: props.characterData }, identityId.value),
);
const defaultAvatarUrl = computed(() => {
  const profile = resolveIdentityPortraitProfile(identityId.value);
  return (
    getRelationshipAvatarUrl(profile) ??
    profile?.portraitUrl ??
    getDefaultPlayerAvatarUrl(props.characterData?.角色基础?.性别)
  );
});

watch(defaultAvatarUrl, url => {
  if (!hasCustomAvatar.value) {
    avatarUrl.value = url;
  }
});

// 可用属性点
const availablePoints = computed(() => {
  return props.characterData.核心状态?.$属性点 || 0;
});

// 可加点的属性列表（只修改事实字段，最终值由 selector 实时计算）
const upgradeableAttributes = [
  { key: '基础属性._魅力', label: '魅力', icon: 'fa-heart', increment: 2, isPercent: false },
  { key: '基础属性._幸运', label: '幸运', icon: 'fa-clover', increment: 2, isPercent: false },
  { key: '基础属性._闪避率', label: '闪避率', icon: 'fa-running', increment: 1, isPercent: true },
  { key: '基础属性._暴击率', label: '暴击率', icon: 'fa-crosshairs', increment: 1, isPercent: true },
  { key: '核心状态.$最大耐力', label: '最大耐力', icon: 'fa-bolt', increment: 10, isPercent: false },
  { key: '核心状态.$最大快感', label: '最大快感', icon: 'fa-heart-pulse', increment: 10, isPercent: false },
];

function setPointCostMultiplier(multiplier: 1 | 10) {
  pointCostMultiplier.value = multiplier;
}

// 获取属性值
function getAttributeValue(key: string): number {
  const parts = key.split('.');
  let value: any = props.characterData;
  for (const part of parts) {
    value = value?.[part];
  }
  return value || 0;
}

// 升级属性
async function upgradeAttribute(key: string, pointCost = 1) {
  const cost = Math.max(1, Math.floor(Number(pointCost) || 1));

  // 防抖：如果正在升级中，直接返回
  if (isUpgrading.value) return;
  if (availablePoints.value < cost) return;

  // 设置防抖锁
  isUpgrading.value = true;

  try {
    await runLatestMvuTransaction('属性加点', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData?.stat_data) return;

      // 成长、自由点和投入账本在同一份楼层数据内结算、保存。
      if (!allocateAttributePoints(mvuData, key, cost)) return;
      await replaceLatestMvuData(mvuData);

      if (typeof toastr !== 'undefined') {
        toastr.success(`已消耗 ${cost} 点属性点`, '属性提升成功', { timeOut: 1500 });
      }
    });
  } catch (error) {
    console.error('[档案] 属性升级失败:', error);
    if (typeof toastr !== 'undefined') {
      toastr.error('属性升级失败', '错误', { timeOut: 2000 });
    }
  } finally {
    isUpgrading.value = false;
  }
}

// 永久状态
const permanentStates = computed(() => {
  return Object.keys(props.characterData.永久状态?.状态列表 || {});
});

const permanentBonuses = computed(() => {
  return getPermanentBonus(props.characterData || {});
});

const hasPermanentBonuses = computed(() => {
  const bonuses = permanentBonuses.value;
  return Object.values(bonuses).some((v: any) => v !== 0);
});

// 临时状态
const tempStates = computed(() => {
  return Object.entries(props.characterData.临时状态?.状态列表 || {}).map(([name, effect]: [string, any]) => ({
    name,
    turns: Math.max(0, Number(effect?.剩余回合 ?? 0) || 0),
  }));
});

const hasTempStates = computed(() => {
  return tempStates.value.length > 0;
});

const tempBonuses = computed(() => {
  return getTemporaryBonus(props.characterData || {});
});

const hasTempBonuses = computed(() => {
  const bonuses = tempBonuses.value;
  return Object.values(bonuses).some((v: any) => v !== 0);
});

// 从本地偏好加载头像
async function loadAvatarUrl() {
  try {
    const localSaved = await resolveStoredPlayerAvatar();
    if (localSaved && localSaved.trim()) {
      avatarUrl.value = localSaved;
      hasCustomAvatar.value = true;
      return;
    }
  } catch (err) {
    console.warn('[状态栏] 读取头像失败:', err);
  }
  avatarUrl.value = defaultAvatarUrl.value;
  hasCustomAvatar.value = false;
}

// 保存头像到本地偏好
async function saveAvatarFile(file: Blob) {
  try {
    avatarUrl.value = await saveStoredPlayerAvatarBlob(file);
    hasCustomAvatar.value = true;
    toastr.success('头像上传成功', '成功', { timeOut: 2000 });
  } catch (err) {
    console.error('[状态栏] 保存头像失败:', err);
    toastr.error('头像保存失败', '错误', { timeOut: 3000 });
  }
}

function resetAvatarToDefault() {
  clearStoredPlayerAvatar();
  avatarUrl.value = defaultAvatarUrl.value;
  hasCustomAvatar.value = false;
  toastr.success('已恢复默认头像', '成功', { timeOut: 2000 });
}

function handleAvatarClick() {
  fileInputRef.value?.click();
}

async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    toastr.error('请选择图片文件', '错误', { timeOut: 3000 });
    target.value = '';
    return;
  }

  // 检查文件大小（限制为25MB）
  if (file.size > 25 * 1024 * 1024) {
    toastr.error('图片大小不能超过25MB', '错误', { timeOut: 3000 });
    target.value = '';
    return;
  }

  await saveAvatarFile(file);

  // 清空input，允许重复选择同一文件
  target.value = '';
}

function handleImageError() {
  if (hasCustomAvatar.value) {
    avatarUrl.value = defaultAvatarUrl.value;
    hasCustomAvatar.value = false;
    return;
  }

  avatarUrl.value = '';
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

function getPercentage(current: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.max(0, (current / max) * 100));
}

const experienceProgress = computed(() => getExperienceProgress(props.characterData.角色基础?.经验值 || 0));

let stopAvatarUpdate: (() => void) | undefined;
onMounted(() => {
  void loadAvatarUrl();

  // 监听MVU变量更新，同步头像
  const globalAny = window as any;
  if (globalAny.eventOn && globalAny.Mvu) {
    const listener = globalAny.eventOn(globalAny.Mvu.events.VARIABLE_UPDATE_ENDED, () => {
      void loadAvatarUrl();
    });
    stopAvatarUpdate = () => listener.stop();
  }
});
onUnmounted(() => stopAvatarUpdate?.());
</script>

<style scoped lang="scss">
.profile-page {
  position: relative;
}

.help-btn,
.avatar-reset-btn {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--sk-ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: absolute;
  right: 12px;
  z-index: 30;

  &:hover {
    background: var(--sk-soft);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(1);
  }

  i {
    font-size: 13px;
    line-height: 1;
  }
}

.help-btn {
  top: 12px;
}

.avatar-reset-btn {
  top: 46px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.42;
  }

  &:disabled:hover {
    background: var(--sk-soft);
    transform: none;
  }
}

.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.help-modal {
  width: 100%;
  max-width: min(390px, calc(100vw - 36px), calc(100dvw - 36px));
  max-height: min(80vh, calc(100dvh - 36px));
  background: rgba(20, 20, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.help-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--sk-ink);
  letter-spacing: 0.5px;
}

.help-close {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--sk-ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--sk-soft);
  }

  i {
    font-size: 12px;
  }
}

.help-body {
  padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
  overflow: auto;
  max-height: calc(80vh - 52px);
}

.help-section {
  padding: 12px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  margin-bottom: 10px;
}

.help-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--sk-ink);
  margin-bottom: 8px;
}

.help-text {
  font-size: 13px;
  color: var(--sk-muted);
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.profile-page {
  padding: 16px 20px calc(16px + 84px + env(safe-area-inset-bottom));
  overflow-y: auto;
  flex: 1;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 16px;
  margin-bottom: 24px;
}

.profile-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 3px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);

    .avatar-upload-hint {
      opacity: 1;
    }
  }

  .avatar-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #1a1f35;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  i {
    font-size: 36px;
    color: var(--sk-muted);
  }

  .avatar-upload-hint {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    border: 2px solid #1a1f35;
    z-index: 10;

    i {
      font-size: 12px;
      color: var(--sk-ink);
    }
  }
}

.profile-name {
  margin-top: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sk-ink);
  letter-spacing: 0.5px;
}

.profile-level {
  display: flex;
  gap: 8px;
  margin-top: 8px;

  .level-badge,
  .potential-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .level-badge {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: var(--sk-ink);
  }

  .potential-badge {
    background: var(--sk-soft);
    color: var(--sk-ink);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}

.points-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.points-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  backdrop-filter: blur(10px);

  i {
    font-size: 20px;
  }

  &.attribute-points {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05));
    border: 1px solid rgba(251, 191, 36, 0.3);

    i {
      color: var(--sk-warning);
    }
    .points-value {
      color: var(--sk-warning);
    }
  }

  &.skill-points {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05));
    border: 1px solid rgba(139, 92, 246, 0.3);

    i {
      color: var(--sk-violet);
    }
    .points-value {
      color: var(--sk-violet);
    }
  }

  .points-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .points-label {
    font-size: 11px;
    color: var(--sk-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .points-value {
    font-size: 20px;
    font-weight: 700;
  }
}

.attribute-upgrade-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upgrade-card-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .detail-title {
    margin-bottom: 0;
  }
}

.upgrade-mode-toggle {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: var(--sk-soft);

  button {
    min-width: 42px;
    height: 28px;
    border: 0;
    border-radius: 9px;
    display: grid;
    place-items: center;
    color: var(--sk-muted);
    background: transparent;
    cursor: pointer;
    font-size: 12px;
    font-weight: 800;
    transition:
      color 0.16s ease,
      background 0.16s ease,
      box-shadow 0.16s ease;

    &.active {
      color: var(--sk-ink);
      background: linear-gradient(135deg, #667eea, #764ba2);
      box-shadow: 0 6px 14px rgba(102, 126, 234, 0.28);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.upgrade-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--sk-soft);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.upgrade-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 14px;
    color: var(--sk-violet);
    width: 20px;
    text-align: center;
  }

  .upgrade-label {
    font-size: 13px;
    color: var(--sk-ink);
    white-space: nowrap;
  }

  .upgrade-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--sk-ink);
    background: var(--sk-soft);
    padding: 2px 8px;
    border-radius: 6px;
  }
}

.upgrade-btn {
  min-width: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: var(--sk-ink);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.points-remaining {
  font-size: 12px;
  font-weight: normal;
  color: var(--sk-warning);
  margin-left: 8px;
}

@media (max-width: 380px) {
  .upgrade-card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .upgrade-mode-toggle {
    width: 100%;

    button {
      flex: 1;
    }
  }

  .upgrade-item {
    align-items: stretch;
    flex-direction: column;
  }

  .upgrade-btn {
    width: 100%;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &.charm {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.05));
    .stat-icon {
      color: var(--sk-pink);
    }
    .stat-value {
      color: var(--sk-pink);
    }
  }

  &.luck {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05));
    .stat-icon {
      color: var(--sk-warning);
    }
    .stat-value {
      color: var(--sk-warning);
    }
  }

  &.combat {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05));
    .stat-icon {
      color: var(--sk-danger);
    }
    .stat-value {
      color: var(--sk-danger);
    }
  }

  &.endurance {
    background: linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.05));
    .stat-icon {
      color: var(--sk-success);
    }
    .stat-value {
      color: var(--sk-success);
    }
  }

  .stat-icon {
    font-size: 20px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-info {
    flex: 1;
  }

  .stat-label {
    font-size: 11px;
    color: var(--sk-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
  }
}

.detail-card {
  padding: 16px;
  background: var(--sk-soft);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 16px;
}

.detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-ink);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 14px;
    color: var(--sk-violet);
  }
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--sk-ink);

  span:first-child {
    display: flex;
    align-items: center;
    gap: 6px;

    i {
      font-size: 12px;
      opacity: 0.7;
    }
  }

  .progress-value {
    color: var(--sk-muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
  }
}

.progress-bar {
  height: 6px;
  background: var(--sk-soft);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;

  &.stamina {
    background: linear-gradient(90deg, #34d399, #10b981);
  }

  &.lust {
    background: linear-gradient(90deg, #f472b6, #ec4899);
  }

  &.exp {
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
  }
}

.attribute-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.attribute-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--sk-soft);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.attribute-label {
  font-size: 12px;
  color: var(--sk-muted);
}

.attribute-value {
  font-size: 14px;
  font-weight: 600;

  &.dodge {
    color: var(--sk-blue);
  }
  &.crit {
    color: var(--sk-danger);
  }
  &.corruption {
    color: var(--sk-violet);
  }
  &.rank {
    color: var(--sk-warning);
  }
}

.states-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.state-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  i {
    font-size: 10px;
  }

  &.permanent {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(139, 92, 246, 0.1));
    color: var(--sk-violet);
    border: 1px solid rgba(167, 139, 250, 0.3);
  }

  &.temp {
    background: linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(59, 130, 246, 0.1));
    color: var(--sk-blue);
    border: 1px solid rgba(96, 165, 250, 0.3);
  }

  .turns-badge {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    margin-left: 4px;
  }
}

.bonus-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.bonus-header {
  font-size: 11px;
  color: var(--sk-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
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
  padding: 6px 10px;
  background: var(--sk-soft);
  border-radius: 8px;
  font-size: 12px;
}

.bonus-label {
  color: var(--sk-muted);
}

.bonus-value {
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
</style>
