<template>
  <div class="backstreet-page">
    <aside v-if="!activeContact" class="contact-panel" :class="{ 'group-mode': activeThreadKind === 'group' }">
      <div class="contact-toolbar">
        <button
          class="home-back-btn"
          type="button"
          title="返回主菜单"
          aria-label="返回主菜单"
          @click="emit('backHome')"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="search-row">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="searchText" type="text" :placeholder="searchPlaceholder" />
        </div>
      </div>

      <section v-if="activeThreadKind === 'group'" class="group-workspace">
        <button
          v-if="!showGroupCreator"
          class="group-launch-card"
          type="button"
          title="创建群聊"
          aria-label="创建群聊"
          @click="openGroupCreator"
        >
          <span class="group-launch-icon">
            <i class="fas fa-user-group"></i>
          </span>
          <span class="group-launch-main">
            <strong>创建群聊</strong>
            <span>{{ groupLaunchMeta }}</span>
          </span>
          <span class="group-launch-action">
            <i class="fas fa-plus"></i>
          </span>
        </button>

        <form v-else class="group-creator" @submit.prevent="createGroup">
          <div class="group-creator-header">
            <span class="group-creator-icon">
              <i class="fas fa-users"></i>
            </span>
            <span class="group-creator-title">
              <strong>新群聊</strong>
              <span>{{ selectedGroupMembers.length }} 名成员</span>
            </span>
            <button type="button" title="关闭" aria-label="关闭" @click="closeGroupCreator">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <label class="group-name-field">
            <span>群名</span>
            <input v-model="groupNameDraft" type="text" maxlength="24" placeholder="群聊名称" />
          </label>

          <div v-if="selectedGroupMembers.length > 0" class="selected-members">
            <button
              v-for="member in selectedGroupMembers"
              :key="member"
              class="selected-member-chip"
              type="button"
              @click="toggleGroupMember(member)"
            >
              <span>{{ contactInitial(member) }}</span>
              <strong>{{ member }}</strong>
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="member-picker-header">
            <span>成员</span>
            <strong>{{ selectedGroupMembers.length }}/{{ privateContactChoices.length }}</strong>
          </div>

          <div class="member-picker">
            <button
              v-for="contact in privateContactChoices"
              :key="contact.id"
              class="member-option"
              :class="{ selected: isGroupMemberSelected(contact.name) }"
              type="button"
              @click="toggleGroupMember(contact.name)"
            >
              <span class="member-avatar">{{ contactInitial(contact.name) }}</span>
              <strong>{{ contact.name }}</strong>
              <i class="fas fa-check"></i>
            </button>

            <div v-if="privateContactChoices.length === 0" class="member-empty">
              <i class="fas fa-user-slash"></i>
              <span>暂无联系人</span>
            </div>
          </div>

          <div class="group-actions">
            <button class="group-cancel" type="button" @click="closeGroupCreator">取消</button>
            <button class="group-create" type="submit" :disabled="!canCreateGroup">
              <i class="fas fa-check"></i>
              <span>创建</span>
            </button>
          </div>
        </form>
      </section>

      <section v-if="activeThreadKind === 'private'" class="group-workspace contact-workspace">
        <button
          v-if="!showContactCreator"
          class="group-launch-card contact-launch-card"
          type="button"
          title="添加联系人"
          aria-label="添加联系人"
          @click="openContactCreator"
        >
          <span class="group-launch-icon">
            <i class="fas fa-user-plus"></i>
          </span>
          <span class="group-launch-main">
            <strong>添加联系人</strong>
            <span>输入完整姓名</span>
          </span>
          <span class="group-launch-action">
            <i class="fas fa-plus"></i>
          </span>
        </button>

        <form v-else class="group-creator contact-creator" @submit.prevent="addPrivateContact">
          <div class="group-creator-header">
            <span class="group-creator-icon">
              <i class="fas fa-address-book"></i>
            </span>
            <span class="group-creator-title">
              <strong>新联系人</strong>
              <span>{{ normalizeContactName(contactNameDraft) || '完整姓名' }}</span>
            </span>
            <button type="button" title="关闭" aria-label="关闭" @click="closeContactCreator">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <label class="group-name-field">
            <span>全名</span>
            <input v-model="contactNameDraft" type="text" maxlength="32" placeholder="完整姓名" autocomplete="off" />
          </label>

          <div class="group-actions">
            <button class="group-cancel" type="button" @click="closeContactCreator">取消</button>
            <button class="group-create" type="submit" :disabled="!canAddPrivateContact">
              <i class="fas fa-user-plus"></i>
              <span>添加</span>
            </button>
          </div>
        </form>
      </section>

      <div class="contact-list">
        <button
          v-for="contact in filteredContacts"
          :key="contact.id"
          class="contact-item"
          type="button"
          @click="selectContact(contact)"
        >
          <span
            class="contact-avatar"
            :class="{ flippable: contact.type !== 'group', flipping: isAvatarFlipping(contact.name) }"
            :title="contact.type === 'group' ? '' : '选择头像'"
            @click.stop="contact.type !== 'group' && showAvatarModal(contact.name)"
          >
            <i v-if="contact.type === 'group'" class="fas fa-users"></i>
            <img
              v-else-if="shouldUseAvatarImage(contact.name)"
              :class="getAvatarImageClass(contact.name)"
              :src="getAvatarUrl(contact.name)"
              :alt="contact.name"
              @error="markAvatarFailed(contact.name)"
            />
            <span v-else>{{ contactInitial(contact.name) }}</span>
          </span>
          <span class="contact-main">
            <span class="contact-name-line">
              <span class="contact-name">{{ contact.name }}</span>
              <span v-if="contact.type === 'group'" class="contact-badge" :class="{ dissolved: contact.dissolved }">
                {{ contact.dissolved ? '已解散' : `${contact.members?.length || 0}人` }}
              </span>
            </span>
            <span class="contact-last">{{ contact.lastMessage || contactSubtitle(contact) || ' ' }}</span>
          </span>
          <span class="contact-time">{{ contact.lastTime }}</span>
        </button>

        <div v-if="isLoadingContacts" class="contact-loading" aria-label="正在加载联系人">
          <i class="fas fa-spinner fa-spin"></i>
        </div>

        <div v-else-if="filteredContacts.length === 0" class="empty-state">
          <i :class="activeThreadKind === 'group' ? 'fas fa-user-group' : 'fas fa-user-slash'"></i>
          <span>{{ emptyContactText }}</span>
        </div>
      </div>

      <div v-if="errorText" class="error-row contact-error">
        <i class="fas fa-triangle-exclamation"></i>
        <span>{{ errorText }}</span>
      </div>

      <nav class="thread-tabs" aria-label="后街分类">
        <button
          class="thread-tab"
          :class="{ active: activeThreadKind === 'private' }"
          type="button"
          title="私聊"
          aria-label="私聊"
          @click="setThreadKind('private')"
        >
          <i class="fas fa-comment"></i>
          <span>私聊</span>
          <strong>{{ privateContacts.length }}</strong>
        </button>
        <button
          class="thread-tab"
          :class="{ active: activeThreadKind === 'group' }"
          type="button"
          title="群聊"
          aria-label="群聊"
          @click="setThreadKind('group')"
        >
          <i class="fas fa-user-group"></i>
          <span>群聊</span>
          <strong>{{ groupContacts.length }}</strong>
        </button>
      </nav>
    </aside>

    <section v-else class="chat-panel">
      <header class="chat-header">
        <button class="header-back-btn" type="button" title="联系人" aria-label="联系人" @click="backToContacts">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="chat-title">
          <span class="chat-title-avatar">
            <i v-if="activeIsGroup" class="fas fa-users"></i>
            <img
              v-else-if="shouldUseAvatarImage(activeDisplayName)"
              :class="getAvatarImageClass(activeDisplayName)"
              :src="getAvatarUrl(activeDisplayName)"
              :alt="activeDisplayName"
              @error="markAvatarFailed(activeDisplayName)"
            />
            <span v-else>{{ contactInitial(activeDisplayName) }}</span>
          </span>
          <div class="chat-title-info">
            <span class="chat-title-name">{{ activeDisplayName }}</span>
            <span class="chat-title-status" :class="{ dissolved: activeIsDissolved }">
              <i class="status-dot"></i>{{ activeStatusText }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button
            v-if="activeIsGroup"
            class="header-action-btn"
            type="button"
            title="群管理"
            aria-label="群管理"
            @click="toggleGroupManager"
          >
            <i class="fas fa-user-gear"></i>
          </button>
          <button
            class="header-action-btn"
            type="button"
            title="刷新"
            aria-label="刷新"
            @click="loadThread(activeContact)"
          >
            <i class="fas fa-rotate"></i>
          </button>
        </div>
      </header>

      <section v-if="showGroupManager && activeIsGroup" class="group-manager" :class="{ dissolved: activeIsDissolved }">
        <div class="group-manager-head">
          <span>
            <i class="fas fa-users"></i>
            <strong>成员</strong>
            <em>{{ activeMembers.length }}</em>
          </span>
          <button type="button" title="关闭" aria-label="关闭" @click="closeGroupManager">
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <div class="managed-members">
          <div v-for="member in activeMembers" :key="member" class="managed-member">
            <span>{{ contactInitial(member) }}</span>
            <strong>{{ member }}</strong>
            <button
              type="button"
              title="踢出"
              aria-label="踢出"
              :disabled="isUpdatingGroup || activeIsDissolved || activeMembers.length <= 1"
              @click="removeGroupMember(member)"
            >
              <i class="fas fa-user-minus"></i>
            </button>
          </div>
        </div>

        <div v-if="!activeIsDissolved" class="invite-area">
          <div class="member-picker-header">
            <span>拉入</span>
            <strong>{{ selectedInviteMembers.length }}/{{ inviteMemberChoices.length }}</strong>
          </div>
          <div class="member-picker invite-picker">
            <button
              v-for="contact in inviteMemberChoices"
              :key="contact.id"
              class="member-option"
              :class="{ selected: isInviteMemberSelected(contact.name) }"
              type="button"
              @click="toggleInviteMember(contact.name)"
            >
              <span class="member-avatar">{{ contactInitial(contact.name) }}</span>
              <strong>{{ contact.name }}</strong>
              <i class="fas fa-check"></i>
            </button>
            <div v-if="inviteMemberChoices.length === 0" class="member-empty">
              <i class="fas fa-user-check"></i>
              <span>暂无可拉入成员</span>
            </div>
          </div>
          <button class="group-invite-btn" type="button" :disabled="!canInviteMembers" @click="addInviteMembers">
            <i class="fas fa-user-plus"></i>
            <span>拉入</span>
          </button>
        </div>

        <div class="group-danger-row">
          <button
            class="group-dissolve-btn"
            type="button"
            :disabled="isUpdatingGroup || activeIsDissolved"
            @click="dissolveGroup"
          >
            <i class="fas fa-user-xmark"></i>
            <span>{{ activeIsDissolved ? '已解散' : '解散' }}</span>
          </button>
        </div>
      </section>

      <div ref="messageListRef" class="message-list">
        <button v-if="hasOlderMessages" class="load-older-messages" type="button" @click="loadOlderMessages">
          <i class="fas fa-chevron-up"></i>
          <span>加载更早消息</span>
        </button>

        <template v-for="(message, index) in visibleMessages" :key="message.id">
          <div v-if="shouldShowTimestamp(index)" class="time-divider">
            <span>{{ message.time }}</span>
          </div>

          <div class="message-row" :class="[message.sender, { 'has-image': isImageMessage(message) }]">
            <!-- Contact / system avatar on the left -->
            <span v-if="message.sender === 'contact' || message.sender === 'system'" class="msg-avatar">
              <template v-if="activeIsGroup && message.sender === 'contact'">
                <img
                  v-if="shouldUseAvatarImage(messageSpeaker(message))"
                  :class="getAvatarImageClass(messageSpeaker(message))"
                  :src="getAvatarUrl(messageSpeaker(message))"
                  :alt="messageSpeaker(message)"
                  @error="markAvatarFailed(messageSpeaker(message))"
                />
                <span v-else>{{ contactInitial(messageSpeaker(message)) }}</span>
              </template>
              <img
                v-else-if="shouldUseAvatarImage(activeDisplayName)"
                :class="getAvatarImageClass(activeDisplayName)"
                :src="getAvatarUrl(activeDisplayName)"
                :alt="activeDisplayName"
                @error="markAvatarFailed(activeDisplayName)"
              />
              <span v-else>{{ contactInitial(activeDisplayName) }}</span>
            </span>

            <div
              class="message-bubble"
              :class="{ 'actions-open': activeActionMessageId === message.id }"
              @click="toggleMessageActions(message)"
            >
              <div class="message-actions">
                <button
                  v-if="message.sender === 'user'"
                  class="message-action message-reroll"
                  type="button"
                  title="重 roll 此条回复"
                  aria-label="重 roll 此条回复"
                  @click.stop="rerollFromUserMessage(message)"
                >
                  <i class="fas fa-rotate-right"></i>
                </button>
                <button
                  v-if="canRerollImageMessage(message)"
                  class="message-action message-reroll message-image-reroll"
                  type="button"
                  title="重 roll 图片"
                  aria-label="重 roll 图片"
                  @click.stop="rerollImageMessage(message)"
                >
                  <i class="fas fa-rotate"></i>
                </button>
                <button
                  v-if="canToggleUserImagePrompt(message)"
                  class="message-action message-prompt-toggle"
                  :class="{ active: message.imageHiddenFromPrompt }"
                  type="button"
                  :title="imagePromptToggleTitle(message)"
                  :aria-label="imagePromptToggleTitle(message)"
                  @click.stop="toggleUserImagePromptHidden(message)"
                >
                  <i :class="message.imageHiddenFromPrompt ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
                <button
                  class="message-action message-delete"
                  type="button"
                  title="删除此处及以下消息"
                  aria-label="删除此处及以下消息"
                  @click.stop="deleteMessage(message)"
                >
                  <i class="fas fa-trash-can"></i>
                </button>
              </div>
              <div v-if="activeIsGroup && message.sender === 'contact'" class="message-speaker">
                {{ messageSpeaker(message) }}
              </div>
              <div v-if="isImageMessage(message)" class="message-image-block">
                <button
                  v-if="getMessageImageUrl(message)"
                  class="message-image-button"
                  type="button"
                  title="查看图片"
                  aria-label="查看图片"
                  @click.stop="openMessageImage(message)"
                >
                  <img :src="getMessageImageUrl(message)" :alt="message.text || '后街图片'" />
                </button>
                <div v-else-if="message.imageError" class="message-image-error">
                  <i class="fas fa-image"></i>
                  <span>{{ message.imageError }}</span>
                </div>
                <div v-else class="message-image-loading">
                  <i class="fas fa-spinner"></i>
                  <span>图片载入中</span>
                </div>
                <div
                  v-if="message.sender === 'user' && message.imageHiddenFromPrompt"
                  class="message-image-prompt-state"
                >
                  <i class="fas fa-eye-slash"></i>
                  <span>已隐藏，不发送给 AI</span>
                </div>
                <div v-if="message.text" class="message-text image-caption">{{ message.text }}</div>
              </div>
              <div v-else class="message-text">{{ message.text }}</div>
            </div>

            <!-- User avatar on the right -->
            <span v-if="message.sender === 'user'" class="msg-avatar user-avatar">
              <img v-if="playerAvatarUrl" :src="playerAvatarUrl" alt="我" />
              <i v-else class="fas fa-user"></i>
            </span>
          </div>
        </template>

        <div v-if="messages.length === 0" class="empty-state chat-empty">
          <i class="fas fa-comment-dots"></i>
          <span>暂无消息</span>
        </div>

        <div v-if="isSending" class="message-row contact">
          <span class="msg-avatar">
            <i v-if="activeIsGroup" class="fas fa-users"></i>
            <img
              v-else-if="shouldUseAvatarImage(activeDisplayName)"
              :class="getAvatarImageClass(activeDisplayName)"
              :src="getAvatarUrl(activeDisplayName)"
              :alt="activeDisplayName"
              @error="markAvatarFailed(activeDisplayName)"
            />
            <span v-else>{{ contactInitial(activeDisplayName) }}</span>
          </span>
          <div class="message-bubble typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div v-if="errorText" class="error-row">
        <i class="fas fa-triangle-exclamation"></i>
        <span>{{ errorText }}</span>
      </div>

      <form class="composer" @submit.prevent="sendMessage">
        <div v-if="showMentionPanel" class="mention-panel">
          <button
            v-for="(member, index) in mentionCandidates"
            :key="member"
            class="mention-option"
            :class="{ selected: index === selectedMentionIndex }"
            type="button"
            @mousedown.prevent="insertMention(member)"
          >
            <span class="mention-avatar">
              <img
                v-if="shouldUseAvatarImage(member)"
                :class="getAvatarImageClass(member)"
                :src="getAvatarUrl(member)"
                :alt="member"
                @error="markAvatarFailed(member)"
              />
              <span v-else>{{ contactInitial(member) }}</span>
            </span>
            <span class="mention-name">@{{ member }}</span>
          </button>
        </div>
        <div v-if="showEmojiPanel" class="emoji-panel" aria-label="emoji 与表情包列表">
          <div class="emoji-tabs">
            <button
              class="emoji-tab"
              :class="{ active: emojiPanelTab === 'emoji' }"
              type="button"
              @mousedown.prevent="emojiPanelTab = 'emoji'"
            >
              emoji
            </button>
            <button
              class="emoji-tab"
              :class="{ active: emojiPanelTab === 'sticker' }"
              type="button"
              @mousedown.prevent="openStickerTab"
            >
              表情包
            </button>
          </div>
          <div v-if="emojiPanelTab === 'emoji'" class="emoji-grid">
            <button
              v-for="emoji in EMOJI_OPTIONS"
              :key="emoji"
              class="emoji-option"
              type="button"
              @mousedown.prevent="insertEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
          <div v-else class="sticker-panel">
            <div v-if="stickerPreview" class="sticker-preview">
              <img :src="stickerPreview.url" :alt="stickerPreview.name" />
              <span>{{ stickerPreview.name }}</span>
            </div>
            <label class="sticker-prompt-toggle" :title="stickerPromptToggleHelp" :data-help="stickerPromptToggleHelp">
              <input v-model="stickerHiddenFromPrompt" type="checkbox" />
              <span>将表情包图片改为表情描述</span>
              <i class="fas fa-circle-question"></i>
            </label>
            <div class="sticker-grid">
              <button
                v-for="sticker in stickerOptions"
                :key="sticker.id"
                class="sticker-option"
                type="button"
                :title="sticker.name"
                :aria-label="sticker.name"
                @pointerenter="showStickerPreview(sticker)"
                @pointerleave="hideStickerPreview(sticker)"
                @pointercancel="clearStickerPreviewTimer"
                @pointerdown="startStickerPreviewPress(sticker)"
                @pointerup="clearStickerPreviewTimer"
                @click.prevent="sendSticker(sticker)"
              >
                <img :src="sticker.url" :alt="sticker.name" loading="lazy" />
              </button>
              <div v-if="isLoadingStickers" class="sticker-state">加载中</div>
              <button
                v-else-if="stickerLoadError"
                class="sticker-state retry"
                type="button"
                @mousedown.prevent="loadStickerManifest(true)"
              >
                重新加载
              </button>
              <div v-else-if="stickerOptions.length === 0" class="sticker-state">暂无表情包</div>
            </div>
          </div>
        </div>
        <div v-if="pendingImageAttachments.length > 0" class="composer-attachment-preview">
          <div
            v-for="(attachment, index) in pendingImageAttachments"
            :key="attachment.previewUrl"
            class="composer-attachment-item"
          >
            <img :src="attachment.previewUrl" :alt="attachment.file.name" />
            <span>{{ attachment.file.name }}</span>
            <button type="button" title="移除图片" aria-label="移除图片" @click="removePendingImageAttachment(index)">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>
        <button
          class="composer-attach-toggle"
          type="button"
          title="发送图片"
          aria-label="发送图片"
          :disabled="isSending || activeIsDissolved"
          @click="openImageFilePicker"
        >
          <i class="fas fa-image"></i>
        </button>
        <textarea
          ref="composerInputRef"
          v-model="draft"
          :disabled="isSending || activeIsDissolved"
          rows="1"
          :placeholder="composerPlaceholder"
          @click="updateMentionState"
          @focus="updateMentionState"
          @input="updateMentionState"
          @keyup="updateMentionState"
          @keydown="handleComposerKeydown"
          @compositionstart="handleComposerCompositionStart"
          @compositionend="handleComposerCompositionEnd"
          @paste="handleComposerPaste"
        ></textarea>
        <button
          class="composer-emoji-toggle"
          :class="{ active: showEmojiPanel }"
          type="button"
          title="emoji"
          aria-label="emoji"
          :disabled="isSending || activeIsDissolved"
          @click="toggleEmojiPanel"
        >
          <i class="fas fa-face-smile"></i>
        </button>
        <button class="composer-send" type="submit" title="发送" aria-label="发送" :disabled="!canSendMessage">
          <i class="fas fa-paper-plane"></i>
        </button>
        <input
          ref="imageInputRef"
          class="composer-file-input"
          type="file"
          accept="image/*"
          multiple
          @change="handleImageFileSelected"
        />
      </form>
    </section>
  </div>

  <div v-if="showAvatarPicker" class="avatar-modal" @click="closeAvatarModal">
    <div class="modal-backdrop"></div>
    <div class="modal-content" @click.stop>
      <button class="modal-close" type="button" title="关闭" aria-label="关闭" @click="closeAvatarModal">
        <i class="fas fa-times"></i>
      </button>
      <div class="modal-header">
        <h3>{{ modalCharacterName }}</h3>
      </div>
      <div class="modal-body avatar-carousel">
        <button
          v-if="modalAvatarSlides.length > 1"
          class="avatar-nav avatar-nav-prev"
          type="button"
          title="上一个头像"
          aria-label="上一个头像"
          @click="showPreviousAvatarVariation"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <img
          v-if="currentModalAvatarSlide.unlocked"
          :key="`${currentModalAvatarSlide.kind}:${currentModalAvatarSlide.variationKey || currentModalAvatarSlide.url}`"
          :src="currentModalAvatarSlide.url"
          :alt="modalCharacterName"
          class="modal-avatar-img"
          @error="handleModalImageError"
        />
        <div v-else class="avatar-locked-panel">
          <i class="fas fa-lock"></i>
          <span>{{ currentModalAvatarSlide.label }}</span>
        </div>
        <button
          v-if="modalAvatarSlides.length > 1"
          class="avatar-nav avatar-nav-next"
          type="button"
          title="下一个头像"
          aria-label="下一个头像"
          @click="showNextAvatarVariation"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div v-if="modalAvatarSlides.length > 1" class="avatar-carousel-footer">
        <span class="avatar-slide-label" :class="{ locked: !currentModalAvatarSlide.unlocked }">
          <i v-if="!currentModalAvatarSlide.unlocked" class="fas fa-lock"></i>
          {{ currentModalAvatarSlide.label }}
        </span>
        <div class="avatar-slide-dots" aria-hidden="true">
          <span
            v-for="(slide, index) in modalAvatarSlides"
            :key="`${slide.label}-${index}`"
            :class="{ active: index === modalAvatarIndex, locked: !slide.unlocked }"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { backstreetService } from '../../phone/backstreetService';
import type { BackstreetContact, BackstreetMessage, BackstreetThreadKind } from '../../phone/types';
import { makeId } from '../../phone/text';
import {
  BACKSTREET_CONTACT_AVATAR_STORAGE_KEY,
  DEFAULT_BACKSTREET_AVATAR_MODE,
  getChibiAvatarName,
  getChibiAvatarUrl,
  getDefaultPlayerAvatarUrl,
  getNormalAvatarUrl,
  loadContactAvatarModes,
  normalizeBackstreetAvatarMode,
  saveContactAvatarModes,
  type BackstreetAvatarMode,
} from '../../phone/backstreetAvatarSettings';
import { ENEMY_DATABASE, NAME_ALIASES } from '../../../战斗界面/enemyDatabase';
import {
  getIndexedImageObjectUrl,
  isIndexedImageRef,
  makeIndexedImageRef,
  revokeIndexedImageObjectUrl,
  saveIndexedImageBlob,
} from '../../../shared/indexedImageStore';
import { PLAYER_AVATAR_UPDATED_EVENT, resolveStoredPlayerAvatar } from '../../../shared/localPreferences';
import { getLatestMvuData, replaceLatestMvuData, runLatestMvuTransaction } from '../../../shared/mvuStore';
import {
  AVATAR_VARIATIONS_UPDATED_EVENT,
  filterAvailableAvatarVariationOptions,
  getAvatarVariationConfigForCharacter,
  getSelectedAvatarVariationKey,
  getSelectedAvatarVariationUrl,
  getUnlockedAvatarVariationOptions,
  selectAvatarVariation,
  type AvatarVariationKey,
  type AvatarVariationOption,
} from '../../../shared/avatarVariationStore';

const props = defineProps<{
  characterData: any;
}>();

const emit = defineEmits<{
  (event: 'backHome'): void;
}>();

const PHONE_PREFS_STORAGE_KEY = 'fatria-status-phone-preferences-v1';
const PHONE_PREFS_UPDATED_EVENT = 'fatria-status-phone-preferences-updated';
const DEFAULT_VISIBLE_MESSAGE_COUNT = 30;
const STICKER_MANIFEST_BASE_URL = 'https://img.vinsimage.org/性斗学园/表情包/';
const STICKER_MANIFEST_SCRIPT_URL = `${STICKER_MANIFEST_BASE_URL}manifest.js`;
const STICKER_MANIFEST_JSON_URL = `${STICKER_MANIFEST_BASE_URL}manifest.json`;
const STICKER_MANIFEST_GLOBAL = 'FATRIA_BACKSTREET_STICKERS';
const STICKER_PROMPT_STORAGE_KEY = 'fatria-backstreet-sticker-hidden-from-prompt-v1';
const STICKER_PROMPT_TOGGLE_HELP =
  '适用于非多模态模型：勾选后聊天里仍显示表情包，但发送给 AI 的内容会改为文字描述，不再发送图片输入。';
const EMOJI_OPTIONS = [
  '😀',
  '😄',
  '😂',
  '😊',
  '😉',
  '🥺',
  '😳',
  '😭',
  '😤',
  '😏',
  '🤔',
  '😎',
  '👍',
  '🙏',
  '👏',
  '👀',
  '💢',
  '💦',
  '✨',
  '🔥',
  '❤️',
  '💔',
];

interface PendingImageAttachment {
  file: File;
  previewUrl: string;
}

interface StickerManifestItem {
  id?: string;
  name?: string;
  description?: string;
  file?: string;
  url?: string;
}

interface StickerManifest {
  version?: string;
  baseUrl?: string;
  stickers?: StickerManifestItem[];
}

interface StickerOption {
  id: string;
  name: string;
  url: string;
  description: string;
}

const contacts = ref<BackstreetContact[]>([]);
const isLoadingContacts = ref(false);
const messages = ref<BackstreetMessage[]>([]);
const activeContact = ref('');
const activeThreadKind = ref<BackstreetThreadKind>('private');
const searchText = ref('');
const draft = ref('');
const isSending = ref(false);
const isCreatingGroup = ref(false);
const errorText = ref('');
const messageListRef = ref<HTMLElement | null>(null);
const composerInputRef = ref<HTMLTextAreaElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const failedAvatars = ref(new Set<string>());
const flippingAvatars = ref(new Set<string>());
const contactAvatarModes = ref<Record<string, BackstreetAvatarMode>>(loadContactAvatarModes());
const selectedAvatarUrls = ref<Record<string, string>>({});
const selectedAvatarKeys = ref<Record<string, AvatarVariationKey | null>>({});
const avatarOptionsByCharacter = ref<Record<string, AvatarVariationOption[]>>({});
const allAvatarOptionsByCharacter = ref<Record<string, AvatarVariationOption[]>>({});
const defaultAvatarMode = ref<BackstreetAvatarMode>(readDefaultAvatarMode());
const playerAvatarUrl = ref('');
const messageImageUrls = ref<Record<string, string>>({});
let avatarRefreshToken = 0;
const pendingImageAttachments = ref<PendingImageAttachment[]>([]);
const visibleMessageCount = ref(readVisibleMessageCount());
const activeActionMessageId = ref('');
const showContactCreator = ref(false);
const contactNameDraft = ref('');
const isAddingContact = ref(false);
const showGroupCreator = ref(false);
const groupNameDraft = ref('');
const selectedGroupMembers = ref<string[]>([]);
const showGroupManager = ref(false);
const selectedInviteMembers = ref<string[]>([]);
const isUpdatingGroup = ref(false);
const mentionQuery = ref('');
const mentionStartIndex = ref(-1);
const selectedMentionIndex = ref(0);
const showEmojiPanel = ref(false);
const emojiPanelTab = ref<'emoji' | 'sticker'>('emoji');
const stickerOptions = ref<StickerOption[]>([]);
const isLoadingStickers = ref(false);
const stickerLoadError = ref('');
const stickerHiddenFromPrompt = ref(readStickerHiddenFromPrompt());
const stickerPreview = ref<StickerOption | null>(null);
const stickerPromptToggleHelp = STICKER_PROMPT_TOGGLE_HELP;
const showAvatarPicker = ref(false);
const modalCharacterName = ref('');
const modalAvatarIndex = ref(0);

interface ModalAvatarSlide {
  kind: 'normal' | 'chibi' | 'variation';
  variationKey: AvatarVariationKey | null;
  label: string;
  url: string;
  unlocked: boolean;
}
let currentChatId = '';
let stopChatChangeListener: (() => void) | null = null;
let messageImageSyncId = 0;
let stickerPreviewPressTimer: number | null = null;
let stickerLongPressPreviewed = false;
let isComposerComposing = false;

const privateContacts = computed(() => contacts.value.filter(contact => contact.type !== 'group'));
const groupContacts = computed(() => contacts.value.filter(contact => contact.type === 'group'));
const currentThreadContacts = computed(() =>
  activeThreadKind.value === 'group' ? groupContacts.value : privateContacts.value,
);
const searchPlaceholder = computed(() => (activeThreadKind.value === 'group' ? '搜索群聊' : '搜索联系人'));
const emptyContactText = computed(() => (activeThreadKind.value === 'group' ? '没有群聊' : '没有联系人'));
const groupLaunchMeta = computed(() =>
  privateContactChoices.value.length > 0 ? `${privateContactChoices.value.length} 位可选联系人` : '暂无可选联系人',
);
const filteredContacts = computed(() => {
  const query = searchText.value.trim().toLowerCase();
  const list = currentThreadContacts.value;
  if (!query) return list.slice(0, 120);
  return list.filter(contact => contact.name.toLowerCase().includes(query)).slice(0, 120);
});
const visibleMessages = computed(() => messages.value.slice(-visibleMessageCount.value));
const hasOlderMessages = computed(() => messages.value.length > visibleMessages.value.length);
const activeThread = computed(() => contacts.value.find(contact => contact.id === activeContact.value) || null);
const activeDisplayName = computed(() => activeThread.value?.name || activeContact.value);
const activeIsGroup = computed(() => activeThread.value?.type === 'group');
const activeMembers = computed(() => activeThread.value?.members || []);
const activeIsDissolved = computed(() => Boolean(activeThread.value?.dissolved));
const activeMembersText = computed(() => {
  const members = activeMembers.value;
  if (!activeIsGroup.value || members.length === 0) return '';
  return members.join('、');
});
const activeStatusText = computed(() => {
  if (activeIsDissolved.value) return '已解散';
  return activeMembersText.value || '在线';
});
const privateContactChoices = computed(() => privateContacts.value);
const inviteMemberChoices = computed(() => {
  const memberSet = new Set(activeMembers.value);
  return privateContacts.value.filter(contact => !memberSet.has(contact.name));
});
const canCreateGroup = computed(
  () => groupNameDraft.value.trim().length > 0 && selectedGroupMembers.value.length >= 2 && !isCreatingGroup.value,
);
const canInviteMembers = computed(
  () => selectedInviteMembers.value.length > 0 && !isUpdatingGroup.value && !activeIsDissolved.value,
);
const canAddPrivateContact = computed(
  () => normalizeContactName(contactNameDraft.value).length > 0 && !isAddingContact.value,
);
const composerPlaceholder = computed(() => (activeIsDissolved.value ? '群聊已解散' : '发送消息…'));
const canSendMessage = computed(
  () =>
    !isSending.value &&
    !activeIsDissolved.value &&
    Boolean(activeContact.value) &&
    Boolean(draft.value.trim() || pendingImageAttachments.value.length > 0),
);
const mentionCandidates = computed(() => {
  if (!activeIsGroup.value || activeIsDissolved.value) return [];
  const query = mentionQuery.value.trim().toLowerCase();
  const members = activeMembers.value;
  const matchedMembers = query ? members.filter(member => member.toLowerCase().includes(query)) : members;
  return matchedMembers.slice(0, 8);
});
const showMentionPanel = computed(
  () =>
    activeIsGroup.value &&
    !activeIsDissolved.value &&
    mentionStartIndex.value >= 0 &&
    mentionCandidates.value.length > 0,
);

watch(
  () => props.characterData,
  () => {
    loadContacts();
    void loadPlayerAvatar();
  },
  { deep: false },
);

watch(stickerHiddenFromPrompt, value => {
  try {
    window.localStorage?.setItem(STICKER_PROMPT_STORAGE_KEY, value ? '1' : '0');
  } catch {
    // ignore storage failures
  }
});

function handleAvatarVariationsUpdated() {
  void refreshAvatarVariationState(true);
}

onMounted(() => {
  void loadContacts();
  void loadPlayerAvatar();
  setupChatChangeListener();
  window.addEventListener(PLAYER_AVATAR_UPDATED_EVENT, handlePlayerAvatarUpdated);
  window.addEventListener(AVATAR_VARIATIONS_UPDATED_EVENT, handleAvatarVariationsUpdated);
  window.addEventListener(PHONE_PREFS_UPDATED_EVENT, handlePhonePreferencesUpdated);
  window.addEventListener('storage', handlePhonePreferencesStorage);
});

onUnmounted(() => {
  stopChatChangeListener?.();
  stopChatChangeListener = null;
  clearStickerPreviewTimer();
  window.removeEventListener(PLAYER_AVATAR_UPDATED_EVENT, handlePlayerAvatarUpdated);
  window.removeEventListener(AVATAR_VARIATIONS_UPDATED_EVENT, handleAvatarVariationsUpdated);
  window.removeEventListener(PHONE_PREFS_UPDATED_EVENT, handlePhonePreferencesUpdated);
  window.removeEventListener('storage', handlePhonePreferencesStorage);
  clearPendingImageAttachments();
  revokeMessageImageUrls();
});

watch(
  messages,
  () => {
    void syncMessageImageUrls();
  },
  { deep: false },
);

function clampVisibleMessageCount(value: unknown): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_VISIBLE_MESSAGE_COUNT;
  return Math.min(100, Math.max(5, Math.round(numericValue)));
}

function readVisibleMessageCount(): number {
  try {
    const raw = window.localStorage?.getItem(PHONE_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE_MESSAGE_COUNT;
    const parsed = JSON.parse(raw) as { backstreetVisibleMessageCount?: unknown };
    return clampVisibleMessageCount(parsed.backstreetVisibleMessageCount);
  } catch {
    return DEFAULT_VISIBLE_MESSAGE_COUNT;
  }
}

function readDefaultAvatarMode(): BackstreetAvatarMode {
  try {
    const raw = window.localStorage?.getItem(PHONE_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_BACKSTREET_AVATAR_MODE;

    const parsed = JSON.parse(raw) as { backstreetAvatarMode?: unknown };
    return normalizeBackstreetAvatarMode(parsed.backstreetAvatarMode);
  } catch {
    return DEFAULT_BACKSTREET_AVATAR_MODE;
  }
}

function readStickerHiddenFromPrompt(): boolean {
  try {
    return window.localStorage?.getItem(STICKER_PROMPT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function syncVisibleMessageCount() {
  visibleMessageCount.value = readVisibleMessageCount();
}

function syncAvatarPreferences() {
  defaultAvatarMode.value = readDefaultAvatarMode();
  contactAvatarModes.value = loadContactAvatarModes();
}

function handlePhonePreferencesUpdated(event: Event) {
  const detail = (event as CustomEvent).detail;
  if (detail && Object.prototype.hasOwnProperty.call(detail, 'backstreetVisibleMessageCount')) {
    visibleMessageCount.value = clampVisibleMessageCount(detail.backstreetVisibleMessageCount);
  } else {
    syncVisibleMessageCount();
  }

  if (detail && Object.prototype.hasOwnProperty.call(detail, 'backstreetAvatarMode')) {
    defaultAvatarMode.value = normalizeBackstreetAvatarMode(detail.backstreetAvatarMode);
  } else {
    defaultAvatarMode.value = readDefaultAvatarMode();
  }
  void refreshAvatarVariationState(true);
}

function handlePhonePreferencesStorage(event: StorageEvent) {
  if (event.key && event.key !== PHONE_PREFS_STORAGE_KEY && event.key !== BACKSTREET_CONTACT_AVATAR_STORAGE_KEY) return;
  syncVisibleMessageCount();
  syncAvatarPreferences();
  void refreshAvatarVariationState(true);
}

function getHostWindow(): any {
  try {
    return window.parent && window.parent !== window ? window.parent : window;
  } catch {
    return window;
  }
}

function withCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function resolveStickerUrl(item: StickerManifestItem, baseUrl: string, version: string): string {
  const rawUrl = String(item.url || '').trim();
  const rawFile = String(item.file || '').trim();
  const source = rawUrl || rawFile;
  if (!source) return '';

  const url =
    /^https?:\/\//i.test(source) || /^data:image\//i.test(source)
      ? source
      : `${baseUrl.replace(/\/+$/, '')}/${trimSlashes(source)
          .split('/')
          .map(part => encodeURIComponent(part))
          .join('/')}`;
  if (!version || /^data:image\//i.test(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function stripStickerExtension(value: string): string {
  return value.replace(/\.(?:png|jpe?g|webp|gif|avif|bmp)$/i, '');
}

function cleanStickerText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeStickerLabel(value: string): string {
  return stripStickerExtension(cleanStickerText(value))
    .replace(/[_-]*表情包[_-]*/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function describeSticker(item: StickerManifestItem, displayName: string): string {
  const explicitDescription = cleanStickerText(item.description);
  if (explicitDescription) return explicitDescription;

  const label = normalizeStickerLabel(displayName || item.file || item.id || '表情包');
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const character = parts[0];
    const meaning = parts.slice(1).join(' ');
    return `${character}表情包，画面文字/含义是「${meaning}」，通常表示发送者用这个表情包表达「${meaning}」的情绪或吐槽。`;
  }
  return `表情包「${label || '未命名'}」，请结合图片内容理解发送者此刻的情绪、吐槽或反应。`;
}

function formatStickerMessageText(sticker: StickerOption, textOnly: boolean): string {
  if (!textOnly) return '';
  const description = cleanStickerText(sticker.description) || `表情包「${sticker.name || '未命名'}」`;
  return `用户发送了一个表情包，表情包描述：${description}`;
}

function normalizeStickerManifest(manifest: StickerManifest | null | undefined): StickerOption[] {
  const items = Array.isArray(manifest?.stickers) ? manifest.stickers : [];
  const baseUrl = String(manifest?.baseUrl || STICKER_MANIFEST_BASE_URL).trim() || STICKER_MANIFEST_BASE_URL;
  const version = String(manifest?.version || '').trim();
  return items
    .map((item, index) => {
      const url = resolveStickerUrl(item, baseUrl, version);
      const name = String(item.name || item.id || item.file || `表情包 ${index + 1}`).trim();
      const id = String(item.id || item.file || item.url || `${name}-${index}`).trim();
      const description = describeSticker(item, name);
      return url ? { id, name, url, description } : null;
    })
    .filter((item): item is StickerOption => Boolean(item));
}

function loadStickerManifestScript(): Promise<StickerManifest | null> {
  return new Promise(resolve => {
    const globalTarget = window as typeof window & Record<string, unknown>;
    delete globalTarget[STICKER_MANIFEST_GLOBAL];
    const script = document.createElement('script');
    script.src = withCacheBust(STICKER_MANIFEST_SCRIPT_URL);
    script.async = true;
    script.onload = () => {
      script.remove();
      resolve((globalTarget[STICKER_MANIFEST_GLOBAL] as StickerManifest | undefined) || null);
    };
    script.onerror = () => {
      script.remove();
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

async function loadStickerManifest(force = false) {
  if (isLoadingStickers.value || (!force && stickerOptions.value.length > 0)) return;
  isLoadingStickers.value = true;
  stickerLoadError.value = '';
  try {
    const scriptManifest = await loadStickerManifestScript();
    const manifest =
      scriptManifest ||
      ((await fetch(withCacheBust(STICKER_MANIFEST_JSON_URL), { cache: 'no-store' }).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<StickerManifest>;
      })) as StickerManifest);
    stickerOptions.value = normalizeStickerManifest(manifest);
  } catch (error) {
    console.warn('[后街页面] 表情包清单加载失败:', error);
    stickerLoadError.value = '表情包加载失败';
    stickerOptions.value = [];
  } finally {
    isLoadingStickers.value = false;
  }
}

function openStickerTab() {
  emojiPanelTab.value = 'sticker';
  void loadStickerManifest();
}

function readCurrentChatId(): string {
  const hostWindow = getHostWindow();
  return String(
    hostWindow.SillyTavern?.getCurrentChatId?.() || (globalThis as any).SillyTavern?.getCurrentChatId?.() || '',
  ).trim();
}

function resetForChatChange() {
  activeContact.value = '';
  messages.value = [];
  searchText.value = '';
  errorText.value = '';
  hideEmojiPanel();
  clearPendingImageAttachments();
  closeContactCreator();
  closeGroupCreator();
  closeGroupManager();
  void loadContacts();
}

function handleChatChanged(nextChatIdValue?: unknown) {
  const nextChatId = String(nextChatIdValue || readCurrentChatId()).trim();
  if (!nextChatId || nextChatId === currentChatId) return;
  currentChatId = nextChatId;
  resetForChatChange();
}

function setupChatChangeListener() {
  currentChatId = readCurrentChatId();
  const eventHandle = eventOn(tavern_events.CHAT_CHANGED, handleChatChanged);
  stopChatChangeListener = () => eventHandle.stop();
}

async function loadPlayerAvatar() {
  try {
    const url = await resolveStoredPlayerAvatar();
    playerAvatarUrl.value = url?.trim() || getDefaultPlayerAvatarUrl(props.characterData?.角色基础?.性别);
  } catch {
    playerAvatarUrl.value = getDefaultPlayerAvatarUrl(props.characterData?.角色基础?.性别);
  }
}

function handlePlayerAvatarUpdated() {
  void loadPlayerAvatar();
}

function isImageMessage(message: BackstreetMessage): boolean {
  return message.kind === 'image' || Boolean(message.imageRef || message.imagePrompt || message.imageError);
}

function canRerollImageMessage(message: BackstreetMessage): boolean {
  return isImageMessage(message) && message.imageSource === 'novelai' && Boolean(message.imagePrompt?.trim());
}

function canToggleUserImagePrompt(message: BackstreetMessage): boolean {
  const ref = message.imageRef?.trim();
  return message.sender === 'user' && isImageMessage(message) && Boolean(ref);
}

function imagePromptToggleTitle(message: BackstreetMessage): string {
  return message.imageHiddenFromPrompt ? '恢复发送给 AI' : '隐藏，不发送给 AI';
}

function getMessageImageUrl(message: BackstreetMessage): string {
  const ref = message.imageRef?.trim();
  if (!ref) return '';
  if (/^https?:\/\//i.test(ref) || /^data:image\//i.test(ref)) return ref;
  return messageImageUrls.value[ref] || '';
}

function revokeMessageImageUrls() {
  for (const url of Object.values(messageImageUrls.value)) {
    revokeIndexedImageObjectUrl(url);
  }
  messageImageUrls.value = {};
}

async function syncMessageImageUrls() {
  const syncId = ++messageImageSyncId;
  const refs = Array.from(
    new Set(messages.value.map(message => message.imageRef?.trim()).filter((ref): ref is string => Boolean(ref))),
  );
  const previous = messageImageUrls.value;
  const next: Record<string, string> = {};

  for (const ref of refs) {
    if (!isIndexedImageRef(ref)) continue;
    if (previous[ref]) {
      next[ref] = previous[ref];
      continue;
    }
    const url = await getIndexedImageObjectUrl(ref).catch(() => null);
    if (syncId !== messageImageSyncId) {
      revokeIndexedImageObjectUrl(url || '');
      return;
    }
    if (url) next[ref] = url;
  }

  for (const [ref, url] of Object.entries(previous)) {
    if (!next[ref]) revokeIndexedImageObjectUrl(url);
  }
  messageImageUrls.value = next;
}

function openMessageImage(message: BackstreetMessage) {
  const url = getMessageImageUrl(message);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openImageFilePicker() {
  if (isSending.value || activeIsDissolved.value) return;
  imageInputRef.value?.click();
}

function clearPendingImageAttachments() {
  for (const attachment of pendingImageAttachments.value) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
  pendingImageAttachments.value = [];
  if (imageInputRef.value) imageInputRef.value.value = '';
}

function removePendingImageAttachment(index: number) {
  const attachment = pendingImageAttachments.value[index];
  if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
  pendingImageAttachments.value = pendingImageAttachments.value.filter((_, itemIndex) => itemIndex !== index);
  if (imageInputRef.value) imageInputRef.value.value = '';
}

function setPendingImageAttachments(files: File[]) {
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  if (imageFiles.length !== files.length) {
    errorText.value = '请选择图片文件';
    if (imageInputRef.value) imageInputRef.value.value = '';
    return;
  }
  if (imageFiles.length > 2) {
    errorText.value = '单次最多只能发送 2 张图片';
    if (imageInputRef.value) imageInputRef.value.value = '';
    return;
  }
  if (imageFiles.length === 0) return;

  clearPendingImageAttachments();
  pendingImageAttachments.value = imageFiles.map(file => ({
    file,
    previewUrl: URL.createObjectURL(file),
  }));
  hideEmojiPanel();
  hideMentionPanel();
  nextTick(() => {
    composerInputRef.value?.focus();
  });
}

function handleImageFileSelected(event: Event) {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const files = Array.from(input?.files || []);
  if (files.length === 0) return;
  setPendingImageAttachments(files);
}

function getImageFilesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];

  const files: File[] = [];
  for (const item of Array.from(data.items || [])) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
    const file = item.getAsFile();
    if (!file) continue;
    const extension = file.type.split('/')[1] || 'png';
    files.push(
      file.name
        ? file
        : new File([file], `clipboard-image-${Date.now()}-${files.length + 1}.${extension}`, { type: file.type }),
    );
  }
  if (files.length > 0) return files;

  for (const file of Array.from(data.files || [])) {
    if (file.type.startsWith('image/')) files.push(file);
  }

  return files;
}

function insertTextAtCursor(text: string) {
  const value = String(text || '');
  if (!value) return;

  const textarea = composerInputRef.value;
  const start = textarea?.selectionStart ?? draft.value.length;
  const end = textarea?.selectionEnd ?? start;
  const before = draft.value.slice(0, start);
  const after = draft.value.slice(end);
  draft.value = `${before}${value}${after}`;

  nextTick(() => {
    const nextCursor = before.length + value.length;
    composerInputRef.value?.focus();
    composerInputRef.value?.setSelectionRange(nextCursor, nextCursor);
    updateMentionState();
  });
}

function handleComposerPaste(event: ClipboardEvent) {
  if (isSending.value || activeIsDissolved.value) return;
  const files = getImageFilesFromClipboard(event.clipboardData);
  if (files.length === 0) return;

  event.preventDefault();
  setPendingImageAttachments(files);
  insertTextAtCursor(event.clipboardData?.getData('text/plain') || '');
}

async function savePendingImageAttachments(contact: string): Promise<string[]> {
  const refs: string[] = [];
  for (const attachment of pendingImageAttachments.value) {
    const ref = makeIndexedImageRef(`backstreet-user:${contact}:${makeId('upload')}:${attachment.file.name}`);
    await saveIndexedImageBlob(ref, attachment.file);
    refs.push(ref);
  }
  return refs;
}

function getStickerFileName(sticker: StickerOption, contentType: string): string {
  const fallbackExtension = contentType.split('/')[1] || 'png';
  try {
    const url = new URL(sticker.url, window.location.href);
    const name = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) || '');
    if (name) return name;
  } catch {
    // fall back to id-based file name below
  }
  return `${sticker.id || makeId('sticker')}.${fallbackExtension}`;
}

async function fetchStickerAsFile(sticker: StickerOption): Promise<File> {
  let response: Response;
  try {
    response = await fetch(sticker.url, { cache: 'no-store' });
  } catch (error) {
    throw new Error(
      `表情包图片读取失败：图床未允许当前页面跨域读取图片。请在 R2 CORS Policy 中允许 ${window.location.origin} 后重试。`,
    );
  }

  if (!response.ok) {
    throw new Error(`表情包图片读取失败：HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const contentType = blob.type || response.headers.get('content-type') || 'image/png';
  if (!contentType.startsWith('image/')) {
    throw new Error('表情包图片读取失败：图床返回的不是图片文件');
  }

  return new File([blob], getStickerFileName(sticker, contentType), { type: contentType });
}

async function saveStickerImageAttachment(contact: string, sticker: StickerOption): Promise<string> {
  const file = await fetchStickerAsFile(sticker);
  const ref = makeIndexedImageRef(`backstreet-user:${contact}:${makeId('sticker')}:${file.name}`);
  await saveIndexedImageBlob(ref, file);
  return ref;
}

async function loadContacts(characterDataOverride: any = props.characterData || {}) {
  isLoadingContacts.value = true;
  try {
    contacts.value = await backstreetService.listContacts(characterDataOverride);
    void refreshAvatarVariationState(true);
  } catch (error) {
    console.warn('[后街页面] 联系人加载失败:', error);
    errorText.value = '联系人加载失败';
  } finally {
    isLoadingContacts.value = false;
  }
}

async function selectContact(contact: BackstreetContact) {
  activeContact.value = contact.id;
  activeActionMessageId.value = '';
  hideMentionPanel();
  hideEmojiPanel();
  clearPendingImageAttachments();
  closeGroupManager();
  void loadPlayerAvatar();
  await loadThread(contact.id);
}

async function loadThread(name: string) {
  try {
    errorText.value = '';
    activeActionMessageId.value = '';
    visibleMessageCount.value = readVisibleMessageCount();
    messages.value = await backstreetService.getMessages(name);
    await scrollToBottom();
  } catch (error) {
    console.warn('[后街页面] 聊天加载失败:', error);
    errorText.value = '聊天加载失败';
  }
}

async function loadOlderMessages() {
  const el = messageListRef.value;
  const previousScrollHeight = el?.scrollHeight || 0;
  const previousScrollTop = el?.scrollTop || 0;
  const increment = readVisibleMessageCount();
  visibleMessageCount.value = Math.min(messages.value.length, visibleMessageCount.value + increment);
  activeActionMessageId.value = '';
  await nextTick();
  if (el) {
    el.scrollTop = Math.max(0, el.scrollHeight - previousScrollHeight + previousScrollTop);
  }
}

function toggleMessageActions(message: BackstreetMessage) {
  activeActionMessageId.value = activeActionMessageId.value === message.id ? '' : message.id;
}

async function sendMessage() {
  const contact = activeContact.value;
  if (isComposerComposing) return;
  const text = getComposerText();
  if (!contact || (!text && pendingImageAttachments.value.length === 0) || isSending.value || activeIsDissolved.value)
    return;

  draft.value = '';
  hideMentionPanel();
  hideEmojiPanel();
  isSending.value = true;
  errorText.value = '';

  try {
    const imageRefs = await savePendingImageAttachments(contact);
    clearPendingImageAttachments();
    await backstreetService.appendUserMessage(contact, text, props.characterData || {}, { imageRefs });
    await loadThread(contact);
    await scrollToBottom();
    await loadContacts();

    await backstreetService.generateContactReply(contact, props.characterData || {});
    await loadThread(contact);
    await loadContacts();
  } catch (error) {
    console.error('[后街页面] 发送失败:', error);
    errorText.value = error instanceof Error ? error.message : '发送失败';
    await loadThread(contact);
  } finally {
    isSending.value = false;
    await scrollToBottom();
  }
}

async function deleteMessage(message: BackstreetMessage) {
  const contact = activeContact.value;
  if (!contact || isSending.value) return;
  try {
    errorText.value = '';
    messages.value = await backstreetService.deleteMessage(contact, message.id);
    await loadContacts();
    await scrollToBottom();
  } catch (error) {
    console.error('[后街页面] 删除消息失败:', error);
    errorText.value = error instanceof Error ? error.message : '删除失败';
  }
}

async function rerollFromUserMessage(message: BackstreetMessage) {
  const contact = activeContact.value;
  if (!contact || message.sender !== 'user' || isSending.value) return;

  isSending.value = true;
  errorText.value = '';

  try {
    messages.value = await backstreetService.deleteMessagesAfter(contact, message.id);
    await scrollToBottom();
    await loadContacts();

    await backstreetService.generateContactReply(contact, props.characterData || {});
    await loadThread(contact);
    await loadContacts();
  } catch (error) {
    console.error('[后街页面] 重 roll 失败:', error);
    errorText.value = error instanceof Error ? error.message : '重 roll 失败';
    await loadThread(contact);
  } finally {
    isSending.value = false;
    await scrollToBottom();
  }
}

async function rerollImageMessage(message: BackstreetMessage) {
  const contact = activeContact.value;
  if (!contact || !canRerollImageMessage(message) || isSending.value) return;

  isSending.value = true;
  errorText.value = '';

  try {
    messages.value = await backstreetService.rerollImageMessage(contact, message.id);
    await loadContacts();
    await scrollToBottom();
  } catch (error) {
    console.error('[后街页面] 图片重 roll 失败:', error);
    errorText.value = error instanceof Error ? error.message : '图片重 roll 失败';
    await loadThread(contact);
  } finally {
    isSending.value = false;
    await scrollToBottom();
  }
}

async function toggleUserImagePromptHidden(message: BackstreetMessage) {
  const contact = activeContact.value;
  if (!contact || !canToggleUserImagePrompt(message) || isSending.value) return;

  try {
    errorText.value = '';
    messages.value = await backstreetService.setUserImagePromptHidden(
      contact,
      message.id,
      !message.imageHiddenFromPrompt,
    );
    await loadContacts();
  } catch (error) {
    console.error('[后街页面] 图片提示词隐藏设置失败:', error);
    errorText.value = error instanceof Error ? error.message : '图片设置失败';
    await loadThread(contact);
  }
}

function backToContacts() {
  activeContact.value = '';
  messages.value = [];
  hideMentionPanel();
  hideEmojiPanel();
  clearPendingImageAttachments();
  closeGroupManager();
  loadContacts();
}

function setThreadKind(kind: BackstreetThreadKind) {
  activeThreadKind.value = kind;
  searchText.value = '';
  errorText.value = '';
  hideMentionPanel();
  hideEmojiPanel();
  closeGroupManager();
  if (kind !== 'group') {
    closeGroupCreator();
  } else {
    closeContactCreator();
  }
}

function openGroupCreator() {
  activeThreadKind.value = 'group';
  closeContactCreator();
  showGroupCreator.value = true;
  groupNameDraft.value = '';
  selectedGroupMembers.value = [];
  errorText.value = '';
}

function closeGroupCreator() {
  showGroupCreator.value = false;
  groupNameDraft.value = '';
  selectedGroupMembers.value = [];
}

function normalizeContactName(rawName: string): string {
  return String(rawName || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function openContactCreator() {
  activeThreadKind.value = 'private';
  closeGroupCreator();
  showContactCreator.value = true;
  contactNameDraft.value = '';
  errorText.value = '';
}

function closeContactCreator() {
  showContactCreator.value = false;
  contactNameDraft.value = '';
}

async function addPrivateContact() {
  const name = normalizeContactName(contactNameDraft.value);
  if (!name || isAddingContact.value) return;

  isAddingContact.value = true;
  errorText.value = '';
  try {
    await runLatestMvuTransaction('后街添加联系人', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData) throw new Error('无法读取 MVU 变量');
      if (!mvuData.stat_data) mvuData.stat_data = {};

      const statData = mvuData.stat_data as Record<string, any>;
      const relationSystem =
        statData.关系系统 && typeof statData.关系系统 === 'object' && !Array.isArray(statData.关系系统)
          ? statData.关系系统
          : {};
      statData.关系系统 = relationSystem;

      const existingRelation = relationSystem[name];
      if (existingRelation && typeof existingRelation === 'object' && !Array.isArray(existingRelation)) {
        relationSystem[name] = { 好感度: 0, 支配度: 0, 誓约: '无', 关系类型: '朋友', ...existingRelation };
        if (!relationSystem[name].关系类型 || relationSystem[name].关系类型 === '陌生人') {
          relationSystem[name].关系类型 = '朋友';
        }
        if (relationSystem[name].支配度 === undefined) {
          relationSystem[name].支配度 = 0;
        }
        if (!relationSystem[name].誓约) {
          relationSystem[name].誓约 = '无';
        }
      } else {
        relationSystem[name] = { 好感度: 0, 支配度: 0, 誓约: '无', 关系类型: '朋友' };
      }

      await replaceLatestMvuData(mvuData);
      window.dispatchEvent(
        new CustomEvent('mvu-data-updated', { detail: { source: 'backstreet-add-contact', contact: name } }),
      );
      await loadContacts(statData);
      closeContactCreator();
      const contact = contacts.value.find(item => item.type !== 'group' && item.name === name) || {
        id: name,
        name,
        lastMessage: '',
        lastTime: '',
        type: 'private' as const,
      };
      await selectContact(contact);
    });
  } catch (error) {
    console.error('[后街页面] 添加联系人失败:', error);
    errorText.value = error instanceof Error ? error.message : '添加联系人失败';
  } finally {
    isAddingContact.value = false;
  }
}

function toggleGroupManager() {
  showGroupManager.value = !showGroupManager.value;
  selectedInviteMembers.value = [];
  errorText.value = '';
}

function closeGroupManager() {
  showGroupManager.value = false;
  selectedInviteMembers.value = [];
}

function hideMentionPanel() {
  mentionQuery.value = '';
  mentionStartIndex.value = -1;
  selectedMentionIndex.value = 0;
}

function hideEmojiPanel() {
  showEmojiPanel.value = false;
  stickerPreview.value = null;
  clearStickerPreviewTimer();
}

function toggleEmojiPanel() {
  if (isSending.value || activeIsDissolved.value) return;
  showEmojiPanel.value = !showEmojiPanel.value;
  if (showEmojiPanel.value) hideMentionPanel();
  nextTick(() => {
    composerInputRef.value?.focus();
  });
}

function showStickerPreview(sticker: StickerOption) {
  stickerPreview.value = sticker;
}

function hideStickerPreview(sticker?: StickerOption) {
  clearStickerPreviewTimer();
  if (!sticker || stickerPreview.value?.id === sticker.id) {
    stickerPreview.value = null;
  }
}

function clearStickerPreviewTimer() {
  if (stickerPreviewPressTimer === null) return;
  window.clearTimeout(stickerPreviewPressTimer);
  stickerPreviewPressTimer = null;
}

function startStickerPreviewPress(sticker: StickerOption) {
  clearStickerPreviewTimer();
  stickerLongPressPreviewed = false;
  stickerPreviewPressTimer = window.setTimeout(() => {
    stickerPreview.value = sticker;
    stickerLongPressPreviewed = true;
    stickerPreviewPressTimer = null;
  }, 420);
}

async function sendSticker(sticker: StickerOption) {
  if (stickerLongPressPreviewed) {
    stickerLongPressPreviewed = false;
    return;
  }
  const contact = activeContact.value;
  if (!contact || isSending.value || activeIsDissolved.value) return;

  hideMentionPanel();
  hideEmojiPanel();
  isSending.value = true;
  errorText.value = '';

  try {
    clearPendingImageAttachments();
    const text = formatStickerMessageText(sticker, stickerHiddenFromPrompt.value);
    const imageRef = await saveStickerImageAttachment(contact, sticker);
    await backstreetService.appendUserMessage(contact, text, props.characterData || {}, {
      imageRefs: [imageRef],
      imageHiddenFromPrompt: stickerHiddenFromPrompt.value,
    });
    await loadThread(contact);
    await scrollToBottom();
    await loadContacts();

    await backstreetService.generateContactReply(contact, props.characterData || {});
    await loadThread(contact);
    await loadContacts();
  } catch (error) {
    console.error('[后街页面] 表情包发送失败:', error);
    errorText.value = error instanceof Error ? error.message : '表情包发送失败';
    await loadThread(contact);
  } finally {
    isSending.value = false;
    await scrollToBottom();
  }
}

function updateMentionState(event?: Event) {
  if (!activeIsGroup.value || activeIsDissolved.value || isSending.value) {
    hideMentionPanel();
    return;
  }

  const textarea = (event?.target instanceof HTMLTextAreaElement ? event.target : composerInputRef.value) || null;
  if (!textarea) {
    hideMentionPanel();
    return;
  }

  const cursor = textarea.selectionStart ?? draft.value.length;
  const beforeCursor = textarea.value.slice(0, cursor);
  const atIndex = beforeCursor.lastIndexOf('@');
  if (atIndex < 0) {
    hideMentionPanel();
    return;
  }

  const fragment = beforeCursor.slice(atIndex + 1);
  if (/[\s\r\n\t]/.test(fragment)) {
    hideMentionPanel();
    return;
  }

  mentionStartIndex.value = atIndex;
  hideEmojiPanel();
  if (mentionQuery.value !== fragment) {
    mentionQuery.value = fragment;
    selectedMentionIndex.value = 0;
  } else if (selectedMentionIndex.value >= mentionCandidates.value.length) {
    selectedMentionIndex.value = Math.max(0, mentionCandidates.value.length - 1);
  }
}

function insertMention(member: string) {
  const name = member.trim();
  if (!name) return;

  const textarea = composerInputRef.value;
  const cursor = textarea?.selectionStart ?? draft.value.length;
  const start = mentionStartIndex.value >= 0 ? mentionStartIndex.value : cursor;
  const before = draft.value.slice(0, start);
  const after = draft.value.slice(cursor);
  const mentionText = `@${name} `;
  draft.value = `${before}${mentionText}${after}`;
  hideMentionPanel();

  nextTick(() => {
    const nextCursor = before.length + mentionText.length;
    composerInputRef.value?.focus();
    composerInputRef.value?.setSelectionRange(nextCursor, nextCursor);
  });
}

function insertEmoji(emoji: string) {
  if (isSending.value || activeIsDissolved.value) return;
  const text = String(emoji || '');
  if (!text) return;

  const textarea = composerInputRef.value;
  const start = textarea?.selectionStart ?? draft.value.length;
  const end = textarea?.selectionEnd ?? start;
  const before = draft.value.slice(0, start);
  const after = draft.value.slice(end);
  draft.value = `${before}${text}${after}`;
  hideEmojiPanel();
  hideMentionPanel();

  nextTick(() => {
    const nextCursor = before.length + text.length;
    composerInputRef.value?.focus();
    composerInputRef.value?.setSelectionRange(nextCursor, nextCursor);
  });
}

function getComposerText(): string {
  const liveValue = composerInputRef.value?.value;
  const nextText = (liveValue ?? draft.value).trim();
  if (liveValue != null && draft.value !== liveValue) draft.value = liveValue;
  return nextText;
}

function handleComposerCompositionStart() {
  isComposerComposing = true;
}

function handleComposerCompositionEnd(event: CompositionEvent) {
  isComposerComposing = false;
  updateMentionState(event);
}

function handleComposerKeydown(event: KeyboardEvent) {
  if (showMentionPanel.value) {
    const candidates = mentionCandidates.value;
    if (candidates.length === 0) {
      hideMentionPanel();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedMentionIndex.value = (selectedMentionIndex.value + 1) % candidates.length;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedMentionIndex.value = (selectedMentionIndex.value - 1 + candidates.length) % candidates.length;
      return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      insertMention(candidates[selectedMentionIndex.value] || candidates[0]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      hideMentionPanel();
      return;
    }
  }

  if (showEmojiPanel.value && event.key === 'Escape') {
    event.preventDefault();
    hideEmojiPanel();
    return;
  }

  if (
    event.key === 'Enter' &&
    !event.shiftKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.isComposing &&
    !isComposerComposing
  ) {
    event.preventDefault();
    void sendMessage();
  }
}

function isGroupMemberSelected(name: string): boolean {
  return selectedGroupMembers.value.includes(name);
}

function toggleGroupMember(name: string) {
  if (!name) return;
  if (selectedGroupMembers.value.includes(name)) {
    selectedGroupMembers.value = selectedGroupMembers.value.filter(member => member !== name);
    return;
  }
  selectedGroupMembers.value = [...selectedGroupMembers.value, name];
}

function isInviteMemberSelected(name: string): boolean {
  return selectedInviteMembers.value.includes(name);
}

function toggleInviteMember(name: string) {
  if (!name || activeIsDissolved.value) return;
  if (selectedInviteMembers.value.includes(name)) {
    selectedInviteMembers.value = selectedInviteMembers.value.filter(member => member !== name);
    return;
  }
  selectedInviteMembers.value = [...selectedInviteMembers.value, name];
}

async function createGroup() {
  if (!canCreateGroup.value) return;
  isCreatingGroup.value = true;
  errorText.value = '';
  try {
    const group = await backstreetService.createGroup(groupNameDraft.value, selectedGroupMembers.value);
    activeThreadKind.value = 'group';
    await loadContacts();
    closeGroupCreator();
    activeContact.value = group.id;
    await loadThread(group.id);
  } catch (error) {
    console.error('[后街页面] 创建群聊失败:', error);
    errorText.value = error instanceof Error ? error.message : '创建群聊失败';
  } finally {
    isCreatingGroup.value = false;
  }
}

async function addInviteMembers() {
  const contact = activeContact.value;
  if (!contact || !canInviteMembers.value) return;
  const membersToInvite = selectedInviteMembers.value.slice();
  if (!window.confirm(`确认将 ${membersToInvite.join('、')} 拉入群聊？`)) return;

  isUpdatingGroup.value = true;
  errorText.value = '';
  try {
    messages.value = await backstreetService.addGroupMembers(contact, membersToInvite, props.characterData || {});
    selectedInviteMembers.value = [];
    await loadContacts();
    await scrollToBottom();
  } catch (error) {
    console.error('[后街页面] 拉入群成员失败:', error);
    errorText.value = error instanceof Error ? error.message : '拉入失败';
  } finally {
    isUpdatingGroup.value = false;
  }
}

async function removeGroupMember(member: string) {
  const contact = activeContact.value;
  if (!contact || !member || isUpdatingGroup.value || activeIsDissolved.value) return;
  if (!window.confirm(`确认将 ${member} 移出群聊？`)) return;

  isUpdatingGroup.value = true;
  errorText.value = '';
  try {
    messages.value = await backstreetService.removeGroupMember(contact, member, props.characterData || {});
    selectedInviteMembers.value = selectedInviteMembers.value.filter(name => name !== member);
    await loadContacts();
    await scrollToBottom();
  } catch (error) {
    console.error('[后街页面] 踢出群成员失败:', error);
    errorText.value = error instanceof Error ? error.message : '踢出失败';
  } finally {
    isUpdatingGroup.value = false;
  }
}

async function dissolveGroup() {
  const contact = activeContact.value;
  if (!contact || isUpdatingGroup.value || activeIsDissolved.value) return;
  const groupName = activeDisplayName.value || '这个群聊';
  if (!window.confirm(`确认解散「${groupName}」？解散后小手机中不再显示该群聊，但世界书会保留历史记录。`)) return;

  isUpdatingGroup.value = true;
  errorText.value = '';
  try {
    await backstreetService.dissolveGroup(contact, props.characterData || {});
    selectedInviteMembers.value = [];
    closeGroupManager();
    activeContact.value = '';
    messages.value = [];
    activeThreadKind.value = 'group';
    await loadContacts();
  } catch (error) {
    console.error('[后街页面] 解散群聊失败:', error);
    errorText.value = error instanceof Error ? error.message : '解散失败';
  } finally {
    isUpdatingGroup.value = false;
  }
}

function contactSubtitle(contact: BackstreetContact): string {
  if (contact.type !== 'group') return '';
  if (contact.dissolved) return '群聊已解散';
  const members = contact.members || [];
  return members.length ? members.join('、') : '群聊';
}

function resolveAvatarFullName(rawName: string): string {
  const name = rawName.trim();
  if (!name) return name;
  if (name in ENEMY_DATABASE) return name;

  for (const [alias, fullName] of Object.entries(NAME_ALIASES)) {
    if (name.includes(alias)) return fullName;
  }

  return name;
}

function getAvatarRecordKey(name: string): string {
  const fullName = resolveAvatarFullName(name);
  return getAvatarVariationConfigForCharacter(fullName)?.characterName || fullName;
}

function getAvatarFailureKey(mode: BackstreetAvatarMode | 'variation', avatarName: string): string {
  return `${mode}:${avatarName}`;
}

function getPreferredAvatarMode(fullName: string): BackstreetAvatarMode {
  return contactAvatarModes.value[getAvatarRecordKey(fullName)] || defaultAvatarMode.value;
}

function resolveAvatarDisplay(
  name: string,
): { mode: BackstreetAvatarMode | 'variation'; avatarName: string; url: string } | null {
  const fullName = resolveAvatarFullName(name);
  if (!fullName) return null;

  const recordKey = getAvatarRecordKey(fullName);
  const selectedUrl = selectedAvatarUrls.value[recordKey];
  const selectedKey = selectedAvatarKeys.value[recordKey];
  if (
    selectedUrl &&
    selectedKey &&
    !failedAvatars.value.has(getAvatarFailureKey('variation', `${recordKey}:${selectedKey}`))
  ) {
    return {
      mode: 'variation',
      avatarName: `${recordKey}:${selectedKey}`,
      url: selectedUrl,
    };
  }

  const preferredMode = getPreferredAvatarMode(fullName);
  if (preferredMode === 'chibi') {
    const chibiName = getChibiAvatarName(fullName);
    if (chibiName && !failedAvatars.value.has(getAvatarFailureKey('chibi', chibiName))) {
      return {
        mode: 'chibi',
        avatarName: chibiName,
        url: getChibiAvatarUrl(chibiName),
      };
    }
  }

  if (failedAvatars.value.has(getAvatarFailureKey('normal', fullName))) {
    return null;
  }

  return {
    mode: 'normal',
    avatarName: fullName,
    url: getNormalAvatarUrl(fullName),
  };
}

function getAvatarUrl(name: string): string {
  return resolveAvatarDisplay(name)?.url || '';
}

function shouldUseAvatarImage(name: string): boolean {
  return Boolean(resolveAvatarDisplay(name));
}

function getAvatarImageClass(name: string): Record<string, boolean> {
  return {
    'avatar-image-chibi': resolveAvatarDisplay(name)?.mode === 'chibi',
  };
}

function markAvatarFailed(name: string) {
  const avatar = resolveAvatarDisplay(name);
  if (!avatar) return;

  const next = new Set(failedAvatars.value);
  next.add(getAvatarFailureKey(avatar.mode, avatar.avatarName));
  failedAvatars.value = next;
}

function isAvatarFlipping(name: string): boolean {
  const recordKey = getAvatarRecordKey(name);
  return recordKey ? flippingAvatars.value.has(recordKey) : false;
}

const modalUnlockedAvatarOptions = computed(() => {
  if (!modalCharacterName.value) return [];
  return avatarOptionsByCharacter.value[getAvatarRecordKey(modalCharacterName.value)] || [];
});

const modalSelectedAvatarKey = computed(() => {
  if (!modalCharacterName.value) return null;
  return selectedAvatarKeys.value[getAvatarRecordKey(modalCharacterName.value)] || null;
});

const modalAvatarSlides = computed<ModalAvatarSlide[]>(() => {
  if (!modalCharacterName.value) return [];

  const recordKey = getAvatarRecordKey(modalCharacterName.value);
  const fullName = resolveAvatarFullName(modalCharacterName.value);
  const chibiName = getChibiAvatarName(fullName);
  const baseSlides: ModalAvatarSlide[] = [
    {
      kind: 'normal',
      variationKey: null,
      label: '正常头像',
      url: getNormalAvatarUrl(fullName),
      unlocked: true,
    },
  ];

  if (chibiName) {
    baseSlides.unshift({
      kind: 'chibi',
      variationKey: null,
      label: 'Q版头像',
      url: getChibiAvatarUrl(chibiName),
      unlocked: true,
    });
  }

  const config = getAvatarVariationConfigForCharacter(recordKey);
  if (!config) {
    return baseSlides;
  }

  const unlockedKeys = new Set(modalUnlockedAvatarOptions.value.map(option => option.key));
  const variationSlides = (allAvatarOptionsByCharacter.value[config.characterName] || []).map(option => ({
    kind: 'variation' as const,
    variationKey: option.key,
    label: option.label,
    url: option.url,
    unlocked: unlockedKeys.has(option.key),
  }));

  return [...baseSlides, ...variationSlides];
});

const currentModalAvatarSlide = computed<ModalAvatarSlide>(() => {
  return (
    modalAvatarSlides.value[modalAvatarIndex.value] || {
      kind: 'normal',
      variationKey: null,
      label: '正常头像',
      url: getNormalAvatarUrl(resolveAvatarFullName(modalCharacterName.value)),
      unlocked: true,
    }
  );
});

function findModalAvatarSlideIndex(
  slides: ModalAvatarSlide[],
  target: Pick<ModalAvatarSlide, 'kind' | 'variationKey'>,
): number {
  return slides.findIndex(slide => slide.kind === target.kind && slide.variationKey === target.variationKey);
}

function getCurrentPersistedAvatarSlide(): Pick<ModalAvatarSlide, 'kind' | 'variationKey'> {
  const selectedKey = modalSelectedAvatarKey.value;
  if (selectedKey) {
    return { kind: 'variation', variationKey: selectedKey };
  }

  return {
    kind: contactAvatarModes.value[getAvatarRecordKey(modalCharacterName.value)] || defaultAvatarMode.value,
    variationKey: null,
  };
}

function syncModalAvatarIndexToSelection() {
  const selectedIndex = findModalAvatarSlideIndex(modalAvatarSlides.value, getCurrentPersistedAvatarSlide());
  modalAvatarIndex.value = selectedIndex >= 0 ? selectedIndex : 0;
}

async function refreshAvatarVariationState(preserveModalIndex = false) {
  const refreshToken = ++avatarRefreshToken;
  const previousSlide = preserveModalIndex ? currentModalAvatarSlide.value : null;
  const names = [
    ...contacts.value.filter(contact => contact.type !== 'group').map(contact => contact.name),
    activeDisplayName.value,
    ...selectedGroupMembers.value,
    ...selectedInviteMembers.value,
  ].filter(Boolean);
  const recordKeys = [...new Set(names.map(name => getAvatarRecordKey(String(name))))];
  const nextUrls: Record<string, string> = {};
  const nextKeys: Record<string, AvatarVariationKey | null> = {};
  const nextOptions: Record<string, AvatarVariationOption[]> = {};
  const nextAllOptions: Record<string, AvatarVariationOption[]> = {};

  contactAvatarModes.value = loadContactAvatarModes();
  const metadata = await Promise.all(
    recordKeys.map(async recordKey => {
      const config = getAvatarVariationConfigForCharacter(recordKey);
      if (!config) return null;
      const [selectedUrl, selectedKey, options] = await Promise.all([
        getSelectedAvatarVariationUrl(config.characterName),
        getSelectedAvatarVariationKey(config.characterName),
        getUnlockedAvatarVariationOptions(config.characterName),
      ]);
      return { config, selectedUrl, selectedKey, options };
    }),
  );
  if (refreshToken !== avatarRefreshToken) return;

  // Do not probe every contact when the list opens. Persisted selections are
  // applied immediately; unavailable differences are verified only in the picker.
  for (const item of metadata) {
    if (!item) continue;
    const isSelectedUnlocked = Boolean(
      item.selectedKey && item.options.some(option => option.key === item.selectedKey),
    );
    if (item.selectedUrl && item.selectedKey && isSelectedUnlocked) {
      nextUrls[item.config.characterName] = item.selectedUrl;
      nextKeys[item.config.characterName] = item.selectedKey;
    } else {
      nextKeys[item.config.characterName] = null;
    }
    nextOptions[item.config.characterName] = [];
    nextAllOptions[item.config.characterName] = [];
  }
  selectedAvatarUrls.value = nextUrls;
  selectedAvatarKeys.value = nextKeys;
  avatarOptionsByCharacter.value = nextOptions;
  allAvatarOptionsByCharacter.value = nextAllOptions;

  if (showAvatarPicker.value && modalCharacterName.value) {
    const recordKey = getAvatarRecordKey(modalCharacterName.value);
    const modalData = metadata.find(item => item?.config.characterName === recordKey);
    if (modalData) {
      const availableOptions = await filterAvailableAvatarVariationOptions(modalData.options);
      if (refreshToken !== avatarRefreshToken) return;
      const availableKeys = new Set(availableOptions.map(option => option.key));
      nextOptions[recordKey] = modalData.options.filter(option => availableKeys.has(option.key));
      nextAllOptions[recordKey] = availableOptions;
      if (nextKeys[recordKey] && !availableKeys.has(nextKeys[recordKey])) {
        delete nextKeys[recordKey];
        delete nextUrls[recordKey];
      }
      selectedAvatarUrls.value = { ...nextUrls };
      selectedAvatarKeys.value = { ...nextKeys };
      avatarOptionsByCharacter.value = { ...nextOptions };
      allAvatarOptionsByCharacter.value = { ...nextAllOptions };
    }
    if (previousSlide) {
      const preservedIndex = findModalAvatarSlideIndex(modalAvatarSlides.value, previousSlide);
      if (preservedIndex >= 0) {
        modalAvatarIndex.value = preservedIndex;
        return;
      }
    }
    syncModalAvatarIndexToSelection();
  }
}

async function selectModalAvatarVariation(slide: ModalAvatarSlide) {
  if (!modalCharacterName.value || !slide.unlocked) return;

  const recordKey = getAvatarRecordKey(modalCharacterName.value);
  if (slide.kind === 'normal' || slide.kind === 'chibi') {
    contactAvatarModes.value = {
      ...contactAvatarModes.value,
      [recordKey]: slide.kind,
    };
    saveContactAvatarModes(contactAvatarModes.value);
    await selectAvatarVariation(modalCharacterName.value, null);
  } else {
    await selectAvatarVariation(modalCharacterName.value, slide.variationKey);
  }

  await refreshAvatarVariationState(true);

  const nextFlipping = new Set(flippingAvatars.value);
  nextFlipping.add(recordKey);
  flippingAvatars.value = nextFlipping;
  window.setTimeout(() => {
    const settled = new Set(flippingAvatars.value);
    settled.delete(recordKey);
    flippingAvatars.value = settled;
  }, 520);
}

async function showAvatarVariationByOffset(offset: number) {
  const slides = modalAvatarSlides.value;
  if (slides.length <= 1) return;

  modalAvatarIndex.value = (modalAvatarIndex.value + offset + slides.length) % slides.length;
  const slide = currentModalAvatarSlide.value;
  if (slide.unlocked) {
    await selectModalAvatarVariation(slide);
  }
}

function showPreviousAvatarVariation() {
  showAvatarVariationByOffset(-1);
}

function showNextAvatarVariation() {
  showAvatarVariationByOffset(1);
}

function showAvatarModal(name: string) {
  modalCharacterName.value = name;
  syncModalAvatarIndexToSelection();
  showAvatarPicker.value = true;
  void refreshAvatarVariationState(true);
}

function closeAvatarModal() {
  showAvatarPicker.value = false;
}

function handleModalImageError(event: Event) {
  const recordKey = getAvatarRecordKey(modalCharacterName.value);
  const slide = currentModalAvatarSlide.value;
  const avatarName =
    slide.kind === 'variation' && slide.variationKey ? `${recordKey}:${slide.variationKey}` : modalCharacterName.value;
  const image = event.currentTarget as HTMLImageElement;
  console.warn(`[后街页面] 头像加载失败：${image.currentSrc || image.src}`);
  failedAvatars.value = new Set([...failedAvatars.value, getAvatarFailureKey(slide.kind, avatarName)]);
}

function contactInitial(name: string): string {
  return name.trim().slice(0, 1) || '后';
}

function messageSpeaker(message: BackstreetMessage): string {
  return message.speaker?.trim() || activeDisplayName.value || '对方';
}

/** Show timestamp divider if first message or time changed from previous */
function shouldShowTimestamp(index: number): boolean {
  if (index === 0) return true;
  const prev = visibleMessages.value[index - 1];
  const curr = visibleMessages.value[index];
  return prev.time !== curr.time;
}

async function scrollToBottom() {
  await nextTick();
  const el = messageListRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}
</script>

<style scoped lang="scss">
/* ═══════════════════════════════════════════════════════
   Root Container — transparent dark theme to blend
   with the phone frame's wallpaper / gradient
   ═══════════════════════════════════════════════════════ */
.backstreet-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--sk-ink);
  background: transparent;
}

/* ═══════════════════════════════════════════════════════
   Contact List Panel
   ═══════════════════════════════════════════════════════ */
.contact-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 0;
}

.contact-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.home-back-btn {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: var(--sk-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  transition:
    background 0.15s,
    transform 0.15s;

  &:hover {
    background: var(--sk-soft);
    transform: translateY(-1px);
  }
}

.group-workspace {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-launch-card {
  width: 100%;
  min-height: 62px;
  border: 1px solid rgba(125, 211, 252, 0.22);
  border-radius: 16px;
  padding: 10px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 32px;
  align-items: center;
  gap: 10px;
  color: var(--sk-ink);
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.17), rgba(99, 102, 241, 0.18)), rgba(8, 12, 24, 0.5);
  box-shadow:
    0 10px 24px rgba(6, 182, 212, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  text-align: left;
  backdrop-filter: blur(14px);
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;

  &:hover {
    border-color: rgba(125, 211, 252, 0.38);
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.24), rgba(99, 102, 241, 0.23)), rgba(8, 12, 24, 0.56);
    transform: translateY(-1px);
  }
}

.contact-launch-card {
  border-color: rgba(167, 243, 208, 0.22);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(125, 211, 252, 0.14)), rgba(8, 12, 24, 0.5);

  &:hover {
    border-color: rgba(167, 243, 208, 0.38);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.23), rgba(125, 211, 252, 0.2)), rgba(8, 12, 24, 0.56);
  }
}

.group-launch-icon,
.group-launch-action,
.group-creator-icon {
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: var(--sk-soft);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.group-launch-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  font-size: 15px;
}

.group-launch-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 14px;
  }

  span {
    color: var(--sk-muted);
    font-size: 12px;
  }
}

.group-launch-action {
  width: 32px;
  height: 32px;
  border-radius: 11px;
  font-size: 12px;
}

.group-creator {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgba(125, 211, 252, 0.18);
  border-radius: 18px;
  padding: 12px;
  background: linear-gradient(155deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.58)), rgba(10, 14, 28, 0.54);
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
}

.group-creator-header {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 8px;
  color: var(--sk-ink);

  button {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 10px;
    display: grid;
    place-items: center;
    color: var(--sk-ink);
    background: var(--sk-soft);

    &:hover {
      color: var(--sk-ink);
      background: var(--sk-soft);
    }
  }
}

.group-creator-icon {
  width: 38px;
  height: 38px;
  border-radius: 13px;
  color: var(--sk-success);
  font-size: 14px;
}

.group-creator-title {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 14px;
  }

  span {
    color: var(--sk-muted);
    font-size: 11px;
  }
}

.group-name-field {
  min-height: 46px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 5px 10px 6px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  background: var(--sk-soft);

  span {
    color: var(--sk-muted);
    font-size: 12px;
    font-weight: 700;
  }

  input {
    min-width: 0;
    height: 34px;
    border: 0 !important;
    color: var(--sk-ink);
    background: transparent !important;
    outline: 0 !important;
    box-shadow: none !important;
    font: inherit;
    font-size: 14px;

    &::placeholder {
      color: var(--sk-muted);
    }
  }
}

.selected-members {
  max-height: 74px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-member-chip {
  max-width: 100%;
  min-width: 0;
  height: 30px;
  border: 1px solid rgba(94, 234, 212, 0.24);
  border-radius: 999px;
  padding: 0 8px 0 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--sk-ink);
  background: rgba(20, 184, 166, 0.17);

  span {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    color: #052e2b;
    background: #99f6e4;
    font-size: 11px;
    font-weight: 800;
    flex-shrink: 0;
  }

  strong {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }

  i {
    color: var(--sk-muted);
    font-size: 10px;
    flex-shrink: 0;
  }
}

.member-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--sk-muted);
  font-size: 12px;
  font-weight: 700;

  strong {
    color: var(--sk-success);
    font-size: 11px;
  }
}

.member-picker {
  max-height: 154px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.member-option {
  min-width: 0;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  color: var(--sk-muted);
  background: var(--sk-soft);
  text-align: left;
  transition:
    border-color 0.15s,
    background 0.15s,
    transform 0.15s;

  .member-avatar {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    color: var(--sk-ink);
    font-size: 11px;
    font-weight: 700;
    background: var(--sk-soft);
    flex-shrink: 0;
  }

  strong {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }

  i {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    color: transparent;
    background: var(--sk-soft);
    font-size: 9px;
    flex-shrink: 0;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.18);
    background: var(--sk-soft);
    transform: translateY(-1px);
  }

  &.selected {
    color: var(--sk-ink);
    border-color: rgba(94, 234, 212, 0.44);
    background: rgba(20, 184, 166, 0.22);

    i {
      color: #042f2e;
      background: #5eead4;
    }
  }
}

.member-empty {
  grid-column: 1 / -1;
  min-height: 38px;
  border: 1px dashed rgba(255, 255, 255, 0.11);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--sk-muted);
  font-size: 12px;
}

.group-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.group-cancel,
.group-create {
  height: 32px;
  border: 0;
  border-radius: 11px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.group-cancel {
  color: var(--sk-ink);
  background: var(--sk-soft);
}

.group-create {
  color: var(--sk-ink);
  background: linear-gradient(145deg, #14b8a6, #6366f1);
  box-shadow: 0 8px 18px rgba(20, 184, 166, 0.22);

  &:disabled {
    opacity: 0.38;
    box-shadow: none;
  }
}

.search-row {
  min-width: 0;
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 14px;
  padding: 0 13px;
  color: var(--sk-muted);
  background: var(--sk-soft);
  backdrop-filter: blur(8px);

  i {
    font-size: 13px;
    flex-shrink: 0;
  }

  input {
    min-width: 0;
    flex: 1;
    height: 100%;
    border: 0 !important;
    outline: 0 !important;
    background: transparent !important;
    color: var(--sk-ink);
    font: inherit;
    font-size: 14px;
    box-shadow: none !important;

    &::placeholder {
      color: var(--sk-muted);
    }
  }
}

.contact-list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-loading {
  min-height: 96px;
  display: grid;
  place-items: center;
  color: rgba(167, 243, 208, 0.82);
  font-size: 22px;
}

.contact-item {
  min-height: 62px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 10px 12px;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  color: var(--sk-ink);
  background: var(--sk-soft);
  text-align: left;
  backdrop-filter: blur(6px);
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    background: var(--sk-soft);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.99);
  }
}

.contact-avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  font-weight: 800;
  font-size: 17px;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  transform-style: preserve-3d;
  transition:
    transform 0.52s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.18s ease,
    filter 0.18s ease;

  &.flippable {
    cursor: pointer;
  }

  &.flippable:hover {
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.2),
      0 0 16px rgba(255, 255, 255, 0.14);
    filter: brightness(1.08);
  }

  &.flipping {
    transform: rotateY(180deg) scale(1.04);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  i {
    font-size: 16px;
    opacity: 0.82;
  }
}

.avatar-image-chibi {
  object-position: center 14%;
  transform: scale(1.75) translateY(9%);
  transform-origin: center 16%;
}

.avatar-modal {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(8px);
}

.modal-content {
  position: relative;
  width: min(360px, 95%);
  max-height: 100%;
  margin-top: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(20, 20, 40, 0.98));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 4;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: rgba(248, 113, 113, 0.9);
  cursor: pointer;
}

.modal-header {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    max-width: calc(100% - 40px);
    overflow: hidden;
    color: var(--sk-ink);
    font-size: 17px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.modal-body {
  position: relative;
  min-height: 0;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.avatar-carousel {
  min-height: 390px;
}

.avatar-nav {
  position: absolute;
  top: 50%;
  z-index: 3;
  width: 38px;
  height: 48px;
  transform: translateY(-50%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: rgba(17, 24, 39, 0.62);
  backdrop-filter: blur(8px);
  cursor: pointer;
}

.avatar-nav-prev {
  left: 14px;
}

.avatar-nav-next {
  right: 14px;
}

.modal-avatar-img {
  width: 100%;
  max-height: 360px;
  border-radius: 12px;
  object-fit: contain;
}

.avatar-locked-panel {
  width: 100%;
  min-height: 340px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--sk-muted);
  background: var(--sk-soft);

  i {
    font-size: 40px;
  }

  span {
    font-size: 14px;
    font-weight: 700;
  }
}

.avatar-carousel-footer {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-slide-label {
  min-height: 26px;
  padding: 0 12px;
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--sk-ink);
  background: rgba(102, 126, 234, 0.18);
  font-size: 12px;
  font-weight: 800;

  &.locked {
    border-color: rgba(255, 255, 255, 0.12);
    color: var(--sk-muted);
    background: var(--sk-soft);
  }
}

.avatar-slide-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--sk-soft);

    &.active {
      transform: scale(1.35);
      background: rgba(102, 126, 234, 0.95);
    }

    &.locked {
      background: var(--sk-soft);
    }
  }
}

.contact-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-name-line,
.contact-name,
.contact-last,
.contact-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-name {
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--sk-ink);
}

.contact-badge {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 1px 6px;
  color: var(--sk-violet);
  background: rgba(99, 102, 241, 0.24);
  font-size: 10px;
  font-weight: 700;

  &.dissolved {
    color: var(--sk-danger);
    background: rgba(239, 68, 68, 0.2);
  }
}

.contact-last {
  font-size: 12px;
  color: var(--sk-muted);
}

.contact-time {
  font-size: 11px;
  color: var(--sk-muted);
  align-self: flex-start;
  margin-top: 2px;
}

.thread-tabs {
  flex-shrink: 0;
  min-height: 54px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px 18px 0 0;
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  background: rgba(10, 14, 28, 0.55);
  box-shadow:
    0 -8px 22px rgba(0, 0, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.thread-tab {
  min-width: 0;
  height: 40px;
  border: 1px solid transparent;
  border-radius: 13px;
  display: grid;
  grid-template-columns: 18px minmax(0, auto) minmax(20px, auto);
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--sk-muted);
  background: transparent;
  font-size: 12px;
  font-weight: 800;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;

  i,
  span,
  strong {
    min-width: 0;
  }

  i {
    font-size: 13px;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    min-width: 20px;
    border-radius: 999px;
    padding: 1px 6px;
    color: var(--sk-muted);
    background: var(--sk-soft);
    font-size: 10px;
  }

  &:hover {
    color: var(--sk-ink);
    background: var(--sk-soft);
  }

  &.active {
    color: var(--sk-ink);
    border-color: rgba(94, 234, 212, 0.26);
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.24), rgba(99, 102, 241, 0.2));

    strong {
      color: #042f2e;
      background: #99f6e4;
    }
  }
}

/* ═══════════════════════════════════════════════════════
   Chat Panel
   ═══════════════════════════════════════════════════════ */
.chat-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ═══════════════════════════════════════════════════════
   Chat Header — frosted glass bar
   ═══════════════════════════════════════════════════════ */
.chat-header {
  min-height: 52px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(10, 14, 28, 0.45);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
}

.header-back-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: var(--sk-soft);
  font-size: 15px;
  flex-shrink: 0;
  transition:
    background 0.15s,
    transform 0.15s;

  &:hover {
    background: var(--sk-soft);
    transform: translateY(-1px);
  }
}

.chat-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-title-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--sk-ink);
  font-weight: 700;
  font-size: 13px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  i {
    font-size: 14px;
    opacity: 0.82;
  }
}

.chat-title-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.chat-title-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--sk-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-title-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--sk-success);
  font-weight: 500;

  &.dissolved {
    color: var(--sk-danger);

    .status-dot {
      background: #f87171;
      box-shadow: 0 0 6px rgba(248, 113, 113, 0.45);
    }
  }
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6ee7b7;
  box-shadow: 0 0 6px rgba(110, 231, 183, 0.5);
}

.header-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.header-action-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: var(--sk-soft);
  font-size: 13px;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: var(--sk-soft);
    color: var(--sk-ink);
  }
}

.group-manager {
  flex-shrink: 0;
  max-height: 315px;
  overflow-y: auto;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 9px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  background: rgba(8, 12, 24, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
}

.group-manager-head {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  span {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--sk-muted);
    font-size: 12px;
    font-weight: 800;
  }

  i {
    color: var(--sk-success);
  }

  em {
    border-radius: 999px;
    padding: 1px 7px;
    color: #042f2e;
    background: #99f6e4;
    font-size: 10px;
    font-style: normal;
  }

  button {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 9px;
    display: grid;
    place-items: center;
    color: var(--sk-ink);
    background: var(--sk-soft);
  }
}

.managed-members {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.managed-member {
  min-width: 0;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 12px;
  padding: 0 6px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 26px;
  align-items: center;
  gap: 6px;
  color: var(--sk-muted);
  background: var(--sk-soft);

  span {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    color: var(--sk-ink);
    background: var(--sk-soft);
    font-size: 11px;
    font-weight: 800;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }

  button {
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 9px;
    display: grid;
    place-items: center;
    color: var(--sk-danger);
    background: rgba(239, 68, 68, 0.16);
    font-size: 10px;

    &:disabled {
      opacity: 0.3;
    }
  }
}

.invite-area {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.invite-picker {
  max-height: 92px;
}

.group-invite-btn,
.group-dissolve-btn {
  height: 32px;
  border: 0;
  border-radius: 11px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--sk-ink);
  font-size: 12px;
  font-weight: 800;

  &:disabled {
    opacity: 0.38;
  }
}

.group-invite-btn {
  align-self: flex-end;
  background: linear-gradient(145deg, #14b8a6, #6366f1);
  box-shadow: 0 8px 18px rgba(20, 184, 166, 0.2);
}

.group-danger-row {
  display: flex;
  justify-content: flex-end;
}

.group-dissolve-btn {
  background: rgba(239, 68, 68, 0.22);
  color: var(--sk-danger);
}

/* ═══════════════════════════════════════════════════════
   Message List
   ═══════════════════════════════════════════════════════ */
.message-list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 8px;
}

/* ═══════════════════════════════════════════════════════
   Time Divider
   ═══════════════════════════════════════════════════════ */
.time-divider {
  display: flex;
  justify-content: center;
  padding: 10px 0 8px;

  span {
    font-size: 11px;
    color: var(--sk-muted);
    background: var(--sk-soft);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 3px 14px;
    backdrop-filter: blur(4px);
  }
}

/* ═══════════════════════════════════════════════════════
   Message Row
   ═══════════════════════════════════════════════════════ */
.message-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
  gap: 8px;
  padding: 0 10px;

  /* ── User messages: bubble first, avatar on the right ── */
  &.user {
    justify-content: flex-end;

    .message-bubble {
      color: var(--sk-ink);
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 16px 4px 16px 16px;
      box-shadow:
        0 4px 16px rgba(99, 102, 241, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);

      &::after {
        content: '';
        position: absolute;
        top: 10px;
        right: -6px;
        width: 0;
        height: 0;
        border: 6px solid transparent;
        border-left-color: #8b5cf6;
        border-right: 0;
      }
    }
  }

  /* ── Contact / system messages: avatar on left ── */
  &.contact,
  &.system {
    .message-bubble {
      color: var(--sk-ink);
      background: var(--sk-soft);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 4px 16px 16px 16px;
      backdrop-filter: blur(6px);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);

      &::after {
        content: '';
        position: absolute;
        top: 10px;
        left: -6px;
        width: 0;
        height: 0;
        border: 6px solid transparent;
        border-right-color: rgba(255, 255, 255, 0.1);
        border-left: 0;
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════
   Message Avatar (both sides)
   ═══════════════════════════════════════════════════════ */
.msg-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--sk-ink);
  font-weight: 700;
  font-size: 14px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  i {
    font-size: 15px;
    opacity: 0.7;
  }
}

.user-avatar {
  background: linear-gradient(145deg, #6366f1, #8b5cf6);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.18),
    0 4px 12px rgba(99, 102, 241, 0.25);
}

/* ═══════════════════════════════════════════════════════
   Message Bubble
   ═══════════════════════════════════════════════════════ */
.message-bubble {
  position: relative;
  max-width: min(76%, 270px);
  padding: 10px 13px;
}

.load-older-messages {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  margin: 2px auto 6px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 999px;
  color: var(--sk-muted);
  background: rgba(15, 23, 42, 0.52);
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(8px);
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: rgba(125, 211, 252, 0.48);
    color: var(--sk-ink);
    background: rgba(14, 116, 144, 0.45);
  }

  i {
    font-size: 10px;
  }
}

.message-row.has-image {
  .message-bubble {
    width: min(76%, 294px);
    padding: 8px;
  }
}

.message-speaker {
  margin-bottom: 3px;
  color: var(--sk-violet);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.message-actions {
  position: absolute;
  top: -8px;
  right: -8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: scale(0.8);
  transform-origin: top right;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
  z-index: 2;
}

.message-action {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  transition: background 0.15s ease;

  i {
    font-size: 10px;
  }
}

.message-delete:hover {
  background: #ef4444;
}

.message-reroll:hover {
  background: #14b8a6;
}

.message-prompt-toggle {
  &.active {
    background: rgba(99, 102, 241, 0.82);
  }

  &:hover {
    background: #6366f1;
  }
}

.message-bubble:hover .message-actions,
.message-bubble.actions-open .message-actions,
.message-actions:focus-within {
  opacity: 1;
  transform: scale(1);
}

@media (hover: none) {
  .message-actions {
    opacity: 0;
    transform: scale(0.8);
  }

  .message-bubble.actions-open .message-actions,
  .message-actions:focus-within {
    opacity: 1;
    transform: scale(1);
  }
}

.message-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: 0.01em;
}

.message-image-block {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.message-image-button {
  width: 100%;
  max-height: 360px;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sk-soft);
  cursor: zoom-in;

  img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 360px;
    display: block;
    object-fit: contain;
    background: rgba(8, 12, 22, 0.18);
  }
}

.message-image-loading,
.message-image-error {
  min-height: 118px;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  place-items: center;
  gap: 6px;
  color: var(--sk-muted);
  background: var(--sk-soft);
  text-align: center;
  font-size: 12px;
  line-height: 1.4;

  i {
    font-size: 20px;
    opacity: 0.72;
  }
}

.message-image-loading i {
  animation: spin 1s linear infinite;
}

.message-image-error {
  color: var(--sk-danger);
  background: rgba(239, 68, 68, 0.14);
}

.message-image-prompt-state {
  border: 1px solid rgba(165, 180, 252, 0.2);
  border-radius: 10px;
  padding: 6px 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--sk-muted);
  background: rgba(99, 102, 241, 0.12);
  font-size: 11px;
  line-height: 1.2;

  i {
    font-size: 10px;
  }
}

.image-caption {
  padding: 0 3px 2px;
}

/* ═══════════════════════════════════════════════════════
   Typing Indicator
   ═══════════════════════════════════════════════════════ */
.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px !important;

  span {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: rgba(240, 236, 255, 0.5);
    animation: typing-pulse 1.2s ease-in-out infinite;
  }

  span:nth-child(2) {
    animation-delay: 0.15s;
  }

  span:nth-child(3) {
    animation-delay: 0.3s;
  }
}

/* ═══════════════════════════════════════════════════════
   Composer Bar — frosted glass bottom bar
   ═══════════════════════════════════════════════════════ */
.composer {
  min-height: 56px;
  position: relative;
  padding: 8px 10px 8px;
  display: flex;
  align-items: flex-end;
  gap: 7px;
  background: rgba(10, 14, 28, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);

  textarea {
    min-width: 0;
    flex: 1;
    max-height: 88px;
    resize: none;
    border: 1px solid rgba(33, 49, 59, 0.12) !important;
    border-radius: 18px;
    padding: 9px 14px;
    outline: 0 !important;
    color: var(--sk-ink);
    background: var(--sk-soft);
    font: inherit;
    font-size: 14px;
    line-height: 1.45;
    box-shadow: none !important;
    transition: border-color 0.15s;

    &::placeholder {
      color: var(--sk-muted);
    }

    &:focus {
      border-color: rgba(99, 102, 241, 0.42) !important;
      background: var(--sk-soft);
    }
  }
}

.mention-panel {
  position: absolute;
  left: 10px;
  right: 55px;
  bottom: calc(100% + 8px);
  max-height: 176px;
  overflow-y: auto;
  border: 1px solid rgba(167, 243, 208, 0.2);
  border-radius: 16px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: linear-gradient(155deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.78)), rgba(10, 14, 28, 0.82);
  box-shadow:
    0 16px 38px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  z-index: 8;
}

.mention-option {
  min-height: 38px;
  border: 0;
  border-radius: 12px;
  padding: 6px 8px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  color: var(--sk-muted);
  background: transparent;
  text-align: left;
  transition:
    background 0.15s,
    color 0.15s;

  &.selected,
  &:hover {
    color: var(--sk-ink);
    background: rgba(20, 184, 166, 0.18);
  }
}

.mention-avatar {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--sk-ink);
  background: var(--sk-soft);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  font-size: 12px;
  font-weight: 800;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.mention-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
}

.emoji-panel {
  position: absolute;
  right: 55px;
  bottom: calc(100% + 8px);
  width: min(330px, calc(100% - 20px));
  overflow: visible;
  border: 1px solid rgba(251, 191, 36, 0.22);
  border-radius: 16px;
  padding: 8px;
  background: linear-gradient(155deg, rgba(15, 23, 42, 0.94), rgba(42, 31, 55, 0.78)), rgba(10, 14, 28, 0.86);
  box-shadow:
    0 16px 38px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  z-index: 9;
}

.emoji-tabs {
  position: sticky;
  top: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  padding-bottom: 7px;
  background: linear-gradient(155deg, rgba(15, 23, 42, 0.96), rgba(42, 31, 55, 0.88));
  z-index: 1;
}

.emoji-tab {
  height: 28px;
  border: 0;
  border-radius: 10px;
  color: var(--sk-ink);
  background: var(--sk-soft);
  font-size: 12px;
  font-weight: 800;

  &.active {
    color: var(--sk-ink);
    background: linear-gradient(145deg, rgba(245, 158, 11, 0.86), rgba(236, 72, 153, 0.78));
  }
}

.emoji-grid {
  max-height: 158px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 5px;
}

.sticker-grid {
  max-height: 244px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.sticker-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.sticker-prompt-toggle {
  position: relative;
  min-height: 30px;
  padding: 0 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--sk-ink);
  background: var(--sk-soft);
  font-size: 12px;
  font-weight: 800;

  input {
    width: 14px;
    height: 14px;
    accent-color: #f59e0b;
    flex-shrink: 0;
  }

  span {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  i {
    color: var(--sk-muted);
    font-size: 12px;
    flex-shrink: 0;
  }

  &::after {
    content: attr(data-help);
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 6px);
    box-sizing: border-box;
    min-height: 34px;
    padding: 8px 10px;
    border: 1px solid rgba(251, 191, 36, 0.24);
    border-radius: 10px;
    display: none;
    align-items: center;
    color: var(--sk-warning);
    background: rgba(15, 23, 42, 0.96);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
    font-size: 12px;
    line-height: 1.35;
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
    z-index: 5;
  }

  &:hover::after,
  &:active::after,
  &:focus-within::after {
    display: flex;
  }
}

.sticker-preview {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 10px);
  min-height: 184px;
  border: 1px solid rgba(251, 191, 36, 0.22);
  border-radius: 13px;
  padding: 10px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 6px;
  background: linear-gradient(155deg, rgba(15, 23, 42, 0.97), rgba(42, 31, 55, 0.9)), rgba(10, 14, 28, 0.94);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.36);
  pointer-events: none;
  z-index: 4;

  img {
    width: 100%;
    height: 154px;
    object-fit: contain;
    display: block;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--sk-ink);
    font-size: 12px;
    font-weight: 800;
    text-align: center;
  }
}

.emoji-option {
  width: 100%;
  aspect-ratio: 1;
  border: 0;
  border-radius: 11px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: var(--sk-soft);
  font-size: 18px;
  line-height: 1;
  transition:
    background 0.15s,
    transform 0.15s;

  &:hover {
    background: rgba(251, 191, 36, 0.18);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.94);
  }
}

.sticker-option {
  width: 100%;
  aspect-ratio: 1;
  border: 0;
  border-radius: 11px;
  padding: 7px;
  display: grid;
  place-items: center;
  background: var(--sk-soft);
  transition:
    background 0.15s,
    transform 0.15s;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  &:hover {
    background: rgba(251, 191, 36, 0.18);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.94);
  }
}

.sticker-state {
  min-height: 78px;
  grid-column: 1 / -1;
  border: 0;
  display: grid;
  place-items: center;
  color: var(--sk-muted);
  background: transparent;
  font-size: 12px;
  font-weight: 800;

  &.retry {
    color: var(--sk-warning);
  }
}

.composer-attachment-preview {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: calc(100% + 8px);
  min-height: 58px;
  max-height: 132px;
  overflow-y: auto;
  border: 1px solid rgba(125, 211, 252, 0.24);
  border-radius: 16px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  color: var(--sk-ink);
  background: linear-gradient(155deg, rgba(15, 23, 42, 0.94), rgba(24, 43, 63, 0.84)), rgba(10, 14, 28, 0.9);
  box-shadow:
    0 16px 38px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  z-index: 10;
}

.composer-attachment-item {
  min-height: 42px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 9px;

  img {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    object-fit: cover;
    display: block;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 750;
  }

  button {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 10px;
    display: grid;
    place-items: center;
    color: var(--sk-ink);
    background: var(--sk-soft);
  }
}

.composer-attach-toggle,
.composer-emoji-toggle {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--sk-muted);
  background: var(--sk-soft);
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(33, 49, 59, 0.1);
  transition:
    color 0.15s,
    background 0.15s,
    transform 0.15s;

  &:disabled {
    opacity: 0.35;
  }

  &.active,
  &:not(:disabled):hover {
    color: var(--sk-ink);
    background: linear-gradient(145deg, #f59e0b, #ec4899);
    transform: translateY(-1px);
  }
}

.composer-attach-toggle {
  &:not(:disabled):hover {
    color: var(--sk-ink);
    background: linear-gradient(145deg, #0ea5e9, #14b8a6);
    transform: translateY(-1px);
  }
}

.composer-send {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: linear-gradient(145deg, #6366f1, #8b5cf6);
  font-size: 14px;
  flex-shrink: 0;
  box-shadow:
    0 4px 14px rgba(99, 102, 241, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition:
    opacity 0.15s,
    transform 0.15s;

  &:disabled {
    opacity: 0.35;
    box-shadow: none;
  }

  &:not(:disabled):hover {
    transform: scale(1.06);
  }

  &:not(:disabled):active {
    transform: scale(0.95);
  }
}

.composer-file-input {
  display: none;
}

/* ═══════════════════════════════════════════════════════
   Error & Empty States
   ═══════════════════════════════════════════════════════ */
.error-row,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
}

.error-row {
  min-height: 34px;
  color: var(--sk-danger);
  background: rgba(239, 68, 68, 0.15);
  border-top: 1px solid rgba(239, 68, 68, 0.12);
  padding: 0 12px;
  backdrop-filter: blur(6px);
}

.contact-error {
  flex-shrink: 0;
  border: 1px solid rgba(239, 68, 68, 0.14);
  border-radius: 13px;
}

.empty-state {
  color: var(--sk-muted);
  padding: 24px 0;
}

.chat-empty {
  height: 100%;
}

/* ═══════════════════════════════════════════════════════
   Animations
   ═══════════════════════════════════════════════════════ */
@keyframes typing-pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
