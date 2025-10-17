import axios from "axios";

export const fetchData = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true,
});
