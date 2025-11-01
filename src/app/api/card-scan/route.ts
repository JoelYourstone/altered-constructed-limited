import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing code parameter" },
      { status: 400 }
    );
  }

  try {
    const cardGuidResponse = await fetch(
      `https://browser-worker.joel-yourstone-85e.workers.dev/?code=${code}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.QR_TOKEN}`,
        },
      }
    );

    if (!cardGuidResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch card GUID" },
        { status: cardGuidResponse.status }
      );
    }

    const cardGuid = await cardGuidResponse.text();
    return new NextResponse(cardGuid, { status: 200 });
  } catch (error) {
    console.error("Error fetching card GUID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
