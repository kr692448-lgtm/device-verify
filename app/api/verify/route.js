import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, fingerprint, components } = body;

    if (!token)       return NextResponse.json({ error: "token required" },       { status: 400 });
    if (!fingerprint) return NextResponse.json({ error: "fingerprint required" }, { status: 400 });

    const db = await getDb();
    const sessions = db.collection("sessions");

    // Token dhundo
    const session = await sessions.findOne({ token });

    if (!session)
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });

    if (session.status === "expired")
      return NextResponse.json({ error: "Session expired" }, { status: 410 });

    if (session.status === "verified")
      return NextResponse.json({ error: "Already verified" }, { status: 400 });

    if (session.expires_at && new Date() > new Date(session.expires_at))
      return NextResponse.json({ error: "Session expired" }, { status: 410 });

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || request.headers.get("x-real-ip")
            || null;
    const ua = request.headers.get("user-agent") || null;

    // --- DEVICE CONFLICT CHECK ---
    // Same bot_id ke andar same fingerprint kisi ALAG user ke saath linked hai?
    const conflict = await sessions.findOne({
      bot_id:            session.bot_id,
      device_fingerprint: fingerprint,
      status:            "verified",
      user_id:           { $ne: session.user_id },
    });

    if (conflict) {
      // Conflict session mark karo
      await sessions.updateOne(
        { token },
        {
          $set: {
            status:            "conflict",
            device_fingerprint: fingerprint,
            ip_address:        ip,
            user_agent:        ua,
            components:        components || null,
            conflict_with:     conflict.user_id,
            verified_at:       new Date(),
          },
        }
      );

      // Conflict webhook call karo agar diya tha
      if (session.webhook_conflict_url) {
        try {
          await fetch(session.webhook_conflict_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id:        session.user_id,
              bot_id:         session.bot_id,
              fingerprint,
              conflict_with:  conflict.user_id,
            }),
          });
        } catch (e) {
          console.error("conflict webhook error:", e);
        }
      }

      return NextResponse.json(
        {
          error: "DEVICE_CONFLICT",
          code:  "DEVICE_CONFLICT",
          message: "This device is already registered to another account.",
        },
        { status: 409 }
      );
    }

    // --- SUCCESS: Verify karo ---
    await sessions.updateOne(
      { token },
      {
        $set: {
          status:            "verified",
          device_fingerprint: fingerprint,
          ip_address:        ip,
          user_agent:        ua,
          components:        components || null,
          verified_at:       new Date(),
        },
      }
    );

    // Success webhook call karo
    if (session.webhook_url) {
      try {
        await fetch(session.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id:     session.user_id,
            bot_id:      session.bot_id,
            fingerprint,
            verified_at: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error("success webhook error:", e);
      }
    }

    return NextResponse.json({
      success:  true,
      user_id:  session.user_id,
      bot_id:   session.bot_id,
    });
  } catch (err) {
    console.error("verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
