// Vercel serverless function — proxies requests to api.balldontlie.io with the
// secret API key injected from BDL_API_KEY (set in Vercel env vars).
//
// Why a proxy?
//  - Keeps the API key out of the client bundle.
//  - Lets the browser call same-origin /api/bdl/* without CORS hassle.
//
// Usage from the client:
//   fetch('/api/bdl/teams')             → forwards to GET v1/teams
//   fetch('/api/bdl/players?per_page=5') → forwards with query string preserved
//
// Catch-all routing: any path after /api/bdl/ becomes the upstream path.

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

// Cache successful responses in memory for the lifetime of the function
// container (Fluid Compute keeps instances warm). Cuts BDL quota burn for
// repeated team/roster lookups within a session.
type CacheEntry = { ts: number; body: unknown };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;          // 5 min

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.BDL_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'BDL_API_KEY not configured',
      hint: 'Sign up at app.balldontlie.io and add the key in Vercel env vars.',
    });
    return;
  }

  // Derive the upstream path. Vercel passes the catch-all segments via
  // req.query.path (array of strings). Anything else in the query string is
  // forwarded as-is.
  const pathParts = req.query.path;
  if (!pathParts) {
    res.status(400).json({ error: 'Missing path' });
    return;
  }
  const path = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

  // Rebuild the query string from req.url so things like `?per_page=10&team_ids[]=1`
  // survive intact. Drop the `path` synthetic param Vercel injected.
  const url = new URL(req.url ?? '/', 'http://localhost');
  url.searchParams.delete('path');
  const upstream = `${BASE}/${path}${url.search}`;

  const cacheKey = upstream;
  const hit = cache.get(cacheKey);
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

    cache.set(cacheKey, { ts: Date.now(), body });
    res.setHeader('x-bdl-cache', 'miss');
    // 60s browser/CDN cache — same data tier as our in-memory cache TTL.
    res.setHeader('cache-control', 'public, max-age=60, s-maxage=300');
    res.json(body);
  } catch (err) {
    res.status(502).json({
      error: 'BDL upstream fetch failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
