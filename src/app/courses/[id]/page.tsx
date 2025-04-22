'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import MaterialUploadForm from '@/components/MaterialUploadForm';
import { getFileUrl } from '@/lib/storageUtils'; // Змінено імпорт

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  teacher_name: string;
}

interface LabWork {
  id: string;
  title: string;
  description: string;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  file_path: string;
  created_at: string;
  file_url?: string;
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [labWorks, setLabWorks] = useState<LabWork[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);

  const courseId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    async function fetchCourseData() {
      if (!courseId) return;

      try {
        setLoading(true);
        
        // Отримуємо дані курсу
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        // Отримуємо дані про викладача
        const { data: teacherData, error: teacherError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', courseData.teacher_id)
          .single();

        if (teacherError) throw teacherError;

        setCourse({
          ...courseData,
          teacher_name: teacherData.full_name
        });

        // Отримуємо лабораторні роботи
        const { data: labsData, error: labsError } = await supabase
          .from('lab_works')
          .select('id, title, description')
          .eq('course_id', courseId);

        if (labsError) throw labsError;
        setLabWorks(labsData || []);

        // Перевіряємо, чи студент записаний на курс
        if (session?.user?.id && session.user.role === 'student') {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('student_id', session.user.id)
            .eq('course_id', courseId)
            .single();

          if (!enrollmentError) {
            setIsEnrolled(true);
          }
        }

        // Якщо користувач - викладач курсу, він має доступ
        if (session?.user?.id === courseData.teacher_id) {
          setIsEnrolled(true);
        }
        
        // Отримуємо навчальні матеріали - переміщено сюди з основного тіла компоненту
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });

        if (!resourcesError && resourcesData) {
          // Отримуємо URL для файлів
          const resourcesWithUrls = await Promise.all(
            resourcesData.map(async (resource) => {
              const fileUrl = await getFileUrl('course-materials', resource.file_path);
              return {
                ...resource,
                file_url: fileUrl
              };
            })
          );
          setResources(resourcesWithUrls);
        }
      } catch (error) {
        console.error('Помилка при завантаженні даних курсу:', error);
        setError('Не вдалося завантажити дані курсу');
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId, session]);

  const handleAddLabWork = () => {
    router.push(`/courses/${courseId}/lab/create`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <p className="text-center py-10">Завантаження даних курсу...</p>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="bg-red-100 p-4 rounded-md mb-6">
            <p className="text-red-700">{error || 'Курс не знайдено'}</p>
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

  if (!isEnrolled && session?.user?.role === 'student') {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          <div className="bg-yellow-100 p-4 rounded-md mb-6">
            <p className="text-yellow-800">Ви не записані на цей курс. Будь ласка, запишіться на курс, щоб отримати доступ до матеріалів.</p>
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

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-600 mb-6">Викладач: {course.teacher_name}</p>
        
        <div className="bg-gray-100 p-4 rounded-md mb-8">
          <h2 className="text-xl font-semibold mb-2">Опис курсу</h2>
          <p>{course.description}</p>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Лабораторні роботи</h2>
            {session?.user?.id === course.teacher_id && (
              <button 
                onClick={handleAddLabWork}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Додати лабораторну роботу
              </button>
            )}
          </div>
          
          {labWorks.length === 0 ? (
            <p className="text-gray-600 py-4">Для цього курсу ще не додано лабораторні роботи.</p>
          ) : (
            <div className="grid gap-4">
              {labWorks.map(lab => (
                <div key={lab.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-2">{lab.title}</h3>
                  <p className="text-gray-600 mb-4">{lab.description}</p>
                  <button 
                    onClick={() => router.push(`/courses/${courseId}/lab/${lab.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    Перейти до роботи
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Навчальні матеріали</h2>
          
          {session?.user?.id === course.teacher_id && (
            <MaterialUploadForm courseId={courseId} />
          )}
          
          {resources.length === 0 ? (
            <p className="text-gray-600 py-4">Для цього курсу ще не додано навчальних матеріалів.</p>
          ) : (
            <div className="grid gap-4">
              {resources.map(resource => (
                <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{resource.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs uppercase ${
                      resource.type === 'pdf' ? 'bg-red-100 text-red-800' :
                      resource.type === 'video' ? 'bg-blue-100 text-blue-800' :
                      resource.type === 'code' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {resource.type}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    Додано: {new Date(resource.created_at).toLocaleDateString('uk-UA')}
                  </p>
                  <div className="mt-2">
                    <a 
                      href={resource.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Переглянути матеріал
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => router.push('/courses')}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Повернутися до списку курсів
        </button>
      </div>
    </Layout>
  );
}