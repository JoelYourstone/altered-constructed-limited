"use client";
import { useVaultState } from "@/hooks/useVault";
import Link from "next/link";
import BoosterCardList from "@/components/BoosterCardList";
import type { CardViewData } from "@/app/api/vault/state/route";
import ThinCard from "@/components/ThinCard";

export default function AllCardsPage() {
  const { data: vault, isLoading, error } = useVaultState();

  const allBoosters = [
    ...(vault?.activeBoosters ?? []),
    ...(vault?.completedBoosters ?? []),
  ];

  // Collect all cards from all boosters
  const allCards: CardViewData[] = allBoosters
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

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/my-vault"
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
            <p className="text-foreground/70">Loading your cards...</p>
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

        {/* Cards Display */}
        {!isLoading && !error && (
          <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg">
            {allCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-foreground/70 mb-4">
                  You don't have any cards in your vault yet.
                </p>
                <Link
                  href="/my-vault/add-cards"
                  className="rounded-full border border-solid border-transparent transition-colors inline-flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm px-4 py-2"
                >
                  + Add Cards
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 gap-y-2">
                {allCards.map((card) => (
                  <ThinCard key={card.unique_token} card={card.card_data} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
