# ============================================================
# 🔐 DEVICE VERIFICATION PROCESSOR
# TBC Bot me iska ek alag processor banao
# Command Name: device_verify_handler
# ============================================================
#
# SETUP:
#   Bot.saveData("vercel_url", "https://your-app.vercel.app")
#   Bot.saveData("bot_username", "YourBotUsername")
#
# Jab bhi user ko verify karna ho, ye call karo:
#   Bot.runCommand("/device_verify_handler")
#
# ============================================================

import json

try:
    user_id = message.from_user.id
    chat_id = message.chat.id

    VERCEL_URL = Bot.getData("vercel_url") or ""
    BOT_USERNAME = Bot.getData("bot_username") or ""

    if not VERCEL_URL or not BOT_USERNAME:
        bot.sendMessage(
            chat_id=chat_id,
            text="❌ *Setup Error:* vercel\\_url ya bot\\_username set nahi hai!",
            parse_mode="Markdown"
        )
        raise ReturnCommand()

    # ── CREATE SESSION ──
    import urllib.request

    payload = json.dumps({
        "user_id": str(user_id),
        "bot_username": BOT_USERNAME
    }).encode("utf-8")

    req = urllib.request.Request(
        url=VERCEL_URL.rstrip("/") + "/api/create-session",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        bot.sendMessage(
            chat_id=chat_id,
            text="❌ *Verification server unreachable.*\n\n_Please try again later._",
            parse_mode="Markdown"
        )
        raise ReturnCommand()

    if not result.get("success"):
        bot.sendMessage(
            chat_id=chat_id,
            text="❌ *Session create karne mein error:* " + str(result.get("error", "Unknown")),
            parse_mode="Markdown"
        )
        raise ReturnCommand()

    verify_url = result.get("url")

    # ── SEND WEBVIEW BUTTON ──
    inline = [
        [
            {
                "text": "🔐 Verify Your Device",
                "web_app": {"url": verify_url}
            }
        ]
    ]

    bot.sendMessage(
        chat_id=chat_id,
        text=(
            "🔐 *𝐃𝐄𝐕𝐈𝐂𝐄 𝐕𝐄𝐑𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 𝐑𝐄𝐐𝐔𝐈𝐑𝐄𝐃*\n"
            "━━━━━━━━━━━━━━━━━━━━\n\n"
            "🛡️ *Ek device = Ek account.*\n\n"
            "Multi-account abuse rokne ke liye\n"
            "aapko device verify karna hoga.\n\n"
            "👇 *Neeche button tap karein:*\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "⏰ _Link 10 minutes mein expire ho jayega._"
        ),
        reply_markup={"inline_keyboard": inline},
        parse_mode="Markdown"
    )

except ReturnCommand:
    raise
except Exception as e:
    try:
        bot.sendMessage(chat_id=chat_id, text="❌ Error: `" + str(e) + "`", parse_mode="Markdown")
    except:
        pass


# ============================================================
# 🔍 CHECK VERIFICATION STATUS (Alag processor)
# Command: check_device_status
# ============================================================
# Is processor ko use karo jab verify check karna ho
# Returns: verified / not_verified / failed
# ============================================================

try:
    user_id = message.from_user.id
    chat_id = message.chat.id

    VERCEL_URL = Bot.getData("vercel_url") or ""
    BOT_USERNAME = Bot.getData("bot_username") or ""

    if not VERCEL_URL:
        raise ReturnCommand()

    import urllib.request
    import json

    check_url = (
        VERCEL_URL.rstrip("/") +
        "/api/check-session?user_id=" + str(user_id) +
        "&bot_username=" + BOT_USERNAME
    )

    req = urllib.request.Request(check_url, method="GET")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except:
        data = {}

    status = data.get("status", "not_found")

    if status == "verified":
        # ✅ Verified — aage proceed karo
        # Yahan apna logic daalo jab user verified ho
        bot.sendMessage(
            chat_id=chat_id,
            text=(
                "✅ *𝐃𝐄𝐕𝐈𝐂𝐄 𝐕𝐄𝐑𝐈𝐅𝐈𝐄𝐃!*\n"
                "━━━━━━━━━━━━━━━━━━━━\n\n"
                "🎉 Aapka device successfully verify ho gaya!\n\n"
                "━━━━━━━━━━━━━━━━━━━━"
            ),
            parse_mode="Markdown"
        )
    elif status == "failed":
        fail_reason = data.get("fail_reason", "")
        if fail_reason == "device_already_registered":
            bot.sendMessage(
                chat_id=chat_id,
                text=(
                    "🚫 *𝐃𝐄𝐕𝐈𝐂𝐄 𝐁𝐋𝐎𝐂𝐊𝐄𝐃!*\n"
                    "━━━━━━━━━━━━━━━━━━━━\n\n"
                    "⚠️ Yeh device already kisi doosre\n"
                    "account se registered hai.\n\n"
                    "Multi-account usage allowed nahi hai.\n\n"
                    "━━━━━━━━━━━━━━━━━━━━"
                ),
                parse_mode="Markdown"
            )
        else:
            bot.sendMessage(
                chat_id=chat_id,
                text="❌ *Verification failed.* Please try again.",
                parse_mode="Markdown"
            )
    else:
        # Pending ya not found — verify karne ko kaho
        Bot.runCommand("/device_verify_handler")

except ReturnCommand:
    raise
except Exception as e:
    pass
