
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(
      "https://api.jup.ag/tokens/v1/tagged/verified",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();

    const filteredTokens = data.map((token: any) => ({
      symbol: token.symbol,
      logo: token.logoURI,
      address: token.address,
      decimals: token.decimals
    }));

    return NextResponse.json(filteredTokens, { status: 200 });
  } catch (error) {
    console.error("API Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
