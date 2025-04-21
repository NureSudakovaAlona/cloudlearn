'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';

export default function CreateCoursePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Перевіряємо, чи користувач є викладачем
  if (session && session.user.role !== 'teacher') {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="bg-red-100 p-4 rounded-md mb-6">
            <p className="text-red-700">У вас немає прав на створення курсів. Ця функція доступна тільки для викладачів.</p>
          </div>
          <button 
            onClick={() => router.push('/courses')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Повернутися до списку курсів
          </button>
        </div>
      </Layout>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      setError('Ви не авторизовані');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Створюємо новий курс
      const { data, error } = await supabase.from('courses').insert({
        title: formData.title,
        description: formData.description,
        teacher_id: session.user.id
      }).select();

      if (error) throw error;

      // Перенаправляємо на сторінку створеного курсу
      router.push(`/courses/${data[0].id}`);
    } catch (error) {
      console.error('Помилка при створенні курсу:', error);
      setError('Не вдалося створити курс. Спробуйте ще раз пізніше.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Створення нового курсу</h1>
        
        {error && (
          <div className="bg-red-100 p-4 rounded-md mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 mb-2">Назва курсу</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Введіть назву курсу"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 mb-2">Опис курсу</label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-40"
              placeholder="Введіть детальний опис курсу"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Створення...' : 'Створити курс'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/courses')}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}