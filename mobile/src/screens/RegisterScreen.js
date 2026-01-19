import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../lib/api";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle
  const [loading, setLoading] = useState(false);

  /* ===========================
     Handle Register
  ============================ */
  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert("Validation", "All fields are required");
      return;
    }

    try {
      setLoading(true);

      // ✅ Same API as WEB
      await api.post("/auth/register", {
        username,
        email,
        password,
      });

      Alert.alert("Success", "Account created successfully 🎉", [
        {
          text: "Login",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (err) {
      console.log("REGISTER ERROR:", err);

      Alert.alert(
        "Register Failed",
        err?.response?.data?.message || "Unable to register"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        {/* Talk Me Header (same as Login) */}
        <View style={styles.titleContainer}>
          <Text style={styles.titlePink}>Talk</Text>
          <Text style={styles.titleBlue}> Me</Text>
        </View>

        <Text style={styles.subtitle}>Create your account</Text>

        {/* Username */}
        <TextInput
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          editable={!loading}
        />

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

        {/* Register Button */}
        <TouchableOpacity disabled={loading} onPress={handleRegister}>
          <LinearGradient
            colors={["#22d3ee", "#a855f7", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.link}>Login</Text>
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

  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },

  footerText: {
    textAlign: "center",
    marginTop: 18,
    color: "#aaa",
    fontSize: 13,
  },

  link: {
    color: "#ec4899",
    fontWeight: "bold",
  },
});
