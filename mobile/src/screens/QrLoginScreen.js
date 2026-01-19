import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, setAccessToken } from "../lib/api";

export default function QrLoginScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const processingRef = useRef(false); // 🛡 hard lock against double scan

  /* ===========================
     Ask camera permission
  ============================ */
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  /* ===========================
     Extract token from QR
  ============================ */
  const extractToken = (data) => {
    if (!data) return null;

    let token = data;

    // ✅ chatapp://login?token=xxxxx
    if (data.includes("token=")) {
      const match = data.match(/token=([^&]+)/);
      if (match?.[1]) return match[1];
    }

    // ✅ QR_LOGIN:xxxxx (legacy support)
    if (data.startsWith("QR_LOGIN:")) {
      return data.replace("QR_LOGIN:", "").trim();
    }

    // ✅ Raw token fallback
    if (data.length >= 20) {
      return data.trim();
    }

    return null;
  };

  /* ===========================
     Handle QR Scan
  ============================ */
  const handleScan = async ({ data }) => {
    if (scanned || loading || processingRef.current) return;

    const token = extractToken(data);

    if (!token) {
      Alert.alert("Invalid QR", "QR code is not valid.");
      return;
    }

    try {
      processingRef.current = true;
      setScanned(true);
      setLoading(true);

      console.log("📸 QR Token:", token);

      // ✅ Verify QR token with backend
      const res = await api.post("/qr/verify", { token });

      console.log("✅ QR VERIFY RESPONSE:", res.data);

      const jwt =
        res.data?.accessToken ||
        res.data?.token ||
        res.data?.jwt;

      if (!jwt) {
        throw new Error("JWT not received from server");
      }

      // ✅ Save JWT globally
      setAccessToken(jwt);
      console.log("🔐 JWT Saved");

      // ✅ Navigate after small delay
      setTimeout(() => {
        navigation.replace("ChatList");
      }, 300);
    } catch (err) {
      console.log(
        "❌ QR LOGIN ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "QR Login Failed",
        err?.response?.data?.message ||
          err.message ||
          "Invalid or expired QR"
      );

      // ♻️ Allow re-scan
      setScanned(false);
      processingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     Permission Screens
  ============================ */
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required</Text>

        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ===========================
     UI
  ============================ */
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scan QR</Text>
      </View>

      {/* Camera */}
      <View style={styles.cameraWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleScan}
        />

        <View style={styles.scanFrame} />

        <Text style={styles.hintText}>
          Align QR code inside the frame
        </Text>
      </View>

      {/* Loader */}
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#22d3ee" />
          <Text style={styles.loadingText}>Verifying QR...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ===========================
   Styles
=========================== */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 24,
    color: "#ec4899",
    fontWeight: "bold",
  },

  headerTitle: {
    color: "#22d3ee",
    fontSize: 18,
    fontWeight: "700",
  },

  cameraWrapper: { flex: 1 },

  scanFrame: {
    position: "absolute",
    alignSelf: "center",
    top: "25%",
    width: 240,
    height: 240,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#ec4899",
  },

  hintText: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    color: "#aaa",
  },

  loader: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    alignItems: "center",
  },

  loadingText: { marginTop: 10, color: "#22d3ee" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  text: { marginTop: 12, color: "#fff" },

  permissionBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "#ec4899",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },

  permissionText: {
    color: "#22d3ee",
    fontWeight: "600",
  },
});
