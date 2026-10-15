import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData } from '../types/settings';
import { Header } from '../components/Header';
import { IncomeDisplay } from '../components/IncomeDisplay';
import { WorkSummary } from '../components/WorkSummary';
import { OfficeScene } from '../components/OfficeScene';
import { TestBar } from '../components/TestBar';
import { Farewell } from '../components/Farewell';
import { ClockMode } from '../components/ClockMode';
import { Credits } from '../components/Credits';
import { useNow } from '../hooks/useNow';
import { useIncome } from '../hooks/useIncome';
import { useWakeLock } from '../hooks/useWakeLock';
import { useTestClock } from '../hooks/useTestClock';
import { earnedFromPeriods } from '../lib/income';
import { startOfDay } from '../lib/workCalendar';
import { LuPlay, LuSettings, LuUser } from 'react-icons/lu';
import { CURRENCY_CODES, DEFAULT_PREFS, makeMoney, type DisplayPrefs } from '../lib/currency';

const SHOW_TEST_MODE =
  import.meta.env.DEV &&
  /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);

type Props = { data: AppData; onOpenSettings: () => void; onChangePrefs: (p: DisplayPrefs) => void };

export function Dashboard({ data, onOpenSettings, onChangePrefs }: Props) {
  const settings = data.periods[data.periods.length - 1].settings;
  const prefs = data.prefs ?? DEFAULT_PREFS;
  const money = makeMoney(prefs);
  const cycleCurrency = () =>
    onChangePrefs({
      ...prefs,
      currency: CURRENCY_CODES[(CURRENCY_CODES.indexOf(prefs.currency) + 1) % CURRENCY_CODES.length],
    });
  const clock = useTestClock(settings);
  // 배포 빌드에서는 테스트 모드를 강제로 끈다 (SHOW_TEST_MODE가 상수 false가 되어 테스트 UI 코드가 번들에서 빠짐)
  const test = SHOW_TEST_MODE ? clock : { ...clock, active: false, speed: 1, simNow: (t: number) => t };
  // 배속 중에는 숫자가 끊겨 보이지 않도록 더 자주 갱신
  const realNow = useNow(test.active && test.speed > 1 ? 200 : 1000);
  const now = test.simNow(realNow);
  const income = useIncome(data, now);
  const { today, perSecond, day } = income;
  // 테스트 모드의 누적 수익 = 실제 어제까지의 누적 + 가상 하루
  const total = test.active ? earnedFromPeriods(data.periods, 0, startOfDay(realNow)) + today : income.total;
  useWakeLock();

  // 근무 중 → 퇴근으로 바뀌는 순간 인사 화면을 띄운다
  const [farewell, setFarewell] = useState(false);
  const closeFarewell = useCallback(() => setFarewell(false), []);
  const [credits, setCredits] = useState(false);
  const closeCredits = useCallback(() => setCredits(false), []);
  const prevStatus = useRef(day.status);
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = day.status;
    if (day.status === 'after' && (prev === 'working' || prev === 'break')) setFarewell(true);
  }, [day.status]);
  useEffect(() => {
    if (!test.active) setFarewell(false);
  }, [test.active]);

  return (
    <main className={`dashboard ${test.active ? 'is-test' : ''}`}>
      <Header now={now} />
      <div className="center">
        {day.status === 'working' || day.status === 'break' ? (
          <IncomeDisplay
            nickname={settings.nickname}
            today={today}
            perSecond={perSecond}
            status={day.status}
            day={day}
            now={now}
            money={money}
            onCycleCurrency={cycleCurrency}
          />
        ) : (
          <ClockMode
            nickname={settings.nickname}
            status={day.status}
            now={now}
            nextStartAt={day.nextStartAt}
            today={today}
            money={money}
            onCycleCurrency={cycleCurrency}
          />
        )}
        <WorkSummary
          total={total}
          since={data.periods[0].from}
          month={settings.payBasis === 'monthly' ? income.month : undefined}
          day={day} now={now} money={money} hideTotal={prefs.hideTotal} />
      </div>
      <OfficeScene status={day.status} />
      <footer className="footer">
        <span className="caption">TIKMONEY v1.0</span>
        {SHOW_TEST_MODE && test.active ? (
          <TestBar test={test} day={day} now={now} />
        ) : (
          <div className="footer-links">
            {/* 테스트 모드는 로컬에서 띄운 개발 서버에서만 노출. 배포 도메인에서는 dev 서버여도 숨긴다 */}
            {SHOW_TEST_MODE && (
              <button className="link" onClick={test.start}>
                <LuPlay aria-hidden /> TEST MODE
              </button>
            )}
            <button className="link" onClick={onOpenSettings}>
              <LuSettings aria-hidden /> SETTINGS
            </button>
            <button className="link" onClick={() => setCredits(true)}>
              <LuUser aria-hidden /> MADE BY
            </button>
          </div>
        )}
      </footer>
      {credits && <Credits onClose={closeCredits} />}
      {farewell && (
        <Farewell
          nickname={settings.nickname}
          today={today}
          workedMs={day.workedMs}
          money={money}
          onClose={closeFarewell}
        />
      )}
    </main>
  );
}
