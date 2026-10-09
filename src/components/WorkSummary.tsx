import { useEffect, useState } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { duration } from '../lib/format';
import type { Money } from '../lib/currency';
import type { MonthInfo } from '../lib/income';
import type { DayInfo } from '../lib/workCalendar';

type Props = {
  total: number;
  /** 누적 시작 시각 (최초 설정한 날 0시) */
  since: number;
  /** 월급 기준일 때만: 이번 달 수익 */
  month?: MonthInfo;
  day: DayInfo;
  now: number;
  money: Money;
  hideTotal?: boolean;
};

/*
 * 수익 기준
 * - 오늘 수익: 오늘 0시부터 지금까지 인정된 근무 시간의 수익 (큰 숫자)
 * - 누적 수익(연봉 기준): 처음 설정한 날 0시부터 지금까지의 합계. 오늘 수익을 포함한다.
 *   그래서 첫날에는 두 값이 같고, 다음 근무일부터 누적이 앞서 나간다.
 * - 이번 달 수익(월급 기준): 이번 달 1일부터 지금까지의 합계. 말일 퇴근 시각에 월급과 같아진다.
 */
const mmdd = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

function paydayLabel(payday: number, now: number): string {
  const days = Math.round((payday - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days > 0) return `월급날 D-${days}`;
  if (days === 0) return '오늘 월급날!';
  return `월급날 ${mmdd(payday)} 지남`;
}

const REVEAL_MS = 5_000;

export function WorkSummary({ total, since, month, day, now, money, hideTotal }: Props) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!revealed) return;
    const t = window.setTimeout(() => setRevealed(false), REVEAL_MS);
    return () => clearTimeout(t);
  }, [revealed]);
  const masked = hideTotal && !revealed;

  const progress = day.scheduledMs ? Math.min(1, day.workedMs / day.scheduledMs) : 0;

  let remainLabel = '퇴근까지';
  let remain = '—';
  if (day.status === 'working' || day.status === 'break') {
    remain = duration(day.endAt! - now);
  } else if (day.nextStartAt) {
    remainLabel = '출근까지';
    remain = duration(day.nextStartAt - now);
  }

  const first = month
    ? {
        label: '이번 달 수익',
        value: money.compact(month.earned),
        sub: [
          `월급의 ${month.salary ? Math.floor((month.earned / month.salary) * 100) : 0}%`,
          month.payday !== undefined && paydayLabel(month.payday, now),
        ]
          .filter(Boolean)
          .join(' · '),
      }
    : { label: '누적 수익', value: money.compact(total), sub: `${mmdd(since)}부터` };

  return (
    <section className="summary">
      {hideTotal ? (
        <button className="stat stat-secret" onClick={() => setRevealed((r) => !r)}>
          <div className="stat-label">
            {first.label} {masked ? <LuEyeOff aria-hidden /> : <LuEye aria-hidden />}
          </div>
          <div className="stat-value num">{masked ? '••••••' : first.value}</div>
          <div className="stat-sub num">{masked ? '탭하면 5초간 보여요' : first.sub}</div>
        </button>
      ) : (
        <div className="stat">
          <div className="stat-label">{first.label}</div>
          <div className="stat-value num">{first.value}</div>
          <div className="stat-sub num">{first.sub}</div>
        </div>
      )}
      <div className="stat">
        <div className="stat-label">근무 진행률</div>
        <div className="stat-value num">{Math.floor(progress * 100)}%</div>
        <div className="bar">
          <div className="bar-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
      <div className="stat">
        <div className="stat-label">{remainLabel}</div>
        <div className="stat-value num">{remain}</div>
      </div>
    </section>
  );
}
