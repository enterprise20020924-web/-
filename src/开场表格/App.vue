<template>
  <div class="tamamo-opening">
    <!-- Sakura Petals -->
    <div class="sakura-petals" aria-hidden="true">
      <span v-for="i in 12" :key="`petal-${i}`" class="sakura-petal"></span>
    </div>

    <!-- Foxfire Particles -->
    <div class="foxfire-layer" aria-hidden="true">
      <span v-for="i in 10" :key="`foxfire-${i}`" class="foxfire-dot"></span>
    </div>

    <!-- Shoji Shadow -->
    <div class="shoji-shadow" aria-hidden="true"></div>

    <!-- ===== HERO HEADER ===== -->
    <header class="hero-header">
      <div class="fox-ear fox-ear-left" aria-hidden="true"></div>
      <div class="fox-ear fox-ear-right" aria-hidden="true"></div>
      <div class="caster-circle" aria-hidden="true"></div>
      <span class="torii-frame torii-top" aria-hidden="true"></span>
      <span class="torii-frame torii-bottom" aria-hidden="true"></span>
      <span class="tamamo-moon" aria-hidden="true"></span>

      <div class="hero-copy">
        <p class="hero-eyebrow">Fate / Caster · 玉藻前御前录入台</p>
        <h1>开局身份录入</h1>
        <p class="hero-sub">填写开局身份信息，一键开局。</p>
      </div>

      <div class="mikon-banner">
        <span class="mikon-icon" aria-hidden="true"></span>
        ✦ LUST CODE ✦
        <span class="mikon-icon" aria-hidden="true"></span>
      </div>
    </header>

    <!-- ===== FORM SCROLL ===== -->
    <section class="form-scroll">
      <div class="scroll-rod scroll-rod-top" aria-hidden="true"></div>

      <div class="form-body">
        <!-- 姓名 -->
        <div class="field-group">
          <label class="field-label">
            姓名 <span class="required-star">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            class="tamamo-input"
            placeholder="例如：雨宫 夜澪"
          />
        </div>

        <!-- 性别 -->
        <div class="field-group">
          <label class="field-label">
            性别 <span class="required-star">*</span>
          </label>
          <select v-model="formData.gender" class="tamamo-select">
            <option value="" disabled>请选择</option>
            <option value="男">男</option>
            <option value="女">女</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <!-- 身份标识 -->
        <div class="field-group">
          <label class="field-label">
            身份标识 <span class="required-star">*</span>
          </label>
          <textarea
            v-model="formData.identity"
            class="tamamo-input tamamo-textarea"
            placeholder="例如：成熟御姐女教师｜危险美艳黑帮夫人｜娇纵财阀千金"
          ></textarea>
        </div>

        <!-- 身份标识示例 -->
        <div class="field-group">
          <label class="field-label field-label-hint">身份标识示例（点击填入）</label>
          <div class="example-tags">
            <button
              v-for="tag in identityExamples"
              :key="tag"
              class="example-tag"
              @click="appendIdentity(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- 额外设定 -->
        <div class="field-group">
          <label class="field-label">额外设定（可选）</label>
          <textarea
            v-model="formData.extra"
            class="tamamo-input tamamo-textarea"
            placeholder="例如：性格偏好、禁忌、互动节奏、剧情雷点、服装风格、口癖等"
          ></textarea>
        </div>
      </div>

      <div class="scroll-rod scroll-rod-bottom" aria-hidden="true"></div>
    </section>

    <!-- ===== ACTION BUTTONS ===== -->
    <footer class="action-bar">
      <button class="action-btn action-btn-primary" :disabled="!isValid" @click="handleStart">
        一键开局
      </button>
      <button class="action-btn action-btn-secondary" @click="handleCopy">
        复制设定文本
      </button>
      <button class="action-btn action-btn-secondary" @click="handleClear">
        清空表单
      </button>
      <span class="action-status">{{ statusText }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
interface FormData {
  name: string;
  gender: string;
  identity: string;
  extra: string;
}

const formData = ref<FormData>({
  name: '',
  gender: '',
  identity: '',
  extra: '',
});

const statusText = ref('等待填写');

const identityExamples = [
  '成熟御姐女教师',
  '危险美艳黑帮夫人',
  '娇纵财阀千金',
  '清冷病娇研究员',
  '温柔人妻邻居',
];

const isValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.identity.trim() !== '';
});

function appendIdentity(tag: string) {
  const current = formData.value.identity.trim();
  if (current) {
    formData.value.identity = current + '｜' + tag;
  } else {
    formData.value.identity = tag;
  }
}

function buildSettingText(): string {
  const lines: string[] = [];
  lines.push(`姓名：${formData.value.name}`);
  if (formData.value.gender) {
    lines.push(`性别：${formData.value.gender}`);
  }
  lines.push(`身份标识：${formData.value.identity}`);
  if (formData.value.extra.trim()) {
    lines.push(`额外设定：${formData.value.extra}`);
  }
  return lines.join('\n');
}

async function handleStart() {
  if (!isValid.value) return;
  try {
    statusText.value = '正在写入灵基…';
    const data = {
      name: formData.value.name.trim(),
      gender: formData.value.gender,
      identity: formData.value.identity.trim(),
      extra: formData.value.extra.trim(),
    };
    replaceVariables(data, { type: 'chat' });
    statusText.value = '灵基铭刻完成 ✦';
    toastr.success('开局身份已录入！');
  } catch (e) {
    console.error('开局录入失败', e);
    statusText.value = '录入失败，请重试';
    toastr.error('录入失败');
  }
}

async function handleCopy() {
  const text = buildSettingText();
  try {
    await navigator.clipboard.writeText(text);
    statusText.value = '已复制到剪贴板 ✦';
    toastr.success('设定文本已复制');
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    statusText.value = '已复制到剪贴板 ✦';
    toastr.success('设定文本已复制');
  }
}

function handleClear() {
  formData.value = { name: '', gender: '', identity: '', extra: '' };
  statusText.value = '等待填写';
}
</script>

<style lang="scss" scoped>
/* =====================================================
   Color Tokens — Tamamo-no-Mae / FGO Caster Palette
   ===================================================== */
$gold:        #c9a84c;
$gold-light:  #e8c86a;
$gold-pale:   #f0e6d3;
$purple:      #9b72cf;
$purple-deep: #280f3c;
$pink:        #e8a0bf;
$bg-dark:     #0f0d1a;
$bg-card:     rgba(20, 12, 28, 0.93);
$text-main:   rgba(240, 230, 211, 0.88);
$foxfire-blue: rgba(74, 140, 255, 0.9);
$foxfire-pink: rgba(232, 160, 191, 0.9);

/* =====================================================
   Root Container
   ===================================================== */
.tamamo-opening {
  position: relative;
  width: 100%;
  padding: 24px 16px 28px;
  font-family: 'Noto Serif SC', 'Georgia', serif;
  color: $text-main;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 30% 10%, rgba(74, 140, 255, 0.04), transparent 55%),
    radial-gradient(ellipse at 70% 90%, rgba(232, 160, 191, 0.04), transparent 55%),
    linear-gradient(180deg, $bg-dark 0%, $purple-deep 50%, $bg-dark 100%);
}

/* =====================================================
   Sakura Petals
   ===================================================== */
.sakura-petals {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.sakura-petal {
  position: absolute;
  width: 10px;
  height: 10px;
  background: radial-gradient(circle, rgba(255, 183, 197, 0.85), rgba(255, 183, 197, 0) 70%);
  border-radius: 50% 0 50% 0;
  opacity: 0;
  animation: sakuraFall linear infinite;
}

@for $i from 1 through 12 {
  .sakura-petal:nth-child(#{$i}) {
    left: #{($i * 8) % 100}#{'%'};
    width: #{6 + ($i % 4) * 2}px;
    height: #{6 + ($i % 4) * 2}px;
    animation-duration: #{8 + ($i % 5) * 3}s;
    animation-delay: #{-($i * 1.3)}s;
  }
}

@keyframes sakuraFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
  10%  { opacity: 0.7; }
  90%  { opacity: 0.5; }
  100% { transform: translateY(calc(100cqb + 40px)) rotate(360deg); opacity: 0; }
}

/* =====================================================
   Foxfire Particles
   ===================================================== */
.foxfire-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.foxfire-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  animation: foxfireFloat linear infinite, foxfirePulse ease-in-out infinite alternate;
}

.foxfire-dot:nth-child(odd) {
  background: radial-gradient(circle, $foxfire-blue, rgba(74, 140, 255, 0));
  box-shadow: 0 0 8px rgba(74, 140, 255, 0.6), 0 0 20px rgba(74, 140, 255, 0.2);
}

.foxfire-dot:nth-child(even) {
  background: radial-gradient(circle, $foxfire-pink, rgba(232, 160, 191, 0));
  box-shadow: 0 0 8px rgba(232, 160, 191, 0.6), 0 0 20px rgba(232, 160, 191, 0.2);
}

.foxfire-dot:nth-child(1)  { left: 5%;  top: 12%; width: 3px; height: 3px; animation-duration: 12s, 2.5s; animation-delay: 0s; }
.foxfire-dot:nth-child(2)  { left: 88%; top: 22%; width: 5px; height: 5px; animation-duration: 15s, 3s;   animation-delay: -2s; }
.foxfire-dot:nth-child(3)  { left: 20%; top: 40%; width: 4px; height: 4px; animation-duration: 10s, 2s;   animation-delay: -4s; }
.foxfire-dot:nth-child(4)  { left: 72%; top: 8%;  width: 3px; height: 3px; animation-duration: 14s, 3.5s; animation-delay: -1s; }
.foxfire-dot:nth-child(5)  { left: 48%; top: 55%; width: 5px; height: 5px; animation-duration: 11s, 2.8s; animation-delay: -3s; }
.foxfire-dot:nth-child(6)  { left: 12%; top: 72%; width: 4px; height: 4px; animation-duration: 13s, 2.2s; animation-delay: -5s; }
.foxfire-dot:nth-child(7)  { left: 92%; top: 48%; width: 3px; height: 3px; animation-duration: 16s, 3.2s; animation-delay: -2s; }
.foxfire-dot:nth-child(8)  { left: 38%; top: 82%; width: 5px; height: 5px; animation-duration: 9s, 2.6s;  animation-delay: -4s; }
.foxfire-dot:nth-child(9)  { left: 62%; top: 30%; width: 4px; height: 4px; animation-duration: 12s, 3s;   animation-delay: -1s; }
.foxfire-dot:nth-child(10) { left: 3%;  top: 90%; width: 3px; height: 3px; animation-duration: 14s, 2.4s; animation-delay: -3s; }

@keyframes foxfireFloat {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(15px, -20px); }
  50%  { transform: translate(-10px, -8px); }
  75%  { transform: translate(8px, 12px); }
  100% { transform: translate(0, 0); }
}

@keyframes foxfirePulse {
  0%   { opacity: 0.2; transform: scale(0.6); }
  100% { opacity: 0.8; transform: scale(1.2); }
}

/* =====================================================
   Shoji Shadow
   ===================================================== */
.shoji-shadow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0px, transparent 80px,
      rgba(201, 168, 76, 0.02) 80px, rgba(201, 168, 76, 0.02) 82px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0px, transparent 120px,
      rgba(201, 168, 76, 0.015) 120px, rgba(201, 168, 76, 0.015) 122px
    );
  opacity: 0.6;
}

/* =====================================================
   HERO HEADER
   ===================================================== */
.hero-header {
  position: relative;
  z-index: 1;
  padding: 28px 20px 20px;
  border-radius: 24px;
  overflow: visible;
  border: 1px solid rgba($gold, 0.45);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%, rgba(255, 255, 255, 0.02) 80%),
    radial-gradient(ellipse at 30% 20%, rgba(74, 140, 255, 0.06), transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(232, 160, 191, 0.05), transparent 50%),
    radial-gradient(circle at top, rgba($purple, 0.18), transparent 40%),
    radial-gradient(circle at 85% 18%, rgba($gold, 0.12), transparent 30%),
    linear-gradient(180deg, rgba($bg-dark, 0.97) 0%, rgba($purple-deep, 0.9) 42%, rgba($bg-dark, 1) 100%);
  box-shadow:
    inset 0 0 0 1px rgba($gold, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 42px rgba(10, 5, 18, 0.6),
    0 0 0 1px rgba($purple, 0.15);
  animation: heroShimmer 6s ease-in-out infinite;
  margin-bottom: 18px;
}

.hero-header::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  pointer-events: none;
  z-index: 0;
  background: repeating-linear-gradient(135deg, transparent, transparent 2px, rgba($gold, 0.008) 2px, rgba($gold, 0.008) 3px);
  mix-blend-mode: overlay;
}

@keyframes heroShimmer {
  0%, 100% {
    box-shadow:
      inset 0 0 0 1px rgba($gold, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 18px 42px rgba(10, 5, 18, 0.6),
      0 0 0 1px rgba($purple, 0.15);
  }
  50% {
    box-shadow:
      inset 0 0 0 1px rgba($gold, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 18px 42px rgba(10, 5, 18, 0.6),
      0 0 20px rgba(74, 140, 255, 0.04),
      0 0 0 1px rgba($purple, 0.22);
  }
}

/* Fox Ears */
.fox-ear {
  position: absolute;
  top: -14px;
  width: 0;
  height: 0;
  z-index: 3;
  filter: drop-shadow(0 0 8px rgba($gold, 0.4));
}

.fox-ear-left {
  left: 28px;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-bottom: 22px solid rgba($gold, 0.55);
}

.fox-ear-right {
  right: 28px;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-bottom: 22px solid rgba($gold, 0.55);
}

/* Caster Circle */
.caster-circle {
  position: absolute;
  top: -24px;
  right: -24px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px dashed rgba($gold, 0.25);
  background: repeating-radial-gradient(circle, transparent, transparent 10px, rgba($gold, 0.03) 10px, rgba($gold, 0.03) 20px);
  animation: rotateCircle 40s linear infinite;
  pointer-events: none;
}

@keyframes rotateCircle {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Torii Frame bars */
.torii-frame {
  position: absolute;
  height: 8px;
  background: linear-gradient(90deg, transparent, rgba(191, 64, 64, 0.75), transparent);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(191, 64, 64, 0.4);
}

.torii-top {
  top: 14px;
  left: 20px;
  width: 60px;
}

.torii-bottom {
  bottom: 16px;
  right: 20px;
  width: 80px;
}

/* Moon */
.tamamo-moon {
  position: absolute;
  top: 10px;
  right: 80px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, rgba($gold-light, 0.9), rgba($gold, 0.3));
  box-shadow: 0 0 16px rgba($gold, 0.4), 0 0 40px rgba($gold, 0.15);
  animation: moonGlow 4s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes moonGlow {
  0%   { box-shadow: 0 0 16px rgba($gold, 0.4), 0 0 40px rgba($gold, 0.15); }
  100% { box-shadow: 0 0 24px rgba($gold, 0.6), 0 0 60px rgba($gold, 0.25); }
}

/* Hero Copy */
.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: $pink;
}

h1 {
  margin: 10px 0 0;
  font-size: 30px;
  line-height: 1.1;
  letter-spacing: 0.06em;
  font-weight: 900;
  background: linear-gradient(135deg, $gold-light 0%, $gold-pale 25%, $gold 50%, $gold-pale 75%, $gold-light 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 8px rgba($gold, 0.4)) drop-shadow(0 0 20px rgba($gold, 0.15));
  animation: titleEnchant 4s linear infinite;
}

@keyframes titleEnchant {
  0%   { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.hero-sub {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: rgba($gold-pale, 0.75);
}

/* Mikon Banner */
.mikon-banner {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  padding: 10px 20px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: $gold;
  border-radius: 12px;
  border: 1px solid rgba($gold, 0.35);
  background: linear-gradient(135deg, rgba($gold, 0.08), rgba($purple, 0.06));
  box-shadow: 0 0 18px rgba($gold, 0.1);
  animation: bannerPulse 3s ease-in-out infinite alternate;
}

@keyframes bannerPulse {
  0%   { box-shadow: 0 0 18px rgba($gold, 0.1); }
  100% { box-shadow: 0 0 28px rgba($gold, 0.22); }
}

.mikon-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, $foxfire-blue, transparent);
  vertical-align: middle;
  margin: 0 6px;
  animation: foxfirePulse 2s ease-in-out infinite alternate;
}

/* =====================================================
   FORM SCROLL
   ===================================================== */
.form-scroll {
  position: relative;
  z-index: 1;
  margin-bottom: 18px;
}

/* Scroll Rods */
.scroll-rod {
  width: calc(100% + 16px);
  margin-left: -8px;
  height: 16px;
  border-radius: 8px;
  background:
    repeating-linear-gradient(90deg,
      rgba(90, 60, 20, 0.15) 0px, transparent 2px, transparent 8px, rgba(90, 60, 20, 0.1) 10px),
    repeating-linear-gradient(85deg,
      rgba(60, 40, 10, 0.08) 0px, transparent 1px, transparent 14px),
    linear-gradient(180deg,
      #5a3c14 0%, #8b6420 10%, #a17a2a 20%, #c9a84c 40%, #e8c86a 50%, #c9a84c 60%, #a17a2a 80%, #8b6420 90%, #5a3c14 100%);
  position: relative;
  z-index: 2;
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(255, 255, 255, 0.18),
    inset 0 -2px 0 rgba(0, 0, 0, 0.3),
    inset 0 0 4px rgba(90, 60, 20, 0.2);
  animation: foxfireReflect 5s ease-in-out infinite;
}

@keyframes foxfireReflect {
  0%, 100% { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.3); }
  33%      { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.3), 0 0 12px rgba(74, 140, 255, 0.12); }
  66%      { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.3), 0 0 12px rgba(232, 160, 191, 0.1); }
}

/* Scroll Rod Knobs — Jade */
.scroll-rod::before,
.scroll-rod::after {
  content: '';
  position: absolute;
  top: -5px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.3), transparent 40%),
    radial-gradient(circle at 50% 50%, #7ab68a, #3d7a52 50%, #1a4a2a 100%);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.6),
    inset 0 1px 2px rgba(255, 255, 255, 0.35),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3),
    0 0 6px rgba(74, 180, 120, 0.2);
}

.scroll-rod::before { left: -9px; }
.scroll-rod::after  { right: -9px; }

/* Form Body (parchment area between rods) */
.form-body {
  padding: 20px 18px;
  background:
    repeating-linear-gradient(90deg,
      rgba(80, 55, 20, 0.04) 0px, transparent 1px, transparent 12px),
    repeating-linear-gradient(87deg,
      rgba(60, 40, 15, 0.03) 0px, transparent 1px, transparent 18px),
    linear-gradient(180deg, $bg-card, rgba(25, 15, 35, 0.89));
  border-left: 2px solid rgba($gold, 0.2);
  border-right: 2px solid rgba($gold, 0.2);
  position: relative;
  display: grid;
  gap: 18px;
  animation: bodyFoxfire 6s ease-in-out infinite;
}

@keyframes bodyFoxfire {
  0%, 100% { border-left-color: rgba($gold, 0.2); border-right-color: rgba($gold, 0.2); }
  33%      { border-left-color: rgba(74, 140, 255, 0.2); border-right-color: rgba(74, 140, 255, 0.15); }
  66%      { border-left-color: rgba(232, 160, 191, 0.18); border-right-color: rgba(232, 160, 191, 0.15); }
}

.form-body::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba($gold, 0.06), transparent 15%, transparent 85%, rgba($gold, 0.06));
  pointer-events: none;
}

/* Metal corner accents */
.form-scroll::before,
.form-scroll::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  z-index: 3;
  pointer-events: none;
}

.form-scroll::before {
  top: 16px;
  left: 0;
  border-top: 2px solid rgba($gold, 0.5);
  border-left: 2px solid rgba($gold, 0.5);
  box-shadow: -1px -1px 4px rgba($gold, 0.15), inset 1px 1px 2px rgba($gold, 0.1);
}

.form-scroll::after {
  bottom: 16px;
  right: 0;
  border-bottom: 2px solid rgba($gold, 0.5);
  border-right: 2px solid rgba($gold, 0.5);
  box-shadow: 1px 1px 4px rgba($gold, 0.15), inset -1px -1px 2px rgba($gold, 0.1);
}

/* =====================================================
   FORM FIELDS
   ===================================================== */
.field-group {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 700;
  color: $gold-pale;
  letter-spacing: 0.04em;
}

.field-label-hint {
  font-size: 12px;
  font-weight: 600;
  color: rgba($gold-pale, 0.6);
}

.required-star {
  color: $pink;
  margin-left: 2px;
  font-weight: 700;
}

.tamamo-input,
.tamamo-select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba($purple, 0.3);
  background: rgba($bg-dark, 0.65);
  color: $gold-pale;
  padding: 12px 14px;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.25s, box-shadow 0.25s;
  box-sizing: border-box;
}

.tamamo-input::placeholder,
.tamamo-select::placeholder {
  color: rgba($pink, 0.35);
}

.tamamo-input:focus,
.tamamo-select:focus {
  outline: none;
  border-color: rgba($gold, 0.55);
  box-shadow: 0 0 0 3px rgba($gold, 0.1), 0 0 16px rgba($gold, 0.08);
}

.tamamo-textarea {
  min-height: 88px;
  resize: vertical;
  line-height: 1.65;
}

.tamamo-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c9a84c' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
  cursor: pointer;
}

/* =====================================================
   EXAMPLE TAGS
   ===================================================== */
.example-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-tag {
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  border-radius: 20px;
  border: 1px solid rgba($pink, 0.35);
  background: linear-gradient(135deg, rgba($pink, 0.1), rgba($purple, 0.08));
  color: $pink;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.example-tag:hover {
  border-color: rgba($gold, 0.5);
  background: linear-gradient(135deg, rgba($gold, 0.15), rgba($purple, 0.1));
  color: $gold-light;
  box-shadow: 0 0 14px rgba($gold, 0.15);
  transform: translateY(-1px);
}

.example-tag:active {
  transform: translateY(0);
  box-shadow: 0 0 8px rgba($gold, 0.1);
}

/* =====================================================
   ACTION BAR
   ===================================================== */
.action-bar {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.action-btn {
  padding: 12px 22px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.action-btn-primary {
  border: none;
  background: linear-gradient(135deg, $gold 0%, #a17a2a 100%);
  color: #1a0f28;
  box-shadow: 0 4px 14px rgba($gold, 0.3);
}

.action-btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba($gold, 0.45);
  transform: translateY(-1px);
}

.action-btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba($gold, 0.25);
}

.action-btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-btn-secondary {
  border: 1px solid rgba($purple, 0.35);
  background: rgba($bg-dark, 0.7);
  color: #c4b0e0;
}

.action-btn-secondary:hover {
  border-color: rgba($gold, 0.4);
  background: linear-gradient(135deg, rgba($gold, 0.12), rgba($purple, 0.08));
  color: $gold;
  box-shadow: 0 0 12px rgba($gold, 0.12);
}

.action-status {
  font-size: 12px;
  color: rgba($gold-pale, 0.5);
  letter-spacing: 0.05em;
  margin-left: 4px;
}

/* =====================================================
   RESPONSIVE
   ===================================================== */
@media (max-width: 480px) {
  .hero-header {
    padding: 22px 14px 16px;
  }

  h1 {
    font-size: 24px;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .action-btn {
    text-align: center;
  }

  .action-status {
    text-align: center;
    margin-left: 0;
  }
}
</style>
