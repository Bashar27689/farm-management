// src/components/SupplyForm.tsx
'use client';

import { useState } from 'react';

export default function SupplyForm() {
  const [formData, setFormData] = useState({
    type: 'FEED',
    name: '',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/supplies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          price: parseInt(formData.price),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ تم إدخال المستلزمات بنجاح');
        setFormData({
          type: 'FEED',
          name: '',
          quantity: '',
          price: '',
          date: new Date().toISOString().split('T')[0],
          expiryDate: ''
        });
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
      <h2 className="text-xl font-bold mb-4">📦 إدخال المستلزمات</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">النوع</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
              required
              disabled={loading}
            >
              <option value="FEED">علف</option>
              <option value="VACCINE">لقاح</option>
              <option value="OTHER">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">الاسم</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">الكمية</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">السعر (ل.س)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">التاريخ</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">تاريخ الانتهاء (اختياري)</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="input"
              disabled={loading}
            />
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${
            message.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="mt-4 w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'جاري الحفظ...' : 'حفظ المستلزمات'}
        </button>
      </form>
    </div>
  );
}