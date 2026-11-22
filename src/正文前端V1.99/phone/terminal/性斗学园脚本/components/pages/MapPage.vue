<template>
  <div class="map-page">
    <SkylinkModuleHeader
      code="08"
      label="CAMPUS NAVIGATION"
      title="学园导航系统"
      description="切换楼层，定位你的下一个目的地。"
      icon="fas fa-location-crosshairs"
    />
    <!-- 地图控制栏 -->
    <div class="map-controls">
      <div class="control-item">
        <label>楼层:</label>
        <select v-model="currentFloor" class="floor-select">
          <option v-for="floor in availableFloors" :key="floor" :value="floor">
            {{ formatFloor(floor) }}
          </option>
        </select>
      </div>
      <div class="control-item">
        <button class="zoom-btn" :disabled="zoomLevel <= 0.5" @click="zoomOut">
          <i class="fas fa-search-minus"></i>
        </button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button class="zoom-btn" :disabled="zoomLevel >= 2" @click="zoomIn">
          <i class="fas fa-search-plus"></i>
        </button>
      </div>
    </div>

    <!-- 地图容器 -->
    <div
      ref="mapContainerRef"
      class="map-container"
      :class="{ 'is-dragging': isDraggingMap }"
      @pointerdown="startMapDrag"
      @pointermove="dragMap"
      @pointerup="finishMapDrag"
      @pointercancel="finishMapDrag"
    >
      <div class="map-zoom-space" :style="mapZoomSpaceStyle">
        <div class="map-grid" :style="{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }">
          <!-- 绘制地图网格 -->
          <div v-for="(row, y) in gridRows" :key="`row-${y}`" class="map-row">
            <div
              v-for="cell in row"
              :key="`cell-${cell.x}-${cell.y}`"
              class="map-cell"
              :class="getCellClass(cell)"
              :data-x="cell.x"
              :data-y="cell.y"
              @click="selectLocation(cell.x, cell.y)"
            >
              <!-- 显示地点 -->
              <div
                v-if="cell.location && !cell.isEmpty"
                class="location-marker"
                :class="getLocationClass(cell.location)"
                :title="getLocationTooltip(cell.location)"
              >
                <i :class="getLocationIcon(cell.location)"></i>
                <div class="location-label">{{ cell.location.伪装 || cell.location.真实 }}</div>
              </div>

              <!-- 显示坐标（仅当是玩家位置但没有地点时） -->
              <div v-if="!cell.location && cell.isPlayerPosition && !cell.isEmpty" class="cell-coord">
                [{{ cell.x }}-{{ cell.y }}]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 地点详情面板 -->
    <div v-if="selectedLocation" class="location-detail">
      <div class="detail-header">
        <h3>{{ selectedLocation.伪装 || selectedLocation.真实 }}</h3>
        <button class="close-detail" @click="selectedLocation = null">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="detail-content">
        <div class="detail-item">
          <span class="detail-label">地点名称:</span>
          <span class="detail-value">{{ selectedLocation.真实 || selectedLocation.伪装 }}</span>
        </div>
        <div v-if="selectedLocation.伪装 && selectedLocation.真实" class="detail-item">
          <span class="detail-label">伪装名称:</span>
          <span class="detail-value">{{ selectedLocation.伪装 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">位置:</span>
          <span class="detail-value">{{ formatLocationPosition(selectedLocation) }}</span>
        </div>
        <div v-if="selectedLocation.所属势力" class="detail-item">
          <span class="detail-label">所属势力:</span>
          <span class="detail-value">{{ selectedLocation.所属势力 }}</span>
        </div>
        <div class="detail-item detail-description">
          <span class="detail-label">介绍:</span>
          <span class="detail-value">{{ getLocationDescription(selectedLocation) }}</span>
        </div>
      </div>
    </div>

    <!-- 当前位置标记 -->
    <div v-if="currentLocation" class="current-location">
      <i class="fas fa-map-marker-alt"></i>
      <span>当前位置: {{ currentLocation.地点名称 || '未知' }} {{ currentLocation.坐标 || '' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkylinkModuleHeader from '../../../shared/SkylinkModuleHeader.vue';
import { computed, onMounted, ref } from 'vue';

const props = defineProps<{
  characterData: any;
}>();

// 地图数据
const mapLocations = [
  { 坐标: '[0-0]', 伪装: '第七教学楼', 真实: 'D/C班基础教室', 所属势力: '学园公共' },
  { 坐标: '[0-0](2F)', 伪装: '第七教学楼二层', 真实: 'A/B班进阶教室', 所属势力: '学园公共' },
  { 坐标: '[0-1]', 伪装: '园艺社活动室', 真实: '研究会-特殊植物栽培区', 所属势力: '研究会' },
  { 坐标: '[0-2]', 伪装: '废弃仓库', 真实: '男性自保联盟秘密集会点', 所属势力: '男性自保联盟' },
  { 坐标: '[0-3]', 伪装: '第一体育馆', 真实: '体育联盟-综合训练场', 所属势力: '体育联盟' },
  { 坐标: '[0-4]', 伪装: '室内游泳馆', 真实: '体育联盟-游泳部', 所属势力: '体育联盟' },
  { 坐标: '[0-4](2F)', 伪装: '体育馆天台', 真实: '天台训练场', 所属势力: '体育联盟' },
  { 坐标: '[0-5]', 伪装: '国际交流会馆A栋', 真实: '外校临时居住地A', 所属势力: '学园公共' },
  { 坐标: '[1-0]', 伪装: '钟楼', 真实: '权力之塔-瞭望塔', 所属势力: '学生会' },
  { 坐标: '[1-1]', 伪装: '中央行政楼', 真实: '权力之塔-学生会总部', 所属势力: '学生会' },
  { 坐标: '[1-1](3F)', 伪装: '院长办公室', 真实: '伊甸阿斯莫德的办公室', 所属势力: '学院高层' },
  { 坐标: '[1-1](4F)', 伪装: '天文台', 真实: '学生会最高监控中心', 所属势力: '学生会' },
  { 坐标: '[1-2]', 伪装: '中央广场', 真实: '中心广场', 所属势力: '学园公共' },
  { 坐标: '[1-3]', 伪装: '商业街', 真实: '综合商业街', 所属势力: '学园公共' },
  { 坐标: '[1-4]', 伪装: '健身中心', 真实: '体育联盟-器械训练部', 所属势力: '体育联盟' },
  { 坐标: '[1-5]', 伪装: '武道馆', 真实: '体育联盟-武术部', 所属势力: '体育联盟' },
  { 坐标: '[2-0]', 伪装: '空置社团活动室', 真实: '未分配的社团房间A', 所属势力: '无' },
  { 坐标: '[2-1](2F)', 伪装: 'S班特别教室', 真实: '爱丽丝温特的特别辅导室', 所属势力: '学生会' },
  { 坐标: '[2-2]', 伪装: '知识圣殿-研究会总部', 真实: '博览图书馆', 所属势力: '研究会' },
  { 坐标: '[2-3]', 伪装: '高级茶道俱乐部', 真实: '静心茶室 (美咲绫的私人领地)', 所属势力: '独立势力' },
  { 坐标: '[2-4](-1F)', 伪装: '地下管网维护通道', 真实: '地下联盟-秘密通道', 所属势力: '地下联盟' },
  { 坐标: '[2-5](-1F)', 伪装: '地下锅炉房', 真实: '地下联盟黑市入口', 所属势力: '地下联盟' },
  { 坐标: '[3-0]', 伪装: '学院正门', 真实: '学院正门', 所属势力: '学园公共' },
  { 坐标: '[3-1]', 伪装: '学生宿舍A栋 (女生)', 真实: '学生宿舍A栋', 所属势力: '学园公共' },
  { 坐标: '[3-2]', 伪装: '中央食堂', 真实: '餐厅', 所属势力: '学园公共' },
  { 坐标: '[3-3]', 伪装: '艺术与设计中心', 真实: '蝶变之所-雌堕会总部', 所属势力: '雌堕会' },
  { 坐标: '[3-4]', 伪装: '高级家政实习教室', 真实: '女王宫殿-女权协会总部', 所属势力: '女权协会' },
  { 坐标: '[3-5]', 伪装: '女生会馆', 真实: '女王宫殿-女权协会生活区', 所属势力: '女权协会' },
  { 坐标: '[4-0]', 伪装: '国际交流会馆B栋', 真实: '外校临时居住地B', 所属势力: '学园公共' },
  { 坐标: '[4-1]', 伪装: '学生宿舍B栋 (男女混住)', 真实: '学生宿舍B栋', 所属势力: '学园公共' },
  { 坐标: '[4-2](-1F)', 伪装: '宿舍地下洗衣房', 真实: '快感研究所-BF社总部', 所属势力: 'BF社' },
  { 坐标: '[4-2](-2F)', 伪装: '废弃储藏室', 真实: '快感研究所-BF社高危实验区', 所属势力: 'BF社' },
  { 坐标: '[4-3](-1F)', 伪装: '废弃防空洞', 真实: '蝶变之所-雌堕会改造实验室', 所属势力: '雌堕会' },
  { 坐标: '[4-4]', 伪装: '学院大礼堂', 真实: '欲望竞技场', 所属势力: '学园公共' },
  { 坐标: '[4-5]', 伪装: '后台准备区', 真实: '欲望竞技场', 所属势力: '学园公共' },
  { 坐标: '[5-0]', 伪装: '学院后山小径', 真实: '学院后山', 所属势力: '学园公共' },
  { 坐标: '[5-1]', 伪装: '湖边凉亭', 真实: '中心湖', 所属势力: '学园公共' },
  { 坐标: '[5-2](1F)', 真实: '综合服务大厅', 所属势力: '学园公共' },
  { 坐标: '[5-2](3F)', 伪装: '学院医务室', 真实: '学校医院', 所属势力: '学园公共' },
  { 坐标: '[5-2](2F)', 伪装: '特殊心理咨询室', 真实: '学生综合服务中心', 所属势力: '学园公共' },
  { 坐标: '[5-3]', 伪装: '教职工宿舍', 真实: '教职工宿舍', 所属势力: '学园公共' },
  { 坐标: '[5-3](2F)', 真实: 'S/A班教师办公室', 所属势力: '学园公共' },
  { 坐标: '[5-3](3F)', 真实: 'B/C/D班教师办公室', 所属势力: '学园公共' },
  { 坐标: '[5-4]', 伪装: '停车场', 真实: '地下黑市-跳蚤市场', 所属势力: '学园公共' },
  { 坐标: '[5-5]', 伪装: '空置社团活动室', 真实: '未分配的社团房间B', 所属势力: '无' },
  { 坐标: '[-1-2]', 真实: '后山入口', 所属势力: '学园公共' },
  {
    坐标: '[-1-3]',
    伪装: '废弃神社',
    真实: '风音与铃音的神社',
    所属势力: '独立势力',
    介绍: '位于后山深处的旧神社，是风音与铃音守护封印回廊的地上据点。这里似乎散发着不详的气息...',
  },
  {
    坐标: '[-1-3](-1F)',
    真实: 'B1·黄泉墓道',
    所属势力: '独立势力(霜凝/无常)',
    介绍: '神社本殿后方石阶通往的黄泉墓道。这里阴冷潮湿，石壁刻满褪色符咒，铜铃与纸钱灰烬指向更深处的石棺回廊和无常殿。',
  },
  {
    坐标: '[-2-5](-1F)',
    真实: 'B1·墓道入口·符咒长廊',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '从废弃神社本殿后方石阶进入的墓道入口。符咒残光与铜铃声标记着第一层的起点，也是阴气最浅、最适合整队的位置。',
  },
  {
    坐标: '[-1-4](-1F)',
    真实: 'B1·石棺回廊',
    所属势力: '独立势力(霜凝)',
    介绍: '石棺嵌入两侧墙壁的墓道回廊，棺盖与符纸都已松动。这里容易触发石棺异动，也藏着霜凝记忆碎片与镇魂类奖励线索。',
  },
  {
    坐标: '[0-3](-1F)',
    真实: 'B1·祭坛',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '残存道教法阵与供台所在的中继区域，仍保留少量封印残响。适合进行短暂净化、检查封印碎片，并判断后续墓道阴气走向。',
  },
  {
    坐标: '[0-2](-1F)',
    真实: 'B1·黄泉甬道',
    所属势力: '独立势力(无常)',
    介绍: '阴气最浓的狭长甬道，铜铃声会在深处反复回响。跟随铃声可能避开小怪，也可能被引向更危险的无常殿。',
  },
  {
    坐标: '[1-2](-1F)',
    真实: 'B1·无常殿',
    所属势力: '独立势力(无常)',
    介绍: '黑白石像与阴阳法阵构成的第一层核心战斗区。完成无常战后，风音需要在此保护窗口内维持净化仪式。',
  },
  {
    坐标: '[1-1](-1F)',
    真实: 'B1·净化点',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '第一层的临时安全区，风音结界能暂时抵消阴气侵体。适合整理战利品、恢复状态，并记录B1净化进度。',
  },
  {
    坐标: '[-1-3](-2F)',
    真实: 'B2·哥特回廊',
    所属势力: '独立势力(希思)',
    介绍: '由黑色大理石、尖拱穹顶和彩窗回廊构成的地下教堂群落。暗紫烛火、管风琴声与实体黑暗共同构成暗夜诅咒区域。',
  },
  {
    坐标: '[-2-5](-2F)',
    真实: 'B2·哥特门厅',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '黑色大理石和尖拱穹顶构成的地下教堂入口。管风琴共鸣与倒五芒星法阵都可能指向隐藏暗室。',
  },
  {
    坐标: '[-1-4](-2F)',
    真实: 'B2·彩窗回廊',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '被篡改的彩色玻璃窗沿墙延伸，圣人面孔变成魔物剪影。彩窗偶尔会恢复原貌，提供后续楼层或Boss弱点的预兆。',
  },
  {
    坐标: '[0-3](-2F)',
    真实: 'B2·地下墓穴',
    所属势力: '独立势力(希思)',
    介绍: '墓穴区的黑暗更厚，狼嚎与血蔷薇气味会引导遭遇。这里适合安置墓穴系小怪与暗夜诅咒相关陷阱。',
  },
  {
    坐标: '[0-2](-2F)',
    真实: 'B2·告解室',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '第二层少数可短暂停靠的房间，隔间另一侧会传来询问罪名的低语。回答方式会影响意志、魅力或本次净化效果。',
  },
  {
    坐标: '[1-2](-2F)',
    真实: 'B2·血月大教堂',
    所属势力: '独立势力(希思)',
    介绍: '第二层核心大Boss区域，血月光影、祭坛和高背椅构成最终战场。击败希思后可在此搜索收藏与净化仪式线索。',
  },
  {
    坐标: '[1-1](-2F)',
    真实: 'B2·净化点',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '大教堂净化仪式的防守节点。风音需要稳定吟唱，队伍则负责挡住残余魔物与暗夜诅咒的干扰。',
  },
  {
    坐标: '[-1-3](-3F)',
    真实: 'B3·妖樱幽谷',
    所属势力: '独立势力(玉藻前)',
    介绍: '地下深处展开的不真实妖樱幽谷。永恒盛开的樱花、朱红鸟居、石灯笼与雾气构成幻境，玉藻前的影响笼罩此层。',
  },
  {
    坐标: '[-2-5](-3F)',
    真实: 'B3·红叶神社',
    所属势力: '独立势力(鬼巫女椿)',
    介绍: '妖樱幽谷中的日式神社安全节点，红叶、注连绳与结界共同隔开妖气。这里承载椿的过往信件与风音相关剧情。',
  },
  {
    坐标: '[-1-4](-3F)',
    真实: 'B3·樱花参道',
    所属势力: '独立势力(玉藻前)',
    介绍: '粉色花雾覆盖的参道路段，美景本身就是诱导陷阱。雪女伪装、沉醉花瓣与狐火引路事件常在此发生。',
  },
  {
    坐标: '[0-3](-3F)',
    真实: 'B3·竹林迷宫',
    所属势力: '独立势力(络新妇)',
    介绍: '黑竹与蛛丝交错的迷宫区域，视野会被竹影切碎，路线也会随妖力改变。铃音灵视可追踪歌声并定位络新妇巢穴。',
  },
  {
    坐标: '[0-2](-3F)',
    真实: 'B3·狐火温泉',
    所属势力: '独立势力(玉藻前)',
    介绍: '水面映出九尾狐倒影的温泉区域，能提供短暂休整，也可能赋予「九尾的注视」这类有利有弊的临时状态。',
  },
  {
    坐标: '[1-2](-3F)',
    真实: 'B3·九尾殿',
    所属势力: '独立势力(玉藻前)',
    介绍: '妖樱幽谷最深处的宫殿，金色榻榻米、狐火与香气组成玉藻前的主场。这里是第三层大Boss战与宝库线索所在地。',
  },
  {
    坐标: '[1-1](-3F)',
    真实: 'B3·净化点',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '第三层净化与整队节点，可暂时压低催情花粉的影响。适合处理B3持续敏感、幻境与同化类残留状态。',
  },
  {
    坐标: '[-1-3](-4F)',
    真实: 'B4·腐蚀花园',
    所属势力: '独立势力(八尺夫人)',
    介绍: '被堕落之力侵蚀的腐蚀花园，石像回廊、暗精灵森林、堕落圣堂与母胎深渊彼此相连，是封印核心前的最后防线。',
  },
  {
    坐标: '[-2-5](-4F)',
    真实: 'B4·腐蚀花门',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '进入腐蚀花园的黑暗花门，藤蔓与花瓣已经被堕落之力侵染。入口处最容易触发藤蔓缠绕与堕落侵蚀判定。',
  },
  {
    坐标: '[-1-4](-4F)',
    真实: 'B4·石像回廊',
    所属势力: '独立势力(石像鬼娘)',
    介绍: '两侧排列着姿态异常逼真的石像，其中部分会在凝视或触碰时苏醒。石像邀请与欲望幻象陷阱集中在此处。',
  },
  {
    坐标: '[0-3](-4F)',
    真实: 'B4·暗精灵森林',
    所属势力: '独立势力(暗精灵娘)',
    介绍: '被污染果实与黑暗枝叶覆盖的森林区域。发光果实可能恢复状态，也可能带来敏感与堕落相关代价。',
  },
  {
    坐标: '[0-2](-4F)',
    真实: 'B4·堕落圣堂',
    所属势力: '独立势力(克洛伊)',
    介绍: '描绘克洛伊堕落过程的壁画圣堂，也是第四层小Boss线的重要区域。观看壁画可获得战斗情报，但会付出精神污染代价。',
  },
  {
    坐标: '[1-2](-4F)',
    真实: 'B4·母胎深渊',
    所属势力: '独立势力(八尺夫人)',
    介绍: '万魔之母气息最浓的深渊入口，母性呼唤会强制牵引意志薄弱者。这里是八尺夫人的主战场，也是通往B5前的最后压迫区。',
  },
  {
    坐标: '[1-1](-4F)',
    真实: 'B4·堕落喷泉',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '水面倒影会显露异常的喷泉节点。完成第四层净化后，这里既是奖励与整备点，也会成为坠入封印核心前的路线标记。',
  },
  {
    坐标: '[2-1](-4F)',
    真实: 'B4·净化点',
    所属势力: '独立势力(风音与铃音管辖)',
    介绍: '腐蚀花园的净化法阵中心。完成仪式可压制本层堕落侵蚀，并解锁进入封印核心前的最终准备窗口。',
  },
  {
    坐标: '[-1-3](-5F)',
    真实: 'B5·混沌神殿',
    所属势力: '独立势力(万魔之母)',
    介绍: '封印回廊最深处的混沌神殿，也是五层封印结界的核心。空间法则异常，所有路线最终都会收束到这处核心区域。',
  },
  {
    坐标: '[-2-4](-5F)',
    真实: 'B5·胎膜入口',
    所属势力: '独立势力(万魔之母)',
    介绍: '从B4深处坠落后抵达的封印核心入口，地面像半透明胎膜般起伏。进入这里会立刻面对混沌侵蚀与铃音相关强制事件。',
  },
  {
    坐标: '[0-3](-5F)',
    真实: 'B5·蜕变回廊',
    所属势力: '独立势力(万魔之母)',
    介绍: '连接入口与核心的生物甬道，脉动墙壁、腔室与残魂构成最终战前的精神压力区。灵樱相关战斗与唤醒机制在此展开。',
  },
  {
    坐标: '[1-2](-5F)',
    真实: 'B5·万魔子宫',
    所属势力: '独立势力(万魔之母)',
    介绍: '混沌神殿最深处的最终Boss场地，万魔之母沉睡于巨大肉茧中。击败后需要保护风音完成最终净化仪式。',
  },
  { 坐标: '[-2-1]', 真实: '后山温泉', 所属势力: '体育联盟' },
  { 坐标: '[-2-4]', 伪装: '秘密训练场', 真实: '地下联盟的野外交易点', 所属势力: '地下联盟' },
  {
    坐标: '[6-2]',
    真实: '沙滩排球场与码头',
    所属势力: '学园公共',
    介绍: '学院北部海滩最北端的硬实沙地，兼具沙滩排球主战场与通往潮音岛的渡船码头功能，是碧波湾竞技与启程的门户。',
  },
  {
    坐标: '[6-3]',
    真实: '帐篷区',
    所属势力: '学园公共',
    介绍: '学院北部海滩中段的度假帐篷群，白日供日光浴后歇脚，入夜则有篝火与烤海鲜，也是救生员高台所在。',
  },
  {
    坐标: '[6-4]',
    真实: '椰林商住带',
    所属势力: '学园公共',
    介绍: '学院北部海滩西侧棕榈成荫的商住地带，包含海之家租赁店与椰林小径，承担泳装浮具、小食冷饮与休憩补给。',
  },
  {
    坐标: '[6-5]',
    真实: '海滨连廊',
    所属势力: '学园公共',
    介绍: '连接学院北部海滩与公共海滩的滨海过渡带，设有休憩长廊、小食亭与月光温泉，是黄昏泡汤与偶遇的核心场景。',
  },
  {
    坐标: '[7-3]',
    真实: '浅海戏水区',
    所属势力: '学园公共',
    介绍: '公共海滩最靠岸的浅水亲水带，水浅浪缓、清澈见底，是打水仗、戏水嬉闹与黄昏亲水的黄金地带。',
  },
  {
    坐标: '[7-4]',
    真实: '漂浮平台',
    所属势力: '学园公共',
    介绍: '公共海滩水域中央随波摇晃的大型木质浮台，需泅水或划船抵达，是水中非正式性斗的公开擂台。',
  },
  {
    坐标: '[7-5]',
    真实: '深海远眺水线',
    所属势力: '学园公共',
    介绍: '公共海滩最外侧、与深海相接的清冷远眺水线，水色由浅骤深，适合黄昏独处、私密戏水与眺望远方异蓝。',
  },
  {
    坐标: '[6-7]',
    真实: '夕阳岬灯塔',
    所属势力: '学园公共',
    介绍: '矗立于碧波湾东南海岬尖端的白色灯塔，可俯瞰落日沉海，是度假村告白与观海的情感高点。',
  },
  {
    坐标: '[8-6]',
    真实: '潮音岛东岸海滩',
    所属势力: '独立势力',
    介绍: '潮音岛东岸与深海直接相接的原始海滩，包含礁石浴场、海蚀洞穴与深海交界水线，是登岛戏水、魔物娘浮现与龙女降临的舞台。',
  },
  {
    坐标: '[8-7]',
    真实: '太阳部落聚落',
    所属势力: '独立势力',
    介绍: '潮音岛腹地太阳部落世代栖居的原始聚落，含篝火广场、原始集市、图腾祭坛与密林禁地，夜间会展开篝火狂欢。',
  },
  {
    坐标: '[8-8]',
    真实: '潮音岛营地',
    所属势力: '学园公共',
    介绍: '潮音岛北隅学生扎起的帐篷营地，篝火与炊烟升腾其间，是登岛安顿、围坐夜谈与抵御魔物娘后的休整据点。',
  },
  {
    坐标: '[9-7]',
    真实: '珊瑚回廊区',
    所属势力: '独立势力',
    介绍: '龙宫·海渊殿通往玉座的斑斓珊瑚长廊，包含珊瑚回廊、海渊秘藏宝库与龙宫秘境，是持鳞觐见、探宝及秘境竞逐魁首的战场。',
  },
  {
    坐标: '[9-8]',
    真实: '玉座之间',
    所属势力: '独立势力',
    介绍: '龙宫·海渊殿最深处、龙君庄方宜端坐俯瞰群臣的至高殿堂，包含龙渊双修池，是交涉、招亲决战与誓约双修的终极舞台。',
  },
];

// 解析坐标
function parseCoordinate(coord: string): { x: number; y: number; floor: number } | null {
  // 匹配格式: [X-Y] 或 [X-Y](楼层F) 或 [X-Y](-楼层F)
  // 先匹配坐标部分
  const coordMatch = coord.match(/\[(-?\d+)-(-?\d+)\]/);
  if (!coordMatch) return null;

  const x = parseInt(coordMatch[1]);
  const y = parseInt(coordMatch[2]);

  // 再匹配楼层部分（支持正负楼层）
  let floor = 1; // 默认1楼
  const floorMatch = coord.match(/\((-?\d+)F\)/);
  if (floorMatch) {
    floor = parseInt(floorMatch[1]);
  }

  return { x, y, floor };
}

// 地图范围
const minX = -2;
const maxX = 9;
const minY = -1;
const maxY = 8;

const CELL_SIZE = 80;
const MAP_DRAG_THRESHOLD = 4;
const currentFloor = ref(1);
const zoomLevel = ref(0.8);
const selectedLocation = ref<any>(null);
const mapContainerRef = ref<HTMLElement | null>(null);
const isDraggingMap = ref(false);
const suppressNextMapClick = ref(false);

type MapDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startCellX: number | null;
  startCellY: number | null;
  originScrollLeft: number;
  originScrollTop: number;
  moved: boolean;
} | null;

const mapDragState = ref<MapDragState>(null);

const mapZoomSpaceStyle = computed(() => ({
  width: `${(maxX - minX + 1) * CELL_SIZE * zoomLevel.value}px`,
  height: `${(maxY - minY + 1) * CELL_SIZE * zoomLevel.value}px`,
}));

// 当前玩家位置
const currentLocation = computed(() => {
  return props.characterData.位置系统 || null;
});

// 可用楼层列表
const availableFloors = computed(() => {
  const floors = new Set<number>();
  floors.add(1); // 默认1楼

  mapLocations.forEach(loc => {
    const parsed = parseCoordinate(loc.坐标);
    if (parsed) {
      floors.add(parsed.floor);
    }
  });

  return Array.from(floors).sort((a, b) => {
    const aIsAboveGround = a > 0;
    const bIsAboveGround = b > 0;
    if (aIsAboveGround && bIsAboveGround) return b - a;
    if (aIsAboveGround) return -1;
    if (bIsAboveGround) return 1;
    return b - a;
  });
});

// 格式化楼层显示
function formatFloor(floor: number): string {
  if (floor === 1) return '1F';
  if (floor > 1) return `${floor}F`;
  return `B${Math.abs(floor)}F`;
}

function formatLocationPosition(location: any): string {
  const parsed = parseCoordinate(location.坐标 || '');
  if (!parsed) return location.坐标 || '未知';
  return `${formatFloor(parsed.floor)} · [${parsed.x}-${parsed.y}]`;
}

function getLocationDescription(location: any): string {
  if (location.介绍) return location.介绍;

  const displayName = location.真实 || location.伪装 || '该地点';
  const faction = location.所属势力 && location.所属势力 !== '无' ? `，当前归属${location.所属势力}` : '';
  const disguise =
    location.伪装 && location.真实 ? `表面上是「${location.伪装}」，真实用途为「${location.真实}」。` : '';
  return `${disguise || `「${displayName}」是学园地图中的可访问地点。`}可在此查看位置与势力信息${faction}。`;
}

// 获取当前楼层的地点
const currentFloorLocations = computed(() => {
  return mapLocations.filter(loc => {
    const parsed = parseCoordinate(loc.坐标);
    return parsed && parsed.floor === currentFloor.value;
  });
});

// 创建网格 - 保持完整网格结构，但空单元格不显示边框
const gridRows = computed(() => {
  // 先收集所有有地点的坐标
  const locationMap = new Map<string, any>();

  currentFloorLocations.value.forEach(loc => {
    const parsed = parseCoordinate(loc.坐标);
    if (parsed) {
      const key = `${parsed.x},${parsed.y}`;
      locationMap.set(key, loc);
    }
  });

  // 检查玩家当前位置
  let playerCoord: { x: number; y: number } | null = null;
  if (currentLocation.value) {
    const currentCoord = parseCoordinate(currentLocation.value.坐标 || '');
    if (currentCoord && currentCoord.floor === currentFloor.value) {
      playerCoord = { x: currentCoord.x, y: currentCoord.y };
      const key = `${currentCoord.x},${currentCoord.y}`;
      // 如果当前位置没有地点，也标记出来
      if (!locationMap.has(key)) {
        locationMap.set(key, null);
      }
    }
  }

  // 创建完整网格，保持所有位置
  const rows: any[][] = [];

  for (let y = maxY; y >= minY; y--) {
    const row: any[] = [];
    for (let x = minX; x <= maxX; x++) {
      const key = `${x},${y}`;
      const location = locationMap.get(key);
      const isPlayerPosition = playerCoord && playerCoord.x === x && playerCoord.y === y;

      // 所有单元格都添加，但空单元格会有特殊标记
      row.push({
        x,
        y,
        location: location || null,
        isPlayerPosition: isPlayerPosition || false,
        isEmpty: location === undefined && !isPlayerPosition,
      });
    }
    rows.push(row);
  }

  return rows;
});

// 获取单元格样式类（现在通过 cell 对象传递）
function getCellClass(cell: any): string {
  const classes: string[] = [];

  // 如果是空单元格，添加特殊标记
  if (cell.isEmpty) {
    classes.push('empty-cell');
    return classes.join(' ');
  }

  // 检查是否是当前玩家位置
  if (cell.isPlayerPosition) {
    classes.push('current-position');
  }

  // 检查是否有地点
  if (cell.location) {
    classes.push('has-location');
  }

  return classes.join(' ');
}

// 获取地点图标
function normalizeFaction(faction: string): string {
  if (faction.startsWith('独立势力')) return '独立势力';
  return faction;
}

function getLocationIcon(location: any): string {
  const faction = normalizeFaction(location.所属势力 || '');
  const iconMap: Record<string, string> = {
    学生会: 'fas fa-crown',
    女权协会: 'fas fa-venus',
    BF社: 'fas fa-flask',
    体育联盟: 'fas fa-dumbbell',
    研究会: 'fas fa-book',
    地下联盟: 'fas fa-mask',
    男性自保联盟: 'fas fa-shield-alt',
    雌堕会: 'fas fa-feather', // 使用羽毛图标
    学园公共: 'fas fa-building',
    独立势力: 'fas fa-star',
    学院高层: 'fas fa-gem',
    无: 'fas fa-question',
  };
  return iconMap[faction] || 'fas fa-map-marker-alt';
}

// 获取地点样式类
function getLocationClass(location: any): string {
  const faction = normalizeFaction(location.所属势力 || '');
  const classMap: Record<string, string> = {
    学生会: 'faction-student-council',
    女权协会: 'faction-feminist',
    BF社: 'faction-bf',
    体育联盟: 'faction-sports',
    研究会: 'faction-research',
    地下联盟: 'faction-underground',
    男性自保联盟: 'faction-male-alliance',
    雌堕会: 'faction-femdom',
    学园公共: 'faction-public',
    独立势力: 'faction-independent',
    学院高层: 'faction-admin',
    无: 'faction-none',
  };
  return classMap[faction] || 'faction-default';
}

// 获取地点提示
function getLocationTooltip(location: any): string {
  const parts: string[] = [];
  if (location.伪装) parts.push(`伪装: ${location.伪装}`);
  if (location.真实) parts.push(`真实: ${location.真实}`);
  if (location.所属势力) parts.push(`势力: ${location.所属势力}`);
  return parts.join('\n');
}

// 选择地点
function selectLocation(x: number, y: number) {
  if (suppressNextMapClick.value) {
    suppressNextMapClick.value = false;
    return;
  }

  const location = currentFloorLocations.value.find(loc => {
    const parsed = parseCoordinate(loc.坐标);
    return parsed && parsed.x === x && parsed.y === y;
  });

  selectedLocation.value = location || null;
}

function startMapDrag(event: PointerEvent) {
  if (event.button !== 0) return;

  const container = mapContainerRef.value;
  if (!container) return;

  const targetCell = (event.target as HTMLElement | null)?.closest<HTMLElement>('.map-cell');

  mapDragState.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startCellX: targetCell?.dataset.x ? Number(targetCell.dataset.x) : null,
    startCellY: targetCell?.dataset.y ? Number(targetCell.dataset.y) : null,
    originScrollLeft: container.scrollLeft,
    originScrollTop: container.scrollTop,
    moved: false,
  };
  isDraggingMap.value = false;

  try {
    container.setPointerCapture(event.pointerId);
  } catch {
    // 内嵌 WebView 可能不完整支持 pointer capture，容器内拖动仍可工作。
  }
}

function dragMap(event: PointerEvent) {
  const state = mapDragState.value;
  const container = mapContainerRef.value;
  if (!state || !container || state.pointerId !== event.pointerId) return;

  const dx = event.clientX - state.startX;
  const dy = event.clientY - state.startY;
  if (!state.moved && Math.abs(dx) + Math.abs(dy) > MAP_DRAG_THRESHOLD) {
    state.moved = true;
    isDraggingMap.value = true;
  }

  if (!state.moved) return;

  event.preventDefault();
  container.scrollLeft = state.originScrollLeft - dx;
  container.scrollTop = state.originScrollTop - dy;
}

function finishMapDrag(event: PointerEvent) {
  const state = mapDragState.value;
  const container = mapContainerRef.value;
  if (!state || state.pointerId !== event.pointerId) return;

  try {
    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  } catch {
    // 忽略部分 WebView 的释放失败。
  }

  const didMove = state.moved;
  mapDragState.value = null;
  isDraggingMap.value = false;

  if (!didMove && state.startCellX !== null && state.startCellY !== null) {
    selectLocation(state.startCellX, state.startCellY);
    return;
  }

  if (didMove) {
    suppressNextMapClick.value = true;
    window.setTimeout(() => {
      suppressNextMapClick.value = false;
    }, 0);
  }
}

// 缩放控制
function zoomIn() {
  if (zoomLevel.value < 2) {
    zoomLevel.value = Math.min(2, zoomLevel.value + 0.1);
  }
}

function zoomOut() {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.1);
  }
}

// 初始化：根据玩家当前位置设置楼层
onMounted(() => {
  if (currentLocation.value) {
    const parsed = parseCoordinate(currentLocation.value.坐标 || '');
    if (parsed) {
      currentFloor.value = parsed.floor;
    }
  }
});
</script>

<style scoped lang="scss">
.map-page {
  height: 100%;
  min-height: 0;
  padding: 10px 10px 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  flex: 1;
  position: relative;
}

.map-controls {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background: var(--sk-soft);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    font-size: 12px;
    color: var(--sk-muted);
  }
}

.floor-select {
  padding: 6px 12px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: var(--sk-ink);
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: var(--sk-soft);
  }
}

.zoom-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--sk-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--sk-soft);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  i {
    font-size: 12px;
  }
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 12px;
  color: var(--sk-muted);
}

.map-container {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  box-sizing: border-box;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-overflow-scrolling: touch;

  &.is-dragging {
    cursor: grabbing;
  }
}

.map-zoom-space {
  position: relative;
  min-width: 1px;
  min-height: 1px;
}

.map-grid {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  transition: transform 0.2s ease;
}

.map-row {
  display: flex;
}

.map-cell {
  width: 80px;
  height: 80px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--sk-soft);
  position: relative;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--sk-soft);
    border-color: rgba(102, 126, 234, 0.5);
  }

  &.has-location {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
  }

  &.current-position {
    background: rgba(34, 211, 238, 0.2);
    border-color: rgba(34, 211, 238, 0.5);
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
  }

  // 空单元格：不显示边框和背景，但保持位置
  &.empty-cell {
    border: none;
    background: transparent;
    cursor: default;

    &:hover {
      background: transparent;
      border: none;
    }
  }
}

.cell-coord {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 8px;
  color: var(--sk-muted);
  font-family: 'JetBrains Mono', monospace;
}

.location-marker {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px;

  i {
    font-size: 20px;
    color: var(--sk-violet);
  }

  .location-label {
    font-size: 9px;
    color: var(--sk-ink);
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.faction-student-council i {
    color: var(--sk-warning);
  }
  &.faction-feminist i {
    color: var(--sk-pink);
  }
  &.faction-bf i {
    color: var(--sk-violet);
  }
  &.faction-sports i {
    color: var(--sk-success);
  }
  &.faction-research i {
    color: var(--sk-blue);
  }
  &.faction-underground i {
    color: var(--sk-muted);
  }
  &.faction-male-alliance i {
    color: var(--sk-blue);
  }
  &.faction-femdom i {
    color: var(--sk-pink);
  }
  &.faction-public i {
    color: var(--sk-violet);
  }
  &.faction-independent i {
    color: var(--sk-warning);
  }
  &.faction-admin i {
    color: var(--sk-warning);
  }
  &.faction-none i {
    color: var(--sk-muted);
  }
}

.location-detail {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 58px;
  width: auto;
  max-height: min(48%, 320px);
  overflow: auto;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--sk-ink);
    margin: 0;
  }
}

.close-detail {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--sk-soft);
  border: none;
  color: var(--sk-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--sk-soft);
  }

  i {
    font-size: 12px;
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  font-size: 12px;
  color: var(--sk-muted);
}

.detail-value {
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--sk-ink);
  text-align: right;
  overflow-wrap: anywhere;
}

.detail-description {
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;

  .detail-value {
    color: var(--sk-ink);
    line-height: 1.5;
    text-align: left;
  }
}

.current-location {
  position: relative;
  flex: 0 0 auto;
  max-width: 100%;
  margin: 8px auto 0;
  padding: 10px 20px;
  background: rgba(34, 211, 238, 0.2);
  border: 1px solid rgba(34, 211, 238, 0.5);
  border-radius: 20px;
  color: var(--sk-ink);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  z-index: 2;
  box-sizing: border-box;

  i {
    flex: 0 0 auto;
    color: var(--sk-blue);
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
