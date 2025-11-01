"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthState, logout } from "@/lib/auth";
import CardScanner from "@/components/CardScanner";

interface ScannedCard {
  reference: string;
  name: string;
  rarity: string;
  cardType: string;
  cardSet: {
    code: string;
    name: string;
  };
  imagePath?: string;
}

interface BoosterProgress {
  hero: number; // max 1
  common: number; // max 8
  rare: number; // max 3
  unique: number; // max 1 (replaces a rare)
}

interface SetBoosterProgress {
  setCode: string;
  setName: string;
  progress: BoosterProgress;
  cards: ScannedCard[];
}

export default function AddCardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; alteredId: string } | null>(
    null
  );
  const [boostersBySet, setBoostersBySet] = useState<
    Map<string, SetBoosterProgress>
  >(new Map());
  const [completedBoosters, setCompletedBoosters] = useState(0);

  useEffect(() => {
    const authState = getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      router.push("/login");
      return;
    }
    setUser(authState.user);
    setLoading(false);
  }, [router]);

  async function handleCardScan(uniqueToken: string, cardObject: any) {
    try {
      const response = await fetch(
        `https://api.altered.gg/public/cards/${cardObject.card.reference}?locale=en`
      );
      const data = (await response.json()) as any;

      const card: ScannedCard = {
        reference: data.reference,
        name: data.name,
        rarity: data.rarity.reference,
        cardType: data.cardType.reference,
        cardSet: {
          code: data.cardSet.code,
          name: data.cardSet.name,
        },
        imagePath: data.assets?.WEB?.[0],
      };

      const setCode = card.cardSet.code;

      // Update the booster for this specific set
      setBoostersBySet((prevBoosters) => {
        const newBoosters = new Map(prevBoosters);

        // Get or create the booster for this set
        let setBooster = newBoosters.get(setCode);
        if (!setBooster) {
          setBooster = {
            setCode: setCode,
            setName: card.cardSet.name,
            progress: { hero: 0, common: 0, rare: 0, unique: 0 },
            cards: [],
          };
        }

        // Add card to this set's cards
        const updatedCards = [...setBooster.cards, card];

        // Update progress
        const newProgress = { ...setBooster.progress };

        if (card.cardType === "HERO") {
          if (newProgress.hero < 1) {
            newProgress.hero += 1;
          }
        } else if (card.rarity === "COMMON") {
          if (newProgress.common < 8) {
            newProgress.common += 1;
          }
        } else if (card.rarity === "RARE") {
          if (newProgress.rare + newProgress.unique < 3) {
            newProgress.rare += 1;
          }
        } else if (card.rarity === "UNIQUE") {
          if (newProgress.rare + newProgress.unique < 3) {
            newProgress.unique += 1;
          }
        }

        // Check if this set's booster is complete
        const totalRaresAndUniques = newProgress.rare + newProgress.unique;
        if (
          newProgress.hero === 1 &&
          newProgress.common === 8 &&
          totalRaresAndUniques === 3
        ) {
          // Booster complete!
          setTimeout(() => {
            setCompletedBoosters((prev) => prev + 1);
            // Remove this set's booster
            setBoostersBySet((prev) => {
              const updated = new Map(prev);
              updated.delete(setCode);
              return updated;
            });
          }, 1000);
        }

        // Update the booster for this set
        newBoosters.set(setCode, {
          ...setBooster,
          progress: newProgress,
          cards: updatedCards,
        });

        return newBoosters;
      });
    } catch (error) {
      console.error("Error fetching card data:", error);
      alert("Failed to fetch card data. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  const activeBoosters = Array.from(boostersBySet.values());

  return (
    <div className="min-h-screen bg-background">
      {/* Scanner */}
      <div className="relative">
        <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border border-black/[.08] dark:border-white/[.145]">
          <CardScanner onScan={handleCardScan} />
        </div>
        <div className="text-sm text-foreground/60 absolute bottom-0  text-center w-full mb-4">
          <p
            className="bg text-white px-4 py-2 rounded-full"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "inline",
            }}
          >
            Scan your cards
          </p>
        </div>
      </div>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Completed Counter */}
        {completedBoosters > 0 && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">
              ✓ {completedBoosters} Booster{completedBoosters > 1 ? "s" : ""}{" "}
              Completed!
            </p>
          </div>
        )}

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

              return (
                <div
                  key={setBooster.setCode}
                  className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">{setBooster.setName}</h3>
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
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
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
                </div>
              );
            })}
          </div>
        )}

        {/* Scanned Cards - Compact List */}
        {activeBoosters.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">
                Scanned (
                {activeBoosters.reduce(
                  (sum, booster) => sum + booster.cards.length,
                  0
                )}
                )
              </h2>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeBoosters.map((setBooster) => (
                <div key={setBooster.setCode}>
                  {setBooster.cards.length > 0 && (
                    <>
                      <div className="text-xs font-semibold text-foreground/60 mb-2 sticky top-0 bg-background">
                        {setBooster.setCode}
                      </div>
                      <div className="space-y-2">
                        {setBooster.cards.map((card, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 bg-foreground/5 rounded-lg"
                          >
                            {card.imagePath && (
                              <img
                                src={card.imagePath}
                                alt={card.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {card.name}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {card.rarity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
