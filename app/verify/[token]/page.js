import { getDb } from "@/lib/mongodb";
import VerifyClient from "./VerifyClient";

export const dynamic = "force-dynamic";

async function getSession(token) {
  try {
    const db = await getDb();
    const sessions = db.collection("sessions");
    const session = await sessions.findOne({ token });
    if (!session) return null;
    return {
      token: session.token,
      user_id: session.user_id,
      status: session.status,
      bot_username: session.bot_username,
      expires_at: session.expires_at?.toISOString() || null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  return {
    title: "Device Verification — NxtZen",
    description: "Secure device verification portal",
  };
}

export default async function VerifyPage({ params }) {
  const { token } = params;
  const session = await getSession(token);

  return <VerifyClient token={token} session={session} />;
}
