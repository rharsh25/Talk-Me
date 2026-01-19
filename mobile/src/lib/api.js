import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

/* ============================
   Auto Detect Host IP (SAFE)
============================ */

function getBaseURL() {
  try {
    // ✅ New Expo format
    const host =
      Constants.expoConfig?.hostUri ||
      Constants.manifest?.debuggerHost ||
      Constants.manifest2?.extra?.expoClient?.hostUri;

    if (host) {
      const ip = host.split(":")[0];
      console.log("🌐 Auto detected IP:", ip);
      return `http://${ip}:4000/api`;
    }
  } catch (err) {
    console.log("⚠️ IP detect failed:", err.message);
  }

  // ✅ Web fallback
  if (Platform.OS === "web") {
    console.log("🌐 Using web localhost");
    return "http://localhost:4000/api";
  }

  // ✅ Android emulator fallback
  if (Platform.OS === "android") {
    console.log("🤖 Using Android emulator host");
    return "http://10.0.2.2:4000/api";
  }

  // ✅ iOS simulator fallback
  console.log("🍎 Using iOS simulator localhost");
  return "http://localhost:4000/api";
}

const BASE_URL = getBaseURL();
console.log("🚀 API BASE URL:", BASE_URL);

/* ============================
   Axios Instance
============================ */

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================
   Access Token Store
============================ */

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log("🔐 Token set successfully");
  }
};

export const clearAccessToken = () => {
  accessToken = null;
  delete api.defaults.headers.common.Authorization;
  console.log("🔓 Token cleared");
};

export const getAccessToken = () => accessToken;

/* ============================
   Attach Token Automatically
============================ */

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
