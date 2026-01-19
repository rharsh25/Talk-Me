import User from "../models/User.js";
import Message from "../models/message.js";

/**
 * GET /api/users
 * Returns all users except logged-in user
 * + last message with each user
 */
export const getUsersWithLastMessage = async (req, res) => {
  try {
    const myUserId = req.user._id;

    // 1️⃣ Get all users except me
    const users = await User.find(
      { _id: { $ne: myUserId } },
      "_id username"
    ).lean();

    // 2️⃣ For each user → fetch last message
    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: myUserId, receiverId: user._id },
            { senderId: user._id, receiverId: myUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .select("encryptedText createdAt senderId receiverId")
          .lean();

        return {
          ...user,
          lastMessage: lastMessage || null,
        };
      })
    );

    res.json(usersWithLastMessage);
  } catch (error) {
    console.error("❌ Get Users With Last Message Error:", error);
    res.status(500).json([]);
  }
};
