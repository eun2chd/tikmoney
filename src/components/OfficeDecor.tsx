import type { CSSProperties } from 'react';
import { Pixels, PixelSvg } from './pixel';

const PLANTS = {
  tree: [
    '....kkkk....',
    '..kkddddkk..',
    '.kddddddddk.',
    'kddgddddgddk',
    'kddddddddddk',
    'kdddddgddddk',
    '.kddgdddddk.',
    '..kkddddkk..',
    '....kddk....',
    '.....kk.....',
    '.....kk.....',
    '.....kk.....',
    '.....kk.....',
    '...kkkkkk...',
    '...kwwwwk...',
    '...kwwwwk...',
    '...kwwwwk...',
    '....kkkk....',
  ],
  flower: [
    '...kk.....',
    '..kwwk.kk.',
    '..kwwkkwwk',
    '...kk.kwwk',
    '....k..kk.',
    '..k.k.kk..',
    '...kkk....',
    '..kkkkkk..',
    '..kwwwwk..',
    '..kwwwwk..',
    '...kkkk...',
  ],
  cactus: [
    '....kk....',
    '...kggk...',
    '.k.kggk.k.',
    'kgkkggkkgk',
    'kggggggggk',
    '.kkkggkkk.',
    '...kggk...',
    '..kkkkkk..',
    '..kddddk..',
    '...kkkk...',
  ],
};

export type PlantType = keyof typeof PLANTS;

export function Plant({ type }: { type: PlantType }) {
  const rows = PLANTS[type];
  return (
    <PixelSvg width={rows[0].length} height={rows.length} className={`plant plant-${type}`}>
      <Pixels rows={rows} />
    </PixelSvg>
  );
}

/* 오른쪽을 보는 옆모습. 두 다리 프레임을 번갈아 걷는다 */
const PETS = {
  dog: {
    speed: 0.3,
    a: [
      '...........kk...',
      '..........kddk..',
      'k.........kwwwkk',
      '.k........kwkwwk',
      '..kkkkkkkkkwwkk.',
      '..kwwwwwwwwwwk..',
      '..kwwwwwwwwwwk..',
      '..kwkkkkkkkkwk..',
      '...kwk....kwk...',
      '...kk.....kk....',
    ],
    b: [
      '...........kk...',
      '..........kddk..',
      '.k........kwwwkk',
      'k.........kwkwwk',
      '..kkkkkkkkkwwkk.',
      '..kwwwwwwwwwwk..',
      '..kwwwwwwwwwwk..',
      '..kwkkkkkkkkwk..',
      '..kwk......kwk..',
      '..kk.......kk...',
    ],
  },
  cat: {
    speed: 0.45,
    a: [
      '................',
      '..........k..k..',
      'k.........kkkkk.',
      'k.........kgkgk.',
      '.k........kgggk.',
      '.k.kkkkkkkkkkk..',
      '..kgggggggggk...',
      '..kgggggggggk...',
      '...kgk...kgk....',
      '...kk....kk.....',
    ],
    b: [
      '................',
      '..........k..k..',
      'k.........kkkkk.',
      'k.........kgkgk.',
      '.k........kgggk.',
      '.k.kkkkkkkkkkk..',
      '..kgggggggggk...',
      '..kgggggggggk...',
      '..kgk.....kgk...',
      '..kk......kk....',
    ],
  },
  duck: {
    speed: 0.35,
    a: [
      '........kkk.....',
      '.......kwwwk....',
      '.......kwkwkkk..',
      '.......kwwwkddk.',
      '..k....kwwwkkk..',
      '.kwk..kwwwk.....',
      '.kwwkkwwwwwk....',
      '..kwwwwwwwwk....',
      '...kkkkkkkk.....',
      '....kk..kk......',
    ],
    b: [
      '........kkk.....',
      '.......kwwwk....',
      '.......kwkwkkk..',
      '.......kwwwkddk.',
      '..k....kwwwkkk..',
      '.kwk..kwwwk.....',
      '.kwwkkwwwwwk....',
      '..kwwwwwwwwk....',
      '...kkkkkkkk.....',
      '.....kk.kk......',
    ],
  },
  chick: {
    speed: 0.2,
    a: [
      '....kkk...',
      '...kgggk..',
      '...kgkgkk.',
      '..kggggkdk',
      '.kgggggkk.',
      '.kgggggk..',
      '..kkkkk...',
      '...k.k....',
    ],
    b: [
      '....kkk...',
      '...kgggk..',
      '...kgkgkk.',
      '..kggggkdk',
      '.kgggggkk.',
      '.kgggggk..',
      '..kkkkk...',
      '..k...k...',
    ],
  },
  rabbit: {
    speed: 0.3,
    a: [
      '..........kk.kk.',
      '..........kwkkwk',
      '..........kwkkwk',
      '..........kwwwwk',
      '.........kwwkwwk',
      '..kkkkkkkkwwwwkk',
      '.kwwwwwwwwwwwk..',
      'kkwwwwwwwwwwwk..',
      'kkwwwwwwwwwwk...',
      '..kwwkkkkwwk....',
      '..kkk....kkk....',
    ],
    b: [
      '..........kk.kk.',
      '..........kwkkwk',
      '..........kwkkwk',
      '..........kwwwwk',
      '.........kwwkwwk',
      '..kkkkkkkkwwwwkk',
      '.kwwwwwwwwwwwk..',
      'kkwwwwwwwwwwwk..',
      'kkwwwwwwwwwwk...',
      '.kwwk.....kwwk..',
      '.kkk.......kkk..',
    ],
  },
  turtle: {
    speed: 0.9,
    a: [
      '....kkkkkk......',
      '...kdgdgdgk.....',
      '..kdgdgdgdgk.kk.',
      '..kgdgdgdgdkkwwk',
      '.kkkkkkkkkkkwkwk',
      '..kwk...kwk.kkk.',
      '..kk....kk......',
    ],
    b: [
      '....kkkkkk......',
      '...kdgdgdgk.....',
      '..kdgdgdgdgk.kk.',
      '..kgdgdgdgdkkwwk',
      '.kkkkkkkkkkkwkwk',
      '...kwk...kwkkkk.',
      '...kk....kk.....',
    ],
  },
};

export type PetType = keyof typeof PETS;

export const PET_TYPES = Object.keys(PETS) as PetType[];

/**
 * 사무실 바닥을 오가는 동물.
 * 이동 경로·속도·방향 전환은 CSS(.pet-<type>)가 담당하고, 여기서는 폭(--w)과 걸음 속도만 넘긴다.
 */
export function Pet({ type }: { type: PetType }) {
  const { a, b, speed } = PETS[type];
  const width = a[0].length;
  return (
    <div className={`pet pet-${type}`} style={{ '--w': width } as CSSProperties}>
      <div className="pet-facing">
        <PixelSvg width={width} height={a.length} style={{ '--speed': `${speed}s` } as CSSProperties}>
          <g className="frame-a">
            <Pixels rows={a} />
          </g>
          <g className="frame-b">
            <Pixels rows={b} />
          </g>
        </PixelSvg>
      </div>
    </div>
  );
}
