import { fullbodyPortraitProfiles } from '../portrait-registry';

const SELF_NAMING_PATTERN =
  /(?:我叫|名叫|叫做|自称)([\u4e00-\u9fa5A-Za-z]{2,10}?)(?=[，,。！？!?、\s“”"'「」『』]|的那位|这位|那位|同学|学姐|学长|老师|先生|小姐|女士|$)/g;
const ATTRIBUTION_SPEAKER_PATTERN =
  /([\u4e00-\u9fa5A-Za-z]{1,10})(?:(?:低声说|低声道|回答道|解释道|提醒道|轻笑说|微笑说|冷声说|厉声说|轻声说|说道|问道|喊道|答道|笑道|骂道|吼道|叫道|回答|解释|提醒|嘟囔|念叨|低语|喃喃|开口|回应|说|问|喊)|(?:这么|这样|如此)(?:向[^。！？!?；;\n]{0,20})?(?:打招呼道|招呼道|说道|问道|喊道|答道|说|问|喊|道))/g;
const LEADING_ACTION_SPEAKER_PATTERN =
  /^\s*([\u4e00-\u9fa5A-Za-z]{2,10}?)(?=(?:自始至终|始终|一直|仍然|仍旧|依旧|还是|只是|正|正在|终于|缓缓|慢慢|并没有|没有|未曾|从|向|朝|对|把|被|在|低头|抬头|转身|回头|走|跑|站|坐|靠|停|凑|退|伸|收|拿|放|推|拉|扶|抱|夹|拍|点|摇|眨|睁|眯|皱|抿|咬|捂|笑|轻笑|微笑|苦笑|愣|怔|叹|开口|回应|说|问|喊|道))/gm;
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
const PRONOUN_CLAUSE_FRAGMENT_LABEL_PATTERN =
  /^(?:她|他|它|TA|Ta|ta|我|你)(?:并?没(?:有)?|没有|未曾|不(?:再|会|能)?|无法|无|已经|仍然|仍旧|依旧|只是|正在|正|终于|缓缓|慢慢|从|向|朝|对|把|被|在).*$/;
const GENERIC_ACTION_SUBJECT_PATTERN =
  /^(?:这|那|这个|那个|这种|那种|这些|那些|有人|众人|大家|所有人|声音|笑声|话语|目光|空气|气氛|文件|资料|纸张|书页|门|窗|光线|脚步|教室|走廊|楼道|楼梯|制服|校服)$/;
const SPEAKER_LABEL_MAX_LENGTH = 8;

function normalizeCharacterLookupText(value: string) {
  return value
    .replace(/[{}·・•‧∙･．.]/g, '')
    .replace(/\s+/g, '')
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

  if (PRONOUN_ACTION_LABEL_PATTERN.test(normalizedLabel) || PRONOUN_CLAUSE_FRAGMENT_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  return !/[，,。！？!?；;、]/.test(normalizedLabel);
}

function isPlausibleActionSpeakerLabel(label: string) {
  return isPlausibleSpeakerLabel(label) && !isNonPersonSpeakerLabel(label.trim());
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

function resolveRegisteredProfileAlias(label: string) {
  const normalizedLabel = normalizeCharacterLookupText(label);
  if (normalizedLabel.length < 2) {
    return null;
  }

  for (const profile of fullbodyPortraitProfiles) {
    const alias = profile.names.find(name => normalizeCharacterLookupText(name) === normalizedLabel);
    if (alias !== undefined && isPlausibleSpeakerLabel(alias)) {
      return alias;
    }
  }

  return null;
}

export function deriveKnownCharactersForContent(
  content: string,
  fallbackNpc: string,
  currentUserAlias: string,
  systemUserAlias = '',
) {
  const speakerCandidates = new Set<string>();
  const selfNamedCandidates = new Set<string>();
  const userAliases = new Set(uniqueNonEmpty(['{{user}}', currentUserAlias, systemUserAlias, '你', '我']));
  const normalizedContent = normalizeCharacterLookupText(content);
  const registeredFallbackNpc = resolveRegisteredProfileAlias(fallbackNpc);
  if (
    registeredFallbackNpc !== null &&
    content.includes(fallbackNpc) &&
    isPlausibleSpeakerLabel(registeredFallbackNpc) &&
    !userAliases.has(registeredFallbackNpc)
  ) {
    speakerCandidates.add(registeredFallbackNpc);
  }

  for (const profile of fullbodyPortraitProfiles) {
    const isProfileMentioned = profile.names.some(alias => {
      const normalizedAlias = normalizeCharacterLookupText(alias);
      return normalizedAlias.length >= 2 && normalizedContent.includes(normalizedAlias);
    });

    if (!isProfileMentioned) {
      continue;
    }

    for (const alias of profile.names) {
      if (isPlausibleSpeakerLabel(alias)) {
        speakerCandidates.add(alias);
      }
    }
  }

  const colonMatches = content.matchAll(/^([^：:\n<>{}]{1,18})[：:]/gm);
  for (const match of colonMatches) {
    const registeredAlias = resolveRegisteredProfileAlias(match[1]);
    if (registeredAlias !== null && isPlausibleSpeakerLabel(registeredAlias)) {
      speakerCandidates.add(registeredAlias);
    }
  }

  const attributionMatches = content.matchAll(ATTRIBUTION_SPEAKER_PATTERN);
  for (const match of attributionMatches) {
    const registeredAlias = resolveRegisteredProfileAlias(match[1]);
    if (registeredAlias !== null && isPlausibleSpeakerLabel(registeredAlias)) {
      speakerCandidates.add(registeredAlias);
    }
  }

  const leadingActionMatches = content.matchAll(LEADING_ACTION_SPEAKER_PATTERN);
  for (const match of leadingActionMatches) {
    const registeredAlias = resolveRegisteredProfileAlias(match[1]);
    if (registeredAlias !== null && isPlausibleActionSpeakerLabel(registeredAlias)) {
      speakerCandidates.add(registeredAlias);
    }
  }

  const selfNamingMatches = content.matchAll(SELF_NAMING_PATTERN);
  for (const match of selfNamingMatches) {
    const registeredAlias = resolveRegisteredProfileAlias(match[1]);
    if (registeredAlias !== null && isPlausibleSpeakerLabel(registeredAlias)) {
      speakerCandidates.add(registeredAlias);
      selfNamedCandidates.add(registeredAlias);
    }
  }

  return uniqueNonEmpty([
    ...Array.from(speakerCandidates).filter(name => selfNamedCandidates.has(name) || !userAliases.has(name)),
  ]);
}
