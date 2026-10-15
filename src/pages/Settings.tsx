import { useRef, useState } from 'react';
import type { AppData, WorkSettings } from '../types/settings';
import { KR_HOLIDAYS } from '../lib/holidays';
import { dailyWorkMs, isWorkDay, startOfDay, workDaysInYear } from '../lib/workCalendar';
import { rateForDay } from '../lib/income';
import { exportData, importData, initialData } from '../lib/storage';
import { won } from '../lib/format';
import { CurrencyFlag } from '../components/CurrencyFlag';
import { LuEye, LuEyeOff, LuInfo, LuSave, LuShieldCheck, LuTablet, LuX } from 'react-icons/lu';
import { CURRENCIES, CURRENCY_CODES, DEFAULT_PREFS, rateOf, type DisplayPrefs } from '../lib/currency';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function monthWorkDays(s: WorkSettings): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let n = 0;
  for (let date = 1; date <= last; date++) {
    if (isWorkDay(s, new Date(now.getFullYear(), now.getMonth(), date).getTime())) n++;
  }
  return n;
}
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DEFAULT_SETTINGS: WorkSettings = {
  nickname: '',
  annualSalary: 40_000_000,
  workStart: '09:00',
  workEnd: '18:00',
  breakStart: '12:00',
  breakMinutes: 60,
  workDays: [1, 2, 3, 4, 5],
  holidays: Object.values(KR_HOLIDAYS).flat(),
};

type Props = {
  initial?: WorkSettings;
  initialPrefs?: DisplayPrefs;
  data?: AppData;
  onSave: (s: WorkSettings, prefs: DisplayPrefs) => void;
  onCancel?: () => void;
  onImport?: (d: AppData) => void;
  onReset?: () => void;
  /** 모든 데이터를 지우고 최초 설정 화면으로 */
  onFullReset?: () => void;
};

export function Settings({ initial, initialPrefs, data, onSave, onCancel, onImport, onReset, onFullReset }: Props) {
  const [s, setS] = useState<WorkSettings>(initial ?? DEFAULT_SETTINGS);
  const [prefs, setPrefs] = useState<DisplayPrefs>(initialPrefs ?? DEFAULT_PREFS);
  const [holidayDraft, setHolidayDraft] = useState('');
  const [error, setError] = useState('');
  const [resetArmed, setResetArmed] = useState(false);
  const [fullResetArmed, setFullResetArmed] = useState(false);
  const [backupAsk, setBackupAsk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRun = !initial;

  const set = <K extends keyof WorkSettings>(key: K, value: WorkSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const toggleDay = (d: number) =>
    set('workDays', s.workDays.includes(d) ? s.workDays.filter((x) => x !== d) : [...s.workDays, d].sort());

  const addHoliday = () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(holidayDraft) && !s.holidays.includes(holidayDraft)) {
      set('holidays', [...s.holidays, holidayDraft].sort());
    }
    setHolidayDraft('');
  };

  const year = new Date().getFullYear();
  const yearHolidays = s.holidays.filter((h) => h.startsWith(String(year)));
  const otherHolidays = s.holidays.length - yearHolidays.length;
  const monthly = s.payBasis === 'monthly';
  const perSecond = rateForDay(s, startOfDay(Date.now())) * 1000;
  const valid = s.annualSalary > 0 && s.workDays.length > 0 && dailyWorkMs(s) > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return setError('연봉, 근무 요일, 근무 시간을 확인해 주세요.');
    // 처음 시작할 때는 설정값을 파일로 백업할지 먼저 묻는다
    if (firstRun) return setBackupAsk(true);
    finish();
  };

  const finish = () => onSave({ ...s, nickname: s.nickname.trim() }, prefs);

  const backupAndStart = async () => {
    const saved = await exportData(initialData({ ...s, nickname: s.nickname.trim() }, prefs));
    if (saved) finish();
  };

  return (
    <form className="settings" onSubmit={submit}>
      <header className="settings-head">
        <div>
          <div className="brand">TIKMONEY</div>
          <div className="caption">{firstRun ? 'SET UP YOUR WORKDAY' : 'SETTINGS'}</div>
        </div>
        <div className="settings-actions">
          {onCancel && (
            <button type="button" className="btn ghost" onClick={onCancel}>
              취소
            </button>
          )}
          <button type="submit" className="btn" disabled={!valid}>
            {firstRun ? '시작하기' : '저장'}
          </button>
        </div>
      </header>

      <p className="privacy-note">
        <LuTablet aria-hidden />
        TIKMONEY는 태블릿 가로 화면에 맞춰 만들었어요. 태블릿에 켜 두고 사용하는 걸 권장해요.
      </p>

      <p className="privacy-note">
        <LuShieldCheck aria-hidden />
        입력한 정보는 서버나 DB에 저장되지 않습니다. 회원가입 없이 이 기기의 브라우저(로컬 저장소)에만 보관되고, 외부로 전송되지
        않아요.
      </p>

      <div className="settings-grid">
        <label className="field">
          <span>닉네임</span>
          <input value={s.nickname} maxLength={20} placeholder="대시보드에 표시할 이름" onChange={(e) => set('nickname', e.target.value)} />
        </label>

        {/* 안에 버튼이 있어서 label 대신 div. label로 감싸면 탭했을 때 입력칸이 아니라 버튼이 눌린다 */}
        <div className="field">
          <span className="field-label">
            세전 연봉 (원)
            <span className="tooltip">
              <button type="button" className="tooltip-trigger" aria-label="연봉 입력 안내" aria-describedby="salary-tip">
                <LuInfo aria-hidden />
              </button>
              <span role="tooltip" id="salary-tip" className="tooltip-bubble">
                실제 연봉보다 <b>가상의 연봉</b>을 적는 걸 추천해요. 화면이 켜져 있는 동안 누군가 초당 수익이나 오늘 번
                돈을 보면 연봉을 거꾸로 계산할 수 있거든요. 회사 사람들이 내 연봉을 알게 되는 건… 다들 알죠?
              </span>
            </span>
          </span>
          <input
            inputMode="numeric"
            className="num"
            aria-label="세전 연봉 (원)"
            value={s.annualSalary ? won(s.annualSalary) : ''}
            onChange={(e) => set('annualSalary', Number(e.target.value.replace(/\D/g, '')) || 0)}
          />
        </div>

        <label className="field">
          <span>출근 시간</span>
          <input type="time" value={s.workStart} onChange={(e) => set('workStart', e.target.value)} />
        </label>
        <label className="field">
          <span>퇴근 시간</span>
          <input type="time" value={s.workEnd} onChange={(e) => set('workEnd', e.target.value)} />
        </label>

        <label className="field">
          <span>휴게 시작</span>
          <input type="time" value={s.breakStart} onChange={(e) => set('breakStart', e.target.value)} />
        </label>
        <label className="field">
          <span>무급 휴게시간 (분)</span>
          <input
            type="number"
            min={0}
            step={10}
            className="num"
            value={s.breakMinutes}
            onChange={(e) => set('breakMinutes', Math.max(0, Number(e.target.value) || 0))}
          />
        </label>

        <div className="field wide">
          <span>근무 요일</span>
          <div className="chips">
            {DAY_ORDER.map((d) => (
              <button type="button" key={d} className={`chip ${s.workDays.includes(d) ? 'on' : ''}`} onClick={() => toggleDay(d)}>
                {DAYS[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="field wide">
          <span>급여 기준 · 누적 수익을 어떻게 셀까요?</span>
          <div className="holiday-row">
            <button
              type="button"
              className={`chip wide-chip ${!monthly ? 'on' : ''}`}
              onClick={() => set('payBasis', 'annual')}
            >
              연봉 기준 · 처음 설정한 날부터 누적
            </button>
            <button
              type="button"
              className={`chip wide-chip ${monthly ? 'on' : ''}`}
              onClick={() => set('payBasis', 'monthly')}
            >
              월급 기준 · 매달 월급만큼 채우기
            </button>
          </div>
          {monthly && (
            <label className="rate-row">
              <span className="caption">월급날 · 매월</span>
              <input
                type="number"
                min={1}
                max={31}
                className="num"
                value={s.payday ?? ''}
                placeholder="25"
                onChange={(e) => {
                  const v = Math.round(Number(e.target.value));
                  set('payday', v >= 1 && v <= 31 ? v : undefined);
                }}
              />
              <span className="caption">일 · 월급 {won(s.annualSalary / 12)}원 (연봉÷12, 1일~말일 근무분)</span>
            </label>
          )}
        </div>

        <div className="field wide">
          <span>누적 수익을 가릴까요? · 지나가는 사람이 보는 게 싫다면 가려 두세요</span>
          <div className="holiday-row">
            <button
              type="button"
              className={`chip wide-chip ${!prefs.hideTotal ? 'on' : ''}`}
              onClick={() => setPrefs({ ...prefs, hideTotal: false })}
            >
              <LuEye aria-hidden /> 보여주기
            </button>
            <button
              type="button"
              className={`chip wide-chip ${prefs.hideTotal ? 'on' : ''}`}
              onClick={() => setPrefs({ ...prefs, hideTotal: true })}
            >
              <LuEyeOff aria-hidden /> 가리기 (탭하면 5초간 보기)
            </button>
          </div>
        </div>

        <div className="field wide">
          <span>표시 통화 · 주변 사람에게 원화 금액이 보이지 않게 다른 통화로 표시할 수 있어요</span>
          <div className="holiday-row">
            {CURRENCY_CODES.map((c) => (
              <button
                type="button"
                key={c}
                className={`chip wide-chip ${prefs.currency === c ? 'on' : ''}`}
                onClick={() => setPrefs({ ...prefs, currency: c })}
              >
                <CurrencyFlag code={c} /> {CURRENCIES[c].symbol}
              </button>
            ))}
          </div>
          {prefs.currency !== 'KRW' && (
            <label className="rate-row">
              <span className="caption">환율 · 1 {prefs.currency} =</span>
              <input
                type="number"
                min={0}
                step="any"
                className="num"
                value={rateOf(prefs, prefs.currency)}
                onChange={(e) =>
                  setPrefs({ ...prefs, rates: { ...prefs.rates, [prefs.currency]: Number(e.target.value) || 0 } })
                }
              />
              <span className="caption">원 (기본값은 대략적인 시세예요. 직접 수정하세요)</span>
            </label>
          )}
        </div>

        <div className="field wide">
          <span>
            휴무일 · {year}년 {yearHolidays.length}일{otherHolidays ? ` (그 외 ${otherHolidays}일)` : ''}
          </span>
          <div className="holiday-row">
            <input type="date" value={holidayDraft} onChange={(e) => setHolidayDraft(e.target.value)} />
            <button type="button" className="btn ghost" onClick={addHoliday}>
              추가
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => set('holidays', [...new Set([...s.holidays, ...Object.values(KR_HOLIDAYS).flat()])].sort())}
            >
              공휴일 불러오기
            </button>
            {s.holidays.length > 0 && (
              <button type="button" className="btn ghost" onClick={() => set('holidays', [])}>
                모두 지우기
              </button>
            )}
          </div>
          <div className="holiday-list">
            {yearHolidays.map((h) => (
              <button type="button" key={h} className="chip small on" title="삭제" onClick={() => set('holidays', s.holidays.filter((x) => x !== h))}>
                {h.slice(5)} ×
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="settings-foot">
        <p className="caption num">
          세전 기준 ·{' '}
          {monthly
            ? `이번 달 근무일 ${monthWorkDays(s)}일, 말일에 월급과 같아지도록`
            : `${year}년 근무일 ${workDaysInYear(s, year)}일`}{' '}
          × 하루 {(dailyWorkMs(s) / 3_600_000).toFixed(1)}시간 → 초당 ₩{perSecond.toFixed(2)}
        </p>
        {!firstRun && <p className="caption">닉네임·연봉·근무시간을 바꿔도 지금까지의 누적 수익은 그대로 유지되고, 저장한 시점부터 새 설정이 적용됩니다. 연봉이 오르면 여기서 바꿔 주세요.</p>}
        {error && <p className="error">{error}</p>}

        {!firstRun && (
          <div className="settings-tools">
            {data && (
              <button type="button" className="btn ghost" onClick={() => exportData(data)}>
                설정 내보내기
              </button>
            )}
            <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
              가져오기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  onImport?.(await importData(file));
                } catch (err) {
                  setError(err instanceof Error ? err.message : '가져오기에 실패했습니다.');
                }
              }}
            />
            {onReset && (
              <button
                type="button"
                className="btn ghost danger"
                onClick={() => (resetArmed ? onReset() : setResetArmed(true))}
              >
                {resetArmed ? '한 번 더 누르면 초기화됩니다' : '누적 수익 초기화'}
              </button>
            )}
            {onFullReset && (
              <button
                type="button"
                className="btn ghost danger"
                onClick={() => (fullResetArmed ? onFullReset() : setFullResetArmed(true))}
              >
                {fullResetArmed ? '한 번 더 누르면 모든 데이터가 지워집니다' : '처음 설정으로 돌아가기'}
              </button>
            )}
          </div>
        )}
      </footer>

      {backupAsk && (
        <div className="modal" onClick={() => setBackupAsk(false)}>
          <div className="modal-card" role="dialog" aria-labelledby="backup-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setBackupAsk(false)} aria-label="닫기">
              <LuX aria-hidden />
            </button>
            <div className="caption">BACKUP</div>
            <h2 id="backup-title" className="modal-title">
              설정값을 파일로 저장해 둘까요?
            </h2>
            <p className="modal-text">
              입력한 연봉·근무시간은 이 브라우저에만 저장돼요. 브라우저 기록을 지우거나 기기를 바꾸면 사라지니,
              바탕화면 같은 곳에 파일로 저장해 두면 나중에 설정 → 가져오기로 그대로 되살릴 수 있어요.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={backupAndStart}>
                <LuSave aria-hidden /> 파일로 저장하고 시작
              </button>
              <button type="button" className="btn ghost" onClick={finish}>
                저장 없이 시작
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
