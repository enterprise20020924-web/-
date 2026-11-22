import { getPath } from './mvuStore';

export function syncInitialSetupFromMvu(mvuData: Mvu.MvuData | null): any {
  if (!mvuData?.stat_data) {
    return null;
  }

  return {
    角色基础: {
      _等级: getPath(mvuData.stat_data, '角色基础._等级', 1),
      经验值: getPath(mvuData.stat_data, '角色基础.经验值', 0),
      声望: getPath(mvuData.stat_data, '角色基础.声望', 0),
      _段位: getPath(mvuData.stat_data, '角色基础._段位', '无段位'),
      难度: getPath(mvuData.stat_data, '角色基础.难度', '普通'),
      性别: getPath(mvuData.stat_data, '角色基础.性别', '女'),
    },
    核心状态: {
      $属性点: getPath(mvuData.stat_data, '核心状态.$属性点', 0),
      $技能点: getPath(mvuData.stat_data, '核心状态.$技能点', 0),
      _潜力: getPath(mvuData.stat_data, '核心状态._潜力', 5.0),
      $最大耐力: getPath(mvuData.stat_data, '核心状态.$最大耐力', 100),
      $耐力: getPath(mvuData.stat_data, '核心状态.$耐力', 100),
      $最大快感: getPath(mvuData.stat_data, '核心状态.$最大快感', 100),
      $快感: getPath(mvuData.stat_data, '核心状态.$快感', 0),
      堕落度: getPath(mvuData.stat_data, '核心状态.堕落度', 0),
    },
    基础属性: {
      _魅力: getPath(mvuData.stat_data, '基础属性._魅力', 10),
      _幸运: getPath(mvuData.stat_data, '基础属性._幸运', 10),
      _闪避率: getPath(mvuData.stat_data, '基础属性._闪避率', 0),
      _暴击率: getPath(mvuData.stat_data, '基础属性._暴击率', 0),
    },
  };
}
