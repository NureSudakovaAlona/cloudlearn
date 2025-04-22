// lib/auth.ts
import { type NextAuthOptions } from "next-auth"
import { authOptions as nextAuthOptions } from '../app/api/auth/[...nextauth]/route'

export const authOptions: NextAuthOptions = nextAuthOptions
