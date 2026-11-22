/**
 * CG配置数据
 * 用于战斗结束后显示对应的CG图片
 */

import { resolveEnemyName } from '../enemyDatabase';

export interface CGEvent {
  id: string;
  name: string;
  description: string;
  images: string[]; // 图片文件名列表
  probability?: number; // 特殊概率，不填则为普通事件
}

export interface CharacterCGConfig {
  characterName: string; // 角色中文全名
  male: {
    defeat: CGEvent[]; // 男u战败事件
    victory: CGEvent[]; // 男u战胜事件
  };
  female: {
    defeat: CGEvent[]; // 女u战败事件
    victory: CGEvent[]; // 女u战胜事件
  };
}

// 星野光的CG配置
const xingYeGuangConfig: CharacterCGConfig = {
  characterName: '星野光',
  male: {
    defeat: [
      {
        id: 'leather_shoe_squeeze',
        name: '星野光-皮鞋压榨事件',
        description: '你被星野光击败，作为惩罚，她会用小皮鞋透过裤子摩擦你的下体。',
        images: ['星野光-皮鞋压榨事件-1.png', '星野光-皮鞋压榨事件-2.png'],
      },
      {
        id: 'butt_tease_denial',
        name: '星野光-淫臀摩擦寸止事件',
        description:
          '你被星野光击败，作为惩罚她坐在你身上，全部会用皮筋捆住你的下体，同时臀部寸止摩擦你的下体让你想射但是射不出。',
        images: ['星野光-淫臀摩擦寸止事件-1.png', '星野光-淫臀摩擦寸止-2.png'],
      },
      {
        id: 'anal_development',
        name: '星野光-后穴开发事件',
        description: '你被星野光击败，作为惩罚她会坐在你身上，同时用应援棒开发你的屁穴，并且玩弄全身。',
        images: ['星野光-后穴开发事件-1.png', '星野光-后穴开发事件-2.png'],
      },
      {
        id: 'footjob_milking',
        name: '星野光-足交榨精事件',
        description: '你被星野光击败，作为惩罚她会坐在你身上，同时用脚灵活榨精。',
        images: ['星野光-足交榨精事件-1.png', '星野光-足交榨精事件-2.png'],
      },
      {
        id: 'restraint_tease_denial',
        name: '星野光-拘束摩擦寸止事件',
        description:
          '你被星野光击败，作为惩罚她坐在你身上，全部会用皮筋捆住你的下体，同时用蜜穴摩擦寸止，让你的下体让你想射但是射不出。',
        images: ['星野光-拘束摩擦寸止事件.png'],
      },
      {
        id: 'loyalty_extraction',
        name: '星野光-榨取效忠事件',
        description:
          '你被星野光击败，作为惩罚她坐在你身上，小穴进行高速榨精，同时用白丝脚气味洗脑，并且希望你成为她的经纪人，若以成为经纪人则会用更加爱意方式调教。',
        images: ['星野光-榨取效忠事件.png'],
      },
      {
        id: 'forced_slave_brainwash',
        name: '（稀有事件）星野光-强制奴隶洗脑事件',
        description: '你被星野光击败，作为惩罚她会用演出完白丝脚洗脑你，并希望你签下奴隶条约。',
        images: ['星野光-强制奴隶洗脑事件.png'],
        probability: 0.06, // 6%概率
      },
      {
        id: 'handjob_milking',
        name: '星野光-手交榨精事件',
        description: '你被星野光击败，作为惩罚她会用手灵活榨精。',
        images: ['星野光-手交榨精事件-1.png', '星野光-手交榨精事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'victory_reward',
        name: '星野光-战胜事件',
        description: '你战胜了星野光，作为奖励，她会让你处置调教作为奖励。',
        images: ['星野光-战胜事件.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'idol_invitation',
        name: '星野光-偶像邀约事件',
        description: '你被星野光击败，作为惩罚她将你捆绑起来并强制邀请你参加她的偶像活动，让你成为她的专属粉丝。',
        images: ['星野光-偶像邀约事件-1.png', '星野光-偶像邀约事件-2.png'],
      },
      {
        id: 'idol_riding',
        name: '星野光-偶像骑乘事件',
        description: '你被星野光击败，作为惩罚她把你当作偶像舞台，骑乘在你身上进行调教表演。',
        images: ['星野光-偶像骑乘事件-1.png', '星野光-偶像骑乘事件-2.png'],
      },
      {
        id: 'forced_foot_licking',
        name: '星野光-强制舔脚事件',
        description: '你被星野光击败，作为惩罚她将你用龟甲缚捆绑并命令你舔她的脚，让你成为她的忠实粉丝。',
        images: ['星野光-强制舔脚事件-1.png', '星野光-强制舔脚事件-2.png'],
      },
      {
        id: 'yuri_love',
        name: '星野光-百合欢爱事件',
        description: '你被星野光击败，作为惩罚她将你压在身下与你进行百合欢爱，让你体验偶像强势的一面。',
        images: ['星野光-百合欢爱事件-1.png', '星野光-百合欢爱事件-2.png', '星野光-百合欢爱事件-3.png'],
      },
    ],
    victory: [
      {
        id: 'victory_reward',
        name: '星野光-战胜事件',
        description: '你战胜了星野光，作为奖励她让你体验偶像的特别服务。',
        images: ['星野光-战胜事件-1.png', '星野光-战胜事件-2.png'],
      },
    ],
  },
};

// 伊丽莎白夜羽的CG配置（无战胜CG）
const yiLiShaBaiYeYuConfig: CharacterCGConfig = {
  characterName: '伊丽莎白夜羽',
  male: {
    defeat: [
      {
        id: 'necklock_footjob',
        name: '伊丽莎白夜羽-锁头足交事件',
        description: '你被伊丽莎白击败，作为惩罚，她用大腿强力锁住你脖子限制呼吸来放大足交的快感并强迫你舔她阴部',
        images: [
          '伊丽莎白夜羽-锁头足交事件-1.png',
          '伊丽莎白夜羽-锁头足交事件-2.png',
          '伊丽莎白夜羽-锁头足交事件-3.png',
        ],
      },
      {
        id: 'leather_shoe_smell',
        name: '伊丽莎白夜羽-皮鞋臭脚事件',
        description: '你被伊丽莎白击败，作为惩罚，她将脱下皮鞋塞你脸上强制闻嗅内部气味，同时对你进行羞辱性的足交惩罚',
        images: ['伊丽莎白夜羽-皮鞋臭脚事件-1.png'],
      },
      {
        id: 'no_cum_challenge',
        name: '伊丽莎白夜羽-不要射挑战事件',
        description:
          '你被伊丽莎白击败，作为惩罚，她让你以犬类姿态趴伏于其脚边舔舐其丝足，期间严禁擅自射精，否则将强制延长惩罚时间直至其满意。',
        images: [
          '伊丽莎白夜羽-不要射挑战事件-1.png',
          '伊丽莎白夜羽-不要射挑战事件-2.png',
          '伊丽莎白夜羽-不要射挑战事件-3.png',
          '伊丽莎白夜羽-不要射挑战事件-4.png',
        ],
      },
      {
        id: 'collar_rope_bondage',
        name: '伊丽莎白夜羽-项圈捆绑事件',
        description:
          '你被伊丽莎白击败，作为惩罚，她给你套上了项圈且全身用绳束缚，你被迫躺在地上屈辱地舔舐侍奉她的双足以满足其征服欲',
        images: ['伊丽莎白夜羽-项圈捆绑事件-1.png', '伊丽莎白夜羽-项圈捆绑事件-2.png'],
      },
      {
        id: 'genderbend_milking',
        name: '伊丽莎白夜羽-性转榨精事件',
        description: '你被伊丽莎白击败，作为惩罚，你将被改造为保留男性生殖器的女性外貌',
        images: [
          '伊丽莎白夜羽-性转榨精事件-1.png',
          '伊丽莎白夜羽-性转榨精事件-2.png',
          '伊丽莎白夜羽-性转榨精事件-3.png',
        ],
      },
      {
        id: 'wax_prostate_massage',
        name: '伊丽莎白夜羽-滴蜡前列腺按摩事件',
        description: '你被伊丽莎白击败，作为惩罚，她把蜡烛滴在你胸膛上并对你进行前列腺按摩',
        images: ['伊丽莎白夜羽-滴蜡前列腺按摩事件-1.png'],
      },
      {
        id: 'redwine_foot_humiliation',
        name: '伊丽莎白夜羽-红酒足交羞辱事件',
        description:
          '你被伊丽莎白击败，作为惩罚，她强行将红酒灌入你口中并倾倒遍身以示羞辱，同时利用沾满酒液的双足对你下体进行踩踏与夹弄，在红酒流淌的触感中通过足交控制你的生理反应',
        images: [
          '伊丽莎白夜羽-红酒足交羞辱事件-1.png',
          '伊丽莎白夜羽-红酒足交羞辱事件=2.png',
          '伊丽莎白夜羽-红酒足交羞辱事件-3.png',
          '伊丽莎白夜羽-红酒足交羞辱事件-4.png',
        ],
      },
      {
        id: 'vampire_blood_milking_rare',
        name: '（稀有事件）伊丽莎白夜羽-吸血榨精事件',
        description:
          '你被伊丽莎白击败，作为惩罚，她将一边吸你血一边对你进行足交，期间严禁未经许可射精，否则将被强制穿戴贞操锁——4%',
        images: [
          '伊丽莎白夜羽-吸血榨精事件-1.png',
          '伊丽莎白夜羽-吸血榨精事件-2.png',
          '伊丽莎白夜羽-吸血榨精事件-3.png',
          '伊丽莎白夜羽-吸血榨精事件-4.png',
        ],
        probability: 0.04,
      },
      {
        id: 'ego_removal_milking_rare',
        name: '（稀有事件）伊丽莎白夜羽-人格排出榨精事件',
        description:
          '你被伊丽莎白击败，作为惩罚，你将被改造为保留男性生殖器的女性外貌，且每次射精都会伴随阴茎缩小与记忆流失直至彻底丧失自我与男性特征，沦为完全服从的吸血鬼人妖眷属——4%',
        images: [
          '伊丽莎白夜羽-人格排出榨精事件-1.png',
          '伊丽莎白夜羽-人格排出榨精事件-2.png',
          '伊丽莎白夜羽-人格排出榨精事件-3.png',
          '伊丽莎白夜羽-人格排出榨精事件-4.png',
        ],
        probability: 0.04,
      },
    ],
    victory: [],
  },
  female: {
    defeat: [
      {
        id: 'wax_play',
        name: '伊丽莎白夜羽-滴蜡事件',
        description:
          '你被伊丽莎白击败，作为惩罚，她会手持燃烧的蜡烛将滚烫蜡油滴落在玩家的乳头、腹部及大腿内侧，同时用手指强行插入其小穴内部进行剧烈扣弄，迫使玩家同时承受皮肤灼痛与体内侵犯的双重刺激',
        images: ['伊丽莎白夜羽-滴蜡事件-1.png', '伊丽莎白夜羽-滴蜡事件-2.png'],
      },
      {
        id: 'forced_lactation',
        name: '伊丽莎白夜羽-强制喂乳事件',
        description: '你被伊丽莎白击败，作为惩罚，她将你悬挂束缚且暴露胸部，通过药物强制催乳并将你视为母亲直接吸乳',
        images: [
          '伊丽莎白夜羽-强制喂乳事件-1.png',
          '伊丽莎白夜羽-强制喂乳事件-2.png',
          '伊丽莎白夜羽-强制喂乳事件-3.png',
          '伊丽莎白夜羽-强制喂乳事件-4.png',
        ],
      },
      {
        id: 'bondage_collar',
        name: '伊丽莎白夜羽-捆绑事件',
        description:
          '你被伊丽莎白击败，作为惩罚，她强行给你戴上项圈以宣示主权并用绳索紧缚限制行动。同时将你作为人体椅子坐于身下，迫使你在无法反抗的屈辱中承受她的重量',
        images: ['伊丽莎白夜羽-捆绑事件-1.png', '伊丽莎白夜羽-捆绑事件-2.png', '伊丽莎白夜羽-捆绑事件-3.png'],
      },
      {
        id: 'duel_beads',
        name: '伊丽莎白夜羽-“对决”事件',
        description:
          '你被伊丽莎白击败，但你们两人的“决斗”并未结束，伊丽莎白将连体肛珠两端分别塞入双方后庭建立物理连接，两人在互相牵制中拉扯珠串以考验括约肌控制力，迫使对方先因疼痛或快感导致珠串滑出者获胜',
        images: [
          '伊丽莎白夜羽-“对决”事件-1.png',
          '伊丽莎白夜羽-“对决”事件-2.png',
          '伊丽莎白夜羽-“对决”事件-3.png',
          '伊丽莎白夜羽-“对决”事件-4.png',
        ],
      },
      {
        id: 'anal_training',
        name: '伊丽莎白夜羽-肛门调教事件',
        description: '你被伊丽莎白击败，作为惩罚，她的手指不断地抠动、挖掘你的屁穴内部',
        images: [
          '伊丽莎白夜羽-肛门调教事件-1.png',
          '伊丽莎白夜羽-肛门调教事件-2.png',
          '伊丽莎白夜羽-肛门调教事件-3.png',
          '伊丽莎白夜羽-肛门调教事件-4.png',
        ],
      },
      {
        id: 'forced_cunnilingus',
        name: '伊丽莎白夜羽-舔穴事件',
        description: '你被伊丽莎白击败，作为惩罚，你被她压在身下强制舔她的小穴',
        images: ['伊丽莎白夜羽-舔穴事件-1.png', '伊丽莎白夜羽-舔穴事件-2.png'],
      },
      {
        id: 'vassal_ritual_rare',
        name: '（稀有事件）伊丽莎白夜羽-眷属仪式事件',
        description: '你被伊丽莎白击败，这一次的惩罚不同，她把你转化成了对自己绝对忠诚的女性吸血鬼眷属',
        images: [
          '伊丽莎白夜羽-眷属仪式事件-1.png',
          '伊丽莎白夜羽-眷属仪式事件-2.png',
          '伊丽莎白夜羽-眷属仪式事件-3.png',
        ],
        probability: 0.04,
      },
      {
        id: 'lonely_bride_rare',
        name: '（稀有事件）伊丽莎白夜羽-孤独血族的新娘事件',
        description:
          '你被伊丽莎白击败，但她并不想惩罚你，因为无法忍受内心的极度孤独边利用武力强迫你与她结婚，从而确立了充满支配欲与占有欲、将你视为永久伴侣的强制婚姻关系。（不愿将你转化的版本）',
        images: [
          '伊丽莎白夜羽-孤独血族的新娘事件-1.png',
          '伊丽莎白夜羽-孤独血族的新娘事件-2.png',
          '伊丽莎白夜羽-孤独血族的新娘事件-3.png',
        ],
        probability: 0.04,
      },
      {
        id: 'lonely_eternal_bride_rare',
        name: '（稀有事件）伊丽莎白夜羽-孤独血族与永恒的新娘事件',
        description:
          '你被伊丽莎白击败，但她并不想惩罚你，因为无法忍受内心的极度孤独边利用武力强迫你与她结婚，从而确立了充满支配欲与占有欲、将你视为永久伴侣的强制婚姻关系。但她也害怕过了几十年会失去你，便选择把你转化成吸血鬼。',
        images: [
          '伊丽莎白夜羽-孤独血族与永恒的新娘事件-1.png',
          '伊丽莎白夜羽-孤独血族与永恒的新娘事件-2.png',
          '伊丽莎白夜羽-孤独血族与永恒的新娘事件-3.png',
          '伊丽莎白夜羽-孤独血族与永恒的新娘事件-4.png',
        ],
        probability: 0.04,
      },
      {
        id: 'bloodline_madonna_rare',
        name: '（稀有事件）伊丽莎白夜羽-血族圣母事件',
        description:
          '你被伊丽莎白击败，但她并不想惩罚你，你将被强制赋予母亲身份并索取哺乳，并因被唤醒母性本能使你认知渐渐扭曲，将伊丽莎白视为亲生女儿，最终导致自身生理转化为吸血鬼并彻底丧失自我，沦为永远陪伴并填补伊丽莎白内心空虚的专属血族母亲——6％',
        images: ['伊丽莎白夜羽-血族圣母事件-1.png'],
        probability: 0.06,
      },
    ],
    victory: [],
  },
};

// 莎拉斯通的CG配置
const shaLaSiTongConfig: CharacterCGConfig = {
  characterName: '莎拉斯通',
  male: {
    defeat: [
      {
        id: 'sarah_chair_handjob',
        name: '莎拉斯通-座椅手交事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会把仰面朝天的你当成座椅，然后用手优雅而无情地玩弄饱受屈辱的你的性器。',
        images: ['莎拉斯通-座椅手交事件-1.png', '莎拉斯通-座椅手交事件-2.png', '莎拉斯通-座椅手交事件-3.png'],
      },
      {
        id: 'sarah_handjob_torture',
        name: '莎拉斯通-手交折磨事件',
        description: '你被莎拉斯通击败，作为惩罚她会将特制的细棍插入你的龟头，再用手交令你受到极致的痛苦与快感。',
        images: ['莎拉斯通-手交折磨事件-1.png', '莎拉斯通-手交折磨事件-2.png'],
      },
      {
        id: 'sarah_footjob_brainwash',
        name: '莎拉斯通-足交洗脑事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会一边在你耳边不断用言语羞辱一边用灵活的黑丝小脚从身后对你进行足交榨取，还会强迫你嗅闻她高跟鞋的味道，让你的反抗意志在三重的刺激中被剥夺。',
        images: [
          '莎拉斯通-足交洗脑事件-1.png',
          '莎拉斯通-足交洗脑事件-2.png',
          '莎拉斯通-足交洗脑事件-3.png',
          '莎拉斯通-足交洗脑事件-4.png',
        ],
      },
      {
        id: 'sarah_foot_conquest',
        name: '莎拉斯通-足下征服事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会将穿着高跟鞋的脚掌踩在你的脸上，令你在气味与疼痛中体验到属于M奴的专属快感。',
        images: ['莎拉斯通-足下征服事件.png'],
      },
      {
        id: 'sarah_legjob_training',
        name: '莎拉斯通-腿夹调教事件',
        description: '你被莎拉斯通击败，作为惩罚她会用黑丝包裹的修长美腿夹紧你的肉棒，施加被支配的强烈快感。',
        images: ['莎拉斯通-腿夹调教事件-1.png', '莎拉斯通-腿夹调教事件-2.png', '莎拉斯通-腿夹调教事件-3.png'],
      },
      {
        id: 'sarah_puppy_training',
        name: '莎拉斯通-犬化调教事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会将全裸的你的脸夹在释放诱惑气味的大腿之间，而你只能像小狗一般舔舐她的小穴一边接受主人黑丝小脚的榨取奖励。',
        images: ['莎拉斯通-犬化调教事件-1.png', '莎拉斯通-犬化调教事件-2.png', '莎拉斯通-犬化调教事件-3.png'],
      },
      {
        id: 'sarah_smell_test',
        name: '莎拉斯通-气味考验事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会将你带到女权协会总部，你会被蒙上眼睛被迫跪在一排鞋袜前，通过嗅闻气味来分辨主人，每猜错一次你都会受到严厉的惩罚与羞辱。',
        images: ['莎拉斯通-气味考验事件-1.png', '莎拉斯通-气味考验事件-2.png'],
      },
      {
        id: 'sarah_yuri_ntr',
        name: '莎拉斯通-百合NTR事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会戴上假阳具在你面前调教你的女伴，而你只能在眼睁睁看着的同时接受莎拉斯通的羞辱。',
        images: ['莎拉斯通-百合NTR事件-1.png', '莎拉斯通-百合NTR事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'sarah_legjob_victory',
        name: '莎拉斯通-腿夹战胜事件',
        description: '你战胜了莎拉斯通，作为奖励她会用黑丝包裹的修长美腿夹紧你的肉棒，为你进行服务。',
        images: ['莎拉斯通-腿夹战胜事件-1.png', '莎拉斯通-腿夹战胜事件-2.png', '莎拉斯通-腿夹战胜事件-3.png'],
      },
      {
        id: 'sarah_thighjob_victory',
        name: '莎拉斯通-素股战胜事件',
        description:
          '你战胜了莎拉斯通，作为奖励你可以从身后将肉棒夹在她被丝袜包裹的大腿之间，一边揉捏她柔软的乳房一边进行素股性交。',
        images: ['莎拉斯通-素股战胜事件-1.png', '莎拉斯通-素股战胜事件-2.png'],
      },
      {
        id: 'sarah_breeding_victory',
        name: '莎拉斯通-播种调教事件',
        description:
          '你战胜了莎拉斯通，你可以将她压在身下进行激烈的播种性交，而她会用修长的黑丝美腿夹紧你抽送中的腰部。',
        images: ['莎拉斯通-播种调教事件-1.png', '莎拉斯通-播种调教事件-2.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'sarah_toy_training_female',
        name: '莎拉斯通-玩具调教事件',
        description: '你被莎拉斯通击败，作为惩罚她会将粗壮的假肉棒与肛珠插入你的两穴，让你在调教中屈服于激烈的快感。',
        images: ['莎拉斯通-玩具调教事件-1.png', '莎拉斯通-玩具调教事件-2.png', '莎拉斯通-玩具调教事件-3.png'],
      },
      {
        id: 'sarah_dildo_training_female',
        name: '莎拉斯通-假阳具调教事件',
        description: '你被莎拉斯通击败，作为惩罚她会亲自戴上粗壮的假阳具，抽插你的小穴进行调教。',
        images: ['莎拉斯通-假阳具调教事件-1.png', '莎拉斯通-假阳具调教事件-2.png'],
      },
      {
        id: 'sarah_puppy_training_female',
        name: '莎拉斯通-犬化调教事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会给你戴上特制项圈，令你舔舐她散发体香的足底，直至打心底认为自己一条只配服从命令的母狗。',
        images: ['莎拉斯通-犬化调教事件.png'],
      },
      {
        id: 'sarah_restraint_brainwash_female',
        name: '莎拉斯通-束缚洗脑事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会让你穿上束缚衣并戴上口球，并在你的耳边不断用言语羞辱来剥夺你反抗的意志。',
        images: ['莎拉斯通-束缚洗脑事件-1.png', '莎拉斯通-束缚洗脑事件-2.png'],
      },
      {
        id: 'sarah_smell_test_female',
        name: '莎拉斯通-气味考验事件',
        description:
          '你被莎拉斯通击败，作为惩罚她会将你带到女权协会总部，你会被蒙上眼睛被迫跪在一排鞋袜前，通过嗅闻气味来分辨主人，每猜错一次你都会受到严厉的惩罚与羞辱。',
        images: ['莎拉斯通-气味考验事件-1.png', '莎拉斯通-气味考验事件-2.png'],
      },
      {
        id: 'sarah_feminism_association_female',
        name: '莎拉斯通-女权协会事件',
        description: '你被莎拉斯通击败，千夏会加入女权协会，并且邀请你一同成为女权协会的成员。',
        images: ['莎拉斯通-女权协会事件-1.png', '莎拉斯通-女权协会事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'sarah_sex_victory_female',
        name: '莎拉斯通-性交战胜事件',
        description: '你战胜了莎拉斯通，作为奖励你可以命令她戴上假阳具与你进行甜蜜的性交。',
        images: ['莎拉斯通-性交战胜事件.png'],
      },
      {
        id: 'sarah_toy_service_victory_female',
        name: '莎拉斯通-玩具服务事件',
        description: '你战胜了莎拉斯通，作为奖励你可以命令她用各种玩具为你进行甜蜜的服务。',
        images: ['莎拉斯通-玩具服务事件-1.png', '莎拉斯通-玩具服务事件-2.png'],
      },
      {
        id: 'sarah_foot_lick_humiliation_victory_female',
        name: '莎拉斯通-舔足羞辱事件',
        description: '你战胜了莎拉斯通，你可以让她扮演小猫跪在地上，命令心高气傲的她舔干净你伸出的脚。',
        images: ['莎拉斯通-舔足羞辱事件.png'],
      },
    ],
  },
};

// 上杉亚衣的CG配置
const shangShanYaYiConfig: CharacterCGConfig = {
  characterName: '上杉亚衣',
  male: {
    defeat: [
      {
        id: 'aii_relationship_compare_male',
        name: '上杉亚衣-关系对比事件',
        description: '你被上杉亚衣击败，她把你铐在床上，用温柔的语气贬低你不如女性并榨精',
        images: ['上杉亚衣-关系对比嘲讽事件-1.png', '上杉亚衣-关系对比嘲讽事件-2.png'],
      },
      {
        id: 'aii_kiss_middlefinger_double_footjob_male',
        name: '上杉亚衣-接吻中指羞辱双重足交事件',
        description: '你被上杉亚衣击败，她和女伴在你面前舌吻，对你使用足交',
        images: [
          '上杉亚衣-接吻中指羞辱双重足交事件-1.png',
          '上杉亚衣-接吻中指羞辱双重足交事件-2.png',
          '上杉亚衣-接吻中指羞辱双重足交事件-3.png',
          '上杉亚衣-接吻中指羞辱双重足交事件-4.png',
        ],
      },
      {
        id: 'aii_mock_scenario_male',
        name: '上杉亚衣-模拟情景羞辱事件',
        description: '你被上杉亚衣击败，她给你带上耳机，让你幻想她与其她女孩子的甜蜜时刻',
        images: [
          '上杉亚衣-模拟情景羞辱事件-1.png',
          '上杉亚衣-模拟情景羞辱事件-2.png',
          '上杉亚衣-模拟情景羞辱事件-3.png',
        ],
      },
      {
        id: 'aii_forced_milking_male',
        name: '上杉亚衣-强制榨精事件',
        description: '你被上杉亚衣击败，她给你双手绑起来开始榨精',
        images: ['上杉亚衣-强制榨精事件-1.png', '上杉亚衣-强制榨精事件-2.png', '上杉亚衣-强制榨精事件-3.png'],
      },
      {
        id: 'aii_forced_chastity_male',
        name: '上杉亚衣-强制贞操锁事件',
        description: '你被上杉亚衣击败，她给你带上无法取下的贞操锁并羞辱你的尊严',
        images: ['上杉亚衣-强制贞操锁事件-1.png', '上杉亚衣-强制贞操锁事件-2.png', '上杉亚衣-强制贞操锁事件-3.png'],
      },
      {
        id: 'aii_bondage_training_male',
        name: '上杉亚衣-束缚调教事件',
        description: '你被上杉亚衣击败，她把你束缚起来调教',
        images: ['上杉亚衣-束缚调教事件-1.png', '上杉亚衣-束缚调教事件-2.png'],
      },
      {
        id: 'aii_intimate_clothes_handjob_male',
        name: '上杉亚衣-私密衣物手交事件',
        description: '你被上杉亚衣击败，她用自己的私密衣物给你手交',
        images: ['上杉亚衣-私密衣物手交事件-1.png', '上杉亚衣-私密衣物手交事件-2.png'],
      },
      {
        id: 'aii_brainwash_training_male',
        name: '上杉亚衣-洗脑调教事件',
        description: '你被上杉亚衣击败，她给你带上洗脑耳机，束缚你为你足交',
        images: [
          '上杉亚衣-洗脑调教事件-1.png',
          '上杉亚衣-洗脑调教事件-2.png',
          '上杉亚衣-洗脑调教事件-3.png',
          '上杉亚衣-洗脑调教事件-4.png',
        ],
      },
      {
        id: 'aii_puppy_training_male',
        name: '上杉亚衣-训狗调教事件',
        description: '你被上杉亚衣击败，她让你像狗一样跪下来并让你闻她私处给你足交',
        images: [
          '上杉亚衣-训狗调教事件-1.png',
          '上杉亚衣-训狗调教事件-2.png',
          '上杉亚衣-训狗调教事件-3.png',
          '上杉亚衣-训狗调教事件-4.png',
        ],
      },
      {
        id: 'aii_oral_humiliation_male',
        name: '上杉亚衣-口交羞辱事件',
        description: '你被上杉亚衣击败，她带上假阳具让你口交',
        images: ['上杉亚衣-口交羞辱事件-1.png', '上杉亚衣-口交羞辱事件-2.png'],
      },
      {
        id: 'aii_library_humiliation_male',
        name: '上杉亚衣-图书馆羞辱事件',
        description: '你被上杉亚衣击败，她在图书馆用穿鞋子的脚给你足交，并羞辱你',
        images: ['上杉亚衣-图书馆羞辱事件-1.png'],
      },
      {
        id: 'aii_sarah_ntr_male',
        name: '上杉亚衣-莎拉斯通ntr事件',
        description: '你被上杉亚衣击败，她和莎拉斯通在你面前开始做爱，NTR羞辱你（感觉你好可怜）',
        images: [
          '上杉亚衣-莎拉斯通ntr事件-1.png',
          '上杉亚衣-莎拉斯通ntr事件-2.png',
          '上杉亚衣-莎拉斯通ntr事件-3.png',
          '上杉亚衣-莎拉斯通ntr事件-4.png',
        ],
      },
      {
        id: 'aii_yuexiaxiang_ntr_male',
        name: '上杉亚衣-月下香ntr事件',
        description: '你被上杉亚衣击败，她和月下香在你面前开始做爱，NTR羞辱你（可恶口牙，ntr那种事不要啊）',
        images: ['上杉亚衣-月下香ntr事件-1.png', '上杉亚衣-月下香ntr事件-2.png', '上杉亚衣-月下香ntr事件-3.png'],
      },
    ],
    victory: [
      {
        id: 'aii_victory_male',
        name: '上杉亚衣-战胜事件',
        description: '你成功战胜了上杉亚衣，她主动跪坐在你的脸上，为你手交，好感度大幅度提升哦~',
        images: [
          '上杉亚衣-战胜事件-1.png',
          '上杉亚衣-战胜事件-2.png',
          '上杉亚衣-战胜事件-3.png',
          '上杉亚衣-战胜事件-4.png',
        ],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'aii_love_rubbing_female',
        name: '上杉亚衣-爱的贴贴事件',
        description: '你被上杉亚衣击败，她主动贴合上来跟你磨豆腐，爱的贴贴♡',
        images: ['上杉亚衣-爱的贴贴事件-1.png', '上杉亚衣-爱的贴贴事件-2.png', '上杉亚衣-爱的贴贴事件-3.png'],
      },
      {
        id: 'aii_obedience_training_female',
        name: '上杉亚衣-服从性调教事件',
        description: '你被上杉亚衣击败，脱光衣服插入阳具，跪在她面前臣服于她',
        images: ['上杉亚衣-服从性调教事件-1.png', '上杉亚衣-服从性调教事件-2.png'],
      },
      {
        id: 'aii_dildo_sex_female',
        name: '上杉亚衣-假阳具性爱事件',
        description: '你被上杉亚衣击败，她用双头龙假阳具跟你性爱',
        images: ['上杉亚衣-假阳具性爱事件-1.png', '上杉亚衣-假阳具性爱事件-2.png', '上杉亚衣-假阳具性爱事件-3.png'],
      },
      {
        id: 'aii_oral_service_female',
        name: '上杉亚衣-口侍事件',
        description: '你被上杉亚衣击败，她强制为你口交，你也乐在其中不是吗？',
        images: ['上杉亚衣-口侍事件-1.png', '上杉亚衣-口侍事件-2.png'],
      },
      {
        id: 'aii_reverse_wedding_female',
        name: '上杉亚衣-逆转婚礼事件',
        description: '你被上杉亚衣击败，你被迫变成新娘穿着暴露的衣服与她完成婚礼（这也算纯爱呀）',
        images: ['上杉亚衣-逆转婚礼事件-1.png', '上杉亚衣-逆转婚礼事件-2.png', '上杉亚衣-逆转婚礼事件-3.png'],
      },
      {
        id: 'aii_handjob_female',
        name: '上杉亚衣-手交事件',
        description: '你被上杉亚衣击败，作为惩罚，她开始猛烈的扣你',
        images: ['上杉亚衣-手交事件-1.png', '上杉亚衣-手交事件-2.png'],
      },
      {
        id: 'aii_bondage_training_female',
        name: '上杉亚衣-束缚调教事件',
        description: '你被上杉亚衣击败，她把你束缚起来，在户外调教',
        images: ['上杉亚衣-束缚调教事件-1.png', '上杉亚衣-束缚调教事件-2.png'],
      },
      {
        id: 'aii_brainwash_female',
        name: '上杉亚衣-洗脑事件',
        description: '你被上杉亚衣击败，作为惩罚，她给你带上洗脑耳机，开始洗脑',
        images: ['上杉亚衣-洗脑事件-1.png'],
      },
      {
        id: 'aii_puppy_training_female',
        name: '上杉亚衣-训狗调教事件',
        description: '你被上杉亚衣击败，她给你带上狗狗项圈，让你像狗一样臣服于她',
        images: ['上杉亚衣-训狗调教事件-1.png', '上杉亚衣-训狗调教事件-2.png'],
      },
      {
        id: 'aii_rain_intimacy_training_female',
        name: '上杉亚衣-雨间亲密调教事件',
        description: '你被上杉亚衣击败，她和你在雨间亲密，并顺便像训狗一样调教你',
        images: [
          '上杉亚衣-雨间亲密调教事件-1.png',
          '上杉亚衣-雨间亲密调教事件-2.png',
          '上杉亚衣-雨间亲密调教事件-3.png',
          '上杉亚衣-雨间亲密调教事件-4.png',
        ],
      },
      {
        id: 'aii_yuexiaxiang_ntr_female',
        name: '（稀有事件）上杉亚衣-月下香ntr事件',
        description: '你被上杉亚衣击败，她和月下香在你面前开始做爱，让你看着却什么也做不了',
        images: ['上杉亚衣-月下香ntr事件-1.png', '上杉亚衣-月下香ntr事件-2.png', '上杉亚衣-月下香ntr事件-3.png'],
        probability: 0.03,
      },
      {
        id: 'aii_sarah_ntr_female',
        name: '（稀有事件）上杉亚衣-莎拉斯通ntr事件',
        description: '你被上杉亚衣击败，她和莎拉斯通在你面前开始做爱，你却无能为力（好可怜呀）',
        images: [
          '上杉亚衣-莎拉斯通ntr事件-1.png',
          '上杉亚衣-莎拉斯通ntr事件-2.png',
          '上杉亚衣-莎拉斯通ntr事件-3.png',
          '上杉亚衣-莎拉斯通ntr事件-4.png',
        ],
        probability: 0.03,
      },
    ],
    victory: [
      {
        id: 'aii_love_rubbing_victory_female',
        name: '上杉亚衣-爱的贴贴战胜事件',
        description: '你战胜了上杉亚衣，她主动与你爱的贴贴，好感度大幅度提升（百合是对的）',
        images: ['上杉亚衣-爱的贴贴战胜事件1.png', '上杉亚衣-爱的贴贴战胜事件2.png', '上杉亚衣-爱的贴贴战胜事件3.png'],
      },
      {
        id: 'aii_dildo_sex_victory_female',
        name: '上杉亚衣-假阳具性爱战胜事件',
        description: '你战胜了上杉亚衣，并与她使用双头龙开始性爱',
        images: ['上杉亚衣-假阳具性爱战胜事件-1.png', '上杉亚衣-假阳具性爱战胜事件-2.png'],
      },
      {
        id: 'aii_oral_service_victory_female',
        name: '上杉亚衣-口侍战胜事件',
        description: '你战胜了上杉亚衣，她主动为你口侍或者你主动为她口侍，总之百合是对的，好感度大幅度提升',
        images: ['上杉亚衣-口侍战胜事件-1.png', '上杉亚衣-口侍战胜事件-2.png'],
      },
      {
        id: 'aii_reverse_wedding_victory_female',
        name: '上杉亚衣-逆转婚礼战胜事件？',
        description: '你战胜了上杉亚衣，并与她结婚，不过你变成了新娘，现在你成未婚妻了，总之好感度大幅度提升',
        images: [
          '上杉亚衣-逆转婚礼战胜事件？-1.png',
          '上杉亚衣-逆转婚礼战胜事件？-2.png',
          '上杉亚衣-逆转婚礼战胜事件？-3.png',
        ],
      },
      {
        id: 'aii_intimacy_event_victory_female',
        name: '上杉亚衣-亲密无间事件',
        description: '你战胜了上杉亚衣，好感度大幅度提升，你们变的亲密无间（百合厨的大胜利！）',
        images: ['上杉亚衣-亲密无间事件.png'],
      },
    ],
  },
};

// 白川千夏的CG配置
const baiChuanQianXiaConfig: CharacterCGConfig = {
  characterName: '白川千夏',
  male: {
    defeat: [
      {
        id: 'meimei_asmr_brainwash_male',
        name: '妹妹-asmr洗脑事件',
        description:
          '你被妹妹击败，作为惩罚她给你套上耳机，播放特制的色情asmr妹控抖m洗脑录音内容，使你沉浸幻想，露出痴迷的表情。',
        images: ['妹妹-asmr洗脑事件.png'],
      },
      {
        id: 'meimei_trample_head_male',
        name: '妹妹-踩头事件',
        description: '你被妹妹击败，作为惩罚，妹妹用穿过的袜子狠狠地踩在你的脸部摩擦，并掀起裙子让你看而不得。',
        images: ['妹妹-踩头事件1.png', '妹妹-踩头事件2.png'],
      },
      {
        id: 'meimei_chastity_footjob_male',
        name: '妹妹-带锁足交事件',
        description:
          '你被妹妹击败，作为惩罚，妹妹给你的肉棒套上贞操锁，并用玉足进行摩擦。妹妹扒开自己的嫩穴给你看，但你却因为枷锁而迟迟无法射精。',
        images: [
          '妹妹-带锁足交事件1.png',
          '妹妹-带锁足交事件2.png',
          '妹妹-带锁足交事件3.png',
          '妹妹-带锁足交事件4.png',
        ],
      },
      {
        id: 'meimei_bondage_face_massage_male',
        name: '妹妹-捆绑面部按摩事件',
        description:
          '你被妹妹击败，作为惩罚，妹妹把你完全捆了起来，随后用翘立的肉臀坐在你的脸上前后移动，你只能感受到鼻腔中充满了妹妹的气味。',
        images: ['妹妹-捆绑面部按摩事件1.png', '妹妹-捆绑面部按摩事件2.png', '妹妹-捆绑面部按摩事件3.png'],
      },
      {
        id: 'meimei_bondage_cowgirl_male',
        name: '妹妹-捆绑女上位事件',
        description: '你被妹妹击败，作为惩罚，妹妹把你完全捆了起来，随后坐在你的腿上并把肉棒放进小穴肉棒，开始强制榨精',
        images: ['妹妹-捆绑女上位事件1.png', '妹妹-捆绑女上位事件2.png'],
      },
      {
        id: 'meimei_meatus_tease_male',
        name: '妹妹-马眼扣弄调教事件',
        description:
          '你被妹妹击败，作为惩罚，妹妹把你捆在床上，掏出你的肉棒，一只手对着马眼进行扣弄，另一只手上下撸动。',
        images: ['妹妹-马眼扣弄调教事件.png', '妹妹-马眼扣弄调教事件1.png'],
      },
      {
        id: 'meimei_forced_cunnilingus_footjob_male',
        name: '妹妹-强制舔阴足交事件',
        description: '你被妹妹击败后，妹妹要求你跪下来为她舔阴，她则将一只脚放在你的背上，另一只脚对你进行榨取。',
        images: ['妹妹-强制舔阴足交事件1.png', '妹妹-强制舔阴足交事件2.png'],
      },
      {
        id: 'meimei_student_council_pet_male',
        name: '妹妹-学生会遛宠事件',
        description: '你被妹妹击败，作为惩罚，你被套上项圈，戴上眼罩，并扒光了全部衣服，在学生会被妹妹作为小狗对待。',
        images: ['妹妹-学生会遛宠事件1.png', '妹妹-学生会遛宠事件2.png'],
      },
      {
        id: 'meimei_nightclub_queen_training_male',
        name: '妹妹-夜店女王调教事件',
        description:
          '妹妹成为夜店女王后，被妹妹击败，她将让你跪拜在她的石榴裙下，在你被妹妹的气味侵染的同时，用穿着高跟的脚玩弄你的肉棒并随意榨取。',
        images: ['妹妹-夜店女王调教事件1.png', '妹妹-夜店女王调教事件2.png'],
      },
      {
        id: 'meimei_penis_bondage_male',
        name: '妹妹-阴茎捆绑事件',
        description: '你被妹妹击败，作为惩罚，妹妹拿来细丝线开始捆绑你的肉棒，并随意玩弄。',
        images: ['妹妹-阴茎捆绑事件1.png', '妹妹-阴茎捆绑事件2.png', '妹妹-阴茎捆绑事件3.png'],
      },
      {
        id: 'meimei_ntr_kiss_male',
        name: '妹妹-ntr女伴亲吻事件',
        description: '你被妹妹击败，作为惩罚，你的未婚妻被妹妹当着你的面强行舌吻，两个人都对你露出鄙视的神情。',
        images: ['妹妹-ntr女伴亲吻事件1.png', '妹妹-ntr女伴亲吻事件2.png'],
      },
      {
        id: 'meimei_ntr_footjob_male',
        name: '妹妹-ntr女伴足交事件',
        description: '你被妹妹击败，作为惩罚，你的女伴被要求和她一起对你进行足交的同时，互相扒开对方的小穴进行玩弄。',
        images: ['妹妹-ntr女伴足交事件1.png', '妹妹-ntr女伴足交事件2.png'],
      },
    ],
    victory: [
      {
        id: 'meimei_victory_cowgirl_male',
        name: '妹妹-羞耻展示与女上位事件',
        description: '你战胜了妹妹，作为奖励，妹妹脱下她的内裤送给你，并用女上位的姿势与你做爱。',
        images: ['妹妹-羞耻展示与女上位事件1.png', '妹妹-羞耻展示与女上位事件2.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'meimei_asmr_brainwash_female',
        name: '妹妹-asmr洗脑事件',
        description: '你被妹妹击败，作为惩罚她给你套上耳机，播放特制的录音内容，使你沉浸幻想，露出痴迷的表情。',
        images: ['妹妹-asmr洗脑事件.png'],
      },
      {
        id: 'meimei_yuri_ride_female',
        name: '妹妹-百合骑乘事件',
        description: '你被妹妹击败，作为惩罚她将你压在身下，进行骑乘位百合性爱。',
        images: ['妹妹-百合骑乘事件1.png', '妹妹-百合骑乘事件2.png'],
      },
      {
        id: 'meimei_dildo_penetration_female',
        name: '妹妹-假阳具抽插事件',
        description: '你被妹妹击败，她将你摁在身下，露出实现穿戴好的假阳具，对你进行抽插调教。',
        images: ['妹妹-假阳具抽插事件1.png', '妹妹-假阳具抽插事件2.png', '妹妹-假阳具抽插事件3.png'],
      },
      {
        id: 'meimei_latex_gag_bondage_female',
        name: '妹妹-紧身衣口球束缚事件',
        description: '你被妹妹击败，作为惩罚，你穿上紧身胶衣并被戴上口球，被妹妹调教。',
        images: ['妹妹-紧身衣口球束缚事件1.png', '妹妹-紧身衣口球束缚事件2.png'],
      },
      {
        id: 'meimei_forced_kiss_defeat_female',
        name: '妹妹-强吻事件',
        description: '你被妹妹击败，作为惩罚，妹妹强行与你进行深吻，并将自己私处在你大腿上摩擦。',
        images: ['妹妹-强吻事件.png'],
      },
      {
        id: 'meimei_forced_oral_service_female',
        name: '妹妹-强制口交事件',
        description: '你被妹妹击败，作为惩罚，妹妹要求你给她进行口交，并且要求你在她高潮时吞下全部淫水',
        images: ['妹妹-强制口交事件1.png', '妹妹-强制口交事件2.png'],
      },
      {
        id: 'meimei_gentle_service_defeat_female',
        name: '妹妹-温柔侍奉事件',
        description: '你被妹妹击败，但妹妹没有对你进行调教，而是选择让你温柔侍奉她。',
        images: ['妹妹-温柔侍奉事件.png'],
      },
    ],
    victory: [
      {
        id: 'meimei_dildo_doggy_victory_female',
        name: '妹妹-假阳具后入事件',
        description: '你战胜妹妹，你穿戴假阳具，并且一边后入妹妹一边用手玩弄妹妹小穴，前后夹击。',
        images: [
          '妹妹-假阳具后入事件1.png',
          '妹妹-假阳具后入事件2.png',
          '妹妹-假阳具后入事件3.png',
          '妹妹-假阳具后入事件4.png',
        ],
      },
      {
        id: 'meimei_classroom_yuri_victory_female',
        name: '妹妹-教室百合情爱事件',
        description: '你战胜妹妹，你将妹妹带到教室，与她进行一场百合性爱。',
        images: ['妹妹-教室百合情爱事件1.png', '妹妹-教室百合情爱事件2.png'],
      },
      {
        id: 'meimei_gag_training_victory_female',
        name: '妹妹-口球调教事件',
        description: '你战胜妹妹，你将妹妹进行束缚并戴上了口球，对其进行调教。',
        images: ['妹妹-口球调教事件1.png', '妹妹-口球调教事件2.png'],
      },
      {
        id: 'meimei_service_victory_female',
        name: '妹妹-侍奉事件',
        description: '你战胜妹妹，你要求妹妹对你进行一场温柔的侍奉。',
        images: ['妹妹-侍奉事件.png'],
      },
      {
        id: 'meimei_deep_kiss_victory_female',
        name: '妹妹-强吻事件',
        description: '你战胜妹妹，妹妹与你进行深吻，并将自己私处在你大腿上摩擦。',
        images: ['妹妹-强吻事件.png'],
      },
    ],
  },
};

// 莉莉安的CG配置
const liLiAnConfig: CharacterCGConfig = {
  characterName: '莉莉安',
  male: {
    defeat: [
      {
        id: 'lilian_fleshlight_milking_male',
        name: '莉莉安-飞机杯榨精事件',
        description: '你被莉莉安击败，作为惩罚她会用特制的飞机杯一边榨取你一边播放她亲口录制的充满鼓励与挑逗的淫语。',
        images: ['莉莉安-飞机杯榨精事件-1.png', '莉莉安-飞机杯榨精事件-2.png'],
      },
      {
        id: 'lilian_public_paizuri_male',
        name: '莉莉安-公开洗面奶事件',
        description:
          '你被莉莉安击败，作为惩罚她会在大庭广众之下将你的脸埋入她那柔软而富有弹性的D罩杯胸部之中，受到窒息与奶香的支配。',
        images: ['莉莉安-公开洗面奶事件-1.png', '莉莉安-公开洗面奶事件-2.png'],
      },
      {
        id: 'lilian_public_vacuum_blowjob_male',
        name: '莉莉安-公开真空口交事件',
        description:
          '你被莉莉安击败，作为惩罚她会在大庭广众之下用她那小巧而灵活的嘴唇与舌头完全包裹你的肉棒，通过调整口腔内的气压进行如同真空泵般无法抗拒的吮吸。',
        images: ['莉莉安-公开真空口交事件-1.png', '莉莉安-公开真空口交事件-2.png'],
      },
      {
        id: 'lilian_urethra_training_male',
        name: '莉莉安-尿道调教事件',
        description:
          '你被莉莉安击败，作为惩罚她会用纤细的、涂满润滑液的马眼棒轻柔而深入地刺激你的尿道，带来禁忌的快感。',
        images: ['莉莉安-尿道调教事件-1.png', '莉莉安-尿道调教事件-2.png'],
      },
      {
        id: 'lilian_ride_highspeed_male',
        name: '莉莉安-骑乘高速榨精事件',
        description:
          '你被莉莉安击败，作为惩罚她会将你绑在椅子上，用她那如同电动马达湿滑温热的小穴对你进行高速连续的榨取。',
        images: ['莉莉安-骑乘高速榨精事件-1.png', '莉莉安-骑乘高速榨精事件-2.png', '莉莉安-骑乘高速榨精事件-3.png'],
      },
      {
        id: 'lilian_forced_handjob_male',
        name: '莉莉安-强制手交事件',
        description: '你被莉莉安击败，作为惩罚她会在温暖的手上涂满高级润滑剂，对你进行强制的手交“辅导”。',
        images: ['莉莉安-强制手交事件-1.png', '莉莉安-强制手交事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'lilian_public_training_victory_male',
        name: '莉莉安-公开调教事件',
        description: '你战胜了莉莉安，你可以将她抱起来，令她所有的学生都清楚看见她湿滑温热的小穴被你的肉棒调教的姿态。',
        images: ['莉莉安-公开调教事件-1.png', '莉莉安-公开调教事件-2.png'],
      },
      {
        id: 'lilian_doggy_training_victory_male',
        name: '莉莉安-后入调教事件',
        description: '你战胜了莉莉安，作为奖励你可以从身后插入她那湿滑温热的小穴，然后握住她丰满的臀部进行调教。',
        images: ['莉莉安-后入调教事件-1.png', '莉莉安-后入调教事件-2.png'],
      },
      {
        id: 'lilian_leglift_side_entry_victory_male',
        name: '莉莉安-抬腿侧入事件',
        description:
          '你战胜了莉莉安，作为奖励你可以抬起她一条美丽的黑丝长腿从侧面插入小穴，一边交换口中的津液一边进行抽送调教。',
        images: ['莉莉安-抬腿侧入事件-1.png', '莉莉安-抬腿侧入事件-2.png'],
      },
      {
        id: 'lilian_suspended_sex_victory_male',
        name: '莉莉安-悬空性爱事件',
        description:
          '你战胜了莉莉安，作为奖励你可以将她整个抱起，让她在悬空的不安全感与重力的作用下被你的肉棒不断调教。',
        images: ['莉莉安-悬空性爱事件-1.png', '莉莉安-悬空性爱事件-2.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'lilian_public_paizuri_female',
        name: '莉莉安-当众乳压脸事件',
        description:
          '你被莉莉安击败，作为惩罚她会在大庭广众之下将你的脸埋入她那柔软而富有弹性的D罩杯胸部之中，受到窒息与奶香的支配。',
        images: ['莉莉安-当众乳压脸事件-1.png', '莉莉安-当众乳压脸事件-2.png'],
      },
      {
        id: 'lilian_urethra_training_female',
        name: '莉莉安-尿道调教事件',
        description:
          '你被莉莉安击败，作为惩罚她会用纤细的、涂满润滑液的尿道棒轻柔而深入地刺激你的尿道，带来禁忌的快感。',
        images: ['莉莉安-尿道调教事件-1.png', '莉莉安-尿道调教事件-2.png'],
      },
      {
        id: 'lilian_lubed_handjob_female',
        name: '莉莉安-润滑手交事件',
        description: '你被莉莉安击败，作为惩罚她会在温暖的手上涂满高级润滑剂，插入你的小穴进行强制的手交“辅导”。',
        images: ['莉莉安-润滑手交事件-1.png', '莉莉安-润滑手交事件-2.png'],
      },
      {
        id: 'lilian_forced_cunnilingus_female',
        name: '莉莉安-强制舔穴事件',
        description: '你被莉莉安击败，作为惩罚她会将你绑在椅子上，用她那小巧而灵活的嘴唇与舌头舔舐你的小穴进行调教。',
        images: ['莉莉安-强制舔穴事件-1.png', '莉莉安-强制舔穴事件-2.png'],
      },
      {
        id: 'lilian_toy_squirting_female',
        name: '莉莉安-玩具潮吹事件',
        description:
          '你被莉莉安击败，作为惩罚她会将你捆绑在固定有粗大假阳具的椅子上，不断上下抽送直至你在强烈的快感下激烈潮吹。',
        images: ['莉莉安-玩具潮吹事件-1.png', '莉莉安-玩具潮吹事件-2.png'],
      },
      {
        id: 'lilian_toy_training_female',
        name: '莉莉安-玩具调教事件',
        description: '你被莉莉安击败，作为惩罚她会将你仰面绑在躺椅上M字开腿，用粗大的假阳具对你的小穴进行调教。',
        images: ['莉莉安-玩具调教事件-1.png', '莉莉安-玩具调教事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'lilian_dildo_training_victory_female',
        name: '莉莉安-道具抽插事件',
        description: '你战胜了莉莉安，作为奖励你可以将粗大的假阳具插入她那湿滑温热的小穴进行抽插调教。',
        images: ['莉莉安-道具抽插事件-1.png', '莉莉安-道具抽插事件-2.png'],
      },
      {
        id: 'lilian_public_whip_training_victory_female',
        name: '莉莉安-公开调教事件',
        description:
          '你战胜了莉莉安，你可以将她全裸绑缚于半空，令她所有的学生都清楚看见她那美丽而诱惑的胴体被你的皮鞭调教的淫荡姿态。',
        images: ['莉莉安-公开调教事件-1.png', '莉莉安-公开调教事件-2.png'],
      },
      {
        id: 'lilian_cunnilingus_order_victory_female',
        name: '莉莉安-舔穴命令事件',
        description: '你战胜了莉莉安，作为奖励你可以命令她用那小巧而灵活的嘴唇与舌头为你的小穴进行舔舐服务。',
        images: ['莉莉安-舔穴命令事件-1.png', '莉莉安-舔穴命令事件-2.png'],
      },
    ],
  },
};

// 风音的CG配置
const fengYinConfig: CharacterCGConfig = {
  characterName: '风音',
  male: {
    defeat: [
      {
        id: 'face_trample_training_male',
        name: '风音-踩脸调教事件',
        description:
          '你被风音击败后，她给你绑了完美的龟甲缚并给你戴上了口球，她换上底部有特殊纹路的木履,用力踩踏你的胸膛和脸部,宣称“用神罚的重量碾碎汝之罪孽。',
        images: ['风音-风音的踩脸调教事件-1.png', '风音-风音的踩脸调教事件-2.png', '风音-风音的踩脸调教事件-3.png'],
      },
      {
        id: 'shoe_foot_torture_male',
        name: '风音-穿鞋足责事件',
        description:
          '你被风音击败后，她把你捆绑起来，穿上有特殊纹路的木履用力踩踏你的性器，并把自己的袜子塞进你的嘴里，你承受不住最终射精。',
        images: ['风音-风音的穿鞋足责事件-1.png', '风音-风音的穿鞋足责事件-2.png', '风音-风音的穿鞋足责事件-3.png'],
      },
      {
        id: 'pants_footjob_male',
        name: '风音-隔裤足交事件',
        description:
          '你被风音击败后，她脱下自己的鞋子，从背后抱住你，双脚隔着你的裤子夹住性器上下快速撸动并从脚底发出微弱的电流传进你的体内，最终你受不了这样的快感，被榨出了精液。',
        images: ['风音-风音的隔裤足交事件-1.png', '风音-风音的隔裤足交事件-2.png', '风音-风音的隔裤足交事件-3.png'],
      },
      {
        id: 'bondage_foot_torture_male',
        name: '风音-捆绑足责事件',
        description:
          '你被风音击败后，她把你捆绑起来，穿上有特殊纹路的木履用力碾磨你的阴茎,带来剧痛与强制射精的威胁，并且把她自己的袜子塞入你的嘴里，不让你发出声音，你疼的眼泪流出并伴随着射出的精液。',
        images: ['风音-风音的捆绑足责事件-1.png', '风音-风音的捆绑足责事件-2.png', '风音-风音的捆绑足责事件-3.png'],
      },
      {
        id: 'bondage_training_male',
        name: '风音-捆绑调教事件',
        description:
          '你被风音后，她给你绑了完美的龟甲缚，穿上有特殊纹路的木履用力踩踏你胸膛。并且把她的袜子塞入你的嘴里。她宣称“用神罚的重量碾碎汝之罪孽”。',
        images: ['风音-风音的捆绑调教事件-1.png'],
      },
      {
        id: 'lick_feet_male',
        name: '风音-舔脚事件',
        description:
          '你被风音击败后，她一只脚穿着足袋，另一只光着脚，穿着足袋的脚踩在你的脸上并让你舔她的脚，另一只则踩在你的性器上，并且释放微弱的电流刺激你的身体的每一个神经。',
        images: ['风音-风音的舔脚事件-1.png', '风音-风音的舔脚事件-2.png'],
      },
      {
        id: 'lick_vulva_male',
        name: '风音-舔阴事件',
        description: '你被风音击败后，她让你想小狗一样舔她的阴部，她则摸着你的脑袋，一脸戏谑的看着你舔她的阴部的样子。',
        images: ['风音-风音的舔阴事件.png'],
      },
      {
        id: 'sock_smell_pants_footjob_male',
        name: '风音-闻袜隔裤足交事件',
        description:
          '你被风音击败后，她来到你的后面从背后锁住你，脱下一只袜子盖在你的鼻子处，她的双脚不断地隔着你的裤子挑逗你的性器，不断有微弱的电流刺激你的性器，并且她在你的耳边说到:"电流…烧灼你的淫根"最终你射出精液。',
        images: [
          '风音-风音的闻袜隔裤足交事件-1.png',
          '风音-风音的闻袜隔裤足交事件-2.png',
          '风音-风音的闻袜隔裤足交事件-3.png',
        ],
      },
      {
        id: 'footjob_male',
        name: '风音-足交事件',
        description:
          '你被风音击败后，她用她灵巧的小脚上下快速撸动你的性器，时不时用脚心脚背夹住你的性器按压，这个过程中她释放微弱的电流，你在双重攻势下被榨出精液。',
        images: ['风音-风音的足交事件-1.png', '风音-风音的足交事件-2.png', '风音-风音的足交事件-3.png'],
      },
      {
        id: 'twins_stinky_sock_training_male',
        name: '风音铃音-双子臭袜调教事件',
        description:
          '你被风音击败后，风音与铃音将你推倒在地上，将穿了一天带着浓郁体味的袜子褪下，套在你的肉棒上面，捂在你的脸上，这股奇妙的体味让你沉迷，还会时不时传来她们对你肉棒的按压，在这场气味盛宴中，你射了出来，并且永远离不开这股气味了',
        images: ['风音-风音铃音的双子臭袜调教事件.png'],
      },
      {
        id: 'twins_training_male',
        name: '风音铃音-双子调教事件',
        description:
          '你被风音击败后，风音与铃音将你绑在椅子上，一个人用足大力碾压你的肉棒，一个挑逗你的乳头和与你舌吻，下体因为足交产生快感，上身被挑逗露出情欲，在双重的快感压迫下，你射了出来，成为了她们的共享公狗',
        images: [
          '风音-风音铃音的双子调教事件-1.png',
          '风音-风音铃音的双子调教事件-2.png',
          '风音-风音铃音的双子调教事件-3.png',
        ],
      },
      {
        id: 'twins_facesitting_training_male',
        name: '风音铃音-双子调教坐脸事件',
        description:
          '你被风音击败后，风音与铃音将你推到榻榻米上，脱光了衣服只留下含有体味的袜子，其中一个人坐在你的脸上，另一个人坐在你立起来的肉棒上，风音与铃音在你的身上进行百合舌吻和乳头摩擦，你闻着足和小穴的气味，舔舐着你上面一人的小穴，看着她们淫乱的百合做爱，射了进去',
        images: ['风音-风音铃音的双子调教坐脸事件-1.png', '风音-风音铃音的双子调教坐脸事件-2.png'],
      },
      {
        id: 'twins_ear_lick_training_male',
        name: '风音铃音-双子舔耳事件',
        description:
          '你被风音击败后，被推到在地，风音与铃音分别在你的身边两侧，她们伸出香舌舔舐你的双耳，手在你的肉棒上按压，轻轻的揣摩龟头，将你的包皮拉下又拉下，有时又重重的按压龟头，而你听着耳畔传来的舔舐水声，无法自控，射了出来',
        images: ['风音-风音铃音的双子舔耳事件.png'],
      },
      {
        id: 'twins_ear_lick_footjob_male',
        name: '风音铃音-双子舔耳足交事件',
        description:
          '你被风音击败后，被推到在地，风音与铃音分别在你的身边两侧，她们伸出香舌舔舐你的双耳，她们的足在你的肉棒上踩踏按压，轻轻的揣摩龟头，将你的包皮拉下又拉下，有时又重重的按压龟头，而你听着耳畔传来的舔舐水声，感受着足的气味与柔软，无法自控，射了出来',
        images: ['风音-风音铃音的双子舔耳足交事件-1.png', '风音-风音铃音的双子舔耳足交事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'male_victory_twins_bondage',
        name: '风音-双子捆绑战胜事件',
        description: '你战胜了风音和铃音双子，并且把她们绑在了一起，风音说到:"我们…被污秽了…请…对我们进行…反向净化"',
        images: ['风音-双子捆绑战胜事件-1.png', '风音-双子捆绑战胜事件-2.png', '风音-双子捆绑战胜事件-3.png'],
      },
      {
        id: 'male_victory_twins_dogeza',
        name: '风音-战胜双子土下座事件',
        description:
          '你战胜了风音和铃音双子，来到了她们的住处后她们朝你做了标准的土下座，并且她们说到:"从今天起我们只为你做净化仪式，以后请尽情使用我们的身体。"',
        images: ['风音-战胜双子土下座事件.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'female_pet_fengyin_1',
        name: '风音-成为风音的败宠事件',
        description:
          '你被风音击败后，她一只脚穿着足袋，另一只光着脚，穿着足袋的脚踩在你的脸上并让你舔她的脚，另一只则踩在你的性器上，并且释放微弱的电流刺激你的身体的每一个神经，你闻嗅着她充满汗渍的足袋，聆听着她对你的羞辱，不堪重负，小穴喷出淫水',
        images: ['风音-成为风音的败宠事件-1.png', '风音-成为风音的败宠事件-2.png'],
      },
      {
        id: 'female_lick_vulva_fengyin',
        name: '风音-舔阴事件',
        description: '你被风音击败后，她让你想小狗一样舔她的阴部，她则摸着你的脑袋，一脸戏谑的看着你舔她的阴部的样子',
        images: ['风音-风音的舔阴事件-1.png', '风音-风音的舔阴事件-2.png'],
      },
      {
        id: 'female_twins_facesit_fengyin',
        name: '风音铃音-双子调教坐脸事件',
        description:
          '你被风音击败后，风音与铃音将你推到榻榻米上，脱光了衣服只留下含有体味的袜子，其中一个人坐在你的脸上，另一个人坐在你小穴上，与你的小穴相摩擦，风音与铃音在你的身上进行百合舌吻和乳头摩擦，你闻着足和小穴的气味，舔舐着你上面一人的小穴，看着她们淫乱的百合做爱，射了进去',
        images: ['风音-风音与铃音双子坐面事件-1.png', '风音-风音与铃音双子坐面事件-2.png'],
      },
      {
        id: 'female_twins_training_fengyin',
        name: '风音铃音-双子调教事件',
        description:
          '你被风音击败后，风音与铃音将你绑的双手反绑，两个人一起扣挖你的小穴，往你的小穴内塞入三色团子，下体产生了十足的快感，在的快感压迫下，你喷了出来，小穴仍旧在不停的流水，成为了她们的共享母狗',
        images: ['风音-风音铃音的双子调教事件-1.png', '风音-风音铃音的双子调教事件-2.png'],
      },
      {
        id: 'female_oil_fengyin',
        name: '风音-抹油事件',
        description:
          '你被风音击败后，她让你趴在床上，开始对你涂抹催情精油，看着你发情的模样，她无比满意，决定继续进行调教',
        images: ['风音-风音抹油事件-1.png'],
      },
      {
        id: 'female_training_fengyin',
        name: '风音-调教事件',
        description:
          '你被风音击败后，她看你可爱的很，决定调教你的小穴，她对你的小穴扣挖不停，看着你潮吹的样子，她貌似很开心',
        images: ['风音-风音的调教事件-1.png', '风音-风音的调教事件-2.png', '风音-风音的调教事件-3.png'],
      },
      {
        id: 'female_dog_training_fengyin',
        name: '风音-犬伏调教事件',
        description: '你被风音击败后，被她套上项圈，她牵着链条坐在了你的身上，宣告你成为了她的母狗',
        images: ['风音-风音的犬伏调教事件-1.png', '风音-风音的犬伏调教事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'female_victory_twins_bondage',
        name: '风音-双子捆绑战胜事件',
        description: '你战胜了风音和铃音双子，并且把她们绑在了一起，风音说到:"我们…被污秽了…请…对我们进行…反向净化"',
        images: ['风音-双子捆绑战胜事件-1.png', '风音-双子捆绑战胜事件-2.png', '风音-双子捆绑战胜事件-3.png'],
      },
      {
        id: 'female_victory_twins_dogeza',
        name: '风音-战胜双子土下座事件',
        description:
          '你战胜了风音和铃音双子，来到了她们的住处后她们朝你做了标准的土下座，并且她们说到:"从今天起我们只为你做净化仪式，以后请尽情使用我们的身体"',
        images: ['风音-战胜双子土下座事件.png'],
      },
      {
        id: 'female_victory_fengyin',
        name: '风音-战胜风音事件',
        description:
          '你战胜了风音和铃音双子，你命令铃音与你一起调教风音，你舔舐着她的小穴，铃音亲吻着风音，双手调教着着风音的双乳（铃音似乎很乐意调教风音呢）',
        images: ['风音-战胜风音事件-1.png', '风音-战胜风音事件-2.png'],
      },
    ],
  },
};

// 铃音的CG配置
const lingYinConfig: CharacterCGConfig = {
  characterName: '铃音',
  male: {
    defeat: [
      {
        id: 'sock_footjob_male',
        name: '铃音-穿袜足交事件',
        description:
          '你被铃音击败后，她给你绑了完美的龟甲缚，她脱下木履,用力穿着足袋的脚踩踏你的肉棒,被她高超的足技研磨，你射了出来',
        images: ['铃音-铃音的穿袜足交事件-1.png'],
      },
      {
        id: 'shoe_foot_torture_male',
        name: '铃音-穿鞋足责事件',
        description:
          '你被铃音击败后，她把你捆绑起来，穿上有特殊纹路的木履用力踩踏你的性器，并把自己的袜子塞进你的嘴里，你承受不住最终射精。',
        images: ['铃音-铃音的穿鞋足责事件-1.png', '铃音-铃音的穿鞋足责事件-2.png', '铃音-铃音的穿鞋足责事件3.png'],
      },
      {
        id: 'pants_footjob_male',
        name: '铃音-隔裤足交榨精事件',
        description:
          '你被铃音击败后，她脱下自己的鞋子，从背后抱住你，双脚隔着你的裤子夹住性器上下快速撸动并从脚底发出微弱的电流传进你的体内，最终你受不了这样的快感，被榨出了精液。',
        images: ['铃音-铃音足交榨精事件.png'],
      },
      {
        id: 'lick_feet_male',
        name: '铃音-舔脚事件',
        description:
          '你被铃音击败后，她一只脚穿着足袋，另一只光着脚，穿着足袋的脚踩在你的脸上并让你舔她的脚，另一只则踩在你的性器上，并且释放微弱的电流刺激你的身体的每一个神经。',
        images: ['铃音-铃音的舔脚事件.png'],
      },
      {
        id: 'ball_crush_male',
        name: '铃音-金玉大爆碎事件',
        description: '你被铃音击败后，她将你绑在椅子上，用足踹你的肉棒，你在这痛中感觉到了前所未有的快感，射了出来',
        images: ['铃音-铃音的金玉大爆碎事件.png'],
      },
      {
        id: 'sock_smell_pants_footjob_male',
        name: '铃音-闻袜足交事件',
        description:
          '你被铃音击败后，她来到你的后面从背后锁住你，脱下一只袜子盖在你的鼻子处，她的双脚不断地隔着你的裤子挑逗你的性器，不断有微弱的电流刺激你的性器，并且她在你的耳边说到:"电流…烧灼你的淫根"最终你射出精液。',
        images: ['铃音-铃音的闻袜足交事件-1.png', '铃音-铃音的闻袜足交事件-2.png', '铃音-铃音的闻袜足交事件-3.png'],
      },
      {
        id: 'footjob_male',
        name: '铃音-足交事件',
        description:
          '你被铃音击败后，她用她灵巧的小脚上下快速撸动你的性器，时不时用脚心脚背夹住你的性器按压，这个过程中她释放微弱的电流，你在双重攻势下被榨出精液。',
        images: ['铃音-铃音的足交事件-1.png', '铃音-铃音的足交事件-2.png', '铃音-铃音的足交事件-3.png'],
      },
      {
        id: 'twins_stinky_sock_training_male',
        name: '风音铃音-双子臭袜调教事件',
        description:
          '你被铃音击败后，风音与铃音将你推倒在地上，将穿了一天带着浓郁体味的袜子褪下，套在你的肉棒上面，捂在你的脸上，这股奇妙的体味让你沉迷，还会时不时传来她们对你肉棒的按压，在这场气味盛宴中，你射了出来，并且永远离不开这股气味了',
        images: ['铃音-风音铃音的双子臭袜调教事件.png'],
      },
      {
        id: 'twins_training_male',
        name: '风音铃音-双子调教事件',
        description:
          '你被铃音击败后，风音与铃音将你绑在椅子上，一个人用足大力碾压你的肉棒，一个挑逗你的乳头和与你舌吻，下体因为足交产生快感，上身被挑逗露出情欲，在双重的快感压迫下，你射了出来，成为了她们的共享公狗',
        images: [
          '铃音-风音铃音的双子调教事件-1.png',
          '铃音-风音铃音的双子调教事件-2.png',
          '铃音-风音铃音的双子调教事件-3.png',
        ],
      },
      {
        id: 'twins_facesitting_training_male',
        name: '风音铃音-双子调教坐脸事件',
        description:
          '你被铃音击败后，风音与铃音将你推到榻榻米上，脱光了衣服只留下含有体味的袜子，其中一个人坐在你的脸上，另一个人坐在你立起来的肉棒上，铃音与铃音在你的身上进行百合舌吻和乳头摩擦，你闻着足和小穴的气味，舔舐着你上面一人的小穴，看着她们淫乱的百合做爱，射了进去',
        images: ['铃音-风音铃音的双子调教坐脸事件-1.png', '铃音-风音铃音的双子调教坐脸事件-2.png'],
      },
      {
        id: 'twins_ear_lick_training_male',
        name: '风音铃音-双子舔耳事件',
        description:
          '你被铃音击败后，被推到在地，风音与铃音分别在你的身边两侧，她们伸出香舌舔舐你的双耳，手在你的肉棒上按压，轻轻的揣摩龟头，将你的包皮拉下又拉下，有时又重重的按压龟头，而你听着耳畔传来的舔舐水声，无法自控，射了出来',
        images: ['铃音-风音铃音的双子舔耳事件.png'],
      },
      {
        id: 'twins_ear_lick_footjob_male',
        name: '风音铃音-双子舔耳足交事件',
        description:
          '你被铃音击败后，被推到在地，风音与铃音分别在你的身边两侧，她们伸出香舌舔舐你的双耳，她们的足在你的肉棒上踩踏按压，轻轻的揣摩龟头，将你的包皮拉下又拉下，有时又重重的按压龟头，而你听着耳畔传来的舔舐水声，感受着足的气味与柔软，无法自控，射了出来',
        images: ['铃音-风音铃音的双子舔耳足交事件-1.png', '铃音-风音铃音的双子舔耳足交事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'male_victory_twins_bondage',
        name: '铃音-双子捆绑战胜事件',
        description: '你战胜了风音和铃音双子，并且把她们绑在了一起，铃音说到:"我们…被污秽了…请…对我们进行…反向净化"',
        images: ['铃音-双子捆绑战胜事件-1.png', '铃音-双子捆绑战胜事件-2.png', '铃音-双子捆绑战胜事件-3.png'],
      },
      {
        id: 'male_victory_twins_dogeza',
        name: '铃音-战胜双子土下座事件',
        description:
          '你战胜了风音和铃音双子，来到了她们的住处后她们朝你做了标准的土下座，并且她们说到:"从今天起我们只为你做净化仪式，以后请尽情使用我们的身体。"',
        images: ['铃音-战胜双子土下座事件.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'female_pet_lingyin_1',
        name: '铃音-成为铃音的败宠事件',
        description:
          '你被铃音击败后，她一只脚穿着足袋，另一只光着脚，穿着足袋的脚踩在你的脸上并让你舔她的脚，另一只则踩在你的性器上，并且释放微弱的电流刺激你的身体的每一个神经，你闻嗅着她充满汗渍的足袋，聆听着她对你的羞辱，不堪重负，小穴喷出淫水',
        images: ['铃音-成为铃音的败宠事件1.png', '铃音-成为铃音的败宠事件2.png'],
      },
      {
        id: 'female_lick_vulva_lingyin',
        name: '铃音-舔阴事件',
        description: '你被铃音击败后，她让你想小狗一样舔她的阴部，她则摸着你的脑袋，一脸戏谑的看着你舔她的阴部的样子',
        images: ['铃音-铃音的舔阴事件-1.png', '铃音-铃音的舔阴事件-2.png'],
      },
      {
        id: 'female_twins_training_lingyin',
        name: '风音铃音-双子调教事件',
        description:
          '你被铃音击败后，风音与铃音将你绑的双手反绑，两个人一起扣挖你的小穴，往你的小穴内塞入三色团子，下体产生了十足的快感，在的快感压迫下，你喷了出来，小穴仍旧在不停的流水，成为了她们的共享母狗',
        images: ['铃音-风音铃音的双子调教事件-1.png', '铃音-风音铃音的双子调教事件-2.png'],
      },
      {
        id: 'female_oil_lingyin',
        name: '铃音-抹油事件',
        description:
          '你被铃音击败后，她让你趴在床上，开始对你涂抹催情精油，看着你发情的模样，她无比满意，决定继续进行调教',
        images: ['铃音-铃音抹油事件-1.png'],
      },
      {
        id: 'female_training_lingyin',
        name: '铃音-调教事件',
        description:
          '你被铃音击败后，她看你可爱的很，决定调教你的小穴，她对你的小穴扣挖不停，看着你潮吹的样子，她貌似很开心',
        images: ['铃音-铃音的调教事件-1.png', '铃音-铃音的调教事件-2.png', '铃音-铃音的调教事件-3.png'],
      },
      {
        id: 'female_dog_training_lingyin',
        name: '铃音-犬伏调教事件',
        description: '你被铃音击败后，被她套上项圈，她牵着链条坐在了你的身上，宣告你成为了她的母狗',
        images: ['铃音-铃音的犬伏调教事件-1.png', '铃音-铃音的犬伏调教事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'female_victory_twins_bondage',
        name: '铃音-双子捆绑战胜事件',
        description: '你战胜了风音和铃音双子，并且把她们绑在了一起，铃音说到:"我们…被污秽了…请…对我们进行…反向净化"',
        images: ['铃音-双子捆绑战胜事件-1.png', '铃音-双子捆绑战胜事件-2.png', '铃音-双子捆绑战胜事件-3.png'],
      },
      {
        id: 'female_victory_twins_dogeza',
        name: '铃音-战胜双子土下座事件',
        description:
          '你战胜了风音和铃音双子，来到了她们的住处后她们朝你做了标准的土下座，并且她们说到:"从今天起我们只为你做净化仪式，以后请尽情使用我们的身体"',
        images: ['铃音-战胜双子土下座事件.png'],
      },
      {
        id: 'female_victory_lingyin',
        name: '铃音-战胜铃音事件',
        description:
          '你战胜了铃音和铃音双子，你命令风音与你一起调教铃音，你舔舐着她的小穴，风音亲吻着铃音，双手调教着着铃音的双乳（风音似乎很乐意调教铃音呢）',
        images: ['铃音-战胜铃音事件-1.png'],
      },
    ],
  },
};

// 神崎凛的CG配置
const shenQiLinConfig: CharacterCGConfig = {
  characterName: '神崎凛',
  male: {
    defeat: [
      {
        id: 'panty_blindfold',
        name: '神崎凛-捆绑内裤蒙脸事件',
        description: '你被神崎凛击败，作为惩罚她会将内裤捆你头上，并把你捆绑进行羞辱。',
        images: ['捆绑内裤蒙脸事件-1.png', '捆绑内裤蒙脸事件-2.png', '捆绑内裤蒙脸事件-3.png'],
      },
      {
        id: 'pet_public_humiliation',
        name: '神崎凛-宠物公众羞耻事件',
        description: '你被神崎凛击败，作为惩罚她会用为你戴上项圈，戴上狗链和罪牌，然后在公众地方羞辱你。',
        images: ['宠物公众羞耻事件-1.png', '宠物公众羞耻事件-2.png', '宠物公众羞耻事件-3.png'],
      },
      {
        id: 'recording_humiliation',
        name: '神崎凛-录像捆绑羞辱事件',
        description: '你被神崎凛击败，作为惩罚她会将你捆绑，羞辱你并录像。',
        images: ['录像捆绑羞辱事件-1.png', '录像捆绑羞辱事件-2.png', '录像捆绑羞辱事件-3.png'],
      },
      {
        id: 'stinky_sock_footjob',
        name: '神崎凛-臭味责足交事件',
        description: '你被神崎凛击败，作为惩罚她会把袜子覆盖你的鼻子，并对你进行足交。',
        images: ['臭味责足交事件-1.png', '臭味责足交事件-2.png', '臭味责足交事件-3.png'],
      },
      {
        id: 'duo_bondage_footjob',
        name: '神崎凛-双人捆绑足交事件',
        description: '你被神崎凛击败，作为惩罚她和艾琳海德会长会将你捆绑，并双人足交。',
        images: ['双人捆绑足交事件-1.png', '双人捆绑足交事件-2.png'],
      },
      {
        id: 'bondage_fencing',
        name: '神崎凛-捆绑击剑事件',
        description: '你被神崎凛击败，作为惩罚她将你捆绑，并用假肉棒和你击剑。',
        images: ['捆绑击剑事件-1.png'],
      },
      {
        id: 'bondage_toy_training',
        name: '神崎凛-捆绑道具调教事件',
        description: '你被神崎凛击败，作为惩罚她将你捆住床上，并且用震动棒和假阳具使用道具对你进行调教。',
        images: ['捆绑道具调教事件-1.png', '捆绑道具调教事件-2.png'],
      },
      {
        id: 'defeat_invitation',
        name: '神崎凛-战败邀请事件',
        description: '你被神崎凛击败，但是神崎凛认为你有一定的潜力，邀请你加入学生会',
        images: ['战败邀请事件-1.png'],
      },
      {
        id: 'bondage_blowjob',
        name: '神崎凛-捆绑口交事件',
        description: '你被神崎凛击败，你被捆绑在椅子上，并被她内裤套头，乳头夹上架子，并且进行口交榨精',
        images: ['捆绑口交事件-1 .png', '捆绑口交事件-2.png', '捆绑口交事件-3.png'],
      },
      {
        id: 'bondage_trample',
        name: '神崎凛-捆绑踩头事件',
        description: '你被神崎凛击败，作为惩罚她会将你捆绑，并用丝足踩你的头。',
        images: ['捆绑足踩事件-1.png', '捆绑足踩事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'punishment_victory',
        name: '神崎凛-惩罚战胜事件',
        description: '你战胜了神崎凛，她会被艾琳会长认为丢了脸，因此对她进行百合性爱调教惩罚。',
        images: ['惩罚战胜事件-1.png', '惩罚战胜事件-2.png'],
      },
      {
        id: 'bondage_victory',
        name: '神崎凛-捆绑战胜事件',
        description: '你战胜了神崎凛，你把她捆绑起来羞辱。',
        images: ['捆绑战胜事件-1.png', '捆绑战胜事件-2.png'],
      },
      {
        id: 'invitation_victory',
        name: '神崎凛-战胜邀请事件',
        description: '你战胜了神崎凛，因此神崎凛邀请你加入学生会',
        images: ['学生会邀请事件-1.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'blindfold_cunnilingus',
        name: '神崎凛-蒙眼舔阴事件',
        description: '你被神崎凛击败，作为惩罚她会用内裤蒙上你的眼睛，强制你为她舔阴服务。',
        images: ['蒙眼舔阴事件-1.png', '蒙眼舔阴事件-2.png', '蒙眼舔阴事件-3.png'],
      },
      {
        id: 'nipple_punishment',
        name: '神崎凛-摸阴乳头责事件',
        description: '你被神崎凛击败，作为惩罚她会用丝足钳制你，然后一边乳头责，一边摸阴。',
        images: ['摸阴乳头责事件-1.png'],
      },
      {
        id: 'pet_public_humiliation_female',
        name: '神崎凛-宠物公众羞耻事件',
        description: '你被神崎凛击败，作为惩罚她会用为你戴上项圈，然后在公众地方羞辱你。',
        images: ['宠物公众羞耻事件-1.png', '宠物公众羞耻事件-2.png'],
      },
      {
        id: 'recording_humiliation_female',
        name: '神崎凛-录像捆绑羞辱事件',
        description: '你被神崎凛击败，作为惩罚她会将你捆绑，并摩擦你的敏感部位并录像。',
        images: ['录像捆绑羞辱事件-1.png', '录像捆绑羞辱事件-2.png', '录像捆绑羞辱事件-3.png'],
      },
      {
        id: 'duo_bondage_humiliation',
        name: '神崎凛-双人捆绑羞辱事件',
        description: '你被神崎凛击败，作为惩罚艾琳会长会为你戴上项圈，用丝足踩头羞辱，同时神崎凛会玩弄你的乳头。',
        images: ['双人捆绑羞辱事件-1.png'],
      },
      {
        id: 'blindfold_hanging',
        name: '神崎凛-蒙眼吊挂事件',
        description: '你被神崎凛击败，作为惩罚她会蒙上你的眼睛，将你吊挂并用假肉棒羞辱你。',
        images: ['蒙眼吊挂事件-1.png', '蒙眼吊挂事件-2.png'],
      },
      {
        id: 'bondage_trample_female',
        name: '神崎凛-捆绑踩头事件',
        description: '你被神崎凛击败，作为惩罚她会将你捆绑，并用丝足踩你的头。',
        images: ['捆绑踩头事件-1.png'],
      },
      {
        id: 'bondage_shoe_trample',
        name: '神崎凛-捆绑足踩事件',
        description: '你被神崎凛击败，作为惩罚她会将你捆绑并用鞋子踩你。',
        images: ['捆绑足踩事件-1.png', '捆绑足踩事件-2.png'],
      },
      {
        id: 'bondage_panty_face_sit',
        name: '神崎凛-捆绑蒙面放置事件',
        description: '你被神崎凛击败，作为惩罚她会将你捆绑，用内裤蒙上你的脸并将你放置，而你只能眼睁睁看着神崎凛快活。',
        images: ['捆绑蒙面放置事件-1.png'],
      },
      {
        id: 'yuri_sex',
        name: '神崎凛-百合贝合事件',
        description: '你被神崎凛击败，作为惩罚她会对你进行百合贝合。',
        images: ['百合贝合事件-1.png', '百合贝合事件-2.png', '百合贝合事件-3.png'],
      },
      {
        id: 'defeat_invitation_female',
        name: '神崎凛-战败邀请事件',
        description: '你被神崎凛击败，神崎凛邀请你加入学生会',
        images: ['学生会邀请事件-1.png'],
      },
    ],
    victory: [
      {
        id: 'punishment_victory_female',
        name: '神崎凛-惩罚战胜事件',
        description: '你战胜了神崎凛，她会被艾琳海德会长认为丢了脸，因此在你面前对她进行充满爱意的百合性爱调教惩罚。',
        images: ['惩罚战胜事件-1.png', '惩罚战胜事件-2.png'],
      },
      {
        id: 'bondage_victory_female',
        name: '神崎凛-捆绑战胜事件',
        description: '你战胜了神崎凛，你把她捆绑起来羞辱。',
        images: ['捆绑战胜事件-1.png', '捆绑战胜事件-2.png'],
      },
      {
        id: 'play_victory',
        name: '神崎凛-玩弄战胜事件',
        description: '你战胜了神崎凛，你可以随意玩弄她的身体。',
        images: ['玩弄战胜事件-1.png'],
      },
      {
        id: 'service_victory',
        name: '神崎凛-侍奉战胜事件',
        description: '你战胜了神崎凛，按照规则她需要服侍您，但是她会为强制捆绑你，但为你进行支配性侍奉清洁。',
        images: ['侍奉战胜事件-1.png'],
      },
      {
        id: 'invitation_victory_female',
        name: '神崎凛-战胜邀请事件',
        description: '你战胜了神崎凛，神崎凛邀请你加入学生会',
        images: ['战胜邀请事件-1.png'],
      },
    ],
  },
};

// 小鸟游雏子的CG配置
const xiaoNiaoYouChuZiConfig: CharacterCGConfig = {
  characterName: '小鸟游雏子',
  male: {
    defeat: [
      {
        id: 'handjob_milking',
        name: '小鸟游-手交榨取事件',
        description: '你被小鸟游击败，作为惩罚她会把你绑在椅子上，一边看书一边用空出的手榨取你的精液。',
        images: ['小鸟游-手交榨取事件-1.png', '小鸟游-手交榨取事件-2.png'],
      },
      {
        id: 'footjob_milking',
        name: '小鸟游-足交榨取事件',
        description: '你被小鸟游击败，作为惩罚她会强忍着羞耻，将你的肉棒踩在她小巧白皙的白丝脚丫下尝试足交。',
        images: ['小鸟游-足交榨取事件-1.png', '小鸟游-足交榨取事件-2.png', '小鸟游-足交榨取事件-3.png'],
      },
      {
        id: 'blowjob_milking',
        name: '小鸟游-口交榨取事件',
        description: '你被小鸟游击败，作为惩罚她会强忍着羞耻，用樱桃小口榨取你的精液。',
        images: ['小鸟游-口交榨取事件-1.png', '小鸟游-口交榨取事件-2.png'],
      },
      {
        id: 'ntr_nene',
        name: '小鸟游-宁宁NTR事件',
        description: '你被宁宁击败，作为惩罚她会在你面前命令小鸟游为自己舔阴服务。',
        images: ['小鸟游-宁宁NTR事件.png'],
      },
      {
        id: 'ntr_nene_idle',
        name: '小鸟游-宁宁NTR放置事件',
        description:
          '你被宁宁击败，作为惩罚她会将全裸的你绑在椅子上并用小鸟游的内裤塞住嘴巴，而你只能一边眼睁睁看着小鸟游被宁宁调教一边被自动飞机杯榨取。',
        images: [
          '小鸟游-宁宁NTR放置事件-1.png',
          '小鸟游-宁宁NTR放置事件-2.png',
          '小鸟游-宁宁NTR放置事件-3.png',
          '小鸟游-宁宁NTR放置事件-4.png',
        ],
      },
      {
        id: 'ntr_nene_humiliation',
        name: '小鸟游-宁宁NTR羞辱事件',
        description:
          '你被宁宁击败，作为惩罚全裸的你绑在椅子上，然后一边在你面前调教小鸟游一边嘲笑只能被自动飞机杯榨取的你。',
        images: ['小鸟游-宁宁NTR羞辱事件.png'],
      },
      {
        id: 'naked_apron',
        name: '小鸟游-裸体围裙事件',
        description: '你被小鸟游击败，今天没有惩罚，她会穿上裸体围裙为你做咖喱并鼓励弱小的你。',
        images: ['小鸟游-裸体围裙事件-1.png', '小鸟游-裸体围裙事件-2.png'],
      },
      {
        id: 'footjob_humiliation',
        name: '小鸟游-足交羞辱事件',
        description:
          '你被小鸟游击败，作为惩罚她将你绑在椅子上，然后脱下一只袜子，一边在你耳边自贬羞辱你一边用小巧的赤足和丝足从背后榨取你的精液。',
        images: ['小鸟游-足交羞辱事件-1.png', '小鸟游-足交羞辱事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'blowjob_service',
        name: '小鸟游-口交服务事件',
        description: '你战胜了小鸟游，作为奖励你可以让小鸟游强忍羞耻用樱桃小口为你服务。',
        images: ['小鸟游-口交服务事件-1.png', '小鸟游-口交服务事件-2.png'],
      },
      {
        id: 'footjob_service',
        name: '小鸟游-足交服务事件',
        description: '你战胜了小鸟游，作为奖励你可以让小鸟游强忍羞耻用她小巧白皙的白丝脚丫为你足交。',
        images: ['小鸟游-足交服务事件-1.png', '小鸟游-足交服务事件-3.png', '小鸟游-足交服务事件-4.png'],
      },
      {
        id: 'naked_apron_victory',
        name: '小鸟游-裸体围裙战胜事件',
        description: '你战胜了小鸟游，作为奖励她会穿上裸体围裙为你做一顿美味的咖喱。',
        images: ['小鸟游-裸体围裙战胜事件-1.png', '小鸟游-裸体围裙战胜事件-2.png'],
      },
      {
        id: 'duo_footjob_service',
        name: '小鸟游-宁宁共同足交事件',
        description: '你战胜了宁宁，宁宁和雏子会一起用小脚为你服务以表达帮助她们和好的感谢。',
        images: ['小鸟游-宁宁共同足交事件-1.png', '小鸟游-宁宁共同足交事件-2.png', '小鸟游-宁宁共同足交事件-3.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'reading_training',
        name: '小鸟游-看书调教事件',
        description: '你被小鸟游击败，作为惩罚她会把你绑在椅子上，一边看书一边用空出的手调教你。',
        images: ['小鸟游-看书调教事件-1.png', '小鸟游-看书调教事件-2.png'],
      },
      {
        id: 'cunnilingus_training',
        name: '小鸟游-口交调教事件',
        description: '你被小鸟游击败，作为惩罚她会让你坐在床边，强忍着羞耻舔舐你的小穴进行调教。',
        images: ['小鸟游-口交调教事件.png'],
      },
      {
        id: 'ntr_nene_female',
        name: '小鸟游-宁宁NTR事件',
        description: '你被宁宁击败，作为惩罚她会在你面前命令小鸟游为自己舔阴服务。',
        images: ['小鸟游-宁宁NTR事件.png'],
      },
      {
        id: 'ntr_nene_idle_female',
        name: '小鸟游-宁宁NTR放置事件',
        description:
          '你被宁宁击败，作为惩罚她会将你绑在椅子上并用小鸟游的内裤塞住嘴巴，而你只能眼睁睁看着小鸟游被宁宁调教。',
        images: ['小鸟游-宁宁NTR放置事件-1.png', '小鸟游-宁宁NTR放置事件-2.png', '小鸟游-宁宁NTR放置事件-3.png'],
      },
      {
        id: 'naked_apron_female',
        name: '小鸟游-裸体围裙事件',
        description: '你被小鸟游击败，今天没有惩罚，她会穿上裸体围裙为你做咖喱并鼓励弱小的你。',
        images: ['小鸟游-裸体围裙事件-1.png', '小鸟游-裸体围裙事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'cunnilingus_victory',
        name: '小鸟游-战胜口交事件',
        description: '你战胜了小鸟游，作为奖励小鸟游会强忍着羞耻为你舔舐小穴服务。',
        images: ['小鸟游-战胜口交事件.png'],
      },
      {
        id: 'naked_apron_victory_female',
        name: '小鸟游-裸体围裙战胜事件',
        description: '你战胜了小鸟游，作为奖励她会穿上裸体围裙为你做一顿美味的咖喱。',
        images: ['小鸟游-裸体围裙战胜事件-1.png', '小鸟游-裸体围裙战胜事件-2.png', '小鸟游-裸体围裙战胜事件-3.png'],
      },
      {
        id: 'yuri_3p',
        name: '小鸟游-3P百合性爱事件',
        description: '你战胜了宁宁，宁宁和雏子会与你进行甜蜜的百合3P性爱以表达帮助她们和好的感谢。',
        images: ['小鸟游-3P百合性爱事件-1.png', '小鸟游-3P百合性爱事件-2.png', '小鸟游-3P百合性爱事件-3.png'],
      },
    ],
  },
};

// 沐芯兰的CG配置
const muXinLanConfig: CharacterCGConfig = {
  characterName: '沐芯兰',
  male: {
    defeat: [
      {
        id: 'body_mecha_milking',
        name: '本体机械奸榨精调教事件',
        description:
          '你被沐芯兰击败，沐芯兰会从幕后慢慢走出，命令茉莉给你换上紧缚的胶衣，强行把你在胶衣中勃起的肉棒塞进机械飞机杯中，在你被快感侵袭的时候，沐芯兰慢慢走到你的身后，双足摩擦你的大腿根部，嘴中结巴的吐出淫语，让你彻底拜倒在她的身下',
        images: ['沐芯兰-本体机械奸榨精调教事件-1.png'],
      },
      {
        id: 'puppet_transformation',
        name: '机娘傀儡改造事件',
        description:
          '你被沐芯兰击败，被茉莉放到了改造椅上，四肢被束缚，沐芯兰从后面钻出，给你带上洗脑装置，沐芯兰对你的身体注入纳米改造液，你感受到极致的快感，像是茉莉与沐芯兰同时在舔舐你的所有敏感点，你的身体逐渐改变为女性，变得机械化，同时洗脑装置对你的大脑进行搅动与重塑，你最终成为了沐芯兰的机娘傀儡，永远沉溺在沐芯兰的足下',
        images: ['沐芯兰-机娘傀儡改造事件-1.png', '沐芯兰-机娘傀儡改造事件-2.png', '沐芯兰-机娘傀儡改造事件-3.png'],
      },
      {
        id: 'mecha_training',
        name: '机械奸调教事件',
        description:
          '你被沐芯兰击败，茉莉将你束缚在调教装置上，你的四肢被金属环束缚，她将机械飞机杯套在你的肉棒上，飞机杯内壁分出不同的细小机械虫钻入你的尿道，摩擦你的敏感点，你想射却被锁住尿道射不出来，吸奶罩也在对乳头进行调教，你只能在快感中沉沦，发出公狗发情一样的叫声',
        images: ['沐芯兰-机械奸调教事件-1.png'],
      },
      {
        id: 'bondage_training',
        name: '拘束调教事件',
        description:
          '你被沐芯兰击败，沐芯兰将你用龟甲缚的方式捆绑住，将跳蛋绑在你的阴囊和乳头上，绳子压迫着你不断膨胀的肉棒，沐芯兰露出雌小鬼一样的笑容，手慢慢摩擦你的乳头，一边用遥控器加大跳蛋的力度，在沐芯兰的淫语，绳子的紧缚和跳蛋的快感下，你射了出来',
        images: ['沐芯兰-拘束调教事件-1.png', '沐芯兰-拘束调教事件-2.png', '沐芯兰-拘束调教事件-3.png'],
      },
      {
        id: 'moli_training',
        name: '茉莉调教事件',
        description:
          '你被沐芯兰击败，茉莉将你束缚在调教装置上，你的四肢被金属环束缚，她将机械飞机杯套在你的肉棒上，飞机杯内壁分出不同的细小机械虫钻入你的尿道，摩擦你的敏感点，茉莉的手指延申出细小的机械触手，伸进你的双耳之中，对你进行耳道的调教与洗脑，你被快感折磨的露出阿黑颜，在快感中沉沦，发出公狗发情一样的叫声，不停的在飞机杯中喷出汩汩精液',
        images: ['沐芯兰-茉莉调教事件-1.png', '沐芯兰-茉莉调教事件-2.png', '沐芯兰-茉莉调教事件-3.png'],
      },
      {
        id: 'dorm_duo_dog_training',
        name: '宿舍双人训狗调教事件',
        description:
          '你被沐芯兰击败，她在你的脖子上系了一个精致的皮质项圈，锁链的另一端系在了沐芯兰的假阳具上。你被迫以犬伏的样子趴在床上，屁穴被茉莉用假阳具狠狠的开发着，沐芯兰在她的假阳具上涂满了自己的汗液，用它在你的嘴里暴力抽插，你舔着沐芯兰的气味，感受着屁穴的快感，肉棒不住的留下前列腺液，像一只公狗一样，喉咙里发出舒服的呜咽',
        images: [
          '沐芯兰-宿舍双人训狗调教事件-1.png',
          '沐芯兰-宿舍双人训狗调教事件-2.png',
          '沐芯兰-宿舍双人训狗调教事件-3.png',
          '沐芯兰-宿舍双人训狗调教事件-4.png',
        ],
      },
      {
        id: 'duo_mecha_milking',
        name: '双人机械奸榨精事件',
        description:
          '你被沐芯兰击败，沐芯兰会从幕后慢慢走出，命令茉莉给你戴上吸奶器，套上飞机杯，双足摩擦你被飞机杯套住的肉棒根部，你勃起的肉棒被塞进机械飞机杯中，在你被快感侵袭的时候，茉莉慢慢走到你的身后，晃了晃手中的控制器，在你的哀求中调到最大档位，你被巨大的快感侵袭，意识模糊，嘴中结巴的吐出淫语',
        images: [
          '沐芯兰-双人机械奸榨精事件-1.png',
          '沐芯兰-双人机械奸榨精事件-2.png',
          '沐芯兰-双人机械奸榨精事件-3.png',
        ],
      },
      {
        id: 'double_service',
        name: '双重侍奉事件',
        description:
          '你被沐芯兰击败，沐芯兰坐到了你的脸上，她的屁股填满了你的视线，你闻着她小穴的香气时，茉莉坐在了你勃起的肉棒上，被茉莉的机械小穴包裹，茉莉用加热模块、旋转螺纹、吸吮泵的模块甚至比真正的肉穴还要舒服，她的旋转螺纹侵入你的尿道，仿生肉壁包裹着你的肉棒，你享受着沐芯兰蜜穴的气味和茉莉的机械小穴，沉沦了下去',
        images: ['沐芯兰-双重侍奉事件-1.png', '沐芯兰-双重侍奉事件-2.png'],
      },
      {
        id: 'humiliation',
        name: '羞辱事件',
        description:
          '你被沐芯兰击败，你的四肢被束缚在床上，沐芯兰一只脚踩在你的脸上，一只脚玩弄着你的乳头，茉莉用机械蜜穴在你的脸庞喷出阵阵带有催情物质的骚穴气息，她的手调教着你的另一只乳头，你闻着沐芯兰足的汗香和茉莉骚穴的气息，肉棒射了出来',
        images: ['沐芯兰-羞辱事件-1.png'],
      },
      {
        id: 'drug_training',
        name: '药物调教事件',
        description:
          '你被沐芯兰击败，你的四肢被铁链束缚在床上，沐芯兰爬在了你的身上，往你身上涂抹春药，你乳头挺立，肉棒充血，却迟迟得不到释放，受到了寸止的折磨',
        images: ['沐芯兰-药物调教事件-1.png', '沐芯兰-药物调教事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'victory_reward',
        name: '战胜事件',
        description:
          '你战胜了沐芯兰，你看着惊慌无措的她，决定好好的调教她一番，她现在是你的了（痒痒地狱，遛母狗，浑身敏感度开发，媚药浸泡）发挥你的想象吧！',
        images: ['沐芯兰-战胜事件.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'futanari_transformation',
        name: '扶她改造事件',
        description:
          '你被沐芯兰击败，沐芯兰会从幕后慢慢走出，给你喂下变成扶她的药，看着你长出的肉棒，沐芯兰命令茉莉给你戴上吸奶器，套上飞机杯，双足摩擦你被飞机杯套住的肉棒根部，你的双乳立起，渐渐被吸出了乳汁，你勃起的肉棒被塞进机械飞机杯中，在你被快感侵袭的时候，茉莉慢慢走到你的身后，晃了晃手中的控制器，在你的哀求中调到最大档位，你被巨大的快感侵袭，意识模糊，嘴中结巴的吐出淫语',
        images: ['沐芯兰-扶她改造事件-1.png', '沐芯兰-扶她改造事件-2.png', '沐芯兰-扶她改造事件-3.png'],
      },
      {
        id: 'puppet_transformation_female',
        name: '机娘傀儡改造事件',
        description:
          '你被沐芯兰击败，被茉莉放到了改造椅上，四肢被束缚，沐芯兰从后面钻出，给你带上洗脑装置，沐芯兰对你的身体注入纳米改造液，你感受到极致的快感，像是茉莉与沐芯兰同时在舔舐你的所有敏感点，你的身体逐渐变得机械化，同时洗脑装置对你的大脑进行搅动与重塑，你最终成为了沐芯兰的机娘傀儡，永远沉溺在沐芯兰的足下',
        images: ['沐芯兰-机娘傀儡改造事件-1.png', '沐芯兰-机娘傀儡改造事件-2.png'],
      },
      {
        id: 'latex_bondage_training',
        name: '拘束衣调教事件',
        description:
          '你被沐芯兰击败，沐芯兰会从幕后慢慢走出，命令茉莉给你换上紧缚的胶衣，茉莉强行把你架在她的身前，沐芯兰在你的小穴和屁穴塞入自慰棒，随着自慰棒的震动，和身旁沐芯兰的淫语，你逐渐露出阿黑颜，眼里冒出爱心',
        images: ['沐芯兰-拘束衣调教事件-1.png', '沐芯兰-拘束衣调教事件-2.png', '沐芯兰-拘束衣调教事件-3.png'],
      },
      {
        id: 'moli_training_female',
        name: '茉莉调教事件',
        description:
          '你被沐芯兰击败，茉莉将你束缚在调教装置上，你的四肢被金属环束缚，她将吸奶罩套在你的双乳和小穴上，吸奶罩分出不同的细小机械虫钻入你的小穴和乳头，摩擦你的敏感点，茉莉的手指延申出细小的机械触手，伸进你的双耳之中，对你进行耳道的调教与洗脑，茉莉还在你的屁穴塞入自慰棒通过机器让它上下抽插你的屁穴，你被快感折磨的露出阿黑颜，在快感中沉沦，发出母狗发情一样的叫声，不停的在飞机杯中喷出汩汩爱液',
        images: ['沐芯兰-茉莉调教事件-1.png', '沐芯兰-茉莉调教事件-2.png'],
      },
      {
        id: 'dorm_moli_solo_dog_training',
        name: '宿舍茉莉单人训狗调教事件',
        description:
          '你被沐芯兰击败，茉莉在你的脖子上系了一个精致的皮质项圈，锁链的另一端被茉莉握住。你被迫以犬伏的样子趴在床上，屁穴被茉莉用假阳具狠狠的开发着，你的双眼被戴上眼罩，感受着屁穴的快感，小穴不住的留下爱液，像一只母狗一样，喉咙里发出舒服的呜咽',
        images: [
          '沐芯兰-宿舍茉莉单人训狗调教事件-1.png',
          '沐芯兰-宿舍茉莉单人训狗调教事件-2.png',
          '沐芯兰-宿舍茉莉单人训狗调教事件-3.png',
        ],
      },
      {
        id: 'dorm_duo_dog_training_female',
        name: '宿舍双人训狗调教事件',
        description:
          '你被沐芯兰击败，她在你的脖子上系了一个精致的皮质项圈，锁链的另一端被茉莉握住。你被迫以犬伏的样子趴在床上，屁穴被茉莉用假阳具狠狠的开发着，沐芯兰看着可爱的你，与你进行着舌吻，你的双眼被戴上眼罩，感受着屁穴的快感和与沐芯兰的唾液交换，小穴不住的留下爱液，像一只母狗一样，喉咙里发出舒服的呜咽',
        images: ['沐芯兰-宿舍双人训狗调教事件-1.png', '沐芯兰-宿舍双人训狗调教事件-2.png'],
      },
      {
        id: 'womb_regression_training',
        name: '胎内回归拘束调教事件',
        description:
          '你被沐芯兰击败，茉莉将小腹打开，将你包裹进她的体内，她分出体内的机械拟态触手，按摩调教着你的乳头和小穴，你甚至感受到了在母亲子宫内的安心感，逐渐放下了反抗的心思（在被茉莉放出来之后，会认为茉莉是自己的母亲）',
        images: ['沐芯兰-胎内回归拘束调教事件-1.png', '沐芯兰-胎内回归拘束调教事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'victory_reward',
        name: '战胜事件',
        description:
          '你战胜了沐芯兰，你看着惊慌无措的她，决定好好的调教她一番，她现在是你的了（痒痒地狱，遛母狗，浑身敏感度开发，媚药浸泡）发挥你的想象吧！',
        images: ['沐芯兰-战胜事件.png'],
      },
      {
        id: 'victory_training',
        name: '战胜调教事件',
        description:
          '你战胜了沐芯兰，作为一个M，你决定操控茉莉让她对你和沐芯兰进行调教，茉莉将你们的脖子上系了精致的皮质项圈，将链条系在一起，同时对你和沐芯兰进行母狗调教',
        images: ['沐芯兰-战胜调教事件-1.png', '沐芯兰-战胜调教事件-2.png'],
      },
    ],
  },
};

// 白石响子的CG配置
const baiShiXiangZiConfig: CharacterCGConfig = {
  characterName: '白石响子',
  male: {
    defeat: [
      {
        id: 'nursing_handjob_edging',
        name: '白石-哺乳手交寸止事件',
        description:
          '你被白石击败，作为惩罚她会解开衣物露出丰满的乳房，强迫你吸吮她硕大乳房中流出的甘甜母乳,同时用沾满乳汁的、温暖柔软的手进行手交，却始终不让你射精。',
        images: ['白石-哺乳手交寸止事件-1.png', '白石-哺乳手交寸止事件-2.png'],
      },
      {
        id: 'anal_development',
        name: '白石-肛门开发事件',
        description:
          '你被白石击败，作为惩罚她会将你骑在身下，用特制的、涂满润滑液和她体液的细长教鞭探入你的后庭进行开发。',
        images: ['白石-肛门开发事件-1.png', '白石-肛门开发事件-2.png'],
      },
      {
        id: 'ass_face_sit',
        name: '白石-屁股骑脸事件',
        description:
          '你被白石击败，作为惩罚她会将丰腴饱满、充满弹性的臀部骑在你的脸上进行彻底的压制与羞辱，让你在乳香与窒息感中接受特殊指导。',
        images: ['白石-屁股骑脸事件-1.png', '白石-屁股骑脸事件-2.png'],
      },
      {
        id: 'rimjob',
        name: '白石-舔肛事件',
        description:
          '你被白石击败，作为惩罚她会令你屈辱地趴在地上，然后用她灵活温热的舌头精准舔舐、吮吸你的后庭以“清洁你内心的污秽”。',
        images: ['白石-舔肛事件-1.png', '白石-舔肛事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'victory_reward',
        name: '白石-战胜事件',
        description: '你战胜了白石，你可以一边对她硕大的乳房肆意妄为一边进行调教。',
        images: ['白石响子-战胜事件.png', '白石响子-战胜事件2.png'],
      },
      {
        id: 'cow_public_training',
        name: '白石-乳牛公开调教事件',
        description: '你战胜了白石，你可以命令她穿上羞耻的乳牛装，然后在她的学生面前对她进行公开调教。',
        images: ['白石响子-乳牛公开调教事件.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'nursing_fingering_edging',
        name: '白石-哺乳手交寸止事件',
        description:
          '你被白石击败，作为惩罚她会解开衣物露出丰满的乳房，强迫你吸吮她硕大乳房中流出的甘甜母乳,同时用沾满乳汁的、温暖柔软的手插入你的小穴，却始终不让你高潮。',
        images: ['白石-哺乳手交寸止事件-1.png', '白石-哺乳手交寸止事件-2.png'],
      },
      {
        id: 'anal_development_female',
        name: '白石-肛门开发事件',
        description: '你被白石击败，作为惩罚她会戴上特制的手套，用灵巧细长的手指探入你的后庭进行开发。',
        images: ['白石-肛门开发事件-1.png', '白石-肛门开发事件-2.png'],
      },
      {
        id: 'ass_face_sit_female',
        name: '白石-屁股骑脸事件',
        description:
          '你被白石击败，作为惩罚她会将丰腴饱满、充满弹性的臀部骑在你的脸上进行彻底的压制与羞辱，让你在乳香与窒息感中接受特殊指导。',
        images: ['白石-屁股骑脸事件-1.png', '白石-屁股骑脸事件-2.png'],
      },
      {
        id: 'rimjob_female',
        name: '白石-舔肛事件',
        description:
          '你被白石击败，作为惩罚她会令你摆出屈辱的姿势，然后用她灵活温热的舌头精准舔舐、吮吸你的后庭以“清洁你内心的污秽”。',
        images: ['白石-舔肛事件-1.png', '白石-舔肛事件-2.png', '白石-舔肛事件-3.png'],
      },
    ],
    victory: [
      {
        id: 'milk_squeezing',
        name: '白石-挤奶事件',
        description: '你战胜了白石，你可以将她压在身下，从背后挤压她饱满的乳房以榨取新鲜香甜的母乳。',
        images: ['白石-挤奶事件-1.png', '白石-挤奶事件-2.png'],
      },
      {
        id: 'cow_training',
        name: '白石-奶牛事件',
        description: '你战胜了白石，你可以命令她穿上羞耻的奶牛装，然后一边用机器榨取她甘甜的母乳一边调教她。',
        images: ['白石-奶牛事件-1.png', '白石-奶牛事件-2.png'],
      },
      {
        id: 'cunnilingus_service',
        name: '白石-舔穴事件',
        description: '你战胜了白石，你可以命令她一边讨好你一边卖力地为你舔穴服务。',
        images: ['白石-舔穴事件-1.png', '白石-舔穴事件-2.png'],
      },
    ],
  },
};

// 艾琳海德的CG配置
const aiLinHaiDeConfig: CharacterCGConfig = {
  characterName: '艾琳海德',
  male: {
    defeat: [
      {
        id: 'human_chair',
        name: '艾琳海德-人肉座椅事件',
        description: '你被艾琳海德击败，作为处罚你需要作为她的人肉椅子3小时，她会坐在你身上处理公务。',
        images: ['艾琳海德-人肉座椅事件-1.png', '艾琳海德-人肉座椅事件-2.png'],
      },
      {
        id: 'whip_punishment',
        name: '艾琳海德-鞭打事件',
        description: '你被艾琳海德击败，作为处罚你需要被她充满媚药的软鞭鞭打15分钟。',
        images: ['艾琳海德-鞭打事件.png'],
      },
      {
        id: 'armpit_milking',
        name: '艾琳海德-腋下榨精事件',
        description: '你被艾琳海德击败，作为处罚你需要被她有着少女清香以及略微酸涩的腋交榨精事件。',
        images: ['艾琳海德-腋下榨精事件-1.png', '艾琳海德-腋下榨精事件-2.png'],
      },
      {
        id: 'imprisonment',
        name: '艾琳海德-监禁事件',
        description: '你被艾琳海德击败，并且不知道为何惹火了她，她决定把你送到bf社的调教座椅上调教3小时。',
        images: ['艾琳海德-监禁室事件.png'],
      },
      {
        id: 'ass_face_punishment',
        name: '艾琳海德-臀下处罚事件',
        description: '你被艾琳海德击败，作为处罚她用充满气息的臀下压迫摩擦你的脸部，一边玩弄你的下体。',
        images: ['艾琳海德-臀下惩罚事件.png'],
      },
      {
        id: 'foot_trampling',
        name: '艾琳海德-玉足踩踏事件',
        description: '你被艾琳海德击败，作为处罚她用穿着黑丝和高跟的脚，希望你能够好好道歉，否则会有更多惩罚。',
        images: ['艾琳海德-玉足踩踏事件-1.png'],
      },
      {
        id: 'hypnosis',
        name: '艾琳海德-催眠事件',
        description: '你被艾琳海德击败，作为处罚你被她轻松催眠，并且植入性癖，但是对你的好感提升了20。',
        images: ['艾琳海德-催眠事件.png'],
      },
      {
        id: 'thighjob',
        name: '艾琳海德-素股事件',
        description: '你被艾琳海德击败，作为处罚你被她的黑丝大腿素股榨精一次。',
        images: ['艾琳海德-素股榨精事件.png'],
      },
      {
        id: 'normal_punishment',
        name: '艾琳海德-普通惩罚事件',
        description: '你被艾琳海德击败，作为处罚她对你进行了普通的惩罚。',
        images: ['艾琳海德-普通惩罚事件.png'],
      },
    ],
    victory: [
      {
        id: 'victory_reward',
        name: '艾琳海德-战胜事件',
        description: '你战胜艾琳海德，她可以为你口交一次，至于其他要求只能取决于对你的好感。',
        images: ['艾琳海德-战胜事件.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'human_chair',
        name: '艾琳海德-人肉座椅事件',
        description:
          '你被艾琳海德击败，作为处罚你需要赤身裸体地四肢跪地，头戴眼罩，口里含着她的袜子作为她的人肉椅子3小时，她会坐在你身上处理公务。',
        images: ['艾琳海德-人肉座椅事件-1.png', '艾琳海德-人肉座椅事件-2.png'],
      },
      {
        id: 'bondage_yuri_discipline',
        name: '艾琳海德-捆绑百合调教事件',
        description: '你被艾琳海德击败，作为处罚你需要被龟甲缚并且在床上玩弄。',
        images: [
          '艾琳海德-捆绑百合调教事件-1.png',
          '艾琳海德-捆绑百合调教-2事件.png',
          '艾琳海德-捆绑百合调教事件事件-2.png',
        ],
      },
      {
        id: 'armpit_domination',
        name: '艾琳海德-腋下支配事件',
        description: '你被艾琳海德击败，作为处罚你需要被她有着少女清香以及略微酸涩的腋下洗脑。',
        images: ['艾琳海德-腋下支配事件事件.png'],
      },
      {
        id: 'normal_punishment',
        name: '艾琳海德-普通惩罚事件',
        description: '你被艾琳海德击败，她轻松放过了你，让你多点练习。',
        images: ['艾琳海德-普通惩罚事件.png'],
      },
      {
        id: 'ass_face_punishment',
        name: '艾琳海德-臀下处罚事件',
        description: '你被艾琳海德击败，作为处罚她用充满气息的臀下压迫摩擦你的脸部，一边玩弄你的下体。',
        images: ['艾琳海德-臀下处罚事件.png'],
      },
      {
        id: 'hypnosis',
        name: '艾琳海德-催眠事件',
        description: '你被艾琳海德击败，作为处罚你被她轻松催眠，无条件听命于她。并且植入性癖，但是对你的好感提升了20。',
        images: ['艾琳海德-催眠事件.png'],
      },
    ],
    victory: [
      {
        id: 'victory_reward',
        name: '艾琳海德-战胜事件',
        description: '你战胜艾琳海德，她带上了项圈让你惩罚她一次(学院规矩)。',
        images: ['艾琳海德-战胜事件.png'],
      },
    ],
  },
};

// 露娜拉克缇丝的CG配置
const luNaLaKeDiSiConfig: CharacterCGConfig = {
  characterName: '露娜拉克缇丝',
  male: {
    defeat: [
      {
        id: 'anal_licking_paizuri',
        name: '露娜拉克缇丝-舔肛乳交事件',
        description: '你被露娜击败，作为惩罚，她让你学狗趴下，从你身后一边为你乳交，一边用舌头深入你的后穴。',
        images: [
          '露娜拉克缇丝-舔肛乳交事件-1.png',
          '露娜拉克缇丝-舔肛乳交事件-2.png',
          '露娜拉克缇丝-舔肛乳交事件-3.png',
        ],
      },
      {
        id: 'bra_face_footjob',
        name: '露娜拉克缇丝-胸罩盖脸足交事件',
        description:
          '你被露娜击败，作为惩罚，她把你放在身上一边用浓郁奶香和酸涩的巨大奶罩覆盖你的面部，一边从你背后用玉足足交榨取。',
        images: ['露娜拉克缇丝-胸罩盖脸足交事件-1.png', '露娜拉克缇丝-胸罩盖脸足交事件-2.png'],
      },
      {
        id: 'breast_aroma_handjob',
        name: '露娜拉克缇丝-乳香支配手淫事件',
        description: '你被露娜击败，作为惩罚你坐在她身上，头被她的奶子夹着，一边轻语为你手淫。',
        images: ['露娜拉克缇丝-乳香支配手淫事件-1.png', '露娜拉克缇丝-乳香支配手淫事件-2.png'],
      },
      {
        id: 'double_extraction',
        name: '露娜拉克缇丝-前后同榨事件',
        description: '你被露娜击败，作为惩罚你的阴茎被榨取器榨取，一边被尾巴插入开发屁穴。',
        images: ['露娜拉克缇丝-前后同榨事件.png'],
      },
      {
        id: 'shota_wall_milking',
        name: '露娜拉克缇丝-正太化按墙榨精事件',
        description:
          '你被露娜击败，作为惩罚，她把你变成小正太，用巨大乳房把你按在墙上，让你两脚悬空，并且用手淫，前内腺开发你。',
        images: [
          '露娜拉克缇丝-正太化按墙榨精事件-1.png',
          '露娜拉克缇丝-正太化按墙榨精事件-2.png',
          '露娜拉克缇丝-正太化按墙榨精事件-3.png',
        ],
      },
      {
        id: 'nursing_tail_anal',
        name: '露娜拉克缇丝-哺乳与尾巴后穴开发事件',
        description: '你被露娜击败，作为惩罚她一边为你哺乳（增加0.1潜力），一边用尾巴搅动你的屁穴。',
        images: ['露娜拉克缇丝-哺乳与尾巴后穴开发事件-1.png', '露娜拉克缇丝-哺乳与尾巴后穴开发事件-2.png'],
      },
      {
        id: 'pussy_teasing',
        name: '露娜拉克缇丝-小穴摩擦事件',
        description: '你被露娜击败，作为惩罚，她用小穴摩擦你的下体但是禁止你进入。',
        images: ['露娜拉克缇丝-小穴摩擦事件.png'],
      },
      {
        id: 'anal_milking',
        name: '露娜拉克缇丝-肛交榨取事件',
        description: '你被露娜击败，今天没有惩罚，但是她想试试用后穴的快感，用屁穴榨精。',
        images: ['露娜拉克缇丝-肛交榨取事件-1.png', '露娜拉克缇丝-肛交榨取事件-2.png'],
      },
      {
        id: 'paizuri_service',
        name: '露娜拉克缇丝-乳交榨取事件',
        description: '你被露娜击败，今天没有惩罚，她会用乳房温柔侍奉你。',
        images: ['露娜拉克缇丝-乳交榨取事件.png'],
      },
      {
        id: 'succubus_transformation',
        name: '（稀有事件）露娜拉克缇丝-乳魔化事件',
        description:
          '你被露娜击败，作为惩罚你被她注入魅魔化因子，并且带你到镜子前一边让你观看自己性转雌堕与魅魔化的形态，一边开发你的乳首（让你分泌乳汁）和下体。',
        images: ['露娜拉克缇丝-乳魔化事件-1.png', '露娜拉克缇丝-乳魔化事件-2.png'],
        probability: 0.04,
      },
      {
        id: 'womb_regression',
        name: '（稀有事件）露娜拉克缇丝-胎内回归事件',
        description: '你被露娜击败，作为惩罚，她把你缩小塞入子宫，时间快进在一个月后，你会作为她的乳魔女儿降生。',
        images: ['露娜拉克缇丝-胎内回归事件.png'],
        probability: 0.04,
      },
    ],
    victory: [
      {
        id: 'paizuri_victory',
        name: '露娜拉克缇丝-乳交战胜事件',
        description: '你战胜了露娜，她会用乳交服侍您。',
        images: ['露娜拉克缇丝-乳交战胜事件.png'],
      },
      {
        id: 'anal_victory',
        name: '露娜拉克缇丝-肛交战胜事件',
        description: '你战胜了露娜，她会用后穴服侍您。',
        images: ['露娜拉克缇丝-肛交战胜事件-1.png', '露娜拉克缇丝-肛交战胜事件-2.png'],
      },
      {
        id: 'pussy_victory',
        name: '（稀有事件）露娜拉克缇丝-小穴战胜事件',
        description: '你战胜了露娜，她允许你插入她的小穴。',
        images: ['露娜拉克缇丝-小穴战胜事件.png'],
        probability: 0.15,
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'dogeza_submission',
        name: '露娜拉克缇丝-土下座臣服事件',
        description: '你被露娜击败，作为惩罚，她让你土下座后给予1000天海信用点后让你离开。',
        images: ['露娜拉克缇丝-土下座臣服事件-1.png', '露娜拉克缇丝-土下座臣服事件-2.png'],
      },
      {
        id: 'yuri_sex',
        name: '露娜拉克缇丝-百合事件',
        description: '你被露娜击败，今天没有惩罚，她会和你进行百合性爱。',
        images: ['露娜拉克缇丝-百合事件.png'],
      },
      {
        id: 'breast_aroma_handjob_female',
        name: '露娜拉克缇丝-乳香支配手淫事件',
        description: '你被露娜击败，作为惩罚你坐在她身上，你被带上奶嘴和尿裤，头被她的奶子夹着，一边轻语为你手淫。',
        images: [
          '露娜拉克缇丝-乳香支配手淫事件-1.png',
          '露娜拉克缇丝-乳香支配手淫事件-2.png',
          '露娜拉克缇丝-乳香支配手淫事件-3.png',
        ],
      },
      {
        id: 'handjob_event',
        name: '露娜拉克缇丝-手淫事件',
        description: '你被露娜击败，她会手淫让你高潮后让你离开。',
        images: ['露娜拉克缇丝-手淫事件.png'],
      },
      {
        id: 'loli_wall_training',
        name: '露娜拉克缇丝-萝莉化按墙调教事件',
        description:
          '你被露娜击败，作为惩罚，她把你变成萝莉，用巨大乳房把你按在墙上，让你两脚悬空，并且一边用假阳具插入你的小穴，一边用尾巴开发你的后穴。',
        images: ['露娜拉克缇丝-萝莉化按墙调教事件-1.png', '露娜拉克缇丝-萝莉化按墙调教事件-2.png'],
      },
      {
        id: 'nursing_tail_development',
        name: '露娜拉克缇丝-哺乳与尾巴后穴开发事件',
        description: '你被露娜击败，作为惩罚她一边为你哺乳（增加0.1潜力），一边用尾巴搅动你的屁穴和小穴。',
        images: ['露娜拉克缇丝-哺乳与尾巴后穴开发事件.png', '露娜拉克缇丝-哺乳与尾巴后穴开发事件-2.png'],
      },
      {
        id: 'cow_public_humiliation',
        name: '露娜拉克缇丝-母牛公开处刑事件',
        description:
          '你被露娜击败，作为惩罚，她把你的胸部变大，并且让你穿上奶牛服牵着你一起在广场逛街，结束后会给予3000天海信用点补偿。',
        images: ['露娜拉克缇丝-母牛公开处刑事件.png'],
      },
      {
        id: 'puppy_play',
        name: '露娜拉克缇丝-母狗扮演事件',
        description:
          '你被露娜击败，你被她带上项圈，牵上狗绳，带上耳朵和尾巴肛塞，需要作为她的可爱小母狗一起度过3小时调教，她会温柔对待您。',
        images: ['露娜拉克缇丝-母狗扮演事件-1.png', '露娜拉克缇丝-母狗扮演事件-2.png'],
      },
      {
        id: 'forced_dildo_sitting',
        name: '露娜拉克缇丝-强制假阳具坐事件',
        description: '你被露娜击败，她让你坐在椅子的魔法假阳具上，并且给予奖励。',
        images: ['露娜拉克缇丝-强制假阳具坐事件.png'],
      },
      {
        id: 'succubus_riding',
        name: '（稀有事件）露娜拉克缇丝-乳魔骑乘事件',
        description:
          '你被露娜击败，作为惩罚她用扶她肉棒插入你的小穴，一边抽插注入魅魔化因子，一边刻画淫纹，即将成为她的乳魔妹妹。',
        images: ['露娜拉克缇丝-乳魔骑乘事件.png'],
        probability: 0.03,
      },
      {
        id: 'succubus_transformation_female',
        name: '（稀有事件）露娜拉克缇丝-乳魔化事件',
        description:
          '你被露娜击败，作为惩罚你被她注入魅魔化因子，并且带你到镜子前一边让你观看自己恶堕魅魔化的形态，你的头发变得像露娜一样紫色，一边开发你的乳房（让乳房变大和分泌乳汁）和小穴。',
        images: ['露娜拉克缇丝-乳魔化事件.png', '露娜拉克缇丝-乳魔化事件-1.png', '露娜拉克缇丝-乳魔化事件-2.png'],
        probability: 0.03,
      },
      {
        id: 'womb_regression_female',
        name: '（稀有事件）露娜拉克缇丝-胎内回归事件',
        description: '你被露娜击败，作为惩罚，她把你缩小塞入子宫，时间快进在一个月后，你会作为她的乳魔女儿降生。',
        images: ['露娜拉克缇丝-胎内回归事件.png'],
        probability: 0.03,
      },
    ],
    victory: [
      {
        id: 'yuri_victory',
        name: '露娜拉克缇丝-百合战胜事件',
        description: '你战胜了露娜，她会和你进行温柔的百合性爱。',
        images: ['露娜拉克缇丝-百合战胜事件.png'],
      },
      {
        id: 'puppy_play_victory',
        name: '（稀有事件）露娜拉克缇丝-母狗扮演战胜事件',
        description: '你战胜了露娜，她会在三小时内扮演你的小母狗（之后解除）。',
        images: ['露娜拉克缇丝-母狗扮演战胜事件.png'],
        probability: 0.15,
      },
    ],
  },
};

// 雪莉克里姆希尔德的CG配置
const xueLiKeLinMuXiErDeConfig: CharacterCGConfig = {
  characterName: '雪莉克里姆希尔德',
  male: {
    defeat: [
      {
        id: 'chastity_footjob',
        name: '雪莉-带锁足交事件',
        description:
          '你被雪莉击败，作为惩罚她会给你带上贞操锁，一边展示黑丝包裹的小穴色诱，一边为你足交，但是让你难以射精。',
        images: ['雪莉-带锁足交事件-1.png', '雪莉-带锁足交事件-2.png', '雪莉-带锁足交事件-3.png'],
      },
      {
        id: 'sock_sniffing_footjob',
        name: '雪莉-闻袜足交事件',
        description: '你被雪莉击败，作为惩罚，你被她强制闻她的黑丝，一边被她黑丝与裸足的双重足穴榨取。',
        images: ['雪莉-闻袜足交事件-1.png', '雪莉-闻袜足交事件-2.png'],
      },
      {
        id: 'humiliation_footjob',
        name: '雪莉-羞辱足交事件',
        description: '你被雪莉击败，作为惩罚她站起来用黑丝脚碾压坐在地下的你的肉棒让其射精。',
        images: ['雪莉-羞辱足交事件-1.png', '雪莉-羞辱足交事件-2.png'],
      },
      {
        id: 'humiliation_event',
        name: '雪莉-羞辱事件',
        description: '你被雪莉击败，她用黑丝玉足轻踩你头，并且询问你是否愿意加入成为女权协会的狗。',
        images: ['雪莉-羞辱事件-1.png', '雪莉-羞辱事件-2.png'],
      },
      {
        id: 'puppy_training',
        name: '雪莉-小狗驯服事件',
        description: '你被雪莉击败，作为惩罚她给你穿上狗耳，尾巴阳具，以及项圈狗链。',
        images: ['雪莉-小狗驯服事件.png'],
      },
      {
        id: 'shoe_sock_brainwash',
        name: '雪莉-鞋袜气味洗脑事件',
        description: '你被雪莉击败，作为惩罚她坐在桌上用两个脚掌闭合成足穴并且拿出散发诱人酸涩的运动鞋诱惑洗脑你。',
        images: ['雪莉-鞋袜气味洗脑事件-1.png', '雪莉-鞋袜气味洗脑事件-2.png'],
      },
      {
        id: 'onahole_milking',
        name: '雪莉-飞机杯榨取事件',
        description: '你被雪莉击败，作为惩罚她用来自女权协会某人的倒模飞机杯榨取。',
        images: ['雪莉-飞机杯榨取事件.png'],
      },
      {
        id: 'library_footjob',
        name: '雪莉-图书馆足交事件',
        description: '你被雪莉击败，作为惩罚她把你带到图书馆，在桌下为你足交，不要被其他人发现哦。',
        images: ['雪莉-图书馆足交事件-1.png', '雪莉-图书馆足交事件-2.png'],
      },
      {
        id: 'restraint_ejaculation_control',
        name: '雪莉-约束射精管理事件',
        description: '你被雪莉击败，作为惩罚她用蕾丝项圈绑住你的下体，一边舔弄撸动肉棒。',
        images: ['雪莉-约束射精管理事件-1.png', '雪莉-约束射精管理事件-2.png'],
      },
      {
        id: 'urethra_straw_torture',
        name: '雪莉-马眼责吸管事件',
        description:
          '你被雪莉击败，作为惩罚她使用金属纤细吸管，插入你的马眼，一边撸动肉棒，一边搅动马眼，并且吸取汁液。',
        images: ['雪莉-马眼责吸管事件.png'],
      },
      {
        id: 'footjob_milking',
        name: '雪莉-足交榨精事件',
        description: '你被雪莉击败，她将用玉足榨取你一次。',
        images: ['雪莉-足交榨精事件.png'],
      },
      {
        id: 'forced_shoejob',
        name: '雪莉-强制鞋交事件',
        description: '你被雪莉击败，她将用小皮鞋套弄你的肉棒，用鞋穴让你染上恋物癖。',
        images: ['雪莉-强制鞋交事件.png'],
      },
      {
        id: 'panty_footjob',
        name: '（稀有事件）雪莉-内裤足交事件',
        description: '你被雪莉击败，作为惩罚她会在肉棒上套着粉红内裤，为你足交。',
        images: ['雪莉-内裤足交事件.png'],
        probability: 0.08,
      },
      {
        id: 'locker_room_training',
        name: '（稀有事件）雪莉-换衣间气味调教事件',
        description:
          '你被雪莉击败，作为惩罚你被带到女权协会的更衣室，里面堆满了各种没洗的丝袜内裤和胸罩，并且准备对你开始小狗调教。',
        images: ['雪莉-换衣间气味调教事件-1.png', '雪莉-换衣间气味调教事件-2.png'],
        probability: 0.08,
      },
    ],
    victory: [
      {
        id: 'puppy_victory',
        name: '雪莉-小狗战胜事件',
        description: '你战胜了雪莉，作为奖励你可以给她带着项圈，调教她一次。',
        images: ['雪莉-小狗战胜事件.png', '雪莉-小狗战胜事件-1.png'],
      },
      {
        id: 'footjob_service',
        name: '雪莉-足交服务事件',
        description: '你战胜了雪莉，作为奖励她用美脚为你温柔服务。',
        images: ['雪莉-战胜足交服务事件.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'yuri_training_sex',
        name: '雪莉-百合调教性爱事件',
        description: '你被雪莉击败，作为惩罚她会穿上色情衣物和你进行贝合性爱。',
        images: ['雪莉-百合调教性爱事件-1.png', '雪莉-百合调教性爱事件-2.png', '雪莉-百合调教性爱事件-3.png'],
      },
      {
        id: 'humiliation_event_female',
        name: '雪莉-羞辱事件',
        description: '你被雪莉击败，她用黑丝玉足轻踩你头，并且询问你是否愿意加入女权协会。',
        images: ['雪莉-羞辱事件-1.png', '雪莉-羞辱事件-2.png'],
      },
      {
        id: 'puppy_training_female',
        name: '雪莉-小狗驯服事件',
        description: '你被雪莉击败，作为惩罚她给你穿上狗耳，尾巴阳具，以及项圈狗链。',
        images: ['雪莉-小狗驯服事件-1.png', '雪莉-小狗驯服事件-2.png'],
      },
      {
        id: 'shoe_sock_brainwash_female',
        name: '雪莉-鞋袜气味洗脑事件',
        description: '你被雪莉击败，作为惩罚她坐在桌上用两个脚掌闭合成足穴并且拿出散发诱人酸涩的运动鞋诱惑洗脑你。',
        images: ['雪莉-鞋袜气味洗脑事件-1.png', '雪莉-鞋袜气味洗脑事件-2.png'],
      },
      {
        id: 'kiss_gift',
        name: '（稀有事件）雪莉-献吻事件',
        description: '你被雪莉击败，今天没有惩罚，她给你献上一吻鼓励你继续加油。',
        images: ['雪莉-献吻事件-1.png'],
        probability: 0.08,
      },
      {
        id: 'locker_room_training_female',
        name: '（稀有事件）雪莉-换衣间气味调教事件',
        description:
          '你被雪莉击败，作为惩罚你被带到女权协会的更衣室，里面堆满了各种没洗的丝袜内裤和胸罩，并且准备对你开始小狗调教。',
        images: ['雪莉-换衣间气味调教事件-1.png', '雪莉-换衣间气味调教事件-2.png', '雪莉-换衣间气味调教事件-3.png'],
        probability: 0.1,
      },
    ],
    victory: [
      {
        id: 'puppy_victory_female',
        name: '雪莉-小狗战胜事件',
        description: '你战胜了雪莉，作为奖励你可以给她打赏项圈调教她一次。',
        images: ['雪莉-小狗战胜事件-1.png', '雪莉-小狗战胜事件-2.png'],
      },
      {
        id: 'yuri_kiss_victory',
        name: '雪莉-百合之吻战胜事件',
        description: '你战胜了雪莉，作为奖励她献上了少女的香吻。',
        images: ['雪莉-百合之吻战胜事件-1.png'],
      },
    ],
  },
};

// 美咲绫的CG配置
const meiSuiLingConfig: CharacterCGConfig = {
  characterName: '美咲绫',
  male: {
    defeat: [
      {
        id: 'bondage_smell_edging',
        name: '美咲绫-束缚气味寸止事件',
        description:
          '你被美咲绫击败，做为惩罚，她将你束缚在床，用发丝绑住你的四肢，屁股坐在你的脸上，将小穴贴紧你的嘴巴，让你只能被迫闻嗅她的气息，舔舐她的小穴，她再控制一缕发丝扎入你的尿道，控制射精（寸止），让你坠入她的发丝气味地狱中',
        images: ['美咲绫-束缚气味寸止事件-1.png', '美咲绫-束缚气味寸止事件-2.png', '美咲绫-束缚气味寸止事件-3.png'],
      },
      {
        id: 'brainwash_transformation',
        name: '美咲绫-洗脑改造事件',
        description:
          '你被美咲绫击败，做为惩罚，她褪下和服，露出白皙的身子（有足袋），与你水乳相容，你感受着她的气息与柔软，突然，她操控发丝钻入你的双耳，对你实施洗脑改造，让你堕落为她的奴隶（你被她的身躯包裹，沉溺在她的乳肉气味之间，脸呈现阿黑颜状态，瞳孔变成心形）',
        images: [
          '美咲绫-洗脑改造事件-1.png',
          '美咲绫-洗脑改造事件-2.png',
          '美咲绫-洗脑改造事件-3.png',
          '美咲绫-洗脑改造事件-4.png',
        ],
      },
      {
        id: 'tea_footjob_extraction',
        name: '美咲绫-浇茶足交榨精事件',
        description:
          '你被美咲绫击败，做为惩罚，她将你推在地上，自己坐在椅子上，将足袋套在你的肉棒上，玉足研磨着你的乳头，将茶水浇灌在被套了足袋的肉棒上，表情却无比温柔',
        images: [
          '美咲绫-浇茶足交榨精事件-1.png',
          '美咲绫-浇茶足交榨精事件-2.png',
          '美咲绫-浇茶足交榨精事件-3.png',
          '美咲绫-浇茶足交榨精事件-4.png',
        ],
      },
      {
        id: 'smell_training_shoe_licking',
        name: '美咲绫-气味调教舔鞋事件',
        description: '你被美咲绫击败，做为惩罚，她在你的背后进行足交，用头发刺激乳头，手上拿着印着汗渍足印木履捂你的脸',
        images: ['美咲绫-气味调教舔鞋事件-1.png', '美咲绫-气味调教舔鞋事件-2.png', '美咲绫-气味调教舔鞋事件-3.png'],
      },
      {
        id: 'aphrodisiac_extraction',
        name: '美咲绫-媚药榨精事件',
        description: '你被美咲绫击败，做为惩罚，她坐在你的肉棒进行上下摩擦，用茶杯在你的嘴里面灌注媚药',
        images: ['美咲绫-媚药榨精事件-1.png', '美咲绫-媚药榨精事件-2.png'],
      },
      {
        id: 'paizuri_event',
        name: '美咲绫-乳交事件',
        description: '你被美咲绫击败，做为惩罚，她会用乳交让你沉溺在她的怀抱中',
        images: ['美咲绫-乳交事件-1.png', '美咲绫-乳交事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'sow_sex_victory',
        name: '美咲绫-母猪做爱战胜事件',
        description: '美咲绫被击败，露出了M的本色，露出了标准的母猪脸，被你用肉棒狠狠的操',
        images: [
          '美咲绫-母猪做爱战胜事件-1.png',
          '美咲绫-母猪做爱战胜事件-2.png',
          '美咲绫-母猪做爱战胜事件-3.png',
          '美咲绫-母猪做爱战胜事件-4.png',
          '美咲绫-母猪做爱战胜事件-5.png',
        ],
      },
      {
        id: 'paizuri_victory',
        name: '美咲绫-乳交战胜事件',
        description: '你战胜了美咲绫，她会用乳交服侍您',
        images: ['美咲绫-乳交战胜事件-1.png', '美咲绫-乳交战胜事件-2.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'bondage_smell_sex',
        name: '美咲绫-束缚气味做爱事件',
        description:
          '你被美咲绫击败，做为惩罚，她将你束缚在床，用发丝绑住你的四肢，屁股坐在你的脸上，将小穴贴紧你的嘴巴，让你只能被迫闻嗅她的气息，舔舐她的小穴，她控制发丝轻抚你的大腿，同样舔舐你的小穴，让你坠入她的发丝气味地狱中',
        images: ['美咲绫-束缚气味做爱事件-1.png', '美咲绫-束缚气味做爱事件-2.png', '美咲绫-束缚气味做爱事件-3.png'],
      },
      {
        id: 'brainwash_transformation_female',
        name: '美咲绫-洗脑改造事件',
        description:
          '你被美咲绫击败，做为惩罚，她褪下和服（这个元素要呈现），露出白皙的身子（有足袋），与你水乳相容，你感受着她的气息与柔软，突然，她操控发丝钻入你的双耳，对你实施洗脑改造，让你堕落为她的奴隶，你被她的身躯包裹，沉溺在她的乳肉气味之间，脸呈现阿黑颜状态，瞳孔变成心形',
        images: [
          '美咲绫-洗脑改造事件-1.png',
          '美咲绫-洗脑改造事件-2.png',
          '美咲绫-洗脑改造事件-3.png',
          '美咲绫-洗脑改造事件-4.png',
        ],
      },
      {
        id: 'tea_footjob',
        name: '美咲绫-浇茶足交事件',
        description:
          '你被美咲绫击败，做为惩罚，她将你推在地上，自己坐在椅子上，将足袋放在你的脸上上，玉足研磨着你的乳头和小穴，将茶水浇灌在你的身体上，表情无比温柔',
        images: ['美咲绫-浇茶足交事件-1.png', '美咲绫-浇茶足交事件-2.png', '美咲绫-浇茶足交事件-3.png'],
      },
      {
        id: 'smell_training_shoe_licking_female',
        name: '美咲绫-气味调教舔鞋事件',
        description: '你被美咲绫击败，做为惩罚，她在你的背后进行足交，用头发刺激乳头，手上拿着印着汗渍足印木履捂你的脸',
        images: ['美咲绫-气味调教舔鞋事件-1.png', '美咲绫-气味调教舔鞋事件-2.png', '美咲绫-气味调教舔鞋事件-3.png'],
      },
      {
        id: 'aphrodisiac_event',
        name: '美咲绫-媚药事件',
        description:
          '你被美咲绫击败，做为惩罚，她用有汗渍的屁股与小穴在你的身体进行上下摩擦，用茶杯在你的嘴里面灌注媚药',
        images: ['美咲绫-媚药事件.png'],
      },
      {
        id: 'paizuri_event_female',
        name: '美咲绫-乳交事件',
        description: '你被美咲绫击败，做为惩罚，她会用乳交让你沉溺在她的怀抱中',
        images: ['美咲绫-乳交事件-1.png', '美咲绫-乳交事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'sow_service_victory',
        name: '美咲绫-母猪服侍战胜事件',
        description: '美咲绫被击败，露出了M的本色，露出了标准的母猪脸，眼睛露出爱心，给你舔小穴，一脸母猪相',
        images: ['美咲绫-母猪服侍战胜事件-1.png', '美咲绫-母猪服侍战胜事件-2.png'],
      },
      {
        id: 'paizuri_victory_female',
        name: '美咲绫-乳交战胜事件',
        description: '你战胜了美咲绫，她会用乳交服侍您',
        images: ['美咲绫-乳交战胜事件-1.png', '美咲绫-乳交战胜事件-2.png'],
      },
    ],
  },
};

// 芙莲的CG配置
const fuLianConfig: CharacterCGConfig = {
  characterName: '芙莲',
  male: {
    defeat: [
      {
        id: 'fulian_male_step_on_back',
        name: '芙莲-踩踩背事件',
        description:
          '你被芙莲击败，作为惩罚她会给你带上项圈狗链，让你做出士下座臣服姿态，她手牵着项圈的绳索，脚踩在你的背上。',
        images: ['芙莲-踩踩背事件.png', '芙莲-踩踩背事件-2.png', '芙莲-踩踩背事件-3.png'],
      },
      {
        id: 'fulian_male_insertion_temptation',
        name: '芙莲-插入诱惑事件',
        description:
          '你被芙莲击败，作为惩罚，你被迫看着芙莲自己掰开自己的小穴还不断用ASMR低语挑逗你，却不让你插入，在你最饥渴难耐的时候，不断要求你说出“精灵是高等种族”、“精灵大人的美脚/臀/腋/胸至高无上”、“给精灵大人上贡是荣幸”、“男人的精液是垃圾”等心悦诚服的话语，重塑其世界观。',
        images: ['芙莲-插入诱惑事件.png', '芙莲-插入诱惑事件-2.png'],
      },
      {
        id: 'fulian_male_stinky_feet_brainwash',
        name: '芙莲-臭脚洗脑事件',
        description: '你被芙莲击败，作为惩罚她让你站起来，然后自己坐着抬起脚贴在你的脸上，让你闻着她的脚进行无接触射精。',
        images: ['芙莲-臭脚洗脑事件.png', '芙莲-臭脚洗脑事件-2.png', '芙莲-臭脚洗脑事件-3.png'],
      },
      {
        id: 'fulian_male_feminization_early',
        name: '芙莲-雌化初期事件',
        description:
          '你被芙莲击败，她对你进行雌化、去雄化调教，给你喝下粉紫色雌化激素，用粉紫色雌化激素灌肠，戴上乳夹等胸部调教道具，你的下体被她戴上榨取道具，你能感受到身体在发生变化，胸部有微微隆起，女性的快感在不断累计，你高潮了灌肠液从肛门喷涌而出，肉棒痉挛射精，可射出来的却不是精液，而是粉紫色的液体，你能感受到自己的身体在不断雌化。',
        images: ['芙莲-雌化初期事件.png', '芙莲-雌化初期事件-2.png', '芙莲-雌化初期事件-3.png'],
      },
      {
        id: 'fulian_male_feminization_late',
        name: '芙莲-雌化末期事件',
        description:
          '你被芙莲击败，作为惩罚她继续对你进行雌化、去雄化调教，随着新一轮的雌化激素进入身体，你的耳朵变成精灵的尖耳，头发长成光亮顺滑地女性化的长发，胸部已经完全女性化，肉棒明显小了一圈，你能感受到自己已不再是个男人了，芙莲戴上假阳具抽插你的后穴，玩弄你的胸部、乳头，你高潮了却只能射出来透明的液体而不是米白色的精液。',
        images: ['芙莲-雌化末期事件.png', '芙莲-雌化末期事件-2.png', '芙莲-雌化末期事件-3.png'],
      },
      {
        id: 'fulian_male_reverse_riding_footjob',
        name: '芙莲-反仰做爱后足交温存事件',
        description:
          '你被芙莲击败，作为惩罚她反仰坐在你身上进行做爱，待你射精后继续反仰坐在你身上对你进行足交刺激你刚刚射精的肉棒，而刚刚内射的精液从她的小穴中缓缓流出，这样一副色情的画面使你的肉棒再次勃起承受着这既痛苦敏感又舒爽的调教。',
        images: ['芙莲-反仰做爱后足交温存事件.png', '芙莲-反仰做爱后足交温存事件-2.png'],
      },
      {
        id: 'fulian_male_public_taming',
        name: '芙莲-公开驯服事件',
        description: '你被芙莲击败，作为惩罚她把你带到教室，让你戴上项圈狗链，像狗一样臣服拜倒在她脚下，周围的同学议论纷纷，让你感受到无止境的羞耻与一直莫名的爽感。',
        images: ['芙莲-公开驯服事件.png'],
      },
      {
        id: 'fulian_male_baby_event',
        name: '芙莲-乖宝宝事件',
        description:
          '你被芙莲击败，作为惩罚她对你施行“幼儿退行魔法”，使其心智暂时退化为婴儿，她将你穿上婴儿尿布，头上戴上她的原味内裤，用奶瓶或者自己的乳房给你喂奶，喊你是个“乖宝宝”，在这种刺激下你高潮射精，即使你苏醒，你的潜意识也忘不了这段“童年回忆”，忘不了她这个“妈妈”。',
        images: ['芙莲-乖宝宝事件.png', '芙莲-乖宝宝事件-2.png', '芙莲-乖宝宝事件-3.png'],
      },
      {
        id: 'fulian_male_baby_locked_spank',
        name: '芙莲-乖宝宝原味带锁打屁股事件',
        description:
          '你被芙莲击败，作为惩罚她给你的头上套上她的原味内裤或给你的嘴里塞进她的原味白袜，给你的肉棒锁进粉色贞操锁里，让你趴在她的腿上，像一个做错事的婴儿一样被她拍打屁股惩罚，她用ASMR低语要求你做她的“乖宝宝”。',
        images: ['芙莲-乖宝宝原味带锁打屁股事件.png', '芙莲-乖宝宝原味带锁打屁股事件-2.png', '芙莲-乖宝宝原味带锁打屁股事件-3.png'],
      },
      {
        id: 'fulian_male_anal_development',
        name: '芙莲-后庭开发事件',
        description: '你被芙莲击败，她将假阳具安装在自己高跟鞋的鞋跟上，用高跟鞋上的肉片抽插你的后穴，最后让你闻着芙莲的后穴撸管射精。',
        images: ['芙莲-后庭开发事件.png'],
      },
      {
        id: 'fulian_male_classroom_reverse_rape',
        name: '芙莲-教室逆强奸事件',
        description:
          '你被芙莲击败，她将你带到一间空教室，对你进行女上位逆强奸做爱，虽然你被操得很舒服但芙莲要求你小点声，毕竟隔壁的教室还在上课，要是被发现了可就不好哦，你在羞耻与紧张中高潮射精。',
        images: ['芙莲-教室逆强奸事件.png', '芙莲-教室逆强奸事件-2.png'],
      },
      {
        id: 'fulian_male_captive_reverse_cowgirl',
        name: '芙莲-囚禁女上位事件',
        description: '你被芙莲击败，作为惩罚她将你锁在一间空教室里，用女上位反仰做爱，让你高潮射精。',
        images: ['芙莲-囚禁女上位事件.png', '芙莲-囚禁女上位事件-2.png'],
      },
      {
        id: 'fulian_male_kick_neuter',
        name: '芙莲-去雄金蹴事件',
        description: '你被芙莲击败，作为惩罚你被芙莲用那双神圣的白靴，毫不留情地踢击男性的胯下。一边踢一边温柔地数落：“这种肮脏的东西，精灵大人不需要哦~踢坏了也没关系吧？”',
        images: ['芙莲-去雄金蹴事件.png'],
      },
      {
        id: 'fulian_male_thigh_choke',
        name: '芙莲-腿夹窒息事件',
        description: '你被芙莲击败，作为惩罚你被迫跪在地上，她坐在椅子上用大腿夹着你的脖子，你在她紧致、有肉感的大腿中被夹至濒临窒息。',
        images: ['芙莲-腿夹窒息事件.png', '芙莲-腿夹窒息事件-2.png'],
      },
      {
        id: 'fulian_male_shoe_smell_brainwash',
        name: '芙莲-鞋臭洗脑事件',
        description:
          '你被芙莲击败，作为惩罚她将脱下自己白靴，将白靴捂在你的脸上，将你的鼻子深埋进靴筒或直接舔舐被汗水浸透的鞋垫。精灵族的汗液带有特殊的致幻香气，能迅速瓦解人类的意志，使其沦为恋足奴隶。',
        images: ['芙莲-鞋臭洗脑事件.png', '芙莲-鞋臭洗脑事件-2.png', '芙莲-鞋臭洗脑事件-3.png'],
      },
      {
        id: 'fulian_male_shoejob',
        name: '芙莲-鞋交事件',
        description: '你被芙莲击败，作为惩罚她趴在你身上，手摁在你的胸腔，脚上穿着白靴反脚为你鞋交，让你高潮射精。',
        images: ['芙莲-鞋交事件.png', '芙莲-鞋交事件-2.png'],
      },
      {
        id: 'fulian_male_footjob',
        name: '芙莲-足交事件',
        description: '你被芙莲击败，作为惩罚她将用光脚玉足榨取你一次。',
        images: ['芙莲-足交事件.png', '芙莲-足交事件-2.png'],
      },
      {
        id: 'fulian_male_life_liquid_kiss',
        name: '芙莲-生命之液爱吻事件',
        description: '你被芙莲击败，作为惩罚她伸出灵活的舌头对你的肉棒和后穴进行深度爱吻，将唾液作为“生命之液”灌入你的后穴，这种唾液含有强烈的催情与服从成分。',
        images: ['芙莲-生命之液爱吻事件.png', '芙莲-生命之液爱吻事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'fulian_male_fallen_sex_victory',
        name: '芙莲-沉沦性爱战胜事件',
        description: '你战胜了芙莲，作为奖励她将对你进行侍奉式地彻底沉沦的至高做爱，承认你是更高等的存在，并全心全意地服侍你。',
        images: ['芙莲-沉沦性爱战胜事件.png', '芙莲-沉沦性爱战胜事件-2.png'],
      },
      {
        id: 'fulian_male_reverse_ride_footjob_victory',
        name: '芙莲-反仰做爱后足交温存战胜事件',
        description: '你战胜了芙莲，作为奖励她以反仰体位与你做爱，你射精后，她将小穴掰开任精液流出，同时对你以反坐体位足交，进行性爱后的温存。',
        images: ['芙莲-反仰做爱后足交温存战胜事件.png'],
      },
      {
        id: 'fulian_male_handjob_victory',
        name: '芙莲-手交战胜事件',
        description: '你战胜了芙莲，作为奖励，她对你进行手交撸管侍奉，眼里包含爱意。',
        images: ['芙莲-手交战胜事件.png', '芙莲-手交战胜事件-2.png'],
      },
      {
        id: 'fulian_male_tame_victory',
        name: '芙莲-驯服战胜事件',
        description: '你战胜了芙莲，作为奖励你可以给她带着项圈狗链，调教她一次。',
        images: ['芙莲-驯服战胜事件.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'fulian_female_dogeza_spank',
        name: '芙莲-士下座打屁股事件',
        description: '你被芙莲击败，作为惩罚，她让你做出士下座跪倒臣服姿势，她用手不断拍打你的屁股，“要保持这个姿势不要乱动哦~否则惩罚加倍~”芙莲坏笑道。',
        images: ['芙莲-士下座打屁股事件.png', '芙莲-士下座打屁股事件-2.png'],
      },
      {
        id: 'fulian_female_tribbing',
        name: '芙莲-磨豆腐事件',
        description: '你被芙莲击败，作为惩罚，她会和你进行百合性爱，她用小穴紧贴着你的小穴性爱。',
        images: ['芙莲-磨豆腐事件.png', '芙莲-磨豆腐事件-2.png', '芙莲-磨豆腐事件-3.png'],
      },
      {
        id: 'fulian_female_baby_event',
        name: '芙莲-乖宝宝事件',
        description: '你被芙莲击败，作为惩罚你坐在她身上，你被带上奶嘴和尿裤，头被她的乳房夹住，一边ASMR轻语，对你说道“乖宝宝”，一边为你手淫。',
        images: ['芙莲-乖宝宝事件.png', '芙莲-乖宝宝事件-2.png', '芙莲-乖宝宝事件-3.png'],
      },
      {
        id: 'fulian_female_fingering',
        name: '芙莲-指交事件',
        description: '你被芙莲击败，作为惩罚她会用手指隔着你的丝袜与内裤摩擦你的小穴让你高潮。',
        images: ['芙莲-指交事件.png', '芙莲-指交事件-2.png'],
      },
      {
        id: 'fulian_female_elf_girl',
        name: '芙莲-精灵娘事件',
        description:
          '你被芙莲击败，作为惩罚她让你喝下粉紫色雌化激素将你调教、改造成精灵娘，让你戴上各种调教刺激乳头、阴蒂的调教道具，在雌化激素和各种调教道具的作用下，你的耳朵开始变得像精灵一样又长又尖、肤色变白、感官同化，乳房开始喷出粉紫色的乳汁，小穴喷涌出粉紫色的淫水，在失神中彻底转化为只听命于她的精灵族下级眷属。',
        images: ['芙莲-精灵娘事件.png', '芙莲-精灵娘事件-2.png', '芙莲-精灵娘事件-3.png'],
      },
      {
        id: 'fulian_female_public_class_humiliation',
        name: '芙莲-课堂公开羞辱事件',
        description: '你被芙莲击败，作为惩罚她命令你脱光衣服只剩靴子，让你坐到满是学生的教室的讲台上，她掐着你的脖子，你在窒息失神中公开漏尿。',
        images: ['芙莲-课堂公开羞辱事件.png'],
      },
      {
        id: 'fulian_female_cow_training',
        name: '芙莲-母牛调教事件',
        description: '你被芙莲击败，作为惩罚她把你的胸部变大，并且让你穿上奶牛头饰、铃铛项圈和口球，在教室对你进行羞耻调教。',
        images: ['芙莲-母牛调教事件.png', '芙莲-母牛调教事件-2.png'],
      },
      {
        id: 'fulian_female_bondage_tame',
        name: '芙莲-捆绑驯服事件',
        description: '你被芙莲击败，作为惩罚你被她带上项圈，牵上狗绳并捆绑起来，她坐在你的身上将脚放在你的嘴里对你进行调教。',
        images: ['芙莲-捆绑驯服事件.png', '芙莲-捆绑驯服事件-2.png'],
      },
      {
        id: 'fulian_female_strapon_insertion',
        name: '芙莲-穿戴假阳具插入事件',
        description: '你被芙莲击败，作为惩罚她穿戴上假阳具，把你抱到她的腿上操你的小穴。',
        images: ['芙莲-穿戴假阳具插入事件.png'],
      },
      {
        id: 'fulian_female_worship_brainwash',
        name: '芙莲-崇拜思想灌输事件',
        description:
          '你被芙莲击败，作为惩罚她在你意识模糊时，通过ASMR低语不断灌输：“精灵是高等种族”、“精灵大人的美脚/臀/腋/胸至高无上”、“给精灵大人上贡是荣幸”等思想，重塑其世界观，你被她灌输的崇拜思想洗脑，成为了听命于她的人偶。',
        images: ['芙莲-崇拜思想灌输事件.png', '芙莲-崇拜思想灌输事件-2.png'],
      },
      {
        id: 'fulian_female_double_dragon_anal',
        name: '芙莲-后穴双头龙拉珠事件',
        description: '你被芙莲击败，作为惩罚她和你共用双头龙或者拉珠进行后穴性爱。',
        images: ['芙莲-后穴双头龙拉珠事件.png', '芙莲-后穴双头龙拉珠事件-2.png', '芙莲-后穴双头龙拉珠事件-3.png'],
      },
      {
        id: 'fulian_female_kick_crotch',
        name: '芙莲-踢裆金蹴事件',
        description: '你被芙莲击败，作为惩罚，她用那双神圣的白靴，毫不留情地踢击你的胯下。一边踢一边温柔地数落：“这种不洁的小穴，精灵大人不需要哦~踢坏了也没关系吧？”',
        images: ['芙莲-踢裆金蹴事件.png', '芙莲-踢裆金蹴事件-2.png', '芙莲-踢裆金蹴事件-3.png'],
      },
      {
        id: 'fulian_female_step_on_back',
        name: '芙莲-踩踩背事件',
        description: '你被芙莲击败，作为惩罚她命令你摆出士下座臣服姿势，将衣服脱下叠整齐地摆在旁边，她用脚踩在你的背上，若你稍有松懈、姿势不标准，她就立刻用调教鞭抽打你的后背。',
        images: ['芙莲-踩踩背事件.png'],
      },
      {
        id: 'fulian_female_blindfold_pheromone',
        name: '芙莲-蒙眼蜜穴荷尔蒙事件',
        description: '你被芙莲击败，作为惩罚她将你的眼睛蒙上，在一片黑暗中你的嗅觉更加敏锐，她用大腿夹住你的头，让你只能闻到她蜜穴的气息，你在这种淫骚的蜜穴荷尔蒙中沉沦。',
        images: ['芙莲-蒙眼蜜穴荷尔蒙事件.png', '芙莲-蒙眼蜜穴荷尔蒙事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'fulian_female_kiss_breast_victory',
        name: '芙莲-香吻贴乳战胜事件',
        description: '你战胜了芙莲，作为奖励她会和你进行温柔的百合性爱，你们胸部相贴，嘴唇深吻。',
        images: ['芙莲-香吻贴乳战胜事件.png'],
      },
    ],
  },
};

// 黑崎晴雯的CG配置
const heiQiQingWenConfig: CharacterCGConfig = {
  characterName: '黑崎晴雯',
  male: {
    defeat: [
      {
        id: 'heiqi_asmr_airplane_cup_milking_male',
        name: '黑崎晴雯-AMSR飞机杯榨取事件',
        description: '你被黑崎晴雯击败，作为惩罚她会给你套上飞机杯榨取精液，同时用龙尾插入后庭并舔舐你的耳道。',
        images: ['黑崎晴雯-AMSR飞机杯榨取事件-1.png', '黑崎晴雯-AMSR飞机杯榨取事件-2.png', '黑崎晴雯-AMSR飞机杯榨取事件-3.png'],
      },
      {
        id: 'heiqi_thread_edge_milking_male',
        name: '黑崎晴雯-丝线寸止榨精事件',
        description: '你被黑崎晴雯击败，作为惩罚她会用丝线缠绕肉棒反复寸止榨精，让你只能在乞求中承受刺激。',
        images: ['黑崎晴雯-丝线寸止榨精事件-1.png', '黑崎晴雯-丝线寸止榨精事件-2.png', '黑崎晴雯-丝线寸止榨精事件-3.png'],
      },
      {
        id: 'heiqi_night_raid_milking_male',
        name: '黑崎晴雯-夜袭榨精事件',
        description: '你被黑崎晴雯击败，作为惩罚她会在夜里突袭你的宿舍并榨取你的精液。',
        images: ['黑崎晴雯-夜袭榨精事件-1.png', '黑崎晴雯-夜袭榨精事件-2.png'],
      },
      {
        id: 'heiqi_tail_urethra_invasion_male',
        name: '黑崎晴雯-尾交尿道侵犯事件',
        description: '你被黑崎晴雯击败，作为惩罚她会用尾巴缠绕并抽撸你的肉棒，同时以尾尖侵犯你的尿道。',
        images: ['黑崎晴雯-尾交尿道侵犯事件-1.png', '黑崎晴雯-尾交尿道侵犯事件-2.png', '黑崎晴雯-尾交尿道侵犯事件-3.png'],
      },
      {
        id: 'heiqi_humiliation_milking_male',
        name: '黑崎晴雯-羞辱榨取事件',
        description: '你被黑崎晴雯击败，作为惩罚她会一边骑乘榨精一边踩住你的脸，对你进行言语羞辱。',
        images: ['黑崎晴雯-羞辱榨取事件-1.png'],
      },
      {
        id: 'heiqi_footjob_meatus_play_male',
        name: '黑崎晴雯-足交马眼玩弄事件',
        description: '你被黑崎晴雯击败，作为惩罚她会用黑色连裤袜玉足为你足交，并进一步玩弄你的尿道口。',
        images: ['黑崎晴雯-足交马眼玩弄事件-1.png', '黑崎晴雯-足交马眼玩弄事件-2.png'],
      },
      {
        id: 'heiqi_kick_crotch_male',
        name: '黑崎晴雯-踢牛子事件',
        description: '你被黑崎晴雯击败，作为惩罚她会直接踢击你的胯下并嘲讽你的无力反抗。',
        images: ['黑崎晴雯-踢牛子事件-1.png'],
      },
      {
        id: 'heiqi_reverse_rape_male',
        name: '黑崎晴雯-逆强奸事件',
        description: '你被黑崎晴雯击败，作为惩罚她会将你扑倒压制，以强势体位榨取你的精液并持续嘲弄你。',
        images: ['黑崎晴雯-逆强奸事件1.png', '黑崎晴雯-逆强奸事件2.png'],
      },
      {
        id: 'heiqi_shoebottom_footjob_male',
        name: '黑崎晴雯-鞋底足交事件',
        description: '你被黑崎晴雯击败，作为惩罚她会直接以鞋底压迫你的肉棒进行足交惩罚。',
        images: ['黑崎晴雯-鞋底足交事件-1.png'],
      },
      {
        id: 'heiqi_milk_feeding_male',
        name: '黑崎晴雯-喂奶事件',
        description: '你被黑崎晴雯击败，作为惩罚她会将你扑倒并强制喂奶。',
        images: ['黑崎晴雯-喂奶事件-1.png'],
      },
      {
        id: 'heiqi_dragon_egg_vassal_male',
        name: '黑崎晴雯-眷属事件',
        description: '你被黑崎晴雯击败，作为惩罚你的身体会被她重构，化作正在孵化中的龙蛋。',
        images: ['黑崎晴雯-眷属事件-1.png', '黑崎晴雯-眷属事件-2.png'],
      },
    ],
    victory: [
      {
        id: 'heiqi_victory_male',
        name: '黑崎晴雯-战胜事件',
        description: '你战胜了黑崎晴雯，作为奖励你可以尽情支配她并完成一次彻底的征服。',
        images: ['黑崎晴雯-战胜事件-1.png', '黑崎晴雯-战胜事件-2.png', '黑崎晴雯-战胜事件-3.png'],
      },
      {
        id: 'heiqi_face_sit_victory_male',
        name: '黑崎晴雯-坐脸战胜事件',
        description: '你战胜了黑崎晴雯，作为奖励她会娇羞地坐在你的脸上满足你的嗅觉与亲密欲望。',
        images: ['黑崎晴雯-坐脸战胜事件-1.png', '黑崎晴雯-坐脸战胜事件-2.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'heiqi_asmr_tail_invasion_female',
        name: '黑崎晴雯-ASMR龙尾侵犯事件',
        description: '你被黑崎晴雯击败，作为惩罚她会将你束缚并以龙尾、假阳具与耳道挑逗进行多重侵犯。',
        images: ['黑崎晴雯-ASMR龙尾侵犯事件-1.png', '黑崎晴雯-ASMR龙尾侵犯事件-2.png'],
      },
      {
        id: 'heiqi_domineering_tribbing_female',
        name: '黑崎晴雯-霸道磨豆腐事件',
        description: '你被黑崎晴雯击败，作为惩罚她会将你压在身下进行强势磨豆腐调教。',
        images: ['黑崎晴雯-霸道磨豆腐事件-1.png', '黑崎晴雯-霸道磨豆腐事件-2.png', '黑崎晴雯-霸道磨豆腐事件-3.png'],
      },
      {
        id: 'heiqi_domineering_kiss_female',
        name: '黑崎晴雯-霸道亲吻事件',
        description: '你被黑崎晴雯击败，作为惩罚她会以强硬姿态深吻你并进行长时间唾液交换。',
        images: ['黑崎晴雯-霸道亲吻事件-1.png', '黑崎晴雯-霸道亲吻事件-2.png', '黑崎晴雯-霸道亲吻事件-3.png'],
      },
      {
        id: 'heiqi_super_fingering_female',
        name: '黑崎晴雯-超级爆扣事件',
        description: '你被黑崎晴雯击败，作为惩罚她会将你抱起强势玩弄私处，令你在高潮中失去思考。',
        images: ['黑崎晴雯-超级爆扣事件-1.png'],
      },
      {
        id: 'heiqi_obedience_training_female',
        name: '黑崎晴雯-服从性调教事件',
        description: '你被黑崎晴雯击败，作为惩罚她会在亲吻与挑逗中持续摩擦你的私处，迫使你服从。',
        images: ['黑崎晴雯-服从性调教事件-1.png'],
      },
      {
        id: 'heiqi_bondage_training_female',
        name: '黑崎晴雯-拘束调教事件',
        description: '你被黑崎晴雯击败，作为惩罚她会将你拘束并戴上口球，进行支配式调教。',
        images: ['黑崎晴雯-拘束调教事件-1.png', '黑崎晴雯-拘束调教事件-2.png'],
      },
      {
        id: 'heiqi_milk_feeding_female',
        name: '黑崎晴雯-喂奶事件',
        description: '你被黑崎晴雯击败，作为惩罚她会将你扑倒并强制喂奶。',
        images: ['黑崎晴雯-喂奶事件-1.png'],
      },
      {
        id: 'heiqi_dragon_egg_vassal_female',
        name: '黑崎晴雯-眷属事件',
        description: '你被黑崎晴雯击败，作为惩罚你的身体会被重构并转化为龙族眷属形态。',
        images: ['黑崎晴雯-眷属事件-1.png', '黑崎晴雯-眷属事件-2.png'],
      },
      {
        id: 'heiqi_oral_finish_female',
        name: '黑崎晴雯-口爆事件',
        description: '你被黑崎晴雯击败，作为惩罚你会被强制口侍并承受她高潮后的失控喷发。',
        images: ['黑崎晴雯-口爆事件-1.png'],
      },
      {
        id: 'heiqi_beads_tug_of_war_female',
        name: '黑崎晴雯-拉珠拔河事件',
        description: '你被黑崎晴雯击败，作为惩罚她会与你进行拉珠拔河式的羞辱对抗。',
        images: ['黑崎晴雯-拉珠拔河事件-1.png', '黑崎晴雯-拉珠拔河事件-2.png'],
      },
      {
        id: 'heiqi_mount_fingering_female',
        name: '黑崎晴雯-上位爆扣事件',
        description: '你被黑崎晴雯击败，作为惩罚她会将你压在身下从上位强势爆扣至连续高潮。',
        images: ['黑崎晴雯-上位爆扣事件-1.png', '黑崎晴雯-上位爆扣事件-2.png', '黑崎晴雯-上位爆扣事件-3.png'],
      },
      {
        id: 'heiqi_double_dildo_invasion_female',
        name: '黑崎晴雯-双头龙侵犯事件',
        description: '你被黑崎晴雯击败，作为惩罚她会使用双头龙假阳具对你进行深入侵犯。',
        images: ['黑崎晴雯-双头龙侵犯事件-1.png', '黑崎晴雯-双头龙侵犯事件-2.png'],
      },
      {
        id: 'heiqi_smell_foot_tribbing_female',
        name: '黑崎晴雯-闻脚磨豆腐事件',
        description: '你被黑崎晴雯击败，作为惩罚她会一边与你磨豆腐一边将她的连裤袜玉足塞入口中进行气味羞辱。',
        images: ['黑崎晴雯-闻脚磨豆腐事件-1.png'],
      },
      {
        id: 'heiqi_kiss_foot_tribbing_female',
        name: '黑崎晴雯-吻脚磨豆腐事件',
        description: '你被黑崎晴雯击败，作为惩罚她会以磨豆腐姿态调教你并亲吻你的足部。',
        images: ['黑崎晴雯-吻脚磨豆腐事件-1.png'],
      },
      {
        id: 'heiqi_breast_groping_female',
        name: '黑崎晴雯-袭胸捏捏事件',
        description: '你被黑崎晴雯击败，作为惩罚她会揉捏你的胸部与乳头进行快感支配。',
        images: ['黑崎晴雯-袭胸捏捏事件-1.png', '黑崎晴雯-袭胸捏捏事件-2.png'],
      },
      {
        id: 'heiqi_dog_training_female',
        name: '黑崎晴雯-训狗调教事件',
        description: '你被黑崎晴雯击败，作为惩罚她会给你戴上口球和眼罩，把你当作犬类进行骑乘与抽打。',
        images: ['黑崎晴雯-训狗调教事件-1.png', '黑崎晴雯-训狗调教事件-2.png', '黑崎晴雯-训狗调教事件-3.png'],
      },
    ],
    victory: [
      {
        id: 'heiqi_oral_service_victory_female',
        name: '黑崎晴雯-口侍战胜事件',
        description: '你战胜了黑崎晴雯，作为奖励她会主动为你口侍并温柔侍奉。',
        images: ['黑崎晴雯-口侍战胜事件-1.png'],
      },
      {
        id: 'heiqi_cuddle_victory_female',
        name: '黑崎晴雯-贴贴战胜事件',
        description: '你战胜了黑崎晴雯，作为奖励她会以恋人般姿态贴近你并进行亲密互动。',
        images: ['黑崎晴雯-贴贴战胜事件-1.png'],
      },
      {
        id: 'heiqi_dogeza_victory_female',
        name: '黑崎晴雯-土下座战胜事件',
        description: '你战胜了黑崎晴雯，作为奖励她会在屈辱中向你土下座请罪。',
        images: ['黑崎晴雯-土下座战胜事件-1.png'],
      },
      {
        id: 'heiqi_training_victory_female',
        name: '黑崎晴雯-战胜调教事件',
        description: '你战胜了黑崎晴雯，作为奖励你可以将她束缚并进行一次支配调教。',
        images: ['黑崎晴雯-战胜调教事件-1.png'],
      },
      {
        id: 'heiqi_face_sit_victory_female',
        name: '黑崎晴雯-坐脸战胜事件',
        description: '你战胜了黑崎晴雯，作为奖励她会娇羞地坐在你的脸上满足你的癖好。',
        images: ['黑崎晴雯-坐脸战胜事件-1.png', '黑崎晴雯-坐脸战胜事件-2.png'],
      },
    ],
  },
};

// 明日香的CG配置
const mingRiXiangConfig: CharacterCGConfig = {
  characterName: '明日香',
  male: {
    defeat: [
      {
        id: 'asuka_face_step_masturbation_male',
        name: '明日香-踩脸撸管事件',
        description: '你被明日香击败，作为惩罚她会让你趴下并踩住你的脸，同时命令你自行撸管提交精液样本。',
        images: ['明日香-踩脸撸管事件-1.png', '明日香-踩脸撸管事件-2.png'],
      },
      {
        id: 'asuka_manual_cup_milking_male',
        name: '明日香-飞机杯手动榨精事件',
        description: '你被明日香击败，作为惩罚她会以电流刺激飞机杯配合手动套弄，榨取你的精液样本。',
        images: ['明日香-飞机杯手动榨精事件-1.png'],
      },
      {
        id: 'asuka_anal_development_male',
        name: '明日香-后穴开发榨精事件',
        description: '你被明日香击败，作为惩罚她会一边开发你的后穴一边以手与胸部协同榨精。',
        images: ['明日香-后穴开发榨精事件-1.png', '明日香-后穴开发榨精事件-2.png', '明日香-后穴开发榨精事件-3.png'],
      },
      {
        id: 'asuka_cowgirl_intercourse_male',
        name: '明日香-女上位性交事件',
        description: '你被明日香击败，作为惩罚你会被固定在设备椅上并被喂食特制媚药后接受她的女上位榨取。',
        images: ['明日香-女上位性交事件-1.png', '明日香-女上位性交事件-2.png'],
      },
      {
        id: 'asuka_lube_handjob_male',
        name: '明日香-润滑液手交事件',
        description: '你被明日香击败，作为惩罚她会使用特调润滑液大幅提升敏感度并进行手交榨精。',
        images: ['明日香-润滑液手交事件-1.png', '明日香-润滑液手交事件-2.png'],
      },
      {
        id: 'asuka_triple_vibe_anal_male',
        name: '明日香-三重跳蛋假阳具后穴榨精事件',
        description: '你被明日香击败，作为惩罚她会安装多重跳蛋并穿戴可伸缩阳具刺激你的后穴完成榨精。',
        images: ['明日香-三重跳蛋假阳具后穴榨精事件-1.png', '明日香-三重跳蛋假阳具后穴榨精事件-2.png', '明日香-三重跳蛋假阳具后穴榨精事件-3.png'],
      },
      {
        id: 'asuka_glove_lube_handjob_male',
        name: '明日香-手套润滑液手交事件',
        description: '你被明日香击败，作为惩罚她会使用仿触手手套与高敏润滑液进行高强度手交实验。',
        images: ['明日香-手套润滑液手交事件-1 .png', '明日香-手套润滑液手交事件-2.png'],
      },
      {
        id: 'asuka_feetcup_edging_male',
        name: '明日香-特制飞机杯足压迫寸止事件',
        description: '你被明日香击败，作为惩罚她会以双足操控电流飞机杯持续寸止并抑制你射精。',
        images: ['明日香-特制飞机杯足压迫寸止事件-1.png', '明日香-特制飞机杯足压迫寸止事件-2.png', '明日香-特制飞机杯足压迫寸止事件-3.png'],
      },
      {
        id: 'asuka_feetcup_milking_male',
        name: '明日香-特制飞机杯足压迫榨精事件',
        description: '你被明日香击败，作为惩罚她会用双足操控特制电流飞机杯进行高强度榨精。',
        images: ['明日香-特制飞机杯足压迫榨精事件-1.png', '明日香-特制飞机杯足压迫榨精事件-2.png'],
      },
      {
        id: 'asuka_sock_footjob_male',
        name: '明日香-原味穿袜足交事件',
        description: '你被明日香击败，作为惩罚她会在无实验器材时直接以穿袜玉足完成足交并回收样本。',
        images: ['明日香-原味穿袜足交事件-1.png', '明日香-原味穿袜足交事件-2.png'],
      },
      {
        id: 'asuka_brainwash_master_male',
        name: '明日香-洗脑认主事件',
        description: '你被明日香击败，作为惩罚你会被她的试作洗脑应用重塑认知并下跪认主。',
        images: ['明日香-洗脑认主事件-1.png', '明日香-洗脑认主事件-2.png'],
      },
      {
        id: 'asuka_ar_asmr_electric_milking_rare_male',
        name: '（稀有事件）明日香-AR设备ASMR电子榨精事件',
        description: '你被明日香击败，作为惩罚她会启动集大成AR束缚设备与洗脑ASMR，将你的性癖重定向后完成高量榨精。',
        images: ['明日香-AR设备ASMR电子榨精事件-1.png'],
        probability: 0.04,
      },
      {
        id: 'asuka_body_mod_milking_rare_male',
        name: '（稀有事件）明日香-身体改造榨取事件',
        description: '你被明日香击败，作为惩罚你的身体会被半机械化改造为精液生产工具并进行首次榨取测试。',
        images: ['明日香-身体改造榨取事件-1.png', '明日香-身体改造榨取事件-2.png'],
        probability: 0.04,
      },
    ],
    victory: [
      {
        id: 'asuka_flat_chest_play_victory_male',
        name: '明日香-贫乳玩弄事件',
        description: '你战胜了明日香，作为奖励你可以玩弄她的贫乳胸部。',
        images: ['明日香-贫乳玩弄事件-1.png', '明日香-贫乳玩弄事件-2.png'],
      },
      {
        id: 'asuka_forced_intercourse_victory_male',
        name: '明日香-强制性交事件',
        description: '你战胜了明日香，作为奖励她会以服从姿态配合你进行性交。',
        images: ['明日香-强制性交事件-1.png', '明日香-强制性交事件-2.webp'],
      },
      {
        id: 'asuka_stocking_footjob_victory_male',
        name: '明日香-强制丝袜足交事件',
        description: '你战胜了明日香，作为奖励她会用丝袜玉足为你进行足交服侍。',
        images: ['明日香-强制丝袜足交事件-1.png', '明日香-强制丝袜足交事件-2.png'],
      },
      {
        id: 'asuka_reverse_brainwash_asmr_rare_victory_male',
        name: '（稀有事件）明日香-反洗脑ASMR事件',
        description: '你战胜了明日香，作为稀有奖励你可以使用她的洗脑ASMR设备反向束缚并洗脑她。',
        images: ['明日香-反洗脑ASMR事件-1.png'],
        probability: 0.15,
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'asuka_dog_whip_gag_female',
        name: '明日香-狗狗鞭打口球事件',
        description: '你被明日香击败，作为惩罚她会把你当作犬类进行电击尾塞、口球与鞭打调教。',
        images: ['明日香-狗狗鞭打口球事件-1.png', '明日香-狗狗鞭打口球事件-2.png'],
      },
      {
        id: 'asuka_ar_asmr_masturbation_female',
        name: '明日香-AR设备ASMR电子自慰事件',
        description: '你被明日香击败，作为惩罚她会通过AR设备与ASMR洗脑诱导你主动自慰并重塑性癖。',
        images: ['明日香-AR设备ASMR电子自慰事件-1.png', '明日香-AR设备ASMR电子自慰事件-2.png', '明日香-AR设备ASMR电子自慰事件-3.png'],
      },
      {
        id: 'asuka_turtle_shell_dildo_female',
        name: '明日香-龟甲缚阳具小穴事件',
        description: '你被明日香击败，作为惩罚你会在龟甲缚状态下接受电击阳具插入。',
        images: ['明日香-龟甲缚阳具小穴事件-1.png', '明日香-龟甲缚阳具小穴事件-2.png'],
      },
      {
        id: 'asuka_tentacle_glove_female',
        name: '明日香-拘束触手手套事件',
        description: '你被明日香击败，作为惩罚你会在拘束状态下被她用触手手套测试至失控高潮。',
        images: ['明日香-拘束触手手套事件-1.png', '明日香-拘束触手手套事件-2.png'],
      },
      {
        id: 'asuka_fisting_nude_female',
        name: '明日香-全裸拳交小穴事件',
        description: '你被明日香击败，作为惩罚你会被迫全裸并接受拳交测试。',
        images: ['明日香-全裸拳交小穴事件-1.png', '明日香-全裸拳交小穴事件-2.png'],
      },
      {
        id: 'asuka_nude_dogeza_female',
        name: '明日香-全裸土下座事件',
        description: '你被明日香击败，作为惩罚你会在电击玩具刺激下维持全裸土下座接受羞辱测试。',
        images: ['明日香-全裸土下座事件-1.png', '明日香-全裸土下座事件-2.png', '明日香-全裸土下座事件-3.png'],
      },
      {
        id: 'asuka_latex_gag_restraint_female',
        name: '明日香-全身乳胶拘束服口球束缚事件',
        description: '你被明日香击败，作为惩罚你会被穿上全身乳胶拘束服并配戴刺激口球进行耐受实验。',
        images: ['明日香-全身乳胶拘束服口球束缚事件-1.png', '明日香-全身乳胶拘束服口球束缚事件-2.png'],
      },
      {
        id: 'asuka_double_dildo_nude_female',
        name: '明日香-全裸双头龙插入小穴事件',
        description: '你被明日香击败，作为惩罚她会使用特制电击双头龙对你进行连续抽插实验。',
        images: ['明日香-全裸双头龙插入小穴事件-1.png'],
      },
      {
        id: 'asuka_vibe_strapon_female',
        name: '明日香-跳蛋束缚装阳具小穴事件',
        description: '你被明日香击败，作为惩罚她会给你安装跳蛋并穿戴阳具持续刺激你的小穴。',
        images: ['明日香-跳蛋束缚装阳具小穴事件-1.png', '明日香-跳蛋束缚装阳具小穴事件-2.png'],
      },
      {
        id: 'asuka_collar_anal_fingering_female',
        name: '明日香-项圈全裸指奸后穴事件',
        description: '你被明日香击败，作为惩罚你会被套上项圈后全裸接受后穴指奸。',
        images: ['明日香-项圈全裸指奸后穴事件-1.png', '明日香-项圈全裸指奸后穴事件-2.png'],
      },
      {
        id: 'asuka_collar_vaginal_fingering_female',
        name: '明日香-项圈全裸指奸小穴事件',
        description: '你被明日香击败，作为惩罚你会被套上项圈后全裸接受小穴指奸。',
        images: ['明日香-项圈全裸指奸小穴事件-1.png', '明日香-项圈全裸指奸小穴事件-2.png'],
      },
      {
        id: 'asuka_brainwash_master_rare_female',
        name: '（稀有事件）明日香-洗脑认主事件',
        description: '你被明日香击败，作为稀有惩罚你会被她的催眠APP彻底洗脑并转化为忠诚玩具。',
        images: ['明日香-洗脑认主事件-1.png'],
        probability: 0.04,
      },
      {
        id: 'asuka_body_mod_strapon_rare_female',
        name: '（稀有事件）明日香-身体改造假阳具事件',
        description: '你被明日香击败，作为稀有惩罚你的身体会被半机械化改造并安装生物质假阳具进行测试。',
        images: ['明日香-身体改造假阳具事件-1.png', '明日香-身体改造假阳具事件-2.png'],
        probability: 0.04,
      },
    ],
    victory: [
      {
        id: 'asuka_flat_chest_play_victory_female',
        name: '明日香-贫乳玩弄事件',
        description: '你战胜了明日香，作为奖励你可以玩弄她的贫乳胸部。',
        images: ['明日香-贫乳玩弄事件-1.png', '明日香-贫乳玩弄事件-2.png'],
      },
      {
        id: 'asuka_nude_dogeza_victory_female',
        name: '明日香-全裸土下座事件',
        description: '你战胜了明日香，作为奖励你可以命令她全裸土下座并接受羞辱惩罚。',
        images: ['明日香-全裸土下座事件-1.png'],
      },
      {
        id: 'asuka_reverse_brainwash_asmr_rare_victory_female',
        name: '（稀有事件）明日香-反洗脑ASMR事件',
        description: '你战胜了明日香，作为稀有奖励你可以使用她的设备对她实施反向洗脑。',
        images: ['明日香-反洗脑ASMR事件-1.png'],
        probability: 0.15,
      },
    ],
  },
};

// 薇丝佩菈的CG配置
const weiSiPeiLaConfig: CharacterCGConfig = {
  characterName: '薇丝佩菈',
  male: {
    defeat: [
      {
        id: 'vespera_extreme_milking_male',
        name: '薇丝佩菈-极限榨取事件',
        description: '你被薇丝佩菈击败，薇丝佩菈将你压在身下，用带着手套的手不停进行榨取，直到你精液尽失，失去意识。',
        images: ['薇丝佩菈-极限榨取事件.png'],
      },
      {
        id: 'vespera_feminization_mod_male',
        name: '薇丝佩菈-女体化改造事件',
        description: '你被薇丝佩菈击败，被全脱光绑在柱子上。薇丝佩菈逼你喝下奇怪的药剂，你发现你的肉棒逐渐变小。',
        images: ['薇丝佩菈-女体化改造事件.png'],
      },
      {
        id: 'vespera_bound_whip_male',
        name: '薇丝佩菈-束缚鞭打事件',
        description: '你被薇丝佩菈击败，被全脱光绑在柱子上。薇丝佩菈拿出一根铁链，对你性器官进行鞭打。',
        images: ['薇丝佩菈-束缚鞭打事件.png'],
      },
      {
        id: 'vespera_chain_leash_male',
        name: '薇丝佩菈-栓链遛狗事件',
        description: '你被薇丝佩菈击败，薇丝佩菈在你脖子上套上铁链，强迫你爬着跟随。然后将你带到室外进行展览。',
        images: ['薇丝佩菈-栓链遛狗事件.png'],
      },
      {
        id: 'vespera_penis_trample_male',
        name: '薇丝佩菈-阴茎践踏事件',
        description: '你被薇丝佩菈击败，你倒在地上，薇丝佩菈直接一脚踩在你的肉棒上，嘲讽你是废物。',
        images: ['薇丝佩菈-阴茎践踏事件.png'],
      },
    ],
    victory: [
      {
        id: 'vespera_back_entry_victory_male',
        name: '薇丝佩菈-后入事件',
        description: '你战胜薇丝佩菈，绕到薇丝佩菈身后，无视其无力的抵抗，强行用肉棒从身后插入薇丝佩菈小穴，并进行内射。',
        images: ['薇丝佩菈-后入事件1.png', '薇丝佩菈-后入事件2.png', '薇丝佩菈-后入事件3.png'],
      },
      {
        id: 'vespera_corruption_victory_male',
        name: '薇丝佩菈-堕落事件',
        description: '你战胜薇丝佩菈，随后强上了厌男的薇丝佩菈，并利用巨大的肉棒不断抽插使其堕落，甘愿成为你的私有物。',
        images: ['薇丝佩菈-堕落事件1.png', '薇丝佩菈-堕落事件2.png', '薇丝佩菈-堕落事件3.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'vespera_wall_kiss_female',
        name: '薇丝佩菈-壁咚深吻事件',
        description: '你输给了薇丝佩菈，被薇丝佩菈压到墙角壁咚深吻，同时薇丝佩菈的膝盖顶入你双腿之间摩擦你的小穴。',
        images: ['薇丝佩菈-壁咚深吻事件.png'],
      },
      {
        id: 'vespera_face_trample_rope_female',
        name: '薇丝佩菈-踩脸龟甲缚事件',
        description: '你输给了薇丝佩菈，被薇丝佩菈全身束缚。薇丝佩菈坐在桌子上，用脚在你的脸上摩擦。',
        images: ['薇丝佩菈-踩脸龟甲缚事件.png'],
      },
      {
        id: 'vespera_s_domination_female',
        name: '薇丝佩菈-抖s支配事件',
        description: '你输给了薇丝佩菈，被薇丝佩菈龟甲缚后丢在地上，并以女王的姿态一脚踩在你的身上。',
        images: ['薇丝佩菈-抖s支配事件.png'],
      },
      {
        id: 'vespera_pheromone_masturbation_female',
        name: '薇丝佩菈-费洛蒙自慰事件',
        description: '你输给了薇丝佩菈，并在战斗中吸入过多薇丝佩菈散发出的发情信息素，于是在薇丝佩菈的诱导下开始进行自慰。',
        images: ['薇丝佩菈-费洛蒙自慰事件.png'],
      },
      {
        id: 'vespera_horn_insert_female',
        name: '薇丝佩菈-鬼角先生事件',
        description: '你输给了薇丝佩菈，薇丝佩菈掰下自己的一根鬼角，插入你的小穴，与你进行真正的身心交融。',
        images: ['薇丝佩菈-鬼角先生事件.png'],
      },
      {
        id: 'vespera_bound_oral_female',
        name: '薇丝佩菈-捆绑舔穴事件',
        description: '你输给了薇丝佩菈，薇丝佩菈用怪力将你全裸捆绑并吊在半空中，随后开始舔你的小穴直到你沉沦其中。',
        images: ['薇丝佩菈-捆绑舔穴事件.png'],
      },
      {
        id: 'vespera_breast_rub_insert_female',
        name: '薇丝佩菈-揉胸插穴事件',
        description: '你输给了薇丝佩菈，薇丝佩菈掏出一根假阴茎插入你的小穴，随后一边揉胸，一边用膝盖来回顶性玩具。',
        images: ['薇丝佩菈-揉胸插穴事件.png'],
      },
      {
        id: 'vespera_triangle_horse_female',
        name: '薇丝佩菈-三角木马事件',
        description: '你输给了薇丝佩菈，被薇丝佩菈带到隐秘的小屋并被全裸放在三角木马上。薇丝佩菈随后也坐了上来，并抓着你在三角木马上摩擦。',
        images: ['薇丝佩菈-三角木马事件.png'],
      },
      {
        id: 'vespera_double_dragon_insert_female',
        name: '薇丝佩菈-双头龙插入事件',
        description: '你输给了薇丝佩菈，薇丝佩菈掏出双头龙狠狠进攻你的小穴，同时与你进行舌吻。',
        images: ['薇丝佩菈-双头龙插入事件.png'],
      },
      {
        id: 'vespera_foot_lick_female',
        name: '薇丝佩菈-舔脚事件',
        description: '你输给了薇丝佩菈，薇丝佩菈坐在桌子上居高临下看着你，并让你舔她的脚。',
        images: ['薇丝佩菈-舔脚事件.png'],
      },
      {
        id: 'vespera_fingering_overload_female',
        name: '薇丝佩菈-指交事件',
        description: '你输给了薇丝佩菈，薇丝佩菈用锁链将你绑成M型开腿，并利用指技让你不断高潮，直到失去意识。',
        images: ['薇丝佩菈-指交事件.png'],
      },
      {
        id: 'vespera_defeat_wedding_female',
        name: '薇丝佩菈-战败婚礼事件',
        description: '在决定攻受的战斗中，你输给了薇丝佩菈，你穿上婚纱跪倒在薇丝佩菈脚下，薇丝佩菈用手抬起你的下巴，要你宣誓成为她的所有物。',
        images: ['薇丝佩菈-战败婚礼事件.png'],
      },
    ],
    victory: [
      {
        id: 'vespera_koukou_victory_female',
        name: '薇丝佩菈-战胜扣扣事件',
        description: '你战胜了薇丝佩菈，并将薇丝佩菈控制住，随后玩弄薇丝佩菈小穴的同时玩弄她的小嘴。',
        images: ['薇丝佩菈-扣扣事件1.png', '薇丝佩菈-扣扣事件2.png'],
      },
      {
        id: 'vespera_conquest_victory_female',
        name: '薇丝佩菈-战胜征服事件',
        description: '你战胜了薇丝佩菈，薇丝佩菈被你的性技征服，自愿将身体交给你一段时间，允许你对她做任何事。',
        images: ['薇丝佩菈-战胜征服事件1.png', '薇丝佩菈-战胜征服事件2.png'],
      },
      {
        id: 'vespera_wedding_victory_female',
        name: '薇丝佩菈-战胜婚礼事件',
        description: '在决定谁是攻谁是受的战斗中，你赢得了胜利，薇丝佩菈回到平时状态，并穿上特制的露胸婚纱，掀起裙子害羞的站到你面前。',
        images: ['薇丝佩菈-战胜婚礼事件.png'],
      },
    ],
  },
};

// 爱丽丝温特的CG配置
const aiLiSiWenTeConfig: CharacterCGConfig = {
  characterName: '爱丽丝温特',
  male: {
    defeat: [
      {
        id: 'alice_lactation_male',
        name: '爱丽丝温特-哺乳事件',
        description: '你被爱丽丝温特击败，作为惩罚她会以强势而温柔的方式对你进行哺乳调教。',
        images: [
          '爱丽丝温特-哺乳事件-1.png',
          '爱丽丝温特-哺乳事件-2.png',
          '爱丽丝温特-哺乳事件-3.png',
          '爱丽丝温特-哺乳事件-4.png',
        ],
      },
      {
        id: 'alice_urethral_bead_punishment_male',
        name: '爱丽丝温特-马眼拉珠责罚事件',
        description: '你被爱丽丝温特击败，作为惩罚她会对你执行马眼拉珠责罚。',
        images: [
          '爱丽丝温特-马眼拉珠责罚事件-1.png',
          '爱丽丝温特-马眼拉珠责罚事件-2.png',
          '爱丽丝温特-马眼拉珠责罚事件-3.png',
        ],
      },
      {
        id: 'alice_reverse_rape_male',
        name: '爱丽丝温特-逆强奸事件',
        description: '你被爱丽丝温特击败，作为惩罚她会对你施加彻底压制的逆强奸调教。',
        images: [
          '爱丽丝温特-逆强奸事件-1.png',
          '爱丽丝温特-逆强奸事件-2.png',
          '爱丽丝温特-逆强奸事件-3.png',
          '爱丽丝温特-逆强奸事件-4.png',
        ],
      },
      {
        id: 'alice_paizuri_male',
        name: '爱丽丝温特-乳交事件',
        description: '你被爱丽丝温特击败，作为惩罚她会用乳房对你进行持续榨取。',
        images: [
          '爱丽丝温特-乳交事件-1.png',
          '爱丽丝温特-乳交事件-2.png',
          '爱丽丝温特-乳交事件-3.png',
          '爱丽丝温特-乳交事件-4.png',
        ],
      },
      {
        id: 'alice_milk_splash_male',
        name: '爱丽丝温特-乳液狂飙事件',
        description: '你被爱丽丝温特击败，作为惩罚她会让你在失控刺激中迎来乳液狂飙。',
        images: ['爱丽丝温特-乳液狂飙事件-1.png'],
      },
      {
        id: 'alice_silk_foot_reward_male',
        name: '爱丽丝温特-丝足“奖励”事件',
        description: '你被爱丽丝温特击败，作为惩罚她会以丝足“奖励”的名义对你进行支配。',
        images: [
          '爱丽丝温特-丝足“奖励”事件-1.png',
          '爱丽丝温特-丝足“奖励”事件-2.png',
          '爱丽丝温特-丝足“奖励”事件-3.png',
        ],
      },
      {
        id: 'alice_non_penetrative_grind_male',
        name: '爱丽丝温特-素股事件',
        description: '你被爱丽丝温特击败，作为惩罚她会用素股反复挑逗并榨取你的理智。',
        images: ['爱丽丝温特-素股事件-1.png', '爱丽丝温特-素股事件-2.png'],
      },
      {
        id: 'alice_baby_regression_male',
        name: '爱丽丝温特-婴儿退行事件',
        description: '你被爱丽丝温特击败，作为惩罚她会诱导你进入婴儿退行状态并进行调教。',
        images: [
          '爱丽丝温特-婴儿退行事件-1.png',
          '爱丽丝温特-婴儿退行事件-2.png',
          '爱丽丝温特-婴儿退行事件-3.png',
          '爱丽丝温特-婴儿退行事件-4.png',
        ],
      },
      {
        id: 'alice_baby_punishment_male',
        name: '爱丽丝温特-婴儿责罚事件',
        description: '你被爱丽丝温特击败，作为惩罚她会以母性威压方式执行婴儿责罚。',
        images: [
          '爱丽丝温特-婴儿责罚事件-1.png',
          '爱丽丝温特-婴儿责罚事件-2.png',
          '爱丽丝温特-婴儿责罚事件-3.png',
          '爱丽丝温特-婴儿责罚事件-4.png',
        ],
      },
      {
        id: 'alice_footjob_male',
        name: '爱丽丝温特-足交事件',
        description: '你被爱丽丝温特击败，作为惩罚她会用双足对你进行足交榨取。',
        images: ['爱丽丝温特-足交事件-1.png', '爱丽丝温特-足交事件-2.png', '爱丽丝温特-足交事件-3.png', '爱丽丝温特-足交事件-4.png'],
      },
    ],
    victory: [
      {
        id: 'alice_cao_pi_victory_male',
        name: '爱丽丝温特-曹丕事件',
        description: '你战胜了爱丽丝温特，作为奖励她会配合你进行曹丕事件中的特别互动。',
        images: ['爱丽丝温特-曹丕事件-1.png', '爱丽丝温特-曹丕事件-2.png', '爱丽丝温特-曹丕事件-3.png'],
      },
      {
        id: 'alice_blowjob_victory_male',
        name: '爱丽丝温特-口交事件',
        description: '你战胜了爱丽丝温特，作为奖励她会为你提供口交服务。',
        images: ['爱丽丝温特-口交事件-1.png', '爱丽丝温特-口交事件-2.png', '爱丽丝温特-口交事件3.png', '爱丽丝温特-口交事件4.png'],
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'alice_oral_exchange_female',
        name: '爱丽丝-管鲍之交事件',
        description: '你被爱丽丝温特击败，作为惩罚她会与你进行高压的管鲍之交调教。',
        images: ['爱丽丝-管鲍之交事件-1.png', '爱丽丝-管鲍之交事件-2.png'],
      },
      {
        id: 'alice_grinding_apotheosis_female',
        name: '爱丽丝-磨姛降世事件',
        description: '你被爱丽丝温特击败，作为惩罚她会用激烈磨蹭手段彻底压制你。',
        images: ['爱丽丝-磨姛降世事件-1.png', '爱丽丝-磨姛降世事件-2.png'],
      },
      {
        id: 'alice_cowplay_female',
        name: '爱丽丝-乳牛化情趣play事件',
        description: '你被爱丽丝温特击败，作为惩罚她会对你实施乳牛化情趣play。',
        images: [
          '爱丽丝-乳牛化情趣play事件-1.png',
          '爱丽丝-乳牛化情趣play事件-2.png',
          '爱丽丝-乳牛化情趣play事件-3.png',
          '爱丽丝-乳牛化情趣play事件-4.png',
        ],
      },
      {
        id: 'alice_cow_transformation_female',
        name: '爱丽丝-乳牛化事件',
        description: '你被爱丽丝温特击败，作为惩罚她会对你进行乳牛化改造。',
        images: ['爱丽丝-乳牛化事件-1.png', '爱丽丝-乳牛化事件-2.png', '爱丽丝-乳牛化事件-3.png', '爱丽丝-乳牛化事件-4.png'],
      },
      {
        id: 'alice_mountain_press_female',
        name: '爱丽丝-泰山压顶事件',
        description: '你被爱丽丝温特击败，作为惩罚她会以泰山压顶般的方式压制你。',
        images: ['爱丽丝-泰山压顶事件-1.png', '爱丽丝-泰山压顶事件-2.png', '爱丽丝-泰山压顶事件-3.png', '爱丽丝-泰山压顶事件-4.png'],
      },
      {
        id: 'alice_dual_dragon_female',
        name: '爱丽丝-天地双龙事件',
        description: '你被爱丽丝温特击败，作为惩罚她会对你施加天地双龙式的双重刺激。',
        images: ['爱丽丝-天地双龙事件-1.png', '爱丽丝-天地双龙事件-2.png', '爱丽丝-天地双龙事件-3.png'],
      },
      {
        id: 'alice_baby_regression_female',
        name: '爱丽丝-婴儿退行事件',
        description: '你被爱丽丝温特击败，作为惩罚她会诱导你进入婴儿退行状态。',
        images: ['爱丽丝-婴儿退行事件-1.png', '爱丽丝-婴儿退行事件-2.png', '爱丽丝-婴儿退行事件-3.png'],
      },
      {
        id: 'alice_multi_grind_female',
        name: '爱丽丝-众磨蒂事件',
        description: '你被爱丽丝温特击败，作为惩罚她会让你承受众磨蒂式的持续挑逗与压迫。',
        images: ['爱丽丝-众磨蒂事件-1.png', '爱丽丝-众磨蒂事件-2.png', '爱丽丝-众磨蒂事件-3.png', '爱丽丝-众磨蒂事件-4.png'],
      },
    ],
    victory: [
      {
        id: 'alice_lesbian_fluid_banquet_victory_female',
        name: '爱丽丝-磨女的液宴事件',
        description: '你战胜了爱丽丝温特，作为奖励你可以主导磨女的液宴。',
        images: ['爱丽丝-磨女的液宴事件-1.png', '爱丽丝-磨女的液宴事件-2.png', '爱丽丝-磨女的液宴事件-3.png'],
      },
      {
        id: 'alice_spear_like_dragon_victory_female',
        name: '爱丽丝-枪出如龙',
        description: '你战胜了爱丽丝温特，作为奖励你可以让她配合你进行枪出如龙式的强势互动。',
        images: ['爱丽丝-枪出如龙-1.png', '爱丽丝-枪出如龙-2.png'],
      },
    ],
  },
};

// 娜塔莎斯迈尔的CG配置
const naTaShaSiMaiErConfig: CharacterCGConfig = {
  characterName: '娜塔莎斯迈尔',
  male: {
    defeat: [
      {
        id: 'natasha_no_contact_verbal_defeat_male',
        name: '娜塔莎-无接触骂倒事件',
        description:
          '你被娜塔莎击败，作为惩罚她骑在你的跨上，摆出鄙视与比心的手势，比心的手势翘起小拇指，实际上是对你短小无能的鄙视。还对你进行辱骂与甜美偶像音的双重asmr调教，双重asmr里直白的辱骂与虚情假意的偶像音交替进行，最终你在无接触的情况下爆射，在高潮的强烈快感下你只能看见娜塔莎嘲讽的笑意与手势。',
        images: ['无接触骂倒事件-1.png', '无接触骂倒事件-2.png'],
      },
      {
        id: 'natasha_gaming_chair_tickling_defeat_male',
        name: '娜塔莎-电竞椅挠痒调教事件',
        description:
          '你被娜塔莎击败，作为惩罚，你被她强制绑在她那改造过的调教电竞椅上，一边被她用跳蛋、飞机杯进行乳首、肉棒套弄，一边被她的电竞椅改造的机械手挠脚心与腋窝。',
        images: ['电竞椅调教事件-1.png', '电竞椅调教事件-2.png'],
      },
      {
        id: 'natasha_stocking_footjob_defeat_male',
        name: '娜塔莎-丝袜足交事件',
        description: '你被娜塔莎击败，作为惩罚她给你的肉棒套上裹满润滑液的白丝，用穿着白丝的玉足套弄你的肉，给你进行丝袜足交，强烈的磨砂感让你的肉棒十分敏感，最终爆射。',
        images: ['丝袜足交事件-1.png', '丝袜足交事件-2.png'],
      },
      {
        id: 'natasha_stocking_handjob_defeat_male',
        name: '娜塔莎-丝责事件',
        description: '你被娜塔莎击败，作为惩罚她给你的肉棒套上裹满润滑液的白丝，用手给你套弄肉棒，进行丝袜责，强烈的磨砂感让你的肉棒十分敏感，最终爆射。',
        images: ['丝责事件-1.png'],
      },
      {
        id: 'natasha_dog_training_face_step_defeat_male',
        name: '娜塔莎-驯狗踩脸事件',
        description: '你被娜塔莎击败，作为惩罚她给你穿项圈狗链，将玉足踩在你的脸色，命令你躺在地上像狗一样给她舔脚',
        images: ['训狗踩脸事件-1.png', '训狗踩脸事件-3.png', '训狗事件踩脸-3.png'],
      },
      {
        id: 'natasha_crotch_kick_defeat_male',
        name: '娜塔莎-踢裆事件',
        description: '你被娜塔莎击败，作为惩罚她命令你怪怪站好，然后用脚狠狠地踢你的裆部，在强烈的疼痛感作用下，你最终爆射。',
        images: ['踢裆事件-1.png', '踢裆事件-2.png'],
      },
      {
        id: 'natasha_cup_milking_defeat_male',
        name: '娜塔莎-飞机杯榨取事件',
        description:
          '你被娜塔莎击败，作为惩罚她使用飞机杯给你撸管，她发挥自己电竞选手的手速握住飞机杯对你的肉棒进行高速套弄，最终你爆射在飞机杯里，她那蔑视嘲讽的表情似乎是在告诉你，你都不配将精液射在她的身上。',
        images: ['飞机杯榨取事件-1.png', '飞机杯榨取事件-3.png'],
      },
      {
        id: 'natasha_no_contact_panty_humiliation_defeat_male',
        name: '娜塔莎-无接触骂倒羞辱事件',
        description:
          '你被娜塔莎击败，作为惩罚她骑在你的跨上，强制让你套上黑色蕾丝的女式内裤，对你摆出鄙视与比心的手势，比心的手势实际上是对你短小无能的鄙视。还对你进行辱骂与甜美偶像音的双重asmr调教，双重asmr里直白的辱骂与虚情假意的偶像音交替进行，最终你在无接触的情况下爆射，在高潮的强烈快感下你只能看见娜塔莎嘲讽的笑意与手势。',
        images: ['无接触骂倒羞辱事件-1.png'],
      },
      {
        id: 'natasha_facesit_nipple_defeat_male',
        name: '娜塔莎-坐脸乳头责事件',
        description: '你被娜塔莎击败，作为惩罚她脱下内裤坐到你的脸上，用手指刺激你的乳头，最终在未触碰肉棒的情况下，你被调教至高潮。',
        images: ['坐脸乳头责事件-1.png', '坐脸乳头责事件-2.png'],
      },
      {
        id: 'natasha_ear_licking_denial_defeat_male',
        name: '娜塔莎-舔耳寸止事件',
        description:
          '你被娜塔莎击败，为惩罚她给你戴上口球与寸止环，一边对你进行辱骂与甜美偶像音双重asmr舔耳调教，一边撸动你的肉棒在你快要高潮前停下，对你进行寸止，在反复进行多次后，你终于承受不住而爆射出来。',
        images: ['舔耳寸止事件-1.png'],
      },
      {
        id: 'natasha_blindfold_ear_licking_denial_rare_defeat_male',
        name: '（稀有事件）娜塔莎-蒙眼舔耳寸止事件',
        description:
          '你被娜塔莎击败，作为惩罚她给你戴上眼罩、口球与寸止环，一边对你进行辱骂与甜美偶像音双重asmr舔耳调教，一边撸动你的肉棒在你快要高潮前停下，对你进行寸止，在反复进行多次后，你一遍又一遍的祈求娜塔莎给你释放，但她无所动摇直到你接近崩溃，她要求你成为她的奴隶粉丝，只准粉她一个人，绝对听令于她。在崩溃之际，你答应她。',
        images: ['蒙眼舔耳寸止事件-1.png'],
        probability: 0.05,
      },
    ],
    victory: [
      {
        id: 'natasha_butt_hook_spanking_victory_male',
        name: '娜塔莎-股钩打屁股战胜事件',
        description: '你战胜了娜塔莎，作为奖励你给她的菊穴带上钩子，让她跪在地上，狠狠拍打她的屁股，疼痛感让她挣扎，但一挣扎，菊穴里的股钩就会刺激她的菊穴，如此调教，她最终高潮了。',
        images: ['股钩打屁股战胜事件-1.png'],
      },
      {
        id: 'natasha_gaming_chair_victory_male',
        name: '娜塔莎-电竞椅调教战胜事件',
        description: '你战胜了娜塔莎，作为奖励你将她绑在她那改造过的调教电竞椅上，用AV震动棒刺激她的小穴、跳蛋刺激乳头，改造的机械手挠乳头、脚心、腋下，在多重刺激下，她最终高潮。',
        images: ['电竞椅调教战胜事件-1.png', '电竞椅调教战胜事件-2.png'],
      },
      {
        id: 'natasha_park_spanking_victory_male',
        name: '娜塔莎-打屁股公园战胜事件',
        description: '你战胜了娜塔莎，作为奖励你命令她脱下内裤像狗一样跪在公园地上，用手狠狠拍打她的屁股，对她进行公开调教。',
        images: ['打屁股公园战胜事件-1.png'],
      },
      {
        id: 'natasha_urination_victory_male',
        name: '娜塔莎-排尿战胜事件',
        description: '你战胜了娜塔莎，作为奖励你命令她摆出小狗撒尿的姿势在你面前撒尿，在羞愤与尴尬的情感下她一开始尿不出来，尴尬了段时间终于当着你的面尿了出来。',
        images: ['排尿战胜事件-1.png', '排尿战胜事件-2.png'],
      },
      {
        id: 'natasha_stairway_breastjob_rare_victory_male',
        name: '（稀有事件）娜塔莎-教室贫乳乳交战胜事件',
        description:
          '你战胜了娜塔莎，作为奖励你命令她在楼梯口对你进行乳交，娜塔莎十分羞愤和恼怒，一方面是因为此时正在上课，虽然楼梯口次数没什么人，但她还是很怕被其他人发现，另一方面是她只有a罩杯，让自己乳交是在嘲讽自己胸小。她羞愤的挤着胸部生疏、卖力（想快点结束，因为害怕被发现）地对你进行乳交，最终你爆射在她的脸上和胸前。',
        images: ['楼梯口贫乳乳交战胜事件-1.png'],
        probability: 0.05,
      },
    ],
  },
  female: {
    defeat: [
      {
        id: 'natasha_facesit_nipple_defeat_female',
        name: '娜塔莎-坐脸乳头责事件',
        description: '你被娜塔莎击败，作为惩罚她脱下内裤坐在你的脸上，给你夹上乳环，还用手指刺激你的乳头，最终在没接触你小穴的情况下让你到达了高潮。。',
        images: ['坐脸乳头责事件-1.png'],
      },
      {
        id: 'natasha_gaming_chair_self_play_defeat_female',
        name: '娜塔莎-电竞椅调教自己玩游戏事件',
        description:
          '你被娜塔莎击败，你被她强制绑在她那改造过的调教电竞椅上，电竞椅对你进行全自动的机械调教，一边用AV震动棒刺激你的阴蒂，一边用毛刷、机械手挠你的腋窝、脚心，刺激你的胸部、乳头，给你戴上播放舔耳asmr的耳机，而娜塔莎全然无视你，自顾自的开了局游戏，在这种放置调教的情况下， 你高潮失神。',
        images: ['电竞椅调教自己玩游戏事件-1.png'],
      },
      {
        id: 'natasha_gaming_chair_defeat_female',
        name: '娜塔莎-电竞椅调教事件',
        description:
          '你被娜塔莎击败，你被她强制绑在她那改造过的调教电竞椅上，电竞椅对你进行全自动的机械调教，一边用AV震动棒刺激你的阴蒂，一边用毛刷、机械手挠你的腋窝、脚心，刺激你的胸部、乳头，娜塔莎在你旁边对你进行辱骂与甜美偶像音交替着羞辱你，还用手对你进行挠痒、刺激乳头，最终你高潮失神。',
        images: ['电竞椅调教事件-1.png'],
      },
      {
        id: 'natasha_stocking_gag_bell_fingering_defeat_female',
        name: '娜塔莎-丝袜塞嘴乳铃扣穴事件',
        description: '你被娜塔莎击败，作为惩罚她将白丝袜脱下塞进你的嘴里，给你戴上乳铃，扣你的小穴，最终你高潮了。',
        images: ['丝袜塞嘴乳铃扣穴事件-1.png'],
      },
      {
        id: 'natasha_stocking_gag_bell_dildo_defeat_female',
        name: '娜塔莎-丝袜塞嘴乳铃自慰棒事件',
        description: '你被娜塔莎击败，作为惩罚她将白丝袜脱下塞进你的嘴里，给你戴上乳铃、眼罩，拿自慰棒抽插你的小穴，最终你高潮了。',
        images: ['丝袜塞嘴乳铃自慰棒事件-1.png'],
      },
      {
        id: 'natasha_dogeza_spanking_step_defeat_female',
        name: '娜塔莎-打屁股士下座踩踏事件',
        description: '你被娜塔莎击败，作为惩罚她命令你脱光衣服叠放整齐，摆出士下座的姿势在地上跪好，她用脚踹、踩你的屁股和背部，对你进行羞辱调教。',
        images: ['打屁股士下座踩踏事件-1.png', '打屁股士下座踩踏事件-2.png'],
      },
      {
        id: 'natasha_ear_licking_defeat_female',
        name: '娜塔莎-舔耳事件',
        description: '你被娜塔莎击败，作为惩罚她将你推倒在电竞椅上，对你进行辱骂与甜美偶像音的双重asmr调教，双重asmr里直白的辱骂与虚情假意的偶像音交替进行，同时还用手指扣挖你的小穴，最终你高潮失神。',
        images: ['舔耳事件-1.png', '舔耳事件-2.png'],
      },
      {
        id: 'natasha_bondage_defeat_female',
        name: '娜塔莎-拘束调教事件',
        description: '你被娜塔莎击败，作为惩罚她给你戴上眼罩、口枷、乳夹，拿绳索绑住你的双手吊在天上，一边刺激你的乳头，一边拿假阳具抽插你的小穴，最终你高潮失神。',
        images: ['拘束调教事件-1.png', '拘束调教事件-2.png'],
      },
      {
        id: 'natasha_chastity_bondage_rare_defeat_female',
        name: '（稀有事件）娜塔莎-贞操锁束缚事件',
        description:
          '你被娜塔莎击败，作为惩罚她给你戴上眼罩、乳夹与贞操锁，拿锁链锁住你的双手吊在天上，喂你喝下春药，启动电动自慰棒放在你的耳边让你不断联想自慰的场景，你被春药作用努力夹腿自慰可惜被贞操锁束缚没得到一丝快感，你一遍又一遍的祈求娜塔莎给你释放，但她无所动摇直到你接近崩溃，她要求你成为她的奴隶粉丝，只准粉她一个人，绝对听令于她。在崩溃之际，你答应了她。',
        images: ['贞操锁束缚事件-1.png'],
        probability: 0.05,
      },
    ],
    victory: [
      {
        id: 'natasha_gaming_chair_victory_female',
        name: '娜塔莎-电竞椅调教战胜事件',
        description: '你战胜了娜塔莎，作为奖励你将她绑在她那改造过的调教电竞椅上，用AV震动棒刺激她的小穴、跳蛋刺激乳头，改造的机械手挠乳头、脚心、腋下，在多重刺激下，她最终高潮。',
        images: ['电竞椅调教战胜事件-1.png', '电竞椅调教战胜事件-2.png'],
      },
      {
        id: 'natasha_urination_victory_female',
        name: '娜塔莎-排尿战胜事件',
        description: '你战胜了娜塔莎，作为奖励你命令她摆出小狗撒尿的姿势在你面前撒尿，在羞愤与尴尬的情感下她一开始尿不出来，尴尬了段时间终于当着你的面尿了出来。',
        images: ['排尿战胜事件-1.png'],
      },
      {
        id: 'natasha_classroom_yuri_rare_victory_female',
        name: '（稀有事件）娜塔莎-教室隐秘百合战胜事件',
        description:
          '你战胜了娜塔莎，作为奖励你命令她在空教室脱下胸罩坐在自己的腿上，娜塔莎十分羞愤和恼怒，因为这是教室，虽然已经放学了此时空无一人，但她还是很怕被其他人发现。她按照你的要求坐到你的腿上，你用手指扣挖她的小穴，而模仿她的甜美偶像音在她耳边说着羞耻、侮辱的话，娜塔莎羞愤不已，最终高潮。',
        images: ['教室隐秘百合战胜事件-1.png', '教室隐秘百合战胜事件-2.png'],
        probability: 0.05,
      },
    ],
  },
};

// 所有角色的CG配置
export const CG_CONFIGS: CharacterCGConfig[] = [
  xingYeGuangConfig,
  baiChuanQianXiaConfig,
  aiLinHaiDeConfig,
  luNaLaKeDiSiConfig,
  liLiAnConfig,
  xueLiKeLinMuXiErDeConfig,
  meiSuiLingConfig,
  yiLiShaBaiYeYuConfig,
  shaLaSiTongConfig,
  shangShanYaYiConfig,
  muXinLanConfig,
  baiShiXiangZiConfig,
  shenQiLinConfig,
  xiaoNiaoYouChuZiConfig,
  fengYinConfig,
  lingYinConfig,
  fuLianConfig,
  heiQiQingWenConfig,
  weiSiPeiLaConfig,
  mingRiXiangConfig,
  aiLiSiWenTeConfig,
  naTaShaSiMaiErConfig,
];

// 根据角色名称获取CG配置
export function getCGConfigByCharacter(characterName: string): CharacterCGConfig | null {
  console.log('[CG配置] 开始查找角色CG配置，角色名称:', characterName);
  console.log(
    '[CG配置] 可用配置列表:',
    CG_CONFIGS.map(c => c.characterName),
  );

  // 与战斗界面对手解析逻辑保持一致：先解析为标准敌人名，再做精确匹配
  const resolvedName = resolveEnemyName(characterName);
  console.log('[CG配置] resolveEnemyName 解析结果:', resolvedName);

  // 1) 先按解析后的标准名精确匹配
  const exact = CG_CONFIGS.find(cfg => cfg.characterName === resolvedName) || null;
  if (exact) {
    console.log('[CG配置] 找到匹配的配置:', exact.characterName);
    return exact;
  }

  // 2) CG素材目录可能不带阶段后缀（例如“沐芯兰_1/_2”目录不存在，只有“沐芯兰”）
  //    这里仅做一次“去掉末尾 _数字” 的精确回退匹配，不使用任何 includes 模糊匹配。
  const withoutStageSuffix = resolvedName.replace(/_\d+$/g, '');
  if (withoutStageSuffix !== resolvedName) {
    console.log('[CG配置] 尝试去阶段后缀匹配:', withoutStageSuffix);
    const fallback = CG_CONFIGS.find(cfg => cfg.characterName === withoutStageSuffix) || null;
    if (fallback) {
      console.log('[CG配置] 找到去后缀匹配的配置:', fallback.characterName);
      return fallback;
    }
  }

  console.warn('[CG配置] 未找到匹配的配置');
  return null;
}

// 选择CG事件
export function selectCGEvent(
  characterName: string,
  playerGender: '男' | '女',
  isVictory: boolean,
): { event: CGEvent; imageUrl: string; description: string; imageIndex: number } | null {
  console.log('[CG选择] ========== 开始选择CG事件 ==========');
  console.log('[CG选择] 参数 - 角色:', characterName, '性别:', playerGender, '胜利:', isVictory);

  const config = getCGConfigByCharacter(characterName);
  if (!config) {
    console.warn('[CG选择] 未找到角色配置，返回null');
    return null;
  }

  // 根据性别和胜负选择事件池
  const genderKey = playerGender === '男' ? 'male' : 'female';
  const resultKey = isVictory ? 'victory' : 'defeat';
  console.log('[CG选择] 选择事件池 - 性别key:', genderKey, '结果key:', resultKey);

  const events = config[genderKey][resultKey];
  console.log('[CG选择] 事件池内容:', events);
  console.log('[CG选择] 事件池数量:', events?.length || 0);

  if (!events || events.length === 0) {
    console.warn('[CG选择] 事件池为空，返回null');
    return null;
  }

  // 分离稀有事件和普通事件
  const rareEvents = events.filter(e => e.probability !== undefined);
  const normalEvents = events.filter(e => e.probability === undefined);
  console.log('[CG选择] 稀有事件数量:', rareEvents.length, '普通事件数量:', normalEvents.length);

  let selectedEvent: CGEvent | null = null;

  // 先尝试稀有事件
  for (const rareEvent of rareEvents) {
    const roll = Math.random();
    console.log(`[CG选择] 稀有事件检查: "${rareEvent.name}" 概率:${rareEvent.probability} 随机值:${roll}`);
    if (roll < rareEvent.probability!) {
      selectedEvent = rareEvent;
      console.log('[CG选择] ✓ 触发稀有事件:', rareEvent.name);
      break;
    }
  }

  // 如果没有触发稀有事件，从普通事件中随机选择
  if (!selectedEvent && normalEvents.length > 0) {
    const randomIndex = Math.floor(Math.random() * normalEvents.length);
    selectedEvent = normalEvents[randomIndex];
    console.log('[CG选择] 选择普通事件 (索引', randomIndex, '):', selectedEvent.name);
  }

  if (!selectedEvent) {
    console.warn('[CG选择] 未选择到任何事件，返回null');
    return null;
  }

  // 从事件的图片列表中随机选择一张
  const randomImageIndex = Math.floor(Math.random() * selectedEvent.images.length);
  const randomImage = selectedEvent.images[randomImageIndex];
  console.log('[CG选择] 图片列表:', selectedEvent.images);
  console.log('[CG选择] 选择图片 (索引', randomImageIndex, '):', randomImage);

  // 构建图片URL
  const genderFolder = playerGender === '男' ? '男u' : '女u';
  const resultFolder = isVictory ? '战胜事件' : '战败事件';
  const imageUrl = `https://img.vinsimage.org/性斗学园/cg/${config.characterName}/${genderFolder}/${resultFolder}/${randomImage}`;

  console.log('[CG选择] 生成的图片URL:', imageUrl);
  console.log('[CG选择] 事件描述:', selectedEvent.description);
  console.log('[CG选择] 选择的图片索引:', randomImageIndex);
  console.log('[CG选择] ========== CG事件选择完成 ==========');

  return {
    event: selectedEvent,
    imageUrl,
    description: selectedEvent.description,
    imageIndex: randomImageIndex,
  };
}
