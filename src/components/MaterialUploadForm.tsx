'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadCourseMaterial } from '@/lib/storageUtils'; // Змінено імпорт
import { supabase } from '@/lib/supabase';

interface MaterialUploadFormProps {
  courseId: string;
}

export default function MaterialUploadForm({ courseId }: MaterialUploadFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('pdf');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Будь ласка, виберіть файл для завантаження');
      return;
    }

    if (!title.trim()) {
      setError('Будь ласка, вкажіть назву матеріалу');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      // Завантажуємо файл
      const { filePath, error: uploadError } = await uploadCourseMaterial(file, courseId, type);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Зберігаємо запис про матеріал у базі даних
      const { error: dbError } = await supabase.from('resources').insert({
        course_id: courseId,
        title: title,
        type: type,
        file_path: filePath,
        created_at: new Date().toISOString()
      });
      
      if (dbError) {
        throw dbError;
      }
      
      setSuccess(true);
      
      // Очищаємо форму після успішного завантаження
      setTitle('');
      setFile(null);
      
      // Оновлюємо сторінку для відображення нових матеріалів
      setTimeout(() => {
        router.refresh();
      }, 1000);
      
    } catch (err) {
      console.error('Помилка при завантаженні матеріалу:', err);
      setError('Не вдалося завантажити матеріал. Спробуйте ще раз пізніше.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold mb-4">Додати навчальний матеріал</h3>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
          Матеріал успішно завантажено!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="material-title" className="block text-gray-700 mb-2">
            Назва матеріалу
          </label>
          <input
            id="material-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md p-2"
            required
            disabled={uploading}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="material-type" className="block text-gray-700 mb-2">
            Тип матеріалу
          </label>
          <select
            id="material-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded-md p-2"
            disabled={uploading}
          >
            <option value="pdf">PDF документ</option>
            <option value="video">Відео</option>
            <option value="code">Код</option>
            <option value="other">Інше</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="material-file" className="block text-gray-700 mb-2">
            Файл
          </label>
          <input
            id="material-file"
            type="file"
            onChange={handleFileChange}
            className="w-full border rounded-md p-2"
            disabled={uploading}
          />
        </div>
        
        <button
          type="submit"
          disabled={uploading || !file || !title.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
        >
          {uploading ? 'Завантаження...' : 'Додати матеріал'}
        </button>
      </form>
    </div>
  );
}