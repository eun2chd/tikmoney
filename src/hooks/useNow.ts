import { useEffect, useState } from 'react';

/** 현재 시각을 주기적으로 갱신. 기본 1초 주기는 초 경계에 맞춘다. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer: number;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      timer = window.setTimeout(tick, intervalMs - (t % intervalMs) + 5);
    };
    tick();
    const onVisible = () => document.visibilityState === 'visible' && setNow(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return now;
}
