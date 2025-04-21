'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  teacher_name?: string;
}

export default function CoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, boolean>>({});
  const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        
        // Отримуємо всі курси
        const { data: coursesData, error } = await supabase
          .from('courses')
          .select(`
            id, 
            title, 
            description, 
            teacher_id
          `);

        if (error) throw error;

        // Отримуємо інформацію про викладачів
        const teacherIds = coursesData.map(course => course.teacher_id);
        const { data: teachersData } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', teacherIds);

        // Об'єднуємо дані
        const coursesWithTeachers = coursesData.map(course => {
          const teacher = teachersData?.find(t => t.id === course.teacher_id);
          return {
            ...course,
            teacher_name: teacher?.full_name || 'Невідомий викладач'
          };
        });

        setCourses(coursesWithTeachers);

        // Якщо користувач авторизований, перевіряємо статус запису на курси
        if (session?.user?.id) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('student_id', session.user.id);

          const statusMap: Record<string, boolean> = {};
          
          if (enrollments) {
            enrollments.forEach(enrollment => {
              statusMap[enrollment.course_id] = true;
            });
          }
          
          setEnrollmentStatus(statusMap);
        }
      } catch (error) {
        console.error('Помилка при завантаженні курсів:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [session]);

  const handleEnroll = async (courseId: string) => {
    if (!session?.user?.id) {
      alert('Будь ласка, увійдіть в систему, щоб записатися на курс');
      return;
    }

    try {
      setEnrollingCourse(courseId);
      
      // Перевіряємо, чи користувач вже записаний на цей курс
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', session.user.id)
        .eq('course_id', courseId)
        .single();

      if (existingEnrollment) {
        alert('Ви вже записані на цей курс');
        return;
      }

      // Додаємо запис
      const { error } = await supabase.from('enrollments').insert({
        student_id: session.user.id,
        course_id: courseId
      });

      if (error) throw error;

      // Оновлюємо стан
      setEnrollmentStatus(prev => ({
        ...prev,
        [courseId]: true
      }));

      alert('Ви успішно записалися на курс!');
    } catch (error) {
      console.error('Помилка при записі на курс:', error);
      alert('Не вдалося записатися на курс. Спробуйте ще раз пізніше.');
    } finally {
      setEnrollingCourse(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Доступні курси</h1>
          {session?.user?.role === 'teacher' && (
            <Link 
              href="/courses/create" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Створити новий курс
            </Link>
          )}
        </div>

        {loading ? (
          <p className="text-center py-10">Завантаження курсів...</p>
        ) : courses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-600 mb-4">Наразі немає доступних курсів</p>
            {session?.user?.role === 'teacher' && (
              <Link 
                href="/courses/create" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Створити перший курс
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="border rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                  <p className="text-gray-600 mb-4">Викладач: {course.teacher_name}</p>
                  <p className="mb-4">{course.description}</p>
                  
                  <div className="mt-4">
                    {session ? (
                      enrollmentStatus[course.id] ? (
                        <div className="flex gap-2">
                          <Link 
                            href={`/courses/${course.id}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex-1 text-center"
                          >
                            Перейти до курсу
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingCourse === course.id}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                        >
                          {enrollingCourse === course.id ? 'Записуємо...' : 'Записатись на курс'}
                        </button>
                      )
                    ) : (
                      <Link 
                        href="/auth/signin" 
                        className="block w-full text-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                      >
                        Увійдіть, щоб записатись
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}