// src/components/ProductionForm.tsx
'use client';

import { useState } from 'react';

export default function ProductionForm() {
  const [eggCount, setEggCount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eggCount: parseInt(eggCount), date }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ تم إدخال الإنتاج بنجاح');
        setEggCount('');
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (err) {
      setMessage('❌ حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-amber-700">🥚 إدخال الإنتاج اليومي</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 ">عدد البيض المنتج</label>
          <input
            type="number"
            value={eggCount}
            onChange={(e) => setEggCount(e.target.value)}
              className="input"
            required
            disabled={loading}
            placeholder="مثال: 300"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">التاريخ</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
              className="input"
            required
            disabled={loading}
          />
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${
            message.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'جاري الحفظ...' : 'حفظ الإنتاج'}
        </button>
      </form>
    </div>
  );
}