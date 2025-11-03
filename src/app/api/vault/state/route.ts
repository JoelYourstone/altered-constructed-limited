import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";
import type { CardData } from "@/lib/card-data";
interface VaultCard {
  id: number;
  user_id: string;
  booster_id: number;
  unique_token: string;
  reference: string;
  scanned_at: string;
  card_data: string; // JSON string
}

export interface CardViewData extends Omit<VaultCard, "card_data"> {
  card_data: CardData;
}

interface VaultBooster {
  id: number;
  user_id: string;
  set_code: string;
  set_name: string;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  cards: VaultCard[];
}

export interface VaultBoosterViewData extends Omit<VaultBooster, "cards"> {
  cards: CardViewData[];
}

export interface VaultState {
  activeBoosters: VaultBoosterViewData[];
  completedBoosters: VaultBoosterViewData[];
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;
    const { env } = getCloudflareContext();

    // Get all boosters for user
    const boostersResult = await env.DB.prepare(
      "SELECT * FROM vault_boosters WHERE user_id = ? ORDER BY created_at DESC"
    )
      .bind(userId)
      .all<Omit<VaultBooster, "cards">>();

    console.log("boosters count", boostersResult.results.length);

    if (!boostersResult.success) {
      console.error("Failed to fetch boosters:", boostersResult.error);
      return NextResponse.json(
        { error: "Failed to fetch boosters" },
        { status: 500 }
      );
    }

    const boosters = boostersResult.results || [];

    // Get all cards for these boosters with metadata
    const cardsResult = await env.DB.prepare(
      `SELECT vc.*, cm.card_data 
       FROM vault_cards vc
       JOIN cards_metadata cm ON cm.reference = vc.reference
       WHERE vc.user_id = ?`
    )
      .bind(userId)
      .all<VaultCard>();

    console.log("cards count", cardsResult.results.length);

    if (!cardsResult.success) {
      console.error("Failed to fetch cards:", cardsResult.error);
      return NextResponse.json(
        { error: "Failed to fetch cards" },
        { status: 500 }
      );
    }

    const cards = cardsResult.results || [];

    // Parse card data from JSON string
    const cardsViewData: CardViewData[] = cards.map((card) => ({
      ...card,
      card_data: JSON.parse(card.card_data),
    }));

    // Group cards by booster
    const cardsByBooster = cardsViewData.reduce((acc, card) => {
      if (!acc[card.booster_id]) {
        acc[card.booster_id] = [];
      }
      acc[card.booster_id].push(card);
      return acc;
    }, {} as Record<number, CardViewData[]>);

    // Attach cards to boosters
    const boostersWithCards: VaultBoosterViewData[] = boosters.map(
      (booster) => ({
        ...booster,
        cards: cardsByBooster[booster.id] || [],
      })
    );

    // Separate active and completed boosters
    const activeBoosters = boostersWithCards.filter((b) => !b.completed_at);
    const completedBoostersList = boostersWithCards.filter(
      (b) => b.completed_at
    );

    const state: VaultState = {
      activeBoosters,
      completedBoosters: completedBoostersList,
    };

    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    console.error("Error fetching vault state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
