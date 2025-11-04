"use client";

import { useRef } from "react";
import CardScanner from "@/components/CardScanner";
import ProcessingScanArea, {
  ProcessingScanAreaRef,
} from "@/components/ProcessingScanArea";
import {
  useFailedScans,
  useAddFailedScan,
  useRemoveFailedScan,
} from "@/hooks/useScanning";
import { useVaultState, useAddCardToVault } from "@/hooks/useVault";
import ThinCard from "@/components/ThinCard";
import BoosterCardList from "@/components/BoosterCardList";
import CompletedBoostersSection from "@/components/CompletedBoostersSection";
import type { CardData } from "@/lib/card-data";
import { AddCardRequest } from "@/app/api/vault/add-card/route";
import Link from "next/link";

export default function AddCardsModule() {
  const processingRef = useRef<ProcessingScanAreaRef>(null);

  const { data: vaultState } = useVaultState();
  const { data: failedScansState } = useFailedScans();
  const addCardMutation = useAddCardToVault();
  const addFailedScanMutation = useAddFailedScan();
  const removeFailedScanMutation = useRemoveFailedScan();

  console.log(vaultState);

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
      const cardInVault = [
        ...(vaultState?.activeBoosters || []),
        ...(vaultState?.completedBoosters || []),
      ]
        .flatMap((booster) => booster.cards)
        .find((card) => card.unique_token === tinyUrl);
      if (cardInVault) {
        console.log("Card already scanned");
        processingRef.current?.onFailure(tinyUrl, "Card already scanned");
        return;
      }

      const failedScan = failedScansState?.failedScans.find(
        (failedScan) => failedScan.uniqueToken === tinyUrl
      );
      if (failedScan) {
        console.log("Card already failed to scan");
        processingRef.current?.onFailure(tinyUrl, "Card already scanned");
        return;
      }

      const response = await fetch(`/api/cards/${cardObject.card.reference}`);
      const data = (await response.json()) as CardData;

      const cardRequest = {
        uniqueToken: tinyUrl,
        reference: data.reference,
        card: data,
      } satisfies AddCardRequest;

      console.log(data);

      // Add card to vault using database
      await addCardMutation.mutateAsync(cardRequest);
      processingRef.current?.onSuccess(tinyUrl);
    } catch (error) {
      console.error("Error adding card:", error);

      // If it's a limit error, add to failed scans
      if (error instanceof Error) {
        if (
          error.message.includes("limit reached") ||
          error.message.includes("not active")
        ) {
          const response = await fetch(
            `/api/cards/${cardObject.card.reference}`
          );
          const data = (await response.json()) as CardData;

          addFailedScanMutation.mutate({
            uniqueToken: tinyUrl,
            card: data,
            reason: error.message,
            timestamp: Date.now(),
          });
          processingRef.current?.onSuccess(tinyUrl);
        } else {
          alert(error.message);
        }
      }
    }
  }

  const activeBoosters = vaultState ? vaultState.activeBoosters : [];
  const completedBoosters = vaultState ? vaultState.completedBoosters : [];
  const failedScans = failedScansState ? failedScansState.failedScans : [];

  return (
    <div className="min-h-screen bg-background">
      <Link
        href="/my-vault"
        className="text-sm text-foreground/70 hover:text-foreground transition-colors py-2 px-4  block"
      >
        ← Back to My Vault
      </Link>
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
            {activeBoosters.map((booster) => {
              // Calculate progress from cards
              let heroCount = 0;
              let commonCount = 0;
              let rareCount = 0;
              let uniqueCount = 0;

              booster.cards.forEach((card) => {
                if (card.card_data.cardType.reference === "HERO") {
                  heroCount++;
                } else if (card.card_data.rarity.reference === "COMMON") {
                  commonCount++;
                } else if (card.card_data.rarity.reference === "RARE") {
                  rareCount++;
                } else if (card.card_data.rarity.reference === "UNIQUE") {
                  uniqueCount++;
                }
              });

              const totalProgress =
                heroCount + commonCount + rareCount + uniqueCount;
              const totalNeeded = 12;
              const progressPercentage = (totalProgress / totalNeeded) * 100;

              // Count how many boosters of this set exist
              const boostersOfSameSet = activeBoosters.filter(
                (b) => b.set_code === booster.set_code
              );
              const boosterNumber =
                boostersOfSameSet.findIndex((b) => b.id === booster.id) + 1;
              const showBoosterNumber = boostersOfSameSet.length > 1;

              return (
                <div
                  key={booster.id}
                  className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">
                      {booster.set_name}
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
                      <div className="font-bold">{heroCount}/1</div>
                      <div className="text-xs text-foreground/60">Hero</div>
                    </div>
                    <div>
                      <div className="font-bold">{commonCount}/8</div>
                      <div className="text-xs text-foreground/60">Common</div>
                    </div>
                    <div>
                      <div className="font-bold">
                        {rareCount + uniqueCount}/3
                      </div>
                      <div className="text-xs text-foreground/60">Rare</div>
                    </div>
                    <div>
                      <div className="font-bold">{uniqueCount}</div>
                      <div className="text-xs text-foreground/60">Unique</div>
                    </div>
                  </div>

                  {/* Show/Hide Cards */}
                  <BoosterCardList cards={booster.cards} variant="active" />
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
      </main>
    </div>
  );
}
