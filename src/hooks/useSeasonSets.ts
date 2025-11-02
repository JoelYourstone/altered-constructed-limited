import { useQuery } from "@tanstack/react-query";
import type { SeasonSet } from "@/app/api/season-sets/route";

/**
 * Fetch active season sets from the database
 */
async function fetchSeasonSets(): Promise<SeasonSet[]> {
  const response = await fetch("/api/season-sets");

  if (!response.ok) {
    throw new Error(`Failed to fetch season sets: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook to fetch and manage season sets using React Query
 *
 * @returns Query result containing season sets data
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: seasonSets, isLoading, error } = useSeasonSets();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {seasonSets?.map(set => (
 *         <div key={set.id}>
 *           {set.set_name}: {set.max_packs} packs
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSeasonSets() {
  return useQuery({
    queryKey: ["season-sets"],
    queryFn: fetchSeasonSets,
    staleTime: 1000 * 60 * 10, // 10 minutes - settings don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to get a specific season set by code
 *
 * @param setCode - The set code to find
 * @returns Query result containing the specific season set
 */
export function useSeasonSet(setCode: string) {
  const query = useSeasonSets();

  return {
    ...query,
    data: query.data?.find((set) => set.set_code === setCode),
  };
}

/**
 * Hook to get the total number of allowed packs across all active sets
 *
 * @returns Query result with total packs count
 */
export function useTotalPacks() {
  const query = useSeasonSets();

  return {
    ...query,
    data: query.data?.reduce((total, set) => total + set.max_packs, 0) ?? 0,
  };
}
