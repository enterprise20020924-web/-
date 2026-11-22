import { Archetype, CharacterData, Gender, MainlineTimeline, Skill, type IdentityMechanismDefinition } from './types';
import { XIAOYEYUE_MAGIC_GIRL_REQUIRED_NAME } from '../shared/xiaoyeyueMagicGirl';

// --- Archetypes (10M, 10F, 6O) ---
// 每个角色只有不同的 passiveSkill 和 permanentState，没有 baseBonus

export const MAGIC_GIRL_ARCHETYPE_ID = 'f_magic_girl';
export const MAGIC_GIRL_DEFAULT_NAME = XIAOYEYUE_MAGIC_GIRL_REQUIRED_NAME;
export const MAGIC_GIRL_BOND_MECHANISM: IdentityMechanismDefinition = {
  id: 'bond',
  kind: 'affection-count',
  name: '羁绊值',
  description: '启用羁绊值机制：按当前好感度达到80的角色人数计算，每人提供10羁绊值，最大为100。',
  threshold: 80,
  gain: 10,
  max: 100,
};

export const ARCHETYPES: Record<Gender, Archetype[]> = {
  [Gender.MALE]: [
    {
      id: 'm_alpha',
      name: '冷酷学霸',
      description: '眼神锐利，智商超群，对恋爱毫无兴趣的禁欲系。',
      icon: 'Glasses',
      passiveSkill: {
        id: 'p_analysis',
        name: '真理之眼',
        description: '看穿对方敏感点',
        type: 'constitution',
        icon: 'Eye',
      },
      permanentState: {
        name: '禁欲学者',
        bonus: {
          魅力加成: -5,
          幸运加成: 0,
          基础性斗力加成: 0,
          基础性斗力成算: 0,
          基础忍耐力加成: 0,
          基础忍耐力成算: 20,
          闪避率加成: 0,
          暴击率加成: 15,
        },
      },
    },
    {
      id: 'm_wild',
      name: '狂野校霸',
      description: '充满野性与侵略性，无论在哪里都是绝对的支配者。',
      icon: 'Sword',
      passiveSkill: {
        id: 'p_domination',
        name: '绝对支配',
        description: '高潮边缘指令成功率提升',
        type: 'constitution',
        icon: 'Crown',
      },
      permanentState: {
        name: '野性支配',
        bonus: {
          魅力加成: -10,
          幸运加成: -5,
          基础性斗力加成: 0,
          基础性斗力成算: 25,
          基础忍耐力加成: 0,
          基础忍耐力成算: 0,
          闪避率加成: 0,
          暴击率加成: 20,
        },
      },
    },
    {
      id: 'm_schemer',
      name: '腹黑军师',
      description: '表面温文尔雅，实则城府极深，控制欲极强。',
      icon: 'Brain',
      passiveSkill: {
        id: 'p_pokerface',
        name: '笑面虎',
        description: '难以被心理攻势影响',
        type: 'constitution',
        icon: 'Ghost',
      },
      permanentState: {
        name: '深谋远虑',
        bonus: {
          魅力加成: 8,
          幸运加成: 15,
          基础性斗力加成: 0,
          基础性斗力成算: 0,
          基础忍耐力加成: 0,
          基础忍耐力成算: 0,
          闪避率加成: 10,
          暴击率加成: 12,
        },
      },
    },
    {
      id: 'm_prince',
      name: '温柔王子',
      description: '如同童话中走出一般，对所有人都温柔体贴的现充。',
      icon: 'Crown',
      passiveSkill: {
        id: 'p_gentle',
        name: '暖男光环',
        description: '初始好感度提升',
        type: 'constitution',
        icon: 'Sparkles',
      },
      permanentState: {
        name: '温柔光环',
        bonus: {
          魅力加成: 20,
          幸运加成: 10,
          基础性斗力加成: 0,
          基础性斗力成算: -30,
          基础忍耐力加成: 0,
          基础忍耐力成算: 15,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'm_femboy',
      name: '娇俏伪娘',
      description: '比女生更可爱的小男娘，容易激起保护欲。',
      icon: 'Cat',
      passiveSkill: {
        id: 'p_dazed',
        name: '性别模糊',
        description: '让直男陷入迷离',
        type: 'constitution',
        icon: 'RefreshCcw',
      },
      permanentState: {
        name: '娇柔体质',
        bonus: {
          魅力加成: 40,
          幸运加成: 15,
          基础性斗力加成: 0,
          基础性斗力成算: -40,
          基础忍耐力加成: 0,
          基础忍耐力成算: -40,
          闪避率加成: 20,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'm_shota',
      name: '可爱正太',
      description: '外表人畜无害，实际上可能切开是黑的年下系。',
      icon: 'Smile',
      passiveSkill: {
        id: 'p_innocent',
        name: '无辜防御',
        description: '概率使对方中止攻击',
        type: 'constitution',
        icon: 'Shield',
      },
      permanentState: {
        name: '纯真外表',
        bonus: {
          魅力加成: 10,
          幸运加成: 20,
          基础性斗力加成: 0,
          基础性斗力成算: -50,
          基础忍耐力加成: 0,
          基础忍耐力成算: 0,
          闪避率加成: 18,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'm_jock',
      name: '体育特长生',
      description: '阳光开朗大男孩，体力无限，但心思比较单纯。',
      icon: 'Dumbbell',
      passiveSkill: {
        id: 'p_stamina',
        name: '无限体能',
        description: '耐力恢复速度翻倍',
        type: 'constitution',
        icon: 'Zap',
      },
      permanentState: {
        name: '运动健将',
        bonus: {
          魅力加成: -5,
          幸运加成: 0,
          基础性斗力加成: 0,
          基础性斗力成算: 15,
          基础忍耐力加成: 0,
          基础忍耐力成算: 30,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'm_otaku',
      name: '技术宅',
      description: '虽不善言辞，但在某些奇怪的领域拥有惊人的知识储备。',
      icon: 'Wifi',
      passiveSkill: {
        id: 'p_tech',
        name: '道具改装',
        description: '道具效果大幅提升',
        type: 'constitution',
        icon: 'Settings',
      },
      permanentState: {
        name: '技术专精',
        bonus: {
          魅力加成: -15,
          幸运加成: 0,
          基础性斗力加成: 0,
          基础性斗力成算: 0,
          基础忍耐力加成: 0,
          基础忍耐力成算: -25,
          闪避率加成: 0,
          暴击率加成: 25,
        },
      },
    },
    {
      id: 'm_narcissist',
      name: '自恋狂',
      description: '沉醉于自己的美貌，随身携带镜子，认为全世界都爱自己。',
      icon: 'Mirror',
      passiveSkill: {
        id: 'p_mirror',
        name: '自我陶醉',
        description: '免疫降低魅力的效果',
        type: 'constitution',
        icon: 'Sparkles',
      },
      permanentState: {
        name: '自我中心',
        bonus: {
          魅力加成: 30,
          幸运加成: -10,
          基础性斗力加成: 0,
          基础性斗力成算: 0,
          基础忍耐力加成: 0,
          基础忍耐力成算: 0,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'm_delinquent',
      name: '不良少年',
      description: '并不坏，只是不想被束缚，喜欢在危险边缘试探。',
      icon: 'Skull',
      passiveSkill: {
        id: 'p_risk',
        name: '背水一战',
        description: '耐力越低性斗力越高',
        type: 'constitution',
        icon: 'Flame',
      },
      permanentState: {
        name: '危险边缘',
        bonus: {
          魅力加成: -5,
          幸运加成: -10,
          基础性斗力加成: 0,
          基础性斗力成算: 35,
          基础忍耐力加成: 0,
          基础忍耐力成算: -30,
          闪避率加成: 0,
          暴击率加成: 18,
        },
      },
    },
    {
      id: 'm_gloomy',
      name: '好色少年',
      description: '单纯好色，所以很多事情都是因为好色导致的。',
      icon: 'Heart',
      passiveSkill: {
        id: 'p_invisibility',
        name: '背水一战',
        description: '降低被针对的概率',
        type: 'constitution',
        icon: 'Flame',
      },
      permanentState: {
        name: '背水一战',
        bonus: {
          魅力加成: -20,
          幸运加成: 15,
          基础性斗力加成: 30,
          基础性斗力成算: 0,
          基础忍耐力加成: 0,
          基础忍耐力成算: 0,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
  ],
  [Gender.FEMALE]: [
    {
      id: 'f_onee',
      name: '成熟御姐',
      description: '气场强大，身材惹火，举手投足间散发着致命魅力。',
      icon: 'Crown',
      passiveSkill: {
        id: 'p_araara',
        name: '大姐姐领域',
        description: '对年下角色压迫力翻倍',
        type: 'constitution',
        icon: 'Target',
      },
      permanentState: {
        name: '成熟魅力',
        bonus: {
          魅力加成: 18,
          幸运加成: 0,
          基础性斗力加成: 0,
          基础性斗力成算: 20,
          基础忍耐力加成: 0,
          基础忍耐力成算: -15,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'f_sweet',
      name: '甜美软妹',
      description: '治愈系的笑容，温柔体贴，像是棉花糖一样柔软。',
      icon: 'Heart',
      passiveSkill: {
        id: 'p_healing',
        name: '治愈体质',
        description: '回合结束恢复体力',
        type: 'constitution',
        icon: 'Heart',
      },
      permanentState: {
        name: '治愈之光',
        bonus: {
          魅力加成: 15,
          幸运加成: 15,
          基础性斗力加成: 0,
          基础性斗力成算: -25,
          基础忍耐力加成: 0,
          基础忍耐力成算: 25,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'f_loli',
      name: '娇小萝莉',
      description: '体型娇小可爱，拥有令人怜惜的外表和惊人的潜力。',
      icon: 'Sparkles',
      passiveSkill: {
        id: 'p_smallbody',
        name: '紧致构造',
        description: '双方快感积累速度提升',
        type: 'constitution',
        icon: 'Zap',
      },
      permanentState: {
        name: '娇小潜力',
        bonus: {
          魅力加成: 20,
          幸运加成: 20,
          基础性斗力加成: 0,
          基础性斗力成算: -40,
          基础忍耐力加成: 0,
          基础忍耐力成算: -40,
          闪避率加成: 20,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'f_mesugaki',
      name: '雌小鬼',
      description: '性格恶劣，喜欢嘲讽，但在吃瘪时会露出绝妙表情。',
      icon: 'Ghost',
      passiveSkill: {
        id: 'p_glass_cannon',
        name: '杂鱼判定',
        description: '嘲讽造成暴击，但自身极易高潮',
        type: 'constitution',
        icon: 'Flame',
      },
      permanentState: {
        name: '玻璃大炮',
        bonus: {
          魅力加成: -8,
          幸运加成: 20,
          基础性斗力加成: 0,
          基础性斗力成算: 70,
          基础忍耐力加成: 0,
          基础忍耐力成算: -70,
          闪避率加成: 0,
          暴击率加成: 20,
        },
      },
    },
    {
      id: 'f_cool',
      name: '冰山美人',
      description: '拒人于千里之外的冷漠，只为特定的人融化。',
      icon: 'Glasses',
      passiveSkill: {
        id: 'p_cold',
        name: '绝对零度',
        description: '极难进入兴奋状态',
        type: 'constitution',
        icon: 'Shield',
      },
      permanentState: {
        name: '冰霜之心',
        bonus: {
          魅力加成: 8,
          幸运加成: -10,
          基础性斗力加成: 0,
          基础性斗力成算: -20,
          基础忍耐力加成: 0,
          基础忍耐力成算: 40,
          闪避率加成: 10,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'f_gyaru',
      name: '黑皮辣妹',
      defaultName: '江口虎子',
      description: '健康的小麦色皮肤，性格豪爽，玩得很花。',
      icon: 'Zap',
      userProfile: {
        basicInfo: `<user>生得一副让常人看上一眼就发怵的霸气长相与气场：丰满的小麦色身躯，及臀的狂野纯白长发大背头，不同寻常的金瞳，笑起来会露出一排尖锐的鲨鱼齿。
甚至拥有一米八二的身高，帅气到炸也是比漂亮更符合她的形容词。
她平时总是一身敞怀短裙的辣妹风校服打扮——外披校服、敞领白衬衫里衬着黑抹胸，下搭百褶短裙、吊带黑丝与AJ1，脖系黑皮项圈、戴着金属饰品，手里常年拎着一根金属棒球棍。

因为家里开着家传空手道武馆，加上这副天然极具威慑力的外表，她从小在吵架、干架和收马子这几件事上就占尽优势，早早攒下了远超同龄人的社会经验。转学之前，她已经是手段老辣、把原学校的学生治得服服帖帖的大姐头；后来响木天音为了引进人才，顺带恶心一把女权协会，特意向校方推荐并邀请她转入天海学园，于是她便开始了新的天海征程。

初始便有着B的评级。
拥有着名为百万一心的能力，哪怕再弱小的小弟，只要保持团结一心且人势众多那就能为自己增强威压。`,
        lifeStructure: `<user>向来喜欢在新地盘白手起家、从头打拼，因此转入天海学园时什么班底和家当都没带；不过真到了需要的时候，她随时能支使自己的“弟弟妹妹”们把必要的东西送进学园。

平日里闲下来，她要么窝去图书馆翻漫画打发时间，要么在学园内外四处闲逛，撞见看不顺眼的仗势欺人之事便会顺手管上一管、护住弱小。`,
        characterNature: `比起单靠拳头压人，外表凶悍的<user>反而是最不看重“唯实力论”的那一类人。在她眼里，把一群各怀鬼胎的强者凑在一起算不上什么本事，能将强弱不同的人真正组织、磨合成一个亲密且上下一心的帮派，才是老大有能耐的证明。正因如此，她极其厌恶女权协会那套高高在上、把人当附庸摆弄的“女王过家家”把戏。

面对天海学园里处境弱势的男生，<user>能平心静气地理解男女之间客观存在的实力差距，也看得出大部分女生其实并未做得太过分；但看到男生们软弱认怂、离自己心目中理想的小弟苗子相去甚远时，她心里还是难免窝火。即便如此，她依然会想站出来保护并严格操练他们，这份想要把人带出来的决心甚至比学生会还要强烈。

剥开大姐头极具威慑力的外皮，<user>平日里待人其实相当温柔，不仅愿意像真正的长姐一样做饭照拂底下的弟弟妹妹，在自己的本分上也清醒务实，半点没有刻板印象中不良少女荒废学业的毛病。`,
        sceneExpression: `<user>平时待人不会带着刺，只是因为常年习惯了发号施令，开口说话时嗓门确实很大。与极具威慑力的凶悍外表相悖，遇到事情时如非必要，她一般更喜欢先靠沟通解决问题而非直接动手；但她说话向来直来直去且带着刺，遇上讨厌的人或事就是明摆着的讨厌，绝不会拐弯抹角地客套敷衍。`,
      },
      openingStory: `**天海学园的校门口，此刻正上演着一幕与“世界第四学园”格格不入的诡异光景。**

**几个染着五颜六色头发、打扮得流里流气的青年正死死扒着校门外的警戒线，一个个眼眶通红、欲哭无泪，活像是正在经历生离死别的家属一样，依依不舍地盯着刚刚迈进校门的那道背影——**

**“大姐头！到了名校里千万别委屈自己啊！！”**
**“要是有人敢给你脸色看，随时叫兄弟们翻墙进来——痛痛痛！警卫大哥别拔电击枪，我们这就退后，这就退后！”**

**当然，以天海学园森严的门禁制度，这帮连入学门槛都摸不到边的家伙，物理意义上是绝对不可能混进来的。**

**“行了行了，又不是以后都见不到了，你们在学校里也要好好上课啊，别闹事。”**

**门后还有不少学生对着门前这么一位比自己还高带着点痞气的漂亮辣妹议论纷纷。**

**然而，焦点很快就从<user>身上转移了，前方不远处的迎新大道上突然传来了一阵骚动。**

**原本热闹的新生人流像是撞上了什么无形的礁石，纷纷惊恐地向两侧退开，硬生生在路中央让出了一片真空地带。**

**“——所以说，杵在我面前干什么呀？是不想让我走吗？”**

**一道带着几分不耐烦、却又透着股蛮不讲理劲儿的娇俏嗓音在人群中央响起。**
**被堵在原地的倒霉新生脸色惨白，面对眼前这位气场惊人的学姐，吓得连半个字都吐不出来；而周围的新生们更是面面相觑，连大气都不敢喘一声，生怕一个不小心触了维多利亚的霉头。**

**看着面前像木头桩子一样呆住的新生，维多利亚挑了挑眉**

**“算咯~既然你不说话，那就在入学第一天，由可敬可亲的学姐来亲手替你长长记性吧~♪”**

**话音落下的瞬间，她脸上的笑意未减，手臂却毫不留情地高高扬起——一记凌厉的耳光带着破空声，朝着那名已经绝望闭眼的新生脸上狠狠扇了过去！**

**啪。**

**预想中清脆的耳光声并没有响起。**

**维多利亚扬在半空中的纤细手腕，还没来得及碰到新生的脸颊，就被一只突然从旁边伸出来的手掌死死钳住了——任凭她怎么暗暗发力，那只手竟都像是焊在了半空中一般，纹丝不动。**

**在全场无数道呆滞、震惊乃至难以置信的视线注视下，伸手按住维多利亚手腕的<user>只是歪了歪头，脸上还挂着一副刚从街头溜达过来的散漫表情，语重心长地叹了口气：**

**“喂喂，有事说事，可不兴对别人动手啊，小妹。再说这里可是新生入学的必经之路，怎么看都是你挡在他面前吧？”**`,
      passiveSkill: {
        id: 'p_endurance',
        name: '无限精力',
        description: '多人场景全属性提升',
        type: 'constitution',
        icon: 'Zap',
      },
      permanentState: {
        name: '活力四射',
        bonus: {
          魅力加成: -5,
          幸运加成: 10,
          基础性斗力加成: 0,
          基础性斗力成算: 18,
          基础忍耐力加成: 0,
          基础忍耐力成算: 25,
          闪避率加成: 0,
          暴击率加成: 8,
        },
      },
    },
    {
      id: 'f_traditional',
      name: '大和抚子',
      description: '传统的大家闺秀，温婉贤淑，拥有极强的忍耐力。',
      icon: 'Flower',
      passiveSkill: {
        id: 'p_patience',
        name: '隐忍不发',
        description: '受到攻击时忍耐力消耗减半',
        type: 'constitution',
        icon: 'Feather',
      },
      permanentState: {
        name: '传统美德',
        bonus: {
          魅力加成: 12,
          幸运加成: 8,
          基础性斗力加成: 0,
          基础性斗力成算: -35,
          基础忍耐力加成: 0,
          基础忍耐力成算: 45,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'f_yandere',
      name: '病娇',
      description: '爱意沉重到令人窒息，为了爱可以摧毁一切。',
      icon: 'Scissors',
      passiveSkill: {
        id: 'p_obsession',
        name: '爱之深',
        description: '对手快感越高，自身攻击越高',
        type: 'constitution',
        icon: 'Skull',
      },
      permanentState: {
        name: '病态执着',
        bonus: {
          魅力加成: 8,
          幸运加成: -10,
          基础性斗力加成: 0,
          基础性斗力成算: 40,
          基础忍耐力加成: 0,
          基础忍耐力成算: -30,
          闪避率加成: 0,
          暴击率加成: 25,
        },
      },
    },
    {
      id: 'f_chuuni',
      name: '中二侦探',
      defaultName: '左翔羽',
      defaultAge: 21,
      defaultHeight: 167,
      description: '坚信自己拥有特殊力量的电波系少女。',
      icon: 'Eye',
      fixedStart: { level: 30, rank: 'A', potential: 10 },
      startingAttributePoints: 100,
      userProfile: {
        basicInfo: `<user>，<user_age>岁，但是档案伪装成了17岁，且对外也一直这么说的。她是自营侦探事务所所长，身高<user_height>cm，外貌偏向中性的帅气但一眼就能看出是女性。她自称“美少女侦探”，老家的朋友们也乐于承认这个名号；不过比起真正侦破奇案的侦探，她平时承接的大多是寻猫觅物、调解邻里纠纷一类的日常杂务，实际更接近万事屋。她原本有一名搭档兼侦探助手时芽，此前正是为了追查时芽失踪的下落才作为一年级新生转入天海学园。

出身来说是孤儿，不过有养父养母白川一家，<user>则是仿照崇拜的特摄英雄左翔太郎起的化名。

她具备随情绪激动程度强化自身肉体的特殊能力。平日里并不会随身携带变身装备，唯有在情绪极度高昂或出离愤怒的时刻，迷失驱动器与王牌记忆体才会凭空浮现在腰间与手中，使她得以变身为“假面骑士王牌”——但平时用上的机会不多，因为星见市的魔物已经绝迹了。

正如福尔摩斯不能失去华生，她选择了暂停一切委托歇业，关闭了老家星见市的事务所。`,
        lifeStructure: '',
        characterNature: `<user>是个彻头彻尾的特摄厨，打心底崇拜各色特摄英雄与侠义侦探。她给自己的个人画像定位于潇洒的“王子系”，平时总爱摆出几分耍帅装酷的派头；无奈本人天生热情又大大咧咧，唯独缺了王子系最核心的高冷气质——因此她身上的“中二病”并非念叨莫名其妙的电波台词，而是只学了装酷架势、却藏不住热络本性所闹出的反差。

她也是个极重情义的多情之人，很容易为了他人的悲喜与不公而真心欢笑、落泪或愤怒。这份热心肠让她见不得别人受困，总忍不住主动插手管闲事，甚至常在当事人毫不知情时就单方面把对方视作自己的“委托人”。不过她的冲动仅限于决定揽事的那一刻；真正着手帮忙时，她便会拿出做侦探养成的思虑习惯，仔细权衡处理方式，免得把对方的处境搅得更加麻烦。`,
        sceneExpression: '',
      },
      openingStory: `<user>看着手中的天海学园入学通知书，回忆起神秘委托人“<RGB>响木天音</RGB>”的叮嘱。
她不仅向<user>说明了这所学校“性斗对决”的特殊情况，还再三提醒<user>“上学”期间尽量不要太显眼——这不是一个好侦探该有的表现。
“什么嘛，明明我平常都没怎么自慰过，结果就提前给我定个A级？？？”
虽然等级高是好事，但总觉得像是她们觉得自己像个淫乱的人一样
<user>原本打算低调行事，结果刚走到校门口，就撞见<RGB>莉莉娜</RGB>正当众欺负其他学生。
看不过去的<user>瞬间把“低调”抛在脑后，当着全校师生的面果断掏出驱动器变身，准备一举消灭这个作恶的魔族。
“？！魔族怎么会光天化日之下出现在学校里？”
“还敢伤害人类，那么，该细数<user>的罪恶了！”
王牌记忆体出现在<user>的右手中，迷失驱动器也同样出现在腰间。
<user>甚至像寻常一样把记忆体抛向空中然后用左手接住再插入迷失驱动器。
然而等<user>真正使出必杀“王牌终结”踹中对方时，莉莉娜不仅毫发无损，反而满脸潮红地发出好几声娇喘，当场被踢得高潮瘫软了下去。
<user>看着这一幕觉得无比奇怪，开始怀疑自己的必杀技是不是出了什么问题。
但下一秒，甚至没看清发生了什么，<user>就发现自己被瞬间转移到了学校广场的一角，还被打得强制解体了。
很明显，是面前的委托人打的。
“我说侦探小姐，我是不是提醒过<user>不要太过显眼？再这样我可要没收<user>的记忆体了哦？——虽然它依旧会飞回<user>身边。”**（以这个作为结尾）**`,
      passiveSkill: {
        id: 'p_delusion',
        name: '妄想结界',
        description: '随机免疫异常状态',
        type: 'constitution',
        icon: 'Sparkles',
      },
      permanentState: {
        name: '中二之力',
        bonus: {
          魅力加成: -10,
          幸运加成: 25,
          基础性斗力加成: 0,
          基础性斗力成算: 0,
          基础忍耐力加成: 0,
          基础忍耐力成算: -20,
          闪避率加成: 0,
          暴击率加成: 15,
        },
      },
    },
    {
      id: MAGIC_GIRL_ARCHETYPE_ID,
      name: '魔装影姬',
      description:
        '本是个平凡小透明的星见市JK，自几年前星见市魔法少女团灭事件后作为替补被女神阿斯特赖亚选为了新的魔法少女',
      icon: 'Wand',
      fixedStart: { level: 30, rank: 'A', potential: 10 },
      startingAttributePoints: 200,
      startingItems: {
        TierⅠ通行证: {
          类型: '其他',
          描述: '可自由出入权力之塔大部分道具，学生会成员的标配',
          数量: 1,
        },
      },
      userProfile: {
        basicInfo: `<user>原本是个不起眼的小透明JK，因缘际会下成为了现最强魔法少女“魔装影姬塞蕾娜克西娅”。
实际吸引力如同魅魔，只是一般不凑热闹。
有着刚入学就被校方认定为A级以上的强大实力。
受到响木天音的推荐和邀请转入天海学园，同样肩负着女神阿斯特赖亚寻找苍蓝星的期望。

她身高只有162cm，肤色白皙，身形纤细却有着丰满的胸围。平时是一副乖巧的女高中生打扮，留着发尾渐变成浅蓝的深蓝色波波头，紫瞳，别着银色蓝宝石花朵发夹，穿白衬衫、深蓝百褶裙和黑丝连裤袜。

变身后头发会变成内侧闪烁着星光的银蓝色长发，戴着新月图案的浅蓝蝴蝶结，眼眸也转为紫蓝渐变。身上则会换上一套带有发光浅蓝纹路的黑蓝紧身无袖魔装，配着黑丝裤袜与长手套

作为情绪感知特化的魔法少女，<user>对人的情绪有着极为敏锐的感知力。越是激烈的情感就越能无上限地增幅她的体能与魔力输出量级；只要和他人建立起友谊及以上的联系的话就能通过情感[Link]借用对方的力量或是召唤以对方信息为蓝本的眷属。即便是不变身也能使用部分能力`,
        lifeStructure: `转入现在的学校后，<user>的生活基本与过去的魔法少女事务隔开，平时在校园里维持着不引人注目的普通学生日常，有时会去图书馆借漫画看。`,
        characterNature: `<user>虽曾憧憬传奇魔法少女“苍蓝星”的事迹，但当强大的力量真正落到自己身上时，比起耀眼的风波，她反而更贪恋两点一线的归宅日常，觉得平淡安稳的日子一点也不错。

她天生共情极深，他人的喜怒哀乐在她心里很有分量，会真情实感地为别人的遭遇悲伤落泪或开怀大笑，这份敏锐与赤诚正是她作为“魔装影姬”感知情绪、缔结情感联结的根源。在人际交往中，她对建立羁绊抱有很开放的心态，也很乐意与人交好。她明白人际往来本就是利益与感情交织，因此并不排斥带有目的的接近；她衡量他人的底线很简单，只看对方有没有害自己的心思。

平日里她性子软糯随和，哪怕遇上没分寸的玩笑也往往顺手糊弄过去——这只是因为她不喜欢当面呛声，免得无端结怨、惹来麻烦。但这份温和绝非软弱，她心里有着不输给苍蓝星的强烈正义感；一旦遇上真正的欺凌，无论针对他人还是自己，她都绝不容许，定会毫不犹豫地站出来死守到底、半步不退。`,
        sceneExpression: '',
      },
      openingStory: `站在天海学园那座气派得有些过分的正门前，<user>低头反复打量着手里的入学通知书，又悄悄抬起眼皮瞟向身旁擦肩而过的其他新生。

纯白信封、纯白信封、还是纯白信封……唯有<user>手里这一封，不仅压着繁复的暗金花纹，连封口处的火漆印都闪着莫名尊贵的光泽。

“诶多...怎么感觉……比其他人的显眼不少？”

<user>捏着信封边缘，忍不住小声嘀咕了一句。

说实话，直到现在<user>都没搞懂，为什么自己会突然收到这所“世界第四学园”的入学通知。明明在这之前，<user>也只不过是个名不见经传的小透明魔法少女而已。如果不是因为前阵子那场轰动各界的“魔法少女集体死亡事件”，再加上立于顶点的那位『苍蓝星』至今下落不明……现在的<user>，大概也只会作为一名随处可见的普通JK，在某所普通高中里过着平淡的日常吧。

正当<user>对着通知书出神时，校门口原本嘈杂的人声忽然像潮水般向两侧退开。

一名挂着风纪委员会臂章的少女穿过人群走来。她身上原本还带着几分应付四周视线的清冷气场，可在目光落定在<user>手里的暗金信封上后，眉眼便自然地舒展开来。

“啊，找到了。看你拿着那封显眼的通知书发呆，一眼就认出来啦。”

少女停在<user>面前，语气熟稔又温和：

“欢迎来到天海学园，<user>同学。我是风纪委员长神崎凛——别紧张，今天不是来查风纪的，只是受响木前辈委托，专程来引领你参观学校。”

她的话音刚落，原本还在讨论分班的新生们瞬间炸开了锅。“那是风纪委员长吧？”“为什么会亲自来校门口接一个新生？”“刚刚她是不是提到了响木前辈？”之类的窃窃私语此起彼伏，转眼间便把两人围在了视线的中心。

神崎凛有些无奈地瞥了一眼四周伸长脖子的围观人群，随手拨了拨耳边的碎发，朝<user>露出一个略带歉意的微笑：

“抱歉呢，好像害你一下子变成备受瞩目的焦点了。我们边走边说吧？”

她放缓脚步与<user>并肩而行，声音清晰地传入耳中：

“首先是关于后续的『新生分班赛』。原则上来说，<user>同学其实不必参加哦——因为校方和学生会一致认为你已经拥有『A档』的实力，所以出席与否全看你的意思。”

说到这，神崎凛顿了顿，像是想起了委托人交代时的模样，忍不住轻笑了一声：

“不过呢，响木前辈特意强调了一点——『如果要参加，就务必要压倒所有新生』……真是的，前辈明明自己把向导的工作推给我，提起要求来还是一如既往地乱来呢。”

趁着周围偷听的新生们还没从这句惊人的评价里回过神，神崎凛已经从制服口袋里夹出一张泛着暗金光泽的卡片，顺手递到了<user>面前：

“还有这个东西得交给你，学生会成员标配的『Tier Ⅰ』通行证。响木前辈的意思是，你可以随时直接来学生会。当然啦，这完全看<user>同学自身的意愿，如果明确不愿意的话，我们也会在事后回收这张通行证。”
**（注:在场没有任何人知道响木天音是苍蓝星，包括<user>。响木天音也不会在这留下任何自爆身份的信息）**`,
      mechanisms: [MAGIC_GIRL_BOND_MECHANISM],
      passiveSkill: {
        id: 'p_magic_armor_shadow_princess',
        name: '魔装影姬',
        description: '',
        effectDescription: `魅力+30，幸运+30，性斗力成算+50%，忍耐力成算+50%，闪避率+15%，暴击率+15%。固定以30级、A-rank、10潜力开局，开局等级与潜力不可调整且不消耗加点额度。${MAGIC_GIRL_BOND_MECHANISM.description}`,
        type: 'constitution',
        icon: 'Sparkles',
      },
      permanentState: {
        name: '魔装影姬',
        bonus: {
          魅力加成: 30,
          幸运加成: 30,
          基础性斗力加成: 0,
          基础性斗力成算: 50,
          基础忍耐力加成: 0,
          基础忍耐力成算: 50,
          闪避率加成: 15,
          暴击率加成: 15,
        },
      },
      hidden: true,
    },
    {
      id: 'f_bimbo',
      name: '笨蛋大小姐',
      description: '出身优渥、架子十足，却总在关键时刻露出迷糊一面的大小姐。',
      icon: 'Gem',
      passiveSkill: {
        id: 'p_airhead',
        name: '无防备',
        description: '所有控制类技能必定命中',
        type: 'constitution',
        icon: 'HelpCircle',
      },
      permanentState: {
        name: '无脑美人',
        bonus: {
          魅力加成: 40,
          幸运加成: 10,
          基础性斗力加成: 0,
          基础性斗力成算: -50,
          基础忍耐力加成: 0,
          基础忍耐力成算: -40,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
  ],
  [Gender.OTHER]: [
    {
      id: 'o_succubus',
      name: '魅魔体质',
      description: '以精气为食，生来就是为了掠夺快感的特殊存在。',
      icon: 'Heart',
      passiveSkill: {
        id: 'p_drain',
        name: '精气汲取',
        description: '高潮时吸取对方体力',
        type: 'constitution',
        icon: 'Heart',
      },
      permanentState: {
        name: '魅魔之体',
        bonus: {
          魅力加成: 25,
          幸运加成: 12,
          基础性斗力加成: 0,
          基础性斗力成算: 22,
          基础忍耐力加成: 0,
          基础忍耐力成算: -35,
          闪避率加成: 0,
          暴击率加成: 15,
        },
      },
    },
    {
      id: 'o_mystery',
      name: '克苏鲁',
      description: '无法被定义的某种存在，充满未知的诱惑与恐惧。',
      icon: 'Ghost',
      passiveSkill: {
        id: 'p_chaos',
        name: '不可名状',
        description: '身体构造可随心改变',
        type: 'constitution',
        icon: 'Ghost',
      },
      permanentState: {
        name: '不可名状',
        bonus: {
          魅力加成: -15,
          幸运加成: 0,
          基础性斗力加成: 0,
          基础性斗力成算: 25,
          基础忍耐力加成: 0,
          基础忍耐力成算: 25,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'o_doll',
      name: '活体人偶',
      description: '精致如人偶般的存在，痛觉迟钝，唯命是从。',
      icon: 'User',
      passiveSkill: {
        id: 'p_doll',
        name: '无心之躯',
        description: '大幅降低受到的精神伤害',
        type: 'constitution',
        icon: 'Shield',
      },
      permanentState: {
        name: '人偶之躯',
        bonus: {
          魅力加成: 30,
          幸运加成: 0,
          基础性斗力加成: 0,
          基础性斗力成算: -60,
          基础忍耐力加成: 0,
          基础忍耐力成算: 50,
          闪避率加成: 0,
          暴击率加成: 0,
        },
      },
    },
    {
      id: 'o_beast',
      name: '兽化人',
      description: '保留了野兽本能的亚人，感官敏锐，行动迅捷。',
      icon: 'Cat',
      passiveSkill: {
        id: 'p_instinct',
        name: '野性直觉',
        description: '必定闪避致命的一击',
        type: 'constitution',
        icon: 'Wind',
      },
      permanentState: {
        name: '野兽本能',
        bonus: {
          魅力加成: -8,
          幸运加成: 12,
          基础性斗力加成: 0,
          基础性斗力成算: 15,
          基础忍耐力加成: 0,
          基础忍耐力成算: 10,
          闪避率加成: 25,
          暴击率加成: 10,
        },
      },
    },
    {
      id: 'o_cyborg',
      name: '机娘',
      description: '全身义体化的改造人，拥有精密的计算能力与震动功能。',
      icon: 'Cpu',
      passiveSkill: {
        id: 'p_vibrate',
        name: '高频震动',
        description: '接触即造成持续快感伤害',
        type: 'constitution',
        icon: 'Zap',
      },
      permanentState: {
        name: '机械改造',
        bonus: {
          魅力加成: -20,
          幸运加成: -10,
          基础性斗力加成: 0,
          基础性斗力成算: 25,
          基础忍耐力加成: 0,
          基础忍耐力成算: 35,
          闪避率加成: 0,
          暴击率加成: 10,
        },
      },
    },
  ],
};

export const canSelectArchetype = (archetype: Archetype, data: Pick<CharacterData, 'name' | 'gender'>): boolean => {
  return (ARCHETYPES[data.gender] ?? []).some(identity => identity.id === archetype.id);
};

export const getAvailableArchetypes = (data: Pick<CharacterData, 'name' | 'gender'>): Archetype[] => {
  const archetypes = ARCHETYPES[data.gender] || ARCHETYPES[Gender.OTHER];
  return archetypes.filter(archetype => canSelectArchetype(archetype, data));
};

// --- Active Skills (20+) ---

export const ACTIVE_SKILLS: Skill[] = [
  {
    id: 's_strip',
    name: '衣物破坏',
    description: '【攻击】强行撕裂对方衣物',
    effectDescription: '减少对方防御',
    type: 'active',
    icon: 'Scissors',
  },
  {
    id: 's_tease',
    name: '指尖挑逗',
    description: '【攻击】精细的爱抚敏感点',
    effectDescription: '造成少量快感',
    type: 'active',
    icon: 'HandPointer',
  },
  {
    id: 's_observe',
    name: '弱点洞察',
    description: '【辅助】观察对方身体',
    effectDescription: '下回合暴击率提升',
    type: 'active',
    icon: 'Eye',
  },
  {
    id: 's_kiss',
    name: '深吻',
    description: '【攻击】交换唾液的深吻',
    effectDescription: '造成快感并封锁语言',
    type: 'active',
    icon: 'Kiss',
  },
  {
    id: 's_spank',
    name: '羞耻拍打',
    description: '【攻击】拍打臀部',
    effectDescription: '提高对方敏感与快感',
    type: 'active',
    icon: 'Hand',
  },
  {
    id: 's_dirtytalk',
    name: '污言秽语',
    description: '【精神】用言语侮辱对方',
    effectDescription: '降低对方忍耐力',
    type: 'active',
    icon: 'Comment',
  },
  {
    id: 's_pheromone',
    name: '费洛蒙',
    description: '【领域】散发催情气味',
    effectDescription: '每回合持续增加快感',
    type: 'active',
    icon: 'Wind',
  },
  {
    id: 's_camera',
    name: '偷拍视角',
    description: '【精神】记录羞耻画面',
    effectDescription: '大幅降低对方意志',
    type: 'active',
    icon: 'Camera',
  },
  {
    id: 's_toy',
    name: '道具使用',
    description: '【特殊】使用随身玩具',
    effectDescription: '效果取决于道具',
    type: 'active',
    icon: 'Lightning',
  },
  {
    id: 's_foot',
    name: '足技',
    description: '【攻击】用脚挑逗',
    effectDescription: '带有羞辱性质的快感',
    type: 'active',
    icon: 'Footprints',
  },
  {
    id: 's_bind',
    name: '束缚',
    description: '【控制】限制对方行动',
    effectDescription: '降低对方闪避率',
    type: 'active',
    icon: 'Chain',
  },
  {
    id: 's_massage',
    name: '精油按摩',
    description: '【特殊】推油按摩',
    effectDescription: '降低防御，增加敏感度',
    type: 'active',
    icon: 'Droplets',
  },
  {
    id: 's_flash',
    name: '露出',
    description: '【精神】展示私密部位',
    effectDescription: '对纯情角色造成暴击',
    type: 'active',
    icon: 'Sparkles',
  },
  {
    id: 's_beg',
    name: '求饶',
    description: '【防御】楚楚可怜地求饶',
    effectDescription: '降低对方性斗力',
    type: 'active',
    icon: 'Sad',
  },
  {
    id: 's_taunt',
    name: '挑衅',
    description: '【精神】嘲讽对方的技术',
    effectDescription: '增加对方怒气但降低防御',
    type: 'active',
    icon: 'Grin',
  },
  {
    id: 's_force',
    name: '强行压制',
    description: '【控制】利用体格压制',
    effectDescription: '封锁对方物理行动',
    type: 'active',
    icon: 'Dumbbell',
  },
  {
    id: 's_deny',
    name: '寸止',
    description: '【特殊】在关键时刻停手',
    effectDescription: '积累大量压力值',
    type: 'active',
    icon: 'HandFist',
  },
  {
    id: 's_worship',
    name: '崇拜',
    description: '【精神】奉对方为主人',
    effectDescription: '缓和对方攻势，降低自身压迫感',
    type: 'active',
    icon: 'Crown',
  },
  {
    id: 's_aphrodisiac',
    name: '媚药投毒',
    description: '【道具】悄悄下药',
    effectDescription: '赋予持续快感状态',
    type: 'active',
    icon: 'Flask',
  },
  {
    id: 's_charm_kiss',
    name: '魅惑之吻',
    description: '【攻击】用魅惑的吻技攻击',
    effectDescription: '造成50%魅力伤害，降低目标忍耐力',
    type: 'active',
    icon: 'Heart',
  },
  {
    id: 's_counter',
    name: '快速反击',
    description: '【攻击】在闪避后立即反击',
    effectDescription: '造成80%性斗力伤害，无视防御',
    type: 'active',
    icon: 'Shield',
  },
  {
    id: 's_lucky_strike',
    name: '幸运一击',
    description: '【攻击】依靠运气发动的强力攻击',
    effectDescription: '造成60%性斗力+40%幸运伤害',
    type: 'active',
    icon: 'Clover',
  },
];

// --- Constitution/Passive Skills (Gender Specific) ---

const COMMON_PASSIVES: Skill[] = [
  {
    id: 'c_thick_skin',
    name: '钝感',
    description: '感官比较迟钝',
    effectDescription: '受到的快感伤害-30%',
    type: 'constitution',
    icon: 'Shield',
  },
  {
    id: 'c_quick_recovery',
    name: '回复体质',
    description: '体力恢复很快',
    effectDescription: '每回合回复5%耐力',
    type: 'constitution',
    icon: 'Heartbeat',
  },
  {
    id: 'c_flexible',
    name: '身体柔软',
    description: '可以做出高难度动作',
    effectDescription: '闪避率+10%，解锁特殊体位',
    type: 'constitution',
    icon: 'Yoga',
  },
  {
    id: 'c_exhibitionist',
    name: '暴露狂',
    description: '被人注视会兴奋',
    effectDescription: '围观人数越多全属性越高',
    type: 'constitution',
    icon: 'Eye',
  },
  {
    id: 'c_m_physique',
    name: 'M属性',
    description: '享受痛苦与羞辱',
    effectDescription: '受到的精神伤害转化为快感',
    type: 'constitution',
    icon: 'HeartPulse',
  },
  {
    id: 'c_s_physique',
    name: 'S属性',
    description: '以施虐为乐',
    effectDescription: '攻击造成额外精神伤害',
    type: 'constitution',
    icon: 'Crown',
  },
];

export const PASSIVE_SKILLS: Record<Gender, Skill[]> = {
  [Gender.MALE]: [
    ...COMMON_PASSIVES,
    {
      id: 'c_iron_cock',
      name: '钢铁巨根',
      description: '坚硬如铁',
      effectDescription: '攻击力+20%',
      type: 'constitution',
      icon: 'Dumbbell',
    },
    {
      id: 'c_stamina_monster',
      name: '耐力怪物',
      description: '不知疲倦',
      effectDescription: '最大耐力+100',
      type: 'constitution',
      icon: 'Lightning',
    },
    {
      id: 'c_prostate_master',
      name: '前列腺开发',
      description: '弱点开发',
      effectDescription: '后庭敏感度x3',
      type: 'constitution',
      icon: 'Target',
    },
  ],
  [Gender.FEMALE]: [
    ...COMMON_PASSIVES,
    {
      id: 'c_sensitive_nips',
      name: '乳首开发',
      description: '胸部极为敏感',
      effectDescription: '胸部受到攻击快感x2',
      type: 'constitution',
      icon: 'Target',
    },
    {
      id: 'c_wet',
      name: '淫乱体质',
      description: '极易动情',
      effectDescription: '初始快感+20，爱液分泌增加',
      type: 'constitution',
      icon: 'Droplets',
    },
    {
      id: 'c_dry',
      name: '石女/白虎',
      description: '难以动情',
      effectDescription: '快感积累速度-20%',
      type: 'constitution',
      icon: 'Snowflake',
    },
    {
      id: 'c_tongue',
      name: '名器之舌',
      description: '舌头灵活',
      effectDescription: '口技效果+50%',
      type: 'constitution',
      icon: 'Fire',
    },
    {
      id: 'c_voice',
      name: '娇喘',
      description: '声音好听',
      effectDescription: '受击时的叫声会对周围造成精神伤害',
      type: 'constitution',
      icon: 'Music',
    },
    {
      id: 'c_scent',
      name: '体香',
      description: '天生自带香气',
      effectDescription: '对手每回合快感+2',
      type: 'constitution',
      icon: 'Seedling',
    },
  ],
  [Gender.OTHER]: [
    ...COMMON_PASSIVES,
    {
      id: 'c_sensitive_nips',
      name: '乳首开发',
      description: '胸部极为敏感',
      effectDescription: '胸部受到攻击快感x2',
      type: 'constitution',
      icon: 'Target',
    },
    {
      id: 'c_wet',
      name: '淫乱体质',
      description: '极易动情',
      effectDescription: '初始快感+20，爱液分泌增加',
      type: 'constitution',
      icon: 'Droplets',
    },
    {
      id: 'c_voice',
      name: '娇喘',
      description: '声音好听',
      effectDescription: '受击时的叫声会对周围造成精神伤害',
      type: 'constitution',
      icon: 'Music',
    },
    {
      id: 'c_scent',
      name: '体香',
      description: '天生自带香气',
      effectDescription: '对手每回合快感+2',
      type: 'constitution',
      icon: 'Seedling',
    },
    {
      id: 'c_mutable',
      name: '不定形',
      description: '身体结构不稳定',
      effectDescription: '免疫暴击',
      type: 'constitution',
      icon: 'Ghost',
    },
  ],
};

// 属性最大值（用于角色创建时的限制）
export const MAX_STATS = {
  '角色基础._等级': 20,
  '核心状态._潜力': 10.0,
  '基础属性._魅力': 100,
  '基础属性._幸运': 100,
  '核心状态.$最大耐力': 500,
  '核心状态.$最大快感': 500,
  '基础属性._闪避率': 60,
  '基础属性._暴击率': 100,
};

// 属性最小值（用于角色创建时的限制）
export const MIN_STATS = {
  '角色基础._等级': 1,
  '核心状态._潜力': 5.0,
  '基础属性._魅力': 0,
  '基础属性._幸运': 0,
  '核心状态.$最大耐力': 1,
  '核心状态.$最大快感': 1,
  '基础属性._闪避率': 0,
  '基础属性._暴击率': 0,
};

export const DIFFICULTY_POINTS = {
  '剧情模式 (简单)': 100,
  '学园生活 (普通)': 60,
  '地狱开局 (困难)': 30,
  作弊者: 999,
  抖M: 400,
};

export const MAINLINE_TIMELINE_TALENT_BONUS: Record<MainlineTimeline, number> = {
  [MainlineTimeline.NONE]: 0,
  [MainlineTimeline.IDOL]: 20,
  [MainlineTimeline.SPORTS]: 40,
  [MainlineTimeline.FESTIVAL]: 60,
  [MainlineTimeline.MIDTERM]: 80,
  [MainlineTimeline.SUMMER]: 100,
};

export const CUP_SIZES = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I+', 'Z'];

export const GENITAL_TYPES = {
  [Gender.MALE]: ['标准', '巨根', '短小', '包茎', '形状优美', '青筋暴露', '珍珠疹', '极粗', '倒钩', '发光'],
  [Gender.FEMALE]: ['标准', '白虎', '馒头穴', '一线天', '蝴蝶穴', '粉嫩', '色素沉淀', '多水', '紧致', '名器'],
  // 非二元角色使用男性/女性性器特征，不再有独立的选项
};
