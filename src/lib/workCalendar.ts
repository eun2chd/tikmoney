import type { WorkSettings } from '../types/settings';

export type Interval = { start: number; end: number };

const DAY_MS = 86_400_000;

export function parseHHmm(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return ((h || 0) * 60 + (m || 0)) * 60_000;
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 로컬 자정 기준으로 n일 이동 (DST 안전) */
export function addDays(dayStart: number, n: number): number {
  const d = new Date(dayStart);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/** 하루 실근무 시간(ms) = 출근~퇴근 - 휴게 */
export function dailyWorkMs(s: WorkSettings): number {
  let span = parseHHmm(s.workEnd) - parseHHmm(s.workStart);
  if (span <= 0) span += DAY_MS;
  return Math.max(0, span - s.breakMinutes * 60_000);
}

export function isWorkDay(s: WorkSettings, dayStart: number): boolean {
  const d = new Date(dayStart);
  return s.workDays.includes(d.getDay()) && !s.holidays.includes(dateKey(d));
}

/**
 * dayStart 날짜에 "출근"하는 근무의 수익 인정 구간.
 * 야간 근무면 구간이 다음 날로 넘어갈 수 있다.
 */
export function workIntervals(s: WorkSettings, dayStart: number): Interval[] {
  if (!isWorkDay(s, dayStart)) return [];
  const startOff = parseHHmm(s.workStart);
  let endOff = parseHHmm(s.workEnd);
  if (endOff <= startOff) endOff += DAY_MS;
  const start = dayStart + startOff;
  const end = dayStart + endOff;

  const breakMs = s.breakMinutes * 60_000;
  if (breakMs <= 0) return [{ start, end }];

  let bOff = parseHHmm(s.breakStart);
  if (bOff < startOff) bOff += DAY_MS;
  const bStart = Math.min(Math.max(dayStart + bOff, start), end);
  const bEnd = Math.min(bStart + breakMs, end);
  // 휴게가 퇴근 시각을 넘기면 넘친 만큼 근무 시작 쪽에서 빼서 실근무 시간을 일정하게 유지
  const overflow = breakMs - (bEnd - bStart);
  return [
    { start, end: bStart - overflow },
    { start: bEnd, end },
  ].filter((i) => i.end > i.start);
}

function overlap(a: Interval, from: number, to: number): number {
  return Math.max(0, Math.min(a.end, to) - Math.max(a.start, from));
}

/** [from, to) 구간 중 근무로 인정되는 시간(ms)을 날짜별로 콜백 */
export function forEachWorkedMs(
  s: WorkSettings,
  from: number,
  to: number,
  cb: (dayStart: number, ms: number) => void,
): void {
  if (to <= from) return;
  // 전날 야간 근무가 from 이후로 이어질 수 있으므로 하루 전부터 확인
  for (let day = addDays(startOfDay(from), -1); day < to; day = addDays(day, 1)) {
    let ms = 0;
    for (const i of workIntervals(s, day)) ms += overlap(i, from, to);
    if (ms > 0) cb(day, ms);
  }
}

export function workDaysInYear(s: WorkSettings, year: number): number {
  let count = 0;
  for (let day = new Date(year, 0, 1).getTime(); new Date(day).getFullYear() === year; day = addDays(day, 1)) {
    if (isWorkDay(s, day)) count++;
  }
  return count;
}

export type WorkStatus = 'before' | 'working' | 'break' | 'after' | 'off';

export type DayInfo = {
  status: WorkStatus;
  /** 오늘 근무 구간 (휴무면 빈 배열) */
  intervals: Interval[];
  /** 오늘 예정된 실근무 시간 */
  scheduledMs: number;
  /** 지금까지 오늘 근무한 시간 */
  workedMs: number;
  /** 퇴근 시각 (근무일일 때만) */
  endAt?: number;
  /** 다음 출근 시각 */
  nextStartAt?: number;
};

export function dayInfo(s: WorkSettings, now: number): DayInfo {
  // 아직 끝나지 않은 전날 야간 근무가 있으면 그 근무를 "오늘"로 본다
  const today = startOfDay(now);
  const prev = workIntervals(s, addDays(today, -1));
  const activeDay = prev.length && prev[prev.length - 1].end > now ? addDays(today, -1) : today;
  const intervals = workIntervals(s, activeDay);

  let nextStartAt: number | undefined;
  for (let i = 0; i < 400 && nextStartAt === undefined; i++) {
    const first = workIntervals(s, addDays(today, i))[0];
    if (first && first.start > now) nextStartAt = first.start;
  }

  if (!intervals.length) {
    return { status: 'off', intervals, scheduledMs: 0, workedMs: 0, nextStartAt };
  }

  const scheduledMs = intervals.reduce((sum, i) => sum + (i.end - i.start), 0);
  const workedMs = intervals.reduce((sum, i) => sum + overlap(i, -Infinity, now), 0);
  const first = intervals[0];
  const last = intervals[intervals.length - 1];

  let status: WorkStatus;
  if (now < first.start) status = 'before';
  else if (now >= last.end) status = 'after';
  else if (intervals.some((i) => now >= i.start && now < i.end)) status = 'working';
  else status = 'break';

  return { status, intervals, scheduledMs, workedMs, endAt: last.end, nextStartAt };
}
