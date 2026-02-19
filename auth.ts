import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // connect to backend
          const res = await fetch("http://localhost:5001/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const user = await res.json();

          // If backend returned an error or no user
          if (!res.ok || !user) {
            console.error("Login failed:", user);
            return null;
          }

          // Return the user object (ensure it has id/email/name)
          // Adjust fields based on what your backend returns (e.g. user.user or just user)
          return {
            id: user.user?.id || user.id,
            name: user.user?.name || user.name,
            email: user.user?.email || user.email,
            image: user.user?.avatar || user.avatar,
          };

        } catch (e) {
          console.error("Auth error:", e);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin", // Custom sign in page
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
})
