# kunkun-app · 困困玩家道具集市

面向和平精英地铁逃生玩家的道具出售、求购与交流客户端，支持 H5 和微信小程序。

## 项目简介

玩家共用一个客户端完成出售/求购、按用户编号查人、访问公开个人主页和店铺、收藏关注、站内沟通及订单查询。商品按单价和数量展示，详情支持图片；实名认证与店铺认证有独立入口，公开主页显示等级、会员状态及获得的勋章。

首页大图整图可点击，内容由后台配置。活动中心支持最新/历史图文活动及关联转盘；积分商城可兑换勋章和实物。钱包新增独立保证金金额说明，暂不开放缴退，真实支付也保持关闭。会员成长主要由后台带原因调整，不承诺自动消费返积分或付费会员权益。

本项目通过 `kunkun-backend` 获取真实业务数据，运营内容由 `kunkun-admin` 管理；不出售游戏账号，不使用新的代练进度流程。

## 技术栈

- uni-app 3、Vue 3.5、JavaScript、Vite 6.4。
- 微信小程序与 H5 共用页面、组件和 API 层。
- ESLint / eslint-plugin-vue，以及构建前的依赖补丁校验。

## 关联仓库

| 项目 | 说明 | GitHub |
| --- | --- | --- |
| kunkun-backend | 后端服务 | [kunkun-backend](https://github.com/jiangyi3265/kunkun-backend) |
| kunkun-admin | 管理后台 | [kunkun-admin](https://github.com/jiangyi3265/kunkun-admin) |
| kunkun-app | 用户端 | [kunkun-app](https://github.com/jiangyi3265/kunkun-app) |

## 快速启动

准备 Node.js 24/npm。启动关联后端后，在本仓库执行：

```powershell
npm ci
$env:BOOST_API_URL='http://127.0.0.1:8080'
npm run dev:h5
```

H5 开发入口 `http://127.0.0.1:5173`，`/api` 通过 Vite 代理到后端。安装时自动应用仓库内已审查的 braces 补丁，构建前再次核对依赖字节。仓库已包含安装、lint和补丁工具，不需要上级目录存在其他项目。

```powershell
npm run lint
npm run build:h5
npm run build:mp-weixin
```

构建目录分别是 `dist/build/h5`、`dist/build/mp-weixin`。微信开发者工具导入后者。发布前从 `.env.production.example` 复制到 `.env.production.local`，设置真实 HTTPS API 域名，并配置 `manifest.json` 中属于自己的小程序 AppID；合法域名必须在公众平台登记。AppID是公开标识，AppSecret绝不能进入客户端。真机不能请求开发机的127.0.0.1地址。

若使用了 `npm ci --ignore-scripts`，需显式运行 `node scripts/apply-braces-hardening.cjs .`；`--check` 模式只核验，不自动修复或吞掉未知依赖错误。这个补丁不代表所有 npm 审计风险已消除。

## 项目结构

```text
pages/       市场、出售/求购、订单、聊天、资料、认证、钱包和积分活动
components/  AppShell、安全标题栏、图标、商品卡片与通用状态视图
lib/         API、登录会话、金额与业务辅助函数
static/      小程序可用图标与图片资源
styles/      共用布局和视觉样式
scripts/     uni构建入口、独立lint、依赖补丁校验
patches/     已审查依赖补丁、指纹及第三方许可证
pages.json   页面路由和窗口配置
manifest.json 小程序及跨端构建配置
```

## 验证与功能边界

近期钱包只读保证金、消息按钮胶囊避让已在隔离服务、H5和官方开发者工具验证；官方开发者工具不是实体手机。真实短信、实名供应商和微信真机环境仍须单独验收。支付及保证金缴退不在当前开放范围，不要通过客户端隐藏错误或伪造成功跳过认证/资金校验。

原三端联调与回归脚本随后端的 `workspace-tools` 保存，按其说明恢复兄弟目录可重用；历史 `.runtime` 和测试截图不属于公开源码。

## 简历描述示例

参与基于 uni-app 的玩家道具交易客户端开发，实现出售/求购、个人主页、聊天通知和订单交付页面，并对接统一 API 保持多端状态一致。完成图文活动与积分兑换入口、独立认证交互以及微信安全区和空状态适配。
