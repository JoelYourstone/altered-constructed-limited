import Link from "next/link";
import { getPlayerByAlteredId } from "@/lib/mockPlayers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";

interface PlayerVaultPageProps {
  params: Promise<{ alteredId: string }>;
}

export default async function PlayerVaultPage({
  params,
}: PlayerVaultPageProps) {
  const session = await auth();
  if (!session) {
    return redirect("/api/auth/signin?callbackUrl=/players");
  }

  const { alteredId } = await params;
  const player = getPlayerByAlteredId(alteredId);

  if (!player) {
    return redirect("/players");
  }

  const totalBoosters = player.vault.reduce(
    (sum, set) => sum + set.boosterCount,
    0
  );
  const maxTotalBoosters = 22;
  const totalCards = player.vault.reduce(
    (sum, set) => sum + set.cards.common + set.cards.rare + set.cards.unique,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header session={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/players"
            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            ← Back to Players
          </Link>
        </div>

        {/* Player Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {player.alteredId}&apos;s Vault
          </h1>
          <p className="text-foreground/70">
            Viewing {player.alteredId}&apos;s card vault
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
          <h2 className="text-2xl font-semibold mb-4">Vault by Set</h2>

          <div className="space-y-4">
            {player.vault.map((set) => (
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
