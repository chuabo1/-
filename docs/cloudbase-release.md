# CloudBase 真实环境上线步骤

## 1. 替换上线配置

- 将 `miniprogram/utils/config.js` 里的 `ENV_ID` 替换为真实云开发环境 ID。
- 将 `cloudbaserc.json` 里的 `envId` 替换为同一个真实环境 ID。
- 将 `cloudbaserc.json` 里的 `SETUP_KEY` 替换为一次性初始化密钥，例如随机长字符串。
- 当前 `USE_MOCK` 已切为 `false`，没有真实环境时本地预览会调用云函数。

## 2. 部署云函数

本机当前未安装 `tcb` CLI。可在安装并登录后执行：

```bash
npm install -g @cloudbase/cli
tcb login
tcb env use <真实 ENV_ID>
tcb fn deploy wanwanApi
tcb fn detail wanwanApi
```

也可以在微信开发者工具中右键 `cloudfunctions/wanwanApi` 上传并部署，部署时确保环境变量 `SETUP_KEY` 已配置。

## 3. 初始化数据

部署后调用云函数：

```json
{
  "action": "initSeedData",
  "data": {
    "setupKey": "<cloudbaserc.json 中的 SETUP_KEY>"
  }
}
```

初始化会写入：

- `settings/store`
- `tables`
- `categories`
- `dishes`
- `staff_users`
- `operation_logs`

默认店员账号：`13800000000 / 123456`。真实试营业前必须改手机号和密码。

## 4. 真机验收

- 扫桌码进入菜单，确认顶部桌号正确。
- 普通菜、多规格菜加购、减购、提交订单。
- 店员登录后看到新订单，能确认、完成。
- 管理端保存菜品、分类、门店头图后，顾客端刷新生效。
- 门店管理生成桌码后，保存图片并用微信扫码验证。
