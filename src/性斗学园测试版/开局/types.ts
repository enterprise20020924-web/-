export enum Gender {
  MALE = '男',
  FEMALE = '女',
  OTHER = '非二元',
}

export enum Difficulty {
  STORY = '剧情模式 (简单)',
  NORMAL = '学园生活 (普通)',
  HARDCORE = '地狱开局 (困难)',
  CHEATER = '作弊者',
  MASOCHIST = '抖M',
}

export enum MainlineTimeline {
  NONE = '入学线',
  IDOL = '偶像线',
  SPORTS = '运动会线',
  FESTIVAL = '学院祭线',
  MIDTERM = '期中考试线',
  SUMMER = '夏日休学旅行线',
}

// 根据 [initvar].yaml 的 MVU 变量结构定义
// _ 前缀：只读属性（对AI不可修改）
// $ 前缀：对AI不可见、不可修改
// 无前缀：普通属性（对AI可见可修改）
// 对脚本来说所有属性都可修改
export interface CharacterAttributes {
  // 角色基础
  角色基础: {
    _等级: number; // 只读 (1-100)
    经验值: number; // 普通
    声望?: number; // 普通
    _段位?: string; // 只读
  };

  // 核心状态
  核心状态: {
    $属性点: number; // 可修改 - 用于升级分配
    $技能点: number; // 可修改 - 用于技能升级
    $最大耐力: number; // 可修改
    $耐力: number; // 可修改
    $最大快感: number; // 可修改
    $快感: number; // 可修改
    堕落度: number; // 普通
    _潜力: number; // 只读 (5.0-10.0) - 用于计算升级获得的点数
  };

  基础属性: {
    _魅力: number;
    _幸运: number;
    _闪避率: number;
    _暴击率: number;
  };
}

// 状态/装备加成属性
export interface PermanentBonus {
  魅力加成: number;
  幸运加成: number;
  基础性斗力加成: number;
  基础性斗力成算: number;
  基础忍耐力加成: number;
  基础忍耐力成算: number;
  闪避率加成: number;
  暴击率加成: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'constitution'; // Active = Action, Constitution = Passive Body Trait
  cost?: number; // Point cost if applicable
  icon: string;
  effectDescription?: string; // Short text for UI
}

export interface FixedIdentityStart {
  level: number;
  rank: string;
  potential: number;
}

export interface IdentityMechanismDefinition {
  id: string;
  kind: 'affection-count';
  name: string;
  description: string;
  threshold: number;
  gain: number;
  max: number;
}

export interface UserProfile {
  basicInfo: string;
  lifeStructure: string;
  characterNature: string;
  sceneExpression: string;
}

export interface Archetype {
  id: string;
  name: string;
  description: string;
  icon: string;
  passiveSkill: Skill;
  fixedStart?: FixedIdentityStart; // 身份自带开局条件，不消耗加点额度
  startingAttributePoints?: number;
  startingItems?: Record<string, { 类型: '其他'; 描述: string; 数量: number }>;
  openingStory?: string;
  userProfile?: UserProfile;
  defaultName?: string;
  defaultAge?: number;
  defaultHeight?: number;
  mechanisms?: IdentityMechanismDefinition[];
  // 永久状态
  permanentState: {
    name: string; // 永久状态名称
    bonus: PermanentBonus; // 永久状态加成
  };
  hidden?: boolean; // 是否隐藏（需要特殊代码才能显示）
}

export interface CharacterData {
  name: string;
  age: number;
  gender: Gender;
  appearance: string;
  personality: string;
  palettePersonaOverview: string;
  palettePersona: string;
  userProfile?: UserProfile;
  userProfilePresetId?: string;
  openingSceneOutline: string;
  background: string;
  difficulty: Difficulty;
  mainlineTimeline: MainlineTimeline;
  archetypeId: string | null;

  // The core stats - 使用嵌套结构匹配 MVU 变量
  attributes: CharacterAttributes;

  // Body stats
  height: number;
  weight: number;
  cupSize: string;
  hips: number;
  cockLength: number;
  maleGenitalType?: string; // 男性性器特征（当hasPenis为true时使用）
  femaleGenitalType?: string; // 女性性器特征（当hasBreasts为true时使用）

  // Body Configuration (For Non-binary mostly)
  configFeatures: {
    hasBreasts: boolean;
    hasPenis: boolean;
  };

  // Skills
  initialActiveSkills: string[]; // IDs of selected active skills
  initialPassiveSkills: string[]; // IDs of selected constitution skills
}

// Default starting values based on [initvar].yaml
export const INITIAL_ATTRIBUTES: CharacterAttributes = {
  角色基础: {
    _等级: 1,
    经验值: 0,
    声望: 0,
    _段位: '无段位',
  },
  核心状态: {
    $属性点: 0,
    $技能点: 0,
    $最大耐力: 100,
    $耐力: 100,
    $最大快感: 100,
    $快感: 0,
    堕落度: 0,
    _潜力: 5.0,
  },
  基础属性: {
    _魅力: 10,
    _幸运: 10,
    _闪避率: 0,
    _暴击率: 0,
  },
};

export const INITIAL_CHARACTER_DATA: CharacterData = {
  name: '',
  age: 18,
  gender: Gender.FEMALE,
  appearance: '',
  personality: '',
  palettePersonaOverview: '',
  palettePersona: '',
  userProfile: { basicInfo: '', lifeStructure: '', characterNature: '', sceneExpression: '' },
  openingSceneOutline: '',
  background: '',
  difficulty: Difficulty.NORMAL,
  mainlineTimeline: MainlineTimeline.NONE,
  archetypeId: null,
  attributes: { ...INITIAL_ATTRIBUTES },
  height: 165,
  weight: 50,
  cupSize: 'C',
  hips: 90,
  cockLength: 15,
  maleGenitalType: undefined,
  femaleGenitalType: undefined,
  configFeatures: {
    hasBreasts: true,
    hasPenis: false,
  },
  initialActiveSkills: [],
  initialPassiveSkills: [],
};
