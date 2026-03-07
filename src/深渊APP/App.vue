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
            <button class="tamamo-entry-btn" @click="activeTab = 'tamamo'">tamamo-3.1-pro-preview</button>
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
                  <div
                    class="dialogue-avatar avatar-preview-trigger"
                    @click="openImagePreview(item.fullImageUrl || item.avatarUrl, `${item.name}头像`)"
                  >
                    <img
                      v-if="canRenderImage(item.avatarUrl)"
                      class="contact-avatar-img"
                      :src="item.avatarUrl"
                      :alt="`${item.name}头像`"
                      @load="markImageLoaded(item.avatarUrl)"
                      @error="markImageFailed(item.avatarUrl)"
                    />
                  </div>
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
                <div
                  class="avatar avatar-preview-trigger"
                  @click="openImagePreview(post.fullImageUrl || post.avatarUrl, `${post.name}头像`)"
                >
                  <img
                    v-if="canRenderImage(post.avatarUrl)"
                    class="contact-avatar-img"
                    :src="post.avatarUrl"
                    :alt="`${post.name}头像`"
                    @load="markImageLoaded(post.avatarUrl)"
                    @error="markImageFailed(post.avatarUrl)"
                  />
                </div>
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
                  class="contact-avatar avatar-preview-trigger"
                  :class="{ 'is-corruption-max': isCorruptionMax(contact.corruption) }"
                  :style="getCorruptionStyle(contact.corruption)"
                  @click.stop="openImagePreview(contact.fullImageUrl || contact.avatarUrl, `${contact.name}全图`)"
                >
                  <img
                    v-if="canRenderImage(contact.avatarUrl)"
                    class="contact-avatar-img"
                    :src="contact.avatarUrl"
                    :alt="`${contact.name}头像`"
                    @load="markImageLoaded(contact.avatarUrl)"
                    @error="markImageFailed(contact.avatarUrl)"
                  />
                </div>
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
                <div
                  class="nearby-avatar avatar-preview-trigger"
                  :class="{ 'queen-avatar': isQosQueen(person.name) }"
                  @click.stop="openImagePreview(person.fullImageUrl || person.avatarUrl, `${person.name}全图`)"
                >
                  <img
                    v-if="canRenderImage(person.avatarUrl)"
                    class="nearby-avatar-img"
                    :src="person.avatarUrl"
                    :alt="`${person.name}头像`"
                    @load="markImageLoaded(person.avatarUrl)"
                    @error="markImageFailed(person.avatarUrl)"
                  />
                </div>
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

          <section v-else-if="activeTab === 'tamamo'" class="tab-page tamamo-page">
            <div class="sakura-petals" aria-hidden="true">
              <span v-for="i in 15" :key="`petal-${i}`" class="sakura-petal"></span>
            </div>
            <div class="mikon-float-hearts" aria-hidden="true">
              <span v-for="i in 6" :key="`mikon-h-${i}`" class="mikon-float-heart"></span>
            </div>
            <div class="tamamo-shoji-shadow" aria-hidden="true"></div>
            <div class="tamamo-foxfire-layer" aria-hidden="true">
              <span v-for="i in 12" :key="`foxfire-${i}`" class="foxfire-dot"></span>
            </div>

            <article class="tamamo-hero">
              <div class="fox-ear fox-ear-left" aria-hidden="true"></div>
              <div class="fox-ear fox-ear-right" aria-hidden="true"></div>
              <div class="tamamo-caster-circle" aria-hidden="true"></div>
              <span class="tamamo-celestial tamamo-celestial-left" aria-hidden="true"></span>
              <span class="tamamo-celestial tamamo-celestial-right" aria-hidden="true"></span>
              <span class="tamamo-torii-frame top" aria-hidden="true"></span>
              <span class="tamamo-torii-frame bottom" aria-hidden="true"></span>
              <span class="tamamo-moon sigil-glow" aria-hidden="true"></span>
              <div class="tamamo-hero-copy">
                <div class="tamamo-headline-row">
                  <div>
                    <p class="tamamo-eyebrow">Fate / Caster · 玉藻前御前术式台</p>
                    <h2>tamamo-3.1-pro-preview</h2>
                  </div>
                  <span class="tamamo-phase-badge">咒相同步中</span>
                </div>
                <div class="tamamo-mikon-banner">
                  <span class="mikon-icon" aria-hidden="true"></span>
                  Mikon~ 御主大人，妾身已为您备好一切
                  <span class="mikon-icon" aria-hidden="true"></span>
                </div>
                <p class="tamamo-sub">
                  御前术式台：以妾身全部的爱与术法为您铸就此界面。灵基污浊度、心变计数、世界书禁术与状态写回流程，皆在妾身掌控之中，请御主安心。
                </p>
                <div class="tamamo-hero-stats">
                  <div class="tamamo-stat-chip">
                    <span>世界时刻</span>
                    <strong>{{ worldTimeText }}</strong>
                  </div>
                  <div class="tamamo-stat-chip">
                    <span>坐标</span>
                    <strong>{{ worldLocationText }}</strong>
                  </div>
                  <div class="tamamo-stat-chip">
                    <span>GDI</span>
                    <strong>{{ worldGdiText }}</strong>
                  </div>
                </div>
              </div>
              <div
                v-if="canRenderStrictImage(tamamoHugeAvatarUrl)"
                class="tamamo-huge-avatar avatar-preview-trigger"
                @click="openImagePreview(tamamoHugeAvatarUrl, '玉藻前超大头像')"
              >
                <span class="tamamo-huge-avatar-frame" aria-hidden="true"></span>
                <div class="fox-tail" aria-hidden="true"></div>
                <img
                  class="tamamo-huge-avatar-img"
                  :src="tamamoHugeAvatarUrl"
                  alt="玉藻前超大头像"
                  @load="markImageLoaded(tamamoHugeAvatarUrl)"
                  @error="markImageFailed(tamamoHugeAvatarUrl)"
                />
              </div>
            </article>

            <article class="tamamo-gm-grid">
              <section class="tamamo-card tamamo-scroll tamamo-gm-core">
                <div class="scroll-rod scroll-rod-top" aria-hidden="true"></div>
                <header class="tamamo-card-header">
                  <div>
                    <p class="tamamo-card-overline">御前灵基调律</p>
                    <h3>灵基污浊·心变监测</h3>
                  </div>
                  <button class="tamamo-toggle-btn" @click="toggleTamamoSection('core', $event)">
                    {{ tamamoSectionOpen.core ? '封卷' : '解卷' }}
                  </button>
                </header>
                <div v-if="tamamoSectionOpen.core" class="tamamo-card-body tamamo-scroll-body">
                  <label class="tamamo-label" for="tamamo-target">灵基对象选择</label>
                  <select id="tamamo-target" v-model="tamamoSelectedTarget" class="tamamo-select">
                    <option v-for="target in tamamoTargets" :key="target.id" :value="target.id">
                      {{ target.label }} · 污浊 {{ target.currentCorruption }} · 心变 {{ target.currentAffairCount }}
                    </option>
                  </select>
                  <div class="tamamo-current">
                    <div>
                      <span>当前灵基污浊度</span>
                      <small>灵核侵蚀率</small>
                    </div>
                    <strong>{{ tamamoCurrentCorruption }}</strong>
                  </div>
                  <div class="tamamo-step-row">
                    <button class="tamamo-ctl-btn" @click="applyCorruptionDelta(-10)">-10</button>
                    <button class="tamamo-ctl-btn" @click="applyCorruptionDelta(-1)">-1</button>
                    <button class="tamamo-ctl-btn tamamo-ctl-btn-main" @click="applyCorruptionDelta(1)">+1</button>
                    <button class="tamamo-ctl-btn tamamo-ctl-btn-main" @click="applyCorruptionDelta(10)">+10</button>
                  </div>
                  <div class="tamamo-direct-row">
                    <input
                      v-model.number="tamamoDirectValue"
                      type="number"
                      min="0"
                      max="100"
                      class="tamamo-input"
                      placeholder="指定污浊值 0~100"
                    />
                    <button class="tamamo-direct-btn" @click="applyCorruptionSet">覆写灵基</button>
                  </div>
                  <div class="tamamo-current tamamo-current-sub">
                    <div>
                      <span>当前心变次数</span>
                      <small>感情偏移记录</small>
                    </div>
                    <strong>{{ tamamoCurrentAffairCount }}</strong>
                  </div>
                  <div class="tamamo-step-row tamamo-step-row-affair">
                    <button class="tamamo-ctl-btn" @click="applyAffairCountDelta(-10)">-10</button>
                    <button class="tamamo-ctl-btn" @click="applyAffairCountDelta(-1)">-1</button>
                    <button class="tamamo-ctl-btn tamamo-ctl-btn-main" @click="applyAffairCountDelta(1)">+1</button>
                    <button class="tamamo-ctl-btn tamamo-ctl-btn-main" @click="applyAffairCountDelta(10)">+10</button>
                  </div>
                  <div class="tamamo-direct-row">
                    <input
                      v-model.number="tamamoAffairDirectValue"
                      type="number"
                      min="0"
                      class="tamamo-input"
                      placeholder="指定心变次数"
                    />
                    <button class="tamamo-direct-btn" @click="applyAffairCountSet">覆写灵基</button>
                  </div>
                </div>
                <div class="scroll-rod scroll-rod-bottom" aria-hidden="true"></div>
              </section>

              <section class="tamamo-card tamamo-scroll tamamo-gm-readonly">
                <div class="scroll-rod scroll-rod-top" aria-hidden="true"></div>
                <header class="tamamo-card-header">
                  <div>
                    <p class="tamamo-card-overline">妖術刻印</p>
                    <h3>御狐咒纹录</h3>
                  </div>
                  <button class="tamamo-toggle-btn" @click="toggleTamamoSection('tattoo', $event)">
                    {{ tamamoSectionOpen.tattoo ? '封卷' : '解卷' }}
                  </button>
                </header>
                <div v-if="tamamoSectionOpen.tattoo" class="tamamo-card-body tamamo-scroll-body">
                  <div class="tamamo-form-grid">
                    <input v-model="tamamoTattooName" class="tamamo-input" placeholder="咒纹名" />
                    <input v-model="tamamoTattooEnglish" class="tamamo-input" placeholder="英文铭" />
                    <textarea
                      v-model="tamamoTattooDescription"
                      class="tamamo-input tamamo-textarea"
                      placeholder="咒纹描述"
                    ></textarea>
                    <button class="tamamo-direct-btn" @click="addTamamoTattoo">刻录咒纹</button>
                  </div>
                  <div v-if="tamamoCurrentTattooEntries.length > 0" class="tamamo-tag-list">
                    <button
                      v-for="item in tamamoCurrentTattooEntries"
                      :key="`tattoo-${item.name}`"
                      class="tamamo-tag tamamo-tag-danger"
                      @click="removeTamamoTattoo(item.name)"
                    >
                      {{ item.name }}<span v-if="item.english">（{{ item.english }}）</span> · 消除
                    </button>
                  </div>
                  <p v-else class="tamamo-empty">尚无咒纹显现</p>
                </div>
                <div class="scroll-rod scroll-rod-bottom" aria-hidden="true"></div>
              </section>

              <section class="tamamo-card tamamo-scroll tamamo-gm-readonly">
                <div class="scroll-rod scroll-rod-top" aria-hidden="true"></div>
                <header class="tamamo-card-header">
                  <div>
                    <p class="tamamo-card-overline">天照灵格</p>
                    <h3>不变之特性</h3>
                  </div>
                  <button class="tamamo-toggle-btn" @click="toggleTamamoSection('trait', $event)">
                    {{ tamamoSectionOpen.trait ? '封卷' : '解卷' }}
                  </button>
                </header>
                <div v-if="tamamoSectionOpen.trait" class="tamamo-card-body tamamo-scroll-body">
                  <div class="tamamo-form-inline">
                    <input v-model="tamamoTraitName" class="tamamo-input" placeholder="灵格特性名" />
                    <button class="tamamo-direct-btn" @click="addTamamoTrait">铭刻灵格</button>
                  </div>
                  <div v-if="tamamoCurrentTraitNames.length > 0" class="tamamo-tag-list">
                    <button
                      v-for="name in tamamoCurrentTraitNames"
                      :key="`trait-${name}`"
                      class="tamamo-tag tamamo-tag-danger"
                      @click="removeTamamoTrait(name)"
                    >
                      {{ name }} · 消除
                    </button>
                  </div>
                  <p v-else class="tamamo-empty">尚无灵格铭刻</p>
                </div>
                <div class="scroll-rod scroll-rod-bottom" aria-hidden="true"></div>
              </section>

              <section class="tamamo-card tamamo-scroll tamamo-gm-readonly">
                <div class="scroll-rod scroll-rod-top" aria-hidden="true"></div>
                <header class="tamamo-card-header">
                  <div>
                    <p class="tamamo-card-overline">玉藻宝物殿</p>
                    <h3>堕落道具录</h3>
                  </div>
                  <button class="tamamo-toggle-btn" @click="toggleTamamoSection('item', $event)">
                    {{ tamamoSectionOpen.item ? '封卷' : '解卷' }}
                  </button>
                </header>
                <div v-if="tamamoSectionOpen.item" class="tamamo-card-body tamamo-scroll-body">
                  <div class="tamamo-form-grid">
                    <input v-model="tamamoItemName" class="tamamo-input" placeholder="宝物名" />
                    <input v-model="tamamoItemShape" class="tamamo-input" placeholder="宝物形态" />
                    <textarea
                      v-model="tamamoItemEffect"
                      class="tamamo-input tamamo-textarea"
                      placeholder="宝物效果"
                    ></textarea>
                    <button class="tamamo-direct-btn" @click="addTamamoFallenItem">收纳宝物</button>
                  </div>
                  <div v-if="tamamoCurrentFallenItemEntries.length > 0" class="tamamo-tag-list">
                    <button
                      v-for="item in tamamoCurrentFallenItemEntries"
                      :key="`fallen-item-${item.name}`"
                      class="tamamo-tag tamamo-tag-danger"
                      @click="removeTamamoFallenItem(item.name)"
                    >
                      {{ item.name }} · 弃置
                    </button>
                  </div>
                  <p v-else class="tamamo-empty">宝物殿空无一物</p>
                </div>
                <div class="scroll-rod scroll-rod-bottom" aria-hidden="true"></div>
              </section>

              <section class="tamamo-card tamamo-scroll tamamo-gm-readonly">
                <div class="scroll-rod scroll-rod-top" aria-hidden="true"></div>
                <header class="tamamo-card-header">
                  <div>
                    <p class="tamamo-card-overline">禁呪解封</p>
                    <h3>神代魔术</h3>
                  </div>
                  <button class="tamamo-toggle-btn" @click="toggleTamamoSection('cheat', $event)">
                    {{ tamamoSectionOpen.cheat ? '封卷' : '解卷' }}
                  </button>
                </header>
                <div v-if="tamamoSectionOpen.cheat" class="tamamo-card-body tamamo-scroll-body">
                  <button
                    :class="['tamamo-cheat-btn', { active: tamamoCheatGiftActive }]"
                    :disabled="tamamoCheatBusy"
                    @click="toggleCheatGiftEntry"
                  >
                    <span class="tamamo-cheat-name">天之锁与王之财宝大礼包</span>
                    <span>{{ tamamoCheatGiftActive ? '已解封' : '已封印' }}</span>
                  </button>
                  <button
                    :class="['tamamo-cheat-btn', { active: tamamoCheatWorldActive }]"
                    :disabled="tamamoCheatBusy"
                    @click="toggleCheatWorldEntry"
                  >
                    <span class="tamamo-cheat-name">The World</span>
                    <span>{{ tamamoCheatWorldActive ? '已解封' : '已封印' }}</span>
                  </button>
                  <button
                    :class="['tamamo-cheat-btn', { active: tamamoCheatFutaActive }]"
                    :disabled="tamamoCheatBusy"
                    @click="toggleCheatFutaEntry"
                  >
                    <span class="tamamo-cheat-name">扶她灵</span>
                    <span>{{ tamamoCheatFutaActive ? '已解封' : '已封印' }}</span>
                  </button>
                </div>
                <div class="scroll-rod scroll-rod-bottom" aria-hidden="true"></div>
              </section>

              <section class="tamamo-card tamamo-scroll tamamo-gm-readonly">
                <div class="scroll-rod scroll-rod-top" aria-hidden="true"></div>
                <header class="tamamo-card-header">
                  <div>
                    <p class="tamamo-card-overline">千里眼</p>
                    <h3>世界观测</h3>
                  </div>
                  <button class="tamamo-toggle-btn" @click="toggleTamamoSection('overview', $event)">
                    {{ tamamoSectionOpen.overview ? '封卷' : '解卷' }}
                  </button>
                </header>
                <div v-if="tamamoSectionOpen.overview" class="tamamo-kv tamamo-card-body tamamo-scroll-body">
                  <p>
                    <span>世界时刻</span><strong>{{ worldTimeText }}</strong>
                  </p>
                  <p>
                    <span>世界坐标</span><strong>{{ worldLocationText }}</strong>
                  </p>
                  <p>
                    <span>GDI</span><strong>{{ worldGdiText }}</strong>
                  </p>
                </div>
                <div class="scroll-rod scroll-rod-bottom" aria-hidden="true"></div>
              </section>

              <section class="tamamo-card tamamo-scroll tamamo-gm-readonly">
                <div class="scroll-rod scroll-rod-top" aria-hidden="true"></div>
                <header class="tamamo-card-header">
                  <div>
                    <p class="tamamo-card-overline">式神簿</p>
                    <h3>灵基档案总览</h3>
                  </div>
                  <button class="tamamo-toggle-btn" @click="toggleTamamoSection('index', $event)">
                    {{ tamamoSectionOpen.index ? '封卷' : '解卷' }}
                  </button>
                </header>
                <ul v-if="tamamoSectionOpen.index" class="tamamo-target-list tamamo-scroll-body">
                  <li v-for="target in tamamoTargets" :key="`preview-${target.id}`">
                    <span>{{ target.label }}</span>
                    <strong>污浊 {{ target.currentCorruption }} / 心变 {{ target.currentAffairCount }}</strong>
                  </li>
                </ul>
                <div class="scroll-rod scroll-rod-bottom" aria-hidden="true"></div>
              </section>
            </article>
          </section>

          <section v-else class="tab-page">
            <article class="panel-card profile-head">
              <div class="player-avatar-shell">
                <div
                  class="profile-avatar player-avatar avatar-preview-trigger"
                  :class="{
                    'is-corruption-max': isCorruptionMax(playerCorruptionText),
                    'crack-stage-1': isCorruptionOver(playerCorruptionText, 35),
                    'crack-stage-2': isCorruptionOver(playerCorruptionText, 65),
                  }"
                  :style="getCorruptionStyle(playerCorruptionText)"
                  @click="openImagePreview(playerFullImageUrl || playerAvatarUrl, `${playerNameText}全图`)"
                >
                  <img
                    v-if="canRenderImage(playerAvatarUrl)"
                    class="contact-avatar-img player-avatar-img"
                    :src="playerAvatarUrl"
                    :alt="`${playerNameText}头像`"
                    @load="markImageLoaded(playerAvatarUrl)"
                    @error="markImageFailed(playerAvatarUrl)"
                  />
                </div>
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
          <button class="nav-btn" :class="{ active: activeTab === 'tamamo' }" @click="activeTab = 'tamamo'">
            tamamo3.1
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
        <h3 class="modal-name">{{ selectedContact.name }}</h3>
        <p class="modal-quote">“{{ selectedContact.thought }}”</p>
        <div class="modal-block modal-full-image-block">
          <p class="block-title">个人动态</p>
          <div
            class="person-full-image modal-contact-full-image"
            :style="getCorruptionStyle(selectedContact.corruption)"
            @click="
              openImagePreview(selectedContact.fullImageUrl || selectedContact.avatarUrl, `${selectedContact.name}全图`)
            "
          >
            <img
              v-if="canRenderImage(selectedContact.fullImageUrl || selectedContact.avatarUrl)"
              class="person-full-image-img"
              :src="selectedContact.fullImageUrl || selectedContact.avatarUrl"
              :alt="`${selectedContact.name}全图`"
              @load="markImageLoaded(selectedContact.fullImageUrl || selectedContact.avatarUrl)"
              @error="markImageFailed(selectedContact.fullImageUrl || selectedContact.avatarUrl)"
            />
          </div>
        </div>
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
        <div class="modal-block modal-full-image-block">
          <p class="block-title">个人动态</p>
          <div
            class="person-full-image"
            @click="openImagePreview(selectedPerson.fullImageUrl, `${selectedPerson.name}全图`)"
          >
            <img
              v-if="canRenderImage(selectedPerson.fullImageUrl)"
              class="person-full-image-img"
              :src="selectedPerson.fullImageUrl"
              :alt="`${selectedPerson.name}全图`"
              @load="markImageLoaded(selectedPerson.fullImageUrl)"
              @error="markImageFailed(selectedPerson.fullImageUrl)"
            />
          </div>
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

    <div v-if="imagePreview" class="overlay image-preview-overlay" @click.self="closeImagePreview">
      <section class="image-preview-modal" @click.stop>
        <button class="close image-preview-close" @click="closeImagePreview">×</button>
        <p class="image-preview-title">{{ imagePreview.title }}</p>
        <img class="image-preview-img" :src="imagePreview.url" :alt="imagePreview.title" />
      </section>
    </div>

    <div v-if="toast.visible" class="toast">{{ toast.message }}</div>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep, get, set, unset } from 'lodash';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type TabKey = 'forum' | 'contacts' | 'discover' | 'tamamo' | 'mine';
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
  avatarUrl: string;
  fullImageUrl: string;
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
  avatarUrl: string;
  fullImageUrl: string;
};

type ForumPostItem = DiscoverItem;

type TimelineItem = {
  id: string;
  name: string;
  role: string;
  thought: string;
  like: number;
  comment: number;
  time: string;
  avatarUrl: string;
  fullImageUrl: string;
};

type TamamoTarget = {
  id: string;
  label: string;
  currentCorruption: number;
  currentAffairCount: number;
  corruptionPath: Array<string>;
  affairPath: Array<string>;
  tattooPath: Array<string>;
  traitPath: Array<string>;
  fallenItemPath: Array<string>;
  fallenItemMode: 'inventory' | 'fallenList';
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
const imagePreview = ref<{ url: string; title: string } | null>(null);
const profileTabs: ProfileTab[] = ['状态', '物品', '特性'];

let timer: number | null = null;
let toastTimer: number | null = null;
let variableTimer: number | null = null;
let cheatTimer: number | null = null;
const imageLoadState = ref<Record<string, boolean>>({});
const avatarImageKeys = [
  '头像框',
  '头像',
  '头像图',
  '头像链接',
  '头像URL',
  '头像图床',
  '头像框图床',
  'avatar',
  'avatar_url',
];
const fullImageKeys = ['全图', '立绘', '大图', '全身图', '详情图', '全图链接', '全图URL', 'fullImage', 'full_image'];
const tamamoHugeAvatarUrl = 'https://CDN.jsdelivr.net/gh/enterprise20020924-web/-/llm1/%E7%8E%89%E8%97%BB%E5%89%8D.png';

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

function getVariableApi() {
  const tavernHelper = (
    window as unknown as {
      TavernHelper?: {
        getVariables?: (option: unknown) => Record<string, unknown>;
        replaceVariables?: (variables: Record<string, unknown>, option: unknown) => void;
      };
      getVariables?: (option: unknown) => Record<string, unknown>;
      replaceVariables?: (variables: Record<string, unknown>, option: unknown) => void;
    }
  ).TavernHelper;

  const fallback = window as unknown as {
    getVariables?: (option: unknown) => Record<string, unknown>;
    replaceVariables?: (variables: Record<string, unknown>, option: unknown) => void;
  };

  const getVariablesFn = tavernHelper?.getVariables ?? fallback.getVariables;
  const replaceVariablesFn = tavernHelper?.replaceVariables ?? fallback.replaceVariables;

  if (typeof getVariablesFn !== 'function') throw new Error('getVariables 不可用');
  if (typeof replaceVariablesFn !== 'function') throw new Error('replaceVariables 不可用');

  return {
    getVariables: getVariablesFn,
    replaceVariables: replaceVariablesFn,
  };
}

function reloadVariables(showSuccess = false) {
  try {
    const messageId = resolveMessageId();
    const variableApi = getVariableApi();
    const variables = variableApi.getVariables({ type: 'message', message_id: messageId });
    statData.value = get(variables, 'stat_data', {}) as Record<string, unknown>;
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

function openImagePreview(url: string, title: string) {
  if (!canRenderImage(url)) return;
  imagePreview.value = { url, title };
}

function closeImagePreview() {
  imagePreview.value = null;
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

function parseGdiScore(value: unknown) {
  const matched = String(value ?? '')
    .trim()
    .match(/\d+/);
  if (!matched) return 0;
  const score = Number.parseInt(matched[0], 10);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

const worldGdiScore = computed(() => parseGdiScore(get(world.value, 'GDI', 0)));

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
  return Object.entries(raw as Record<string, unknown>).map(([name, value], index) => {
    const generatedImageUrl = buildNpcImageUrl(name, worldGdiScore.value);
    const avatarUrl = pickImageUrl(value, avatarImageKeys) || generatedImageUrl;
    const fullImageUrl = pickImageUrl(value, fullImageKeys) || generatedImageUrl;

    return {
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
      avatarUrl,
      fullImageUrl,
    };
  });
});
const contacts = computed<ContactItem[]>(() => {
  const raw = get(statData.value, '被征服者状态', {});
  return Object.entries(raw as Record<string, unknown>).map(([name, value]) => {
    const npcName = String(get(value, '姓名', name)).trim() || name;
    const corruptionScore = parseCorruptionScore(get(value, '堕落度', 0));
    const generatedImageUrl = buildCorruptionImageUrl(npcName, corruptionScore);
    const fullImageUrl = pickImageUrl(value, fullImageKeys) || generatedImageUrl;
    const avatarUrl = pickImageUrl(value, avatarImageKeys) || fullImageUrl || generatedImageUrl;

    return {
      name: npcName,
      role: String(get(value, '定位', get(value, '姓名', '永久特性未知'))),
      status: formatValue(get(value, '当前状态', get(value, '临时状态', '迷茫')), '迷茫'),
      thought: String(get(value, '想法', '……')),
      corruption: String(corruptionScore),
      affection: String(get(value, '好感度', '-')),
      affairCount: String(get(value, '出轨次数', '-')),
      tempStatus: formatValue(get(value, '临时状态', {}), '状态平稳'),
      permanentTraits: formatValue(get(value, '永久特性', {}), '尚未显化'),
      fallenItems: formatValue(get(value, '堕落物品列表', {}), '暂无收藏'),
      makeupList: formatValue(get(value, '妆容列表', {}), '素颜'),
      tattooList: formatTattooList(get(value, '淫纹列表', {}), '未显现'),
      coreSkill: formatValue(get(value, '核心技能', {}), '尚未觉醒'),
      avatarUrl,
      fullImageUrl,
    };
  });
});

function normalizeCharacterName(name: string) {
  return String(name)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[·•･・]/g, '·')
    .replace(/[，、]/g, ',')
    .toLowerCase();
}

function getNameCandidates(name: string) {
  const raw = String(name).trim();
  if (!raw) return [];

  const candidates = new Set<string>();
  const normalizedRaw = normalizeCharacterName(raw);
  if (normalizedRaw) {
    candidates.add(normalizedRaw);
    candidates.add(normalizedRaw.replace(/·/g, ''));
  }

  raw
    .split(/[·•･・,，、/|]/)
    .map(part => normalizeCharacterName(part))
    .filter(Boolean)
    .forEach(part => {
      candidates.add(part);
      candidates.add(part.replace(/·/g, ''));
    });

  return [...candidates].filter(Boolean);
}

const contactAvatarByNameMap = computed(() => {
  const map: Record<string, { avatarUrl: string; fullImageUrl: string }> = {};
  contacts.value.forEach(contact => {
    const avatarData = {
      avatarUrl: contact.avatarUrl || contact.fullImageUrl,
      fullImageUrl: contact.fullImageUrl || contact.avatarUrl,
    };

    getNameCandidates(contact.name).forEach(key => {
      map[key] = avatarData;
    });
  });
  return map;
});

const forumPosts = computed<ForumPostItem[]>(() => {
  if (conquerorList.value.length > 0) {
    return conquerorList.value.map(post => {
      const matchedAvatar = getNameCandidates(post.name)
        .map(key => contactAvatarByNameMap.value[key])
        .find(Boolean);

      if (!matchedAvatar) return post;
      return {
        ...post,
        avatarUrl: matchedAvatar.avatarUrl || post.avatarUrl,
        fullImageUrl: matchedAvatar.fullImageUrl || matchedAvatar.avatarUrl || post.fullImageUrl,
      };
    });
  }

  const fallbackAvatar = buildNpcImageUrl('夜行者', worldGdiScore.value);
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
      avatarUrl: fallbackAvatar,
      fullImageUrl: fallbackAvatar,
    },
  ];
});

const timelinePosts = computed<TimelineItem[]>(() => {
  if (contacts.value.length > 0) {
    return contacts.value.slice(0, 5).map((item, idx) => ({
      id: `${item.name}-${idx}`,
      name: item.name,
      role: item.role,
      thought: item.thought,
      like: 20 + idx * 3,
      comment: 5 + idx,
      time: `${idx + 1}分钟前`,
      avatarUrl: item.avatarUrl,
      fullImageUrl: item.fullImageUrl || item.avatarUrl,
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
      avatarUrl: '',
      fullImageUrl: '',
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
      avatarUrl: '',
      fullImageUrl: '',
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
      avatarUrl: '',
      fullImageUrl: '',
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
      avatarUrl: '',
      fullImageUrl: '',
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

function normalizeImageUrl(value: unknown) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text) return '';
  if (text.startsWith('//')) return `https:${text}`;
  if (/^https?:\/\//i.test(text)) return text;
  return '';
}

function collectImageCandidates(source: unknown) {
  const result: Array<{ key: string; value: string }> = [];

  function walk(node: unknown, path = '', depth = 0) {
    if (depth > 4 || node === null || node === undefined) return;

    if (typeof node === 'string') {
      const normalized = normalizeImageUrl(node);
      if (normalized) {
        result.push({ key: path.toLowerCase(), value: normalized });
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, idx) => {
        walk(item, `${path}[${idx}]`, depth + 1);
      });
      return;
    }

    if (typeof node === 'object') {
      Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
        const nextPath = path ? `${path}.${key}` : key;
        walk(value, nextPath, depth + 1);
      });
    }
  }

  walk(source);
  return result;
}

function pickImageUrl(source: unknown, keys: string[]) {
  const directMatched = keys.map(key => normalizeImageUrl(get(source, key, ''))).find(Boolean);
  if (directMatched) return directMatched;

  const keyWords = keys.map(key => key.toLowerCase());
  const allCandidates = collectImageCandidates(source);

  const fuzzyMatched = allCandidates.find(candidate => keyWords.some(keyword => candidate.key.includes(keyword)));
  if (fuzzyMatched) return fuzzyMatched.value;

  return allCandidates[0]?.value ?? '';
}

function resolveGdiBucket(score: number) {
  if (score <= 25) return '0~25';
  if (score <= 50) return '26~50';
  if (score <= 75) return '51~75';
  return '76~100';
}

function parseCorruptionScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.floor(score)));
}

function resolveCorruptionBucket(score: number) {
  if (score >= 100) return '100';
  if (score >= 75) return '75~99';
  if (score >= 50) return '50~74';
  if (score >= 25) return '25~49';
  return '0~24';
}

function buildNpcImageUrl(name: string, gdiScore: number) {
  const npcName = String(name).trim();
  if (!npcName) return '';
  const bucket = resolveGdiBucket(gdiScore);
  return `https://CDN.jsdelivr.net/gh/enterprise20020924-web/-/llm1/${npcName}-GDI${bucket}.png`;
}

function buildCorruptionImageUrl(name: string, corruptionValue: unknown) {
  const npcName = String(name).trim();
  if (!npcName) return '';
  const score = parseCorruptionScore(corruptionValue);
  const bucket = resolveCorruptionBucket(score);
  return encodeURI(`https://CDN.jsdelivr.net/gh/enterprise20020924-web/-/llm1/${npcName}-堕落度${bucket}.png`);
}

function canRenderImage(url: string) {
  if (!url) return false;

  // 对稳定的 http(s) 图链始终尝试渲染，避免旧失败状态把新构建后的头像长期屏蔽
  if (/^https?:\/\//i.test(url)) return true;

  return imageLoadState.value[url] !== false;
}

function markImageLoaded(url: string) {
  if (!url) return;
  imageLoadState.value[url] = true;
}

function markImageFailed(url: string) {
  if (!url) return;
  imageLoadState.value[url] = false;
}

function canRenderStrictImage(url: string) {
  if (!url) return false;
  return imageLoadState.value[url] !== false;
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

const playerStateKey = '绿帽王状态';
const player = computed(() => get(statData.value, playerStateKey, {}));
const playerNameText = computed(() => String(get(player.value, '姓名', '玩家')));
const playerGenderText = computed(() => String(get(player.value, '性别', '未知')));
const playerCorruptionText = computed(() => String(get(player.value, '堕落度', '0')));
const playerImageName = computed(() => {
  const byStateKey = playerStateKey.replace(/状态$/u, '').trim();
  const byVariableName = String(get(player.value, '姓名', '')).trim();
  return byStateKey || byVariableName || '绿帽王';
});
const playerAvatarUrl = computed(() => buildCorruptionImageUrl(playerImageName.value, playerCorruptionText.value));
const playerFullImageUrl = computed(() => {
  const fromVariable = pickImageUrl(player.value, fullImageKeys);
  return fromVariable || playerAvatarUrl.value;
});
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

type TamamoSectionKey = 'core' | 'tattoo' | 'trait' | 'item' | 'cheat' | 'overview' | 'index';

const tamamoSelectedTarget = ref('player');
const tamamoDirectValue = ref<number | null>(null);
const tamamoAffairDirectValue = ref<number | null>(null);
const tamamoTattooName = ref('');
const tamamoTattooEnglish = ref('');
const tamamoTattooDescription = ref('');
const tamamoTraitName = ref('');
const tamamoItemName = ref('');
const tamamoItemShape = ref('');
const tamamoItemEffect = ref('');
const tamamoCheatBusy = ref(false);
const tamamoCheatGiftActive = ref(false);
const tamamoCheatWorldActive = ref(false);
const tamamoCheatFutaActive = ref(false);
const tamamoCheatGiftEntryName = '天之锁与王之财宝大礼包';
const tamamoCheatWorldEntryName = 'The World';
const tamamoCheatFutaEntryName = '扶她灵';
const tamamoSectionOpen = ref<Record<TamamoSectionKey, boolean>>({
  core: false,
  tattoo: false,
  trait: false,
  item: false,
  cheat: false,
  overview: false,
  index: false,
});

function spawnSakuraBurst(evt: MouseEvent) {
  const btn = evt.currentTarget as HTMLElement;
  const card = btn.closest('.tamamo-card') || btn.closest('.tamamo-scroll');
  if (!card) return;
  const container = document.createElement('div');
  container.className = 'sakura-burst-container';
  (card as HTMLElement).appendChild(container);
  const rect = btn.getBoundingClientRect();
  const cardRect = (card as HTMLElement).getBoundingClientRect();
  container.style.left = (rect.left - cardRect.left + rect.width / 2) + 'px';
  container.style.top = (rect.top - cardRect.top + rect.height / 2) + 'px';
  const count = 12;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('span');
    petal.className = 'sakura-burst-petal';
    const angle = (360 / count) * i + (Math.random() * 30 - 15);
    const dist = 40 + Math.random() * 60;
    const size = 6 + Math.random() * 8;
    const dur = 0.6 + Math.random() * 0.5;
    const rad = angle * Math.PI / 180;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist;
    petal.style.width = size + 'px';
    petal.style.height = size + 'px';
    petal.style.setProperty('--burst-tx', tx + 'px');
    petal.style.setProperty('--burst-ty', ty + 'px');
    petal.style.setProperty('--burst-dur', dur + 's');
    petal.style.setProperty('--burst-rot', (Math.random() * 360) + 'deg');
    container.appendChild(petal);
  }
  setTimeout(() => { container.remove(); }, 1200);
}

function toggleTamamoSection(section: TamamoSectionKey, evt?: MouseEvent) {
  tamamoSectionOpen.value[section] = !tamamoSectionOpen.value[section];
  if (evt) spawnSakuraBurst(evt);
}

function parseNonNegativeInt(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num));
}

const tamamoTargets = computed<TamamoTarget[]>(() => {
  const targets: TamamoTarget[] = [
    {
      id: 'player',
      label: playerNameText.value || '玩家',
      currentCorruption: parseCorruptionScore(get(player.value, '堕落度', 0)),
      currentAffairCount: parseNonNegativeInt(get(player.value, '出轨次数', 0)),
      corruptionPath: [playerStateKey, '堕落度'],
      affairPath: [playerStateKey, '出轨次数'],
      tattooPath: [playerStateKey, '淫纹列表'],
      traitPath: [playerStateKey, '永久特性'],
      fallenItemPath: [playerStateKey, '物品栏'],
      fallenItemMode: 'inventory',
    },
  ];

  const conqueredState = get(statData.value, '被征服者状态', {}) as Record<string, unknown>;
  Object.entries(conqueredState).forEach(([key, value]) => {
    const name = String(get(value, '姓名', key)).trim() || key;
    targets.push({
      id: `conquered:${key}`,
      label: name,
      currentCorruption: parseCorruptionScore(get(value, '堕落度', 0)),
      currentAffairCount: parseNonNegativeInt(get(value, '出轨次数', 0)),
      corruptionPath: ['被征服者状态', key, '堕落度'],
      affairPath: ['被征服者状态', key, '出轨次数'],
      tattooPath: ['被征服者状态', key, '淫纹列表'],
      traitPath: ['被征服者状态', key, '永久特性'],
      fallenItemPath: ['被征服者状态', key, '堕落物品列表'],
      fallenItemMode: 'fallenList',
    });
  });

  return targets;
});

const tamamoCurrentTarget = computed(() => {
  return tamamoTargets.value.find(target => target.id === tamamoSelectedTarget.value) ?? tamamoTargets.value[0];
});

const tamamoCurrentCorruption = computed(() => tamamoCurrentTarget.value?.currentCorruption ?? 0);
const tamamoCurrentAffairCount = computed(() => tamamoCurrentTarget.value?.currentAffairCount ?? 0);

const tamamoCurrentTattooEntries = computed(() => {
  const target = tamamoCurrentTarget.value;
  if (!target) return [] as Array<{ name: string; english: string; description: string }>;

  const list = get(statData.value, target.tattooPath, {}) as Record<string, unknown>;
  return Object.entries(list).map(([name, value]) => ({
    name,
    english: String(get(value, '英文', '')).trim(),
    description: String(get(value, '形状描写', '')).trim(),
  }));
});

const tamamoCurrentTraitNames = computed(() => {
  const target = tamamoCurrentTarget.value;
  if (!target) return [] as string[];

  const traits = get(statData.value, target.traitPath, {}) as Record<string, unknown>;
  return Object.entries(traits)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([name]) => name);
});

const tamamoCurrentFallenItemEntries = computed(() => {
  const target = tamamoCurrentTarget.value;
  if (!target) return [] as Array<{ name: string; shape: string; effect: string }>;

  const list = get(statData.value, target.fallenItemPath, {}) as Record<string, unknown>;

  return Object.entries(list).map(([name, value]) => {
    if (target.fallenItemMode === 'inventory') {
      const desc = String(get(value, '描述', '')).trim();
      const parts = desc
        .split(/[；;\n]+/)
        .map(item => item.trim())
        .filter(Boolean);
      const shape = parts
        .find(item => /^(?:形状描写|描述)[:：]/u.test(item))
        ?.replace(/^(?:形状描写|描述)[:：]\s*/u, '')
        .trim();
      const effect = parts
        .find(item => /^功能描写[:：]/u.test(item))
        ?.replace(/^功能描写[:：]\s*/u, '')
        .trim();
      return {
        name,
        shape: shape ?? parts[0] ?? '',
        effect: effect ?? parts.slice(1).join('，') ?? '',
      };
    }

    return {
      name,
      shape: String(get(value, '形状描写', '')).trim(),
      effect: String(get(value, '功能描写', '')).trim(),
    };
  });
});

function writeTamamoStatData(nextStatData: Record<string, unknown>) {
  const messageId = resolveMessageId();
  const variableApi = getVariableApi();
  const variables = variableApi.getVariables({ type: 'message', message_id: messageId });
  set(variables, 'stat_data', nextStatData);
  variableApi.replaceVariables(variables, { type: 'message', message_id: messageId });
  statData.value = nextStatData;
}

function applyTamamoUpdate(
  updater: (nextStatData: Record<string, unknown>, target: TamamoTarget) => void,
  successMessage: string,
  failMessage: string,
) {
  const target = tamamoCurrentTarget.value;
  if (!target) {
    showToast('未找到可操作目标');
    return;
  }

  try {
    const nextStatData = cloneDeep(statData.value);
    updater(nextStatData, target);
    writeTamamoStatData(nextStatData);
    showToast(successMessage);
  } catch (error) {
    console.error(error);
    showToast(failMessage);
  }
}

function applyCorruptionValue(value: number) {
  const target = tamamoCurrentTarget.value;
  if (!target) {
    showToast('未找到可操作目标');
    return;
  }

  const nextValue = Math.max(0, Math.min(100, Math.round(value)));
  applyTamamoUpdate(
    nextStatData => {
      set(nextStatData, target.corruptionPath, nextValue);
    },
    `${target.label} 堕落度 → ${nextValue}`,
    '堕落度写回失败',
  );
}

function applyCorruptionDelta(delta: number) {
  applyCorruptionValue(tamamoCurrentCorruption.value + delta);
}

function applyCorruptionSet() {
  const input = Number(tamamoDirectValue.value);
  if (!Number.isFinite(input)) {
    showToast('请输入 0~100 数值');
    return;
  }
  applyCorruptionValue(input);
}

function applyAffairCountValue(value: number) {
  const target = tamamoCurrentTarget.value;
  if (!target) {
    showToast('未找到可操作目标');
    return;
  }

  const nextValue = parseNonNegativeInt(value);
  applyTamamoUpdate(
    nextStatData => {
      set(nextStatData, target.affairPath, nextValue);
    },
    `${target.label} 出轨次数 → ${nextValue}`,
    '出轨次数写回失败',
  );
}

function applyAffairCountDelta(delta: number) {
  applyAffairCountValue(tamamoCurrentAffairCount.value + delta);
}

function applyAffairCountSet() {
  const input = Number(tamamoAffairDirectValue.value);
  if (!Number.isFinite(input)) {
    showToast('请输入有效的出轨次数');
    return;
  }
  applyAffairCountValue(input);
}

function addTamamoTattoo() {
  const target = tamamoCurrentTarget.value;
  const name = tamamoTattooName.value.trim();
  if (!target || !name) {
    showToast('请填写纹身名');
    return;
  }

  applyTamamoUpdate(
    nextStatData => {
      set(nextStatData, [...target.tattooPath, name], {
        英文: tamamoTattooEnglish.value.trim(),
        形状描写: tamamoTattooDescription.value.trim(),
      });
    },
    `${target.label} 新增纹身：${name}`,
    '新增纹身失败',
  );

  tamamoTattooName.value = '';
  tamamoTattooEnglish.value = '';
  tamamoTattooDescription.value = '';
}

function removeTamamoTattoo(name: string) {
  const target = tamamoCurrentTarget.value;
  if (!target) return;

  applyTamamoUpdate(
    nextStatData => {
      unset(nextStatData, [...target.tattooPath, name]);
    },
    `${target.label} 移除纹身：${name}`,
    '移除纹身失败',
  );
}

function addTamamoTrait() {
  const target = tamamoCurrentTarget.value;
  const name = tamamoTraitName.value.trim();
  if (!target || !name) {
    showToast('请填写永久特性名称');
    return;
  }

  applyTamamoUpdate(
    nextStatData => {
      set(nextStatData, [...target.traitPath, name], true);
    },
    `${target.label} 新增永久特性：${name}`,
    '新增永久特性失败',
  );

  tamamoTraitName.value = '';
}

function removeTamamoTrait(name: string) {
  const target = tamamoCurrentTarget.value;
  if (!target) return;

  applyTamamoUpdate(
    nextStatData => {
      unset(nextStatData, [...target.traitPath, name]);
    },
    `${target.label} 移除永久特性：${name}`,
    '移除永久特性失败',
  );
}

function addTamamoFallenItem() {
  const target = tamamoCurrentTarget.value;
  const name = tamamoItemName.value.trim();
  if (!target || !name) {
    showToast('请填写堕落物品名');
    return;
  }

  const shape = tamamoItemShape.value.trim();
  const effect = tamamoItemEffect.value.trim();

  applyTamamoUpdate(
    nextStatData => {
      if (target.fallenItemMode === 'inventory') {
        const desc = [`形状描写：${shape}`, `功能描写：${effect}`].join('；');
        set(nextStatData, [...target.fallenItemPath, name], {
          描述: desc,
          数量: 1,
        });
        return;
      }

      set(nextStatData, [...target.fallenItemPath, name], {
        形状描写: shape,
        功能描写: effect,
      });
    },
    `${target.label} 新增堕落物品：${name}`,
    '新增堕落物品失败',
  );

  tamamoItemName.value = '';
  tamamoItemShape.value = '';
  tamamoItemEffect.value = '';
}

function removeTamamoFallenItem(name: string) {
  const target = tamamoCurrentTarget.value;
  if (!target) return;

  applyTamamoUpdate(
    nextStatData => {
      unset(nextStatData, [...target.fallenItemPath, name]);
    },
    `${target.label} 移除堕落物品：${name}`,
    '移除堕落物品失败',
  );
}

type CheatWorldbookApi = {
  getChatWorldbookName: (chatName: 'current') => string | null;
  getCharWorldbookNames: (characterName: 'current') => { primary: string | null; additional: string[] };
  getGlobalWorldbookNames: () => string[];
  getWorldbook: (worldbookName: string) => Promise<Array<{ name: string; enabled: boolean }>>;
  updateWorldbookWith: (
    worldbookName: string,
    updater: (worldbook: Array<{ name: string; enabled: boolean }>) => Array<{ name: string; enabled: boolean }>,
    options?: { render?: 'debounced' | 'immediate' },
  ) => Promise<unknown>;
};

function getCheatWorldbookApi() {
  const root = window as unknown as {
    TavernHelper?: Partial<CheatWorldbookApi>;
  } & Partial<CheatWorldbookApi>;

  const source = root.TavernHelper ?? root;

  if (
    typeof source.getChatWorldbookName !== 'function' ||
    typeof source.getCharWorldbookNames !== 'function' ||
    typeof source.getGlobalWorldbookNames !== 'function' ||
    typeof source.getWorldbook !== 'function' ||
    typeof source.updateWorldbookWith !== 'function'
  ) {
    throw new Error('worldbook api 不可用');
  }

  return source as CheatWorldbookApi;
}

function getCheatWorldbookCandidates(api: CheatWorldbookApi) {
  const names: string[] = [];

  try {
    const chatWorldbook = api.getChatWorldbookName('current');
    if (chatWorldbook) names.push(chatWorldbook);
  } catch {
    // ignore
  }

  try {
    const charWorldbooks = api.getCharWorldbookNames('current');
    if (charWorldbooks.primary) names.push(charWorldbooks.primary);
    names.push(...charWorldbooks.additional);
  } catch {
    // ignore
  }

  try {
    names.push(...api.getGlobalWorldbookNames());
  } catch {
    // ignore
  }

  const normalized = names.map(name => String(name).trim()).filter(Boolean);
  return Array.from(new Set(normalized));
}

async function findCheatEntry(api: CheatWorldbookApi, entryName: string) {
  const candidates = getCheatWorldbookCandidates(api);

  for (const worldbookName of candidates) {
    try {
      const worldbook = await api.getWorldbook(worldbookName);
      const entry = worldbook.find(item => item.name.trim() === entryName);
      if (entry) {
        return {
          worldbookName,
          enabled: entry.enabled,
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

async function refreshCheatEntryState(entryName: string, stateRef: { value: boolean }, showFailToast = false) {
  try {
    const api = getCheatWorldbookApi();
    const found = await findCheatEntry(api, entryName);
    stateRef.value = Boolean(found?.enabled);
    if (!found && showFailToast) {
      showToast(`未找到世界书条目：${entryName}`);
    }
  } catch (error) {
    console.error(error);
    if (showFailToast) showToast(`读取作弊条目状态失败：${entryName}`);
  }
}

async function refreshAllCheatStates(showFailToast = false) {
  await Promise.all([
    refreshCheatEntryState(tamamoCheatGiftEntryName, tamamoCheatGiftActive, showFailToast),
    refreshCheatEntryState(tamamoCheatWorldEntryName, tamamoCheatWorldActive, showFailToast),
    refreshCheatEntryState(tamamoCheatFutaEntryName, tamamoCheatFutaActive, showFailToast),
  ]);
}

async function setCheatEntryEnabled(entryName: string, stateRef: { value: boolean }, enabled: boolean) {
  if (tamamoCheatBusy.value) return;
  tamamoCheatBusy.value = true;

  try {
    const api = getCheatWorldbookApi();
    const found = await findCheatEntry(api, entryName);
    if (!found) {
      showToast(`未找到世界书条目：${entryName}`);
      return;
    }

    await api.updateWorldbookWith(
      found.worldbookName,
      worldbook =>
        worldbook.map(entry =>
          entry.name.trim() === entryName
            ? {
                ...entry,
                enabled,
              }
            : entry,
        ),
      { render: 'immediate' },
    );

    stateRef.value = enabled;
    showToast(`${enabled ? '开启' : '关闭'}：${entryName}`);
  } catch (error) {
    console.error(error);
    showToast(`切换失败：${entryName}`);
  } finally {
    tamamoCheatBusy.value = false;
  }
}

function toggleCheatGiftEntry() {
  void setCheatEntryEnabled(tamamoCheatGiftEntryName, tamamoCheatGiftActive, !tamamoCheatGiftActive.value);
}

function toggleCheatWorldEntry() {
  void setCheatEntryEnabled(tamamoCheatWorldEntryName, tamamoCheatWorldActive, !tamamoCheatWorldActive.value);
}

function toggleCheatFutaEntry() {
  void setCheatEntryEnabled(tamamoCheatFutaEntryName, tamamoCheatFutaActive, !tamamoCheatFutaActive.value);
}

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
  void refreshAllCheatStates(false);
  timer = window.setInterval(updateNowText, 1000);
  variableTimer = window.setInterval(() => reloadVariables(false), 2000);
  cheatTimer = window.setInterval(() => {
    void refreshAllCheatStates(false);
  }, 3000);
});

onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer);
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  if (variableTimer !== null) window.clearInterval(variableTimer);
  if (cheatTimer !== null) window.clearInterval(cheatTimer);
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

.modal-full-image-block {
  gap: 6px;
}

.nearby-avatar-img,
.contact-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
  object-position: center;
  display: block;
}

.person-full-image {
  --qos-ring-rgb: 170, 214, 255;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  border: 1px solid rgba(255, 235, 255, 0.3);
  background:
    conic-gradient(from 0deg, rgba(255, 130, 221, 0.35), rgba(116, 60, 197, 0.25), rgba(255, 130, 221, 0.35)),
    radial-gradient(circle at 30% 30%, #ff8fda, #8438a5 48%, #2f1949 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 0 2px rgba(34, 19, 50, 0.75),
    0 0 10px rgba(var(--qos-ring-rgb), 0.36);
  overflow: hidden;
  position: relative;
}

.person-full-image::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 1px solid rgba(var(--qos-ring-rgb), 0.7);
  box-shadow:
    0 0 10px rgba(var(--qos-ring-rgb), 0.45),
    0 0 18px rgba(var(--qos-ring-rgb), 0.32);
  pointer-events: none;
  z-index: 2;
}

.person-full-image::after {
  content: '♠';
  position: absolute;
  right: 4px;
  bottom: 2px;
  font-size: 14px;
  color: rgba(255, 227, 248, 0.9);
  text-shadow: 0 0 8px rgba(var(--qos-ring-rgb), 0.5);
  pointer-events: none;
  z-index: 2;
}

.person-full-image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.person-full-image {
  cursor: zoom-in;
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

.avatar-preview-trigger {
  cursor: zoom-in;
}

.player-avatar-img {
  object-position: center top;
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
  grid-template-columns: repeat(5, 1fr);
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

.modal-contact-full-image {
  width: 100%;
  margin: 0 auto;
  max-height: min(62dvh, 560px);
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

.image-preview-overlay {
  z-index: 40;
  background: rgba(0, 0, 0, 0.86);
}

.image-preview-modal {
  width: min(96vw, 860px);
  max-height: calc(100dvh - 24px);
  border-radius: 14px;
  border: 1px solid rgba(255, 183, 244, 0.35);
  background: rgba(18, 10, 28, 0.92);
  box-shadow: 0 22px 40px rgba(0, 0, 0, 0.6);
  padding: 12px;
  display: grid;
  gap: 8px;
  position: relative;
}

.image-preview-close {
  right: 8px;
  top: 4px;
}

.image-preview-title {
  margin: 0;
  text-align: center;
  color: #f5dfff;
  font-size: 13px;
}

.image-preview-img {
  width: 100%;
  max-height: calc(100dvh - 110px);
  object-fit: contain;
  border-radius: 10px;
  background: rgba(12, 7, 18, 0.8);
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



/* ========== TAMAMO ENTRY BUTTON ========== */
.tamamo-entry-btn {
  border: 1px solid rgba(201, 168, 76, 0.5);
  border-radius: 12px;
  background:
    linear-gradient(120deg, rgba(155, 114, 207, 0.2), rgba(255, 255, 255, 0.05) 40%),
    linear-gradient(140deg, rgba(15, 13, 26, 0.9), rgba(50, 20, 60, 0.8));
  color: #c9a84c;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  padding: 8px 10px;
  letter-spacing: 0.02em;
  box-shadow:
    0 6px 14px rgba(155, 114, 207, 0.2),
    inset 0 0 0 1px rgba(201, 168, 76, 0.22);
  max-width: 176px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}

.tamamo-entry-btn::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.4), transparent);
  animation: tamamoShine 3s infinite;
}

@keyframes tamamoShine {
  0% { left: -100%; }
  20% { left: 200%; }
  100% { left: 200%; }
}

/* ========== SAKURA PETALS ========== */
.sakura-petals {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.sakura-petal {
  position: absolute;
  background-color: #f0b4cc;
  border-radius: 15px 0 15px 0;
  opacity: 0.7;
  box-shadow: 0 0 8px rgba(232, 160, 191, 0.6);
  animation: sakuraFall linear infinite, sakuraSway ease-in-out infinite alternate;
}

.sakura-petal:nth-child(1) { left: 10%; animation-duration: 7s, 3s; width: 12px; height: 12px; animation-delay: 0s; }
.sakura-petal:nth-child(2) { left: 20%; animation-duration: 9s, 4s; width: 14px; height: 14px; animation-delay: -2s; }
.sakura-petal:nth-child(3) { left: 30%; animation-duration: 6s, 2.5s; width: 10px; height: 10px; animation-delay: -4s; }
.sakura-petal:nth-child(4) { left: 40%; animation-duration: 8s, 3.5s; width: 16px; height: 16px; animation-delay: -1s; }
.sakura-petal:nth-child(5) { left: 50%; animation-duration: 10s, 4.5s; width: 11px; height: 11px; animation-delay: -3s; }
.sakura-petal:nth-child(6) { left: 60%; animation-duration: 7.5s, 3s; width: 13px; height: 13px; animation-delay: -5s; }
.sakura-petal:nth-child(7) { left: 70%; animation-duration: 6.5s, 2.5s; width: 15px; height: 15px; animation-delay: -2s; }
.sakura-petal:nth-child(8) { left: 80%; animation-duration: 8.5s, 3.5s; width: 9px; height: 9px; animation-delay: -4s; }
.sakura-petal:nth-child(9) { left: 90%; animation-duration: 9.5s, 4s; width: 17px; height: 17px; animation-delay: 0s; }
.sakura-petal:nth-child(10) { left: 5%; animation-duration: 7s, 2s; width: 12px; height: 12px; animation-delay: -1s; }
.sakura-petal:nth-child(11) { left: 85%; animation-duration: 8s, 4s; width: 14px; height: 14px; animation-delay: -3s; }
.sakura-petal:nth-child(12) { left: 45%; animation-duration: 6s, 3s; width: 10px; height: 10px; animation-delay: -2s; }
.sakura-petal:nth-child(13) { left: 25%; animation-duration: 7.5s, 3.5s; width: 15px; height: 15px; animation-delay: -4s; }
.sakura-petal:nth-child(14) { left: 65%; animation-duration: 9s, 2.5s; width: 13px; height: 13px; animation-delay: -1s; }
.sakura-petal:nth-child(15) { left: 75%; animation-duration: 8.5s, 4s; width: 11px; height: 11px; animation-delay: -5s; }

@keyframes sakuraFall {
  0% { top: -10%; transform: rotate(0deg); }
  100% { top: 110%; transform: rotate(360deg); }
}

@keyframes sakuraSway {
  0% { transform: translateX(0px) rotate(0deg); }
  100% { transform: translateX(20px) rotate(45deg); }
}

/* ========== MIKON FLOATING HEARTS ========== */
.mikon-float-hearts {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.mikon-float-heart {
  position: absolute;
  bottom: -20px;
  width: 10px;
  height: 10px;
  opacity: 0;
  animation: mikonHeartFloat 8s ease-in-out infinite;
}

.mikon-float-heart::before,
.mikon-float-heart::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 15px;
  border-radius: 10px 10px 0 0;
  background: rgba(232, 160, 191, 0.5);
}

.mikon-float-heart::before {
  left: 5px;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
}

.mikon-float-heart::after {
  left: 0;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}

.mikon-float-heart:nth-child(1) { left: 12%; animation-delay: 0s; animation-duration: 7s; }
.mikon-float-heart:nth-child(2) { left: 32%; animation-delay: -2s; animation-duration: 9s; }
.mikon-float-heart:nth-child(3) { left: 52%; animation-delay: -4s; animation-duration: 6.5s; }
.mikon-float-heart:nth-child(4) { left: 72%; animation-delay: -1s; animation-duration: 8s; }
.mikon-float-heart:nth-child(5) { left: 22%; animation-delay: -3s; animation-duration: 10s; }
.mikon-float-heart:nth-child(6) { left: 62%; animation-delay: -5s; animation-duration: 7.5s; }

@keyframes mikonHeartFloat {
  0% { bottom: -20px; opacity: 0; transform: scale(0.4) translateX(0); }
  10% { opacity: 0.6; }
  50% { opacity: 0.4; transform: scale(0.7) translateX(15px); }
  90% { opacity: 0; }
  100% { bottom: 100%; opacity: 0; transform: scale(0.3) translateX(-10px); }
}

/* ========== FOX EARS ========== */
.fox-ear {
  position: absolute;
  top: -14px;
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 24px solid rgba(201, 168, 76, 0.75);
  z-index: 3;
  filter: drop-shadow(0 0 6px rgba(201, 168, 76, 0.35));
  transition: transform 0.3s ease;
}

.fox-ear::after {
  content: '';
  position: absolute;
  top: 6px;
  left: -9px;
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-bottom: 16px solid rgba(232, 160, 191, 0.6);
}

.fox-ear-left {
  left: 26px;
  transform: rotate(-12deg);
}

.fox-ear-right {
  right: 26px;
  transform: rotate(12deg);
}

.tamamo-hero:hover .fox-ear-left { transform: rotate(-8deg) translateY(-2px); }
.tamamo-hero:hover .fox-ear-right { transform: rotate(8deg) translateY(-2px); }

/* ========== FOX TAIL ========== */
.fox-tail {
  position: absolute;
  bottom: 8px;
  right: -4px;
  width: 50px;
  height: 75px;
  z-index: 3;
  pointer-events: none;
}

.fox-tail::before {
  content: '';
  position: absolute;
  width: 38px;
  height: 65px;
  border: 3px solid transparent;
  border-right: 3px solid rgba(201, 168, 76, 0.5);
  border-top: 3px solid rgba(201, 168, 76, 0.5);
  border-radius: 0 45px 0 0;
  transform: rotate(12deg);
  box-shadow: 2px -2px 10px rgba(201, 168, 76, 0.25);
}

.fox-tail::after {
  content: '';
  position: absolute;
  top: -4px;
  right: 6px;
  width: 10px;
  height: 10px;
  background: radial-gradient(circle, rgba(232, 160, 191, 0.7), rgba(201, 168, 76, 0.5));
  border-radius: 50%;
  filter: blur(2px);
}

/* ========== MIKON BANNER ========== */
.tamamo-mikon-banner {
  padding: 10px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(155, 114, 207, 0.12), rgba(232, 160, 191, 0.08));
  border: 1px solid rgba(232, 160, 191, 0.25);
  color: #e8a0bf;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.06em;
  animation: mikonBannerPulse 3s ease-in-out infinite;
}

.mikon-icon {
  display: inline-block;
  width: 13px;
  height: 12px;
  position: relative;
  vertical-align: middle;
  margin: 0 3px;
}

.mikon-icon::before,
.mikon-icon::after {
  content: '';
  position: absolute;
  width: 7px;
  height: 11px;
  border-radius: 7px 7px 0 0;
  background: #e8a0bf;
}

.mikon-icon::before {
  left: 3px;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
}

.mikon-icon::after {
  left: 0;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}

@keyframes mikonBannerPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(232, 160, 191, 0); }
  50% { box-shadow: 0 0 18px rgba(232, 160, 191, 0.12); }
}

/* ========== TAMAMO PAGE ========== */
.tamamo-page {
  display: grid;
  gap: 14px;
  color: #f0e6d3;
  position: relative;
  background:
    radial-gradient(ellipse 60% 40% at 20% 30%, rgba(74, 140, 255, 0.06), transparent),
    radial-gradient(ellipse 50% 50% at 80% 70%, rgba(232, 160, 191, 0.05), transparent);
}

/* ========== SHOJI SHADOW ========== */
.tamamo-shoji-shadow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.035;
  background:
    repeating-linear-gradient(90deg, rgba(201, 168, 76, 0.8) 0px, rgba(201, 168, 76, 0.8) 1px, transparent 1px, transparent 60px),
    repeating-linear-gradient(0deg, rgba(201, 168, 76, 0.6) 0px, rgba(201, 168, 76, 0.6) 1px, transparent 1px, transparent 80px);
  animation: shojiBreath 8s ease-in-out infinite;
}

@keyframes shojiBreath {
  0%, 100% { opacity: 0.025; }
  50% { opacity: 0.05; }
}

/* ========== FOXFIRE PARTICLES ========== */
.tamamo-foxfire-layer {
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
  background: radial-gradient(circle, rgba(74, 140, 255, 0.9), rgba(74, 140, 255, 0));
  box-shadow: 0 0 8px rgba(74, 140, 255, 0.6), 0 0 20px rgba(74, 140, 255, 0.2);
}

.foxfire-dot:nth-child(even) {
  background: radial-gradient(circle, rgba(232, 160, 191, 0.9), rgba(232, 160, 191, 0));
  box-shadow: 0 0 8px rgba(232, 160, 191, 0.6), 0 0 20px rgba(232, 160, 191, 0.2);
}

.foxfire-dot:nth-child(1)  { left: 8%; top: 15%; width: 3px; height: 3px; animation-duration: 12s, 2.5s; animation-delay: 0s; }
.foxfire-dot:nth-child(2)  { left: 85%; top: 25%; width: 5px; height: 5px; animation-duration: 15s, 3s; animation-delay: -2s; }
.foxfire-dot:nth-child(3)  { left: 25%; top: 45%; width: 4px; height: 4px; animation-duration: 10s, 2s; animation-delay: -4s; }
.foxfire-dot:nth-child(4)  { left: 70%; top: 10%; width: 3px; height: 3px; animation-duration: 14s, 3.5s; animation-delay: -1s; }
.foxfire-dot:nth-child(5)  { left: 50%; top: 60%; width: 5px; height: 5px; animation-duration: 11s, 2.8s; animation-delay: -3s; }
.foxfire-dot:nth-child(6)  { left: 15%; top: 75%; width: 4px; height: 4px; animation-duration: 13s, 2.2s; animation-delay: -5s; }
.foxfire-dot:nth-child(7)  { left: 90%; top: 50%; width: 3px; height: 3px; animation-duration: 16s, 3.2s; animation-delay: -2s; }
.foxfire-dot:nth-child(8)  { left: 40%; top: 85%; width: 5px; height: 5px; animation-duration: 9s, 2.6s; animation-delay: -4s; }
.foxfire-dot:nth-child(9)  { left: 60%; top: 35%; width: 4px; height: 4px; animation-duration: 12s, 3s; animation-delay: -1s; }
.foxfire-dot:nth-child(10) { left: 5%; top: 55%; width: 3px; height: 3px; animation-duration: 14s, 2.4s; animation-delay: -3s; }
.foxfire-dot:nth-child(11) { left: 75%; top: 90%; width: 4px; height: 4px; animation-duration: 11s, 2.8s; animation-delay: -5s; }
.foxfire-dot:nth-child(12) { left: 35%; top: 20%; width: 5px; height: 5px; animation-duration: 13s, 3.4s; animation-delay: -2s; }

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

/* ========== HERO ========== */
.tamamo-hero {
  position: relative;
  overflow: visible;
  display: grid;
  gap: 16px;
  padding: 24px 18px 18px;
  border-radius: 28px;
  border: 1px solid rgba(201, 168, 76, 0.45);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%, rgba(255, 255, 255, 0.02) 80%),
    radial-gradient(ellipse at 30% 20%, rgba(74, 140, 255, 0.06), transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(232, 160, 191, 0.05), transparent 50%),
    radial-gradient(circle at top, rgba(155, 114, 207, 0.18), transparent 40%),
    radial-gradient(circle at 85% 18%, rgba(201, 168, 76, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(15, 13, 26, 0.97) 0%, rgba(40, 15, 60, 0.9) 42%, rgba(10, 5, 18, 1) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(201, 168, 76, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 42px rgba(10, 5, 18, 0.6),
    0 0 0 1px rgba(155, 114, 207, 0.15);
  animation: heroLacquerShimmer 6s ease-in-out infinite;
}

.tamamo-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 28px;
  pointer-events: none;
  z-index: 0;
  background:
    repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(201, 168, 76, 0.008) 2px, rgba(201, 168, 76, 0.008) 3px);
  mix-blend-mode: overlay;
}

@keyframes heroLacquerShimmer {
  0%, 100% { box-shadow: inset 0 0 0 1px rgba(201, 168, 76, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 18px 42px rgba(10, 5, 18, 0.6), 0 0 0 1px rgba(155, 114, 207, 0.15); }
  50% { box-shadow: inset 0 0 0 1px rgba(201, 168, 76, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 18px 42px rgba(10, 5, 18, 0.6), 0 0 20px rgba(74, 140, 255, 0.04), 0 0 0 1px rgba(155, 114, 207, 0.2); }
}

.tamamo-caster-circle {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  border: 2px dashed rgba(201, 168, 76, 0.25);
  background: repeating-radial-gradient(circle, transparent, transparent 10px, rgba(201, 168, 76, 0.03) 10px, rgba(201, 168, 76, 0.03) 20px);
  animation: rotateCircle 40s linear infinite;
  pointer-events: none;
}

@keyframes rotateCircle {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tamamo-torii-frame {
  position: absolute;
  left: 20px;
  width: 60px;
  height: 8px;
  background: linear-gradient(90deg, transparent, rgba(191, 64, 64, 0.75), transparent);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(191, 64, 64, 0.4);
}

.tamamo-torii-frame.top { top: 14px; }
.tamamo-torii-frame.bottom { bottom: 18px; left: auto; right: 24px; width: 80px; }

.tamamo-hero-copy {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
}

.tamamo-headline-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tamamo-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #e8a0bf;
}

.tamamo-hero h2 {
  margin: 8px 0 0;
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, #e8c86a 0%, #f0e6d3 25%, #c9a84c 50%, #f0e6d3 75%, #e8c86a 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 8px rgba(201, 168, 76, 0.4)) drop-shadow(0 0 20px rgba(201, 168, 76, 0.15));
  animation: titleEnchant 4s linear infinite;
}

@keyframes titleEnchant {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.tamamo-phase-badge {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid rgba(201, 168, 76, 0.4);
  background: rgba(15, 13, 26, 0.8);
  box-shadow: 0 0 10px rgba(201, 168, 76, 0.2);
  color: #c9a84c;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.tamamo-sub {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: rgba(240, 230, 211, 0.8);
}

.tamamo-hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tamamo-stat-chip {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(155, 114, 207, 0.2);
  background: rgba(15, 13, 26, 0.7);
  box-shadow: inset 0 0 0 1px rgba(155, 114, 207, 0.08);
  display: grid;
  gap: 4px;
}

.tamamo-stat-chip span {
  font-size: 10px;
  color: #9b72cf;
}

.tamamo-stat-chip strong {
  font-size: 13px;
  color: #f0e6d3;
}

/* ========== HUGE AVATAR ========== */
.tamamo-huge-avatar {
  position: relative;
  z-index: 1;
  width: min(100%, 398px);
  aspect-ratio: 0.92 / 1;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid rgba(201, 168, 76, 0.3);
  background: #0f0d1a;
  box-shadow:
    0 26px 48px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(201, 168, 76, 0.18);
}

.tamamo-huge-avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(155, 114, 207, 0.08), transparent 30%),
    linear-gradient(135deg, rgba(201, 168, 76, 0.1), transparent 30%);
}

.tamamo-huge-avatar-frame {
  position: absolute;
  inset: 8px;
  z-index: 2;
  border-radius: 14px;
  border: 1px solid rgba(201, 168, 76, 0.35);
  box-shadow: inset 0 0 0 1px rgba(201, 168, 76, 0.08);
  pointer-events: none;
}

.tamamo-huge-avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ========== GM GRID ========== */
.tamamo-gm-grid {
  display: grid;
  gap: 16px;
  position: relative;
  z-index: 1;
}

/* ========== SCROLL CARD (卷轴) ========== */
.tamamo-card {
  position: relative;
  overflow: visible;
}

/* Metal corner accents for scroll cards */
.tamamo-card::before,
.tamamo-card::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  z-index: 3;
  pointer-events: none;
}

.tamamo-card::before {
  top: 16px;
  left: 0;
  border-top: 2px solid rgba(201, 168, 76, 0.5);
  border-left: 2px solid rgba(201, 168, 76, 0.5);
  box-shadow: -1px -1px 4px rgba(201, 168, 76, 0.15), inset 1px 1px 2px rgba(201, 168, 76, 0.1);
}

.tamamo-card::after {
  bottom: 16px;
  right: 0;
  border-bottom: 2px solid rgba(201, 168, 76, 0.5);
  border-right: 2px solid rgba(201, 168, 76, 0.5);
  box-shadow: 1px 1px 4px rgba(201, 168, 76, 0.15), inset -1px -1px 2px rgba(201, 168, 76, 0.1);
}

.tamamo-scroll {
  padding: 0;
}

/* Scroll Rods - realistic aged wooden cylindrical appearance */
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
  33% { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.3), 0 0 12px rgba(74, 140, 255, 0.12); }
  66% { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.3), 0 0 12px rgba(232, 160, 191, 0.1); }
}

/* Scroll Rod Knobs - jade carved appearance */
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
.scroll-rod::after { right: -9px; }

/* Card Header - between scroll rods */
.tamamo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 8px;
  background: linear-gradient(180deg, rgba(20, 12, 28, 0.95), rgba(20, 12, 28, 0.9));
  border-left: 2px solid rgba(201, 168, 76, 0.2);
  border-right: 2px solid rgba(201, 168, 76, 0.2);
  position: relative;
  animation: headerFoxfireReflect 6s ease-in-out infinite;
}

@keyframes headerFoxfireReflect {
  0%, 100% { border-left-color: rgba(201, 168, 76, 0.2); border-right-color: rgba(201, 168, 76, 0.2); }
  33% { border-left-color: rgba(74, 140, 255, 0.2); border-right-color: rgba(74, 140, 255, 0.15); }
  66% { border-left-color: rgba(232, 160, 191, 0.18); border-right-color: rgba(232, 160, 191, 0.15); }
}

.tamamo-card-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  width: 80%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.3), transparent);
}

.tamamo-card-overline {
  margin: 0 0 4px;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #c9a84c;
  padding-left: 20px;
  position: relative;
}

/* Shinto symbol decorations for each section */
.tamamo-card-overline::before {
  content: '⛩';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0.7;
  filter: drop-shadow(0 0 3px rgba(201, 168, 76, 0.4));
}

.tamamo-gm-core .tamamo-card-overline::before { content: '☯'; }
.tamamo-gm-grid .tamamo-scroll:nth-child(2) .tamamo-card-overline::before { content: '✦'; }
.tamamo-gm-grid .tamamo-scroll:nth-child(3) .tamamo-card-overline::before { content: '◉'; }
.tamamo-gm-grid .tamamo-scroll:nth-child(4) .tamamo-card-overline::before { content: '⚸'; }
.tamamo-gm-grid .tamamo-scroll:nth-child(5) .tamamo-card-overline::before { content: '卍'; }
.tamamo-gm-grid .tamamo-scroll:nth-child(6) .tamamo-card-overline::before { content: '◎'; }
.tamamo-gm-grid .tamamo-scroll:nth-child(7) .tamamo-card-overline::before { content: '☰'; }

.tamamo-card h3 {
  margin: 0;
  font-size: 16px;
  color: #f0e6d3;
  text-shadow: 0 0 8px rgba(201, 168, 76, 0.15);
  animation: cardTitleFlicker 5s ease-in-out infinite;
}

@keyframes cardTitleFlicker {
  0%, 100% { text-shadow: 0 0 8px rgba(201, 168, 76, 0.15); }
  50% { text-shadow: 0 0 12px rgba(201, 168, 76, 0.3), 0 0 4px rgba(232, 160, 191, 0.1); }
}

/* Scroll Body - parchment texture with wood grain */
.tamamo-scroll-body {
  background:
    repeating-linear-gradient(90deg,
      rgba(80, 55, 20, 0.04) 0px, transparent 1px, transparent 12px),
    repeating-linear-gradient(87deg,
      rgba(60, 40, 15, 0.03) 0px, transparent 1px, transparent 18px),
    linear-gradient(180deg, rgba(20, 12, 28, 0.93), rgba(25, 15, 35, 0.89));
  border-left: 2px solid rgba(201, 168, 76, 0.2);
  border-right: 2px solid rgba(201, 168, 76, 0.2);
  position: relative;
}

.tamamo-scroll-body::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(201, 168, 76, 0.06), transparent 15%, transparent 85%, rgba(201, 168, 76, 0.06));
  pointer-events: none;
}

.tamamo-card-body {
  padding: 12px 16px 14px;
}

.tamamo-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(240, 230, 211, 0.8);
}

.tamamo-label {
  display: block;
  margin: 0 0 8px;
  font-size: 11px;
  color: #e8a0bf;
  font-weight: 700;
}

/* ========== TOGGLE BUTTON (Seal style) ========== */
.tamamo-toggle-btn {
  border: 1px solid rgba(201, 168, 76, 0.35);
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.12), rgba(155, 114, 207, 0.08));
  color: #c9a84c;
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  transition: all 0.3s;
}

.tamamo-toggle-btn:hover {
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.22), rgba(155, 114, 207, 0.12));
  box-shadow: 0 0 12px rgba(201, 168, 76, 0.18);
}

/* ========== FORM ELEMENTS ========== */
.tamamo-select,
.tamamo-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(155, 114, 207, 0.25);
  background: rgba(20, 12, 28, 0.6);
  color: #f0e6d3;
  padding: 10px 12px;
  font-size: 12px;
  transition: border-color 0.2s;
}

.tamamo-select::placeholder,
.tamamo-input::placeholder {
  color: rgba(232, 160, 191, 0.4);
}

.tamamo-select:focus,
.tamamo-input:focus {
  outline: none;
  border-color: rgba(201, 168, 76, 0.5);
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.08);
}

.tamamo-current {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(155, 114, 207, 0.2);
  background: linear-gradient(135deg, rgba(40, 15, 60, 0.5), rgba(15, 13, 26, 0.6));
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.tamamo-current span {
  display: block;
  font-size: 11px;
  color: #9b72cf;
}

.tamamo-current small {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: rgba(155, 114, 207, 0.55);
}

.tamamo-current strong {
  font-size: 24px;
  line-height: 1;
  color: #e8dff5;
  text-shadow:
    0 0 8px rgba(74, 140, 255, 0.35),
    0 0 20px rgba(155, 114, 207, 0.2),
    0 0 3px rgba(201, 168, 76, 0.25);
  animation: dataTextGlow 3s ease-in-out infinite alternate;
}

.tamamo-current-sub {
  margin-top: 14px;
  border-color: rgba(232, 160, 191, 0.2);
  background: linear-gradient(135deg, rgba(100, 20, 50, 0.35), rgba(15, 13, 26, 0.6));
}
.tamamo-current-sub span { color: #e8a0bf; }
.tamamo-current-sub small { color: rgba(232, 160, 191, 0.5); }
.tamamo-current-sub strong {
  color: #f5dce8;
  text-shadow:
    0 0 8px rgba(232, 160, 191, 0.35),
    0 0 20px rgba(232, 160, 191, 0.15),
    0 0 3px rgba(201, 168, 76, 0.2);
}

.tamamo-step-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.tamamo-ctl-btn,
.tamamo-direct-btn {
  border: 1px solid rgba(155, 114, 207, 0.25);
  border-radius: 8px;
  background: rgba(20, 12, 28, 0.8);
  color: #c4b0e0;
  font-size: 12px;
  font-weight: 700;
  padding: 9px 0;
  transition: all 0.2s;
}

.tamamo-step-row-affair .tamamo-ctl-btn {
  border-color: rgba(232, 160, 191, 0.25);
  color: #f0c4d8;
}

.tamamo-ctl-btn-main,
.tamamo-direct-btn {
  background: linear-gradient(135deg, #c9a84c 0%, #a17a2a 100%);
  color: #1a0f28;
  border: none;
  box-shadow: 0 4px 10px rgba(201, 168, 76, 0.25);
}

.tamamo-direct-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 110px;
  gap: 8px;
}

.tamamo-step-row-affair {
  margin-top: 8px;
}

.tamamo-form-grid {
  display: grid;
  gap: 8px;
}

.tamamo-form-inline {
  display: grid;
  grid-template-columns: 1fr 110px;
  gap: 8px;
}

.tamamo-textarea {
  min-height: 76px;
  resize: vertical;
}

.tamamo-tag-list {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tamamo-tag {
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 4px;
  background: rgba(201, 168, 76, 0.08);
  color: #e0cc8a;
  font-size: 11px;
  padding: 6px 12px;
}

.tamamo-tag-danger {
  border-color: rgba(191, 64, 64, 0.3);
  color: #e8a0a0;
  background: rgba(191, 64, 64, 0.08);
}

.tamamo-empty {
  margin-top: 10px;
  font-size: 11px;
  color: rgba(240, 230, 211, 0.5);
}

/* ========== CHEAT BUTTONS ========== */
.tamamo-cheat-btn {
  width: 100%;
  margin-top: 6px;
  border: 1px solid rgba(201, 168, 76, 0.35);
  border-radius: 8px;
  background: rgba(15, 13, 26, 0.8);
  color: #c9a84c;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 700;
  padding: 12px 14px;
  transition: all 0.2s;
}

.tamamo-cheat-name {
  text-align: left;
}

.tamamo-cheat-btn > span:last-child {
  font-size: 11px;
  color: rgba(201, 168, 76, 0.6);
}

.tamamo-cheat-btn.active {
  background: linear-gradient(135deg, #c9a84c 0%, #8b6914 100%);
  border-color: #a17a2a;
  color: #1a0f28;
}

.tamamo-cheat-btn.active > span:last-child {
  color: rgba(26, 15, 40, 0.7);
}

.tamamo-cheat-btn:disabled {
  opacity: 0.72;
  cursor: wait;
}

/* ========== KV & TARGET LIST ========== */
.tamamo-kv {
  display: grid;
  gap: 8px;
}

.tamamo-kv p {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(155, 114, 207, 0.2);
  background: rgba(15, 13, 26, 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

/* Water surface reflection effect */
.tamamo-kv p::after,
.tamamo-target-list li::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, transparent, rgba(74, 140, 255, 0.03));
  pointer-events: none;
  opacity: 0.7;
}

.tamamo-kv span {
  font-size: 11px;
  color: #9b72cf;
}

.tamamo-kv strong {
  font-size: 12px;
  color: #e8dff5;
  text-shadow:
    0 0 6px rgba(74, 140, 255, 0.3),
    0 0 14px rgba(155, 114, 207, 0.15),
    0 0 2px rgba(201, 168, 76, 0.2);
  animation: dataTextGlow 3s ease-in-out infinite alternate;
}

@keyframes dataTextGlow {
  0% { text-shadow: 0 0 6px rgba(74, 140, 255, 0.3), 0 0 14px rgba(155, 114, 207, 0.15); }
  100% { text-shadow: 0 0 8px rgba(232, 160, 191, 0.3), 0 0 18px rgba(201, 168, 76, 0.2); }
}

.tamamo-target-list {
  margin: 0;
  padding: 8px 14px 14px;
  list-style: none;
  display: grid;
  gap: 8px;
}

.tamamo-target-list li {
  padding: 11px 12px;
  border-radius: 8px;
  border: 1px solid rgba(155, 114, 207, 0.2);
  background: rgba(15, 13, 26, 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.tamamo-target-list span {
  font-size: 11px;
  color: #9b72cf;
}

.tamamo-target-list strong {
  font-size: 13px;
  color: #e8dff5;
  text-shadow:
    0 0 6px rgba(74, 140, 255, 0.3),
    0 0 14px rgba(155, 114, 207, 0.15),
    0 0 2px rgba(201, 168, 76, 0.2);
  animation: dataTextGlow 3s ease-in-out infinite alternate;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 520px) {
  .tamamo-headline-row {
    flex-direction: column;
  }

  .tamamo-hero-stats {
    grid-template-columns: 1fr;
  }

  .tamamo-direct-row,
  .tamamo-form-inline {
    grid-template-columns: 1fr;
  }
}


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
      translate(var(--burst-tx, 50px), var(--burst-ty, -30px))
      rotate(var(--burst-rot, 180deg))
      scale(0.3);
  }

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
