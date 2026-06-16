# 万万烧烤微信小程序

这是从 14 页静态设计稿升级出的原生微信小程序可开发版本。

## 结构

- `miniprogram/`：原生微信小程序前端。
- `cloudfunctions/wanwanApi/`：微信云开发云函数。
- `docs/cloudbase-schema.md`：云数据库集合设计。
- `docs/seed-data.json`：初始化数据参考。
- `docs/cloudbase-release.md`：真实 CloudBase 上线步骤。
- `work/`、`outputs/`：原 HTML 设计稿和导出文件。

## 本地预览

1. 用微信开发者工具打开当前目录。
2. `project.config.json` 已配置：
   - `miniprogramRoot`: `miniprogram/`
   - `cloudfunctionRoot`: `cloudfunctions/`
3. 当前已进入真实云开发模式，`miniprogram/utils/config.js` 中 `USE_MOCK = false`。
4. 接入云开发时：
   - 将 `ENV_ID` 替换为实际云开发环境 ID。
   - 将 `cloudbaserc.json` 中的 `envId` 和 `SETUP_KEY` 替换为真实值。
   - 部署 `cloudfunctions/wanwanApi`。
   - 调用 `initSeedData` 初始化集合数据。
   - 详细步骤见 `docs/cloudbase-release.md`。

## 已实现

- 顾客端：选桌、菜单、规格弹层、加购/减购、购物车抽屉、确认下单、成功页。
- 店员端：登录、订单工作台、实时订单监听适配、确认/完成订单、桌号聚合详情。
- 管理端：菜单管理、分类管理、菜品编辑、门店管理；支持新增/编辑/上下架/售罄/头图配置和桌码生成。
- 门店管理：可保存点单页顶部背景图 URL、门店名和点单文案；云开发字段位于 `settings/store.headerImageUrl`。
- 组件：商品行、商品摘要行、数量控件、规格选择、底部弹层、购物车栏、订单卡片、空态、错误态、后台表单区。

## 后续接入重点

- 在云开发控制台确认集合权限。
- 将 `staff_users` 作为正式店员账号来源，替换默认初始化账号和密码。
- 菜单/分类/菜品管理页已接 API，真实环境需确认集合权限和索引。
- 桌码生成已接 `wxacode.getUnlimited` 与云存储文件下载，需部署云函数后真机扫码验证。
- 店员端可按实际门店需求增加打印机联动或微信订阅消息。
