import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { api, setAccessToken } from "../lib/api";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===========================
     Handle Login
  ============================ */
  const handleLogin = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/login", {
        email: cleanEmail,
        password: cleanPassword,
      });

      // ✅ Save token
      setAccessToken(res.data.accessToken);

      Alert.alert("✅ Login Successful", "Welcome back!");

      // ✅ Navigate to chat
      navigation.replace("ChatList");
    } catch (err) {
      console.log("LOGIN ERROR:", err?.response || err?.message);

      if (err.response?.status === 401) {
        setError("❌ Invalid email or password");
      } else {
        setError("⚠️ Unable to connect to server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titlePink}>Talk</Text>
          <Text style={styles.titleBlue}> Me</Text>
        </View>

        <Text style={styles.subtitle}>Login to your account</Text>

        {/* Error */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Email */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        {/* Password with Eye Icon */}
        <View style={styles.passwordBox}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            style={[styles.input, styles.passwordInput]}
            secureTextEntry={!showPassword}
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={styles.eyeIcon}>
              {showPassword ? "🙈" : "👁️"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity disabled={loading} onPress={handleLogin}>
          <LinearGradient
            colors={["#22d3ee", "#a855f7", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginButton}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* QR Login */}
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => navigation.navigate("QrLogin")}
        >
          <Text style={styles.qrText}>📷 Login with QR</Text>
        </TouchableOpacity>

        {/* Trademark */}
        <Text style={styles.trademark}>© 2026 Talk Me</Text>

        {/* Register */}
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Don’t have an account?{" "}
            <Text style={styles.registerLink}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===========================
   Styles
============================ */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  titlePink: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ec4899",
  },
  titleBlue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#22d3ee",
  },
  subtitle: {
    textAlign: "center",
    color: "#aaa",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#1f1f1f",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  /* Password Field */
  passwordBox: {
    position: "relative",
    justifyContent: "center",
  },

  passwordInput: {
    paddingRight: 48,
  },

  eyeBtn: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
  },

  eyeIcon: {
    fontSize: 18,
  },

  loginButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  loginText: {
    fontWeight: "bold",
    color: "#000",
  },
  qrButton: {
    marginTop: 16,
    alignItems: "center",
  },
  qrText: {
    color: "#22d3ee",
  },
  trademark: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 12,
    color: "#555",
  },
  registerText: {
    marginTop: 10,
    textAlign: "center",
    color: "#aaa",
  },
  registerLink: {
    color: "#ec4899",
    fontWeight: "bold",
  },
  error: {
    color: "#ff5555",
    textAlign: "center",
    marginBottom: 10,
  },
});
