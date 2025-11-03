import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface SeasonSet {
  id: number;
  set_code: string;
  set_name: string;
  max_packs: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const { env } = getCloudflareContext();

    if (!env.DB) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Query active sets ordered by display_order
    const result = await env.DB.prepare(
      "SELECT * FROM season_sets WHERE is_active = ? ORDER BY display_order ASC, set_code ASC"
    )
      .bind(true)
      .all<SeasonSet>();

    if (!result.success) {
      console.error("Failed to fetch season sets:", result.error);
      return NextResponse.json(
        { error: "Failed to fetch season sets" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.results, { status: 200 });
  } catch (error) {
    console.error("Error fetching season sets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
