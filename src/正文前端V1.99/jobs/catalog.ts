export const recruitmentArtworkUrl = new URL(
  '信息服务中心.png',
  'https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/天海附加背景/',
).href;

export interface CampusJob {
  id: string;
  title: string;
  workplace: string;
  area: string;
  locationId: number;
  category: '商业服务' | '校园服务';
  icon: 'gift' | 'dress' | 'meal' | 'beach' | 'book' | 'onsen';
  summary: string;
  duties: string[];
  tags: string[];
}

/** 第一批公开场所的岗位；报酬、工时及结算规则由后续打工系统配置。 */
export const campusJobs: CampusJob[] = [
  {
    id: 'gift-shop',
    title: '礼物屋店员',
    workplace: '莉莉安的礼物屋',
    area: '综合商业街',
    locationId: 37,
    category: '商业服务',
    icon: 'gift',
    summary: '把一份心意，认真地装进礼盒。',
    duties: ['接待来访的同学，介绍店内礼物。', '包装礼盒，整理货架与订单。', '协助店主清点和补充商品。'],
    tags: ['接待', '包装'],
  },
  {
    id: 'boutique',
    title: '精品店导购',
    workplace: '美玲的精品店',
    area: '综合商业街',
    locationId: 37,
    category: '商业服务',
    icon: 'dress',
    summary: '从一套搭配开始，认识校园的新潮流。',
    duties: ['向顾客介绍服装，协助挑选搭配。', '整理试衣区，维护服装陈列。', '协助收银、打包与库存清点。'],
    tags: ['时尚', '导购'],
  },
  {
    id: 'dining-hall',
    title: '食堂帮厨',
    workplace: '中央食堂',
    area: '校园生活区',
    locationId: 35,
    category: '校园服务',
    icon: 'meal',
    summary: '午餐高峰来临前，和大家一起准备好。',
    duties: ['协助备餐、摆盘与窗口供餐。', '补充餐具，整理用餐区域。', '在营业结束后完成清洁与收尾。'],
    tags: ['餐饮', '协作'],
  },
  {
    id: 'beach-rental',
    title: '海之家店员',
    workplace: '海之家',
    area: '泳装与运动装备租赁店',
    locationId: 48,
    category: '商业服务',
    icon: 'beach',
    summary: '海风、遮阳伞，还有陆续到来的客人。',
    duties: ['办理泳装与海滩装备的租借登记。', '检查归还物品，整理和清洁装备。', '介绍店内用品，协助补货。'],
    tags: ['租赁', '整理'],
  },
  {
    id: 'library',
    title: '图书馆助理',
    workplace: '博览图书馆',
    area: '图书与研究区',
    locationId: 7,
    category: '校园服务',
    icon: 'book',
    summary: '在书页与午后阳光之间，找到自己的节奏。',
    duties: ['整理归还的书籍，按分类放回书架。', '协助借阅登记和普通资料检索。', '维护公共阅览区的整洁与秩序。'],
    tags: ['书籍', '文书'],
  },
  {
    id: 'hot-spring',
    title: '温泉服务员',
    workplace: '后山温泉',
    area: '后山休闲区',
    locationId: 13,
    category: '校园服务',
    icon: 'onsen',
    summary: '让每位来客都能安心享受片刻休息。',
    duties: ['接待来访者，介绍设施与使用方式。', '补充用品，整理更衣室和休息区。', '协助浴场清洁与日常设施检查。'],
    tags: ['接待', '维护'],
  },
];

export function jobInquiryText(job: CampusJob) {
  return `我来到综合服务大厅的信息服务中心，在招工启事中选中了「${job.workplace}」的「${job.title}」岗位，向如月诗乃咨询具体工作内容、排班时间、报酬和应聘流程。`;
}
