import { createClient } from '@supabase/supabase-js';
import { useSession } from 'next-auth/react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Стандартний клієнт для анонімних запитів
export const supabase = createClient(supabaseUrl, supabaseKey);

// Хук для отримання клієнта з токеном аутентифікації
export function useSupabaseClient() {
  const { data: session } = useSession();
  
  if (session?.supabaseToken) {
    // Створюємо клієнт з токеном користувача
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseToken}`
        }
      }
    });
  }
  
  // Повертаємо стандартний клієнт, якщо немає токена
  return supabase;
}