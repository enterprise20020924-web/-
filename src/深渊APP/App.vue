<template>
  <div class="abyss-root">
    <div class="phone-shell">
      <div class="phone-glow"></div>
      <div class="phone-screen">
        <header class="status-bar">
          <div class="status-left">
            <span class="status-time">{{ nowText }}</span>
            <span class="status-date">{{ todayText }}</span>
          </div>
          <span class="status-icons">📶 QOS · ◉ · 🔋87%</span>
        </header>

        <section class="meta-bar">
          <div class="meta-left">
            <p class="meta-title">
              <span class="meta-title-glitch" data-text="深渊论坛 APP">深渊论坛 APP</span>
            </p>
            <p class="meta-main">{{ worldLocationText }}</p>
            <div class="meta-sub-row">
              <span class="meta-pill meta-pill-time">剧情时刻 {{ worldTimeText }}</span>
              <span class="meta-pill meta-pill-clock">时钟 {{ worldGdiText }}</span>
            </div>
          </div>
          <div class="meta-right">
            <span class="meta-level">论坛等级 LV.5</span>
            <span class="meta-rose">✦ 黑玫瑰协议</span>
          </div>
        </section>

        <main class="page-content">
          <section v-if="activeTab === 'forum'" class="tab-page">
            <div class="search-box">搜索关键字 / 联系人 / 剧情事件……</div>

            <article class="panel-card interaction-overview">
              <header class="panel-head">
                <h2>主页面 · 今日概览</h2>
                <button class="ghost-btn" @click="openPanel('quick')">QOS 快速互动</button>
              </header>
              <div class="overview-grid">
                <div class="overview-item">
                  <p class="label">当前位置</p>
                  <p class="value">{{ worldLocationText }}</p>
                </div>
                <div class="overview-item">
                  <p class="label">当前状态</p>
                  <div v-if="playerStatusItems.length > 0" class="overview-detail-list">
                    <p
                      v-for="(status, idx) in playerStatusItems"
                      :key="`overview-status-${idx}`"
                      class="overview-detail-item"
                    >
                      <span class="overview-detail-glyph" aria-hidden="true">◈</span>
                      <span class="overview-detail-text">{{ status }}</span>
                    </p>
                  </div>
                  <p v-else class="value">暂无记录</p>
                </div>
                <div class="overview-item">
                  <p class="label">临时状态</p>
                  <div v-if="playerTempStatusItems.length > 0" class="overview-detail-list">
                    <p
                      v-for="(status, idx) in playerTempStatusItems"
                      :key="`overview-temp-status-${idx}`"
                      class="overview-detail-item"
                    >
                      <span class="overview-detail-glyph" aria-hidden="true">◈</span>
                      <span class="overview-detail-text">{{ status }}</span>
                    </p>
                  </div>
                  <p v-else class="value">暂无记录</p>
                </div>
                <div class="overview-item">
                  <p class="label">隐秘角落</p>
                  <p class="value">{{ worldHiddenText }}</p>
                </div>
              </div>
              <div class="overview-actions">
                <button class="action-btn" @click="openPanel('task')">剧情任务板</button>
                <button class="action-btn" @click="openPanel('event')">事件档案库</button>
                <button class="action-btn" @click="activeTab = 'contacts'">查看联系人</button>
              </div>
            </article>

            <article class="panel-card dialogue-panel">
              <header class="panel-head">
                <h2>即时动态</h2>
                <button class="ghost-btn" @click="reloadVariables(true)">QOS 同步变量</button>
              </header>
              <div class="dialogue-list">
                <article v-for="item in timelinePosts" :key="item.id" class="dialogue-item">
                  <div class="dialogue-avatar"></div>
                  <div class="dialogue-main">
                    <p class="dialogue-name">
                      {{ item.name }}<span> · {{ item.role }}</span>
                    </p>
                    <p class="dialogue-text">{{ item.thought }}</p>
                    <p class="dialogue-meta">{{ item.time }} ｜ 热度 {{ item.like }} ｜ 回复 {{ item.comment }}</p>
                  </div>
                  <button class="mini-btn" @click="openPanel('reply')">脉冲互动</button>
                </article>
                <article v-if="timelinePosts.length === 0" class="empty">暂无交互记录</article>
              </div>
            </article>

            <article class="panel-card forum-list-panel">
              <header class="panel-head">
                <h2>论坛动态</h2>
                <span class="badge-hot">QOS 推荐</span>
              </header>
              <article v-for="post in forumPosts" :key="post.id" class="post-card">
                <div class="avatar"></div>
                <div class="post-main">
                  <p class="post-name">{{ post.name }} · {{ post.role }}</p>
                  <p class="post-time">{{ post.time }}</p>
                  <p class="post-text">{{ post.thought }}</p>
                  <p v-if="post.coreSkill" class="post-skill">核心技能：{{ post.coreSkill }}</p>
                  <p class="post-tags">#深渊论坛 #黑玫瑰 #剧情推进</p>
                  <p class="post-meta">赞 {{ post.like }} · 评 {{ post.comment }}</p>
                </div>
                <div v-if="post.hot" class="hot-badge">热帖</div>
              </article>
            </article>
          </section>

          <section v-else-if="activeTab === 'contacts'" class="tab-page">
            <article class="panel-card">
              <header class="panel-head">
                <h2>联系人界面</h2>
                <span class="badge-hot">QOS 档案</span>
              </header>
              <article
                v-for="contact in contacts"
                :key="contact.name"
                :class="[
                  'contact-card',
                  {
                    'corruption-max': isCorruptionMax(contact.corruption),
                    'affection-max': isAffectionMax(contact.affection),
                  },
                ]"
                @click="openContact(contact)"
              >
                <div
                  class="contact-avatar"
                  :class="{ 'is-corruption-max': isCorruptionMax(contact.corruption) }"
                  :style="getCorruptionStyle(contact.corruption)"
                ></div>
                <div class="contact-main">
                  <p class="contact-name">{{ contact.name }}</p>
                  <p class="contact-quote">“{{ contact.thought }}”</p>
                  <div class="bond-meters">
                    <div
                      class="corruption-meter"
                      :class="{ 'is-max': isCorruptionMax(contact.corruption) }"
                      :style="getCorruptionStyle(contact.corruption)"
                    >
                      <p class="meter-label">堕落度</p>
                      <p class="meter-value">{{ contact.corruption }}</p>
                      <div class="meter-track syringe-track">
                        <span class="meter-idle-glow" aria-hidden="true"></span>
                        <span class="meter-mark mark-30" aria-hidden="true">♠</span>
                        <span class="meter-mark mark-50" aria-hidden="true">⛓</span>
                        <span class="meter-mark mark-100" aria-hidden="true">☠</span>
                        <span class="meter-fill"></span>
                      </div>
                    </div>
                    <div
                      class="affection-meter"
                      :class="{ 'is-max': isAffectionMax(contact.affection) }"
                      :style="getAffectionStyle(contact.affection)"
                    >
                      <p class="meter-label">好感度</p>
                      <p class="meter-value">{{ contact.affection }}</p>
                      <div class="meter-track"><span class="meter-fill"></span></div>
                    </div>
                  </div>
                  <p class="line-sm">临时状态：{{ contact.status }}</p>
                  <p class="line-sm">核心技能：{{ contact.coreSkill }}</p>
                </div>
                <p class="contact-time">QOS档案 ></p>
              </article>
              <article v-if="contacts.length === 0" class="empty">暂无联系人数据</article>
            </article>
          </section>

          <section v-else-if="activeTab === 'discover'" class="tab-page hunter-ground">
            <article class="panel-card hunter-panel">
              <header class="panel-head">
                <h2>可能认识的人</h2>
                <span class="badge-hot">潜在关系</span>
              </header>
              <article
                v-for="person in nearbyList"
                :key="person.name"
                class="nearby-card"
                :class="{ 'queen-card': isQosQueen(person.name) }"
                @click="openPerson(person)"
              >
                <div class="distance">{{ person.distance }}</div>
                <span v-if="isQosQueen(person.name)" class="queen-badge">APP 所有者 / 统治者</span>
                <span v-if="isQosQueen(person.name)" class="queen-watermark" aria-hidden="true">Q♠</span>
                <div class="nearby-avatar" :class="{ 'queen-avatar': isQosQueen(person.name) }"></div>
                <div class="nearby-main">
                  <p class="nearby-name">{{ person.name }}</p>
                  <p v-if="isQosQueen(person.name)" class="queen-title">Queen of Spades · 猎场主宰</p>
                  <p class="nearby-role">定位 / 身份：{{ person.role }}</p>
                  <div class="nearby-detail-list">
                    <p
                      v-for="(line, idx) in splitDisplayLines(person.status)"
                      :key="`nearby-status-${person.id}-${idx}`"
                      class="nearby-detail-item"
                    >
                      <span class="nearby-detail-label">当前状态</span>
                      <span class="nearby-detail-text">{{ line }}</span>
                    </p>
                    <p
                      v-for="(line, idx) in splitDisplayLines(person.thought)"
                      :key="`nearby-thought-${person.id}-${idx}`"
                      class="nearby-detail-item"
                    >
                      <span class="nearby-detail-label">想法</span>
                      <span class="nearby-detail-text">{{ line }}</span>
                    </p>
                    <p
                      v-for="(line, idx) in splitDisplayLines(person.coreSkill || '暂无记录')"
                      :key="`nearby-skill-${person.id}-${idx}`"
                      class="nearby-detail-item"
                    >
                      <span class="nearby-detail-label">核心技能</span>
                      <span class="nearby-detail-text">{{ line }}</span>
                    </p>
                  </div>
                  <div class="nearby-action">
                    <button class="btn btn-muted" @click.stop="openPanel('observe')">静默观察</button>
                    <button class="btn btn-primary" @click.stop="openPanel('connect')">建立链路</button>
                  </div>
                </div>
              </article>
              <article v-if="nearbyList.length === 0" class="empty">暂无可识别对象</article>
            </article>
          </section>

          <section v-else class="tab-page">
            <article class="panel-card profile-head">
              <div class="player-avatar-shell">
                <div
                  class="profile-avatar player-avatar"
                  :class="{
                    'is-corruption-max': isCorruptionMax(playerCorruptionText),
                    'crack-stage-1': isCorruptionOver(playerCorruptionText, 35),
                    'crack-stage-2': isCorruptionOver(playerCorruptionText, 65),
                  }"
                  :style="getCorruptionStyle(playerCorruptionText)"
                ></div>
                <span class="player-lock-ring" aria-hidden="true"></span>
              </div>
              <h2>{{ playerNameText }}</h2>
              <div class="chips">
                <span class="chip chip-purple">性别：{{ playerGenderText }}</span>
              </div>
              <div class="bond-meters profile-bond-meters">
                <div
                  class="corruption-meter profile-corruption"
                  :class="{ 'is-max': isCorruptionMax(playerCorruptionText) }"
                  :style="getCorruptionStyle(playerCorruptionText)"
                >
                  <p class="meter-label">堕落度</p>
                  <p class="meter-value">{{ playerCorruptionText }}</p>
                  <div class="meter-track syringe-track">
                    <span class="meter-idle-glow" aria-hidden="true"></span>
                    <span class="meter-mark mark-30" aria-hidden="true">♠</span>
                    <span class="meter-mark mark-50" aria-hidden="true">⛓</span>
                    <span class="meter-mark mark-100" aria-hidden="true">☠</span>
                    <span class="meter-fill"></span>
                  </div>
                </div>
              </div>
            </article>

            <article class="panel-card profile-block">
              <header class="panel-head">
                <h3>个人中心</h3>
                <button class="ghost-btn" @click="openPanel('profile')">展开详情</button>
              </header>
              <div class="sub-tabs">
                <button
                  v-for="tab in profileTabs"
                  :key="tab"
                  class="sub-tab"
                  :class="{ active: activeProfileTab === tab }"
                  @click="activeProfileTab = tab"
                >
                  {{ tab }}
                </button>
              </div>

              <article v-if="activeProfileTab === '状态'" class="profile-card">
                <div class="profile-meta-list">
                  <p class="profile-meta-item">
                    <span class="profile-meta-label">姓名</span>
                    <span class="profile-meta-value">{{ playerNameText }}</span>
                  </p>
                  <p class="profile-meta-item">
                    <span class="profile-meta-label">性别</span>
                    <span class="profile-meta-value">{{ playerGenderText }}</span>
                  </p>
                  <p class="profile-meta-item profile-meta-item-corruption">
                    <span class="profile-meta-label">堕落度</span>
                    <span class="profile-meta-value">{{ playerCorruptionText }}</span>
                  </p>
                  <div class="profile-meta-item profile-meta-item-status">
                    <p class="profile-meta-label">临时状态列表</p>
                    <div v-if="playerTempStatusItems.length > 0" class="status-list">
                      <p
                        v-for="(status, idx) in playerTempStatusItems"
                        :key="`player-temp-status-${idx}`"
                        class="status-item"
                      >
                        <span class="status-glyph" aria-hidden="true">✦</span>
                        <span>{{ status }}</span>
                      </p>
                    </div>
                    <p v-else class="status-empty">暂无临时状态</p>
                  </div>
                </div>
              </article>

              <article v-else-if="activeProfileTab === '特性'" class="profile-card">
                <div class="line trait-list-wrap">
                  <p class="line">永久特性列表</p>
                  <div class="trait-list">
                    <span
                      v-for="(trait, idx) in splitDisplayLines(playerPermanentTraitsText)"
                      :key="`player-trait-${idx}`"
                      class="trait-item"
                      :class="{ danger: isDangerTrait(trait) }"
                    >
                      {{ trait }}
                    </span>
                  </div>
                </div>
                <div class="line tattoo-list-wrap">
                  <p class="line">淫纹列表</p>
                  <div v-if="playerTattooItems.length > 0" class="profile-tattoo-table">
                    <p
                      v-for="(tattoo, idx) in playerTattooItems"
                      :key="`player-tattoo-${idx}`"
                      class="profile-tattoo-row"
                    >
                      <span class="profile-tattoo-name">{{ tattoo.name }}</span>
                      <span class="profile-tattoo-en">{{ tattoo.english || '—' }}</span>
                      <span class="profile-tattoo-imagery">{{ tattoo.imagery || '—' }}</span>
                    </p>
                  </div>
                  <p v-else class="tattoo-empty">未显现</p>
                </div>
              </article>

              <article v-else class="profile-card">
                <div class="line inventory-list-wrap">
                  <p class="line">物品栏</p>
                  <div v-if="playerInventoryItems.length > 0" class="inventory-list">
                    <p
                      v-for="(item, idx) in playerInventoryItems"
                      :key="`player-inventory-${idx}`"
                      class="inventory-item"
                    >
                      <span class="inventory-glyph" aria-hidden="true">◈</span>
                      <span class="inventory-main">
                        <span class="inventory-name">{{ item.name }}</span>
                        <span v-if="item.detail" class="inventory-detail">{{ item.detail }}</span>
                      </span>
                    </p>
                  </div>
                  <p v-else class="inventory-empty">暂无可用物品</p>
                </div>
              </article>
            </article>
          </section>
        </main>

        <footer class="bottom-tabs">
          <button class="nav-btn" :class="{ active: activeTab === 'forum' }" @click="activeTab = 'forum'">
            主页面
          </button>
          <button class="nav-btn" :class="{ active: activeTab === 'contacts' }" @click="activeTab = 'contacts'">
            联系人
          </button>
          <button class="nav-btn" :class="{ active: activeTab === 'discover' }" @click="activeTab = 'discover'">
            可能认识的人
          </button>
          <button class="nav-btn" :class="{ active: activeTab === 'mine' }" @click="activeTab = 'mine'">
            个人中心
          </button>
        </footer>
      </div>
    </div>

    <div v-if="selectedContact" class="overlay" @click.self="selectedContact = null">
      <section
        class="modal"
        :class="{
          'corruption-max': isCorruptionMax(selectedContact.corruption),
          'affection-max': isAffectionMax(selectedContact.affection),
        }"
      >
        <button class="close" @click="selectedContact = null">×</button>
        <div
          class="modal-avatar"
          :class="{ 'is-corruption-max': isCorruptionMax(selectedContact.corruption) }"
          :style="getCorruptionStyle(selectedContact.corruption)"
        ></div>
        <h3 class="modal-name">{{ selectedContact.name }}</h3>
        <p class="modal-quote">“{{ selectedContact.thought }}”</p>
        <div class="bond-meters">
          <div
            class="corruption-meter"
            :class="{ 'is-max': isCorruptionMax(selectedContact.corruption) }"
            :style="getCorruptionStyle(selectedContact.corruption)"
          >
            <p class="meter-label">堕落度</p>
            <p class="meter-value">{{ selectedContact.corruption }}</p>
            <div class="meter-track syringe-track">
              <span class="meter-idle-glow" aria-hidden="true"></span>
              <span class="meter-mark mark-30" aria-hidden="true">♠</span>
              <span class="meter-mark mark-50" aria-hidden="true">⛓</span>
              <span class="meter-mark mark-100" aria-hidden="true">☠</span>
              <span class="meter-fill"></span>
            </div>
          </div>
          <div
            class="affection-meter"
            :class="{ 'is-max': isAffectionMax(selectedContact.affection) }"
            :style="getAffectionStyle(selectedContact.affection)"
          >
            <p class="meter-label">好感度</p>
            <p class="meter-value">{{ selectedContact.affection }}</p>
            <div class="meter-track"><span class="meter-fill"></span></div>
          </div>
        </div>

        <div class="modal-block">
          <p class="block-title">临时状态列表（名称 / 效果）</p>
          <div v-if="selectedContactTempStatusItems.length > 0" class="status-list">
            <p
              v-for="(status, idx) in selectedContactTempStatusItems"
              :key="`contact-temp-status-${idx}`"
              class="status-item"
            >
              <span class="status-glyph" aria-hidden="true">✦</span>
              <span>{{ status }}</span>
            </p>
          </div>
          <p v-else class="contact-empty">暂无记录</p>
        </div>
        <div class="modal-block">
          <p class="block-title">永久特性列表</p>
          <div class="trait-list">
            <span
              v-for="(trait, idx) in splitDisplayLines(selectedContact.permanentTraits)"
              :key="`contact-trait-${idx}`"
              class="trait-item"
              :class="{ danger: isDangerTrait(trait) }"
            >
              {{ trait }}
            </span>
          </div>
        </div>
        <div class="modal-block">
          <p class="block-title">淫纹列表</p>
          <div v-if="selectedContactTattooItems.length > 0" class="contact-tattoo-table">
            <p
              v-for="(tattoo, idx) in selectedContactTattooItems"
              :key="`contact-tattoo-${idx}`"
              class="contact-tattoo-row"
            >
              <span class="contact-tattoo-name">{{ tattoo.name }}</span>
              <span class="contact-tattoo-en">{{ tattoo.english || '—' }}</span>
              <span class="contact-tattoo-imagery">{{ tattoo.imagery || '—' }}</span>
            </p>
          </div>
          <p v-else class="contact-empty">未显现</p>
        </div>
        <div class="modal-block">
          <p class="block-title">堕落物品列表</p>
          <div v-if="selectedContactFallenItems.length > 0" class="contact-detail-list">
            <p
              v-for="(item, idx) in selectedContactFallenItems"
              :key="`contact-fallen-item-${idx}`"
              class="contact-detail-item"
            >
              <span class="contact-detail-glyph" aria-hidden="true">◈</span>
              <span class="contact-detail-main">
                <span class="contact-detail-name">{{ item.name }}</span>
                <span v-if="item.detail" class="contact-detail-desc">{{ item.detail }}</span>
              </span>
            </p>
          </div>
          <p v-else class="contact-empty">暂无收藏</p>
        </div>
        <div class="modal-block">
          <p class="block-title">妆容列表</p>
          <div v-if="selectedContactMakeupItems.length > 0" class="contact-detail-list">
            <p
              v-for="(item, idx) in selectedContactMakeupItems"
              :key="`contact-makeup-item-${idx}`"
              class="contact-detail-item"
            >
              <span class="contact-detail-glyph" aria-hidden="true">◈</span>
              <span class="contact-detail-main">
                <span class="contact-detail-name">{{ item.name }}</span>
                <span v-if="item.detail" class="contact-detail-desc">{{ item.detail }}</span>
              </span>
            </p>
          </div>
          <p v-else class="contact-empty">素颜</p>
        </div>
        <div class="modal-block">
          <p class="block-title">核心技能</p>
          <p class="line">{{ selectedContact.coreSkill }}</p>
        </div>
        <button class="send-btn" @click="selectedContact = null">发送消息</button>
      </section>
    </div>

    <div v-if="selectedPerson" class="overlay" @click.self="selectedPerson = null">
      <section class="modal">
        <button class="close" @click="selectedPerson = null">×</button>
        <h3 class="modal-name">{{ selectedPerson.name }}</h3>
        <div class="modal-block">
          <p class="block-title">定位 / 身份</p>
          <p class="line">{{ selectedPerson.role }}</p>
        </div>
        <div class="modal-block">
          <p class="block-title">当前状态</p>
          <div v-if="splitDisplayLines(selectedPerson.status).length > 0" class="contact-detail-list">
            <p
              v-for="(line, idx) in splitDisplayLines(selectedPerson.status)"
              :key="`person-status-${idx}`"
              class="contact-detail-item"
            >
              <span class="contact-detail-glyph" aria-hidden="true">◈</span>
              <span class="contact-detail-main">
                <span class="contact-detail-desc">{{ line }}</span>
              </span>
            </p>
          </div>
          <p v-else class="contact-empty">暂无记录</p>
        </div>
        <div class="modal-block">
          <p class="block-title">想法</p>
          <div v-if="splitDisplayLines(selectedPerson.thought).length > 0" class="contact-detail-list">
            <p
              v-for="(line, idx) in splitDisplayLines(selectedPerson.thought)"
              :key="`person-thought-${idx}`"
              class="contact-detail-item"
            >
              <span class="contact-detail-glyph" aria-hidden="true">◈</span>
              <span class="contact-detail-main">
                <span class="contact-detail-desc">{{ line }}</span>
              </span>
            </p>
          </div>
          <p v-else class="contact-empty">暂无记录</p>
        </div>
        <div class="modal-block">
          <p class="block-title">核心技能</p>
          <div v-if="splitDisplayLines(selectedPerson.coreSkill || '暂无记录').length > 0" class="contact-detail-list">
            <p
              v-for="(line, idx) in splitDisplayLines(selectedPerson.coreSkill || '暂无记录')"
              :key="`person-core-skill-${idx}`"
              class="contact-detail-item"
            >
              <span class="contact-detail-glyph" aria-hidden="true">◈</span>
              <span class="contact-detail-main">
                <span class="contact-detail-desc">{{ line }}</span>
              </span>
            </p>
          </div>
          <p v-else class="contact-empty">暂无记录</p>
        </div>
        <button class="send-btn" @click="selectedPerson = null">标记为可接触对象</button>
      </section>
    </div>

    <div v-if="activePanel" class="overlay" @click.self="activePanel = null">
      <section class="modal">
        <button class="close" @click="activePanel = null">×</button>
        <h3 class="modal-name">{{ panelTitle }}</h3>
        <p class="modal-quote">此界面已完成视觉与结构设计，可直接接入后续具体逻辑。</p>
        <div class="modal-block">
          <p class="block-title">模块说明</p>
          <p class="line">{{ panelDescription }}</p>
        </div>
        <div class="modal-block">
          <p class="block-title">可用交互占位</p>
          <p class="line">1）筛选器 2）剧情推进按钮 3）日志回溯 4）标签页切换</p>
        </div>
        <button class="send-btn" @click="activePanel = null">关闭模块</button>
      </section>
    </div>

    <div v-if="toast.visible" class="toast">{{ toast.message }}</div>
  </div>
</template>

<script setup lang="ts">
import { get } from 'lodash';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type TabKey = 'forum' | 'contacts' | 'discover' | 'mine';
type ProfileTab = '状态' | '物品' | '特性';
type PanelKey = 'task' | 'event' | 'quick' | 'reply' | 'observe' | 'connect' | 'profile';

type ContactItem = {
  name: string;
  role: string;
  status: string;
  thought: string;
  corruption: string;
  affection: string;
  affairCount: string;
  tempStatus: string;
  permanentTraits: string;
  fallenItems: string;
  makeupList: string;
  tattooList: string;
  coreSkill: string;
};

type DiscoverItem = {
  id: string;
  name: string;
  role: string;
  status: string;
  thought: string;
  coreSkill: string;
  like: number;
  comment: number;
  hot: boolean;
  time: string;
  distance: string;
};

const nowText = ref('06:16');
const todayText = ref('2045/09/12');
const toast = ref({ visible: false, message: '' });
const statData = ref<Record<string, unknown>>({});
const activeTab = ref<TabKey>('forum');
const activeProfileTab = ref<ProfileTab>('状态');
const selectedContact = ref<ContactItem | null>(null);
const selectedPerson = ref<DiscoverItem | null>(null);
const activePanel = ref<PanelKey | null>(null);
const profileTabs: ProfileTab[] = ['状态', '物品', '特性'];

let timer: number | null = null;
let toastTimer: number | null = null;
let variableTimer: number | null = null;

function updateNowText() {
  const now = new Date();
  nowText.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  todayText.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function showToast(message: string) {
  toast.value = { visible: true, message };
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value.visible = false;
  }, 1400);
}

function resolveMessageId(): number | 'latest' {
  try {
    const maybeGetCurrentMessageId = (window as unknown as { getCurrentMessageId?: () => number }).getCurrentMessageId;
    if (typeof maybeGetCurrentMessageId === 'function') return maybeGetCurrentMessageId();
  } catch {
    // ignore
  }
  return 'latest';
}

function reloadVariables(showSuccess = false) {
  try {
    const messageId = resolveMessageId();
    const tavernHelper = (window as unknown as { TavernHelper?: { getVariables: (option: unknown) => unknown } })
      .TavernHelper;
    if (!tavernHelper?.getVariables) throw new Error('TavernHelper.getVariables 不可用');
    const variables = tavernHelper.getVariables({ type: 'message', message_id: messageId });
    statData.value = get(variables, 'stat_data', {});
    if (showSuccess) showToast('变量已刷新');
  } catch (error) {
    console.error(error);
    showToast('变量读取失败');
  }
}

function openContact(contact: ContactItem) {
  selectedContact.value = contact;
}

function openPerson(person: DiscoverItem) {
  selectedPerson.value = person;
}

function openPanel(panel: PanelKey) {
  activePanel.value = panel;
}

const panelTitle = computed(() => {
  switch (activePanel.value) {
    case 'task':
      return '剧情任务板';
    case 'event':
      return '事件档案库';
    case 'quick':
      return '快速互动';
    case 'reply':
      return '互动回复';
    case 'observe':
      return '观察模式';
    case 'connect':
      return '连接确认';
    case 'profile':
      return '个人中心扩展页';
    default:
      return '功能面板';
  }
});

const panelDescription = computed(() => {
  switch (activePanel.value) {
    case 'task':
      return '用于显示阶段任务、推进条件、奖励记录。';
    case 'event':
      return '用于展示历史事件、关键人物、分支线索。';
    case 'quick':
      return '用于一键发送常用互动指令与快捷回复。';
    case 'reply':
      return '用于展示回复模板、语气选择和行动确认。';
    case 'observe':
      return '用于查看目标近期动态和风险评估。';
    case 'connect':
      return '用于建立联系前的确认和策略选择。';
    case 'profile':
      return '用于集中查看个人信息和状态明细。';
    default:
      return '该模块预留给后续功能扩展。';
  }
});

const world = computed(() => get(statData.value, '世界', {}));
const worldTimeText = computed(() => String(get(world.value, '时间', '2045.09.12')));
const worldLocationText = computed(() => String(get(world.value, '地点', '未知地点')));
const worldGdiText = computed(() => String(get(world.value, 'GDI', '23:42')));
const worldHiddenText = computed(() => String(get(world.value, '不为人知的角落', '未知区')));

function formatValue(value: unknown, fallback = '暂无记录') {
  if (value === null || value === undefined || value === '') return fallback;

  if (Array.isArray(value)) {
    if (value.length === 0) return fallback;
    const text = value
      .map(item => formatValue(item, ''))
      .filter(Boolean)
      .join('；');
    return text || fallback;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return fallback;

    const text = entries
      .map(([key, item]) => {
        if (typeof item === 'boolean') {
          return item ? key : '';
        }
        return `${key}：${formatValue(item, '无')}`;
      })
      .filter(Boolean)
      .join('；');

    return text || fallback;
  }

  return String(value);
}

const conquerorList = computed<DiscoverItem[]>(() => {
  const raw = get(statData.value, '征服者状态', {});
  return Object.entries(raw as Record<string, unknown>).map(([name, value], index) => ({
    id: `${name}-${index}`,
    name,
    role: String(get(value, '定位', '匿名用户')),
    status: String(get(value, '当前状态', '观察中')),
    thought: String(get(value, '想法', '……')),
    coreSkill: formatValue(get(value, '核心技能', get(value, '核心技能效果', ''))),
    like: 120 + index * 48,
    comment: 40 + index * 20,
    hot: index < 2,
    time: `${Math.max(1, index * 7 + 2)}分钟前`,
    distance: `${(0.5 + index * 1.6).toFixed(1)}km`,
  }));
});

const contacts = computed<ContactItem[]>(() => {
  const raw = get(statData.value, '被征服者状态', {});
  return Object.entries(raw as Record<string, unknown>).map(([name, value]) => ({
    name,
    role: String(get(value, '定位', get(value, '姓名', '永久特性未知'))),
    status: formatValue(get(value, '当前状态', get(value, '临时状态', '迷茫')), '迷茫'),
    thought: String(get(value, '想法', '……')),
    corruption: String(get(value, '堕落度', '-')),
    affection: String(get(value, '好感度', '-')),
    affairCount: String(get(value, '出轨次数', '-')),
    tempStatus: formatValue(get(value, '临时状态', {}), '状态平稳'),
    permanentTraits: formatValue(get(value, '永久特性', {}), '尚未显化'),
    fallenItems: formatValue(get(value, '堕落物品列表', {}), '暂无收藏'),
    makeupList: formatValue(get(value, '妆容列表', {}), '素颜'),
    tattooList: formatTattooList(get(value, '淫纹列表', {}), '未显现'),
    coreSkill: formatValue(get(value, '核心技能', {}), '尚未觉醒'),
  }));
});

const forumPosts = computed(() => {
  if (conquerorList.value.length > 0) return conquerorList.value;
  return [
    {
      id: 'mock-1',
      name: '夜行者',
      role: '匿名',
      status: '在线',
      thought: '今天的论坛节奏很快，建议先观望再互动。',
      coreSkill: '情报整合',
      like: 124,
      comment: 45,
      hot: true,
      time: '2分钟前',
      distance: '0.5km',
    },
  ];
});

const timelinePosts = computed(() => {
  if (contacts.value.length > 0) {
    return contacts.value.slice(0, 5).map((item, idx) => ({
      id: `${item.name}-${idx}`,
      name: item.name,
      role: item.role,
      thought: item.thought,
      like: 20 + idx * 3,
      comment: 5 + idx,
      time: `${idx + 1}分钟前`,
    }));
  }

  return [
    {
      id: 'timeline-1',
      name: '系统',
      role: '引导',
      thought: '欢迎进入深渊论坛，主页面已完成全部交互骨架。',
      like: 0,
      comment: 0,
      time: '刚刚',
    },
  ];
});

const nearbyList = computed<DiscoverItem[]>(() => {
  if (conquerorList.value.length > 0) return conquerorList.value;
  return [
    {
      id: 'nearby-q-1',
      name: '迦南',
      role: 'APP所有者 · QOS统治者',
      status: '筛选猎物中',
      thought: '猎场的秩序由我定义。',
      coreSkill: '支配链路',
      like: 999,
      comment: 404,
      hot: true,
      time: '刚刚',
      distance: '0.2km',
    },
    {
      id: 'nearby-q-2',
      name: '希安',
      role: 'APP所有者 · QOS统治者',
      status: '锁定目标中',
      thought: '确认信号，准备收网。',
      coreSkill: '意识围猎',
      like: 975,
      comment: 389,
      hot: true,
      time: '刚刚',
      distance: '0.3km',
    },
    {
      id: 'nearby-1',
      name: '未知用户404',
      role: '地下医生 · 第七区',
      status: '寻找实验对象',
      thought: '需要新鲜样本。',
      coreSkill: '生体改造',
      like: 0,
      comment: 0,
      hot: false,
      time: '刚刚',
      distance: '0.5km',
    },
  ];
});

function polishTattooText(text: string) {
  return text
    .replaceAll('形状描写', '描述')
    .replaceAll('功能描写', '功能')
    .replaceAll('纹于', '落于')
    .replaceAll('皮肤', '肌理');
}

function formatTattooList(value: unknown, fallback = '未显现') {
  if (value === null || value === undefined || value === '') return fallback;

  if (Array.isArray(value)) {
    if (value.length === 0) return fallback;
    const text = value
      .map(item => polishTattooText(formatValue(item, '')))
      .filter(Boolean)
      .join('\n');
    return text || fallback;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return fallback;
    return entries
      .map(([key, item]) => `${key}：${polishTattooText(formatValue(item, '无').replaceAll('；', '，'))}`)
      .join('\n');
  }

  return polishTattooText(String(value));
}

function splitDisplayLines(value: string) {
  return value
    .split(/[；\n]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function parseTattooEntry(text: string) {
  const normalized = text.trim();
  if (!normalized || normalized === '未显现') return null;

  const [namePart, ...restParts] = normalized.split('：');
  const name = namePart.trim();
  const rest = restParts.join('：').trim();

  const segments = rest
    .split(/[，,]/)
    .map(segment => segment.trim())
    .filter(Boolean);

  let english = '';
  let description = '';
  let func = '';
  const plainSegments: string[] = [];

  segments.forEach(segment => {
    if (/^(?:英文名|英文)[:：]/u.test(segment)) {
      english = segment.replace(/^(?:英文名|英文)[:：]\s*/u, '').trim();
      return;
    }

    if (/^(?:描述|形状描写|意象描摹|意象)[:：]/u.test(segment)) {
      description = segment.replace(/^(?:描述|形状描写|意象描摹|意象)[:：]\s*/u, '').trim();
      return;
    }

    if (/^(?:功能|功能描写)[:：]/u.test(segment)) {
      func = segment.replace(/^(?:功能|功能描写)[:：]\s*/u, '').trim();
      return;
    }

    plainSegments.push(segment.replace(/^(?:描述|形状描写|功能|功能描写|意象描摹|意象)[:：]\s*/u, '').trim());
  });

  if (!english && plainSegments.length > 0) {
    english = plainSegments.shift() ?? '';
  }

  if (!description && plainSegments.length > 0) {
    description = plainSegments.shift() ?? '';
  }

  const extraDetail = plainSegments.join('，').trim();
  if (!func && extraDetail) {
    func = extraDetail;
  }

  const imagery = [description, func].filter(Boolean).join('\n');

  return {
    name,
    english,
    imagery,
  };
}

function isDangerTrait(text: string) {
  return ['绝对忠诚', '精神控制者', '意识锁定', '完全驯化', '主导印记'].some(keyword => text.includes(keyword));
}

function parseInventoryEntry(text: string) {
  const normalized = text.trim();
  if (!normalized) return null;
  if (/^数量[:：]?\s*\d+/u.test(normalized)) return null;

  const [namePart, ...detailParts] = normalized.split('：');

  if (detailParts.length === 0) {
    return { name: normalized, detail: '' };
  }

  const name = namePart.trim() || '未命名物品';
  const rawDetail = detailParts.join('：').trim();

  const primarySegments = rawDetail
    .split(/[；;\n]+/)
    .map(segment => segment.trim())
    .filter(Boolean);

  const segments =
    primarySegments.length > 1
      ? primarySegments
      : rawDetail
          .split(/[，,]/)
          .map(segment => segment.trim())
          .filter(Boolean);

  const lines: string[] = [];

  segments.forEach(segment => {
    if (/^数量[:：]?\s*\d+/u.test(segment)) return;

    const cleaned = segment.replace(/^(?:描述|形状描写|意象描摹|意象|功能|功能描写)[:：]\s*/u, '').trim();

    if (!cleaned) return;
    lines.push(cleaned);
  });

  const detail = lines.join('\n').trim();
  return { name, detail };
}

function parseInventoryEntries(text: string) {
  const items: Array<{ name: string; detail: string }> = [];

  splitDisplayLines(text).forEach(line => {
    const parsed = parseInventoryEntry(line);
    if (!parsed) return;

    if (/^(?:功能|功能描写)$/u.test(parsed.name) && items.length > 0) {
      const last = items[items.length - 1];
      const mergedDetail = [last.detail, parsed.detail].filter(Boolean).join('\n').trim();
      items[items.length - 1] = { ...last, detail: mergedDetail };
      return;
    }

    items.push(parsed);
  });

  return items;
}

function isQosQueen(name: string) {
  return ['迦南', '希安'].includes(name.trim());
}

function parseGaugeValue(value: string) {
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const num = Number.parseFloat(cleaned);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, num));
}

function isCorruptionMax(value: string) {
  return parseGaugeValue(value) >= 100;
}

function isAffectionMax(value: string) {
  return parseGaugeValue(value) >= 100;
}

function isCorruptionOver(value: string, threshold: number) {
  return parseGaugeValue(value) >= threshold;
}

function interpolateRgb(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
}

function getCorruptionRingRgb(value: number) {
  const cold: [number, number, number] = [170, 214, 255];
  const mid: [number, number, number] = [196, 130, 255];
  const hot: [number, number, number] = [255, 74, 116];
  if (value <= 50) return interpolateRgb(cold, mid, value / 50);
  return interpolateRgb(mid, hot, (value - 50) / 50);
}

function getCorruptionStyle(value: string) {
  const level = parseGaugeValue(value);
  const [r, g, b] = getCorruptionRingRgb(level);
  return {
    '--qos-corruption': `${level}%`,
    '--qos-ring-rgb': `${r}, ${g}, ${b}`,
  };
}

function getAffectionStyle(value: string) {
  return { '--qos-affection': `${parseGaugeValue(value)}%` };
}

const player = computed(() => get(statData.value, '绿帽王状态', {}));
const playerNameText = computed(() => String(get(player.value, '姓名', '玩家')));
const playerGenderText = computed(() => String(get(player.value, '性别', '未知')));
const playerCorruptionText = computed(() => String(get(player.value, '堕落度', '0')));
const playerStatusText = computed(() =>
  formatValue(get(player.value, '当前状态', get(player.value, '临时状态', '正常'))),
);
const playerTempStatusText = computed(() => formatValue(get(player.value, '临时状态', {})));
const playerStatusItems = computed(() => splitDisplayLines(playerStatusText.value).filter(item => item !== '暂无记录'));
const playerTempStatusItems = computed(() =>
  splitDisplayLines(playerTempStatusText.value).filter(item => item !== '暂无记录'),
);
const playerTattooListText = computed(() => formatTattooList(get(player.value, '淫纹列表', {})));
const playerTattooItems = computed(() =>
  splitDisplayLines(playerTattooListText.value)
    .map(item => parseTattooEntry(item))
    .filter((item): item is { name: string; english: string; imagery: string } => item !== null),
);
const playerPermanentTraitsText = computed(() => formatValue(get(player.value, '永久特性', {})));
const playerInventoryText = computed(() => formatValue(get(player.value, '物品栏', {})));
const playerInventoryItems = computed(() =>
  parseInventoryEntries(playerInventoryText.value).filter(item => item.name !== '暂无记录'),
);

const selectedContactTattooItems = computed(() => {
  if (!selectedContact.value) return [];
  return splitDisplayLines(selectedContact.value.tattooList)
    .map(item => parseTattooEntry(item))
    .filter((item): item is { name: string; english: string; imagery: string } => item !== null);
});

const selectedContactTempStatusItems = computed(() => {
  if (!selectedContact.value) return [];
  return splitDisplayLines(selectedContact.value.tempStatus).filter(item => item !== '暂无记录');
});

const selectedContactFallenItems = computed(() => {
  if (!selectedContact.value) return [];
  return parseInventoryEntries(selectedContact.value.fallenItems);
});

const selectedContactMakeupItems = computed(() => {
  if (!selectedContact.value) return [];
  return parseInventoryEntries(selectedContact.value.makeupList);
});

onMounted(() => {
  updateNowText();
  reloadVariables(true);
  timer = window.setInterval(updateNowText, 1000);
  variableTimer = window.setInterval(() => reloadVariables(false), 2000);
});

onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer);
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  if (variableTimer !== null) window.clearInterval(variableTimer);
});
</script>

<style scoped>
.abyss-root {
  width: 100%;
  padding: 8px;
  color: #fff;
  background:
    radial-gradient(85% 60% at 15% 0%, rgba(160, 35, 255, 0.2) 0%, rgba(9, 6, 15, 0) 65%),
    radial-gradient(60% 60% at 90% 8%, rgba(255, 38, 127, 0.16) 0%, rgba(11, 8, 15, 0) 65%),
    repeating-radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.02) 0 1px, rgba(0, 0, 0, 0) 1px 12px),
    linear-gradient(180deg, #06040b 0%, #040306 48%, #020204 100%);
}

.phone-shell {
  width: min(100%, 450px);
  margin: 0 auto;
  padding: 10px;
  border-radius: 40px;
  border: 1px solid rgba(186, 88, 255, 0.34);
  background: linear-gradient(140deg, #0f0618 0%, #08040f 40%, #04030a 100%);
  position: relative;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 14px 30px rgba(0, 0, 0, 0.45),
    0 0 24px rgba(160, 35, 255, 0.18);
}

.phone-glow {
  position: absolute;
  inset: 0;
  border-radius: 40px;
  box-shadow:
    0 0 0 1px rgba(215, 72, 255, 0.2) inset,
    0 0 40px rgba(255, 36, 130, 0.08) inset;
  pointer-events: none;
}

.phone-screen {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 19.5;
  border-radius: 30px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(16, 8, 23, 0.98) 0%, rgba(8, 6, 13, 0.99) 45%, rgba(6, 6, 9, 1) 100%),
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.013),
      rgba(255, 255, 255, 0.013) 1px,
      rgba(255, 255, 255, 0.003) 1px,
      rgba(255, 255, 255, 0.003) 3px
    );
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(244, 122, 255, 0.25);
}

.phone-screen::before {
  content: '♠';
  position: absolute;
  right: -18px;
  bottom: -52px;
  font-size: 210px;
  line-height: 1;
  color: rgba(201, 177, 214, 0.07);
  text-shadow:
    0 0 12px rgba(255, 255, 255, 0.06),
    0 0 26px rgba(167, 126, 255, 0.08);
  transform: rotate(-13deg);
  pointer-events: none;
  z-index: 0;
}

.phone-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(126deg, rgba(198, 163, 213, 0.035) 0 1px, rgba(0, 0, 0, 0) 1px 24px),
    repeating-linear-gradient(54deg, rgba(198, 163, 213, 0.028) 0 1px, rgba(0, 0, 0, 0) 1px 22px);
  opacity: 0.32;
  mix-blend-mode: soft-light;
  pointer-events: none;
  z-index: 0;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px 9px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  background:
    linear-gradient(180deg, rgba(21, 12, 33, 0.94), rgba(21, 12, 33, 0.78)),
    linear-gradient(90deg, rgba(116, 36, 160, 0.16), rgba(255, 94, 182, 0.08));
  box-shadow:
    inset 0 -1px 0 rgba(255, 255, 255, 0.04),
    0 7px 20px rgba(8, 1, 12, 0.34);
}

.status-left {
  display: grid;
  gap: 1px;
}

.status-time {
  font-size: 16px;
  font-weight: 800;
  color: #ffe7ff;
  letter-spacing: 0.3px;
}

.status-date {
  font-size: 11px;
  color: #ccb5da;
}

.status-icons {
  align-self: center;
  font-size: 11px;
  line-height: 1;
  color: #efd9ff;
  letter-spacing: 0.4px;
  border-radius: 999px;
  padding: 5px 9px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 2px 8px rgba(0, 0, 0, 0.25);
}

.meta-bar {
  padding: 10px 13px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(120% 100% at 0% 0%, rgba(255, 117, 206, 0.16) 0%, rgba(255, 117, 206, 0) 38%),
    linear-gradient(180deg, rgba(50, 18, 68, 0.7), rgba(18, 10, 30, 0.66)),
    linear-gradient(92deg, rgba(106, 18, 149, 0.22), rgba(255, 47, 145, 0.1));
  position: relative;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03);
}

.meta-bar::before,
.meta-bar::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.meta-bar::before {
  inset: 0;
  background:
    repeating-linear-gradient(90deg, rgba(157, 108, 196, 0.08) 0 1px, rgba(0, 0, 0, 0) 1px 18px),
    repeating-linear-gradient(180deg, rgba(157, 108, 196, 0.06) 0 1px, rgba(0, 0, 0, 0) 1px 14px);
  opacity: 0.22;
  mix-blend-mode: screen;
}

.meta-bar::after {
  left: 0;
  right: 0;
  top: -24%;
  height: 42%;
  background: repeating-linear-gradient(
    180deg,
    rgba(200, 76, 152, 0.18) 0,
    rgba(200, 76, 152, 0.18) 1px,
    rgba(0, 0, 0, 0) 1px,
    rgba(0, 0, 0, 0) 5px
  );
  opacity: 0.22;
  filter: blur(0.45px);
  animation: metaCodeRain 6.2s linear infinite;
}

.meta-bar > * {
  position: relative;
  z-index: 1;
}

.meta-left {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.meta-title {
  margin: 0;
  font-size: 12px;
  letter-spacing: 1px;
  color: #ffc2ef;
}

.meta-title-glitch {
  position: relative;
  display: inline-block;
  color: #ffd4f4;
  text-shadow: 0 0 8px rgba(255, 166, 230, 0.32);
  animation: titleGlitchJitter 4.6s steps(1, end) infinite;
}

.meta-title-glitch::before,
.meta-title-glitch::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  pointer-events: none;
}

.meta-title-glitch::before {
  color: rgba(255, 116, 186, 0.75);
  text-shadow: -1px 0 rgba(255, 116, 186, 0.5);
  animation: titleGlitchSliceA 4.6s steps(1, end) infinite;
}

.meta-title-glitch::after {
  color: rgba(155, 182, 255, 0.72);
  text-shadow: 1px 0 rgba(155, 182, 255, 0.45);
  animation: titleGlitchSliceB 4.6s steps(1, end) infinite;
}

.meta-main {
  margin: 1px 0 0;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 800;
  color: #f6ecff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

.meta-sub-row {
  margin-top: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-pill {
  font-size: 11px;
  line-height: 1.2;
  border-radius: 999px;
  padding: 3px 8px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04));
  color: #eadbf7;
  backdrop-filter: blur(3px);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.meta-pill-time {
  color: #e7d6ff;
  border-color: rgba(199, 168, 255, 0.38);
}

.meta-pill-clock {
  color: #ffd3eb;
  border-color: rgba(255, 143, 206, 0.42);
}

.meta-right {
  display: grid;
  align-content: start;
  gap: 7px;
  justify-items: end;
  padding-top: 1px;
}

.meta-level,
.meta-rose {
  font-size: 11px;
  line-height: 1.2;
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.05)), rgba(255, 255, 255, 0.04);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 3px 10px rgba(8, 2, 15, 0.35);
}

.meta-level {
  color: #f7e5ff;
}

.meta-level::before {
  content: '◉';
  margin-right: 4px;
  color: rgba(207, 170, 255, 0.95);
}

.meta-rose {
  color: #ff9fda;
  border-color: rgba(255, 141, 207, 0.62);
}

.meta-rose::before {
  content: '✦';
  margin-right: 4px;
  color: rgba(255, 172, 223, 0.95);
}

.page-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
}

.tab-page {
  display: grid;
  gap: 10px;
}

.search-box {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 9px 12px;
  font-size: 13px;
  color: #ae98bb;
  background: rgba(255, 255, 255, 0.04);
}

.panel-card {
  border: 1px solid rgba(226, 157, 255, 0.2);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  padding: 10px;
  display: grid;
  gap: 10px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.panel-head h2,
.panel-head h3 {
  margin: 0;
  font-size: 16px;
  color: #f5e9ff;
}

.badge-hot {
  font-size: 11px;
  color: #ff89ce;
  border: 1px solid rgba(255, 137, 206, 0.5);
  border-radius: 999px;
  padding: 3px 8px;
}

.ghost-btn,
.action-btn,
.mini-btn {
  border: 1px solid rgba(255, 177, 248, 0.34);
  color: #f1ddff;
  background: linear-gradient(135deg, rgba(255, 91, 186, 0.2), rgba(122, 58, 255, 0.2)), rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.ghost-btn:hover,
.action-btn:hover,
.mini-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 189, 245, 0.65);
  box-shadow: 0 6px 14px rgba(191, 70, 255, 0.24);
}

.mini-btn {
  font-size: 11px;
  padding: 5px 8px;
  white-space: nowrap;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.overview-item {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.label {
  margin: 0;
  font-size: 11px;
  color: #c5b4cf;
}

.value {
  margin: 4px 0 0;
  font-size: 13px;
  color: #fff;
}

.overview-detail-list {
  margin-top: 4px;
  display: grid;
  gap: 4px;
}

.overview-detail-item {
  margin: 0;
  display: grid;
  grid-template-columns: 14px 1fr;
  align-items: start;
  gap: 4px;
}

.overview-detail-glyph {
  width: 14px;
  height: 14px;
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  color: #f0ceff;
}

.overview-detail-text {
  font-size: 12px;
  color: #efe2f7;
  line-height: 1.4;
  white-space: pre-line;
}

.overview-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.dialogue-list {
  display: grid;
  gap: 8px;
}

.dialogue-item {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 8px;
  display: grid;
  grid-template-columns: 38px 1fr auto;
  gap: 8px;
}

.dialogue-avatar,
.avatar,
.contact-avatar,
.nearby-avatar,
.profile-avatar,
.modal-avatar {
  --qos-ring-rgb: 170, 214, 255;
  border: 1px solid rgba(255, 235, 255, 0.3);
  position: relative;
  overflow: visible;
  background:
    conic-gradient(from 0deg, rgba(255, 130, 221, 0.35), rgba(116, 60, 197, 0.25), rgba(255, 130, 221, 0.35)),
    radial-gradient(circle at 30% 30%, #ff8fda, #8438a5 48%, #2f1949 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 0 2px rgba(34, 19, 50, 0.75),
    0 0 10px rgba(var(--qos-ring-rgb), 0.36);
}

.dialogue-avatar::before,
.avatar::before,
.contact-avatar::before,
.nearby-avatar::before,
.profile-avatar::before,
.modal-avatar::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 1px solid rgba(var(--qos-ring-rgb), 0.7);
  box-shadow:
    0 0 10px rgba(var(--qos-ring-rgb), 0.45),
    0 0 18px rgba(var(--qos-ring-rgb), 0.32);
  pointer-events: none;
}

.dialogue-avatar::after,
.avatar::after,
.contact-avatar::after,
.nearby-avatar::after,
.profile-avatar::after,
.modal-avatar::after {
  content: '♠';
  position: absolute;
  right: 2px;
  bottom: 0;
  font-size: 11px;
  color: rgba(255, 227, 248, 0.9);
  text-shadow: 0 0 8px rgba(var(--qos-ring-rgb), 0.5);
}

.contact-avatar.is-corruption-max::before,
.profile-avatar.is-corruption-max::before,
.modal-avatar.is-corruption-max::before {
  box-shadow:
    0 0 14px rgba(var(--qos-ring-rgb), 0.62),
    0 0 24px rgba(var(--qos-ring-rgb), 0.48);
  animation: avatarRingPulse 1.4s ease-in-out infinite;
}

.dialogue-avatar,
.avatar,
.contact-avatar,
.profile-avatar,
.modal-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

.dialogue-main {
  display: grid;
  gap: 3px;
}

.dialogue-name {
  margin: 0;
  font-size: 13px;
  color: #ffe0ff;
}

.dialogue-name span {
  color: #b79cc9;
}

.dialogue-text,
.dialogue-meta,
.post-text,
.post-meta,
.post-time,
.contact-quote,
.contact-time,
.line,
.line-sm,
.modal-quote {
  margin: 0;
  font-size: 12px;
  color: #d8cbdf;
  line-height: 1.45;
}

.line-multiline {
  white-space: pre-line;
}

.post-card,
.contact-card,
.nearby-card,
.profile-card {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.post-card {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 8px;
  padding: 10px;
}

.post-main,
.contact-main,
.nearby-main {
  display: grid;
  gap: 4px;
}

.post-name,
.contact-name,
.nearby-name,
.modal-name {
  margin: 0;
  font-size: 15px;
  color: #ffe4ff;
}

.post-tags,
.post-skill,
.nearby-role {
  margin: 0;
  font-size: 12px;
  color: #f5a9ff;
}

.hot-badge {
  align-self: stretch;
  margin: -10px -10px -10px 0;
  width: 40px;
  background: linear-gradient(180deg, #ff3d9b, #9f1d67);
  border-top-right-radius: 14px;
  border-bottom-left-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 194, 236, 0.6);
}

.contact-card {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 8px;
  padding: 10px;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.contact-card.corruption-max {
  border-color: rgba(255, 105, 146, 0.45);
  box-shadow:
    inset 0 0 18px rgba(209, 33, 99, 0.15),
    0 0 18px rgba(155, 40, 117, 0.2);
}

.contact-card.affection-max {
  border-color: rgba(145, 189, 255, 0.5);
  box-shadow:
    inset 0 0 18px rgba(77, 133, 255, 0.14),
    0 0 18px rgba(104, 155, 255, 0.22);
}

.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid;
  letter-spacing: 0.2px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.chip-icon {
  display: inline-grid;
  place-items: center;
  width: 14px;
  height: 14px;
  font-size: 12px;
  line-height: 1;
}

.icon-spade-broken {
  color: #ffd8f0;
  filter: drop-shadow(0 0 4px rgba(255, 101, 177, 0.55));
}

.icon-heart-chain {
  color: #ffb5dd;
  text-shadow:
    -1px 0 rgba(196, 220, 255, 0.5),
    1px 0 rgba(196, 220, 255, 0.5),
    0 0 6px rgba(255, 125, 197, 0.35);
}

.chip-purple {
  color: #e5b2ff;
  border-color: #b157ff;
  background: rgba(177, 87, 255, 0.16);
}

.chip-pink {
  color: #ff9fce;
  border-color: #ff5ca8;
  background: rgba(255, 92, 168, 0.15);
}

.hunter-ground {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  isolation: isolate;
}

.hunter-ground::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(130% 85% at 50% 0%, rgba(255, 147, 205, 0.08) 0%, rgba(0, 0, 0, 0) 68%),
    repeating-radial-gradient(circle at 50% 50%, rgba(255, 172, 227, 0.04) 0 1px, rgba(0, 0, 0, 0) 1px 17px),
    linear-gradient(165deg, rgba(47, 20, 39, 0.28), rgba(17, 12, 22, 0.22));
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.hunter-ground::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -30%;
  height: 46%;
  background: repeating-linear-gradient(
    180deg,
    rgba(255, 133, 203, 0.14) 0,
    rgba(255, 133, 203, 0.14) 1px,
    rgba(0, 0, 0, 0) 1px,
    rgba(0, 0, 0, 0) 6px
  );
  filter: blur(0.4px);
  opacity: 0.2;
  pointer-events: none;
  z-index: 0;
  animation: abyssDataFlow 5.8s linear infinite;
}

.hunter-ground > * {
  position: relative;
  z-index: 1;
}

.hunter-panel {
  position: relative;
  overflow: hidden;
}

.hunter-panel::before,
.hunter-panel::after {
  content: '';
  position: absolute;
  pointer-events: none;
  z-index: 0;
}

.hunter-panel::before {
  inset: 8px;
  border: 1px solid rgba(255, 80, 120, 0.18);
  border-radius: 14px;
}

.hunter-panel::after {
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    rgba(255, 103, 151, 0.05) 0,
    rgba(255, 103, 151, 0.05) 1px,
    rgba(0, 0, 0, 0) 1px,
    rgba(0, 0, 0, 0) 8px
  );
  opacity: 0.35;
}

.hunter-panel > * {
  position: relative;
  z-index: 1;
}

.nearby-card {
  padding: 10px;
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 8px;
  position: relative;
}

.queen-card {
  border: 1px solid rgba(224, 165, 117, 0.58);
  background: linear-gradient(145deg, rgba(42, 25, 28, 0.75), rgba(26, 12, 32, 0.62)), rgba(255, 255, 255, 0.03);
  box-shadow:
    inset 0 0 0 1px rgba(255, 222, 182, 0.22),
    0 0 18px rgba(196, 121, 88, 0.28);
  overflow: hidden;
}

.queen-card::before {
  content: 'Q♠';
  position: absolute;
  right: 6px;
  top: 2px;
  font-size: 38px;
  line-height: 1;
  color: rgba(255, 224, 191, 0.12);
  text-shadow: 0 0 10px rgba(229, 170, 126, 0.2);
  pointer-events: none;
}

.queen-card::after {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px dashed rgba(255, 146, 188, 0.24);
  border-radius: 10px;
  pointer-events: none;
}

.queen-badge {
  position: absolute;
  right: 8px;
  top: 8px;
  font-size: 10px;
  color: #ffd9b5;
  border: 1px solid rgba(255, 202, 158, 0.52);
  border-radius: 999px;
  padding: 2px 8px;
  background: rgba(79, 41, 31, 0.5);
  z-index: 2;
}

.queen-watermark {
  position: absolute;
  left: 8px;
  bottom: 4px;
  font-size: 28px;
  color: rgba(255, 191, 147, 0.18);
  pointer-events: none;
}

.queen-title {
  margin: 0;
  font-size: 11px;
  color: #ffd9bf;
  letter-spacing: 0.4px;
  text-shadow: 0 0 8px rgba(255, 173, 113, 0.32);
}

.distance {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 11px;
  color: #ffb6e4;
  background: rgba(255, 74, 170, 0.18);
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0 14px 0 12px;
  padding: 4px 8px;
}

.nearby-avatar {
  width: 60px;
  height: 90px;
  border-radius: 10px;
}

.queen-avatar {
  border-color: rgba(255, 203, 149, 0.62);
  background:
    radial-gradient(
      circle at 30% 30%,
      rgba(255, 213, 160, 0.5),
      rgba(111, 49, 95, 0.48) 50%,
      rgba(33, 18, 40, 0.9) 100%
    ),
    linear-gradient(140deg, rgba(145, 81, 52, 0.48), rgba(56, 24, 64, 0.6));
  box-shadow:
    inset 0 0 0 1px rgba(255, 220, 177, 0.28),
    0 0 12px rgba(255, 167, 109, 0.25);
}

.nearby-detail-list {
  display: grid;
  gap: 5px;
}

.nearby-detail-item {
  margin: 0;
  display: grid;
  grid-template-columns: 68px 1fr;
  gap: 6px;
  align-items: start;
}

.nearby-detail-label {
  font-size: 11px;
  color: #ffbde4;
  line-height: 1.35;
}

.nearby-detail-text {
  font-size: 12px;
  color: #d8cbdf;
  line-height: 1.45;
  white-space: pre-line;
}

.nearby-action {
  margin-top: 6px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.btn {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 6px;
  font-size: 12px;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.btn-primary {
  color: #ffd5ff;
  border-color: rgba(255, 173, 250, 0.7);
  background: rgba(255, 75, 176, 0.2);
}

.profile-head {
  justify-items: center;
  position: relative;
}

.profile-head::before,
.profile-head::after {
  content: '';
  position: absolute;
  width: 36px;
  height: 36px;
  border: 1px dashed rgba(255, 112, 128, 0.35);
  pointer-events: none;
}

.profile-head::before {
  left: 6px;
  top: 6px;
  border-right: 0;
  border-bottom: 0;
}

.profile-head::after {
  right: 6px;
  bottom: 6px;
  border-left: 0;
  border-top: 0;
}

.player-avatar-shell {
  position: relative;
  display: grid;
  place-items: center;
}

.player-lock-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 126, 136, 0.24);
  box-shadow: 0 0 12px rgba(255, 82, 120, 0.15);
  animation: monitorPulse 2.8s ease-in-out infinite;
  pointer-events: none;
}

.profile-avatar {
  width: 84px;
  height: 84px;
}

.player-avatar {
  border-color: rgba(220, 235, 255, 0.82);
  background:
    linear-gradient(145deg, rgba(237, 245, 255, 0.24), rgba(145, 177, 210, 0.14)),
    radial-gradient(circle at 30% 30%, rgba(236, 245, 255, 0.62), rgba(135, 103, 194, 0.24) 55%, rgba(35, 24, 48, 0.9));
}

.player-avatar.crack-stage-1 {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.15),
    0 0 0 2px rgba(40, 52, 74, 0.75),
    0 0 12px rgba(var(--qos-ring-rgb), 0.32),
    inset -18px 12px 22px rgba(86, 24, 98, 0.18);
}

.player-avatar.crack-stage-2 {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.12),
    0 0 0 2px rgba(40, 31, 59, 0.78),
    0 0 12px rgba(var(--qos-ring-rgb), 0.45),
    inset -24px 16px 26px rgba(75, 12, 84, 0.34);
  filter: saturate(1.08);
}

.profile-head h2 {
  margin: 0;
  font-size: 24px;
}

.profile-block {
  gap: 8px;
}

.sub-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.sub-tab {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  padding: 7px 0;
  background: rgba(255, 255, 255, 0.04);
  color: #ccb4db;
  font-size: 12px;
}

.sub-tab.active {
  background: rgba(255, 109, 204, 0.22);
  color: #ffe2f7;
}

.profile-card {
  padding: 10px;
  display: grid;
  gap: 6px;
}

.bottom-tabs {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(9, 7, 15, 0.96);
  padding: 8px 8px 10px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.nav-btn {
  border: 0;
  background: transparent;
  color: #a690b4;
  font-size: 12px;
  line-height: 1.2;
  padding: 6px 0;
  border-radius: 8px;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.nav-btn.active {
  color: #ffd5f4;
  font-weight: 700;
  background: linear-gradient(180deg, rgba(255, 70, 180, 0.12), rgba(150, 65, 255, 0.12));
  text-shadow: 0 0 8px rgba(255, 194, 236, 0.5);
}

.empty {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  color: #b19ac0;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: grid;
  place-items: center;
  padding: 12px;
  z-index: 20;
  overflow-y: auto;
}

.modal {
  width: min(100%, 420px);
  max-height: calc(100dvh - 24px);
  border-radius: 18px;
  border: 1px solid rgba(255, 183, 244, 0.32);
  background: linear-gradient(145deg, rgba(35, 20, 49, 0.7), rgba(23, 14, 34, 0.6)), rgba(18, 10, 28, 0.45);
  backdrop-filter: blur(12px) saturate(125%);
  -webkit-backdrop-filter: blur(12px) saturate(125%);
  padding: 16px;
  display: grid;
  gap: 10px;
  position: relative;
  overflow-y: auto;
  box-shadow:
    0 18px 30px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.modal.corruption-max {
  box-shadow:
    0 20px 34px rgba(0, 0, 0, 0.5),
    inset 0 0 26px rgba(170, 28, 94, 0.2),
    0 0 26px rgba(196, 57, 136, 0.24);
}

.modal.affection-max {
  box-shadow:
    0 20px 34px rgba(0, 0, 0, 0.48),
    inset 0 0 24px rgba(90, 126, 224, 0.18),
    0 0 24px rgba(123, 166, 255, 0.24);
}

.close {
  position: absolute;
  right: 10px;
  top: 8px;
  border: 0;
  font-size: 24px;
  line-height: 1;
  background: transparent;
  color: #b59fc7;
}

.modal-avatar {
  width: 84px;
  height: 84px;
  margin: 0 auto;
}

.modal-name,
.modal-quote {
  text-align: center;
}

.center {
  justify-content: center;
}

.modal-block {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 8px;
  display: grid;
  gap: 4px;
  background: rgba(20, 12, 30, 0.28);
}

.trait-list-wrap,
.tattoo-list-wrap {
  display: grid;
  gap: 6px;
}

.bond-meters {
  display: grid;
  gap: 6px;
}

.corruption-meter,
.affection-meter {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 6px 8px 8px;
  background: linear-gradient(180deg, rgba(26, 17, 39, 0.68), rgba(16, 10, 25, 0.6));
  overflow: hidden;
}

.corruption-meter::before,
.affection-meter::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.corruption-meter::before {
  background: radial-gradient(circle at 90% 0%, rgba(255, 96, 169, 0.15), rgba(0, 0, 0, 0));
}

.affection-meter::before {
  background: radial-gradient(circle at 10% 0%, rgba(156, 197, 255, 0.2), rgba(0, 0, 0, 0));
}

.meter-label,
.meter-value {
  margin: 0;
  font-size: 11px;
  position: relative;
  z-index: 1;
}

.meter-label {
  color: #c6b1d5;
}

.meter-value {
  color: #ffdff5;
  font-weight: 700;
}

.meter-track {
  position: relative;
  margin-top: 6px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.syringe-track {
  height: 10px;
  border: 1px solid rgba(214, 223, 255, 0.45);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(107, 123, 160, 0.08)), rgba(17, 13, 28, 0.62);
}

.meter-idle-glow {
  position: absolute;
  left: 0;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate(-30%, -50%);
  background: rgba(186, 102, 255, 0.55);
  box-shadow: 0 0 12px rgba(182, 98, 255, 0.5);
  z-index: 2;
  animation: idleTouch 1.8s ease-in-out infinite;
}

.meter-mark {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 9px;
  color: rgba(223, 205, 255, 0.45);
  z-index: 3;
  pointer-events: none;
}

.mark-30 {
  left: 30%;
}

.mark-50 {
  left: 50%;
}

.mark-100 {
  left: 100%;
  transform: translate(-100%, -50%);
}

.meter-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: inherit;
  transition: width 0.45s ease;
  z-index: 1;
}

.corruption-meter .meter-fill {
  width: var(--qos-corruption, 0%);
  background:
    radial-gradient(circle at 12% 35%, rgba(255, 224, 255, 0.24) 0 6%, rgba(0, 0, 0, 0) 7%),
    radial-gradient(circle at 37% 65%, rgba(255, 173, 255, 0.2) 0 5%, rgba(0, 0, 0, 0) 6%),
    radial-gradient(circle at 68% 45%, rgba(255, 142, 222, 0.18) 0 4%, rgba(0, 0, 0, 0) 5%),
    linear-gradient(90deg, #a089ff 0%, #8c54d2 40%, #5f2a80 65%, #291434 100%);
  box-shadow:
    0 0 8px rgba(166, 98, 255, 0.45),
    0 0 14px rgba(111, 42, 160, 0.35);
  animation: venomFlow 2.4s linear infinite;
}

.affection-meter .meter-fill {
  width: var(--qos-affection, 0%);
  background: linear-gradient(90deg, #a9d8ff 0%, #8fb4ff 30%, #bda8ff 58%, #ffe3a5 100%);
  box-shadow:
    0 0 8px rgba(137, 181, 255, 0.44),
    0 0 14px rgba(255, 210, 126, 0.28);
}

.corruption-meter.is-max {
  border-color: rgba(255, 101, 153, 0.66);
  box-shadow:
    inset 0 0 22px rgba(183, 45, 110, 0.26),
    0 0 16px rgba(177, 60, 144, 0.35);
}

.affection-meter.is-max {
  border-color: rgba(158, 196, 255, 0.74);
  box-shadow:
    inset 0 0 20px rgba(112, 144, 219, 0.24),
    0 0 16px rgba(146, 185, 255, 0.35);
}

.corruption-meter.is-max .meter-fill {
  background: linear-gradient(90deg, #c882ff 0%, #ff56b4 36%, #ff3f6a 68%, #ff9151 100%);
  animation: corruptionOverflow 1.2s linear infinite;
}

.affection-meter.is-max .meter-fill {
  background: linear-gradient(90deg, #b5e5ff 0%, #8eb6ff 28%, #c4b4ff 60%, #ffe2a7 100%);
  animation: affectionGuardian 1.6s ease-in-out infinite;
}

.profile-bond-meters {
  width: min(100%, 260px);
}

@keyframes corruptionOverflow {
  0% {
    filter: saturate(1) brightness(1);
  }
  50% {
    filter: saturate(1.35) brightness(1.24);
  }
  100% {
    filter: saturate(1) brightness(1);
  }
}

@keyframes affectionGuardian {
  0%,
  100% {
    filter: saturate(1) brightness(1);
  }
  50% {
    filter: saturate(1.2) brightness(1.2);
  }
}

@keyframes avatarRingPulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.28);
  }
}

@keyframes monitorPulse {
  0%,
  100% {
    opacity: 0.32;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.04);
  }
}

@keyframes venomFlow {
  0% {
    filter: hue-rotate(0deg) saturate(1);
  }
  50% {
    filter: hue-rotate(-12deg) saturate(1.16);
  }
  100% {
    filter: hue-rotate(0deg) saturate(1);
  }
}

@keyframes idleTouch {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.85;
  }
}

@keyframes sendBtnPulse {
  0%,
  100% {
    filter: brightness(1) saturate(1);
  }
  50% {
    filter: brightness(1.14) saturate(1.18);
  }
}

@keyframes sendBtnSheen {
  0% {
    left: -35%;
  }
  100% {
    left: 115%;
  }
}

@keyframes metaCodeRain {
  0% {
    transform: translateY(0);
    opacity: 0.14;
  }
  50% {
    opacity: 0.28;
  }
  100% {
    transform: translateY(36%);
    opacity: 0.12;
  }
}

@keyframes titleGlitchJitter {
  0%,
  86%,
  100% {
    transform: translate(0, 0);
  }
  88% {
    transform: translate(-0.4px, 0);
  }
  89% {
    transform: translate(0.7px, -0.2px);
  }
  90% {
    transform: translate(-0.2px, 0.25px);
  }
}

@keyframes titleGlitchSliceA {
  0%,
  86%,
  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
  88% {
    opacity: 1;
    transform: translate(-1px, 0);
    clip-path: inset(0 0 55% 0);
  }
  89% {
    opacity: 1;
    transform: translate(1px, 0);
    clip-path: inset(40% 0 20% 0);
  }
}

@keyframes titleGlitchSliceB {
  0%,
  86%,
  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
  88% {
    opacity: 1;
    transform: translate(1px, 0);
    clip-path: inset(58% 0 0 0);
  }
  90% {
    opacity: 1;
    transform: translate(-1px, 0);
    clip-path: inset(22% 0 48% 0);
  }
}

.trait-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.trait-item {
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: #eadcf3;
  font-size: 12px;
}

.trait-item.danger {
  color: #ffd8dd;
  border-color: rgba(255, 106, 129, 0.75);
  background: rgba(255, 58, 92, 0.18);
  box-shadow:
    0 0 10px rgba(255, 74, 110, 0.25),
    inset 0 0 12px rgba(255, 74, 110, 0.12);
  animation: traitPulse 2.2s ease-in-out infinite;
}

.tattoo-list {
  display: grid;
  gap: 6px;
}

.tattoo-item {
  margin: 0;
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: start;
  gap: 6px;
  font-size: 12px;
  color: #ded0ea;
  line-height: 1.45;
}

.tattoo-glyph {
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  font-size: 12px;
  color: #ffd5f2;
  border: 1px solid rgba(255, 184, 245, 0.45);
  border-radius: 4px 10px 8px 10px;
  background: linear-gradient(165deg, rgba(255, 95, 191, 0.24), rgba(130, 70, 255, 0.18));
  box-shadow: 0 0 10px rgba(201, 115, 255, 0.24);
}

.profile-tattoo-table {
  display: grid;
  gap: 6px;
}

.profile-tattoo-row {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(84px, 0.9fr) minmax(84px, 0.8fr) minmax(0, 1.7fr);
  align-items: start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(207, 138, 255, 0.22);
  background:
    linear-gradient(150deg, rgba(180, 96, 255, 0.15), rgba(118, 73, 219, 0.08) 40%, rgba(255, 99, 184, 0.08)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 10px rgba(174, 92, 255, 0.14);
}

.profile-tattoo-name {
  font-size: 13px;
  font-weight: 700;
  color: #f5e6ff;
}

.profile-tattoo-en {
  font-size: 12px;
  color: #f4d7ff;
  letter-spacing: 0.2px;
}

.profile-tattoo-imagery {
  font-size: 12px;
  color: #d7c4e7;
  line-height: 1.45;
  white-space: pre-line;
}

.tattoo-empty {
  margin: 4px 0 0;
  font-size: 12px;
  color: #b7a7c6;
}

.inventory-list {
  display: grid;
  gap: 7px;
}

.inventory-item {
  margin: 0;
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: start;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  color: #e9dbf3;
  line-height: 1.45;
  border: 1px solid rgba(226, 160, 255, 0.22);
  background:
    linear-gradient(155deg, rgba(191, 113, 255, 0.15), rgba(136, 79, 255, 0.06) 42%, rgba(255, 77, 166, 0.08)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 10px rgba(174, 92, 255, 0.16);
}

.inventory-glyph {
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  font-size: 11px;
  color: #ffdff8;
  border: 1px solid rgba(255, 197, 241, 0.45);
  border-radius: 4px 10px 8px 10px;
  background: linear-gradient(165deg, rgba(255, 104, 198, 0.22), rgba(136, 73, 255, 0.2));
  box-shadow: 0 0 10px rgba(187, 105, 255, 0.24);
}

.inventory-main {
  display: grid;
  gap: 2px;
}

.inventory-name {
  font-size: 14px;
  font-weight: 700;
  color: #f6e7ff;
  letter-spacing: 0.2px;
}

.inventory-detail {
  font-size: 12px;
  color: #cdb8dd;
  line-height: 1.4;
  white-space: pre-line;
}

.inventory-empty {
  margin: 4px 0 0;
  font-size: 12px;
  color: #b7a7c6;
}

.profile-meta-list {
  display: grid;
  gap: 8px;
}

.profile-meta-item {
  margin: 0;
  display: grid;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(176, 165, 255, 0.2);
  background:
    linear-gradient(150deg, rgba(121, 95, 244, 0.14), rgba(86, 62, 188, 0.08) 42%, rgba(102, 86, 199, 0.06)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 8px rgba(124, 98, 233, 0.14);
}

.contact-tattoo-table {
  display: grid;
  gap: 6px;
}

.contact-tattoo-row {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(84px, 0.9fr) minmax(84px, 0.8fr) minmax(0, 1.7fr);
  align-items: start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(214, 153, 255, 0.25);
  background:
    linear-gradient(145deg, rgba(196, 105, 255, 0.17), rgba(116, 71, 224, 0.1) 40%, rgba(255, 102, 190, 0.09)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 11px rgba(188, 102, 255, 0.16);
}

.contact-tattoo-name {
  font-size: 13px;
  font-weight: 700;
  color: #f8e9ff;
}

.contact-tattoo-en {
  font-size: 12px;
  color: #f5dcff;
  letter-spacing: 0.2px;
}

.contact-tattoo-imagery {
  font-size: 12px;
  color: #ddc9ec;
  line-height: 1.45;
  white-space: pre-line;
}

.contact-detail-list {
  display: grid;
  gap: 7px;
}

.contact-detail-item {
  margin: 0;
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: start;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(222, 168, 255, 0.24);
  background:
    linear-gradient(155deg, rgba(197, 118, 255, 0.15), rgba(138, 80, 255, 0.08) 42%, rgba(255, 92, 178, 0.08)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 10px rgba(183, 96, 255, 0.16);
}

.contact-detail-glyph {
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  font-size: 11px;
  color: #ffe1f9;
  border: 1px solid rgba(255, 202, 246, 0.45);
  border-radius: 4px 10px 8px 10px;
  background: linear-gradient(165deg, rgba(255, 112, 203, 0.22), rgba(144, 80, 255, 0.2));
  box-shadow: 0 0 10px rgba(194, 110, 255, 0.24);
}

.contact-detail-main {
  display: grid;
  gap: 2px;
}

.contact-detail-name {
  font-size: 14px;
  font-weight: 700;
  color: #f8eaff;
  letter-spacing: 0.2px;
}

.contact-detail-desc {
  font-size: 12px;
  color: #d7c2e8;
  line-height: 1.4;
  white-space: pre-line;
}

.contact-empty {
  margin: 4px 0 0;
  font-size: 12px;
  color: #bdaed0;
}

.profile-meta-label {
  margin: 0;
  font-size: 11px;
  color: #bbaedf;
  letter-spacing: 0.2px;
}

.profile-meta-value {
  font-size: 14px;
  font-weight: 700;
  color: #f3e8ff;
}

.profile-meta-item-corruption {
  border-color: rgba(255, 120, 174, 0.28);
  background:
    linear-gradient(145deg, rgba(177, 68, 150, 0.2), rgba(122, 67, 166, 0.1) 38%, rgba(255, 89, 139, 0.12)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 10px rgba(226, 96, 163, 0.18);
}

.profile-meta-item-status {
  gap: 8px;
  border-color: rgba(170, 150, 255, 0.24);
  background:
    linear-gradient(155deg, rgba(138, 113, 255, 0.14), rgba(104, 79, 255, 0.08) 40%, rgba(199, 119, 255, 0.08)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 10px rgba(131, 97, 255, 0.15);
}

.status-list {
  display: grid;
  gap: 6px;
}

.status-item {
  margin: 0;
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: start;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 10px;
  font-size: 12px;
  color: #e4d5ef;
  line-height: 1.45;
  border: 1px solid rgba(170, 150, 255, 0.24);
  background:
    linear-gradient(155deg, rgba(138, 113, 255, 0.14), rgba(104, 79, 255, 0.08) 40%, rgba(199, 119, 255, 0.08)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 10px rgba(131, 97, 255, 0.15);
}

.status-glyph {
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  font-size: 11px;
  color: #dcd2ff;
  border: 1px solid rgba(190, 184, 255, 0.45);
  border-radius: 4px 10px 8px 10px;
  background: linear-gradient(165deg, rgba(147, 128, 255, 0.24), rgba(122, 88, 255, 0.18));
  box-shadow: 0 0 10px rgba(138, 113, 255, 0.24);
}

.status-empty {
  margin: 4px 0 0;
  font-size: 12px;
  color: #b7a7c6;
}

@keyframes traitPulse {
  0%,
  100% {
    box-shadow:
      0 0 10px rgba(255, 74, 110, 0.2),
      inset 0 0 10px rgba(255, 74, 110, 0.08);
  }
  50% {
    box-shadow:
      0 0 16px rgba(255, 74, 110, 0.42),
      inset 0 0 14px rgba(255, 74, 110, 0.16);
  }
}

.block-title {
  margin: 0;
  font-size: 12px;
  color: #ffc0f0;
  font-weight: 700;
}

.send-btn {
  border: 0;
  border-radius: 12px;
  padding: 10px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(105deg, rgba(184, 200, 255, 0.28), rgba(255, 255, 255, 0) 24%),
    linear-gradient(90deg, #8430f5, #ff3ba6 56%, #ff5768 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    0 8px 20px rgba(171, 61, 194, 0.28);
  animation: sendBtnPulse 2.2s ease-in-out infinite;
}

.send-btn::before {
  content: '♠';
  margin-right: 6px;
  position: relative;
  z-index: 1;
}

.send-btn::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -30%;
  width: 30%;
  transform: skewX(-20deg);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0));
  animation: sendBtnSheen 2.8s linear infinite;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  background: #22162f;
  border: 1px solid #6d4b85;
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 12px;
  z-index: 30;
}
</style>
