import type { Money } from '../lib/currency';
import type { WorkStatus } from '../lib/workCalendar';
import { CurrencyFlag } from './CurrencyFlag';

const MESSAGE: Partial<Record<WorkStatus, string>> = {
  before: '곧 출근이에요. 오늘도 화이팅!',
  after: '오늘 하루도 고생하셨어요. 푹 쉬세요.',
  off: '오늘은 쉬는 날이에요.',
};

function countdown(ms: number): { days: number; hms: string } {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hms = [Math.floor((total % 86_400) / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
  return { days, hms };
}

const nextStartLabel = (ts: number) => {
  const d = new Date(ts);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  return `${day} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

type Props = {
  nickname: string;
  status: WorkStatus;
  now: number;
  nextStartAt?: number;
  today: number;
  money: Money;
  onCycleCurrency: () => void;
};

/** 근무 시간이 아닐 때: 다음 출근까지 역카운트 */
export function ClockMode({ nickname, status, now, nextStartAt, today, money, onCycleCurrency }: Props) {
  const left = nextStartAt ? countdown(nextStartAt - now) : null;
  return (
    <section className="clockmode">
      <div className="income-label">
        {nickname ? `${nickname}님, ` : ''}
        {MESSAGE[status]}
      </div>
      {left ? (
        <>
          <div className="caption clockmode-label">출근까지</div>
          <div className="clockmode-time num">
            {left.days > 0 && <span className="clockmode-days">{left.days}일 </span>}
            {left.hms}
          </div>
          <div className="caption num">NEXT SHIFT · {nextStartLabel(nextStartAt!)}</div>
        </>
      ) : (
        <div className="clockmode-time">—</div>
      )}
      {today > 0 && (
        <button className="currency-switch" onClick={onCycleCurrency}>
          <CurrencyFlag code={money.code} />
          <span className="num clockmode-today">
            오늘 번 돈 {money.symbol}
            {money.amount(today)}
          </span>
        </button>
      )}
    </section>
  );
}
