import { useState } from "react";
import { CompletedBooster } from "@/lib/scanningState";
import BoosterCardList from "./BoosterCardList";

interface ActiveSet {
  code: string;
  name: string;
}

interface CompletedBoostersSectionProps {
  completedBoosters: Record<string, CompletedBooster>;
  maxBoostersPerSet: number;
  activeSets: readonly ActiveSet[];
}

export default function CompletedBoostersSection({
  completedBoosters,
  maxBoostersPerSet,
  activeSets,
}: CompletedBoostersSectionProps) {
  const [showAllBoosters, setShowAllBoosters] = useState(false);

  // Create a set of active set codes for quick lookup
  const activeSetCodes = new Set(activeSets.map((s) => s.code));

  // First, collect all scanned sets with their data
  const scannedSetsData = Object.entries(completedBoosters).map(([setCode, boosterData]) => ({
    setCode,
    setName: boosterData.setName,
    count: boosterData.count,
    cards: boosterData.cards,
    isActive: activeSetCodes.has(setCode), // Check if this set is in active sets
  }));

  // Then, find active sets that haven't been scanned yet
  const scannedSetCodes = new Set(scannedSetsData.map((s) => s.setCode));
  const unscannedSetsData = activeSets
    .filter((set) => !scannedSetCodes.has(set.code))
    .map((set) => ({
      setCode: set.code,
      setName: set.name,
      count: 0,
      cards: [],
      isActive: true,
    }));

  // Combine: scanned sets first, then unscanned sets
  const allSetsData = [...scannedSetsData, ...unscannedSetsData];

  const hasAnyBoosters = allSetsData.some((set) => set.count > 0);

  // Calculate total boosters count
  const totalBoostersCount = allSetsData.reduce(
    (sum, set) => sum + set.count,
    0
  );

  return (
    <div className="mb-6 space-y-2">
      <h2 className="font-semibold text-sm text-foreground/70">
        Completed boosters in Vault ({totalBoostersCount})
      </h2>

      {!showAllBoosters ? (
        <>
          {/* Summary View */}
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
            {allSetsData.map((set) => {
              const maxLimit = set.isActive ? maxBoostersPerSet : 0;
              const isInactive = !set.isActive;
              const isEmpty = set.count === 0;
              
              // Determine colors
              let textColor = "";
              if (isInactive) {
                textColor = "text-red-600 dark:text-red-400 font-medium";
              } else if (isEmpty) {
                textColor = "text-foreground/60 font-medium";
              } else {
                textColor = "text-green-600 dark:text-green-400 font-medium";
              }
              
              return (
                <div
                  key={set.setCode}
                  className="flex justify-between items-center text-sm"
                >
                  <span className={textColor}>
                    {set.setName}
                  </span>
                  <span className={textColor}>
                    {set.count}/{maxLimit}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Show All Button - only show if there are boosters with cards */}
          {hasAnyBoosters && (
            <button
              onClick={() => setShowAllBoosters(true)}
              className="w-full text-sm text-foreground/70 hover:text-foreground transition-colors py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-background hover:bg-foreground/5"
            >
              Show all cards
            </button>
          )}
        </>
      ) : (
        <>
          {/* Detailed View */}
          {allSetsData
            .filter((set) => set.count > 0)
            .map((set) => (
              <div key={set.setCode} className="space-y-2">
                {set.cards && set.cards.length > 0 ? (
                  // Show individual boosters with their cards
                  set.cards.map((cards, boosterIndex) => {
                    const showBoosterNumber = set.cards.length > 1;

                    return (
                      <div
                        key={`${set.setCode}-${boosterIndex}`}
                        className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                      >
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          ✓ {set.setName} Booster
                          {showBoosterNumber && ` #${boosterIndex + 1}`}
                        </p>

                        {/* Show/Hide Cards */}
                        <BoosterCardList cards={cards} variant="completed" />
                      </div>
                    );
                  })
                ) : (
                  // Fallback for old format without cards
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      ✓ {set.count}x {set.setName} Booster
                      {set.count > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            ))}

          {/* Hide All Button */}
          <button
            onClick={() => setShowAllBoosters(false)}
            className="w-full text-sm text-foreground/70 hover:text-foreground transition-colors py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-background hover:bg-foreground/5"
          >
            Hide all cards
          </button>
        </>
      )}
    </div>
  );
}

