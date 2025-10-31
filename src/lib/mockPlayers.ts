// Mock data for registered players and their vaults

export interface SetVault {
  setName: string;
  boosterCount: number;
  seasonLimit: number;
  cards: {
    common: number;
    rare: number;
    unique: number;
  };
}

export interface Player {
  alteredId: string;
  email: string;
  vault: SetVault[];
  joinedDate: string;
}

// Mock players data
export const mockPlayers: Player[] = [
  {
    alteredId: "DragonSlayer42",
    email: "dragon@example.com",
    vault: [
      {
        setName: "Whispers from the Maze",
        boosterCount: 10,
        seasonLimit: 10,
        cards: { common: 80, rare: 15, unique: 5 },
      },
      {
        setName: "Skybound Odyssey",
        boosterCount: 12,
        seasonLimit: 12,
        cards: { common: 96, rare: 18, unique: 6 },
      },
    ],
    joinedDate: "2025-10-15",
  },
  {
    alteredId: "MysticMage",
    email: "mystic@example.com",
    vault: [
      {
        setName: "Whispers from the Maze",
        boosterCount: 8,
        seasonLimit: 10,
        cards: { common: 64, rare: 12, unique: 4 },
      },
      {
        setName: "Skybound Odyssey",
        boosterCount: 10,
        seasonLimit: 12,
        cards: { common: 80, rare: 15, unique: 5 },
      },
    ],
    joinedDate: "2025-10-20",
  },
  {
    alteredId: "ShadowNinja",
    email: "shadow@example.com",
    vault: [
      {
        setName: "Whispers from the Maze",
        boosterCount: 6,
        seasonLimit: 10,
        cards: { common: 48, rare: 9, unique: 3 },
      },
      {
        setName: "Skybound Odyssey",
        boosterCount: 8,
        seasonLimit: 12,
        cards: { common: 64, rare: 12, unique: 4 },
      },
    ],
    joinedDate: "2025-10-25",
  },
  {
    alteredId: "PhoenixRising",
    email: "phoenix@example.com",
    vault: [
      {
        setName: "Whispers from the Maze",
        boosterCount: 10,
        seasonLimit: 10,
        cards: { common: 80, rare: 15, unique: 5 },
      },
      {
        setName: "Skybound Odyssey",
        boosterCount: 11,
        seasonLimit: 12,
        cards: { common: 88, rare: 16, unique: 6 },
      },
    ],
    joinedDate: "2025-10-18",
  },
  {
    alteredId: "StormBreaker",
    email: "storm@example.com",
    vault: [
      {
        setName: "Whispers from the Maze",
        boosterCount: 7,
        seasonLimit: 10,
        cards: { common: 56, rare: 10, unique: 4 },
      },
      {
        setName: "Skybound Odyssey",
        boosterCount: 9,
        seasonLimit: 12,
        cards: { common: 72, rare: 13, unique: 5 },
      },
    ],
    joinedDate: "2025-10-22",
  },
];

export function getPlayerByAlteredId(alteredId: string): Player | undefined {
  return mockPlayers.find(p => p.alteredId === alteredId);
}

export function getAllPlayers(): Player[] {
  return mockPlayers;
}

