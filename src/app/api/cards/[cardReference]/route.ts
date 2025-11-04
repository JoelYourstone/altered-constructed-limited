import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cardReference = request.nextUrl.pathname.split("/").pop();
  if (!cardReference) {
    return NextResponse.json(
      { error: "Missing card reference" },
      { status: 400 }
    );
  }

  const response = await fetch(
    `https://api.altered.gg/public/cards/${cardReference}?locale=en-us`,
    {
      headers: {
        UserAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }
  );

  return NextResponse.json(await response.json(), { status: 200 });
}
