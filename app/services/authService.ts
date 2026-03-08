import { api } from "@/lib/api";
import type { User } from "../types/user";

export const authService = {
  signup: async (data: { name: string; email: string; password: string }) => {
    return api.post("/auth/signup", data);
  },

  login: async (data: { email: string; password: string }) => {
    return api.post("/auth/signin", data);
  },

  me: async (): Promise<User | null> => {
    try {
      return await api.get("/auth/me");
    } catch {
      return null;
    }
  },

  logout: async () => {
    return api.post("/auth/logout", {});
  },
};
