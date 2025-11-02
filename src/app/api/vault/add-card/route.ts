import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";

export const runtime = "edge";

interface CloudflareEnv {
  DB: D1Database;
}

export interface AddCardRequest {
  uniqueToken: string;
  reference: string;
  cardData: {
    name: string;
    rarity: string;
    cardType: string;
    cardTypeString?: string;
    cardSubtypeString?: string;
    cardSet: {
      code: string;
      name: string;
    };
    faction?: {
      reference: string;
      name: string;
      color: string;
    };
    imagePath?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;
    const body = (await request.json()) as AddCardRequest;
    const { uniqueToken, reference, cardData } = body;

    const { env } = getCloudflareContext();

    // Check if card already scanned
    const existingCard = await env.DB.prepare(
      "SELECT id, user_id FROM vault_cards WHERE unique_token = ?"
    )
      .bind(uniqueToken)
      .first();

    if (existingCard) {
      return NextResponse.json(
        { error: "Card already scanned", duplicate: true },
        { status: 409 }
      );
    }

    // Get season sets to validate and check limits
    const seasonSetsResult = await env.DB.prepare(
      "SELECT * FROM season_sets WHERE set_code = ? AND is_active = ?"
    )
      .bind(cardData.cardSet.code, true)
      .first<{ set_code: string; max_packs: number }>();

    if (!seasonSetsResult) {
      return NextResponse.json(
        {
          error: `Set ${cardData.cardSet.code} is not active in the current season`,
        },
        { status: 400 }
      );
    }

    const maxPacksForSet = seasonSetsResult.max_packs;

    // Get active boosters for this set and user
    const activeBoostersResult = await env.DB.prepare(
      `SELECT vb.id, 
        (SELECT COUNT(*) FROM vault_cards WHERE booster_id = vb.id) as card_count
       FROM vault_boosters vb
       WHERE vb.user_id = ? AND vb.set_code = ? AND vb.completed_at IS NULL
       ORDER BY vb.created_at ASC`
    )
      .bind(userId, cardData.cardSet.code)
      .all<{ id: number; card_count: number }>();

    const activeBoosters = activeBoostersResult.results || [];

    // Count total boosters (active + completed) for this set
    const totalBoostersResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM vault_boosters WHERE user_id = ? AND set_code = ?"
    )
      .bind(userId, cardData.cardSet.code)
      .first<{ count: number }>();

    const totalBoosters = totalBoostersResult?.count || 0;

    // Helper to check if card can fit in booster
    const canFitCard = async (boosterId: number): Promise<boolean> => {
      const cardsResult = await env.DB.prepare(
        `SELECT vc.*, cm.card_data 
         FROM vault_cards vc
         JOIN cards_metadata cm ON cm.reference = vc.reference
         WHERE vc.booster_id = ?`
      )
        .bind(boosterId)
        .all<{ card_data: string }>();

      const cards = cardsResult.results || [];

      let heroCount = 0;
      let commonCount = 0;
      let rareCount = 0;
      let uniqueCount = 0;

      cards.forEach((card) => {
        const data = JSON.parse(card.card_data);
        if (data.cardType === "HERO") heroCount++;
        else if (data.rarity === "COMMON") commonCount++;
        else if (data.rarity === "RARE") rareCount++;
        else if (data.rarity === "UNIQUE") uniqueCount++;
      });

      if (cardData.cardType === "HERO") {
        return heroCount < 1;
      } else if (cardData.rarity === "COMMON") {
        return commonCount < 8;
      } else if (cardData.rarity === "RARE" || cardData.rarity === "UNIQUE") {
        return rareCount + uniqueCount < 3;
      }
      return false;
    };

    // Find a booster that can fit this card
    let targetBoosterId: number | null = null;

    for (const booster of activeBoosters) {
      if (await canFitCard(booster.id)) {
        targetBoosterId = booster.id;
        break;
      }
    }

    // If no booster found, create a new one (if under limit)
    if (!targetBoosterId) {
      if (totalBoosters >= maxPacksForSet) {
        return NextResponse.json(
          {
            error: `Maximum ${maxPacksForSet} boosters per set limit reached`,
            limitReached: true,
          },
          { status: 400 }
        );
      }

      // Create new booster
      const newBoosterResult = await env.DB.prepare(
        `INSERT INTO vault_boosters (user_id, set_code, set_name)
         VALUES (?, ?, ?)
         RETURNING id`
      )
        .bind(userId, cardData.cardSet.code, cardData.cardSet.name)
        .first<{ id: number }>();

      targetBoosterId = newBoosterResult?.id || null;

      if (!targetBoosterId) {
        return NextResponse.json(
          { error: "Failed to create booster" },
          { status: 500 }
        );
      }
    }

    const alteredCardData = await fetch(
      `https://api.altered.gg/cards/${reference}?locale=en-us`
    ).then((res) => res.json());

    // Upsert card metadata
    await env.DB.prepare(
      `INSERT INTO cards_metadata (reference, card_data, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(reference) DO UPDATE SET 
         card_data = excluded.card_data,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(reference, JSON.stringify(alteredCardData))
      .run();

    // Insert the card
    await env.DB.prepare(
      `INSERT INTO vault_cards (user_id, booster_id, unique_token, reference)
       VALUES (?, ?, ?, ?)`
    )
      .bind(userId, targetBoosterId, uniqueToken, reference)
      .run();

    // Check if booster is now complete
    const cardCountResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM vault_cards WHERE booster_id = ?"
    )
      .bind(targetBoosterId)
      .first<{ count: number }>();

    const cardCount = cardCountResult?.count || 0;

    if (cardCount === 12) {
      // Mark booster as completed
      await env.DB.prepare(
        `UPDATE vault_boosters 
         SET completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      )
        .bind(targetBoosterId)
        .run();
    } else {
      // Just update the timestamp
      await env.DB.prepare(
        `UPDATE vault_boosters 
         SET updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      )
        .bind(targetBoosterId)
        .run();
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error adding card to vault:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
