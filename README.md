# 漫画AIGC · 拖拽式标签重叠图谱

静态单页 `index.html` + 一个轻量后端 `api/board.js`（Vercel Serverless Function）。

## 部署
直接把这个仓库 Import 到 Vercel 即可，会自动识别根目录的 `index.html` 和 `api/board.js`，不需要额外配置。

## 存储行为
后端不依赖任何第三方存储服务（没有 KV/Redis/数据库），而是直接把画板存档写进这个仓库的 `data` 分支（`board.json` 一个文件），靠一个有 `repo` 权限的 `GH_TOKEN` 环境变量读写。这个环境变量已经在 Vercel 项目里配置好了。

- 打开页面时先请求后端，有存档就用后端的（所有设备/浏览器看到同一份）
- 后端请求失败（比如环境变量丢了）会自动静默退回 `localStorage`，界面上不会报错
- 每次改动画板会防抖 400ms 后同步写一次后端，对应地会在 `data` 分支上产生一条新 commit——这是预期行为，不影响 `main` 分支的干净历史

## 本地跑
没有额外依赖，直接打开 `index.html` 就能用（走 localStorage）。想连后端调试，本地跑 `vercel dev` 之前先 `vercel env pull` 把 `GH_TOKEN` 拉到本地。

## 重置
右上角"恢复默认标签库"按钮会清空本地 + 云端（`data` 分支上的 `board.json`）的存档，恢复到代码里写的初始数据。
