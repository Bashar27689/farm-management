
'use client';

import { useEffect, useState } from 'react';

type Customer = {
  id: string;
  name: string;
  phone: string;
};

type Invoice = {
  id: string;
  number: string;
  total: number;
};

export default function SalesForm() {
  const [formData, setFormData] = useState({
    shopName: '',
    trayCount: '',
    pricePerTray: '',
    customerName: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

 

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);

      const res = await fetch('/api/customers', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setMessage('❌ تعذر تحميل قائمة العملاء');
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    const loadCustomers = async () => {
      await fetchCustomers();
    };

    void loadCustomers();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const trayCount = Number(formData.trayCount);
      const pricePerTray = Number(formData.pricePerTray);

      if (!formData.shopName.trim()) {
        setMessage('❌ يرجى إدخال اسم الدكان');
        return;
      }

      if (!Number.isInteger(trayCount) || trayCount <= 0) {
        setMessage('❌ عدد الأطباق غير صحيح');
        return;
      }

      if (
        !Number.isInteger(pricePerTray) ||
        pricePerTray <= 0
      ) {
        setMessage('❌ سعر الطبق غير صحيح');
        return;
      }

      const payload = {
        shopName: formData.shopName.trim(),
        trayCount,
        pricePerTray,
        date: formData.date,

        // إذا اختار المستخدم عميلاً موجوداً
        customerId: selectedCustomer || null,

        // إذا كان عميلاً جديداً
        customerName: selectedCustomer
          ? null
          : formData.customerName.trim() || null,

        customerPhone: selectedCustomer
          ? null
          : formData.customerPhone.trim() || null,
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          '❌ ' +
            (data.message || 'حدث خطأ أثناء حفظ المبيعات')
        );
        return;
      }

      setMessage('✅ تم إدخال المبيعات بنجاح');

      setLastInvoice(data.invoice);

      setFormData({
        shopName: '',
        trayCount: '',
        pricePerTray: '',
        customerName: '',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
      });

      setSelectedCustomer('');

      /*
       * لا نحتاج إلى إعادة تحميل العملاء إذا كان المستخدم
       * قد اختار عميلاً موجوداً.
       *
       * نحتاجها فقط إذا تم إنشاء عميل جديد.
       */
      if (!payload.customerId) {
        await fetchCustomers();
      }
    } catch (error) {
      console.error('Error submitting sales:', error);
      setMessage('❌ حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!lastInvoice) {
      alert('لا توجد فاتورة للتنزيل');
      return;
    }

    try {
      const res = await fetch('/api/invoice-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: lastInvoice.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

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
      <h2 className="text-xl font-bold mb-4">
        💰 إدخال المبيعات
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">
              اسم الدكان
            </label>

            <input
              type="text"
              value={formData.shopName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shopName: e.target.value,
                })
              }
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              عدد الأطباق
            </label>

            <input
              type="number"
              min="1"
              value={formData.trayCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  trayCount: e.target.value,
                })
              }
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              سعر الطبق (ل.س)
            </label>

            <input
              type="number"
              min="1"
              value={formData.pricePerTray}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricePerTray: e.target.value,
                })
              }
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              التاريخ
            </label>

            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: e.target.value,
                })
              }
              className="input"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-gray-700 mb-2">
            اختر عميل موجود
          </label>

          <select
            value={selectedCustomer}
            onChange={(e) =>
              setSelectedCustomer(e.target.value)
            }
            className="input"
            disabled={loading || customersLoading}
          >
            <option value="">
              {customersLoading
                ? 'جاري تحميل العملاء...'
                : '-- عميل جديد --'}
            </option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        {!selectedCustomer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-gray-700 mb-2">
                اسم العميل
              </label>

              <input
                type="text"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerName: e.target.value,
                  })
                }
                className="input"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                رقم الهاتف
              </label>

              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerPhone: e.target.value,
                  })
                }
                className="input"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm ${
              message.startsWith('✅')
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
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

      {lastInvoice && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 font-medium">
                ✅ تم إنشاء الفاتورة رقم:{' '}
                {lastInvoice.number}
              </p>

              <p className="text-sm text-gray-600">
                المجموع: {lastInvoice.total} ل.س
              </p>
            </div>

            <button
              type="button"
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
