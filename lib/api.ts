const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const api = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        credentials: "include", // if using cookies for auth
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw { status: res.status, response: { data: errorData } };
      }
      return res.json();
    } catch (error) {
      throw error;
    }
  },

  post: async (endpoint: string, body: any, options: RequestInit = {}) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw { status: res.status, response: { data: errorData } };
      }
      return res.json();
    } catch (error) {
      throw error;
    }
  },
};
