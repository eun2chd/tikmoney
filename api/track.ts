import { TTL, hasRedis, json, kstDay, kstHour, pipeline } from './_redis.js';

/*
 * 방문 기록.
 *  start: 페이지 진입. 세션 생성 + 일별 방문자/검색어/유입경로/시간대 집계
 *  ping : 체류 시간 누적. 화면을 보고 있는 동안 주기적으로, 그리고 떠날 때 sendBeacon으로 온다
 */

const BOT = /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|kakaotalk-scrap|yeti|lighthouse/i;
const ID = /^[a-z0-9-]{8,40}$/i;

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export async function POST(req: Request): Promise<Response> {
  if (!hasRedis) return json({ ok: false, reason: 'no-db' }, 503);
  if (BOT.test(req.headers.get('user-agent') ?? '')) return json({ ok: true, skipped: 'bot' });

  let b: Record<string, unknown>;
  try {
    b = JSON.parse(await req.text());
  } catch {
    return json({ ok: false }, 400);
  }
  const sid = clip(b.sid, 40);
  if (!ID.test(sid)) return json({ ok: false }, 400);
  const sKey = `tm:s:${sid}`;
  const now = Date.now();

  if (b.t === 'start') {
    const vid = clip(b.vid, 40);
    if (!ID.test(vid)) return json({ ok: false }, 400);
    const day = kstDay(now);
    const src = clip(b.src, 40) || 'direct';
    const kw = clip(b.kw, 60).toLowerCase();
    const cmds: (string | number)[][] = [
      ['HSET', sKey, 'vid', vid, 'day', day, 'start', now, 'last', now, 'dur', 0, 'src', src, 'kw', kw,
        'ref', clip(b.ref, 200), 'dev', clip(b.dev, 20), 'path', clip(b.path, 100), 'new', b.isNew ? 1 : 0],
      ['EXPIRE', sKey, TTL],
      ['ZADD', `tm:sess:${day}`, now, sid],
      ['SADD', `tm:vis:${day}`, vid],
      ['ZINCRBY', `tm:src:${day}`, 1, src],
      ['HINCRBY', `tm:hour:${day}`, kstHour(now), 1],
    ];
    if (kw) cmds.push(['ZINCRBY', `tm:kw:${day}`, 1, kw]);
    for (const k of ['sess', 'vis', 'src', 'hour', 'kw']) cmds.push(['EXPIRE', `tm:${k}:${day}`, TTL]);
    await pipeline(cmds);
    return json({ ok: true });
  }

  if (b.t === 'ping') {
    // 한 번에 인정하는 체류 시간은 최대 2분 (조작·오류 방지)
    const add = Math.max(0, Math.min(120, Math.round(Number(b.add) || 0)));
    const [day] = (await pipeline([['HGET', sKey, 'day']])) as (string | null)[];
    if (!day || !add) return json({ ok: true });
    await pipeline([
      ['HINCRBY', sKey, 'dur', add],
      ['HSET', sKey, 'last', now],
      ['INCRBY', `tm:dur:${day}`, add],
      ['EXPIRE', `tm:dur:${day}`, TTL],
    ]);
    return json({ ok: true });
  }

  return json({ ok: false }, 400);
}
