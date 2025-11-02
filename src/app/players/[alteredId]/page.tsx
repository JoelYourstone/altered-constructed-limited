"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getAuthState, logout } from "@/lib/auth";
import { getPlayerByAlteredId, Player } from "@/lib/mockPlayers";

export default function PlayerVaultPage() {
  const router = useRouter();
  const params = useParams();
  const alteredId = params.alteredId as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; alteredId: string } | null>(
    null
  );
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const authState = getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      router.push("/login");
      return;
    }
    setUser(authState.user);

    const foundPlayer = getPlayerByAlteredId(alteredId);
    if (!foundPlayer) {
      router.push("/players");
      return;
    }

    setPlayer(foundPlayer);
    setLoading(false);
  }, [router, alteredId]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!player) {
    return null;
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
      <header className="border-b border-black/[.08] dark:border-white/[.145]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <Link href="/" className="text-xl sm:text-2xl font-bold hover:opacity-80 truncate">
              <span className="hidden sm:inline">Altered Vault Format</span>
              <span className="sm:hidden">Vault Format</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-3 sm:gap-6">
              <Link
                href="/my-vault"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                My Vault
              </Link>
              <Link
                href="/players"
                className="text-sm font-medium text-foreground hover:text-foreground transition-colors"
              >
                Players
              </Link>
              <div className="flex items-center gap-2 sm:gap-4 sm:ml-4 sm:pl-4 sm:border-l border-black/[.08] dark:border-white/[.145]">
                <span className="text-sm text-foreground/70 max-w-[120px] sm:max-w-[200px] truncate">
                  {user?.alteredId}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

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
          <h1 className="text-3xl font-bold mb-2">{player.alteredId}&apos;s Vault</h1>
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

