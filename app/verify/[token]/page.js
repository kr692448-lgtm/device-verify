import { getDb } from "@/lib/mongodb";
import VerifyClient from "./VerifyClient";

export default async function VerifyPage({ params }) {
  const { token } = params;
  let session = null;

  try {
    const db = await getDb();
    const sessions = db.collection("sessions");
    const doc = await sessions.findOne({ token });

    if (doc) {
      session = {
        user_id:      doc.user_id      || null,
        first_name:   doc.first_name   || null,
        bot_username: doc.bot_username || null,
        bot_id:       doc.bot_id       || null,
        status:       doc.status       || "pending",
        expires_at:   doc.expires_at?.toISOString() || null,
      };
    }
  } catch (e) {
    console.error("VerifyPage fetch error:", e);
  }

  return <VerifyClient token={token} session={session} />;
}
