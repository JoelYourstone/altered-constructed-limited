import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PlayerVault } from "@/components/PlayerVault";

export default async function MyVaultPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/api/auth/signin?callbackUrl=/my-vault");
  }

  return <PlayerVault session={session} />;
}
