import type { BoardGrid } from "../types/tetris";

export const BOARD_WIDTH_PX = 360;
export const BOARD_COLS = 20;
export const BOARD_ROWS = 35;
export const CELL_SIZE_PX = BOARD_WIDTH_PX / BOARD_COLS;

export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from<null>({ length: BOARD_COLS }).fill(null)
  );
}
