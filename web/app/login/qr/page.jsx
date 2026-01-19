"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { api } from "../../../lib/api";

const SOCKET_URL = "http://localhost:4000";
const QR_EXPIRE_SECONDS = 30;

export default function QrLoginPage() {
  const router = useRouter();
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  const [qrImage, setQrImage] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRE_SECONDS);

  /* ===========================
     Start Countdown Timer
  ============================ */
  const startTimer = () => {
    clearInterval(timerRef.current);
    setSecondsLeft(QR_EXPIRE_SECONDS);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          console.log("⏳ QR expired → regenerating");
          generateQr(); // auto regenerate
          return QR_EXPIRE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ===========================
     Generate QR
  ============================ */
  const generateQr = async () => {
    try {
      setLoading(true);
      setQrImage(null);
      setToken(null);

      console.log("📱 Generating QR...");

      const res = await api.get("/qr/generate");
      const { token, qrImage } = res.data;

      if (!token || !qrImage) {
        throw new Error("Invalid QR response");
      }

      setToken(token);
      setQrImage(qrImage);

      // ▶️ Restart countdown
      startTimer();

      // 🔌 Connect socket once
      if (!socketRef.current) {
        const socket = io(SOCKET_URL, {
          withCredentials: true,
          transports: ["websocket"],
          reconnection: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("🟢 Socket connected:", socket.id);
        });

        socket.on("disconnect", () => {
          console.log("🔴 Socket disconnected");
        });

        // ✅ QR Login Success from backend
        socket.on("qr-success", (data) => {
          console.log("✅ QR LOGIN SUCCESS:", data);
          alert("📱 Mobile logged in successfully!");
          router.push("/chat");
        });
      }

      // ✅ Join QR room (token)
      socketRef.current.emit("join-qr", token);
      console.log("🔗 Joined QR room:", token);
    } catch (err) {
      console.error("❌ QR GENERATE ERROR:", err.message);
      alert("Unable to generate QR");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     Close Page
  ============================ */
  const closePage = () => {
    clearInterval(timerRef.current);
    socketRef.current?.disconnect();
    router.push("/chat"); // or "/login"
  };

  /* ===========================
     On Load
  ============================ */
  useEffect(() => {
    generateQr();

    return () => {
      clearInterval(timerRef.current);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  /* ===========================
     UI
  ============================ */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* ❌ Close Button */}
        <button style={styles.closeBtn} onClick={closePage}>
          ✖
        </button>

        {/* Title */}
        <div style={styles.logoRow}>
          <span style={styles.logoPink}>Talk</span>
          <span style={styles.logoBlue}> Me</span>
        </div>

        <p style={styles.subtitle}>
          Scan this QR using your mobile app
        </p>

        {/* QR */}
        <div style={styles.qrWrapper}>
          {loading && (
            <div style={styles.loader}>Generating QR...</div>
          )}

          {!loading && qrImage && (
            <img src={qrImage} alt="QR Code" style={styles.qr} />
          )}
        </div>

        {/* ⏱ Timer */}
        <p style={styles.timer}>
          ⏳ Expires in <b>{secondsLeft}s</b>
        </p>

        {/* Regenerate */}
        <button
          style={styles.refreshBtn}
          onClick={generateQr}
          disabled={loading}
        >
          🔄 Regenerate QR
        </button>
      </div>
    </div>
  );
}

/* =======================
   Styles
======================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    position: "relative",
    width: "100%",
    maxWidth: 420,
    background: "#0b0b0b",
    padding: "36px 32px",
    borderRadius: 22,
    textAlign: "center",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.9)",
  },

  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    opacity: 0.7,
  },

  logoRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 6,
    fontSize: 34,
    fontWeight: 900,
  },

  logoPink: {
    color: "#ec4899",
    textShadow: "0 0 18px rgba(236,72,153,0.9)",
  },

  logoBlue: {
    color: "#22d3ee",
    textShadow: "0 0 18px rgba(34,211,238,0.9)",
  },

  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 24,
  },

  qrWrapper: {
    background: "#050505",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    border: "1px solid #222",
    boxShadow:
      "0 0 30px rgba(124,124,255,0.15), inset 0 0 20px rgba(0,0,0,0.6)",
    minHeight: 260,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  qr: {
    width: 260,
    height: 260,
    borderRadius: 12,
    background: "#fff",
    padding: 10,
  },

  loader: {
    color: "#aaa",
    fontSize: 14,
  },

  timer: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 14,
    color: "#9ca3af",
  },

  refreshBtn: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 12,
    border: "1px solid #7c7cff",
    background: "transparent",
    color: "#c7d2fe",
    cursor: "pointer",
    fontWeight: 600,
  },
};
  