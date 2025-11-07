"use client";

import { useEffect, useRef, useState } from "react";
import { BoosterSummary } from "./ImportCsvModule";
import { useAddCardToVault } from "@/hooks/useVault";
import { AddCardRequest } from "@/app/api/vault/add-card/route";

export default function UploadImportedCards({
  summaries,
}: {
  summaries: BoosterSummary[] | null;
}) {
  if (!summaries) {
    throw new Error("Summary is required");
  }

  const addCard = useAddCardToVault();
  const [progress, setProgress] = useState(0);
  const totalCards = summaries.reduce(
    (acc, summary) => acc + summary.cards.length,
    0
  );
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasStartedRunning = useRef(false);

  console.log("summaries", summaries);

  useEffect(() => {
    if (hasStartedRunning.current) return;
    hasStartedRunning.current = true;

    async function main() {
      console.log("Importing cards");
      const summariesHash = await hash(JSON.stringify(summaries));
      if (localStorage.getItem("lastImportHash") === summariesHash) {
        console.log("Import already completed, but lets move on");
        setIsComplete(true);
        return;
      }

      let imported = 0;

      for (const summary of summaries!) {
        for (const card of summary.cards) {
          const uniqueToken = crypto.randomUUID();
          const body: AddCardRequest = {
            uniqueToken: uniqueToken,
            reference: card.reference,
          };
          try {
            await addCard.mutateAsync(body);
            imported++;
            setProgress(imported);
          } catch (error) {
            console.error("Error adding card:", error);
            setHasError(true);
          }
        }
      }

      localStorage.setItem("lastImportHash", summariesHash);
      console.log("Import completed");
      setIsComplete(true);
    }
    main().catch(console.error);
  }, [summaries, addCard]);

  const percentage =
    totalCards > 0 ? Math.round((progress / totalCards) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        {isComplete ? "✓ Import Complete!" : "Importing Cards..."}
      </h1>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2 text-sm text-foreground/60">
          <span>Progress</span>
          <span>
            {progress} / {totalCards} cards
          </span>
        </div>

        <div className="w-full h-8 bg-black/8 dark:bg-white/[.145] rounded-lg overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 ease-out flex items-center justify-center ${
              isComplete
                ? "bg-green-500 dark:bg-green-600"
                : "bg-blue-500 dark:bg-blue-600"
            }`}
            style={{ width: `${percentage}%` }}
          >
            <span className="absolute left-1/2 transform -translate-x-1/2 text-sm font-semibold text-white">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
          ⚠️ Some cards failed to import. Check the console for details.
        </div>
      )}

      {isComplete && !hasError && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200 text-center">
          All {totalCards} cards have been successfully imported to your vault!
        </div>
      )}
    </div>
  );
}

async function hash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}
