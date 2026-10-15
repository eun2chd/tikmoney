import { createClient } from 'redis';

/*
 * 통계 저장소 연결.
 *  - REDIS_URL (Vercel 마켓플레이스의 Redis Cloud 연결 시 자동 설정) → TCP 접속
 *  - KV_REST_API_URL/TOKEN 또는 UPSTASH_REDIS_REST_URL/TOKEN (Upstash) → REST
 * 파일명이 _로 시작하면 Vercel이 API 엔드포인트로 만들지 않는다.
 */

const TCP_URL = process.env.REDIS_URL;
const REST_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasRedis = Boolean(TCP_URL || (REST_URL && REST_TOKEN));

type Cmd = (string | number)[];
type Client = ReturnType<typeof createClient>;

// 함수 인스턴스가 살아 있는 동안 연결을 재사용한다
let connecting: Promise<Client> | null = null;

function tcpClient(): Promise<Client> {
  if (!connecting) {
    const client = createClient({ url: TCP_URL, socket: { connectTimeout: 5000 } });
    client.on('error', () => {
      // 끊기면 다음 요청에서 새로 연결
      connecting = null;
    });
    connecting = client.connect().catch((e) => {
      connecting = null;
      throw e;
    });
  }
  return connecting;
}

/** 여러 명령을 한 번에 보낸다. 결과는 명령 순서대로 */
export async function pipeline(cmds: Cmd[]): Promise<unknown[]> {
  if (!cmds.length) return [];
  if (TCP_URL) {
    const client = await tcpClient();
    // 같은 틱에 보낸 명령은 node-redis가 자동으로 파이프라인 처리한다
    return Promise.all(cmds.map((c) => client.sendCommand(c.map(String)) as Promise<unknown>));
  }
  const res = await fetch(`${REST_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
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
