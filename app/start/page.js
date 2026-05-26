import { redirect } from "next/navigation";
import { getDb } from "../../lib/mongodb";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export default async function StartPage({ searchParams }) {
  const user_id = searchParams?.user_id;
  const bot = searchParams?.bot;
  const bot_token = searchParams?.bot_token;

  if (!user_id || !bot) {
    redirect("/");
  }

  const db = await getDb();
  const sessions = db.collection("sessions");

  await sessions.updateMany(
    { user_id: String(user_id), bot_username: String(bot), status: "pending" },
    { $set: { status: "expired" } }
  );

  const token = crypto.randomBytes(24).toString("hex");

  await sessions.insertOne({
    token,
    user_id: String(user_id),
    bot_username: String(bot),
    bot_token: bot_token ? String(bot_token) : null,
    status: "pending",
    created_at: new Date(),
    expires_at: new Date(Date.now() + 10 * 60 * 1000),
    device_fingerprint: null,
    ip_address: null,
    user_agent: null,
    verified_at: null,
  });

  redirect(`/verify/${token}`);
}
