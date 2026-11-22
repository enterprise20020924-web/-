<template>
  <div
    class="academy-opening skylink-opening sda-ui sk-admission-page"
    :class="{
      'is-character-dossier': step === 2 && !isChoosingAdmissionCharacter,
      'is-archive-theme': archiveTheme,
      'is-welcome-page': step === 1,
    }"
    :data-admission-step="step"
    :data-motion="motionReduced ? 'reduced' : 'full'"
  >
    <slot name="opening-scenery" />
    <div class="sk-opening-masthead">
      <span v-if="!$slots['header-brand']" class="sk-opening-logo"
        ><ArchiveMark v-if="archiveTheme" class="archive-school-mark" /><i
          v-else
          class="fas fa-cube"
          aria-hidden="true"
        ></i
        ><strong
          >{{ archiveTheme ? '天海学园' : '性斗学园' }}<small v-if="archiveTheme">AMAMI ACADEMY</small></strong
        ></span
      >
      <span class="sk-admission-service"><i aria-hidden="true"></i> 学籍事务中心</span>
      <button
        class="sk-motion-toggle"
        type="button"
        :aria-label="motionReduced ? '开启动效' : '减少动效'"
        :title="motionReduced ? '开启动效' : '减少动效'"
        @click="toggleMotion"
      >
        <i :class="motionReduced ? 'fas fa-play' : 'fas fa-pause'"></i>
      </button>
    </div>
    <div class="sk-admission-tablet">
      <div class="sk-tablet-hardware" aria-hidden="true">
        <span class="sk-tablet-camera"></span><span class="sk-tablet-indicators"></span>
      </div>
      <div class="opening-terminal">
        <header class="sk-admission-hero">
          <div class="sk-admission-copy">
            <span class="sk-kicker" aria-hidden="true">{{ archiveTheme ? 'STUDENT RECORD / ADMISSIONS' : '' }}</span>
            <h1>入学档案<span>填报</span></h1>
            <p>依次填写资料，建立你的学园档案。</p>
          </div>
          <slot name="header-brand" />
          <slot name="header-visual" :current="admissionStepNumber" :total="navItems.length">
            <AdmissionHeaderVisual :current="admissionStepNumber" :total="navItems.length" />
          </slot>
        </header>
        <div class="opening-sidebar">
          <nav
            class="opening-step-nav"
            aria-label="入学档案填报步骤"
            :style="{ '--admission-step-count': navItems.length }"
          >
            <button
              v-for="(item, index) in navItems"
              :key="item.id"
              type="button"
              class="opening-step-button"
              :class="{ 'is-current': step === item.id, 'is-complete': step > item.id }"
              :aria-current="step === item.id ? 'step' : undefined"
              @click="handleNavClick(item.id)"
            >
              <span class="sk-step-number"
                >0{{ index + 1 }}<i v-if="step > item.id" class="fas fa-check" aria-hidden="true"></i
              ></span>
              <span class="sk-step-label"
                >{{ item.label
                }}<small v-if="archiveTheme">{{
                  ['GUIDE', 'PROFILE', 'IDENTITY', 'PARAMETERS', 'ABILITIES'][item.id - 1]
                }}</small></span
              >
              <i :class="['fas', item.icon, 'sk-step-symbol']"></i>
            </button>
          </nav>
          <slot name="sidebar-assistant">
            <div v-if="archiveTheme" class="archive-spine-note" aria-hidden="true">
              <span>YOUR STORY</span><strong>BEGINS<br />HERE.</strong><i></i><small>天海学园 · 学籍事务中心</small>
            </div>
          </slot>
        </div>

        <!-- Content Area -->
        <div class="opening-workspace">
          <!-- Progress Bar Line -->
          <div class="opening-progress h-1 w-full bg-white/5">
            <div
              class="opening-progress-fill from-primary via-secondary to-accent h-full bg-gradient-to-r transition-all duration-500 ease-out"
              :style="{ width: `${progress}%` }"
            />
          </div>

          <div class="opening-workspace-body" :class="{ 'is-character-selection': isChoosingAdmissionCharacter }">
            <div class="opening-content">
              <!-- Step Content -->
              <div class="sk-step-container">
                <div
                  class="opening-step-heading mb-6"
                  :class="{ 'is-character-selection-heading': isChoosingAdmissionCharacter }"
                >
                  <span class="opening-step-index" aria-hidden="true">0{{ admissionStepNumber }}</span>
                  <h2 id="admission-section-title" class="mb-2 text-3xl font-bold text-white" tabindex="-1">
                    {{ isChoosingAdmissionCharacter ? '你是谁' : step === 2 ? '角色档案' : stepTitles[step - 1] }}
                  </h2>
                  <p v-if="!isChoosingAdmissionCharacter" class="text-gray-400">
                    {{ stepDescriptions[step - 1] }}
                  </p>
                  <AdmissionGenderSwitch
                    v-if="isChoosingAdmissionCharacter"
                    :selected-gender="admissionSelectionGender"
                    @update-gender="(gender: AdmissionGender) => (admissionSelectionGender = gender)"
                  />
                </div>

                <Transition name="sk-page" mode="out-in">
                  <div :key="`${step}-${isChoosingAdmissionCharacter ? 'selection' : 'form'}`" class="sk-step-body">
                    <Step0_Welcome v-if="step === 1">
                      <template v-if="$slots['welcome-visual']" #cover-visual><slot name="welcome-visual" /></template>
                    </Step0_Welcome>
                    <slot
                      v-if="isChoosingAdmissionCharacter"
                      name="character-selection"
                      :presets="playerPresets"
                      :selectedGender="admissionSelectionGender"
                      :selectedArchetypeId="admissionSelectedArchetypeId"
                      :reducedMotion="motionReduced"
                      :onSelectCustom="handleCustomAdmissionChoice"
                      :onSelectIdentity="handleAdmissionIdentityChoice"
                    >
                      <AdmissionCharacterSelect
                        :presets="playerPresets"
                        :selected-gender="admissionSelectionGender"
                        :reduced-motion="motionReduced"
                        @select-custom="handleCustomAdmissionChoice"
                        @select-identity="handleAdmissionIdentityChoice"
                      />
                    </slot>
                    <Step1_Identity
                      v-if="step === 2 && !isChoosingAdmissionCharacter"
                      :data="characterData"
                      :is-life-sim-unlocked="isLifeSimUnlocked"
                      :is-life-sim-mode="isLifeSimMode"
                      :is-creating-user-persona="isCreatingUserPersona"
                      :user-persona-message="userPersonaMessage"
                      :user-persona-message-type="userPersonaMessageType"
                      :is-using-tavern-user-persona="isUsingTavernUserPersona"
                      :pending-user-persona-overwrite-name="pendingUserPersonaOverwriteName"
                      @update-data="updateCharacterData"
                      @update-life-sim-mode="(v: boolean) => (isLifeSimMode = v)"
                      @select-npc="handleNpcSelect"
                      @request-life-sim-confirm="showLifeSimConfirmModal"
                      @choose-character="showAdmissionCharacterSelection"
                      @create-user-persona="handleCreateUserPersona"
                    />
                    <Step2_Archetype
                      v-if="step === 3"
                      :data="characterData"
                      :allow-identity-selection="!admissionSelectedArchetypeId"
                      @update-data="updateCharacterData"
                    />
                    <Step3_Attributes
                      v-if="step === 4"
                      ref="attributeAssessment"
                      :data="characterData"
                      :cheat-mode="isCheatActive"
                      @update-data="updateCharacterData"
                    />
                    <Step4_Skills
                      v-if="step === 5"
                      :data="characterData"
                      :is-life-sim-mode="isLifeSimMode"
                      :player-presets="playerPresets"
                      :selected-player-preset-name="selectedPlayerPresetName"
                      @update-data="updateCharacterData"
                      @save-player-preset="handleSavePlayerPreset"
                      @update-selected-player-preset="(name: string) => (selectedPlayerPresetName = name)"
                      @update-player-preset="handleUpdateSelectedPlayerPreset"
                      @rename-player-preset="handleRenamePlayerPreset"
                      @delete-player-preset="handleDeletePlayerPreset"
                    />
                  </div>
                </Transition>
              </div>
            </div>

            <div v-show="!isChoosingAdmissionCharacter" ref="admissionRailSlot" class="opening-rail-slot">
              <div ref="admissionRailElement" class="sk-admission-rail">
                <aside class="opening-live-summary" aria-label="实时学籍摘要">
                  <div class="sk-record-card-top" aria-hidden="true">
                    <span>{{ archiveTheme ? 'STUDENT RECORD' : '' }}</span
                    ><i v-if="!archiveTheme" class="fas fa-cube"></i><span class="sk-record-top-lines"></span
                    ><span class="sk-record-top-dots"></span>
                  </div>
                  <div class="opening-summary-heading">
                    <strong>学籍预览 <small>待提交</small></strong>
                  </div>
                  <div class="sk-record-identity">
                    <span class="sk-record-avatar" aria-hidden="true"
                      ><ArchiveMark v-if="archiveTheme" /><i v-else class="fas fa-user"></i
                    ></span>
                    <div>
                      <strong>{{ characterData.name || '姓名待登记' }}</strong>
                    </div>
                  </div>
                  <dl class="opening-summary-list">
                    <div>
                      <dt>身份</dt>
                      <dd>{{ admissionArchetypeName }}</dd>
                    </div>
                    <div>
                      <dt>模式</dt>
                      <dd>{{ isLifeSimMode ? '生活模拟' : '标准流程' }}</dd>
                    </div>
                    <div>
                      <dt>难度</dt>
                      <dd>{{ characterData.difficulty }}</dd>
                    </div>
                  </dl>
                  <div class="opening-summary-metrics">
                    <span
                      ><strong>{{ characterData.initialActiveSkills.length }}</strong
                      >主动技能</span
                    >
                    <span
                      ><strong>{{ characterData.initialPassiveSkills.length }}</strong
                      >特殊体质</span
                    >
                  </div>
                  <div
                    class="sk-record-progress"
                    role="progressbar"
                    aria-label="填报进度"
                    :aria-valuenow="admissionStepNumber"
                    :aria-valuemin="0"
                    :aria-valuemax="navItems.length"
                  >
                    <span><i :style="{ width: `${progress}%` }"></i></span>
                  </div>
                  <div class="sk-record-footer" aria-hidden="true">
                    <span class="sk-document-bars"></span><i class="fas fa-cube"></i>
                  </div>
                </aside>
                <section class="sk-admission-checks" aria-label="档案填写检查">
                  <header>
                    <h3><i class="fas fa-clipboard-check" aria-hidden="true"></i>档案检查</h3>
                    <span>{{ admissionCompletedChecks }}<small> / 3</small></span>
                  </header>
                  <ul>
                    <li v-for="item in admissionChecks" :key="item.label" :class="{ 'is-complete': item.complete }">
                      <span class="sk-check-indicator" aria-hidden="true">
                        <i :class="item.complete ? 'fas fa-check' : item.icon"></i>
                      </span>
                      <span>{{ item.label }}</span>
                      <small>{{ item.complete ? '已登记' : item.pending }}</small>
                    </li>
                  </ul>
                  <div class="sk-check-segments" aria-hidden="true">
                    <span
                      v-for="item in admissionChecks"
                      :key="item.label"
                      :class="{ 'is-complete': item.complete }"
                    ></span>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <!-- Footer Navigation -->
          <div v-if="!isChoosingAdmissionCharacter" class="opening-footer">
            <button
              :disabled="step === 1"
              :class="[
                'opening-prev flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium transition-all',
                step === 1 ? 'cursor-not-allowed text-gray-600' : 'text-gray-300 hover:bg-white/5 hover:text-white',
              ]"
              @click="prevStep"
            >
              <i class="fas fa-chevron-left"></i> 上一项
            </button>
            <span class="sk-footer-progress"
              ><i class="fas fa-file-lines" aria-hidden="true"></i> {{ admissionStepNumber }}
              <small>/ {{ navItems.length }} 项</small></span
            >
            <button
              v-if="step < MAX_STEPS"
              :disabled="
                (step === 2 && (isLifeSimMode ? !selectedNpc : !characterData.name.trim())) ||
                (step === 4 && (!attributeAssessment || excessAttributePoints > 0))
              "
              class="opening-next group relative flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-black shadow-lg shadow-white/10 transition-all hover:scale-105 hover:shadow-white/20 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              @click="nextStep"
            >
              <template v-if="step === 4 && excessAttributePoints > 0">请减回 {{ excessAttributePoints }} 点</template>
              <template v-else>
                {{ step === 1 ? '开始填写档案' : '继续填写' }}
                <i class="fas fa-chevron-right transition-transform group-hover:translate-x-1"></i>
              </template>
            </button>
            <button
              v-else
              :disabled="loading || characterData.initialPassiveSkills.length === 0"
              class="opening-start group from-primary to-secondary shadow-primary/30 relative flex items-center gap-2 rounded-xl bg-gradient-to-r px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-primary/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
              @click="handleStartGame"
            >
              <span v-if="loading" class="flex items-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                正在办理入学...
              </span>
              <span v-else> <i class="fas fa-check"></i> 确认档案，办理入学 </span>
            </button>
          </div>
        </div>
      </div>
      <div class="sk-tablet-home" aria-hidden="true"><span></span></div>
    </div>

    <!-- 生活模拟模式确认弹窗 -->
    <div
      v-if="showLifeSimConfirm"
      class="opening-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
      <div
        class="opening-modal-card animate-scale-in relative w-full max-w-lg transform overflow-hidden rounded-3xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/60 via-indigo-900/60 to-violet-900/60 shadow-2xl shadow-purple-500/30"
      >
        <!-- 特效背景 -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            class="animate-spin-slow absolute -top-1/2 -left-1/2 h-full w-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-violet-500/20 blur-3xl"
          ></div>
          <div
            class="animate-spin-slow-reverse absolute -right-1/2 -bottom-1/2 h-full w-full bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 blur-3xl"
          ></div>
          <!-- 星光粒子效果 -->
          <div class="absolute inset-0">
            <div class="absolute top-1/4 left-1/4 h-2 w-2 animate-pulse rounded-full bg-purple-300/60"></div>
            <div class="absolute top-1/3 right-1/4 h-1.5 w-1.5 animate-ping rounded-full bg-indigo-300/50"></div>
            <div class="absolute bottom-1/3 left-1/3 h-1 w-1 animate-pulse rounded-full bg-violet-300/70"></div>
            <div class="absolute top-1/2 right-1/3 h-2 w-2 animate-bounce rounded-full bg-purple-400/40"></div>
            <div class="absolute right-1/5 bottom-1/4 h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400/60"></div>
          </div>
        </div>

        <!-- 标题 -->
        <div class="relative z-10 p-8 pb-4">
          <div class="mb-4 flex items-center justify-center gap-3">
            <i class="fas fa-moon animate-pulse text-3xl text-purple-300"></i>
            <h3
              class="bg-gradient-to-r from-purple-200 via-indigo-200 to-violet-200 bg-clip-text text-3xl font-black tracking-wider text-transparent drop-shadow-lg"
            >
              命运的抉择
            </h3>
            <i class="fas fa-star animate-pulse text-3xl text-indigo-300"></i>
          </div>
          <div
            class="mx-auto h-1 w-32 rounded-full bg-gradient-to-r from-purple-400 via-indigo-400 to-violet-400 shadow-lg shadow-purple-400/50"
          ></div>
        </div>

        <!-- 内容 -->
        <div class="relative z-10 px-8 pb-6">
          <div class="rounded-xl border border-purple-500/30 bg-black/40 p-6 backdrop-blur-sm">
            <div class="space-y-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <i class="fas fa-ghost text-2xl text-purple-300"></i>
                <i class="fas fa-exchange-alt animate-pulse text-xl text-indigo-400"></i>
                <i class="fas fa-user-secret text-2xl text-violet-300"></i>
              </div>
              <p class="text-lg leading-relaxed text-purple-100">每个灵魂都有其独特的轨迹。</p>
              <p class="text-base leading-relaxed text-indigo-200/80">
                在你尚未见证他们的喜怒哀乐之前，<br />恐怕还无法真正走进他们的生活。
              </p>
              <p class="text-base leading-relaxed text-violet-200/70">
                建议先以新生的身份入学，<br />多去了解一下性斗学园中的角色吧。
              </p>
            </div>
          </div>
        </div>

        <!-- 按钮区域 -->
        <div class="relative z-10 flex justify-center gap-4 px-8 pb-8">
          <button
            class="transform rounded-xl border-2 border-gray-500/50 bg-gradient-to-r from-gray-700/50 to-gray-600/50 px-6 py-3 text-sm font-semibold text-gray-200 shadow-lg shadow-gray-700/20 transition-all duration-300 hover:scale-105 hover:border-gray-400/70 hover:from-gray-600/60 hover:to-gray-500/60 hover:shadow-gray-600/30 active:scale-95"
            @click="cancelLifeSimMode"
          >
            <i class="fas fa-seedling mr-2"></i> 我是新手
          </button>
          <button
            class="transform rounded-xl border-2 border-purple-500/50 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 px-6 py-3 text-sm font-semibold text-purple-200 shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-105 hover:border-purple-400/70 hover:from-purple-500/40 hover:to-indigo-500/40 hover:shadow-purple-500/30 active:scale-95"
            @click="confirmLifeSimMode"
          >
            <i class="fas fa-user-secret mr-2"></i> 我已知晓
          </button>
        </div>
      </div>
    </div>

    <!-- Generic Modal for Placeholder Interactions -->
    <div
      v-if="showModal"
      data-archive-dialog
      class="opening-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="closeModal"></div>
      <div
        :class="[
          'opening-modal-card relative w-full max-w-lg transform overflow-hidden rounded-3xl border-2 shadow-2xl transition-all duration-500',
          { 'archive-admitted': archiveTheme && modalTitle === '角色创建完成！' },
          modalTitle === 'CHEAT MODE ACTIVATE'
            ? 'animate-scale-in border-yellow-500/50 bg-gradient-to-br from-yellow-900/40 via-orange-900/40 to-red-900/40 shadow-yellow-500/20'
            : modalTitle === '作弊码激活'
              ? 'animate-scale-in border-purple-500/50 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-indigo-900/40 shadow-purple-500/20'
              : modalTitle === '草莓套装激活'
                ? 'animate-scale-in border-pink-500/50 bg-gradient-to-br from-pink-900/40 via-rose-900/40 to-red-900/40 shadow-pink-500/20'
                : modalTitle === '警告'
                  ? 'animate-shake border-red-500/50 bg-gradient-to-br from-red-900/40 via-orange-900/40 to-yellow-900/40 shadow-red-500/20'
                  : 'animate-fade-in border-white/10 bg-[#1e293b]',
        ]"
      >
        <!-- 作弊码激活特效背景 -->
        <div v-if="modalTitle === '作弊码激活'" class="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            class="animate-spin-slow absolute -top-1/2 -left-1/2 h-full w-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 blur-3xl"
          ></div>
          <div
            class="animate-spin-slow-reverse absolute -right-1/2 -bottom-1/2 h-full w-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl"
          ></div>
        </div>

        <!-- 草莓套装激活特效背景 -->
        <div v-if="modalTitle === '草莓套装激活'" class="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            class="animate-spin-slow absolute -top-1/2 -left-1/2 h-full w-full bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-red-500/20 blur-3xl"
          ></div>
          <div
            class="animate-spin-slow-reverse absolute -right-1/2 -bottom-1/2 h-full w-full bg-gradient-to-r from-red-500/20 via-pink-500/20 to-rose-500/20 blur-3xl"
          ></div>
        </div>

        <!-- Cheat Mode Special Header -->
        <div v-if="modalTitle === 'CHEAT MODE ACTIVATE'" class="relative p-8 pb-6">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10"></div>
          <div class="relative">
            <div class="mb-4 flex items-center justify-center gap-3">
              <i class="fas fa-star animate-pulse text-3xl text-yellow-400"></i>
              <h3
                class="animate-pulse bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-5xl font-black tracking-wider text-transparent drop-shadow-2xl"
              >
                {{ modalTitle }}
              </h3>
              <i class="fas fa-star animate-pulse text-3xl text-yellow-400"></i>
            </div>
            <div
              class="mx-auto mt-3 h-1.5 w-32 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 shadow-lg shadow-yellow-400/50"
            ></div>
          </div>
        </div>

        <!-- 作弊码激活特殊标题 -->
        <div v-else-if="modalTitle === '作弊码激活'" class="relative z-10 p-8 pb-6">
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10"
          ></div>
          <div class="relative">
            <div class="mb-4 flex items-center justify-center gap-3">
              <i class="fas fa-gift animate-bounce text-3xl text-purple-400"></i>
              <h3
                class="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-4xl font-black tracking-wider text-transparent drop-shadow-2xl"
              >
                {{ modalTitle }}
              </h3>
              <i class="fas fa-sparkles animate-pulse text-3xl text-pink-400"></i>
            </div>
            <div
              class="mx-auto mt-3 h-1.5 w-32 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 shadow-lg shadow-purple-400/50"
            ></div>
          </div>
        </div>

        <!-- 草莓套装激活特殊标题 -->
        <div v-else-if="modalTitle === '草莓套装激活'" class="relative z-10 p-8 pb-6">
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10"
          ></div>
          <div class="relative">
            <div class="mb-4 flex items-center justify-center gap-3">
              <i class="fas fa-heart animate-bounce text-3xl text-pink-400"></i>
              <h3
                class="bg-gradient-to-r from-pink-300 via-rose-300 to-red-300 bg-clip-text text-4xl font-black tracking-wider text-transparent drop-shadow-2xl"
              >
                {{ modalTitle }}
              </h3>
              <i class="fas fa-heart animate-bounce text-3xl text-rose-400"></i>
            </div>
            <div
              class="mx-auto mt-3 h-1.5 w-32 rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 shadow-lg shadow-pink-400/50"
            ></div>
          </div>
        </div>

        <!-- 警告标题 -->
        <div v-else-if="modalTitle === '警告'" class="relative z-10 p-8 pb-6">
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10"
          ></div>
          <div class="relative">
            <div class="mb-4 flex items-center justify-center gap-3">
              <i class="fas fa-exclamation-triangle animate-pulse text-3xl text-red-400"></i>
              <h3
                class="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-3xl font-black tracking-wider text-transparent drop-shadow-lg"
              >
                {{ modalTitle }}
              </h3>
              <i class="fas fa-exclamation-triangle animate-pulse text-3xl text-red-400"></i>
            </div>
          </div>
        </div>

        <!-- Normal Header -->
        <div v-else class="p-8 pb-6">
          <div
            v-if="archiveTheme && modalTitle === '角色创建完成！'"
            class="archive-admission-stamp"
            aria-hidden="true"
          >
            <ArchiveMark /><strong>ADMITTED</strong><span>入学登记完成</span>
          </div>
          <h3 class="mb-4 text-2xl font-bold text-white">{{ modalTitle }}</h3>
        </div>

        <!-- Content -->
        <div
          :class="[
            'relative z-10 px-8 pb-8',
            modalTitle === 'CHEAT MODE ACTIVATE' || modalTitle === '作弊码激活' || modalTitle === '草莓套装激活'
              ? 'space-y-4'
              : '',
          ]"
        >
          <div
            :class="[
              'rounded-xl border p-6 backdrop-blur-sm',
              modalTitle === 'CHEAT MODE ACTIVATE'
                ? 'border-yellow-500/30 bg-black/30'
                : modalTitle === '作弊码激活'
                  ? 'relative overflow-hidden border-purple-500/30 bg-black/40'
                  : modalTitle === '草莓套装激活'
                    ? 'relative overflow-hidden border-pink-500/30 bg-black/40'
                    : modalTitle === '警告'
                      ? 'border-red-500/30 bg-black/30'
                      : 'flex h-32 items-center justify-center border-dashed border-white/5 bg-black/20',
            ]"
          >
            <!-- 作弊码激活内容特效 -->
            <div v-if="modalTitle === '作弊码激活'" class="pointer-events-none absolute inset-0">
              <div
                class="absolute top-0 left-0 h-full w-full animate-pulse bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5"
              ></div>
            </div>

            <!-- 草莓套装激活内容特效 -->
            <div v-if="modalTitle === '草莓套装激活'" class="pointer-events-none absolute inset-0">
              <div
                class="absolute top-0 left-0 h-full w-full animate-pulse bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-red-500/5"
              ></div>
            </div>

            <p
              :class="[
                modalTitle === 'CHEAT MODE ACTIVATE'
                  ? 'space-y-2 text-base leading-relaxed text-white'
                  : modalTitle === '作弊码激活'
                    ? 'relative space-y-4 text-lg leading-relaxed text-white'
                    : modalTitle === '草莓套装激活'
                      ? 'relative space-y-4 text-lg leading-relaxed text-white'
                      : modalTitle === '警告'
                        ? 'text-base leading-relaxed text-red-200'
                        : 'text-sm text-gray-500',
              ]"
            >
              <template v-if="modalTitle === 'CHEAT MODE ACTIVATE'">
                <div class="space-y-3">
                  <div class="animate-fade-in-delay flex items-center gap-3">
                    <i class="fas fa-dice-d20 animate-spin-slow text-2xl text-yellow-400"></i>
                    <span class="text-lg font-semibold text-yellow-300"
                      >天赋点数已设为 <span class="text-xl font-black text-yellow-400">999</span></span
                    >
                  </div>
                  <div class="animate-fade-in-delay-2 flex items-center gap-3">
                    <i class="fas fa-gem animate-pulse text-2xl text-orange-400"></i>
                    <span class="text-lg font-semibold text-orange-300"
                      >获得特殊装备 <span class="text-xl font-black text-orange-400">「作弊者之证」</span></span
                    >
                  </div>
                  <div class="animate-fade-in-delay-3 flex items-center gap-3">
                    <i class="fas fa-chart-line animate-bounce text-2xl text-red-400"></i>
                    <span class="text-lg font-semibold text-red-300"
                      >全属性 <span class="text-xl font-black text-red-400">+999</span></span
                    >
                  </div>
                </div>
              </template>
              <template v-else-if="modalTitle === '作弊码激活'">
                <div class="relative space-y-3">
                  <div class="flex items-center justify-center gap-3">
                    <i class="fas fa-trophy animate-bounce text-3xl text-yellow-400"></i>
                  </div>
                  <div class="text-center">
                    <p
                      class="mb-2 bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-2xl font-bold text-transparent"
                    >
                      {{ modalContent.split('\n')[0] || '已获得装备！' }}
                    </p>
                    <p v-if="modalContent.includes('+')" class="mt-2 text-lg font-semibold text-green-300">
                      <i class="fas fa-coins mr-2 text-yellow-400"></i>
                      {{ modalContent.split('\n')[1] }}
                    </p>
                  </div>
                  <div class="mt-4 flex items-center justify-center gap-2 text-sm text-purple-300">
                    <i class="fas fa-check-circle text-green-400"></i>
                    <span>装备已添加到背包</span>
                  </div>
                </div>
              </template>
              <template v-else-if="modalTitle === '草莓套装激活'">
                <div class="relative space-y-3">
                  <div class="flex items-center justify-center gap-3">
                    <i class="fas fa-cat animate-bounce text-4xl text-pink-400"></i>
                    <i class="fas fa-heart animate-pulse text-3xl text-rose-400"></i>
                    <i class="fas fa-cat animate-bounce text-4xl text-pink-400"></i>
                  </div>
                  <div class="text-center">
                    <p
                      class="mb-3 bg-gradient-to-r from-pink-200 via-rose-200 to-red-200 bg-clip-text text-3xl font-bold text-transparent"
                    >
                      {{ modalContent.split('\n')[0] || '草莓套装已装备！' }}
                    </p>
                    <div class="mt-4 space-y-2 text-left">
                      <div class="flex items-center gap-2 text-pink-200">
                        <i class="fas fa-umbrella text-pink-400"></i>
                        <span>草莓奶油洋伞</span>
                      </div>
                      <div class="flex items-center gap-2 text-rose-200">
                        <i class="fas fa-tshirt text-rose-400"></i>
                        <span>「草莓奶芙」层叠蕾丝蓬蓬裙</span>
                      </div>
                      <div class="flex items-center gap-2 text-pink-200">
                        <i class="fas fa-headphones text-pink-400"></i>
                        <span>摇晃的猫耳发箍</span>
                      </div>
                      <div class="flex items-center gap-2 text-rose-200">
                        <i class="fas fa-gem text-rose-400"></i>
                        <span>铃铛丝绒项圈</span>
                      </div>
                      <div class="flex items-center gap-2 text-pink-200">
                        <i class="fas fa-cat text-pink-400"></i>
                        <span>灵魂伴侣·懒洋洋猫</span>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-center gap-2 text-sm text-pink-300">
                    <i class="fas fa-check-circle text-green-400"></i>
                    <span>所有装备已自动装备到身上！</span>
                  </div>
                </div>
              </template>
              <template v-else>
                {{ modalContent || '此功能模块已就绪，等待内容注入。' }}
              </template>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div
          :class="[
            'relative z-10 flex justify-end px-8 pb-8',
            modalTitle === 'CHEAT MODE ACTIVATE' || modalTitle === '作弊码激活' || modalTitle === '草莓套装激活'
              ? 'pt-0'
              : 'pt-0',
          ]"
        >
          <button
            :class="[
              'transform rounded-xl px-8 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95',
              modalTitle === 'CHEAT MODE ACTIVATE'
                ? 'border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-200 shadow-lg shadow-yellow-500/20 hover:border-yellow-400/70 hover:from-yellow-500/30 hover:to-orange-500/30 hover:shadow-yellow-500/30'
                : modalTitle === '作弊码激活'
                  ? 'border-2 border-purple-500/50 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 shadow-lg shadow-purple-500/20 hover:border-purple-400/70 hover:from-purple-500/30 hover:to-pink-500/30 hover:shadow-purple-500/30'
                  : modalTitle === '草莓套装激活'
                    ? 'border-2 border-pink-500/50 bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-200 shadow-lg shadow-pink-500/20 hover:border-pink-400/70 hover:from-pink-500/30 hover:to-rose-500/30 hover:shadow-pink-500/30'
                    : modalTitle === '警告'
                      ? 'border-2 border-red-500/50 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-200 shadow-lg shadow-red-500/20 hover:border-red-400/70 hover:from-red-500/30 hover:to-orange-500/30 hover:shadow-red-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20',
            ]"
            @click="closeModal"
          >
            <i class="fas fa-check mr-2"></i> 确认
          </button>
        </div>
      </div>
    </div>

    <!-- Cheat Code Button -->
    <div class="opening-code-access fixed bottom-4 left-4 z-50">
      <button
        class="flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-xs text-gray-500 transition-all hover:bg-black/50 hover:text-gray-300"
        title="?"
        @click="showCheatInput = !showCheatInput"
      >
        ?
      </button>
      <div
        v-if="showCheatInput"
        class="absolute bottom-8 left-0 rounded-xl border border-white/20 bg-gradient-to-br from-black/95 to-gray-900/95 p-3 shadow-2xl backdrop-blur-md"
      >
        <form class="flex items-center gap-2" @submit.prevent="applyCheatCode">
          <input
            v-model="cheatCode"
            type="text"
            placeholder="输入代码"
            class="focus:border-secondary focus:ring-secondary/50 focus:bg-white/15 focus:ring-2 focus:outline-none w-28 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-gray-400 transition-all"
          />
          <button
            type="submit"
            class="from-secondary to-primary rounded-lg bg-gradient-to-r px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-indigo-500/50 active:scale-95"
          >
            确认
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isKnownCheatCode, normalizeCheatCode, redeemCheatCode } from '../shared/cheatCodes';
import { useSkylinkMotion } from '../shared/useSkylinkMotion';
const { motionReduced, toggleMotion } = useSkylinkMotion();
import { getEnemyPortraitUrl, savePlayerCustomAvatar } from '../战斗界面/constants';
import { ENEMY_DATABASE } from '../战斗界面/enemyDatabase';
import { ENEMY_SKILL_MAP, ENEMY_SKILLS } from '../战斗界面/enemySkillDatabase';
import { syncInitialSetupFromMvu as syncFromMvu } from '../shared/initialSetupSync';
import { CHAT_ADMISSION_IDENTITY_VARIABLE_KEY } from '../shared/admissionIdentity';
import { getActivatedCheatCodes, saveActivatedCheatCodes } from '../shared/localPreferences';
import {
  getLatestMvuData as getMvuData,
  updateLatestStatData as updateMvuVariables,
  grantMoneyWithUpdates,
} from '../shared/mvuStore';
import { XIAOYEYUE_LIGHT_DARK_CONSTITUTION_ID, calculateXiaoyeyueLightDarkBonus } from '../shared/xiaoyeyueMagicGirl';
import {
  deletePlayerPreset,
  listPlayerPresets,
  loadPlayerPreset,
  renamePlayerPreset,
  savePlayerPreset,
  type PlayerPresetSummary,
} from '../shared/playerPresetStore';
import { clearUserInfoWorldbook, saveCurrentChatUserInfo, writeUserInfoToWorldbook } from '../shared/userWorldbookSync';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import AdmissionHeaderVisual from './components/AdmissionHeaderVisual.vue';
import ArchiveMark from '../../正文前端V1.99/vector/AmamiMark.vue';
import { useAdmissionDialogPlacement } from '../../正文前端V1.99/opening/useAdmissionDialogPlacement';
import AdmissionCharacterSelect from './components/AdmissionCharacterSelect.vue';
import AdmissionGenderSwitch from './components/AdmissionGenderSwitch.vue';
import Step0_Welcome from './components/Step0_Welcome.vue';
import Step1_Identity from './components/Step1_Identity.vue';
import Step2_Archetype from './components/Step2_Archetype.vue';
import Step3_Attributes from './components/Step3_Attributes.vue';
import Step4_Skills from './components/Step4_Skills.vue';
import { getAvailableArchetypes } from './constants';
import { canSelectConstitution, getConstitutionById } from './data/constitutions';
import { STARTER_SKILLS } from './data/skills';
import { getMainlineTimelineUpdates, MAINLINE_TIMELINE_CONFIG } from './mainlineTimeline';
import { applyIdentityStartingAttributes, getIdentityStartingUpdates } from './utils/identityStartingAttributes';
import { CharacterData, Difficulty, Gender, INITIAL_CHARACTER_DATA, MainlineTimeline } from './types';
import {
  buildPlayerPersonaDescription,
  createOrReplacePlayerPersonaFromCharacter,
  getPlayerPersonaNameMatchCount,
  normalizePlayerPersonaName,
} from './utils/playerPersonaWriter';
import { getUserInfoContent, hasInitializedUserProfile, readUserProfile } from './utils/userProfile';
import { buildIdentityOpeningInput } from '../../正文前端V1.99/engine/preset-rgb-names';
import { convertSkillsToMvu } from './utils/skill-converter';
import { useAdmissionRailFollow } from './utils/admissionRailFollow';
import {
  cloneAdmissionCharacter,
  createCustomAdmissionCharacter,
  createAdmissionIdentityCharacter,
  type AdmissionGender,
  type AdmissionIdentityChoice,
} from './utils/admissionCharacterSelection';

const step = ref(1);
const attributeAssessment = ref<InstanceType<typeof Step3_Attributes> | null>(null);
const excessAttributePoints = computed(() => Math.max(0, -(attributeAssessment.value?.remaining ?? 0)));
const openingProps = withDefaults(defineProps<{ archiveTheme?: boolean }>(), { archiveTheme: false });
const admissionRailSlot = ref<HTMLElement | null>(null);
const admissionRailElement = ref<HTMLElement | null>(null);
useAdmissionRailFollow(admissionRailElement, admissionRailSlot);
const loading = ref(false);
const characterData = ref<CharacterData>({ ...INITIAL_CHARACTER_DATA });
const playerPresets = ref<PlayerPresetSummary[]>([]);
const selectedPlayerPresetName = ref('');
const showModal = ref(false);
useAdmissionDialogPlacement(showModal, () => openingProps.archiveTheme);
const modalTitle = ref('');
const modalContent = ref('');
const isCreatingUserPersona = ref(false);
const isUsingTavernUserPersona = ref(false);
const userPersonaMessage = ref('');
const userPersonaMessageType = ref<'success' | 'warning' | 'error'>('success');
const pendingUserPersonaOverwriteName = ref('');

// 作弊码相关
const showCheatInput = ref(false);
const cheatCode = ref('');
const isCheatActive = ref(false);
const activatedCheatCodes = ref<Set<string>>(new Set());
const isApplyingCheatCode = ref(false);

// 生活模拟模式相关
const isLifeSimMode = ref(false);
const isLifeSimUnlocked = ref(true); // 默认解锁生活模拟模式
const showLifeSimConfirm = ref(false); // 生活模拟确认弹窗
const selectedNpc = ref<{
  id: string;
  name: string;
  dbKey: string;
  skillKey: string;
  level: number;
  gender?: '男' | '女' | '非二元';
} | null>(null);

const admissionIdentityStage = ref<'choose' | 'edit'>('choose');
const admissionSelectionGender = ref<AdmissionGender>(Gender.FEMALE);
const admissionSelectedPresetName = ref('');
const admissionSelectedArchetypeId = ref<string | null>(null);
const customAdmissionDrafts = new Map<AdmissionGender, CharacterData>();
const identityAdmissionDrafts = new Map<string, CharacterData>();
const isChoosingAdmissionCharacter = computed(
  () => step.value === 2 && !isLifeSimMode.value && admissionIdentityStage.value === 'choose',
);

function rememberCustomAdmissionDraft() {
  if (isLifeSimMode.value) return;
  const gender =
    characterData.value.gender === Gender.OTHER ? admissionSelectionGender.value : characterData.value.gender;
  if (admissionSelectedArchetypeId.value) {
    identityAdmissionDrafts.set(
      `${gender}:${admissionSelectedArchetypeId.value}:${admissionSelectedPresetName.value}`,
      cloneAdmissionCharacter(characterData.value),
    );
    return;
  }
  if (admissionSelectedPresetName.value) return;
  customAdmissionDrafts.set(gender, cloneAdmissionCharacter(characterData.value));
}

function showAdmissionCharacterSelection() {
  rememberCustomAdmissionDraft();
  admissionSelectionGender.value = characterData.value.gender === Gender.MALE ? Gender.MALE : Gender.FEMALE;
  refreshPlayerPresets();
  admissionIdentityStage.value = 'choose';
}

function handleCustomAdmissionChoice(gender: AdmissionGender) {
  rememberCustomAdmissionDraft();
  const draft = customAdmissionDrafts.get(gender);
  characterData.value = sanitizeCharacterData(
    draft ? cloneAdmissionCharacter(draft) : createCustomAdmissionCharacter(gender),
  );
  admissionSelectionGender.value = gender;
  admissionSelectedPresetName.value = '';
  admissionSelectedArchetypeId.value = null;
  isLifeSimMode.value = false;
  selectedNpc.value = null;
  isUsingTavernUserPersona.value = false;
  pendingUserPersonaOverwriteName.value = '';
  userPersonaMessage.value = '';
  admissionIdentityStage.value = 'edit';
}

function handleAdmissionPresetChoice(name: string) {
  rememberCustomAdmissionDraft();
  selectedPlayerPresetName.value = name;
  if (!handleLoadPlayerPreset()) return;
  admissionSelectedPresetName.value = name;
  admissionSelectedArchetypeId.value = null;
  admissionIdentityStage.value = 'edit';
}

function handleAdmissionIdentityChoice(choice: AdmissionIdentityChoice) {
  const identity = createAdmissionIdentityCharacter(choice);
  if (!getAvailableArchetypes(identity).some(item => item.id === choice.archetypeId)) return;
  rememberCustomAdmissionDraft();
  const draft = identityAdmissionDrafts.get(`${choice.gender}:${choice.archetypeId}:${choice.presetName || ''}`);
  const source = draft ?? (choice.presetName ? loadPlayerPreset(choice.presetName) : undefined);
  if (choice.presetName && !source) {
    refreshPlayerPresets();
    toastr.warning('没有找到可载入的人物预设。', '人物预设');
    return;
  }
  characterData.value = sanitizeCharacterData(createAdmissionIdentityCharacter(choice, source ?? undefined));
  admissionSelectionGender.value = choice.gender;
  admissionSelectedPresetName.value = choice.presetName || '';
  admissionSelectedArchetypeId.value = choice.archetypeId;
  if (choice.presetName) selectedPlayerPresetName.value = choice.presetName;
  isLifeSimMode.value = false;
  selectedNpc.value = null;
  isUsingTavernUserPersona.value = false;
  pendingUserPersonaOverwriteName.value = '';
  userPersonaMessage.value = '';
  admissionIdentityStage.value = 'edit';
}

watch([step, admissionIdentityStage], async () => {
  await nextTick();
  document.querySelector<HTMLElement>('.opening-workspace-body')?.scrollTo({ top: 0, behavior: 'auto' });
  document.querySelector<HTMLElement>('.opening-workspace')?.scrollTo({ top: 0, behavior: 'auto' });
  document.scrollingElement?.scrollTo({ top: 0, behavior: 'auto' });
});

// 生活模拟确认弹窗相关函数
const showLifeSimConfirmModal = () => {
  showLifeSimConfirm.value = true;
};

const cancelLifeSimMode = () => {
  showLifeSimConfirm.value = false;
  // 保持在普通模式
};

const confirmLifeSimMode = () => {
  showLifeSimConfirm.value = false;
  isLifeSimMode.value = true;
};

const refreshPlayerPresets = () => {
  playerPresets.value = listPlayerPresets();
  if (!playerPresets.value.some(preset => preset.name === selectedPlayerPresetName.value)) {
    selectedPlayerPresetName.value = playerPresets.value[0]?.name || '';
  }
};

// 从 MVU 变量同步初始数据
onMounted(async () => {
  activatedCheatCodes.value = getActivatedCheatCodes();
  refreshPlayerPresets();

  try {
    const mvuData = await getMvuData();
    if (mvuData) {
      const syncedAttributes = syncFromMvu(mvuData);
      if (syncedAttributes) {
        characterData.value.attributes = syncedAttributes;
      }
    }
  } catch (error) {
    console.warn('无法从 MVU 同步数据，使用默认值:', error);
  }
});

// 记录已激活的作弊码
const recordActivatedCheatCode = async (code: string) => {
  activatedCheatCodes.value.add(code);
  saveActivatedCheatCodes(activatedCheatCodes.value);
};

// 作弊码验证
const applyCheatCode = async () => {
  if (isApplyingCheatCode.value) return;
  isApplyingCheatCode.value = true;

  try {
    const code = normalizeCheatCode(cheatCode.value);

    // 开局与小手机共用同一兑换码服务，保证物品和兑换记录一致。
    if (isKnownCheatCode(code)) {
      showCheatInput.value = false;
      cheatCode.value = '';

      const result = await redeemCheatCode(code);
      activatedCheatCodes.value = getActivatedCheatCodes();
      if (result.ok && code === '0210') {
        updateCharacterData({ difficulty: Difficulty.CHEATER });
        isCheatActive.value = true;
      }
      openModal(result.title, result.message);
      return;
    }

    // 检查是否已激活
    if (activatedCheatCodes.value.has(code)) {
      openModal('警告', `作弊码 ${code} 已经激活过了，无法重复使用！`);
      cheatCode.value = '';
      return;
    }

    if (code === '0210') {
      // 天赋作弊码
      isCheatActive.value = true;
      showCheatInput.value = false;
      cheatCode.value = '';

      // 设置难度为作弊者
      updateCharacterData({ difficulty: Difficulty.CHEATER });

      // 添加全属性+999的特殊装备到MVU背包
      try {
        const specialEquipment = {
          类型: '装备',
          等级: 'SS',
          描述: '作弊模式专属装备，全属性大幅提升',
          加成属性: {
            魅力加成: 999,
            幸运加成: 999,
            基础性斗力加成: 999,
            基础性斗力成算: 0,
            基础忍耐力加成: 999,
            基础忍耐力成算: 0,
            闪避率加成: 999,
            暴击率加成: 999,
          },
          部位: '特殊装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.作弊者之证': specialEquipment,
        });
        await recordActivatedCheatCode('0210');

        console.info('[开局] 作弊装备已添加到背包');
        openModal('CHEAT MODE ACTIVATE', '');
      } catch (error) {
        console.error('[开局] 添加作弊装备失败:', error);
        openModal('CHEAT MODE ACTIVATE', '');
      }
    } else if (code === '1011') {
      // 装备作弊码 - 自动装备草莓套装
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        // 定义装备数据
        const equipmentSet = {
          '物品系统._装备栏.主装备': {
            名称: '草莓奶油洋伞',
            等级: 'S',
            描述: '蕾丝花边的遮阳伞，伞尖是草莓形状，伞骨轻盈',
            加成属性: {
              魅力加成: 0,
              幸运加成: 0,
              基础性斗力加成: 0,
              基础性斗力成算: 0,
              基础忍耐力加成: 0,
              基础忍耐力成算: 0,
              闪避率加成: 0,
              暴击率加成: 10,
            },
          },
          '物品系统._装备栏.副装备': {
            名称: '「草莓奶芙」层叠蕾丝蓬蓬裙',
            等级: 'S',
            描述: '采用大量轻盈的多层欧根纱和丝缎编织而成的裙子，裙摆像盛开的花朵一样蓬起。腰间系有一个巨大的蝴蝶结，背后有类似小翅膀的装饰',
            加成属性: {
              魅力加成: 0,
              幸运加成: 0,
              基础性斗力加成: 0,
              基础性斗力成算: 0,
              基础忍耐力加成: 0,
              基础忍耐力成算: 0,
              闪避率加成: 10,
              暴击率加成: 0,
            },
          },
          '物品系统._装备栏.饰品1': {
            名称: '摇晃的猫耳发箍',
            等级: 'A',
            描述: '发箍上的猫耳朵会随着角色移动而摆动，增加动态的萌点',
            加成属性: {
              魅力加成: 10,
              幸运加成: 0,
              基础性斗力加成: 0,
              基础性斗力成算: 0,
              基础忍耐力加成: 0,
              基础忍耐力成算: 0,
              闪避率加成: 0,
              暴击率加成: 0,
            },
          },
          '物品系统._装备栏.饰品2': {
            名称: '铃铛丝绒项圈',
            等级: 'A',
            描述: '极细的丝绒带中心悬挂一颗镂空的银铃铛，走起路来有清脆的响声',
            加成属性: {
              魅力加成: 0,
              幸运加成: 10,
              基础性斗力加成: 0,
              基础性斗力成算: 0,
              基础忍耐力加成: 0,
              基础忍耐力成算: 0,
              闪避率加成: 0,
              暴击率加成: 0,
            },
          },
          '物品系统._装备栏.特殊装备': {
            名称: '灵魂伴侣·懒洋洋猫',
            等级: 'SS',
            描述: '一只趴在角色肩膀上的肥猫公仔，软塌塌地垂着四肢',
            加成属性: {
              魅力加成: 0,
              幸运加成: 0,
              基础性斗力加成: 0,
              基础性斗力成算: 0,
              基础忍耐力加成: 0,
              基础忍耐力成算: 0,
              闪避率加成: 0,
              暴击率加成: 0,
              最大快感加成: 50,
            },
          },
        };

        await updateMvuVariables(equipmentSet);
        await recordActivatedCheatCode('1011');

        console.info('[开局] 草莓套装已自动装备');
        openModal('草莓套装激活', '草莓套装已自动装备到身上！');
      } catch (error) {
        console.error('[开局] 装备失败:', error);
        openModal('错误', '装备失败，请检查MVU变量');
      }
    } else if (code === 'SNOW') {
      // SNOW：纯黑丝绒长围巾
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'A',
          描述: '那种"可远观而不可亵玩"的气质。因为太高冷，敌人的攻击似乎都因为自惭形秽而无法命中，同时也散发着致命的成熟魅力',
          加成属性: {
            魅力加成: 10,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: 0,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 10,
            暴击率加成: 0,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.纯黑丝绒长围巾': equipment,
        });
        await recordActivatedCheatCode('SNOW');

        console.info('[开局] SNOW 作弊码已激活');
        openModal('作弊码激活', '已获得：纯黑丝绒长围巾');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'PROTECT') {
      // PROTECT：袖子过长的宽大卫衣
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'B',
          描述: '激发所有人的保护欲。虽然本体很脆弱，但总能因为奇迹般的运气（幸运）躲过灾难，或者让敌人不忍心下重手。',
          加成属性: {
            魅力加成: 0,
            幸运加成: 10,
            基础性斗力加成: 0,
            基础性斗力成算: 0,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '副装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.袖子过长的宽大卫衣': equipment,
        });
        await recordActivatedCheatCode('PROTECT');

        console.info('[开局] PROTECT 作弊码已激活');
        openModal('作弊码激活', '已获得：袖子过长的宽大卫衣');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'ENERGY') {
      // ENERGY：荧光色运动护腕
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'A',
          描述: '永远停不下来，充满朝气。比起防御，更相信速度和汗水。',
          加成属性: {
            魅力加成: 0,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: 0,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 0,
            暴击率加成: 10,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.荧光色运动护腕': equipment,
        });
        await recordActivatedCheatCode('ENERGY');

        console.info('[开局] ENERGY 作弊码已激活');
        openModal('作弊码激活', '已获得：荧光色运动护腕');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'SILENCE') {
      // SILENCE：挂颈式头戴耳机
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'B',
          描述: '只要戴上耳机，世界就与我无关。极低的存在感让他很容易躲开麻烦（闪避），但也因此变得很难交到朋友。',
          加成属性: {
            魅力加成: -5,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: 0,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 15,
            暴击率加成: 0,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.挂颈式头戴耳机': equipment,
        });
        await recordActivatedCheatCode('SILENCE');

        console.info('[开局] SILENCE 作弊码已激活');
        openModal('作弊码激活', '已获得：挂颈式头戴耳机');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'QUEEN') {
      // QUEEN：精致的手工缎带
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'S',
          描述: '举手投足间都是金钱的味道。在校园里，魅力就是她的通行证，没人能拒绝她的请求。',
          加成属性: {
            魅力加成: 10,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: 0,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '饰品',
          数量: 1,
        };

        await grantMoneyWithUpdates(
          {
            '物品系统.背包.精致的手工缎带': equipment,
          },
          2000,
          'redemption',
        );
        await recordActivatedCheatCode('QUEEN');

        console.info('[开局] QUEEN 作弊码已激活');
        openModal('作弊码激活', '已获得：精致的手工缎带\n天海信用点 +2000');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'UNKNOWN') {
      // UNKNOWN：黑猫造型的小挎包
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'A',
          描述: '充满不确定性。没人知道他到底擅长什么，但也可能在关键时刻爆发出惊人的力量。',
          加成属性: {
            魅力加成: 1,
            幸运加成: 1,
            基础性斗力加成: 1,
            基础性斗力成算: 0,
            基础忍耐力加成: 1,
            基础忍耐力成算: 0,
            闪避率加成: 1,
            暴击率加成: 1,
          },
          部位: '特殊装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.黑猫造型的小挎包': equipment,
        });
        await recordActivatedCheatCode('UNKNOWN');

        console.info('[开局] UNKNOWN 作弊码已激活');
        openModal('作弊码激活', '已获得：黑猫造型的小挎包');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'HOT') {
      // HOT：五彩渐变美甲
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'B',
          描述: '虽然看起来爱玩，但吐槽和扇巴掌的力度绝对是校园顶级的。',
          加成属性: {
            魅力加成: 5,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: 0,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 0,
            暴击率加成: 5,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.五彩渐变美甲': equipment,
        });
        await recordActivatedCheatCode('HOT');

        console.info('[开局] HOT 作弊码已激活');
        openModal('作弊码激活', '已获得：五彩渐变美甲');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'LOVESICK') {
      // LOVESICK：藏在袖子里的美工刀
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'S',
          描述: '只要是为了心中所爱（或者执念），可以不计代价毁灭一切。',
          加成属性: {
            魅力加成: 0,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: 20,
            基础忍耐力加成: 0,
            基础忍耐力成算: -20,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '主装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.藏在袖子里的美工刀': equipment,
        });
        await recordActivatedCheatCode('LOVESICK');

        console.info('[开局] LOVESICK 作弊码已激活');
        openModal('作弊码激活', '已获得：藏在袖子里的美工刀');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'NERD') {
      // NERD：厚重黑框眼镜
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'A',
          描述: '知识就是力量！虽然看起来很弱，但总能因为各种奇怪的冷知识而化险为夷。',
          加成属性: {
            魅力加成: -8,
            幸运加成: 15,
            基础性斗力加成: 0,
            基础性斗力成算: 0,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 0,
            暴击率加成: 8,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.厚重黑框眼镜': equipment,
        });
        await recordActivatedCheatCode('NERD');

        console.info('[开局] NERD 作弊码已激活');
        openModal('作弊码激活', '已获得：厚重黑框眼镜');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'DEVIL') {
      // DEVIL：小恶魔翅膀发夹
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'S',
          描述: '小小的恶魔，大大的坏心思。总喜欢捉弄别人，但往往会被反捉弄。',
          加成属性: {
            魅力加成: 12,
            幸运加成: -5,
            基础性斗力加成: 0,
            基础性斗力成算: 8,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.小恶魔翅膀发夹': equipment,
        });
        await recordActivatedCheatCode('DEVIL');

        console.info('[开局] DEVIL 作弊码已激活');
        openModal('作弊码激活', '已获得：小恶魔翅膀发夹');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'AIRHEAD') {
      // AIRHEAD：草莓味棒棒糖
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'B',
          描述: '甜甜的糖果让人放松警惕，虽然脑子不太好使，但身材确实一级棒。',
          加成属性: {
            魅力加成: 15,
            幸运加成: 5,
            基础性斗力加成: 0,
            基础性斗力成算: -10,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.草莓味棒棒糖': equipment,
        });
        await recordActivatedCheatCode('AIRHEAD');

        console.info('[开局] AIRHEAD 作弊码已激活');
        openModal('作弊码激活', '已获得：草莓味棒棒糖');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'SUCCUBUS') {
      // SUCCUBUS：魅魔之尾
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'SS',
          描述: '魅魔的象征，能够吸取他人的精力转化为自己的力量。但也会让周围的人产生奇怪的欲望。',
          加成属性: {
            魅力加成: 20,
            幸运加成: -10,
            基础性斗力加成: 0,
            基础性斗力成算: 10,
            基础忍耐力加成: 0,
            基础忍耐力成算: -15,
            闪避率加成: 0,
            暴击率加成: 5,
          },
          部位: '特殊装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.魅魔之尾': equipment,
        });
        await recordActivatedCheatCode('SUCCUBUS');

        console.info('[开局] SUCCUBUS 作弊码已激活');
        openModal('作弊码激活', '已获得：魅魔之尾');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'CHAOS') {
      // CHAOS：不可名状触手
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'SS',
          描述: '来自深渊的触手，完全不可预测。有时候会帮你，有时候会害你，全看心情。',
          加成属性: {
            魅力加成: -20,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: 15,
            基础忍耐力加成: 0,
            基础忍耐力成算: 15,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '特殊装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.不可名状触手': equipment,
        });
        await recordActivatedCheatCode('CHAOS');

        console.info('[开局] CHAOS 作弊码已激活');
        openModal('作弊码激活', '已获得：不可名状触手');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'DOLL') {
      // DOLL：人偶专用保养油
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'A',
          描述: '让人偶的皮肤更加光滑细腻，痛觉进一步迟钝。但也会让感情变得更加淡漠。',
          加成属性: {
            魅力加成: 10,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: -15,
            基础忍耐力加成: 0,
            基础忍耐力成算: 20,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '副装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.人偶专用保养油': equipment,
        });
        await recordActivatedCheatCode('DOLL');

        console.info('[开局] DOLL 作弊码已激活');
        openModal('作弊码激活', '已获得：人偶专用保养油');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'BEAST') {
      // BEAST：兽耳发箍
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'A',
          描述: '让兽化人的感官更加敏锐，反应速度更快。但也会让本能变得更难控制。',
          加成属性: {
            魅力加成: 5,
            幸运加成: 8,
            基础性斗力加成: 0,
            基础性斗力成算: 10,
            基础忍耐力加成: 0,
            基础忍耐力成算: 5,
            闪避率加成: 15,
            暴击率加成: 0,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.兽耳发箍': equipment,
        });
        await recordActivatedCheatCode('BEAST');

        console.info('[开局] BEAST 作弊码已激活');
        openModal('作弊码激活', '已获得：兽耳发箍');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'CYBER') {
      // CYBER：机械手臂
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'S',
          描述: '高度精密的机械义肢，内置多种功能。但会让身体的一部分变得更加冰冷。',
          加成属性: {
            魅力加成: -10,
            幸运加成: -5,
            基础性斗力加成: 0,
            基础性斗力成算: 15,
            基础忍耐力加成: 0,
            基础忍耐力成算: 20,
            闪避率加成: 0,
            暴击率加成: 10,
          },
          部位: '主装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.机械手臂': equipment,
        });
        await recordActivatedCheatCode('CYBER');

        console.info('[开局] CYBER 作弊码已激活');
        openModal('作弊码激活', '已获得：机械手臂');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'PRINCESS') {
      // PRINCESS：蕾丝阳伞
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'A',
          描述: '公主的象征，优雅而高贵。虽然看起来很脆弱，但总有人会保护她。',
          加成属性: {
            魅力加成: 8,
            幸运加成: 12,
            基础性斗力加成: 0,
            基础性斗力成算: -10,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '副装备',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.蕾丝阳伞': equipment,
        });
        await recordActivatedCheatCode('PRINCESS');

        console.info('[开局] PRINCESS 作弊码已激活');
        openModal('作弊码激活', '已获得：蕾丝阳伞');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'DELINQUENT') {
      // DELINQUENT：不良少年头巾
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'B',
          描述: '看起来很不好惹，但其实内心很善良。总在关键时刻保护弱小。',
          加成属性: {
            魅力加成: -5,
            幸运加成: 5,
            基础性斗力加成: 0,
            基础性斗力成算: 10,
            基础忍耐力加成: 0,
            基础忍耐力成算: 5,
            闪避率加成: 0,
            暴击率加成: 0,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.不良少年头巾': equipment,
        });
        await recordActivatedCheatCode('DELINQUENT');

        console.info('[开局] DELINQUENT 作弊码已激活');
        openModal('作弊码激活', '已获得：不良少年头巾');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else if (code === 'SHY') {
      // SHY：遮脸刘海
      showCheatInput.value = false;
      cheatCode.value = '';

      try {
        const equipment = {
          类型: '装备',
          等级: 'C',
          描述: '因为害羞而遮住脸，但这样反而让人更加在意。意外地很会躲藏。',
          加成属性: {
            魅力加成: 3,
            幸运加成: 0,
            基础性斗力加成: 0,
            基础性斗力成算: 0,
            基础忍耐力加成: 0,
            基础忍耐力成算: 0,
            闪避率加成: 10,
            暴击率加成: 0,
          },
          部位: '饰品',
          数量: 1,
        };

        await updateMvuVariables({
          '物品系统.背包.遮脸刘海': equipment,
        });
        await recordActivatedCheatCode('SHY');

        console.info('[开局] SHY 作弊码已激活');
        openModal('作弊码激活', '已获得：遮脸刘海');
      } catch (error) {
        console.error('[开局] 添加装备失败:', error);
        openModal('错误', '添加装备失败');
      }
    } else {
      openModal('错误', '无效的代码');
      cheatCode.value = '';
    }
  } finally {
    isApplyingCheatCode.value = false;
  }
};

const MAX_STEPS = 5;

const navItems = computed(() => {
  if (isLifeSimMode.value) {
    // 生活模拟模式：只显示 温馨提示 → 角色选择 → 特殊体质
    return [
      { id: 1, label: '填报须知', icon: 'fa-file-lines' },
      { id: 2, label: '身份登记', icon: 'fa-user-secret' },
      { id: 5, label: '特质登记', icon: 'fa-dna' },
    ];
  }
  return [
    { id: 1, label: '填报须知', icon: 'fa-file-lines' },
    { id: 2, label: '基础资料', icon: 'fa-user' },
    {
      id: 3,
      label: admissionSelectedArchetypeId.value ? '身体数据' : '校园身份',
      icon: admissionSelectedArchetypeId.value ? 'fa-ruler' : 'fa-id-card',
    },
    { id: 4, label: '能力评估', icon: 'fa-chart-simple' },
    { id: 5, label: '特长登记', icon: 'fa-award' },
  ];
});

const stepTitles = computed(() => {
  if (isLifeSimMode.value) {
    return ['入学填报须知', '身份与入学方式', '', '', '个人特质登记'];
  }
  return [
    '入学填报须知',
    '基础资料登记',
    admissionSelectedArchetypeId.value ? '身体数据登记' : '校园身份登记',
    '入学能力评估',
    '个人特长登记',
  ];
});

const stepDescriptions = computed(() => {
  if (isLifeSimMode.value) {
    return [
      '开始填写前，请确认登记环境并阅读以下说明。',
      '选择一位NPC角色，设定难度和开局场景。',
      '',
      '',
      '选择你的特殊体质，这将影响你的被动能力。',
    ];
  }
  return [
    '请先确认登记环境。准备就绪后，即可建立你的个人学籍档案。',
    '填写你的姓名、个人经历与入学安排。学籍预览会随填写同步更新。',
    admissionSelectedArchetypeId.value
      ? '登记角色的身高、体重与身体特征。'
      : '登记你的校园定位；不同身份对应不同的初始加成与社交关系。',
    '按当前难度提供的点数填写能力分配，作为入学时的初始评估。',
    '登记初始技能与特殊体质，核对资料后即可确认入学。',
  ];
});

const admissionStepNumber = computed(() => navItems.value.findIndex(item => item.id === step.value) + 1);
const admissionArchetypeName = computed(
  () =>
    getAvailableArchetypes(characterData.value).find(item => item.id === characterData.value.archetypeId)?.name ??
    (isLifeSimMode.value ? selectedNpc.value?.name : null) ??
    '待选择',
);
const admissionChecks = computed(() => [
  { label: '登记姓名', icon: 'fas fa-user', complete: Boolean(characterData.value.name.trim()), pending: '待填写' },
  {
    label: '入学身份',
    icon: 'fas fa-id-card',
    complete: isLifeSimMode.value ? Boolean(selectedNpc.value) : Boolean(characterData.value.archetypeId),
    pending: '待选择',
  },
  {
    label: '特长登记',
    icon: 'fas fa-star',
    complete: characterData.value.initialPassiveSkills.length > 0,
    pending: '待选择',
  },
]);
const admissionCompletedChecks = computed(() => admissionChecks.value.filter(item => item.complete).length);

// 生活模拟模式只有3个步骤：1 -> 2 -> 5
const progress = computed(() => {
  if (isLifeSimMode.value) {
    // 步骤1=33%, 步骤2=66%, 步骤5=100%
    if (step.value === 1) return 33;
    if (step.value === 2) return 66;
    return 100;
  }
  return (step.value / MAX_STEPS) * 100;
});

const USER_PERSONA_SOURCE_FIELDS: Array<keyof CharacterData> = [
  'name',
  'age',
  'gender',
  'appearance',
  'personality',
  'palettePersonaOverview',
  'palettePersona',
  'userProfile',
  'configFeatures',
];

const sanitizeCharacterData = (data: CharacterData, previous?: CharacterData): CharacterData => {
  let sanitized = data;

  if (data.archetypeId) {
    const archetype = getAvailableArchetypes(data).find(archetype => archetype.id === data.archetypeId);
    if (!archetype) {
      sanitized = { ...sanitized, archetypeId: null };
    } else if (archetype.userProfile && data.userProfilePresetId !== archetype.id) {
      sanitized = {
        ...sanitized,
        userProfile: hasInitializedUserProfile(data, archetype.id)
          ? readUserProfile(data)
          : { ...archetype.userProfile },
        userProfilePresetId: archetype.id,
        palettePersona: '',
      };
    }
  }

  const passiveSkillIds = Array.isArray(data.initialPassiveSkills) ? data.initialPassiveSkills : [];
  const validPassiveSkills = passiveSkillIds.filter(constitutionId => {
    const constitution = getConstitutionById(constitutionId);
    return constitution ? canSelectConstitution(constitution, data) : false;
  });

  if (validPassiveSkills.length !== passiveSkillIds.length || passiveSkillIds !== data.initialPassiveSkills) {
    sanitized = { ...sanitized, initialPassiveSkills: validPassiveSkills };
  }

  return applyIdentityStartingAttributes(sanitized, previous ?? data);
};

const updateCharacterData = (fields: Partial<CharacterData>) => {
  if (
    !Object.hasOwn(fields, 'palettePersona') &&
    (Object.hasOwn(fields, 'userProfile') || (fields.name !== undefined && fields.name !== characterData.value.name))
  ) {
    fields = { ...fields, palettePersona: '' };
  }
  const previous = characterData.value;
  const updated = sanitizeCharacterData({ ...previous, ...fields }, previous);
  const shouldResetUserPersonaMode =
    isUsingTavernUserPersona.value &&
    (Object.keys(fields).some(field => USER_PERSONA_SOURCE_FIELDS.includes(field as keyof CharacterData)) ||
      (fields.height !== undefined && getUserInfoContent(updated) !== getUserInfoContent(previous)));

  characterData.value = updated;
  pendingUserPersonaOverwriteName.value = '';

  if (shouldResetUserPersonaMode) {
    isUsingTavernUserPersona.value = false;
    userPersonaMessageType.value = 'warning';
    userPersonaMessage.value = '表单内容已变更。如仍要使用酒馆用户人设，请重新点击“创建用户人设”。';
  }
};

const getDefaultPresetName = () => characterData.value.name.trim() || '默认预设';

const handleSavePlayerPreset = (name?: string) => {
  if (isLifeSimMode.value) {
    toastr.warning('人物预设只保存正常模式的人设，请切回正常模式后再保存。', '人物预设');
    return;
  }

  const presetName = (name || getDefaultPresetName()).trim() || getDefaultPresetName();
  try {
    if (savePlayerPreset(presetName, characterData.value)) {
      selectedPlayerPresetName.value = presetName;
      refreshPlayerPresets();
      toastr.success(`预设「${presetName}」已保存到本地存储，可跨聊天载入。`, '人物预设');
      return;
    }
  } catch (error) {
    console.warn('[开局] 人物预设保存失败:', error);
  }

  toastr.warning('保存人物预设失败，请检查酒馆变量接口。', '人物预设');
};

const savePlayerPresetQuietly = () => {
  const presetName = getDefaultPresetName();
  try {
    if (savePlayerPreset(presetName, characterData.value)) {
      selectedPlayerPresetName.value = presetName;
      refreshPlayerPresets();
      console.info(`[开局] 正常模式人物预设「${presetName}」已保存到本地存储`);
      return;
    }

    toastr.warning('保存人物预设失败，请检查酒馆变量接口。', '人物预设');
    console.warn('[开局] 正常模式人物预设保存失败');
  } catch (error) {
    console.warn('[开局] 正常模式人物预设保存异常:', error);
  }
};

const handleLoadPlayerPreset = () => {
  const presetName = selectedPlayerPresetName.value || playerPresets.value[0]?.name || '';
  const preset = loadPlayerPreset(presetName);
  if (!preset) {
    refreshPlayerPresets();
    toastr.warning('没有找到可载入的人物预设。', '人物预设');
    return false;
  }

  characterData.value = sanitizeCharacterData(preset);
  isLifeSimMode.value = false;
  selectedNpc.value = null;
  isUsingTavernUserPersona.value = false;
  pendingUserPersonaOverwriteName.value = '';
  userPersonaMessage.value = '';
  userPersonaMessageType.value = 'success';
  selectedPlayerPresetName.value = presetName;
  toastr.success(`已载入预设「${presetName || '默认预设'}」。`, '人物预设');
  return true;
};

const handleCreateUserPersona = async () => {
  if (isCreatingUserPersona.value) {
    return;
  }

  const personaName = normalizePlayerPersonaName(characterData.value.name);
  if (!personaName) {
    pendingUserPersonaOverwriteName.value = '';
    userPersonaMessageType.value = 'warning';
    userPersonaMessage.value = '请先填写姓名，再创建酒馆用户人设。';
    toastr.warning(userPersonaMessage.value, '用户人设');
    return;
  }

  if (!getUserInfoContent(characterData.value)) {
    pendingUserPersonaOverwriteName.value = '';
    userPersonaMessageType.value = 'warning';
    userPersonaMessage.value = '请先填写用户设定，再创建酒馆用户人设。';
    toastr.warning(userPersonaMessage.value, '用户人设');
    return;
  }

  let matchCount = 0;
  try {
    matchCount = getPlayerPersonaNameMatchCount(personaName);
  } catch (error) {
    pendingUserPersonaOverwriteName.value = '';
    console.warn('[开局] 检查酒馆用户人设失败:', error);
    userPersonaMessageType.value = 'error';
    userPersonaMessage.value = error instanceof Error ? error.message : '检查酒馆用户人设失败。';
    toastr.error(userPersonaMessage.value, '用户人设');
    return;
  }

  if (matchCount > 1) {
    pendingUserPersonaOverwriteName.value = '';
    userPersonaMessageType.value = 'error';
    userPersonaMessage.value = `酒馆中存在多个名为「${personaName}」的用户人设，无法安全覆盖。请先在用户人设管理里处理重名项。`;
    toastr.error(userPersonaMessage.value, '用户人设');
    return;
  }

  if (matchCount === 1 && pendingUserPersonaOverwriteName.value !== personaName) {
    pendingUserPersonaOverwriteName.value = personaName;
    userPersonaMessageType.value = 'warning';
    userPersonaMessage.value = `已存在名为「${personaName}」的酒馆用户人设。再次点击“确认覆盖用户人设”会直接覆写笑脸中的这个用户人设，并切换启用它，请谨慎选择。`;
    toastr.warning(userPersonaMessage.value, '用户人设');
    return;
  }

  isCreatingUserPersona.value = true;
  pendingUserPersonaOverwriteName.value = '';
  userPersonaMessage.value = '';
  userPersonaMessageType.value = 'success';

  try {
    const result = await createOrReplacePlayerPersonaFromCharacter(characterData.value);
    const personaDescription = buildPlayerPersonaDescription(characterData.value);
    const chatSaved = saveCurrentChatUserInfo(personaDescription, result.name);
    const worldbookCleared = await clearUserInfoWorldbook('[开局]');
    const clearProblems = [
      chatSaved ? '' : '聊天变量保存失败',
      worldbookCleared ? '' : '世界书 user 条目清空失败',
    ].filter(Boolean);
    const actionText = result.status === 'created' ? '新建' : '覆盖';

    isUsingTavernUserPersona.value = true;
    userPersonaMessageType.value = clearProblems.length ? 'warning' : 'success';
    userPersonaMessage.value = clearProblems.length
      ? `已${actionText}并启用酒馆用户人设「${result.name}」，后续切换聊天会按当前存档恢复此用户人设；但${clearProblems.join('、')}，请手动检查。`
      : `已${actionText}并启用酒馆用户人设「${result.name}」。后续切换聊天会按当前存档恢复此用户人设，当前 user 条目已清空。`;

    if (clearProblems.length) {
      toastr.warning(userPersonaMessage.value, '用户人设');
    } else {
      toastr.success(userPersonaMessage.value, '用户人设');
    }
  } catch (error) {
    console.warn('[开局] 创建酒馆用户人设失败:', error);
    userPersonaMessageType.value = 'error';
    userPersonaMessage.value = error instanceof Error ? error.message : '创建酒馆用户人设失败。';
    toastr.error(userPersonaMessage.value, '用户人设');
  } finally {
    isCreatingUserPersona.value = false;
  }
};

const handleUpdateSelectedPlayerPreset = () => {
  const presetName = selectedPlayerPresetName.value || playerPresets.value[0]?.name || '';
  if (!presetName) {
    toastr.warning('请先选择要覆盖的人物预设。', '人物预设');
    return;
  }

  try {
    if (savePlayerPreset(presetName, characterData.value)) {
      selectedPlayerPresetName.value = presetName;
      refreshPlayerPresets();
      toastr.success(`预设「${presetName}」的信息已更新。`, '人物预设');
      return;
    }
  } catch (error) {
    console.warn('[开局] 更新人物预设失败:', error);
  }

  toastr.warning('更新人物预设失败，请检查酒馆变量接口。', '人物预设');
};

const handleRenamePlayerPreset = (newName: string) => {
  const oldName = selectedPlayerPresetName.value || playerPresets.value[0]?.name || '';
  const presetName = newName.trim();
  if (!oldName) {
    toastr.warning('请先选择要改名的人物预设。', '人物预设');
    return;
  }
  if (!presetName) {
    toastr.warning('预设名称不能为空。', '人物预设');
    return;
  }
  if (presetName !== oldName && playerPresets.value.some(preset => preset.name === presetName)) {
    toastr.warning(`已经存在名为「${presetName}」的预设。`, '人物预设');
    return;
  }

  try {
    if (renamePlayerPreset(oldName, presetName)) {
      selectedPlayerPresetName.value = presetName;
      refreshPlayerPresets();
      toastr.success(`预设已改名为「${presetName}」。`, '人物预设');
      return;
    }
  } catch (error) {
    console.warn('[开局] 人物预设改名失败:', error);
  }

  toastr.warning('人物预设改名失败，请检查酒馆变量接口。', '人物预设');
};

const handleDeletePlayerPreset = () => {
  const presetName = selectedPlayerPresetName.value || playerPresets.value[0]?.name || '';
  if (!presetName) {
    toastr.warning('请先选择要删除的人物预设。', '人物预设');
    return;
  }

  if (!window.confirm(`确定删除人物预设「${presetName}」吗？`)) {
    return;
  }

  try {
    if (deletePlayerPreset(presetName)) {
      refreshPlayerPresets();
      toastr.success(`预设「${presetName}」已删除。`, '人物预设');
      return;
    }
  } catch (error) {
    console.warn('[开局] 删除人物预设失败:', error);
  }

  toastr.warning('删除人物预设失败，请检查酒馆变量接口。', '人物预设');
};

// 处理NPC选择（生活模拟模式）
const handleNpcSelect = (
  npc: {
    id: string;
    name: string;
    dbKey: string;
    skillKey: string;
    level: number;
    gender?: '男' | '女' | '非二元';
  } | null,
) => {
  selectedNpc.value = npc;
};

const nextStep = () => {
  if (step.value < MAX_STEPS) {
    // 生活模拟模式：从步骤2直接跳到步骤5
    if (isLifeSimMode.value && step.value === 2) {
      step.value = 5;
    } else {
      step.value++;
    }
  }
};

const prevStep = () => {
  if (step.value > 1) {
    // 生活模拟模式：从步骤5直接回到步骤2
    if (isLifeSimMode.value && step.value === 5) {
      step.value = 2;
    } else {
      step.value--;
    }
  }
};

const handleNavClick = (id: number) => {
  if (id < step.value) {
    step.value = id;
  }
};

const BONUS_KEYS = [
  '魅力加成',
  '幸运加成',
  '基础性斗力加成',
  '基础性斗力成算',
  '基础忍耐力加成',
  '基础忍耐力成算',
  '闪避率加成',
  '暴击率加成',
] as const;

type BonusKey = (typeof BONUS_KEYS)[number];

const createEmptyBonusStats = (): Record<BonusKey, number> =>
  Object.fromEntries(BONUS_KEYS.map(key => [key, 0])) as Record<BonusKey, number>;

const normalizeBonusStats = (input: Record<string, any> | undefined | null): Partial<Record<BonusKey, number>> => {
  const bonus: Partial<Record<BonusKey, number>> = {};
  for (const key of BONUS_KEYS) {
    const value = Number(input?.[key] ?? 0);
    if (Number.isFinite(value) && value !== 0) bonus[key] = value;
  }
  return bonus;
};

const createPermanentStatusEntry = (bonus: Record<string, any> = {}, description = '') => ({
  加成: {
    ...createEmptyBonusStats(),
    ...normalizeBonusStats(bonus),
  },
  描述: description,
});

const createConstitutionPermanentBonus = (constitution: {
  id: string;
  permanentModifiers: Array<{ stat: string; value: number }>;
}): Record<BonusKey, number> => {
  const bonus = createEmptyBonusStats();
  for (const mod of constitution.permanentModifiers) {
    if (BONUS_KEYS.includes(mod.stat as BonusKey)) {
      bonus[mod.stat as BonusKey] += mod.value;
    }
  }

  if (constitution.id === XIAOYEYUE_LIGHT_DARK_CONSTITUTION_ID) {
    const dynamicBonus = calculateXiaoyeyueLightDarkBonus(characterData.value.attributes?.核心状态?.堕落度 ?? 0);
    for (const key of BONUS_KEYS) {
      bonus[key] += dynamicBonus[key];
    }
  }

  return bonus;
};

const handleStartGame = async () => {
  if (loading.value) return;
  // Direct tab navigation must not bypass the required registration fields.
  if (isLifeSimMode.value ? !selectedNpc.value : !characterData.value.name.trim()) {
    admissionIdentityStage.value = 'edit';
    handleNavClick(2);
    openModal('资料未完成', isLifeSimMode.value ? '请先选择入学角色。' : '请先填写登记姓名。');
    return;
  }
  if (characterData.value.initialPassiveSkills.length === 0) {
    handleNavClick(5);
    openModal('资料未完成', '请先登记至少一项特殊体质。');
    return;
  }
  loading.value = true;

  try {
    const mainlineTimelineUpdates = getMainlineTimelineUpdates(characterData.value.mainlineTimeline);

    // ==================== 生活模拟模式特殊处理 ====================
    if (isLifeSimMode.value && selectedNpc.value) {
      const npcData = ENEMY_DATABASE[selectedNpc.value.dbKey];
      const npcSkillIds = ENEMY_SKILL_MAP[selectedNpc.value.skillKey] || [];

      if (!npcData) {
        console.error('[开局] 找不到NPC数据:', selectedNpc.value.dbKey);
        loading.value = false;
        openModal('错误', `找不到角色数据: ${selectedNpc.value.name}`);
        return;
      }

      // 将难度转换为 MVU 使用的格式
      const difficultyToMvu: Record<string, string> = {
        [Difficulty.STORY]: '简单',
        [Difficulty.NORMAL]: '普通',
        [Difficulty.HARDCORE]: '困难',
        [Difficulty.MASOCHIST]: '抖M',
        [Difficulty.CHEATER]: '作弊',
      };
      const mvuDifficulty = difficultyToMvu[characterData.value.difficulty] || '普通';

      // 辅助函数：将DamageSource枚举转换为MVU格式
      const mapDamageSource = (source: any): '性斗力' | '魅力' | '幸运' | '固定值' | '目标快感' => {
        const sourceMap: Record<string, '性斗力' | '魅力' | '幸运' | '固定值' | '目标快感'> = {
          sex_power: '性斗力',
          charm: '魅力',
          luck: '幸运',
          fixed: '固定值',
          target_pleasure: '目标快感',
        };
        return sourceMap[source] || '性斗力';
      };

      // 辅助函数：将buffs数组转换为MVU的效果列表格式
      const mapBuffsToEffects = (buffs: any[]): Record<string, any> => {
        const effects: Record<string, any> = {};

        // 所有作用于敌人的负面效果类型
        const debuffTypes = new Set([
          'atk_down',
          'def_down',
          'charm_down',
          'luck_down',
          'dodge_down',
          'crit_down',
          'bind',
          'sensitive',
          'dazed',
          'fatigue',
          'dot_lust',
        ]);

        buffs.forEach((buff, index) => {
          if (buff && buff.type) {
            // 根据buff类型映射到MVU的效果类型
            const buffTypeMap: Record<string, string> = {
              atk_up: '性斗力',
              atk_down: '性斗力',
              def_up: '忍耐力',
              def_down: '忍耐力',
              charm_up: '魅力',
              charm_down: '魅力',
              luck_up: '幸运',
              luck_down: '幸运',
              dodge_up: '闪避率',
              dodge_down: '闪避率',
              crit_up: '暴击率',
              crit_down: '暴击率',
              bind: '束缚',
              regen: '持续耐力',
              sensitive: '敏感',
              fatigue: '乏力',
              dazed: '迷离',
              focus: '集中',
              reflect: '反弹',
              lifesteal: '吸取快感',
              dot_lust: '持续快感',
            };

            const effectType = buffTypeMap[buff.type];
            if (!effectType) {
              return;
            }
            const rawEffectValue = buff.value || 0;
            // 判断是否为负面效果：检查是否在debuff类型集合中，或者效果值为负
            const isDebuff = debuffTypes.has(buff.type) || rawEffectValue < 0;
            // 对于包含 'down' 的类型，效果值必须为负数（降低属性）
            const isDownType = buff.type?.includes('down');
            const effectValue = isDownType ? -Math.abs(rawEffectValue) : rawEffectValue;

            effects[`效果${index + 1}`] = {
              效果类型: effectType,
              效果值: effectValue,
              是否为百分比: buff.isPercent || buff.isPercentage || false,
              持续回合数: buff.duration || 0,
              是否作用敌人: isDebuff, // 负面效果作用于敌人，正面效果作用于自己
            };
          }
        });
        return effects;
      };

      // 构建NPC的主动技能记录（使用正确的ActiveSkillSchema格式）
      const npcActiveSkills: Record<string, any> = {};
      for (const skillId of npcSkillIds) {
        const skillData = ENEMY_SKILLS[skillId];
        if (skillData) {
          // 获取主要伤害来源（取第一个damageFormula）
          const primaryDamage = skillData.damageFormula?.[0];

          npcActiveSkills[skillData.name] = {
            基本信息: {
              技能名称: skillData.name,
              技能描述: skillData.effectDescription || skillData.description || '',
              基础描述: skillData.description || '',
              技能等级: 1,
              稀有度: skillData.rarity || 'C',
            },
            冷却与消耗: {
              耐力消耗: skillData.staminaCost || 0,
              冷却回合数: skillData.cooldown || 0,
            },
            伤害与效果: {
              伤害来源: primaryDamage ? mapDamageSource(primaryDamage.source) : '性斗力',
              系数: primaryDamage ? Math.round((primaryDamage.coefficient || 1) * 100) : 100,
              基础命中率: skillData.accuracy || 100,
              连击数: skillData.hitCount || 1,
              准确率: skillData.accuracy || 100,
              暴击修正: skillData.critModifier || 0,
              效果列表: mapBuffsToEffects(skillData.buffs || []),
            },
          };
        }
      }

      // 构建永久状态列表（状态自身携带加成）
      const permanentStatusList: Record<string, any> = {};

      // 添加选中的体质到永久状态
      for (const constitutionId of characterData.value.initialPassiveSkills) {
        const constitution = getConstitutionById(constitutionId);
        if (constitution && canSelectConstitution(constitution, characterData.value)) {
          const bonus = createConstitutionPermanentBonus(constitution);
          permanentStatusList[constitution.name] = createPermanentStatusEntry(
            bonus,
            constitution.effectDescription || '',
          );
        }
      }

      // 写入MVU变量
      await updateMvuVariables(
        {
          // 角色基础
          '角色基础._姓名': selectedNpc.value.name,
          '角色基础._等级': npcData.对手等级,
          '角色基础.性别': selectedNpc.value.gender || '女', // 使用NPC设定的性别，默认女性
          '角色基础.难度': mvuDifficulty,
          // 核心状态
          '核心状态.$最大耐力': npcData.对手最大耐力,
          '核心状态.$耐力': npcData.对手耐力,
          '核心状态.$最大快感': npcData.对手最大快感,
          '核心状态._潜力': 10, // 默认潜力
          '基础属性._魅力': npcData.对手魅力,
          '基础属性._幸运': npcData.对手幸运,
          '基础属性._闪避率': npcData.对手闪避率,
          '基础属性._暴击率': npcData.对手暴击率,
          // 技能系统
          '技能系统.主动技能': npcActiveSkills,
          // 永久状态
          '永久状态.状态列表': permanentStatusList,
          ...mainlineTimelineUpdates,
        },
        { initialLevel: npcData.对手等级, identityId: '' },
      );

      console.info('[开局] 生活模拟模式 - NPC数据已写入MVU');
      console.info('[开局] NPC:', selectedNpc.value.name, '等级:', npcData.对手等级);
      console.info('[开局] 技能数量:', Object.keys(npcActiveSkills).length);

      // 生活模拟模式：保存NPC的立绘作为玩家头像（战斗界面使用）
      // 特殊角色的立绘文件名与角色名不同，需要映射
      const specialPortraitMap: Record<string, string> = {
        沐芯兰: '沐芯兰_2',
        克莉丝汀: '克莉丝汀_2',
        艾格妮丝蔷薇: '艾格妮丝',
        伊甸芙宁: '伊甸芙宁_2',
      };
      const portraitName = specialPortraitMap[selectedNpc.value.name] || selectedNpc.value.name;
      const npcPortraitUrl = getEnemyPortraitUrl(portraitName);
      savePlayerCustomAvatar(npcPortraitUrl);
      console.info('[开局] 生活模拟模式 - 已保存NPC立绘作为玩家头像:', npcPortraitUrl);

      // 发送角色基础数据到酒馆
      sendCharacterDataToTavern();

      // 处理世界书条目 - 根据"抖M"难度决定是否写入抖M特性
      // （与正常模式逻辑一致）
      if (characterData.value.difficulty === Difficulty.MASOCHIST) {
        // 如果难度为"抖M"，写入特性到世界书
        await writeMasochistTraitToWorldbook();
      } else {
        // 如果没有选择"抖M"难度，移除抖M特性
        await clearMasochistTraitFromWorldbook();
      }

      // 完成创建
      setTimeout(() => {
        loading.value = false;
        openModal('角色创建完成！', `你将以${selectedNpc.value!.name}的身份开始学园生活...`);
      }, 1500);
      return;
    }

    // ==================== 正常模式 ====================
    characterData.value = sanitizeCharacterData(characterData.value);
    // 保存选中的主动技能到 MVU 变量
    // 使用新的 ActiveSkillSchema 结构
    const activeSkillsRecord = convertSkillsToMvu(STARTER_SKILLS, characterData.value.initialActiveSkills);

    // 获取当前角色类型的永久状态
    const currentArchetypes = getAvailableArchetypes(characterData.value);
    const selectedArchetype = currentArchetypes.find(a => a.id === characterData.value.archetypeId);

    // 构建永久状态列表（状态自身携带加成）
    const permanentStatusList: Record<string, any> = {};

    // 添加角色类型的永久状态
    if (selectedArchetype?.permanentState) {
      permanentStatusList[selectedArchetype.passiveSkill.name] = createPermanentStatusEntry(
        selectedArchetype.permanentState.bonus,
        selectedArchetype.passiveSkill.effectDescription || selectedArchetype.passiveSkill.description,
      );
    }

    // 添加选中的体质到永久状态
    for (const constitutionId of characterData.value.initialPassiveSkills) {
      const constitution = getConstitutionById(constitutionId);
      if (constitution && canSelectConstitution(constitution, characterData.value)) {
        const bonus = createConstitutionPermanentBonus(constitution);
        permanentStatusList[constitution.name] = createPermanentStatusEntry(
          bonus,
          constitution.effectDescription || '',
        );
      }
    }

    // 将难度转换为 MVU 使用的格式
    const difficultyToMvu: Record<string, string> = {
      [Difficulty.STORY]: '简单',
      [Difficulty.NORMAL]: '普通',
      [Difficulty.HARDCORE]: '困难',
      [Difficulty.MASOCHIST]: '抖M',
      [Difficulty.CHEATER]: '作弊',
    };
    const mvuDifficulty = difficultyToMvu[characterData.value.difficulty] || '普通';

    // 将性别转换为 MVU 使用的格式
    const genderToMvu: Record<string, string> = {
      [Gender.MALE]: '男',
      [Gender.FEMALE]: '女',
      [Gender.OTHER]: '非二元',
    };
    const mvuGender = genderToMvu[characterData.value.gender] || '女';
    const { 核心状态, 基础属性 } = characterData.value.attributes;

    savePlayerPresetQuietly();

    await updateMvuVariables(
      {
        '技能系统.主动技能': activeSkillsRecord,
        '永久状态.状态列表': permanentStatusList,
        '角色基础._姓名': characterData.value.name,
        '角色基础.难度': mvuDifficulty, // 新增：写入难度
        '角色基础.性别': mvuGender, // 新增：写入性别
        '核心状态._潜力': 核心状态._潜力,
        '核心状态.$最大耐力': 核心状态.$最大耐力,
        '核心状态.$最大快感': 核心状态.$最大快感,
        '基础属性._魅力': 基础属性._魅力,
        '基础属性._幸运': 基础属性._幸运,
        ...mainlineTimelineUpdates,
        ...getIdentityStartingUpdates(characterData.value),
      },
      {
        initialLevel: characterData.value.attributes.角色基础._等级,
        identityId: characterData.value.archetypeId ?? '',
      },
    );

    console.info('[开局] 数据已保存到 MVU');
    console.info('[开局] 难度:', mvuDifficulty, '性别:', mvuGender);
    console.info('[开局] 永久状态:', permanentStatusList);

    // 发送角色基础数据到酒馆
    sendCharacterDataToTavern();

    // 处理世界书条目
    // 根据"抖M"难度决定是否写入抖M特性
    if (characterData.value.difficulty === Difficulty.MASOCHIST) {
      // 如果难度为"抖M"，写入特性到世界书
      await writeMasochistTraitToWorldbook();
    } else {
      // 如果没有选择"抖M"难度，移除抖M特性
      await clearMasochistTraitFromWorldbook();
    }

    // 完成创建
    setTimeout(() => {
      loading.value = false;
      openModal('角色创建完成！', '你的学园生活即将开始...');
    }, 1500);
  } catch (error) {
    console.error('[开局] 保存失败:', error);
    loading.value = false;
    openModal('保存失败', '请重试');
  }
};

// 发送角色基础数据到酒馆
const sendCharacterDataToTavern = async () => {
  const currentArchetypes = getAvailableArchetypes(characterData.value);
  const selectedArchetype = currentArchetypes.find(a => a.id === characterData.value.archetypeId);
  const openingStory = isLifeSimMode.value ? undefined : selectedArchetype?.openingStory;

  // 根据身体配置决定实际性别输出
  const isFemale = characterData.value.gender === Gender.FEMALE;
  const isMale = characterData.value.gender === Gender.MALE;
  const config = characterData.value.configFeatures || { hasBreasts: isFemale, hasPenis: isMale };
  const hasBreasts = config.hasBreasts;
  const hasPenis = config.hasPenis;

  // 根据选择的性器特征决定性别输出
  let genderText: string;
  if (hasBreasts && hasPenis) {
    genderText = '扶她';
  } else if (hasPenis) {
    genderText = '男';
  } else if (hasBreasts) {
    genderText = '女';
  } else {
    genderText = '无性';
  }

  // 构建角色描述文本
  let characterDescription: string;

  if (isLifeSimMode.value) {
    // 生活模拟模式：简化输出
    const difficultyMap: Record<string, string> = {
      学园生活: '简单',
      普通: '普通',
      困难: '困难',
      抖M特化: '抖M',
      作弊者: '作弊',
    };
    const mvuDifficultyText = difficultyMap[characterData.value.difficulty] || characterData.value.difficulty;

    const legacyOpeningScene = characterData.value.personality?.includes('[生活模拟模式开局场景]')
      ? characterData.value.personality.replace('[生活模拟模式开局场景]\n', '').trim()
      : '';
    const openingScene = characterData.value.openingSceneOutline?.trim() || legacyOpeningScene;

    const lifeSimParts: string[] = [
      `【学员档案】`,
      `姓名：${characterData.value.name}`,
      `模式：生活模拟`,
      `性别：${genderText}`,
      `难度：${mvuDifficultyText}`,
      '',
      `【生活模拟模式开局场景】`,
      openingScene || '（未设定）',
    ];
    const timelineConfig = MAINLINE_TIMELINE_CONFIG[characterData.value.mainlineTimeline];
    lifeSimParts.push('', `【主线时间线开局指令】`, timelineConfig.openingPrompt);

    characterDescription = `<用户信息>\n${lifeSimParts.join('\n')}\n</用户信息>`;
  } else {
    // 正常模式：完整输出
    const infoParts: string[] = [
      `【学员档案】`,
      `姓名：${characterData.value.name}`,
      `模式：正常模式`,
      `性别：${genderText}`,
      `难度：${characterData.value.difficulty}`,
      `身高：${characterData.value.height}cm`,
    ];

    // 只有有胸部时才显示罩杯和臀围（女性特征）
    if (hasBreasts) {
      if (characterData.value.cupSize) {
        infoParts.push(`罩杯：${characterData.value.cupSize}`);
      }
      if (characterData.value.hips) {
        infoParts.push(`臀围：${characterData.value.hips}cm`);
      }
      // 女性性器特征
      if (characterData.value.femaleGenitalType) {
        infoParts.push(`女性性器特征：${characterData.value.femaleGenitalType}`);
      }
    }

    // 只有有阴茎时才显示阴茎长度和男性性器特征
    if (hasPenis) {
      if (characterData.value.cockLength) {
        infoParts.push(`阴茎长度：${characterData.value.cockLength}cm`);
      }
      // 男性性器特征
      if (characterData.value.maleGenitalType) {
        infoParts.push(`男性性器特征：${characterData.value.maleGenitalType}`);
      }
    }

    // 如果两个性征都不选，则为无性
    if (!hasBreasts && !hasPenis) {
      infoParts.push(`性器特征：无性`);
    }

    const userInfo = getUserInfoContent(characterData.value);
    if (userInfo) infoParts.push('', userInfo);
    if (!openingStory && characterData.value.openingSceneOutline?.trim()) {
      infoParts.push('', `【开局情景大纲】`, characterData.value.openingSceneOutline.trim());
    }

    infoParts.push('', `【校园身份】`);
    infoParts.push(`类型：${selectedArchetype?.name || '未知'}`);
    infoParts.push(`身份效果：${selectedArchetype?.passiveSkill.name || '无'}`);
    infoParts.push(`特性描述：${selectedArchetype?.description || ''}`);

    if (!openingStory) {
      const timelineConfig = MAINLINE_TIMELINE_CONFIG[characterData.value.mainlineTimeline];
      infoParts.push('', `【主线时间线开局指令】`, timelineConfig.openingPrompt);
    }

    characterDescription = `<用户信息>\n${infoParts.join('\n')}\n</用户信息>`;
  }

  const userInput = buildIdentityOpeningInput(
    characterDescription,
    openingStory,
    isLifeSimMode.value ? undefined : characterData.value.archetypeId,
    characterData.value.name,
  );

  insertOrAssignVariables(
    { [CHAT_ADMISSION_IDENTITY_VARIABLE_KEY]: isLifeSimMode.value ? '' : characterData.value.archetypeId || '' },
    { type: 'chat' },
  );
  if (isUsingTavernUserPersona.value) {
    const personaDescription = buildPlayerPersonaDescription(characterData.value);
    const personaName = normalizePlayerPersonaName(characterData.value.name);
    if (saveCurrentChatUserInfo(personaDescription, personaName)) {
      console.info('[开局] 已使用酒馆用户人设，当前聊天用户信息已保存到聊天变量');
    } else {
      console.warn('[开局] 已使用酒馆用户人设，但当前聊天用户信息保存到聊天变量失败');
    }
  } else if (saveCurrentChatUserInfo(characterDescription)) {
    console.info('[开局] 当前聊天用户信息已保存到聊天变量');
  } else {
    console.warn('[开局] 当前聊天用户信息保存到聊天变量失败');
  }

  // 尝试发送到酒馆并写入世界书
  try {
    // @ts-ignore - createChatMessages 为全局注入
    if (typeof createChatMessages === 'function') {
      // 1. 发送角色信息到聊天
      // @ts-ignore
      await createChatMessages([
        {
          role: 'user',
          message: userInput,
          name: characterData.value.name,
        },
      ]);

      // 2. 旧世界书 user 仅保留非用户人设模式；用户人设模式只清空旧条目，避免混用。
      if (isUsingTavernUserPersona.value) {
        try {
          await clearUserInfoWorldbook('[开局]');
        } catch (worldbookError) {
          console.warn('[开局] 清空世界书 user 条目失败:', worldbookError);
        }
      } else {
        try {
          await writeUserInfoToWorldbook(characterDescription, '[开局]');
        } catch (worldbookError) {
          console.warn('[开局] 更新世界书失败:', worldbookError);
          // 继续执行，不阻止主流程
        }
      }

      // @ts-ignore - triggerSlash 为全局注入
      if (typeof triggerSlash === 'function') {
        // @ts-ignore
        await triggerSlash('/trigger');
      }

      // @ts-ignore - toastr 为全局注入
      if (isUsingTavernUserPersona.value) {
        toastr.success('角色信息已发送，并使用酒馆用户人设进入学园生活...', '命运的序章');
        console.info('[开局] 角色数据已发送到酒馆，已跳过世界书 user 写入');
      } else {
        toastr.success('角色信息已发送并写入世界书，学园生活即将开始...', '命运的序章');
        console.info('[开局] 角色数据已发送到酒馆并写入世界书');
      }
    }
  } catch (error) {
    console.warn('[开局] 无法发送到酒馆或写入世界书:', error);
    // @ts-ignore
    toastr.warning('角色信息发送失败，请手动输入或检查世界书配置', '提示');
  }
};

const openModal = (title: string, content?: string) => {
  modalTitle.value = title;
  modalContent.value = content || '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// 清空"抖M"特性世界书条目
const clearMasochistTraitFromWorldbook = async () => {
  try {
    let worldbookUpdated = false;

    // 方法1: 尝试直接访问世界书数据
    try {
      // @ts-ignore - updateWorldbookWith 为全局注入
      if (typeof updateWorldbookWith === 'function') {
        // @ts-ignore
        await updateWorldbookWith(
          '性斗学园',
          (worldbook: any[]) => {
            const uidStr = '1';
            let entry = worldbook.find((e: any) => String(e.uid) === uidStr);
            if (!entry) {
              entry = { uid: 1, name: 'uid_1', content: '' };
              worldbook.push(entry);
            }

            // 清空抖M特性
            if (String(entry.content || '').includes('<trait_败北宿命>')) {
              entry.content = '';
            }

            return worldbook;
          },
          { render: 'immediate' },
        );
        worldbookUpdated = true;
        console.info('[开局] 抖M特性已通过 updateWorldbookWith 从世界书清空');
      }

      // @ts-ignore - getWorldbook 为全局注入
      if (typeof getWorldbook === 'function') {
        // @ts-ignore
        const worldbook = await getWorldbook('性斗学园');
        const entry = worldbook.find((e: any) => e.uid === '1' || e.uid === 1);
        if (entry) {
          if (entry.content && entry.content.includes('<trait_败北宿命>')) {
            entry.content = '';
          }
          // @ts-ignore - replaceWorldbook 为全局注入
          if (typeof replaceWorldbook === 'function') {
            // @ts-ignore
            await replaceWorldbook('性斗学园', worldbook);
            worldbookUpdated = true;
            console.info('[开局] 抖M特性已从世界书清空');
          }
        }
      }
    } catch (e) {
      console.warn('[开局] 直接访问世界书失败:', e);
    }

    // 方法2: 如果无法直接访问，尝试通过slash命令执行器
    if (!worldbookUpdated) {
      // 清空条目内容
      const finalContent = '';

      const command = `/setentryfield file=性斗学园 uid=1 field=content ${finalContent}`;

      // 尝试通过triggerSlash执行命令（如果可用）
      try {
        // @ts-ignore - triggerSlash 为全局注入
        if (typeof triggerSlash === 'function') {
          // @ts-ignore
          await triggerSlash(command);
          worldbookUpdated = true;
          console.info('[开局] 已通过triggerSlash清空抖M特性');
        }
      } catch (e) {
        console.warn('[开局] triggerSlash执行失败:', e);
      }

      // 如果triggerSlash不可用，尝试其他执行方式
      if (!worldbookUpdated) {
        const globalAny = window as any;
        const executors = [
          () => globalAny.SillyTavern?.executeSlashCommand?.(command),
          () => globalAny.executeSlashCommand?.(command),
          () => globalAny.SillyTavern?.processSlashCommand?.(command),
          () => globalAny.parent?.SillyTavern?.executeSlashCommand?.(command),
          () => globalAny.parent?.executeSlashCommand?.(command),
          // 尝试通过消息输入框模拟输入
          () => {
            const inputElement = document.querySelector(
              '#send_textarea, textarea[placeholder*="Message"], .chat-input textarea',
            ) as HTMLTextAreaElement;
            if (inputElement) {
              inputElement.value = command;
              inputElement.dispatchEvent(new Event('input', { bubbles: true }));
              const form = inputElement.closest('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
              }
              return true;
            }
            return false;
          },
        ];

        for (const executor of executors) {
          try {
            const result = await executor();
            if (result !== undefined && result !== false) {
              worldbookUpdated = true;
              console.info('[开局] 已通过slash命令执行器清空抖M特性');
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (!worldbookUpdated) {
      console.warn('[开局] 无法自动清空抖M特性，请手动执行以下命令:');
      console.warn(`/setentryfield file=性斗学园 uid=1 field=content `);
    }
  } catch (error) {
    console.warn('[开局] 清空抖M特性失败:', error);
  }
};

// 写入"抖M"特性到世界书
const writeMasochistTraitToWorldbook = async () => {
  const traitContent = `<trait_败北宿命>
<user>有受虐倾向,进行游戏的目的就是为了被其中的角色羞辱与调教.保证主线剧情正确推动的情况下，即使<user>性斗胜利，剧情的走向也应该是<user>被调教;
<user>在思考时也会有与身份完全相反的“被调教”想法选项，
随着等级的提升,<user>的身体会越来越敏感，对气味，自己和其他人的丝足感到性冲动.
M是调教的手段，<user>不会受到过分的虐待，对于玩家的调教只会在调情范围内，禁止出现永久性伤害.
NPC都是完美体现数值的“性爱超人”，一定要让<user>体会到“色情魂类游戏”般的满满“粉红色的恶意”
</trait_败北宿命>`;

  try {
    let worldbookUpdated = false;

    // 方法1: 尝试直接访问世界书数据
    try {
      // @ts-ignore - updateWorldbookWith 为全局注入
      if (typeof updateWorldbookWith === 'function') {
        // @ts-ignore
        await updateWorldbookWith(
          '性斗学园',
          (worldbook: any[]) => {
            const uidStr = '1';
            let entry = worldbook.find((e: any) => String(e.uid) === uidStr);
            if (!entry) {
              entry = { uid: 1, name: 'uid_1', content: '' };
              worldbook.push(entry);
            }

            // 抖M难度：直接写入抖M特性（覆盖 uid=1）
            entry.content = traitContent;

            return worldbook;
          },
          { render: 'immediate' },
        );
        worldbookUpdated = true;
        console.info('[开局] 抖M特性已通过 updateWorldbookWith 写入世界书');
      }

      // @ts-ignore - getWorldbook 为全局注入
      if (typeof getWorldbook === 'function') {
        // @ts-ignore
        const worldbook = await getWorldbook('性斗学园');
        const entry = worldbook.find((e: any) => e.uid === '1' || e.uid === 1);
        if (entry) {
          entry.content = traitContent;
          // @ts-ignore - replaceWorldbook 为全局注入
          if (typeof replaceWorldbook === 'function') {
            // @ts-ignore
            await replaceWorldbook('性斗学园', worldbook);
            worldbookUpdated = true;
            console.info('[开局] 抖M特性已直接写入世界书');
          }
        }
      }
    } catch (e) {
      console.warn('[开局] 直接访问世界书失败:', e);
    }

    // 方法2: 如果无法直接访问，尝试通过slash命令执行器
    if (!worldbookUpdated) {
      const finalContent = traitContent;

      const command = `/setentryfield file=性斗学园 uid=1 field=content ${finalContent}`;

      // 尝试通过triggerSlash执行命令（如果可用）
      try {
        // @ts-ignore - triggerSlash 为全局注入
        if (typeof triggerSlash === 'function') {
          // @ts-ignore
          await triggerSlash(command);
          worldbookUpdated = true;
          console.info('[开局] 已通过triggerSlash写入抖M特性');
        }
      } catch (e) {
        console.warn('[开局] triggerSlash执行失败:', e);
      }

      // 如果triggerSlash不可用，尝试其他执行方式
      if (!worldbookUpdated) {
        const globalAny = window as any;
        const executors = [
          () => globalAny.SillyTavern?.executeSlashCommand?.(command),
          () => globalAny.executeSlashCommand?.(command),
          () => globalAny.SillyTavern?.processSlashCommand?.(command),
          () => globalAny.parent?.SillyTavern?.executeSlashCommand?.(command),
          () => globalAny.parent?.executeSlashCommand?.(command),
          // 尝试通过消息输入框模拟输入
          () => {
            const inputElement = document.querySelector(
              '#send_textarea, textarea[placeholder*="Message"], .chat-input textarea',
            ) as HTMLTextAreaElement;
            if (inputElement) {
              inputElement.value = command;
              inputElement.dispatchEvent(new Event('input', { bubbles: true }));
              const form = inputElement.closest('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
              }
              return true;
            }
            return false;
          },
        ];

        for (const executor of executors) {
          try {
            const result = await executor();
            if (result !== undefined && result !== false) {
              worldbookUpdated = true;
              console.info('[开局] 已通过slash命令执行器写入抖M特性');
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (!worldbookUpdated) {
      console.warn('[开局] 无法自动写入抖M特性到世界书，请手动执行以下命令:');
      console.warn(`/setentryfield file=性斗学园 uid=1 field=content ${traitContent}`);
    }
  } catch (error) {
    console.warn('[开局] 写入抖M特性失败:', error);
  }
};
</script>

<style lang="scss" scoped>
.bg-glass {
  background: rgba(255, 255, 255, 0.1);
}

.border-glassBorder {
  border-color: rgba(255, 255, 255, 0.2);
}

.primary {
  color: #6366f1;
}

.secondary {
  color: #ec4899;
}

.accent {
  color: #8b5cf6;
}
</style>
