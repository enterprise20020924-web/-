export interface StageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const STAGE_VIEWBOX = { width: 1600, height: 1000 };
const LEFT_RAIL = { shoulder: 18, turnY: 303 };
const MAP_EDGE_SLOPE = 26 / 31;
const WIDE_MAP = { x: 530, y: 924, width: 540, height: 61 };
const TALENT_VERTICAL_INSET = 10;

// The SVG cutout and the HTML hit regions must derive from the same geometry.
export const stageLayouts = {
  wide: {
    window: { x: 64, y: 78, width: 1472, height: 846 },
    controls: { x: 1074, y: 29, width: 306, height: 48 },
    chest: { x: 16, y: 98, width: 64, height: 228 },
    trace: { x: 1547, y: 105, width: 41, height: 233 },
    clock: { x: 550, y: 7, width: 500, height: 76 },
    location: { x: 645, y: 90, width: 310, height: 49 },
    map: WIDE_MAP,
    talent: {
      x: 220 + TALENT_VERTICAL_INSET * MAP_EDGE_SLOPE,
      y: WIDE_MAP.y + TALENT_VERTICAL_INSET,
      width: WIDE_MAP.x - 220 + (WIDE_MAP.height - TALENT_VERTICAL_INSET * 2) * MAP_EDGE_SLOPE,
      height: WIDE_MAP.height - TALENT_VERTICAL_INSET * 2,
    },
  },
  compact: {
    window: { x: 60, y: 245, width: 1480, height: 560 },
    controls: { x: 110, y: 145, width: 1380, height: 90 },
    chest: { x: 105, y: 849, width: 660, height: 102 },
    trace: { x: 835, y: 849, width: 660, height: 102 },
    clock: { x: 430, y: 14, width: 1120, height: 68 },
    location: { x: 650, y: 96, width: 680, height: 38 },
  },
} satisfies Record<string, Record<string, StageRect>>;

type StageLayoutMode = keyof typeof stageLayouts;

export function stageWindowPoints(mode: StageLayoutMode, inset = 0): [number, number][] {
  const rect = insetStageRect(stageLayouts[mode].window, inset);
  const diagonalInset = inset * (2 - Math.SQRT2);
  const cut = (mode === 'wide' ? 52 : 28) - diagonalInset;
  const shoulder = mode === 'wide' ? LEFT_RAIL.shoulder : 0;
  const topLeftCut = mode === 'wide' ? 44 - diagonalInset : cut;
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  const points: [number, number][] = [
    [rect.x + shoulder + topLeftCut, rect.y],
    [right - cut, rect.y],
    [right, rect.y + cut],
    [right, bottom - cut],
    [right - cut, bottom],
    [rect.x + cut, bottom],
    [rect.x, bottom - cut],
  ];
  if (mode === 'wide') {
    // The upper rail wraps around Shittim, then steps back into the lower rail.
    const turnY = LEFT_RAIL.turnY + inset * (Math.SQRT2 - 1);
    points.push([rect.x, turnY + shoulder], [rect.x + shoulder, turnY]);
  }
  points.push([rect.x + shoulder, rect.y + topLeftCut]);
  return points;
}

export function stageWindowPath(mode: StageLayoutMode, inset = 0) {
  return `M${stageWindowPoints(mode, inset)
    .map(point => point.join(' '))
    .join('L')}Z`;
}

export function stageChestPoints(inset = 0): [number, number][] {
  const { x, y } = stageLayouts.wide.chest;
  const railTurn = stageWindowPoints('wide', -10).at(-2)!;
  const tipY = LEFT_RAIL.turnY + LEFT_RAIL.shoulder + 3;
  const points: [number, number][] = [
    [x + 3, y + 7],
    [railTurn[0], y + 24],
    railTurn,
    [railTurn[0] + railTurn[1] - tipY, tipY],
    [x + 3, tipY - 17],
  ];
  // Parallel offsets preserve the frame's diagonal instead of stretching a generic shield.
  const normals = points.map(([px, py], index) => {
    const [nx, ny] = points[(index + 1) % points.length];
    const length = Math.hypot(nx - px, ny - py);
    return [-(ny - py) / length, (nx - px) / length];
  });
  return points.map(([px, py], index) => {
    const a = normals[(index + normals.length - 1) % normals.length];
    const b = normals[index];
    const distance = inset / (1 + a[0] * b[0] + a[1] * b[1]);
    return [px + (a[0] + b[0]) * distance, py + (a[1] + b[1]) * distance];
  });
}

export function stageChestPath(inset = 0) {
  return `M${stageChestPoints(inset)
    .map(point => point.join(' '))
    .join('L')}Z`;
}

export function stageDockCut({ width, height }: StageRect) {
  return Math.min(height * MAP_EDGE_SLOPE, width / 3);
}

export function stageMapDockPath({ x, y, width, height }: StageRect, inset = 0) {
  const cut = stageDockCut({ x, y, width, height });
  const slope = cut / height;
  // Offset all four edges equally so the button follows the slot's slanted sides.
  const sideInset = inset * Math.hypot(1, slope);
  const topInset = sideInset + inset * slope;
  const bottomInset = cut + sideInset - inset * slope;
  return `M${x + topInset} ${y + inset}H${x + width - topInset}L${x + width - bottomInset} ${y + height - inset}H${x + bottomInset}Z`;
}

export function stageTalentDockPath({ x, y, width, height }: StageRect, inset = 0) {
  const cut = stageDockCut({ x, y, width, height });
  const slope = cut / height;
  const sideInset = inset * Math.hypot(1, slope);
  // Both sides lean with the map's left edge; their outer geometry meets exactly.
  return `M${x + sideInset + inset * slope} ${y + inset}H${x + width - cut - sideInset + inset * slope}L${x + width - sideInset - inset * slope} ${y + height - inset}H${x + cut + sideInset - inset * slope}Z`;
}

export function insetStageRect(rect: StageRect, horizontal: number, vertical = horizontal): StageRect {
  return {
    x: rect.x + horizontal,
    y: rect.y + vertical,
    width: rect.width - 2 * horizontal,
    height: rect.height - 2 * vertical,
  };
}

export function bevelStageRect({ x, y, width, height }: StageRect, cut = 16) {
  const c = Math.min(cut, width / 3, height / 3);
  return `M${x + c} ${y}H${x + width - c}L${x + width} ${y + c}V${y + height - c}L${x + width - c} ${y + height}H${x + c}L${x} ${y + height - c}V${y + c}Z`;
}

export const stageLayoutCssVariables = Object.fromEntries(
  Object.entries(stageLayouts).flatMap(([mode, layout]) =>
    Object.entries(layout).flatMap(([key, rect]) => {
      const inner =
        key === 'controls' && mode === 'compact'
          ? insetStageRect(rect, 12, 7)
          : mode === 'compact' && (key === 'chest' || key === 'trace')
            ? insetStageRect(rect, 10)
            : rect;
      const positions = Object.entries({ x: inner.x, y: inner.y, w: inner.width, h: inner.height }).map(
        ([axis, value]) => [
          `--bp-${mode}-${key}-${axis}`,
          `${(100 * value) / (axis === 'x' || axis === 'w' ? STAGE_VIEWBOX.width : STAGE_VIEWBOX.height)}%`,
        ],
      );
      if (key === 'window') {
        positions.push(
          [`--bp-${mode}-window-cut-x`, `${(mode === 'wide' ? 5200 : 2800) / inner.width}%`],
          [`--bp-${mode}-window-cut-y`, `${(mode === 'wide' ? 5200 : 2800) / inner.height}%`],
          [
            `--bp-${mode}-window-clip`,
            `polygon(${stageWindowPoints(mode as StageLayoutMode)
              .map(([x, y]) => `${((x - inner.x) / inner.width) * 100}% ${((y - inner.y) / inner.height) * 100}%`)
              .join(', ')})`,
          ],
        );
      }
      if (mode === 'wide' && key === 'chest') {
        positions.push([
          '--bp-wide-chest-clip',
          `polygon(${stageChestPoints(-1.25)
            .map(([x, y]) => `${((x - inner.x) / inner.width) * 100}% ${((y - inner.y) / inner.height) * 100}%`)
            .join(', ')})`,
        ]);
      }
      return positions;
    }),
  ),
);
