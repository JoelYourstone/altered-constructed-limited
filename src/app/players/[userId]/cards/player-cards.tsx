"use client";
import { useVaultState } from "@/hooks/useVault";
import Link from "next/link";
import type { CardViewData } from "@/app/api/vault/state/route";
import ThinCard from "@/components/ThinCard";
import { useState } from "react";

export default function PlayerCards({ userId }: { userId: string }) {
  console.log("userId", userId);
  const { data: vault, isLoading, error } = useVaultState(userId);

  const [showImages, setShowImages] = useState(false);
  const allBoosters = [
    ...(vault?.activeBoosters ?? []),
    ...(vault?.completedBoosters ?? []),
  ];

  // Collect all cards from all boosters
  let allCards: CardViewData[] = allBoosters
    .flatMap((booster) => booster.cards)
    .sort((a, b) => {
      const rarityOrder = ["UNIQUE", "RARE", "COMMON"];
      return (
        rarityOrder.indexOf(a.card_data.rarity.reference) -
        rarityOrder.indexOf(b.card_data.rarity.reference)
      );
    })
    .sort((a, b) => {
      if (a.card_data.cardType.reference === "HERO") {
        return -1;
      } else if (b.card_data.cardType.reference === "HERO") {
        return 1;
      }
      return 0;
    });

  // filters
  // allCards = allCards.filter(
  //   (card) =>
  //     card.card_data.cardSet.name.toLowerCase() === "whispers from the maze" &&
  //     card.card_data.cardType.reference !== "HERO" &&
  //     card.card_data.mainFaction.name.toLowerCase() === "yzmir"
  // );

  if (
    globalThis.document &&
    globalThis.document.location.search.includes("sealed")
  ) {
    allCards = allCards.filter(
      (card) =>
        card.card_data.cardSet.name.toLowerCase() === "skybound odyssey" &&
        // card.card_data.cardType.reference !== "HERO" &&
        // card.card_data.mainFaction.name.toLowerCase() === "yzmir"
        true &&
        new Date(card.scanned_at) >= new Date("2025-11-12T00:00:00Z")
    );
  }

  const factionsNameLowerCase = [
    "yzmir",
    "bravos",
    "axiom",
    "lyra",
    "muna",
    "ordis",
  ];

  const factionStatistics = factionsNameLowerCase.map((faction) => {
    return {
      name: faction,
      count: allCards.filter(
        (card) => card.card_data.mainFaction.name.toLowerCase() === faction
      ).length,
      distinctHeroes: allCards.filter(
        (card) =>
          card.card_data.mainFaction.name.toLowerCase() === faction &&
          card.card_data.cardType.reference === "HERO"
      ).length,
      rares: allCards.filter(
        (card) =>
          card.card_data.mainFaction.name.toLowerCase() === faction &&
          card.card_data.rarity.reference === "RARE"
      ).length,
      uniques: allCards.filter(
        (card) =>
          card.card_data.mainFaction.name.toLowerCase() === faction &&
          card.card_data.rarity.reference === "UNIQUE"
      ).length,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/players/${userId}`}
            className="text-sm text-foreground/70 hover:text-foreground mb-4 inline-block"
          >
            ← Back to Vault
          </Link>
          <p className="text-foreground/70">
            Total: {allCards.length} card{allCards.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-foreground/70">
              Loading this player&apos;s cards...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">
              Failed to load cards. Please try again.
            </p>
          </div>
        )}

        {/* Faction statistics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Faction Statistics</h2>
          <div className="grid grid-cols-4 gap-4">
            {factionStatistics.map((faction) => (
              <div key={faction.name}>
                <p className="text-foreground/70">{faction.name}</p>
                <p className="text-foreground/70">Total: {faction.count}</p>
                <p className="text-foreground/70">
                  Heroes: {faction.distinctHeroes}
                </p>
                <p className="text-foreground/70">Rares: {faction.rares}</p>
                <p className="text-foreground/70">Uniques: {faction.uniques}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <button
            type="button"
            onClick={() => {
              setShowImages(!showImages);
            }}
            className="rounded-full border border-solid border-foreground transition-colors inline-flex items-center justify-center bg-background text-foreground hover:bg-foreground hover:text-background font-medium text-sm px-4 py-2"
            // This is a mock button for now, does not have functionality
          >
            Show images
          </button>
        </div>

        {/* Cards Display */}
        {!isLoading && !error && (
          <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg">
            {allCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-foreground/70 mb-4">
                  No cards in this player&apos;s vault yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 gap-y-2">
                {!showImages
                  ? allCards.map((card) => (
                      <ThinCard key={card.unique_token} card={card.card_data} />
                    ))
                  : allCards.map((card) => (
                      <img
                        key={card.unique_token}
                        src={card.card_data.imagePath}
                        alt={card.card_data.name}
                      />
                    ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
