import { stripDialogueMapBlocks } from '../engine/dialogue-map';

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
  'w2p',
]);

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

export function safeSubstituteMacros(text: string) {
  try {
    return substitudeMacros(text);
  } catch (error) {
    console.warn('[content-chat-renderer] macro substitution failed', error);
    return text;
  }
}

export function stripHiddenBlocks(text: string) {
  return stripAngleControlTags(
    stripDialogueMapBlocks(text).replace(
      /(?:^|\n)[^\n]*(?:画图提示词|绘图提示词|文生图提示词|图像提示词|image prompt)[^\n]*(?=\n\s*<image\b)/gi,
      '\n',
    ),
  )
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<w2p\b[^>]*>[\s\S]*?<\/w2p>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '')
    .replace(/^\s*<[^>\n]+>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function uniqueNonEmpty(values: Array<string | null | undefined>) {
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

export function formatVisibleAffiliation(affiliation: string | null | undefined) {
  const normalizedAffiliation = affiliation?.trim() ?? '';
  return normalizedAffiliation.length === 0 || normalizedAffiliation === '独立' ? null : normalizedAffiliation;
}

export function isPlausibleSpeakerLabel(label: string) {
  const normalizedLabel = label.trim();
  if (normalizedLabel.length === 0 || normalizedLabel.length > SPEAKER_LABEL_MAX_LENGTH) {
    return false;
  }

  if (isNonPersonSpeakerLabel(normalizedLabel) || PRONOUN_ACTION_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  return !/[，,。！？!?；;、]/.test(normalizedLabel);
}

export function normalizeCharacterLookupText(value: string) {
  return value
    .replace(/[{}·・•‧∙･．.]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export function matchesSpeakerNameAlias(speakerName: string, alias: string) {
  const normalizedSpeakerName = normalizeCharacterLookupText(speakerName);
  const normalizedAlias = normalizeCharacterLookupText(alias);
  if (normalizedSpeakerName.length === 0 || normalizedAlias.length === 0) {
    return false;
  }

  return (
    normalizedSpeakerName === normalizedAlias ||
    (normalizedAlias.length >= 2 && normalizedSpeakerName.startsWith(normalizedAlias))
  );
}

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
