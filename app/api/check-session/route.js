import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const user_id = searchParams.get("user_id");
    const bot_username = searchParams.get("bot_username");

    if (!token && !user_id) {
      return NextResponse.json({ error: "token or user_id required" }, { status: 400 });
    }

    const db = await getDb();
    const sessions = db.collection("sessions");

    let session;
    if (token) {
      session = await sessions.findOne({ token });
    } else {
      // Latest session for this user+bot combo
      const query = { user_id: String(user_id) };
      if (bot_username) query.bot_username = String(bot_username);
      session = await sessions.findOne(query, { sort: { created_at: -1 } });
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: session.status,
      user_id: session.user_id,
      bot_username: session.bot_username,
      device_fingerprint: session.device_fingerprint,
      verified_at: session.verified_at,
      fail_reason: session.fail_reason || null,
      created_at: session.created_at,
      expires_at: session.expires_at,
    });
  } catch (err) {
    console.error("check-session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
