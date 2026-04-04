/**
 * State-level gerrymandering data: partisan advantage metrics.
 * Source: MSU Redistricting analysis, efficiency gap methodology.
 *
 * avgAdvantage: average seats advantage (positive = GOP, negative = Dem)
 * effGap / quadratic / cubic / jurisdictional: individual metric scores
 */

export interface StateGerrymanderData {
  rank: number;
  avgAdvantage: number;
  party: 'R' | 'D';
  effGap: number;
  quadratic: number;
  cubic: number;
  jurisdictional: number;
  description: string;
}

/** Top 20 most gerrymandered states, keyed by 2-digit FIPS code */
export const stateGerrymanderData: Record<string, StateGerrymanderData> = {
  '48': {
    rank: 1,
    avgAdvantage: 5.6,
    party: 'R',
    effGap: 5.52,
    quadratic: 5.69,
    cubic: 4.01,
    jurisdictional: 7.23,
    description: 'Mid-decade maps gerrymandered Austin, San Antonio, Houston, and Dallas to create five new GOP districts.',
  },
  '37': {
    rank: 2,
    avgAdvantage: 4.1,
    party: 'R',
    effGap: 4.08,
    quadratic: 4.08,
    cubic: 4.12,
    jurisdictional: 4.01,
    description: 'One of the most consistently flagged states; maps redrawn mid-decade.',
  },
  '12': {
    rank: 3,
    avgAdvantage: 4.1,
    party: 'R',
    effGap: 3.85,
    quadratic: 3.88,
    cubic: 3.49,
    jurisdictional: 5.11,
    description: 'Scrapped bipartisan maps and dismantled a Black-opportunity district in North Florida.',
  },
  '06': {
    rank: 4,
    avgAdvantage: 2.8,
    party: 'D',
    effGap: -3.75,
    quadratic: -5.82,
    cubic: -0.25,
    jurisdictional: -1.41,
    description: 'Draft plan adds ~4 Democratic seats above the current plan.',
  },
  '17': {
    rank: 5,
    avgAdvantage: 2.3,
    party: 'D',
    effGap: -2.67,
    quadratic: -2.91,
    cubic: -1.55,
    jurisdictional: -1.92,
    description: 'Democratic-drawn maps pack Republican voters into downstate districts.',
  },
  '39': {
    rank: 6,
    avgAdvantage: 1.8,
    party: 'R',
    effGap: 1.93,
    quadratic: 2.01,
    cubic: 1.51,
    jurisdictional: 1.87,
    description: 'Republican-drawn maps crack urban Democratic voters across multiple districts.',
  },
  '34': {
    rank: 7,
    avgAdvantage: 1.4,
    party: 'D',
    effGap: -1.86,
    quadratic: -1.99,
    cubic: -1.14,
    jurisdictional: -0.58,
    description: 'Democratic-controlled redistricting packs Republican voters.',
  },
  '13': {
    rank: 8,
    avgAdvantage: 1.7,
    party: 'R',
    effGap: 1.56,
    quadratic: 1.59,
    cubic: 1.36,
    jurisdictional: 2.14,
    description: 'Atlanta metro area cracked across multiple Republican-leaning districts.',
  },
  '45': {
    rank: 9,
    avgAdvantage: 1.2,
    party: 'R',
    effGap: 1.53,
    quadratic: 1.61,
    cubic: 1.15,
    jurisdictional: 0.59,
    description: 'Majority-minority district drawn with convoluted boundaries.',
  },
  '55': {
    rank: 10,
    avgAdvantage: 1.4,
    party: 'R',
    effGap: 1.53,
    quadratic: 1.52,
    cubic: 1.58,
    jurisdictional: 0.83,
    description: 'Extreme partisan split despite closely divided electorate.',
  },
  '47': {
    rank: 11,
    avgAdvantage: 1.1,
    party: 'R',
    effGap: 1.30,
    quadratic: 1.54,
    cubic: 0.70,
    jurisdictional: 0.97,
    description: 'Nashville cracked across three districts to dilute Democratic votes.',
  },
  '25': {
    rank: 12,
    avgAdvantage: 1.0,
    party: 'D',
    effGap: -1.32,
    quadratic: -1.55,
    cubic: -0.97,
    jurisdictional: -0.31,
    description: 'All-Democratic delegation despite significant Republican vote share.',
  },
  '09': {
    rank: 13,
    avgAdvantage: 0.9,
    party: 'D',
    effGap: -1.23,
    quadratic: -1.33,
    cubic: -0.95,
    jurisdictional: 0.01,
    description: 'Democratic-controlled redistricting advantages incumbents.',
  },
  '18': {
    rank: 14,
    avgAdvantage: 1.0,
    party: 'R',
    effGap: 1.20,
    quadratic: 1.32,
    cubic: 0.73,
    jurisdictional: 0.90,
    description: 'Indianapolis cracked to dilute urban Democratic voters.',
  },
  '29': {
    rank: 15,
    avgAdvantage: 1.0,
    party: 'R',
    effGap: 1.08,
    quadratic: 1.16,
    cubic: 0.72,
    jurisdictional: 1.00,
    description: 'St. Louis and Kansas City metro areas cracked across districts.',
  },
  '35': {
    rank: 16,
    avgAdvantage: 1.0,
    party: 'D',
    effGap: -1.09,
    quadratic: -1.12,
    cubic: -0.93,
    jurisdictional: -0.88,
    description: 'Democratic-drawn maps advantage incumbents statewide.',
  },
  '19': {
    rank: 17,
    avgAdvantage: 0.9,
    party: 'R',
    effGap: 0.97,
    quadratic: 1.00,
    cubic: 0.81,
    jurisdictional: 0.80,
    description: 'Republican advantage through incumbent-friendly map drawing.',
  },
  '40': {
    rank: 18,
    avgAdvantage: 0.8,
    party: 'R',
    effGap: 0.87,
    quadratic: 1.17,
    cubic: 0.68,
    jurisdictional: 0.30,
    description: 'Oklahoma City area cracked to minimize Democratic representation.',
  },
  '36': {
    rank: 19,
    avgAdvantage: 0.9,
    party: 'D',
    effGap: -0.91,
    quadratic: -2.13,
    cubic: 0.0,
    jurisdictional: -0.04,
    description: 'Notably inconsistent across metrics; mixed partisan advantage.',
  },
  '32': {
    rank: 20,
    avgAdvantage: 0.6,
    party: 'D',
    effGap: -0.86,
    quadratic: -0.87,
    cubic: -0.79,
    jurisdictional: 0.01,
    description: 'Slight Democratic advantage through redistricting.',
  },
};

/** Get rank badge text, e.g. "#1 Most Gerrymandered" */
export function getStateRankLabel(fips: string): string | null {
  const data = stateGerrymanderData[fips];
  if (!data) return null;
  return `#${data.rank}`;
}
