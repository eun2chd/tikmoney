import type { SettingsPeriod, WorkSettings } from '../types/settings';
import { addDays, forEachWorkedMs, startOfDay, workIntervals } from './workCalendar';

/*
 * 계산 기준 (WorkSettings.payBasis)
 * - annual(기본): 해당 연도 전체 근무 예정 시간으로 연봉을 나눠 시급을 정한다.
 *   한 해를 다 일하면 정확히 연봉이 된다. 달마다 근무일 수가 달라 월 합계는 조금씩 다르다.
 * - monthly: 그달 근무 예정 시간으로 월급(연봉÷12)을 나눠 시급을 정한다.
 *   그달을 다 일하면 정확히 월급이 된다. 근무일이 적은 달은 시급이 조금 높다.
 * - 공휴일을 휴무로 지정해도 총액은 변하지 않고, 근무일의 시급이 올라간다.
 * - 금액은 setInterval 누적이 아니라 기준 시각부터 인정된 근무 시간을 매번 다시 계산해서 얻는다.
 * - 시급은 근무가 "시작된 날"이 속한 연도/월을 기준으로 한다 (야간 근무가 자정을 넘어도 같은 시급).
 */

export function monthStart(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function nextMonthStart(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

/** [fromDay, toDay) 사이에 시작하는 근무의 예정 시간 합 */
function scheduledMs(s: WorkSettings, fromDay: number, toDay: number): number {
  let total = 0;
  for (let day = fromDay; day < toDay; day = addDays(day, 1)) {
    for (const i of workIntervals(s, day)) total += i.end - i.start;
  }
  return total;
}

const rateCache = new WeakMap<WorkSettings, Map<string, number>>();

/** day(그날 0시)에 시작한 근무의 원/ms */
export function rateForDay(s: WorkSettings, day: number): number {
  const monthly = s.payBasis === 'monthly';
  const d = new Date(day);
  const key = monthly ? `${d.getFullYear()}-${d.getMonth()}` : String(d.getFullYear());
  let cache = rateCache.get(s);
  if (!cache) rateCache.set(s, (cache = new Map()));
  let rate = cache.get(key);
  if (rate === undefined) {
    const total = monthly
      ? scheduledMs(s, monthStart(day), nextMonthStart(day))
      : scheduledMs(s, new Date(d.getFullYear(), 0, 1).getTime(), new Date(d.getFullYear() + 1, 0, 1).getTime());
    const pay = monthly ? s.annualSalary / 12 : s.annualSalary;
    rate = total > 0 ? pay / total : 0;
    cache.set(key, rate);
  }
  return rate;
}

export function earnedBetween(s: WorkSettings, from: number, to: number): number {
  let total = 0;
  forEachWorkedMs(s, from, to, (day, ms) => {
    total += ms * rateForDay(s, day);
  });
  return total;
}

/** 설정 이력 전체를 기준으로 [from, to) 동안 번 돈 */
export function earnedFromPeriods(periods: SettingsPeriod[], from: number, to: number): number {
  let total = 0;
  for (const p of periods) {
    const a = Math.max(from, p.from);
    const b = Math.min(to, p.to ?? to);
    if (b > a) total += earnedBetween(p.settings, a, b);
  }
  return total;
}

export type MonthInfo = {
  /** 이번 달 1일 0시부터 지금까지 번 돈 */
  earned: number;
  /** 이번 달 월급 (현재 설정 기준 연봉÷12) */
  salary: number;
  /** 이번 달 월급날 0시 (그달에 그 날짜가 없으면 말일) */
  payday?: number;
};

/**
 * 이번 달 수익. 첫 설정을 이달 중간에 했더라도 1일부터 같은 설정으로 일했다고 보고 계산해
 * 말일에 월급과 맞아떨어지게 한다.
 */
export function monthInfo(periods: SettingsPeriod[], now: number): MonthInfo {
  const start = monthStart(now);
  const [first, ...rest] = periods;
  const extended = [{ ...first, from: Math.min(first.from, start) }, ...rest];
  const current = periods[periods.length - 1].settings;

  let payday: number | undefined;
  if (current.payday) {
    const d = new Date(start);
    const lastDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    payday = new Date(d.getFullYear(), d.getMonth(), Math.min(current.payday, lastDate)).getTime();
  }

  return { earned: earnedFromPeriods(extended, start, now), salary: current.annualSalary / 12, payday };
}

export type IncomeSnapshot = {
  total: number;
  today: number;
  /** 현재 시점 초당 수익 (근무 중이 아니어도 근무 시 기준 값) */
  perSecond: number;
  month: MonthInfo;
};

export function incomeSnapshot(periods: SettingsPeriod[], now: number): IncomeSnapshot {
  const current = periods[periods.length - 1].settings;
  return {
    total: earnedFromPeriods(periods, 0, now),
    today: earnedFromPeriods(periods, startOfDay(now), now),
    perSecond: rateForDay(current, startOfDay(now)) * 1000,
    month: monthInfo(periods, now),
  };
}
