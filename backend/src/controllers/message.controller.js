import Message from "../models/message.js";

/**
 * GET CHAT HISTORY
 * GET /api/messages?userId=OTHER_USER_ID
 * Logged-in user from authMiddleware → req.user.id
 */
export const getMessages = async (req, res) => {
  try {
    const myUserId = req.user.id;
    const otherUserId = req.query.userId;

    if (!otherUserId) {
      return res.status(400).json({
        message: "userId query parameter is required",
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myUserId },
      ],
    })
      .sort({ createdAt: 1 }) // oldest → newest
      .lean();

    res.json(messages);
  } catch (err) {
    console.error("❌ GET MESSAGES ERROR:", err.message);
    res.status(500).json({
      message: "Failed to load chat history",
    });
  }
};
