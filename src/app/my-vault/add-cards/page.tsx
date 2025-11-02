"use client";

import { useRef } from "react";
import CardScanner from "@/components/CardScanner";
import ProcessingScanArea, {
  ProcessingScanAreaRef,
} from "@/components/ProcessingScanArea";
import {
  useScanningState,
  useAddCard,
  useClearScanning,
  useRemoveFailedScan,
} from "@/hooks/useScanning";
import { ScannedCard } from "@/lib/scanningState";
import ThinCard from "@/components/ThinCard";
import BoosterCardList from "@/components/BoosterCardList";
import CompletedBoostersSection from "@/components/CompletedBoostersSection";

export default function AddCardsPage() {
  const processingRef = useRef<ProcessingScanAreaRef>(null);

  const { data: scanningState } = useScanningState();
  const addCardMutation = useAddCard();
  const clearScanningMutation = useClearScanning();
  const removeFailedScanMutation = useRemoveFailedScan();

  function handleTinyUrlScan(tinyUrl: string) {
    processingRef.current?.onTinyUrlScan(tinyUrl);
  }

  function handleFailedScan(tinyUrl: string | null, error: string) {
    if (tinyUrl) {
      processingRef.current?.onFailure(tinyUrl, error);
    }
  }

  async function handleFullCardScan(tinyUrl: string, cardObject: any) {
    try {
      const response = await fetch(
        `https://api.altered.gg/public/cards/${cardObject.card.reference}?locale=en-us`
      );
      const data = (await response.json()) as any;

      const card: ScannedCard = {
        uniqueToken: tinyUrl, // Store the physical card identifier
        reference: data.reference,
        name: data.name,
        rarity: data.rarity.reference,
        cardType: data.cardType.reference,
        cardTypeString: data.cardType.name,
        cardSubtypeString: data.cardSubTypes?.[0]?.name,
        cardSet: {
          code: data.cardSet.code,
          name: data.cardSet.name,
        },
        faction: data.mainFaction,
        imagePath: data?.imagePath,
      };

      console.log(data);

      // Add card using TanStack Query mutation
      addCardMutation.mutate(card, {
        onError: (error) => {
          if (error instanceof Error) {
            alert(error.message);
          }
        },
      });
      processingRef.current?.onSuccess(tinyUrl);
    } catch (error) {
      console.error("Error fetching card data:", error);
      alert("Failed to fetch card data. Please try again.");
    }
  }

  const handleClearAll = () => {
    if (
      confirm(
        "Are you sure you want to clear all scanned cards? This cannot be undone."
      )
    ) {
      clearScanningMutation.mutate();
    }
  };

  const activeBoosters = scanningState ? scanningState.activeBoosters : [];
  const completedBoosters = scanningState
    ? scanningState.completedBoosters
    : {};
  const failedScans = scanningState ? scanningState.failedScans : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Scanner */}
      <div className="relative">
        <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border border-black/[.08] dark:border-white/[.145]">
          <CardScanner
            onTinyUrlScan={handleTinyUrlScan}
            onFullCardScan={handleFullCardScan}
            onFailedScan={handleFailedScan}
          />
        </div>
        <div className="text-sm text-foreground/60 absolute bottom-0  text-center w-full mb-4">
          <p
            className="bg text-white px-4 py-2 rounded-full"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "inline",
            }}
          >
            Scan cards to add to your vault
          </p>
        </div>
      </div>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Processing Area */}
        <ProcessingScanArea ref={processingRef} />

        {/* Active Boosters Progress */}
        {activeBoosters.length > 0 && (
          <div className="mb-6 space-y-3">
            {activeBoosters.map((setBooster) => {
              const totalProgress =
                setBooster.progress.hero +
                setBooster.progress.common +
                setBooster.progress.rare +
                setBooster.progress.unique;
              const totalNeeded = 12;
              const progressPercentage = (totalProgress / totalNeeded) * 100;

              // Count how many boosters of this set exist
              const boostersOfSameSet = activeBoosters.filter(
                (b) => b.setCode === setBooster.setCode
              );
              const boosterNumber =
                boostersOfSameSet.findIndex(
                  (b) => b.boosterId === setBooster.boosterId
                ) + 1;
              const showBoosterNumber = boostersOfSameSet.length > 1;

              return (
                <div
                  key={setBooster.boosterId}
                  className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">
                      {setBooster.setName}
                      {showBoosterNumber && ` #${boosterNumber}`}
                    </h3>
                    <span className="text-sm text-foreground/60">
                      {totalProgress}/12
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-foreground/10 rounded-full h-2">
                      <div
                        className="bg-foreground h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Compact Progress */}
                  <div className="grid grid-cols-4 gap-2 text-center text-sm mb-2">
                    <div>
                      <div className="font-bold">
                        {setBooster.progress.hero}/1
                      </div>
                      <div className="text-xs text-foreground/60">Hero</div>
                    </div>
                    <div>
                      <div className="font-bold">
                        {setBooster.progress.common}/8
                      </div>
                      <div className="text-xs text-foreground/60">Common</div>
                    </div>
                    <div>
                      <div className="font-bold">
                        {setBooster.progress.rare + setBooster.progress.unique}
                        /3
                      </div>
                      <div className="text-xs text-foreground/60">Rare</div>
                    </div>
                    <div>
                      <div className="font-bold">
                        {setBooster.progress.unique}
                      </div>
                      <div className="text-xs text-foreground/60">Unique</div>
                    </div>
                  </div>

                  {/* Show/Hide Cards */}
                  <BoosterCardList cards={setBooster.cards} variant="active" />
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Boosters */}
        <CompletedBoostersSection completedBoosters={completedBoosters} />

        {/* Failed Scans */}
        {failedScans.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className="font-semibold text-sm text-red-500/70">
              You have reached the set limit for these cards. <br />
              These cards are NOT part of your vault.
            </h2>
            <div className="space-y-1">
              {failedScans.map((failedScan) => (
                <ThinCard key={failedScan.timestamp} card={failedScan.card} />
              ))}
            </div>

            <button
              onClick={() =>
                failedScans.forEach((failedScan) =>
                  removeFailedScanMutation.mutate(failedScan.timestamp)
                )
              }
              type="button"
              className="w-full rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors py-3 font-medium disabled:opacity-50 mt-4"
            >
              OK, I have sorted them out, clear list.
            </button>
          </div>
        )}

        {/* Clear All Button */}
        {process.env.NODE_ENV === "development" &&
          (activeBoosters.length > 0 ||
            Object.keys(completedBoosters).length > 0) && (
            <div className="mt-8 pt-6 border-t border-black/[.08] dark:border-white/[.145]">
              <button
                onClick={handleClearAll}
                disabled={clearScanningMutation.isPending}
                className="w-full rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors py-3 font-medium disabled:opacity-50"
              >
                {clearScanningMutation.isPending
                  ? "Clearing..."
                  : "Clear All Data"}
              </button>
            </div>
          )}
      </main>
    </div>
  );
}
