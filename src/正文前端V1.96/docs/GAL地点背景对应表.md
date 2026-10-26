# GAL 模式地点背景对应表

更新日期：2026-10-22。适用项目：正文前端 V1.94。

50 个地点已接入 GAL 背景。新补的 36 张均已建立地点对应，当前启用其中
**35 张**；**中心广场按你的确认继续使用旧 GAL 的《新学校入口.png》**。桌面 GAL、手机 GAL 和气泡场景底图共用同一套选择。

新旧图片对照与历史版本见 [GAL 背景新旧版本对照](./GAL背景新旧版本对照.md)。

地点读取 `位置系统.地点名称` 等现有变量字段，不根据台词中“想去某地”提前换图。

## 新补图片对应的 36 个地点

所有新图均已在 GitHub 仓库 `enterprise20020924-web/-` 的 `llm1/天海附加背景/`
核对到同名文件。除中心广场的明确保留项外，下表采用该批图片；实际运行不使用 F 盘或 localhost 图片路径。

| 编号 | 地点                       | 当前 GAL 图片                                                                                                                                                                                                                                                                                                                                                                                                            | 说明                              |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| 02   | A/B班进阶教室              | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/02_A_B%E7%8F%AD%E8%BF%9B%E9%98%B6%E6%95%99%E5%AE%A4_%E4%B8%BB%E6%95%99%E5%AE%A4.png) · `02_A_B班进阶教室_主教室.png`                                                                                                                                                                  | A/B班进阶教室 · 主教室            |
| 03   | S班特别教室                | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/03_S%E7%8F%AD%E7%89%B9%E5%88%AB%E6%95%99%E5%AE%A4_%E7%88%B1%E4%B8%BD%E4%B8%9D%E6%B8%A9%E7%89%B9%E7%89%B9%E5%88%AB%E8%BE%85%E5%AF%BC%E5%AE%A4.png) · `03_S班特别教室_爱丽丝温特特别辅导室.png`                                                                                         | S班特别教室 · 特别辅导室          |
| 04   | S/A班教师办公室            | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/04_S_A%E7%8F%AD%E6%95%99%E5%B8%88%E5%8A%9E%E5%85%AC%E5%AE%A4_%E9%AB%98%E9%98%B6%E6%95%99%E5%B8%88%E5%8A%9E%E5%85%AC%E5%A5%97%E5%8C%BA_%E8%BF%94%E5%B7%A5.png) · `04_S_A班教师办公室_高阶教师办公套区_返工.png`                                                                        | S/A班教师办公室 · 高阶办公套区    |
| 05   | B/C/D班教师办公室          | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/05_B_C_D%E7%8F%AD%E6%95%99%E5%B8%88%E5%8A%9E%E5%85%AC%E5%AE%A4_%E4%B8%BB%E5%8A%9E%E5%85%AC%E5%8C%BA.png) · `05_B_C_D班教师办公室_主办公区.png`                                                                                                                                        | B/C/D班教师办公室 · 主办公区      |
| 06   | 研究会特殊植物栽培区       | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/06_%E7%A0%94%E7%A9%B6%E4%BC%9A%E7%89%B9%E6%AE%8A%E6%A4%8D%E7%89%A9%E6%A0%BD%E5%9F%B9%E5%8C%BA_%E5%A4%A7%E5%9E%8B%E7%94%9F%E6%80%81%E7%A0%94%E7%A9%B6%E6%B8%A9%E5%AE%A4_%E8%BF%94%E5%B7%A5.png) · `06_研究会特殊植物栽培区_大型生态研究温室_返工.png`                                  | 特殊植物栽培区 · 生态研究温室     |
| 09   | 体育联盟游泳部             | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/09_%E4%BD%93%E8%82%B2%E8%81%94%E7%9B%9F%E6%B8%B8%E6%B3%B3%E9%83%A8_%E5%A4%A7%E5%9E%8B%E7%BB%BC%E5%90%88%E6%B8%B8%E6%B3%B3%E8%AE%AD%E7%BB%83%E4%B8%AD%E5%BF%83_%E8%BF%94%E5%B7%A5.png) · `09_体育联盟游泳部_大型综合游泳训练中心_返工.png`                                             | 游泳部 · 综合游泳训练中心         |
| 10   | 天台训练场                 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/10_%E5%A4%A9%E5%8F%B0%E8%AE%AD%E7%BB%83%E5%9C%BA_%E6%A0%A1%E5%9B%AD%E4%BF%AF%E7%9E%B0%E8%AE%AD%E7%BB%83%E5%8C%BA.png) · `10_天台训练场_校园俯瞰训练区.png`                                                                                                                            | 天台训练场 · 校园俯瞰训练区       |
| 11   | 体育联盟器械训练部         | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/11_%E4%BD%93%E8%82%B2%E8%81%94%E7%9B%9F%E5%99%A8%E6%A2%B0%E8%AE%AD%E7%BB%83%E9%83%A8_%E5%A4%A7%E5%9E%8B%E7%BB%BC%E5%90%88%E4%BD%93%E8%83%BD%E8%AE%AD%E7%BB%83%E4%B8%AD%E5%BF%83_%E8%BF%94%E5%B7%A5.png) · `11_体育联盟器械训练部_大型综合体能训练中心_返工.png`                       | 器械训练部 · 综合体能训练中心     |
| 12   | 体育联盟武术部             | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/12_%E4%BD%93%E8%82%B2%E8%81%94%E7%9B%9F%E6%AD%A6%E6%9C%AF%E9%83%A8_%E6%AD%A6%E9%81%93%E9%A6%86%E4%B8%BB%E8%AE%AD%E7%BB%83%E5%9C%BA.png) · `12_体育联盟武术部_武道馆主训练场.png`                                                                                                      | 武术部 · 武道馆主训练场           |
| 13   | 后山温泉                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/13_%E5%90%8E%E5%B1%B1%E6%B8%A9%E6%B3%89_%E9%9C%B2%E5%A4%A9%E6%B8%A9%E6%B3%89%E6%B1%A0.png) · `13_后山温泉_露天温泉池.png`                                                                                                                                                             | 后山温泉 · 露天温泉池             |
| 17   | 院长办公室                 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/17_%E9%99%A2%E9%95%BF%E5%8A%9E%E5%85%AC%E5%AE%A4_%E7%A9%BA%E4%B8%AD%E8%97%8F%E4%B9%A6%E5%A5%97%E5%8E%85_v2.png) · `17_院长办公室_空中藏书套厅_v2.png`                                                                                                                                 | 院长办公室 · 空中藏书套厅（夜景） |
| 18   | 学生会最高监控中心         | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/18_%E5%AD%A6%E7%94%9F%E4%BC%9A%E6%9C%80%E9%AB%98%E7%9B%91%E6%8E%A7%E4%B8%AD%E5%BF%83_%E5%A4%A9%E6%96%87%E5%8F%B0%E4%B8%BB%E7%9B%91%E6%8E%A7%E5%AE%A4.png) · `18_学生会最高监控中心_天文台主监控室.png`                                                                                | 最高监控中心 · 天文台主监控室     |
| 20   | 地下联盟秘密通道           | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/20_%E5%9C%B0%E4%B8%8B%E8%81%94%E7%9B%9F%E7%A7%98%E5%AF%86%E9%80%9A%E9%81%93_%E5%A4%9A%E5%8C%BA%E5%9C%B0%E4%B8%8B%E9%80%9A%E9%81%93%E6%9E%A2%E7%BA%BD_%E8%BF%94%E5%B7%A5.png) · `20_地下联盟秘密通道_多区地下通道枢纽_返工.png`                                                        | 地下联盟 · 通道枢纽               |
| 21   | 地下旧货市场入口           | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/21_%E5%9C%B0%E4%B8%8B%E6%97%A7%E8%B4%A7%E5%B8%82%E5%9C%BA%E5%85%A5%E5%8F%A3_%E5%A4%A7%E5%9E%8B%E9%94%85%E7%82%89%E5%8E%85%E4%B8%8E%E5%9C%B0%E4%B8%8B%E9%97%A8%E5%8E%85_%E8%BF%94%E5%B7%A5.png) · `21_地下旧货市场入口_大型锅炉厅与地下门厅_返工.png`                                  | 地下旧货市场入口 · 锅炉厅         |
| 22   | 地下旧货跳蚤市场           | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/22_%E5%9C%B0%E4%B8%8B%E6%97%A7%E8%B4%A7%E8%B7%B3%E8%9A%A4%E5%B8%82%E5%9C%BA_%E5%A4%A7%E5%9E%8B%E5%9C%B0%E4%B8%8B%E4%BA%A4%E6%98%93%E8%A1%97%E5%8C%BA_%E8%BF%94%E5%B7%A5.png) · `22_地下旧货跳蚤市场_大型地下交易街区_返工.png`                                                        | 地下旧货跳蚤市场 · 交易街区       |
| 23   | 地下临时交易点             | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/23_%E5%9C%B0%E4%B8%8B%E4%B8%B4%E6%97%B6%E4%BA%A4%E6%98%93%E7%82%B9_%E5%A4%A7%E5%9E%8B%E5%9C%B0%E4%B8%8B%E4%BA%A4%E6%98%93%E4%BA%A4%E6%8E%A5%E5%8E%85_%E8%BF%94%E5%B7%A5.png) · `23_地下临时交易点_大型地下交易交接厅_返工.png`                                                        | 地下临时交易点 · 室内交接厅       |
| 24   | 蝶变之所艺术设计社总部     | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/24_%E8%9D%B6%E5%8F%98%E4%B9%8B%E6%89%80%E8%89%BA%E6%9C%AF%E8%AE%BE%E8%AE%A1%E7%A4%BE%E6%80%BB%E9%83%A8_%E5%A4%A7%E5%9E%8B%E5%9C%B0%E4%B8%8B%E7%A0%94%E5%8F%91%E6%80%BB%E9%83%A8_%E8%BF%94%E5%B7%A5.png) · `24_蝶变之所艺术设计社总部_大型地下研发总部_返工.png`                       | 艺术设计社总部 · 地下研发大厅     |
| 25   | 蝶变之所材料实验室         | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/25_%E8%9D%B6%E5%8F%98%E4%B9%8B%E6%89%80%E6%9D%90%E6%96%99%E5%AE%9E%E9%AA%8C%E5%AE%A4_%E5%A4%A7%E5%9E%8B%E6%9D%90%E6%96%99%E7%A0%94%E7%A9%B6%E5%A4%A7%E5%8E%85_%E8%BF%94%E5%B7%A5.png) · `25_蝶变之所材料实验室_大型材料研究大厅_返工.png`                                             | 材料实验室 · 材料研究大厅         |
| 28   | 行为反馈研究社总部         | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/28_%E8%A1%8C%E4%B8%BA%E5%8F%8D%E9%A6%88%E7%A0%94%E7%A9%B6%E7%A4%BE%E6%80%BB%E9%83%A8_%E5%A4%9A%E5%B1%82%E4%B8%AD%E5%A4%AE%E7%A0%94%E7%A9%B6%E5%A4%A7%E5%8E%85_%E8%BF%94%E5%B7%A5.png) · `28_行为反馈研究社总部_多层中央研究大厅_返工.png`                                             | 行为反馈研究社 · 中央研究大厅     |
| 29   | 行为反馈研究社高安全实验区 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/29_%E8%A1%8C%E4%B8%BA%E5%8F%8D%E9%A6%88%E7%A0%94%E7%A9%B6%E7%A4%BE%E9%AB%98%E5%AE%89%E5%85%A8%E5%AE%9E%E9%AA%8C%E5%8C%BA_%E5%A4%A7%E5%9E%8B%E9%9A%94%E7%A6%BB%E5%AE%9E%E9%AA%8C%E5%A4%A7%E5%8E%85_%E8%BF%94%E5%B7%A5.png) · `29_行为反馈研究社高安全实验区_大型隔离实验大厅_返工.png` | 高安全实验区 · 隔离实验大厅       |
| 30   | 外校临时居住地A            | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/30_%E5%A4%96%E6%A0%A1%E4%B8%B4%E6%97%B6%E5%B1%85%E4%BD%8F%E5%9C%B0A_%E5%AE%AB%E6%AE%BF%E5%BC%8F%E8%BF%8E%E5%AE%BE%E5%A4%A7%E5%8E%85_%E8%93%9D%E7%99%BD%E7%94%BB%E9%A3%8E%E4%BF%AE%E6%AD%A3.png) · `30_外校临时居住地A_宫殿式迎宾大厅_蓝白画风修正.png`                                | 交流会馆 A 栋 · 迎宾大厅          |
| 31   | 外校临时居住地B            | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/31_%E5%A4%96%E6%A0%A1%E4%B8%B4%E6%97%B6%E5%B1%85%E4%BD%8F%E5%9C%B0B_%E5%AE%AB%E5%BB%B7%E5%BC%8F%E8%B4%B5%E5%AE%BE%E4%BC%9A%E5%AE%A2%E5%A4%A7%E5%8E%85_%E8%93%9D%E7%99%BD%E7%94%BB%E9%A3%8E%E4%BF%AE%E6%AD%A3.png) · `31_外校临时居住地B_宫廷式贵宾会客大厅_蓝白画风修正.png`          | 交流会馆 B 栋 · 贵宾会客大厅      |
| 34   | 教职工宿舍                 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/34_%E6%95%99%E8%81%8C%E5%B7%A5%E5%AE%BF%E8%88%8D_%E5%85%AC%E5%85%B1%E4%BC%91%E6%81%AF%E5%A4%A7%E5%8E%85.png) · `34_教职工宿舍_公共休息大厅.png`                                                                                                                                       | 教职工宿舍 · 公共休息大厅         |
| 36   | 中心广场                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E6%96%B0%E5%AD%A6%E6%A0%A1%E5%85%A5%E5%8F%A3.png) · `新学校入口.png`                                                                                                                                                                                                                                   | **用户已确认保留旧版校门图**      |
| 39   | 综合竞技场                 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/39_%E7%BB%BC%E5%90%88%E7%AB%9E%E6%8A%80%E5%9C%BA_%E5%9C%86%E5%BD%A2%E4%B8%BB%E8%B5%9B%E5%9C%BA.png) · `39_综合竞技场_圆形主赛场.png`                                                                                                                                                  | 综合竞技场 · 圆形主赛场           |
| 40   | 学院后山                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/40_%E5%AD%A6%E9%99%A2%E5%90%8E%E5%B1%B1_%E6%BA%AA%E6%B5%81%E5%B1%B1%E5%BE%84.png) · `40_学院后山_溪流山径.png`                                                                                                                                                                        | 学院后山 · 溪流山径               |
| 41   | 中心湖                     | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/41_%E4%B8%AD%E5%BF%83%E6%B9%96_%E5%87%89%E4%BA%AD%E4%B8%8E%E6%B9%96%E5%BF%83%E5%B2%9B.png) · `41_中心湖_凉亭与湖心岛.png`                                                                                                                                                             | 中心湖 · 凉亭与湖心岛             |
| 42   | 综合服务大厅               | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/42_%E7%BB%BC%E5%90%88%E6%9C%8D%E5%8A%A1%E5%A4%A7%E5%8E%85_%E6%A0%A1%E5%8A%A1%E5%8A%9E%E7%90%86%E5%A4%A7%E5%8E%85.png) · `42_综合服务大厅_校务办理大厅.png`                                                                                                                            | 综合服务大厅 · 校务办理大厅       |
| 43   | 学校医院                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/43_%E5%AD%A6%E6%A0%A1%E5%8C%BB%E9%99%A2_%E7%A7%91%E6%8A%80%E5%8C%BB%E7%96%97%E4%B8%AD%E5%BF%83_%E5%88%86%E5%8C%BA%E4%BF%AE%E6%AD%A3%E7%89%88_v2.png) · `43_学校医院_科技医疗中心_分区修正版_v2.png`                                                                                   | 学校医院 · 医疗中心大厅           |
| 44   | 心理健康中心               | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/44_%E5%BF%83%E7%90%86%E5%81%A5%E5%BA%B7%E4%B8%AD%E5%BF%83_%E5%A4%A7%E5%9E%8B%E5%BF%83%E7%90%86%E5%92%A8%E8%AF%A2%E5%A5%97%E5%8C%BA_%E4%BA%8C%E7%BB%B4%E7%94%BB%E9%A3%8E%E4%BF%AE%E6%AD%A3_v3.png) · `44_心理健康中心_大型心理咨询套区_二维画风修正_v3.png`                            | 心理健康中心 · 咨询与休憩套区     |
| 45   | 未分配的社团房间           | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/45_%E6%9C%AA%E5%88%86%E9%85%8D%E7%9A%84%E7%A4%BE%E5%9B%A2%E6%88%BF%E9%97%B4_%E7%A9%BA%E7%BD%AE%E6%B4%BB%E5%8A%A8%E5%AE%A4.png) · `45_未分配的社团房间_空置活动室.png`                                                                                                                 | 未分配社团房间 · 空置活动室       |
| 46   | 后山入口                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/46_%E5%90%8E%E5%B1%B1%E5%85%A5%E5%8F%A3_%E5%85%A5%E5%8F%A3%E5%B9%BF%E5%9C%BA.png) · `46_后山入口_入口广场.png`                                                                                                                                                                        | 后山入口 · 入口广场               |
| 47   | 私人海滩                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/47_%E7%A7%81%E4%BA%BA%E6%B5%B7%E6%BB%A9_%E7%8B%AC%E7%AB%8B%E6%B5%B7%E5%B2%B8%E5%85%A8%E6%99%AF.png) · `47_私人海滩_独立海岸全景.png`                                                                                                                                                  | 私人海滩 · 海岸全景               |
| 48   | 泳装与运动装备租赁店       | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/48_%E6%B3%B3%E8%A3%85%E4%B8%8E%E8%BF%90%E5%8A%A8%E8%A3%85%E5%A4%87%E7%A7%9F%E8%B5%81%E5%BA%97_%E6%B5%B7%E4%B9%8B%E5%AE%B6%E5%95%86%E5%BA%97.png) · `48_泳装与运动装备租赁店_海之家商店.png`                                                                                           | 泳装与运动装备租赁店 · 海之家     |
| 49   | 静心茶室                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/49_%E9%9D%99%E5%BF%83%E8%8C%B6%E5%AE%A4_%E6%A6%BB%E6%A6%BB%E7%B1%B3%E4%B8%BB%E8%8C%B6%E5%AE%A4.png) · `49_静心茶室_榻榻米主茶室.png`                                                                                                                                                  | 静心茶室 · 榻榻米主茶室           |
| 50   | 风铃神社                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/50_%E9%A3%8E%E9%93%83%E7%A5%9E%E7%A4%BE_%E4%B8%BB%E6%AE%BF%E4%B8%8E%E7%A5%9E%E6%A0%91%E5%BA%AD%E9%99%A2.png) · `50_风铃神社_主殿与神树庭院.png`                                                                                                                                       | 风铃神社 · 主殿与庭院             |

中心广场的新图仍保留可供比较：[查看未采用的新图](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%A4%A9%E6%B5%B7%E9%99%84%E5%8A%A0%E8%83%8C%E6%99%AF/36_%E4%B8%AD%E5%BF%83%E5%B9%BF%E5%9C%BA_%E5%96%B7%E6%B3%89%E5%85%A8%E6%99%AF.png)
· `36_中心广场_喷泉全景.png`。本次选择作用于 GAL 及其共享场景背景，地图地点详情的缩略图继续保留新图。

## 原有的 14 个地点

其中 12 张沿用 `llm1/全身立绘/`
图片。餐厅与秘密集会点的旧公开地址返回 404，已改为按需复用地图打包的原始 PNG；正式前端不依赖本机路径。下面这两张的本地链接仅用于查看源图。

| 编号 | 地点                       | 当前 GAL 图片                                                                                                                                                                                                                                                       | 说明                                       |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 01   | D/C班基础教室              | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/D_C%E7%8F%AD%E5%9F%BA%E7%A1%80%E6%95%99%E5%AE%A4.png) · `D_C班基础教室.png`                                                                        | D/C班基础教室 · 室内                       |
| 07   | 博览图书馆                 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E5%8D%9A%E8%A7%88%E5%9B%BE%E4%B9%A6%E9%A6%86%E4%B8%AD%E5%A4%AE%E9%98%85%E8%A7%88%E5%A4%A7%E5%8E%85.png) · `博览图书馆中央阅览大厅.png`            | 博览图书馆 · 中央阅览大厅                  |
| 08   | 体育联盟综合训练场         | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E4%BD%93%E8%82%B2%E8%81%94%E7%9B%9F%E6%80%BB%E9%83%A8%E4%B8%BB%E4%BD%93%E8%82%B2%E9%A6%86.png) · `体育联盟总部主体育馆.png`                       | 综合体育馆 · 建筑外观                      |
| 14   | 沙滩排球场                 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E7%A7%81%E4%BA%BA%E6%B5%B7%E6%BB%A9%E6%B2%99%E6%BB%A9%E6%8E%92%E7%90%83%E5%9C%BA.png) · `私人海滩沙滩排球场.png`                                  | 沙滩排球场 · 海岸场景                      |
| 15   | 权力之塔瞭望塔             | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E6%9D%83%E5%8A%9B%E4%B9%8B%E5%A1%94%E7%9E%AD%E6%9C%9B%E5%A1%94%E7%9B%91%E6%8E%A7%E5%AE%A4.png) · `权力之塔瞭望塔监控室.png`                       | 权力之塔瞭望塔 · 监控室                    |
| 16   | 权力之塔学生会总部         | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E6%9D%83%E5%8A%9B%E4%B9%8B%E5%A1%94%E5%AD%A6%E7%94%9F%E4%BC%9A%E6%80%BB%E9%83%A8.png) · `权力之塔学生会总部.png`                                  | 学生会总部 · 主会议厅                      |
| 19   | 学生互助联盟秘密集会点     | [查看](https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/天海附加背景/男性自保联盟秘密集会点.png) · `男性自保联盟秘密集会点.png`                                                                                                                 | 学生互助联盟 · 秘密集会点；GitHub 远程原图 |
| 26   | 女王宫殿女子自治协会总部   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E5%A5%B3%E7%8E%8B%E5%AE%AB%E6%AE%BF%E5%A5%B3%E6%9D%83%E5%8D%8F%E4%BC%9A%E6%80%BB%E9%83%A8.png) · `女王宫殿女权协会总部.png`                       | 女子自治协会 · 主会议厅                    |
| 27   | 女王宫殿女子自治协会生活区 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E5%A5%B3%E6%9D%83%E5%8D%8F%E4%BC%9A%E7%94%9F%E6%B4%BB%E5%AE%BF%E8%88%8D%E8%B1%AA%E5%8D%8E%E5%8D%95%E9%97%B4.png) · `女权协会生活宿舍豪华单间.png` | 女子自治协会生活区 · 私人房间              |
| 32   | 学生宿舍A栋                | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E5%AD%A6%E7%94%9F%E5%AE%BF%E8%88%8DA%E6%A0%8B%E5%8D%95%E4%BA%BA%E9%97%B4.png) · `学生宿舍A栋单人间.png`                                           | 学生宿舍 A 栋 · 单人间                     |
| 33   | 学生宿舍B栋                | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E5%AD%A6%E7%94%9F%E5%AE%BF%E8%88%8DB%E6%A0%8B%E5%8D%95%E4%BA%BA%E9%97%B4.png) · `学生宿舍B栋单人间.png`                                           | 学生宿舍 B 栋 · 单人间                     |
| 35   | 餐厅                       | [查看](https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/天海附加背景/天海学园食堂.png) · `天海学园食堂.png`                                                                                                                                     | 学园食堂 · 主用餐区；GitHub 远程原图       |
| 37   | 综合商业街                 | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E7%BB%BC%E5%90%88%E5%95%86%E4%B8%9A%E8%A1%97.png) · `综合商业街.png`                                                                              | 综合商业街 · 主通道                        |
| 38   | 学院正门                   | [查看](https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/%E5%85%A8%E8%BA%AB%E7%AB%8B%E7%BB%98/%E6%96%B0%E5%AD%A6%E6%A0%A1%E5%85%A5%E5%8F%A3.png) · `新学校入口.png`                                                                              | 学院正门 · 中央轴线                        |

## 兼容地名

完整地点名优先匹配。中英文斜杠、空格、下划线、连接号、全角字符、字母大小写会统一处理。例如
`A/B班进阶教室`、`A_B班进阶教室`、`AB班进阶教室` 对应同一地点。额外兼容名称如下：

| 标准地点                   | 额外兼容名称                                                         |
| -------------------------- | -------------------------------------------------------------------- |
| 研究会特殊植物栽培区       | 特殊植物栽培区、植物研究温室                                         |
| 博览图书馆                 | 博览图书馆中央大厅、博览图书馆中央阅览大厅                           |
| 体育联盟综合训练场         | 体育联盟总部主体育馆、第一体育馆                                     |
| 体育联盟游泳部             | 体育联盟游泳馆、游泳部                                               |
| 体育联盟器械训练部         | 器械训练部                                                           |
| 体育联盟武术部             | 武术部道场、武道馆                                                   |
| 沙滩排球场                 | 私人海滩沙滩排球场                                                   |
| 权力之塔瞭望塔             | 权力之塔瞭望塔监控室、瞭望塔监控室                                   |
| 权力之塔学生会总部         | 学生会总部                                                           |
| 学生会最高监控中心         | 最高监控中心、天文台主监控室                                         |
| 学生互助联盟秘密集会点     | 男性自保联盟秘密集会点                                               |
| 蝶变之所艺术设计社总部     | 艺术设计社总部                                                       |
| 蝶变之所材料实验室         | 材料实验室                                                           |
| 女王宫殿女子自治协会总部   | 女王宫殿女权协会总部、女权协会总部、女子自治协会总部                 |
| 女王宫殿女子自治协会生活区 | 女王宫殿女权协会生活区、女权协会生活宿舍豪华单间、女子自治协会生活区 |
| 外校临时居住地A            | 交流会馆A栋、国际交流会馆A栋                                         |
| 外校临时居住地B            | 交流会馆B栋、国际交流会馆B栋                                         |
| 学生宿舍A栋                | 学生宿舍A栋单人间                                                    |
| 学生宿舍B栋                | 学生宿舍B栋单人间                                                    |
| 餐厅                       | 天海学园食堂、学园食堂、中央食堂                                     |
| 中心广场                   | 中央广场                                                             |
| 综合商业街                 | 商业街                                                               |
| 学院正门                   | 学园正门、学院大门、天海学院大门、学园大门、学校入口                 |
| 学院后山                   | 学园后山、后山                                                       |
| 综合服务大厅               | 校务服务大厅                                                         |
| 学校医院                   | 学园医院、校医院                                                     |
| 心理健康中心               | 心理咨询中心                                                         |
| 未分配的社团房间           | 未分配社团房间                                                       |
| 泳装与运动装备租赁店       | 海滩装备租赁店                                                       |

层级名称按更具体的名称匹配；同等长度时采用右侧地点。例如 `学院后山 / 风铃神社` → 风铃神社，`综合服务大厅 / 心理健康中心`
→ 心理健康中心。

## 容易混淆的对应

- 15 瞭望塔保留《权力之塔瞭望塔监控室.png》；18 最高监控中心当前使用新的天文台主监控室，旧 GAL 曾把两者指向同一张图。
- 02、03 两间教室当前使用补图批次中的新文件；旧 GAL 图片已在新旧对照文档中保留链接，供你决定。
- 13 温泉、40 后山、46 后山入口、50 神社分别匹配；14 沙滩排球场、47 私人海滩、48 租赁店也分别匹配。
- 23 临时交易点当前使用地下交接厅；历史版林间据点可在新旧对照表查看。
- 17 院长办公室当前图片是夜景套厅，暂按地点固定使用，未单独配置日景和时间换图。
- 每张图代表相应地点的主要空间，例如会馆大厅或医院公共大厅；未为每个病房、走廊或房间额外指定图片。

## 暂不强行匹配的泛称

“教室”“教师办公室”“宿舍”“监控室”“权力之塔”“学生会”“地下区域”等名称不能唯一确定具体空间，暂使用学院正门作为既有兜底。若要为这些泛称指定默认图，可另行明确。

加载顺序为：已选原图 → 同一文件的 GitHub 原始地址（远程图）→ 学院正门兜底。切换地点会重置加载顺序，迟到的旧图不会覆盖新地点。

## 维护位置

- 地点清单：`map/generated/campus-destinations.ts`。
- 地点编号与图片：`map/campus-map-scenes.ts`、`map/generated/campus-supplement-scenes.ts`。
- GAL 地名和用户版本选择：`engine/stage-backgrounds.ts`，其中 `stageBackgroundOverrides` 记录明确保留项。
- 共享加载与兜底：`modules/use-stage-background.ts`。
- 地点变量读取：`mobile/scene-runtime.ts`。
- 检查脚本：`engine/stage-backgrounds.smoke.cjs`。

预览支持 `?location=中心广场` 等参数，只改变独立预览，不修改真实聊天变量。切到 GAL 模式即可查看。
