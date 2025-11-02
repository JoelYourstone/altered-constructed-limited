import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getScanningState,
  saveScanningState,
  ScannedCard,
  ScanningState,
  SetBoosterProgress,
} from "@/lib/scanningState";

const SCANNING_QUERY_KEY = ["scanning-state"];
const MAX_BOOSTERS_PER_SET = 0; // Hard-coded limit for testing

export function useScanningState() {
  return useQuery({
    queryKey: SCANNING_QUERY_KEY,
    queryFn: getScanningState,
  });
}

export function useAddCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: ScannedCard) => {
      const currentState = getScanningState();

      // Check if this physical card (uniqueToken) has already been scanned
      const allCards = currentState.activeBoosters.flatMap((b) => b.cards);

      const isDuplicate = allCards.some(
        (c) => c.uniqueToken === card.uniqueToken
      );

      if (isDuplicate) {
        console.log("Duplicate card detected:", card.uniqueToken);
        return currentState;
      }

      const setCode = card.cardSet.code;

      // Helper function to check if a card can fit in a booster
      const canFitCard = (booster: SetBoosterProgress): boolean => {
        if (card.cardType === "HERO") {
          return booster.progress.hero < 1;
        } else if (card.rarity === "COMMON") {
          return booster.progress.common < 8;
        } else if (card.rarity === "RARE" || card.rarity === "UNIQUE") {
          return booster.progress.rare + booster.progress.unique < 3;
        }
        return false;
      };

      // Find the first booster for this set that has room for this card
      let targetBooster = currentState.activeBoosters.find(
        (b) => b.setCode === setCode && canFitCard(b)
      );

      const isNewBooster = !targetBooster;

      // If no booster has room, check if we can create a new one
      if (!targetBooster) {
        const boostersForThisSet = currentState.activeBoosters.filter(
          (b) => b.setCode === setCode
        );
        
        // Check if we've hit the limit for this set
        if (boostersForThisSet.length >= MAX_BOOSTERS_PER_SET) {
          console.log(`Cannot create new booster for ${setCode}: limit of ${MAX_BOOSTERS_PER_SET} reached`);
          // Add to failed scans
          const newState: ScanningState = {
            ...currentState,
            failedScans: [
              ...currentState.failedScans,
              {
                card,
                reason: `Maximum ${MAX_BOOSTERS_PER_SET} boosters per set limit reached`,
                timestamp: Date.now(),
              },
            ],
          };
          saveScanningState(newState);
          return newState;
        }
        
        console.log(
          `Creating new booster for ${setCode}, card type: ${card.cardType}, rarity: ${card.rarity}`
        );
        targetBooster = {
          setCode,
          setName: card.cardSet.name,
          progress: { hero: 0, common: 0, rare: 0, unique: 0 },
          cards: [],
          boosterId: `${setCode}_${Date.now()}_${Math.random()}`,
        };
      } else {
        console.log(`Adding to existing booster ${targetBooster.boosterId}`);
      }

      // Add card
      const updatedCards = [...targetBooster.cards, card];

      // Update progress
      const newProgress = { ...targetBooster.progress };

      if (card.cardType === "HERO") {
        newProgress.hero += 1;
      } else if (card.rarity === "COMMON") {
        newProgress.common += 1;
      } else if (card.rarity === "RARE") {
        newProgress.rare += 1;
      } else if (card.rarity === "UNIQUE") {
        newProgress.unique += 1;
      }

      // Create updated booster
      const updatedBooster: SetBoosterProgress = {
        ...targetBooster,
        progress: newProgress,
        cards: updatedCards,
      };

      // Update active boosters array
      // If this is a new booster, add it to the end
      // If updating existing, replace it IN PLACE to maintain order
      let updatedBoosters: SetBoosterProgress[];

      if (isNewBooster) {
        // Add new booster to the end
        updatedBoosters = [...currentState.activeBoosters, updatedBooster];
        console.log(
          `Added new booster, now have ${updatedBoosters.length} boosters`
        );
      } else {
        // Replace existing booster in place to maintain order
        updatedBoosters = currentState.activeBoosters.map((b) =>
          b.boosterId === targetBooster!.boosterId ? updatedBooster : b
        );
        console.log(
          `Updated existing booster ${targetBooster!.boosterId} in place`
        );
      }

      const newState: ScanningState = {
        ...currentState,
        activeBoosters: updatedBoosters,
      };

      console.log(
        `New state has ${newState.activeBoosters.length} active boosters`
      );

      // Check if booster is complete
      const totalRaresAndUniques = newProgress.rare + newProgress.unique;
      const isComplete =
        newProgress.hero === 1 &&
        newProgress.common === 8 &&
        totalRaresAndUniques === 3;

      if (isComplete) {
        // Move to completed
        const existingCompleted = newState.completedBoosters[setCode];
        newState.completedBoosters = {
          ...newState.completedBoosters,
          [setCode]: {
            count: existingCompleted ? existingCompleted.count + 1 : 1,
            setName: card.cardSet.name,
          },
        };

        // Remove this booster from active
        newState.activeBoosters = newState.activeBoosters.filter(
          (b) => b.boosterId !== updatedBooster.boosterId
        );
      }

      saveScanningState(newState);
      return newState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(SCANNING_QUERY_KEY, newState);
    },
  });
}

export function useClearScanning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const emptyState: ScanningState = {
        activeBoosters: [],
        completedBoosters: {},
        failedScans: [],
      };
      saveScanningState(emptyState);
      return emptyState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(SCANNING_QUERY_KEY, newState);
    },
  });
}

export function useRemoveFailedScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timestamp: number) => {
      const currentState = getScanningState();
      const newState: ScanningState = {
        ...currentState,
        failedScans: currentState.failedScans.filter(
          (f) => f.timestamp !== timestamp
        ),
      };
      saveScanningState(newState);
      return newState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(SCANNING_QUERY_KEY, newState);
    },
  });
}
