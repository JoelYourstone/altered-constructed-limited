"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useSeasonSets } from "@/hooks/useSeasonSets";
import { useVaultState } from "@/hooks/useVault";

interface ParsedCard {
  name: string;
  faction: string;
  rarity: string;
  set: string;
  reference: string;
  isHero: boolean;
}

interface BoosterSummary {
  setName: string;
  totalCards: number;
  completeBoosters: number;
  remainingCards: number;
  cards: ParsedCard[];
  heroCount: number;
  commonCount: number;
  rareCount: number;
  uniqueCount: number;
  remainingHeroes: number;
  remainingCommons: number;
  remainingRareUnique: number;
  // Vault validation
  existingCardsInVault: number;
  maxAllowedCards: number;
  wouldExceedLimit: boolean;
}

export default function ImportCsvModule() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<BoosterSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: vaultState } = useVaultState();
  const { data: seasonSets } = useSeasonSets();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  function parseCSV(csvContent: string): ParsedCard[] {
    const lines = csvContent.trim().split("\n");
    const cards: ParsedCard[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(";");
      if (parts.length === 7) {
        const type = parts[4].trim().toLowerCase();
        const isHero = type === "hero";
        cards.push({
          name: parts[0].trim(),
          faction: parts[1].trim(),
          rarity: parts[2].trim(),
          set: parts[3].trim(),
          reference: parts[6].trim(),
          isHero: isHero,
        });
      } else {
        setError(`Invalid line: ${line}`);
        return [];
      }
    }

    return cards;
  }

  function calculateBoosterSummary(cards: ParsedCard[]): BoosterSummary[] {
    // Group cards by set
    const cardsBySet = cards.reduce((acc, card) => {
      if (!acc[card.set]) {
        acc[card.set] = [];
      }
      acc[card.set].push(card);
      return acc;
    }, {} as Record<string, ParsedCard[]>);

    // Calculate boosters for each set
    const summaries: BoosterSummary[] = [];

    for (const [setName, setCards] of Object.entries(cardsBySet)) {
      // Count by type and rarity
      // NOTE: Heroes fill the hero slot regardless of their rarity
      // Non-hero cards fill common or rare/unique slots based on rarity
      const heroCards = setCards.filter((c) => c.isHero);
      const commonCards = setCards.filter(
        (c) => c.rarity === "Common" && !c.isHero
      );
      const rareCards = setCards.filter(
        (c) => c.rarity === "Rare" && !c.isHero
      );
      const uniqueCards = setCards.filter(
        (c) => c.rarity === "Unique" && !c.isHero
      );

      const heroCount = heroCards.length;
      const commonCount = commonCards.length;
      const rareCount = rareCards.length;
      const uniqueCount = uniqueCards.length;
      const rareUniqueCount = rareCount + uniqueCount;

      // Each booster needs: 1 hero + 8 commons + 3 (rare OR unique)
      // So max boosters = min(heroes / 1, commons / 8, (rares + uniques) / 3)
      const maxBoostersFromHeroes = Math.floor(heroCount / 1);
      const maxBoostersFromCommons = Math.floor(commonCount / 8);
      const maxBoostersFromRareUnique = Math.floor(rareUniqueCount / 3);
      const completeBoosters = Math.min(
        maxBoostersFromHeroes,
        maxBoostersFromCommons,
        maxBoostersFromRareUnique
      );

      // Calculate remaining cards
      const remainingHeroes = heroCount - completeBoosters * 1;
      const remainingCommons = commonCount - completeBoosters * 8;
      const remainingRareUnique = rareUniqueCount - completeBoosters * 3;
      const remainingCards =
        remainingHeroes + remainingCommons + remainingRareUnique;

      const totalCards = setCards.length;

      // Check against vault limits
      const existingCardsInVault = getExistingCardsForSet(setName);
      console.log("seasonSets", seasonSets);
      const seasonSet = seasonSets?.find(
        (s) => s.set_name.toLowerCase() === setName.toLowerCase()
      );
      const maxAllowedCards = seasonSet ? seasonSet.max_packs * 12 : 0;

      // wouldExceedLimit is true if:
      // 1. The set is not in the current season (seasonSet is null)
      // 2. Adding these cards would exceed the max limit for this set
      const wouldExceedLimit =
        !seasonSet || existingCardsInVault + totalCards > maxAllowedCards;

      summaries.push({
        setName,
        totalCards,
        completeBoosters,
        remainingCards,
        cards: setCards,
        heroCount,
        commonCount,
        rareCount,
        uniqueCount,
        remainingHeroes,
        remainingCommons,
        remainingRareUnique,
        existingCardsInVault,
        maxAllowedCards,
        wouldExceedLimit,
      });
    }

    return summaries.sort((a, b) => b.totalCards - a.totalCards);
  }

  function getExistingCardsForSet(setName: string): number {
    if (!vaultState) return 0;

    const allBoosters = [
      ...vaultState.activeBoosters,
      ...vaultState.completedBoosters,
    ];

    return allBoosters
      .filter((booster) => booster.set_name === setName)
      .reduce((sum, booster) => sum + booster.cards.length, 0);
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    setSummary(null);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(
      (file) => file.type === "text/csv" || file.name.endsWith(".csv")
    );

    if (!csvFile) {
      setError("Please drop a CSV file");
      return;
    }

    setIsProcessing(true);

    try {
      const content = await csvFile.text();
      const parsedCards = parseCSV(content);

      if (parsedCards.length === 0) {
        setError("No valid cards found in CSV file");
        setIsProcessing(false);
        return;
      }

      const boosterSummary = calculateBoosterSummary(parsedCards);
      setSummary(boosterSummary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process CSV file"
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setSummary(null);
      setIsProcessing(true);

      try {
        const content = await file.text();
        const parsedCards = parseCSV(content);

        if (parsedCards.length === 0) {
          setError("No valid cards found in CSV file");
          setIsProcessing(false);
          return;
        }

        const boosterSummary = calculateBoosterSummary(parsedCards);
        setSummary(boosterSummary);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to process CSV file"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [seasonSets, vaultState]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-between items-center py-2 px-4">
        <Link
          href="/my-vault"
          className="text-sm text-foreground/70 hover:text-foreground transition-colors"
        >
          ← Back to My Vault
        </Link>
        <Link
          href="/my-vault/add-cards"
          className="text-sm text-foreground/70 hover:text-foreground transition-colors"
        >
          Or scan cards →
        </Link>
      </div>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Import Cards from CSV</h1>
        <p className="text-sm text-foreground/60 mb-6">
          Upload a CSV file with your cards to see how many boosters you can
          complete
        </p>

        {/* Drop Zone */}
        {!summary && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
            relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${
              isDragging
                ? "border-foreground bg-foreground/5"
                : "border-black/8 dark:border-white/[.145]"
            }
          `}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="pointer-events-none">
              <svg
                className="mx-auto h-12 w-12 text-foreground/40"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-foreground/70">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-foreground/50">
                Expected format: Name;Faction;Rarity;Set;Reference;IsHero
              </p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            <p className="mt-2 text-sm text-foreground/60">
              Processing CSV file...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">Import Summary</h2>

            {summary.map((setSummary) => (
              <div
                key={setSummary.setName}
                className="bg-background border border-black/8 dark:border-white/[.145] rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{setSummary.setName}</h3>
                    <p className="text-xs text-foreground/60 mt-1">
                      In vault: {setSummary.existingCardsInVault} cards / Max:{" "}
                      {setSummary.maxAllowedCards > 0
                        ? `${setSummary.maxAllowedCards} cards`
                        : "Not in current season"}
                    </p>
                    {setSummary.wouldExceedLimit && (
                      <p className="text-xs text-red-500 font-medium mt-1">
                        {setSummary.maxAllowedCards === 0
                          ? "⚠️ Set not allowed in current season"
                          : `⚠️ Would exceed limit by ${
                              setSummary.existingCardsInVault +
                              setSummary.totalCards -
                              setSummary.maxAllowedCards
                            } cards`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {setSummary.completeBoosters}
                    </div>
                    <div className="text-xs text-foreground/60">
                      Complete Boosters
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-3 border-t border-black/8 dark:border-white/[.145]">
                  <div>
                    <div className="text-sm text-foreground/60">Heroes</div>
                    <div className="text-lg font-semibold">
                      {setSummary.heroCount - setSummary.remainingHeroes}
                    </div>
                    {setSummary.remainingHeroes > 0 && (
                      <div className="text-xs text-red-500/70">
                        +{setSummary.remainingHeroes} leftover
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-foreground/60">Commons</div>
                    <div className="text-lg font-semibold">
                      {setSummary.commonCount - setSummary.remainingCommons}
                    </div>
                    {setSummary.remainingCommons > 0 && (
                      <div className="text-xs text-red-500/70">
                        +{setSummary.remainingCommons} leftover
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-foreground/60">
                      Rares/Uniques
                    </div>
                    <div className="text-lg font-semibold">
                      {setSummary.rareCount +
                        setSummary.uniqueCount -
                        setSummary.remainingRareUnique}
                    </div>
                    {setSummary.remainingRareUnique > 0 && (
                      <div className="text-xs text-red-500/70">
                        +{setSummary.remainingRareUnique} leftover
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-foreground/60">Uniques</div>
                    <div
                      className={
                        "text-lg font-semibold" +
                        (setSummary.uniqueCount > 0
                          ? " bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_8px_gold] animate-pulse"
                          : "")
                      }
                      style={
                        setSummary.uniqueCount > 0
                          ? {
                              textShadow:
                                "0 0 6px gold, 0 0 1px #fff, 1px 1px 0 #f6e27a",
                            }
                          : undefined
                      }
                    >
                      {setSummary.uniqueCount}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-foreground/60 mb-1">
                    <span>Progress</span>
                    <span>
                      {setSummary.completeBoosters * 12}/{setSummary.totalCards}{" "}
                      cards in boosters
                    </span>
                  </div>
                  <div className="w-full bg-black/8 dark:bg-white/[.145] rounded-full h-2">
                    <div
                      className="bg-foreground h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          ((setSummary.completeBoosters * 12) /
                            setSummary.totalCards) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total Summary */}
            <div className="bg-foreground/5 border border-black/8 dark:border-white/[.145] rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Total</h3>
                  <p className="text-sm text-foreground/60">Across all sets</p>
                  {summary.reduce((sum, s) => sum + s.remainingCards, 0) >
                    0 && (
                    <p className="text-sm text-red-500 font-medium mt-1">
                      {summary.reduce((sum, s) => sum + s.remainingCards, 0)}{" "}
                      cards leftover
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {summary.reduce((sum, s) => sum + s.completeBoosters, 0)}
                  </div>
                  <div className="text-xs text-foreground/60">
                    Complete Boosters
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSummary(null)}
                className="flex-1 rounded-full border border-solid border-black/8 dark:border-white/[.145] transition-colors hover:bg-foreground/5 text-sm px-4 py-2"
              >
                Clear
              </button>
              <button
                className="flex-1 rounded-full border border-solid border-transparent transition-colors bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  summary.reduce((sum, s) => sum + s.remainingCards, 0) > 0 ||
                  summary.some((s) => s.wouldExceedLimit)
                }
                onClick={() => {
                  alert(
                    "Import functionality coming soon! This will add all cards to your vault."
                  );
                }}
                title={
                  summary.some((s) => s.wouldExceedLimit)
                    ? "Cannot import: Would exceed season set limits"
                    : summary.reduce((sum, s) => sum + s.remainingCards, 0) > 0
                    ? "Cannot import: You have leftover cards that don't form complete boosters"
                    : ""
                }
              >
                Import to Vault
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        {!summary && (
          <div className="mt-8 p-4 bg-foreground/5 border border-black/8 dark:border-white/[.145] rounded-lg">
            <h3 className="font-semibold mb-2">CSV Format</h3>
            <p className="text-sm text-foreground/60 mb-2">
              Your CSV file should have the following format with semicolon (;)
              separators. Each booster needs: 1 hero + 8 commons + 3
              rare/unique.
            </p>
            <pre className="text-xs bg-background p-3 rounded border border-black/8 dark:border-white/[.145] overflow-x-auto">
              {`Name;Faction;Rarity;Set;Reference;IsHero
Flawed Prototype;Axiom;Unique;Trial by Frost;ALT_ALIZE_B_AX_38_U_15805;false
Ordis Overseer;Yzmir;Rare;Trial by Frost;ALT_ALIZE_B_OR_34_R2;false
Akesha;Axiom;Common;Core Set;ALT_CORE_B_AX_01_C;true
...`}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
