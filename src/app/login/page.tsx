// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import farmLogo from '../../../public/assets/farm Logo.png';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'خطأ في تسجيل الدخول');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 rtl" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">
            <Image src={farmLogo} alt="Logo" width={150} 
  height={150}  className="mx-auto w-30 h-30" />
          </div>
          <h1 className="text-3xl font-bold text-green-700">بيض الريف </h1>
          <p className="text-gray-600">نظام الإدارة</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-amber-900"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-amber-900"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}