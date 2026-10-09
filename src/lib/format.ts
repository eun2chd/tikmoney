export const won = (n: number) => Math.floor(n).toLocaleString('ko-KR');

export function duration(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

export const clock = (d: Date) =>
  [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':');

export const longDate = (d: Date) =>
  d
    .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    .replace(',', ' ·')
    .toUpperCase();
