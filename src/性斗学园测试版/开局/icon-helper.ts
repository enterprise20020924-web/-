/**
 * 图标映射工具 - 将图标名称映射到 FontAwesome 图标类名
 * FontAwesome 6 Free 版本
 */
export const iconMap: Record<string, string> = {
  // === 人物与身份 ===
  User: 'fa-user',
  UserSecret: 'fa-user-secret',
  Users: 'fa-users',
  Person: 'fa-person',
  Crown: 'fa-crown',
  Glasses: 'fa-glasses',
  Hat: 'fa-hat-wizard',
  Mask: 'fa-mask',

  // === 动物 ===
  Cat: 'fa-cat',
  Dog: 'fa-dog',
  Dragon: 'fa-dragon',
  Spider: 'fa-spider',
  Dove: 'fa-dove',
  Fish: 'fa-fish',
  Paw: 'fa-paw',

  // === 身体与感官 ===
  Eye: 'fa-eye',
  EyeSlash: 'fa-eye-slash',
  Brain: 'fa-brain',
  Hand: 'fa-hand',
  HandFist: 'fa-hand-fist',
  HandPointer: 'fa-hand-pointer',
  Ear: 'fa-ear-listen',
  Lips: 'fa-lips',
  Tooth: 'fa-tooth',

  // === 武器与战斗 ===
  Sword: 'fa-wand-sparkles', // FA6 Free 没有 sword，用魔法棒代替
  SwordCross: 'fa-khanda',
  Shield: 'fa-shield-halved',
  ShieldAlt: 'fa-shield',
  Dagger: 'fa-dagger', // FA6 Pro only, fallback
  Wand: 'fa-wand-magic-sparkles',
  Bow: 'fa-bow-arrow', // FA6 Pro only
  Gun: 'fa-gun',
  Bomb: 'fa-bomb',
  Crosshairs: 'fa-crosshairs',

  // === 魔法与能量 ===
  Sparkles: 'fa-wand-magic-sparkles',
  Stars: 'fa-stars', // FA6 Pro
  Star: 'fa-star',
  StarHalf: 'fa-star-half-stroke',
  Magic: 'fa-hat-wizard',
  Zap: 'fa-bolt',
  Lightning: 'fa-bolt-lightning',
  Flame: 'fa-fire',
  Fire: 'fa-fire-flame-curved',
  Snowflake: 'fa-snowflake',
  Sun: 'fa-sun',
  Moon: 'fa-moon',
  Eclipse: 'fa-circle-half-stroke',
  Cloud: 'fa-cloud',
  Wind: 'fa-wind',
  Tornado: 'fa-tornado',
  Hurricane: 'fa-hurricane',
  Water: 'fa-water',
  Droplets: 'fa-droplet',
  Burst: 'fa-burst',

  // === 情感与状态 ===
  Heart: 'fa-heart',
  HeartBroken: 'fa-heart-crack',
  HeartPulse: 'fa-heart-pulse',
  Smile: 'fa-face-smile',
  Grin: 'fa-face-grin',
  GrinHearts: 'fa-face-grin-hearts',
  Angry: 'fa-face-angry',
  Sad: 'fa-face-sad-tear',
  Dizzy: 'fa-face-dizzy',
  Flushed: 'fa-face-flushed',
  Meh: 'fa-face-meh',
  Surprise: 'fa-face-surprise',
  Kiss: 'fa-face-kiss-wink-heart',
  Tired: 'fa-face-tired',
  Ghost: 'fa-ghost',
  Skull: 'fa-skull',
  SkullCrossbones: 'fa-skull-crossbones',

  // === 运动与能力 ===
  Dumbbell: 'fa-dumbbell',
  Running: 'fa-person-running',
  Walking: 'fa-person-walking',
  Biking: 'fa-person-biking',
  Swimming: 'fa-person-swimming',
  Stretching: 'fa-child-reaching',
  Yoga: 'fa-spa',

  // === 科技 ===
  Cpu: 'fa-microchip',
  Wifi: 'fa-wifi',
  Robot: 'fa-robot',
  Gear: 'fa-gear',
  Gears: 'fa-gears',
  Settings: 'fa-gear',
  Cog: 'fa-cog',
  Terminal: 'fa-terminal',
  Code: 'fa-code',
  Database: 'fa-database',
  Server: 'fa-server',
  Memory: 'fa-memory',
  Chip: 'fa-microchip',

  // === 自然与植物 ===
  Flower: 'fa-clover', // 使用四叶草代替
  Seedling: 'fa-seedling',
  Leaf: 'fa-leaf',
  Tree: 'fa-tree',
  Clover: 'fa-clover',
  Mountain: 'fa-mountain',
  MountainSun: 'fa-mountain-sun',
  Feather: 'fa-feather',
  FeatherPointed: 'fa-feather-pointed',

  // === 工具与物品 ===
  Scissors: 'fa-scissors',
  Anchor: 'fa-anchor',
  Key: 'fa-key',
  Lock: 'fa-lock',
  Unlock: 'fa-unlock',
  Chain: 'fa-link',
  ChainBroken: 'fa-link-slash',
  Ring: 'fa-ring',
  Gem: 'fa-gem',
  Diamond: 'fa-diamond',
  Crown2: 'fa-crown',
  Trophy: 'fa-trophy',
  Medal: 'fa-medal',
  Certificate: 'fa-certificate',
  Ribbon: 'fa-ribbon',

  // === 药品与化学 ===
  FlaskConical: 'fa-flask',
  Flask: 'fa-flask-vial',
  Vial: 'fa-vial',
  Syringe: 'fa-syringe',
  Pills: 'fa-pills',
  Capsules: 'fa-capsules',
  Bandage: 'fa-bandage',
  Prescription: 'fa-prescription-bottle',

  // === 书籍与知识 ===
  Book: 'fa-book',
  BookOpen: 'fa-book-open',
  BookSkull: 'fa-book-skull',
  BookBible: 'fa-book-bible',
  Scroll: 'fa-scroll',
  GraduationCap: 'fa-graduation-cap',
  Lightbulb: 'fa-lightbulb',

  // === 音乐与艺术 ===
  Music: 'fa-music',
  MusicNote: 'fa-music',
  Guitar: 'fa-guitar',
  Drum: 'fa-drum',
  Palette: 'fa-palette',
  PaintBrush: 'fa-paintbrush',
  Pen: 'fa-pen',
  Pencil: 'fa-pencil',

  // === 媒体与摄影 ===
  Camera: 'fa-camera',
  CameraRetro: 'fa-camera-retro',
  Video: 'fa-video',
  Film: 'fa-film',
  Image: 'fa-image',
  Images: 'fa-images',
  Mirror: 'fa-clone', // 用复制图标代替镜子
  Disc: 'fa-compact-disc',

  // === UI与控制 ===
  ChevronRight: 'fa-chevron-right',
  ChevronLeft: 'fa-chevron-left',
  ChevronUp: 'fa-chevron-up',
  ChevronDown: 'fa-chevron-down',
  ArrowRight: 'fa-arrow-right',
  ArrowLeft: 'fa-arrow-left',
  ArrowUp: 'fa-arrow-up',
  ArrowDown: 'fa-arrow-down',
  Check: 'fa-check',
  CheckCircle: 'fa-circle-check',
  Times: 'fa-xmark',
  TimesCircle: 'fa-circle-xmark',
  Plus: 'fa-plus',
  Minus: 'fa-minus',
  Info: 'fa-circle-info',
  Question: 'fa-circle-question',
  HelpCircle: 'fa-circle-question',
  Exclamation: 'fa-circle-exclamation',
  Warning: 'fa-triangle-exclamation',
  Ban: 'fa-ban',
  Refresh: 'fa-rotate',
  RefreshCcw: 'fa-rotate-left',
  Sync: 'fa-arrows-rotate',
  Search: 'fa-magnifying-glass',
  ZoomIn: 'fa-magnifying-glass-plus',
  ZoomOut: 'fa-magnifying-glass-minus',

  // === 图表与数据 ===
  Target: 'fa-bullseye',
  Bullseye: 'fa-bullseye',
  Crosshair: 'fa-crosshairs',
  TrendingUp: 'fa-arrow-trend-up',
  TrendingDown: 'fa-arrow-trend-down',
  Activity: 'fa-chart-line',
  ChartLine: 'fa-chart-line',
  ChartBar: 'fa-chart-bar',
  ChartPie: 'fa-chart-pie',
  Percent: 'fa-percent',
  Gauge: 'fa-gauge-high',

  // === 时间 ===
  Clock: 'fa-clock',
  Hourglass: 'fa-hourglass-half',
  Stopwatch: 'fa-stopwatch',
  Timer: 'fa-timer', // FA6 Pro
  Calendar: 'fa-calendar',
  CalendarDay: 'fa-calendar-day',

  // === 交通 ===
  Footprints: 'fa-shoe-prints',
  ShoeFootprints: 'fa-shoe-prints',
  Car: 'fa-car',
  Plane: 'fa-plane',
  Rocket: 'fa-rocket',
  Ship: 'fa-ship',

  // === 建筑与地点 ===
  Home: 'fa-house',
  Building: 'fa-building',
  Castle: 'fa-chess-rook',
  Tower: 'fa-tower-observation',
  Church: 'fa-church',
  School: 'fa-school',
  Hospital: 'fa-hospital',
  Store: 'fa-store',
  Warehouse: 'fa-warehouse',
  Dungeon: 'fa-dungeon',

  // === 金融 ===
  Coins: 'fa-coins',
  Coin: 'fa-coin', // FA6 Pro
  MoneyBill: 'fa-money-bill',
  Wallet: 'fa-wallet',
  PiggyBank: 'fa-piggy-bank',
  Vault: 'fa-vault',
  Sack: 'fa-sack-dollar',

  // === 通信 ===
  Comment: 'fa-comment',
  Comments: 'fa-comments',
  Message: 'fa-message',
  Envelope: 'fa-envelope',
  Phone: 'fa-phone',
  Bell: 'fa-bell',
  BellSlash: 'fa-bell-slash',

  // === 衣物与装备 ===
  Shirt: 'fa-shirt',
  Vest: 'fa-vest',
  Socks: 'fa-socks',
  Mitten: 'fa-mitten',
  HatCowboy: 'fa-hat-cowboy',
  Helmet: 'fa-helmet-safety',

  // === 食物与饮料 ===
  Apple: 'fa-apple-whole',
  Lemon: 'fa-lemon',
  Carrot: 'fa-carrot',
  Burger: 'fa-burger',
  Pizza: 'fa-pizza-slice',
  IceCream: 'fa-ice-cream',
  Candy: 'fa-candy-cane',
  Wine: 'fa-wine-glass',
  Coffee: 'fa-mug-hot',
  Beer: 'fa-beer-mug-empty',
  Cocktail: 'fa-martini-glass',

  // === 特殊符号 ===
  Infinity: 'fa-infinity',
  Yin: 'fa-yin-yang',
  Om: 'fa-om',
  Peace: 'fa-peace',
  Radiation: 'fa-radiation',
  Biohazard: 'fa-biohazard',
  Atom: 'fa-atom',
  Dna: 'fa-dna',
  Venus: 'fa-venus',
  Mars: 'fa-mars',
  VenusMars: 'fa-venus-mars',
  Transgender: 'fa-transgender',
  Neuter: 'fa-neuter',
  Genderless: 'fa-genderless',

  // === 天气 ===
  CloudSun: 'fa-cloud-sun',
  CloudMoon: 'fa-cloud-moon',
  CloudRain: 'fa-cloud-rain',
  CloudBolt: 'fa-cloud-bolt',
  Snowflake2: 'fa-snowflake',
  Temperature: 'fa-temperature-half',
  Umbrella: 'fa-umbrella',

  // === 游戏与娱乐 ===
  Dice: 'fa-dice',
  DiceD6: 'fa-dice-d6',
  DiceD20: 'fa-dice-d20',
  Chess: 'fa-chess',
  ChessKing: 'fa-chess-king',
  ChessQueen: 'fa-chess-queen',
  Puzzle: 'fa-puzzle-piece',
  Gamepad: 'fa-gamepad',
  VR: 'fa-vr-cardboard',

  // === 身体状态相关（游戏专用）===
  Heartbeat: 'fa-heart-pulse',
  BandAid: 'fa-bandage',
  FirstAid: 'fa-kit-medical',
  Bed: 'fa-bed',
  BedPulse: 'fa-bed-pulse',
  Wheelchair: 'fa-wheelchair',
  Crutch: 'fa-crutch',
  Brain2: 'fa-brain',
  EyeDropper: 'fa-eye-dropper',

  // === 动作相关 ===
  HandHolding: 'fa-hand-holding',
  HandHoldingHeart: 'fa-hand-holding-heart',
  HandsHolding: 'fa-hands-holding',
  HandsClapping: 'fa-hands-clapping',
  HandsPraying: 'fa-hands-praying',
  HandPointUp: 'fa-hand-point-up',
  HandPointDown: 'fa-hand-point-down',
  HandPointLeft: 'fa-hand-point-left',
  HandPointRight: 'fa-hand-point-right',
  Handshake: 'fa-handshake',
  ThumbsUp: 'fa-thumbs-up',
  ThumbsDown: 'fa-thumbs-down',
  Handcuffs: 'fa-handcuffs',
};

/**
 * 获取图标类名
 * @param iconName 图标名称
 * @returns FontAwesome 图标类名
 */
export function getIconClass(iconName: string): string {
  const icon = iconMap[iconName];
  if (!icon) {
    console.warn(`[icon-helper] 图标 "${iconName}" 未在映射中找到，使用默认图标 fa-circle`);
    return 'fa-circle';
  }
  return icon;
}

/**
 * 检查图标是否存在于映射中
 * @param iconName 图标名称
 * @returns 是否存在
 */
export function hasIcon(iconName: string): boolean {
  return iconName in iconMap;
}

/**
 * 获取所有可用图标名称
 * @returns 图标名称数组
 */
export function getAllIconNames(): string[] {
  return Object.keys(iconMap);
}

/**
 * 按类别获取图标
 * @param category 类别前缀
 * @returns 该类别的图标映射
 */
export function getIconsByCategory(category: string): Record<string, string> {
  const result: Record<string, string> = {};
  const categoryMap: Record<string, string[]> = {
    emotion: [
      'Heart',
      'HeartBroken',
      'HeartPulse',
      'Smile',
      'Grin',
      'GrinHearts',
      'Angry',
      'Sad',
      'Dizzy',
      'Flushed',
      'Kiss',
      'Tired',
    ],
    combat: ['Sword', 'Shield', 'Wand', 'Crosshairs', 'Target', 'Bomb', 'Gun'],
    magic: ['Sparkles', 'Star', 'Zap', 'Lightning', 'Flame', 'Fire', 'Snowflake', 'Wind', 'Water'],
    status: ['Ghost', 'Skull', 'Heartbeat', 'BandAid', 'Bed', 'Dizzy', 'Tired'],
    body: ['Eye', 'Brain', 'Hand', 'Ear', 'Lips'],
  };

  const icons = categoryMap[category] || [];
  for (const name of icons) {
    if (iconMap[name]) {
      result[name] = iconMap[name];
    }
  }
  return result;
}
