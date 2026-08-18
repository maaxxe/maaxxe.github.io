const API_VERSION = '2022-11-28';

function corsHeaders(origin, allowedOrigin) {
  const allowed = !allowedOrigin || allowedOrigin === '*' || origin === allowedOrigin;
  return {
    'Access-Control-Allow-Origin': allowed ? (allowedOrigin === '*' ? '*' : origin || allowedOrigin) : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function validateMenu(data) {
  if (!data || typeof data !== 'object') return 'JSON invalide';
  if (!data.restaurant || typeof data.restaurant.name !== 'string') return 'Restaurant invalide';
  if (!Array.isArray(data.tags) || !Array.isArray(data.days)) return 'Structure menus invalide';
  if (data.tags.length > 500) return 'Trop d’étiquettes';
  if (data.days.length > 120) return 'Trop de jours';
  return null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env.ALLOWED_ORIGIN || '*');

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    if (env.ALLOWED_ORIGIN && env.ALLOWED_ORIGIN !== '*' && origin && origin !== env.ALLOWED_ORIGIN) {
      return json({ error: 'Origine non autorisée' }, 403, headers);
    }

    if (request.method === 'GET') {
      return json({
        ok: true,
        service: 'chez-lucette-publisher',
        repository: `${env.GITHUB_OWNER || ''}/${env.GITHUB_REPO || ''}`,
        filePath: env.GITHUB_FILE_PATH || 'Chez_Lucette/data/menu.json'
      }, 200, headers);
    }

    if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405, headers);

    const suppliedPassword = request.headers.get('X-Admin-Password') || '';
    if (!env.ADMIN_PASSWORD || !constantTimeEqual(suppliedPassword, env.ADMIN_PASSWORD)) {
      return json({ error: 'Mot de passe incorrect' }, 401, headers);
    }

    let menu;
    try { menu = await request.json(); }
    catch { return json({ error: 'JSON invalide' }, 400, headers); }

    const validationError = validateMenu(menu);
    if (validationError) return json({ error: validationError }, 400, headers);

    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
      return json({ error: 'Configuration serveur incomplète' }, 500, headers);
    }

    const branch = env.GITHUB_BRANCH || 'main';
    const filePath = env.GITHUB_FILE_PATH || 'Chez_Lucette/data/menu.json';
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`;
    const ghHeaders = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': 'chez-lucette-menu-publisher'
    };

    const current = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers: ghHeaders });
    if (!current.ok) {
      const details = await current.text();
      return json({ error: `Lecture GitHub impossible (${current.status})`, details: details.slice(0, 300) }, 502, headers);
    }
    const currentFile = await current.json();

    const content = `${JSON.stringify(menu, null, 2)}\n`;
    const update = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'menu: mise à jour depuis l’administration Chez Lucette',
        content: toBase64Utf8(content),
        sha: currentFile.sha,
        branch
      })
    });

    const result = await update.json().catch(() => ({}));
    if (!update.ok) {
      return json({ error: `Commit GitHub impossible (${update.status})`, details: result.message || '' }, 502, headers);
    }

    return json({ ok: true, commit: result.commit?.sha || null }, 200, headers);
  }
};
