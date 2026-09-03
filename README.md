# 漫画AIGC · 拖拽式标签重叠图谱

静态单页 `index.html` + 一个轻量后端 `api/board.js`（Vercel Serverless Function）。

## 部署
直接把这个仓库 Import 到 Vercel 即可，会自动识别根目录的 `index.html` 和 `api/board.js`，不需要额外配置。

## 存储行为
- 默认情况下（没做下面的可选步骤）：数据只存在浏览器的 `localStorage` 里，换设备/换浏览器看不到。
- 想要"跨设备/跨浏览器都能看到同一份画板"，只需要做一次性设置：
  1. Vercel 项目 → **Storage** → **Create Database** → 选 **KV** → Connect 到这个项目
  2. 重新部署一次（Redeploy），环境变量会自动注入，不需要改代码
- 没做这一步也完全不影响使用——前端会自动探测后端是否可用，探测不到就静默退回本地存储，界面上不会报错。

## 本地跑
没有额外依赖也能直接打开 `index.html` 用（走 localStorage）。如果想连后端调试，用 `vercel dev`（需要先 `vercel login` 并在项目里连好 KV）。

## 重置
右上角"恢复默认标签库"按钮会清空本地 + 云端的存档，恢复到代码里写的初始数据。
