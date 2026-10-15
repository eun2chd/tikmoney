/*
 * Upstash Redis REST 클라이언트 (패키지 없이 fetch만 사용).
 * Vercel 대시보드 → Storage → Upstash(Redis) 연결 시 아래 환경변수가 자동으로 들어온다.
 * 파일명이 _로 시작하면 Vercel이 API 엔드포인트로 만들지 않는다.
 */

const URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasRedis = Boolean(URL && TOKEN);

type Cmd = (string | number)[];

/** 여러 명령을 한 번에 보낸다. 결과는 명령 순서대로 */
export async function pipeline(cmds: Cmd[]): Promise<unknown[]> {
  if (!cmds.length) return [];
  const res = await fetch(`${URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cmds),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => r.result ?? null);
}

/** 한국 시간 기준 날짜 "YYYY-MM-DD" */
export function kstDay(ms = Date.now()): string {
  return new Date(ms + 9 * 3600_000).toISOString().slice(0, 10);
}

export function kstHour(ms = Date.now()): number {
  return new Date(ms + 9 * 3600_000).getUTCHours();
}

/** 통계 키 보관 기간 */
export const TTL = 120 * 86400;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
