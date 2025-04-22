import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Перевіряємо сесію NextAuth
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Не автентифіковано' }, { status: 401 });
    }
    
    // Створюємо анонімну сесію в Supabase або використовуємо email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: process.env.SUPABASE_USER_PASSWORD || 'default_password123',
    });
    
    if (error) {
      // Якщо користувач не існує, створюємо його
      if (error.status === 400) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: session.user.email,
          password: process.env.SUPABASE_USER_PASSWORD || 'default_password123',
          options: {
            data: {
              role: session.user.role || 'student'
            }
          }
        });
        
        if (signUpError) {
          return NextResponse.json({ error: signUpError.message }, { status: 500 });
        }
        
        return NextResponse.json(signUpData);
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}