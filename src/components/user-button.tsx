import { auth } from "@/auth";
import { SignIn, SignOut } from "./auth-components";

export default async function UserButton() {
  const session = await auth();
  if (!session?.user) return <SignIn />;
  return (
    <div className="flex items-center gap-2">
      <SignOut />
      <span className="hidden text-sm sm:inline-flex whitespace-nowrap">
        {session.user.name}
      </span>
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name}
          width={32}
          height={32}
        />
      )}
    </div>
  );
}
