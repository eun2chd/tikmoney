import { useMemo } from 'react';
import type { AppData } from '../types/settings';
import { incomeSnapshot } from '../lib/income';
import { dayInfo } from '../lib/workCalendar';

export function useIncome(data: AppData, now: number) {
  return useMemo(() => {
    const settings = data.periods[data.periods.length - 1].settings;
    return { ...incomeSnapshot(data.periods, now), day: dayInfo(settings, now), settings };
  }, [data, now]);
}
