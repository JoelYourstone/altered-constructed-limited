import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { useVaultState } from "@/hooks/useVault";
import { MyVault } from "@/components/MyVault";

// Mock data structure for player vault

export default async function MyVaultPage() {
  const session = await auth();

  if (!session) {
    return redirect("/api/auth/signin?callbackUrl=/my-vault");
  }

  return <MyVault />;
}
