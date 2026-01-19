"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false); // 👁️
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===========================
     Handle Register
  ============================ */
  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/register", {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      // ✅ Success → Login
      router.push("/login");
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="brand">Talk Me</h1>
        <p className="subtitle">Create your account</p>

        {/* Username */}
        <input
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

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
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Error */}
        {error && <div className="error">{error}</div>}

        {/* Button */}
        <button
          className="button"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="footer">
          Already have an account?{" "}
          <span className="link" onClick={() => router.push("/login")}>
            Login
          </span>
        </p>
      </div>

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
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 40px 80px rgba(0, 0, 0, 0.9);
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
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
          margin-bottom: 6px;
        }

        @keyframes shimmer {
          to {
            background-position: 200% center;
          }
        }

        .subtitle {
          color: #9ca3af;
          margin-bottom: 28px;
          font-size: 14px;
        }

        .input {
          width: 100%;
          padding: 14px;
          margin-bottom: 14px;
          border-radius: 12px;
          border: 1px solid #1f1f1f;
          background: #000;
          color: #fff;
          font-size: 15px;
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
          opacity: 0.8;
          user-select: none;
        }

        .eye:hover {
          opacity: 1;
        }

        .input::placeholder {
          color: #6b7280;
        }

        .input:focus {
          outline: none;
          border-color: #7c7cff;
          box-shadow: 0 0 8px rgba(124, 124, 255, 0.6);
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
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 10px;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        .link:hover {
          text-decoration: underline;
        }

        .error {
          background: rgba(255, 0, 0, 0.1);
          color: #f87171;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 10px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
