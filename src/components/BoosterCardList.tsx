import { useState } from "react";
import { ScannedCard } from "@/lib/scanningState";
import ThinCard from "./ThinCard";

interface BoosterCardListProps {
  cards: ScannedCard[];
  variant?: "active" | "completed";
}

export default function BoosterCardList({ 
  cards, 
  variant = "active" 
}: BoosterCardListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (cards.length === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Style variants for active vs completed boosters
  const buttonClass = variant === "completed"
    ? "w-full text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors pt-0 pb-0 "
    : "w-full text-sm text-foreground/70 hover:text-foreground transition-colors pt-0 pb-0 ";

  const containerClass = variant === "completed"
    ? "mt-3 space-y-1 border-t border-green-500/20 pt-3"
    : "mt-3 space-y-1 border-t border-black/[.08] dark:border-white/[.145] pt-3";

  return (
    <>
      {/* Show/Hide Cards Button */}
      <button
        onClick={toggleExpanded}
        className={buttonClass}
      >
        {isExpanded ? "Hide Cards" : "Show Cards"} ({cards.length})
      </button>

      {/* Cards List */}
      {isExpanded && (
        <div className={containerClass}>
          {cards.map((card, cardIndex) => (
            <ThinCard key={`${card.uniqueToken}-${cardIndex}`} card={card} />
          ))}
        </div>
      )}
    </>
  );
}

