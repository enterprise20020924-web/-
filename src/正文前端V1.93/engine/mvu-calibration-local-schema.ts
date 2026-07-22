type LocalZodRuntime = typeof import('zod').z;

export function createLocalMvuCalibrationSchema(zodRuntime: unknown) {
  const z = zodRuntime as LocalZodRuntime;
  if (typeof z?.object !== 'function') {
    throw new Error('当前页面没有可用的 Zod 运行时。');
  }

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  // --- Core reusable schemas ---
  const BonusSchema = z
    .object({
      魅力加成: z.coerce.number().prefault(0),
      幸运加成: z.coerce.number().prefault(0),
      基础性斗力加成: z.coerce.number().prefault(0),
      基础性斗力成算: z.coerce.number().prefault(0),
      基础忍耐力加成: z.coerce.number().prefault(0),
      基础忍耐力成算: z.coerce.number().prefault(0),
      闪避率加成: z.coerce.number().prefault(0),
      暴击率加成: z.coerce.number().prefault(0),
    })
    .prefault({});

  const normalizeEffectTypeName = (value: unknown) => {
    if (value === '恐惧') return '乏力';
    if (value === '混乱') return '迷离';
    return value;
  };

  const SpecialEffectTypeSchema = z
    .preprocess(normalizeEffectTypeName, z.enum(['敏感', '乏力', '迷离', '集中', '反弹', '吸取快感']))
    .catch('敏感')
    .prefault('敏感');

  const SkillEffectTypeSchema = z
    .preprocess(
      normalizeEffectTypeName,
      z.enum([
        '性斗力',
        '忍耐力',
        '魅力',
        '幸运',
        '闪避率',
        '暴击率',
        '束缚',
        '快感变化',
        '持续快感',
        '耐力变化',
        '持续耐力',
        '敏感',
        '乏力',
        '迷离',
        '集中',
        '反弹',
        '吸取快感',
      ]),
    )
    .catch('性斗力')
    .prefault('性斗力');

  const StatusEffectSchema = z
    .object({
      加成: BonusSchema,
      剩余回合: z.coerce.number().min(0).prefault(0),
      描述: z.string().prefault(''),
      资源变化: z
        .object({
          快感: z.coerce.number().prefault(0),
          耐力: z.coerce.number().prefault(0),
          是否为百分比: z.boolean().prefault(false),
        })
        .optional(),
      特殊效果: z
        .object({
          类型: SpecialEffectTypeSchema,
          效果值: z.coerce.number().prefault(0),
          是否为百分比: z.boolean().prefault(false),
        })
        .optional(),
    })
    .prefault({});

  const PermanentStatusEffectSchema = z
    .object({
      加成: BonusSchema,
      描述: z.string().prefault(''),
      资源变化: z
        .object({
          快感: z.coerce.number().prefault(0),
          耐力: z.coerce.number().prefault(0),
          是否为百分比: z.boolean().prefault(false),
        })
        .optional(),
      特殊效果: z
        .object({
          类型: SpecialEffectTypeSchema,
          效果值: z.coerce.number().prefault(0),
          是否为百分比: z.boolean().prefault(false),
        })
        .optional(),
    })
    .prefault({});

  const RelationshipSchema = z
    .object({
      好感度: z.coerce
        .number()
        .transform(n => clamp(n, 0, 100))
        .prefault(0),
      支配度: z.coerce
        .number()
        .transform(n => clamp(n, -100, 100))
        .prefault(0),
      誓约: z.enum(['无', '支配型', '平等型', '被支配型']).catch('无').prefault('无'),
      关系类型: z.string().prefault('陌生人'),
    })
    .prefault({});

  const RaritySchema = z
    .preprocess(
      value => (typeof value === 'string' ? value.trim().toUpperCase() : value),
      z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS', 'EX']),
    )
    .catch('C')
    .prefault('C');

  const SkillEffectSchema = z
    .object({
      效果类型: SkillEffectTypeSchema,
      效果值: z.coerce.number().prefault(0),
      是否为百分比: z.boolean().prefault(false),
      持续回合数: z.coerce.number().min(0).prefault(0),
      是否作用敌人: z.boolean().prefault(true),
    })
    .prefault({});

  const ActiveSkillSchema = z.object({
    基本信息: z
      .object({
        技能名称: z.string().prefault(''),
        技能描述: z.string().prefault(''),
        基础描述: z.string().prefault(''),
        技能等级: z.coerce
          .number()
          .transform(n => clamp(n, 1, 5))
          .prefault(1),
        稀有度: RaritySchema,
      })
      .prefault({}),
    冷却与消耗: z
      .object({
        耐力消耗: z.coerce.number().min(0).prefault(0),
        冷却回合数: z.coerce.number().min(0).prefault(0),
      })
      .prefault({}),
    伤害与效果: z
      .object({
        伤害来源: z.enum(['性斗力', '魅力', '幸运', '固定值', '目标快感']).catch('性斗力').prefault('性斗力'),
        系数: z.coerce.number().prefault(100),
        基础命中率: z.coerce.number().prefault(100),
        连击数: z.coerce.number().min(1).prefault(1),
        准确率: z.coerce.number().prefault(100),
        暴击修正: z.coerce.number().prefault(0),
        效果列表: z.record(z.string(), SkillEffectSchema).prefault({}),
      })
      .prefault({}),
    特殊机制: z
      .object({
        是否忽视防御: z.boolean().prefault(false),
        是否可被闪避: z.boolean().prefault(true),
      })
      .prefault({}),
  });

  const TalentSchema = z
    .object({
      天赋名称: z.string().prefault(''),
      天赋描述: z.string().prefault(''),
      天赋效果: BonusSchema,
    })
    .prefault({});

  const EquippedItemSchema = z
    .object({
      名称: z.string().prefault(''),
      等级: RaritySchema,
      加成属性: BonusSchema,
      描述: z.string().prefault(''),
    })
    .prefault({});

  const BaseItemSchema = z.object({
    等级: RaritySchema,
    描述: z.string().prefault(''),
  });

  const EquipmentInBagSchema = BaseItemSchema.extend({
    类型: z.literal('装备'),
    加成属性: BonusSchema,
    部位: z.enum(['主装备', '副装备', '饰品', '特殊装备']),
    数量: z.literal(1).prefault(1),
  });

  const ConsumableItemSchema = BaseItemSchema.extend({
    类型: z.literal('消耗品'),
    加成属性: BonusSchema.optional(),
    耐力增加: z.coerce.number().optional(),
    快感降低: z.coerce.number().optional(),
    快感增加: z.coerce.number().optional(),
    潜力提升: z.coerce.number().optional(),
    战斗用品: z.boolean().prefault(false),
    数量: z.coerce.number().min(0).prefault(1),
  });

  const OtherItemSchema = BaseItemSchema.extend({
    类型: z.literal('其他'),
    数量: z.coerce.number().min(0).prefault(1),
  });

  const BackpackItemSchema = z.discriminatedUnion('类型', [
    EquipmentInBagSchema,
    ConsumableItemSchema,
    OtherItemSchema,
  ]);

  const Schema = z.object({
    角色基础: z
      .object({
        _等级: z.coerce
          .number()
          .transform(n => clamp(n, 1, 100))
          .prefault(1),
        _姓名: z.string().prefault(''),
        经验值: z.coerce.number().min(0).prefault(0),
        声望: z.coerce
          .number()
          .transform(n => clamp(n, -10000, 10000))
          .prefault(0),
        _段位: z.enum(['无段位', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']).prefault('无段位'),
        难度: z.enum(['简单', '普通', '困难', '抖M', '作弊']).prefault('普通'),
        性别: z.enum(['男', '女', '非二元']).prefault('女'),
      })
      .prefault({}),

    核心状态: z
      .object({
        $属性点: z.coerce.number().min(0).prefault(0),
        $技能点: z.coerce.number().min(0).prefault(0),
        $最大耐力: z.coerce.number().min(1).prefault(100),
        $耐力: z.coerce.number().min(0).prefault(100),
        $最大快感: z.coerce.number().min(1).prefault(100),
        $快感: z.coerce.number().min(0).prefault(0),
        堕落度: z.coerce
          .number()
          .transform(n => clamp(n, 0, 100))
          .prefault(0),
        _潜力: z.coerce
          .number()
          .transform(n => clamp(n, 5.0, 10.0))
          .prefault(5.0),
      })
      .prefault({}),

    基础属性: z
      .object({
        _魅力: z.coerce.number().min(0).prefault(10),
        _幸运: z.coerce.number().min(0).prefault(10),
        _闪避率: z.coerce.number().min(0).prefault(0),
        _暴击率: z.coerce
          .number()
          .transform(n => clamp(n, 0, 100))
          .prefault(0),
      })
      .prefault({}),

    临时状态: z
      .object({
        状态列表: z.record(z.string(), StatusEffectSchema).prefault({}),
      })
      .prefault({}),

    永久状态: z
      .object({
        状态列表: z.record(z.string(), PermanentStatusEffectSchema).prefault({}),
      })
      .prefault({}),

    性斗系统: z
      .object({
        对手名称: z.string().prefault(''),
        性斗类型: z
          .enum(['日常切磋', '升段赛', '决斗', '擂台赛', '校内赛', '多校联赛', '黑暗决赛', '无'])
          .catch('无')
          .prefault('无'),
        胜负规则: z
          .object({
            高潮次数上限: z.coerce.number().min(1).prefault(1),
            允许认输: z.boolean().prefault(true),
          })
          .prefault({}),
      })
      .prefault({}),

    关系系统: z
      .object({
        在场人物: z.array(z.string()).prefault([]),
      })
      .catchall(RelationshipSchema)
      .prefault({}),

    任务系统: z
      .object({
        主线任务: z
          .object({
            名称: z.string().prefault(''),
            描述: z.string().prefault(''),
            状态: z.enum(['进行中', '已完成', '已失败', '已放弃']).catch('进行中').prefault('进行中'),
            目标: z.record(z.string(), z.any()).prefault({}),
            奖励: z.string().prefault(''),
            期限: z.string().prefault('无'),
          })
          .prefault({}),
        支线任务: z
          .record(
            z.string(),
            z
              .object({
                描述: z.string().prefault(''),
                类型: z.enum(['日常', '特殊', '限时', '隐藏']).catch('日常').prefault('日常'),
                状态: z.enum(['进行中', '已完成', '已失败', '已放弃']).catch('进行中').prefault('进行中'),
                目标: z.record(z.string(), z.any()).prefault({}),
                奖励: z.string().prefault(''),
                期限: z.string().prefault('无'),
              })
              .prefault({}),
          )
          .prefault({}),
        已完成记录: z.array(z.string()).prefault([]),
      })
      .prefault({}),

    物品系统: z
      .object({
        学园金币: z.coerce.number().min(0).prefault(0),
        背包: z.record(z.string(), BackpackItemSchema).prefault({}),
        _装备栏: z
          .object({
            主装备: EquippedItemSchema,
            副装备: EquippedItemSchema,
            饰品1: EquippedItemSchema,
            饰品2: EquippedItemSchema,
            特殊装备: EquippedItemSchema,
          })
          .prefault({}),
      })
      .prefault({}),

    位置系统: z
      .object({
        坐标: z.string().prefault('[1-1]'),
        楼层: z.coerce.number().prefault(1),
        地点名称: z.string().prefault('初始点'),
      })
      .prefault({}),

    时间系统: z
      .object({
        日期: z.string().prefault('2025-3-17'),
        星期: z.coerce
          .number()
          .transform(n => clamp(n, 1, 7))
          .prefault(1),
        时间: z.string().prefault('08:00'),
      })
      .prefault({}),

    势力声望: z
      .object({
        学生会: z.coerce
          .number()
          .transform(n => clamp(n, -100, 100))
          .prefault(0),
        女权协会: z.coerce
          .number()
          .transform(n => clamp(n, -100, 100))
          .prefault(0),
        BF社: z.coerce
          .number()
          .transform(n => clamp(n, -100, 100))
          .prefault(0),
        体育联盟: z.coerce
          .number()
          .transform(n => clamp(n, -100, 100))
          .prefault(0),
        研究会: z.coerce
          .number()
          .transform(n => clamp(n, -100, 100))
          .prefault(0),
        地下联盟: z.coerce
          .number()
          .transform(n => clamp(n, -100, 100))
          .prefault(0),
        男性自保联盟: z.coerce
          .number()
          .transform(n => clamp(n, -100, 100))
          .prefault(0),
        雌堕会: z.coerce
          .number()
          .transform(n => clamp(n, -100, 100))
          .prefault(0),
      })
      .prefault({}),

    技能系统: z
      .object({
        主动技能: z.record(z.string(), ActiveSkillSchema).prefault({}),
        $天赋: z.record(z.string(), TalentSchema).prefault({}),
      })
      .prefault({}),
  });

  return Schema;
}
