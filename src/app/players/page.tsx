import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface User {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  image: string;
  total_boosters: number;
  total_cards: number;
}

export default async function PlayersPage() {
  const session = await auth();
  if (!session?.user) {
    return redirect("/api/auth/signin?callbackUrl=/players");
  }

  const { env } = getCloudflareContext();
  const usersQuery = await env.DB.prepare(
    `
    SELECT 
      u.id,
      u.auth_id,
      u.name,
      u.email,
      u.image,
      COALESCE(COUNT(DISTINCT vb.id), 0) as total_boosters,
      COALESCE(COUNT(DISTINCT vc.id), 0) as total_cards
    FROM users u
    LEFT JOIN vault_boosters vb ON vb.user_id = u.email
    LEFT JOIN vault_cards vc ON vc.user_id = u.email
    GROUP BY u.email, u.auth_id, u.name, u.email, u.image
    ORDER BY u.name
  `
  ).all<User>();
  if (!usersQuery.success) {
    console.error("Failed to fetch users:", usersQuery.error);
    throw new Error("Failed to fetch users");
  }

  console.log("usersQuery", usersQuery.results);
  const users = usersQuery.results;

  // return <div>{users.map((user) => user.name).join(", ")}</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header session={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Players</h1>
        </div>

        {/* Players List */}
        <div className="space-y-4">
          {users.map((player) => {
            return (
              <Link
                key={player.auth_id}
                href={`/players/${player.id}`}
                className="block bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 hover:border-foreground/20 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">
                      {player.name}
                    </h2>
                    <div className="space-y-1 text-sm text-foreground/70">
                      <p>
                        <span className="font-medium text-foreground">
                          Total Boosters:
                        </span>{" "}
                        {player.total_boosters}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">
                          Total Cards:
                        </span>{" "}
                        {player.total_cards}
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
