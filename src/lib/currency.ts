export type CurrencyCode = 'KRW' | 'USD' | 'AUD' | 'EUR' | 'JPY' | 'GBP';

type CurrencyInfo = { symbol: string; decimals: number; /** 1단위당 원화 (기본값, 대략적인 시세) */ defaultRate: number };

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  KRW: { symbol: '₩', decimals: 0, defaultRate: 1 },
  USD: { symbol: '$', decimals: 2, defaultRate: 1390 },
  AUD: { symbol: 'A$', decimals: 2, defaultRate: 910 },
  EUR: { symbol: '€', decimals: 2, defaultRate: 1620 },
  JPY: { symbol: '¥', decimals: 0, defaultRate: 9.4 },
  GBP: { symbol: '£', decimals: 2, defaultRate: 1860 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export type DisplayPrefs = {
  currency: CurrencyCode;
  /** 1단위당 원화. 없으면 기본값 */
  rates: Partial<Record<CurrencyCode, number>>;
  /** 누적 수익을 가리고 탭할 때만 잠깐 보여줄지 */
  hideTotal?: boolean;
};

export const DEFAULT_PREFS: DisplayPrefs = { currency: 'KRW', rates: {} };

export const rateOf = (prefs: DisplayPrefs, code: CurrencyCode) =>
  code === 'KRW' ? 1 : prefs.rates[code] || CURRENCIES[code].defaultRate;

export type Money = {
  code: CurrencyCode;
  symbol: string;
  /** 큰 숫자용: 기호 없이 숫자만 */
  amount: (krw: number) => string;
  /** 기호 + 축약 (₩8.4만, $12.3K) */
  compact: (krw: number) => string;
  /** 초당 수익처럼 작은 값 */
  small: (krw: number) => string;
};

export function makeMoney(prefs: DisplayPrefs): Money {
  const code = prefs.currency;
  const { symbol, decimals } = CURRENCIES[code];
  const rate = rateOf(prefs, code);
  const conv = (krw: number) => krw / rate;
  const fmt = (v: number, d: number) =>
    v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  return {
    code,
    symbol,
    // 소수점 아래는 버림 처리해서 금액이 되돌아가 보이지 않게
    amount: (krw) => fmt(Math.floor(conv(krw) * 10 ** decimals) / 10 ** decimals, decimals),
    compact: (krw) => {
      const v = conv(krw);
      if (code === 'KRW') {
        if (v >= 1e8) return `₩${(v / 1e8).toFixed(2)}억`;
        if (v >= 1e4) return `₩${(v / 1e4).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만`;
        return `₩${fmt(Math.floor(v), 0)}`;
      }
      if (v >= 1e6) return `${symbol}${(v / 1e6).toFixed(2)}M`;
      if (v >= 1e4) return `${symbol}${(v / 1e3).toFixed(1)}K`;
      return `${symbol}${fmt(Math.floor(v * 10 ** decimals) / 10 ** decimals, decimals)}`;
    },
    small: (krw) => {
      const v = conv(krw);
      return `${symbol}${v >= 10 ? fmt(v, 0) : v.toLocaleString('en-US', { maximumSignificantDigits: 3 })}`;
    },
  };
}
