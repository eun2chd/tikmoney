import type { Money } from '../lib/currency';
import { CurrencyFlag } from './CurrencyFlag';
import { LuRefreshCw } from 'react-icons/lu';
import type { DayInfo, WorkStatus } from '../lib/workCalendar';
import { duration } from '../lib/format';

const STATUS_LABEL: Record<WorkStatus, string> = {
  before: '출근 전',
  working: '근무 중',
  break: '휴게 중',
  after: '퇴근',
  off: '휴무일',
};

const hhmm = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 지금 돈이 왜 오르는지(또는 왜 멈췄는지)와 다음 전환 시점 */
function reason(day: DayInfo, now: number): { text: string; next?: string } {
  const { intervals } = day;
  if (day.status === 'working') {
    const i = intervals.findIndex((iv) => now >= iv.start && now < iv.end);
    const hasBreakNext = i >= 0 && i < intervals.length - 1;
    const until = intervals[i]?.end ?? day.endAt!;
    return {
      text: '',
      next: `${hasBreakNext ? '휴게' : '퇴근'} ${hhmm(until)} · ${duration(until - now)} 남음`,
    };
  }
  if (day.status === 'break') {
    const resume = intervals.find((iv) => iv.start > now)?.start;
    return {
      text: '휴게시간이라 수익이 잠시 멈췄어요',
      next: resume ? `${hhmm(resume)}에 다시 시작 · ${duration(resume - now)} 후` : undefined,
    };
  }
  return { text: '' };
}

type Props = {
  nickname: string;
  today: number;
  perSecond: number;
  status: WorkStatus;
  day: DayInfo;
  now: number;
  money: Money;
  onCycleCurrency: () => void;
};

export function IncomeDisplay({ nickname, today, perSecond, status, day, now, money, onCycleCurrency }: Props) {
  const earning = status === 'working';
  const why = reason(day, now);
  return (
    <section className="income">
      <div className="income-label">
        {nickname ? `${nickname}님이 ` : ''}오늘 번 돈
        <span className={`status ${earning ? 'is-on' : ''}`}>{STATUS_LABEL[status]}</span>
      </div>
      <button className="income-amount num" onClick={onCycleCurrency} title="탭하면 통화가 바뀝니다">
        <span className="currency">{money.symbol}</span>
        {money.amount(today)}
      </button>
      <button className="currency-switch" onClick={onCycleCurrency}>
        <CurrencyFlag code={money.code} />
        <LuRefreshCw aria-hidden />
      </button>
      <div className={`income-rate num ${earning ? '' : 'is-paused'}`}>
        초당 +{money.small(perSecond)}
        {!earning && ' · 일시정지'}
      </div>
      {(why.text || why.next) && (
        <div className="reason">
          {why.text && <span className={earning ? 'reason-text is-on' : 'reason-text'}>{why.text}</span>}
          {why.next && <span className="reason-next num">{why.next}</span>}
        </div>
      )}
    </section>
  );
}
