import mongoose from "mongoose";
import crypto from "crypto";

/* ===========================
   Generate Message Hash
=========================== */
const generateHash = (msg) => {
  return crypto
    .createHash("sha256")
    .update(
      `${msg.encryptedText}-${msg.senderId}-${msg.receiverId}-${Date.now()}`
    )
    .digest("hex");
};

const messageSchema = new mongoose.Schema(
  {
    encryptedText: {
      type: String, // ✅ safer than Object
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderName: {
      type: String,
      required: true,
    },

    hash: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* ===========================
   Auto Hash
=========================== */
messageSchema.pre("save", function () {
  if (!this.hash) {
    this.hash = generateHash(this);
  }
});

/* ===========================
   Export
=========================== */
const Message =
  mongoose.models.Message ||
  mongoose.model("Message", messageSchema);

export default Message;
