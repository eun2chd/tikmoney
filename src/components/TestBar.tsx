import type { useTestClock } from '../hooks/useTestClock';
import { TEST_SPEEDS } from '../hooks/useTestClock';
import { LuRotateCcw, LuSkipForward, LuSquare } from 'react-icons/lu';
import type { DayInfo } from '../lib/workCalendar';

type Props = { test: ReturnType<typeof useTestClock>; day: DayInfo; now: number };

/** 테스트 모드 조작부. 점프는 배속 기준 약 10초 전으로 이동해 전환 순간을 볼 수 있게 한다. */
export function TestBar({ test, day, now }: Props) {
  const lead = 10_000 * test.speed;
  const [first, second] = day.intervals;
  const jumps = [
    second && first.end > now && { label: '휴게 직전', at: first.end - lead },
    day.endAt && day.endAt > now && { label: '퇴근 직전', at: day.endAt - lead },
    (day.status === 'after' || day.status === 'off') &&
      day.nextStartAt && { label: '출근 직전', at: day.nextStartAt - lead },
  ].filter(Boolean) as { label: string; at: number }[];

  return (
    <div className="testbar">
      <span className="test-badge">TEST</span>
      {TEST_SPEEDS.map((s) => (
        <button key={s} className={`test-btn ${test.speed === s ? 'on' : ''}`} onClick={() => test.setSpeed(s)}>
          ×{s}
        </button>
      ))}
      {jumps.map((j) => (
        <button key={j.label} className="test-btn" onClick={() => test.jumpTo(Math.max(now, j.at))}>
          <LuSkipForward aria-hidden /> {j.label}
        </button>
      ))}
      <button className="test-btn" onClick={test.start}>
        <LuRotateCcw aria-hidden /> 처음부터
      </button>
      <button className="test-btn strong" onClick={test.stop}>
        <LuSquare aria-hidden /> 종료
      </button>
    </div>
  );
}
