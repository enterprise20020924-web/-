import type { DialogueMapEntry, DialogueSegment, DialogueSource, DialogueSplitResult } from '../types/narrative';
import { resolveRegisteredCanonicalCharacterName } from './character-name-registry';
import { calibrateDialogueMapEntriesForSource, stripDialogueMapBlocks } from './dialogue-map';
import { inferDialogueEmotion } from './dialogue-emotion';

const SPEECH_VERB_PATTERN =
  /(?:打招呼道|招呼道|低声说|低声道|答道|回答道|解释道|提醒道|回应道|说道|问道|喊道|压低声音|笑道|轻笑说|微笑说|补了一句|骂道|吼道|叫道|冷声说|厉声说|轻声说|回答|解释|提醒|开口|回应|嘟囔|念叨|冷声|厉声|轻声|低语|喃喃|说|问|喊)(?=\s*(?:[：:，,“「『"]|[。！？!?；;]?\s*$))/;
const BARE_DAO_AFTER_SPEAKER_PATTERN =
  /^(?:\s*|[^。！？!?；;\n]{0,24}[，,]\s*)道(?=\s*(?:[：:，,“「『"]|[。！？!?；;]?\s*$))/;
const BARE_DAO_PRONOUN_PATTERN =
  /(?:^|[。！？!?；;，,\s])(?:她|他|TA|Ta|ta|对方|那人|这人|这个人|那个人)\s*道(?=\s*(?:[：:，,“「『"]|[。！？!?；;]?\s*$))/;
const LEADING_ATTRIBUTION_PATTERN =
  /(说|问|喊|道|答道|回答|回答道|解释|解释道|提醒|开口|回应|嘟囔|念叨|压低声音|笑道|轻笑说|微笑说|骂道|吼道|叫道|冷声|冷声说|厉声|厉声说|轻声|轻声说|低语|喃喃|轻笑|微笑|错愕|惊讶|恼火|睁大眼|抬头|抬起头|转头|转过头|转身|转过身|回头|看向|垂眸|停步|攥紧|松了口气|舒了口气)[：:，,。！？!?]*$/;
const ATTRIBUTION_BOUNDARY_PATTERN = /[。！？!?；;]\s*$/;
const SPEECH_VERB_TAIL_PATTERN =
  /(?:低声说|低声道|回答道|解释道|提醒道|压低声音|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|冷声|厉声|轻声|低语|喃喃|开口|回应|说|问|喊|道)$/;
const SPEECH_TAG_TAIL_PATTERN =
  /(?:[，,]\s*)?(?:(?:[\u4e00-\u9fa5A-Za-z]{1,8}地|低声|轻声|柔声|冷声|厉声|小声|大声|沉声|淡淡|缓缓|慢慢|认真|平静|温柔|急切|犹豫|一字一顿|压低声音)\s*)?(?:低声说|低声道|回答道|解释道|提醒道|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|低语|喃喃|开口|回应|说|问|喊|道)$/;
const INLINE_QUOTE_ATTRIBUTION_MAX_CHARS = 32;
const INLINE_QUOTE_ATTRIBUTION_PATTERN =
  /^(?:[，,]\s*)?(?:(?:她|他|TA|Ta|ta|对方|那人|这人|这个人|那个人|[\u4e00-\u9fa5A-Za-z]{1,12})\s*)?(?:(?:有些|略微|微微|轻轻|怯怯|小心翼翼|结结巴巴|吞吞吐吐|不好意思|低声|轻声|柔声|冷声|厉声|小声|大声|沉声|淡淡|缓缓|慢慢|认真|平静|温柔|急切|犹豫|迟疑|不安|皱眉|垂眸|低头|抬头|压低声音)(?:地)?\s*){0,3}(?:打招呼道|招呼道|低声说|低声道|轻声说|冷声说|厉声说|柔声说|小声说|沉声说|说道|问道|喊道|答道|回答道|解释道|提醒道|回应道|补了一句|又问|追问|继续问|开口|出声|发声|回答|解释|提醒|回应|嘟囔|念叨|低语|喃喃|笑道|说|问|喊|道)(?:[，,。！？!?；;]\s*)?$/;
const TRAILING_SPEECH_ATTRIBUTION_DISPLAY_PATTERN =
  /^(?:[，,]\s*)?(?:(?:她|他|TA|Ta|ta|对方|那人|这人|这个人|那个人|[\u4e00-\u9fa5A-Za-z]{1,12})\s*)?(?:(?:有些|略微|微微|轻轻|怯怯|小心翼翼|结结巴巴|吞吞吐吐|不好意思|低声|轻声|柔声|冷声|厉声|小声|大声|沉声|淡淡|缓缓|慢慢|认真|平静|温柔|急切|犹豫|迟疑|不安|皱眉|垂眸|低头|抬头|压低声音)(?:地)?\s*){0,3}(?:打招呼道|招呼道|低声说|低声道|轻声说|冷声说|厉声说|柔声说|小声说|沉声说|说道|问道|喊道|答道|回答道|解释道|提醒道|回应道|补了一句|又问|追问|继续问|开口|出声|发声|回答|解释|提醒|回应|嘟囔|念叨|低语|喃喃|笑道|说|问|喊|道)(?:[，,。！？!?；;]\s*)?$/;
const TRAILING_VOICE_NOTE_DISPLAY_PATTERN =
  /^(?:她|他|TA|Ta|ta|对方|那人|这人|这个人|那个人|[\u4e00-\u9fa5A-Za-z]{1,12})\s*的(?:声音|嗓音|声线|话音)[^。！？!?；;\n]{0,32}[，,。！？!?；;]?$/;
const TRAILING_VOICE_NOTE_TAIL_DISPLAY_PATTERN =
  /(?:^|[”」』"。！？!?；;，,\s])(?:她|他|TA|Ta|ta|对方|那人|这人|这个人|那个人|[\u4e00-\u9fa5A-Za-z]{1,12})\s*的(?:声音|嗓音|声线|话音)[^。！？!?；;\n]{0,32}[，,。！？!?；;]?\s*$/;
const DISPLAY_NOISE_SEGMENT_PATTERN = /^[*＊﹡·・•‧∙･\s]{1,4}$/;
const INLINE_QUOTE_ATTRIBUTION_ACTION_BLOCK_PATTERN =
  /(伸手|伸出|抓住|抓|攥住|攥|捏住|捏|拿起|拿着|拿|放下|放|推开|推|拉开|拉|扶|抱着|抱|拎|拖|扯|递|接过|举起|打开|关上|合上|收回|移开|转身|离开|走|跑|退|坐|站|靠|把|将|踢|踩|碰到|碰|摸|贴|蹭|压住|压)/;
const CROSS_PARAGRAPH_ATTRIBUTION_TAIL_PATTERN =
  /(?:这么|这样|如此)?(?:向[^。！？!?；;\n]{0,20})?(?:打招呼道|招呼道|低声说|低声道|回答道|解释道|提醒道|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|说道|问道|喊道|答道|笑道|骂道|吼道|叫道|回答|解释|提醒|嘟囔|念叨|低语|喃喃|开口|回应|说|问|喊|道)[。！？!?]*$/;
const COLON_SPEECH_LABEL_PATTERN =
  /(?:低声说|低声道|回答道|解释道|提醒道|压低声音|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|说道|问道|喊道|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|冷声|厉声|轻声|低声|柔声|小声|大声|沉声|低语|喃喃|开口|回应|说|问|喊|道)$/;
const COLON_SPEAKER_TITLE_PATTERN =
  /^(?:老师|学姐|学长|会长|副会长|学生会会长|学生会副会长|同学|前辈|小姐|先生|主任|部长|队长|社长)$/;
const COLON_MENTAL_LABEL_PATTERN = /(?:心里|内心|心中|脑海|默念|心想|想道|想着)/;
const CONTEXTUAL_MENTION_BEFORE_PATTERN = /(?:是|为|叫做|名叫|名为|自称|正是|便是|就是)\s*$/;
const INTRODUCED_SPEAKER_BEFORE_PATTERN = /(?:那是|这是|她是|他是|正是|便是|就是)[^。！？!?；;\n]{0,24}[，,\s]*$/;
const CONTEXTUAL_MENTION_AFTER_PATTERN =
  /^\s*(?:，|,)?\s*(?:正|正在|仍然|仍旧|依旧|始终|一直|只是|低头|抬手|抬头|抬起头|转头|转过头|转身|回头|看向|垂眸|坐|站|靠|走|走来|走过来|走进|走进来|跑|停|拿|拿着|捧|捧着|抱|抱着|夹|夹着|翻|把|向|朝|对|在|坐在|站在|靠在|位于)/;
const FOCUS_MENTION_AFTER_PATTERN =
  /^\s*(?:，|,)?\s*(?:的[^。！？!?；;\n]{0,24})?(?:(?:已经|刚刚|刚|立刻|随即|猛地|突然|悄悄|几乎|快要)[^。！？!?；;\n]{0,12})?(?:正|正在|仍然|仍旧|依旧|始终|一直|只是|不知道|不知|什么时候|低头|抬手|抬脚|抬头|抬起头|转头|转过头|转身|转过身|回头|看向|看着|望向|望着|盯着|注视|凝视|垂眸|坐|站|靠|走|走来|走过来|走进|走进来|跑|停|拿|拿着|拿起|捧|捧着|抱|抱着|夹|夹着|翻|把|向|朝|对|在|坐在|站在|靠在|位于|端|端着|喝|喝了|写|写下|合上|停|停了|落|落回|移|移开|清点|核对|打勾|打着勾|触碰|碰到|碰|摸|伸向|伸出|抓住|攥住|捏住|抽出|脱|脱掉|放下|收回|迎着|对准|踩|踢|贴|贴着|贴开|摩擦|蹭|压|压住)/;
const FOCUS_MENTION_BEFORE_BLOCK_PATTERN = /(?:眼皮子底下|关于|提到|想到|说起|谈到|针对|对于|比|让|给)\s*$/;
const QUOTE_REFERENCE_BEFORE_PATTERN =
  /(?:刚才|刚刚|方才|前面|上一句|上句|原本|那句|这句|那句话|这句话|那话|这话|原话|台词|内容|字样|词条|选项|栏目|栏里|名单|事项|问题|关键词|几个字|所谓|名为|叫做|称为|重复了[^。！？!?；;\n]{0,12}的|复述了[^。！？!?；;\n]{0,12}的)\s*$/;
const QUOTE_REFERENCE_ACTION_BEFORE_PATTERN =
  /(?:准备|打算|试图|想要|开始|重复|复述|引用|提起|提到|念|念出|读|读出|写|写下|写出|填|填上|标注|打上|划掉|删掉|把|将)[^。！？!?；;\n]{0,32}$/;
const QUOTE_REFERENCE_AFTER_PATTERN =
  /^\s*(?:说出来|说出口|念出来|念出口|读出来|读出口|写下|写出来|填上|标上|记下|重复|复述|引用|当成|作为|这句话|那句话|这话|那话|几个字|这一句|那一句)/;
const VOICE_ATTRIBUTION_AFTER_SPEAKER_PATTERN =
  /^\s*的(?:声音|嗓音|声线|话音)[^。！？!?；;\n]{0,64}(?:传来|传出|响起|响了起来|响在|冒出来|飘来|落下|钻进)/;
const SPEECH_ATTRIBUTION_AFTER_SPEAKER_PATTERN =
  /^\s*[^。！？!?；;\n]{0,36}(?:低声|轻声|柔声|冷声|厉声|小声|大声|沉声|淡淡|缓缓|慢慢|不紧不慢|懒洋洋|平静|温柔|急切|犹豫)?(?:地)?(?:开口|出声|发声|说道|问道|喊道|答道|回答|解释|提醒|回应|说|问|喊|道)(?:[，,。！？!?；;]|$)/;
const INVERTED_ATTRIBUTION_BEFORE_SPEAKER_PATTERN =
  /(?:说话的|开口的|出声的|发声的|回答的|问话的|这(?:道|个)?声音|那(?:道|个)?声音|声音|嗓音|声线|话音|那是|这是|来源|来自)\s*(?:正是|就是|是|来自)?\s*$/;
const INVERTED_ATTRIBUTION_AFTER_SPEAKER_PATTERN = /^\s*(?:[，,。！？!?；;]|$|的(?:声音|嗓音|声线|话音))/;
const VOICE_ATTRIBUTION_PREFIX_BLOCK_PATTERN = /(?:不是|不像|并非|没有|没听见|听不见)\s*$/;
const SELF_NAMED_SPEAKER_PATTERN =
  /(?:我叫|名叫|叫做)([\u4e00-\u9fa5A-Za-z]{2,10})(?=[，,。！？!?、\s“”"'「」『』]|$)|自称([\u4e00-\u9fa5A-Za-z]{2,10}?)(?=的那位|这位|那位|同学|学姐|学长|老师|先生|小姐|女士|[，,。！？!?、\s“”"'「」『』]|$)/g;
const DIALOGUE_QUOTE_PUNCTUATION_PATTERN = /[，,。！？!?；;…—❓❗]|\.\.\./;
const SOUND_EFFECT_QUOTE_WORDS = new Set([
  '啪嗒',
  '啪',
  '砰',
  '嘭',
  '咚',
  '咔',
  '咔嗒',
  '咔哒',
  '咔嚓',
  '哐',
  '哐当',
  '铛',
  '叮',
  '滴答',
  '扑通',
  '噗通',
  '哗啦',
  '沙沙',
  '窸窣',
  '咻',
  '嗖',
]);
const SHORT_NARRATION_MAX_CHARS = 56;
const DISPLAY_NARRATION_MERGE_MAX_CHARS = 96;
const DISPLAY_NARRATION_GROUP_MAX_CHARS = 220;
const DISPLAY_NARRATION_GROUP_MAX_SEGMENTS = 4;
const NARRATIVE_SPEAKER_LABEL_PATTERN =
  /旁白|叙述|系统|提示|说明|补充|备注|注释|小字|文字|标题|规则|选项|状态|环境|地点|时间|画面|镜头|场景|内心|心理|独白|心声|声音|广播|公告|通知|字幕|旁注|前情|总结|信息|面板|日志|内容|下一行|下面|上面|本段/;
const NON_PERSON_SPEAKER_LABEL_PATTERN =
  /^(?:[一二三四五六七八九十0-9]+楼|[一二三四五六七八九十0-9]+层|(?:这|那)(?:个|种|些|套|件|份|张|条|段|句|本)?[\u4e00-\u9fa5]{0,6}|.*(?:制服|校服|裙摆|锁骨|空气|气氛|阳光|地板|窗外|门口|角落|地方|过场|记录|记录表|文件|资料|纸张|走廊|楼道|楼梯|教室|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟))$/;
const UNSAFE_SPEAKER_LABEL_PATTERN =
  /^(?:没有人|没人|无人|没有谁|没有对手|没有值得|没有任何|谁|什么|怎么|这里|那里|这种|那种|这个|那个)|(?:谁敢|没有人|没人|无人|没有任何|没有值得|没有对手|多说一句|特别关注)/;
const LOCATION_LIKE_SPEAKER_LABEL_PATTERN =
  /(?:位置|座位|窗边|门边|门口|角落|中央|中间|前排|后排|左侧|右侧|旁边|附近|尽头|入口|出口|桌旁|桌边|椅子|沙发|讲台|设备柜|教室|走廊|楼道|楼梯|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟)/;
const LOCATED_KNOWN_SPEAKER_PREFIX_PATTERN =
  /(?:^|[。！？!?；;，,、—-]\s*)[^。！？!?；;\n]{0,32}(?:位置|座位|窗边|门边|门口|角落|中央|中间|前排|后排|左侧|右侧|旁边|附近|尽头|入口|出口|桌旁|桌边|椅子|沙发|讲台|设备柜)[^。！？!?；;\n]{0,12}(?:坐着|站着|靠着|待着|蹲着|躺着|趴着|坐在|站在|靠在|有|是)\s*$/;
const PRONOUN_ACTION_LABEL_PATTERN =
  /^(?:她|他|它|TA|Ta|ta|我|你).*(?:心里|内心|心中|脑海|默念|心想|想道|想着|低声|轻声|柔声|冷声|厉声|开口|回应|说|问|喊|道|念叨|嘟囔|低语|喃喃|抬头|抬起头|低头|转头|转过头|回头|看向|垂眸|没有抬头|刚才|刚刚|重复|复述|准备|打算|那句|这句|那话|这话|的)$/;
const PRONOUN_CLAUSE_FRAGMENT_LABEL_PATTERN =
  /^(?:她|他|它|TA|Ta|ta|我|你)(?:并?没(?:有)?|没有|未曾|不(?:再|会|能)?|无法|无|已经|仍然|仍旧|依旧|只是|正在|正|终于|缓缓|慢慢|从|向|朝|对|把|被|在).*$/;
const CONTEXTUAL_ACTION_LABEL_PATTERN =
  /^(?:她|他|TA|Ta|ta|这个女人|那个女人|这女人|那女人|这个男人|那个男人|这男人|那男人|这个人|那个人|对方|女人|男人|少女|少年|女生|男生|女学生|男学生).*(?:心里|内心|心中|脑海|默念|心想|想道|想着|低声|轻声|柔声|冷声|厉声|开口|回应|说|问|喊|道|念叨|嘟囔|低语|喃喃|抬手|抬头|抬起头|低头|转头|转过头|回头|看向|垂眸|没有抬头)$/;
const CONTEXTUAL_ACTION_PARAGRAPH_PATTERN =
  /(?:^|[。！？!?；;，,、—-]\s*)(?:她|他|TA|Ta|ta|这个女人|那个女人|这女人|那女人|这个男人|那个男人|这男人|那男人|这个人|那个人|对方|女人|男人|少女|少年|女生|男生|女学生|男学生)[^。！？!?；;\n]{0,56}(?:心里|内心|心中|脑海|默念|心想|想道|想着|低声|轻声|柔声|冷声|厉声|开口|回应|说|问|喊|道|念叨|嘟囔|低语|喃喃|抬手|抬头|抬起头|低头|转头|转过头|回头|看向|垂眸|没有抬头)/;
const CONTEXTUAL_ATTRIBUTION_PATTERN =
  /(?:^|[。！？!?；;，,]\s*)(?:她(?:的声音)?|他(?:的声音)?|TA|Ta|ta|这个女人|那个女人|这女人|那女人|这个男人|那个男人|这男人|那男人|这个人|那个人|对方|女人|男人|少女|少年|女生|男生|女学生|男学生)[^。！？!?；;\n]{0,48}(?:低声说|低声道|回答道|解释道|提醒道|压低声音|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|低语|喃喃|开口|回应|打招呼|招呼|说|问|喊|道|抬头|抬起头|低头|转头|转过头|回头|看向|垂眸|没有抬头)[：:，,。！？!?]*$/;
const CONTEXTUAL_REPEAT_ATTRIBUTION_PATTERN =
  /(?:^|[。！？!?；;，,]\s*)(?:她|他|TA|Ta|ta|这个女人|那个女人|这女人|那女人|这个男人|那个男人|这男人|那男人|这个人|那个人|对方|女人|男人|少女|少年|女生|男生|女学生|男学生)[^。！？!?；;\n]{0,40}(?:重复|复述|又问|再问|追问|继续问|补问|问了一遍|说了一遍|重新问|重新说)/;
const SPEAKER_LOOKUP_SEPARATOR_PATTERN = /[{}·・•‧∙･．.\s]/g;
const GENERIC_USER_ALIAS_PATTERN = /^(?:\{\{user\}\}|我|你)$/;
const ANONYMOUS_NPC_SPEAKER_LABEL = '路人';
const SPEAKER_LABEL_MAX_LENGTH = 8;
const SPEAKER_CARRY_MAX_PARAGRAPHS = 4;
const MISSING_MAP_SPEAKER_CARRY_MAX_PARAGRAPHS = 2;
const QUOTE_ATTRIBUTION_LOOKAHEAD_PARAGRAPHS = 3;
const EVIDENCE_ACCEPT_SCORE = 65;
const EVIDENCE_TIE_MARGIN = 6;
const EVIDENCE_EXPLICIT_ATTRIBUTION_SCORE = 140;
const EVIDENCE_LOOKAHEAD_ATTRIBUTION_SCORE = 130;
const EVIDENCE_LOOKAHEAD_FOCUS_SCORE = 118;
const EVIDENCE_LOCAL_SPEECH_VERB_SCORE = 100;
const EVIDENCE_CONTEXTUAL_ATTRIBUTION_SCORE = 86;
const EVIDENCE_CURRENT_FOCUS_SCORE = 80;
const EVIDENCE_RECENT_FOCUS_SCORE = 72;
const EVIDENCE_PREVIOUS_ACTOR_ADDRESS_SCORE = 122;
const EVIDENCE_PREVIOUS_DIALOGUE_SCORE = 35;
const EVIDENCE_SELF_NAMED_SCORE = 45;
const EVIDENCE_INITIAL_RESOLUTION_SCORE = 20;
const ADDRESS_SUFFIXES = ['同学', '老师', '学姐', '学妹', '学长', '前辈', '小姐', '先生', '女士', '夫人'];
const ADDRESS_ONLY_QUOTE_WORDS = new Set([
  '同学',
  '老师',
  '学姐',
  '学妹',
  '学长',
  '前辈',
  '小姐',
  '先生',
  '女士',
  '夫人',
]);
const QUOTE_PAIRS = [
  ['“', '”'],
  ['「', '」'],
  ['『', '』'],
  ['"', '"'],
] as const;
const COLON_LINE_PATTERN = /^([^：:]{1,18})[：:]\s*(.+)$/;
const ATTRIBUTION_ACTION_TAIL_PATTERN = LEADING_ATTRIBUTION_PATTERN;
const LEADING_ACTION_AFTER_SPEAKER_PATTERN =
  /^(?:自始至终|始终|一直|仍然|仍旧|依旧|还是|只是|正|正在|终于|缓缓|慢慢|并没有|没有|未曾|从|向|朝|对|把|被|在|低头|抬手|抬脚|抬头|抬起头|转头|转过头|转身|转过身|回头|看向|看着|望向|望着|盯着|注视|凝视|垂眸|走|走来|走过来|走进|走进来|跑|站|坐|靠|停|凑|退|伸|收|拿|拿着|拿起|捧|捧着|放|放下|推|拉|扶|抱|抱着|夹|夹着|拍|点|摇|眨|睁|眯|皱|抿|咬|捂|笑|轻笑|微笑|苦笑|愣|怔|叹|合上|脱|脱掉|迎着|对准|踩|踢|贴|摩擦|蹭|压|压住|开口|回应|说|问|喊|道)/;
const LEADING_ACTION_SUBJECT_PATTERN =
  /^([\u4e00-\u9fa5A-Za-z]{2,10})(?=(?:自始至终|始终|一直|仍然|仍旧|依旧|还是|只是|正|正在|终于|缓缓|慢慢|并没有|没有|未曾|从|向|朝|对|把|被|在|低头|抬手|抬脚|抬头|抬起头|转头|转过头|转身|转过身|回头|看向|看着|望向|望着|盯着|注视|凝视|垂眸|走|走来|走过来|走进|走进来|跑|站|坐|靠|停|凑|退|伸|收|拿|拿着|拿起|捧|捧着|放|放下|推|拉|扶|抱|抱着|夹|夹着|拍|点|摇|眨|睁|眯|皱|抿|咬|捂|笑|轻笑|微笑|苦笑|愣|怔|叹|合上|脱|脱掉|迎着|对准|踩|踢|贴|摩擦|蹭|压|压住|开口|回应|说|问|喊|道))/;
const EMBEDDED_ACTION_PREFIX_BOUNDARY_PATTERN = /[。！？!?；;，,]\s*$/;
const GENERIC_ACTION_SUBJECT_PATTERN =
  /^(?:这|那|这个|那个|这种|那种|这些|那些|有人|众人|大家|所有人|声音|笑声|话语|目光|空气|气氛|文件|资料|纸张|书页|门|窗|光线|脚步|教室|走廊|楼道|楼梯|制服|校服)$/;
const ANONYMOUS_PERSON_SUBJECT_PATTERN =
  /^(?:(?:(?:这|那)(?:个|名)?|一(?:个|名))[\u4e00-\u9fa5A-Za-z]{0,12})?(?:男生|女生|男人|女人|男孩|女孩|少年|少女|学生|学员|老师|教师|店员|服务员|工作人员|路人|保安|守卫|司机|主持人|观众|同学)/;

type QuoteMatch = {
  start: number;
  end: number;
  text: string;
};

type ParagraphEvidence = {
  text: string;
  attributionSpeaker: string | null;
  actorSpeaker: string | null;
  hasDialogueQuote: boolean;
};

type SpeakerEvidence = {
  speaker: string;
  score: number;
  reasons: string[];
};

function hashContent(input: string) {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }
  return `bp-${Math.abs(hash >>> 0).toString(16)}`;
}

function normalizeText(content: string) {
  const normalizedContent = content
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim();
  const withoutHiddenBlocks = stripDialogueMapBlocks(normalizedContent)
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<w2p\b[^>]*>[\s\S]*?<\/w2p>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '');
  const contentMatches = Array.from(withoutHiddenBlocks.matchAll(/<content>([\s\S]*?)<\/content>/gi));
  const maintextMatches = Array.from(withoutHiddenBlocks.matchAll(/<maintext>([\s\S]*?)<\/maintext>/gi));
  const visibleMatches = contentMatches.length > 0 ? contentMatches : maintextMatches;
  const visibleContent = visibleMatches.length > 0 ? visibleMatches[visibleMatches.length - 1][1] : withoutHiddenBlocks;

  return visibleContent
    .replace(/<\/?(?:content|maintext)>/gi, '')
    .replace(/^\s*<[^>\n]+>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function withEmotion(
  segment: Omit<DialogueSegment, 'mood' | 'moodConfidence'>,
  emotionText = segment.text,
): DialogueSegment {
  const emotion = inferDialogueEmotion(emotionText);
  return {
    ...segment,
    mood: emotion.mood,
    moodConfidence: emotion.confidence,
  };
}

function splitNarrationParagraph(paragraph: string, paragraphIndex: number, idPrefix = 'narration') {
  const sentences = paragraph
    .split(/(?<=[。！？!?；;…])/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);

  if (sentences.length === 0) {
    return [
      withEmotion({
        id: `segment-${paragraphIndex}-${idPrefix}-0`,
        kind: 'narration',
        side: 'center',
        speaker: null,
        text: paragraph,
        sourceIndex: paragraphIndex,
      }),
    ];
  }

  return sentences.map((sentence, sentenceIndex) =>
    withEmotion({
      id: `segment-${paragraphIndex}-${idPrefix}-${sentenceIndex}`,
      kind: 'narration',
      side: 'center',
      speaker: null,
      text: sentence,
      sourceIndex: paragraphIndex,
    }),
  );
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const normalizedValue = value.trim();
    if (normalizedValue.length === 0 || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    result.push(normalizedValue);
  }

  return result;
}

function normalizeSpeakerLookupText(value: string) {
  return value.replace(SPEAKER_LOOKUP_SEPARATOR_PATTERN, '').trim();
}

function isGenericUserAlias(alias: string) {
  return GENERIC_USER_ALIAS_PATTERN.test(alias.trim());
}

function getSourcePrimaryUserIdentityName(source: DialogueSource) {
  const primaryName = source.primaryUserName?.trim() ?? '';
  if (primaryName.length === 0 || isGenericUserAlias(primaryName)) {
    return null;
  }

  return resolveRegisteredCanonicalCharacterName(primaryName) ?? primaryName;
}

function getSourceUserIdentityAliases(source: DialogueSource) {
  return uniqueNonEmpty([getSourcePrimaryUserIdentityName(source)]);
}

function isSameUserIdentityName(left: string, right: string) {
  const normalizedLeft = normalizeSpeakerLookupText(left);
  const normalizedRight = normalizeSpeakerLookupText(right);
  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const registeredLeft = resolveRegisteredCanonicalCharacterName(left);
  const registeredRight = resolveRegisteredCanonicalCharacterName(right);
  return registeredLeft !== null && registeredRight !== null && registeredLeft === registeredRight;
}

function isSameSpeakerName(left: string, right: string) {
  const normalizedLeft = normalizeSpeakerLookupText(left);
  const normalizedRight = normalizeSpeakerLookupText(right);
  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    (normalizedLeft.length >= 2 &&
      normalizedRight.length >= 2 &&
      (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)))
  );
}

function resolveUserIdentitySpeaker(label: string, source: DialogueSource) {
  const primaryName = getSourcePrimaryUserIdentityName(source);
  if (label.trim() === '{{user}}') {
    return primaryName ?? '{{user}}';
  }

  if (primaryName !== null && isSameUserIdentityName(label, primaryName)) {
    return primaryName;
  }

  return null;
}

function isSourceUserSpeaker(speaker: string, source: DialogueSource) {
  return resolveUserIdentitySpeaker(speaker, source) !== null;
}

function createLookupTextMap(text: string) {
  let normalized = '';
  const indexes: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const normalizedChar = normalizeSpeakerLookupText(text[index]);
    if (normalizedChar.length === 0) {
      continue;
    }

    normalized += normalizedChar;
    indexes.push(index);
  }

  return { normalized, indexes };
}

function findSpeakerRange(text: string, speaker: string) {
  const directIndex = text.indexOf(speaker);
  if (directIndex >= 0) {
    return { index: directIndex, end: directIndex + speaker.length };
  }

  const normalizedSpeaker = normalizeSpeakerLookupText(speaker);
  if (normalizedSpeaker.length < 2) {
    return null;
  }

  const lookup = createLookupTextMap(text);
  const normalizedIndex = lookup.normalized.indexOf(normalizedSpeaker);
  if (normalizedIndex < 0) {
    return null;
  }

  const start = lookup.indexes[normalizedIndex];
  const end = lookup.indexes[normalizedIndex + normalizedSpeaker.length - 1] + 1;
  return { index: start, end };
}

function findLastSpeakerRange(text: string, speaker: string) {
  const directIndex = text.lastIndexOf(speaker);
  if (directIndex >= 0) {
    return { index: directIndex, end: directIndex + speaker.length };
  }

  const normalizedSpeaker = normalizeSpeakerLookupText(speaker);
  if (normalizedSpeaker.length < 2) {
    return null;
  }

  const lookup = createLookupTextMap(text);
  const normalizedIndex = lookup.normalized.lastIndexOf(normalizedSpeaker);
  if (normalizedIndex < 0) {
    return null;
  }

  const start = lookup.indexes[normalizedIndex];
  const end = lookup.indexes[normalizedIndex + normalizedSpeaker.length - 1] + 1;
  return { index: start, end };
}

function findSpeakerRangeAtStart(text: string, speaker: string) {
  const range = findSpeakerRange(text, speaker);
  if (range === null || text.slice(0, range.index).trim().length > 0) {
    return null;
  }

  return range;
}

function createSpeakerCandidates(source: DialogueSource) {
  const knownCharacters = source.knownCharacters.filter(isPlausibleSpeakerLabel);
  const identityAliases = getSourceUserIdentityAliases(source);
  return uniqueNonEmpty([...knownCharacters, ...identityAliases]).sort((left, right) => {
    return normalizeSpeakerLookupText(right).length - normalizeSpeakerLookupText(left).length;
  });
}

function findKnownSpeaker(label: string, source: DialogueSource) {
  const normalizedLabel = label.trim();
  const userIdentitySpeaker = resolveUserIdentitySpeaker(normalizedLabel, source);
  if (userIdentitySpeaker !== null) {
    return userIdentitySpeaker;
  }

  if (!source.userAliases.includes(normalizedLabel) && !isPlausibleSpeakerLabel(normalizedLabel)) {
    return null;
  }

  const userIdentityAliases = getSourceUserIdentityAliases(source);
  return (
    createSpeakerCandidates(source).find(speaker => {
      const speakerIsUserIdentity = userIdentityAliases.some(alias => isSameUserIdentityName(speaker, alias));
      return !speakerIsUserIdentity && isSameSpeakerName(speaker, normalizedLabel);
    }) ?? null
  );
}

function hasSpeechVerbEvidence(text: string, source: DialogueSource) {
  if (SPEECH_VERB_PATTERN.test(text)) {
    return true;
  }

  if (BARE_DAO_PRONOUN_PATTERN.test(text)) {
    return true;
  }

  return createSpeakerCandidates(source).some(speaker => {
    const range = findLastSpeakerRange(text, speaker);
    return range !== null && BARE_DAO_AFTER_SPEAKER_PATTERN.test(text.slice(range.end));
  });
}

function hasSpeechContentAfter(text: string, offset: number) {
  return /^[：:，,]\s*[^，,。！？!?；;：:\s]/.test(text.slice(offset));
}

function hasUnquotedSpeechContent(text: string, source: DialogueSource) {
  const speechVerbMatch = SPEECH_VERB_PATTERN.exec(text);
  if (
    speechVerbMatch !== null &&
    hasSpeechContentAfter(text, (speechVerbMatch.index ?? 0) + speechVerbMatch[0].length)
  ) {
    return true;
  }

  const pronounMatch = BARE_DAO_PRONOUN_PATTERN.exec(text);
  if (pronounMatch !== null && hasSpeechContentAfter(text, (pronounMatch.index ?? 0) + pronounMatch[0].length)) {
    return true;
  }

  return createSpeakerCandidates(source).some(speaker => {
    const range = findLastSpeakerRange(text, speaker);
    if (range === null) {
      return false;
    }

    const afterSpeaker = text.slice(range.end);
    const bareDaoMatch = BARE_DAO_AFTER_SPEAKER_PATTERN.exec(afterSpeaker);
    return bareDaoMatch !== null && hasSpeechContentAfter(afterSpeaker, bareDaoMatch[0].length);
  });
}

function isStableContextSpeaker(speaker: string, source: DialogueSource) {
  return findKnownSpeaker(speaker, source) !== null;
}

function findSelfNamedSpeaker(text: string, source: DialogueSource) {
  SELF_NAMED_SPEAKER_PATTERN.lastIndex = 0;

  for (const match of text.matchAll(SELF_NAMED_SPEAKER_PATTERN)) {
    const speaker = findKnownSpeaker(match[1] ?? match[2] ?? '', source);
    if (speaker !== null) {
      return speaker;
    }
  }

  return null;
}

function hasDialoguePunctuation(text: string) {
  return DIALOGUE_QUOTE_PUNCTUATION_PATTERN.test(text);
}

function normalizeQuotedSoundEffect(text: string) {
  return text
    .trim()
    .replace(/^[“「『"]+/, '')
    .replace(/[”」』"]+$/, '')
    .replace(/[，,。！？!?；;…—\-\s]/g, '')
    .trim();
}

function isSoundEffectQuote(text: string) {
  const normalizedText = normalizeQuotedSoundEffect(text);
  return normalizedText.length > 0 && SOUND_EFFECT_QUOTE_WORDS.has(normalizedText);
}

function getCompactTextLength(text: string) {
  return text.replace(/\s+/g, '').length;
}

function hasDialogueMapEntries(source: DialogueSource) {
  return (source.dialogueMap?.length ?? 0) > 0;
}

function shouldUseConservativeSpeakerInference(source: DialogueSource) {
  return source.speakerInferenceMode === 'conservative';
}

function hasDialogueLikeQuote(text: string) {
  return findQuoteMatches(text).some(
    match =>
      hasDialoguePunctuation(match.text) && !isSoundEffectQuote(match.text) && !isQuoteReferenceMatch(text, match),
  );
}

function isMergeableShortNarration(segment: DialogueSegment) {
  return (
    segment.kind === 'narration' &&
    segment.speaker === null &&
    (segment.mapKind ?? null) !== 'speech' &&
    getCompactTextLength(segment.text) <= DISPLAY_NARRATION_MERGE_MAX_CHARS &&
    !hasDialogueLikeQuote(segment.text) &&
    !isDirectSpeechMapSegment(segment)
  );
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

  if (
    PRONOUN_ACTION_LABEL_PATTERN.test(normalizedLabel) ||
    PRONOUN_CLAUSE_FRAGMENT_LABEL_PATTERN.test(normalizedLabel)
  ) {
    return false;
  }

  return !/[，,。！？!?；;、]/.test(normalizedLabel);
}

function isPlausibleActionSpeakerLabel(label: string) {
  return isPlausibleSpeakerLabel(label) && !isNonPersonSpeakerLabel(label.trim());
}

function findSpeakerInText(text: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .map(speaker => ({ speaker, range: findSpeakerRange(text, speaker) }))
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .sort((left, right) => left.range.index - right.range.index || right.speaker.length - left.speaker.length);
  return matches[0]?.speaker ?? null;
}

function scoreSpeakerCandidate(speaker: string, contextBefore: string, contextAfter: string) {
  let score = Number.NEGATIVE_INFINITY;
  const beforeRange = findLastSpeakerRange(contextBefore, speaker);

  if (beforeRange !== null) {
    const distance = contextBefore.length - beforeRange.end;
    const afterName = contextBefore.slice(beforeRange.end);
    score = Math.max(
      score,
      240 -
        distance * 4 +
        (SPEECH_VERB_PATTERN.test(afterName) || BARE_DAO_AFTER_SPEAKER_PATTERN.test(afterName) ? 120 : 0),
    );
  }

  const afterRange = findSpeakerRange(contextAfter, speaker);
  if (afterRange !== null) {
    const afterName = contextAfter.slice(afterRange.end, afterRange.end + 16);
    score = Math.max(
      score,
      220 -
        afterRange.index * 4 +
        (SPEECH_VERB_PATTERN.test(afterName) || BARE_DAO_AFTER_SPEAKER_PATTERN.test(afterName) ? 120 : 0),
    );
  }

  return score;
}

function inferSpeaker(contextBefore: string, contextAfter: string, source: DialogueSource) {
  const scoredCandidates = createSpeakerCandidates(source)
    .map(speaker => ({ speaker, score: scoreSpeakerCandidate(speaker, contextBefore, contextAfter) }))
    .filter(candidate => Number.isFinite(candidate.score))
    .sort((left, right) => right.score - left.score || right.speaker.length - left.speaker.length);
  const bestCandidate = scoredCandidates[0];
  if (bestCandidate !== undefined) {
    return bestCandidate.speaker;
  }

  const windowText = `${contextBefore}${contextAfter}`;
  const fallbackMatch = windowText.match(/([\u4e00-\u9fa5A-Za-z{}]{1,10})(?=.{0,6}(?:说|问|喊|答|提醒|开口))/);
  return fallbackMatch !== null ? findKnownSpeaker(fallbackMatch[1], source) : null;
}

function inferLeadingAttribution(leadingText: string, source: DialogueSource) {
  const trimmedText = leadingText.trim();
  if (trimmedText.length === 0 || !LEADING_ATTRIBUTION_PATTERN.test(trimmedText)) {
    return null;
  }

  const speakerCandidates = createSpeakerCandidates(source);
  const speakerMatches = speakerCandidates
    .map(speaker => ({ speaker, range: findSpeakerRange(trimmedText, speaker) }))
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .sort((left, right) => left.range.index - right.range.index || right.speaker.length - left.speaker.length);
  const firstMatch = speakerMatches[0];

  if (firstMatch === undefined) {
    return null;
  }

  const prefix = trimmedText.slice(0, firstMatch.range.index).trim();
  if (prefix.length > 0 && !ATTRIBUTION_BOUNDARY_PATTERN.test(prefix)) {
    return null;
  }

  return {
    prefix,
    speaker: firstMatch.speaker,
    text: trimmedText.slice(firstMatch.range.index).trim(),
  };
}

function extractLeadingActionText(attributionText: string, speaker: string) {
  const normalizedText = attributionText.replace(/[：:，,。！？!?]*$/, '').trim();
  const actionText = normalizedText.replace(SPEECH_TAG_TAIL_PATTERN, '').replace(SPEECH_VERB_TAIL_PATTERN, '').trim();

  if (actionText.length === 0 || actionText === speaker) {
    return null;
  }

  return actionText;
}

function inferTrailingAttribution(trailingText: string, source: DialogueSource) {
  const leadingWhitespaceLength = trailingText.length - trailingText.trimStart().length;
  const trimmedText = trailingText.trimStart();
  const match = trimmedText.match(/^([^“”「」『』"\n]{1,36}[。！？!?，,；;]?)/);
  const candidate = match?.[1]?.trim() ?? '';

  if (candidate.length === 0 || !ATTRIBUTION_ACTION_TAIL_PATTERN.test(candidate)) {
    return null;
  }

  const speaker = findSpeakerInText(candidate, source);
  if (speaker === null) {
    return null;
  }

  return {
    consumedLength: leadingWhitespaceLength + (match?.[1]?.length ?? 0),
    speaker,
    text: candidate,
  };
}

function isSafeInlineQuoteAttribution(text: string) {
  const trimmedText = text.trim();
  if (
    trimmedText.length === 0 ||
    trimmedText.includes('\n') ||
    /[“”「」『』"]/.test(trimmedText) ||
    getCompactTextLength(trimmedText) > INLINE_QUOTE_ATTRIBUTION_MAX_CHARS
  ) {
    return false;
  }

  return (
    INLINE_QUOTE_ATTRIBUTION_PATTERN.test(trimmedText) &&
    !INLINE_QUOTE_ATTRIBUTION_ACTION_BLOCK_PATTERN.test(trimmedText)
  );
}

function getQuoteTextParts(text: string) {
  const trimmedText = text.trim();
  for (const [openQuote, closeQuote] of QUOTE_PAIRS) {
    if (
      trimmedText.startsWith(openQuote) &&
      trimmedText.endsWith(closeQuote) &&
      trimmedText.length > openQuote.length + closeQuote.length
    ) {
      return {
        openQuote,
        closeQuote,
        innerText: trimmedText.slice(openQuote.length, trimmedText.length - closeQuote.length),
      };
    }
  }

  return null;
}

function mergeQuoteTexts(leftText: string, rightText: string) {
  const leftParts = getQuoteTextParts(leftText);
  const rightParts = getQuoteTextParts(rightText);
  if (
    leftParts === null ||
    rightParts === null ||
    leftParts.openQuote !== rightParts.openQuote ||
    leftParts.closeQuote !== rightParts.closeQuote
  ) {
    return null;
  }

  return `${leftParts.openQuote}${leftParts.innerText}${rightParts.innerText}${leftParts.closeQuote}`;
}

type QuoteSpeechMapMatch = {
  speaker: string | null;
  focus: string | null;
};

function findSpeechMapMatchForQuote(paragraphIndex: number, quoteText: string, source: DialogueSource) {
  const dialogueMap = source.dialogueMap ?? [];
  if (dialogueMap.length === 0) {
    return undefined;
  }

  const sourceParagraphNumber = getSourceParagraphNumber(paragraphIndex);
  const normalizedQuote = normalizeMapAnchorText(quoteText);
  if (normalizedQuote.length === 0) {
    return undefined;
  }

  const matches = dialogueMap
    .map((entry, entryIndex) => {
      if (entry.kind !== 'speech') {
        return null;
      }

      const normalizedAnchor = normalizeMapAnchorText(entry.anchor);
      if (normalizedAnchor.length === 0 || !normalizedQuote.includes(normalizedAnchor)) {
        return null;
      }

      const paragraphNumber = getDialogueMapParagraphNumber(entry);
      if (paragraphNumber !== null && paragraphNumber !== sourceParagraphNumber) {
        return null;
      }

      return {
        entry,
        entryIndex,
        paragraphPriority: paragraphNumber === sourceParagraphNumber ? 0 : 1,
        anchorLength: normalizedAnchor.length,
      };
    })
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .sort(
      (left, right) =>
        left.paragraphPriority - right.paragraphPriority ||
        right.anchorLength - left.anchorLength ||
        left.entry.i - right.entry.i ||
        left.entryIndex - right.entryIndex,
    );
  const bestMatch = matches[0];
  if (bestMatch === undefined) {
    return undefined;
  }

  const focus = resolveMapKnownSpeaker(bestMatch.entry.focus, source);
  const speaker = resolveMapDisplaySpeaker(bestMatch.entry.speaker, source);
  return {
    speaker: resolveAnonymousMapSpeechSpeaker(bestMatch.entry, speaker, focus),
    focus,
  } satisfies QuoteSpeechMapMatch;
}

function getQuoteMapIdentity(match: QuoteSpeechMapMatch | undefined) {
  return match?.speaker ?? match?.focus ?? null;
}

function hasQuoteMapSpeakerConflict(left: QuoteSpeechMapMatch | undefined, right: QuoteSpeechMapMatch | undefined) {
  if (left === undefined || right === undefined) {
    return false;
  }

  const leftIdentity = getQuoteMapIdentity(left);
  const rightIdentity = getQuoteMapIdentity(right);
  if (leftIdentity === null || rightIdentity === null) {
    return leftIdentity !== rightIdentity;
  }

  return !isSameSpeakerName(leftIdentity, rightIdentity);
}

function hasQuoteSpeakerConflict(leftSpeaker: string | null, rightSpeaker: string | null) {
  return leftSpeaker !== null && rightSpeaker !== null && !isSameSpeakerName(leftSpeaker, rightSpeaker);
}

function hasMergeableInlineQuotePair(paragraph: string, quoteMatches: QuoteMatch[]) {
  return quoteMatches.some((match, index) => {
    const nextMatch = quoteMatches[index + 1];
    return (
      nextMatch !== undefined &&
      isSafeInlineQuoteAttribution(paragraph.slice(match.end, nextMatch.start)) &&
      mergeQuoteTexts(match.text, nextMatch.text) !== null
    );
  });
}

function tryMergeInlineAttributedQuote(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  quoteMatches: QuoteMatch[],
  quoteIndex: number,
  nextParagraphs: string[],
  previousSpeaker: string | null,
  conservativeSpeakerInference: boolean,
) {
  const match = quoteMatches[quoteIndex];
  const nextMatch = quoteMatches[quoteIndex + 1];
  if (match === undefined || nextMatch === undefined) {
    return null;
  }

  if (!isSafeInlineQuoteAttribution(paragraph.slice(match.end, nextMatch.start))) {
    return null;
  }

  const mergedText = mergeQuoteTexts(match.text, nextMatch.text);
  if (mergedText === null) {
    return null;
  }

  const currentMapMatch = findSpeechMapMatchForQuote(paragraphIndex, match.text, source);
  const nextMapMatch = findSpeechMapMatchForQuote(paragraphIndex, nextMatch.text, source);
  if (hasQuoteMapSpeakerConflict(currentMapMatch, nextMapMatch)) {
    return null;
  }

  const mapShowsSameSpeaker =
    currentMapMatch !== undefined &&
    nextMapMatch !== undefined &&
    getQuoteMapIdentity(currentMapMatch) !== null &&
    getQuoteMapIdentity(nextMapMatch) !== null;
  const currentSpeaker = inferQuoteSpeaker(
    paragraph,
    match,
    source,
    nextParagraphs,
    previousSpeaker,
    conservativeSpeakerInference,
  );
  const nextSpeaker = inferQuoteSpeaker(
    paragraph,
    nextMatch,
    source,
    nextParagraphs,
    currentSpeaker ?? previousSpeaker,
    conservativeSpeakerInference,
  );

  if (!mapShowsSameSpeaker && hasQuoteSpeakerConflict(currentSpeaker, nextSpeaker)) {
    return null;
  }

  return {
    text: mergedText,
    end: nextMatch.end,
  };
}

function findQuotePairAt(text: string, index: number) {
  return QUOTE_PAIRS.find(([openQuote]) => text.startsWith(openQuote, index)) ?? null;
}

function findClosingQuote(text: string, openQuote: string, closeQuote: string, startIndex: number) {
  for (let index = startIndex; index < text.length; index += 1) {
    if (!text.startsWith(closeQuote, index)) {
      continue;
    }
    if (openQuote === closeQuote && text[index - 1] === '\\') {
      continue;
    }
    return index;
  }

  return -1;
}

function findQuoteMatches(paragraph: string) {
  const matches: QuoteMatch[] = [];
  let cursor = 0;

  while (cursor < paragraph.length) {
    const quotePair = findQuotePairAt(paragraph, cursor);
    if (quotePair === null) {
      cursor += 1;
      continue;
    }

    const [openQuote, closeQuote] = quotePair;
    const contentStart = cursor + openQuote.length;
    const closeIndex = findClosingQuote(paragraph, openQuote, closeQuote, contentStart);
    if (closeIndex < 0) {
      break;
    }

    const end = closeIndex + closeQuote.length;
    matches.push({
      start: cursor,
      end,
      text: paragraph.slice(cursor, end).trim(),
    });
    cursor = end;
  }

  return matches;
}

function isStandaloneQuoteMatch(paragraph: string, match: QuoteMatch) {
  return paragraph.slice(0, match.start).trim().length === 0 && paragraph.slice(match.end).trim().length === 0;
}

function isQuoteReferenceMatch(paragraph: string, match: QuoteMatch) {
  if (isStandaloneQuoteMatch(paragraph, match)) {
    return false;
  }

  const before = paragraph.slice(0, match.start).trimEnd();
  const after = paragraph.slice(match.end).trimStart();
  const beforeWindow = before.slice(Math.max(0, before.length - 48));
  const afterWindow = after.slice(0, 32);

  if (QUOTE_REFERENCE_BEFORE_PATTERN.test(beforeWindow)) {
    return true;
  }

  return QUOTE_REFERENCE_ACTION_BEFORE_PATTERN.test(beforeWindow) && QUOTE_REFERENCE_AFTER_PATTERN.test(afterWindow);
}

function sliceTrailingAttributionWindow(text: string, maxLength: number) {
  const quoteStarts = QUOTE_PAIRS.map(([openQuote]) => text.indexOf(openQuote)).filter(index => index >= 0);
  const nextQuoteStart = quoteStarts.length > 0 ? Math.min(...quoteStarts) : text.length;
  return text.slice(0, Math.min(nextQuoteStart, maxLength));
}

function inferVoiceAttributionParagraphSpeaker(paragraph: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .filter(isPlausibleSpeakerLabel)
    .map(speaker => ({ speaker, range: findSpeakerRange(paragraph, speaker) }))
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .map(match => ({
      ...match,
      before: paragraph.slice(Math.max(0, match.range.index - 16), match.range.index),
      after: paragraph.slice(match.range.end, match.range.end + 80),
    }))
    .filter(match => !VOICE_ATTRIBUTION_PREFIX_BLOCK_PATTERN.test(match.before))
    .filter(
      match =>
        VOICE_ATTRIBUTION_AFTER_SPEAKER_PATTERN.test(match.after) ||
        SPEECH_ATTRIBUTION_AFTER_SPEAKER_PATTERN.test(match.after) ||
        (INVERTED_ATTRIBUTION_BEFORE_SPEAKER_PATTERN.test(match.before) &&
          INVERTED_ATTRIBUTION_AFTER_SPEAKER_PATTERN.test(match.after)),
    )
    .sort(
      (left, right) =>
        left.range.index - right.range.index ||
        normalizeSpeakerLookupText(right.speaker).length - normalizeSpeakerLookupText(left.speaker).length,
    );

  return matches[0]?.speaker ?? null;
}

function inferAttributionParagraphSpeaker(paragraph: string | undefined, source: DialogueSource) {
  const trimmedText = paragraph?.trim() ?? '';
  if (trimmedText.length === 0 || findQuoteMatches(trimmedText).length > 0) {
    return null;
  }

  const voiceSpeaker = inferVoiceAttributionParagraphSpeaker(trimmedText, source);
  if (voiceSpeaker !== null) {
    return voiceSpeaker;
  }

  if (trimmedText.length > 96) {
    return null;
  }

  if (!CROSS_PARAGRAPH_ATTRIBUTION_TAIL_PATTERN.test(trimmedText)) {
    return null;
  }

  return findSpeakerInText(trimmedText, source);
}

function inferLookaheadAttributionSpeaker(nextParagraphs: string[], source: DialogueSource) {
  for (let index = 0; index < nextParagraphs.length; index += 1) {
    const paragraph = nextParagraphs[index]?.trim() ?? '';
    if (paragraph.length === 0) {
      continue;
    }

    if (hasDialogueLikeQuote(paragraph)) {
      return null;
    }

    const speaker = inferAttributionParagraphSpeaker(paragraph, source);
    if (speaker !== null) {
      return speaker;
    }

    const paragraphActor = inferParagraphActorSpeaker(paragraph, source, null);
    const canSkipBriefNarration =
      index === 0 && paragraphActor === null && getCompactTextLength(paragraph) <= SHORT_NARRATION_MAX_CHARS;
    if (!canSkipBriefNarration) {
      return null;
    }
  }

  return null;
}

function inferLookaheadFocusSpeaker(nextParagraphs: string[], source: DialogueSource) {
  for (let index = 0; index < nextParagraphs.length; index += 1) {
    const paragraph = nextParagraphs[index]?.trim() ?? '';
    if (paragraph.length === 0) {
      continue;
    }

    if (hasDialogueLikeQuote(paragraph)) {
      return null;
    }

    const attributionSpeaker = inferAttributionParagraphSpeaker(paragraph, source);
    if (attributionSpeaker !== null) {
      return attributionSpeaker;
    }

    const actorSpeaker = inferParagraphActorSpeaker(paragraph, source, null);
    if (actorSpeaker !== null) {
      return actorSpeaker;
    }

    const canSkipBriefNarration = index === 0 && getCompactTextLength(paragraph) <= SHORT_NARRATION_MAX_CHARS;
    if (!canSkipBriefNarration) {
      return null;
    }
  }

  return null;
}

function isLikelyAddressedSpeakerInQuote(quoteText: string, speaker: string) {
  const normalizedQuote = normalizeSpeakerLookupText(quoteText);
  const normalizedSpeaker = normalizeSpeakerLookupText(speaker);
  if (normalizedQuote.length === 0 || normalizedSpeaker.length < 2) {
    return false;
  }

  const lookupKeys = uniqueNonEmpty([
    normalizedSpeaker,
    normalizedSpeaker.length >= 3 ? normalizedSpeaker.slice(0, 3) : null,
    normalizedSpeaker.length >= 2 ? normalizedSpeaker.slice(0, 2) : null,
  ]);

  return lookupKeys.some(key => {
    const index = normalizedQuote.indexOf(key);
    if (index < 0 || index > 4) {
      return false;
    }

    const rest = normalizedQuote.slice(index + key.length);
    return ADDRESS_SUFFIXES.some(suffix => rest.startsWith(normalizeSpeakerLookupText(suffix)));
  });
}

function hasGenericAddressOpening(quoteText: string) {
  const quoteParts = getQuoteTextParts(quoteText);
  const normalizedQuote = normalizeSpeakerLookupText(quoteParts?.innerText ?? quoteText).replace(
    /^[，,。！？!?；;：:…—-]+/,
    '',
  );
  return ADDRESS_SUFFIXES.some(suffix => normalizedQuote.startsWith(normalizeSpeakerLookupText(suffix)));
}

function normalizeAddressOnlyQuoteText(quoteText: string) {
  return normalizeMapAnchorText(quoteText).replace(/[，,。！？!?；;…—-]/g, '');
}

function isAddressOnlyQuote(quoteText: string) {
  return ADDRESS_ONLY_QUOTE_WORDS.has(normalizeAddressOnlyQuoteText(quoteText));
}

function inferContextualAttributionSpeaker(text: string, previousSpeaker: string | null) {
  const trimmedText = text.trim();
  if (previousSpeaker === null || trimmedText.length === 0) {
    return null;
  }

  return CONTEXTUAL_ATTRIBUTION_PATTERN.test(trimmedText) || CONTEXTUAL_REPEAT_ATTRIBUTION_PATTERN.test(trimmedText)
    ? previousSpeaker
    : null;
}

function inferContextualActionSpeaker(paragraph: string, previousSpeaker: string | null) {
  const trimmedParagraph = paragraph.trim();
  if (previousSpeaker === null || trimmedParagraph.length === 0) {
    return null;
  }

  return CONTEXTUAL_ACTION_PARAGRAPH_PATTERN.test(trimmedParagraph) ? previousSpeaker : null;
}

function inferLocatedKnownSpeaker(paragraph: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .filter(speaker => speaker.length >= 2)
    .map(speaker => {
      const range = findSpeakerRange(paragraph, speaker);
      return { speaker, range };
    })
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .map(match => ({
      ...match,
      prefix: paragraph.slice(0, match.range.index).trim(),
      rest: paragraph.slice(match.range.end).trimStart(),
    }))
    .filter(match => LOCATED_KNOWN_SPEAKER_PREFIX_PATTERN.test(match.prefix))
    .filter(match => match.rest.length === 0 || /^[，,。！？!?；;\s]/.test(match.rest))
    .sort(
      (left, right) =>
        left.range.index - right.range.index ||
        normalizeSpeakerLookupText(right.speaker).length - normalizeSpeakerLookupText(left.speaker).length,
    );

  return matches[0]?.speaker ?? null;
}

function normalizeColonLabel(label: string) {
  return label.replace(/[：:，,。！？!?；;]*$/g, '').trim();
}

function isMentalColonParagraph(paragraph: string) {
  const match = paragraph.match(COLON_LINE_PATTERN);
  return match !== null && COLON_MENTAL_LABEL_PATTERN.test(normalizeColonLabel(match[1]));
}

function shouldSplitColonAsDialogue(label: string, speaker: string, source: DialogueSource) {
  const normalizedLabel = normalizeColonLabel(label);
  if (normalizedLabel.length === 0 || COLON_MENTAL_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  if (isDirectColonSpeakerLabel(normalizedLabel, speaker, source)) {
    return true;
  }

  const namedSpeaker = findSpeakerInText(normalizedLabel, source);
  if (namedSpeaker !== null && COLON_SPEECH_LABEL_PATTERN.test(normalizedLabel)) {
    return true;
  }

  return CONTEXTUAL_ACTION_LABEL_PATTERN.test(normalizedLabel) && COLON_SPEECH_LABEL_PATTERN.test(normalizedLabel);
}

function isDirectColonSpeakerLabel(label: string, speaker: string, source: DialogueSource) {
  const normalizedLabel = normalizeSpeakerLookupText(label);
  if (normalizedLabel.length === 0) {
    return false;
  }

  const exactAliases = uniqueNonEmpty([speaker, ...createSpeakerCandidates(source), ...source.userAliases]);
  if (exactAliases.some(alias => normalizeSpeakerLookupText(alias) === normalizedLabel)) {
    return true;
  }

  const normalizedSpeaker = normalizeSpeakerLookupText(speaker);
  if (normalizedSpeaker.length === 0) {
    return false;
  }

  if (normalizedLabel.startsWith(normalizedSpeaker)) {
    return COLON_SPEAKER_TITLE_PATTERN.test(normalizedLabel.slice(normalizedSpeaker.length));
  }

  if (normalizedLabel.endsWith(normalizedSpeaker)) {
    return COLON_SPEAKER_TITLE_PATTERN.test(normalizedLabel.slice(0, -normalizedSpeaker.length));
  }

  return false;
}

function resolveSegmentKind(speaker: string | null, source: DialogueSource) {
  if (speaker === null) {
    return { kind: 'narration' as const, side: 'center' as const };
  }

  const isUser = isSourceUserSpeaker(speaker, source);
  if (isUser) {
    return { kind: 'user' as const, side: 'left' as const };
  }

  if (speaker === ANONYMOUS_NPC_SPEAKER_LABEL) {
    return { kind: 'npc' as const, side: 'right' as const };
  }

  const isKnownCharacter = source.knownCharacters.some(
    character => isPlausibleSpeakerLabel(character) && character === speaker,
  );
  if (isKnownCharacter) {
    return { kind: 'npc' as const, side: 'right' as const };
  }

  return { kind: 'narration' as const, side: 'center' as const };
}

function normalizeSpeakerForResolvedRole(
  speaker: string | null,
  role: ReturnType<typeof resolveSegmentKind>,
  source: DialogueSource,
) {
  if (role.kind === 'narration' || speaker === null) {
    return null;
  }

  return role.kind === 'user' ? (resolveUserIdentitySpeaker(speaker, source) ?? speaker) : speaker;
}

function inferEmbeddedActionSpeaker(paragraph: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .filter(speaker => speaker.length >= 2)
    .map(speaker => {
      const range = findSpeakerRange(paragraph, speaker);
      return { speaker, range };
    })
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .map(match => ({
      ...match,
      prefix: paragraph.slice(0, match.range.index).trim(),
      rest: paragraph.slice(match.range.end).trimStart(),
    }))
    .filter(match => LEADING_ACTION_AFTER_SPEAKER_PATTERN.test(match.rest))
    .filter(match => match.prefix.length === 0 || EMBEDDED_ACTION_PREFIX_BOUNDARY_PATTERN.test(match.prefix))
    .sort((left, right) => left.range.index - right.range.index || right.speaker.length - left.speaker.length);

  return matches[0]?.speaker ?? null;
}

function isCompositeActionSpeakerCandidate(speaker: string, source: DialogueSource) {
  const normalizedSpeaker = normalizeSpeakerLookupText(speaker);
  if (normalizedSpeaker.length < 3) {
    return false;
  }

  return createSpeakerCandidates(source).some(candidate => {
    const normalizedCandidate = normalizeSpeakerLookupText(candidate);
    if (normalizedCandidate.length < 2 || normalizedCandidate.length >= normalizedSpeaker.length) {
      return false;
    }

    if (!normalizedSpeaker.startsWith(normalizedCandidate)) {
      return false;
    }

    return LEADING_ACTION_AFTER_SPEAKER_PATTERN.test(normalizedSpeaker.slice(normalizedCandidate.length));
  });
}

function inferLeadingActionSpeaker(paragraph: string, source: DialogueSource) {
  const trimmedParagraph = paragraph.trim();
  const candidateMatch = createSpeakerCandidates(source)
    .map(speaker => {
      const range = findSpeakerRangeAtStart(trimmedParagraph, speaker);
      return range === null ? null : { speaker, rest: trimmedParagraph.slice(range.end).trimStart() };
    })
    .filter((match): match is { speaker: string; rest: string } => match !== null)
    .filter(match => !isCompositeActionSpeakerCandidate(match.speaker, source))
    .filter(match => LEADING_ACTION_AFTER_SPEAKER_PATTERN.test(match.rest))
    .sort((left, right) => right.speaker.length - left.speaker.length)[0];

  if (candidateMatch !== undefined) {
    return candidateMatch.speaker;
  }

  const locatedKnownSpeaker = inferLocatedKnownSpeaker(trimmedParagraph, source);
  if (locatedKnownSpeaker !== null) {
    return locatedKnownSpeaker;
  }

  const embeddedSpeaker = inferEmbeddedActionSpeaker(trimmedParagraph, source);
  if (embeddedSpeaker !== null) {
    return embeddedSpeaker;
  }

  const rawMatch = trimmedParagraph.match(LEADING_ACTION_SUBJECT_PATTERN);
  if (rawMatch === null || !isPlausibleActionSpeakerLabel(rawMatch[1])) {
    return null;
  }

  const knownSpeaker = findKnownSpeaker(rawMatch[1], source);
  if (knownSpeaker !== null) {
    return knownSpeaker;
  }

  return null;
}

function splitNamedActionParagraph(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  previousSpeaker: string | null,
) {
  if (isMentalColonParagraph(paragraph)) {
    return null;
  }

  const leadingSpeaker = inferLeadingActionSpeaker(paragraph, source);
  const contextualActionSpeaker = inferContextualActionSpeaker(paragraph, previousSpeaker);
  const mentionedFocusSpeaker = findFocusMentionedSpeaker(paragraph, source);
  const introducedSpeaker = findContextualMentionedSpeaker(paragraph, source);
  const speechSpeaker = leadingSpeaker ?? contextualActionSpeaker ?? mentionedFocusSpeaker ?? introducedSpeaker;
  const narrationFocusSpeaker = leadingSpeaker ?? mentionedFocusSpeaker ?? introducedSpeaker ?? contextualActionSpeaker;
  if (speechSpeaker === null && narrationFocusSpeaker === null) {
    return null;
  }

  if (hasDirectDialogueQuote(paragraph) && (!hasSpeechVerbEvidence(paragraph, source) || speechSpeaker === null)) {
    return null;
  }

  if (
    !hasSpeechVerbEvidence(paragraph, source) ||
    !hasUnquotedSpeechContent(paragraph, source) ||
    speechSpeaker === null
  ) {
    return [
      withEmotion({
        id: `segment-${paragraphIndex}-action-narration-0`,
        kind: 'narration',
        side: 'center',
        speaker: null,
        focusSpeaker: narrationFocusSpeaker,
        text: paragraph,
        sourceIndex: paragraphIndex,
      }),
    ];
  }

  const role = resolveSegmentKind(speechSpeaker, source);

  return [
    withEmotion({
      id: `segment-${paragraphIndex}-action-0`,
      kind: role.kind,
      side: role.side,
      speaker: normalizeSpeakerForResolvedRole(speechSpeaker, role, source),
      text: paragraph,
      sourceIndex: paragraphIndex,
    }),
  ];
}

function resolveColonSpeaker(label: string, source: DialogueSource, previousSpeaker: string | null) {
  const normalizedLabel = label.trim();
  const directSpeaker = findKnownSpeaker(normalizedLabel, source) ?? findSpeakerInText(normalizedLabel, source);
  if (directSpeaker !== null) {
    return directSpeaker;
  }

  if (previousSpeaker !== null && CONTEXTUAL_ACTION_LABEL_PATTERN.test(normalizedLabel)) {
    return previousSpeaker;
  }

  return null;
}

function splitColonParagraph(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  previousSpeaker: string | null,
) {
  const match = paragraph.match(COLON_LINE_PATTERN);
  if (match === null) {
    return null;
  }

  const speaker = resolveColonSpeaker(match[1], source, previousSpeaker);
  if (speaker === null) {
    return null;
  }

  if (!shouldSplitColonAsDialogue(match[1], speaker, source)) {
    return null;
  }

  const role = resolveSegmentKind(speaker, source);
  return [
    withEmotion(
      {
        id: `segment-${paragraphIndex}-colon-0`,
        kind: role.kind,
        side: role.side,
        speaker: normalizeSpeakerForResolvedRole(speaker, role, source),
        text: match[2].trim(),
        sourceIndex: paragraphIndex,
      },
      paragraph,
    ),
  ];
}

function inferQuoteSpeaker(
  paragraph: string,
  match: QuoteMatch,
  source: DialogueSource,
  nextParagraphs: string[] = [],
  previousSpeaker: string | null = null,
  conservativeSpeakerInference = false,
) {
  if (isQuoteReferenceMatch(paragraph, match)) {
    return null;
  }

  const leading = paragraph.slice(0, match.start).trim();
  const quoteText = match.text;
  const trailingText = paragraph.slice(match.end);
  const trailingAttribution = inferTrailingAttribution(trailingText, source);
  const trailingWindow = sliceTrailingAttributionWindow(
    trailingText,
    Math.max(64, trailingAttribution?.consumedLength ?? 0),
  );
  const leadingWindow = paragraph.slice(Math.max(0, match.start - 64), match.start);
  const leadingAttribution = inferLeadingAttribution(leading, source);
  const colonAttributionSpeaker = findColonAttributionSpeakerBeforeQuote(paragraph, match, source);
  const contextualAttributionSpeaker = conservativeSpeakerInference
    ? null
    : (inferContextualAttributionSpeaker(leading, previousSpeaker) ??
      inferContextualAttributionSpeaker(trailingWindow, previousSpeaker));
  const speakerCandidate = inferSpeaker(leadingWindow, trailingWindow, source);
  const withVerb = hasSpeechVerbEvidence(`${leadingWindow}${trailingWindow}`, source);
  const selfNamedSpeaker = findSelfNamedSpeaker(quoteText, source);
  const nextParagraphSpeaker = isStandaloneQuoteMatch(paragraph, match)
    ? inferLookaheadAttributionSpeaker(nextParagraphs, source)
    : null;
  const nextParagraphFocusSpeaker = isStandaloneQuoteMatch(paragraph, match)
    ? conservativeSpeakerInference
      ? null
      : inferLookaheadFocusSpeaker(nextParagraphs, source)
    : null;
  const safeNextParagraphFocusSpeaker =
    nextParagraphFocusSpeaker !== null && !isLikelyAddressedSpeakerInQuote(quoteText, nextParagraphFocusSpeaker)
      ? nextParagraphFocusSpeaker
      : null;

  return (
    colonAttributionSpeaker ??
    leadingAttribution?.speaker ??
    trailingAttribution?.speaker ??
    nextParagraphSpeaker ??
    safeNextParagraphFocusSpeaker ??
    contextualAttributionSpeaker ??
    (withVerb ? speakerCandidate : null) ??
    (conservativeSpeakerInference ? null : selfNamedSpeaker) ??
    (conservativeSpeakerInference ? null : isStandaloneQuoteMatch(paragraph, match) ? previousSpeaker : null)
  );
}

function splitQuotedParagraph(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  nextParagraphs: string[] = [],
  previousSpeaker: string | null = null,
  conservativeSpeakerInference = false,
  forceSplitQuotes = false,
) {
  const segments: DialogueSegment[] = [];
  const quoteMatches = findQuoteMatches(paragraph).filter(
    match =>
      hasDialoguePunctuation(match.text) &&
      !isSoundEffectQuote(match.text) &&
      (!isQuoteReferenceMatch(paragraph, match) || hasAnonymousPersonLeadingAttribution(paragraph, match)),
  );
  if (
    !forceSplitQuotes &&
    !quoteMatches.some(match => hasAnonymousPersonLeadingAttribution(paragraph, match)) &&
    !quoteMatches.some(
      match =>
        inferQuoteSpeaker(paragraph, match, source, nextParagraphs, previousSpeaker, conservativeSpeakerInference) !==
        null,
    ) &&
    !hasMergeableInlineQuotePair(paragraph, quoteMatches)
  ) {
    return [
      withEmotion({
        id: `segment-${paragraphIndex}-quote-narration-0`,
        kind: 'narration',
        side: 'center',
        speaker: null,
        text: paragraph,
        sourceIndex: paragraphIndex,
      }),
    ];
  }

  let lastCursor = 0;
  let quoteIndex = 0;

  while (quoteIndex < quoteMatches.length) {
    const match = quoteMatches[quoteIndex];
    const leading = paragraph.slice(lastCursor, match.start).trim();
    const inlineQuoteMerge = tryMergeInlineAttributedQuote(
      paragraph,
      paragraphIndex,
      source,
      quoteMatches,
      quoteIndex,
      nextParagraphs,
      previousSpeaker,
      conservativeSpeakerInference,
    );
    const quoteText = inlineQuoteMerge?.text ?? match.text;
    const trailingText = paragraph.slice(match.end);
    const trailingAttribution = inferTrailingAttribution(trailingText, source);
    const trailingWindow = sliceTrailingAttributionWindow(
      trailingText,
      Math.max(64, trailingAttribution?.consumedLength ?? 0),
    );
    const leadingWindow = paragraph.slice(Math.max(0, match.start - 64), match.start);
    const leadingAttribution = inferLeadingAttribution(leading, source);
    const colonAttributionSpeaker = findColonAttributionSpeakerBeforeQuote(paragraph, match, source);
    const contextualAttributionSpeaker = conservativeSpeakerInference
      ? null
      : (inferContextualAttributionSpeaker(leading, previousSpeaker) ??
        inferContextualAttributionSpeaker(trailingWindow, previousSpeaker));
    if (leadingAttribution !== null) {
      if (leadingAttribution.prefix.length > 0) {
        segments.push(...splitNarrationParagraph(leadingAttribution.prefix, paragraphIndex, `prequote-${quoteIndex}`));
      }

      const actionText = extractLeadingActionText(leadingAttribution.text, leadingAttribution.speaker);
      if (actionText !== null) {
        segments.push(...splitNarrationParagraph(actionText, paragraphIndex, `prequote-action-${quoteIndex}`));
      }
    } else if (leading.length > 0) {
      segments.push(...splitNarrationParagraph(leading, paragraphIndex, `prequote-${quoteIndex}`));
    }

    const speakerCandidate = inferSpeaker(leadingWindow, trailingWindow, source);
    const withVerb = hasSpeechVerbEvidence(`${leadingWindow}${trailingWindow}`, source);
    const selfNamedSpeaker = findSelfNamedSpeaker(quoteText, source);
    const nextParagraphSpeaker = isStandaloneQuoteMatch(paragraph, match)
      ? inferLookaheadAttributionSpeaker(nextParagraphs, source)
      : null;
    const nextParagraphFocusSpeaker = isStandaloneQuoteMatch(paragraph, match)
      ? conservativeSpeakerInference
        ? null
        : inferLookaheadFocusSpeaker(nextParagraphs, source)
      : null;
    const safeNextParagraphFocusSpeaker =
      nextParagraphFocusSpeaker !== null && !isLikelyAddressedSpeakerInQuote(quoteText, nextParagraphFocusSpeaker)
        ? nextParagraphFocusSpeaker
        : null;
    const speaker = hasAnonymousPersonLeadingAttribution(paragraph, match)
      ? ANONYMOUS_NPC_SPEAKER_LABEL
      : (colonAttributionSpeaker ??
        leadingAttribution?.speaker ??
        trailingAttribution?.speaker ??
        nextParagraphSpeaker ??
        safeNextParagraphFocusSpeaker ??
        contextualAttributionSpeaker ??
        (withVerb ? speakerCandidate : null) ??
        (conservativeSpeakerInference ? null : selfNamedSpeaker) ??
        (conservativeSpeakerInference ? null : isStandaloneQuoteMatch(paragraph, match) ? previousSpeaker : null));
    const role = resolveSegmentKind(speaker, source);

    segments.push(
      withEmotion(
        {
          id: `segment-${paragraphIndex}-quote-${quoteIndex}`,
          kind: role.kind,
          side: role.side,
          speaker: normalizeSpeakerForResolvedRole(speaker, role, source),
          text: quoteText,
          sourceIndex: paragraphIndex,
        },
        `${leadingWindow} ${quoteText} ${trailingWindow}`,
      ),
    );

    lastCursor = inlineQuoteMerge?.end ?? match.end + (trailingAttribution?.consumedLength ?? 0);
    quoteIndex += inlineQuoteMerge === null ? 1 : 2;
  }

  const tail = paragraph.slice(lastCursor).trim();
  if (tail.length > 0) {
    segments.push(...splitNarrationParagraph(tail, paragraphIndex, 'tail'));
  }

  return segments;
}

function splitParagraph(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  nextParagraphs: string[] = [],
  previousSpeaker: string | null = null,
  conservativeSpeakerInference = false,
) {
  const colonSegments = splitColonParagraph(paragraph, paragraphIndex, source, previousSpeaker);
  if (colonSegments !== null) {
    return colonSegments;
  }

  if (findQuoteMatches(paragraph).length > 0) {
    return splitQuotedParagraph(
      paragraph,
      paragraphIndex,
      source,
      nextParagraphs,
      previousSpeaker,
      conservativeSpeakerInference,
      hasDialogueMapEntries(source),
    );
  }

  const namedActionSegments = splitNamedActionParagraph(paragraph, paragraphIndex, source, previousSpeaker);
  if (namedActionSegments !== null) {
    return namedActionSegments;
  }

  return splitNarrationParagraph(paragraph, paragraphIndex);
}

function findLastStableExplicitSpeaker(segments: DialogueSegment[], source: DialogueSource) {
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const speaker = segments[index]?.speaker;
    if (speaker !== null && speaker !== undefined && isStableContextSpeaker(speaker, source)) {
      return speaker;
    }
  }

  return null;
}

function findContextualMentionedSpeaker(paragraph: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .filter(isPlausibleSpeakerLabel)
    .map(speaker => ({ speaker, range: findSpeakerRange(paragraph, speaker) }))
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .map(match => ({
      ...match,
      before: paragraph.slice(Math.max(0, match.range.index - 18), match.range.index),
      after: paragraph.slice(match.range.end, match.range.end + 32),
    }))
    .filter(
      match =>
        CONTEXTUAL_MENTION_BEFORE_PATTERN.test(match.before) ||
        INTRODUCED_SPEAKER_BEFORE_PATTERN.test(match.before) ||
        CONTEXTUAL_MENTION_AFTER_PATTERN.test(match.after),
    )
    .sort(
      (left, right) =>
        left.range.index - right.range.index ||
        normalizeSpeakerLookupText(right.speaker).length - normalizeSpeakerLookupText(left.speaker).length,
    );

  return matches[0]?.speaker ?? null;
}

function findFocusMentionedSpeaker(paragraph: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .filter(isPlausibleSpeakerLabel)
    .map(speaker => ({ speaker, range: findSpeakerRange(paragraph, speaker) }))
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .map(match => ({
      ...match,
      before: paragraph.slice(Math.max(0, match.range.index - 18), match.range.index),
      after: paragraph.slice(match.range.end, match.range.end + 40),
    }))
    .filter(match => !FOCUS_MENTION_BEFORE_BLOCK_PATTERN.test(match.before))
    .filter(match => FOCUS_MENTION_AFTER_PATTERN.test(match.after))
    .sort(
      (left, right) =>
        left.range.index - right.range.index ||
        normalizeSpeakerLookupText(right.speaker).length - normalizeSpeakerLookupText(left.speaker).length,
    );

  return matches[0]?.speaker ?? null;
}

function inferParagraphActorSpeaker(paragraph: string, source: DialogueSource, previousSpeaker: string | null) {
  return (
    inferAttributionParagraphSpeaker(paragraph, source) ??
    inferLeadingActionSpeaker(paragraph, source) ??
    findFocusMentionedSpeaker(paragraph, source) ??
    findContextualMentionedSpeaker(paragraph, source) ??
    inferContextualActionSpeaker(paragraph, previousSpeaker)
  );
}

function collectParagraphEvidence(paragraphs: string[], source: DialogueSource) {
  const evidence: ParagraphEvidence[] = [];
  let recentContextSpeaker: string | null = null;
  let recentContextSpeakerDistance = Number.POSITIVE_INFINITY;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const carriedSpeaker =
      !hasDialogueMapForSourceParagraph(source, paragraphIndex) &&
      recentContextSpeakerDistance <= SPEAKER_CARRY_MAX_PARAGRAPHS
        ? recentContextSpeaker
        : null;
    const attributionSpeaker = inferAttributionParagraphSpeaker(paragraph, source);
    const actorSpeaker = inferParagraphActorSpeaker(paragraph, source, carriedSpeaker);
    const contextSpeaker =
      attributionSpeaker ??
      (actorSpeaker !== null && isStableContextSpeaker(actorSpeaker, source) ? actorSpeaker : null);

    evidence.push({
      text: paragraph,
      attributionSpeaker,
      actorSpeaker,
      hasDialogueQuote: hasDialogueLikeQuote(paragraph),
    });

    if (contextSpeaker !== null) {
      recentContextSpeaker = contextSpeaker;
      recentContextSpeakerDistance = 0;
      return;
    }

    recentContextSpeakerDistance += 1;
  });

  return evidence;
}

function addSpeakerEvidence(
  candidates: Map<string, SpeakerEvidence>,
  rawSpeaker: string | null,
  score: number,
  reason: string,
  source: DialogueSource,
) {
  if (rawSpeaker === null) {
    return;
  }

  const speaker = findKnownSpeaker(rawSpeaker, source);
  if (speaker === null || !isPlausibleSpeakerLabel(speaker)) {
    return;
  }

  const existing = candidates.get(speaker);
  if (existing === undefined) {
    candidates.set(speaker, { speaker, score, reasons: [reason] });
    return;
  }

  existing.score += score;
  existing.reasons.push(reason);
}

function chooseSpeakerByEvidence(candidates: Map<string, SpeakerEvidence>) {
  const rankedCandidates = Array.from(candidates.values()).sort(
    (left, right) =>
      right.score - left.score ||
      normalizeSpeakerLookupText(right.speaker).length - normalizeSpeakerLookupText(left.speaker).length,
  );
  const bestCandidate = rankedCandidates[0];
  if (bestCandidate === undefined || bestCandidate.score < EVIDENCE_ACCEPT_SCORE) {
    return null;
  }

  const secondCandidate = rankedCandidates[1];
  if (secondCandidate !== undefined && bestCandidate.score - secondCandidate.score < EVIDENCE_TIE_MARGIN) {
    return null;
  }

  return bestCandidate.speaker;
}

function isQuoteDialogueSegment(segment: DialogueSegment) {
  const text = segment.text.trim();
  return (
    /^segment-\d+-quote-\d+/.test(segment.id) &&
    QUOTE_PAIRS.some(([openQuote, closeQuote]) => text.startsWith(openQuote) && text.endsWith(closeQuote))
  );
}

function getQuoteIndexFromSegmentId(segmentId: string) {
  const match = segmentId.match(/^segment-\d+-quote-(\d+)/);
  return match === null ? null : Number(match[1]);
}

function findSegmentQuoteMatch(segment: DialogueSegment, paragraphs: string[]) {
  const paragraph = paragraphs[segment.sourceIndex] ?? '';
  const quoteIndex = getQuoteIndexFromSegmentId(segment.id);
  const quoteMatches = findQuoteMatches(paragraph).filter(
    match =>
      hasDialoguePunctuation(match.text) &&
      !isSoundEffectQuote(match.text) &&
      (!isQuoteReferenceMatch(paragraph, match) || hasAnonymousPersonLeadingAttribution(paragraph, match)),
  );

  if (quoteIndex !== null && quoteMatches[quoteIndex] !== undefined) {
    return quoteMatches[quoteIndex];
  }

  const segmentText = segment.text.trim();
  return quoteMatches.find(match => match.text === segmentText) ?? null;
}

function findExplicitQuoteAttributionSpeaker(segment: DialogueSegment, paragraphs: string[], source: DialogueSource) {
  const paragraph = paragraphs[segment.sourceIndex] ?? '';
  const match = findSegmentQuoteMatch(segment, paragraphs);
  if (match === null) {
    return null;
  }

  const leadingText = paragraph.slice(0, match.start);
  const leadingAttribution = inferLeadingAttribution(leadingText, source);
  const trailingAttribution = inferTrailingAttribution(paragraph.slice(match.end), source);
  const colonSpeaker = findColonAttributionSpeakerBeforeQuote(paragraph, match, source);
  return colonSpeaker ?? leadingAttribution?.speaker ?? trailingAttribution?.speaker ?? null;
}

function findColonAttributionSpeakerBeforeQuote(paragraph: string, match: QuoteMatch, source: DialogueSource) {
  const leadingText = paragraph.slice(0, match.start);
  const previousQuoteEnd = Math.max(
    leadingText.lastIndexOf('”'),
    leadingText.lastIndexOf('」'),
    leadingText.lastIndexOf('』'),
    leadingText.lastIndexOf('"'),
  );
  const localLeadingText = leadingText.slice(previousQuoteEnd + 1).trim();
  const colonLabel = localLeadingText.match(/^([^：:\n]{1,36})[：:]\s*$/)?.[1] ?? null;
  return colonLabel === null ? null : resolveColonSpeaker(colonLabel, source, null);
}

function hasAnonymousPersonLeadingAttribution(paragraph: string, match: QuoteMatch) {
  const leadingText = paragraph.slice(0, match.start);
  const previousQuoteEnd = Math.max(
    leadingText.lastIndexOf('”'),
    leadingText.lastIndexOf('」'),
    leadingText.lastIndexOf('』'),
    leadingText.lastIndexOf('"'),
  );
  const attributionText = leadingText.slice(previousQuoteEnd + 1).trim();
  return /[：:]\s*$/.test(attributionText) && ANONYMOUS_PERSON_SUBJECT_PATTERN.test(attributionText);
}

function findRecentFocusEvidence(paragraphIndex: number, paragraphEvidence: ParagraphEvidence[]) {
  for (let index = paragraphIndex; index >= Math.max(0, paragraphIndex - SPEAKER_CARRY_MAX_PARAGRAPHS); index -= 1) {
    const evidence = paragraphEvidence[index];
    const speaker = evidence?.actorSpeaker ?? evidence?.attributionSpeaker ?? null;
    if (speaker === null) {
      continue;
    }

    return { speaker, distance: paragraphIndex - index };
  }

  return null;
}

function hasConflictingFocusBeforeQuote(
  speaker: string,
  paragraphIndex: number,
  paragraphEvidence: ParagraphEvidence[],
) {
  const recentFocus = findRecentFocusEvidence(paragraphIndex, paragraphEvidence);
  return recentFocus !== null && !isSameSpeakerName(recentFocus.speaker, speaker) && recentFocus.distance <= 1;
}

function resolveQuoteSegmentSpeakerByEvidence(
  segment: DialogueSegment,
  paragraphs: string[],
  paragraphEvidence: ParagraphEvidence[],
  source: DialogueSource,
  previousDialogueSpeaker: string | null,
  previousDialogueParagraphIndex: number | null,
  conservativeSpeakerInference: boolean,
  allowCrossParagraphEvidence: boolean,
) {
  const paragraph = paragraphs[segment.sourceIndex] ?? '';
  const match = findSegmentQuoteMatch(segment, paragraphs);
  const candidates = new Map<string, SpeakerEvidence>();
  const addressOnlyQuote =
    match !== null && isStandaloneQuoteMatch(paragraph, match) && isAddressOnlyQuote(segment.text);
  const suppressAddressedSpeaker = (speaker: string | null) =>
    speaker !== null && isLikelyAddressedSpeakerInQuote(segment.text, speaker) ? null : speaker;
  const suppressWeakContextSpeaker = (speaker: string | null) =>
    hasGenericAddressOpening(segment.text) ? null : suppressAddressedSpeaker(speaker);
  const previousParagraphActor =
    allowCrossParagraphEvidence && addressOnlyQuote && segment.sourceIndex > 0
      ? (paragraphEvidence[segment.sourceIndex - 1]?.actorSpeaker ?? null)
      : null;

  if (match !== null && hasAnonymousPersonLeadingAttribution(paragraph, match)) {
    return ANONYMOUS_NPC_SPEAKER_LABEL;
  }

  if (match !== null) {
    const leading = paragraph.slice(0, match.start).trim();
    const trailingText = paragraph.slice(match.end);
    const trailingAttribution = inferTrailingAttribution(trailingText, source);
    const trailingWindow = sliceTrailingAttributionWindow(
      trailingText,
      Math.max(64, trailingAttribution?.consumedLength ?? 0),
    );
    const leadingWindow = paragraph.slice(Math.max(0, match.start - 64), match.start);
    const leadingAttribution = inferLeadingAttribution(leading, source);
    const colonAttributionSpeaker = findColonAttributionSpeakerBeforeQuote(paragraph, match, source);
    const contextualBaseSpeaker =
      conservativeSpeakerInference || !allowCrossParagraphEvidence
        ? null
        : (previousDialogueSpeaker ?? findRecentFocusEvidence(segment.sourceIndex, paragraphEvidence)?.speaker ?? null);
    const contextualAttributionSpeaker =
      inferContextualAttributionSpeaker(leading, contextualBaseSpeaker) ??
      inferContextualAttributionSpeaker(trailingWindow, contextualBaseSpeaker);
    const speakerCandidate = inferSpeaker(leadingWindow, trailingWindow, source);
    const withVerb = hasSpeechVerbEvidence(`${leadingWindow}${trailingWindow}`, source);
    const selfNamedSpeaker = findSelfNamedSpeaker(segment.text, source);
    const nextParagraphSpeaker =
      allowCrossParagraphEvidence && isStandaloneQuoteMatch(paragraph, match)
        ? inferLookaheadAttributionSpeaker(
            paragraphs.slice(segment.sourceIndex + 1, segment.sourceIndex + 1 + QUOTE_ATTRIBUTION_LOOKAHEAD_PARAGRAPHS),
            source,
          )
        : null;
    const nextParagraphFocusSpeaker =
      allowCrossParagraphEvidence && isStandaloneQuoteMatch(paragraph, match)
        ? conservativeSpeakerInference
          ? null
          : inferLookaheadFocusSpeaker(
              paragraphs.slice(
                segment.sourceIndex + 1,
                segment.sourceIndex + 1 + QUOTE_ATTRIBUTION_LOOKAHEAD_PARAGRAPHS,
              ),
              source,
            )
        : null;
    const safeNextParagraphFocusSpeaker = suppressWeakContextSpeaker(nextParagraphFocusSpeaker);

    addSpeakerEvidence(
      candidates,
      colonAttributionSpeaker,
      EVIDENCE_EXPLICIT_ATTRIBUTION_SCORE,
      'colon attribution',
      source,
    );
    addSpeakerEvidence(
      candidates,
      leadingAttribution?.speaker ?? null,
      EVIDENCE_EXPLICIT_ATTRIBUTION_SCORE,
      'leading attribution',
      source,
    );
    addSpeakerEvidence(
      candidates,
      trailingAttribution?.speaker ?? null,
      EVIDENCE_EXPLICIT_ATTRIBUTION_SCORE,
      'trailing attribution',
      source,
    );
    addSpeakerEvidence(
      candidates,
      nextParagraphSpeaker,
      EVIDENCE_LOOKAHEAD_ATTRIBUTION_SCORE,
      'lookahead attribution',
      source,
    );
    if (!conservativeSpeakerInference && allowCrossParagraphEvidence) {
      addSpeakerEvidence(
        candidates,
        safeNextParagraphFocusSpeaker,
        EVIDENCE_LOOKAHEAD_FOCUS_SCORE,
        'lookahead focus',
        source,
      );
      addSpeakerEvidence(
        candidates,
        suppressAddressedSpeaker(contextualAttributionSpeaker),
        EVIDENCE_CONTEXTUAL_ATTRIBUTION_SCORE,
        'contextual attribution',
        source,
      );
    }
    addSpeakerEvidence(
      candidates,
      withVerb ? speakerCandidate : null,
      EVIDENCE_LOCAL_SPEECH_VERB_SCORE,
      'nearby speech verb',
      source,
    );
    if (!conservativeSpeakerInference) {
      addSpeakerEvidence(candidates, selfNamedSpeaker, EVIDENCE_SELF_NAMED_SCORE, 'self named quote', source);
    }
  }

  if (!conservativeSpeakerInference) {
    const currentActor = paragraphEvidence[segment.sourceIndex]?.actorSpeaker ?? null;
    addSpeakerEvidence(
      candidates,
      suppressAddressedSpeaker(currentActor),
      EVIDENCE_CURRENT_FOCUS_SCORE,
      'current paragraph focus',
      source,
    );

    if (allowCrossParagraphEvidence) {
      addSpeakerEvidence(
        candidates,
        previousParagraphActor,
        EVIDENCE_PREVIOUS_ACTOR_ADDRESS_SCORE,
        'previous paragraph actor address quote',
        source,
      );

      const recentFocus = findRecentFocusEvidence(segment.sourceIndex - 1, paragraphEvidence);
      if (
        recentFocus !== null &&
        (!addressOnlyQuote ||
          (previousParagraphActor !== null && isSameSpeakerName(recentFocus.speaker, previousParagraphActor)))
      ) {
        addSpeakerEvidence(
          candidates,
          suppressWeakContextSpeaker(recentFocus.speaker),
          Math.max(EVIDENCE_RECENT_FOCUS_SCORE - recentFocus.distance * 8, EVIDENCE_ACCEPT_SCORE),
          'recent focus',
          source,
        );
      }

      if (
        previousDialogueSpeaker !== null &&
        previousDialogueParagraphIndex !== null &&
        !addressOnlyQuote &&
        segment.sourceIndex - previousDialogueParagraphIndex <= SPEAKER_CARRY_MAX_PARAGRAPHS &&
        !hasConflictingFocusBeforeQuote(previousDialogueSpeaker, segment.sourceIndex, paragraphEvidence)
      ) {
        addSpeakerEvidence(
          candidates,
          suppressWeakContextSpeaker(previousDialogueSpeaker),
          EVIDENCE_PREVIOUS_DIALOGUE_SCORE,
          'previous dialogue carry',
          source,
        );
      }
    }
  }

  if (!addressOnlyQuote) {
    addSpeakerEvidence(
      candidates,
      suppressWeakContextSpeaker(segment.speaker),
      EVIDENCE_INITIAL_RESOLUTION_SCORE,
      'initial local resolution',
      source,
    );
  }

  return chooseSpeakerByEvidence(candidates);
}

function resolveSegmentsWithEvidence(segments: DialogueSegment[], paragraphs: string[], source: DialogueSource) {
  const paragraphEvidence = collectParagraphEvidence(paragraphs, source);
  const conservativeSpeakerInference = shouldUseConservativeSpeakerInference(source);
  let previousDialogueSpeaker: string | null = null;
  let previousDialogueParagraphIndex: number | null = null;
  let previousDialogueSpeakerWasMapped = false;

  return segments.map(segment => {
    if (segment.speakerSource === 'map') {
      if (segment.speaker !== null && isStableContextSpeaker(segment.speaker, source)) {
        previousDialogueSpeaker = segment.speaker;
        previousDialogueParagraphIndex = segment.sourceIndex;
        previousDialogueSpeakerWasMapped = true;
      }

      return segment;
    }

    if (!isQuoteDialogueSegment(segment)) {
      if (segment.speaker !== null && isStableContextSpeaker(segment.speaker, source)) {
        previousDialogueSpeaker = segment.speaker;
        previousDialogueParagraphIndex = segment.sourceIndex;
        previousDialogueSpeakerWasMapped = segment.speakerSource === 'map';
      }

      return segment;
    }

    const evidenceSpeaker = resolveQuoteSegmentSpeakerByEvidence(
      segment,
      paragraphs,
      paragraphEvidence,
      source,
      previousDialogueSpeaker,
      previousDialogueParagraphIndex,
      conservativeSpeakerInference,
      !hasDialogueMapForSourceParagraph(source, segment.sourceIndex),
    );
    const canCarryMappedSpeakerAcrossMissingParagraph =
      evidenceSpeaker === null &&
      previousDialogueSpeaker !== null &&
      previousDialogueSpeakerWasMapped &&
      previousDialogueParagraphIndex !== null &&
      !hasDialogueMapForSourceParagraph(source, segment.sourceIndex) &&
      segment.sourceIndex - previousDialogueParagraphIndex <= MISSING_MAP_SPEAKER_CARRY_MAX_PARAGRAPHS;
    const speaker = canCarryMappedSpeakerAcrossMissingParagraph ? previousDialogueSpeaker : evidenceSpeaker;
    const role = resolveSegmentKind(speaker, source);
    const resolvedSegment = {
      ...segment,
      kind: role.kind,
      side: role.side,
      speaker: normalizeSpeakerForResolvedRole(speaker, role, source),
    };

    if (resolvedSegment.speaker !== null && isStableContextSpeaker(resolvedSegment.speaker, source)) {
      previousDialogueSpeaker = resolvedSegment.speaker;
      previousDialogueParagraphIndex = segment.sourceIndex;
      previousDialogueSpeakerWasMapped =
        resolvedSegment.speakerSource === 'map' || canCarryMappedSpeakerAcrossMissingParagraph;
    }

    return resolvedSegment;
  });
}

function isDisplayNoiseSegment(segment: DialogueSegment) {
  return (
    segment.kind === 'narration' && segment.speaker === null && DISPLAY_NOISE_SEGMENT_PATTERN.test(segment.text.trim())
  );
}

function isSpeechDisplaySegment(segment: DialogueSegment) {
  return (
    segment.kind === 'npc' ||
    segment.kind === 'user' ||
    segment.mapKind === 'speech' ||
    isDirectSpeechMapSegment(segment) ||
    hasDialogueLikeQuote(segment.text)
  );
}

function isTrailingSpeechAttributionDisplayText(text: string) {
  const trimmedText = text.trim();
  if (
    trimmedText.length === 0 ||
    trimmedText.includes('\n') ||
    /[“”「」『』"]/.test(trimmedText) ||
    getCompactTextLength(trimmedText) > INLINE_QUOTE_ATTRIBUTION_MAX_CHARS
  ) {
    return false;
  }

  return (
    (TRAILING_SPEECH_ATTRIBUTION_DISPLAY_PATTERN.test(trimmedText) ||
      TRAILING_VOICE_NOTE_DISPLAY_PATTERN.test(trimmedText)) &&
    !INLINE_QUOTE_ATTRIBUTION_ACTION_BLOCK_PATTERN.test(trimmedText)
  );
}

function canMergeTrailingAttributionIntoSpeech(
  previousSegment: DialogueSegment,
  segment: DialogueSegment,
  source: DialogueSource,
) {
  if (
    !isSpeechDisplaySegment(previousSegment) ||
    segment.kind !== 'narration' ||
    segment.speaker !== null ||
    !isTrailingSpeechAttributionDisplayText(segment.text)
  ) {
    return false;
  }

  const mentionedSpeaker = findSpeakerInText(segment.text, source);
  if (
    mentionedSpeaker !== null &&
    previousSegment.speaker !== null &&
    previousSegment.speaker !== undefined &&
    !isSameSpeakerName(mentionedSpeaker, previousSegment.speaker)
  ) {
    return false;
  }

  return segment.sourceIndex <= previousSegment.sourceIndex + 1;
}

function removeTrailingAttributionDisplaySegments(segments: DialogueSegment[], source: DialogueSource) {
  const cleanedSegments: DialogueSegment[] = [];

  for (const segment of segments) {
    if (isDisplayNoiseSegment(segment)) {
      continue;
    }

    const previousSegment = cleanedSegments[cleanedSegments.length - 1];
    if (previousSegment !== undefined && canMergeTrailingAttributionIntoSpeech(previousSegment, segment, source)) {
      continue;
    }

    cleanedSegments.push(segment);
  }

  return cleanedSegments;
}

function hasTrailingVoiceNoteDisplayText(text: string) {
  return TRAILING_VOICE_NOTE_TAIL_DISPLAY_PATTERN.test(text.trim());
}

function canMergeVoiceContinuedSpeech(previousSegment: DialogueSegment, segment: DialogueSegment) {
  if (
    !isSpeechDisplaySegment(previousSegment) ||
    !isSpeechDisplaySegment(segment) ||
    previousSegment.speaker === null ||
    previousSegment.speaker === undefined ||
    segment.speaker === null ||
    segment.speaker === undefined ||
    !isSameSpeakerName(previousSegment.speaker, segment.speaker) ||
    !hasTrailingVoiceNoteDisplayText(previousSegment.text)
  ) {
    return false;
  }

  return segment.sourceIndex <= previousSegment.sourceIndex + 2;
}

function joinVoiceContinuedSpeechText(leftText: string, rightText: string) {
  const normalizedLeftText = leftText.trim();
  const normalizedRightText = rightText.trim();
  if (/[，,]\s*$/.test(normalizedLeftText)) {
    return `${normalizedLeftText}${normalizedRightText}`;
  }

  return `${normalizedLeftText} ${normalizedRightText}`.trim();
}

function mergeVoiceContinuedSpeechSegments(segments: DialogueSegment[]) {
  const mergedSegments: DialogueSegment[] = [];

  for (const segment of segments) {
    const previousSegment = mergedSegments[mergedSegments.length - 1];
    if (previousSegment !== undefined && canMergeVoiceContinuedSpeech(previousSegment, segment)) {
      const mergedText = joinVoiceContinuedSpeechText(previousSegment.text, segment.text);
      mergedSegments[mergedSegments.length - 1] = withEmotion(
        {
          ...previousSegment,
          id: `${previousSegment.id}-voice-continuation`,
          focusSpeaker: previousSegment.focusSpeaker ?? segment.focusSpeaker ?? null,
          mapAnchor: previousSegment.mapAnchor ?? segment.mapAnchor ?? null,
          mapKind: previousSegment.mapKind ?? segment.mapKind ?? null,
          speakerSource:
            previousSegment.speakerSource === 'map' || segment.speakerSource === 'map'
              ? 'map'
              : previousSegment.speakerSource,
          text: mergedText,
        },
        mergedText,
      );
      continue;
    }

    mergedSegments.push(segment);
  }

  return mergedSegments;
}

function joinSourceParagraphText(leftText: string, rightText: string) {
  const left = leftText.trim();
  const right = rightText.trim();
  const separator = /[A-Za-z0-9]$/.test(left) && /^[A-Za-z0-9]/.test(right) ? ' ' : '';
  return `${left}${separator}${right}`;
}

function createSourceParagraphParts(segments: DialogueSegment[]) {
  return segments.reduce<NonNullable<DialogueSegment['sourceParagraphParts']>>((parts, segment) => {
    const previousPart = parts[parts.length - 1];
    if (previousPart !== undefined && previousPart.sourceIndex === segment.sourceIndex) {
      previousPart.text = joinSourceParagraphText(previousPart.text, segment.text);
      return parts;
    }

    parts.push({
      text: segment.text.trim(),
      sourceIndex: segment.sourceIndex,
    });
    return parts;
  }, []);
}

function mergeShortNarrationSegments(segments: DialogueSegment[]) {
  const mergedSegments: DialogueSegment[] = [];
  let segmentIndex = 0;

  while (segmentIndex < segments.length) {
    const segment = segments[segmentIndex];
    if (!isMergeableShortNarration(segment)) {
      mergedSegments.push(segment);
      segmentIndex += 1;
      continue;
    }

    const group = [segment];
    let groupLength = getCompactTextLength(segment.text);
    let groupFocusSpeaker = segment.focusSpeaker ?? null;
    let nextIndex = segmentIndex + 1;

    while (nextIndex < segments.length && group.length < DISPLAY_NARRATION_GROUP_MAX_SEGMENTS) {
      const nextSegment = segments[nextIndex];
      if (!isMergeableShortNarration(nextSegment)) {
        break;
      }

      const nextFocusSpeaker = nextSegment.focusSpeaker ?? null;
      if (groupFocusSpeaker !== null && nextFocusSpeaker !== null && groupFocusSpeaker !== nextFocusSpeaker) {
        break;
      }

      const nextLength = getCompactTextLength(nextSegment.text);
      if (groupLength + nextLength > DISPLAY_NARRATION_GROUP_MAX_CHARS) {
        break;
      }

      group.push(nextSegment);
      groupLength += nextLength;
      groupFocusSpeaker = groupFocusSpeaker ?? nextFocusSpeaker;
      nextIndex += 1;
    }

    if (group.length === 1) {
      mergedSegments.push(segment);
      segmentIndex += 1;
      continue;
    }

    const mergedText = group.map(item => item.text).join('\n');
    const mapAnchor = group.map(item => item.mapAnchor ?? null).find(anchor => anchor !== null) ?? null;
    const mapKind = group.map(item => item.mapKind ?? null).find(kind => kind !== null) ?? null;
    const speakerSource = group.some(item => item.speakerSource === 'map') ? 'map' : group[0].speakerSource;
    mergedSegments.push(
      withEmotion(
        {
          ...group[0],
          id: `${group[0].id}-merged-${group.length}`,
          focusSpeaker: groupFocusSpeaker,
          speakerSource,
          mapAnchor,
          mapKind,
          text: mergedText,
          sourceParagraphParts: createSourceParagraphParts(group),
        },
        mergedText.replace(/\n/g, ' '),
      ),
    );
    segmentIndex = nextIndex;
  }

  return mergedSegments;
}

function normalizeMapAnchorText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[{}·・•‧∙･．.\s"'“”「」『』]/g, '')
    .trim();
}

function resolveMapKnownSpeaker(label: string | null, source: DialogueSource) {
  if (label === null) {
    return null;
  }

  return findKnownSpeaker(label, source);
}

function resolveMapDisplaySpeaker(label: string | null, source: DialogueSource) {
  if (label === null) {
    return null;
  }

  return resolveMapKnownSpeaker(label, source) ?? (isPlausibleSpeakerLabel(label) ? label.trim() : null);
}

function resolveAnonymousMapSpeechSpeaker(
  mapEntry: DialogueMapEntry,
  speaker: string | null,
  focusSpeaker: string | null,
) {
  if (mapEntry.kind !== 'speech' || mapEntry.speaker !== null || speaker !== null) {
    return speaker;
  }

  return focusSpeaker ?? ANONYMOUS_NPC_SPEAKER_LABEL;
}

function resolveMappedSegmentRole(mapEntry: DialogueMapEntry, displaySpeaker: string | null, source: DialogueSource) {
  const kind =
    mapEntry.kind !== 'speech' || displaySpeaker === null
      ? 'narration'
      : isSourceUserSpeaker(displaySpeaker, source)
        ? 'user'
        : 'npc';
  return {
    kind,
    side: kind === 'user' ? 'left' : kind === 'npc' ? 'right' : 'center',
  } as const;
}

type DialogueMapEntryMatch = {
  entry: DialogueMapEntry;
  entryIndex: number;
  consumedEntryIndexes: number[];
};

function getDialogueMapParagraphNumber(entry: DialogueMapEntry) {
  return Number.isInteger(entry.p) && entry.p !== null && entry.p > 0 ? entry.p : null;
}

function getSourceParagraphNumber(sourceIndex: number) {
  return sourceIndex + 1;
}

function hasDialogueMapForSourceParagraph(source: DialogueSource, sourceIndex: number) {
  const sourceParagraphNumber = getSourceParagraphNumber(sourceIndex);
  return (source.dialogueMap ?? []).some(entry => getDialogueMapParagraphNumber(entry) === sourceParagraphNumber);
}

function isParagraphDialogueMapEntry(entry: DialogueMapEntry) {
  return getDialogueMapParagraphNumber(entry) !== null;
}

function getDialogueMapCandidatePriority(
  segment: DialogueSegment,
  entry: DialogueMapEntry,
  anchorIndex: number,
  matchPriority: number,
) {
  const directSpeech = isDirectSpeechMapSegment(segment);
  const kindPriority = directSpeech && entry.kind === 'speech' ? 0 : !directSpeech && entry.kind !== 'speech' ? 0 : 1;
  return [matchPriority, kindPriority, anchorIndex, entry.i] as const;
}

function compareDialogueMapCandidatePriority(
  left: readonly [number, number, number, number],
  right: readonly [number, number, number, number],
) {
  for (let index = 0; index < left.length; index += 1) {
    const diff = left[index] - right[index];
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

function hasDirectDialogueQuote(paragraphText: string) {
  return findQuoteMatches(paragraphText).some(
    match =>
      hasDialoguePunctuation(match.text) &&
      !isSoundEffectQuote(match.text) &&
      (!isQuoteReferenceMatch(paragraphText, match) || hasAnonymousPersonLeadingAttribution(paragraphText, match)),
  );
}

function isDialogueMapEntryCompatibleWithSegment(
  segment: DialogueSegment,
  entry: DialogueMapEntry,
  paragraphText: string,
) {
  const directSpeech = isDirectSpeechMapSegment(segment);
  if (entry.kind === 'speech') {
    return directSpeech || !hasDirectDialogueQuote(paragraphText);
  }

  return !directSpeech;
}

function canUseParagraphDefaultMap(segment: DialogueSegment, entry: DialogueMapEntry, paragraphText: string) {
  if (!isDialogueMapEntryCompatibleWithSegment(segment, entry, paragraphText)) {
    return false;
  }

  const normalizedAnchor = normalizeMapAnchorText(entry.anchor);
  const normalizedParagraphText = normalizeMapAnchorText(paragraphText);
  const paragraphAnchorIndex = normalizedAnchor.length > 0 ? normalizedParagraphText.indexOf(normalizedAnchor) : -1;
  if (paragraphAnchorIndex < 0) {
    return false;
  }

  if (entry.kind !== 'speech') {
    return true;
  }

  if (!isDirectSpeechMapSegment(segment)) {
    return false;
  }

  return !findQuoteMatches(paragraphText).some(match => normalizeMapAnchorText(match.text).includes(normalizedAnchor));
}

function findWholeParagraphSpeechMapEntry(paragraph: string, paragraphIndex: number, source: DialogueSource) {
  const dialogueMap = source.dialogueMap ?? [];
  if (dialogueMap.length === 0) {
    return null;
  }

  if (hasDirectDialogueQuote(paragraph)) {
    return null;
  }

  const paragraphNumber = getSourceParagraphNumber(paragraphIndex);
  const paragraphEntries = dialogueMap.filter(entry => getDialogueMapParagraphNumber(entry) === paragraphNumber);
  if (paragraphEntries.length === 0 || paragraphEntries.some(entry => entry.kind !== 'speech')) {
    return null;
  }

  const normalizedParagraphText = normalizeMapAnchorText(paragraph);
  if (
    paragraphEntries.some(entry => {
      const normalizedAnchor = normalizeMapAnchorText(entry.anchor);
      return normalizedAnchor.length === 0 || !normalizedParagraphText.includes(normalizedAnchor);
    })
  ) {
    return null;
  }

  if (paragraphEntries.length === 1) {
    return paragraphEntries[0];
  }

  const firstEntry = paragraphEntries[0];
  const firstSpeaker = resolveMapDisplaySpeaker(firstEntry.speaker, source);
  const firstFocusSpeaker = resolveMapKnownSpeaker(firstEntry.focus, source);
  if (firstEntry.speaker === null || firstSpeaker === null) {
    return null;
  }

  const sameSpeechOwner = paragraphEntries.every(entry => {
    if (entry.speaker === null) {
      return false;
    }

    return (
      resolveMapDisplaySpeaker(entry.speaker, source) === firstSpeaker &&
      resolveMapKnownSpeaker(entry.focus, source) === firstFocusSpeaker
    );
  });

  return sameSpeechOwner ? firstEntry : null;
}

function createWholeParagraphMapSpeechSegment(paragraph: string, paragraphIndex: number, source: DialogueSource) {
  const mapEntry = findWholeParagraphSpeechMapEntry(paragraph, paragraphIndex, source);
  if (mapEntry === null) {
    return null;
  }

  const speaker = resolveMapDisplaySpeaker(mapEntry.speaker, source);
  const focusSpeaker = resolveMapKnownSpeaker(mapEntry.focus, source);
  const displaySpeaker = resolveAnonymousMapSpeechSpeaker(mapEntry, speaker, focusSpeaker);
  const role = resolveMappedSegmentRole(mapEntry, displaySpeaker, source);

  return [
    withEmotion(
      {
        id: `segment-${paragraphIndex}-map-speech-0`,
        kind: role.kind,
        side: role.side,
        speaker: displaySpeaker,
        focusSpeaker,
        speakerSource: 'map',
        mapAnchor: mapEntry.anchor,
        mapKind: mapEntry.kind,
        text: paragraph,
        sourceIndex: paragraphIndex,
      },
      paragraph,
    ),
  ];
}

function findAnonymousSpeechMapEntryForSourceParagraph(
  segment: DialogueSegment,
  dialogueMap: DialogueMapEntry[],
  paragraphs: string[],
  source: DialogueSource,
): DialogueMapEntryMatch | null {
  if (!isDirectSpeechMapSegment(segment)) {
    return null;
  }

  if (findExplicitQuoteAttributionSpeaker(segment, paragraphs, source) !== null) {
    return null;
  }

  const sourceParagraphNumber = getSourceParagraphNumber(segment.sourceIndex);
  const paragraphSpeechEntries = dialogueMap
    .map((entry, entryIndex) => ({ entry, entryIndex }))
    .filter(({ entry }) => entry.kind === 'speech')
    .filter(({ entry }) => getDialogueMapParagraphNumber(entry) === sourceParagraphNumber);
  if (paragraphSpeechEntries.length === 0 || paragraphSpeechEntries.some(({ entry }) => entry.speaker !== null)) {
    return null;
  }

  const bestMatch = paragraphSpeechEntries.sort((left, right) => left.entry.i - right.entry.i)[0];
  return {
    entry: bestMatch.entry,
    entryIndex: bestMatch.entryIndex,
    consumedEntryIndexes: [],
  };
}

function findForwardSpeechContinuationMapEntry(
  segment: DialogueSegment,
  dialogueMap: DialogueMapEntry[],
  usedEntries: Set<number>,
  paragraphs: string[],
  source: DialogueSource,
): DialogueMapEntryMatch | null {
  if (!isDirectSpeechMapSegment(segment)) {
    return null;
  }

  const paragraphText = paragraphs[segment.sourceIndex] ?? '';
  const quoteMatches = findQuoteMatches(paragraphText).filter(
    match =>
      hasDialoguePunctuation(match.text) &&
      !isSoundEffectQuote(match.text) &&
      (!isQuoteReferenceMatch(paragraphText, match) || hasAnonymousPersonLeadingAttribution(paragraphText, match)),
  );
  const quoteIndexFromId = getQuoteIndexFromSegmentId(segment.id);
  const normalizedSegmentText = normalizeMapAnchorText(segment.text);
  const targetQuoteIndex =
    quoteIndexFromId ?? quoteMatches.findIndex(match => normalizeMapAnchorText(match.text) === normalizedSegmentText);
  if (targetQuoteIndex <= 0 || quoteMatches[targetQuoteIndex] === undefined) {
    return null;
  }

  const sourceParagraphNumber = getSourceParagraphNumber(segment.sourceIndex);
  const candidates = dialogueMap
    .map((entry, entryIndex) => ({ entry, entryIndex }))
    .filter(
      ({ entry, entryIndex }) =>
        usedEntries.has(entryIndex) &&
        entry.kind === 'speech' &&
        entry.speaker !== null &&
        getDialogueMapParagraphNumber(entry) === sourceParagraphNumber,
    )
    .map(({ entry, entryIndex }) => {
      const normalizedAnchor = normalizeMapAnchorText(entry.anchor);
      const anchorQuoteIndex = quoteMatches.findIndex(match =>
        normalizeMapAnchorText(match.text).includes(normalizedAnchor),
      );
      if (normalizedAnchor.length === 0 || anchorQuoteIndex < 0 || anchorQuoteIndex >= targetQuoteIndex) {
        return null;
      }

      const mappedSpeaker = resolveMapDisplaySpeaker(entry.speaker, source);
      if (mappedSpeaker === null) {
        return null;
      }

      const bridgeText = paragraphText
        .slice(quoteMatches[anchorQuoteIndex].end, quoteMatches[targetQuoteIndex].start)
        .trim();
      if (bridgeText.length === 0) {
        return null;
      }

      const mappedSpeakerRange = findSpeakerRange(bridgeText, mappedSpeaker);
      const conflictingBridgeSpeaker = createSpeakerCandidates(source).find(speaker => {
        if (isSameSpeakerName(speaker, mappedSpeaker)) {
          return false;
        }

        const candidateRange = findSpeakerRange(bridgeText, speaker);
        if (candidateRange === null) {
          return false;
        }

        return !(
          mappedSpeakerRange !== null &&
          candidateRange.index >= mappedSpeakerRange.index &&
          candidateRange.end <= mappedSpeakerRange.end
        );
      });
      if (conflictingBridgeSpeaker !== undefined) {
        return null;
      }

      const bridgeSpeaker =
        inferTrailingAttribution(bridgeText, source)?.speaker ?? findSpeakerInText(bridgeText, source);
      if (bridgeSpeaker !== null && !isSameSpeakerName(bridgeSpeaker, mappedSpeaker)) {
        return null;
      }

      return { entry, entryIndex, anchorQuoteIndex };
    })
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .sort((left, right) => right.anchorQuoteIndex - left.anchorQuoteIndex || left.entry.i - right.entry.i);

  const bestMatch = candidates[0];
  if (bestMatch === undefined) {
    return null;
  }

  return {
    entry: bestMatch.entry,
    entryIndex: bestMatch.entryIndex,
    consumedEntryIndexes: [],
  };
}

function findDialogueMapEntryForSegment(
  segment: DialogueSegment,
  dialogueMap: DialogueMapEntry[],
  usedEntries: Set<number>,
  paragraphs: string[],
  source: DialogueSource,
): DialogueMapEntryMatch | null {
  const normalizedSegmentText = normalizeMapAnchorText(segment.text);
  const paragraphText = paragraphs[segment.sourceIndex] ?? segment.text;
  const sourceParagraphNumber = getSourceParagraphNumber(segment.sourceIndex);
  const paragraphEntryMatches = dialogueMap
    .map((entry, entryIndex) => ({ entry, entryIndex }))
    .filter(match => getDialogueMapParagraphNumber(match.entry) === sourceParagraphNumber);
  const availableParagraphEntryMatches = paragraphEntryMatches.filter(match => !usedEntries.has(match.entryIndex));

  if (normalizedSegmentText.length > 0) {
    const paragraphAnchorMatches = availableParagraphEntryMatches
      .map(({ entry, entryIndex }) => {
        if (!isDialogueMapEntryCompatibleWithSegment(segment, entry, paragraphText)) {
          return null;
        }

        const normalizedAnchor = normalizeMapAnchorText(entry.anchor);
        const anchorIndex = normalizedAnchor.length > 0 ? normalizedSegmentText.indexOf(normalizedAnchor) : -1;
        if (anchorIndex < 0) {
          return null;
        }

        return {
          entry,
          entryIndex,
          anchorIndex,
          priority: getDialogueMapCandidatePriority(segment, entry, anchorIndex, 0),
        };
      })
      .filter((match): match is NonNullable<typeof match> => match !== null);

    if (paragraphAnchorMatches.length > 0) {
      paragraphAnchorMatches.sort((left, right) => compareDialogueMapCandidatePriority(left.priority, right.priority));
      const bestMatch = paragraphAnchorMatches[0];
      return {
        entry: bestMatch.entry,
        entryIndex: bestMatch.entryIndex,
        consumedEntryIndexes: [bestMatch.entryIndex],
      };
    }

    if (availableParagraphEntryMatches.length === 1) {
      const match = availableParagraphEntryMatches[0];
      if (canUseParagraphDefaultMap(segment, match.entry, paragraphText)) {
        return {
          entry: match.entry,
          entryIndex: match.entryIndex,
          consumedEntryIndexes: [],
        };
      }
    }
  }

  if (availableParagraphEntryMatches.length === 1) {
    const match = availableParagraphEntryMatches[0];
    if (canUseParagraphDefaultMap(segment, match.entry, paragraphText)) {
      return {
        entry: match.entry,
        entryIndex: match.entryIndex,
        consumedEntryIndexes: [],
      };
    }
  }

  const forwardSpeechContinuationMatch = findForwardSpeechContinuationMapEntry(
    segment,
    dialogueMap,
    usedEntries,
    paragraphs,
    source,
  );
  if (forwardSpeechContinuationMatch !== null) {
    return forwardSpeechContinuationMatch;
  }

  const anonymousParagraphMatch = findAnonymousSpeechMapEntryForSourceParagraph(
    segment,
    dialogueMap,
    paragraphs,
    source,
  );
  if (anonymousParagraphMatch !== null) {
    return anonymousParagraphMatch;
  }

  return null;
}

function isDirectSpeechMapSegment(segment: DialogueSegment) {
  const text = segment.text.trim();
  return (
    segment.id.includes('-quote-') ||
    segment.id.includes('-colon-') ||
    QUOTE_PAIRS.some(([openQuote, closeQuote]) => {
      if (!text.startsWith(openQuote)) {
        return false;
      }

      const closeIndex = text.indexOf(closeQuote, openQuote.length);
      return closeIndex > openQuote.length;
    }) ||
    /^[^：:\n]{1,16}[：:]/.test(text)
  );
}

function applyDialogueMapToSegments(segments: DialogueSegment[], source: DialogueSource, paragraphs: string[]) {
  const dialogueMap = source.dialogueMap ?? [];
  if (!hasDialogueMapEntries(source)) {
    return segments.map(segment => ({
      ...segment,
      focusSpeaker: segment.focusSpeaker ?? null,
      speakerSource: segment.speakerSource ?? 'fallback',
      mapAnchor: segment.mapAnchor ?? null,
      mapKind: segment.mapKind ?? null,
    }));
  }

  const usedEntries = new Set<number>();
  return segments.map(segment => {
    const mapMatch = findDialogueMapEntryForSegment(segment, dialogueMap, usedEntries, paragraphs, source);
    if (mapMatch === null) {
      return {
        ...segment,
        focusSpeaker: segment.focusSpeaker ?? null,
        speakerSource: segment.speakerSource ?? 'fallback',
        mapAnchor: segment.mapAnchor ?? null,
        mapKind: segment.mapKind ?? null,
      };
    }

    mapMatch.consumedEntryIndexes.forEach(entryIndex => usedEntries.add(entryIndex));
    if (!isParagraphDialogueMapEntry(mapMatch.entry)) {
      usedEntries.add(mapMatch.entryIndex);
    }

    const mapEntry = mapMatch.entry;
    const speaker = resolveMapDisplaySpeaker(mapEntry.speaker, source);
    const focusSpeaker = resolveMapKnownSpeaker(mapEntry.focus, source);
    const displaySpeaker = resolveAnonymousMapSpeechSpeaker(mapEntry, speaker, focusSpeaker);
    const role = resolveMappedSegmentRole(mapEntry, displaySpeaker, source);
    const mappedSpeaker = normalizeSpeakerForResolvedRole(displaySpeaker, role, source);
    const mappedFocusSpeaker =
      role.kind === 'narration' ? (focusSpeaker ?? resolveMapKnownSpeaker(mapEntry.speaker, source)) : focusSpeaker;

    return withEmotion(
      {
        ...segment,
        kind: role.kind,
        side: role.side,
        speaker: mappedSpeaker,
        focusSpeaker: mappedFocusSpeaker,
        speakerSource: 'map',
        mapAnchor: mapEntry.anchor,
        mapKind: mapEntry.kind,
      },
      segment.text,
    );
  });
}

export function splitDialogueSource(source: DialogueSource): DialogueSplitResult {
  const content = normalizeText(source.content);
  const paragraphs = content
    .split(/\n(?:[ \t]*\n)+/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
  const declaredDialogueMap = source.dialogueMap ?? [];
  const validatedDialogueMap = calibrateDialogueMapEntriesForSource(declaredDialogueMap, content);
  const hasMappedSpeech = validatedDialogueMap.some(entry => entry.kind === 'speech');
  const mapSource =
    declaredDialogueMap.length === 0
      ? source
      : {
          ...source,
          dialogueMap: validatedDialogueMap,
          ...(hasMappedSpeech ? { speakerInferenceMode: 'conservative' as const } : {}),
        };
  const conservativeSpeakerInference = shouldUseConservativeSpeakerInference(mapSource);
  const segments: DialogueSegment[] = [];
  let recentContextSpeaker: string | null = null;
  let recentContextSpeakerDistance = Number.POSITIVE_INFINITY;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const paragraphHasDialogueMap = hasDialogueMapForSourceParagraph(mapSource, paragraphIndex);
    const carriedSpeaker =
      !conservativeSpeakerInference &&
      !paragraphHasDialogueMap &&
      recentContextSpeakerDistance <= SPEAKER_CARRY_MAX_PARAGRAPHS
        ? recentContextSpeaker
        : null;
    const paragraphSegments =
      createWholeParagraphMapSpeechSegment(paragraph, paragraphIndex, mapSource) ??
      splitParagraph(
        paragraph,
        paragraphIndex,
        mapSource,
        paragraphs.slice(paragraphIndex + 1, paragraphIndex + 1 + QUOTE_ATTRIBUTION_LOOKAHEAD_PARAGRAPHS),
        carriedSpeaker,
        conservativeSpeakerInference || paragraphHasDialogueMap,
      );
    const explicitSpeaker = findLastStableExplicitSpeaker(paragraphSegments, mapSource);
    const paragraphActor = inferParagraphActorSpeaker(paragraph, mapSource, carriedSpeaker);

    segments.push(...paragraphSegments);

    const contextSpeaker =
      explicitSpeaker ??
      (paragraphActor !== null && isStableContextSpeaker(paragraphActor, mapSource) ? paragraphActor : null);

    if (contextSpeaker !== null) {
      recentContextSpeaker = contextSpeaker;
      recentContextSpeakerDistance = 0;
      return;
    }

    recentContextSpeakerDistance += 1;
  });

  const mappedSegments = applyDialogueMapToSegments(segments, mapSource, paragraphs);
  const resolvedSegments = resolveSegmentsWithEvidence(mappedSegments, paragraphs, mapSource);
  const attributionCleanedSegments = removeTrailingAttributionDisplaySegments(resolvedSegments, mapSource);
  const voiceContinuedSegments = mergeVoiceContinuedSpeechSegments(attributionCleanedSegments);
  const displaySegments = mergeShortNarrationSegments(voiceContinuedSegments);

  return {
    segments: displaySegments,
    sourceMessageId: source.messageId,
    sourceContentHash: hashContent(content),
    knownCharacters: source.knownCharacters,
  };
}
