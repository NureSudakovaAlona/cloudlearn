'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface TeacherCourse {
  id: string;
  title: string;
  description: string;
  created_at: string;
  student_count: number;
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeacherCourses() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        
        // Отримуємо курси викладача
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('teacher_id', session.user.id);

        if (coursesError) throw coursesError;

        // Для кожного курсу отримуємо кількість студентів
        const coursesWithStudentCount = await Promise.all(
          coursesData.map(async (course) => {
            const { count, error } = await supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            return {
              ...course,
              student_count: count || 0
            };
          })
        );

        setCourses(coursesWithStudentCount);
      } catch (error) {
        console.error('Помилка при завантаженні курсів:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      // Перевіряємо, чи користувач є викладачем
      if (session.user.role !== 'teacher') {
        router.push('/dashboard');
        return;
      }
      
      fetchTeacherCourses();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <p className="text-center py-10">Завантаження...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Панель викладача</h1>
          <Link 
            href="/courses/create" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Створити новий курс
          </Link>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Ваші курси</h2>
          
          {courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="border rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <div className="flex justify-between text-gray-600 mb-2">
                      <span>Створено: {new Date(course.created_at).toLocaleDateString('uk-UA')}</span>
                      <span>Студентів: {course.student_count}</span>
                    </div>
                    <p className="mb-4 line-clamp-3">{course.description}</p>
                    <div className="flex gap-2">
                      <Link 
                        href={`/courses/${course.id}`}
                        className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                      >
                        Переглянути
                      </Link>
                      <Link 
                        href={`/courses/${course.id}/lab/create`}
                        className="flex-1 text-center bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                      >
                        Додати роботу
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">У вас ще немає створених курсів</p>
              <Link 
                href="/courses/create" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Створити перший курс
              </Link>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Статистика</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-xl font-bold">{courses.length}</p>
              <p className="text-gray-600">Створених курсів</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-xl font-bold">
                {courses.reduce((sum, course) => sum + course.student_count, 0)}
              </p>
              <p className="text-gray-600">Загальна кількість студентів</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-xl font-bold">
                {courses.reduce((sum, course) => sum + 
                  (course.student_count > 0 ? 1 : 0), 0)}
              </p>
              <p className="text-gray-600">Активних курсів</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}