import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PlayerVault } from "@/components/PlayerVault";

interface PlayerVaultPageProps {
  params: Promise<{ userId: string }>;
}

interface DatabaseResult {
  id: string;
  name: string;
}

export default async function PlayerVaultPage({
  params,
}: PlayerVaultPageProps) {
  const session = await auth();
  if (!session) {
    return redirect("/api/auth/signin?callbackUrl=/players");
  }

  const { env } = getCloudflareContext();
  const { userId } = await params;
  const player = await env.DB.prepare("SELECT id, name FROM users WHERE id = ?")
    .bind(userId)
    .first<DatabaseResult>();

  if (!player) {
    return redirect("/players");
  }

  return <PlayerVault session={session} player={player} />;
}
