import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CardData } from "@/lib/card-data";

const FAILED_SCANS_QUERY_KEY = ["failed-scans"];

export interface FailedScan {
  uniqueToken: string;
  card: CardData;
  reason: string;
  timestamp: number;
}

interface FailedScansState {
  failedScans: FailedScan[];
}

// Client-side only - failed scans storage
function getFailedScans(): FailedScansState {
  if (typeof window === "undefined") {
    return { failedScans: [] };
  }

  const stored = localStorage.getItem("failed_scans");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { failedScans: [] };
    }
  }

  return { failedScans: [] };
}

function saveFailedScans(state: FailedScansState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("failed_scans", JSON.stringify(state));
}

export function useFailedScans() {
  return useQuery({
    queryKey: FAILED_SCANS_QUERY_KEY,
    queryFn: getFailedScans,
  });
}

export function useAddFailedScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (failedScan: FailedScan) => {
      const currentState = getFailedScans();
      const newState: FailedScansState = {
        failedScans: [...currentState.failedScans, failedScan],
      };
      saveFailedScans(newState);
      return newState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(FAILED_SCANS_QUERY_KEY, newState);
    },
  });
}

export function useClearFailedScans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const emptyState: FailedScansState = {
        failedScans: [],
      };
      saveFailedScans(emptyState);
      return emptyState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(FAILED_SCANS_QUERY_KEY, newState);
    },
  });
}

export function useRemoveFailedScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timestamp: number) => {
      const currentState = getFailedScans();
      const newState: FailedScansState = {
        failedScans: currentState.failedScans.filter(
          (f) => f.timestamp !== timestamp
        ),
      };
      saveFailedScans(newState);
      return newState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(FAILED_SCANS_QUERY_KEY, newState);
    },
  });
}
