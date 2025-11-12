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
    const cardScanResponse = await fetch(
      `https://api.altered.gg/qr-code/${code}`,
      {
        method: "HEAD",
        redirect: "manual",
      }
    );

    const location = cardScanResponse.headers.get("Location");
    if (!location) {
      return NextResponse.json(
        { error: "Failed to scan card" },
        { status: 400 }
      );
    }

    const reference = location.split("/").pop();

    return new NextResponse(reference, { status: 200 });
  } catch (error) {
    console.error("Error fetching card GUID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
