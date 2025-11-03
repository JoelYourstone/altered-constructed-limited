// Public API
export interface CardData {
  "@context": string;
  "@id": string;
  "@type": "PublicCard";
  id: string;
  reference: string;

  cardType: CardTypeDTO;
  cardSet: CardSetDTO;
  cardSubTypes: CardSubTypeDTO[];

  mainEffect: string;
  echoEffect: string;

  elements: {
    MAIN_COST: string;
    RECALL_COST: string;
    MOUNTAIN_POWER: string;
    OCEAN_POWER: string;
    FOREST_POWER: string;
  };

  rarity: RarityDTO;

  imagePath: string;
  assets: {
    WEB: string[];
  };

  mainFaction: FactionDTO;

  name: string;

  isSuspended: boolean;
  isErrated: boolean;
  isBanned: boolean;
  isOwnerless: boolean;

  inSale: number;
  lowerPrice: number;
  lowerOfferId: string;

  isExclusive: boolean;
}

export interface CardTypeDTO {
  "@type": "CardTypeDTO";
  "@id": string;
  id: string;
  reference: string;
  name: string;
  description: string; // empty string in sample
  sequence: number;
}

export interface CardSetDTO {
  "@type": "CardSetDTO";
  "@id": string;
  id: string;
  reference: string;
  name: string;
  description: string | null;
  code: string;
  isActive: boolean;
  isReward: boolean;
}

export interface CardSubTypeDTO {
  "@type": "CardSubTypeDTO";
  "@id": string;
  id: string;
  reference: string;
  name: string;
}

export interface RarityDTO {
  "@type": "RarityDTO";
  "@id": string;
  id: string;
  reference: string;
  name: string;
  description: string | null;
  sequence: number;
}

export interface FactionDTO {
  "@type": "FactionDTO";
  "@id": string;
  id: string;
  reference: string;
  name: string;
  color: string; // hex color (e.g., "#8c432a")
}
