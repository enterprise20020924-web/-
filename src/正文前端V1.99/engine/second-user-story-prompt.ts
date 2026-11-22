import { wrapIdentityPresetRgbNames } from './preset-rgb-names';
import { stripRgbTags } from './rgb-names';

export const SECOND_USER_STORY_LEGACY_PROMPT_IDS = [
  'baipo-second-user-shittim-introduction-v1',
  'baipo-second-user-shittim-introduction-shizuya-v1',
  'baipo-second-user-shittim-introduction-v2',
  'baipo-second-user-shittim-introduction-shizuya-v2',
] as const;
export const SECOND_USER_STORY_SOURCE_MESSAGE_ID = 3;
export const SECOND_USER_SHIZUYA_STORY_NOTE = '（学园里没几个人知道什亭之匣，包括神崎凛）';

export const SECOND_USER_SHIZUYA_STORY_PROMPT = `就在神崎凛递出通行证、准备迈步带着<user>离开校门口的刹那——

“呀吼~视线请往这边看哦~♪”

一道慵懒又欢快的嗓音，突兀地从旁边的行道树下传来。
紧接着，斜倚在树干上的少女漫不经心地抬起手，打了个清脆的响指。

啪。

一瞬间，整个世界被抽干了色彩。
蔚蓝从天幕上流淌殆尽，翠绿自草坪间蒸发消失，视野所及的一切都在眨眼间褪成了黑白相片。

喧闹的师生们连同动作一起被死死定格在了这一秒——不远处一名女生手里的咖啡杯刚刚脱手，泼洒而出的棕褐色液体悬停在半空中，她张大嘴巴，脸上的表情还凝固在惊叫出声的前一瞬；而近在咫尺的神崎凛，也保持着向前迈出一步的姿态纹丝不动。

甚至连树干旁那名少女——响木天音那头本该璀璨似金的及腰长发，此刻也在黑白的世界里敛去了光泽。

她懒洋洋地从树干上直起身子，踩着置身事外的轻快步调，不紧不慢地踱步到<user>面前：

“呼……紧赶慢赶，总算是用最快速度把学生会那堆烦人的公务给清掉啦。放心吧，在这个连风都停下来的领域里，我们的悄悄话不会被任何人听见——来，学妹，前辈我有件超棒的入学礼物要送给你哦~”

话音未落，响木天音手腕一翻，凭空“变”出了一台银色的平板电脑。

对，用“变”这个字绝对没有夸张。因为就在刚才那一秒，她身旁凭空荡开了一圈小小的、宛如金色涟漪般的传送门，紧接着这台平板就这么水灵灵地落在了她掌心里——那架势，简直跟某位喜欢居高临下喊人“杂修”的金闪闪自大狂如出一辙。

直接把<user>的眼睛都看直了。

“锵锵~这孩子的名字叫『什亭之匣』。看到主屏幕上那个同名的蓝色图标了吗？”天音笑眯眯地把平板翻转过来展示给<user>看，竖起一根食指在屏幕前轻轻晃了晃，“只要点开这里，全校所有学生的『性斗』档案就都能随便翻阅了哦——嘛，虽然也有一部分属于『绝密事项』，已经被刻意归档锁起来就是啦~”

“要是学妹脸皮薄，不好意思当面找人发起性斗的话，也可以直接用它在线上发出决斗申请。至于其他林林总总的隐藏功能嘛……以后你慢慢摸索就知道咯。啊，对了，里面已经提前存好了我的私人联络方式，遇到什么摆不平的麻烦，随时欢迎来找前辈我撒娇哦？”

说到这，她忽然微微倾身凑近了些，双手背在身后，笑意盈盈的眼眸里多了几分意味深长的促狭：

“不过呢，『我把这东西交给你』这件事本身，可也是最高级别的归档机密哦？小嘴巴记得要拉好拉链——毕竟啊，以现在学生会对这所学园的掌控力，哪怕哪个男生半夜躲在被窝里对着我的照片偷偷打手冲，我这边都能在第一秒收到警报呢。所以啦，前辈我真的很希望我们能一直和睦相处下去，明白了吗~？”

“哈啊……？！不是，前辈你上来就这么自来熟的吗！而且举例能不能稍微挑一点女高中生能听的词汇啊，你这么一说<user>根本不敢收下这玩意儿了好吧！”<user>嘴角狠狠一抽，终究还是没忍住把吐槽吼了出来。

“诶~有那么夸张吗？”天音无辜地耸了耸肩，不容分说地把平板塞进<user>怀里，“但你换个角度想想看嘛——要是我今天一脸严肃地掏出一沓保密协议逼你按手印，再戴上白手套、像黑手党交接脏物一样郑重其事地把平板递给你，你现在岂不是要慌得报警了？再说了，我又不是什么站在站前十字路口发纸巾的打工妹，哪可能随便抓个路过的新生就塞一台这种宝贝呀。”

她轻巧地退后半步，拍了拍手，原本散漫随意的神情忽然收敛了几分，唇角勾起一抹似笑非笑、却又带着某种宿命意味的弧度：

“——那么，容我以『苍蓝星』之名，正式欢迎你的到来吧。欢迎来到天海学园哦，我的继任者，阿斯特赖亚的二代目勇者——『魔装影姬』酱~”

丢下这句石破天惊的话语，天音干脆利落地转过身去，随手撩了一下垂落腰际的长发。
就在她侧过脸的那一刹那，<user>似乎在她的眼底窥见了一双截然不同的眼睛——那是燃烧着金色焰光的竖窄蛇瞳。尽管在这片时间暂停的世界里无法看到任何色彩，但<user>依然能无比笃定地作出如此断定。

还没等<user>从大脑宕机的震惊中回过神，天音已经背对着这边懒懒地挥了挥手，哼着莫名悲恸的小曲走远了：

“如果都回不来~ 那么我该为了谁而存在~♪”

“等一下！所以前辈，当初你和大家到底遇上了什么——”

<user>下意识地伸出手想要追问，可话才刚喊到“什么”两个字，清脆的响指声便再次于耳畔炸响。

啪！

视野中的响木天音瞬间消失得无影无踪。
下一秒，被抽离的色彩如同决堤的潮水般尽数回归——天空晴朗依旧，草地也恢复了鲜活的翠绿，不远处那杯从咖啡杯里泼出来的液体终于走完了它的轨迹，“啪”地一声砸在地面上。

那个张着嘴巴的女生，也终于把卡在嗓子眼里的那一声悲鸣彻底喊完了：

“——啊啊啊我操！我刚买的咖啡啊！！”

${SECOND_USER_SHIZUYA_STORY_NOTE}`;

export const SECOND_USER_GYARU_STORY_PROMPT = `**“哈，不赖，老娘从小到大，还真没被长着几个臭钱就敢乱汪汪的豆芽菜这么狂过。”**

**<user>双手抱胸，居高临下地盯着维多利亚：**

**“本来想直接赏你一拳长长记性的……可瞅瞅你这风一吹就倒的小身板，我这一拳下去你怕是能额外放个小长假来呢~”**

**“你、你说谁是豆芽菜——？！”**

**眼看迎新大道就要在开学第一天演变成全武行现场，一道轻快又带着几分无奈的嗓音终于插了进来：**

**“好啦好啦~两边都把拳头收一收，大清早的火气这么大，脸上可是要长痘痘的哦？”**

**姗姗来迟的响木天音笑眯眯地拨开人群，熟稔地横插进两人那快要擦出火花的视线中央。**
**她先是转过头，看似温和、实则带着几分警告意味地睨向气得发抖的维多利亚：**

**“差不多得了吧，维多利亚。你是知道我的，我办事可不像神崎委员长那样一板一眼只讲究『公平秩序』——要是在我眼皮子底下闹大了，你应该也不想害得莎拉专门黑着一张脸，亲自来学生会总部领你回去吧？”**

**听到“莎拉”和“学生会总部”这两个词，哪怕嚣张如维多利亚，表情也瞬间僵硬了一瞬，最终只能咬了咬牙，冷哼一声拂袖而去。**

**“呼……总算消停了。走吧走吧，<user>同学，再待下去你可就要被当成大猩猩围观咯~”**

**不等周围看呆的新生们反应过来，响木天音已经自来熟地一把拽住<user>的袖子，带着她拐进了旁边安静的林荫校道。**

**确认甩开了喧闹的人群后，这位金发学姐才夸张地叹了口气，双手合十朝<user>露出一抹苦笑：**

**“嘛嘛，真是抱歉啦，让你入学第一天就撞见这么倒胃口的事情~其实对刚才那帮家伙，我们学生会也很头疼呢。里面不少都是家里手眼通天的大小姐，哪怕想彻底取缔都下不去手。”**

**说着，天音像是想起了什么，随手从随身的制服包里摸出一台银白色的轻薄平板，像发糖果似的塞进了<user>手里：**

**“啊，对了，顺便送你一份入学见面礼吧~这是『天蚀科技』最新研发的次世代个人终端平板——『什亭之匣』。有了这孩子，全校绝大部分学生的档案与特性你都能随时调出来看。顺带还集成了不少妙妙小功能哦，不过具体怎么玩，就交给你自己慢慢探索啦。”**

**两人一路聊着走到了教学楼前的分岔路口。**
**正当准备分别时，走出两步的响木天音忽然停下脚步，转过身回过头来：**

**“哦对了，<user>同学，其实我这边……还有一个小小的私人委托想拜托你呢。”**

**“你应该也对这所学园里男生的现状感到很不爽吧？既然如此，我希望你能亲手教会他们——除了窝囊的『畏缩』和顺从的『妥协』之外，其实还存在着第三条道路。”**

**天音竖起一根食指抵在唇边，促狭地眨了眨眼：**

**“只要不闹出什么真正过分的大乱子，哪怕你想在学校里拉着他们扯旗子拉帮派……我们学生会，也会默契地保持『睁一只眼闭一只眼』的立场哦~？”**

**闻言，手里还拎着那台新平板的<user>先是一愣，随即嘴角高高扬起，露出了今天踏入校门以来最痛快、也最桀骜不驯的笑容：**

**“哦豁？那可真是——正合我意啊！”**`;

const SECOND_USER_CHUUNI_STORY_PROMPT = `“来吧，抓住我的手，我把时间暂停了慢慢讲。”

还没等<user>从强制解体的冲击中回过神来，站在面前的<RGB>响木天音</RGB>便一把拉住了<user>的手腕。
紧接着，她抬起另一只手打了个响指。

一瞬间，整个世界一起被彻底抽干了色彩。
窗棂间洒落的阳光、空气里漂浮的微尘，乃至远处隐约传来的校园喧嚣，都在眨眼间凝固成了死寂的黑白相片——唯有被<RGB>响木天音</RGB>牢牢牵住手的<user>在这片静止的时空里正常呼吸与行动。

确认隔绝了外界的一切视线与声响后，天音竖起一根手指：

“首先，现在的这个社会中有一些魔族是很正常的——比如说，我们那位‘敬爱’的理事长<RGB>阿斯莫德</RGB>夫人，她本人就是魅魔女王哦？你不可能对着一个金字塔顶端本就混着魔族的现有政权，去全盘否定生活在身边的魔族，对吧？”

“所以这方面就稍微忍一忍吧。刚一进校门就闹出太出格的事情，无论是对你，还是对你准备找的那个人来说，可都不是什么好事呢~你只要乖乖听我的安排，在该配合我的地方好好配合我就行了。毕竟，我费尽心思把你弄进这所学园，可不是为了给自己找个到处惹祸的拖油瓶来坏事的。”

话音未落，她身侧的半空中忽然荡开了一圈小小的涟漪。
<RGB>响木天音</RGB>随手往里一探，摸出了一台银白色的轻薄平板——『什亭之匣』，顺手塞进了<user>怀里。

“之后有什么情况，我们就在这个上面单线联系吧。记住，先学会忍耐，至少在明面上先把你自己当成一个随处可见的普通学生。至于今天校门口那场闹剧嘛……我自然会出面帮你全部盖过去的，不过仅此一次，下不为例哦？”

交接完毕，<RGB>响木天音</RGB>轻巧地退后半步，重新抬起右手做好了打响指的准备。

“我再打一次响指后，周围的时间就会恢复流动了。至于出去之后什么该说、什么不该说……我想，我们的侦探小姐心里应该也有本谱吧？”`;

const secondUserStories = new Map([
  ['f_magic_girl', SECOND_USER_SHIZUYA_STORY_PROMPT],
  ['f_gyaru', SECOND_USER_GYARU_STORY_PROMPT],
  ['f_chuuni', SECOND_USER_CHUUNI_STORY_PROMPT],
]);

export function usesSecondUserStoryInput(identityId: string | null | undefined) {
  return secondUserStories.has(identityId ?? '');
}

type StoryInputChatMessage = {
  message_id: number;
  role: string;
  is_hidden?: boolean;
  message?: string;
};

export function resolveSecondUserStoryGenerationMessage(messages: readonly StoryInputChatMessage[]) {
  const visibleMessages = messages.filter(message => message.is_hidden !== true);
  const latestMessage = visibleMessages.at(-1);
  if (latestMessage?.role === 'user' && latestMessage.message_id === SECOND_USER_STORY_SOURCE_MESSAGE_ID) {
    return latestMessage;
  }

  const isEmptyFourthMessagePlaceholder =
    latestMessage?.role === 'assistant' &&
    latestMessage.message_id === SECOND_USER_STORY_SOURCE_MESSAGE_ID + 1 &&
    typeof latestMessage.message === 'string' &&
    latestMessage.message.trim().length === 0;
  if (!isEmptyFourthMessagePlaceholder) {
    return null;
  }

  const sourceUserMessage = visibleMessages.at(-2);
  return sourceUserMessage?.role === 'user' && sourceUserMessage.message_id === SECOND_USER_STORY_SOURCE_MESSAGE_ID
    ? sourceUserMessage
    : null;
}

export function buildSecondUserStoryInput(
  message: string,
  userRoleName: string | null | undefined,
  identityId: string | null | undefined,
) {
  const story = secondUserStories.get(identityId ?? '');
  if (story === undefined) return null;
  const existing =
    /(<amami_opening_instruction\b[^>]*\bscene\s*=\s*["']shittim-introduction["'][^>]*>)([\s\S]*?)(<\/amami_opening_instruction\s*>)/i.exec(
      message,
    );
  if (existing) {
    let body = existing[2];
    if (identityId === 'f_magic_girl' && !stripRgbTags(body).includes(SECOND_USER_SHIZUYA_STORY_NOTE)) {
      body = `${body.trimEnd()}\n\n${SECOND_USER_SHIZUYA_STORY_NOTE}\n`;
    }
    body = wrapIdentityPresetRgbNames(body, identityId, userRoleName);
    if (body === existing[2]) return null;
    const replacement = `${existing[1]}${body}${existing[3]}`;
    return message.replace(existing[0], () => replacement);
  }
  const body = wrapIdentityPresetRgbNames(story, identityId, userRoleName);
  return `${message.trimEnd()}\n\n<amami_opening_instruction scene="shittim-introduction">\n${body}\n</amami_opening_instruction>`;
}
