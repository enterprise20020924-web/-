<template>
  <Transition name="sk-phone">
    <div
      v-if="isVisible"
      ref="phoneRoot"
      class="status-bar-overlay sda-ui sda-phone-ui skylink-phone"
      :data-motion="motionReduced ? 'reduced' : 'full'"
      @click.self="close"
      @keydown.esc="close"
    >
      <div ref="phoneContainerRef" class="status-bar-container" :style="phonePositionStyle" @click.stop>
        <div class="phone-device" :class="{ 'phone-dragging': isPhoneDragging, 'phone-lite-visuals': isLiteVisuals }">
          <div class="phone-frame" :class="phoneFrameClasses" :style="phoneStyle">
            <div
              ref="phoneDragHandleRef"
              class="phone-drag-handle"
              :class="{ dragging: isPhoneDragging }"
              role="button"
              tabindex="0"
              title="拖动小手机"
              aria-label="拖动小手机"
              @pointerdown="handlePhonePointerDown"
              @keydown.space.prevent="resetPhonePosition"
              @keydown.enter.prevent="resetPhonePosition"
            >
              <span class="phone-drag-grip" aria-hidden="true"></span>
            </div>
            <div class="phone-wallpaper" :style="wallpaperLayerStyle">
              <img v-if="customWallpaperSrc" class="phone-wallpaper-image" :src="customWallpaperSrc" alt="" />
            </div>
            <div class="phone-tint"></div>
            <div class="sk-phone-hardware">
              <span>{{ currentTime }}</span>
              <span class="sk-phone-camera" aria-hidden="true"><i></i></span>
              <span class="sk-phone-hardware-icons" aria-hidden="true"
                ><i class="fas fa-signal"></i><i class="fas fa-wifi"></i><i class="fas fa-battery-full"></i
              ></span>
            </div>
            <main class="phone-screen" :class="{ 'phone-screen-app': currentPage !== 'home' }">
              <Transition name="sk-page" mode="out-in">
                <section v-if="currentPage === 'home'" class="home-screen">
                  <header class="sk-home-brand">
                    <span class="sk-home-controls">
                      <button
                        class="sk-motion-toggle"
                        type="button"
                        :aria-label="motionReduced ? '开启动效' : '减少动效'"
                        :title="motionReduced ? '开启动效' : '减少动效'"
                        @click="toggleMotion"
                      >
                        <i :class="motionReduced ? 'fas fa-play' : 'fas fa-pause'"></i>
                      </button>
                      <button class="sk-power" type="button" title="关闭小手机" aria-label="关闭小手机" @click="close">
                        <i class="fas fa-power-off"></i>
                      </button>
                    </span>
                  </header>
                  <div class="sk-home-hero">
                    <div class="sk-hero-grid" aria-hidden="true"></div>
                    <div class="sk-home-orbit"><SkylinkOrbit /></div>
                    <span class="sk-kicker">PERSONAL ACCESS / 01</span>
                    <button class="sk-clock" type="button" aria-label="查看学园状态" @click="setPage('dashboard')">
                      <span>{{ currentTime }}</span>
                      <small>{{ currentDate }}</small>
                    </button>
                    <div class="sk-welcome">
                      <span>WELCOME BACK,</span><strong>{{ terminalUserName }}</strong>
                    </div>
                    <button class="sk-location-strip" type="button" @click="setPage('map')">
                      <i class="fas fa-location-dot"></i><span>{{ currentLocation }}</span
                      ><small>{{ currentCoordinate }}</small
                      ><i class="fas fa-arrow-up-right-from-square"></i>
                    </button>
                  </div>
                  <div class="sk-home-metrics">
                    <button type="button" @click="setPage('profile')">
                      <small>LEVEL</small
                      ><strong
                        >{{ characterData.角色基础?._等级 || 1
                        }}<em> / {{ characterData.角色基础?._段位 || '未定级' }}</em></strong
                      >
                    </button>
                    <button type="button" @click="setPage('inventory')">
                      <small>CREDITS</small
                      ><strong>{{ Number(characterData.物品系统?._天海信用点 || 0).toLocaleString() }}<em> CP</em></strong>
                    </button>
                  </div>
                  <div class="sk-home-apps">
                    <div class="sk-section-caption"><span>APPLICATIONS</span><i></i><b>07</b></div>
                    <div class="sk-app-grid">
                      <button
                        v-for="(app, index) in homeApps"
                        :key="app.page"
                        class="phone-app"
                        :class="`phone-app-${app.page}`"
                        :style="{ '--sk-order': index }"
                        type="button"
                        @click="setPage(app.page)"
                      >
                        <span class="app-icon" :class="app.colorClass">
                          <i :class="app.icon"></i>
                          <span
                            v-if="app.page === 'settings' && hasScriptUpdate"
                            class="script-update-dot"
                            aria-hidden="true"
                          ></span>
                        </span>
                        <span class="app-label">{{ app.label }}</span>
                        <span class="sk-app-index">0{{ index + 1 }}</span>
                      </button>
                      <button
                        class="phone-app sk-motion-app"
                        type="button"
                        :style="{ '--sk-order': 7 }"
                        :aria-pressed="!motionReduced"
                        @click="toggleMotion"
                      >
                        <span class="app-icon app-cyan"
                          ><i :class="motionReduced ? 'fas fa-play' : 'fas fa-wave-square'"></i></span
                        ><span class="app-label">{{ motionReduced ? '静态' : '动效' }}</span
                        ><span class="sk-app-index">FX</span>
                      </button>
                    </div>
                  </div>
                  <button class="sk-message-ticket" type="button" @click="setPage('backstreet')">
                    <span class="sk-ticket-icon"><i class="fas fa-comments"></i></span
                    ><span><small>SOCIAL FREQUENCY</small><strong>后街 · 连接你的学园日常</strong></span
                    ><i class="fas fa-arrow-right"></i>
                  </button>
                  <div class="dock-shell">
                    <div class="dock">
                      <button
                        v-for="app in dockApps"
                        :key="app.page"
                        class="dock-app"
                        type="button"
                        @click="setPage(app.page)"
                      >
                        <span class="app-icon" :class="app.colorClass">
                          <i :class="app.icon"></i>
                          <span
                            v-if="app.page === 'settings' && hasScriptUpdate"
                            class="script-update-dot"
                            aria-hidden="true"
                          ></span>
                        </span>
                        <span class="app-label">{{ app.label }}</span>
                      </button>
                    </div>
                  </div>
                </section>

                <section
                  v-else
                  :key="currentPage"
                  class="app-page-shell"
                  :class="[`app-page-${currentPage}`, { 'app-page-shell-flush': currentPage === 'backstreet' }]"
                >
                  <header v-if="currentPage !== 'backstreet'" class="app-page-header">
                    <button class="back-button" type="button" title="返回桌面" @click="setPage('home')">
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="app-page-title">
                      <span class="page-icon" :class="currentApp?.colorClass">
                        <i :class="currentApp?.icon || 'fas fa-mobile-alt'"></i>
                        <span
                          v-if="currentPage === 'settings' && hasScriptUpdate"
                          class="script-update-dot"
                          aria-hidden="true"
                        ></span>
                      </span>
                      <span class="app-page-title-copy">
                        <small>SKYLINK / APPLICATION</small>
                        <span>{{ currentPageTitle }}</span>
                      </span>
                    </div>
                    <button class="sk-power" type="button" title="关闭小手机" aria-label="关闭小手机" @click="close">
                      <i class="fas fa-power-off"></i>
                    </button>
                  </header>

                  <div
                    class="status-content"
                    :class="[`status-content-${currentPage}`, { 'status-content-flush': currentPage === 'backstreet' }]"
                  >
                    <DashboardPage v-if="currentPage === 'dashboard'" :character-data="characterData" />

                    <ProfilePage
                      v-if="currentPage === 'profile'"
                      :character-data="characterData"
                      :combat-data="combatData"
                    />

                    <InventoryPage v-if="currentPage === 'inventory'" :character-data="characterData" />

                    <QuestPage v-if="currentPage === 'quest'" :character-data="characterData" />

                    <RelationshipPage v-if="currentPage === 'relationship'" :character-data="characterData" />

                    <BackstreetPage
                      v-if="currentPage === 'backstreet'"
                      :character-data="characterData"
                      @back-home="setPage('home')"
                    />

                    <SkillPage v-if="currentPage === 'skills'" :character-data="characterData" />

                    <MapPage v-if="currentPage === 'map'" :character-data="characterData" />

                    <ShopPage v-if="currentPage === 'shop'" :character-data="characterData" />

                    <CGPage v-if="currentPage === 'cg'" :character-data="characterData" />

                    <div v-if="currentPage === 'settings'" class="settings-page">
                      <header class="settings-page-intro">
                        <div class="settings-intro-mark" aria-hidden="true">
                          <i class="fas fa-sliders"></i>
                        </div>
                        <div class="settings-intro-copy">
                          <span class="settings-intro-eyebrow">FATRIA / CONTROL ROOM</span>
                          <h1>设置中心</h1>
                          <p>调整手机界面、战斗规则与后街服务</p>
                        </div>
                        <span class="settings-sync-state"><i class="fas fa-circle"></i> 已同步</span>
                      </header>

                      <div class="settings-quick-grid" aria-label="当前设置摘要">
                        <div class="settings-quick-stat">
                          <span class="settings-quick-icon quick-icon-combat"
                            ><i class="fas fa-shield-halved"></i
                          ></span>
                          <span
                            ><strong>{{ enemyTraitsEnabled ? '词条开启' : '词条关闭' }}</strong
                            ><small>敌人规则</small></span
                          >
                        </div>
                        <div class="settings-quick-stat">
                          <span class="settings-quick-icon quick-icon-pools"><i class="fas fa-layer-group"></i></span>
                          <span
                            ><strong>{{ npcSkillPools.length }} 个技能池</strong><small>NPC 抽取范围</small></span
                          >
                        </div>
                        <div class="settings-quick-stat">
                          <span class="settings-quick-icon quick-icon-theme"><i class="fas fa-palette"></i></span>
                          <span
                            ><strong>{{ currentThemeLabel }}</strong
                            ><small>当前主题</small></span
                          >
                        </div>
                      </div>

                      <details class="settings-category-panel combat-settings-panel" open>
                        <summary class="settings-category-heading">
                          <span class="settings-category-title"><i class="fas fa-crosshairs"></i>战斗设置</span>
                          <small class="settings-category-badge">词条 · NPC</small>
                        </summary>

                        <section class="settings-section settings-section-compact combat-feature-card">
                          <div class="combat-feature-copy">
                            <span class="combat-feature-icon trait-icon"><i class="fas fa-tags"></i></span>
                            <span class="combat-feature-text">
                              <strong>敌人词条</strong>
                              <small>关闭后会清除当前聊天中已有的敌人词条</small>
                            </span>
                            <label class="combat-switch" title="切换敌人词条">
                              <input type="checkbox" :checked="enemyTraitsEnabled" @change="toggleEnemyTraitsSetting" />
                              <span class="combat-switch-track"><span class="combat-switch-thumb"></span></span>
                            </label>
                          </div>
                        </section>

                        <section class="settings-section settings-section-compact combat-pool-card">
                          <div class="settings-section-title">
                            <span><i class="fas fa-layer-group"></i>NPC 技能池</span>
                            <small>限制非角色库 NPC 的技能系</small>
                          </div>
                          <div class="npc-skill-pool-grid">
                            <label
                              v-for="family in npcSkillFamilyOptions"
                              :key="family"
                              class="npc-skill-pool-option"
                              :class="[`pool-${family}`, { selected: npcSkillPools.includes(family) }]"
                            >
                              <input
                                class="skill-pool-checkbox"
                                type="checkbox"
                                :checked="npcSkillPools.includes(family)"
                                @change="toggleNpcSkillPool(family, $event)"
                              />
                              <span class="npc-skill-pool-mark"><i :class="SKILL_FAMILY_ICONS[family]"></i></span>
                              <span class="npc-skill-pool-name">{{ SKILL_FAMILY_NAMES[family] }}</span>
                              <span class="npc-skill-pool-check"><i class="fas fa-check"></i></span>
                            </label>
                          </div>
                          <p class="settings-help-text"><i class="fas fa-circle-info"></i> 至少保留一个技能池</p>
                        </section>
                      </details>

                      <details class="settings-category-panel" open>
                        <summary class="settings-category-heading">
                          <span>界面显示</span>
                          <small>外观与入口</small>
                        </summary>
                        <label class="settings-row sk-motion-setting">
                          <span class="settings-row-icon"><i class="fas fa-wave-square"></i></span>
                          <span class="settings-row-label">界面动效</span>
                          <button type="button" :aria-pressed="!motionReduced" @click="toggleMotion">
                            {{ motionReduced ? '已减少' : '已开启' }}
                          </button>
                        </label>

                        <section class="settings-section">
                          <div class="settings-section-title">
                            <span>手机屏幕背景</span>
                            <small>桌面与应用底图</small>
                          </div>

                          <div class="wallpaper-preview-card" :style="wallpaperLayerStyle">
                            <img
                              v-if="customWallpaperSrc"
                              class="wallpaper-preview-image"
                              :src="customWallpaperSrc"
                              alt=""
                            />
                            <div class="wallpaper-preview-status">
                              <span>{{ currentTime }}</span>
                              <span>{{ currentLocation }}</span>
                            </div>
                            <button
                              class="wallpaper-camera-button"
                              type="button"
                              title="上传背景图"
                              aria-label="上传背景图"
                              @click="openWallpaperFilePicker"
                            >
                              <i class="fas fa-camera"></i>
                            </button>
                          </div>

                          <div class="wallpaper-preset-grid">
                            <button
                              v-for="preset in WALLPAPER_PRESETS"
                              :key="preset.value"
                              class="wallpaper-preset-button"
                              :class="{
                                active: phonePrefs.wallpaperPreset === preset.value && !phonePrefs.wallpaperUrl,
                              }"
                              type="button"
                              @click="selectWallpaperPreset(preset.value)"
                            >
                              <span
                                class="wallpaper-preset-swatch"
                                :style="{ backgroundImage: preset.background }"
                              ></span>
                              <span>{{ preset.label }}</span>
                            </button>
                          </div>

                          <label class="settings-text-field">
                            <span>图片地址</span>
                            <input v-model="phonePrefs.wallpaperUrl" type="text" placeholder="https://..." />
                          </label>

                          <div class="settings-actions">
                            <button class="settings-action-primary" type="button" @click="openWallpaperFilePicker">
                              <i class="fas fa-image"></i>
                              上传图片
                            </button>
                            <button type="button" @click="clearWallpaper">
                              <i class="fas fa-rotate-left"></i>
                              恢复默认
                            </button>
                          </div>

                          <input
                            ref="wallpaperInputRef"
                            class="wallpaper-file-input"
                            type="file"
                            accept="image/*"
                            @change="handleWallpaperFileSelected"
                          />
                        </section>

                        <section class="settings-section">
                          <div class="settings-section-title">
                            <span>界面显示</span>
                            <small>字体与主题</small>
                          </div>

                          <label class="settings-row">
                            <span class="settings-row-icon"><i class="fas fa-font"></i></span>
                            <span class="settings-row-label">界面字体</span>
                            <select v-model="phonePrefs.fontFamily">
                              <option v-for="font in PHONE_FONT_OPTIONS" :key="font.value" :value="font.value">
                                {{ font.label }}
                              </option>
                            </select>
                          </label>

                          <label class="settings-row">
                            <span class="settings-row-icon"><i class="fas fa-palette"></i></span>
                            <span class="settings-row-label">主题色</span>
                            <select v-model="phonePrefs.theme">
                              <option v-for="theme in PHONE_THEME_OPTIONS" :key="theme.value" :value="theme.value">
                                {{ theme.label }}
                              </option>
                            </select>
                          </label>
                        </section>

                        <section class="settings-section">
                          <div class="settings-section-title">
                            <span>图标美化</span>
                            <small>桌面与入口</small>
                          </div>

                          <div class="icon-style-group">
                            <div class="icon-style-label">桌面 App</div>
                            <div class="icon-style-grid">
                              <button
                                v-for="style in APP_ICON_STYLE_OPTIONS"
                                :key="style.value"
                                class="icon-style-button"
                                :class="{ active: phonePrefs.appIconStyle === style.value }"
                                type="button"
                                @click="phonePrefs.appIconStyle = style.value"
                              >
                                <span class="icon-style-preview" :class="`preview-app-${style.value}`">
                                  <i class="fas fa-id-card"></i>
                                </span>
                                <span>{{ style.label }}</span>
                              </button>
                            </div>
                          </div>

                          <div class="icon-style-group">
                            <div class="icon-style-label">悬浮入口</div>
                            <div class="settings-helper">
                              随配色切换：湖蓝显示阿洛娜，午夜显示普拉娜。拖动角色可移动入口。
                            </div>
                          </div>
                        </section>

                        <section class="settings-section settings-section-compact">
                          <div class="settings-section-title">
                            <span>背景细节</span>
                            <small>透明度与质感</small>
                          </div>

                          <label class="settings-slider-row">
                            <span>
                              <span>壁纸强度</span>
                              <strong>{{ phonePrefs.wallpaperOpacity }}%</strong>
                            </span>
                            <input
                              v-model.number="phonePrefs.wallpaperOpacity"
                              type="range"
                              min="20"
                              max="100"
                              step="5"
                            />
                          </label>

                          <label class="settings-slider-row">
                            <span>
                              <span>背景模糊</span>
                              <strong>{{ phonePrefs.wallpaperBlur }}px</strong>
                            </span>
                            <input v-model.number="phonePrefs.wallpaperBlur" type="range" min="0" max="16" step="1" />
                          </label>

                          <label class="settings-slider-row">
                            <span>
                              <span>遮罩深度</span>
                              <strong>{{ phonePrefs.tintStrength }}%</strong>
                            </span>
                            <input v-model.number="phonePrefs.tintStrength" type="range" min="0" max="70" step="5" />
                          </label>

                          <label class="settings-row">
                            <span class="settings-row-icon"><i class="fas fa-gauge-high"></i></span>
                            <span class="settings-row-label">视觉效果</span>
                            <select v-model="phonePrefs.visualMode">
                              <option v-for="mode in PHONE_VISUAL_MODE_OPTIONS" :key="mode.value" :value="mode.value">
                                {{ mode.label }}
                              </option>
                            </select>
                          </label>
                        </section>
                      </details>

                      <section class="settings-section cheat-code-section">
                        <div class="settings-section-title">
                          <span>兑换码</span>
                        </div>

                        <form class="cheat-code-form" @submit.prevent="redeemPhoneCheatCode">
                          <label class="settings-text-field">
                            <span>输入兑换码</span>
                            <input
                              v-model="cheatCodeInput"
                              type="text"
                              autocomplete="off"
                              autocapitalize="characters"
                              spellcheck="false"
                              placeholder="输入代码"
                              :disabled="isRedeemingCheatCode"
                            />
                          </label>
                          <button
                            class="settings-action-primary"
                            type="submit"
                            :disabled="isRedeemingCheatCode || !cheatCodeInput.trim()"
                          >
                            <i class="fas fa-ticket"></i>
                            {{ isRedeemingCheatCode ? '兑换中' : '兑换' }}
                          </button>
                        </form>

                        <div v-if="cheatCodeStatus" class="cheat-code-status" :class="{ success: cheatCodeStatusOk }">
                          {{ cheatCodeStatus }}
                        </div>
                      </section>

                      <details class="settings-category-panel" open>
                        <summary class="settings-category-heading">
                          <span>后街设置</span>
                          <small>聊天与模型</small>
                        </summary>

                        <section class="settings-section">
                          <div class="settings-section-title">
                            <span>后街第二 API</span>
                            <small>OpenAI Compatible</small>
                          </div>

                          <label class="settings-row">
                            <span class="settings-row-icon"><i class="fas fa-plug-circle-bolt"></i></span>
                            <span class="settings-row-label">启用第二 API</span>
                            <input
                              v-model="secondaryPhoneApi.enabled"
                              class="settings-toggle"
                              type="checkbox"
                              @change="persistSecondaryApiSettings()"
                            />
                          </label>

                          <label class="settings-text-field">
                            <span>API URL</span>
                            <input
                              v-model.trim="secondaryPhoneApi.baseUrl"
                              type="text"
                              placeholder="https://api.example.com/v1"
                            />
                          </label>

                          <label class="settings-text-field">
                            <span>API Key</span>
                            <input v-model.trim="secondaryPhoneApi.apiKey" type="password" placeholder="sk-..." />
                          </label>

                          <label class="settings-text-field">
                            <span>调用模型</span>
                            <select
                              v-model="secondaryPhoneApi.model"
                              :disabled="secondaryApiModelOptions.length === 0"
                              @change="persistSecondaryApiSettings()"
                            >
                              <option value="">请先读取模型后选择</option>
                              <option v-for="model in secondaryApiModelOptions" :key="model" :value="model">
                                {{ model }}
                              </option>
                            </select>
                          </label>

                          <div class="settings-actions">
                            <button
                              class="settings-action-primary"
                              type="button"
                              :disabled="isSecondaryApiTesting"
                              @click="refreshSecondaryApiModels"
                            >
                              <i class="fas fa-cloud-arrow-down"></i>
                              {{ isSecondaryApiTesting ? '读取中' : '读取模型' }}
                            </button>
                            <button type="button" @click="clearSecondaryApiModel">
                              <i class="fas fa-rotate-left"></i>
                              清除模型
                            </button>
                          </div>

                          <div class="settings-helper" :class="{ ready: secondaryApiReady }">
                            {{ secondaryApiStatusText }}
                            <span v-if="secondaryApiModelOptions.length === 0">
                              请先点击“读取模型”，再从列表中选择调用模型。
                            </span>
                          </div>
                        </section>

                        <section class="settings-section settings-section-compact">
                          <div class="settings-section-title">
                            <span>后街聊天</span>
                            <small>显示、生成与正文注入</small>
                          </div>

                          <label class="settings-slider-row">
                            <span>
                              <span>窗口显示消息数</span>
                              <strong>{{ phonePrefs.backstreetVisibleMessageCount }} 层</strong>
                            </span>
                            <input
                              v-model.number="phonePrefs.backstreetVisibleMessageCount"
                              type="range"
                              min="5"
                              max="100"
                              step="1"
                            />
                          </label>

                          <div class="settings-helper">只影响后街窗口首次显示数量；聊天顶部可继续加载更早消息。</div>

                          <label class="settings-text-field">
                            <span>联系人头像</span>
                            <select v-model="phonePrefs.backstreetAvatarMode">
                              <option value="chibi">默认 Q 版头像</option>
                              <option value="normal">默认正常头像</option>
                            </select>
                          </label>

                          <div class="settings-helper">
                            没有 Q 版头像的联系人会自动使用正常头像；在后街联系人页点击头像可单独切换并记住该联系人。
                          </div>

                          <details class="settings-advanced-panel">
                            <summary>
                              <span>高级参数</span>
                              <small>生成上下文、注入与模板</small>
                            </summary>

                            <label class="settings-slider-row">
                              <span>
                                <span>生成读取正文楼层</span>
                                <strong>{{ backstreetGeneration.mainRecentChatCount }} 层</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.mainRecentChatCount"
                                type="range"
                                min="0"
                                max="64"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              从酒馆正文最近楼层中提取主线片段给后街参考。设为 0 时只保留时间、地点等主线快照。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>生成读取私聊历史</span>
                                <strong>{{ backstreetGeneration.privateHistoryCount }} 条</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.privateHistoryCount"
                                type="range"
                                min="0"
                                max="120"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              私聊回复时带入当前联系人最近多少条后街消息。数值越高越记得上下文，但请求会更长。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>生成读取群聊历史</span>
                                <strong>{{ backstreetGeneration.groupHistoryCount }} 条</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.groupHistoryCount"
                                type="range"
                                min="0"
                                max="120"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              群聊回复时带入当前群最近多少条消息。群聊成员多时可适当降低。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>群聊成员上限</span>
                                <strong>{{ backstreetGeneration.groupMemberLimit }} 人</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.groupMemberLimit"
                                type="range"
                                min="1"
                                max="80"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              限制一次群聊生成最多识别多少名成员。超大群可降低以避免提示词过长。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>群成员资料读取</span>
                                <strong>{{ backstreetGeneration.groupLoreMemberCount }} 人</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.groupLoreMemberCount"
                                type="range"
                                min="0"
                                max="40"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              为群聊前若干名成员读取白名单世界书资料。设为 0 时不额外读取成员资料。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>群成员私聊参考</span>
                                <strong>{{ backstreetGeneration.groupMemberPrivateHistoryCount }} 条/人</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.groupMemberPrivateHistoryCount"
                                type="range"
                                min="0"
                                max="80"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              群聊生成时参考群成员和玩家的近期私聊记录。用于保持私下关系，但默认不代表群内公开。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>私聊对象群聊参考</span>
                                <strong>{{ backstreetGeneration.privateContactGroupHistoryCount }} 条/群</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.privateContactGroupHistoryCount"
                                type="range"
                                min="0"
                                max="80"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              私聊生成时参考该联系人参与过的群聊内容。适合承接群里刚发生过的事。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>私聊参考群数量</span>
                                <strong>{{ backstreetGeneration.privateContactGroupThreadCount }} 个</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.privateContactGroupThreadCount"
                                type="range"
                                min="0"
                                max="30"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              限制私聊生成最多参考多少个相关群聊。数值越高，跨群记忆越多。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>私聊记忆检索</span>
                                <strong>{{ backstreetGeneration.privateArchiveMemoryCount }} 条</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.privateArchiveMemoryCount"
                                type="range"
                                min="0"
                                max="30"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              从归档后街记忆中检索私聊相关记录。用于找回较早的承诺、暗号或关系进展。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>群聊记忆检索</span>
                                <strong>{{ backstreetGeneration.groupArchiveMemoryCount }} 条</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.groupArchiveMemoryCount"
                                type="range"
                                min="0"
                                max="30"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              从归档后街记忆中检索群聊相关记录。用于让群聊接上更早的话题。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>单次发送图片上限</span>
                                <strong>{{ backstreetGeneration.maxUserImagesPerSend }} 张</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.maxUserImagesPerSend"
                                type="range"
                                min="0"
                                max="8"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">限制玩家一次能发送几张图片。设为 0 时禁止发送图片。</p>

                            <label class="settings-slider-row">
                              <span>
                                <span>请求携带用户图片</span>
                                <strong>{{ backstreetGeneration.maxUserImagesInPrompt }} 张</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.maxUserImagesInPrompt"
                                type="range"
                                min="0"
                                max="8"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              生成回复时实际随请求发送的最近用户图片数量。模型或接口不支持视觉时建议设为 0。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>后街输出上限</span>
                                <strong>{{ backstreetGeneration.maxOutputTokens }} tokens</strong>
                              </span>
                              <input
                                v-model.number="backstreetGeneration.maxOutputTokens"
                                type="range"
                                min="256"
                                max="8192"
                                step="128"
                              />
                            </label>
                            <p class="settings-param-help">
                              限制后街生成回复的最大输出长度。太低可能截断格式，太高会增加等待时间。
                            </p>

                            <label class="settings-textarea-field">
                              <span>私聊系统提示词模板</span>
                              <textarea v-model="backstreetGeneration.privateSystemPromptTemplate" rows="9"></textarea>
                            </label>
                            <p class="settings-param-help">
                              控制私聊角色如何说话、遵守什么格式。保留变量占位符可让系统自动插入规则和输出格式。
                            </p>

                            <label class="settings-textarea-field">
                              <span>群聊系统提示词模板</span>
                              <textarea v-model="backstreetGeneration.groupSystemPromptTemplate" rows="9"></textarea>
                            </label>
                            <p class="settings-param-help">
                              控制群聊成员发言、speaker 规则和群聊语气。修改后会影响所有群聊生成。
                            </p>

                            <div class="settings-actions">
                              <button type="button" @click="resetBackstreetGenerationTemplates">
                                <i class="fas fa-rotate-left"></i>
                                恢复后街模板
                              </button>
                            </div>

                            <div class="settings-helper" v-pre>
                              可用变量：{{ contact }}、{{ group_name }}、{{ members }}、{{ player_name }}、{{
                                adult_rules
                              }}、{{ illustration_instruction }}、{{ output_schema }}。
                            </div>

                            <label class="settings-slider-row">
                              <span>
                                <span>在场私聊注入</span>
                                <strong>{{ phonePrefs.backstreetPresentPrivateMessageCount }} 条/人</strong>
                              </span>
                              <input
                                v-model.number="phonePrefs.backstreetPresentPrivateMessageCount"
                                type="range"
                                min="0"
                                max="30"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              正文生成时，把当前在场人物相关私聊注入给主线参考。它不影响后街聊天窗口显示。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>在场群聊注入</span>
                                <strong>{{ phonePrefs.backstreetPresentGroupMessageCount }} 条/群</strong>
                              </span>
                              <input
                                v-model.number="phonePrefs.backstreetPresentGroupMessageCount"
                                type="range"
                                min="0"
                                max="30"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              正文生成时，把包含在场人物的群聊记录注入给主线参考。适合让正文记住群聊承诺和公开信息。
                            </p>

                            <label class="settings-slider-row">
                              <span>
                                <span>全局最近注入</span>
                                <strong>{{ phonePrefs.backstreetGlobalRecentMessageCount }} 条</strong>
                              </span>
                              <input
                                v-model.number="phonePrefs.backstreetGlobalRecentMessageCount"
                                type="range"
                                min="0"
                                max="50"
                                step="1"
                              />
                            </label>
                            <p class="settings-param-help">
                              正文生成时额外注入最近后街记录，不要求相关角色在场。数值过高会增加正文提示词长度。
                            </p>

                            <div class="settings-helper">
                              在场私聊：当前在场角色各自的最近私聊；在场群聊：群成员包含在场角色的群聊；全局最近：不要求角色在场。
                            </div>
                          </details>
                        </section>
                      </details>

                      <details class="settings-category-panel" open>
                        <summary class="settings-category-heading">
                          <span>生图设置</span>
                          <small>NovelAI 插图</small>
                        </summary>

                        <section class="settings-section">
                          <div class="settings-section-title">
                            <span>NovelAI 生图</span>
                            <small>后街插图</small>
                          </div>

                          <label class="settings-row">
                            <span class="settings-row-icon"><i class="fas fa-wand-magic-sparkles"></i></span>
                            <span class="settings-row-label">启用 NovelAI 生图</span>
                            <input v-model="novelAiImage.enabled" class="settings-toggle" type="checkbox" />
                          </label>

                          <label class="settings-text-field">
                            <span>接口地址</span>
                            <input
                              v-model.trim="novelAiImage.apiBaseUrl"
                              type="text"
                              placeholder="https://image.novelai.net"
                            />
                          </label>

                          <label class="settings-text-field">
                            <span>API Key</span>
                            <input
                              v-model.trim="novelAiImage.apiKey"
                              type="password"
                              placeholder="NovelAI Persistent API token"
                            />
                          </label>

                          <label class="settings-row">
                            <span class="settings-row-icon"><i class="fas fa-microchip"></i></span>
                            <span class="settings-row-label">模型</span>
                            <select :value="novelAiImage.model" @change="handleNovelAiImageModelChange">
                              <option v-for="model in NOVELAI_IMAGE_MODEL_OPTIONS" :key="model" :value="model">
                                {{ model }}
                              </option>
                            </select>
                          </label>

                          <label class="settings-row">
                            <span class="settings-row-icon"><i class="fas fa-crop-simple"></i></span>
                            <span class="settings-row-label">图片尺寸</span>
                            <select v-model="novelAiImage.sizePreset">
                              <option v-for="size in NOVELAI_IMAGE_SIZE_OPTIONS" :key="size.value" :value="size.value">
                                {{ size.label }}
                              </option>
                            </select>
                          </label>

                          <label class="settings-slider-row">
                            <span>
                              <span>生成步数</span>
                              <strong>{{ novelAiImage.steps }}</strong>
                            </span>
                            <input v-model.number="novelAiImage.steps" type="range" min="1" max="28" step="1" />
                          </label>

                          <label class="settings-slider-row">
                            <span>
                              <span>提示词引导强度</span>
                              <strong>{{ novelAiImage.scale }}</strong>
                            </span>
                            <input
                              v-model.number="novelAiImage.scale"
                              type="range"
                              min="1"
                              :max="NOVELAI_IMAGE_SCALE_MAX"
                              step="0.5"
                            />
                          </label>

                          <label class="settings-textarea-field">
                            <span>正面提示词前缀</span>
                            <textarea v-model="novelAiImage.positivePromptPrefix" rows="3"></textarea>
                          </label>

                          <label class="settings-textarea-field">
                            <span>负向提示词</span>
                            <textarea v-model="novelAiImage.negativePrompt" rows="4"></textarea>
                          </label>

                          <label class="settings-textarea-field">
                            <span>插图提示词模板</span>
                            <textarea v-model="novelAiImage.promptTemplate" rows="9"></textarea>
                          </label>

                          <div class="settings-actions">
                            <button
                              class="settings-action-primary"
                              type="button"
                              :disabled="isNovelAiImageTesting"
                              @click="handleTestNovelAiImage"
                            >
                              <i class="fas fa-plug-circle-check"></i>
                              {{ isNovelAiImageTesting ? '测试中' : '测试连接' }}
                            </button>
                            <button type="button" @click="resetNovelAiImageTemplate">
                              <i class="fas fa-rotate-left"></i>
                              恢复模板
                            </button>
                          </div>

                          <div class="settings-helper" :class="{ ready: novelAiImageReady }">
                            {{ novelAiImageStatusText }}
                          </div>
                        </section>
                      </details>

                      <div class="settings-category-heading">
                        <span>脚本维护</span>
                        <small>恢复与版本</small>
                      </div>

                      <section class="settings-section">
                        <div class="settings-section-title">
                          <span>恢复默认设置</span>
                          <small>可多选</small>
                        </div>

                        <div class="settings-reset-grid">
                          <label>
                            <input v-model="resetSettingTargets.display" type="checkbox" />
                            <span>界面显示</span>
                          </label>
                          <label>
                            <input v-model="resetSettingTargets.backstreet" type="checkbox" />
                            <span>后街设置</span>
                          </label>
                          <label>
                            <input v-model="resetSettingTargets.image" type="checkbox" />
                            <span>生图设置</span>
                          </label>
                        </div>

                        <div class="settings-actions">
                          <button
                            class="settings-action-primary"
                            type="button"
                            :disabled="!canResetSelectedSettings"
                            @click="resetSelectedSettings"
                          >
                            <i class="fas fa-rotate-left"></i>
                            恢复所选默认
                          </button>
                        </div>

                        <div class="settings-helper">
                          只会恢复勾选类别；未勾选的设置会保持当前值。恢复后会立即写入本地浏览器设置。
                        </div>
                      </section>

                      <section class="settings-section">
                        <div class="settings-section-title">
                          <span>版本信息</span>
                          <small>SKYLINK</small>
                        </div>

                        <div class="settings-version-grid">
                          <div>
                            <span>当前版本</span>
                            <strong>v{{ scriptUpdateState.currentVersion }}</strong>
                          </div>
                          <div>
                            <span>更新方式</span>
                            <strong>随正文更新</strong>
                          </div>
                        </div>

                        <div class="settings-helper" :class="{ ready: scriptUpdateHelperReady }">
                          {{ scriptUpdateStatusText }}
                        </div>

                        <details class="settings-changelog">
                          <summary class="settings-changelog-heading">
                            <span><i class="fas fa-clock-rotate-left"></i> 更新日志</span>
                            <small v-if="scriptChangelogEntries.length"
                              >{{ scriptChangelogEntries.length }} 个版本</small
                            >
                          </summary>
                          <div v-if="scriptChangelogEntries.length > 0" class="settings-changelog-list">
                            <article
                              v-for="release in scriptChangelogEntries"
                              :key="release.version"
                              class="settings-changelog-release"
                            >
                              <div class="settings-changelog-release-heading">
                                <strong>v{{ release.version }}</strong>
                                <span v-if="release.version === scriptUpdateState.currentVersion">当前版本</span>
                              </div>
                              <ul v-if="release.changelog.length > 0">
                                <li v-for="(item, index) in release.changelog" :key="`${release.version}-${index}`">
                                  {{ item }}
                                </li>
                              </ul>
                              <p v-else>暂无更新说明</p>
                            </article>
                          </div>
                          <div v-else class="settings-changelog-empty">点击“检查更新”后加载版本更新日志。</div>
                        </details>
                      </section>
                    </div>
                  </div>
                </section>
              </Transition>
            </main>
            <nav class="sk-system-nav" aria-label="手机系统导航">
              <button type="button" title="返回桌面" aria-label="返回桌面" @click="setPage('home')">
                <i class="fas fa-angle-left"></i>
              </button>
              <button
                class="sk-home-gesture"
                type="button"
                title="返回桌面"
                aria-label="返回桌面"
                @click="setPage('home')"
              >
                <span></span>
              </button>
              <button type="button" title="关闭小手机" aria-label="关闭小手机" @click="close">
                <i class="fas fa-power-off"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useNarrativeChatTheme } from '../../../../modules/narrative-chat-theme';
import SkylinkOrbit from '../../shared/SkylinkOrbit.vue';
import { useSkylinkMotion } from '../../shared/useSkylinkMotion';
import {
  deleteIndexedImage,
  getIndexedImageObjectUrl,
  isDataImageUrl,
  isIndexedImageRef,
  makeIndexedImageRef,
  revokeIndexedImageObjectUrl,
  saveIndexedImageBlob,
  saveIndexedImageDataUrl,
} from '../../shared/indexedImageStore';
import { getLatestMvuData } from '../../shared/mvuStore';
import { redeemCheatCode } from '../../shared/cheatCodes';
import {
  ALL_NPC_SKILL_FAMILIES,
  getNpcSkillPools,
  isEnemyTraitsEnabled,
  setEnemyTraitsEnabled,
  setNpcSkillPools,
  subscribeEnemyTraitsSetting,
  subscribeNpcSkillPoolsSetting,
} from '../../shared/combatSettings';
import { clearEnemyTraitProfiles } from '../../战斗界面/traitPersistence';
import { SKILL_FAMILY_NAMES, type SkillFamily } from '../../战斗界面/npcSkillPools';
import {
  DEFAULT_SECONDARY_PHONE_API_SETTINGS,
  fetchSecondaryPhoneApiModels,
  loadSecondaryPhoneApiSettings,
  saveSecondaryPhoneApiSettings,
  type SecondaryPhoneApiSettings,
} from '../phone/phoneApiSettings';
import {
  DEFAULT_BACKSTREET_GENERATION_SETTINGS,
  loadBackstreetGenerationSettings,
  resetBackstreetGenerationPromptTemplates,
  saveBackstreetGenerationSettings,
  type BackstreetGenerationSettings,
} from '../phone/backstreetGenerationSettings';
import {
  DEFAULT_BACKSTREET_AVATAR_MODE,
  normalizeBackstreetAvatarMode,
  type BackstreetAvatarMode,
} from '../phone/backstreetAvatarSettings';
import { testNovelAiImageConnection } from '../phone/novelAiImageClient';
import {
  DEFAULT_NOVELAI_IMAGE_SETTINGS,
  getNovelAiImageStatus,
  loadNovelAiImageSettings,
  NOVELAI_IMAGE_MODEL_OPTIONS,
  NOVELAI_IMAGE_SCALE_MAX,
  NOVELAI_IMAGE_SIZE_OPTIONS,
  saveNovelAiImageSettings,
  type NovelAiImageSettings,
} from '../phone/novelAiImageSettings';
import {
  applyScriptUpdate,
  checkScriptUpdate,
  getScriptUpdateReleases,
  getScriptUpdateState,
  SCRIPT_UPDATE_EVENT,
  showScriptUpdateGuide,
  type ScriptUpdateRelease,
  type ScriptUpdateState,
} from '../scriptUpdater';
import BackstreetPage from './pages/BackstreetPage.vue';
import CGPage from './pages/CGPage.vue';
import DashboardPage from './pages/DashboardPage.vue';
import InventoryPage from './pages/InventoryPage.vue';
import MapPage from './pages/MapPage.vue';
import ProfilePage from './pages/ProfilePage.vue';
import QuestPage from './pages/QuestPage.vue';
import RelationshipPage from './pages/RelationshipPage.vue';
import ShopPage from './pages/ShopPage.vue';
import SkillPage from './pages/SkillPage.vue';

const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  'theme-change': [theme: PhoneTheme];
}>();

const characterData = ref<any>({});
const phoneRoot = ref<HTMLElement | null>(null);
const { motionReduced, toggleMotion } = useSkylinkMotion();
const terminalUserName = computed(
  () => characterData.value.角色基础?._姓名 || characterData.value.角色基础?.姓名 || '学园访客',
);
const combatData = ref<any>({});
const currentTime = ref('12:00');
const currentDate = ref('2025年1月1日');
const currentLocation = ref('初始点');
const currentCoordinate = ref('[1-1]');

type PageKey =
  | 'home'
  | 'dashboard'
  | 'profile'
  | 'skills'
  | 'inventory'
  | 'quest'
  | 'relationship'
  | 'backstreet'
  | 'shop'
  | 'cg'
  | 'map'
  | 'settings';

const WALLPAPER_PRESETS = [
  {
    value: 'aqua',
    label: '蓝图',
    background:
      'radial-gradient(ellipse at 100% 0%, #b9deff 0%, transparent 60%), linear-gradient(145deg, #ffffff 0%, #e8f4ff 52%, #d7ebff 100%)',
  },
  {
    value: 'dawn',
    label: '晨光',
    background:
      'radial-gradient(circle at 76% 16%, rgba(255, 251, 214, 0.78), transparent 22%), linear-gradient(145deg, #f5a88d 0%, #f4d77d 50%, #79c8b2 100%)',
  },
  {
    value: 'garden',
    label: '庭院',
    background:
      'radial-gradient(circle at 20% 75%, rgba(255, 255, 255, 0.62), transparent 24%), linear-gradient(145deg, #5fac7a 0%, #89c97f 42%, #d6d98a 100%)',
  },
  {
    value: 'night',
    label: '夜色',
    background:
      'radial-gradient(circle at 70% 20%, rgba(180, 214, 255, 0.62), transparent 20%), linear-gradient(145deg, #17213f 0%, #365a7d 54%, #3f8b91 100%)',
  },
] as const;

const PHONE_THEME_OPTIONS = [
  { value: 'aqua', label: '湖蓝' },
  { value: 'midnight', label: '午夜' },
] as const;

const PHONE_FONT_OPTIONS = [
  { value: 'system', label: '系统默认' },
  { value: 'rounded', label: '圆润黑体' },
  { value: 'serif', label: '书籍宋体' },
  { value: 'kaiti', label: '手写楷体' },
  { value: 'mono', label: '等宽字体' },
] as const;

const APP_ICON_STYLE_OPTIONS = [
  { value: 'glass-tile', label: '晶窗' },
  { value: 'academy-badge', label: '徽章' },
  { value: 'prism-card', label: '棱卡' },
  { value: 'corner-chip', label: '芯片' },
  { value: 'paper-sticker', label: '贴纸' },
] as const;

const PHONE_VISUAL_MODE_OPTIONS = [
  { value: 'auto', label: '自动（移动端简化）' },
  { value: 'full', label: '完整效果' },
  { value: 'lite', label: '简化效果' },
] as const;

type PhoneTheme = (typeof PHONE_THEME_OPTIONS)[number]['value'];
type PhoneFont = (typeof PHONE_FONT_OPTIONS)[number]['value'];
type AppIconStyle = (typeof APP_ICON_STYLE_OPTIONS)[number]['value'];
type WallpaperPreset = (typeof WALLPAPER_PRESETS)[number]['value'];
type PhoneVisualMode = (typeof PHONE_VISUAL_MODE_OPTIONS)[number]['value'];

const PHONE_FONT_FAMILIES: Record<PhoneFont, string> = {
  system: '"MiSans", "HarmonyOS Sans SC", "Microsoft YaHei UI", sans-serif',
  rounded: '"Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif',
  serif: '"Noto Serif SC", "Songti SC", "SimSun", serif',
  kaiti: '"Kaiti SC", "KaiTi", "STKaiti", serif',
  mono: '"Cascadia Mono", Consolas, "Microsoft YaHei", monospace',
};

interface PhonePreferences {
  wallpaperUrl: string;
  wallpaperPreset: WallpaperPreset;
  theme: PhoneTheme;
  fontFamily: PhoneFont;
  appIconStyle: AppIconStyle;
  wallpaperOpacity: number;
  wallpaperBlur: number;
  tintStrength: number;
  visualMode: PhoneVisualMode;
  backstreetVisibleMessageCount: number;
  backstreetAvatarMode: BackstreetAvatarMode;
  backstreetPresentPrivateMessageCount: number;
  backstreetPresentGroupMessageCount: number;
  backstreetGlobalRecentMessageCount: number;
}

interface PhoneApp {
  page: Exclude<PageKey, 'home'>;
  label: string;
  icon: string;
  colorClass: string;
  dock?: boolean;
}

const PHONE_PREFS_STORAGE_KEY = 'fatria-status-phone-preferences-v1';
const PHONE_POSITION_STORAGE_KEY = 'fatria-status-phone-position-v1';
const PHONE_PREFS_UPDATED_EVENT = 'fatria-status-phone-preferences-updated';
const PHONE_WALLPAPER_IMAGE_REF = makeIndexedImageRef('phone-wallpaper:global');
const PHONE_VIEWPORT_PADDING = 8;

type PhonePosition = {
  x: number;
  y: number;
};

type PhoneDragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  pointerId: number;
} | null;

const DEFAULT_PHONE_PREFS: PhonePreferences = {
  wallpaperUrl: '',
  wallpaperPreset: 'aqua',
  theme: 'aqua',
  fontFamily: 'system',
  appIconStyle: 'glass-tile',
  wallpaperOpacity: 70,
  wallpaperBlur: 0,
  tintStrength: 15,
  visualMode: 'auto',
  backstreetVisibleMessageCount: 30,
  backstreetAvatarMode: DEFAULT_BACKSTREET_AVATAR_MODE,
  backstreetPresentPrivateMessageCount: 20,
  backstreetPresentGroupMessageCount: 20,
  backstreetGlobalRecentMessageCount: 20,
};

const phoneApps: PhoneApp[] = [
  { page: 'dashboard', label: '状态', icon: 'fas fa-home', colorClass: 'fatria-phone-app-cyan' },
  { page: 'profile', label: '档案', icon: 'fas fa-id-card', colorClass: 'fatria-phone-app-blue', dock: true },
  { page: 'skills', label: '技能', icon: 'fas fa-magic', colorClass: 'fatria-phone-app-violet', dock: true },
  { page: 'inventory', label: '背包', icon: 'fas fa-briefcase', colorClass: 'fatria-phone-app-amber', dock: true },
  { page: 'quest', label: '任务', icon: 'fas fa-tasks', colorClass: 'fatria-phone-app-green' },
  { page: 'relationship', label: '关系', icon: 'fas fa-heart', colorClass: 'fatria-phone-app-pink' },
  { page: 'backstreet', label: '后街', icon: 'fas fa-comments', colorClass: 'fatria-phone-app-backstreet' },
  { page: 'map', label: '地图', icon: 'fas fa-map-marker-alt', colorClass: 'fatria-phone-app-teal' },
  { page: 'shop', label: '商店', icon: 'fas fa-store', colorClass: 'fatria-phone-app-orange' },
  { page: 'cg', label: '相册', icon: 'fas fa-images', colorClass: 'fatria-phone-app-rose' },
  { page: 'settings', label: '设置', icon: 'fas fa-cog', colorClass: 'fatria-phone-app-slate', dock: true },
];

const currentPage = ref<PageKey>('home');
const wallpaperInputRef = ref<HTMLInputElement | null>(null);
const phoneContainerRef = ref<HTMLElement | null>(null);
const phoneDragHandleRef = ref<HTMLElement | null>(null);
const phonePosition = ref<PhonePosition>(loadPhonePosition());
const isPhoneDragging = ref(false);
const phonePrefs = ref<PhonePreferences>(loadPhonePreferences());
const { isMidnightMode: isNarrativeMidnight } = useNarrativeChatTheme();
const enemyTraitsEnabled = ref(isEnemyTraitsEnabled());
const npcSkillPools = ref<SkillFamily[]>(getNpcSkillPools());
const npcSkillFamilyOptions = ALL_NPC_SKILL_FAMILIES;
const SKILL_FAMILY_ICONS: Record<SkillFamily, string> = {
  hand: 'fas fa-hand',
  oral: 'fas fa-comment-dots',
  foot: 'fas fa-shoe-prints',
  chest: 'fas fa-heart',
  ride: 'fas fa-horse',
  tool: 'fas fa-wand-magic-sparkles',
  mental: 'fas fa-brain',
};
let unsubscribeEnemyTraitsSetting: (() => void) | null = null;
let unsubscribeNpcSkillPoolsSetting: (() => void) | null = null;
const resolvedWallpaperUrl = ref('');
const secondaryPhoneApi = ref<SecondaryPhoneApiSettings>(loadSecondaryPhoneApiSettings());
const secondaryApiModelOptions = ref<string[]>([...secondaryPhoneApi.value.models]);
const secondaryApiStatus = ref('');
const isSecondaryApiTesting = ref(false);
const backstreetGeneration = ref<BackstreetGenerationSettings>(loadBackstreetGenerationSettings());
const novelAiImage = ref<NovelAiImageSettings>(loadNovelAiImageSettings());
const novelAiImageStatus = ref('');
const isNovelAiImageTesting = ref(false);
const scriptUpdateState = ref<ScriptUpdateState>(getScriptUpdateState());
const isCheckingScriptUpdate = ref(false);
const isApplyingScriptUpdate = ref(false);
const resetSettingTargets = ref({
  display: true,
  backstreet: false,
  image: false,
});
const cheatCodeInput = ref('');
const cheatCodeStatus = ref('');
const cheatCodeStatusOk = ref(false);
const isRedeemingCheatCode = ref(false);
let wallpaperSourceRequestId = 0;
let phoneDragState: PhoneDragState = null;

const homeApps = computed(() => phoneApps.filter(app => !app.dock));
const dockApps = computed(() => phoneApps.filter(app => app.dock));
const currentApp = computed(() => phoneApps.find(app => app.page === currentPage.value));
const currentPageTitle = computed(() => currentApp.value?.label || '性斗学园');
const currentThemeLabel = computed(
  () => PHONE_THEME_OPTIONS.find(theme => theme.value === phonePrefs.value.theme)?.label || '湖蓝',
);
const customWallpaperSrc = computed(() => resolvedWallpaperUrl.value);
const phoneFrameClasses = computed(() => [
  `theme-${phonePrefs.value.theme}`,
  `icon-style-${phonePrefs.value.appIconStyle}`,
]);
const isLiteVisuals = computed(() => shouldUseLiteVisuals(phonePrefs.value.visualMode));
const wallpaperLayerStyle = computed(() => ({
  backgroundImage: getWallpaperPresetBackground(phonePrefs.value.wallpaperPreset),
}));
const phoneStyle = computed(() => {
  return {
    '--phone-wallpaper-opacity': `${clampNumber(phonePrefs.value.wallpaperOpacity, 20, 100) / 100}`,
    '--phone-wallpaper-blur': `${clampNumber(phonePrefs.value.wallpaperBlur, 0, 16)}px`,
    '--phone-tint-opacity': `${clampNumber(phonePrefs.value.tintStrength, 0, 70) / 100}`,
    '--phone-font-family': PHONE_FONT_FAMILIES[phonePrefs.value.fontFamily] ?? PHONE_FONT_FAMILIES.system,
  };
});
const phonePositionStyle = computed(() => ({
  transform: `translate3d(${phonePosition.value.x}px, ${phonePosition.value.y}px, 0)`,
}));
const secondaryApiReady = computed(() =>
  Boolean(
    secondaryPhoneApi.value.enabled &&
    secondaryPhoneApi.value.baseUrl.trim() &&
    secondaryPhoneApi.value.model.trim() &&
    secondaryApiModelOptions.value.includes(secondaryPhoneApi.value.model),
  ),
);
const secondaryApiStatusText = computed(() => {
  if (secondaryApiStatus.value) return secondaryApiStatus.value;
  if (secondaryApiReady.value) return `后街聊天将使用第二 API：${secondaryPhoneApi.value.model}`;
  if (secondaryPhoneApi.value.enabled) return '已启用，请读取模型列表后选择调用模型。';
  return '关闭时后街聊天继续使用酒馆原 API。';
});
const novelAiImageReady = computed(() => getNovelAiImageStatus(novelAiImage.value).ready);
const novelAiImageStatusText = computed(() => {
  if (novelAiImageStatus.value) return novelAiImageStatus.value;
  const status = getNovelAiImageStatus(novelAiImage.value);
  if (status.ready) return `NovelAI 将偶尔为后街聊天生成插图：${status.settings.model} @ ${status.settings.apiBaseUrl}`;
  if (status.settings.enabled) return status.reason;
  return '关闭时后街只显示文字消息；接口地址与 API Key 会保存在本地浏览器。';
});
const hasScriptUpdate = computed(() => scriptUpdateState.value.hasUpdate);
const scriptUpdateHelperReady = computed(() => scriptUpdateState.value.status === 'latest');
const scriptUpdateStatusText = computed(() => {
  return scriptUpdateState.value.message;
});
const scriptChangelogEntries = computed<ScriptUpdateRelease[]>(() =>
  getScriptUpdateReleases(scriptUpdateState.value.manifest),
);
const canResetSelectedSettings = computed(
  () => resetSettingTargets.value.display || resetSettingTargets.value.backstreet || resetSettingTargets.value.image,
);

watch(
  phonePrefs,
  prefs => {
    savePhonePreferences(prefs);
  },
  { deep: true },
);

watch(
  () => phonePrefs.value.theme,
  theme => emit('theme-change', theme),
  { immediate: true },
);

watch(
  isNarrativeMidnight,
  (midnight, previous) => {
    // 初次打开时保留日间下的手动选择；正文已在午夜或之后切换主题时跟随正文。
    if (midnight || previous !== undefined) {
      phonePrefs.value.theme = midnight ? 'midnight' : 'aqua';
    }
  },
  { immediate: true },
);

watch(
  () => phonePrefs.value.wallpaperUrl,
  wallpaperUrl => {
    void syncWallpaperSource(wallpaperUrl);
  },
  { immediate: true },
);

watch(
  secondaryPhoneApi,
  settings => {
    persistSecondaryApiSettings(settings);
  },
  { deep: true },
);

watch(
  backstreetGeneration,
  settings => {
    saveBackstreetGenerationSettings(settings);
  },
  { deep: true },
);

watch(
  novelAiImage,
  settings => {
    saveNovelAiImageSettings(settings);
  },
  { deep: true },
);

watch(
  () => props.isVisible,
  isVisible => {
    if (!isVisible) return;
    const hostWindow = getPhoneHostWindow();
    hostWindow.requestAnimationFrame(() => applyPhonePosition(phonePosition.value));
    measurePhoneOpenFirstFrame();
    void refreshPhoneData('打开手机');
  },
  { flush: 'post' },
);

function syncSecondaryApiModelOptions(settings: SecondaryPhoneApiSettings) {
  secondaryApiModelOptions.value = settings.model
    ? Array.from(new Set([settings.model, ...settings.models]))
    : [...settings.models];
}

function persistSecondaryApiSettings(settings: SecondaryPhoneApiSettings = secondaryPhoneApi.value) {
  saveSecondaryPhoneApiSettings(settings);
  syncSecondaryApiModelOptions(settings);
}

function setPage(page: PageKey) {
  currentPage.value = page;
  void nextTick(() => {
    const root = phoneRoot.value;
    const frame = root?.querySelector<HTMLElement>('.phone-frame');
    const content = root?.querySelector<HTMLElement>('.status-content');
    if (frame) frame.scrollTop = 0;
    if (content) content.scrollTop = 0;
  });
}

function toggleEnemyTraitsSetting(event?: Event) {
  const checkbox = event?.target as HTMLInputElement | undefined;
  if (checkbox) checkbox.checked = enemyTraitsEnabled.value;
  const next = !enemyTraitsEnabled.value;
  if (!setEnemyTraitsEnabled(next)) {
    toastr.error('词条设置保存失败');
    return;
  }
  enemyTraitsEnabled.value = next;
  if (!next) {
    clearEnemyTraitProfiles();
  }
  toastr.info(next ? '敌人词条已启用' : '敌人词条已关闭，已有词条已清除');
}

function toggleNpcSkillPool(family: SkillFamily, event?: Event) {
  const checkbox = event?.target as HTMLInputElement | undefined;
  if (checkbox) checkbox.checked = npcSkillPools.value.includes(family);
  const next = npcSkillPools.value.includes(family)
    ? npcSkillPools.value.filter(item => item !== family)
    : [...npcSkillPools.value, family];
  if (next.length === 0) {
    toastr.warning('至少保留一个 NPC 技能池');
    return;
  }
  if (!setNpcSkillPools(next)) {
    toastr.error('NPC 技能池设置保存失败');
    return;
  }
  npcSkillPools.value = next;
}

async function redeemPhoneCheatCode() {
  if (isRedeemingCheatCode.value || !cheatCodeInput.value.trim()) return;

  isRedeemingCheatCode.value = true;
  cheatCodeStatus.value = '';
  cheatCodeStatusOk.value = false;
  try {
    const result = await redeemCheatCode(cheatCodeInput.value);
    cheatCodeStatus.value = result.message;
    cheatCodeStatusOk.value = result.ok;
    if (result.ok) {
      cheatCodeInput.value = '';
      await refreshPhoneData('兑换码');
      if (typeof toastr !== 'undefined') toastr.success(result.message || '兑换成功', result.title);
    } else if (typeof toastr !== 'undefined') {
      toastr.warning(result.message, result.title);
    }
  } catch (error) {
    console.error('[性斗学园手机] 兑换码执行失败:', error);
    cheatCodeStatus.value = '兑换失败，请检查 MVU 变量';
    if (typeof toastr !== 'undefined') toastr.error(cheatCodeStatus.value, '错误');
  } finally {
    isRedeemingCheatCode.value = false;
  }
}

function clampNumber(value: number, min: number, max: number): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return min;
  return Math.min(max, Math.max(min, numericValue));
}

function loadPhonePosition(): PhonePosition {
  try {
    const raw = window.localStorage?.getItem(PHONE_POSITION_STORAGE_KEY);
    if (!raw) return { x: 0, y: 0 };

    const parsed = JSON.parse(raw);
    return {
      x: Number.isFinite(Number(parsed?.x)) ? Number(parsed.x) : 0,
      y: Number.isFinite(Number(parsed?.y)) ? Number(parsed.y) : 0,
    };
  } catch {
    return { x: 0, y: 0 };
  }
}

function savePhonePosition(position: PhonePosition) {
  try {
    window.localStorage?.setItem(PHONE_POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Keep the current position for this page when storage is unavailable.
  }
}

function getPhoneViewportSize() {
  const ownerDocument = phoneContainerRef.value?.ownerDocument ?? document;
  const ownerWindow = ownerDocument.defaultView ?? window;
  const visualViewport = ownerWindow.visualViewport;

  return {
    width: Math.max(
      Number(visualViewport?.width) || 0,
      Number(ownerWindow.innerWidth) || 0,
      Number(ownerDocument.documentElement?.clientWidth) || 0,
    ),
    height: Math.max(
      Number(visualViewport?.height) || 0,
      Number(ownerWindow.innerHeight) || 0,
      Number(ownerDocument.documentElement?.clientHeight) || 0,
    ),
  };
}

function clampPhonePosition(position: PhonePosition): PhonePosition {
  const viewport = getPhoneViewportSize();
  const rect = phoneContainerRef.value?.getBoundingClientRect();
  const width = rect?.width ?? Math.min(404, Math.max(0, viewport.width - 24));
  const height = rect?.height ?? Math.min(762, Math.max(0, viewport.height - 24));
  const centeredX = (viewport.width - width) / 2;
  const centeredY = (viewport.height - height) / 2;
  const minX = PHONE_VIEWPORT_PADDING - centeredX;
  const maxX = viewport.width - PHONE_VIEWPORT_PADDING - width - centeredX;
  const minY = PHONE_VIEWPORT_PADDING - centeredY;
  const maxY = viewport.height - PHONE_VIEWPORT_PADDING - height - centeredY;

  return {
    x: clampNumber(position.x, Math.min(minX, maxX), Math.max(minX, maxX)),
    y: clampNumber(position.y, Math.min(minY, maxY), Math.max(minY, maxY)),
  };
}

function applyPhonePosition(position: PhonePosition, shouldSave = false) {
  const nextPosition = clampPhonePosition(position);
  phonePosition.value = nextPosition;
  if (shouldSave) savePhonePosition(nextPosition);
}

function resetPhonePosition() {
  applyPhonePosition({ x: 0, y: 0 }, true);
}

function getPhoneHostWindow(): Window {
  return phoneContainerRef.value?.ownerDocument.defaultView ?? window;
}

function handlePhonePointerDown(event: PointerEvent) {
  if (event.button !== 0) return;

  event.preventDefault();
  event.stopPropagation();
  phoneDragState = {
    startX: event.clientX,
    startY: event.clientY,
    originX: phonePosition.value.x,
    originY: phonePosition.value.y,
    pointerId: event.pointerId,
  };
  isPhoneDragging.value = true;

  const hostWindow = getPhoneHostWindow();
  hostWindow.addEventListener('pointermove', handlePhonePointerMove, true);
  hostWindow.addEventListener('pointerup', handlePhonePointerUp, true);
  hostWindow.addEventListener('pointercancel', handlePhonePointerCancel, true);

  try {
    phoneDragHandleRef.value?.setPointerCapture(event.pointerId);
  } catch {
    // The window listeners keep dragging functional in webviews without pointer capture.
  }
}

function handlePhonePointerMove(event: PointerEvent) {
  if (!phoneDragState || event.pointerId !== phoneDragState.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  applyPhonePosition({
    x: phoneDragState.originX + event.clientX - phoneDragState.startX,
    y: phoneDragState.originY + event.clientY - phoneDragState.startY,
  });
}

function finishPhoneDrag(event: PointerEvent, shouldSave: boolean) {
  if (!phoneDragState || event.pointerId !== phoneDragState.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  try {
    if (phoneDragHandleRef.value?.hasPointerCapture(event.pointerId)) {
      phoneDragHandleRef.value.releasePointerCapture(event.pointerId);
    }
  } catch {
    // Ignore incomplete pointer capture implementations.
  }

  removePhonePointerListeners();
  phoneDragState = null;
  isPhoneDragging.value = false;
  if (shouldSave) savePhonePosition(phonePosition.value);
}

function handlePhonePointerUp(event: PointerEvent) {
  finishPhoneDrag(event, true);
}

function handlePhonePointerCancel(event: PointerEvent) {
  finishPhoneDrag(event, false);
}

function removePhonePointerListeners() {
  const hostWindow = getPhoneHostWindow();
  hostWindow.removeEventListener('pointermove', handlePhonePointerMove, true);
  hostWindow.removeEventListener('pointerup', handlePhonePointerUp, true);
  hostWindow.removeEventListener('pointercancel', handlePhonePointerCancel, true);
}

function handlePhoneViewportResize() {
  applyPhonePosition(phonePosition.value, true);
}

function isPhoneTheme(value: unknown): value is PhoneTheme {
  return PHONE_THEME_OPTIONS.some(option => option.value === value);
}

function isPhoneFont(value: unknown): value is PhoneFont {
  return PHONE_FONT_OPTIONS.some(option => option.value === value);
}

function isAppIconStyle(value: unknown): value is AppIconStyle {
  return APP_ICON_STYLE_OPTIONS.some(option => option.value === value);
}

function isWallpaperPreset(value: unknown): value is WallpaperPreset {
  return WALLPAPER_PRESETS.some(option => option.value === value);
}

function isPhoneVisualMode(value: unknown): value is PhoneVisualMode {
  return PHONE_VISUAL_MODE_OPTIONS.some(option => option.value === value);
}

function shouldUseLiteVisuals(mode: PhoneVisualMode): boolean {
  if (mode === 'lite') return true;
  if (mode === 'full') return false;

  const hostWindow = getPhoneHostWindow();
  const navigatorWithMemory = hostWindow.navigator as Navigator & { deviceMemory?: number };
  const prefersReducedMotion = hostWindow.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const coarsePointer = hostWindow.matchMedia?.('(pointer: coarse)').matches ?? false;
  const lowMemory = typeof navigatorWithMemory.deviceMemory === 'number' && navigatorWithMemory.deviceMemory <= 4;
  const lowConcurrency =
    typeof navigatorWithMemory.hardwareConcurrency === 'number' && navigatorWithMemory.hardwareConcurrency <= 4;

  return prefersReducedMotion || coarsePointer || lowMemory || lowConcurrency;
}

function getWallpaperPresetBackground(preset: WallpaperPreset): string {
  return WALLPAPER_PRESETS.find(option => option.value === preset)?.background ?? WALLPAPER_PRESETS[0].background;
}

function loadPhonePreferences(): PhonePreferences {
  try {
    const raw = window.localStorage?.getItem(PHONE_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PHONE_PREFS };

    const parsed = JSON.parse(raw) as Partial<PhonePreferences>;
    const theme = isPhoneTheme(parsed.theme) ? parsed.theme : DEFAULT_PHONE_PREFS.theme;
    const wallpaperPreset = isWallpaperPreset(parsed.wallpaperPreset)
      ? parsed.wallpaperPreset
      : DEFAULT_PHONE_PREFS.wallpaperPreset;
    const fontFamily = isPhoneFont(parsed.fontFamily) ? parsed.fontFamily : DEFAULT_PHONE_PREFS.fontFamily;
    const appIconStyle = isAppIconStyle(parsed.appIconStyle) ? parsed.appIconStyle : DEFAULT_PHONE_PREFS.appIconStyle;
    const visualMode = isPhoneVisualMode(parsed.visualMode) ? parsed.visualMode : DEFAULT_PHONE_PREFS.visualMode;

    return {
      wallpaperUrl: typeof parsed.wallpaperUrl === 'string' ? parsed.wallpaperUrl : DEFAULT_PHONE_PREFS.wallpaperUrl,
      wallpaperPreset,
      theme,
      fontFamily,
      appIconStyle,
      wallpaperOpacity: clampNumber(Number(parsed.wallpaperOpacity), 20, 100),
      wallpaperBlur: clampNumber(Number(parsed.wallpaperBlur), 0, 16),
      tintStrength: clampNumber(Number(parsed.tintStrength), 0, 70),
      visualMode,
      backstreetVisibleMessageCount: clampNumber(
        Number(parsed.backstreetVisibleMessageCount ?? DEFAULT_PHONE_PREFS.backstreetVisibleMessageCount),
        5,
        100,
      ),
      backstreetAvatarMode: normalizeBackstreetAvatarMode(
        parsed.backstreetAvatarMode ?? DEFAULT_PHONE_PREFS.backstreetAvatarMode,
      ),
      backstreetPresentPrivateMessageCount: clampNumber(
        Number(parsed.backstreetPresentPrivateMessageCount ?? DEFAULT_PHONE_PREFS.backstreetPresentPrivateMessageCount),
        0,
        30,
      ),
      backstreetPresentGroupMessageCount: clampNumber(
        Number(parsed.backstreetPresentGroupMessageCount ?? DEFAULT_PHONE_PREFS.backstreetPresentGroupMessageCount),
        0,
        30,
      ),
      backstreetGlobalRecentMessageCount: clampNumber(
        Number(parsed.backstreetGlobalRecentMessageCount ?? DEFAULT_PHONE_PREFS.backstreetGlobalRecentMessageCount),
        0,
        50,
      ),
    };
  } catch {
    return { ...DEFAULT_PHONE_PREFS };
  }
}

function savePhonePreferences(prefs: PhonePreferences) {
  try {
    window.localStorage?.setItem(PHONE_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // 偏好保存失败时仍然保留当前运行态设置。
  }

  window.dispatchEvent(new CustomEvent(PHONE_PREFS_UPDATED_EVENT, { detail: { ...prefs } }));
}

function setResolvedWallpaperUrl(url: string) {
  if (resolvedWallpaperUrl.value !== url) {
    revokeIndexedImageObjectUrl(resolvedWallpaperUrl.value);
  }
  resolvedWallpaperUrl.value = url;
}

async function syncWallpaperSource(sourceValue: string) {
  const requestId = ++wallpaperSourceRequestId;
  const source = sourceValue.trim();

  if (!source) {
    setResolvedWallpaperUrl('');
    return;
  }

  try {
    if (isDataImageUrl(source)) {
      await saveIndexedImageDataUrl(PHONE_WALLPAPER_IMAGE_REF, source);
      if (requestId !== wallpaperSourceRequestId) return;
      phonePrefs.value.wallpaperUrl = PHONE_WALLPAPER_IMAGE_REF;
      return;
    }

    if (isIndexedImageRef(source)) {
      const objectUrl = await getIndexedImageObjectUrl(source);
      if (requestId !== wallpaperSourceRequestId) {
        revokeIndexedImageObjectUrl(objectUrl);
        return;
      }
      setResolvedWallpaperUrl(objectUrl ?? '');
      return;
    }

    setResolvedWallpaperUrl(source);
  } catch (error) {
    console.error('[状态栏] 壁纸加载失败:', error);
    setResolvedWallpaperUrl(isIndexedImageRef(source) ? '' : source);
  }
}

async function refreshSecondaryApiModels() {
  if (isSecondaryApiTesting.value) return;
  isSecondaryApiTesting.value = true;
  secondaryApiStatus.value = '正在连接第二 API...';

  try {
    const models = await fetchSecondaryPhoneApiModels(secondaryPhoneApi.value);
    secondaryApiModelOptions.value = models;
    secondaryPhoneApi.value.models = models;
    secondaryPhoneApi.value.enabled = true;
    if (!models.includes(secondaryPhoneApi.value.model)) {
      secondaryPhoneApi.value.model = models[0] || '';
    }
    saveSecondaryPhoneApiSettings(secondaryPhoneApi.value);
    secondaryApiStatus.value = `已读取 ${models.length} 个模型，当前：${secondaryPhoneApi.value.model || '未选择'}`;
    if (typeof toastr !== 'undefined') {
      toastr.success('模型列表读取成功', '后街第二 API');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '读取模型失败';
    secondaryApiStatus.value = message;
    if (typeof toastr !== 'undefined') {
      toastr.error(message, '后街第二 API');
    }
  } finally {
    isSecondaryApiTesting.value = false;
  }
}

function clearSecondaryApiModel() {
  secondaryPhoneApi.value.model = '';
  secondaryPhoneApi.value.models = [];
  secondaryApiModelOptions.value = [];
  secondaryApiStatus.value = '已清除模型选择，关闭开关时会使用酒馆原 API。';
}

function resetBackstreetGenerationTemplates() {
  backstreetGeneration.value = resetBackstreetGenerationPromptTemplates(backstreetGeneration.value);
}

function resetDisplaySettings() {
  const previousWallpaperUrl = phonePrefs.value.wallpaperUrl;
  phonePrefs.value = {
    ...phonePrefs.value,
    wallpaperUrl: DEFAULT_PHONE_PREFS.wallpaperUrl,
    wallpaperPreset: DEFAULT_PHONE_PREFS.wallpaperPreset,
    theme: DEFAULT_PHONE_PREFS.theme,
    fontFamily: DEFAULT_PHONE_PREFS.fontFamily,
    appIconStyle: DEFAULT_PHONE_PREFS.appIconStyle,
    wallpaperOpacity: DEFAULT_PHONE_PREFS.wallpaperOpacity,
    wallpaperBlur: DEFAULT_PHONE_PREFS.wallpaperBlur,
    tintStrength: DEFAULT_PHONE_PREFS.tintStrength,
    visualMode: DEFAULT_PHONE_PREFS.visualMode,
  };
  if (isIndexedImageRef(previousWallpaperUrl)) {
    void deleteIndexedImage(previousWallpaperUrl);
  }
  setResolvedWallpaperUrl('');
}

function resetBackstreetSettings() {
  phonePrefs.value = {
    ...phonePrefs.value,
    backstreetVisibleMessageCount: DEFAULT_PHONE_PREFS.backstreetVisibleMessageCount,
    backstreetAvatarMode: DEFAULT_PHONE_PREFS.backstreetAvatarMode,
    backstreetPresentPrivateMessageCount: DEFAULT_PHONE_PREFS.backstreetPresentPrivateMessageCount,
    backstreetPresentGroupMessageCount: DEFAULT_PHONE_PREFS.backstreetPresentGroupMessageCount,
    backstreetGlobalRecentMessageCount: DEFAULT_PHONE_PREFS.backstreetGlobalRecentMessageCount,
  };
  secondaryPhoneApi.value = { ...DEFAULT_SECONDARY_PHONE_API_SETTINGS };
  secondaryApiModelOptions.value = [];
  secondaryApiStatus.value = '';
  backstreetGeneration.value = { ...DEFAULT_BACKSTREET_GENERATION_SETTINGS };
}

function resetImageSettings() {
  novelAiImage.value = { ...DEFAULT_NOVELAI_IMAGE_SETTINGS };
  novelAiImageStatus.value = '已恢复默认生图设置。';
}

function isNovelAiV5Model(model: string): boolean {
  return /^nai-diffusion-5-(?:curated|full)$/i.test(model.trim());
}

function handleNovelAiImageModelChange(event: Event) {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement)) return;

  const nextModel = select.value;
  const previousModel = novelAiImage.value.model;
  if (nextModel === previousModel) return;

  if (
    isNovelAiV5Model(nextModel) &&
    !window.confirm(
      `NovelAI V5 Full 和 V5 Curated 不是无限制生图模型。\n\n请确保你了解 V5 的标准再使用。\n\n仍要选择 ${nextModel} 吗？`,
    )
  ) {
    select.value = previousModel;
    return;
  }

  novelAiImage.value.model = nextModel;
}

function resetSelectedSettings() {
  if (!canResetSelectedSettings.value) return;
  if (resetSettingTargets.value.display) resetDisplaySettings();
  if (resetSettingTargets.value.backstreet) resetBackstreetSettings();
  if (resetSettingTargets.value.image) resetImageSettings();
  if (typeof toastr !== 'undefined') {
    toastr.success('已恢复所选默认设置', '小手机设置');
  }
}

async function handleTestNovelAiImage() {
  if (isNovelAiImageTesting.value) return;
  isNovelAiImageTesting.value = true;
  novelAiImageStatus.value = '正在测试 NovelAI 连接...';

  try {
    const message = await testNovelAiImageConnection(novelAiImage.value);
    novelAiImage.value.enabled = true;
    saveNovelAiImageSettings(novelAiImage.value);
    novelAiImageStatus.value = message;
    if (typeof toastr !== 'undefined') {
      toastr.success(message, 'NovelAI 生图');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'NovelAI 连接测试失败';
    novelAiImageStatus.value = message;
    if (typeof toastr !== 'undefined') {
      toastr.error(message, 'NovelAI 生图');
    }
  } finally {
    isNovelAiImageTesting.value = false;
  }
}

function resetNovelAiImageTemplate() {
  novelAiImage.value.promptTemplate = DEFAULT_NOVELAI_IMAGE_SETTINGS.promptTemplate;
  novelAiImageStatus.value = '已恢复默认插图提示词模板。';
}

async function handleCheckScriptUpdate() {
  if (isCheckingScriptUpdate.value) return;
  isCheckingScriptUpdate.value = true;
  try {
    scriptUpdateState.value = await checkScriptUpdate({ force: true });
  } finally {
    isCheckingScriptUpdate.value = false;
  }
}

function handleShowScriptUpdateGuide() {
  showScriptUpdateGuide(scriptUpdateState.value.manifest);
  scriptUpdateState.value = getScriptUpdateState();
}

async function handleApplyScriptUpdate() {
  if (!scriptUpdateState.value.hasUpdate || isApplyingScriptUpdate.value) return;

  const manifest = scriptUpdateState.value.manifest;
  const releaseTag = manifest?.releaseTag;
  if (!manifest || !releaseTag) {
    handleShowScriptUpdateGuide();
    return;
  }

  const confirmed = window.confirm(
    `将当前角色脚本库中的性斗学园脚本更新为 ${releaseTag}。\n\n更新后会固定使用此版本，并重新加载酒馆页面。`,
  );
  if (!confirmed) return;

  isApplyingScriptUpdate.value = true;
  try {
    const result = await applyScriptUpdate(manifest);
    if (!result.updated) {
      if (typeof toastr !== 'undefined') {
        toastr.error(result.message, '性斗学园脚本更新');
      }
      return;
    }

    if (typeof toastr !== 'undefined') {
      toastr.success(result.message, '性斗学园脚本更新');
    }
    window.setTimeout(() => window.location.reload(), 450);
  } finally {
    isApplyingScriptUpdate.value = false;
  }
}

function openWallpaperFilePicker() {
  wallpaperInputRef.value?.click();
}

function selectWallpaperPreset(preset: WallpaperPreset) {
  const previousWallpaperUrl = phonePrefs.value.wallpaperUrl;
  phonePrefs.value.wallpaperPreset = preset;
  phonePrefs.value.wallpaperUrl = '';
  if (isIndexedImageRef(previousWallpaperUrl)) {
    void deleteIndexedImage(previousWallpaperUrl);
  }
}

function clearWallpaper() {
  const previousWallpaperUrl = phonePrefs.value.wallpaperUrl;
  phonePrefs.value.wallpaperUrl = '';
  if (isIndexedImageRef(previousWallpaperUrl)) {
    void deleteIndexedImage(previousWallpaperUrl);
  }
}

function handleWallpaperFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  prepareWallpaperBlob(file)
    .then(async blob => {
      await saveIndexedImageBlob(PHONE_WALLPAPER_IMAGE_REF, blob);
      phonePrefs.value.wallpaperUrl = PHONE_WALLPAPER_IMAGE_REF;
      await syncWallpaperSource(PHONE_WALLPAPER_IMAGE_REF);
      savePhonePreferences(phonePrefs.value);
    })
    .catch(error => {
      console.error('[状态栏] 背景图加载失败:', error);
      if (typeof toastr !== 'undefined') {
        toastr.error('背景图加载失败，请换一张图片试试。', '状态栏');
      }
    })
    .finally(() => {
      input.value = '';
    });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片解码失败'));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), type, quality);
  });
}

async function prepareWallpaperBlob(file: File): Promise<Blob> {
  const fileType = file.type.toLowerCase();
  if (!fileType.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }

  if (fileType === 'image/gif' || fileType === 'image/svg+xml') {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageFromUrl(objectUrl);
    const maxSide = 1440;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);
    return (await canvasToBlob(canvas, 'image/jpeg', 0.86)) ?? file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function updatePhoneState(statData: Record<string, any>) {
  characterData.value = statData;
  combatData.value = statData;

  const timeData = statData.时间系统;
  const locationData = statData.位置系统;

  const gameTime = timeData?.时间;
  if (typeof gameTime === 'string' && gameTime.trim()) {
    currentTime.value = gameTime.trim();
  } else if (typeof gameTime === 'number') {
    const hours = Math.floor(gameTime / 60);
    const minutes = gameTime % 60;
    currentTime.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } else {
    currentTime.value = '00:00';
  }

  currentDate.value = typeof timeData?.日期 === 'string' && timeData.日期 ? timeData.日期 : '2025年1月1日';
  currentLocation.value =
    typeof locationData?.地点名称 === 'string' && locationData.地点名称
      ? locationData.地点名称
      : typeof locationData?.坐标 === 'string' && locationData.坐标
        ? locationData.坐标
        : '初始点';
  currentCoordinate.value =
    typeof locationData?.坐标 === 'string' && locationData.坐标
      ? locationData.坐标
      : `F${Number(locationData?.楼层 || 1)}`;
}

const PHONE_REFRESH_FALLBACK_MS = 15_000;
const PHONE_EVENT_REFRESH_DEBOUNCE_MS = 120;
const PHONE_SLOW_OPERATION_MS = 80;
let updateInterval: number | null = null;
let phoneDataRefreshTimer: number | null = null;
let phoneDataRefreshPromise: Promise<void> | null = null;
let phoneDataRefreshQueued = false;
let mvuUpdateListener: EventOnReturn | null = null;

function reportSlowPhoneOperation(name: string, startedAt: number) {
  const elapsed = Math.round(performance.now() - startedAt);
  if (elapsed >= PHONE_SLOW_OPERATION_MS) {
    console.info(`[状态栏] ${name}耗时 ${elapsed}ms`);
  }
}

async function refreshPhoneData(reason: string): Promise<void> {
  if (!props.isVisible) return;

  if (phoneDataRefreshPromise) {
    phoneDataRefreshQueued = true;
    return phoneDataRefreshPromise;
  }

  const startedAt = performance.now();
  phoneDataRefreshPromise = (async () => {
    try {
      const mvuData = await getLatestMvuData();
      if (!mvuData?.stat_data) {
        console.warn(`[状态栏] MVU 数据为空，跳过手机刷新（${reason}）`);
        return;
      }

      updatePhoneState(mvuData.stat_data);
    } catch (error) {
      console.error(`[状态栏] 刷新手机数据失败（${reason}）:`, error);
    } finally {
      reportSlowPhoneOperation(`手机数据刷新（${reason}）`, startedAt);
    }
  })();

  try {
    await phoneDataRefreshPromise;
  } finally {
    phoneDataRefreshPromise = null;
    if (phoneDataRefreshQueued) {
      phoneDataRefreshQueued = false;
      schedulePhoneDataRefresh('合并的变量更新');
    }
  }
}

function schedulePhoneDataRefresh(reason: string, delay = PHONE_EVENT_REFRESH_DEBOUNCE_MS) {
  if (!props.isVisible || phoneDataRefreshTimer !== null) return;

  phoneDataRefreshTimer = window.setTimeout(() => {
    phoneDataRefreshTimer = null;
    void refreshPhoneData(reason);
  }, delay);
}

function measurePhoneOpenFirstFrame() {
  const hostWindow = getPhoneHostWindow();
  const performanceApi = hostWindow.performance;
  const markPrefix = `fatria-phone-open-${Date.now()}`;

  try {
    performanceApi.mark(`${markPrefix}-start`);
    hostWindow.requestAnimationFrame(() => {
      hostWindow.requestAnimationFrame(() => {
        const endMark = `${markPrefix}-first-frame`;
        performanceApi.mark(endMark);
        performanceApi.measure(markPrefix, `${markPrefix}-start`, endMark);
        const entries = performanceApi.getEntriesByName(markPrefix);
        const duration = entries.length > 0 ? entries[entries.length - 1].duration : undefined;
        if (duration !== undefined) {
          console.info(`[状态栏] 小手机打开首帧 ${Math.round(duration)}ms`);
        }
        performanceApi.clearMeasures(markPrefix);
        performanceApi.clearMarks(`${markPrefix}-start`);
        performanceApi.clearMarks(endMark);
      });
    });
  } catch (error) {
    console.debug('[状态栏] 性能标记不可用:', error);
  }
}

// 关闭状态栏
function close() {
  emit('close');
}

function handleScriptUpdateStatus(event: Event) {
  const detail = (event as CustomEvent<ScriptUpdateState>).detail;
  if (detail) {
    scriptUpdateState.value = detail;
  }
}

onMounted(() => {
  if (props.isVisible) void refreshPhoneData('初始化可见手机');
  unsubscribeEnemyTraitsSetting = subscribeEnemyTraitsSetting(enabled => {
    enemyTraitsEnabled.value = enabled;
  });
  unsubscribeNpcSkillPoolsSetting = subscribeNpcSkillPoolsSetting(families => {
    npcSkillPools.value = families;
  });
  window.requestAnimationFrame(() => applyPhonePosition(phonePosition.value));
  getPhoneHostWindow().addEventListener('resize', handlePhoneViewportResize);

  // 变量事件为主，低频定时器只用于弥补外部脚本未发送事件的情况。
  updateInterval = window.setInterval(() => {
    if (props.isVisible) {
      void refreshPhoneData('低频兜底');
    }
  }, PHONE_REFRESH_FALLBACK_MS);

  // 监听 MVU 变量更新事件
  const globalAny = window as any;
  if (globalAny.eventOn && globalAny.Mvu) {
    mvuUpdateListener = globalAny.eventOn(globalAny.Mvu.events.VARIABLE_UPDATE_ENDED, () => {
      schedulePhoneDataRefresh('MVU 变量更新');
    });
  }

  // 监听自定义数据更新事件（用于背包界面等）
  const dataUpdateHandler = () => {
    schedulePhoneDataRefresh('自定义数据更新');
  };
  window.addEventListener('mvu-data-updated', dataUpdateHandler);
  window.addEventListener(SCRIPT_UPDATE_EVENT, handleScriptUpdateStatus);

  (window as any).__statusBarDataUpdateHandler = dataUpdateHandler;
});

onUnmounted(() => {
  unsubscribeEnemyTraitsSetting?.();
  unsubscribeEnemyTraitsSetting = null;
  unsubscribeNpcSkillPoolsSetting?.();
  unsubscribeNpcSkillPoolsSetting = null;
  revokeIndexedImageObjectUrl(resolvedWallpaperUrl.value);
  getPhoneHostWindow().removeEventListener('resize', handlePhoneViewportResize);
  removePhonePointerListeners();
  phoneDragState = null;
  isPhoneDragging.value = false;
  if (updateInterval !== null) {
    clearInterval(updateInterval);
  }
  if (phoneDataRefreshTimer !== null) {
    clearTimeout(phoneDataRefreshTimer);
  }
  mvuUpdateListener?.stop();
  mvuUpdateListener = null;
  // 移除事件监听
  const handler = (window as any).__statusBarDataUpdateHandler;
  if (handler) {
    window.removeEventListener('mvu-data-updated', handler);
    delete (window as any).__statusBarDataUpdateHandler;
  }
  window.removeEventListener(SCRIPT_UPDATE_EVENT, handleScriptUpdateStatus);
});
</script>

<style scoped lang="scss">
// Keep a first rule before the overlay; the live style loader can prepend a BOM to its first selector.
.status-bar-style-anchor {
  display: block;
}

.status-bar-overlay {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  width: 100dvw !important;
  height: 100vh !important;
  height: 100dvh !important;
  background: transparent !important;
  z-index: 99999 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
    max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  pointer-events: none !important;
  overflow: hidden;
  box-sizing: border-box;
}

.status-bar-container {
  position: relative;
  width: min(404px, calc(100vw - 24px));
  width: min(404px, calc(100dvw - 24px));
  height: min(762px, calc(100vh - 24px));
  height: min(762px, calc(100dvh - 24px));
  min-width: 0;
  pointer-events: auto;
}

.phone-device {
  position: relative;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 26px 42px rgba(0, 0, 0, 0.42));
  animation: phone-enter 0.22s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.phone-device.phone-dragging {
  user-select: none;
}

.phone-drag-handle {
  position: absolute;
  top: 2px;
  left: 50%;
  z-index: 9;
  width: 112px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 0 0 16px 16px;
  cursor: grab;
  touch-action: none;
  user-select: none;
  outline: none;
  transform: translateX(-50%);

  &:hover,
  &:focus-visible,
  &.dragging {
    background: rgba(14, 30, 38, 0.18);
  }

  &.dragging {
    cursor: grabbing;
  }
}

.phone-drag-grip {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 1px 5px rgba(15, 23, 42, 0.24);
  opacity: 0.8;
}

.phone-frame {
  --screen-base: #75d7d8;
  --screen-accent: #5aa7a8;
  --screen-accent-strong: #3d7e82;
  --glass-bg: rgba(68, 122, 125, 0.56);
  --glass-border: rgba(255, 255, 255, 0.22);
  --phone-wallpaper-opacity: 0;
  --phone-wallpaper-blur: 0px;
  --phone-tint-opacity: 0.15;
  --phone-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;

  position: relative;
  width: 100%;
  height: 100%;
  border: 10px solid #202126;
  border-radius: 46px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.22), transparent 30%),
    linear-gradient(180deg, var(--screen-base), #77d7d3 64%, #82ddd7);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 0 0 2px rgba(0, 0, 0, 0.18);
  font-family: var(--phone-font-family);
}

.theme-midnight {
  --screen-base: #202741;
  --screen-accent: #5d6ac6;
  --screen-accent-strong: #24305d;
  --glass-bg: rgba(20, 27, 50, 0.64);
}

.phone-wallpaper {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: var(--phone-wallpaper-opacity);
  filter: blur(var(--phone-wallpaper-blur));
  transform: scale(1.04);
  z-index: 0;
}

.phone-wallpaper-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.phone-tint {
  position: absolute;
  inset: 0;
  background: rgba(7, 18, 28, var(--phone-tint-opacity));
  pointer-events: none;
  z-index: 1;
}

.phone-screen {
  position: relative;
  z-index: 3;
  height: 100%;
  min-height: 0;
  padding: 32px 28px 42px;
  box-sizing: border-box;
}

.phone-screen-app {
  padding: 0;
}

.phone-exit-button {
  position: absolute;
  top: 18px;
  right: 20px;
  z-index: 8;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(14, 30, 38, 0.28);
  box-shadow:
    0 10px 22px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition:
    transform 0.16s ease,
    background 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(14, 30, 38, 0.42);
  }
}

.home-screen,
.app-page-shell {
  height: 100%;
  min-height: 0;
}

.home-screen {
  display: flex;
  flex-direction: column;
}

.home-widgets {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin: 38px 0 38px;
}

.home-widget {
  min-width: 0;
  height: 90px;
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: var(--glass-bg);
  box-shadow:
    0 12px 18px rgba(30, 64, 72, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition:
    transform 0.18s ease,
    background 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.18);
  }
}

.widget-main {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
}

.location-widget .widget-main {
  font-size: 22px;
}

.widget-sub {
  max-width: 100%;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.78);
}

.fatria-phone-app-grid {
  display: grid;
  grid-template-columns: repeat(3, 76px);
  row-gap: 26px;
  column-gap: 20px;
  justify-content: space-between;
  justify-items: center;
  align-content: start;
}

.fatria-phone-app,
.fatria-phone-dock-app {
  width: 76px;
  min-width: 0;
  min-height: 88px;
  border: 0;
  padding: 0;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  color: #fff;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  transition: transform 0.16s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.96);
  }
}

.fatria-phone-app-icon {
  position: relative;
  width: 58px;
  height: 58px;
  min-width: 58px;
  max-width: 58px;
  min-height: 58px;
  max-height: 58px;
  flex: 0 0 58px;
  aspect-ratio: 1 / 1;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.94);
  background: rgba(80, 133, 136, 0.78);
  box-shadow:
    0 10px 18px rgba(28, 64, 74, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition:
    border-radius 0.18s ease,
    clip-path 0.18s ease,
    filter 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.32), transparent 42%, rgba(0, 0, 0, 0.14));
    pointer-events: none;
  }

  i {
    position: relative;
    z-index: 1;
    font-size: 25px;
    line-height: 1;
  }
}

.script-update-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 4;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  background: #ff3b30;
  box-shadow:
    0 0 0 1px rgba(125, 18, 18, 0.22),
    0 0 10px rgba(255, 59, 48, 0.72);
  pointer-events: none;
  box-sizing: border-box;
}

.fatria-phone-app-label {
  width: 76px;
  min-height: 17px;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.fatria-phone-app-cyan {
  background: linear-gradient(145deg, #31b8c9, #287c8e);
}

.fatria-phone-app-blue {
  background: linear-gradient(145deg, #4f8fd7, #315d9d);
}

.fatria-phone-app-violet {
  background: linear-gradient(145deg, #8b6de8, #5b45ad);
}

.fatria-phone-app-amber {
  background: linear-gradient(145deg, #d99535, #a35f1e);
}

.fatria-phone-app-green {
  background: linear-gradient(145deg, #4fac78, #2f7651);
}

.fatria-phone-app-pink {
  background: linear-gradient(145deg, #e6679a, #ad3d6c);
}

.fatria-phone-app-teal {
  background: linear-gradient(145deg, #48a99f, #2f716c);
}

.fatria-phone-app-orange {
  background: linear-gradient(145deg, #e17a42, #a84c28);
}

.fatria-phone-app-rose {
  background: linear-gradient(145deg, #c35f7d, #8b3a58);
}

.fatria-phone-app-backstreet {
  background: linear-gradient(145deg, #35a687, #2c6778);
}

.fatria-phone-app-slate {
  background: linear-gradient(145deg, #91a3ad, #566a74);
}

.icon-style-glass-tile .fatria-phone-app-icon {
  border-radius: 18px;
  box-shadow:
    0 12px 22px rgba(28, 64, 74, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -10px 18px rgba(0, 0, 0, 0.1);

  &::after {
    background:
      radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.5), transparent 24%),
      linear-gradient(145deg, rgba(255, 255, 255, 0.24), transparent 46%, rgba(0, 0, 0, 0.12));
  }
}

.icon-style-academy-badge .fatria-phone-app-icon {
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.42);
  border-radius: 999px;
  box-shadow:
    0 12px 20px rgba(20, 48, 58, 0.26),
    0 0 0 5px rgba(255, 255, 255, 0.1) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.34);

  &::before {
    inset: 8px;
    border: 1px solid rgba(255, 255, 255, 0.34);
    border-radius: 999px;
  }

  &::after {
    inset: auto 9px 9px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.24);
  }
}

.icon-style-prism-card .fatria-phone-app-icon {
  border-color: rgba(255, 255, 255, 0.24);
  border-radius: 9px 20px 9px 20px;
  transform: rotate(-5deg);
  box-shadow:
    0 14px 22px rgba(15, 23, 42, 0.24),
    -5px 5px 0 rgba(255, 255, 255, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);

  &::before {
    right: auto;
    width: 10px;
    background: rgba(255, 255, 255, 0.22);
  }

  &::after {
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.38), transparent 32%),
      linear-gradient(315deg, rgba(255, 255, 255, 0.18), transparent 42%);
  }

  i {
    transform: rotate(5deg);
  }
}

.icon-style-corner-chip .fatria-phone-app-icon {
  border-color: rgba(255, 255, 255, 0.3);
  border-radius: 13px;
  clip-path: polygon(14% 0, 100% 0, 100% 76%, 76% 100%, 0 100%, 0 14%);
  filter: saturate(1.1) contrast(1.04);
  box-shadow:
    0 12px 20px rgba(15, 23, 42, 0.25),
    inset 0 0 0 2px rgba(255, 255, 255, 0.18);

  &::before {
    inset: 7px;
    border: 1px dashed rgba(255, 255, 255, 0.22);
    clip-path: polygon(14% 0, 100% 0, 100% 76%, 76% 100%, 0 100%, 0 14%);
  }

  &::after {
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.26), transparent 38%),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 8px);
  }
}

.icon-style-paper-sticker .fatria-phone-app-icon {
  border: 3px solid rgba(255, 255, 255, 0.88);
  border-radius: 18px 25px 16px 24px;
  transform: rotate(4deg);
  filter: saturate(1.08) brightness(1.04);
  box-shadow:
    0 13px 18px rgba(15, 23, 42, 0.2),
    0 0 0 1px rgba(44, 62, 74, 0.1);

  &::before {
    top: 7px;
    right: 7px;
    bottom: auto;
    left: auto;
    width: 12px;
    height: 12px;
    border-radius: 0 7px 0 10px;
    background: rgba(255, 255, 255, 0.66);
    box-shadow: -2px 2px 4px rgba(15, 23, 42, 0.14);
  }

  &::after {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.18), transparent 44%);
  }

  i {
    transform: rotate(-4deg);
  }
}

.fatria-phone-dock {
  margin-top: auto;
  min-height: 94px;
  padding: 12px 10px 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 26px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-items: center;
  align-items: center;
  background: rgba(58, 109, 112, 0.56);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 14px 24px rgba(32, 74, 79, 0.18);
  backdrop-filter: blur(14px);
}

.fatria-phone-dock-app {
  width: 64px;
  gap: 5px;

  .fatria-phone-app-icon {
    width: 50px;
    height: 50px;
    min-width: 50px;
    max-width: 50px;
    min-height: 50px;
    max-height: 50px;
    flex-basis: 50px;
    border-radius: 14px;

    i {
      font-size: 22px;
    }
  }

  .fatria-phone-app-label {
    width: 64px;
    font-size: 11px;
  }
}

.app-page-shell {
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
}

.app-page-shell-flush {
  background: transparent;
}

.app-page-header {
  position: relative;
  z-index: 30;
  flex: 0 0 76px;
  height: 76px;
  padding: 18px 22px 10px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 8px;
  color: #fff;
  background: linear-gradient(180deg, rgba(18, 33, 45, 0.28), rgba(18, 33, 45, 0.08));
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  box-sizing: border-box;
}

.app-page-header::after {
  content: '';
}

.back-button {
  position: relative;
  z-index: 2;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.18);
  }
}

.app-page-title {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-size: 15px;
  font-weight: 800;

  > span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.page-icon {
  position: relative;
  width: 28px;
  height: 28px;
  overflow: hidden;
  border-radius: 9px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  box-shadow:
    0 6px 12px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.24), transparent 48%);
    pointer-events: none;
  }

  i {
    position: relative;
    z-index: 1;
    font-size: 13px;
  }

  .script-update-dot {
    top: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    border-width: 1px;
  }
}

.icon-style-academy-badge .page-icon {
  border-radius: 999px;
}

.icon-style-prism-card .page-icon {
  border-radius: 6px 12px 6px 12px;
  transform: rotate(-5deg);

  i {
    transform: rotate(5deg);
  }
}

.icon-style-corner-chip .page-icon {
  border-radius: 7px;
  clip-path: polygon(14% 0, 100% 0, 100% 76%, 76% 100%, 0 100%, 0 14%);
}

.icon-style-paper-sticker .page-icon {
  border: 2px solid rgba(255, 255, 255, 0.84);
  border-radius: 10px 14px 9px 13px;
  transform: rotate(4deg);

  i {
    transform: rotate(-4deg);
  }
}

.status-content {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  z-index: 2;
  padding-bottom: 28px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.22);
    border-radius: 2px;
  }
}

.status-content-flush {
  overflow: hidden;
  padding-bottom: 0;
}

.settings-page {
  min-height: 100%;
  padding: 16px 14px 34px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #21313b;
  background: linear-gradient(
    145deg,
    rgba(247, 251, 255, 0.98) 0%,
    rgba(239, 245, 249, 0.94) 48%,
    rgba(229, 239, 243, 0.94) 100%
  );
  box-sizing: border-box;
}

.settings-page-intro {
  position: relative;
  min-height: 104px;
  overflow: hidden;
  border: 1px solid rgba(47, 101, 127, 0.24);
  border-radius: 24px;
  padding: 16px 15px;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  color: #f7fdff;
  background: linear-gradient(135deg, rgba(22, 61, 79, 0.98), rgba(39, 99, 112, 0.96) 58%, rgba(107, 75, 122, 0.92));
  box-shadow:
    0 18px 30px rgba(34, 78, 96, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  box-sizing: border-box;

  &::after {
    position: absolute;
    right: -22px;
    bottom: -34px;
    width: 132px;
    height: 80px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 50%;
    transform: rotate(-18deg);
    content: '';
    pointer-events: none;
  }
}

.settings-intro-mark {
  position: relative;
  z-index: 1;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 15px;
  display: grid;
  place-items: center;
  color: #163b4a;
  background: linear-gradient(145deg, #b8f1e6, #76c5d0);
  box-shadow:
    0 10px 18px rgba(4, 27, 38, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);

  i {
    font-size: 19px;
  }
}

.settings-intro-copy {
  position: relative;
  z-index: 1;
  min-width: 0;

  h1 {
    margin: 2px 0 3px;
    overflow: hidden;
    color: #fff;
    font-size: 21px;
    font-weight: 950;
    letter-spacing: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    margin: 0;
    overflow: hidden;
    color: rgba(239, 252, 255, 0.74);
    font-size: 11px;
    font-weight: 700;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.settings-intro-eyebrow {
  color: rgba(190, 244, 238, 0.78);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: 0.14em;
}

.settings-sync-state {
  position: relative;
  z-index: 1;
  align-self: start;
  border: 1px solid rgba(181, 244, 232, 0.28);
  border-radius: 999px;
  padding: 5px 8px;
  color: #d9fff5;
  background: rgba(13, 40, 54, 0.26);
  font-size: 10px;
  font-weight: 850;
  white-space: nowrap;

  i {
    margin-right: 4px;
    color: #74e5b7;
    font-size: 7px;
    vertical-align: 1px;
  }
}

.settings-quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.settings-quick-stat {
  min-width: 0;
  border: 1px solid rgba(125, 151, 163, 0.2);
  border-radius: 17px;
  padding: 10px 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow:
    0 9px 18px rgba(41, 78, 91, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  box-sizing: border-box;

  > span:last-child {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  strong {
    overflow: hidden;
    color: #263e4b;
    font-size: 11px;
    font-weight: 950;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    overflow: hidden;
    color: #748791;
    font-size: 9px;
    font-weight: 750;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.settings-quick-icon {
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 6px 12px rgba(35, 76, 93, 0.16);

  i {
    font-size: 12px;
  }
}

.quick-icon-combat {
  background: linear-gradient(145deg, #3eb5b0, #3476b4);
}
.quick-icon-pools {
  background: linear-gradient(145deg, #8874d8, #5763b5);
}
.quick-icon-theme {
  background: linear-gradient(145deg, #e18c68, #bc5a75);
}

.settings-category-heading {
  min-height: 38px;
  border: 1px solid rgba(125, 151, 163, 0.18);
  border-radius: 15px;
  padding: 0 11px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 7px 14px rgba(43, 83, 96, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-sizing: border-box;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;

  span {
    min-width: 0;
    color: #21313b;
    font-size: 16px;
    font-weight: 950;
  }

  small {
    flex: 0 0 auto;
    color: #71838e;
    font-size: 11px;
    font-weight: 800;
  }

  &:hover {
    border-color: rgba(60, 137, 153, 0.34);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 9px 18px rgba(43, 83, 96, 0.09);
  }
}

.settings-category-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;

  > summary.settings-category-heading {
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: '\f078';
      flex: 0 0 auto;
      color: #71838e;
      font-family: 'Font Awesome 6 Free';
      font-size: 11px;
      font-weight: 900;
      transition: transform 0.16s ease;
    }
  }

  &:not([open]) {
    gap: 0;
  }

  &[open] > summary.settings-category-heading::after {
    transform: rotate(180deg);
  }
}

.settings-section {
  padding: 14px;
  border: 1px solid rgba(137, 160, 172, 0.2);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 16px 30px rgba(31, 73, 88, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(12px);
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;

  &:focus-within {
    border-color: rgba(54, 141, 157, 0.36);
    box-shadow:
      0 18px 32px rgba(31, 73, 88, 0.14),
      0 0 0 3px rgba(74, 185, 190, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.74);
  }
}

.settings-section-compact {
  padding-bottom: 10px;
}

.settings-section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;

  span {
    min-width: 0;
    color: #1f2e38;
    font-size: 15px;
    font-weight: 900;
  }

  small {
    flex: 0 0 auto;
    color: #7c8b95;
    font-size: 11px;
    font-weight: 700;
  }
}

.settings-advanced-panel {
  margin-top: 12px;
  border-top: 1px solid rgba(133, 154, 164, 0.14);
  padding-top: 10px;

  summary {
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid rgba(124, 142, 153, 0.18);
    border-radius: 14px;
    padding: 0 12px;
    color: #2d4857;
    background: rgba(248, 251, 252, 0.94);
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: '\f078';
      font-family: 'Font Awesome 6 Free';
      font-size: 10px;
      font-weight: 900;
      transition: transform 0.16s ease;
    }

    span {
      min-width: 0;
      font-size: 13px;
      font-weight: 900;
    }

    small {
      margin-left: auto;
      color: #71838e;
      font-size: 10px;
      font-weight: 800;
    }
  }

  &[open] summary {
    margin-bottom: 12px;

    &::after {
      transform: rotate(180deg);
    }
  }
}

.settings-param-help {
  margin: -2px 0 10px;
  color: #71838e;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.45;
}

.settings-reset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;

  label {
    min-width: 0;
    min-height: 38px;
    border: 1px solid rgba(124, 142, 153, 0.18);
    border-radius: 14px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: #344b58;
    background: rgba(248, 251, 252, 0.94);
    font-size: 12px;
    font-weight: 900;
  }

  input {
    flex: 0 0 auto;
    accent-color: #29a9bd;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.icon-style-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  & + & {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(133, 154, 164, 0.14);
  }
}

.icon-style-label {
  color: #526672;
  font-size: 12px;
  font-weight: 900;
}

.icon-style-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.icon-style-button {
  min-width: 0;
  border: 1px solid rgba(124, 142, 153, 0.18);
  border-radius: 14px;
  padding: 7px 4px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #4d5f69;
  background: rgba(248, 251, 252, 0.92);
  cursor: pointer;
  font-size: 11px;
  font-weight: 900;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease;

  &.active {
    border-color: rgba(44, 139, 158, 0.72);
    box-shadow: 0 0 0 2px rgba(86, 188, 205, 0.18);
    color: #1d7180;
    background: #fff;
  }

  &:hover {
    transform: translateY(-1px);
  }

  > span:last-child {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.icon-style-preview {
  position: relative;
  width: 34px;
  height: 34px;
  overflow: hidden;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow:
    0 8px 14px rgba(31, 73, 88, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);

  i {
    position: relative;
    z-index: 1;
    font-size: 15px;
  }
}

.preview-app-glass-tile {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.28), transparent 42%), linear-gradient(145deg, #31b8c9, #315d9d);
}

.preview-app-academy-badge {
  border: 2px solid rgba(255, 255, 255, 0.68);
  border-radius: 999px;
  background: linear-gradient(145deg, #4f8fd7, #315d9d);
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.18) inset,
    0 8px 14px rgba(31, 73, 88, 0.16);
}

.preview-app-prism-card {
  border-radius: 7px 15px 7px 15px;
  transform: rotate(-5deg);
  background: linear-gradient(145deg, #8b6de8, #5b45ad);
  box-shadow:
    -3px 3px 0 rgba(84, 108, 140, 0.24),
    0 8px 14px rgba(31, 73, 88, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);

  i {
    transform: rotate(5deg);
  }
}

.preview-app-corner-chip {
  border-radius: 8px;
  clip-path: polygon(14% 0, 100% 0, 100% 76%, 76% 100%, 0 100%, 0 14%);
  background: linear-gradient(145deg, #48a99f, #2f716c);
}

.preview-app-paper-sticker {
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 13px 17px 12px 16px;
  transform: rotate(4deg);
  background: linear-gradient(145deg, #e6679a, #ad3d6c);

  i {
    transform: rotate(-4deg);
  }
}

.wallpaper-preview-card {
  position: relative;
  height: 168px;
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 24px;
  overflow: hidden;
  background-color: #8fd3d4;
  background-size: cover;
  background-position: center;
  box-shadow:
    0 18px 28px rgba(47, 96, 108, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.wallpaper-preview-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.wallpaper-preview-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(10, 31, 43, 0.3), transparent 38%),
    linear-gradient(0deg, rgba(10, 31, 43, 0.2), transparent 42%);
  pointer-events: none;
}

.wallpaper-preview-status {
  position: absolute;
  top: 14px;
  left: 16px;
  right: 16px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(9, 25, 34, 0.36);

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.wallpaper-camera-button {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 1;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #25333c;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 20px rgba(14, 39, 51, 0.22);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    background: #fff;
  }
}

.wallpaper-preset-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.wallpaper-preset-button {
  min-width: 0;
  border: 1px solid rgba(124, 142, 153, 0.18);
  border-radius: 14px;
  padding: 7px 5px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #4d5f69;
  background: rgba(248, 251, 252, 0.9);
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;

  &.active {
    border-color: rgba(44, 139, 158, 0.72);
    box-shadow: 0 0 0 2px rgba(86, 188, 205, 0.18);
    color: #1d7180;
  }

  &:hover {
    transform: translateY(-1px);
  }
}

.wallpaper-preset-swatch {
  width: 100%;
  aspect-ratio: 1.35;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.38);
}

.settings-text-field,
.settings-textarea-field {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #5c6f7b;
  font-size: 12px;
  font-weight: 800;

  input,
  select,
  textarea {
    width: 100%;
    min-width: 0;
    border: 1px solid rgba(124, 142, 153, 0.22) !important;
    border-radius: 13px;
    color: var(--sk-ink);
    background-color: var(--sk-soft);
    box-sizing: border-box;
    box-shadow: none !important;
    outline: none;

    &::placeholder {
      color: #8797a1;
      opacity: 1;
    }
  }

  input {
    height: 40px;
    padding: 0 12px;
  }

  select {
    height: 40px;
    padding: 0 12px;
    font-weight: 800;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.68;
    }
  }

  textarea {
    min-height: 78px;
    padding: 10px 12px;
    resize: vertical;
    font: inherit;
    line-height: 1.45;
  }
}

.settings-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;

  button {
    min-width: 0;
    height: 40px;
    border: 1px solid rgba(118, 139, 151, 0.2);
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: #42525c;
    background: rgba(247, 250, 252, 0.96);
    cursor: pointer;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;

    &:hover {
      background: #fff;
    }

    &:disabled {
      cursor: wait;
      opacity: 0.68;
    }
  }

  .settings-action-primary {
    border-color: rgba(45, 151, 169, 0.36);
    color: #fff;
    background: linear-gradient(145deg, #38aebc, #247b8c);

    &:hover {
      background: linear-gradient(145deg, #45bdca, #2d8799);
    }
  }
}

.cheat-code-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px;

  .settings-text-field {
    min-width: 0;
    margin-top: 0;
  }

  > button {
    min-width: 76px;
    height: 40px;
    border: 1px solid rgba(45, 151, 169, 0.36);
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: #fff;
    background: linear-gradient(145deg, #38aebc, #247b8c);
    cursor: pointer;
    font-size: 12px;
    font-weight: 900;

    &:hover {
      background: linear-gradient(145deg, #45bdca, #2d8799);
    }

    &:disabled {
      cursor: wait;
      opacity: 0.68;
    }
  }
}

.cheat-code-status {
  margin-top: 10px;
  color: #a54e4e;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.45;
  white-space: pre-line;

  &.success {
    color: #277d69;
  }
}

.settings-version-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  > div {
    min-width: 0;
    border: 1px solid rgba(124, 142, 153, 0.16);
    border-radius: 14px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    background: rgba(247, 250, 252, 0.78);
  }

  span {
    color: #637684;
    font-size: 11px;
    font-weight: 900;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: #1e7c8b;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
    font-weight: 950;
  }
}

.settings-row {
  min-height: 50px;
  border-bottom: 1px solid rgba(133, 154, 164, 0.16);
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) minmax(112px, 42%);
  align-items: center;
  gap: 10px;

  &:last-child {
    border-bottom: 0;
  }

  select {
    width: 100%;
    min-width: 0;
    height: 36px;
    border: 1px solid rgba(124, 142, 153, 0.22) !important;
    border-radius: 12px;
    padding: 0 9px;
    color: var(--sk-ink);
    background-color: var(--sk-soft);
    box-shadow: none !important;
    outline: none;
    font-weight: 800;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.62;
    }
  }
}

.combat-setting-toggle-row {
  grid-template-columns: 34px minmax(0, 1fr) 46px;
}

.combat-settings-panel {
  gap: 12px;

  > summary.settings-category-heading {
    min-height: 42px;
    border: 1px solid rgba(57, 135, 162, 0.24);
    border-radius: 16px;
    padding: 0 12px;
    background: linear-gradient(125deg, rgba(224, 250, 252, 0.92), rgba(239, 235, 255, 0.88));
    box-shadow: 0 10px 20px rgba(43, 102, 126, 0.1);
  }
}

.settings-category-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  i {
    color: #267f9b;
    font-size: 14px;
  }
}

.settings-category-badge {
  border: 1px solid rgba(112, 92, 183, 0.18);
  border-radius: 999px;
  padding: 4px 8px;
  color: var(--sk-violet);
  background: rgba(255, 255, 255, 0.6);
  font-size: 10px !important;
}

.combat-feature-card,
.combat-pool-card {
  border-color: rgba(92, 117, 191, 0.2);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(241, 248, 255, 0.9));
}

.combat-feature-copy {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.combat-feature-icon {
  width: 38px;
  height: 38px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 8px 16px rgba(54, 122, 175, 0.2);
}

.trait-icon {
  background: linear-gradient(145deg, #38b4bb, #3d70bb);
}

.combat-feature-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;

  strong {
    color: #253d54;
    font-size: 14px;
    font-weight: 950;
  }

  small {
    color: #758899;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.35;
  }
}

.combat-switch {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  cursor: pointer;

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
}

.combat-switch-track {
  width: 48px;
  height: 27px;
  border: 1px solid rgba(110, 128, 145, 0.26);
  border-radius: 999px;
  padding: 3px;
  display: flex;
  align-items: center;
  background: #dbe3e9;
  box-sizing: border-box;
  transition:
    background 0.18s ease,
    border-color 0.18s ease;
}

.combat-switch-thumb {
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgba(39, 61, 77, 0.25);
  transition: transform 0.18s ease;
}

.combat-switch input:checked + .combat-switch-track {
  border-color: rgba(37, 142, 164, 0.64);
  background: linear-gradient(110deg, #40c2b7, #3f81c5);

  .combat-switch-thumb {
    transform: translateX(21px);
  }
}

.npc-skill-pool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.npc-skill-pool-option {
  --pool-rgb: 73, 140, 168;
  position: relative;
  min-width: 0;
  min-height: 52px;
  border: 1px solid rgba(124, 142, 153, 0.2);
  border-radius: 15px;
  padding: 8px 9px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #334856;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 5px 12px rgba(69, 93, 112, 0.06);
  cursor: pointer;
  font-size: 12px;
  font-weight: 850;
  box-sizing: border-box;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--pool-rgb), 0.42);
  }

  &.selected {
    border-color: rgba(var(--pool-rgb), 0.62);
    background: rgba(var(--pool-rgb), 0.12);
    box-shadow: 0 8px 16px rgba(var(--pool-rgb), 0.12);
  }

  &.pool-hand {
    --pool-rgb: 38, 162, 181;
  }
  &.pool-oral {
    --pool-rgb: 214, 91, 142;
  }
  &.pool-foot {
    --pool-rgb: 220, 137, 56;
  }
  &.pool-chest {
    --pool-rgb: 194, 76, 126;
  }
  &.pool-ride {
    --pool-rgb: 126, 92, 188;
  }
  &.pool-tool {
    --pool-rgb: 188, 145, 55;
  }
  &.pool-mental {
    --pool-rgb: 72, 104, 184;
  }
}

.skill-pool-checkbox {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.npc-skill-pool-mark {
  width: 29px;
  height: 29px;
  flex: 0 0 auto;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: rgba(var(--pool-rgb), 0.95);
  background: rgba(var(--pool-rgb), 0.13);
  font-size: 13px;
}

.npc-skill-pool-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.npc-skill-pool-check {
  width: 18px;
  height: 18px;
  margin-left: auto;
  border: 1px solid rgba(var(--pool-rgb), 0.26);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: transparent;
  background: rgba(255, 255, 255, 0.62);
  font-size: 9px;
  transition:
    color 0.16s ease,
    background 0.16s ease;
}

.npc-skill-pool-option.selected .npc-skill-pool-check {
  border-color: rgba(var(--pool-rgb), 0.66);
  color: #fff;
  background: rgba(var(--pool-rgb), 0.9);
}

.settings-help-text {
  margin: 10px 0 0;
  color: #7c8b95;
  font-size: 10px;
  font-weight: 700;

  i {
    color: #6c86a1;
    margin-right: 2px;
  }
}

.settings-toggle {
  justify-self: end;
  width: 46px;
  height: 26px;
  margin: 0;
  accent-color: #2ca4b5;
  cursor: pointer;
}

.settings-helper {
  margin-top: 10px;
  border: 1px solid rgba(124, 142, 153, 0.16);
  border-radius: 12px;
  padding: 9px 10px;
  color: #637684;
  background: rgba(247, 250, 252, 0.74);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;

  &.ready {
    border-color: rgba(45, 151, 169, 0.28);
    color: #237484;
    background: rgba(230, 250, 252, 0.72);
  }
}

.settings-changelog {
  margin-top: 14px;
  border-top: 1px solid rgba(133, 154, 164, 0.16);
  padding-top: 12px;

  > summary {
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: '\f078';
      color: #71838e;
      font-family: 'Font Awesome 6 Free';
      font-size: 10px;
      font-weight: 900;
      transition: transform 0.16s ease;
    }
  }

  &[open] > summary::after {
    transform: rotate(180deg);
  }
}

.settings-changelog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #2d4857;
    font-size: 13px;
    font-weight: 900;
  }

  i {
    color: #2ca4b5;
  }

  small {
    color: #7c8b95;
    font-size: 10px;
    font-weight: 800;
  }
}

.settings-changelog-list {
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background: rgba(73, 125, 138, 0.3);
  }
}

.settings-changelog-release {
  position: relative;
  margin-left: 5px;
  border-left: 2px solid rgba(44, 164, 181, 0.24);
  padding: 0 0 14px 14px;

  &:last-child {
    padding-bottom: 2px;
  }

  &::before {
    position: absolute;
    top: 2px;
    left: -5px;
    width: 8px;
    height: 8px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: #2ca4b5;
    box-shadow: 0 0 0 1px rgba(44, 164, 181, 0.35);
    content: '';
  }
}

.settings-changelog-release-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;

  strong {
    color: #1e7c8b;
    font-size: 13px;
    font-weight: 950;
  }

  span {
    border-radius: 999px;
    padding: 2px 6px;
    color: #237484;
    background: rgba(230, 250, 252, 0.9);
    font-size: 10px;
    font-weight: 800;
  }
}

.settings-changelog-release ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 16px;
  color: #637684;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.45;
}

.settings-changelog-release li::marker {
  color: #70aab4;
}

.settings-changelog-release p,
.settings-changelog-empty {
  margin: 0;
  color: #7c8b95;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.45;
}

.settings-row-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, #5bb8c2, #397d91);
  box-shadow: 0 8px 16px rgba(43, 120, 140, 0.18);
}

.settings-row-label {
  min-width: 0;
  overflow: hidden;
  color: #263640;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 900;
}

.settings-slider-row {
  padding: 6px 0 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #42525c;
  font-size: 12px;
  font-weight: 900;

  > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  strong {
    color: #1e7c8b;
    font-size: 12px;
  }

  input[type='range'] {
    width: 100%;
    min-width: 0;
    height: 24px;
    padding: 0;
    accent-color: #2ca4b5;
  }
}

.wallpaper-file-input {
  display: none;
}

.home-indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  width: 126px;
  height: 5px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
  z-index: 8;
  pointer-events: none;
}

@media (max-width: 640px) {
  .status-bar-container {
    width: calc(100vw - 16px);
    width: calc(100dvw - 16px);
    height: calc(100vh - 16px);
    height: calc(100dvh - 16px);
  }

  .phone-frame {
    border-width: 6px;
    border-radius: 36px;
  }

  .phone-screen {
    padding: 26px 18px 38px;
  }

  .phone-screen-app {
    padding: 0;
  }

  .app-page-header {
    flex-basis: 68px;
    height: 68px;
    padding: 14px 16px 8px;
  }

  .phone-exit-button {
    top: 14px;
    right: 16px;
    width: 36px;
    height: 36px;
  }

  .home-widgets {
    gap: 12px;
    margin: 34px 0 28px;
  }

  .home-widget {
    height: 78px;
    border-radius: 18px;
  }

  .widget-main {
    font-size: 24px;
  }

  .location-widget .widget-main {
    font-size: 18px;
  }

  .fatria-phone-app-grid {
    grid-template-columns: repeat(3, 68px);
    column-gap: 10px;
    row-gap: 20px;
  }

  .fatria-phone-app {
    width: 68px;
    min-height: 82px;
  }

  .fatria-phone-app-icon {
    width: 52px;
    height: 52px;
    min-width: 52px;
    max-width: 52px;
    min-height: 52px;
    max-height: 52px;
    flex-basis: 52px;
  }

  .fatria-phone-app-label {
    width: 68px;
    font-size: 12px;
  }

  .settings-page {
    padding: 12px 10px 28px;
    gap: 12px;
  }

  .settings-page-intro {
    min-height: 96px;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 9px;
    border-radius: 20px;
    padding: 13px 12px;
  }

  .settings-intro-mark {
    width: 40px;
    height: 40px;
    border-radius: 13px;
  }

  .settings-intro-copy h1 {
    font-size: 19px;
  }

  .settings-intro-copy p {
    font-size: 10px;
  }

  .settings-sync-state {
    padding: 4px 7px;
    font-size: 9px;
  }

  .settings-quick-grid {
    gap: 6px;
  }

  .settings-quick-stat {
    gap: 6px;
    padding: 8px 7px;
  }

  .settings-quick-icon {
    width: 25px;
    height: 25px;
  }

  .settings-quick-stat strong {
    font-size: 10px;
  }

  .settings-quick-stat small {
    font-size: 8px;
  }

  .settings-category-heading {
    min-height: 36px;
    padding: 0 9px;
  }

  .settings-section {
    border-radius: 17px;
    padding: 12px;
  }
}

@media (max-height: 690px) {
  .home-widgets {
    margin: 28px 0 18px;
  }

  .home-widget {
    height: 68px;
  }

  .fatria-phone-app-grid {
    row-gap: 16px;
  }

  .fatria-phone-app-icon {
    width: 50px;
    height: 50px;
    min-width: 50px;
    max-width: 50px;
    min-height: 50px;
    max-height: 50px;
    flex-basis: 50px;
  }

  .dock {
    min-height: 80px;
    padding-top: 9px;
  }
}

@keyframes phone-enter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 移动端或用户选择简化效果时，避免整屏模糊和多层合成导致 WebView 掉帧或被系统回收。
.phone-device.phone-lite-visuals {
  filter: none;
  animation: none;

  .phone-wallpaper {
    filter: none;
    transform: none;
  }

  :deep(*) {
    backdrop-filter: none !important;
  }
}
</style>
