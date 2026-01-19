"use client";

import { useEffect, useRef, useState } from "react";
import { encryptMessage, decryptMessage } from "../../lib/crypto";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { api, restoreSession } from "../../lib/api";

const SOCKET_URL = "http://localhost:4000";

export default function ChatPage() {
  const router = useRouter();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [search, setSearch] = useState("");

  // ✅ Sidebar last message preview
  const [lastMessages, setLastMessages] = useState({});

  // ✅ Logout confirmation modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /* ===========================
     Auto Scroll
  ============================ */
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages]);

  /* ===========================
     Restore Session + Load User
  ============================ */
  useEffect(() => {
    const boot = async () => {
      const restored = await restoreSession();
      if (!restored) {
        router.push("/login");
        return;
      }

      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch {
        router.push("/login");
      }
    };

    boot();
  }, [router]);

  /* ===========================
     Load Users + Preview
  ============================ */
  useEffect(() => {
    if (!user?._id) return;

    const loadUsers = async () => {
      try {
        const res = await api.get("/users");
        const list = res.data || [];

        const previews = {};
        for (const u of list) {
          if (u.lastMessage?.encryptedText) {
            try {
              previews[u._id] = await decryptMessage(
                u.lastMessage.encryptedText
              );
            } catch {
              previews[u._id] = "🔒 Encrypted message";
            }
          }
        }

        setLastMessages(previews);
        setUsers(list);
        if (list.length) setActiveUser(list[0]);
      } catch {
        setUsers([]);
      }
    };

    loadUsers();
  }, [user]);

  /* ===========================
     Load Chat History
  ============================ */
  useEffect(() => {
    if (!activeUser?._id || !user?._id) return;

    const loadMessages = async () => {
      try {
        const res = await api.get(
          `/messages?userId=${activeUser._id}`
        );

        const decrypted = await Promise.all(
          (res.data || []).map(async (msg) => ({
            ...msg,
            senderId: msg.senderId?.toString(),
            receiverId: msg.receiverId?.toString(),
            text: await decryptMessage(msg.encryptedText),
          }))
        );

        setMessages(decrypted);
      } catch {
        setMessages([]);
      }
    };

    loadMessages();
  }, [activeUser, user]);

  /* ===========================
     Socket Setup
  ============================ */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-user", user._id);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("new-message", async (msg) => {
      try {
        const decrypted = await decryptMessage(msg.encryptedText);

        const normalized = {
          ...msg,
          senderId: msg.senderId?.toString(),
          receiverId: msg.receiverId?.toString(),
          text: decrypted,
        };

        setMessages((prev) => {
          if (prev.some((m) => m._id === normalized._id)) return prev;
          return [...prev, normalized];
        });

        const partnerId =
          msg.senderId === user._id
            ? msg.receiverId
            : msg.senderId;

        setLastMessages((prev) => ({
          ...prev,
          [partnerId]: decrypted,
        }));
      } catch (err) {
        console.error("Decrypt failed:", err.message);
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [user]);

  /* ===========================
     Send Message
  ============================ */
  const sendMessage = async () => {
    try {
      if (!text.trim()) return;
      if (!socketRef.current || !connected) return;
      if (!user?._id || !activeUser?._id) return;

      const encryptedText = await encryptMessage(text);

      socketRef.current.emit("send-message", {
        encryptedText,
        senderName: user.username,
        senderId: user._id,
        receiverId: activeUser._id,
      });

      setText("");
    } catch (err) {
      console.error("SEND ERROR:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  /* ===========================
     Logout Modal Actions
  ============================ */
  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const confirmLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}

    router.push("/login");
  };

  /* ===========================
     Backup Export
  ============================ */
  const exportBackup = async () => {
    try {
      setBackupLoading(true);

      const res = await api.get(
        `/messages?userId=${activeUser?._id}`
      );

      const list = res.data || [];

      const lines = await Promise.all(
        list.map(async (msg) => {
          const text = await decryptMessage(msg.encryptedText);
          const date = new Date(msg.createdAt);

          const formattedDate = date.toLocaleDateString("en-GB");
          const formattedTime = date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return `[${formattedDate}, ${formattedTime}] ${msg.senderName}: ${text}`;
        })
      );

      const txt = lines.join("\n");
      const blob = new Blob([txt], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "chat-backup.txt";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("❌ Backup failed");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImport = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      if (!window.confirm("Restore chat backup?")) return;

      const rawText = await file.text();
      await api.post("/backup/import", { rawText });

      alert("✅ Backup restored");
      window.location.reload();
    } catch {
      alert("❌ Invalid backup file");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  /* ===========================
     UI
  ============================ */
  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h3 style={styles.logo}>⚡ Talk Me</h3>

        <input
          placeholder="🔍 Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />

        <div style={styles.userList}>
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => setActiveUser(u)}
              style={{
                ...styles.userItem,
                ...(activeUser?._id === u._id
                  ? styles.activeUser
                  : {}),
              }}
            >
              <div style={{ fontWeight: 600 }}>
                👤 {u.username}
              </div>

              <div style={styles.preview}>
                {lastMessages[u._id] || "No messages yet"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {/* Header */}
        <div style={styles.header}>
          <strong>{activeUser?.username}</strong>

          <div style={styles.headerActions}>
            <button
              style={styles.actionBtn}
              onClick={() => router.push("/login/qr")}
            >
              📱 Login via QR
            </button>

            <button
              style={styles.actionBtn}
              onClick={exportBackup}
              disabled={backupLoading}
            >
              💾 Backup
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              hidden
              onChange={handleImport}
            />

            <button
              style={styles.actionBtn}
              onClick={() => fileInputRef.current.click()}
            >
              ♻ Restore
            </button>

            <button
              style={styles.logoutBtn}
              onClick={openLogoutModal}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((msg) => {
            const isMe =
              msg.senderId === user?._id?.toString();

            return (
              <div
                key={msg._id}
                style={{
                  ...styles.message,
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  background: isMe
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "rgba(255,255,255,0.08)",
                  color: isMe ? "#fff" : "#e5e7eb",
                }}
              >
                <div>{msg.text}</div>
                <div style={styles.msgTime}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputBox}>
          <input
            style={styles.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
          />
          <button style={styles.sendBtn} onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>

      {/* 🔴 Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>Confirm Logout</h3>
            <p style={styles.modalText}>
              Are you sure you want to logout?
            </p>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={closeLogoutModal}
              >
                Cancel
              </button>

              <button
                style={styles.confirmBtn}
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =======================
   Styles
======================= */

const styles = {
  app: {
    display: "flex",
    height: "100vh",
    background: "#000",
    color: "#fff",
  },
  sidebar: {
    width: 260,
    padding: 12,
    borderRight: "1px solid #222",
  },
  logo: { marginBottom: 12 },
  search: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
  },
  userList: { overflowY: "auto" },
  userItem: {
    padding: 10,
    cursor: "pointer",
    borderRadius: 6,
  },
  activeUser: { background: "#222" },
  preview: {
    fontSize: 12,
    opacity: 0.7,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: 12,
    borderBottom: "1px solid #222",
    display: "flex",
    justifyContent: "space-between",
  },
  headerActions: { display: "flex", gap: 10 },

  actionBtn: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.15)",
    background:
      "linear-gradient(135deg, #22d3ee, #6366f1, #a855f7)",
    color: "#000",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },

  logoutBtn: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #fb7185, #ef4444)",
    color: "#000",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },

  messages: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  message: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: 14,
    fontSize: 15,
    lineHeight: "1.5",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  msgTime: {
    fontSize: 10,
    textAlign: "right",
    opacity: 0.6,
    marginTop: 4,
  },
  inputBox: {
    display: "flex",
    padding: 12,
    borderTop: "1px solid #222",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
  },
  sendBtn: {
    marginLeft: 10,
    padding: "0 18px",
  },

  /* ===== Modal Styles ===== */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  modalBox: {
    background: "#0b0b0b",
    padding: 28,
    borderRadius: 18,
    width: 320,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow:
      "0 0 40px rgba(124,124,255,0.25), 0 40px 80px rgba(0,0,0,0.9)",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },

  modalText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },

  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },

  cancelBtn: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 10,
    background: "#111",
    color: "#fff",
    border: "1px solid #333",
    cursor: "pointer",
  },

  confirmBtn: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 10,
    background: "linear-gradient(135deg, #fb7185, #ef4444)",
    color: "#000",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
};
