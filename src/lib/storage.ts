import type { AppData, WorkSettings } from '../types/settings';
import type { DisplayPrefs } from './currency';
import { startOfDay } from './workCalendar';

const KEY = 'tikmoney:data';

export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AppData;
    return data?.version === 1 && data.periods?.length ? data : null;
  } catch {
    return null;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 저장 공간을 쓸 수 없는 환경에서는 메모리 상태만 유지
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** 최초 설정: 오늘 0시부터 누적을 시작해 오늘 이미 일한 시간도 포함한다 */
export function initialData(settings: WorkSettings, prefs?: DisplayPrefs, now = Date.now()): AppData {
  return { version: 1, periods: [{ settings, from: startOfDay(now) }], prefs };
}

/** 기본 정책: 변경 이전 수익은 기존 설정으로 보존하고, 지금부터 새 설정을 적용 */
export function applySettings(data: AppData, settings: WorkSettings, now = Date.now()): AppData {
  // 계산에 영향이 없는 변경이면 새 기간을 만들지 않는다
  if (JSON.stringify(settings) === JSON.stringify(data.periods[data.periods.length - 1].settings)) return data;
  const periods = data.periods.map((p, i) =>
    i === data.periods.length - 1 ? { ...p, to: now } : p,
  );
  return { ...data, periods: [...periods, { settings, from: now }] };
}

export function exportData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tikmoney-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importData(file: File): Promise<AppData> {
  const data = JSON.parse(await file.text()) as AppData;
  if (data?.version !== 1 || !Array.isArray(data.periods) || !data.periods.length) {
    throw new Error('올바른 TIKMONEY 백업 파일이 아닙니다.');
  }
  return data;
}
