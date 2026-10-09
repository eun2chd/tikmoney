import { useEffect } from 'react';

/** 화면 꺼짐 방지. 탭 전환 등으로 해제되면 다시 요청한다. */
export function useWakeLock(enabled = true): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const request = async () => {
      if (disposed || document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // 사용자 제스처 필요·보안 컨텍스트 아님 등. 다음 상호작용 때 재시도
      }
    };

    request();
    document.addEventListener('visibilitychange', request);
    document.addEventListener('pointerdown', request);
    const retry = window.setInterval(request, 60_000);
    return () => {
      disposed = true;
      clearInterval(retry);
      document.removeEventListener('visibilitychange', request);
      document.removeEventListener('pointerdown', request);
      sentinel?.release().catch(() => {});
    };
  }, [enabled]);
}
