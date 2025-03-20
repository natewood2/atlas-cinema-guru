import { fetchFavorites, insertFavorite } from "@/lib/data";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * GET /api/favorites
 */
export const GET = auth(async (req: NextRequest) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");

  //@ts-ignore
  if (!req.auth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  //@ts-ignore
  const { user: { email } } = req.auth;
  
  console.log("Fetching favorites for user:", email);
  
  try {
    const favorites = await fetchFavorites(page, email);
    console.log(`finding ${favorites.length} favorites`);

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("ERROR", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
});

export const POST = auth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { titleId } = body;
    
    if (!titleId) {
      return NextResponse.json({ error: "Missing titleId" }, { status: 400 });
    }
    
    //@ts-ignore
    if (!req.auth) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }
    
    const {
      user: { email }, //@ts-ignore
    } = req.auth;
    
    console.log("Adding favorite:", titleId, "for user:", email);
    
    await insertFavorite(titleId, email);
    return NextResponse.json({ message: "Favorite Added" });
  } catch (error) {
    console.error("Error in POST /api/favorites:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
});
