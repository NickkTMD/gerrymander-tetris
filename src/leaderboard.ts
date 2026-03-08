export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

const MOCK_SCORES: LeaderboardEntry[] = [
  { name: 'GerryMaster', score: 14820, date: '3/5/2026' },
  { name: 'BlockParty', score: 12350, date: '3/6/2026' },
  { name: 'TetrisKing', score: 9870, date: '3/4/2026' },
  { name: 'DistrictHero', score: 8540, date: '3/7/2026' },
  { name: 'MapMaker', score: 7210, date: '3/3/2026' },
  { name: 'SquareOne', score: 5990, date: '3/6/2026' },
  { name: 'LineBreaker', score: 4450, date: '3/2/2026' },
  { name: 'DropZone', score: 3120, date: '3/5/2026' },
  { name: 'StackAttack', score: 1780, date: '3/1/2026' },
  { name: 'Rookie', score: 540, date: '3/7/2026' },
];

// TODO: Replace with real API calls
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return [...MOCK_SCORES].sort((a, b) => b.score - a.score);
}

export async function addScore(name: string, score: number): Promise<void> {
  // Will POST to API — no-op with mock data for now
  console.log(`Score submitted: ${name} - ${score}`);
}
