# 开局前端 · P3R 视觉改造

2026-10-28。仅 fork 的 `opening-page.ts` 启用 `is-reload-theme`。保留当前角色选择、静夜顺序、预设、填写流程与开局提交；字号继续由 `build-narrative-opening.mjs` 统一乘 1.2。

## 已查看的参考

- [P3R 主菜单截图文章](https://finance.sina.com.cn/tech/roll/2024-01-31/doc-inafiqsx9807431.shtml)：上青下蓝的水下背景、白色长楔选中项、紧凑倾斜标题。
- [人物 Status 截图](https://gamebanana.com/mods/497532)：黑白斜切信息片、细红边、大头像与资料区的层叠关系。
- [Famitsu Persona 状态截图](https://www.famitsu.com/images/000/332/032/y_65b0c9d578747.jpg)：白色斜面标题、深蓝技能面板、青色数值。
- [完整菜单录屏](https://www.youtube.com/watch?v=fXgKcM20M08)及[官方 UI 演示转载](https://www.bilibili.com/video/BV1Dc41127Wt/)已找到，但浏览器未成功播放，因此没有采用未经观看的逐帧动画结论。

## 实现

SVG 绘制水面反光块、圆弧、斜切面与进度圆环；人物沿用项目原素材。钴蓝 `#1634eb`、深蓝 `#08134e`、青色 `#21dff3`、白色，红色 `#f43252` 仅作为选中强调。布局适配原有中文表单，并非对某一整屏做像素级复制。

- `AdmissionReloadScenery.vue`：水下蓝背景的 SVG 几何图形。
- `AdmissionReloadDial.vue`：真实步骤数驱动的进度圆环。
- `AdmissionReloadWelcome.vue`：猫 arc 天音（左）与爱丽丝教师装（右）的欢迎插图，参考希耶尔教室的双人站位。
- `admission-reload.scss`：导航、欢迎、表单、学籍摘要及操作按钮。
- `admission-reload-select.scss`：人物选择、信息面板、头像条。

页面切换用 0.12–0.32 秒的位移/斜面展开；已有减少动效开关继续生效。主界面不新增依赖或外部字体。

## 恢复

修改前完整备份：`F:/酒馆模板/backups/opening-before-p3r-20261028140305`。

```bash
node "F:/酒馆模板/backups/opening-before-p3r-20261028140305/restore.mjs"
```

备份含旧开局源码、依赖、构建入口、生成模块和完整发布脚本。恢复只复制备份文件，不删除新增文件；旧入口不会引用本轮新增主题文件。
