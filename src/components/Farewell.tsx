import { useEffect } from 'react';
import type { Money } from '../lib/currency';
import { duration } from '../lib/format';
import { CurrencyFlag } from './CurrencyFlag';

type Props = { nickname: string; today: number; workedMs: number; money: Money; onClose: () => void };

/** 퇴근 인사. 잠시 보여준 뒤 자동으로 닫혀 시계 모드로 넘어간다 */
export function Farewell({ nickname, today, workedMs, money, onClose }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 10_000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="farewell" onClick={onClose}>
      <div className="farewell-card">
        <div className="caption">OFF WORK</div>
        <h2 className="farewell-title">
          {nickname ? `${nickname}님, ` : ''}오늘 하루도
          <br />
          고생 많으셨어요.
        </h2>
        <div className="farewell-amount num">
          {money.symbol}
          {money.amount(today)}
        </div>
        <CurrencyFlag code={money.code} />
        <p className="caption num">오늘 {duration(workedMs)} 일하고 번 돈 · 내일 또 만나요</p>
        <p className="caption farewell-hint">잠시 후 시계 모드로 전환됩니다 · 화면을 누르면 바로 닫혀요</p>
      </div>
    </div>
  );
}
