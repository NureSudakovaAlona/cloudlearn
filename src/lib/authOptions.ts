import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcryptjs from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (userError || !userData) {
          return null
        }

        const isPasswordValid = await bcryptjs.compare(
          credentials.password,
          userData.password
        )
        if (!isPasswordValid) {
          return null
        }

        const { data: supabaseAuth, error: supabaseError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

        let supabaseToken: string | undefined

        if (supabaseError) {
          if (supabaseError.status === 400) {
            const { data: signUpData, error: signUpError } =
              await supabase.auth.signUp({
                email: credentials.email,
                password: credentials.password,
              })

            if (!signUpError) {
              supabaseToken = signUpData.session?.access_token
            }
          } else {
            console.error('Помилка автентифікації в Supabase:', supabaseError)
          }
        } else {
          supabaseToken = supabaseAuth.session?.access_token
        }

        return {
          id: userData.id,
          email: userData.email,
          name: userData.full_name,
          role: userData.role,
          supabaseToken,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        if ('supabaseToken' in user) {
          token.supabaseToken = user.supabaseToken
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      session.accessToken = token.supabaseToken as string | undefined
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
  },
}
