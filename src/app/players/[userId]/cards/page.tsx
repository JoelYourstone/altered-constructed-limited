import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PlayerCards from "./player-cards";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export default async function PlayerCardsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { env } = getCloudflareContext();
  const { userId } = await params;
  const player = await env.DB.prepare("SELECT id, name FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: string; name: string }>();

  if (!player) {
    return redirect("/players");
  }
  const session = await auth();
  if (!session?.user) {
    return redirect("/api/auth/signin?callbackUrl=/");
  }

  return <PlayerCards userId={userId} />;
}
