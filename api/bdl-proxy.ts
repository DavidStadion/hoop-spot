// Single Vercel function that proxies BallDontLie requests.
// Routed via vercel.json: /api/bdl/<anything> → /api/bdl-proxy?path=<anything>

export const config = { runtime: 'nodejs' };

type VercelRequest = {
  url?: string;
  method?: string;
  query: Record<string, string | string[]>;
};
type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: unknown) => void;
  json: (body: unknown) => void;
};

const BASE = 'https://api.balldontlie.io/v1';

type CacheEntry = { ts: number; body: unknown };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.BDL_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'BDL_API_KEY not configured',
      hint: 'Sign up at app.balldontlie.io and add the key in Vercel env vars.',
    });
    return;
  }

  // The rewrite passes the rest of the URL via the `path` query param.
  const rawPath = req.query.path;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : (rawPath ?? '');
  if (!path) {
    res.status(400).json({ error: 'Missing path' });
    return;
  }

  // Forward every other query param to BDL.
  const url = new URL(req.url ?? '/', 'http://localhost');
  url.searchParams.delete('path');
  const upstream = `${BASE}/${path}${url.search}`;

  const hit = cache.get(upstream);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    res.setHeader('x-bdl-cache', 'hit');
    res.json(hit.body);
    return;
  }

  try {
    const upstreamRes = await fetch(upstream, {
      headers: { Authorization: apiKey },
    });
    const body = await upstreamRes.json();
    if (!upstreamRes.ok) {
      res.status(upstreamRes.status).json(body);
      return;
    }
    cache.set(upstream, { ts: Date.now(), body });
    res.setHeader('x-bdl-cache', 'miss');
    res.setHeader('cache-control', 'public, max-age=60, s-maxage=300');
    res.json(body);
  } catch (err) {
    res.status(502).json({
      error: 'BDL upstream fetch failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
