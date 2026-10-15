import { useCallback, useEffect, useState } from 'react';
import { LuLogOut, LuRefreshCw } from 'react-icons/lu';
import { NO_TRACK_KEY } from '../lib/analytics';

/*
 * 관리자 대시보드 (/admin). 코드 확인과 데이터 조회는 모두 /api/admin 이 한다.
 * 코드는 탭을 닫을 때까지만 sessionStorage에 둔다.
 */

const CODE_KEY = 'tikmoney:admin-code';
const REFRESH_MS = 30_000;

type Named = { name: string; count: number };
type Session = {
  visitor: string; start: number; last: number; dur: number;
  src: string; kw: string; ref: string; dev: string; isNew: boolean;
};
type Stats = {
  day: string;
  summary: { sessions: number; visitors: number; totalDur: number; avgDur: number; live: number };
  keywords: Named[];
  sources: Named[];
  hours: number[];
  trend: { day: string; sessions: number; visitors: number; avgDur: number }[];
  sessions: Session[];
};

const SRC_LABEL: Record<string, string> = {
  direct: '직접 접속', naver: '네이버', google: '구글', daum: '다음', bing: '빙', zum: '줌',
  kakao: '카카오', instagram: '인스타그램', facebook: '페이스북', x: 'X', threads: '스레드', youtube: '유튜브',
};
const DEV_LABEL: Record<string, string> = { mobile: '모바일', desktop: 'PC', tablet: '태블릿' };

function dur(sec: number) {
  if (sec < 60) return `${sec}초`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}시간 ${m}분` : `${m}분 ${sec % 60}초`;
}

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' });

const kstToday = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

function Login({ onLogin, error }: { onLogin: (code: string) => void; error: string }) {
  const [code, setCode] = useState('');
  return (
    <main className="admin admin-login">
      <form
        className="admin-login-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) onLogin(code.trim());
        }}
      >
        <div className="brand">TIKMONEY</div>
        <div className="caption">ADMIN</div>
        <label className="field">
          <span>관리자 코드</span>
          <input type="password" autoFocus value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={!code.trim()}>
          들어가기
        </button>
      </form>
    </main>
  );
}

/** 단일 계열 세로 막대. 마우스를 올리면 값이 뜬다 */
function Columns({ data, label }: { data: { key: string; value: number; tip: string }[]; label: (k: string, i: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="cols" role="img" aria-label={data.map((d) => d.tip).join(', ')}>
      {data.map((d, i) => (
        <div key={d.key} className="col" data-tip={d.tip}>
          <div className="col-bar" style={{ height: `${(d.value / max) * 100}%` }} />
          <span className="col-label">{label(d.key, i)}</span>
        </div>
      ))}
    </div>
  );
}

/** 순위 목록 + 가로 막대 */
function Ranking({ items, empty, format = (n: string) => n }: { items: Named[]; empty: string; format?: (n: string) => string }) {
  if (!items.length) return <p className="admin-empty">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ol className="rank">
      {items.map((it) => (
        <li key={it.name}>
          <span className="rank-name">{format(it.name)}</span>
          <span className="rank-bar">
            <span style={{ width: `${(it.count / max) * 100}%` }} />
          </span>
          <span className="rank-count num">{it.count.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}

export function Admin() {
  const [code, setCode] = useState(() => sessionStorage.getItem(CODE_KEY) ?? '');
  const [day, setDay] = useState(kstToday);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (c: string, d: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin?day=${d}`, { headers: { 'x-admin-code': c } });
        if (res.status === 401) {
          sessionStorage.removeItem(CODE_KEY);
          setCode('');
          setError('코드가 일치하지 않아요.');
          return;
        }
        const body = await res.json().catch(() => null);
        if (res.status === 503 && body?.reason === 'no-db') {
          setError('통계 저장소(Upstash Redis)가 아직 연결되지 않았어요. Vercel → Storage에서 연결해 주세요.');
        } else if (!res.ok || !body?.ok) {
          setError('통계를 불러오지 못했어요.');
        } else {
          setError('');
          setStats(body);
        }
        sessionStorage.setItem(CODE_KEY, c);
        // 관리자 기기의 방문은 통계에서 뺀다
        try {
          localStorage.setItem(NO_TRACK_KEY, '1');
        } catch {
          /* noop */
        }
      } catch {
        setError('서버에 연결하지 못했어요. (로컬 개발 서버에서는 API가 동작하지 않아요)');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    document.title = 'TIKMONEY 관리자';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
  }, []);

  useEffect(() => {
    if (!code) return;
    load(code, day);
    if (day !== kstToday()) return;
    const id = window.setInterval(() => load(code, day), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [code, day, load]);

  if (!code) return <Login onLogin={(c) => setCode(c)} error={error} />;

  const s = stats?.summary;
  const logout = () => {
    sessionStorage.removeItem(CODE_KEY);
    setCode('');
    setStats(null);
    setError('');
  };

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <div className="brand">TIKMONEY</div>
          <div className="caption">ADMIN DASHBOARD</div>
        </div>
        <div className="admin-tools">
          <input type="date" className="admin-date" value={day} max={kstToday()} onChange={(e) => e.target.value && setDay(e.target.value)} />
          <button className="btn ghost" onClick={() => load(code, day)} disabled={loading} aria-label="새로고침">
            <LuRefreshCw aria-hidden />
          </button>
          <button className="btn ghost" onClick={logout}>
            <LuLogOut aria-hidden /> 나가기
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {stats && s && (
        <>
          <section className="tiles">
            <div className="tile hero">
              <span className="tile-label">방문 수 (세션)</span>
              <span className="tile-value num">{s.sessions.toLocaleString()}</span>
            </div>
            <div className="tile">
              <span className="tile-label">순 방문자</span>
              <span className="tile-value num">{s.visitors.toLocaleString()}</span>
            </div>
            <div className="tile">
              <span className="tile-label">평균 체류 시간</span>
              <span className="tile-value num">{dur(s.avgDur)}</span>
            </div>
            <div className="tile">
              <span className="tile-label">총 체류 시간</span>
              <span className="tile-value num">{dur(s.totalDur)}</span>
            </div>
            <div className="tile">
              <span className="tile-label">지금 접속 중</span>
              <span className="tile-value num">{day === kstToday() ? s.live : '—'}</span>
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title">최근 14일 일일 접속량</h2>
            <Columns
              data={stats.trend.map((t) => ({
                key: t.day,
                value: t.sessions,
                tip: `${t.day.slice(5)} · 방문 ${t.sessions} · 순방문자 ${t.visitors} · 평균 ${dur(t.avgDur)}`,
              }))}
              label={(k) => k.slice(5).replace('-', '/')}
            />
          </section>

          <section className="panel">
            <h2 className="panel-title">시간대별 방문 ({stats.day})</h2>
            <Columns
              data={stats.hours.map((v, h) => ({ key: String(h), value: v, tip: `${h}시 · ${v}회` }))}
              label={(_, i) => (i % 3 === 0 ? `${i}시` : '')}
            />
          </section>

          <div className="panel-row">
            <section className="panel">
              <h2 className="panel-title">검색어</h2>
              <Ranking
                items={stats.keywords}
                empty="잡힌 검색어가 없어요. 구글은 검색어를 넘겨주지 않아서 Search Console에서 확인해야 해요."
              />
            </section>
            <section className="panel">
              <h2 className="panel-title">유입 경로</h2>
              <Ranking items={stats.sources} empty="아직 방문이 없어요." format={(n) => SRC_LABEL[n] ?? n} />
            </section>
          </div>

          <section className="panel">
            <h2 className="panel-title">방문 기록 (최근 {stats.sessions.length}건)</h2>
            {stats.sessions.length ? (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>접속</th>
                      <th>방문자</th>
                      <th>유입</th>
                      <th>검색어</th>
                      <th>기기</th>
                      <th className="r">체류</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.sessions.map((v, i) => (
                      <tr key={i}>
                        <td className="num">{time(v.start)}</td>
                        <td className="num">
                          {v.visitor} {v.isNew && <span className="tag">신규</span>}
                        </td>
                        <td title={v.ref}>{SRC_LABEL[v.src] ?? v.src}</td>
                        <td>{v.kw || '—'}</td>
                        <td>{DEV_LABEL[v.dev] ?? v.dev}</td>
                        <td className="num r">{dur(v.dur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty">아직 방문이 없어요.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
