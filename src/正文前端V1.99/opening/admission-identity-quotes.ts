import { MAGIC_GIRL_ARCHETYPE_ID } from '../../性斗学园测试版/开局/constants';

/** 身份选择页右侧白色标题条的台词；留空时隐藏，按身份 ID 填写即可。 */
export const admissionIdentityQuotes: Record<string, string> = {
  custom: '', // 泛泛之辈
  [MAGIC_GIRL_ARCHETYPE_ID]: '‘魔装影姬塞蕾娜克西娅参上！’什么的......果然当魔法少女还得喊这样的羞耻台词，好辛苦......', // 小夜月静夜
  f_gyaru: '', // 江口虎子
  f_chuuni: '是时候细数你们的罪恶了！！！', // 左翔羽
  f_bimbo: '', // 蕾米莉亚
  f_mesugaki: '', // 白川千春
};
