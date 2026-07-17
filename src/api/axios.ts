import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

import { auth } from "../firebase/firebase";

const api = axios.create({
  baseURL: "https://fagroo-project.onrender.com/api",
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;