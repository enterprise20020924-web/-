<template>
  <article class="ContentChatRenderer">
    <section id="bp-narrative-panel" class="bp-panel bp-narrative-panel" aria-labelledby="bp-narrative-title">
    <h2 id="bp-narrative-title" class="bp-visually-hidden">剧情舞台</h2>

    <div class="bp-stage-frame" aria-hidden="true">
      <img class="bp-stage-frame-image" :src="frameBackgroundUrl" alt="" decoding="async" />
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
              'is-active': currentSegment?.side === 'left',
              'is-muted': currentSegment?.side === 'right',
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
              'is-active': currentSegment?.side === 'right',
              'is-muted': currentSegment?.side === 'left',
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
        <div v-if="currentSegment !== null" class="bp-speaker-tag">
          <span class="bp-speaker-name">{{ activeSpeakerName }}</span>
          <span v-if="activeSpeakerAffiliation !== null" class="bp-speaker-affiliation">{{ activeSpeakerAffiliation }}</span>
        </div>

        <template v-if="currentSegment !== null">
          <div
            :class="[
              'bp-dialogue-panel',
              {
                'is-user-turn': currentSegment.side === 'left',
                'is-npc-turn': currentSegment.side === 'right',
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
                      :aria-label="`跳到${segment.speaker ?? '旁白'}的段落`"
                      @click="jumpToSegment(segment.id)"
                    >
                      <span>{{ segment.speaker ?? '旁白' }}</span>
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
  </article>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import { splitDialogueSource } from './engine/dialogue-splitter';
import type { DialogueMood, DialogueSegment, DialogueSource } from './types/narrative';
import { fullbodyPortraitProfiles, getFullbodyPortraitUrl, resolveFullbodyAssetUrl } from './portrait-registry';
import type { FullbodyPortraitProfile } from './portrait-registry';

type SpeakerGender = 'male' | 'female' | 'unknown';
type UserPortraitGender = 'male' | 'female';

interface PortraitLayer {
  id: string;
  src: string;
  fallbackUrls: string[];
}

type PortraitPreviewSide = 'user' | 'npc';

interface PortraitPreview {
  src: string;
  label: string;
}

type TavernVariableGlobal = typeof globalThis & {
  Mvu?: {
    getMvuData?: (option: { type: 'message'; message_id: number | 'latest' }) => unknown;
  };
  getVariables?: (option: { type: 'message'; message_id: number | 'latest' }) => unknown;
};

type ContentRendererContext = {
  message_id: number;
  content: string;
  during_streaming: boolean;
};

const context = inject<ContentRendererContext>('content_renderer_context');
if (context === undefined) {
  throw Error('[content-chat-renderer] missing content renderer context');
}

const currentIndex = ref(0);
const portraitPreview = ref<PortraitPreview | null>(null);
const preloadedPortraitUrls = new Set<string>();
const STAGED_SEGMENT_LOOKAHEAD = 2;
const MOOD_HOLD_SEGMENTS = 2;

const MOOD_SUFFIX: Record<DialogueMood, string> = {
  neutral: '',
  happy: '高兴',
  angry: '生气',
  surprised: '惊讶',
};

const GENDER_FALLBACK_NAMES: Record<Exclude<SpeakerGender, 'unknown'>, string[]> = {
  male: ['路人男学生'],
  female: ['路人女学生'],
};
const frameBackgroundUrl = resolveFullbodyAssetUrl('背景备选.png');
const fallbackSceneBackgroundUrl = resolveFullbodyAssetUrl('新学校入口.png');
const DEFAULT_SCENE_BACKGROUND_FILES = ['新学校入口.png'];
const STAGE_LOCATION_BACKGROUND_FILES: Record<string, string[]> = {
  [normalizeStageLocationName('综合商业街')]: ['综合商业街.png'],
  [normalizeStageLocationName('学生宿舍A栋')]: ['学生宿舍A栋单人间.png'],
  [normalizeStageLocationName('学生宿舍A栋单人间')]: ['学生宿舍A栋单人间.png'],
  [normalizeStageLocationName('学生宿舍B栋')]: ['学生宿舍B栋单人间.png'],
  [normalizeStageLocationName('学生宿舍B栋单人间')]: ['学生宿舍B栋单人间.png'],
  [normalizeStageLocationName('餐厅')]: ['天海学园食堂.png'],
  [normalizeStageLocationName('天海学园食堂')]: ['天海学园食堂.png'],
  [normalizeStageLocationName('S班特别教室')]: ['S班特别教室.png'],
  [normalizeStageLocationName('A/B班进阶教室')]: ['AB班进阶教室.png'],
  [normalizeStageLocationName('AB班进阶教室')]: ['AB班进阶教室.png'],
  [normalizeStageLocationName('体育联盟-综合训练场')]: ['体育联盟总部主体育馆.png'],
  [normalizeStageLocationName('体育联盟总部主体育馆')]: ['体育联盟总部主体育馆.png'],
  [normalizeStageLocationName('博览图书馆')]: ['博览图书馆中央大厅.png', '博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('博览图书馆中央大厅')]: ['博览图书馆中央大厅.png', '博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('博览图书馆中央阅览大厅')]: ['博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('沙滩排球场')]: ['私人海滩沙滩排球场.png'],
  [normalizeStageLocationName('私人海滩沙滩排球场')]: ['私人海滩沙滩排球场.png'],
  [normalizeStageLocationName('女王宫殿-女权协会总部')]: ['女王宫殿女权协会总部.png'],
  [normalizeStageLocationName('女王宫殿女权协会总部')]: ['女王宫殿女权协会总部.png'],
  [normalizeStageLocationName('女王宫殿-女权协会生活区')]: ['女权协会生活宿舍豪华单间.png'],
  [normalizeStageLocationName('女权协会生活宿舍豪华单间')]: ['女权协会生活宿舍豪华单间.png'],
  [normalizeStageLocationName('学生会最高监控中心')]: ['权力之塔瞭望塔监控室.png'],
  [normalizeStageLocationName('权力之塔瞭望塔监控室')]: ['权力之塔瞭望塔监控室.png'],
  [normalizeStageLocationName('男性自保联盟秘密集会点')]: ['男性自保联盟秘密集会点.png'],
};

const PORTRAIT_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/对话立绘/';
const PORTRAIT_FILE_PATTERN = /^(?!.*高清版)[^./\\\-~0-9]+(?:高兴|生气|惊讶)?\.png$/;
const AMANE_NAME_PATTERN = /(?:响木)?天音/;
const SELF_NAMING_PATTERN =
  /(?:我叫|名叫|叫做|自称)([\u4e00-\u9fa5A-Za-z]{2,10}?)(?=[，,。！？!?、\s“”"'「」『』]|的那位|这位|那位|同学|学姐|学长|老师|先生|小姐|女士|$)/g;
const ATTRIBUTION_SPEAKER_PATTERN =
  /([\u4e00-\u9fa5A-Za-z]{1,10})(?:(?:低声说|低声道|回答道|解释道|提醒道|轻笑说|微笑说|冷声说|厉声说|轻声说|说道|问道|喊道|答道|笑道|骂道|吼道|叫道|回答|解释|提醒|嘟囔|念叨|低语|喃喃|开口|回应|说|问|喊)|(?:这么|这样|如此)(?:向[^。！？!?；;\n]{0,20})?(?:打招呼道|招呼道|说道|问道|喊道|答道|说|问|喊|道))/g;
const LEADING_ACTION_SPEAKER_PATTERN =
  /^\s*([\u4e00-\u9fa5A-Za-z]{2,10})(?=(?:从|向|朝|对|把|被|在|低头|抬头|转身|回头|走|跑|站|坐|靠|停|凑|退|伸|收|拿|放|推|拉|扶|抱|拍|点|摇|眨|睁|眯|皱|抿|咬|捂|笑|轻笑|微笑|苦笑|愣|怔|叹|开口|回应|说|问|喊|道))/gm;
const NARRATIVE_SPEAKER_LABEL_PATTERN =
  /旁白|叙述|系统|提示|说明|补充|备注|注释|小字|文字|标题|规则|选项|状态|环境|地点|时间|画面|镜头|场景|内心|心理|独白|心声|声音|广播|公告|通知|字幕|旁注|前情|总结|信息|面板|日志|内容|下一行|下面|上面|本段/;
const NON_PERSON_SPEAKER_LABEL_PATTERN =
  /^(?:[一二三四五六七八九十0-9]+楼|[一二三四五六七八九十0-9]+层|(?:这|那)(?:个|种|些|套|件|份|张|条|段|句|本)?[\u4e00-\u9fa5]{0,6}|.*(?:制服|校服|裙摆|锁骨|空气|气氛|阳光|地板|窗外|门口|角落|地方|过场|记录|记录表|文件|资料|纸张|走廊|楼道|楼梯|教室|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟))$/;
const GENERIC_ACTION_SUBJECT_PATTERN =
  /^(?:这|那|这个|那个|这种|那种|这些|那些|有人|众人|大家|所有人|声音|笑声|话语|目光|空气|气氛|文件|资料|纸张|书页|门|窗|光线|脚步|教室|走廊|楼道|楼梯|制服|校服)$/;
const SPEAKER_LABEL_MAX_LENGTH = 8;
const FEMALE_CONTEXT_PATTERN = /她(?:说|问|笑|看|把|向|在|的)|小姐|女士|少女|女人|女孩|姑娘|女(?:子|孩|人|性|警|店员|医生)|姐姐|妹妹|夫人|太太/;
const MALE_CONTEXT_PATTERN = /他(?:说|问|笑|看|把|向|在|的)|先生|少爷|少年|男人|男子|男(?:子|孩|人|性|警|店员|医生)|大叔|老头|哥哥|弟弟/;
const FEMALE_NAME_PATTERN = /(子|美|香|惠|花|音|姬|莉|丽|丝|娜|雅|雪|凛|爱|由|纱|织|玲|奈|菜|希|理|里|乃|萌|桃|樱|葵|咲)$/;
const MALE_NAME_PATTERN = /(太郎|次郎|一郎|二郎|三郎|介|郎|雄|男|夫|彦|也|司|彻|健|龙|翔|斗|吾|朗|树)$/;
const USER_FULLBODY_PORTRAITS: Record<UserPortraitGender, string> = {
  male: getFullbodyPortraitUrl('男主_黑西装校服_普通学生.png') ?? '',
  female: getFullbodyPortraitUrl('女主.png') ?? '',
};

const contentText = computed(() => stripHiddenBlocks(safeSubstituteMacros(context.content)));
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
  knownCharacters: deriveKnownCharacters(contentText.value, fallbackNpcLabel.value, userStatus.value.alias),
  userAliases: uniqueNonEmpty(['{{user}}', userStatus.value.alias, userRoleName.value, userAlias.value, SillyTavern.name1, '你', '我']),
}));

const splitResult = computed(() => splitDialogueSource(dialogueSource.value));
const segments = computed(() => splitResult.value.segments);
const knownCharacters = computed(() => splitResult.value.knownCharacters);
const npcKnownCharacters = computed(() => knownCharacters.value.filter(name => !isUserRoleSpeakerName(name)));
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

  if (
    stagedNpcSegment.value?.speaker !== null &&
    stagedNpcSegment.value?.speaker !== undefined &&
    !isUserRoleSpeakerName(stagedNpcSegment.value.speaker)
  ) {
    return stagedNpcSegment.value.speaker;
  }

  return null;
});

const activeSpeakerName = computed(() => {
  if (currentSegment.value?.side === 'left') {
    return userStatus.value.alias;
  }

  if (currentSegment.value?.side === 'right') {
    return activeNpcLabel.value ?? '旁白';
  }

  return '旁白';
});

const portraitNpcLabel = computed(() => {
  const activeSegment = currentSegment.value;
  if (activeSegment?.kind === 'npc' && activeSegment.speaker !== null && !isUserRoleSpeakerName(activeSegment.speaker)) {
    return activeSegment.speaker;
  }

  if (activeSegment?.kind === 'npc') {
    return null;
  }

  if (isStreaming.value) {
    return findPreviousNpcSpeaker(segments.value, currentIndex.value, 1);
  }

  return findPreviousNpcSpeaker(segments.value, currentIndex.value, MOOD_HOLD_SEGMENTS);
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

const activeNpcGender = computed<SpeakerGender>(() => {
  if (currentSegment.value === null || portraitNpcLabel.value === null) {
    return 'unknown';
  }

  return inferSpeakerGender(portraitNpcLabel.value, npcPortraitContext.value);
});

const npcPortraitUrl = computed(() =>
  portraitNpcLabel.value === null ? null : resolveNpcPortraitUrl(portraitNpcLabel.value, activeNpcMood.value, npcPortraitContext.value),
);

const activeSpeakerAffiliation = computed(() => {
  if (currentSegment.value?.kind === 'user') {
    return userCharacterProfile.value?.affiliation ?? null;
  }

  if (currentSegment.value?.kind !== 'npc') {
    return null;
  }

  return activeNpcLabel.value === null ? null : resolveCharacterProfileBySpeakerName(activeNpcLabel.value)?.affiliation ?? null;
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

    const gender = inferSpeakerGender(speakerName, contextText);
    const src = resolveNpcPortraitUrl(speakerName, mood, contextText);
    if (src === null) {
      return;
    }

    layers.set(src, createPortraitLayer(`npc:${src}`, src, createNpcFallbackUrls(speakerName, mood, gender, contextText)));
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

watch(stageLocationLabel, () => {
  sceneBackgroundFallbackIndex.value = 0;
});

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

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handlePortraitPreviewKeydown);
});

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

function stripHiddenBlocks(text: string) {
  return text
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '')
    .replace(/^\s*<[^>\n]+>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function deriveKnownCharacters(content: string, fallbackNpc: string, currentUserAlias: string) {
  const speakerCandidates = new Set<string>();
  const selfNamedCandidates = new Set<string>();
  const userAliases = new Set(uniqueNonEmpty(['{{user}}', currentUserAlias, SillyTavern.name1, '你', '我']));
  if (isPlausibleSpeakerLabel(fallbackNpc) && content.includes(fallbackNpc) && !userAliases.has(fallbackNpc)) {
    speakerCandidates.add(fallbackNpc);
  }

  const colonMatches = content.matchAll(/^([^：:\n<>{}]{1,18})[：:]/gm);
  for (const match of colonMatches) {
    if (isPlausibleSpeakerLabel(match[1])) {
      speakerCandidates.add(match[1]);
    }
  }

  const attributionMatches = content.matchAll(ATTRIBUTION_SPEAKER_PATTERN);
  for (const match of attributionMatches) {
    if (isPlausibleSpeakerLabel(match[1])) {
      speakerCandidates.add(match[1]);
    }
  }

  const leadingActionMatches = content.matchAll(LEADING_ACTION_SPEAKER_PATTERN);
  for (const match of leadingActionMatches) {
    if (isPlausibleActionSpeakerLabel(match[1])) {
      speakerCandidates.add(match[1]);
    }
  }

  const selfNamingMatches = content.matchAll(SELF_NAMING_PATTERN);
  for (const match of selfNamingMatches) {
    const selfNamedSpeaker = match[1];
    speakerCandidates.add(selfNamedSpeaker);
    selfNamedCandidates.add(selfNamedSpeaker);
  }

  return uniqueNonEmpty([
    ...Array.from(speakerCandidates).filter(name => selfNamedCandidates.has(name) || !userAliases.has(name)),
  ]);
}

function isPlausibleSpeakerLabel(label: string) {
  const normalizedLabel = label.trim();
  if (normalizedLabel.length === 0 || normalizedLabel.length > SPEAKER_LABEL_MAX_LENGTH) {
    return false;
  }

  if (NARRATIVE_SPEAKER_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  if (NON_PERSON_SPEAKER_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  return !/[，,。！？!?；;、]/.test(normalizedLabel);
}

function isPlausibleActionSpeakerLabel(label: string) {
  return isPlausibleSpeakerLabel(label) && !GENERIC_ACTION_SUBJECT_PATTERN.test(label.trim());
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

function readVariableSnapshots(messageId: number) {
  return [
    readMvuData(messageId),
    readVariables(messageId),
    readMvuData('latest'),
    readVariables('latest'),
    readMvuData(0),
    readVariables(0),
  ];
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
  const locationName = readFirstPathValue(readVariableSnapshots(messageId), [
    ['stat_data', '位置系统', '地点名称'],
    ['位置系统', '地点名称'],
  ]);
  const normalizedLocation = String(unwrapMvuValue(locationName) ?? '').trim();

  return normalizedLocation.length > 0 ? normalizedLocation : '地点未同步';
}

function normalizeStageLocationName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/[／]/g, '/')
    .replace(/[－–—−]/g, '-');
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

function inferSpeakerGender(speakerName: string, contextText: string): SpeakerGender {
  const normalizedName = speakerName.replace(/[{}]/g, '').trim();
  const combinedText = `${normalizedName} ${contextText}`;
  let femaleScore = 0;
  let maleScore = 0;

  if (FEMALE_CONTEXT_PATTERN.test(combinedText)) {
    femaleScore += 3;
  }

  if (MALE_CONTEXT_PATTERN.test(combinedText)) {
    maleScore += 3;
  }

  if (FEMALE_NAME_PATTERN.test(normalizedName)) {
    femaleScore += 2;
  }

  if (MALE_NAME_PATTERN.test(normalizedName)) {
    maleScore += 2;
  }

  if (femaleScore >= maleScore + 2) {
    return 'female';
  }

  if (maleScore >= femaleScore + 2) {
    return 'male';
  }

  return 'unknown';
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

function findPreviousNpcSpeaker(visibleSegments: DialogueSegment[], index: number, maxDistance = Number.POSITIVE_INFINITY) {
  const minIndex = Math.max(0, index - maxDistance);
  for (let segmentIndex = index - 1; segmentIndex >= minIndex; segmentIndex -= 1) {
    const segment = visibleSegments[segmentIndex];
    if (segment?.kind === 'npc' && segment.speaker !== null && !isUserRoleSpeakerName(segment.speaker)) {
      return segment.speaker;
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

function resolveGenderFallbackPortrait(gender: SpeakerGender, mood: DialogueMood) {
  return resolveGenderFallbackPortraits(gender, mood)[0] ?? null;
}

function resolveGenderFallbackPortraits(gender: SpeakerGender, mood: DialogueMood) {
  if (gender === 'unknown') {
    return [];
  }

  return uniqueUrls(GENDER_FALLBACK_NAMES[gender].map(name => resolveMoodPortrait([name], mood)));
}

function normalizeCharacterLookupText(value: string) {
  return value.replace(/[{}]/g, '').replace(/\s+/g, '').trim();
}

function matchesSpeakerNameAlias(speakerName: string, alias: string) {
  const normalizedSpeakerName = normalizeCharacterLookupText(speakerName);
  const normalizedAlias = normalizeCharacterLookupText(alias);
  if (normalizedSpeakerName.length === 0 || normalizedAlias.length === 0) {
    return false;
  }

  return (
    normalizedSpeakerName === normalizedAlias ||
    (normalizedAlias.length >= 2 &&
      (normalizedSpeakerName.includes(normalizedAlias) || normalizedAlias.includes(normalizedSpeakerName)))
  );
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

function resolveCharacterProfileByContext(contextText: string) {
  const normalizedContextText = normalizeCharacterLookupText(contextText);
  if (normalizedContextText.length === 0) {
    return null;
  }

  return (
    fullbodyPortraitProfiles.find(profile =>
      profile.names.some(alias => {
        const normalizedAlias = normalizeCharacterLookupText(alias);
        return normalizedAlias.length >= 2 && normalizedContextText.includes(normalizedAlias);
      }),
    ) ?? null
  );
}

function resolveCharacterProfile(speakerName: string, contextText = ''): FullbodyPortraitProfile | null {
  return resolveCharacterProfileBySpeakerName(speakerName) ?? resolveCharacterProfileByContext(contextText);
}

function resolveSpecialNpcPortraitUrl(speakerName: string, contextText = '') {
  const profile = resolveCharacterProfileBySpeakerName(speakerName);
  if (profile !== null) {
    return profile.portraitUrl;
  }

  const normalizedSpeakerName = speakerName.replace(/[{}]/g, '').trim();
  return AMANE_NAME_PATTERN.test(normalizedSpeakerName) ? getFullbodyPortraitUrl('响木天音校服.png') : null;
}

function resolveNpcNeutralPortraitUrl(speakerName: string, contextText = '') {
  return (
    resolveSpecialNpcPortraitUrl(speakerName, contextText) ??
    resolveGenderFallbackPortrait(inferSpeakerGender(speakerName, contextText), 'neutral')
  );
}

function resolveNpcPortraitUrl(speakerName: string, mood: DialogueMood, contextText = '') {
  const specialPortraitUrl = resolveSpecialNpcPortraitUrl(speakerName, contextText);
  if (specialPortraitUrl !== null) {
    return specialPortraitUrl;
  }

  const neutralUrl = resolveNpcNeutralPortraitUrl(speakerName, contextText);
  if (mood === 'neutral') {
    return neutralUrl;
  }

  return (
    resolveGenderFallbackPortrait(inferSpeakerGender(speakerName, contextText), mood) ??
    neutralUrl
  );
}

function createNpcFallbackUrls(speakerName: string, mood: DialogueMood, gender: SpeakerGender, contextText = '') {
  const neutralUrl = resolveNpcNeutralPortraitUrl(speakerName, contextText);
  return uniqueUrls([
    neutralUrl,
    ...(mood === 'neutral' ? [] : resolveGenderFallbackPortraits(gender, mood)),
    ...resolveGenderFallbackPortraits(gender, 'neutral'),
  ]);
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
