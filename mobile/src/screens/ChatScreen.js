import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";

import { api } from "../lib/api";
import { encryptText, decryptText } from "../utils/crypto";

let socket = null;

export default function ChatScreen({ route, navigation }) {
  const { user } = route.params;          // receiver + myId
  const myUserId = user?.myId;            // logged-in user id

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const listRef = useRef(null);

  /* ============================
     Load Chat History
  ============================ */
  const loadHistory = async () => {
    try {
      console.log("📜 Loading chat history...");

      const res = await api.get("/messages", {
        params: {
          userId: user._id, // receiver id
        },
      });

      const history = (res.data || []).map(normalizeMessage);
      setMessages(history);
    } catch (err) {
      console.log("❌ Load history failed:", err?.message);
    }
  };

  /* ============================
     Connect Socket + Init
  ============================ */
  useEffect(() => {
    if (!myUserId) {
      console.warn("⚠️ myUserId missing in ChatScreen");
      return;
    }

    // ✅ Load old messages first
    loadHistory();

    const SOCKET_URL = api.defaults.baseURL.replace("/api", "");
    console.log("🔌 Connecting socket:", SOCKET_URL);

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);

      // Join personal room
      socket.emit("join-user", myUserId);
    });

    socket.on("new-message", (msg) => {
      try {
        const normalized = normalizeMessage(msg);

        setMessages((prev) => {
          // 🛡 Prevent duplicate messages
          if (prev.some((m) => m.id === normalized.id)) return prev;
          return [...prev, normalized];
        });
      } catch (err) {
        console.error("❌ Message normalize failed:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    return () => {
      console.log("🧹 Cleaning socket");
      socket?.removeAllListeners();
      socket?.disconnect();
      socket = null;
    };
  }, [myUserId]);

  /* ============================
     Auto Scroll
  ============================ */
  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages]);

  /* ============================
     Send Message (NO optimistic UI)
  ============================ */
  const sendMessage = () => {
    if (!message.trim()) return;

    if (!socket?.connected || !myUserId) {
      console.warn("⚠️ Socket not ready or user missing");
      return;
    }

    const encrypted = encryptText(message); // 🔐 encrypt

    const payload = {
      encryptedText: encrypted,
      senderId: myUserId,
      senderName: "Me",
      receiverId: user._id,
    };

    console.log("📤 Sending encrypted message:", payload);
    socket.emit("send-message", payload);

    // ❌ Do NOT add locally (no optimistic UI)
    // Message will arrive from socket after DB save

    setMessage("");
  };

  /* ============================
     Normalize Server Message
  ============================ */
  const normalizeMessage = (msg) => {
    const isMe = String(msg.senderId) === String(myUserId);

    return {
      id: msg._id,
      text: decryptText(msg.encryptedText), // 🔓 decrypt
      sender: isMe ? "me" : "other",
      time: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const goBack = () => navigation.goBack();

  /* ============================
     Render Message Bubble
  ============================ */
  const renderMessage = ({ item }) => {
    const isMe = item.sender === "me";

    return (
      <View
        style={[
          styles.bubble,
          isMe ? styles.myBubble : styles.otherBubble,
        ]}
      >
        <Text style={styles.msgText}>{item.text}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    );
  };

  /* ============================
     UI
  ============================ */
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {user?.username || "Chat"}
        </Text>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            style={styles.input}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />

          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ===========================
   Styles
=========================== */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  backIcon: {
    fontSize: 24,
    color: "#6d5dfc",
    fontWeight: "bold",
  },

  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  container: { flex: 1 },

  list: { padding: 12 },

  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },

  myBubble: {
    backgroundColor: "#6d5dfc",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
  },

  otherBubble: {
    backgroundColor: "#1e1e1e",
    alignSelf: "flex-start",
    borderTopLeftRadius: 4,
  },

  msgText: { color: "#fff", fontSize: 15 },

  time: {
    fontSize: 10,
    color: "#ddd",
    marginTop: 4,
    textAlign: "right",
  },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },

  input: {
    flex: 1,
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 42,
  },

  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#6d5dfc",
    paddingHorizontal: 18,
    borderRadius: 20,
    justifyContent: "center",
  },

  sendText: { color: "#fff", fontWeight: "bold" },
});
