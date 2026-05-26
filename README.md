# 🔐 NxtZen Device Verification Portal

Multi-bot device fingerprint verification system.  
Ek Vercel deployment → multiple bots ke saath kaam karta hai.

---

## 📁 Project Structure

```
device-verify/
├── app/
│   ├── layout.js                     # Root layout
│   ├── page.js                       # Homepage (direct access block)
│   ├── verify/[token]/
│   │   ├── page.js                   # Server: session fetch
│   │   └── VerifyClient.jsx          # Client: UI + fingerprint
│   └── api/
│       ├── create-session/route.js   # Bot calls this → unique link milta hai
│       ├── verify/route.js           # Page calls this → fingerprint verify
│       └── check-session/route.js    # Bot calls this → status check
├── lib/
│   └── mongodb.js                    # DB connection
├── BOT_PROCESSOR_CODE.py             # TBC bot me paste karo
├── .env.example
├── package.json
└── vercel.json
```

---

## 🚀 Vercel Deployment Steps

### 1. GitHub pe push karo
```bash
git init
git add .
git commit -m "NxtZen Device Verify"
git remote add origin https://github.com/YOUR/repo.git
git push -u origin main
```

### 2. Vercel pe import karo
- vercel.com → New Project → Import repo
- Framework: **Next.js** (auto detect hoga)

### 3. Sirf YEH EK env variable daalo:
```
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/device_verify
```

### 4. Deploy karo → URL milega jaise:
```
https://device-verify-xyz.vercel.app
```

---

## 🤖 TBC Bot Setup

### Bot me ye data save karo (ek baar):
```python
Bot.saveData("vercel_url", "https://device-verify-xyz.vercel.app")
Bot.saveData("bot_username", "YourBotUsername")
```

### 2 Processors banao:

**Processor 1:** `device_verify_handler`
→ BOT_PROCESSOR_CODE.py ka PEHLA block paste karo

**Processor 2:** `check_device_status`  
→ BOT_PROCESSOR_CODE.py ka DOOSRA block paste karo

### Use karo:
```python
# Jab bhi verify karna ho:
Bot.runCommand("/device_verify_handler")

# Jab status check karna ho:
Bot.runCommand("/check_device_status")
```

---

## 🔄 Flow

```
Bot → POST /api/create-session {user_id, bot_username}
    ← {token, url: "https://site.vercel.app/verify/UNIQUE_TOKEN"}

Bot → User ko WebApp button bhejo with url

User opens WebApp → /verify/[token] page
    → Device fingerprint collect hota hai (Canvas, WebGL, Audio, Screen)
    → POST /api/verify {token, fingerprint}
    ← success ya error

If success → redirect to t.me/BOT_USERNAME
If device conflict → error dikhata hai

Bot → GET /api/check-session?user_id=123&bot_username=MyBot
    ← {status: "verified" | "pending" | "failed"}
```

---

## 🗄️ MongoDB Collections

### `sessions`
```json
{
  "token": "unique_hex_string",
  "user_id": "123456789",
  "bot_username": "MyBotUsername",
  "status": "pending | verified | failed | expired",
  "device_fingerprint": "sha256_hash",
  "ip_address": "1.2.3.4",
  "created_at": "ISODate",
  "expires_at": "ISODate (+10 min)",
  "verified_at": "ISODate"
}
```

### `devices`
```json
{
  "fingerprint": "sha256_hash",
  "user_id": "123456789",
  "first_seen": "ISODate",
  "last_seen": "ISODate",
  "ip_address": "1.2.3.4"
}
```

---

## ✅ Multi-Bot Support

Ek hi Vercel deployment multiple bots ke saath:
- BotA: `Bot.saveData("bot_username", "BotA")` → redirect: `t.me/BotA`
- BotB: `Bot.saveData("bot_username", "BotB")` → redirect: `t.me/BotB`
- Same MongoDB, alag sessions, alag redirects ✅

---

## 🔐 Device Conflict Rules

| Situation | Result |
|-----------|--------|
| New device, new user | ✅ Verified |
| Same device, same user | ✅ Already verified |
| Same device, different user | 🚫 BLOCKED |

---

*Powered by NxtZen Engine*
