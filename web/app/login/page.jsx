"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // ✅ success message

  /* ===========================
     Handle Email Login
  ============================ */
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      // ✅ Save token
      setAccessToken(res.data.accessToken);

      // ✅ Show success message
      setSuccess("✅ Login successful! Redirecting to chat...");

      // ⏳ Small delay so user can see message
      setTimeout(() => {
        router.push("/chat");
      }, 1200);
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response?.status === 401) {
        setError("❌ Invalid email or password.");
      } else {
        setError(
          err.response?.data?.message ||
            "❌ Unable to connect to server."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="brand">Talk Me</h1>
        <p className="subtitle">Login to your account</p>

        {/* ❌ Error */}
        {error && <div className="error">{error}</div>}

        {/* ✅ Success */}
        {success && <div className="success">{success}</div>}

        {/* Email */}
        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {/* Password */}
        <div className="passwordBox">
          <input
            className="input passwordInput"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <span
            className="eye"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Login Button */}
        <button
          className="button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="footer">
          Don&apos;t have an account?{" "}
          <span
            className="link"
            onClick={() => router.push("/register")}
          >
            Register
          </span>
        </p>
      </div>

      {/* Styles */}
      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }

        .card {
          background: #0b0b0b;
          padding: 48px 38px;
          width: 100%;
          max-width: 380px;
          border-radius: 20px;
          text-align: center;
        }

        .brand {
          font-size: 36px;
          font-weight: 900;
          background: linear-gradient(
            90deg,
            #00eaff,
            #7c7cff,
            #ff4ecd
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 6px;
        }

        .subtitle {
          color: #9ca3af;
          margin-bottom: 28px;
          font-size: 14px;
        }

        .error {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.4);
          color: #ffb4b4;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #86efac;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .input {
          width: 100%;
          padding: 14px;
          margin-bottom: 14px;
          border-radius: 12px;
          border: 1px solid #1f1f1f;
          background: #000;
          color: #fff;
        }

        .passwordBox {
          position: relative;
        }

        .passwordInput {
          padding-right: 42px;
        }

        .eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 18px;
        }

        .button {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(
            90deg,
            #00eaff,
            #7c7cff,
            #ff4ecd
          );
          color: #000;
          font-weight: 700;
          cursor: pointer;
        }

        .button:disabled {
          opacity: 0.6;
        }

        .footer {
          margin-top: 22px;
          font-size: 14px;
          color: #9ca3af;
        }

        .link {
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
