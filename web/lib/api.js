import axios from "axios";

/* ============================
   Axios Instance
============================ */
export const api = axios.create({
  baseURL: "http://localhost:4000/api", // ✅ FIXED
  withCredentials: true, // ✅ allow refresh cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================
   Access Token Store (Memory)
============================ */
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

/* ============================
   Restore Session on App Start
============================ */
export const restoreSession = async () => {
  try {
    const res = await api.post("/auth/refresh");
    const token = res.data.accessToken;

    if (token) {
      setAccessToken(token);
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
};

/* ============================
   Attach Token to Requests
============================ */
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================
   Auto Refresh Token on 401
============================ */
let isRefreshing = false;
let pendingRequests = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ❌ If no response or not auth error → reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // ❌ Prevent infinite refresh loop
    if (
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;

        const refreshRes = await api.post("/auth/refresh");
        const newToken = refreshRes.data.accessToken;

        setAccessToken(newToken);
        isRefreshing = false;

        // 🔁 Replay queued requests
        pendingRequests.forEach((cb) => cb(newToken));
        pendingRequests = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // ⏳ Queue parallel requests while refresh is running
      return new Promise((resolve) => {
        pendingRequests.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    } catch (refreshError) {
      isRefreshing = false;
      pendingRequests = [];
      setAccessToken(null);
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);
