import mongoose from "mongoose";

const qrTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      unique: true,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    used: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // auto delete
    },
  },
  { timestamps: true }
);

export default mongoose.model("QrToken", qrTokenSchema);
