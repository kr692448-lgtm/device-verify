import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, fingerprint, components } = body;

    if (!token || !fingerprint) {
      return NextResponse.json({ error: "token and fingerprint are required" }, { status: 400 });
    }

    const db = await getDb();
    const sessions = db.collection("sessions");
    const devices = db.collection("devices");

    // Find session
    const session = await sessions.findOne({ token });

    if (!session) {
      return NextResponse.json({ error: "Invalid verification link" }, { status: 404 });
    }

    if (session.status === "verified") {
      return NextResponse.json({
        success: true,
        already_verified: true,
        bot_username: session.bot_username,
        user_id: session.user_id,
      });
    }

    if (session.status === "expired" || new Date() > new Date(session.expires_at)) {
      await sessions.updateOne({ token }, { $set: { status: "expired" } });
      return NextResponse.json({ error: "Verification link has expired. Please request a new one from the bot." }, { status: 410 });
    }

    if (session.status !== "pending") {
      return NextResponse.json({ error: "Session is no longer valid" }, { status: 400 });
    }

    // Get real IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Check if this fingerprint is already registered to a DIFFERENT user_id
    const existingDevice = await devices.findOne({ fingerprint });

    if (existingDevice && existingDevice.user_id !== session.user_id) {
      // This device was already used by another user — block
      await sessions.updateOne(
        { token },
        {
          $set: {
            status: "failed",
            device_fingerprint: fingerprint,
            ip_address: ip,
            user_agent: userAgent,
            fail_reason: "device_already_registered",
            verified_at: new Date(),
          },
        }
      );
      return NextResponse.json(
        {
          error: "This device is already registered with a different account. Multi-account usage is not allowed.",
          code: "DEVICE_CONFLICT",
        },
        { status: 409 }
      );
    }

    // Check if same user is trying from multiple devices for refer (optional strict mode)
    // Here we just register and verify

    // Register or update device record
    await devices.updateOne(
      { fingerprint },
      {
        $set: {
          fingerprint,
          user_id: session.user_id,
          last_seen: new Date(),
          ip_address: ip,
          user_agent: userAgent,
          components: components || {},
        },
        $setOnInsert: {
          first_seen: new Date(),
        },
      },
      { upsert: true }
    );

    // Mark session as verified
    await sessions.updateOne(
      { token },
      {
        $set: {
          status: "verified",
          device_fingerprint: fingerprint,
          ip_address: ip,
          user_agent: userAgent,
          verified_at: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      user_id: session.user_id,
      bot_username: session.bot_username,
      fingerprint,
    });
  } catch (err) {
    console.error("verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
