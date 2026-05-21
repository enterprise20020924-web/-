export const BABY_KNOWLEDGE_WORLDBOOK = '写卡知识库' as const;

export type BabyAssistantIntent = 'explain' | 'example' | 'check' | 'question';

export type BabyFieldId =
  | 'target.worldbook'
  | 'target.character'
  | 'notes.freeform'
  | 'character.name'
  | 'character.age'
  | 'character.gender'
  | 'character.identity'
  | 'character.relation'
  | 'character.appearance'
  | 'character.outfit'
  | 'character.marker'
  | 'character.background'
  | 'character.origin'
  | 'character.interaction'
  | 'worldview.seed'
  | 'worldview.final'
  | 'worldview.unsure'
  | 'palette.kind'
  | 'palette.raw'
  | 'palette.note'
  | 'wardrobe.daily'
  | 'wardrobe.favorite'
  | 'wardrobe.disliked'
  | 'wardrobe.items'
  | 'wardrobe.scenes'
  | 'mvu.system'
  | 'mvu.intent'
  | 'mvu.variable.name'
  | 'mvu.variable.type'
  | 'mvu.variable.default'
  | 'mvu.variable.options'
  | 'mvu.variable.note'
  | 'mvu.variable.min'
  | 'mvu.variable.max'
  | 'mvu.variable.aiVisible'
  | 'mvu.variable.readonly'
  | 'ejs.controller'
  | 'ejs.variablePath'
  | 'ejs.fallback'
  | 'ejs.stage.title'
  | 'ejs.stage.condition'
  | 'ejs.stage.entryName'
  | 'ejs.stage.raw'
  | 'frontend.statusTitle'
  | 'frontend.statusVariables'
  | 'frontend.statusStyle'
  | 'frontend.statusNotes'
  | 'beautify.pageTitle'
  | 'beautify.sourceTag'
  | 'beautify.contentType'
  | 'beautify.layout'
  | 'beautify.style'
  | 'beautify.notes';

export interface BabyFieldGuide {
  id: BabyFieldId;
  label: string;
  placeholder: string;
  guide: string;
  kbRefs: string[];
  presetRefs: string[];
}

interface BabyTaskLike {
  id: string;
  title: string;
  summary?: string;
  guardrails?: string[];
  outputs?: string[];
}

interface BuildBabyAssistantPromptParams {
  intent: BabyAssistantIntent;
  fieldId?: string | null;
  task?: BabyTaskLike;
  targetName?: string;
  currentCharacterName?: string | null;
  userNotes?: string;
  currentValue?: string;
  generatedSummary?: string;
}

const roleBaseKbRefs = ['09_角色卡信息', '世界书配置指南'];
const worldviewKbRefs = ['世界书配置指南', '世界观自查', '世界书评估'];
const paletteKbRefs = ['世界书配置指南'];
const wardrobeKbRefs = ['09_角色卡信息', '世界书配置指南'];
const mvuKbRefs = ['MVU_ZOD指南', 'MVU自查', 'MVU前端状态栏自查', '15_工具函数', '16_MVU变量框架'];
const mvuStatusBarKbRefs = ['MVU_ZOD指南', 'MVU前端状态栏自查', '15_工具函数', '16_MVU变量框架'];
const frontendBeautifyKbRefs = ['前端美化自查', '10_宏与正则', '01_消息楼层操作', '15_工具函数'];
const ejsKbRefs = [
  'EJS基础语法',
  'EJS变量与输出',
  'EJS装饰器与注入',
  'EJS多阶段人设',
  'EJS函数速查',
  'EJS调色盘多阶段自查',
  'EJS调色盘多阶段人设',
];

const roleBasePresetRefs = ['📋 角色基础', '世界书配置规则', '📝 输出格式要求'];
const palettePresetRefs = ['📋 性格调色盘', '📝 输出格式要求'];
const mvuPresetRefs = [
  '📋 MVU变量结构脚本',
  '📋 MVU初始变量',
  '📋 MVU变量更新规则',
  '📝 输出格式要求',
];
const ejsPresetRefs = ['📋 EJS', '📋 EJS调色盘多阶段人设', '世界书配置规则', '📝 输出格式要求'];
const frontendBeautifyPresetRefs = ['📋 前端美化', '📝 输出格式要求'];

export const babyTaskKbRefs: Record<string, string[]> = {
  'character.base': roleBaseKbRefs,
  'character.palette': paletteKbRefs,
  'character.wardrobe_prompt': wardrobeKbRefs,
  'worldview.write': worldviewKbRefs,
  'mvu.schema': mvuKbRefs,
  'ejs.stage_palette': ejsKbRefs,
  'frontend.mvu_status_bar': mvuStatusBarKbRefs,
  'frontend.beautify': frontendBeautifyKbRefs,
};

export const babyTaskPresetRefs: Record<string, string[]> = {
  'character.base': roleBasePresetRefs,
  'character.palette': palettePresetRefs,
  'character.wardrobe_prompt': ['📋 衣柜', '世界书配置规则', '📝 输出格式要求'],
  'worldview.write': ['📋 世界观', '世界书配置规则', '📝 输出格式要求'],
  'mvu.schema': mvuPresetRefs,
  'ejs.stage_palette': ejsPresetRefs,
  'frontend.mvu_status_bar': ['📋 MVU前端状态栏', '📝 输出格式要求'],
  'frontend.beautify': frontendBeautifyPresetRefs,
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function defineField(
  id: BabyFieldId,
  label: string,
  placeholder: string,
  guide: string,
  kbRefs: string[],
  presetRefs: string[],
): BabyFieldGuide {
  return { id, label, placeholder, guide, kbRefs, presetRefs };
}

export const babyFieldGuides: Record<BabyFieldId, BabyFieldGuide> = {
  'target.worldbook': defineField(
    'target.worldbook',
    '目标世界书',
    '例：薄雪书店。这里是保存位置，不是角色名。',
    '这里写要保存到哪个世界书。角色名在下面单独写，不要混在一起。',
    ['世界书配置指南'],
    ['世界书配置规则'],
  ),
  'target.character': defineField(
    'target.character',
    '目标角色名',
    '例：秋青子。这里写要安装前端或状态栏的角色卡名称。',
    '前端类内容会写进角色卡局部正则。这里写角色名，不是世界书名。',
    frontendBeautifyKbRefs,
    frontendBeautifyPresetRefs,
  ),
  'notes.freeform': defineField(
    'notes.freeform',
    '临时素材',
    '先贴碎片、想法或参考路径。不用写完整，秋青子会追问缺口。',
    '把暂时不知道放哪的素材先放这里，我会帮你分到正确栏位。',
    ['09_角色卡信息', '世界书配置指南'],
    ['📝 输出格式要求'],
  ),
  'character.name': defineField(
    'character.name',
    '角色姓名',
    '例：林溪。不确定就写“待定”。',
    '写角色被称呼的名字就好。这里不要写身份、性格或关系。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.age': defineField(
    'character.age',
    '年龄',
    '例：22 / 高二 / 外表约二十岁。只写年龄或阶段。',
    '写清楚年龄、阶段或外表年龄。不要把经历塞进这一格。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.gender': defineField(
    'character.gender',
    '性别',
    '例：女 / 男 / 非二元 / 不强调。按你的设定写。',
    '只写设定中需要 AI 知道的性别信息。不需要解释创作理由。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.identity': defineField(
    'character.identity',
    '身份',
    '例：旧书店店主 / 高三转学生。只写社会位置。',
    '写角色在故事里被看见的位置，例如职业、年级、组织身份。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.relation': defineField(
    'character.relation',
    '一句话关系',
    '例：和{{user}}是常来旧书店的旧识。写一句关系。',
    '写角色和 {{user}} 的关系入口，只要一句清楚的话。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.appearance': defineField(
    'character.appearance',
    '外貌识别点',
    '写能一眼认出来的特征，例如左眼下小痣、常戴细框眼镜；不要写“漂亮”。',
    '这里只写可识别的具体特征。不要写万能外貌词，也不要写性格。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.outfit': defineField(
    'character.outfit',
    '穿衣风格',
    '写穿衣风格、偏爱和标志物，例如深绿色针织衫、旧皮鞋。',
    '衣柜现在走精简提示词，只写风格、偏爱、禁忌或标志物。',
    roleBaseKbRefs,
    ['📋 衣柜', '📋 角色基础', '📝 输出格式要求'],
  ),
  'character.marker': defineField(
    'character.marker',
    '标志性细节',
    '例：黄铜书签 / 拨片项链。一个能反复出现的小物件。',
    '写一个容易在互动里反复出现的细节。没有就写“无”。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.background': defineField(
    'character.background',
    '关键背景',
    '只写真正影响角色现在行为的一件事。',
    '背景不是履历表，只写会影响现在选择、习惯或关系的一件事。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.origin': defineField(
    'character.origin',
    '认识过程',
    '写{{user}}和角色第一次怎么认识，不写大纲。',
    '写第一次相遇的具体情况，让关系有入口，不需要剧情大纲。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'character.interaction': defineField(
    'character.interaction',
    '互动方式',
    '写两人平时怎么相处，用具体动作。',
    '这里写可演出来的互动方式，例如谁先开口、常做什么动作。',
    roleBaseKbRefs,
    roleBasePresetRefs,
  ),
  'worldview.seed': defineField(
    'worldview.seed',
    '最初想法',
    '例：我想写现代校园里有一个只有主角能看到的旧图书馆。不会写就先空着去问秋青子。',
    '这里不是正式稿，只放最开始的灵感。世界观可以先聊天，不需要一次写完整。',
    worldviewKbRefs,
    ['📋 世界观', '世界书配置规则', '📝 输出格式要求'],
  ),
  'worldview.final': defineField(
    'worldview.final',
    '世界观整理稿',
    '把秋青子最终整理好的版本贴这里。也可以自己写一版自然语言，不用写代码。',
    '这里放已经聊清楚、准备写进世界书的版本。秋青子只检查结构和边界，不替你决定创意。',
    worldviewKbRefs,
    ['📋 世界观', '世界书配置规则', '📝 输出格式要求'],
  ),
  'worldview.unsure': defineField(
    'worldview.unsure',
    '还不确定的地方',
    '例：城市名字没定；组织到底公开还是秘密还没想好。',
    '把暂时没定的地方单独写出来，秋青子会继续追问，不会直接替你拍板。',
    worldviewKbRefs,
    ['📋 世界观', '世界书配置规则', '📝 输出格式要求'],
  ),
  'palette.kind': defineField(
    'palette.kind',
    '调色盘类型',
    '选择这段手写内容属于哪类：调色盘、混色、三面性、二次解释或NSFW。',
    '先选条目类型。调色盘类不会让 AI 自查创意，只做错字和格式整理。',
    paletteKbRefs,
    palettePresetRefs,
  ),
  'palette.raw': defineField(
    'palette.raw',
    '手写原文',
    '贴用户原文。秋青子只修错字和整理格式，不改创意。',
    '这里是作者原汁原味的人设核心，不能让 AI 判断好坏或代写。',
    paletteKbRefs,
    palettePresetRefs,
  ),
  'palette.note': defineField(
    'palette.note',
    '额外说明',
    '例：希望保留笨拙、脆弱、嘴硬的感觉。',
    '写你最想保留的味道。秋青子会把它当成保护项。',
    paletteKbRefs,
    palettePresetRefs,
  ),
  'wardrobe.daily': defineField(
    'wardrobe.daily',
    '日常常穿',
    '例：深绿色针织衫、宽松长裙、旧皮鞋。写平时最常见的风格。',
    '这里只写常态穿衣风格，不需要写完整衣柜。',
    wardrobeKbRefs,
    ['📋 衣柜', '世界书配置规则', '📝 输出格式要求'],
  ),
  'wardrobe.favorite': defineField(
    'wardrobe.favorite',
    '特别喜欢',
    '例：喜欢玉绿色、细银链、柔软针织；偏爱不显眼但精致的衣服。',
    '写角色会主动偏爱的颜色、材质、剪裁或小配饰。',
    wardrobeKbRefs,
    ['📋 衣柜', '世界书配置规则', '📝 输出格式要求'],
  ),
  'wardrobe.disliked': defineField(
    'wardrobe.disliked',
    '不喜欢或不要出现',
    '例：不穿亮橙色、不喜欢夸张蝴蝶结、不要赛博风。',
    '写禁忌风格可以防止 AI 乱加衣服。没有就留空。',
    wardrobeKbRefs,
    ['📋 衣柜', '世界书配置规则', '📝 输出格式要求'],
  ),
  'wardrobe.items': defineField(
    'wardrobe.items',
    '标志物',
    '例：黄铜书签、墨绿色发带、蛇形耳坠。一个或两个就够。',
    '标志物是反复出现的小物件，不需要堆很多。',
    wardrobeKbRefs,
    ['📋 衣柜', '世界书配置规则', '📝 输出格式要求'],
  ),
  'wardrobe.scenes': defineField(
    'wardrobe.scenes',
    '特殊场景',
    '例：正式见客会戴细框眼镜；下雨天会披深色长外套。',
    '只写必须固定的特殊场景。普通换装不需要提前写死。',
    wardrobeKbRefs,
    ['📋 衣柜', '世界书配置规则', '📝 输出格式要求'],
  ),
  'mvu.system': defineField(
    'mvu.system',
    '变量系统名',
    '例：关系系统 / 状态系统。写这一组变量的名字。',
    '写这一组变量属于什么系统。名字要稳定，后面会自动接到状态栏和多阶段里。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.intent': defineField(
    'mvu.intent',
    '更新意图',
    '例：根据互动更新好感度、信任、当前情绪。',
    '用一句话说明这些变量何时改变，AI 不需要自由发挥规则。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.name': defineField(
    'mvu.variable.name',
    '变量名称',
    '例：好感度 / 当前情绪 / 是否知道秘密。',
    '变量名要短、稳定、能看懂。隐藏变量用开关控制，不用手写前缀。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.type': defineField(
    'mvu.variable.type',
    '变量类型',
    '选“数字”“文字”“是/否”或“固定选项”。不用记英文。',
    '选变量的值类型。宝宝辅食会按类型生成安全模板。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.default': defineField(
    'mvu.variable.default',
    '开局值',
    '例：0 / 平静 / false。写开局时的值。',
    '开局值是第一条消息前的状态，不是以后会变化的范围。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.options': defineField(
    'mvu.variable.options',
    '可选状态',
    '例：陌生，熟悉，亲近。只在“固定选项”变量里填写。',
    '这些是变量允许出现的状态。前端会自动把开局状态也放进去。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.note': defineField(
    'mvu.variable.note',
    '变量用途',
    '例：记录角色对{{user}}的信任变化。',
    '写这个变量为什么存在。不要写复杂更新公式。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.min': defineField(
    'mvu.variable.min',
    '最小值',
    '例：0。只有 number 变量需要填。',
    '数字变量才需要范围。空着表示暂不限制。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.max': defineField(
    'mvu.variable.max',
    '最大值',
    '例：100。只有 number 变量需要填。',
    '数字变量才需要范围。空着表示暂不限制。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.aiVisible': defineField(
    'mvu.variable.aiVisible',
    '发给AI',
    '勾选：AI能看到并更新；取消：作为隐藏变量。',
    '决定变量是否出现在 AI 可见状态里。新手不用写 $ 前缀。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'mvu.variable.readonly': defineField(
    'mvu.variable.readonly',
    '只读',
    '勾选：AI不能主动改。适合固定设定或系统字段。',
    '只读变量用于保护不该被 AI 改写的信息。新手不用写 _ 前缀。',
    mvuKbRefs,
    mvuPresetRefs,
  ),
  'ejs.controller': defineField(
    'ejs.controller',
    '多阶段条目名',
    '例：调色盘多阶段人设。写给自己看的名字即可。',
    '这里先写条目名，位置和代码细节会由工具按多阶段人设规则处理。',
    ejsKbRefs,
    ejsPresetRefs,
  ),
  'ejs.variablePath': defineField(
    'ejs.variablePath',
    '判断阶段用哪个项目',
    '不用手写路径。先完成 MVU 基础变量，然后从下拉框里选一个项目。',
    '用来判断阶段的变量会从 MVU 基础变量里选择，路径由前端自动处理。',
    ejsKbRefs,
    ejsPresetRefs,
  ),
  'ejs.fallback': defineField(
    'ejs.fallback',
    '兜底说明',
    '例：最后一个阶段作为默认兜底。',
    '写条件都没命中时该用哪一段，避免空输出。',
    ejsKbRefs,
    ejsPresetRefs,
  ),
  'ejs.stage.title': defineField(
    'ejs.stage.title',
    '阶段名',
    '例：陌生 / 熟悉 / 依赖。短一点，方便识别。',
    '写阶段的名字，不要把阶段正文放进标题。',
    ejsKbRefs,
    ejsPresetRefs,
  ),
  'ejs.stage.condition': defineField(
    'ejs.stage.condition',
    '触发条件',
    '例：低于30 / 30到70 / 70以上。用大白话写。',
    '写这个阶段什么时候出现。宝宝辅食会自动转换成安全判断。',
    ejsKbRefs,
    ejsPresetRefs,
  ),
  'ejs.stage.entryName': defineField(
    'ejs.stage.entryName',
    '阶段小名',
    '例：陌生阶段。给自己认得出来就行。',
    '这是给前端内部整理用的小名，新手不需要手写代码标识。',
    ejsKbRefs,
    ejsPresetRefs,
  ),
  'ejs.stage.raw': defineField(
    'ejs.stage.raw',
    '阶段手写文字',
    '贴这一阶段的人设原文。秋青子只检查结构，不改创意。',
    '这里仍然是作者手写核心，秋青子只保护格式和结构。',
    ejsKbRefs,
    ejsPresetRefs,
  ),
  'frontend.statusTitle': defineField(
    'frontend.statusTitle',
    '状态栏标题',
    '例：青子的状态 / 关系进度 / 当前状态。短一点，像小面板标题。',
    '这是状态栏显示给读者看的标题，不是变量名。变量会从 MVU 基础变量里勾选。',
    mvuStatusBarKbRefs,
    ['📋 MVU前端状态栏', '📝 输出格式要求'],
  ),
  'frontend.statusVariables': defineField(
    'frontend.statusVariables',
    '要显示的变量',
    '不用手写路径。先完成 MVU 基础变量，然后勾选想显示的项目。',
    '这里决定状态栏显示哪些 MVU 内容。状态栏只读展示，不负责修改变量。',
    mvuStatusBarKbRefs,
    ['📋 MVU前端状态栏', '📝 输出格式要求'],
  ),
  'frontend.statusStyle': defineField(
    'frontend.statusStyle',
    '状态栏风格',
    '例：清透玉绿色、紧凑横条、像秘书便签。写感觉即可。',
    '不用写 CSS。只说你想要的视觉感觉，前端会按安全模板生成。',
    mvuStatusBarKbRefs,
    ['📋 MVU前端状态栏', '📝 输出格式要求'],
  ),
  'frontend.statusNotes': defineField(
    'frontend.statusNotes',
    '额外显示要求',
    '例：手机上不要太高、好感度用进度条、心情用文字。',
    '把你特别在意的显示方式写在这里。没有就留空。',
    mvuStatusBarKbRefs,
    ['📋 MVU前端状态栏', '📝 输出格式要求'],
  ),
  'beautify.pageTitle': defineField(
    'beautify.pageTitle',
    '页面名称',
    '例：正文小卡片 / 角色档案页 / 任务面板。写给读者看的页面名。',
    '这是前端美化页面的名字，不是代码文件名。名字短一点更稳。',
    frontendBeautifyKbRefs,
    frontendBeautifyPresetRefs,
  ),
  'beautify.sourceTag': defineField(
    'beautify.sourceTag',
    '内容标签',
    '例：story / char_status / task_panel。只写英文或下划线。',
    'AI 输出会用这个标签包住要美化的文字，前端会按同一个标签读取。',
    frontendBeautifyKbRefs,
    frontendBeautifyPresetRefs,
  ),
  'beautify.contentType': defineField(
    'beautify.contentType',
    '内容类型',
    '例：普通正文 / 角色资料 / 任务列表 / 论坛帖子。写你要美化的文字类型。',
    '这里帮助秋青子判断是正文美化，还是结构化数据美化。',
    frontendBeautifyKbRefs,
    frontendBeautifyPresetRefs,
  ),
  'beautify.layout': defineField(
    'beautify.layout',
    '页面布局',
    '例：上方标题，中间正文卡片，底部一句备注。',
    '不用画图。把页面从上到下有哪些区域说清楚就好。',
    frontendBeautifyKbRefs,
    frontendBeautifyPresetRefs,
  ),
  'beautify.style': defineField(
    'beautify.style',
    '视觉风格',
    '例：冷淡青绿、纸张质感、少女杂志、游戏菜单。写审美方向。',
    '只写风格词，不用写 CSS。前端会负责排版和检查。',
    frontendBeautifyKbRefs,
    frontendBeautifyPresetRefs,
  ),
  'beautify.notes': defineField(
    'beautify.notes',
    '额外要求',
    '例：不要大面积紫色、手机也要能看、正文不要太挤。',
    '写任何你担心的地方。秋青子会优先保护这些要求。',
    frontendBeautifyKbRefs,
    frontendBeautifyPresetRefs,
  ),
};

export function getBabyFieldGuide(fieldId?: string | null): BabyFieldGuide {
  if (fieldId && fieldId in babyFieldGuides) {
    return babyFieldGuides[fieldId as BabyFieldId];
  }
  return babyFieldGuides['notes.freeform'];
}

export function getBabyTaskKbRefs(taskId?: string | null): string[] {
  return unique(taskId ? babyTaskKbRefs[taskId] ?? [] : []);
}

export function getBabyTaskPresetRefs(taskId?: string | null): string[] {
  return unique(taskId ? babyTaskPresetRefs[taskId] ?? [] : []);
}

export function getBabyAssistantRefs(fieldId?: string | null, taskId?: string | null) {
  const field = getBabyFieldGuide(fieldId);
  return {
    kbRefs: unique([...getBabyTaskKbRefs(taskId), ...field.kbRefs]),
    presetRefs: unique([...getBabyTaskPresetRefs(taskId), ...field.presetRefs]),
  };
}

function intentTitle(intent: BabyAssistantIntent): string {
  switch (intent) {
    case 'example':
      return '给一个安全示例';
    case 'check':
      return '检查当前填写';
    case 'question':
      return '追问一个必要问题';
    default:
      return '解释这个框怎么填';
  }
}

function intentInstruction(intent: BabyAssistantIntent, field: BabyFieldGuide): string {
  switch (intent) {
    case 'example':
      return `请给“${field.label}”一个短示例。示例必须像灰色占位提示一样可直接模仿，但不要代替用户决定核心创意。`;
    case 'check':
      return `请检查“${field.label}”当前填写是否符合结构、格式、教程原则和风险边界。先夸一个具体优点，再指出需要改的地方。`;
    case 'question':
      return `请只问一个最有帮助的问题，帮助作者继续填写“${field.label}”。问题要短，不能一次问一串。`;
    default:
      return `请解释“${field.label}”应该怎么填。要直截了当，让纯新手马上知道下一笔写什么。`;
  }
}

export function buildBabyAssistantPrompt(params: BuildBabyAssistantPromptParams): string {
  const field = getBabyFieldGuide(params.fieldId);
  const task = params.task;
  const refs = getBabyAssistantRefs(field.id, task?.id);
  const targetName = params.targetName?.trim() || params.currentCharacterName || '<还没有填写目标世界书>';
  const userNotes = params.userNotes?.trim() || '<没有临时素材>';
  const currentValue = params.currentValue?.trim() || '<当前框还没填写>';
  const generatedSummary = params.generatedSummary?.trim() || '<前端还没有生成产物>';
  const targetLabel = field.id === 'target.character' || task?.id?.startsWith('frontend.') ? '目标角色' : '目标世界书';

  return [
    '【秋青子宝宝辅食陪写请求】',
    '',
    `本次动作：${intentTitle(params.intent)}`,
    `当前任务：${task?.title ?? '宝宝辅食写卡'}（${task?.id ?? 'unknown'}）`,
    `当前字段：${field.label}`,
    `${targetLabel}：${targetName}`,
    '',
    '必须先读取的资料范围：',
    `- 酒馆世界书：${BABY_KNOWLEDGE_WORLDBOOK}`,
    ...refs.kbRefs.map(ref => `  - ${ref}`),
    '- 当前写卡预设对应条目：',
    ...refs.presetRefs.map(ref => `  - ${ref}`),
    '',
    '读取规则：',
    `- 只能围绕“${BABY_KNOWLEDGE_WORLDBOOK}”这些条目、当前预设条目、当前表单内容回答。`,
    '- 可用时必须先用 WTC/LTC/世界书读取工具读取上述条目，再回答。',
    '- 如果工具读不到知识库或预设条目，请直接说明读不到，不要凭模型记忆硬答。',
    '- 不要引用未列出的世界书、未列出的条目，也不要让新手自己判断配置规则。',
    '',
    '宝宝辅食语气与边界：',
    '- 先夸一个具体点，再温柔指出问题；保持鼓励式辅助。',
    '- 可以可怜兮兮地提醒“骂太凶会哭唧唧”，用来安抚用户，但不要装作已经执行了工具。',
    '- 不能替用户写核心人设创意；只能教、整理、追问、修错字、转格式。',
    '- 调色盘、混色、三面性、二次解释、NSFW调色盘只修错别字和转 YAML，不做 AI 创意自查。',
    '- 基础信息、世界观、MVU、EJS、前端代码类内容正常检查结构、格式、教程原则和风险。',
    '- 回答必须短、直截了当，适合完全新手照着改。',
    '',
    '当前字段灰色提示：',
    field.placeholder,
    '',
    '当前字段说明：',
    field.guide,
    '',
    '用户当前填写：',
    currentValue,
    '',
    '临时素材：',
    userNotes,
    '',
    '前端生成状态：',
    generatedSummary,
    '',
    '请执行：',
    intentInstruction(params.intent, field),
  ].join('\n');
}
