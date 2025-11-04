import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const { env } = getCloudflareContext();

  if (!code) {
    return NextResponse.json(
      { error: "Missing code parameter" },
      { status: 400 }
    );
  }

  try {
    const cardScanResponse = await fetch(
      `https://browser-worker.joel-yourstone-85e.workers.dev/?code=${code}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.QR_TOKEN}`,
        },
      }
    );

    if (!cardScanResponse.ok) {
      console.error("Failed to scan card:", cardScanResponse.statusText);
      console.log(await cardScanResponse.text());
      return NextResponse.json(
        { error: "Failed to scan card" },
        { status: cardScanResponse.status }
      );
    }

    const cardScan = await cardScanResponse.json();
    return NextResponse.json(cardScan, { status: 200 });
  } catch (error) {
    console.error("Error fetching card GUID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
