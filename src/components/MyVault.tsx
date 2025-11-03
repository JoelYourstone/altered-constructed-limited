"use client";
import { useSeasonSets } from "@/hooks/useSeasonSets";
import { useVaultState } from "@/hooks/useVault";
import { Session } from "next-auth";
import Link from "next/link";

export function MyVault({ session }: { session: Session }) {
  const { data: vault, isLoading, error } = useVaultState();
  const { data: seasonSets } = useSeasonSets();
  console.log("vault", vault);

  const allBoosters = [
    ...(vault?.activeBoosters ?? []),
    ...(vault?.completedBoosters ?? []),
  ];
  const totalBoosters = allBoosters.length;
  const maxTotalBoosters =
    seasonSets?.reduce((sum, set) => sum + set.max_packs, 0) ?? 0;
  const totalCards = allBoosters.reduce(
    (sum, booster) => sum + booster.cards.length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* <Header session={session} /> */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Player Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your vault</h1>
          <p className="text-foreground/70">
            Welcome back,{" "}
            <span className="font-medium">{session.user?.name}</span>
          </p>
        </div>

        {/* Vault Overview */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6">
            <p className="text-sm text-foreground/60 mb-1">
              Total Boosters in Vault
            </p>
            <p className="text-3xl font-bold">
              {totalBoosters}/{maxTotalBoosters}
            </p>
            <div className="mt-2 w-full bg-foreground/10 rounded-full h-2">
              <div
                className="bg-foreground h-2 rounded-full transition-all"
                style={{
                  width: `${(totalBoosters / maxTotalBoosters) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6">
            <p className="text-sm text-foreground/60 mb-1">
              Total Cards in Vault
            </p>
            <p className="text-3xl font-bold">{totalCards}</p>
          </div>
        </div>

        {/* Vault Breakdown by Set */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Boosters in Vault</h2>
            <Link
              href="/my-vault/add-cards"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm px-4 py-2"
            >
              + Add Cards
            </Link>
          </div>

          <div className="space-y-4">
            {allBoosters.map((booster) => (
              <div
                key={booster.id}
                className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {booster.set_name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{booster.cards.length}</p>
                    <p className="text-sm text-foreground/60">cards</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-foreground/10 rounded-full h-2">
                    <div
                      className="bg-foreground h-2 rounded-full transition-all"
                      style={{
                        width: `${(booster.cards.length / 12) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/60">Common</p>
                    <p className="font-semibold">
                      {booster.cards.reduce(
                        (sum, card) =>
                          sum +
                          (card.card_data.rarity.reference === "COMMON"
                            ? 1
                            : 0),
                        0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Rare</p>
                    <p className="font-semibold">
                      {booster.cards.reduce(
                        (sum, card) =>
                          sum +
                          (card.card_data.rarity.reference === "RARE" ? 1 : 0),
                        0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Unique</p>
                    <p className="font-semibold">
                      {booster.cards.reduce(
                        (sum, card) =>
                          sum +
                          (card.card_data.rarity.reference === "UNIQUE"
                            ? 1
                            : 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
