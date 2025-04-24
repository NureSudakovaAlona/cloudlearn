'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import LabSubmissionForm from '@/components/LabSubmissionForm';
import { supabase } from '@/lib/supabase';
import { getFileUrl } from '@/lib/storageUtils';
import Link from 'next/link';

interface LabDetails {
  id: string;
  title: string;
  description: string;
  course_id: string;
  template_id: string;
}

interface Submission {
  id: string;
  file_path: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  file_url?: string;
}

export default function LabPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [lab, setLab] = useState<LabDetails | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const courseId = typeof params.id === 'string' ? params.id : '';
  const labId = typeof params.labId === 'string' ? params.labId : '';

  useEffect(() => {
    async function fetchLabData() {
      if (!courseId || !labId || !session?.user?.id) return;

      try {
        setLoading(true);
        
        // Отримуємо дані лабораторної роботи
        const { data: labData, error: labError } = await supabase
          .from('lab_works')
          .select('*')
          .eq('id', labId)
          .single();

        if (labError) throw labError;
        setLab(labData);

        // Отримуємо назву курсу
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('title')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourseName(courseData.title);


      // Тепер виконайте запит і виведіть SQL-помилку, якщо вона є
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', session.user.id)
        .eq('lab_id', labId)
        .maybeSingle();

      console.log("Помилка запиту:", submissionError);
      console.log("NextAuth user ID:", session.user.id);
      console.log("ID в таблиці submissions:", 'b3684ebb-0eb3-42a4-817f-27bebf830cd5');
      console.log("IDs співпадають:", session.user.id === 'b3684ebb-0eb3-42a4-817f-27bebf830cd5');

      // Перевірте запит без фільтрації, якщо маєте права адміністратора
      const { data: allRecords, error: allError } = await supabase
      .from('submissions')
      .select('*')
      .limit(10);

      console.log("Перші 10 записів:", allRecords);
            // Перевірте поточного користувача Supabase
            const { data: { session: supabaseSession } } = await supabase.auth.getSession();
            console.log("Supabase user:", supabaseSession?.user?.id);
            console.log("NextAuth session:", session);
            
        if (!submissionError && submissionData) {
          // Отримуємо URL файлу
          const fileUrl = await getFileUrl('lab-submissions', submissionData.file_path);
          setSubmission({
            ...submissionData,
            file_url: fileUrl
          });
        }
      } catch (error) {
        console.error('Помилка при завантаженні даних лабораторної роботи:', error);
        if ((error as any).code !== 'PGRST116') { // Ігноруємо помилку "не знайдено" для submissions
          setError('Не вдалося завантажити дані лабораторної роботи');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchLabData();
  }, [courseId, labId, session]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <p className="text-center py-10">Завантаження даних лабораторної роботи...</p>
        </div>
      </Layout>
    );
  }

  if (error || !lab) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="bg-red-100 p-4 rounded-md mb-6">
            <p className="text-red-700">{error || 'Лабораторну роботу не знайдено'}</p>
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
        <div className="mb-6">
          <Link href={`/courses/${courseId}`} className="text-blue-600 hover:underline">
            ← Повернутися до курсу "{courseName}"
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-4">{lab.title}</h1>
        
        <div className="bg-gray-100 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Опис та завдання</h2>
          <div className="whitespace-pre-line">{lab.description}</div>
        </div>
        
        {session?.user?.role === 'student' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Ваша робота</h2>
            
            {submission ? (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="mb-2">
                  <span className="font-semibold">Дата відправлення:</span> {new Date(submission.submitted_at).toLocaleString('uk-UA')}
                </p>
                
                {submission.file_url && (
                  <a 
                    href={submission.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block mb-4 text-blue-600 hover:underline"
                  >
                    Переглянути відправлений файл
                  </a>
                )}
                
                {submission.grade !== null && submission.grade !== undefined ? (
                  <div className="mb-4">
                    <p className="font-semibold">Оцінка: {submission.grade}</p>
                    {submission.feedback && (
                      <div>
                        <p className="font-semibold">Відгук викладача:</p>
                        <p className="p-3 bg-gray-50 rounded">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-yellow-600">Ваша робота очікує на перевірку викладачем.</p>
                )}
                
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Відправити нову версію:</h3>
                  <LabSubmissionForm 
                    labId={labId} 
                    studentId={session.user.id} 
                    courseId={courseId} 
                  />
                </div>
              </div>
            ) : (
              <LabSubmissionForm 
                labId={labId} 
                studentId={session.user.id} 
                courseId={courseId} 
              />
            )}
          </div>
        )}
        
        {session?.user?.role === 'teacher' && (
          <div className="bg-yellow-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Панель викладача</h2>
            <p>
              Тут буде інтерфейс для перегляду та оцінювання робіт студентів.
            </p>
            <Link 
              href={`/courses/${courseId}/lab/${labId}/submissions`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block mt-4"
            >
              Переглянути роботи студентів
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}