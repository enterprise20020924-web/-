<template>
  <div ref="rootElement" class="bpm-mobile-stack">
    <main
      :class="[
        'bpm-app-root',
        `is-${currentSegment?.kind ?? 'idle'}`,
        `is-mood-${activeMood}`,
        {
          'has-portrait': npcPortraitUrl !== null && !portraitUnavailable,
          'is-shittim-open': isShittimOpen,
          'is-thinking-open': isThinkingPageOpen,
          'is-chat-mode': narrativeViewMode === 'chat',
        },
      ]"
      tabindex="-1"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    >
      <div class="bpm-atmosphere" aria-hidden="true">
        <span class="bpm-atmosphere-orbit bpm-atmosphere-orbit--one"></span>
        <span class="bpm-atmosphere-orbit bpm-atmosphere-orbit--two"></span>
        <span class="bpm-atmosphere-cross bpm-atmosphere-cross--one"></span>
        <span class="bpm-atmosphere-cross bpm-atmosphere-cross--two"></span>
      </div>

      <header class="bpm-topbar">
        <div class="bpm-brand-lockup">
          <span class="bpm-brand-mark" aria-hidden="true"></span>
          <span class="bpm-brand-copy">
            <strong>AMAMI</strong>
            <small>MOBILE STORY ARCHIVE</small>
          </span>
          <span class="bpm-brand-live" :class="{ 'is-syncing': context.during_streaming }">
            <i aria-hidden="true"></i>
            {{ context.during_streaming ? 'SYNC' : 'LIVE' }}
          </span>
        </div>

        <div class="bpm-topbar-actions">
          <button
            type="button"
            class="bpm-view-toggle"
            :class="{ 'is-chat': narrativeViewMode === 'chat' }"
            :aria-pressed="narrativeViewMode === 'chat'"
            :aria-label="narrativeViewMode === 'chat' ? '切换到 GAL 模式' : '切换到气泡聊天模式'"
            @click="toggleNarrativeViewMode"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5.5 5.5h13v9h-7l-4.5 3v-3H5.5z" />
              <path d="M9 9h6M9 11.8h4" />
            </svg>
            <span>
              <small>VIEW</small>
              <strong>{{ narrativeViewMode === 'chat' ? '气泡' : 'GAL' }}</strong>
            </span>
          </button>
          <button
            type="button"
            class="bpm-shittim-trigger"
            :class="{ 'is-active': isShittimOpen }"
            aria-controls="bpm-shittim-drawer"
            :aria-expanded="isShittimOpen"
            aria-label="打开什亭之匣"
            @click="openShittimDrawer"
          >
            <span class="bpm-shittim-trigger-mark" aria-hidden="true"><i></i></span>
            <span class="bpm-shittim-trigger-copy">
              <small>SHITTIM</small>
              <strong>什亭之匣</strong>
            </span>
            <b>{{ relationshipContactCount }}</b>
          </button>
        </div>
      </header>

      <section v-show="narrativeViewMode === 'gal'" class="bpm-stage" :aria-label="`${portraitSpeakerName}的剧情立绘`">
        <div class="bpm-stage-background" aria-hidden="true">
          <img
            :key="stageSceneBackgroundUrl"
            class="bpm-stage-background-image"
            :src="stageSceneBackgroundUrl"
            alt=""
            decoding="async"
            @error="handleStageSceneBackgroundError"
          />
          <span class="bpm-stage-background-shade"></span>
        </div>

        <div class="bpm-stage-index" aria-hidden="true">
          <span>SCENE</span>
          <strong>{{ paddedCurrentIndex }}</strong>
        </div>

        <button
          type="button"
          :class="['bpm-cot-trigger', { 'is-empty': !hasThinkingContent }]"
          aria-label="打开思维链"
          @click="openThinkingPage"
        >
          <span class="bpm-cot-trigger-mark">COT</span>
          <span class="bpm-cot-trigger-copy">
            <small>TRACE</small>
            <strong>{{ hasThinkingContent ? '已捕获' : '未检出' }}</strong>
          </span>
          <i aria-hidden="true"></i>
        </button>

        <div class="bpm-halo" aria-hidden="true">
          <span></span>
        </div>

        <figure v-if="npcPortraitUrl !== null && !portraitUnavailable" class="bpm-portrait-figure">
          <img
            :key="npcPortraitUrl"
            class="bpm-portrait-image"
            :class="{ 'is-passive': currentSegment?.kind !== 'npc' }"
            :src="npcPortraitUrl"
            :alt="portraitSpeakerName"
            decoding="async"
            @error="portraitUnavailable = true"
          />
        </figure>

        <div v-else class="bpm-portrait-placeholder" aria-hidden="true">
          <span class="bpm-placeholder-halo"></span>
          <span class="bpm-placeholder-head"></span>
          <span class="bpm-placeholder-body"></span>
          <small>PORTRAIT SIGNAL</small>
        </div>

        <div class="bpm-character-chip">
          <span class="bpm-character-chip-kicker">FOCUS</span>
          <strong>{{ portraitSpeakerName }}</strong>
          <small>{{ portraitAffiliation }}</small>
        </div>

        <div class="bpm-stage-context" :aria-label="`${stageLocationLabel}，${stageTimeLabel}`">
          <span class="bpm-stage-context-item is-location">
            <small>LOCATION</small>
            <strong>{{ stageLocationLabel }}</strong>
          </span>
          <i aria-hidden="true"></i>
          <span class="bpm-stage-context-item is-time">
            <small>TIME</small>
            <strong>{{ stageTimeLabel }}</strong>
          </span>
        </div>

        <div class="bpm-stage-scanline" aria-hidden="true"></div>
      </section>

      <section v-show="narrativeViewMode === 'gal'" class="bpm-dialogue-shell" aria-live="polite">
        <div class="bpm-dialogue-accent" aria-hidden="true"></div>

        <div class="bpm-speaker-row">
          <div class="bpm-speaker-badge">
            <span>{{ activeSpeakerName }}</span>
          </div>
          <div class="bpm-speaker-meta">
            <span>{{ activeSpeakerAffiliation }}</span>
            <small>{{ activeMoodLabel }}</small>
          </div>
        </div>

        <div :key="currentSegment?.id ?? 'empty'" class="bpm-dialogue-copy">
          <p v-if="currentSegment !== null">{{ currentSegment.text }}</p>
          <div v-else class="bpm-empty-copy">
            <strong>剧情信号同步中</strong>
            <span>等待可显示的正文段落。</span>
          </div>
        </div>

        <footer class="bpm-dialogue-footer">
          <div class="bpm-progress-copy">
            <span>{{ paddedCurrentIndex }}</span>
            <i></i>
            <span>{{ paddedSegmentCount }}</span>
          </div>

          <div class="bpm-dialogue-actions">
            <button type="button" aria-label="上一段剧情" :disabled="currentIndex <= 0" @click="retreatNarrative">
              <span aria-hidden="true">‹</span>
            </button>
            <button
              class="bpm-next-button"
              type="button"
              :disabled="segments.length === 0"
              :aria-label="isAtEnd ? '重新播放剧情' : '下一段剧情'"
              @click="advanceNarrative"
            >
              <span>{{ isAtEnd ? 'REPLAY' : 'NEXT' }}</span>
              <b aria-hidden="true">›</b>
            </button>
          </div>
        </footer>

        <div class="bpm-progress-rail" aria-hidden="true">
          <span :style="{ inlineSize: `${progressPercent}%` }"></span>
        </div>
      </section>

      <section v-if="narrativeViewMode === 'chat'" class="bpm-chat-stage">
        <div class="bpm-stage-context bpm-chat-stage-context" :aria-label="`${stageLocationLabel}，${stageTimeLabel}`">
          <span class="bpm-stage-context-item is-location">
            <small>LOCATION</small>
            <strong>{{ stageLocationLabel }}</strong>
          </span>
          <i aria-hidden="true"></i>
          <span class="bpm-stage-context-item is-time">
            <small>TIME</small>
            <strong>{{ stageTimeLabel }}</strong>
          </span>
        </div>

        <NarrativeBubbleThread
          :rows="chatRows"
          :active-segment-id="currentSegment?.id ?? null"
          :is-streaming="context.during_streaming"
          :scene-background-url="stageSceneBackgroundUrl"
          layout="mobile"
          @scene-error="handleStageSceneBackgroundError"
        />
      </section>

      <div class="bpm-safe-footer" aria-hidden="true">
        <span>BLUE ARCHIVE MOBILE FRAME</span>
        <i></i>
        <span>EMBED</span>
      </div>

      <Transition name="bpm-shittim">
        <div
          v-if="isShittimOpen"
          class="bpm-shittim-layer"
          role="presentation"
          @click.self="closeShittimDrawer"
          @touchstart.stop
          @touchend.stop
        >
          <section
            id="bpm-shittim-drawer"
            class="bpm-shittim-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bpm-shittim-title"
          >
            <div class="bpm-shittim-handle" aria-hidden="true"></div>
            <header class="bpm-shittim-header">
              <button
                v-if="selectedRelationshipContact !== null"
                type="button"
                class="bpm-shittim-back"
                aria-label="返回联系人列表"
                @click="closeRelationshipContact"
              >
                <span aria-hidden="true">‹</span>
                联系人
              </button>
              <div v-else class="bpm-shittim-title-lockup">
                <span class="bpm-shittim-title-mark" aria-hidden="true"></span>
                <span>
                  <small>SHITTIM CHEST</small>
                  <strong id="bpm-shittim-title">什亭之匣</strong>
                </span>
              </div>
              <button type="button" class="bpm-shittim-close" aria-label="关闭什亭之匣" @click="closeShittimDrawer">
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <template v-if="selectedRelationshipContact === null">
              <nav class="bpm-shittim-tabs" aria-label="什亭之匣功能">
                <button type="button" class="bpm-shittim-tab is-active" aria-current="page">
                  <span><i aria-hidden="true"></i>手动性斗</span>
                  <b>{{ relationshipContactCount }}</b>
                </button>
                <span class="bpm-shittim-pending">MORE MODULES · LOCKED</span>
              </nav>

              <div class="bpm-shittim-content">
                <section class="bpm-contact-section">
                  <header class="bpm-contact-section-head">
                    <span>
                      <small>CURRENT SCENE</small>
                      <strong>当前在场</strong>
                    </span>
                    <b>{{ presentRelationshipContacts.length }}</b>
                  </header>

                  <div v-if="presentRelationshipContacts.length > 0" class="bpm-contact-grid is-present">
                    <button
                      v-for="contact in presentRelationshipContacts"
                      :key="`present-${contact.name}`"
                      type="button"
                      class="bpm-contact-card is-present"
                      @click="openRelationshipContact(contact)"
                    >
                      <span class="bpm-contact-avatar" :class="{ 'has-image': contact.avatarUrl !== null }">
                        <img
                          v-if="contact.avatarUrl !== null"
                          :src="contact.avatarUrl"
                          :alt="`${contact.name} Q版头像`"
                          decoding="async"
                          loading="lazy"
                          @error="handleRelationshipAvatarError"
                        />
                        <span>{{ contact.name.slice(0, 1) }}</span>
                      </span>
                      <span class="bpm-contact-copy">
                        <strong>{{ contact.name }}</strong>
                        <small>{{ contact.relationType }} · {{ contact.affection }}%</small>
                      </span>
                      <b aria-hidden="true">›</b>
                    </button>
                  </div>
                  <p v-else class="bpm-contact-empty">当前楼层没有同步在场人物。</p>
                </section>

                <section class="bpm-contact-section is-archive">
                  <header class="bpm-contact-section-head">
                    <span>
                      <small>CONTACT ARCHIVE</small>
                      <strong>已知联系人</strong>
                    </span>
                    <b>{{ knownRelationshipContacts.length }}</b>
                  </header>

                  <div v-if="contactFactions.length > 0" class="bpm-contact-factions" aria-label="联系人阵营">
                    <button
                      v-for="faction in contactFactions"
                      :key="faction.name"
                      type="button"
                      :class="{ 'is-active': selectedContactFaction === faction.name }"
                      @click="activeContactFaction = faction.name"
                    >
                      <span>{{ faction.name }}</span>
                      <b>{{ faction.contacts.length }}</b>
                    </button>
                  </div>

                  <div v-if="selectedKnownContacts.length > 0" class="bpm-contact-grid">
                    <button
                      v-for="contact in selectedKnownContacts"
                      :key="`known-${contact.name}`"
                      type="button"
                      class="bpm-contact-card"
                      @click="openRelationshipContact(contact)"
                    >
                      <span class="bpm-contact-avatar" :class="{ 'has-image': contact.avatarUrl !== null }">
                        <img
                          v-if="contact.avatarUrl !== null"
                          :src="contact.avatarUrl"
                          :alt="`${contact.name} Q版头像`"
                          decoding="async"
                          loading="lazy"
                          @error="handleRelationshipAvatarError"
                        />
                        <span>{{ contact.name.slice(0, 1) }}</span>
                      </span>
                      <span class="bpm-contact-copy">
                        <strong>{{ contact.name }}</strong>
                        <small>{{ contact.relationType }} · {{ contact.affection }}%</small>
                      </span>
                      <b aria-hidden="true">›</b>
                    </button>
                  </div>
                  <p v-else class="bpm-contact-empty">暂无可显示的已知联系人。</p>
                </section>
              </div>
            </template>

            <section v-else class="bpm-contact-detail" aria-live="polite">
              <div class="bpm-contact-detail-hero">
                <div class="bpm-contact-detail-visual">
                  <span class="bpm-contact-detail-halo" aria-hidden="true"></span>
                  <img
                    v-if="selectedRelationshipPortraitUrl !== null && !selectedPortraitUnavailable"
                    :src="selectedRelationshipPortraitUrl"
                    :alt="`${selectedRelationshipDisplayName} 全身立绘`"
                    decoding="async"
                    loading="eager"
                    @error="selectedPortraitUnavailable = true"
                  />
                  <span v-else class="bpm-contact-detail-fallback">{{
                    selectedRelationshipDisplayName.slice(0, 1)
                  }}</span>
                </div>
                <div class="bpm-contact-detail-identity">
                  <small>CONTACT LINK · ACTIVE</small>
                  <h4>{{ selectedRelationshipDisplayName }}</h4>
                  <p>{{ selectedRelationshipAffiliation }}</p>
                  <div>
                    <span>{{ selectedRelationshipContact.relationType }}</span>
                    <span>好感 {{ selectedRelationshipContact.affection }}</span>
                  </div>
                </div>
              </div>

              <div class="bpm-contact-affection">
                <span
                  ><small>AFFECTION SYNC</small><strong>{{ selectedRelationshipContact.affection }}%</strong></span
                >
                <i><b :style="{ inlineSize: `${selectedRelationshipContact.affection}%` }"></b></i>
              </div>

              <div class="bpm-contact-stat-grid" aria-label="角色性斗属性">
                <span v-for="stat in selectedRelationshipStatItems" :key="stat.label">
                  <small>{{ stat.label }}</small>
                  <strong>{{ stat.value }}</strong>
                </span>
              </div>

              <p class="bpm-contact-note">{{ selectedRelationshipNote }}</p>

              <p v-if="battleLaunchNotice !== null" :class="['bpm-battle-notice', `is-${battleLaunchNotice.kind}`]">
                {{ battleLaunchNotice.text }}
              </p>

              <button
                type="button"
                class="bpm-start-battle"
                :disabled="isStartingBattle"
                @click="startSelectedRelationshipBattle"
              >
                <span>
                  <small>{{ isStartingBattle ? 'LINKING MVU' : 'MANUAL BATTLE' }}</small>
                  <strong>{{ isStartingBattle ? '正在写入系统…' : '发起性斗' }}</strong>
                </span>
                <b aria-hidden="true">›</b>
              </button>
            </section>
          </section>
        </div>
      </Transition>

      <Transition name="bpm-cot-page">
        <div
          v-if="isThinkingPageOpen"
          class="bpm-cot-layer"
          role="presentation"
          @click.self="closeThinkingPage"
          @touchstart.stop
          @touchend.stop
        >
          <section class="bpm-cot-page" role="dialog" aria-modal="true" aria-labelledby="bpm-cot-title">
            <header class="bpm-cot-page-header">
              <button type="button" class="bpm-cot-back" aria-label="关闭思维链" @click="closeThinkingPage">
                <span aria-hidden="true">‹</span>
                返回正文
              </button>
              <div class="bpm-cot-title-lockup">
                <span class="bpm-cot-title-mark" aria-hidden="true">COT</span>
                <span>
                  <small>THINKING TRACE</small>
                  <strong id="bpm-cot-title">思维链档案</strong>
                </span>
              </div>
              <span :class="['bpm-cot-status', { 'is-empty': !hasThinkingContent }]">
                {{ hasThinkingContent ? 'CAPTURED' : 'EMPTY' }}
              </span>
            </header>

            <div class="bpm-cot-page-body" aria-live="polite">
              <div class="bpm-cot-trace-head">
                <span>RAW THINK BLOCK</span>
                <i></i>
                <b>{{ hasThinkingContent ? `${thinkingContent.length} CHARS` : 'NO SIGNAL' }}</b>
              </div>
              <pre v-if="hasThinkingContent" class="bpm-cot-text">{{ thinkingContent }}</pre>
              <div v-else class="bpm-cot-empty">
                <span aria-hidden="true">∅</span>
                <strong>当前楼层没有思维链记录</strong>
                <p>未读取到 &lt;think&gt;、&lt;thinking&gt; 或兼容标签内容。</p>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </main>

    <section
      v-if="!isOverlayOpen && hasChoiceOptions"
      :class="['bpm-support-panel', 'bpm-choice-panel', { 'is-collapsed': isChoicePanelCollapsed }]"
      aria-labelledby="bpm-choice-panel-title"
    >
      <span class="bpm-support-corner is-top-left" aria-hidden="true"></span>
      <span class="bpm-support-corner is-bottom-right" aria-hidden="true"></span>
      <header class="bpm-support-panel-header bpm-choice-panel-header">
        <span class="bpm-support-panel-index" aria-hidden="true">01</span>
        <span class="bpm-support-panel-heading">
          <small>SELECT ROUTE</small>
          <strong id="bpm-choice-panel-title">行动选项</strong>
        </span>
        <span class="bpm-support-panel-actions">
          <span class="bpm-support-panel-count">{{ allChoiceOptions.length }} ROUTES</span>
          <button
            type="button"
            class="bpm-panel-toggle"
            :aria-expanded="!isChoicePanelCollapsed"
            aria-controls="bpm-choice-panel-body"
            @click="isChoicePanelCollapsed = !isChoicePanelCollapsed"
          >
            {{ isChoicePanelCollapsed ? '展开' : '收起' }}
            <span aria-hidden="true">⌄</span>
          </button>
        </span>
      </header>

      <Transition name="bpm-panel-collapse">
        <div v-if="!isChoicePanelCollapsed" id="bpm-choice-panel-body" class="bpm-choice-panel-body">
          <div class="bpm-choice-route-track" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="bpm-choice-grid">
            <button
              v-for="(option, index) in choiceOptions"
              :key="getChoiceOptionKey(option, index)"
              type="button"
              :class="[
                'bpm-choice-card',
                `is-${getChoiceOptionTone(index)}`,
                { 'is-selected': selectedChoiceOptionKey === getChoiceOptionKey(option, index) },
              ]"
              @click="handleChoiceOptionClick(option, index)"
            >
              <span class="bpm-choice-label">{{ option.label }}</span>
              <span class="bpm-choice-copy">
                <small>ROUTE {{ String(index + 1).padStart(2, '0') }}</small>
                <strong>{{ option.text }}</strong>
              </span>
              <span class="bpm-choice-state" aria-hidden="true">
                {{ selectedChoiceOptionKey === getChoiceOptionKey(option, index) ? '✓' : '›' }}
              </span>
            </button>

            <button
              v-if="sexBattleChoiceOption !== null"
              type="button"
              :class="[
                'bpm-choice-card',
                'is-battle',
                {
                  'is-selected':
                    selectedChoiceOptionKey === getChoiceOptionKey(sexBattleChoiceOption, sexBattleChoiceIndex),
                },
              ]"
              :disabled="isLaunchingChoiceBattle"
              @click="handleSexBattleChoiceClick(sexBattleChoiceOption)"
            >
              <span class="bpm-choice-label">E</span>
              <span class="bpm-choice-copy">
                <small>{{ isLaunchingChoiceBattle ? 'LINKING MVU' : 'SPECIAL ROUTE' }}</small>
                <strong>{{ isLaunchingChoiceBattle ? '正在写入性斗系统…' : sexBattleChoiceOption.text }}</strong>
              </span>
              <span class="bpm-choice-state" aria-hidden="true">⚔</span>
            </button>
          </div>

          <p v-if="choiceNotice !== null" :class="['bpm-choice-notice', `is-${choiceNotice.kind}`]">
            {{ choiceNotice.text }}
          </p>
        </div>
        <button
          v-else
          type="button"
          class="bpm-panel-collapsed-summary is-choice"
          @click="isChoicePanelCollapsed = false"
        >
          <span class="bpm-collapsed-signal" aria-hidden="true"><i></i></span>
          <span
            ><small>CURRENT ROUTE SIGNAL</small><strong>{{ selectedChoiceSummary }}</strong></span
          >
          <b>展开路线 ›</b>
        </button>
      </Transition>
    </section>

    <section
      v-if="!isOverlayOpen && jsonPatchPanel !== null"
      :class="['bpm-support-panel', 'bpm-variable-panel', { 'is-collapsed': isJsonPatchPanelCollapsed }]"
      aria-labelledby="bpm-variable-panel-title"
    >
      <span class="bpm-support-corner is-top-left" aria-hidden="true"></span>
      <span class="bpm-support-corner is-bottom-right" aria-hidden="true"></span>
      <header class="bpm-support-panel-header bpm-variable-panel-header">
        <span class="bpm-support-panel-index" aria-hidden="true">02</span>
        <span class="bpm-support-panel-heading">
          <small>VARIABLE MIRROR</small>
          <strong id="bpm-variable-panel-title">变量更新</strong>
        </span>
        <span class="bpm-support-panel-actions">
          <span class="bpm-support-panel-count">
            {{ jsonPatchPanel.operations.length > 0 ? `${jsonPatchPanel.operations.length} OPS` : 'RAW' }}
          </span>
          <button
            type="button"
            class="bpm-panel-toggle"
            :aria-expanded="!isJsonPatchPanelCollapsed"
            aria-controls="bpm-variable-panel-body"
            @click="isJsonPatchPanelCollapsed = !isJsonPatchPanelCollapsed"
          >
            {{ isJsonPatchPanelCollapsed ? '展开' : '收起' }}
            <span aria-hidden="true">⌄</span>
          </button>
        </span>
      </header>

      <Transition name="bpm-panel-collapse">
        <div v-if="!isJsonPatchPanelCollapsed" id="bpm-variable-panel-body" class="bpm-variable-panel-body">
          <div class="bpm-variable-timeline" aria-hidden="true"><i></i></div>
          <div v-if="jsonPatchPanel.operations.length > 0" class="bpm-variable-operation-list">
            <article
              v-for="operation in jsonPatchPanel.operations"
              :key="`${operation.index}-${operation.op}-${operation.path}`"
              :class="['bpm-variable-operation', `is-${operation.tone}`]"
            >
              <span class="bpm-variable-operation-op">{{ operation.opLabel }}</span>
              <span class="bpm-variable-operation-copy">
                <small>{{ operation.pathTrail }}</small>
                <strong>{{ operation.title }}</strong>
                <span
                  ><b>{{ operation.valuePrefix }}</b
                  >{{ operation.valueText ?? operation.emptyValueText }}</span
                >
              </span>
            </article>
          </div>
          <pre v-else class="bpm-variable-raw">{{ jsonPatchPanel.rawText }}</pre>

          <footer class="bpm-variable-panel-foot">
            <span>CAPTURED FROM &lt;JSONPatch&gt;</span>
            <i></i>
            <b>READ ONLY MIRROR</b>
          </footer>
        </div>
        <button
          v-else
          type="button"
          class="bpm-panel-collapsed-summary is-variable"
          @click="isJsonPatchPanelCollapsed = false"
        >
          <span class="bpm-collapsed-signal is-variable" aria-hidden="true"><i></i></span>
          <span
            ><small>LATEST PATCH</small><strong>{{ latestJsonPatchSummary }}</strong></span
          >
          <b>展开记录 ›</b>
        </button>
      </Transition>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { buildNarrativeChatRows } from '../engine/narrative-chat';
import type { NarrativeChatAvatarCandidate } from '../engine/narrative-chat';
import { stripDialogueMapBlocks } from '../engine/dialogue-map';
import { splitDialogueSource } from '../engine/dialogue-splitter';
import { deriveKnownCharactersForContent } from '../engine/known-characters';
import { readUserPortraitGender, readUserRoleName } from '../engine/tavern-variable-runtime';
import NarrativeBubbleThread from '../modules/NarrativeBubbleThread.vue';
import { useNarrativeViewMode } from '../modules/narrative-view-mode';
import {
  fullbodyPortraitProfiles,
  getFullbodyPortraitUrl,
  resolveFullbodyPortraitDisplayName,
  resolveFullbodyPortraitProfile,
} from '../portrait-registry';
import type { FullbodyPortraitProfile } from '../portrait-registry';
import type { DeviceMode } from '../device-mode';
import type { DialogueMapEntry, DialogueMood, DialogueSegment, DialogueSource } from '../types/narrative';
import {
  getMobileChoiceOptionKey,
  inferMobileSexBattleEnemyName,
  isMobileSexBattleChoiceOption,
  parseMobileJsonPatchPanel,
} from './content-panels';
import type { MobileChoiceOption } from './content-panels';
import {
  createRelationshipContact,
  findRelationshipContact,
  groupContactsByFaction,
  readRelationshipSystemView,
  resolveRelationshipBattleStats,
  resolveRelationshipAvatarUrl,
  resolveRelationshipProfile,
  showTavernNotice,
  startRelationshipSexBattle,
  writeTextToTavernInput,
} from './relationship-runtime';
import type { RelationshipContact } from './relationship-runtime';
import { readMobileStageSceneView } from './scene-runtime';

type ContentRendererContext = {
  layout_mode: DeviceMode;
  message_id: number;
  content: string;
  thinking_content: string;
  choice_options: MobileChoiceOption[];
  json_patch_blocks: string[];
  during_streaming: boolean;
  dialogue_map: DialogueMapEntry[];
  variable_revision: number;
  set_variable_refresh_needed?: (needed: boolean) => void;
};

type BattleLaunchNotice = {
  kind: 'success' | 'warning' | 'error';
  text: string;
};

type ChoiceNotice = {
  kind: 'success' | 'warning' | 'error';
  text: string;
};

type TavernRuntime = typeof globalThis & {
  SillyTavern?: {
    name1?: string;
    name2?: string;
  };
  substitudeMacros?: (text: string) => string;
};

const context = inject<ContentRendererContext>('content_renderer_context');
if (context === undefined) {
  throw Error('[content-chat-renderer] missing content renderer context');
}

const runtime = globalThis as TavernRuntime;
const USER_FULLBODY_PORTRAITS = {
  male: getFullbodyPortraitUrl('男主_黑西装校服_普通学生.png'),
  female: getFullbodyPortraitUrl('女主.png'),
};
const rootElement = ref<HTMLElement | null>(null);
const currentIndex = ref(0);
const { narrativeViewMode, toggleNarrativeViewMode } = useNarrativeViewMode();
const portraitUnavailable = ref(false);
const touchStartX = ref<number | null>(null);
const isShittimOpen = ref(false);
const isThinkingPageOpen = ref(false);
const activeContactFaction = ref<string | null>(null);
const selectedRelationshipContact = ref<RelationshipContact | null>(null);
const selectedPortraitUnavailable = ref(false);
const isStartingBattle = ref(false);
const battleLaunchNotice = ref<BattleLaunchNotice | null>(null);
const selectedChoiceOptionKey = ref<string | null>(null);
const choiceNotice = ref<ChoiceNotice | null>(null);
const isLaunchingChoiceBattle = ref(false);
const isChoicePanelCollapsed = ref(false);
const isJsonPatchPanelCollapsed = ref(false);
let keyboardWindow: Window | null = null;

const userAlias = computed(() =>
  firstResolvedName([safeSubstituteMacros('{{user}}'), runtime.SillyTavern?.name1, '你']),
);
const userRoleName = computed(() => readUserRoleName(context.message_id, context.variable_revision ?? 0));
const userPortraitGender = computed(() => readUserPortraitGender(context.message_id, context.variable_revision ?? 0));
const userChatSpeakerName = computed(() => resolveFullbodyPortraitDisplayName(userRoleName.value ?? userAlias.value));
const userChatProfile = computed(() => resolveCharacterProfile(userChatSpeakerName.value));
const userChatPortraitUrl = computed(
  () => userChatProfile.value?.portraitUrl ?? USER_FULLBODY_PORTRAITS[userPortraitGender.value],
);
const fallbackNpcName = computed(() =>
  resolveFullbodyPortraitDisplayName(
    firstResolvedName([safeSubstituteMacros('{{char}}'), runtime.SillyTavern?.name2, '角色']),
  ),
);
const mobileStageScene = computed(() => readMobileStageSceneView(context.message_id, context.variable_revision ?? 0));
const stageTimeLabel = computed(() => mobileStageScene.value.timeLabel);
const stageLocationLabel = computed(() => mobileStageScene.value.locationLabel);
const stageSceneBackgroundUrls = computed(() => mobileStageScene.value.backgroundUrls);
const sceneBackgroundFallbackIndex = ref(0);
const stageSceneBackgroundUrl = computed(
  () => stageSceneBackgroundUrls.value[sceneBackgroundFallbackIndex.value] ?? stageSceneBackgroundUrls.value[0] ?? '',
);
const contentText = computed(() => stripHiddenBlocks(safeSubstituteMacros(context.content ?? '')));
const thinkingContent = computed(() => (context.thinking_content ?? '').trim());
const hasThinkingContent = computed(() => thinkingContent.value.length > 0);
const isOverlayOpen = computed(() => isShittimOpen.value || isThinkingPageOpen.value);
const allChoiceOptions = computed(() => context.choice_options ?? []);
const sexBattleChoiceIndex = computed(() => allChoiceOptions.value.findIndex(isMobileSexBattleChoiceOption));
const sexBattleChoiceOption = computed(() =>
  sexBattleChoiceIndex.value >= 0 ? (allChoiceOptions.value[sexBattleChoiceIndex.value] ?? null) : null,
);
const choiceOptions = computed(() => allChoiceOptions.value.filter(option => !isMobileSexBattleChoiceOption(option)));
const hasChoiceOptions = computed(() => allChoiceOptions.value.length > 0);
const jsonPatchPanel = computed(() => parseMobileJsonPatchPanel(context.json_patch_blocks?.at(-1)));
const selectedChoiceSummary = computed(() => {
  const selectedKey = selectedChoiceOptionKey.value;
  if (selectedKey === null) {
    return `${allChoiceOptions.value.length} 条路线等待选择`;
  }

  const selectedOption = allChoiceOptions.value.find(
    (option, index) => getMobileChoiceOptionKey(option, index) === selectedKey,
  );
  return selectedOption === undefined
    ? `${allChoiceOptions.value.length} 条路线等待选择`
    : `${selectedOption.label} · ${selectedOption.text}`;
});
const latestJsonPatchSummary = computed(() => {
  const latestOperation = jsonPatchPanel.value?.operations.at(-1);
  if (latestOperation === undefined) {
    return '原始变量片段已捕获';
  }

  const valueSummary = latestOperation.valueText ?? latestOperation.emptyValueText;
  return `${latestOperation.opLabel} · ${latestOperation.title} · ${valueSummary}`;
});

const dialogueSource = computed<DialogueSource>(() => ({
  id: `mobile-content-message-${context.message_id}`,
  messageId: String(context.message_id),
  content: contentText.value,
  knownCharacters: uniqueNonEmpty([
    ...deriveKnownCharactersForContent(
      contentText.value,
      fallbackNpcName.value,
      userRoleName.value ?? userAlias.value,
      runtime.SillyTavern?.name1,
    ),
    ...(context.dialogue_map ?? []).flatMap(entry => [entry.speaker, entry.focus]),
  ]),
  userAliases: uniqueNonEmpty([
    '{{user}}',
    userRoleName.value,
    userAlias.value,
    runtime.SillyTavern?.name1,
    '你',
    '我',
  ]),
  primaryUserName: userRoleName.value ?? userAlias.value,
  secondaryUserNames: uniqueNonEmpty([userAlias.value, runtime.SillyTavern?.name1]),
  dialogueMap: context.dialogue_map ?? [],
  speakerInferenceMode: context.during_streaming || context.dialogue_map.length === 0 ? 'conservative' : 'normal',
}));

const splitResult = computed(() => splitDialogueSource(dialogueSource.value));
const segments = computed(() => splitResult.value.segments);
const currentSegment = computed(() => segments.value[currentIndex.value] ?? null);
const isAtEnd = computed(() => segments.value.length > 0 && currentIndex.value >= segments.value.length - 1);
const chatRows = computed(() =>
  buildNarrativeChatRows(segments.value, {
    resolveSpeakerName: resolveMobileChatSpeakerName,
    resolveAffiliation: resolveMobileChatAffiliation,
    resolveAvatarCandidates: resolveMobileChatAvatarCandidates,
  }),
);

const relationshipSystemView = computed(() =>
  readRelationshipSystemView(context.message_id, context.variable_revision ?? 0),
);
const presentRelationshipContacts = computed(() =>
  relationshipSystemView.value.presentNames.map(name => {
    return (
      findRelationshipContact(name, relationshipSystemView.value.contacts) ?? createRelationshipContact(name, null)
    );
  }),
);
const knownRelationshipContacts = computed(() =>
  relationshipSystemView.value.contacts.filter(
    contact =>
      !relationshipSystemView.value.presentNames.some(
        presentName => findRelationshipContact(presentName, [contact]) !== null,
      ),
  ),
);
const contactFactions = computed(() => groupContactsByFaction(knownRelationshipContacts.value));
const selectedContactFaction = computed(() => {
  const requestedFaction = activeContactFaction.value;
  if (requestedFaction !== null && contactFactions.value.some(faction => faction.name === requestedFaction)) {
    return requestedFaction;
  }

  return contactFactions.value[0]?.name ?? null;
});
const selectedKnownContacts = computed(
  () => contactFactions.value.find(faction => faction.name === selectedContactFaction.value)?.contacts ?? [],
);
const relationshipContactCount = computed(
  () => presentRelationshipContacts.value.length + knownRelationshipContacts.value.length,
);
const selectedRelationshipProfile = computed(() => {
  const contact = selectedRelationshipContact.value;
  return contact === null ? null : resolveRelationshipProfile(contact.name);
});
const selectedRelationshipStats = computed(() => {
  const contact = selectedRelationshipContact.value;
  return contact === null ? null : resolveRelationshipBattleStats(contact.name, selectedRelationshipProfile.value);
});
const selectedRelationshipDisplayName = computed(
  () => selectedRelationshipStats.value?.name ?? selectedRelationshipContact.value?.name ?? '未识别',
);
const selectedRelationshipPortraitUrl = computed(() => selectedRelationshipProfile.value?.portraitUrl ?? null);
const selectedRelationshipAffiliation = computed(() =>
  firstResolvedName([
    compactAffiliation(selectedRelationshipProfile.value?.affiliation),
    selectedRelationshipContact.value?.faction,
    selectedRelationshipStats.value?.faction,
    '未登记归属',
  ]),
);
const selectedRelationshipStatItems = computed(() => [
  { label: '等级', value: formatBattleMetric(selectedRelationshipStats.value?.level) },
  { label: '性斗力', value: formatBattleMetric(selectedRelationshipStats.value?.power) },
  { label: '耐力', value: formatBattleMetric(selectedRelationshipStats.value?.endurance) },
  { label: '忍耐力', value: formatBattleMetric(selectedRelationshipStats.value?.resilience) },
]);
const selectedRelationshipNote = computed(
  () => selectedRelationshipStats.value?.note?.trim() || '什亭之匣尚未收录该联系人的详细战斗档案。',
);

const portraitSpeakerName = computed(() => {
  for (let index = currentIndex.value; index >= 0; index -= 1) {
    const speaker = resolveNpcSpeakerFromSegment(segments.value[index]);
    if (speaker !== null) {
      return speaker;
    }
  }

  return fallbackNpcName.value;
});
const choiceEnemyCandidates = computed(() =>
  uniqueNonEmpty([
    ...presentRelationshipContacts.value.map(contact => contact.name),
    ...knownRelationshipContacts.value.map(contact => contact.name),
    portraitSpeakerName.value,
    fallbackNpcName.value,
  ]),
);

const portraitProfile = computed(() => resolveCharacterProfile(portraitSpeakerName.value));
const npcPortraitUrl = computed(() => portraitProfile.value?.portraitUrl ?? null);
const portraitAffiliation = computed(() => compactAffiliation(portraitProfile.value?.affiliation) ?? 'KIVOTOS');

const activeSpeakerName = computed(() => {
  const segment = currentSegment.value;
  if (segment === null || segment.kind === 'narration') {
    return '旁白';
  }

  if (segment.kind === 'user') {
    return resolveFullbodyPortraitDisplayName(normalizeVisibleSpeaker(segment.speaker) ?? userAlias.value);
  }

  return resolveFullbodyPortraitDisplayName(normalizeVisibleSpeaker(segment.speaker) ?? portraitSpeakerName.value);
});

const activeSpeakerAffiliation = computed(() => {
  const segment = currentSegment.value;
  if (segment === null || segment.kind === 'narration') {
    return 'STORY LOG';
  }

  if (segment.kind === 'user') {
    return 'PLAYER CHANNEL';
  }

  return compactAffiliation(resolveCharacterProfile(activeSpeakerName.value)?.affiliation) ?? 'KIVOTOS';
});

const activeMood = computed<DialogueMood>(() => {
  const segment = currentSegment.value;
  if (segment === null || segment.moodConfidence < 0.55) {
    return 'neutral';
  }

  return segment.mood;
});

const activeMoodLabel = computed(() => {
  const labels: Record<DialogueMood, string> = {
    neutral: 'CALM',
    happy: 'SMILE',
    angry: 'ALERT',
    surprised: 'NOTICE',
  };
  return labels[activeMood.value];
});

const paddedCurrentIndex = computed(() =>
  String(Math.min(currentIndex.value + 1, segments.value.length || 1)).padStart(2, '0'),
);
const paddedSegmentCount = computed(() => String(Math.max(segments.value.length, 1)).padStart(2, '0'));
const progressPercent = computed(() => {
  if (segments.value.length <= 1) {
    return segments.value.length === 0 ? 0 : 100;
  }

  return (currentIndex.value / (segments.value.length - 1)) * 100;
});

watch(
  () => splitResult.value.sourceContentHash,
  () => {
    currentIndex.value = Math.min(currentIndex.value, Math.max(segments.value.length - 1, 0));
  },
);

watch(npcPortraitUrl, () => {
  portraitUnavailable.value = false;
});

watch(selectedRelationshipPortraitUrl, () => {
  selectedPortraitUnavailable.value = false;
});

watch(
  stageLocationLabel,
  locationLabel => {
    sceneBackgroundFallbackIndex.value = 0;
    context.set_variable_refresh_needed?.(locationLabel === '地点未同步');
  },
  { immediate: true },
);

watch(
  () => context.message_id,
  () => {
    isShittimOpen.value = false;
    isThinkingPageOpen.value = false;
    selectedRelationshipContact.value = null;
    battleLaunchNotice.value = null;
    selectedChoiceOptionKey.value = null;
    choiceNotice.value = null;
    isLaunchingChoiceBattle.value = false;
    isChoicePanelCollapsed.value = false;
    isJsonPatchPanelCollapsed.value = false;
  },
);

watch(
  () => context.json_patch_blocks?.at(-1),
  () => {
    isJsonPatchPanelCollapsed.value = false;
  },
);

onMounted(() => {
  keyboardWindow = rootElement.value?.ownerDocument.defaultView ?? null;
  keyboardWindow?.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  keyboardWindow?.removeEventListener('keydown', handleKeydown);
  keyboardWindow = null;
});

function openShittimDrawer() {
  if (isShittimOpen.value) {
    closeShittimDrawer();
    return;
  }

  isThinkingPageOpen.value = false;
  isShittimOpen.value = true;
  selectedRelationshipContact.value = null;
  battleLaunchNotice.value = null;
}

function closeShittimDrawer() {
  isShittimOpen.value = false;
  selectedRelationshipContact.value = null;
  battleLaunchNotice.value = null;
}

function openThinkingPage() {
  closeShittimDrawer();
  isThinkingPageOpen.value = true;
}

function closeThinkingPage() {
  isThinkingPageOpen.value = false;
}

function openRelationshipContact(contact: RelationshipContact) {
  selectedRelationshipContact.value = contact;
  selectedPortraitUnavailable.value = false;
  battleLaunchNotice.value = null;
}

function closeRelationshipContact() {
  selectedRelationshipContact.value = null;
  battleLaunchNotice.value = null;
}

function handleRelationshipAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  if (image === null) {
    return;
  }

  image.hidden = true;
  image.parentElement?.classList.remove('has-image');
}

async function startSelectedRelationshipBattle() {
  const enemyName = uniqueNonEmpty([
    selectedRelationshipStats.value?.name,
    selectedRelationshipContact.value?.name,
    selectedRelationshipDisplayName.value,
  ])[0];
  if (enemyName === undefined || isStartingBattle.value) {
    if (enemyName === undefined) {
      battleLaunchNotice.value = { kind: 'warning', text: '未读取到可作为对手的联系人名称。' };
    }
    return;
  }

  isStartingBattle.value = true;
  battleLaunchNotice.value = null;

  try {
    const isSent = await startRelationshipSexBattle(enemyName, context.message_id, fallbackNpcName.value);
    if (!isSent) {
      battleLaunchNotice.value = { kind: 'warning', text: '已写入对手，但没有找到酒馆发送入口。' };
      showTavernNotice('已写入对手名称，但没有找到可用的发送入口。', '发起性斗失败', 'warning');
      return;
    }

    context.set_variable_refresh_needed?.(true);
    showTavernNotice(`已将对手设置为 ${enemyName}，正在发起性斗。`, '发起性斗', 'success');
    closeShittimDrawer();
  } catch (error) {
    console.error('[正文前端·手机] 发起性斗失败:', error);
    battleLaunchNotice.value = { kind: 'error', text: 'MVU 写入失败，请确认变量框架已经初始化。' };
    showTavernNotice('无法写入性斗系统对手名称，请确认 MVU 已初始化。', '发起性斗失败', 'error');
  } finally {
    isStartingBattle.value = false;
  }
}

function getChoiceOptionKey(option: MobileChoiceOption, index: number) {
  return getMobileChoiceOptionKey(option, index);
}

function handleStageSceneBackgroundError() {
  if (sceneBackgroundFallbackIndex.value >= stageSceneBackgroundUrls.value.length - 1) {
    return;
  }

  sceneBackgroundFallbackIndex.value += 1;
}

function getChoiceOptionTone(index: number) {
  return index % 2 === 0 ? 'cyan' : 'navy';
}

function handleChoiceOptionClick(option: MobileChoiceOption, index: number) {
  const optionText = option.text.trim();
  if (optionText.length === 0) {
    return;
  }

  selectedChoiceOptionKey.value = getChoiceOptionKey(option, index);
  if (writeTextToTavernInput(optionText)) {
    choiceNotice.value = { kind: 'success', text: `已将选项 ${option.label} 填入酒馆输入框。` };
    return;
  }

  choiceNotice.value = { kind: 'warning', text: '没有找到酒馆输入框，选项暂未填入。' };
  showTavernNotice('未找到酒馆输入框，无法填入选项。', '选项填入失败', 'warning');
}

async function handleSexBattleChoiceClick(option: MobileChoiceOption) {
  if (isLaunchingChoiceBattle.value) {
    return;
  }

  const enemyName =
    inferMobileSexBattleEnemyName(option.text, choiceEnemyCandidates.value) ?? choiceEnemyCandidates.value[0];
  if (enemyName === undefined) {
    choiceNotice.value = { kind: 'warning', text: '未读取到可作为性斗对手的角色名称。' };
    showTavernNotice('未读取到可作为对手的角色名称。', '发起性斗失败', 'warning');
    return;
  }

  const optionIndex = Math.max(sexBattleChoiceIndex.value, 0);
  selectedChoiceOptionKey.value = getChoiceOptionKey(option, optionIndex);
  choiceNotice.value = null;
  isLaunchingChoiceBattle.value = true;

  try {
    const isSent = await startRelationshipSexBattle(enemyName, context.message_id, fallbackNpcName.value);
    if (!isSent) {
      choiceNotice.value = { kind: 'warning', text: '已写入对手，但没有找到酒馆发送入口。' };
      showTavernNotice('已写入对手名称，但没有找到可用的发送入口。', '发起性斗失败', 'warning');
      return;
    }

    context.set_variable_refresh_needed?.(true);
    choiceNotice.value = { kind: 'success', text: `已锁定 ${enemyName}，正在发起性斗。` };
    showTavernNotice(`已将对手设置为 ${enemyName}，正在发起性斗。`, '发起性斗', 'success');
  } catch (error) {
    console.error('[正文前端·手机] 选项 E 发起性斗失败:', error);
    choiceNotice.value = { kind: 'error', text: 'MVU 写入失败，请确认变量框架已经初始化。' };
    showTavernNotice('无法写入性斗系统对手名称，请确认 MVU 已初始化。', '发起性斗失败', 'error');
  } finally {
    isLaunchingChoiceBattle.value = false;
  }
}

function advanceNarrative() {
  if (segments.value.length === 0) {
    return;
  }

  currentIndex.value = isAtEnd.value ? 0 : currentIndex.value + 1;
}

function retreatNarrative() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isThinkingPageOpen.value) {
    event.preventDefault();
    closeThinkingPage();
    return;
  }

  if (event.key === 'Escape' && isShittimOpen.value) {
    event.preventDefault();
    if (selectedRelationshipContact.value !== null) {
      closeRelationshipContact();
    } else {
      closeShittimDrawer();
    }
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target !== null && target.closest('button, input, textarea, select, a, [contenteditable="true"]') !== null) {
    return;
  }

  if (isOverlayOpen.value) {
    return;
  }

  if (narrativeViewMode.value !== 'gal') {
    return;
  }

  if (event.key === 'ArrowRight' || event.key === ' ') {
    event.preventDefault();
    advanceNarrative();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    retreatNarrative();
  }
}

function handleTouchStart(event: TouchEvent) {
  if (narrativeViewMode.value !== 'gal') {
    touchStartX.value = null;
    return;
  }

  touchStartX.value = event.changedTouches[0]?.clientX ?? null;
}

function handleTouchEnd(event: TouchEvent) {
  if (isOverlayOpen.value || narrativeViewMode.value !== 'gal') {
    touchStartX.value = null;
    return;
  }

  const startX = touchStartX.value;
  const endX = event.changedTouches[0]?.clientX;
  touchStartX.value = null;
  if (startX === null || endX === undefined) {
    return;
  }

  const distance = endX - startX;
  if (Math.abs(distance) < 44) {
    return;
  }

  if (distance < 0) {
    advanceNarrative();
  } else {
    retreatNarrative();
  }
}

function resolveNpcSpeakerFromSegment(segment: DialogueSegment | null | undefined) {
  if (segment === null || segment === undefined) {
    return null;
  }

  if (segment.focusSpeaker !== null && segment.focusSpeaker !== undefined && !isUserSpeaker(segment.focusSpeaker)) {
    return resolveFullbodyPortraitDisplayName(segment.focusSpeaker);
  }

  if (segment.kind === 'npc' && segment.speaker !== null && !isUserSpeaker(segment.speaker)) {
    return resolveFullbodyPortraitDisplayName(segment.speaker);
  }

  return null;
}

function isUserSpeaker(speaker: string) {
  const normalizedSpeaker = normalizeName(speaker);
  return uniqueNonEmpty(['{{user}}', userRoleName.value, userAlias.value, runtime.SillyTavern?.name1, '你', '我']).some(
    alias => normalizeName(alias) === normalizedSpeaker,
  );
}

function resolveMobileChatSpeakerName(segment: DialogueSegment) {
  if (segment.kind === 'user') {
    return resolveFullbodyPortraitDisplayName(normalizeVisibleSpeaker(segment.speaker) ?? userChatSpeakerName.value);
  }

  return resolveFullbodyPortraitDisplayName(
    normalizeVisibleSpeaker(segment.speaker) ?? resolveNpcSpeakerFromSegment(segment) ?? fallbackNpcName.value,
  );
}

function resolveMobileChatAffiliation(segment: DialogueSegment) {
  const profile =
    segment.kind === 'user' ? userChatProfile.value : resolveCharacterProfile(resolveMobileChatSpeakerName(segment));
  return compactAffiliation(profile?.affiliation);
}

function resolveMobileChatAvatarCandidates(segment: DialogueSegment): NarrativeChatAvatarCandidate[] {
  const speakerName = resolveMobileChatSpeakerName(segment);
  const qAvatarUrl = resolveRelationshipAvatarUrl(speakerName);
  const portraitUrl =
    segment.kind === 'user' ? userChatPortraitUrl.value : (resolveCharacterProfile(speakerName)?.portraitUrl ?? null);

  return [
    ...(qAvatarUrl === null ? [] : [{ url: qAvatarUrl, kind: 'avatar' as const }]),
    ...(portraitUrl === null || portraitUrl.length === 0 ? [] : [{ url: portraitUrl, kind: 'portrait' as const }]),
  ];
}

function resolveCharacterProfile(speaker: string): FullbodyPortraitProfile | null {
  return resolveFullbodyPortraitProfile(speaker);
}

function safeSubstituteMacros(text: string) {
  try {
    return runtime.substitudeMacros?.(text) ?? text;
  } catch {
    return text;
  }
}

function firstResolvedName(values: Array<string | null | undefined>) {
  return uniqueNonEmpty(values).find(value => !value.includes('{{') && !value.includes('}}')) ?? '角色';
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim() ?? '').filter(value => value.length > 0)));
}

function normalizeName(value: string) {
  return value
    .replace(/[{}·・•‧∙･．.\s_-]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeVisibleSpeaker(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  if (normalized.length === 0 || normalized === '{{user}}' || normalized === '我' || normalized === '你') {
    return null;
  }

  return normalized;
}

function compactAffiliation(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  if (normalized.length === 0) {
    return null;
  }

  return normalized.split(/[→/]/)[0]?.trim() ?? normalized;
}

function formatBattleMetric(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('zh-CN') : '--';
}

const HIDDEN_CONTENT_BLOCK_TAGS = new Set([
  'analysis',
  'draft',
  'generate_image',
  'image',
  'image_prompt',
  'img',
  'jsonpatch',
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

function stripHiddenBlocks(text: string) {
  const withoutKnownBlocks = stripKnownControlTagBlocks(
    stripDialogueMapBlocks(text)
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n'),
  );

  return withoutKnownBlocks
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
</script>

<style src="./mobile.css"></style>
