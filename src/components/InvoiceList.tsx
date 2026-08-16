// src/components/InvoiceList.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Search,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../@/components/ui/card';

import { Button } from '../../@/components/ui/button';
import { Badge } from '../../@/components/ui/badge';
import { Input } from '../../@/components/ui/input';
import { Label } from '../../@/components/ui/label';

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
};

type Invoice = {
  id: number;
  number: string;
  total: number;
  customer?: Customer | null;
};

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // البحث عن العميل
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');

      if (!res.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid invoices response');
      }

      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (
    invoiceId: number,
    number: string
  ) => {
    try {
      const res = await fetch('/api/invoice-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

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

  /**
   * تصفية الفواتير حسب اسم العميل
   */
  const filteredInvoices = invoices.filter((invoice) => {
    const customerName =
      invoice.customer?.name || '';

    return customerName
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
  });

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <Card className="border-gray-100 bg-white shadow-sm">

        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <FileText className="h-5 w-5 text-[#EF6C00]" />
            </div>

            <div>
              <CardTitle className="text-xl font-bold text-[#EF6C00]">
                قائمة الفواتير
              </CardTitle>

              <CardDescription className="mt-1 text-[#374151]/60">
                عرض الفواتير والبحث عنها وتنزيلها بصيغة PDF
              </CardDescription>
            </div>

          </div>
        </CardHeader>

        <CardContent>

          {/* مربع البحث */}
          <div className="mb-6 rounded-2xl border border-gray-100 bg-[#FDFBF7] p-4">

            <div className="mb-2 flex items-center gap-2">

              <Search className="h-5 w-5 text-[#2E7D32]" />

              <Label
                htmlFor="invoiceSearch"
                className="font-semibold text-[#374151]"
              >
                البحث عن عميل
              </Label>

            </div>

            <div className="relative">

              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <Input
                id="invoiceSearch"
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="اكتب اسم العميل للبحث..."
                className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
              />

            </div>

            {/* عدد النتائج */}
            <p className="mt-2 text-xs text-gray-500">
              {searchTerm.trim()
                ? `تم العثور على ${filteredInvoices.length} فاتورة`
                : `إجمالي الفواتير: ${invoices.length}`}
            </p>

          </div>

          {/* لا توجد فواتير */}
          {invoices.length === 0 ? (

            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-[#FDFBF7] py-10 text-center">

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>

              <p className="font-medium text-[#374151]">
                لا توجد فواتير
              </p>

              <p className="mt-1 text-sm text-gray-500">
                ستظهر الفواتير هنا بعد تسجيل المبيعات.
              </p>

            </div>

          ) : filteredInvoices.length === 0 ? (

            /* لا توجد نتائج بحث */
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-[#FDFBF7] py-10 text-center">

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                <Search className="h-6 w-6 text-gray-400" />
              </div>

              <p className="font-medium text-[#374151]">
                لا توجد نتائج
              </p>

              <p className="mt-1 text-sm text-gray-500">
                لم يتم العثور على فواتير للعميل:
              </p>

              <p className="mt-1 font-semibold text-[#2E7D32]">
                {searchTerm}
              </p>

            </div>

          ) : (

            /* قائمة الفواتير */
            <div className="space-y-3">

              {filteredInvoices.map((invoice) => (

                <Card
                  key={invoice.id}
                  className="border-gray-100 bg-[#FDFBF7] shadow-none transition-all duration-200 hover:border-[#2E7D32]/20 hover:shadow-sm"
                >

                  <CardContent className="p-4">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      {/* معلومات الفاتورة */}
                      <div className="flex items-start gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                          <FileText className="h-5 w-5 text-[#2E7D32]" />
                        </div>

                        <div className="space-y-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="font-semibold text-[#374151]">
                              فاتورة رقم {invoice.number}
                            </p>

                            <Badge
                              variant="outline"
                              className="border-[#2E7D32]/20 bg-[#E8F5E9] text-[#2E7D32]"
                            >
                              مكتملة
                            </Badge>

                          </div>

                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">

                            <span>
                              العميل:{' '}

                              <span className="font-medium text-[#374151]">
                                {invoice.customer?.name ||
                                  'عميل نقدي'}
                              </span>
                            </span>

                            <span>
                              المجموع:{' '}

                              <span className="font-bold text-[#2E7D32]">
                                {invoice.total?.toLocaleString()} ل.س
                              </span>
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* زر التنزيل */}
                      <Button
                        type="button"
                        onClick={() =>
                          downloadPDF(
                            invoice.id,
                            invoice.number
                          )
                        }
                        className="h-11 w-full rounded-xl bg-[#2E7D32] px-5 text-white shadow-sm transition-all hover:bg-[#2E7D32]/90 hover:shadow-md sm:w-auto"
                      >

                        <Download className="h-4 w-4" />

                        تنزيل PDF

                      </Button>

                    </div>

                  </CardContent>

                </Card>

              ))}

            </div>

          )}

        </CardContent>

      </Card>
    </div>
  );
}