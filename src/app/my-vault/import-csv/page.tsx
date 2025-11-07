import { auth } from "@/auth";
import ImportCsvModule from "./ImportCsvModule";
import { redirect } from "next/navigation";

export default async function ImportCsvPage() {
  const session = await auth();
  if (!session?.user) {
    return redirect("/api/auth/signin?callbackUrl=/my-vault/import-csv");
  }

  return <ImportCsvModule />;
}
