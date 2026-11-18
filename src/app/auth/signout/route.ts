import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Signing out should succeed even if the project is misconfigured.
  }
  return NextResponse.redirect(new URL("/", url.origin), { status: 303 });
}
