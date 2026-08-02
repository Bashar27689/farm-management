// src/components/InvoiceList.tsx
'use client';

import { useState, useEffect } from 'react';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (invoiceId: string, number: string) => {
    try {
      const res = await fetch('/api/invoice-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });

      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('حدث خطأ في تحميل الفاتورة');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4">📄 قائمة الفواتير</h2>
      <div className="space-y-2">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">رقم: {invoice.number}</p>
              <p className="text-sm text-gray-600">
                العميل: {invoice.customer?.name}
              </p>
              <p className="text-sm text-gray-600">
                المجموع: {invoice.total} ل.س
              </p>
            </div>
            <button
              onClick={() => downloadPDF(invoice.id, invoice.number)}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition text-sm flex items-center gap-2"
            >
              <span>📄</span>
              تنزيل PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}