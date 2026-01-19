/**
 * Universal Encryption (Web)
 * ✔ Same logic as Mobile
 * ✔ No crypto libraries needed
 */

const SECRET = "chat-secret-key"; // ⚠️ Must match mobile

/* ============================
   Encrypt (XOR + Base64)
============================ */
export const encryptMessage = async (text) => {
  try {
    if (!text) return "";

    let encrypted = "";

    for (let i = 0; i < text.length; i++) {
      const charCode =
        text.charCodeAt(i) ^
        SECRET.charCodeAt(i % SECRET.length);

      encrypted += String.fromCharCode(charCode);
    }

    return btoa(encrypted);
  } catch (err) {
    console.error("❌ Web encrypt failed:", err.message);
    return "";
  }
};

/* ============================
   Decrypt (Base64 + XOR)
============================ */
export const decryptMessage = async (cipher) => {
  try {
    if (!cipher) return "";

    const decoded = atob(cipher);
    let decrypted = "";

    for (let i = 0; i < decoded.length; i++) {
      const charCode =
        decoded.charCodeAt(i) ^
        SECRET.charCodeAt(i % SECRET.length);

      decrypted += String.fromCharCode(charCode);
    }

    return decrypted;
  } catch (err) {
    console.error("⚠️ Web decrypt failed");
    return "🔒 Encrypted message";
  }
};
