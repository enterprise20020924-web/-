<template>
  <article :class="['ContentChatRenderer', { 'is-narrative-minimized': isNarrativeMinimized }]">
    <section
      id="bp-narrative-panel"
      :class="['bp-panel', 'bp-narrative-panel', { 'is-minimized': isNarrativeMinimized }]"
      aria-labelledby="bp-narrative-title"
    >
    <h2 id="bp-narrative-title" class="bp-visually-hidden">剧情舞台</h2>

    <div v-if="isNarrativeMinimized" class="bp-narrative-minimized-stage">
      <button
        class="bp-narrative-minidock"
        type="button"
        aria-label="恢复剧情舞台"
        @click="restoreNarrative"
      >
        <img class="bp-narrative-minidock-arona" :src="minimizedAronaUrl" alt="" decoding="async" />
        <span class="bp-narrative-minidock-kicker">SCENE</span>
        <span class="bp-narrative-minidock-location">{{ stageLocationLabel }}</span>
        <span class="bp-narrative-minidock-meta">{{ activeSpeakerName ?? '剧情待机' }}</span>
      </button>
    </div>

    <div class="bp-stage-frame">
      <img class="bp-stage-frame-image" :src="frameBackgroundUrl" alt="" decoding="async" />
      <button
        class="bp-stage-minimize-button"
        type="button"
        aria-label="最小化剧情舞台"
        aria-controls="bp-narrative-panel"
        @click="minimizeNarrative"
      >
        <span class="bp-stage-minimize-mark" aria-hidden="true"></span>
      </button>
      <button
        class="bp-stage-function-ui-slot"
        type="button"
        aria-label="打开什亭之匣"
        @click="openFunctionPage"
      >
        <span class="bp-stage-function-ui-shell" aria-hidden="true">
          <img class="bp-stage-function-ui" :src="functionUiUrl" alt="" decoding="async" />
          <span class="bp-stage-function-ui-label">什亭之匣</span>
        </span>
      </button>
      <button
        :class="['bp-stage-thinking-button', { 'is-empty': !hasThinkingContent }]"
        type="button"
        aria-label="打开思维链"
        @click="openThinkingPage"
      >
        <span class="bp-stage-thinking-button-mark">COT</span>
        <span class="bp-stage-thinking-button-text">思维链</span>
      </button>
      <div class="bp-stage-frame-info bp-stage-frame-info--time">{{ stageTimeLabel }}</div>
      <div class="bp-stage-frame-info bp-stage-frame-info--location">{{ stageLocationLabel }}</div>
      <div class="bp-stage-frame-tape bp-stage-frame-tape--tl"></div>
      <div class="bp-stage-frame-tape bp-stage-frame-tape--tr"></div>
      <div class="bp-stage-frame-tape bp-stage-frame-tape--bl"></div>
      <div class="bp-stage-frame-tape bp-stage-frame-tape--br"></div>
      <div class="bp-stage-frame-rivet bp-stage-frame-rivet--tl"></div>
      <div class="bp-stage-frame-rivet bp-stage-frame-rivet--tr"></div>
      <div class="bp-stage-frame-rivet bp-stage-frame-rivet--bl"></div>
      <div class="bp-stage-frame-rivet bp-stage-frame-rivet--br"></div>
      <div class="bp-stage-frame-stamp">
        <span class="bp-stage-frame-stamp-id">N°05</span>
        <span class="bp-stage-frame-stamp-title">NARRATIVE</span>
        <span class="bp-stage-frame-stamp-sub">SCENE LIVE</span>
      </div>
      <div class="bp-stage-frame-status">
        <span class="bp-stage-frame-status-dot"></span>
        <span class="bp-stage-frame-status-text">REC · STAGE</span>
      </div>
      <div class="bp-stage-frame-hazard"></div>
      <div class="bp-stage-frame-hazard-bottom"></div>
      <div class="bp-stage-frame-corner-marker bp-stage-frame-corner-marker--tl"></div>
      <div class="bp-stage-frame-corner-marker bp-stage-frame-corner-marker--br"></div>
    </div>

    <div class="bp-galgame-screen">
      <div class="bp-galgame-scene-bg" aria-hidden="true">
        <img class="bp-scene-background-image" :src="stageSceneBackgroundUrl" alt="" decoding="async" @error="handleSceneBackgroundError" />
        <div class="bp-scene-overlay"></div>
      </div>

      <div class="bp-galgame-sprites">
        <div
          id="bp-galgame-user-sprite"
          :class="[
            'bp-actor-sprite',
            'is-user',
            {
              'is-active': isCurrentUserSpeaking,
              'is-muted': isCurrentNpcSpeaking,
            },
          ]"
          role="button"
          tabindex="0"
          :aria-label="`查看${userStatus.alias} 512宽立绘`"
          @click="openPortraitPreview('user')"
          @keydown.enter="openPortraitPreview('user')"
          @keydown.space.prevent="openPortraitPreview('user')"
        >
          <img
            v-for="layer in userPortraitLayers"
            :key="layer.id"
            class="bp-actor-portrait"
            :class="{ 'is-visible': layer.src === userPortraitUrl }"
            :src="layer.src"
            :alt="layer.src === userPortraitUrl ? `${userStatus.alias} 立绘占位` : ''"
            :aria-hidden="layer.src === userPortraitUrl ? undefined : 'true'"
            decoding="sync"
            loading="eager"
            @error="handlePortraitLayerError($event, layer.fallbackUrls)"
          />
        </div>

        <div
          id="bp-galgame-npc-sprite"
          :class="[
            'bp-actor-sprite',
            'is-npc',
            {
              'is-active': isCurrentNpcSpeaking,
              'is-muted': isCurrentUserSpeaking,
            },
          ]"
          role="button"
          tabindex="0"
          :aria-label="`查看${portraitNpcLabel ?? '角色'} 512宽立绘`"
          @click="openPortraitPreview('npc')"
          @keydown.enter="openPortraitPreview('npc')"
          @keydown.space.prevent="openPortraitPreview('npc')"
        >
          <img
            v-for="layer in npcPortraitLayers"
            :key="layer.id"
            class="bp-actor-portrait"
            :class="{ 'is-visible': layer.src === npcPortraitUrl }"
            :src="layer.src"
            :alt="layer.src === npcPortraitUrl ? `${portraitNpcLabel ?? '角色'} 立绘占位` : ''"
            :aria-hidden="layer.src === npcPortraitUrl ? undefined : 'true'"
            decoding="sync"
            loading="eager"
            @error="handlePortraitLayerError($event, layer.fallbackUrls)"
          />
        </div>
      </div>

      <div class="bp-galgame-dialog-area" role="region" aria-live="polite" aria-label="当前剧情段落">
        <div v-if="currentSegment !== null && activeSpeakerName !== null" class="bp-speaker-tag">
          <span class="bp-speaker-name">{{ activeSpeakerName }}</span>
          <span v-if="activeSpeakerAffiliation !== null" class="bp-speaker-affiliation">{{ activeSpeakerAffiliation }}</span>
        </div>

        <template v-if="currentSegment !== null">
          <div
            :class="[
              'bp-dialogue-panel',
              {
                'is-user-turn': isCurrentUserSpeaking,
                'is-npc-turn': isCurrentNpcSpeaking,
              },
            ]"
          >
            <div class="bp-dialogue-copy">
              <p class="bp-dialogue-text">{{ currentSegment.text }}</p>

              <div class="bp-dialogue-rail">
                <div class="bp-dialogue-meta-strip">
                  <span class="bp-dialogue-counter">{{ currentIndex + 1 }} / {{ segments.length }}</span>

                  <div class="bp-dialogue-preview-row" aria-label="段落切换">
                    <button
                      v-for="segment in previewSegments"
                      :key="segment.id"
                      :id="`bp-dialogue-preview-${segment.id}`"
                      type="button"
                      :class="['bp-dialogue-preview-chip', { 'is-active': segment.id === currentSegment.id }]"
                      :aria-current="segment.id === currentSegment.id ? 'step' : undefined"
                      :aria-label="`跳到${segmentSpeakerLabel(segment)}的段落`"
                      @click="jumpToSegment(segment.id)"
                    >
                      <span>{{ segmentSpeakerLabel(segment) }}</span>
                    </button>
                  </div>
                </div>

                <div class="bp-dialogue-actions">
                  <button
                    id="bp-dialogue-prev-button"
                    type="button"
                    class="bp-button bp-dialogue-next-button is-previous"
                    :disabled="currentIndex <= 0"
                    @click="retreatNarrative"
                  >
                    上一段
                  </button>

                  <button
                    v-if="!isAtEnd"
                    id="bp-dialogue-next-button"
                    type="button"
                    class="bp-button bp-dialogue-next-button"
                    @click="advanceNarrative"
                  >
                    下一段
                  </button>

                  <button
                    v-else
                    id="bp-dialogue-reverse-button"
                    type="button"
                    class="bp-button bp-dialogue-next-button is-restart"
                    @click="reverseNarrative"
                  >
                    重开
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="bp-empty-state">没有可显示的正文段落</div>
      </div>
      </div>

      <div
        v-if="isFunctionPageOpen"
        class="bp-function-page-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bp-function-page-title"
        @click.self="closeFunctionPage"
        @keydown.esc.stop.prevent="closeFunctionPage"
        tabindex="-1"
      >
        <section class="bp-function-page-card">
          <!-- BA Style Outer Frame Decorative Elements -->
          <div class="bp-ba-frame-corner top-left"></div>
          <div class="bp-ba-frame-corner top-right"></div>
          <div class="bp-ba-frame-corner bottom-left"></div>
          <div class="bp-ba-frame-corner bottom-right"></div>
          
          <div class="bp-ba-frame-cross top-left"></div>
          <div class="bp-ba-frame-cross top-right"></div>
          <div class="bp-ba-frame-cross bottom-left"></div>
          <div class="bp-ba-frame-cross bottom-right"></div>
          
          <!-- Large Background Logo / Watermark -->
          <div class="bp-function-page-watermark">
            <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 80 L80 80 L120 20 L80 20 Z" fill="url(#watermark-grad)" />
              <path d="M120 80 L160 80 L200 20 L160 20 Z" fill="url(#watermark-grad)" />
              <path d="M20 50 L180 50" stroke="url(#watermark-grad)" stroke-width="2" stroke-dasharray="4 4" />
              <defs>
                <linearGradient id="watermark-grad" x1="0" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#00A0E9" stop-opacity="0.06"/>
                  <stop offset="100%" stop-color="#00A0E9" stop-opacity="0.01"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <button
            type="button"
            class="bp-function-page-close"
            aria-label="关闭什亭之匣"
            @click="closeFunctionPage"
          >
            返回
          </button>

          <header class="bp-function-page-header">
            <p class="bp-function-page-kicker">Shittim Chest</p>
            <h3 id="bp-function-page-title" class="bp-function-page-title">
              什亭之匣
              <span class="bp-title-decorator"></span>
            </h3>
          </header>

          <nav class="bp-function-page-tabs" aria-label="什亭之匣标签页">
            <button
              type="button"
              :class="['bp-function-page-tab', { 'is-active': activeFunctionTab === 'manual-sex-battle' }]"
              @click="setFunctionTab('manual-sex-battle')"
            >
              <svg v-if="activeFunctionTab === 'manual-sex-battle'" class="bp-tab-icon" viewBox="0 0 16 16" fill="none"><path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor"/></svg>
              手动性斗
            </button>
            <button
              type="button"
              :class="['bp-function-page-tab', { 'is-active': activeFunctionTab === 'pending-one' }]"
              @click="setFunctionTab('pending-one')"
            >
              敬请期待
            </button>
            <button
              type="button"
              :class="['bp-function-page-tab', { 'is-active': activeFunctionTab === 'pending-two' }]"
              @click="setFunctionTab('pending-two')"
            >
              敬请期待
            </button>
          </nav>

          <section class="bp-function-page-content" aria-live="polite">
            <template v-if="activeFunctionTab === 'manual-sex-battle'">
              <div class="bp-manual-battle-panel">
                <section class="bp-manual-battle-section">
                  <div class="bp-manual-battle-section-head">
                    <div>
                      <p class="bp-manual-battle-kicker">CURRENT SCENE <span class="bp-kicker-dots">....</span></p>
                      <h4 class="bp-function-page-content-title">当前在场</h4>
                    </div>
                    <span class="bp-manual-battle-count">{{ presentRelationshipContacts.length }}</span>
                  </div>

                  <div v-if="presentRelationshipContacts.length > 0" class="bp-manual-battle-grid is-present">
                    <button
                      v-for="contact in presentRelationshipContacts"
                      :key="`present-${contact.name}`"
                      type="button"
                      class="bp-manual-battle-contact is-present"
                      @click="openRelationshipContactPage(contact)"
                    >
                      <span
                        class="bp-manual-battle-avatar"
                        :class="{ 'has-image': contact.avatarUrl !== null }"
                      >
                        <img
                          v-if="contact.avatarUrl !== null"
                          class="bp-manual-battle-avatar-image"
                          :src="contact.avatarUrl"
                          :alt="`${contact.name} Q版头像`"
                          decoding="async"
                          loading="lazy"
                          @error="handleRelationshipAvatarError"
                        />
                        <span class="bp-manual-battle-avatar-fallback">{{ contact.name.slice(0, 1) }}</span>
                      </span>
                      <span class="bp-manual-battle-name">{{ contact.name }}</span>
                    </button>
                  </div>
                  <p v-else class="bp-manual-battle-empty">当前楼层没有同步在场人物。</p>
                </section>

                <section class="bp-manual-battle-section">
                  <div class="bp-manual-battle-section-head">
                    <div>
                      <p class="bp-manual-battle-kicker">CONTACT ARCHIVE <span class="bp-kicker-dots">....</span></p>
                      <h4 class="bp-function-page-content-title">已知联系人</h4>
                    </div>
                    <span class="bp-manual-battle-count">{{ knownRelationshipContacts.length }}</span>
                  </div>

                  <div v-if="contactFactions.length > 0" class="bp-manual-battle-factions" aria-label="联系人阵营">
                    <button
                      v-for="faction in contactFactions"
                      :key="faction.name"
                      type="button"
                      :class="['bp-manual-battle-faction-tab', { 'is-active': selectedContactFaction === faction.name }]"
                      @click="activeContactFaction = faction.name"
                    >
                      <span>{{ faction.name }}</span>
                      <span>{{ faction.contacts.length }}</span>
                    </button>
                  </div>

                  <div v-if="selectedKnownContacts.length > 0" class="bp-manual-battle-grid">
                    <button
                      v-for="contact in selectedKnownContacts"
                      :key="`known-${contact.name}`"
                      type="button"
                      class="bp-manual-battle-contact"
                      @click="openRelationshipContactPage(contact)"
                    >
                      <span
                        class="bp-manual-battle-avatar"
                        :class="{ 'has-image': contact.avatarUrl !== null }"
                      >
                        <img
                          v-if="contact.avatarUrl !== null"
                          class="bp-manual-battle-avatar-image"
                          :src="contact.avatarUrl"
                          :alt="`${contact.name} Q版头像`"
                          decoding="async"
                          loading="lazy"
                          @error="handleRelationshipAvatarError"
                        />
                        <span class="bp-manual-battle-avatar-fallback">{{ contact.name.slice(0, 1) }}</span>
                      </span>
                      <span class="bp-manual-battle-name">{{ contact.name }}</span>
                    </button>
                  </div>
                  <p v-else class="bp-manual-battle-empty">暂无可显示的已知联系人。</p>
                </section>
              </div>
            </template>
            <template v-else>
              <h4 class="bp-function-page-content-title">敬请期待</h4>
              <p class="bp-function-page-content-copy">该标签页暂未开放。</p>
            </template>
          </section>
        </section>
      </div>

      <div
        v-if="isThinkingPageOpen"
        class="bp-function-page-overlay bp-thinking-page-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bp-thinking-page-title"
        @click.self="closeThinkingPage"
        @keydown.esc.stop.prevent="closeThinkingPage"
        tabindex="-1"
      >
        <section class="bp-function-page-card bp-thinking-page-card">
          <div class="bp-ba-frame-corner top-left"></div>
          <div class="bp-ba-frame-corner top-right"></div>
          <div class="bp-ba-frame-corner bottom-left"></div>
          <div class="bp-ba-frame-corner bottom-right"></div>
          <div class="bp-ba-frame-cross top-left"></div>
          <div class="bp-ba-frame-cross top-right"></div>
          <div class="bp-ba-frame-cross bottom-left"></div>
          <div class="bp-ba-frame-cross bottom-right"></div>

          <button
            type="button"
            class="bp-function-page-close"
            aria-label="关闭思维链"
            @click="closeThinkingPage"
          >
            返回
          </button>

          <header class="bp-function-page-header">
            <p class="bp-function-page-kicker">Thinking Trace</p>
            <h3 id="bp-thinking-page-title" class="bp-function-page-title">
              思维链
              <span class="bp-title-decorator"></span>
            </h3>
          </header>

          <section class="bp-function-page-content bp-thinking-page-content" aria-live="polite">
            <div class="bp-thinking-page-head">
              <p class="bp-manual-battle-kicker">RAW THINK BLOCK <span class="bp-kicker-dots">....</span></p>
              <span :class="['bp-thinking-page-status', { 'is-empty': !hasThinkingContent }]">
                {{ hasThinkingContent ? '已读取' : '未检出' }}
              </span>
            </div>

            <pre v-if="hasThinkingContent" class="bp-thinking-page-text">{{ thinkingContent }}</pre>
            <p v-else class="bp-thinking-page-empty">
              当前楼层没有读取到 &lt;think&gt; / &lt;thinking&gt; 标签内容。
            </p>
          </section>
        </section>
      </div>

      <div
        v-if="isFunctionPageOpen && selectedRelationshipContact !== null"
        class="bp-character-detail-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="`${selectedRelationshipContact.name} 角色详情`"
        @click.self="closeRelationshipContactPage"
        @keydown.esc.stop.prevent="closeRelationshipContactPage"
        tabindex="-1"
      >
        <section class="bp-character-detail-shell">
          <button
            type="button"
            class="bp-character-detail-exit"
            aria-label="退出角色详情"
            @click="closeRelationshipContactPage"
          >
            退出
          </button>
          <img
            class="bp-character-detail-ui-image"
            :src="characterDetailUiUrl"
            :alt="`${selectedRelationshipContact.name} 角色详情UI`"
            decoding="async"
            loading="eager"
          />
          <div class="bp-character-detail-content">
            <div class="bp-character-detail-standee-zone">
              <img
                v-if="selectedRelationshipPortraitUrl !== null"
                class="bp-character-detail-standee"
                :src="selectedRelationshipPortraitUrl"
                :alt="`${selectedRelationshipDisplayName} 全身立绘`"
                decoding="async"
                loading="eager"
              />
            </div>
            <div class="bp-character-detail-status">
              <strong>{{ selectedRelationshipDisplayName }}</strong>
              <span v-if="selectedRelationshipAffiliation !== null">{{ selectedRelationshipAffiliation }}</span>
            </div>
            <div class="bp-character-detail-level-strip">
              <span v-for="item in selectedRelationshipLevelItems" :key="item.label">
                <b>{{ item.label }}</b>
                <strong>{{ item.value }}</strong>
              </span>
            </div>
            <div class="bp-character-detail-stat-grid">
              <section
                v-for="block in selectedRelationshipStatBlocks"
                :key="block.id"
                class="bp-character-detail-stat-block"
                :class="`is-${block.id}`"
              >
                <p v-for="stat in block.stats" :key="stat.label">
                  <span>{{ stat.label }}</span>
                  <strong>{{ stat.value }}</strong>
                </p>
              </section>
            </div>
            <section class="bp-character-detail-skill-panel" aria-label="角色技能">
              <span class="bp-character-detail-skill-kicker">SKILL</span>
              <div class="bp-character-detail-skill-grid" role="list" aria-label="技能列表">
                <button
                  v-for="(skill, index) in selectedRelationshipSkills"
                  :key="`${skill.name}-${index}`"
                  type="button"
                  class="bp-character-detail-skill-option"
                  role="listitem"
                  @click="selectedRelationshipSkillDetailIndex = index"
                >
                  <span>{{ skill.name }}</span>
                </button>
                <p v-if="selectedRelationshipSkills.length === 0" class="bp-character-detail-skill-empty">
                  该角色暂无技能表记录
                </p>
              </div>
              <section
                v-if="selectedRelationshipActiveSkill !== null"
                class="bp-character-detail-skill-detail"
                aria-label="技能详情"
              >
                <button
                  type="button"
                  class="bp-character-detail-skill-detail-close"
                  aria-label="关闭技能详情"
                  @click="selectedRelationshipSkillDetailIndex = null"
                >
                  ×
                </button>
                <strong>{{ selectedRelationshipActiveSkill.name }}</strong>
                <p>{{ selectedRelationshipSkillEffectText }}</p>
                <small
                  v-if="selectedRelationshipSkillDamageText.length > 0"
                  class="bp-character-detail-skill-damage"
                >
                  {{ selectedRelationshipSkillDamageText }}
                </small>
                <dl>
                  <div v-for="item in selectedRelationshipSkillBonusItems" :key="item.label">
                    <dt>{{ item.label }}</dt>
                    <dd>{{ item.value }}</dd>
                  </div>
                </dl>
                <small
                  v-if="selectedRelationshipSkillBonusText.length > 0"
                  class="bp-character-detail-skill-buffs"
                >
                  {{ selectedRelationshipSkillBonusText }}
                </small>
              </section>
            </section>
            <div class="bp-character-detail-actions" aria-label="角色操作">
              <button
                type="button"
                class="bp-character-detail-action-button"
                @click="showCharacterDetailComingSoon('使用道具')"
              >
                使用道具
              </button>
              <button
                type="button"
                class="bp-character-detail-action-button"
                @click="showCharacterDetailComingSoon('誓约')"
              >
                誓约
              </button>
              <button
                type="button"
                class="bp-character-detail-action-button is-primary"
                @click="startRelationshipSexBattle"
              >
                发起性斗
              </button>
            </div>
          </div>
        </section>
      </div>

      <div
        v-if="portraitPreview !== null"
        class="bp-portrait-preview-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="`${portraitPreview.label} 立绘预览`"
        @click.self="closePortraitPreview"
        @keydown.esc.stop.prevent="closePortraitPreview"
        tabindex="-1"
      >
        <div class="bp-portrait-preview-card" tabindex="-1">
          <button
            type="button"
            class="bp-portrait-preview-close"
            aria-label="关闭立绘预览"
            @click="closePortraitPreview"
          >
            关闭
          </button>
          <img
            class="bp-portrait-preview-image"
            :src="portraitPreview.src"
            :alt="`${portraitPreview.label} 512宽立绘预览`"
            decoding="sync"
            loading="eager"
          />
        </div>
      </div>

    </section>
    <section
      v-if="hasParallelEvents"
      :class="['bp-parallel-events-mirror', { 'is-collapsed': isParallelEventsCollapsed }]"
      aria-labelledby="bp-parallel-events-title"
    >
      <!-- BA Style Outer Frame Decorative Elements -->
      <div class="bp-ba-frame-corner top-left"></div>
      <div class="bp-ba-frame-corner top-right"></div>
      <div class="bp-ba-frame-corner bottom-left"></div>
      <div class="bp-ba-frame-corner bottom-right"></div>
      <div class="bp-ba-frame-cross cross-top-left"></div>
      <div class="bp-ba-frame-cross cross-top-right"></div>
      <div class="bp-ba-frame-cross cross-bottom-left"></div>
      <div class="bp-ba-frame-cross cross-bottom-right"></div>

      <button
        type="button"
        class="bp-parallel-events-header"
        :aria-expanded="String(!isParallelEventsCollapsed)"
        aria-controls="bp-parallel-events-list"
        @click="toggleParallelEvents"
      >
        <span class="bp-parallel-events-icon" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span class="bp-parallel-events-heading">
          <span class="bp-parallel-events-kicker">PARALLEL LOG <span class="bp-kicker-dots">........</span></span>
          <span id="bp-parallel-events-title" class="bp-parallel-events-title">并行事件</span>
        </span>
        <span class="bp-parallel-events-count">{{ parallelEvents.length }}</span>
        <span class="bp-parallel-events-toggle" aria-hidden="true"></span>
      </button>

      <div
        v-show="!isParallelEventsCollapsed"
        id="bp-parallel-events-list"
        class="bp-parallel-events-list"
      >
        <article
          v-for="(event, index) in parallelEvents"
          :key="`${event.character}-${index}-${event.description}`"
          class="bp-parallel-event-card"
        >
          <header class="bp-parallel-event-identity">
            <span
              class="bp-parallel-event-avatar"
              :class="{ 'has-image': resolveParallelEventAvatarUrl(event.character) !== null }"
              aria-hidden="true"
            >
              <img
                v-if="resolveParallelEventAvatarUrl(event.character) !== null"
                class="bp-parallel-event-avatar-image"
                :src="resolveParallelEventAvatarUrl(event.character) ?? ''"
                alt=""
                decoding="async"
                loading="lazy"
                @error="handleParallelEventAvatarError"
              />
              <span class="bp-parallel-event-avatar-mark">{{ event.character.slice(0, 1) }}</span>
            </span>
            <span class="bp-parallel-event-persona">
              <span class="bp-parallel-event-name">{{ event.character }}</span>
              <span class="bp-parallel-event-affiliation">{{ resolveParallelEventAffiliation(event.character) }}</span>
            </span>
          </header>
          <p class="bp-parallel-event-description">{{ event.description }}</p>
          <span class="bp-parallel-event-index">SYNC {{ String(index + 1).padStart(2, '0') }}</span>
        </article>
      </div>
    </section>
    <section
      v-if="hasChoiceOptions"
      class="bp-choice-options-mirror"
      aria-labelledby="bp-choice-options-title"
    >
      <header class="bp-choice-options-header">
        <span class="bp-choice-options-kicker">SELECT ROUTE <span class="bp-kicker-dots">........</span></span>
        <h3 id="bp-choice-options-title" class="bp-choice-options-title">行动选项</h3>
      </header>
      <div class="bp-choice-options-grid">
        <article
          v-for="(option, index) in choiceOptions"
          :key="`${option.label}-${index}-${option.text}`"
          :class="['bp-choice-option-card', `is-${getChoiceOptionVariant(index)}`]"
        >
          <img
            class="bp-choice-option-frame"
            :src="getChoiceOptionFrameUrl(index)"
            alt=""
            decoding="async"
            loading="lazy"
          />
          <div class="bp-choice-option-copy">
            <span class="bp-choice-option-label">{{ option.label }}</span>
            <p class="bp-choice-option-text">{{ option.text }}</p>
          </div>
        </article>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import { stripDialogueMapBlocks } from './engine/dialogue-map';
import { splitDialogueSource } from './engine/dialogue-splitter';
import { deriveKnownCharactersForContent } from './engine/known-characters';
import type { DialogueMapEntry, DialogueMood, DialogueSegment, DialogueSource } from './types/narrative';
import { fullbodyPortraitProfiles, getFullbodyPortraitUrl, resolveFullbodyAssetUrl } from './portrait-registry';
import type { FullbodyPortraitProfile } from './portrait-registry';
import { characterBattleStats } from './character-stats';
import type { CharacterBattleStats } from './character-stats';
import { resolveCharacterSkillEntries } from './character-skills';
import type { CharacterSkillEntry } from './character-skills';

type UserPortraitGender = 'male' | 'female';

interface PortraitLayer {
  id: string;
  src: string;
  fallbackUrls: string[];
}

type PortraitPreviewSide = 'user' | 'npc';
type FunctionPageTab = 'manual-sex-battle' | 'pending-one' | 'pending-two';
type MvuMessageOption = { type: 'message'; message_id: number | 'latest' };
type TavernToastKind = 'info' | 'success' | 'warning' | 'error';

interface TavernToastApi {
  info?: (message: string, title?: string) => void;
  success?: (message: string, title?: string) => void;
  warning?: (message: string, title?: string) => void;
  error?: (message: string, title?: string) => void;
}

interface PortraitPreview {
  src: string;
  label: string;
}

interface RelationshipContact {
  name: string;
  affection: number;
  relationType: string;
  faction: string;
  avatarUrl: string | null;
}

interface RelationshipSystemView {
  presentNames: string[];
  contacts: RelationshipContact[];
}

interface ContactFaction {
  name: string;
  contacts: RelationshipContact[];
}

interface CharacterDetailStatItem {
  label: string;
  value: string;
}

interface CharacterDetailStatBlock {
  id: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  stats: CharacterDetailStatItem[];
}

interface CharacterDetailSkillMetaItem {
  label: string;
  value: string;
}

type TavernVariableGlobal = typeof globalThis & {
  Mvu?: {
    getMvuData?: (option: MvuMessageOption) => unknown;
    replaceMvuData?: (data: unknown, option: MvuMessageOption) => unknown | Promise<unknown>;
  };
  waitGlobalInitialized?: (name: string) => unknown | Promise<unknown>;
  getVariables?: (option: MvuMessageOption) => unknown;
  executeSlashCommand?: (command: string) => unknown | Promise<unknown>;
  chat?: Record<string, unknown>;
  character?: Record<string, unknown>;
  toastr?: TavernToastApi;
  $?: unknown;
  jQuery?: unknown;
};

type ContentRendererContext = {
  message_id: number;
  content: string;
  thinking_content: string;
  parallel_events: ParallelEvent[];
  choice_options: ChoiceOption[];
  during_streaming: boolean;
  dialogue_map: DialogueMapEntry[];
  variable_revision: number;
  set_original_content_visible: (visible: boolean) => void;
  set_variable_refresh_needed: (needed: boolean) => void;
};

interface ParallelEvent {
  character: string;
  description: string;
}

interface ChoiceOption {
  label: string;
  text: string;
}

const context = inject<ContentRendererContext>('content_renderer_context');
if (context === undefined) {
  throw Error('[content-chat-renderer] missing content renderer context');
}

const currentIndex = ref(0);
const portraitPreview = ref<PortraitPreview | null>(null);
const isFunctionPageOpen = ref(false);
const isThinkingPageOpen = ref(false);
const isParallelEventsCollapsed = ref(true);
const isNarrativeMinimized = ref(false);
const activeFunctionTab = ref<FunctionPageTab>('manual-sex-battle');
const activeContactFaction = ref<string | null>(null);
const selectedRelationshipContact = ref<RelationshipContact | null>(null);
const selectedRelationshipSkillDetailIndex = ref<number | null>(null);
const preloadedPortraitUrls = new Set<string>();
const STAGED_SEGMENT_LOOKAHEAD = 2;
const MOOD_HOLD_SEGMENTS = 2;
const thinkingContent = computed(() => (context.thinking_content ?? '').trim());
const hasThinkingContent = computed(() => thinkingContent.value.length > 0);
const parallelEvents = computed(() => context.parallel_events ?? []);
const hasParallelEvents = computed(() => parallelEvents.value.length > 0);
const choiceOptions = computed(() => (context.choice_options ?? []).slice(0, 4));
const hasChoiceOptions = computed(() => choiceOptions.value.length > 0);

const MOOD_SUFFIX: Record<DialogueMood, string> = {
  neutral: '',
  happy: '高兴',
  angry: '生气',
  surprised: '惊讶',
};

const ROOT_ASSET_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/';
const frameBackgroundUrl = resolveFullbodyAssetUrl('背景备选.png');
const functionUiUrl = resolveFullbodyAssetUrl('功能UI.png');
const characterDetailUiUrl = resolveRootAssetUrl('角色UI.png');
const fallbackSceneBackgroundUrl = resolveFullbodyAssetUrl('新学校入口.png');
const minimizedAronaUrl = resolveFullbodyAssetUrl('阿洛娜.png');
const aronaOptionFrameUrl = resolveFullbodyAssetUrl('阿洛娜选项.png');
const planaOptionFrameUrl = resolveFullbodyAssetUrl('普拉娜选项.png');
const Q_AVATAR_ASSET_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/Q版/';
const Q_AVATAR_FILE_OVERRIDES: Record<string, string> = {
  '响木天音校服.png': '响木天音.png',
};
const DEFAULT_SCENE_BACKGROUND_FILES = ['新学校入口.png'];
const FALLBACK_STAGE_LOCATION_LABELS = new Set(['初始点', '初始地'].map(normalizeStageLocationName));
const STAGE_LOCATION_BACKGROUND_FILES: Record<string, string[]> = {
  [normalizeStageLocationName('D/C班基础教室')]: ['D_C班基础教室.png'],
  [normalizeStageLocationName('DC班基础教室')]: ['D_C班基础教室.png'],
  [normalizeStageLocationName('A/B班进阶教室')]: ['AB班进阶教室.png'],
  [normalizeStageLocationName('AB班进阶教室')]: ['AB班进阶教室.png'],
  [normalizeStageLocationName('S班特别教室')]: ['S班特别教室.png'],
  [normalizeStageLocationName('S/A班教师办公室')]: [],
  [normalizeStageLocationName('B/C/D班教师办公室')]: [],
  [normalizeStageLocationName('研究会特殊植物栽培区')]: [],
  [normalizeStageLocationName('博览图书馆')]: ['博览图书馆中央大厅.png', '博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('博览图书馆中央大厅')]: ['博览图书馆中央大厅.png', '博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('博览图书馆中央阅览大厅')]: ['博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('体育联盟综合训练场')]: [],
  [normalizeStageLocationName('体育联盟-综合训练场')]: ['体育联盟总部主体育馆.png'],
  [normalizeStageLocationName('体育联盟总部主体育馆')]: ['体育联盟总部主体育馆.png'],
  [normalizeStageLocationName('体育联盟游泳部')]: [],
  [normalizeStageLocationName('天台训练场')]: [],
  [normalizeStageLocationName('体育联盟器械训练部')]: [],
  [normalizeStageLocationName('体育联盟武术部')]: [],
  [normalizeStageLocationName('后山温泉')]: [],
  [normalizeStageLocationName('沙滩排球场')]: ['私人海滩沙滩排球场.png'],
  [normalizeStageLocationName('私人海滩沙滩排球场')]: ['私人海滩沙滩排球场.png'],
  [normalizeStageLocationName('权力之塔瞭望塔')]: [],
  [normalizeStageLocationName('权力之塔-学生会总部')]: ['权力之塔学生会总部.png'],
  [normalizeStageLocationName('权力之塔学生会总部')]: ['权力之塔学生会总部.png'],
  [normalizeStageLocationName('院长办公室')]: [],
  [normalizeStageLocationName('学生会最高监控中心')]: ['权力之塔瞭望塔监控室.png'],
  [normalizeStageLocationName('权力之塔瞭望塔监控室')]: ['权力之塔瞭望塔监控室.png'],
  [normalizeStageLocationName('学生互助联盟秘密集会点')]: [],
  [normalizeStageLocationName('地下联盟秘密通道')]: [],
  [normalizeStageLocationName('地下旧货市场入口')]: [],
  [normalizeStageLocationName('地下旧货跳蚤市场')]: [],
  [normalizeStageLocationName('地下临时交易点')]: [],
  [normalizeStageLocationName('蝶变之所艺术设计社总部')]: [],
  [normalizeStageLocationName('蝶变之所材料实验室')]: [],
  [normalizeStageLocationName('女王宫殿女子自治协会总部')]: [],
  [normalizeStageLocationName('女王宫殿女子自治协会生活区')]: [],
  [normalizeStageLocationName('女王宫殿-女权协会总部')]: ['女王宫殿女权协会总部.png'],
  [normalizeStageLocationName('女王宫殿女权协会总部')]: ['女王宫殿女权协会总部.png'],
  [normalizeStageLocationName('女王宫殿-女权协会生活区')]: ['女权协会生活宿舍豪华单间.png'],
  [normalizeStageLocationName('女权协会生活宿舍豪华单间')]: ['女权协会生活宿舍豪华单间.png'],
  [normalizeStageLocationName('行为反馈研究社总部')]: [],
  [normalizeStageLocationName('行为反馈研究社高安全实验区')]: [],
  [normalizeStageLocationName('外校临时居住地A')]: [],
  [normalizeStageLocationName('外校临时居住地B')]: [],
  [normalizeStageLocationName('学生宿舍A栋')]: ['学生宿舍A栋单人间.png'],
  [normalizeStageLocationName('学生宿舍A栋单人间')]: ['学生宿舍A栋单人间.png'],
  [normalizeStageLocationName('学生宿舍B栋')]: ['学生宿舍B栋单人间.png'],
  [normalizeStageLocationName('学生宿舍B栋单人间')]: ['学生宿舍B栋单人间.png'],
  [normalizeStageLocationName('教职工宿舍')]: [],
  [normalizeStageLocationName('餐厅')]: ['天海学园食堂.png'],
  [normalizeStageLocationName('天海学园食堂')]: ['天海学园食堂.png'],
  [normalizeStageLocationName('中心广场')]: [],
  [normalizeStageLocationName('综合商业街')]: ['综合商业街.png'],
  [normalizeStageLocationName('学院正门')]: [],
  [normalizeStageLocationName('综合竞技场')]: [],
  [normalizeStageLocationName('学院后山')]: [],
  [normalizeStageLocationName('中心湖')]: [],
  [normalizeStageLocationName('综合服务大厅')]: [],
  [normalizeStageLocationName('学校医院')]: [],
  [normalizeStageLocationName('心理健康中心')]: [],
  [normalizeStageLocationName('未分配的社团房间')]: [],
  [normalizeStageLocationName('后山入口')]: [],
  [normalizeStageLocationName('私人海滩')]: [],
  [normalizeStageLocationName('泳装与运动装备租赁店')]: [],
  [normalizeStageLocationName('静心茶室')]: [],
  [normalizeStageLocationName('风铃神社')]: [],
  [normalizeStageLocationName('男性自保联盟秘密集会点')]: ['男性自保联盟秘密集会点.png'],
};

const PORTRAIT_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/对话立绘/';
const PORTRAIT_FILE_PATTERN = /^(?!.*高清版)[^./\\\-~0-9]+(?:高兴|生气|惊讶)?\.png$/;
const AMANE_NAME_PATTERN = /(?:响木)?天音/;
const NARRATIVE_SPEAKER_LABEL_PATTERN =
  /旁白|叙述|系统|提示|说明|补充|备注|注释|小字|文字|标题|规则|选项|状态|环境|地点|时间|画面|镜头|场景|内心|心理|独白|心声|声音|广播|公告|通知|字幕|旁注|前情|总结|信息|面板|日志|内容|下一行|下面|上面|本段/;
const NON_PERSON_SPEAKER_LABEL_PATTERN =
  /^(?:[一二三四五六七八九十0-9]+楼|[一二三四五六七八九十0-9]+层|(?:这|那)(?:个|种|些|套|件|份|张|条|段|句|本)?[\u4e00-\u9fa5]{0,6}|.*(?:制服|校服|裙摆|锁骨|空气|气氛|阳光|地板|窗外|门口|角落|地方|过场|记录|记录表|文件|资料|纸张|走廊|楼道|楼梯|教室|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟))$/;
const UNSAFE_SPEAKER_LABEL_PATTERN =
  /^(?:没有人|没人|无人|没有谁|没有对手|没有值得|没有任何|谁|什么|怎么|这里|那里|这种|那种|这个|那个)|(?:谁敢|没有人|没人|无人|没有任何|没有值得|没有对手|多说一句|特别关注)/;
const LOCATION_LIKE_SPEAKER_LABEL_PATTERN =
  /(?:位置|座位|窗边|门边|门口|角落|中央|中间|前排|后排|左侧|右侧|旁边|附近|尽头|入口|出口|桌旁|桌边|椅子|沙发|讲台|设备柜|教室|走廊|楼道|楼梯|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟)/;
const PRONOUN_ACTION_LABEL_PATTERN =
  /^(?:她|他|它|TA|Ta|ta|我|你).*(?:心里|内心|心中|脑海|默念|心想|想道|想着|低声|轻声|柔声|冷声|厉声|开口|回应|说|问|喊|道|念叨|嘟囔|低语|喃喃|刚才|刚刚|重复|复述|准备|打算|那句|这句|那话|这话|的)$/;
const GENERIC_ACTION_SUBJECT_PATTERN =
  /^(?:这|那|这个|那个|这种|那种|这些|那些|有人|众人|大家|所有人|声音|笑声|话语|目光|空气|气氛|文件|资料|纸张|书页|门|窗|光线|脚步|教室|走廊|楼道|楼梯|制服|校服)$/;
const SPEAKER_LABEL_MAX_LENGTH = 8;
const USER_FULLBODY_PORTRAITS: Record<UserPortraitGender, string> = {
  male: getFullbodyPortraitUrl('男主_黑西装校服_普通学生.png') ?? '',
  female: getFullbodyPortraitUrl('女主.png') ?? '',
};

const contentText = computed(() => stripHiddenBlocks(safeSubstituteMacros(context.content)));
const variableRevision = computed(() => context.variable_revision);
const userAlias = computed(() => uniqueNonEmpty([safeSubstituteMacros('{{user}}'), SillyTavern.name1, '你'])[0] ?? '你');
const userRoleName = computed(() => readUserRoleName(context.message_id));
const userStatus = computed(() => ({ alias: userRoleName.value ?? userAlias.value }));
const userPortraitGender = computed(() => readUserPortraitGender(context.message_id));
const userCharacterProfile = computed(() =>
  userRoleName.value === null ? null : resolveCharacterProfileBySpeakerName(userRoleName.value),
);
const stageTimeLabel = computed(() => readStageTimeLabel(context.message_id));
const stageLocationLabel = computed(() => readStageLocationLabel(context.message_id));
const sceneBackgroundFallbackIndex = ref(0);
const stageSceneBackgroundUrls = computed(() => resolveStageSceneBackgroundUrls(stageLocationLabel.value));
const stageSceneBackgroundUrl = computed(
  () => stageSceneBackgroundUrls.value[sceneBackgroundFallbackIndex.value] ?? fallbackSceneBackgroundUrl,
);
const isStreaming = computed(() => context.during_streaming);

const fallbackNpcLabel = computed(() => {
  const message = getChatMessages(context.message_id)[0];
  return uniqueNonEmpty([message?.name ?? '', safeSubstituteMacros('{{char}}'), SillyTavern.name2])[0] ?? '未识别';
});

const dialogueSource = computed<DialogueSource>(() => ({
  id: `content-message-${context.message_id}`,
  messageId: String(context.message_id),
  content: contentText.value,
  knownCharacters: uniqueNonEmpty([
    ...deriveKnownCharactersForContent(
      contentText.value,
      fallbackNpcLabel.value,
      userStatus.value.alias,
      SillyTavern.name1,
    ),
    ...context.dialogue_map.flatMap(entry => [entry.speaker, entry.focus]),
  ]),
  userAliases: uniqueNonEmpty(['{{user}}', userStatus.value.alias, userRoleName.value, userAlias.value, SillyTavern.name1, '你', '我']),
  dialogueMap: context.dialogue_map,
}));

const splitResult = computed(() => splitDialogueSource(dialogueSource.value));
const segments = computed(() => splitResult.value.segments);
const knownCharacters = computed(() => splitResult.value.knownCharacters);
const npcKnownCharacters = computed(() => knownCharacters.value.filter(name => !isUserRoleSpeakerName(name)));
const relationshipSystemView = computed(() => readRelationshipSystemView(context.message_id));
const presentRelationshipContacts = computed(() =>
  relationshipSystemView.value.presentNames.map(name => {
    return findRelationshipContact(name, relationshipSystemView.value.contacts) ?? createRelationshipContact(name, null);
  }),
);
const knownRelationshipContacts = computed(() =>
  relationshipSystemView.value.contacts.filter(
    contact => !relationshipSystemView.value.presentNames.some(presentName => isSameRelationshipName(contact.name, presentName)),
  ),
);
const contactFactions = computed(() => groupContactsByFaction(knownRelationshipContacts.value));
const selectedContactFaction = computed(() => {
  const activeFaction = activeContactFaction.value;
  if (activeFaction !== null && contactFactions.value.some(faction => faction.name === activeFaction)) {
    return activeFaction;
  }

  return contactFactions.value[0]?.name ?? null;
});
const selectedKnownContacts = computed(
  () => contactFactions.value.find(faction => faction.name === selectedContactFaction.value)?.contacts ?? [],
);
const selectedRelationshipProfile = computed(() => {
  const contact = selectedRelationshipContact.value;
  return contact === null ? null : resolveCharacterProfileBySpeakerName(contact.name);
});
const selectedRelationshipStats = computed(() =>
  selectedRelationshipContact.value === null
    ? null
    : resolveCharacterBattleStats(selectedRelationshipContact.value.name, selectedRelationshipProfile.value),
);
const selectedRelationshipDisplayName = computed(
  () =>
    selectedRelationshipStats.value?.name ??
    selectedRelationshipContact.value?.name ??
    selectedRelationshipProfile.value?.names[0] ??
    '未识别',
);
const selectedRelationshipPortraitUrl = computed(() => selectedRelationshipProfile.value?.portraitUrl ?? null);
const selectedRelationshipAffiliation = computed(() => {
  const candidates = uniqueNonEmpty([
    selectedRelationshipProfile.value?.affiliation,
    selectedRelationshipContact.value?.faction,
    selectedRelationshipStats.value?.faction,
  ]);

  for (const candidate of candidates) {
    const visibleAffiliation = formatCharacterDetailAffiliation(candidate);
    if (visibleAffiliation !== null) {
      return visibleAffiliation;
    }
  }

  return null;
});
const selectedRelationshipLevelItems = computed<CharacterDetailStatItem[]>(() => {
  const stats = selectedRelationshipStats.value;
  return [
    { label: '等级', value: stats === null ? '--' : String(stats.level) },
    { label: '潜力', value: stats === null ? '--' : inferPotentialRank(stats) },
    { label: '性斗力', value: formatDetailNumber(stats?.power) },
  ];
});
const selectedRelationshipStatBlocks = computed<CharacterDetailStatBlock[]>(() => {
  const stats = selectedRelationshipStats.value;
  return [
    {
      id: 'top-left',
      stats: [
        { label: '耐力', value: formatDetailNumber(stats?.endurance) },
        { label: '性斗力', value: formatDetailNumber(stats?.power) },
      ],
    },
    {
      id: 'top-right',
      stats: [
        { label: '快感', value: formatDetailNumber(stats?.pleasure) },
        { label: '忍耐力', value: formatDetailNumber(stats?.resilience) },
      ],
    },
    {
      id: 'bottom-left',
      stats: [
        { label: '魅力', value: formatDetailNumber(stats?.charm) },
        { label: '幸运', value: formatDetailNumber(stats?.luck) },
      ],
    },
    {
      id: 'bottom-right',
      stats: [
        { label: '闪避', value: formatDetailNumber(stats?.evasion) },
        { label: '暴击', value: formatDetailNumber(stats?.critical) },
      ],
    },
  ];
});
const selectedRelationshipSkills = computed<CharacterSkillEntry[]>(() => {
  const contact = selectedRelationshipContact.value;
  if (contact === null) {
    return [];
  }

  const profile = selectedRelationshipProfile.value;
  return resolveCharacterSkillEntries([
    contact.name,
    selectedRelationshipStats.value?.name,
    profile?.fileName.replace(/\.[^.]+$/, ''),
    ...(profile?.names ?? []),
  ]);
});
const selectedRelationshipActiveSkill = computed(
  () =>
    selectedRelationshipSkillDetailIndex.value === null
      ? null
      : selectedRelationshipSkills.value[selectedRelationshipSkillDetailIndex.value] ?? null,
);
const selectedRelationshipSkillEffectText = computed(() => {
  const skill = selectedRelationshipActiveSkill.value;
  if (skill === null) {
    return '';
  }

  return formatSkillEffectText(skill);
});
const selectedRelationshipSkillBonusItems = computed<CharacterDetailSkillMetaItem[]>(() => {
  const skill = selectedRelationshipActiveSkill.value;
  if (skill === null) {
    return [];
  }

  return [
    { label: '类型', value: skill.type },
    { label: '消耗', value: skill.cost },
    { label: '冷却', value: skill.cooldown },
    { label: '命中', value: skill.accuracy },
    { label: '暴击', value: formatSignedSkillValue(skill.critical) },
    { label: '连击', value: skill.combo },
  ].filter(item => item.value.length > 0 && item.value !== '无');
});
const selectedRelationshipSkillDamageText = computed(() => {
  const skill = selectedRelationshipActiveSkill.value;
  if (skill === null || skill.damageFormula.length === 0 || skill.damageFormula === '无直接伤害') {
    return '';
  }

  return `伤害：${skill.damageFormula}`;
});
const selectedRelationshipSkillBonusText = computed(() => {
  const skill = selectedRelationshipActiveSkill.value;
  if (skill === null) {
    return '';
  }

  return skill.buffs.length > 0 && skill.buffs !== '无' ? `状态：${skill.buffs}` : '';
});
const currentSegment = computed(() => segments.value[currentIndex.value] ?? null);
const isAtEnd = computed(() => segments.value.length > 0 && currentIndex.value >= segments.value.length - 1);

const previewSegments = computed(() => {
  const start = Math.max(0, currentIndex.value - 1);
  const end = Math.min(segments.value.length, start + 3);
  return segments.value.slice(start, end);
});

const stagedUserSegment = computed(() =>
  findStagedSegment(segments.value, currentIndex.value, 'user', { allowLookahead: !isStreaming.value }),
);
const stagedNpcSegment = computed(() =>
  findStagedSegment(segments.value, currentIndex.value, 'npc', { allowLookahead: !isStreaming.value }),
);
const stagedUserMoodSegment = computed(() =>
  findMoodSegment(segments.value, currentIndex.value, 'user', { allowLookahead: !isStreaming.value }),
);
const stagedNpcMoodSegment = computed(() =>
  findMoodSegment(segments.value, currentIndex.value, 'npc', { allowLookahead: !isStreaming.value }),
);

const activeNpcLabel = computed(() => {
  if (
    currentSegment.value?.kind === 'npc' &&
    currentSegment.value.speaker !== null &&
    !isUserRoleSpeakerName(currentSegment.value.speaker)
  ) {
    return currentSegment.value.speaker;
  }

  return null;
});

const focusNpcLabel = computed(() => {
  const activePortraitSpeaker = getNpcPortraitSpeakerFromSegment(currentSegment.value);
  if (activePortraitSpeaker !== null) {
    return activePortraitSpeaker;
  }

  return findPreviousNpcPortraitSpeaker(segments.value, currentIndex.value);
});

const isCurrentUserSpeaking = computed(
  () => currentSegment.value?.kind === 'user' && currentSegment.value.speaker !== null && isExplicitSpeechSegment(currentSegment.value),
);
const isCurrentNpcSpeaking = computed(() => activeNpcLabel.value !== null);

const activeSpeakerName = computed(() => {
  if (currentSegment.value === null) {
    return null;
  }

  if (currentSegment.value?.kind === 'user' && currentSegment.value.speaker !== null) {
    return userStatus.value.alias;
  }

  if (currentSegment.value?.kind === 'npc' && activeNpcLabel.value !== null) {
    return activeNpcLabel.value;
  }

  return '旁白';
});

const portraitNpcLabel = computed(() => {
  return focusNpcLabel.value;
});

const fallbackUserPortraitUrl = computed(() => USER_FULLBODY_PORTRAITS[userPortraitGender.value]);

const activeUserMood = computed<DialogueMood>(() => {
  if (currentSegment.value?.kind !== 'user') {
    return 'neutral';
  }

  if (stagedUserMoodSegment.value === null) {
    return 'neutral';
  }

  return getSegmentMood(stagedUserMoodSegment.value);
});

const activeNpcMood = computed<DialogueMood>(() => {
  if (currentSegment.value?.kind !== 'npc') {
    return 'neutral';
  }

  if (stagedNpcMoodSegment.value === null) {
    return 'neutral';
  }

  return getSegmentMood(stagedNpcMoodSegment.value);
});

const userPortraitUrl = computed(() => resolveUserPortraitUrl(activeUserMood.value));
const shouldUseCurrentTextForNpcPortrait = computed(() => {
  if (currentSegment.value?.kind !== 'npc') {
    return false;
  }

  return !isStreaming.value || currentSegment.value.speaker !== null;
});

const npcPortraitContext = computed(() =>
  uniqueNonEmpty([
    shouldUseCurrentTextForNpcPortrait.value ? portraitNpcLabel.value : null,
    shouldUseCurrentTextForNpcPortrait.value ? currentSegment.value?.text : null,
  ]).join('\n'),
);

const npcPortraitUrl = computed(() =>
  portraitNpcLabel.value === null ? null : resolveNpcPortraitUrl(portraitNpcLabel.value, activeNpcMood.value, npcPortraitContext.value),
);

const activeSpeakerAffiliation = computed(() => {
  if (currentSegment.value === null || activeSpeakerName.value === '旁白') {
    return null;
  }

  if (currentSegment.value?.kind === 'user' && currentSegment.value.speaker !== null) {
    return formatVisibleAffiliation(userCharacterProfile.value?.affiliation ?? null);
  }

  if (currentSegment.value?.kind === 'npc' && activeNpcLabel.value !== null) {
    return formatVisibleAffiliation(resolveCharacterProfileBySpeakerName(activeNpcLabel.value)?.affiliation ?? null);
  }

  if (currentSegment.value?.kind !== 'npc') {
    return null;
  }

  return null;
});

const userPortraitLayers = computed(() => {
  const layers = new Map<string, PortraitLayer>();

  function addLayer(mood: DialogueMood) {
    const src = resolveUserPortraitUrl(mood);
    layers.set(src, createPortraitLayer(`user:${userPortraitGender.value}`, src, createUserFallbackUrls(mood)));
  }

  addLayer('neutral');
  if (isStreaming.value) {
    addLayer(activeUserMood.value);
    return Array.from(layers.values());
  }

  for (const segment of segments.value) {
    if (segment.kind === 'user') {
      addLayer(getSegmentMood(segment));
    }
  }
  addLayer(activeUserMood.value);

  return Array.from(layers.values());
});

const npcPortraitLayers = computed(() => {
  const layers = new Map<string, PortraitLayer>();

  function addLayer(speakerName: string, mood: DialogueMood, contextText: string) {
    if (isUserRoleSpeakerName(speakerName)) {
      return;
    }

    const src = resolveNpcPortraitUrl(speakerName, mood, contextText);
    if (src === null) {
      return;
    }

    layers.set(src, createPortraitLayer(`npc:${src}`, src, createNpcFallbackUrls(speakerName, mood, contextText)));
  }

  for (const characterName of npcKnownCharacters.value) {
    addLayer(characterName, 'neutral', '');
  }

  if (isStreaming.value) {
    if (portraitNpcLabel.value !== null) {
      addLayer(portraitNpcLabel.value, activeNpcMood.value, npcPortraitContext.value);
    }
    return Array.from(layers.values());
  }

  for (const segment of segments.value) {
    if (segment.kind !== 'npc') {
      if (segment.focusSpeaker !== null && segment.focusSpeaker !== undefined && !isUserRoleSpeakerName(segment.focusSpeaker)) {
        addLayer(segment.focusSpeaker, getSegmentMood(segment), segment.text);
      }
      continue;
    }

    const speakerName = segment.speaker;
    if (speakerName === null) {
      continue;
    }

    addLayer(speakerName, 'neutral', segment.text);
    addLayer(speakerName, getSegmentMood(segment), segment.text);
  }

  if (portraitNpcLabel.value !== null) {
    addLayer(portraitNpcLabel.value, activeNpcMood.value, npcPortraitContext.value);
  }

  return Array.from(layers.values());
});

watch(
  () => splitResult.value.sourceContentHash,
  () => {
    currentIndex.value = Math.min(currentIndex.value, Math.max(segments.value.length - 1, 0));
  },
);

watch(
  [userPortraitLayers, npcPortraitLayers],
  ([userLayers, npcLayers]) => {
    preloadPortraitUrls([...userLayers, ...npcLayers].flatMap(layer => [layer.src, ...layer.fallbackUrls]));
  },
  { immediate: true },
);

watch(selectedRelationshipContact, () => {
  selectedRelationshipSkillDetailIndex.value = null;
});

watch(
  selectedRelationshipSkills,
  skills => {
    if (
      selectedRelationshipSkillDetailIndex.value !== null &&
      selectedRelationshipSkillDetailIndex.value >= skills.length
    ) {
      selectedRelationshipSkillDetailIndex.value = null;
    }
  },
  { immediate: true },
);

watch(stageLocationLabel, locationLabel => {
  sceneBackgroundFallbackIndex.value = 0;
  context.set_variable_refresh_needed(locationLabel === '地点未同步');
}, { immediate: true });

watch(
  portraitPreview,
  (preview, previous) => {
    if (preview !== null && previous === null) {
      window.addEventListener('keydown', handlePortraitPreviewKeydown);
    } else if (preview === null && previous !== null) {
      window.removeEventListener('keydown', handlePortraitPreviewKeydown);
    }
  },
);

watch(
  isFunctionPageOpen,
  (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      window.addEventListener('keydown', handleFunctionPageKeydown);
    } else if (!isOpen && wasOpen) {
      window.removeEventListener('keydown', handleFunctionPageKeydown);
    }
  },
);

watch(
  isThinkingPageOpen,
  (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      window.addEventListener('keydown', handleThinkingPageKeydown);
    } else if (!isOpen && wasOpen) {
      window.removeEventListener('keydown', handleThinkingPageKeydown);
    }
  },
);

onBeforeUnmount(() => {
  context.set_original_content_visible(false);
  context.set_variable_refresh_needed(false);
  window.removeEventListener('keydown', handlePortraitPreviewKeydown);
  window.removeEventListener('keydown', handleFunctionPageKeydown);
  window.removeEventListener('keydown', handleThinkingPageKeydown);
});

function minimizeNarrative() {
  portraitPreview.value = null;
  isFunctionPageOpen.value = false;
  isThinkingPageOpen.value = false;
  selectedRelationshipContact.value = null;
  isNarrativeMinimized.value = true;
  context.set_original_content_visible(true);
}

function restoreNarrative() {
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
}

function openFunctionPage() {
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
  portraitPreview.value = null;
  isThinkingPageOpen.value = false;
  isFunctionPageOpen.value = true;
}

function closeFunctionPage() {
  isFunctionPageOpen.value = false;
  selectedRelationshipContact.value = null;
}

function openThinkingPage() {
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
  portraitPreview.value = null;
  selectedRelationshipContact.value = null;
  isFunctionPageOpen.value = false;
  isThinkingPageOpen.value = true;
}

function closeThinkingPage() {
  isThinkingPageOpen.value = false;
}

function toggleParallelEvents() {
  isParallelEventsCollapsed.value = !isParallelEventsCollapsed.value;
}

function setFunctionTab(tab: FunctionPageTab) {
  activeFunctionTab.value = tab;
  selectedRelationshipContact.value = null;
}

function openRelationshipContactPage(contact: RelationshipContact) {
  selectedRelationshipContact.value = contact;
}

function closeRelationshipContactPage() {
  selectedRelationshipContact.value = null;
}

function showCharacterDetailComingSoon(featureLabel: string) {
  showTavernNotice(`${featureLabel}功能敬请期待。`, '敬请期待', 'info');
}

async function startRelationshipSexBattle() {
  const enemyName = uniqueNonEmpty([
    selectedRelationshipStats.value?.name,
    selectedRelationshipContact.value?.name,
    selectedRelationshipDisplayName.value,
  ])[0];

  if (enemyName === undefined) {
    showTavernNotice('未读取到可作为对手的角色名称。', '发起性斗失败', 'warning');
    return;
  }

  try {
    await writeLatestCombatEnemyName(enemyName);
    const isSent = sendFightMessageAsCharacter();
    if (!isSent) {
      showTavernNotice('已写入对手名称，但没有找到可用的发送入口。', '发起性斗失败', 'warning');
      return;
    }

    selectedRelationshipContact.value = null;
    isFunctionPageOpen.value = false;
    showTavernNotice(`已将对手设置为 ${enemyName}，正在发起性斗。`, '发起性斗', 'success');
  } catch (error) {
    console.error('[正文前端] 发起性斗失败:', error);
    showTavernNotice('无法写入性斗系统对手名称，请确认 MVU 已初始化。', '发起性斗失败', 'error');
  }
}

function handleFunctionPageKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (selectedRelationshipContact.value !== null) {
      closeRelationshipContactPage();
      return;
    }

    closeFunctionPage();
  }
}

function handleThinkingPageKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeThinkingPage();
  }
}

function openPortraitPreview(side: PortraitPreviewSide) {
  const src = side === 'user' ? userPortraitUrl.value : npcPortraitUrl.value;
  const label = side === 'user' ? userStatus.value.alias : portraitNpcLabel.value ?? '角色';
  if (src === null || src.length === 0) {
    return;
  }

  portraitPreview.value = { src, label };
}

function closePortraitPreview() {
  portraitPreview.value = null;
}

function handlePortraitPreviewKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePortraitPreview();
  }
}

function safeSubstituteMacros(text: string) {
  try {
    return substitudeMacros(text);
  } catch (error) {
    console.warn('[content-chat-renderer] macro substitution failed', error);
    return text;
  }
}

const HIDDEN_CONTENT_BLOCK_TAGS = new Set([
  'analysis',
  'draft',
  'generate_image',
  'image',
  'image_prompt',
  'img',
  'nai',
  'novelai',
  'option',
  'prompt',
  'prompts',
  'reasoning',
  'redacted_reasoning',
  'scratchpad',
  'sd',
  'stable_diffusion',
  'style',
  'sum',
  'think',
  'thinking',
  'updatevariable',
]);

function stripKnownControlTagBlocks(text: string) {
  let result = text;
  let previous = '';
  const pairedTagPattern = /<([A-Za-z][\w:-]*)(?:\s+[^>]*)?>[\s\S]*?<\/\1>/gi;

  while (result !== previous) {
    previous = result;
    result = result.replace(pairedTagPattern, (match, tagName: string) =>
      HIDDEN_CONTENT_BLOCK_TAGS.has(tagName.toLowerCase()) ? '' : match,
    );
  }

  return result;
}

function stripAngleControlTags(text: string) {
  const withoutKnownBlocks = stripKnownControlTagBlocks(
    text
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<think\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi, '')
      .replace(/<redacted_reasoning\b[^>]*>[\s\S]*?<\/think>/gi, '')
      .replace(/<redacted_reasoning\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi, ''),
  );

  return withoutKnownBlocks
    .replace(/<![^>\n]*>/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '');
}

function stripHiddenBlocks(text: string) {
  return stripAngleControlTags(
    stripDialogueMapBlocks(text).replace(
      /(?:^|\n)[^\n]*(?:画图提示词|绘图提示词|文生图提示词|图像提示词|image prompt)[^\n]*(?=\n\s*<image\b)/gi,
      '\n',
    ),
  )
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '')
    .replace(/^\s*<[^>\n]+>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isNonPersonSpeakerLabel(label: string) {
  const normalizedLabel = label.trim();
  return (
    NARRATIVE_SPEAKER_LABEL_PATTERN.test(normalizedLabel) ||
    UNSAFE_SPEAKER_LABEL_PATTERN.test(normalizedLabel) ||
    NON_PERSON_SPEAKER_LABEL_PATTERN.test(normalizedLabel) ||
    GENERIC_ACTION_SUBJECT_PATTERN.test(normalizedLabel) ||
    LOCATION_LIKE_SPEAKER_LABEL_PATTERN.test(normalizedLabel)
  );
}

function isPlausibleSpeakerLabel(label: string) {
  const normalizedLabel = label.trim();
  if (normalizedLabel.length === 0 || normalizedLabel.length > SPEAKER_LABEL_MAX_LENGTH) {
    return false;
  }

  if (isNonPersonSpeakerLabel(normalizedLabel)) {
    return false;
  }

  if (PRONOUN_ACTION_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  return !/[，,。！？!?；;、]/.test(normalizedLabel);
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalizedValue = value?.trim() ?? '';
    if (normalizedValue.length === 0 || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    result.push(normalizedValue);
  }

  return result;
}

function formatVisibleAffiliation(affiliation: string | null | undefined) {
  const normalizedAffiliation = affiliation?.trim() ?? '';
  return normalizedAffiliation.length === 0 || normalizedAffiliation === '独立' ? null : normalizedAffiliation;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function unwrapMvuValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function readPath(source: unknown, path: string[]) {
  let current = source;

  for (const key of path) {
    const record = asRecord(unwrapMvuValue(current));
    if (record === null || !(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  return unwrapMvuValue(current);
}

function readMvuData(messageId: number | 'latest') {
  try {
    const tavernGlobal = globalThis as TavernVariableGlobal;
    return tavernGlobal.Mvu?.getMvuData?.({ type: 'message', message_id: messageId }) ?? null;
  } catch {
    return null;
  }
}

function readVariables(messageId: number | 'latest') {
  try {
    const tavernGlobal = globalThis as TavernVariableGlobal;
    return tavernGlobal.getVariables?.({ type: 'message', message_id: messageId }) ?? null;
  } catch {
    return null;
  }
}

function getTavernRuntimeCandidates() {
  const candidates: TavernVariableGlobal[] = [globalThis as TavernVariableGlobal];
  try {
    if (typeof window !== 'undefined' && window.parent !== window) {
      candidates.push(window.parent as unknown as TavernVariableGlobal);
    }
  } catch {
    // Cross-frame access may be blocked in some preview containers.
  }

  return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
}

async function writeLatestCombatEnemyName(enemyName: string) {
  const latestMessageOption: MvuMessageOption = { type: 'message', message_id: 'latest' };

  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      if (typeof runtime.waitGlobalInitialized === 'function') {
        await runtime.waitGlobalInitialized('Mvu');
      }
    } catch {
      // Continue with direct MVU probing below.
    }

    if (typeof runtime.Mvu?.getMvuData !== 'function' || typeof runtime.Mvu.replaceMvuData !== 'function') {
      continue;
    }

    const mvuData = runtime.Mvu.getMvuData(latestMessageOption);
    const mvuRecord = asRecord(mvuData);
    if (mvuRecord === null) {
      continue;
    }

    let statData = asRecord(mvuRecord.stat_data);
    if (statData === null) {
      mvuRecord.stat_data = {};
      statData = asRecord(mvuRecord.stat_data);
    }

    if (statData === null) {
      continue;
    }

    setRecordPath(statData, ['性斗系统', '对手名称'], enemyName);
    await runtime.Mvu.replaceMvuData(mvuData, latestMessageOption);
    return;
  }

  throw Error('MVU replaceMvuData is unavailable');
}

function setRecordPath(target: Record<string, unknown>, path: string[], value: unknown) {
  let current = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const next = asRecord(current[key]);
    if (next === null) {
      current[key] = {};
      current = current[key] as Record<string, unknown>;
      continue;
    }

    current = next;
  }

  current[path[path.length - 1]] = value;
}

function sendFightMessageAsCharacter() {
  const runtime = getTavernRuntimeCandidates().find(
    candidate =>
      typeof candidate.executeSlashCommand === 'function' ||
      typeof candidate.$ === 'function' ||
      typeof candidate.jQuery === 'function' ||
      typeof candidate.document?.querySelector === 'function',
  );
  if (runtime === undefined) {
    return false;
  }

  const character = readCurrentCharacterInfo(runtime);
  const command = [
    `/sendas name="${escapeSlashCommandValue(character.name)}"`,
    character.avatar.length > 0 ? `avatar="${escapeSlashCommandValue(character.avatar)}"` : '',
    '<fight>',
  ]
    .filter(part => part.length > 0)
    .join(' ');

  if (typeof runtime.executeSlashCommand === 'function') {
    void runtime.executeSlashCommand(command);
    return true;
  }

  return sendCommandThroughInput(runtime, command);
}

function readCurrentCharacterInfo(runtime: TavernVariableGlobal) {
  const chat = asRecord(runtime.chat);
  const characterList = Array.isArray(chat?.characters) ? chat.characters : [];
  const firstCharacter = asRecord(characterList[0]);
  const chatCharacter = asRecord(chat?.character);
  const globalCharacter = asRecord(runtime.character);
  const lastMessage = Array.isArray(chat?.messages) ? asRecord(chat.messages[chat.messages.length - 1]) : null;
  const fallbackMessageName =
    lastMessage !== null && lastMessage.is_user !== true ? String(lastMessage.name ?? '').trim() : '';

  return {
    name:
      String(firstCharacter?.name ?? firstCharacter?.title ?? '').trim() ||
      String(chatCharacter?.name ?? chatCharacter?.title ?? '').trim() ||
      String(globalCharacter?.name ?? globalCharacter?.title ?? '').trim() ||
      fallbackMessageName ||
      fallbackNpcLabel.value,
    avatar:
      String(firstCharacter?.avatar ?? '').trim() ||
      String(chatCharacter?.avatar ?? '').trim() ||
      String(globalCharacter?.avatar ?? '').trim() ||
      String(lastMessage?.avatar ?? '').trim(),
  };
}

function sendCommandThroughInput(runtime: TavernVariableGlobal, command: string) {
  const inputSelectors = [
    '#send_textarea',
    'textarea[name="send_textarea"]',
    '.send_textarea',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="消息"]',
    '.chat-input textarea',
    '#chat-input textarea',
  ];
  const sendButtonSelectors = [
    '#send_but',
    'button[type="submit"]',
    '.send-button',
    'button.send',
    '[data-send-button]',
    'button[aria-label*="Send"]',
    'button[aria-label*="发送"]',
  ];
  const query = typeof runtime.$ === 'function' ? runtime.$ : typeof runtime.jQuery === 'function' ? runtime.jQuery : null;

  if (query !== null) {
    for (const selector of inputSelectors) {
      const input = query(selector);
      if (input?.length > 0) {
        input.val(command);
        input.trigger('input');
        input.trigger('change');
        setTimeout(() => {
          for (const sendSelector of sendButtonSelectors) {
            const sendButton = query(sendSelector);
            if (sendButton?.length > 0 && !sendButton.prop?.('disabled')) {
              sendButton.trigger('click');
              return;
            }
          }
        }, 50);
        return true;
      }
    }
  }

  const documentRef = runtime.document ?? document;
  const input = inputSelectors
    .map(selector => documentRef.querySelector(selector))
    .find((element): element is HTMLTextAreaElement | HTMLInputElement => element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement);
  if (input === undefined) {
    return false;
  }

  input.value = command;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  setTimeout(() => {
    const sendButton = sendButtonSelectors
      .map(selector => documentRef.querySelector(selector))
      .find((element): element is HTMLButtonElement => element instanceof HTMLButtonElement && !element.disabled);
    sendButton?.click();
  }, 50);
  return true;
}

function escapeSlashCommandValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function showTavernNotice(message: string, title: string, kind: TavernToastKind) {
  for (const runtime of getTavernRuntimeCandidates()) {
    const notify = runtime.toastr?.[kind];
    if (typeof notify === 'function') {
      notify.call(runtime.toastr, message, title);
      return;
    }
  }

  window.alert(`${title}\n${message}`);
}

function readVariableSnapshots(messageId: number) {
  void variableRevision.value;

  return [
    readMvuData(messageId),
    readVariables(messageId),
    readMvuData('latest'),
    readVariables('latest'),
    readMvuData(0),
    readVariables(0),
  ];
}

function readRelationshipSystemView(messageId: number): RelationshipSystemView {
  for (const snapshot of readVariableSnapshots(messageId)) {
    const relationshipSystem =
      asRecord(readPath(snapshot, ['stat_data', '关系系统'])) ?? asRecord(readPath(snapshot, ['关系系统']));
    if (relationshipSystem === null) {
      continue;
    }

    const presentNames = normalizeRelationshipNameList(relationshipSystem['在场人物']);
    const contacts: RelationshipContact[] = [];

    for (const [name, value] of Object.entries(relationshipSystem)) {
      if (name === '在场人物') {
        continue;
      }

      const source = asRecord(unwrapMvuValue(value));
      if (source === null) {
        continue;
      }

      contacts.push(createRelationshipContact(name, source));
    }

    if (presentNames.length > 0 || contacts.length > 0) {
      return { presentNames, contacts };
    }
  }

  return { presentNames: [], contacts: [] };
}

function normalizeRelationshipNameList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueNonEmpty(value.map(item => normalizeRelationshipText(item)));
}

function createRelationshipContact(name: string, source: Record<string, unknown> | null): RelationshipContact {
  return {
    name,
    affection: normalizeRelationshipNumber(source?.['好感度']),
    relationType: normalizeRelationshipText(source?.['关系类型']) || '陌生人',
    faction: resolveRelationshipFaction(name, source),
    avatarUrl: resolveRelationshipAvatarUrl(name),
  };
}

function findRelationshipContact(name: string, contacts: RelationshipContact[]) {
  return contacts.find(contact => isSameRelationshipName(contact.name, name)) ?? null;
}

function isSameRelationshipName(left: string, right: string) {
  const normalizedLeft = normalizeCharacterLookupText(left);
  const normalizedRight = normalizeCharacterLookupText(right);
  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return false;
  }

  return normalizedLeft === normalizedRight || matchesSpeakerNameAlias(left, right) || matchesSpeakerNameAlias(right, left);
}

function groupContactsByFaction(contacts: RelationshipContact[]): ContactFaction[] {
  const groups = new Map<string, RelationshipContact[]>();

  for (const contact of contacts) {
    const faction = contact.faction || '未分组';
    groups.set(faction, [...(groups.get(faction) ?? []), contact]);
  }

  return Array.from(groups.entries())
    .map(([name, factionContacts]) => ({
      name,
      contacts: [...factionContacts].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN')),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));
}

function resolveRelationshipFaction(name: string, source: Record<string, unknown> | null) {
  const explicitFaction = uniqueNonEmpty([
    normalizeRelationshipText(source?.['阵营']),
    normalizeRelationshipText(source?.['所属阵营']),
    normalizeRelationshipText(source?.['所属势力']),
    normalizeRelationshipText(source?.['势力']),
    normalizeRelationshipText(source?.['所属']),
  ])[0];
  if (explicitFaction !== undefined) {
    return explicitFaction;
  }

  return resolveCharacterProfileBySpeakerName(name)?.affiliation?.trim() || '未分组';
}

function resolveRelationshipAvatarUrl(name: string) {
  const profile = resolveCharacterProfileBySpeakerName(name);
  if (profile === null) {
    return null;
  }

  return resolveQAvatarAssetUrl(Q_AVATAR_FILE_OVERRIDES[profile.fileName] ?? profile.fileName);
}

function resolveCharacterBattleStats(name: string, profile: FullbodyPortraitProfile | null): CharacterBattleStats | null {
  const profileFileName = profile?.fileName.replace(/\.[^.]+$/, '');
  const candidates = uniqueNonEmpty([name, profileFileName, ...(profile?.names ?? [])]);

  return (
    characterBattleStats.find(stats => candidates.some(candidate => matchesSpeakerNameAlias(stats.name, candidate))) ?? null
  );
}

function resolveParallelEventAffiliation(characterName: string) {
  const profile = resolveCharacterProfileBySpeakerName(characterName);
  return resolveCharacterBattleStats(characterName, profile)?.faction ?? profile?.affiliation?.trim() ?? '未登记归属';
}

function resolveParallelEventAvatarUrl(characterName: string) {
  return resolveRelationshipAvatarUrl(characterName);
}

function getChoiceOptionVariant(index: number) {
  return index % 2 === 0 ? 'arona' : 'plana';
}

function getChoiceOptionFrameUrl(index: number) {
  return getChoiceOptionVariant(index) === 'arona' ? aronaOptionFrameUrl : planaOptionFrameUrl;
}

function inferPotentialRank(stats: CharacterBattleStats) {
  const peakStat = Math.max(stats.power, stats.resilience, stats.charm, stats.luck);
  if (stats.level >= 95 || peakStat >= 950) {
    return 'SSS';
  }
  if (stats.level >= 85 || peakStat >= 850) {
    return 'SS';
  }
  if (stats.level >= 75 || peakStat >= 700) {
    return 'S';
  }
  if (stats.level >= 60 || peakStat >= 550) {
    return 'A';
  }
  if (stats.level >= 45 || peakStat >= 400) {
    return 'B';
  }
  if (stats.level >= 30 || peakStat >= 250) {
    return 'C';
  }
  return 'D';
}

function formatDetailNumber(value: number | null | undefined) {
  return value === null || value === undefined ? '--' : value.toLocaleString('zh-CN');
}

function formatSkillEffectText(skill: CharacterSkillEntry) {
  if (skill.effect.length > 0 && skill.effect !== '无') {
    return skill.effect;
  }

  if (skill.damageFormula.length > 0 && skill.damageFormula !== '无直接伤害') {
    return `伤害公式：${skill.damageFormula}`;
  }

  return '该技能没有直接伤害，主要依靠状态、控制或辅助效果。';
}

function formatSignedSkillValue(value: string) {
  const normalizedValue = value.trim();
  if (normalizedValue.length === 0 || normalizedValue === '无') {
    return normalizedValue;
  }

  return /^[+-]/.test(normalizedValue) ? normalizedValue : `+${normalizedValue}`;
}

function formatCharacterDetailAffiliation(affiliation: string | null | undefined) {
  const normalizedAffiliation = affiliation?.trim() ?? '';
  if (
    normalizedAffiliation.length === 0 ||
    normalizedAffiliation === '未分组' ||
    normalizedAffiliation === '独立' ||
    normalizedAffiliation === '独立势力'
  ) {
    return null;
  }

  return normalizedAffiliation;
}

function resolveQAvatarAssetUrl(fileName: string) {
  try {
    return new URL(fileName, Q_AVATAR_ASSET_BASE_URL).href;
  } catch {
    return `${Q_AVATAR_ASSET_BASE_URL}${encodeURIComponent(fileName)}`;
  }
}

function resolveRootAssetUrl(fileName: string) {
  try {
    return new URL(fileName, ROOT_ASSET_BASE_URL).href;
  } catch {
    return `${ROOT_ASSET_BASE_URL}${encodeURIComponent(fileName)}`;
  }
}

function normalizeRelationshipText(value: unknown) {
  return String(unwrapMvuValue(value) ?? '').trim();
}

function normalizeRelationshipNumber(value: unknown) {
  const numericValue = Number(unwrapMvuValue(value) ?? 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

function readFirstPathValue(snapshots: unknown[], paths: string[][]) {
  for (const snapshot of snapshots) {
    for (const path of paths) {
      const value = readPath(snapshot, path);
      if (String(unwrapMvuValue(value) ?? '').trim().length > 0) {
        return value;
      }
    }
  }

  return null;
}

function readPathTextValues(snapshots: unknown[], paths: string[][]) {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const snapshot of snapshots) {
    for (const path of paths) {
      const normalizedValue = String(unwrapMvuValue(readPath(snapshot, path)) ?? '').trim();
      if (normalizedValue.length === 0 || seen.has(normalizedValue)) {
        continue;
      }

      seen.add(normalizedValue);
      values.push(normalizedValue);
    }
  }

  return values;
}

function readStageTimeLabel(messageId: number) {
  const snapshots = readVariableSnapshots(messageId);
  const date = readFirstPathValue(snapshots, [
    ['stat_data', '时间系统', '日期'],
    ['时间系统', '日期'],
  ]);
  const weekday = readFirstPathValue(snapshots, [
    ['stat_data', '时间系统', '星期'],
    ['时间系统', '星期'],
  ]);
  const time = readFirstPathValue(snapshots, [
    ['stat_data', '时间系统', '时间'],
    ['时间系统', '时间'],
  ]);
  const parts = uniqueNonEmpty([formatStageDate(date), formatStageWeekday(weekday), formatStageClock(time)]);

  return parts.length > 0 ? parts.join(' ') : '时间未同步';
}

function readStageLocationLabel(messageId: number) {
  const locationNames = readPathTextValues(readVariableSnapshots(messageId), [
    ['stat_data', '位置系统', '地点名称'],
    ['位置系统', '地点名称'],
    ['stat_data', '位置系统', '当前地点'],
    ['位置系统', '当前地点'],
    ['stat_data', '位置系统', '地点'],
    ['位置系统', '地点'],
    ['stat_data', '位置系统', '当前位置'],
    ['位置系统', '当前位置'],
    ['stat_data', '位置系统', '区域'],
    ['位置系统', '区域'],
    ['stat_data', '位置系统', '当前区域'],
    ['位置系统', '当前区域'],
    ['stat_data', '世界', '当前地点'],
    ['世界', '当前地点'],
    ['stat_data', '地点名称'],
    ['地点名称'],
    ['stat_data', '当前地点'],
    ['当前地点'],
    ['stat_data', '地点'],
    ['地点'],
    ['stat_data', '当前位置'],
    ['当前位置'],
    ['stat_data', '区域'],
    ['区域'],
    ['stat_data', '当前区域'],
    ['当前区域'],
  ]);
  const explicitLocation = locationNames.find(locationName => !isFallbackStageLocationLabel(locationName));

  return explicitLocation ?? '地点未同步';
}

function normalizeStageLocationName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/[／]/g, '/')
    .replace(/[－–—−]/g, '-');
}

function isFallbackStageLocationLabel(locationName: string) {
  return FALLBACK_STAGE_LOCATION_LABELS.has(normalizeStageLocationName(locationName));
}

function resolveStageSceneBackgroundFiles(locationName: string) {
  const normalizedLocationName = normalizeStageLocationName(locationName);
  const directMatch = STAGE_LOCATION_BACKGROUND_FILES[normalizedLocationName];
  if (directMatch !== undefined) {
    return directMatch;
  }

  const fuzzyMatch = Object.entries(STAGE_LOCATION_BACKGROUND_FILES).find(
    ([locationKey]) =>
      normalizedLocationName.includes(locationKey) || (normalizedLocationName.length > 0 && locationKey.includes(normalizedLocationName)),
  );

  return fuzzyMatch?.[1] ?? DEFAULT_SCENE_BACKGROUND_FILES;
}

function resolveStageSceneBackgroundUrls(locationName: string) {
  const fileNames = uniqueNonEmpty([...resolveStageSceneBackgroundFiles(locationName), ...DEFAULT_SCENE_BACKGROUND_FILES]);
  return fileNames.map(fileName => resolveFullbodyAssetUrl(fileName));
}

function formatStageDate(value: unknown) {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  const dateMatch = normalizedValue.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  if (dateMatch === null) {
    return normalizedValue;
  }

  return `${dateMatch[1]}年${Number(dateMatch[2])}月${Number(dateMatch[3])}日`;
}

function formatStageWeekday(value: unknown) {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  const weekdayMap: Record<string, string> = {
    '0': '星期日',
    '1': '星期一',
    '2': '星期二',
    '3': '星期三',
    '4': '星期四',
    '5': '星期五',
    '6': '星期六',
    '7': '星期日',
    日: '星期日',
    天: '星期日',
    一: '星期一',
    二: '星期二',
    三: '星期三',
    四: '星期四',
    五: '星期五',
    六: '星期六',
  };

  return weekdayMap[normalizedValue] ?? normalizedValue.replace(/^周/, '星期');
}

function formatStageClock(value: unknown) {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  const timeMatch = normalizedValue.match(/^(\d{1,2})[:：](\d{1,2})$/);
  if (timeMatch === null) {
    return normalizedValue;
  }

  return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2].padStart(2, '0')}`;
}

function normalizeUserPortraitGender(value: unknown): UserPortraitGender | null {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  if (normalizedValue === '男') {
    return 'male';
  }

  if (normalizedValue === '女') {
    return 'female';
  }

  return null;
}

function readUserPortraitGender(messageId: number): UserPortraitGender {
  const snapshots = readVariableSnapshots(messageId);

  for (const snapshot of snapshots) {
    const gender =
      normalizeUserPortraitGender(readPath(snapshot, ['stat_data', '角色基础', '性别'])) ??
      normalizeUserPortraitGender(readPath(snapshot, ['角色基础', '性别']));
    if (gender !== null) {
      return gender;
    }
  }

  return 'female';
}

function readUserRoleName(messageId: number) {
  const roleName = readFirstPathValue(readVariableSnapshots(messageId), [
    ['stat_data', '角色基础', '_姓名'],
    ['stat_data', '角色基础', '姓名'],
    ['角色基础', '_姓名'],
    ['角色基础', '姓名'],
  ]);
  const normalizedRoleName = String(unwrapMvuValue(roleName) ?? '').trim();

  return normalizedRoleName.length > 0 ? normalizedRoleName : null;
}

function resolvePortraitFile(fileName: string) {
  if (!PORTRAIT_FILE_PATTERN.test(fileName)) {
    return null;
  }

  return encodeURI(`${PORTRAIT_BASE_URL}${fileName}`);
}

function resolveMoodPortrait(characterNames: string[], mood: DialogueMood) {
  const suffix = MOOD_SUFFIX[mood];
  const candidates = characterNames.map(name => name.trim()).filter(name => name.length > 0);

  if (suffix.length > 0) {
    for (const characterName of candidates) {
      const portraitUrl = resolvePortraitFile(`${characterName}${suffix}.png`);
      if (portraitUrl !== null) {
        return portraitUrl;
      }
    }
  }

  for (const characterName of candidates) {
    const portraitUrl = resolvePortraitFile(`${characterName}.png`);
    if (portraitUrl !== null) {
      return portraitUrl;
    }
  }

  return null;
}

function uniqueUrls(urls: Array<string | null>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    if (url === null || seen.has(url)) {
      continue;
    }

    seen.add(url);
    result.push(url);
  }

  return result;
}

function getSegmentMood(segment: DialogueSegment) {
  return segment.moodConfidence >= 0.55 ? segment.mood : 'neutral';
}

function isExplicitSpeechSegment(segment: DialogueSegment) {
  if (segment.speakerSource === 'map' && segment.speaker !== null) {
    return true;
  }

  return segment.id.includes('-quote-') || segment.id.includes('-colon-');
}

function segmentSpeakerLabel(segment: DialogueSegment) {
  if (segment.speaker === null) {
    return '旁白';
  }

  if (segment.kind === 'npc' && !isUserRoleSpeakerName(segment.speaker)) {
    return segment.speaker;
  }

  return isExplicitSpeechSegment(segment) ? segment.speaker : '旁白';
}

function findStagedSegment(
  visibleSegments: DialogueSegment[],
  index: number,
  kind: 'user' | 'npc',
  options: { allowLookahead?: boolean } = {},
) {
  const allowLookahead = options.allowLookahead ?? true;
  const activeSegment = visibleSegments[index];
  if (activeSegment?.kind === kind) {
    return activeSegment;
  }

  if (allowLookahead && activeSegment?.kind === 'narration') {
    const lookaheadEnd = Math.min(visibleSegments.length - 1, index + STAGED_SEGMENT_LOOKAHEAD);
    for (let segmentIndex = index + 1; segmentIndex <= lookaheadEnd; segmentIndex += 1) {
      const segment = visibleSegments[segmentIndex];
      if (segment?.kind === kind) {
        return segment;
      }
    }
  }

  for (let segmentIndex = index - 1; segmentIndex >= 0; segmentIndex -= 1) {
    const segment = visibleSegments[segmentIndex];
    if (segment?.kind === kind) {
      return segment;
    }
  }

  return null;
}

function findMoodSegment(
  visibleSegments: DialogueSegment[],
  index: number,
  kind: 'user' | 'npc',
  options: { allowLookahead?: boolean } = {},
) {
  const allowLookahead = options.allowLookahead ?? true;
  const activeSegment = visibleSegments[index];
  if (activeSegment?.kind === kind) {
    return activeSegment;
  }

  if (allowLookahead && activeSegment?.kind === 'narration') {
    const lookaheadEnd = Math.min(visibleSegments.length - 1, index + STAGED_SEGMENT_LOOKAHEAD);
    for (let segmentIndex = index + 1; segmentIndex <= lookaheadEnd; segmentIndex += 1) {
      const segment = visibleSegments[segmentIndex];
      if (segment?.kind === kind) {
        return segment;
      }
    }
  }

  for (let segmentIndex = index - 1; segmentIndex >= Math.max(0, index - MOOD_HOLD_SEGMENTS); segmentIndex -= 1) {
    const segment = visibleSegments[segmentIndex];
    if (segment?.kind === kind) {
      return segment;
    }
  }

  return null;
}

function findMentionedKnownSpeaker(text: string, speakerNames: string[]) {
  const matches = speakerNames
    .filter(isPlausibleSpeakerLabel)
    .map(speaker => ({ speaker, index: text.indexOf(speaker) }))
    .filter(match => match.index >= 0)
    .sort((left, right) => left.index - right.index || right.speaker.length - left.speaker.length);

  return matches[0]?.speaker ?? null;
}

function getNpcPortraitSpeakerFromSegment(segment: DialogueSegment | null | undefined) {
  if (segment === null || segment === undefined) {
    return null;
  }

  if (segment.focusSpeaker !== null && segment.focusSpeaker !== undefined && !isUserRoleSpeakerName(segment.focusSpeaker)) {
    return segment.focusSpeaker;
  }

  if (segment.kind === 'npc' && segment.speaker !== null && !isUserRoleSpeakerName(segment.speaker)) {
    return segment.speaker;
  }

  return null;
}

function findPreviousNpcPortraitSpeaker(visibleSegments: DialogueSegment[], index: number) {
  for (let segmentIndex = index - 1; segmentIndex >= 0; segmentIndex -= 1) {
    const portraitSpeaker = getNpcPortraitSpeakerFromSegment(visibleSegments[segmentIndex]);
    if (portraitSpeaker !== null) {
      return portraitSpeaker;
    }
  }

  return null;
}

function createPortraitLayer(id: string, src: string, fallbackUrls: string[]): PortraitLayer {
  return {
    id,
    src,
    fallbackUrls: uniqueUrls([src, ...fallbackUrls]),
  };
}

function preloadPortraitUrls(urls: string[]) {
  if (typeof Image === 'undefined') {
    return;
  }

  for (const url of urls) {
    if (url.length === 0 || preloadedPortraitUrls.has(url)) {
      continue;
    }

    preloadedPortraitUrls.add(url);
    const image = new Image();
    image.decoding = 'sync';
    image.loading = 'eager';
    image.src = url;

    if (typeof image.decode === 'function') {
      void image.decode().catch(() => undefined);
    }
  }
}

function resolveUserPortraitUrl(_mood: DialogueMood) {
  return userCharacterProfile.value?.portraitUrl ?? fallbackUserPortraitUrl.value;
}

function createUserFallbackUrls(_mood: DialogueMood) {
  return uniqueUrls([userCharacterProfile.value?.portraitUrl ?? null, fallbackUserPortraitUrl.value]);
}

function normalizeCharacterLookupText(value: string) {
  return value
    .replace(/[{}·・•‧∙･．.]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function matchesSpeakerNameAlias(speakerName: string, alias: string) {
  const normalizedSpeakerName = normalizeCharacterLookupText(speakerName);
  const normalizedAlias = normalizeCharacterLookupText(alias);
  if (normalizedSpeakerName.length === 0 || normalizedAlias.length === 0) {
    return false;
  }

  return normalizedSpeakerName === normalizedAlias || (normalizedAlias.length >= 2 && normalizedSpeakerName.startsWith(normalizedAlias));
}

function isUserRoleSpeakerName(speakerName: string | null | undefined) {
  const normalizedSpeakerName = speakerName?.trim() ?? '';
  if (normalizedSpeakerName.length === 0) {
    return false;
  }

  if (userRoleName.value !== null && matchesSpeakerNameAlias(normalizedSpeakerName, userRoleName.value)) {
    return true;
  }

  return userCharacterProfile.value?.names.some(alias => matchesSpeakerNameAlias(normalizedSpeakerName, alias)) ?? false;
}

function resolveCharacterProfileBySpeakerName(speakerName: string) {
  return (
    fullbodyPortraitProfiles.find(profile => profile.names.some(alias => matchesSpeakerNameAlias(speakerName, alias))) ?? null
  );
}

function resolveSpecialNpcPortraitUrl(speakerName: string) {
  const profile = resolveCharacterProfileBySpeakerName(speakerName);
  if (profile !== null) {
    return profile.portraitUrl;
  }

  const normalizedSpeakerName = speakerName.replace(/[{}]/g, '').trim();
  return AMANE_NAME_PATTERN.test(normalizedSpeakerName) ? getFullbodyPortraitUrl('响木天音校服.png') : null;
}

function resolveNpcNeutralPortraitUrl(speakerName: string) {
  return resolveSpecialNpcPortraitUrl(speakerName);
}

function resolveNpcPortraitUrl(speakerName: string, _mood: DialogueMood, _contextText = '') {
  const specialPortraitUrl = resolveSpecialNpcPortraitUrl(speakerName);
  if (specialPortraitUrl !== null) {
    return specialPortraitUrl;
  }

  return resolveNpcNeutralPortraitUrl(speakerName);
}

function createNpcFallbackUrls(speakerName: string, _mood: DialogueMood, _contextText = '') {
  return uniqueUrls([resolveNpcNeutralPortraitUrl(speakerName)]);
}

function handlePortraitLayerError(event: Event, fallbackUrls: string[]) {
  const image = event.currentTarget as HTMLImageElement | null;
  if (image === null) {
    return;
  }

  const currentFallbackIndex = fallbackUrls.indexOf(image.src);
  const nextFallbackUrl =
    currentFallbackIndex >= 0 ? fallbackUrls[currentFallbackIndex + 1] : fallbackUrls.find(url => url !== image.src);

  if (nextFallbackUrl === undefined || nextFallbackUrl === image.src) {
    return;
  }

  image.src = nextFallbackUrl;
}

function handleRelationshipAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  image?.closest('.bp-manual-battle-avatar')?.classList.add('is-fallback');
}

function handleParallelEventAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  image?.closest('.bp-parallel-event-avatar')?.classList.add('is-fallback');
}

function handleSceneBackgroundError() {
  if (sceneBackgroundFallbackIndex.value >= stageSceneBackgroundUrls.value.length - 1) {
    return;
  }

  sceneBackgroundFallbackIndex.value += 1;
}

function jumpToSegment(segmentId: string) {
  const index = segments.value.findIndex(segment => segment.id === segmentId);
  if (index >= 0) {
    currentIndex.value = index;
  }
}

function advanceNarrative() {
  if (isAtEnd.value || segments.value.length === 0) {
    return;
  }

  currentIndex.value += 1;
}

function retreatNarrative() {
  if (currentIndex.value <= 0 || segments.value.length === 0) {
    return;
  }

  currentIndex.value -= 1;
}

function reverseNarrative() {
  currentIndex.value = 0;
}
</script>
