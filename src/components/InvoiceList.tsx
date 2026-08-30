'use client';

import { useMemo, useState } from 'react';

import {
  Download,
  FileText,
  Loader2,
  Search,
  Send,
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

import type {
  Invoice,
  PaymentStatus,
} from './InvoiceManagement';


// =====================================================
// Props
// =====================================================

type InvoiceListProps = {
  invoices: Invoice[];
  onRefresh: () => Promise<void>;
};


// =====================================================
// Component
// =====================================================

export default function InvoiceList({
  invoices,
  onRefresh,
}: InvoiceListProps) {

  const [searchTerm, setSearchTerm] =
    useState('');

  const [
    sendingInvoiceId,
    setSendingInvoiceId,
  ] = useState<string | null>(null);

  const [
    downloadingInvoiceId,
    setDownloadingInvoiceId,
  ] = useState<string | null>(null);


  // ===================================================
  // Payment status
  // ===================================================

  const getPaymentStatus = (
    status: PaymentStatus
  ) => {

    switch (status) {

      case 'PAID':
        return {
          text: 'مدفوعة بالكامل',
          className:
            'border-[#2E7D32]/20 bg-[#E8F5E9] text-[#2E7D32]',
        };

      case 'PARTIAL':
        return {
          text: 'مدفوعة جزئياً',
          className:
            'border-[#EF6C00]/20 bg-[#FFF3E0] text-[#EF6C00]',
        };

      case 'UNPAID':
      default:
        return {
          text: 'غير مدفوعة',
          className:
            'border-[#C62828]/20 bg-[#FFEBEE] text-[#C62828]',
        };
    }
  };


  // ===================================================
  // Filter
  // ===================================================

  const filteredInvoices =
    useMemo(() => {

      const value =
        searchTerm
          .trim()
          .toLowerCase();

      if (!value) {
        return invoices;
      }

      return invoices.filter(
        (invoice) => {

          const customerName =
            invoice.customer?.name || '';

          const phone =
            invoice.customer?.phone || '';

          return (
            invoice.number
              .toLowerCase()
              .includes(value) ||

            customerName
              .toLowerCase()
              .includes(value) ||

            phone
              .toLowerCase()
              .includes(value)
          );
        }
      );

    }, [
      invoices,
      searchTerm,
    ]);


  // ===================================================
  // Download PDF
  // ===================================================

  const downloadPDF = async (
    invoice: Invoice
  ) => {

    try {

      setDownloadingInvoiceId(
        invoice.id
      );

      const response =
        await fetch(
          '/api/invoice-pdf',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              invoiceId:
                invoice.id,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          'Failed to generate PDF'
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        `invoice-${invoice.number}.pdf`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      window.URL.revokeObjectURL(
        url
      );

    } catch (error) {

      console.error(
        'Error downloading PDF:',
        error
      );

      alert(
        'حدث خطأ في تحميل الفاتورة'
      );

    } finally {

      setDownloadingInvoiceId(
        null
      );
    }
  };


  // ===================================================
  // Send WhatsApp
  // ===================================================

  const sendInvoiceWhatsApp =
    async (
      invoice: Invoice
    ) => {

      if (
        !invoice.customer?.phone
      ) {

        alert(
          'لا يوجد رقم هاتف لهذا العميل'
        );

        return;
      }

      if (sendingInvoiceId) {
        return;
      }

      try {

        setSendingInvoiceId(
          invoice.id
        );

        const response =
          await fetch(
            '/api/whatsapp/send-invoice',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                invoiceId:
                  invoice.id,
              }),
            }
          );

        const responseText =
          await response.text();

        console.log(
          'WhatsApp HTTP status:',
          response.status
        );

        console.log(
          'WhatsApp response:',
          responseText
        );

        let data: any;

        try {

          data =
            JSON.parse(
              responseText
            );

        } catch {

          throw new Error(
            `السيرفر أعاد استجابة غير صالحة JSON. HTTP ${response.status}\n\n${responseText.substring(0, 500)}`
          );
        }

        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data?.message ||
            data?.error ||
            'فشل إرسال الفاتورة'
          );
        }

        alert(
          `تم إرسال الفاتورة رقم ${invoice.number} عبر WhatsApp بنجاح`
        );

      } catch (error) {

        console.error(
          'Error sending invoice via WhatsApp:',
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : 'حدث خطأ أثناء إرسال الفاتورة عبر WhatsApp'
        );

      } finally {

        setSendingInvoiceId(
          null
        );
      }
    };


  // ===================================================
  // Empty
  // ===================================================

  if (invoices.length === 0) {

    return (
      <Card className="border-0 bg-white shadow-sm">

        <CardContent className="p-10">

          <div className="flex flex-col items-center justify-center text-center">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">

              <FileText className="h-6 w-6 text-gray-400" />

            </div>

            <p className="font-medium text-gray-700">
              لا توجد فواتير
            </p>

            <p className="mt-1 text-sm text-gray-500">
              ستظهر الفواتير هنا بعد تسجيل المبيعات.
            </p>

          </div>

        </CardContent>

      </Card>
    );
  }


  // ===================================================
  // Render
  // ===================================================

  return (

    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">

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

              <CardDescription className="mt-1">
                جميع الفواتير مع إمكانية التنزيل والإرسال عبر WhatsApp
              </CardDescription>

            </div>

          </div>

        </CardHeader>


        <CardContent>

          {/* Search */}

          <div className="mb-6 rounded-2xl border border-gray-100 bg-[#FDFBF7] p-4">

            <div className="mb-2 flex items-center gap-2">

              <Search className="h-5 w-5 text-[#2E7D32]" />

              <Label
                htmlFor="invoiceSearch"
                className="font-semibold text-[#374151]"
              >
                البحث عن فاتورة
              </Label>

            </div>

            <div className="relative">

              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <Input
                id="invoiceSearch"
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="رقم الفاتورة أو اسم العميل أو الهاتف..."
                className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-right focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
              />

            </div>

            <p className="mt-2 text-xs text-gray-500">

              {searchTerm.trim()
                ? `تم العثور على ${filteredInvoices.length} فاتورة`
                : `إجمالي الفواتير: ${invoices.length}`}

            </p>

          </div>


          {/* No results */}

          {filteredInvoices.length === 0 ? (

            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-[#FDFBF7] py-10 text-center">

              <Search className="mb-3 h-7 w-7 text-gray-400" />

              <p className="font-medium text-gray-700">
                لا توجد نتائج
              </p>

              <p className="mt-1 text-sm text-gray-500">
                لم يتم العثور على فواتير مطابقة للبحث.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {filteredInvoices.map(
                (invoice) => {

                  const paymentStatus =
                    getPaymentStatus(
                      invoice.paymentStatus
                    );

                  return (

                    <Card
                      key={invoice.id}
                      className="border-gray-100 bg-[#FDFBF7] shadow-none transition-all duration-200 hover:border-[#2E7D32]/20 hover:shadow-sm"
                    >

                      <CardContent className="p-4">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                          {/* Information */}

                          <div className="flex min-w-0 items-start gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">

                              <FileText className="h-5 w-5 text-[#2E7D32]" />

                            </div>

                            <div className="min-w-0 space-y-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="font-semibold text-[#374151]">
                                  فاتورة رقم {invoice.number}
                                </p>

                                <Badge
                                  variant="outline"
                                  className={
                                    paymentStatus.className
                                  }
                                >
                                  {paymentStatus.text}
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
                                  التاريخ:{' '}
                                  <span className="font-medium text-[#374151]">
                                    {new Date(
                                      invoice.createdAt ||
                                      invoice.date
                                    ).toLocaleDateString(
                                      'ar-SY',
                                      {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                      }
                                    )}
                                  </span>
                                </span>

                                <span>
                                  المجموع:{' '}
                                  <span className="font-bold text-[#2E7D32]">
                                    {Number(
                                      invoice.total || 0
                                    ).toLocaleString(
                                      'ar-SY'
                                    )}{' '}
                                    ل.س
                                  </span>
                                </span>

                                {invoice.customer?.phone && (
                                  <span>
                                    WhatsApp:{' '}
                                    <span
                                      dir="ltr"
                                      className="font-medium text-[#374151]"
                                    >
                                      {
                                        invoice.customer.phone
                                      }
                                    </span>
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>


                          {/* Buttons */}

                          <div className="flex flex-col gap-2 sm:flex-row">

                            <Button
                              type="button"
                              onClick={() =>
                                sendInvoiceWhatsApp(
                                  invoice
                                )
                              }
                              disabled={
                                sendingInvoiceId ===
                                invoice.id
                              }
                              className="h-11 w-full rounded-xl bg-[#25D366] px-5 text-white shadow-sm hover:bg-[#20BD5A] sm:w-auto"
                            >

                              {sendingInvoiceId ===
                              invoice.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  جاري الإرسال...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  إرسال WhatsApp
                                </>
                              )}

                            </Button>


                            <Button
                              type="button"
                              onClick={() =>
                                downloadPDF(
                                  invoice
                                )
                              }
                              disabled={
                                downloadingInvoiceId ===
                                invoice.id
                              }
                              className="h-11 w-full rounded-xl bg-[#2E7D32] px-5 text-white shadow-sm hover:bg-[#256428] sm:w-auto"
                            >

                              {downloadingInvoiceId ===
                              invoice.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  جاري التجهيز...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                  تنزيل PDF
                                </>
                              )}

                            </Button>

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                  );
                }
              )}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  );
}