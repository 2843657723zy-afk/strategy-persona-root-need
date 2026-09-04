// 轻量存储后端：直接把画板存档读写进这个 GitHub 仓库的 data 分支（board.json 一个文件），零第三方存储依赖。
// 需要一个有 repo 权限的 GH_TOKEN 环境变量（已在 Vercel 项目设置里配置好）。没配置就自动 503，前端会静默退回 localStorage。
const OWNER = '2843657723zy-afk';
const REPO = 'strategy-persona-root-need';
const BRANCH = 'data';
const PATH = 'board.json';
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

function ghHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'strategy-persona-root-need-board'
  };
}

module.exports = async function handler(req, res) {
  const token = process.env.GH_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'gh_token_missing' });
  }

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${API_BASE}?ref=${BRANCH}`, { headers: ghHeaders(token) });
      if (r.status === 404) return res.status(204).end(); // 还没存过任何东西
      if (!r.ok) return res.status(503).json({ error: 'github_error', status: r.status });
      const file = await r.json();
      const content = Buffer.from(file.content, 'base64').toString('utf8');
      let data;
      try { data = JSON.parse(content); } catch (e) { return res.status(204).end(); }
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

      // 更新已存在的文件必须带上当前 sha，没有文件时就是新建（不用带 sha）
      let sha;
      const getRes = await fetch(`${API_BASE}?ref=${BRANCH}`, { headers: ghHeaders(token) });
      if (getRes.ok) {
        const f = await getRes.json();
        sha = f.sha;
      }

      const putRes = await fetch(API_BASE, {
        method: 'PUT',
        headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'chore: update board snapshot',
          content: Buffer.from(JSON.stringify(body)).toString('base64'),
          branch: BRANCH,
          sha
        })
      });
      if (!putRes.ok) {
        const errText = await putRes.text();
        return res.status(503).json({ error: 'github_write_failed', detail: errText });
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const getRes = await fetch(`${API_BASE}?ref=${BRANCH}`, { headers: ghHeaders(token) });
      if (getRes.status === 404) return res.status(200).json({ ok: true }); // 本来就没有，等于已经是空的
      if (!getRes.ok) return res.status(503).json({ error: 'github_error' });
      const f = await getRes.json();
      const delRes = await fetch(API_BASE, {
        method: 'DELETE',
        headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'chore: reset board snapshot', sha: f.sha, branch: BRANCH })
      });
      if (!delRes.ok) return res.status(503).json({ error: 'github_delete_failed' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
  } catch (e) {
    return res.status(503).json({ error: 'unexpected_error', message: String((e && e.message) || e) });
  }
};
