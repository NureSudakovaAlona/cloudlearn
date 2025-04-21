'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';

export default function CreateLabPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [_course, setCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_id: 'default', // За замовчуванням
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const courseId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    async function fetchCourse() {
      if (!courseId || !session?.user?.id) return;

      try {
        // Отримуємо дані курсу
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) throw error;

        // Перевіряємо, чи поточний користувач є автором курсу
        if (data.teacher_id !== session.user.id) {
          setError('У вас немає прав на редагування цього курсу');
          return;
        }

        setCourse(data);
      } catch (error) {
        console.error('Помилка при завантаженні курсу:', error);
        setError('Не вдалося завантажити дані курсу');
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      setSubmitting(true);
      setError('');

      // Створюємо нову лабораторну роботу
      const { data: _, error } = await supabase.from('lab_works').insert({
        course_id: courseId,
        title: formData.title,
        description: formData.description,
        template_id: formData.template_id
      }).select();

      if (error) throw error;

      // Перенаправляємо назад до сторінки курсу
      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error('Помилка при створенні лабораторної роботи:', error);
      setError('Не вдалося створити лабораторну роботу. Спробуйте ще раз пізніше.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <p className="text-center py-10">Завантаження...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="bg-red-100 p-4 rounded-md mb-6">
            <p className="text-red-700">{error}</p>
          </div>
          <button 
            onClick={() => router.push(`/courses/${courseId}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Повернутися до курсу
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Створення лабораторної роботи</h1>
        
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 mb-2">Назва лабораторної роботи</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Введіть назву лабораторної роботи"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 mb-2">Опис та завдання</label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-40"
              placeholder="Введіть детальний опис лабораторної роботи та завдання"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="template_id" className="block text-gray-700 mb-2">Шаблон віртуального середовища</label>
            <select
              id="template_id"
              name="template_id"
              value={formData.template_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="default">Стандартне середовище</option>
              <option value="programming">Середовище для програмування</option>
              <option value="network">Мережеве середовище</option>
              <option value="devops">DevOps середовище</option>
            </select>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {submitting ? 'Створення...' : 'Створити лабораторну роботу'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push(`/courses/${courseId}`)}
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