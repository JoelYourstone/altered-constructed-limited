import { auth } from "@/auth";
import Login from "./login";

export default async function Signin() {
  const session = await auth();

  if (!session?.user) {
    return <Login />;
  }

  return <div>Logged in</div>;
}
