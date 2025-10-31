"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthState, logout } from "@/lib/auth";
import { getAllPlayers, Player } from "@/lib/mockPlayers";

export default function PlayersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; alteredId: string } | null>(
    null
  );
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const authState = getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      router.push("/login");
      return;
    }
    setUser(authState.user);
    setPlayers(getAllPlayers());
    setLoading(false);
  }, [router]);

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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Player Directory</h1>
          <p className="text-foreground/70">
            All registered players in the current season
          </p>
        </div>

        {/* Players List */}
        <div className="space-y-4">
          {players.map((player) => {
            const totalBoosters = player.vault.reduce(
              (sum, set) => sum + set.boosterCount,
              0
            );
            const totalCards = player.vault.reduce(
              (sum, set) =>
                sum + set.cards.common + set.cards.rare + set.cards.unique,
              0
            );
            const sets = player.vault.map((s) => s.setName).join(", ");

            return (
              <Link
                key={player.alteredId}
                href={`/players/${player.alteredId}`}
                className="block bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 hover:border-foreground/20 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">
                      {player.alteredId}
                    </h2>
                    <div className="space-y-1 text-sm text-foreground/70">
                      <p>
                        <span className="font-medium text-foreground">
                          Total Boosters:
                        </span>{" "}
                        {totalBoosters}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">
                          Total Cards:
                        </span>{" "}
                        {totalCards}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">
                          Sets:
                        </span>{" "}
                        {sets}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-foreground/60">
                      View Vault →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

