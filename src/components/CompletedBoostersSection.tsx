import { useState } from "react";
import BoosterCardList from "./BoosterCardList";
import { useSeasonSets } from "@/hooks/useSeasonSets";
import type { VaultState } from "@/app/api/vault/state/route";

interface CompletedBoostersSectionProps {
  completedBoosters: VaultState["completedBoosters"];
}

export default function CompletedBoostersSection({
  completedBoosters,
}: CompletedBoostersSectionProps) {
  const [showAllBoosters, setShowAllBoosters] = useState(false);

  const { data: seasonSets } = useSeasonSets();

  if (!seasonSets) {
    return null;
  }

  // Group completed boosters by set_code
  const boostersBySet = completedBoosters.reduce((acc, booster) => {
    if (!acc[booster.set_code]) {
      acc[booster.set_code] = [];
    }
    acc[booster.set_code].push(booster);
    return acc;
  }, {} as Record<string, typeof completedBoosters>);

  // Get all set codes (both from season sets and completed boosters)
  const seasonSetCodes = seasonSets.map((s) => s.set_code);
  const completedSetCodes = Object.keys(boostersBySet);

  // Combine and deduplicate set codes, prioritizing season sets order
  const allSetCodes = [
    ...seasonSetCodes,
    ...completedSetCodes.filter((code) => !seasonSetCodes.includes(code)),
  ];

  // Calculate total boosters count
  const totalBoostersCount = completedBoosters.length;

  return (
    <div className="mb-6 space-y-2">
      <h2 className="font-semibold text-sm text-foreground/70">
        Completed boosters in Vault ({totalBoostersCount})
      </h2>

      {!showAllBoosters ? (
        <>
          {/* Summary View */}
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
            {allSetCodes.map((setCode) => {
              const seasonSet = seasonSets.find((s) => s.set_code === setCode);
              const boostersForSet = boostersBySet[setCode] || [];
              const count = boostersForSet.length;
              const setName =
                boostersForSet[0]?.set_name ?? seasonSet?.set_name ?? setCode;

              const maxLimit = seasonSet?.max_packs ?? 0;
              const isInactive = !seasonSet;

              // Determine colors
              let textColor = "";
              if (isInactive) {
                // Inactive sets (not in season)
                textColor = "text-red-600 dark:text-red-400 font-medium";
              } else if (count === 0) {
                // Active sets with no completed boosters
                textColor = "text-gray-600 dark:text-gray-400 font-medium";
              } else {
                // Active sets with completed boosters
                textColor = "text-green-600 dark:text-green-400 font-medium";
              }

              return (
                <div
                  key={setCode}
                  className="flex justify-between items-center text-sm"
                >
                  <span className={textColor}>{setName}</span>
                  <span className={textColor}>
                    {count}/{maxLimit}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Show All Button - only show if there are completed boosters with cards */}
          {totalBoostersCount > 0 && (
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
          {allSetCodes.map((setCode) => {
            const seasonSet = seasonSets.find((s) => s.set_code === setCode);
            const boostersForSet = boostersBySet[setCode] || [];

            // Skip sets with no completed boosters in detailed view
            if (boostersForSet.length === 0) {
              return null;
            }

            const setName =
              boostersForSet[0]?.set_name ?? seasonSet?.set_name ?? setCode;
            const showBoosterNumber = boostersForSet.length > 1;

            return (
              <div key={setCode} className="space-y-2">
                {boostersForSet.map((booster, boosterIndex) => (
                  <div
                    key={booster.id}
                    className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                  >
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      ✓ {setName} Booster
                      {showBoosterNumber && ` #${boosterIndex + 1}`}
                    </p>

                    {/* Show Cards */}
                    {booster.cards.length > 0 && (
                      <BoosterCardList
                        cards={booster.cards}
                        variant="completed"
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })}

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
