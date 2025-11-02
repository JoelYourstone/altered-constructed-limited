import Link from "next/link";
import { SignIn, SignOut } from "./auth-components";
import { Session } from "next-auth";

interface HeaderProps {
  session?: Session | null;
  variant?: "simple" | "navigation";
}

export default function Header({
  session,
  variant = "navigation",
}: HeaderProps) {
  if (variant === "simple") {
    return (
      <header className="border-b border-black/[.08] dark:border-white/[.145]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:opacity-80">
            Altered Vault Format
          </Link>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <span className="hidden text-sm sm:inline-flex text-foreground/70">
                  {session.user.name}
                </span>
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <SignOut />
              </>
            ) : (
              <SignIn />
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-black/[.08] dark:border-white/[.145]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold hover:opacity-80 truncate"
          >
            <span className="hidden sm:inline">Altered Vault Format</span>
            <span className="sm:hidden">Vault Format</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-3 sm:gap-6">
            <Link
              href="/my-vault"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              My Vault
            </Link>
            <Link
              href="/players"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Players
            </Link>
            <div className="flex items-center gap-2 sm:gap-4 sm:ml-4 sm:pl-4 sm:border-l border-black/[.08] dark:border-white/[.145]">
              {session?.user ? (
                <>
                  <span className="text-sm text-foreground/70 max-w-[120px] sm:max-w-[200px] truncate">
                    {session.user.alteredId || session.user.name}
                  </span>
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User avatar"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <SignOut />
                </>
              ) : (
                <SignIn />
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
