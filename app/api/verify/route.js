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
      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one from the bot." },
        { status: 410 }
      );
    }

    if (session.status !== "pending") {
      return NextResponse.json({ error: "Session is no longer valid" }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const existingDevice = await devices.findOne({ fingerprint });

    if (existingDevice && existingDevice.user_id !== session.user_id) {
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

      // ── Webhook hit karo conflict pe bhi ──
      if (session.webhook_url) {
        try {
          await fetch(session.webhook_url, { method: "GET" });
        } catch (err) {
          console.error("Conflict webhook failed:", err);
        }
      }

      return NextResponse.json(
        {
          error: "This device is already registered with a different account. Multi-account usage is not allowed.",
          code: "DEVICE_CONFLICT",
        },
        { status: 409 }
      );
    }

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
        $setOnInsert: { first_seen: new Date() },
      },
      { upsert: true }
    );

    await sessions.updateOne(
      { token },
      {
        $set: {
          status: "verified",
          device_fingerprint: fingerprint,
          ip_address: ip,
          user_agent: userAgent,
          verified_at: new Date(),
          expires_at: new Date(),
        },
      }
    );

    // ── Success webhook ──
    if (session.webhook_url) {
      try {
        await fetch(session.webhook_url, { method: "GET" });
      } catch (err) {
        console.error("Webhook notify failed:", err);
      }
    } else if (session.bot_token) {
      try {
        await fetch(`https://api.telegram.org/bot${session.bot_token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: session.user_id,
            text:
              "✅ *DEVICE VERIFIED!*\n" +
              "━━━━━━━━━━━━━━━━━━━━\n\n" +
              "🎉 Your device has been successfully verified!\n" +
              "You can now use the bot.\n\n" +
              "━━━━━━━━━━━━━━━━━━━━",
            parse_mode: "Markdown",
          }),
        });
      } catch (err) {
        console.error("Bot notify failed:", err);
      }
    }

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
