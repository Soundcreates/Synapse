import axios from "axios";

export const fetchData = axios.create({
  baseURL: "https://synapse-dusky.vercel.app/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
