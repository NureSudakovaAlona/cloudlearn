'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface EnrolledCourse {
  id: string;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    description: string;
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrolledCourses() {
      if (!session?.user?.id) return;
  
      try {
        setLoading(true);
        
        // Змінюємо структуру запиту для отримання правильних даних
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            enrolled_at,
            course_id,
            c:courses!course_id (
              id,
              title,
              description
            )
          `)
          .eq('student_id', session.user.id);
  
        if (error) throw error;
        
        console.log('Отримані дані:', data); // Для діагностики
        
        // Адаптуємо отримані дані до нашого інтерфейсу
        const formattedData = data?.map(item => {
          // Перевірка, чи c є масивом, і взяття першого елементу
          const courseData = Array.isArray(item.c) ? item.c[0] : item.c;
          
          // Захист від невизначених значень
          return {
            id: item.id,
            enrolled_at: item.enrolled_at,
            course: {
              id: courseData?.id || '',
              title: courseData?.title || 'Назва відсутня',
              description: courseData?.description || 'Опис відсутній'
            }
          };
        }) || [];        
        
        console.log('Форматовані дані:', formattedData); // Для діагностики
        setEnrolledCourses(formattedData);
      } catch (error) {
        console.error('Помилка при завантаженні курсів:', error);
      } finally {
        setLoading(false);
      }
    }
  
    if (status === 'authenticated') {
      fetchEnrolledCourses();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  if (status === 'loading') {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <p className="text-center py-10">Завантаження...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className="text-center p-10">
          <p className="mb-4">Будь ласка, увійдіть в систему, щоб переглянути панель керування.</p>
          <Link 
            href="/auth/signin" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Увійти
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Панель студента</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Ваші курси</h2>
          
          {loading ? (
            <p>Завантаження ваших курсів...</p>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrollment) => (
                <div key={enrollment.id} className="border rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{enrollment.course?.title || 'Назва відсутня'}</h3>
                    <p className="text-gray-600 mb-2">
                      Дата зарахування: {new Date(enrollment.enrolled_at).toLocaleDateString('uk-UA')}
                    </p>
                    <p className="mb-4 line-clamp-3">{enrollment.course?.description || 'Опис відсутній'}</p>
                    {enrollment.course?.id ? (
                      <Link 
                        href={`/courses/${enrollment.course.id}`}
                        className="block text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Перейти до курсу
                      </Link>
                    ) : (
                      <span className="block text-center bg-gray-400 text-white px-4 py-2 rounded-md">
                        Недоступно
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">Ви ще не записані на жодний курс</p>
              <Link 
                href="/courses" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Переглянути доступні курси
              </Link>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Останні активності</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-600">Історія ваших дій та оцінок з'явиться тут.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}