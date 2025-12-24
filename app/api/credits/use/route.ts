import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const COST = 2;

export async function POST() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch current credits
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("remaining_credits, used_credits")
    .eq("clerk_user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (data.remaining_credits < COST) {
    return NextResponse.json(
      { error: "Not enough credits", remaining: data.remaining_credits },
      { status: 402 }
    );
  }

  // Deduct credits
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      remaining_credits: data.remaining_credits - COST,
      used_credits: (data.used_credits ?? 0) + COST,
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", userId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deducted: COST,
    remaining: data.remaining_credits - COST,
  });
}
