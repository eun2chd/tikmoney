import { useEffect, useState } from 'react';
import { LuCheck, LuCopy, LuMail, LuX } from 'react-icons/lu';

const CONTACT_EMAIL = 'codeun22@gmail.com';
const MAIL_SUBJECT = '[TIKMONEY] 건의사항';

/** 만든 사람 · 건의사항 보내기 */
export function Credits({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // http 접속 등 클립보드를 못 쓰는 환경. 주소는 화면에서 직접 선택할 수 있다
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-labelledby="credits-title" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          <LuX aria-hidden />
        </button>
        <div className="caption">MADE BY</div>
        <h2 id="credits-title" className="modal-title">
          TIKMONEY를 만든 사람
        </h2>
        <p className="modal-text">
          건의사항, 추가하면 좋을 기능, 버그 제보 무엇이든 환영해요.
          <br />
          아래 주소로 메일을 보내 주세요.
        </p>
        <div className="contact">
          <span className="contact-email num">{CONTACT_EMAIL}</span>
          <button className="test-btn" onClick={copy}>
            {copied ? <LuCheck aria-hidden /> : <LuCopy aria-hidden />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <a className="btn mail-btn" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}`}>
          <LuMail aria-hidden /> 메일 보내기
        </a>
      </div>
    </div>
  );
}
