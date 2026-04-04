import type { PieceShape } from '../types/tetris';
import { DISTRICT_PIECES } from '../data/generatedPieces';
import { FEATURED_DISTRICT_IDS } from './featuredDistricts';
import { getDistrictShortLabel } from '../data/stateNames';
import { stateLeans } from '../data/stateLeans';

export interface PieceDefinition {
  shape: PieceShape;
  color: string;
  name: string;
}

/** 5 political-spectrum colors: Strong R, Lean R, Toss-up, Lean D, Strong D */
const POLITICAL_COLORS = [
  '#b71c1c', // dark red — strong republican
  '#e53935', // light red — lean republican
  '#7b1fa2', // purple — toss-up
  '#42a5f5', // light blue — lean democrat
  '#0d47a1', // dark blue — strong democrat
];

const pieceEntries = Object.entries(DISTRICT_PIECES);

export const PIECES: Record<string, PieceDefinition> = Object.fromEntries(
  pieceEntries.map(([id, dp]) => {
    const stateFips = (id.startsWith('d') ? id.slice(1) : id).slice(0, 2);
    const lean = stateLeans[stateFips] ?? 2; // default toss-up
    return [id, { shape: dp.shape, color: POLITICAL_COLORS[lean], name: dp.name }];
  })
);

export const PIECE_TYPES = FEATURED_DISTRICT_IDS;

export function getPieceColor(pieceType: string): string {
  return PIECES[pieceType]?.color ?? '#888';
}

export function getPieceName(pieceType: string): string {
  return PIECES[pieceType]?.name ?? pieceType;
}

/** Extract FIPS/district from piece ID (e.g. "d0614") and return short label like "CA-14" */
export function getPieceLabel(pieceType: string): string {
  const geoid = pieceType.startsWith('d') ? pieceType.slice(1) : pieceType;
  const stateFips = geoid.slice(0, 2);
  const districtFp = geoid.slice(2);
  return getDistrictShortLabel(stateFips, districtFp);
}
