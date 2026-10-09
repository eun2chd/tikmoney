import { clock, longDate } from '../lib/format';

export function Header({ now }: { now: number }) {
  const d = new Date(now);
  return (
    <header className="header">
      <div>
        <div className="brand">TIKMONEY</div>
        <div className="caption">YOUR TIME, YOUR MONEY</div>
      </div>
      <div className="header-right">
        <div className="clock num">{clock(d)}</div>
        <div className="caption">{longDate(d)}</div>
      </div>
    </header>
  );
}
