import { AU, EU, GB, JP, KR, US } from 'country-flag-icons/react/3x2';
import type { CurrencyCode } from '../lib/currency';

const FLAGS = { KRW: KR, USD: US, AUD: AU, EUR: EU, JPY: JP, GBP: GB } satisfies Record<CurrencyCode, unknown>;

/** 통화를 쓰는 나라의 국기 + 통화 코드 */
export function CurrencyFlag({ code, showCode = true }: { code: CurrencyCode; showCode?: boolean }) {
  const Flag = FLAGS[code];
  return (
    <span className="currency-flag">
      <Flag className="flag" aria-hidden />
      {showCode && <span className="currency-code">{code}</span>}
    </span>
  );
}
