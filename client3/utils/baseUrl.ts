import axios from "axios";

export const fetchData = axios.create({
  baseURL: "https://synapse-backend-3rpa.onrender.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
