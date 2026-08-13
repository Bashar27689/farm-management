// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import farmLogo from '../../public/assets/farm-Logo.png';
import { Button } from '../../@/components/ui/button';
import Input from '../components/ui/Input';

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

  // SVG Icons
  const UserIcon = () => (
    <svg className="w-5 h-5" style={{ color: '#2E7D32' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-5 h-5" style={{ color: '#2E7D32' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#FDFBF7' }}
      dir="rtl"
    >

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white">
        {/* Top Accent Bar */}
        <div 
          className="h-1.5 w-full"
        
        />

        <div className="p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div 
                className="absolute inset-0 blur-2xl opacity-20 rounded-full"
                style={{ backgroundColor: '#EF6C00' }}
              />
              <Image 
                src={farmLogo} 
                alt="Logo" 
                
                width={120} 
                height={120} 
                className="relative mx-auto w-28 h-28 object-contain"
                loading="eager"
              />
            </div>
            <h1 
              className="text-3xl font-bold mt-4"
              style={{ color: '#2E7D32' }}
            >
بيض المراعي
            </h1>
            <p 
              className="text-sm mt-1"
              style={{ color: '#374151' }}
            >
              نظام الإدارة المتكامل
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <Input
              label="اسم المستخدم"
              type="text"
              placeholder="أدخل اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              //icon={<UserIcon />}
            />

            {/* Password Field */}
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
             // icon={<LockIcon />}
            />

            {/* Error Message */}
            {error && (
              <div 
                className="p-3 rounded-xl text-sm flex items-center gap-2"
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5'
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              تسجيل الدخول
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center text-xs" style={{ borderColor: '#E5E7EB' }}>
            <span style={{ color: '#374151' }}>
              © {new Date().getFullYear()}
جميع الحقوق محفوظة - بيض المراعي
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}