import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AddCardsModule from "./AddCardsModule";

export default async function AddCardsPage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/my-vault/add-cards");
  }
  return <AddCardsModule session={session} />;
}
