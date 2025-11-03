import { auth } from "@/auth";
import Login from "./login";
import { redirect } from "next/navigation";

export default async function Signin({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl as string | undefined;

  const session = await auth();

  if (!session?.user) {
    return <Login />;
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return <div>Logged in</div>;
}
