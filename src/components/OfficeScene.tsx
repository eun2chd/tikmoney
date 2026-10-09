import { Fragment } from 'react';
import type { WorkStatus } from '../lib/workCalendar';
import { Pixels, PixelSvg } from './pixel';
import { Pet, PET_TYPES, Plant, type PlantType } from './OfficeDecor';

/*
 * 흑백 픽셀아트 직원. 정지된 몸(base) 위에 움직이는 레이어를 겹쳐 직업별 동작을 만든다.
 *   개발자: 양손을 번갈아 들었다 놓으며 타이핑
 *   디자이너: 펜 쥔 손이 태블릿 위를 오가며 그림
 *   회계: 계산기를 몇 번 두드리고 잠시 멈춤
 * 레이어 동작은 CSS(.act-*)가 담당하고, 근무 중일 때만 움직인다.
 * PixelLab 등으로 만든 PNG 스프라이트로 교체할 때는 public/characters/ 에 두고 <img>로 바꾸면 된다.
 */

type Layer = { act: string; x: number; y: number; rows: string[] };
type Staff = { base: string[]; layers: Layer[]; /** 깜빡일 때 덮을 눈 위치 */ eyes?: [number, number][] };

const DESK_LEGS = ['kkkkkkkkkkkkkkkk', '.k............k.', '.k............k.'];
const LEFT_HAND: Layer = { act: 'rest', x: 2, y: 11, rows: ['ww'] };

const STAFF_SPRITES = {
  developer: {
    base: [
      '.....kkkkkk.....',
      '....kkkkkkkk....',
      '....kkwwwwkk....',
      '....kwwwwwwk....',
      '....kwkwwkwk....',
      '....kwwwwwwk....',
      '.....kwwwwk.....',
      '......kkkk......',
      '...kddddddddk...',
      '..kddkkkkkkddk..', // 노트북 뒷면
      '.kddkggggggkddk.',
      '.kddkggkkggkddk.',
      ...DESK_LEGS,
    ],
    layers: [
      { act: 'type-a', x: 2, y: 11, rows: ['ww'] },
      { act: 'type-b', x: 12, y: 11, rows: ['ww'] },
    ],
    eyes: [[6, 4], [9, 4]],
  },
  designer: {
    base: [
      '.....kkkkkk.....',
      '....kkkkkkkk....',
      '...kkkwwwwkkk...',
      '...kkwwwwwwkk...',
      '...kkwkwwkwkk...',
      '...kkwwwwwwkk...',
      '...kkkwwwwkkk...',
      '...kk.kkkk.kk...',
      '...kggggggggk...',
      '..kggggggggggk..',
      '.kggggggggggggk.',
      '.kggkkkkkkkkggk.', // 책상 위 드로잉 태블릿
      ...DESK_LEGS,
    ],
    layers: [LEFT_HAND, { act: 'draw', x: 6, y: 9, rows: ['..k', '.k.', 'ww.'] }],
    eyes: [[6, 4], [9, 4]],
  },
  accountant: {
    base: [
      '......kkkk......',
      '....kkkkkkkk....',
      '....kwkkwwwk....',
      '....kwwwwwwk....',
      '....kkkwwkkk....', // 안경
      '....kwwwwwwk....',
      '.....kwwwwk.....',
      '......kkkk......',
      '...kddwkkwddk...', // 조끼 + 넥타이
      '..kdddwkkwdkkkk.', // 오른쪽: 탁상 계산기
      '.kddkkkkkwdkggk.', // 왼쪽: 서류 더미
      '.kddkwwwkwdkwkk.',
      ...DESK_LEGS,
    ],
    layers: [LEFT_HAND, { act: 'calc', x: 12, y: 7, rows: ['kk', 'ww'] }],
  },
} satisfies Record<string, Staff>;

type CharacterType = keyof typeof STAFF_SPRITES;

function Character({ type }: { type: CharacterType }) {
  const s: Staff = STAFF_SPRITES[type];
  return (
    <PixelSvg width={16} height={s.base.length} className={`sprite sprite-${type}`}>
      <Pixels rows={s.base} />
      {s.layers.map((l, i) => (
        <g key={i} className={`act-${l.act}`}>
          <Pixels rows={l.rows} x0={l.x} y0={l.y} />
        </g>
      ))}
      {s.eyes && (
        <g className="blink">
          {s.eyes.map(([x, y]) => (
            <Pixels key={`${x}-${y}`} rows={['w']} x0={x} y0={y} />
          ))}
        </g>
      )}
    </PixelSvg>
  );
}

const STAFF: { type: CharacterType; name: string }[] = [
  { type: 'developer', name: 'Developer' },
  { type: 'designer', name: 'Designer' },
  { type: 'accountant', name: 'Accountant' },
];

/** 직원 앞뒤·사이에 놓을 화분 (STAFF.length + 1칸, null은 비움) */
const PLANT_SLOTS: (PlantType | null)[] = ['tree', 'cactus', null, 'flower'];

const MOTTO: Record<WorkStatus, string> = {
  before: 'The office is warming up.',
  working: 'A quiet day at the office.',
  break: 'Coffee break.',
  after: 'Everyone has gone home.',
  off: 'The office is closed today.',
};

function PlantSlot({ type }: { type: PlantType | null }) {
  return type ? <Plant type={type} /> : null;
}

export function OfficeScene({ status }: { status: WorkStatus }) {
  const working = status === 'working';
  const present = working || status === 'break';
  return (
    <section className={`office ${working ? 'is-working' : ''} ${present ? '' : 'is-closed'}`}>
      <div className="office-head">
        <span className="caption-strong">OFFICE</span>
        <span className="caption">
          {working ? `${STAFF.length} EMPLOYEES WORKING` : status === 'break' ? 'ON BREAK' : 'CLOSED'}
        </span>
      </div>
      <div className="floor">
        {STAFF.map((c, i) => (
          <Fragment key={c.type}>
            <PlantSlot type={PLANT_SLOTS[i]} />
            <figure className="desk">
              <span className="bubble">{working ? '' : present ? 'coffee' : 'zz'}</span>
              <Character type={c.type} />
              <figcaption className="caption">{c.name}</figcaption>
            </figure>
          </Fragment>
        ))}
        <PlantSlot type={PLANT_SLOTS[STAFF.length]} />
        {/* 동물들은 근무 여부와 상관없이 사무실을 돌아다닌다 */}
        <div className="pets">
          {PET_TYPES.map((p) => (
            <Pet key={p} type={p} />
          ))}
        </div>
      </div>
      <p className="motto">{MOTTO[status]}</p>
    </section>
  );
}
