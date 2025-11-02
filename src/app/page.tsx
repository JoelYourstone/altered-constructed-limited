import { auth } from "@/auth";
import Header from "@/components/Header";
import Link from "next/link";
import { SignIn } from "@/components/auth-components";

export default async function HomePage() {
  const session = await auth();
  console.log(session);
  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header variant="simple" session={session} />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Altered Vault Format
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            A constructed Altered TCG format with some house rules.
          </p>
        </div>

        {/* Active Sets */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">
            Current Season (22 packs in total)
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-2">
                Whispers from the Maze
              </h4>
              <p className="text-sm text-foreground/60">Booster Limit</p>
              <p className="text-2xl font-bold">10</p>
            </div>
            <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-2">Skybound Odyssey</h4>
              <p className="text-sm text-foreground/60">Booster Limit</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            {/* <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-2">Ashes of Ahala</h4>
              <p className="text-sm text-foreground/60">Booster Limit</p>
              <p className="text-2xl font-bold">12</p>
            </div> */}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mb-12">
          {session ? (
            <Link
              href="/my-vault"
              className="inline-flex rounded-full border border-solid border-transparent transition-colors items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-base px-8 py-3"
            >
              Go to my Vault
            </Link>
          ) : (
            <SignIn className="inline-flex rounded-full border border-solid border-transparent transition-colors items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-base px-8 py-3">
              Get Started — Register Now
            </SignIn>
          )}
        </div>

        {/* Format Overview */}
        <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 sm:p-8 mb-8">
          <h3 className="text-2xl font-semibold mb-4">
            What is the Vault Format?
          </h3>
          <p className="text-foreground/80 mb-4">
            The Altered Vault Format is where each player builds a
            standard-legal deck using only cards from their own opened boosters.
            This reduces pay-to-win dynamics while maintaining deckbuilding
            creativity and strategic depth.
          </p>
          <ul className="space-y-2 text-foreground/80">
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span>
                Build from your personal vault of up to{" "}
                <strong>36 booster packs</strong>
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span>Each set has its own booster limit per season</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span>
                No trades or singles purchases — only your own opened cards
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span>Follow standard constructed rules for deck building</span>
            </li>
          </ul>
        </div>

        {/* Format WHY */}
        <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 sm:p-8">
          <h3 className="text-2xl font-semibold mb-4">
            Why Play Vault Format?
          </h3>
          <div className="space-y-4 text-foreground/80">
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Budget-Friendly
              </h4>
              <p>
                You won&apos;t fall down the expensive singles rabbit hole. A
                fixed number of boosters means a fixed budget. Your wallet stays
                safe while you still enjoy competitive constructed play.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Creative Deckbuilding
              </h4>
              <p>
                Like sealed, every player&apos;s vault is unique. You&apos;ll
                theorycrafted decks based on your specific card pool, leading to
                diverse strategies and unexpected matchups.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Skill Over Wallet
              </h4>
              <p>
                You don&apos;t need to min-max by buying expensive uniques to
                compete. The only thing standing between you and victory is your
                deckbuilding skill and gameplay decisions, not your budget.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Fair & Fun Meta
              </h4>
              <p>
                Everyone has access to similar resources. No arms race of buying
                the most powerful cards. The meta evolves organically based on
                what players open, not what they can afford.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Ultimate Bragging Rights
              </h4>
              <p>
                Playing against standard constructed decks? You have all the
                advantages. Win, and you&apos;ve beaten a &apos;pay-to-win&apos;
                deck with your limited pool. Lose, and you&apos;ve got a
                built-in excuse. Either way, you&apos;re the underdog hero!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[.08] dark:border-white/[.145] mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-foreground/60">
          <p>Altered Vault Format is a community format for Altered TCG</p>
        </div>
      </footer>
    </div>
  );
}
