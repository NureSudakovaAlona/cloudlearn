'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession } from "next-auth/react"

interface MaterialUploadFormProps {
  courseId: string;
}

export default function MaterialUploadForm({ courseId }: MaterialUploadFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [resourceType, setResourceType] = useState(''); // Додано стан для resourceType
  const [resourceTitle, setResourceTitle] = useState(''); // Додано стан для resourceTitle
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

    if (!resourceType.trim()) {
      setError('Будь ласка, вкажіть тип ресурсу');
      return;
    }

    if (!resourceTitle.trim()) {
      setError('Будь ласка, вкажіть заголовок ресурсу');
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess(false);

      const session = await getSession();
      const token = session?.accessToken;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      formData.append("resourceTitle", resourceTitle); // Використовуємо значення зі стану
      formData.append("resourceType", resourceType); // Використовуємо значення зі стану

      const response = await fetch("/api/course-materials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Сталася помилка при завантаженні");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/courses/${courseId}`);
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Помилка при додаванні матеріалу:", err);
      setError(`Не вдалося завантажити матеріал: ${err instanceof Error ? err.message : "Невідома помилка"}`);
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
          <label htmlFor="resource-type" className="block text-gray-700 mb-2">
            Тип ресурсу
          </label>
          <select
            id="resource-type"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="w-full border rounded-md p-2"
            required
            disabled={uploading}
          >
            <option value="pdf">PDF документ</option>
            <option value="video">Відео</option>
            <option value="code">Код</option>
            <option value="other">Інше</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="resource-title" className="block text-gray-700 mb-2">
            Заголовок ресурсу
          </label>
          <input
            id="resource-title"
            type="text"
            value={resourceTitle}
            onChange={(e) => setResourceTitle(e.target.value)}
            className="w-full border rounded-md p-2"
            required
            disabled={uploading}
          />
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
            required
            disabled={uploading}
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !title.trim() || !resourceType.trim() || !resourceTitle.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
        >
          {uploading ? 'Завантаження...' : 'Додати матеріал'}
        </button>
      </form>
    </div>
  );
}

