/**
 * Universal Encryption (Mobile)
 * ✔ Expo safe
 * ✔ No native crypto
 * ✔ Same logic as Web
 */

const SECRET = "chat-secret-key"; // ⚠️ Must match web

/* ============================
   Base64 Helpers (RN Safe)
============================ */
const encodeBase64 = (str) => {
  return global.btoa
    ? global.btoa(str)
    : Buffer.from(str, "binary").toString("base64");
};

const decodeBase64 = (b64) => {
  return global.atob
    ? global.atob(b64)
    : Buffer.from(b64, "base64").toString("binary");
};

/* ============================
   Encrypt (XOR + Base64)
============================ */
export const encryptText = (text) => {
  try {
    if (!text) return "";

    let encrypted = "";

    for (let i = 0; i < text.length; i++) {
      const charCode =
        text.charCodeAt(i) ^
        SECRET.charCodeAt(i % SECRET.length);

      encrypted += String.fromCharCode(charCode);
    }

    return encodeBase64(encrypted);
  } catch (err) {
    console.log("❌ Mobile encrypt failed:", err.message);
    return "";
  }
};

/* ============================
   Decrypt (Base64 + XOR)
============================ */
export const decryptText = (cipher) => {
  try {
    if (!cipher) return "";

    const decoded = decodeBase64(cipher);
    let decrypted = "";

    for (let i = 0; i < decoded.length; i++) {
      const charCode =
        decoded.charCodeAt(i) ^
        SECRET.charCodeAt(i % SECRET.length);

      decrypted += String.fromCharCode(charCode);
    }

    return decrypted;
  } catch (err) {
    console.log("⚠️ Mobile decrypt failed");
    return "🔒 Encrypted message";
  }
};
