import redis from "../config/redis.js";

const QR_PREFIX = "QR_LOGIN:";
const QR_TTL = 120; // 2 minutes

/* ============================
   Create QR (Store userId)
============================ */
export async function createQR(token, userId) {
  const key = QR_PREFIX + token;

  await redis.set(
    key,
    JSON.stringify({
      token,
      userId,                // ✅ STORE USER ID
      status: "PENDING",
      createdAt: Date.now(),
    }),
    "EX",
    QR_TTL
  );
}

/* ============================
   Get QR
============================ */
export async function getQR(token) {
  const key = QR_PREFIX + token;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/* ============================
   Verify QR
============================ */
export async function verifyQR(token) {
  const key = QR_PREFIX + token;
  const qr = await getQR(token);

  if (!qr) return null;

  qr.status = "VERIFIED";

  // keep for 30 seconds after verify
  await redis.set(key, JSON.stringify(qr), "EX", 30);

  return qr;          // ✅ return qr including userId
}
