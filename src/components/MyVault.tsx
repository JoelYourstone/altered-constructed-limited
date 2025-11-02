"use client";
import { useVaultState } from "@/hooks/useVault";
import Link from "next/link";

interface SetVault {
  setName: string;
  boosterCount: number;
  seasonLimit: number;
  cards: {
    common: number;
    rare: number;
    unique: number;
  };
}

export function MyVault() {
  const { data: vault, isLoading, error } = useVaultState();

  console.log("vault", vault);
  console.log("isLoading", isLoading);
  console.log("error", error);

  // Mock player vault data
  const playerVault: SetVault[] =
    vault?.activeBoosters.map((booster) => ({
      setName: booster.set_name,
      boosterCount: booster.cards.length,
      seasonLimit: booster.cards.length,
      cards: {
        common: booster.cards.filter(
          (card) => card.card_data.rarity === "COMMON"
        ).length,
        rare: booster.cards.filter((card) => card.card_data.rarity === "RARE")
          .length,
        unique: booster.cards.filter(
          (card) => card.card_data.rarity === "UNIQUE"
        ).length,
      },
    })) || [];

  // {
  //   setName: "Ashes of Ahala",
  //   boosterCount: 4,
  //   seasonLimit: 12,
  //   cards: { common: 32, rare: 6, unique: 2 },
  // },

  const totalBoosters = playerVault.reduce(
    (sum, set) => sum + set.boosterCount,
    0
  );
  const maxTotalBoosters = 22;
  const totalCards = playerVault.reduce(
    (sum, set) => sum + set.cards.common + set.cards.rare + set.cards.unique,
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
            {/* <span className="font-medium">{session.user?.name}</span> */}
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

          <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6">
            <p className="text-sm text-foreground/60 mb-1">Current Season</p>
            <p className="text-2xl font-bold">Season 1</p>
          </div>
        </div>

        {/* Vault Breakdown by Set */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Your Vault by Set</h2>
            <Link
              href="/my-vault/add-cards"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm px-4 py-2"
            >
              + Add Cards
            </Link>
          </div>

          <div className="space-y-4">
            {playerVault.map((set) => (
              <div
                key={set.setName}
                className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{set.setName}</h3>
                    <p className="text-sm text-foreground/60">
                      {set.boosterCount}/{set.seasonLimit} boosters (Season 1
                      limit)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {set.cards.common + set.cards.rare + set.cards.unique}
                    </p>
                    <p className="text-sm text-foreground/60">cards</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-foreground/10 rounded-full h-2">
                    <div
                      className="bg-foreground h-2 rounded-full transition-all"
                      style={{
                        width: `${(set.boosterCount / set.seasonLimit) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/60">Common</p>
                    <p className="font-semibold">{set.cards.common}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Rare</p>
                    <p className="font-semibold">{set.cards.rare}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Unique</p>
                    <p className="font-semibold">{set.cards.unique}</p>
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
