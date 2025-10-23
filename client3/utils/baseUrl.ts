import axios from "axios";

export const fetchData = axios.create({
  baseURL: "https://synapse-ki0x.onrender.com/api",
  withCredentials: true,
});
