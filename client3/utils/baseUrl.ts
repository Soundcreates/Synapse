import axios from "axios";

// Use environment variable for API URL or fallback to production URL
const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "https://synapse-ki0x.onrender.com/api";

console.log("🔗 API Base URL:", baseURL);

export const fetchData = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout for requests
});

// Add request interceptor for debugging
fetchData.interceptors.request.use(
  (config) => {
    console.log(
      `🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
fetchData.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      "❌ API Response Error:",
      error.response?.status,
      error.message
    );
    if (error.response?.status === 404) {
      console.error("🚫 Endpoint not found:", error.config.url);
    }
    if (error.code === "NETWORK_ERROR") {
      console.error("🌐 Network error - check if backend is running");
    }
    return Promise.reject(error);
  }
);
