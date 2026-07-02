import { NextResponse } from "next/server";
import { searchMulti } from "@/lib/tmdb/client";

// GET /api/tmdb/search?query=...&page=1
// This is the only TMDb route the browser talks to — it's what lets the
// /search page run live queries without ever seeing the TMDb API key.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const page = Number(searchParams.get("page") ?? "1") || 1;

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await searchMulti(query, page);
    const results = data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    );
    return NextResponse.json({
      results,
      page: data.page,
      totalPages: data.total_pages,
    });
  } catch (error) {
    console.error("TMDb search failed:", error);
    return NextResponse.json(
      { error: "Could not reach TMDb. Please try again in a moment." },
      { status: 502 }
    );
  }
}
