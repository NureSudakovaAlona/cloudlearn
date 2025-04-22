import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { getSession } from 'next-auth/react';

async function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL або KEY не задані у змінних середовища');
  }

  const session = await getSession();
  const supabaseToken = session?.accessToken;

  console.log('Supabase токен з сесії:', supabaseToken ? 'отримано' : 'відсутній');

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: supabaseToken 
        ? { Authorization: `Bearer ${supabaseToken}` }
        : undefined
    }
  });
}

export async function uploadLabSubmission(
  file: File,
  studentId: string,
  labId: string
): Promise<{ filePath: string; error: Error | null }> {
  try {
    const supabase = await getSupabaseClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${studentId}/${labId}/${fileName}`;

    console.log('Генерується шлях до файлу:', filePath);

    const fileArrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(fileArrayBuffer);

    const { data, error } = await supabase.storage
      .from('lab-submissions')
      .upload(filePath, fileData, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Помилка при завантаженні до bucket "lab-submissions":', error.message);
      throw error;
    }

    console.log('Файл успішно завантажено:', data);
    return { filePath, error: null };
  } catch (error) {
    console.error('Помилка завантаження файлу:', error);
    return {
      filePath: '',
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

export async function uploadCourseMaterial(
  file: File,
  courseId: string,
  type: string
): Promise<{ filePath: string; error: Error | null }> {
  try {
    const supabase = await getSupabaseClient();

    const fileExt = file.name.split('.').pop();
    const fileNameBase = file.name.replace(`.${fileExt}`, '');
    const fileName = `${fileNameBase}_${uuidv4().slice(0, 8)}.${fileExt}`;
    const filePath = `${courseId}/${type}/${fileName}`;

    console.log('Шлях до навчального матеріалу:', filePath);

    const fileArrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(fileArrayBuffer);

    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, fileData, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Помилка при завантаженні до bucket "course-materials":', error.message);
      throw error;
    }

    console.log('Навчальний матеріал успішно завантажено:', data);
    return { filePath, error: null };
  } catch (error) {
    console.error('Помилка завантаження навчального матеріалу:', error);
    return { 
      filePath: '', 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

export async function getFileUrl(
  bucket: 'lab-submissions' | 'course-materials',
  filePath: string
): Promise<string> {
  const supabase = await getSupabaseClient();

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  console.log('URL для публічного файлу:', data?.publicUrl);
  return data.publicUrl;
}

export async function deleteFile(
  bucket: 'lab-submissions' | 'course-materials',
  filePath: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Помилка видалення файлу:', error.message);
      throw error;
    }

    console.log('Файл успішно видалено:', filePath);
    return { error: null };
  } catch (error) {
    console.error('Помилка видалення файлу:', error);
    return { 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
