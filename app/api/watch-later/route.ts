import { fetchWatchLaters, insertWatchLater } from "@/lib/data";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * GET /api/titles
 */
export const GET = auth(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const page = params.get("page") ? Number(params.get("page")) : 1;

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

  const watchLater = await fetchWatchLaters(page, email);

  return NextResponse.json({ watchLater });
});

/**
 * POST /api/watch-later
 */
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
    
    //@ts-ignore
    const { user: { email } } = req.auth;
    
    console.log("Adding to watch later:", titleId, "for user:", email);
    
    await insertWatchLater(titleId, email);
    return NextResponse.json({ message: "Added to watch later" });
  } catch (error) {
    console.error("Error in POST /api/watch-later:", error);
    return NextResponse.json(
      { error: "Failed to add to watch later" },
      { status: 500 }
    );
  }
});