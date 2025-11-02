// Persistence layer for scanning state using localStorage

export interface Faction {
  reference: string;
  color: string;
  id: string;
  name: string;
}

export interface ScannedCard {
  uniqueToken: string; // Physical card identifier
  reference: string;
  name: string;
  rarity: string;
  cardType: string;
  cardTypeString: string;
  cardSubtypeString?: string;
  cardSet: {
    code: string;
    name: string;
  };
  imagePath?: string;
  faction?: Faction;
}

export interface BoosterProgress {
  hero: number;
  common: number;
  rare: number;
  unique: number;
}

export interface SetBoosterProgress {
  setCode: string;
  setName: string;
  progress: BoosterProgress;
  cards: ScannedCard[];
  boosterId: string; // Unique identifier for this specific booster
}

export interface FailedScan {
  card: ScannedCard;
  reason: string;
  timestamp: number;
}

export interface CompletedBooster {
  count: number;
  setName: string;
  cards: ScannedCard[][]; // Array of card arrays, one for each completed booster
}

export interface ScanningState {
  activeBoosters: SetBoosterProgress[]; // Array of all active boosters
  completedBoosters: Record<string, CompletedBooster>;
  failedScans: FailedScan[];
}

const SCANNING_STATE_KEY = "vault_scanning_state";

export function getScanningState(): ScanningState {
  if (typeof window === "undefined") {
    return { activeBoosters: [], completedBoosters: {}, failedScans: [] };
  }

  const stored = localStorage.getItem(SCANNING_STATE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      let needsMigration = false;
      let state = parsed;
      
      // Ensure failedScans exists
      if (!state.failedScans) {
        state.failedScans = [];
        needsMigration = true;
      }
      
      // Migrate completedBoosters to include cards array
      if (state.completedBoosters) {
        const migratedCompleted: Record<string, any> = {};
        for (const [setCode, boosterData] of Object.entries(state.completedBoosters)) {
          if (!boosterData || typeof boosterData !== 'object') continue;
          const data = boosterData as any;
          if (!data.cards) {
            // Old format - add empty cards array
            migratedCompleted[setCode] = {
              count: data.count,
              setName: data.setName,
              cards: [],
            };
            needsMigration = true;
          } else {
            migratedCompleted[setCode] = data;
          }
        }
        state.completedBoosters = migratedCompleted;
      }
      
      // Handle migration from old object-based format to new array format
      if (parsed.activeBoosters && !Array.isArray(parsed.activeBoosters)) {
        const boosters = Object.values(parsed.activeBoosters).map((b: any, index: number) => ({
          ...b,
          boosterId: b.boosterId || `${b.setCode}_migrated_${index}`,
        }));
        state = { ...parsed, activeBoosters: boosters, failedScans: state.failedScans, completedBoosters: state.completedBoosters };
        needsMigration = true;
      }
      
      // Ensure all boosters have a boosterId
      if (Array.isArray(state.activeBoosters)) {
        const boostersWithIds = state.activeBoosters.map((b: any, index: number) => {
          if (!b.boosterId) {
            needsMigration = true;
            return {
              ...b,
              boosterId: `${b.setCode}_${Date.now()}_${index}`,
            };
          }
          return b;
        });
        state = { ...state, activeBoosters: boostersWithIds };
      }
      
      // Save migrated state back to localStorage
      if (needsMigration) {
        console.log("Migrating scanning state, saving back to localStorage");
        saveScanningState(state);
      }
      
      return state;
    } catch {
      return { activeBoosters: [], completedBoosters: {}, failedScans: [] };
    }
  }

  return { activeBoosters: [], completedBoosters: {}, failedScans: [] };
}

export function saveScanningState(state: ScanningState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SCANNING_STATE_KEY, JSON.stringify(state));
}

export function clearScanningState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SCANNING_STATE_KEY);
}

