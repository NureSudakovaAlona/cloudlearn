import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    supabaseToken?: string;
  }

  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    supabaseToken?: string;
  }
}
}