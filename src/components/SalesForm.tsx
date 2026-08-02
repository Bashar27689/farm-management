// src/components/SalesForm.tsx
'use client';

import { useState, useEffect } from 'react';

export default function SalesForm() {
  const [formData, setFormData] = useState({
    shopName: '',
    trayCount: '',
    pricePerTray: '',
    customerName: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...formData,
        trayCount: parseInt(formData.trayCount),
        pricePerTray: parseInt(formData.pricePerTray),
        customerName: selectedCustomer ? undefined : formData.customerName,
        customerPhone: selectedCustomer ? undefined : formData.customerPhone,
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ تم إدخال المبيعات بنجاح');
        setLastInvoice(data.invoice); // حفظ بيانات الفاتورة
        setFormData({
          shopName: '',
          trayCount: '',
          pricePerTray: '',
          customerName: '',
          customerPhone: '',
          date: new Date().toISOString().split('T')[0]
        });
        setSelectedCustomer('');
        fetchCustomers();
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (err) {
      setMessage('❌ حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // دالة تنزيل PDF
  const downloadPDF = async () => {
    if (!lastInvoice) {
      alert('لا توجد فاتورة للتنزيل');
      return;
    }

    try {
      const res = await fetch('/api/invoice-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: lastInvoice.id }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

      // تحميل الملف
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${lastInvoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('حدث خطأ في تحميل الفاتورة');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4">💰 إدخال المبيعات</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">اسم الدكان</label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">عدد الأطباق</label>
            <input
              type="number"
              value={formData.trayCount}
              onChange={(e) => setFormData({ ...formData, trayCount: e.target.value })}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">سعر الطبق (ل.س)</label>
            <input
              type="number"
              value={formData.pricePerTray}
              onChange={(e) => setFormData({ ...formData, pricePerTray: e.target.value })}
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
        </div>

        <div className="mt-4">
          <label className="block text-gray-700 mb-2">اختر عميل موجود</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
              className="input"
            disabled={loading}
          >
            <option value="">-- عميل جديد --</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.phone}
              </option>
            ))}
          </select>
        </div>

        {!selectedCustomer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-gray-700 mb-2">اسم العميل</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="input"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="input"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${
            message.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'جاري الحفظ...' : 'حفظ المبيعات'}
        </button>
      </form>

      {/* زر تنزيل PDF */}
      {lastInvoice && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 font-medium">
                ✅ تم إنشاء الفاتورة رقم: {lastInvoice.number}
              </p>
              <p className="text-sm text-gray-600">
                المجموع: {lastInvoice.total} ل.س
              </p>
            </div>
            <button
              onClick={downloadPDF}
              className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition flex items-center gap-2"
            >
              <span>📄</span>
              تنزيل PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}