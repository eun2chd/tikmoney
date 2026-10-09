import type { CSSProperties, ReactNode } from 'react';

/*
 * 흑백 픽셀아트 공용 렌더러. 문자 하나가 1픽셀.
 *   k 검정  d 진회색  g 회색  w 흰색  . 투명
 * 화면 크기는 .office 의 --px(픽셀 하나의 크기)로 맞춘다.
 */
export const PALETTE: Record<string, string> = { k: '#111111', d: '#555555', g: '#bdbdbd', w: '#ffffff' };

export function Pixels({ rows, x0 = 0, y0 = 0 }: { rows: string[]; x0?: number; y0?: number }) {
  return (
    <>
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          PALETTE[c] ? (
            <rect key={`${x}-${y}`} x={x0 + x} y={y0 + y} width={1.02} height={1.02} fill={PALETTE[c]} />
          ) : null,
        ),
      )}
    </>
  );
}

type SvgProps = { width: number; height: number; className?: string; style?: CSSProperties; children: ReactNode };

export function PixelSvg({ width, height, className, style, children }: SvgProps) {
  return (
    <svg
      className={`pixel ${className ?? ''}`}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      style={{ width: `calc(var(--px) * ${width})`, height: `calc(var(--px) * ${height})`, ...style }}
      aria-hidden
    >
      {children}
    </svg>
  );
}
