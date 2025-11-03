import Link from "next/link";
import { getAllPlayers } from "@/lib/mockPlayers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";

export default async function PlayersPage() {
  const session = await auth();
  console.log("Session", session);
  if (!session?.user) {
    return redirect("/api/auth/signin?callbackUrl=/players");
  }

  const players = getAllPlayers();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header session={session} />

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
