import { AddCardRequest } from "@/app/api/vault/add-card/route";
import { useAddCardToVault } from "@/hooks/useVault";
import { ScannedCard } from "@/lib/scanningState";

interface ThinCardProps {
  card: ScannedCard;
}

export default function ThinCard({ card }: ThinCardProps) {
  const isUnique = card.rarity.toUpperCase() === "UNIQUE";
  const factionColor = card.faction?.color || "#666666";
  const isHero = card.cardTypeString === "Hero";
  const addCardToVault = useAddCardToVault();

  let cardTypeText = "";
  if (isHero) {
    // For heroes, show "Faction Hero"
    const factionName = card.faction?.name || "";
    cardTypeText = `${factionName} Hero`;
  } else if (card.cardSubtypeString) {
    // For other cards with subtypes, show "CardType - Subtype"
    cardTypeText = `${card.cardTypeString} - ${card.cardSubtypeString}`;
  } else {
    // For other cards without subtypes, show just "CardType"
    cardTypeText = card.cardTypeString;
  }

  // Banner background - extremely shiny golden for uniques, faction color for others
  const bannerStyle = isUnique
    ? {
        background: `linear-gradient(
          90deg,
          #F59E0B 0%,
          #FCD34D 16%,
          #F59E0B 33%,
          #FCD34D 50%,
          #F59E0B 66%,
          #FCD34D 83%,
          #F59E0B 100%
        )`,
        boxShadow: `
          0 0 25px rgba(255, 255, 255, 1),
          0 0 35px rgba(255, 255, 255, 0.9),
          0 0 45px rgba(245, 158, 11, 1),
          0 0 60px rgba(245, 158, 11, 0.8),
          0 0 80px rgba(245, 158, 11, 0.6),
          inset 0 1px 3px rgba(255, 255, 255, 0.3)
        `,
      }
    : {
        backgroundColor: factionColor,
      };

  // Rarity gem styles for non-hero cards
  const getRarityGemStyle = () => {
    if (isHero) return null;

    switch (card.rarity.toUpperCase()) {
      case "COMMON":
        // Normal stone with gradient and small shadow
        return {
          borderTop: "10px solid #6B7280",
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))",
          background:
            "linear-gradient(135deg, #9CA3AF 0%, #6B7280 50%, #4B5563 100%)",
        };
      case "RARE":
        // Blue gem with white outline and moderate shine
        return {
          borderTop: "10px solid #1D4ED8",
          filter:
            "drop-shadow(0 0 1px rgba(255, 255, 255, 1)) drop-shadow(0 0 2px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))",
          background:
            "linear-gradient(135deg, #93C5FD 0%, #3B82F6 50%, #1D4ED8 100%)",
        };
      case "UNIQUE":
        // Golden diamond with white outline and intense shine and radiance
        return {
          borderTop: "10px solid #F59E0B",
          filter:
            "drop-shadow(0 0 1px rgba(255, 255, 255, 1)) drop-shadow(0 0 2px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 6px rgba(245, 158, 11, 0.6)) drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))",
          background:
            "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 30%, #F59E0B 60%, #D97706 100%)",
        };
      default:
        return {
          borderTop: "10px solid #6B7280",
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))",
        };
    }
  };

  const gemStyle = getRarityGemStyle();

  return (
    <div className="relative overflow-hidden rounded-lg border border-black/[.08] dark:border-white/[.145] hover:border-black/[.15] dark:hover:border-white/[.25] transition-all">
      {/* Rarity Triangle Gem (for non-hero cards) */}
      {gemStyle && (
        <>
          {/* Main triangle */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10"
            style={{
              top: "0",
              width: "0",
              height: "0",
              borderLeft: "15px solid transparent",
              borderRight: "15px solid transparent",
              ...gemStyle,
            }}
          />
          {/* Shine highlight overlay for rare and unique */}
          {(card.rarity.toUpperCase() === "UNIQUE" ||
            card.rarity.toUpperCase() === "RARE") && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none"
              style={{
                top: "2px",
                width: "0",
                height: "0",
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "5px solid rgba(255, 255, 255, 0.6)",
                filter:
                  card.rarity.toUpperCase() === "UNIQUE"
                    ? "blur(1px)"
                    : "blur(3px)",
              }}
            />
          )}
        </>
      )}
      <div className="flex items-center justify-between">
        {/* Card Title Section */}
        <div className="flex-1 min-w-0 text-center">
          {/* Card Name with Faction/Golden Background */}
          <div className="px-2 pt-2 py-1" style={bannerStyle}>
            <p
              className="text-sm font-bold truncate text-white"
              style={{
                textShadow: isUnique
                  ? "0 0 8px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.8), 0 1px 3px rgba(0, 0, 0, 0.5)"
                  : "none",
              }}
            >
              {card.name}
            </p>
          </div>

          {/* Card Type */}
          <div className="px-2 py-0 bg-gray-100 dark:bg-gray-200">
            <p className="text-xs font-normal text-black">{cardTypeText}</p>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          addCardToVault.mutate({
            uniqueToken: card.uniqueToken,
            reference: card.reference,
            cardData: {
              name: card.name,
              rarity: card.rarity,
              cardType: card.cardType,
              cardTypeString: card.cardTypeString,
              cardSubtypeString: card.cardSubtypeString,
              cardSet: card.cardSet,
              faction: card.faction,
              imagePath: card.imagePath,
            },
          } satisfies AddCardRequest);
        }}
        type="button"
        className="w-full h-full"
      >
        Hej!
      </button>
    </div>
  );
}
