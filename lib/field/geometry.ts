/**
 * Sizes for the /work field, derived from the viewport. Every length scales off
 * the card width so the grid keeps its proportions on any screen; the field is
 * a cols × rows torus at least one cell wider and taller than the viewport on
 * each side, so a card wraps from one edge to the other out of sight.
 */
export interface FieldGeometry {
  W: number;
  H: number;
  /** Card (plate) width and height, and the label strip under it. */
  cardW: number;
  plateH: number;
  labelH: number;
  /** Margin of plate showing around the picture, and the window that leaves. */
  inset: number;
  winW: number;
  winH: number;
  pitchX: number;
  pitchY: number;
  cols: number;
  rows: number;
  /** The cell that starts in the middle of the screen. */
  cx: number;
  cy: number;
  /** Microtype size for the tile labels. */
  font: number;
  mobile: boolean;
}

export function fieldGeometry(W: number, H: number, count: number): FieldGeometry {
  const mobile = W < 640;
  const cardW = mobile ? W * 0.74 : Math.min(640, Math.max(320, W * 0.3466));
  const plateH = cardW * 0.655;
  const labelH = Math.max(18, cardW * 0.046);
  const inset = cardW * (mobile ? 0.07 : 0.104);
  const pitchX = cardW * (mobile ? 1.12 : 1.188);
  const pitchY = (plateH + labelH) * (mobile ? 1.12 : 1.2);
  const cols = Math.ceil(W / pitchX) + 2;
  let rows = Math.ceil(H / pitchY) + 2;
  // every tile has to be reachable: each cell keeps its tile for life
  while (cols * rows < count) rows++;
  return {
    W,
    H,
    cardW,
    plateH,
    labelH,
    inset,
    winW: cardW - inset * 2,
    winH: plateH - inset * 2,
    pitchX,
    pitchY,
    cols,
    rows,
    cx: Math.floor(cols / 2),
    cy: Math.floor(rows / 2),
    font: Math.max(8, Math.min(11, cardW * 0.0185)),
    mobile,
  };
}

/** Which tile a cell shows: reading order from the centre cell, so the first tile starts in the middle. */
export function tileAt(col: number, row: number, g: FieldGeometry, count: number) {
  const i = (row - g.cy) * g.cols + (col - g.cx);
  return ((i % count) + count) % count;
}

/** The picture's box inside a cell's window, at the image's own aspect ratio (object-fit: contain). */
export function frameIn(g: FieldGeometry, w?: number, h?: number) {
  const a = w && h ? w / h : 16 / 10;
  let fw = g.winW;
  let fh = fw / a;
  if (fh > g.winH) {
    fh = g.winH;
    fw = fh * a;
  }
  return { left: (g.cardW - fw) / 2, top: (g.plateH - fh) / 2, width: fw, height: fh };
}
