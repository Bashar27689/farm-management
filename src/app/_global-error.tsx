// app/_global-error.tsx
'use client'; // لازم تكون Client Component

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>حدث خطأ غير متوقع</h1>
          <p>{error.message || 'يرجى المحاولة مرة أخرى'}</p>
          <button
            onClick={() => reset()} // reset هي دالة مقدمة من Next.js، وهي ليست Hook
            style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}
          >
            أعد المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}