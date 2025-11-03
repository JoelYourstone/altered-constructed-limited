import { signInAction, signOutAction } from "./auth-components.server";

export function SignIn({
  children,
  ...props
}: React.ComponentPropsWithRef<"button">) {
  return (
    <form action={signInAction}>
      <button
        className=" cursor-pointer rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm px-5 py-2"
        {...props}
      >
        {children ?? "Sign In"}
      </button>
    </form>
  );
}

export function SignOut(props: React.ComponentPropsWithRef<"button">) {
  return (
    <form action={signOutAction} className="w-full">
      <button
        className=" cursor-pointer rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm px-5 py-2"
        {...props}
      >
        Sign Out
      </button>
    </form>
  );
}
