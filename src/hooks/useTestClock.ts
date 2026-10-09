import { useCallback, useState } from 'react';
import type { WorkSettings } from '../types/settings';
import { addDays, startOfDay, workIntervals } from '../lib/workCalendar';

/*
 * 테스트 모드용 가상 시계.
 * 실제 시각과 무관하게 "출근 직전"부터 시간을 배속으로 흘려보낸다.
 * 수익은 시각에서 계산되므로 가상 시각만 바꾸면 금액·진행률·캐릭터가 모두 따라 움직인다.
 * 저장 데이터는 건드리지 않는다.
 */

type Anchor = { sim: number; real: number; speed: number };

export const TEST_SPEEDS = [1, 60, 300, 1800];

/** 오늘(또는 다음 근무일) 출근 시각 */
function nextWorkDay(s: WorkSettings, now: number): number[] | null {
  for (let i = 0; i < 400; i++) {
    const intervals = workIntervals(s, addDays(startOfDay(now), i));
    if (intervals.length) return [intervals[0].start, intervals[intervals.length - 1].end];
  }
  return null;
}

export function useTestClock(settings: WorkSettings) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const simNow = useCallback(
    (real: number) => (anchor ? anchor.sim + (real - anchor.real) * anchor.speed : real),
    [anchor],
  );

  const start = useCallback(() => {
    const day = nextWorkDay(settings, Date.now());
    if (day) setAnchor({ sim: day[0] - 5_000, real: Date.now(), speed: 60 });
  }, [settings]);

  const stop = useCallback(() => setAnchor(null), []);

  const setSpeed = useCallback(
    (speed: number) => setAnchor((a) => a && { sim: a.sim + (Date.now() - a.real) * a.speed, real: Date.now(), speed }),
    [],
  );

  /** 가상 시각을 특정 시점으로 이동 */
  const jumpTo = useCallback(
    (sim: number) => setAnchor((a) => a && { ...a, sim, real: Date.now() }),
    [],
  );

  return { active: anchor !== null, speed: anchor?.speed ?? 1, simNow, start, stop, setSpeed, jumpTo };
}
