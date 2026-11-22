// 由 tools/sync-narrative-core-data.mjs 从根目录性斗学园 3.3.2 生成。
export const CORE_MVU_SCHEMA_ROOT_KEYS: string[] = [
  "角色基础",
  "核心状态",
  "基础属性",
  "临时状态",
  "永久状态",
  "性斗系统",
  "关系系统",
  "任务系统",
  "物品系统",
  "位置系统",
  "时间系统",
  "势力声望",
  "技能系统"
];
export const CORE_MVU_SCHEMA_FIXED_CHILDREN: Record<string, string[]> = {
  "角色基础": [
    "_等级",
    "_姓名",
    "身份",
    "经验值",
    "声望",
    "_段位",
    "难度",
    "性别"
  ],
  "核心状态": [
    "$属性点",
    "$技能点",
    "$最大耐力",
    "$耐力",
    "$最大快感",
    "$快感",
    "堕落度",
    "_潜力"
  ],
  "基础属性": [
    "_魅力",
    "_幸运",
    "_闪避率",
    "_暴击率",
    "_性斗力加成",
    "_性斗力成算",
    "_忍耐力加成",
    "_忍耐力成算"
  ],
  "临时状态": [
    "状态列表"
  ],
  "永久状态": [
    "状态列表"
  ],
  "性斗系统": [
    "对手名称",
    "性斗类型",
    "胜负规则"
  ],
  "关系系统": [
    "在场人物"
  ],
  "任务系统": [
    "主线任务",
    "支线任务",
    "自由任务",
    "已完成记录"
  ],
  "物品系统": [
    "_天海信用点",
    "天海信用点",
    "_学园金币",
    "学园金币",
    "背包",
    "_装备栏"
  ],
  "位置系统": [
    "坐标",
    "楼层",
    "地点名称"
  ],
  "时间系统": [
    "日期",
    "星期",
    "时间"
  ],
  "势力声望": [
    "学生会",
    "女权协会",
    "BF社",
    "体育联盟",
    "研究会",
    "地下联盟",
    "男性自保联盟",
    "雌堕会"
  ],
  "技能系统": [
    "主动技能",
    "$天赋"
  ]
};
export const CORE_MVU_SCHEMA_RELATIONSHIP_FIELD_NAMES: string[] = [
  "好感度",
  "支配度",
  "誓约",
  "关系类型",
  "等级",
  "技能系"
];
export const CORE_MVU_SCHEMA_EQUIPMENT_SLOT_NAMES: string[] = [
  "主装备",
  "副装备",
  "饰品1",
  "饰品2",
  "特殊装备"
];
export const CORE_MVU_SCHEMA_EQUIPMENT_FIELD_NAMES: string[] = [
  "名称",
  "等级",
  "加成属性",
  "描述"
];
export const CORE_MVU_SCHEMA_MAIN_TASK_FIELD_NAMES: string[] = [
  "任务ID",
  "固定任务ID",
  "来源",
  "天海信用点奖励",
  "信用点奖励",
  "金币奖励",
  "奖励说明",
  "名称",
  "描述",
  "状态",
  "目标",
  "奖励",
  "期限"
];
export const CORE_MVU_SCHEMA_SIDE_TASK_FIELD_NAMES: string[] = [
  "任务ID",
  "固定任务ID",
  "来源",
  "天海信用点奖励",
  "信用点奖励",
  "金币奖励",
  "奖励说明",
  "描述",
  "类型",
  "状态",
  "目标",
  "奖励",
  "期限"
];
export const CORE_MVU_SCHEMA_SOURCE_VERSION = "3.3.2";
export const CORE_MVU_SCHEMA_SOURCE_FINGERPRINT = "9c51dc7e5437e29a17caefb216f2758e0668bd372f82ac0bda29f5089d4617d9";
