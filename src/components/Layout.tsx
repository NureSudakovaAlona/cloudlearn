import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">CloudLearn</Link>
          <nav className="space-x-4">
          <Link href="/photos" className="hover:underline">Upload Photos</Link>
            <Link href="/courses" className="hover:underline">Курси</Link>
            {session?.user?.role === 'teacher' && (
              <Link href="/dashboard/teacher" className="hover:underline">Панель викладача</Link>
            )}
            {session ? (
              <>
                <Link href="/dashboard" className="hover:underline">Панель студента</Link>
                <button 
                  onClick={() => signOut()} 
                  className="hover:underline"
                >
                  Вийти
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="hover:underline">Увійти</Link>
                <Link href="/auth/signup" className="hover:underline">Зареєструватися</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-100 p-4">
        <div className="container mx-auto text-center text-gray-600">
          &copy; 2025 CloudLearn. Усі права захищені.
        </div>
      </footer>
    </div>
  );
}