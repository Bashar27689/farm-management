// app/not-found.tsx
import Link from 'next/link';

// لا حاجة لـ 'use client' هنا إلا إذا أردت استخدام أزرار تفاعلية بسيطة.
// ولكن الأفضل تجنب الـ Hooks تماماً.
export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '4rem' }}>404</h1>
      <h2>عذراً! الصفحة غير موجودة</h2>
      <p>قد يكون الرابط الذي حاولت الوصول إليه محذوفاً أو غير صحيح.</p>
      <Link 
        href="/" 
        style={{ 
          display: 'inline-block', 
          marginTop: '1.5rem', 
          padding: '0.75rem 2rem', 
          background: '#0070f3', 
          color: '#fff', 
          borderRadius: '8px' 
        }}
      >
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}