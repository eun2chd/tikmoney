import type { DisplayPrefs } from '../lib/currency';

export type WorkSettings = {
  nickname: string;
  /** 세전 연봉 (원) */
  annualSalary: number;
  /** "HH:mm" */
  workStart: string;
  /** "HH:mm" — 출근 시간보다 이르면 다음 날 퇴근(야간 근무)으로 본다 */
  workEnd: string;
  /** "HH:mm" 휴게 시작 시각 */
  breakStart: string;
  /** 무급 휴게시간(분). 수익 계산에서 제외 */
  breakMinutes: number;
  /** 0 = 일요일 … 6 = 토요일 */
  workDays: number[];
  /** "YYYY-MM-DD" */
  holidays: string[];
  /** 시급 산정 기준. annual: 연봉÷연간 근무시간, monthly: 월급÷그달 근무시간 (기본 annual) */
  payBasis?: 'annual' | 'monthly';
  /** 월급날 (1~31). 월급 기준에서 D-day 표시용 */
  payday?: number;
};

/** 하나의 설정이 적용된 기간. 설정을 바꾸면 이전 기간은 닫히고 새 기간이 시작된다. */
export type SettingsPeriod = {
  settings: WorkSettings;
  /** epoch ms (포함) */
  from: number;
  /** epoch ms (미포함). 없으면 현재 진행 중 */
  to?: number;
};

export type AppData = {
  version: 1;
  periods: SettingsPeriod[];
  /** 표시 전용 설정. 수익 계산과 무관하므로 기간 이력에 넣지 않는다 */
  prefs?: DisplayPrefs;
};
