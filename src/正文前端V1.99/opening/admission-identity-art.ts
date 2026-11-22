interface AdmissionIdentityArt {
  name: string;
  fullbodyUrl: string;
  qAvatarUrl?: string;
  battleUrl?: string;
}

const assetBase = 'https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/全身立绘/';

/** 身份 ID 对应的默认人物与素材；开局、正文和战斗共用，不依赖玩家改名。 */
export const admissionIdentityArt: Record<string, AdmissionIdentityArt> = {
  f_magic_girl: {
    name: '小夜月静夜',
    fullbodyUrl:
      'https://raw.githubusercontent.com/enterprise20020924-web/-/b986c8449c92926f4c2e1829b8024d7481e3f27f/llm1/全身立绘/小夜月静夜4K.png',
    battleUrl: 'https://img.vinsimage.org/性斗学园/立绘/小夜月静夜.png',
  },
  f_gyaru: {
    name: '江口虎子',
    fullbodyUrl: `${assetBase}黑皮辣妹4K.png`,
    qAvatarUrl: `${assetBase}江口虎子Q版.png`,
    battleUrl: `${assetBase}黑皮辣妹大姐头战斗.png`,
  },
  f_chuuni: {
    name: '左翔羽',
    fullbodyUrl: `${assetBase}左翔羽4K.png`,
    qAvatarUrl: `${assetBase}左翔羽Q版.png`,
    battleUrl: `${assetBase}左翔羽战斗.png`,
  },
  f_bimbo: {
    name: '蕾米莉亚',
    fullbodyUrl: `${assetBase}蕾米莉亚4K.png`,
    qAvatarUrl: `${assetBase}蕾米莉亚Q版.png`,
    battleUrl: `${assetBase}蕾米莉亚战斗.png`,
  },
  f_mesugaki: {
    name: '白川千春',
    fullbodyUrl: `${assetBase}白川千春4K.png`,
    qAvatarUrl: `${assetBase}白川千春Q版.png`,
    battleUrl: `${assetBase}白川千春战斗.png`,
  },
};
