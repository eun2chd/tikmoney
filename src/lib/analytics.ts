/*
 * 방문 통계 수집 (배포 빌드에서만).
 * 개인정보는 보내지 않는다: 닉네임·연봉 등 설정값은 제외하고, 브라우저별 무작위 ID만 쓴다.
 * 체류 시간은 화면이 실제로 보이는 동안만 센다.
 */

const VID_KEY = 'tikmoney:vid';
export const NO_TRACK_KEY = 'tikmoney:notrack';
const PING_MS = 60_000;

const SEARCH_HOSTS: [RegExp, string][] = [
  [/(^|\.)naver\.com$/, 'naver'],
  [/(^|\.)google\./, 'google'],
  [/(^|\.)daum\.net$/, 'daum'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)zum\.com$/, 'zum'],
  [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)(kakao\.com|kakaocdn\.net)$/, 'kakao'],
  [/(^|\.)(instagram\.com)$/, 'instagram'],
  [/(^|\.)(facebook\.com|fb\.com)$/, 'facebook'],
  [/(^|\.)(x\.com|t\.co|twitter\.com)$/, 'x'],
  [/(^|\.)threads\.net$/, 'threads'],
  [/(^|\.)youtube\.com$/, 'youtube'],
];

const rid = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

function referrerInfo() {
  const params = new URLSearchParams(location.search);
  let src = params.get('utm_source') ?? '';
  // 검색엔진이 주소에 검색어를 넘겨줄 때만 잡힌다. 구글은 대부분 숨긴다
  let kw = params.get('utm_term') ?? '';
  let ref = '';
  try {
    if (document.referrer) {
      const u = new URL(document.referrer);
      if (u.host !== location.host) {
        ref = u.host + u.pathname;
        if (!src) src = SEARCH_HOSTS.find(([re]) => re.test(u.hostname))?.[1] ?? u.hostname;
        if (!kw) kw = u.searchParams.get('query') ?? u.searchParams.get('q') ?? u.searchParams.get('p') ?? '';
      }
    }
  } catch {
    /* 잘못된 referrer */
  }
  return { src: src || 'direct', kw, ref };
}

function device() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  return /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
}

function send(body: object, beacon = false) {
  const data = JSON.stringify(body);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([data], { type: 'application/json' }));
    return;
  }
  fetch('/api/track', { method: 'POST', body: data, keepalive: true }).catch(() => {});
}

export function startAnalytics() {
  if (!import.meta.env.PROD) return;
  let vid: string | null = null;
  let isNew = false;
  try {
    if (localStorage.getItem(NO_TRACK_KEY)) return; // 관리자 본인 기기는 집계에서 제외
    vid = localStorage.getItem(VID_KEY);
    if (!vid) {
      vid = rid();
      isNew = true;
      localStorage.setItem(VID_KEY, vid);
    }
  } catch {
    vid = rid();
  }

  const sid = rid();
  send({ t: 'start', sid, vid, isNew, path: location.pathname, dev: device(), ...referrerInfo() });

  // 보이는 동안의 시간만 쌓아 두었다가 주기적으로 / 숨겨질 때 보낸다
  let visibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
  let pending = 0;
  const collect = () => {
    if (visibleSince) {
      pending += Date.now() - visibleSince;
      visibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
    }
  };
  const flush = (beacon = false) => {
    collect();
    const add = Math.round(pending / 1000);
    if (add <= 0) return;
    pending -= add * 1000;
    send({ t: 'ping', sid, add }, beacon);
  };

  window.setInterval(() => document.visibilityState === 'visible' && flush(), PING_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true);
    else visibleSince = Date.now();
  });
  window.addEventListener('pagehide', () => flush(true));
}
