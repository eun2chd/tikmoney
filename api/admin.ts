import { hasRedis, json, kstDay, pipeline } from './_redis.js';

/*
 * 관리자 대시보드 데이터. 헤더 x-admin-code 가 일치해야 응답한다.
 * 코드는 서버에서만 비교하므로 사이트 JS 번들에는 들어가지 않는다.
 * Vercel 환경변수 ADMIN_CODE 로 바꿀 수 있다.
 */

const ADMIN_CODE = process.env.ADMIN_CODE || 'ADMIN-1234';
const TREND_DAYS = 14;
const RECENT_LIMIT = 100;
/** 마지막 신호가 이 시간 안이면 "지금 접속 중" */
const LIVE_MS = 3 * 60_000;

/** ["a", "3", "b", "1"] → [{ name: "a", count: 3 }, ...] */
function pairs(r: unknown): { name: string; count: number }[] {
  const a = (r as string[] | null) ?? [];
  const out = [];
  for (let i = 0; i < a.length; i += 2) out.push({ name: a[i], count: Number(a[i + 1]) });
  return out;
}

function hash(r: unknown): Record<string, string> {
  const a = (r as string[] | null) ?? [];
  const o: Record<string, string> = {};
  for (let i = 0; i < a.length; i += 2) o[a[i]] = a[i + 1];
  return o;
}

export async function GET(req: Request): Promise<Response> {
  if (req.headers.get('x-admin-code') !== ADMIN_CODE) return json({ ok: false }, 401);
  if (!hasRedis) return json({ ok: false, reason: 'no-db' }, 503);

  const qDay = new URL(req.url).searchParams.get('day');
  const day = qDay && /^\d{4}-\d{2}-\d{2}$/.test(qDay) ? qDay : kstDay();
  const base = Date.parse(`${day}T00:00:00+09:00`);
  const trendDays = Array.from({ length: TREND_DAYS }, (_, i) => kstDay(base - (TREND_DAYS - 1 - i) * 86400_000));

  const [sessCount, visCount, durTotal, kw, src, hour, recentIds, ...trendRaw] = await pipeline([
    ['ZCARD', `tm:sess:${day}`],
    ['SCARD', `tm:vis:${day}`],
    ['GET', `tm:dur:${day}`],
    ['ZRANGE', `tm:kw:${day}`, 0, 29, 'REV', 'WITHSCORES'],
    ['ZRANGE', `tm:src:${day}`, 0, 19, 'REV', 'WITHSCORES'],
    ['HGETALL', `tm:hour:${day}`],
    ['ZRANGE', `tm:sess:${day}`, 0, RECENT_LIMIT - 1, 'REV'],
    ...trendDays.flatMap((d) => [
      ['ZCARD', `tm:sess:${d}`],
      ['SCARD', `tm:vis:${d}`],
      ['GET', `tm:dur:${d}`],
    ]),
  ]);

  const ids = (recentIds as string[] | null) ?? [];
  const recentRaw = await pipeline(ids.map((id) => ['HGETALL', `tm:s:${id}`]));
  const now = Date.now();
  const sessions = recentRaw.map((r) => {
    const h = hash(r);
    return {
      visitor: (h.vid ?? '').slice(0, 8),
      start: Number(h.start),
      last: Number(h.last),
      dur: Number(h.dur) || 0,
      src: h.src ?? '',
      kw: h.kw ?? '',
      ref: h.ref ?? '',
      dev: h.dev ?? '',
      isNew: h.new === '1',
    };
  });

  const hours = Array.from({ length: 24 }, (_, i) => Number(hash(hour)[i] ?? 0));
  const sessionsN = Number(sessCount) || 0;
  const totalDur = Number(durTotal) || 0;

  return json({
    ok: true,
    day,
    summary: {
      sessions: sessionsN,
      visitors: Number(visCount) || 0,
      totalDur,
      avgDur: sessionsN ? Math.round(totalDur / sessionsN) : 0,
      live: sessions.filter((s) => now - s.last < LIVE_MS).length,
    },
    keywords: pairs(kw),
    sources: pairs(src),
    hours,
    trend: trendDays.map((d, i) => {
      const s = Number(trendRaw[i * 3]) || 0;
      const dur = Number(trendRaw[i * 3 + 2]) || 0;
      return { day: d, sessions: s, visitors: Number(trendRaw[i * 3 + 1]) || 0, avgDur: s ? Math.round(dur / s) : 0 };
    }),
    sessions,
  });
}
