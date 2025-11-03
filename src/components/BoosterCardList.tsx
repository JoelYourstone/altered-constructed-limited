import { useState } from "react";
import ThinCard from "./ThinCard";
import type { CardViewData } from "@/app/api/vault/state/route";

interface BoosterCardListProps {
  cards: CardViewData[];
  variant?: "active" | "completed";
}

export default function BoosterCardList({
  cards,
  variant = "active",
}: BoosterCardListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (cards.length === 0) {
    return null;
  }

  // Sort cards by rarity
  cards.sort((a, b) => {
    const rarityOrder = ["UNIQUE", "RARE", "COMMON"];

    if (a.card_data.cardType.reference === "HERO") {
      return -1;
    } else if (b.card_data.cardType.reference === "HERO") {
      return 1;
    }

    return (
      rarityOrder.indexOf(a.card_data.rarity.reference) -
      rarityOrder.indexOf(b.card_data.rarity.reference)
    );
  });

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Style variants for active vs completed boosters
  const buttonClass =
    variant === "completed"
      ? "w-full text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors pt-0 pb-0 "
      : "w-full text-sm text-foreground/70 hover:text-foreground transition-colors pt-0 pb-0 ";

  const containerClass =
    variant === "completed"
      ? "mt-3 space-y-1 border-t border-green-500/20 pt-3"
      : "mt-3 space-y-1 border-t border-black/[.08] dark:border-white/[.145] pt-3";

  return (
    <>
      {/* Show/Hide Cards Button */}
      <button onClick={toggleExpanded} className={buttonClass}>
        {isExpanded ? "Hide Cards" : "Show Cards"} ({cards.length})
      </button>

      {/* Cards List */}
      {isExpanded && (
        <div className={containerClass}>
          {cards.map((card, cardIndex) => (
            <ThinCard
              key={`${card.unique_token}-${cardIndex}`}
              card={card.card_data}
            />
          ))}
        </div>
      )}
    </>
  );
}
