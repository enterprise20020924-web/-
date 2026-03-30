
export interface Status {
  name: string;
  effect: string;
  type: 'buff' | 'debuff' | 'neutral';
}

export interface Trait {
  name: string;
  description?: string;
}

export interface Tattoo {
  name: string; // English name as requested
  design: string;
}

export interface Item {
  name: string;
  effect: string;
  icon?: string;
}

export interface Skill {
  name: string;
  effect: string;
}

export interface User {
  name: string;
  gender: '男' | '女' | '其他';
  corruption: number; // 0-100
  tempStatuses: Status[];
  permTraits: Trait[];
  tattoos: Tattoo[];
  inventory: Item[];
  avatar: string;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  corruption: number;
  affection: number;
  quote: string;
  tempStatuses: Status[];
  permTraits: Trait[];
  tattoos: Tattoo[];
  corruptedItems: Item[];
  makeup: { name: string; style: string }[];
  coreSkills: Skill[];
  isOnline: boolean;
  lastSeen: string;
}

export interface DiscoveryPerson {
  id: string;
  name: string;
  avatar: string;
  location: string;
  identity: string;
  currentStatus: string;
  thoughts: string;
  coreSkills: Skill[];
  distance: string;
}

export interface ForumPost {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  tags: string[];
  isHot?: boolean;
}

export const currentUser: User = {
  name: "亚历克斯",
  gender: "男",
  corruption: 15,
  tempStatuses: [
    { name: "疲惫", effect: "精力恢复速度 -10%", type: "debuff" },
    { name: "躁动", effect: "魅力 +5%, 专注度 -5%", type: "neutral" }
  ],
  permTraits: [
    { name: "观察者" },
    { name: "技术专家" }
  ],
  tattoos: [
    { name: "Succubus Mark", design: "后腰处有一个精致的心形纹身，带有蝙蝠翅膀。" }
  ],
  inventory: [
    { name: "智能终端", effect: "访问深渊论坛的权限" },
    { name: "奇怪的药剂", effect: "未知的紫色液体，散发着微光。" }
  ],
  avatar: "https://picsum.photos/seed/alex/200/200"
};

export const contacts: Contact[] = [
  {
    id: "1",
    name: "陈莎拉",
    avatar: "https://picsum.photos/seed/sarah/200/200",
    corruption: 45,
    affection: 80,
    quote: "只要你看着我，黑暗就不算什么。",
    tempStatuses: [
      { name: "痴迷", effect: "会频繁发送消息", type: "neutral" }
    ],
    permTraits: [
      { name: "病娇" },
      { name: "黑客" }
    ],
    tattoos: [
      { name: "Code Flow", design: "沿着脊柱流动的二进制代码，兴奋时会发光。" }
    ],
    corruptedItems: [
      { name: "服从项圈", effect: "服从度 +20" }
    ],
    makeup: [
      { name: "烟熏妆", style: "带有紫色调的深色眼线。" }
    ],
    coreSkills: [
      { name: "数字幽灵", effect: "可以抹去数字足迹。" }
    ],
    isOnline: true,
    lastSeen: "刚刚"
  },
  {
    id: "2",
    name: "艾琳娜",
    avatar: "https://picsum.photos/seed/elena/200/200",
    corruption: 88,
    affection: 30,
    quote: "跪下，虫子。",
    tempStatuses: [],
    permTraits: [
      { name: "施虐狂" },
      { name: "女王蜂" }
    ],
    tattoos: [
      { name: "Crown of Thorns", design: "缠绕在左大腿上的荆棘纹身。" }
    ],
    corruptedItems: [],
    makeup: [
      { name: "烈焰红唇", style: "血红色的哑光口红。" }
    ],
    coreSkills: [
      { name: "支配", effect: "强制低等级用户服从。" }
    ],
    isOnline: false,
    lastSeen: "2小时前"
  }
];

export const discoveryPeople: DiscoveryPerson[] = [
  {
    id: "3",
    name: "未知用户 404",
    avatar: "https://picsum.photos/seed/404/200/200",
    location: "第七区 - 红灯区",
    identity: "地下医生",
    currentStatus: "寻找实验对象...",
    thoughts: "需要新鲜的样本。",
    coreSkills: [
      { name: "生物改造", effect: "可以改变身体特征。" }
    ],
    distance: "0.5km"
  },
  {
    id: "4",
    name: "米娅",
    avatar: "https://picsum.photos/seed/mia/200/200",
    location: "大学校园",
    identity: "学生会主席",
    currentStatus: "深夜学习中...",
    thoughts: "有人在看我吗？",
    coreSkills: [
      { name: "公众影响力", effect: "可以左右舆论。" }
    ],
    distance: "2.1km"
  }
];

export const forumPosts: ForumPost[] = [
  {
    id: "1",
    author: "夜行者",
    authorAvatar: "https://picsum.photos/seed/night/200/200",
    content: "有人注意到今晚霓虹灯的闪烁规律了吗？感觉像是...某种代码。",
    timestamp: "2分钟前",
    likes: 124,
    comments: 45,
    tags: ["#都市传说", "#夜生活"],
    isHot: true
  },
  {
    id: "2",
    author: "魅魔女王",
    authorAvatar: "https://picsum.photos/seed/succ/200/200",
    content: "周末寻找一只'宠物'。要求：听话，耐玩。私信我。",
    timestamp: "15分钟前",
    likes: 892,
    comments: 312,
    tags: ["#寻找", "#深夜话题"],
    isHot: true
  },
  {
    id: "3",
    author: "机械神甫",
    authorAvatar: "https://picsum.photos/seed/tech/200/200",
    content: "刚安装了新的神经连接更新。现在的色彩比以前鲜艳多了。",
    timestamp: "1小时前",
    likes: 56,
    comments: 12,
    tags: ["#科技", "#义体改造"]
  }
];
