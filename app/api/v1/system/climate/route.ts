import { NextResponse } from "next/server";
import { getClimateContext } from "@/lib/climate";

export async function GET() {
  try {
    const climate = await getClimateContext();
    return NextResponse.json(climate);
  } catch (error) {
    console.error("Climate context error:", error);
    return NextResponse.json(
      { error: "Failed to fetch climate context" },
      { status: 500 }
    );
  }
}
