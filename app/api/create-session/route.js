import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, bot_username } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }
    if (!bot_username) {
      return NextResponse.json({ error: "bot_username is required" }, { status: 400 });
    }

    const db = await getDb();
    const sessions = db.collection("sessions");

    // Unique token per request — har baar naya link
    const token = crypto.randomBytes(24).toString("hex");

    // Expire old pending sessions for this user+bot combo
    await sessions.updateMany(
      { user_id: String(user_id), bot_username: String(bot_username), status: "pending" },
      { $set: { status: "expired" } }
    );

    const session = {
      token,
      user_id: String(user_id),
      bot_username: String(bot_username), // stored dynamically — no env needed
      status: "pending",
      created_at: new Date(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      device_fingerprint: null,
      ip_address: null,
      user_agent: null,
      verified_at: null,
    };

    await sessions.insertOne(session);

    // Base URL: Vercel automatically provides host header
    const host = request.headers.get("host");
    const proto = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${proto}://${host}`;
    const verifyUrl = `${baseUrl}/verify/${token}`;

    return NextResponse.json({
      success: true,
      token,
      url: verifyUrl,
      expires_at: session.expires_at,
    });
  } catch (err) {
    console.error("create-session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
