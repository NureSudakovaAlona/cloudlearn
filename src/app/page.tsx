'use client';

import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <div className="text-center py-10">
        <h1 className="text-4xl font-bold mb-4">Ласкаво просимо до CloudLearn</h1>
        <p className="text-xl mb-8">
          Платформа для дистанційного навчання студентів технічних спеціальностей
        </p>
        <div className="max-w-3xl mx-auto">
          <p className="mb-8">
            CloudLearn дозволяє проводити практичні лабораторні роботи у віртуальному середовищі 
            без встановлення спеціалізованого програмного забезпечення на комп'ютери студентів.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Віртуальні лабораторії</h2>
              <p>Доступ до спеціалізованого ПЗ через браузер з будь-якого пристрою</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Навчальні матеріали</h2>
              <p>Зручний доступ до лекцій, документації та додаткових матеріалів</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Відстеження прогресу</h2>
              <p>Система оцінювання та зворотнього зв'язку від викладачів</p>
            </div>
          </div>
          <div className="mt-8">
            <Link 
              href="/courses" 
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 mr-4"
            >
              Переглянути курси
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300"
            >
              Зареєструватися
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}