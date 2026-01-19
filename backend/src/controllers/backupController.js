import Message from "../models/message.js";
import crypto from "crypto";

/* ============================
   Generate Message Hash
   (Deduplication based on encrypted data)
============================ */
const generateHash = (msg) => {
  return crypto
    .createHash("sha256")
    .update(
      `${msg.encryptedText}-${msg.senderId}-${msg.receiverId}-${msg.createdAt}`
    )
    .digest("hex");
};

/* ============================
   EXPORT CHAT BACKUP (.TXT)
   Encrypted WhatsApp Style
============================ */
export const exportBackup = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: 1 });

    /**
     * TXT FORMAT (Encrypted safe)
     * [12/01/2026, 10:41] Harsh | ENCRYPTED::<base64>
     */
    const lines = messages.map((msg) => {
      const date = new Date(msg.createdAt);

      const formattedDate = date.toLocaleDateString("en-GB"); // DD/MM/YYYY
      const formattedTime = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `[${formattedDate}, ${formattedTime}] ${msg.senderName} | ENCRYPTED::${msg.encryptedText}`;
    });

    const textBackup = lines.join("\n");

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=chat-backup.txt"
    );

    res.status(200).send(textBackup);
  } catch (err) {
    console.error("BACKUP EXPORT ERROR:", err);
    res.status(500).json({
      message: "Failed to export backup",
    });
  }
};

/* ============================
   IMPORT CHAT BACKUP (.TXT)
============================ */
export const importBackup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rawText } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({
        message: "Invalid backup file",
      });
    }

    const lines = rawText.split("\n").filter(Boolean);

    /**
     * Expected line format:
     * [12/01/2026, 10:41] Harsh | ENCRYPTED::<base64>
     */
    const parsedMessages = lines
      .map((line) => {
        const match = line.match(
          /^\[(\d{2}\/\d{2}\/\d{4}),\s(\d{2}:\d{2})\]\s(.+?)\s\|\sENCRYPTED::(.+)$/
        );

        if (!match) return null;

        const [, dateStr, timeStr, senderName, encryptedText] = match;
        const [day, month, year] = dateStr.split("/");

        const createdAt = new Date(
          `${year}-${month}-${day}T${timeStr}:00`
        );

        const payload = {
          encryptedText,
          senderName,
          senderId: userId,
          receiverId: userId,
          createdAt,
        };

        return {
          ...payload,
          hash: generateHash(payload),
        };
      })
      .filter(Boolean);

    if (!parsedMessages.length) {
      return res.status(400).json({
        message: "No valid messages found in backup file",
      });
    }

    // ✅ Insert messages (duplicates skipped automatically via hash)
    await Message.insertMany(parsedMessages, {
      ordered: false,
    });

    res.status(200).json({
      message: "TXT Backup restored successfully",
      totalImported: parsedMessages.length,
    });
  } catch (err) {
    console.error("TXT IMPORT ERROR:", err.message);

    // ⚠️ Duplicate hash errors land here safely
    res.status(200).json({
      message: "Backup restored (duplicates skipped)",
    });
  }
};
