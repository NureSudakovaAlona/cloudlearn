import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "apikey": supabaseKey,
    },
  },
})

// Функція для синхронізації автентифікації з Supabase
export async function syncSupabaseAuth() {
  try {
    const response = await fetch("/api/supabase-auth")
    if (!response.ok) {
      throw new Error("Помилка автентифікації в Supabase")
    }
    return true
  } catch (error) {
    console.error("Помилка синхронізації автентифікації:", error)
    return false
  }
}
