'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import bcryptjs from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Перевіряємо, чи користувач уже існує в нашій базі даних
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        setError('Користувач з цією електронною поштою вже існує');
        setLoading(false);
        return;
      }

      // 1. Спочатку реєструємо користувача в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'student' // За замовчуванням
          }
        }
      });

      if (authError) {
        throw new Error(`Помилка реєстрації в Supabase Auth: ${authError.message}`);
      }

      // 2. Хешуємо пароль для нашої бази даних
      const hashedPassword = await bcryptjs.hash(formData.password, 10);

      // 3. Створюємо користувача в нашій базі даних
      const { error: dbError } = await supabase.from('users').insert({
        email: formData.email,
        password: hashedPassword,
        full_name: formData.fullName,
        role: 'student', // За замовчуванням
        supabase_id: authData.user?.id // Зберігаємо ID з Supabase Auth
      });

      if (dbError) {
        // Якщо помилка при створенні в нашій БД, спробуємо видалити користувача з Supabase Auth
        await supabase.auth.admin?.deleteUser(authData.user?.id || '');
        throw new Error(`Помилка створення користувача в базі даних: ${dbError.message}`);
      }

      // 4. Успішна реєстрація - автоматично авторизуємо користувача
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (signInResult?.error) {
        // Якщо помилка входу, все одно перенаправляємо на сторінку входу
        router.push('/auth/signin?status=registered');
      } else {
        // Якщо вхід успішний, перенаправляємо на панель керування
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Помилка при реєстрації:', error);
      setError(error instanceof Error ? error.message : 'Сталася помилка під час реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Створення облікового запису</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 mb-2">Повне ім'я</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Електронна пошта</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Створення облікового запису...' : 'Зареєструватися'}
          </button>
          
          <div className="mt-4 text-center">
            <p>
              Вже маєте обліковий запис?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                Увійти
              </Link>
            </p>
          </div>
        </form>
      </div>
    </Layout>
  );
}