import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MyVault } from "@/components/MyVault";

export default async function MyVaultPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/api/auth/signin?callbackUrl=/my-vault");
  }

  return <MyVault session={session} />;
}
