import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  VaultState,
  VaultBoosterViewData,
} from "@/app/api/vault/state/route";
import type { AddCardRequest } from "@/app/api/vault/add-card/route";

const VAULT_QUERY_KEY = ["vault-state"];

/**
 * Fetch vault state from the database
 */
async function fetchVaultState(): Promise<VaultState> {
  console.log("Fetching vault state");
  const response = await fetch("/api/vault/state");

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to fetch vault state" }));
    throw new Error(
      (error as { error: string }).error ||
        `Failed to fetch vault state: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Add a card to the vault
 */
async function addCardToVault(card: AddCardRequest): Promise<void> {
  console.log("Adding card to vault", card);
  const response = await fetch("/api/vault/add-card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to add card" }));
    throw new Error((error as { error: string }).error || "Failed to add card");
  }
}

/**
 * Hook to fetch and manage vault state from the database
 *
 * @returns Query result containing vault state
 *
 * @example
 * ```tsx
 * function VaultPage() {
 *   const { data: vault, isLoading, error } = useVaultState();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       <h2>Active Boosters: {vault?.activeBoosters.length}</h2>
 *       {vault?.activeBoosters.map(booster => (
 *         <div key={booster.id}>
 *           {booster.set_name}: {booster.cards.length}/12 cards
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useVaultState() {
  return useQuery({
    queryKey: VAULT_QUERY_KEY,
    queryFn: fetchVaultState,
    staleTime: 1000 * 30, // 30 seconds - vault data updates frequently during scanning
  });
}

/**
 * Hook to add a card to the vault
 *
 * @returns Mutation function to add cards
 *
 * @example
 * ```tsx
 * function ScannerComponent() {
 *   const addCard = useAddCardToVault();
 *
 *   const handleScan = async (cardData) => {
 *     await addCard.mutateAsync({
 *       uniqueToken: 'tiny.cc/abc123',
 *       reference: 'ALT_CORE_B_AX_01_C',
 *       cardData: {
 *         name: 'Akesha',
 *         rarity: 'RARE',
 *         cardType: 'HERO',
 *         cardSet: { code: 'COREKS', name: 'Core Set' }
 *       }
 *     });
 *   };
 * }
 * ```
 */
export function useAddCardToVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCardToVault,
    onSuccess: () => {
      // Invalidate and refetch vault state
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEY });
    },
  });
}

/**
 * Hook to get active boosters with calculated progress
 */
export function useActiveBoosters() {
  const { data: vault, ...rest } = useVaultState();

  return {
    ...rest,
    data:
      vault?.activeBoosters.map((booster) => {
        const progress = calculateBoosterProgress(booster);
        return {
          ...booster,
          progress,
        };
      }) || [],
  };
}

/**
 * Hook to get completed boosters grouped by set
 */
export function useCompletedBoosters() {
  const { data: vault, ...rest } = useVaultState();

  return {
    ...rest,
    data: vault?.completedBoosters || {},
  };
}

/**
 * Calculate progress counts for a booster
 */
function calculateBoosterProgress(booster: VaultBoosterViewData) {
  let heroCount = 0;
  let commonCount = 0;
  let rareCount = 0;
  let uniqueCount = 0;

  booster.cards.forEach((card) => {
    try {
      const cardData = card.card_data;
      if (cardData.cardType.reference === "HERO") {
        heroCount++;
      } else if (cardData.rarity.reference === "COMMON") {
        commonCount++;
      } else if (cardData.rarity.reference === "RARE") {
        rareCount++;
      } else if (cardData.rarity.reference === "UNIQUE") {
        uniqueCount++;
      }
    } catch (error) {
      console.error("Error parsing card data:", error);
    }
  });

  return {
    hero: heroCount,
    common: commonCount,
    rare: rareCount,
    unique: uniqueCount,
  };
}

/**
 * Parse card data from JSON string
 */
export function parseCardData(card: { card_data: string }) {
  try {
    return JSON.parse(card.card_data);
  } catch (error) {
    console.error("Error parsing card data:", error);
    return null;
  }
}
