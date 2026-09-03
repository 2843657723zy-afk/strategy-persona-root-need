// 轻量存储后端：一个 Vercel Serverless Function + Vercel KV，只存一份"全局画板存档"。
// 没有连接 KV 时，任何请求都会返回 503——前端会自动识别并静默退回 localStorage，不影响正常使用。
const KEY = 'board:default';

module.exports = async function handler(req, res) {
  let kv;
  try {
    // 懒加载：没装/没配置 KV 时，require 或调用都可能抛错，统一走下面的 catch 降级
    kv = require('@vercel/kv').kv;
  } catch (e) {
    return res.status(503).json({ error: 'kv_not_installed' });
  }

  try {
    if (req.method === 'GET') {
      const data = await kv.get(KEY);
      if (!data) return res.status(204).end();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = null; }
      }
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'invalid_body' });
      }
      await kv.set(KEY, body);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await kv.del(KEY);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
  } catch (e) {
    // KV 环境变量没配置 / 请求失败：优雅降级，前端会自动只用 localStorage
    return res.status(503).json({ error: 'kv_unavailable', message: String((e && e.message) || e) });
  }
};
