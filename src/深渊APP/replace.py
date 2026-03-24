import re

file_path = r'f:\酒馆模板\src\深渊APP\App.vue'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# ═══════════════════════════════════════════════════
# 1. Update all toggle button click handlers to pass $event
# ═══════════════════════════════════════════════════

content = content.replace(
    "@click=\"toggleTamamoSection('core')\"",
    "@click=\"toggleTamamoSection('core', $event)\""
)
content = content.replace(
    "@click=\"toggleTamamoSection('tattoo')\"",
    "@click=\"toggleTamamoSection('tattoo', $event)\""
)
content = content.replace(
    "@click=\"toggleTamamoSection('trait')\"",
    "@click=\"toggleTamamoSection('trait', $event)\""
)
content = content.replace(
    "@click=\"toggleTamamoSection('item')\"",
    "@click=\"toggleTamamoSection('item', $event)\""
)
content = content.replace(
    "@click=\"toggleTamamoSection('cheat')\"",
    "@click=\"toggleTamamoSection('cheat', $event)\""
)
content = content.replace(
    "@click=\"toggleTamamoSection('overview')\"",
    "@click=\"toggleTamamoSection('overview', $event)\""
)
content = content.replace(
    "@click=\"toggleTamamoSection('index')\"",
    "@click=\"toggleTamamoSection('index', $event)\""
)

# ═══════════════════════════════════════════════════
# 2. Replace toggleTamamoSection function with sakura burst version
# ═══════════════════════════════════════════════════

old_fn = '''function toggleTamamoSection(section: TamamoSectionKey) {\r\n  tamamoSectionOpen.value[section] = !tamamoSectionOpen.value[section];\r\n}'''

new_fn = '''function spawnSakuraBurst(evt: MouseEvent) {
  const btn = evt.currentTarget as HTMLElement;
  const card = btn.closest('.tamamo-card') || btn.closest('.tamamo-scroll');
  if (!card) return;
  const container = document.createElement('div');
  container.className = 'sakura-burst-container';
  (card as HTMLElement).appendChild(container);
  const count = 12;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('span');
    petal.className = 'sakura-burst-petal';
    const angle = (360 / count) * i + (Math.random() * 30 - 15);
    const dist = 40 + Math.random() * 60;
    const size = 6 + Math.random() * 8;
    const dur = 0.6 + Math.random() * 0.5;
    petal.style.setProperty('--burst-angle', angle + 'deg');
    petal.style.setProperty('--burst-dist', dist + 'px');
    petal.style.setProperty('--burst-size', size + 'px');
    petal.style.setProperty('--burst-dur', dur + 's');
    petal.style.setProperty('--burst-rot', (Math.random() * 360) + 'deg');
    container.appendChild(petal);
  }
  setTimeout(() => { container.remove(); }, 1200);
}

function toggleTamamoSection(section: TamamoSectionKey, evt?: MouseEvent) {
  tamamoSectionOpen.value[section] = !tamamoSectionOpen.value[section];
  if (evt) spawnSakuraBurst(evt);
}'''

content = content.replace(old_fn, new_fn)

# Also try with \n line endings in case
old_fn_lf = old_fn.replace('\r\n', '\n')
if old_fn not in content and old_fn_lf not in content:
    # Try a more flexible approach
    content = content.replace(
        'function toggleTamamoSection(section: TamamoSectionKey) {\n  tamamoSectionOpen.value[section] = !tamamoSectionOpen.value[section];\n}',
        new_fn.replace('\r\n', '\n')
    )

# ═══════════════════════════════════════════════════
# 3. Add sakura burst CSS before .toast {
# ═══════════════════════════════════════════════════

sakura_burst_css = r'''
/* ========== SAKURA BURST ON SCROLL TOGGLE ========== */
.sakura-burst-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 0;
  z-index: 10;
  pointer-events: none;
}

.sakura-burst-petal {
  position: absolute;
  width: var(--burst-size, 8px);
  height: var(--burst-size, 8px);
  background: radial-gradient(circle, #f0b4cc, #e8a0bf);
  border-radius: 12px 0 12px 0;
  opacity: 0;
  box-shadow: 0 0 6px rgba(232, 160, 191, 0.5);
  animation: sakuraBurst var(--burst-dur, 0.8s) ease-out forwards;
}

@keyframes sakuraBurst {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  30% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform:
      translate(
        calc(cos(var(--burst-angle)) * var(--burst-dist)),
        calc(sin(var(--burst-angle)) * var(--burst-dist))
      )
      rotate(var(--burst-rot, 180deg))
      scale(0.3);
  }
}

'''

content = content.replace('.toast {', sakura_burst_css + '.toast {')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Sakura burst effect added successfully!")
