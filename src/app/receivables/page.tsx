'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Loader2,
  Phone,
  Search,
  Send,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../@/components/ui/card';

import { Input } from '../../../@/components/ui/input';
import { Badge } from '../../../@/components/ui/badge';
import { Button } from '../../../@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../@/components/ui/dialog';

type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  note: string | null;
  createdAt: string;
};

type CustomerInvoice = {
  id: string;
  number: string;
  date: string;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  createdAt?: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
};

type ReceivableCustomer = {
  id: string;
  name: string;
  phone: string | null;
  invoiceCount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  invoices: CustomerInvoice[];
};

type ReceivablesData = {
  summary: {
    totalOutstanding: number;
    totalCustomers: number;
    totalInvoices: number;
    totalInvoiceValue: number;
    totalPaidAmount: number;
  };
  customers: ReceivableCustomer[];
  invoices: CustomerInvoice[];
};

type Tab = 'receivables' | 'invoices';

// =====================================================
// Formatting
// =====================================================

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString('ar-SY');
}

function formatDate(value: string) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatInvoiceDate(value: string) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getTodayDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function formatPaymentDateTime(payment: Payment) {
  const date = new Date(
    payment.createdAt || payment.paymentDate
  );

  return date.toLocaleString('ar-SY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =====================================================
// Payment Status
// =====================================================

function statusLabel(status: PaymentStatus) {
  if (status === 'PAID') return 'مدفوعة بالكامل';

  if (status === 'PARTIAL') return 'مدفوعة جزئياً';

  return 'غير مدفوعة';
}

function statusClass(status: PaymentStatus) {
  if (status === 'PAID') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'PARTIAL') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-red-200 bg-red-50 text-red-700';
}

// =====================================================
// Invoice List Payment Status
// =====================================================

function getPaymentStatus(status: PaymentStatus) {
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
}

// =====================================================
// Main Component
// =====================================================

export default function ReceivablesPage() {
  const [data, setData] =
    useState<ReceivablesData | null>(null);

  const [loading, setLoading] = useState(true);

  const [tab, setTab] =
    useState<Tab>('receivables');

  const [search, setSearch] = useState('');

  const [selectedCustomer, setSelectedCustomer] =
    useState<ReceivableCustomer | null>(null);

  const [error, setError] = useState('');

  const [message, setMessage] = useState('');

  // =====================================================
  // Payment Dialog
  // =====================================================

  const [paymentOpen, setPaymentOpen] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] =
    useState<CustomerInvoice | null>(null);

  const [paymentAmount, setPaymentAmount] =
    useState('');

  const [paymentDate, setPaymentDate] =
    useState(getTodayDate());

  const [paymentNote, setPaymentNote] =
    useState('');

  const [savingPayment, setSavingPayment] =
    useState(false);

  // =====================================================
  // Payment History
  // =====================================================

  const [historyOpen, setHistoryOpen] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [selectedHistoryInvoice, setSelectedHistoryInvoice] =
    useState<CustomerInvoice | null>(null);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  // =====================================================
  // WhatsApp
  // =====================================================

  const [sendingInvoiceId, setSendingInvoiceId] =
    useState<string | null>(null);

  // =====================================================
  // PDF
  // =====================================================

  const [downloadingInvoiceId, setDownloadingInvoiceId] =
    useState<string | null>(null);

  // =====================================================
  // Fetch Receivables
  // =====================================================

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/receivables',
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          'Failed to fetch receivables'
        );
      }

      const result =
        await response.json();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تحميل بيانات المستحقات'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  // =====================================================
  // Filter Customers
  // =====================================================

  const filteredCustomers = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return data?.customers ?? [];
    }

    return (data?.customers ?? []).filter(
      (customer) =>
        customer.name
          .toLowerCase()
          .includes(value) ||
        String(customer.phone ?? '')
          .toLowerCase()
          .includes(value)
    );
  }, [data, search]);

  // =====================================================
  // Filter Invoices
  // =====================================================

  const filteredInvoices = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    const invoices =
      data?.invoices ?? [];

    if (!value) {
      return invoices;
    }

    return invoices.filter(
      (invoice) => {
        const invoiceNumber =
          invoice.number?.toLowerCase() ??
          '';

        const customerName =
          invoice.customer?.name
            ?.toLowerCase() ?? '';

        const customerPhone =
          String(
            invoice.customer?.phone ?? ''
          ).toLowerCase();

        return (
          invoiceNumber.includes(value) ||
          customerName.includes(value) ||
          customerPhone.includes(value)
        );
      }
    );
  }, [data, search]);

  // =====================================================
  // Open Payment Dialog
  // =====================================================

  const openPaymentDialog = (
    invoice: CustomerInvoice
  ) => {
    setSelectedInvoice(invoice);

    setPaymentAmount('');

    setPaymentDate(getTodayDate());

    setPaymentNote('');

    setError('');

    setPaymentOpen(true);
  };

  // =====================================================
  // Add Payment
  // =====================================================

  const handleAddPayment = async () => {
    if (!selectedInvoice) return;

    const amount =
      Number(paymentAmount);

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      setError(
        'مبلغ الدفعة يجب أن يكون رقمًا صحيحًا أكبر من صفر'
      );

      return;
    }

    if (
      amount >
      selectedInvoice.remainingAmount
    ) {
      setError(
        `المبلغ أكبر من المتبقي: ${formatCurrency(
          selectedInvoice.remainingAmount
        )} ل.س`
      );

      return;
    }

    if (!paymentDate) {
      setError(
        'يرجى اختيار تاريخ الدفعة'
      );

      return;
    }

    try {
      setSavingPayment(true);

      setError('');

      const response = await fetch(
        `/api/invoices/${selectedInvoice.id}/payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            amount,
            paymentDate,
            note:
              paymentNote.trim() ||
              null,
          }),
        }
      );

      const text =
        await response.text();

      let result: any = {};

      try {
        result = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          `استجابة الخادم غير صالحة. HTTP ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            'حدث خطأ أثناء تسجيل الدفعة'
        );
      }

      setPaymentOpen(false);

      setSelectedInvoice(null);

      setPaymentAmount('');

      setPaymentNote('');

      setMessage(
        'تم تسجيل الدفعة وتحديث المستحقات بنجاح'
      );

      await fetchReceivables();

      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تسجيل الدفعة'
      );
    } finally {
      setSavingPayment(false);
    }
  };

  // =====================================================
  // Payment History
  // =====================================================

  const openPaymentHistory = async (
    invoice: CustomerInvoice
  ) => {
    setSelectedHistoryInvoice(
      invoice
    );

    setHistoryOpen(true);

    setHistoryLoading(true);

    setPayments([]);

    setError('');

    try {
      const response = await fetch(
        `/api/invoices/${invoice.id}/payments`,
        {
          cache: 'no-store',
        }
      );

      const text =
        await response.text();

      const result = text
        ? JSON.parse(text)
        : {};

      if (!response.ok) {
        throw new Error(
          result.message ||
            'حدث خطأ أثناء جلب سجل الدفعات'
        );
      }

      setPayments(
        Array.isArray(
          result.invoice?.payments
        )
          ? result.invoice.payments
          : []
      );

      if (result.invoice) {
        setSelectedHistoryInvoice(
          (current) =>
            current
              ? {
                  ...current,

                  total: Number(
                    result.invoice.total
                  ),

                  paidAmount: Number(
                    result.invoice.paidAmount
                  ),

                  remainingAmount:
                    Number(
                      result.invoice
                        .remainingAmount
                    ),

                  paymentStatus:
                    result.invoice
                      .paymentStatus,

                  customer:
                    result.invoice.customer ||
                    current.customer,
                }
              : current
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء جلب سجل الدفعات'
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================================
  // Download PDF
  // =====================================================

  const downloadPDF = async (
    invoiceId: string,
    number: string
  ) => {
    if (downloadingInvoiceId) {
      return;
    }

    try {
      setDownloadingInvoiceId(
        invoiceId
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
              invoiceId,
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
        `invoice-${number}.pdf`;

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

  // =====================================================
  // Send Invoice via WhatsApp
  // =====================================================

  const sendInvoiceWhatsApp =
    async (
      invoice: CustomerInvoice
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

        let result: any;

        try {
          result =
            JSON.parse(
              responseText
            );
        } catch {
          throw new Error(
            `السيرفر أعاد استجابة غير صالحة JSON. HTTP ${response.status}\n\n${responseText.substring(
              0,
              500
            )}`
          );
        }

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result?.message ||
              result?.error ||
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

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#F8FAF8] p-4 md:p-8"
      >
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200" />

          <div className="h-32 animate-pulse rounded-2xl bg-white" />

          <div className="h-14 animate-pulse rounded-2xl bg-white" />

          <div className="space-y-3">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-white"
                />
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // No Data
  // =====================================================

  if (!data) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#F8FAF8] p-4 md:p-8"
      >
        <div className="mx-auto max-w-6xl rounded-2xl border border-red-100 bg-white p-8 text-center text-sm text-red-600">
          {error ||
            'حدث خطأ في تحميل بيانات المستحقات'}
        </div>
      </main>
    );
  }

  // =====================================================
  // ONLY TWO TABS
  // =====================================================

  const tabs = [
    {
      id: 'receivables' as const,
      label: 'المستحقات',
      icon: WalletCards,
    },
    {
      id: 'invoices' as const,
      label: 'الفواتير',
      icon: FileText,
    },
  ];

  // =====================================================
  // Latest Payment
  // =====================================================

  const allPaymentsCount =
    payments.length;

  const latestPaymentId =
    payments.reduce<string | null>(
      (latest, payment) => {
        if (!latest) {
          return payment.id;
        }

        const current =
          payments.find(
            (item) =>
              item.id === latest
          );

        return new Date(
          payment.createdAt
        ).getTime() >
          new Date(
            current?.createdAt ?? 0
          ).getTime()
          ? payment.id
          : latest;
      },
      null
    );

  // =====================================================
  // Render
  // =====================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F8FAF8] p-3 sm:p-4 md:p-8"
    >
      <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">

        {/* =================================================
            Header
        ================================================= */}

        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                window.history.back()
              }
              className="h-10 w-10 shrink-0 rounded-xl bg-white p-0"
              aria-label="العودة"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <WalletCards className="h-5 w-5 text-[#EF6C00]" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl">
                المستحقات
              </h1>

              <p className="hidden text-sm text-gray-500 sm:block">
                متابعة وتحصيل المبالغ المستحقة على العملاء
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 sm:flex">
            <CalendarDays className="h-4 w-4 text-[#2E7D32]" />

            {new Date().toLocaleDateString(
              'ar-SY',
              {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }
            )}
          </div>
        </header>

        {/* =================================================
            Success Message
        ================================================= */}

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />

            {message}
          </div>
        )}

        {/* =================================================
            Error
        ================================================= */}

        {error &&
          !paymentOpen &&
          !historyOpen && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

        {/* =================================================
            Summary
        ================================================= */}

        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-5 md:p-6">

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  المستحق للتحصيل
                </p>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-[#EF6C00] md:text-4xl">
                    {formatCurrency(
                      data.summary
                        .totalOutstanding
                    )}
                  </span>

                  <span className="text-sm text-gray-400">
                    ل.س
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  {data.summary.totalCustomers} عميل ·{' '}
                  {data.summary.totalInvoices} فاتورة مستحقة
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">

                <div className="rounded-xl bg-[#F8FAF8] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="h-3.5 w-3.5" />

                    العملاء
                  </div>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {data.summary.totalCustomers}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8FAF8] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="h-3.5 w-3.5" />

                    الفواتير
                  </div>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {data.summary.totalInvoices}
                  </p>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* =================================================
            TWO TABS
        ================================================= */}

        <div className="sticky top-0 z-10 -mx-1 rounded-2xl bg-[#F8FAF8]/95 p-1 backdrop-blur">
          <div className="grid grid-cols-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">

            {tabs.map(
              ({
                id,
                label,
                icon: Icon,
              }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setSearch('');
                    setSelectedCustomer(null);
                  }}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition ${
                    tab === id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />

                  <span>{label}</span>
                </button>
              )
            )}

          </div>
        </div>

        {/* =================================================
            Search
        ================================================= */}

        <div className="relative">

          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={
              tab === 'receivables'
                ? 'ابحث باسم العميل أو الهاتف...'
                : 'ابحث برقم الفاتورة أو العميل أو الهاتف...'
            }
            className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-right shadow-sm focus-visible:ring-[#2E7D32]"
          />

        </div>

        {/* =================================================
            RECEIVABLES TAB
        ================================================= */}

        {tab === 'receivables' && (
          <section className="space-y-3">

            {selectedCustomer ? (

              <Card className="border-0 bg-white shadow-sm">
                <CardContent className="p-4 sm:p-5">

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCustomer(
                        null
                      )
                    }
                    className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    العودة إلى العملاء
                  </button>

                  <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                        <UserRound className="h-5 w-5 text-[#2E7D32]" />
                      </div>

                      <div>
                        <h2 className="font-bold text-gray-900">
                          {selectedCustomer.name}
                        </h2>

                        {selectedCustomer.phone && (
                          <p
                            dir="ltr"
                            className="mt-1 flex items-center gap-1 text-xs text-gray-500"
                          >
                            <Phone className="h-3 w-3" />

                            {
                              selectedCustomer.phone
                            }
                          </p>
                        )}
                      </div>

                    </div>

                    <div className="rounded-xl bg-orange-50 px-4 py-3">
                      <p className="text-xs text-gray-500">
                        المتبقي
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#EF6C00]">
                        {formatCurrency(
                          selectedCustomer.remainingAmount
                        )}{' '}
                        <span className="text-xs font-normal">
                          ل.س
                        </span>
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 space-y-3">

                    {selectedCustomer.invoices.map(
                      (invoice) => (
                        <InvoiceCard
                          key={invoice.id}
                          invoice={invoice}
                          onPay={
                            openPaymentDialog
                          }
                          onHistory={
                            openPaymentHistory
                          }
                        />
                      )
                    )}

                  </div>

                </CardContent>
              </Card>

            ) : filteredCustomers.length === 0 ? (

              <EmptyState text="لا توجد مستحقات مطابقة" />

            ) : (

              filteredCustomers.map(
                (customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() =>
                      setSelectedCustomer(
                        customer
                      )
                    }
                    className="group w-full rounded-2xl border border-gray-100 bg-white p-4 text-right shadow-sm transition hover:border-gray-200 hover:shadow-md sm:p-5"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <UserRound className="h-5 w-5 text-[#2E7D32]" />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">

                          <h3 className="truncate font-bold text-gray-900">
                            {customer.name}
                          </h3>

                          <Badge
                            variant="outline"
                            className="hidden border-gray-200 bg-gray-50 text-gray-500 sm:inline-flex"
                          >
                            {customer.invoiceCount}{' '}
                            {customer.invoiceCount ===
                            1
                              ? 'فاتورة'
                              : 'فواتير'}
                          </Badge>

                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">

                          {customer.phone && (
                            <span dir="ltr">
                              {
                                customer.phone
                              }
                            </span>
                          )}

                          <span className="sm:hidden">
                            {
                              customer.invoiceCount
                            }{' '}
                            فواتير
                          </span>

                        </div>

                      </div>

                      <div className="text-left">

                        <p className="text-xs text-gray-400">
                          المتبقي
                        </p>

                        <p className="mt-1 whitespace-nowrap text-base font-bold text-[#EF6C00] sm:text-lg">
                          {formatCurrency(
                            customer.remainingAmount
                          )}{' '}
                          <span className="text-[10px] font-normal">
                            ل.س
                          </span>
                        </p>

                      </div>

                      <ChevronLeft className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:-translate-x-1 group-hover:text-gray-500" />

                    </div>
                  </button>
                )
              )
            )}

          </section>
        )}

        {/* =================================================
            INVOICES TAB
        ================================================= */}

        {tab === 'invoices' && (
          <section className="space-y-4">

            <Card className="border-gray-100 bg-white shadow-sm">

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
                      عرض الفواتير وتنزيلها وإرسالها عبر WhatsApp
                    </CardDescription>

                  </div>

                </div>

              </CardHeader>

              <CardContent>

                {/* Results Count */}

                <div className="mb-4 rounded-xl border border-gray-100 bg-[#FDFBF7] px-4 py-3">
                  <p className="text-xs text-gray-500">
                    {search.trim()
                      ? `تم العثور على ${filteredInvoices.length} فاتورة`
                      : `إجمالي الفواتير: ${data.invoices.length}`}
                  </p>
                </div>

                {/* No Invoices */}

                {data.invoices.length === 0 ? (

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

                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-[#FDFBF7] py-10 text-center">

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>

                    <p className="font-medium text-[#374151]">
                      لا توجد نتائج
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      لم يتم العثور على فواتير مطابقة للبحث
                    </p>

                    <p className="mt-1 font-semibold text-[#2E7D32]">
                      {search}
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

                        const isSending =
                          sendingInvoiceId ===
                          invoice.id;

                        const isDownloading =
                          downloadingInvoiceId ===
                          invoice.id;

                        return (
                          <Card
                            key={invoice.id}
                            className="border-gray-100 bg-[#FDFBF7] shadow-none transition-all duration-200 hover:border-[#2E7D32]/20 hover:shadow-sm"
                          >

                            <CardContent className="p-4">

                              <div className="flex flex-col gap-4">

                                {/* Invoice Information */}

                                <div className="flex items-start gap-3">

                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                                    <FileText className="h-5 w-5 text-[#2E7D32]" />
                                  </div>

                                  <div className="min-w-0 flex-1">

                                    <div className="flex flex-wrap items-center gap-2">

                                      <p className="font-semibold text-[#374151]">
                                        فاتورة رقم{' '}
                                        {
                                          invoice.number
                                        }
                                      </p>

                                      <Badge
                                        variant="outline"
                                        className={
                                          paymentStatus.className
                                        }
                                      >
                                        {
                                          paymentStatus.text
                                        }
                                      </Badge>

                                    </div>

                                    <div className="mt-2 grid grid-cols-1 gap-x-5 gap-y-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">

                                      {/* Customer */}

                                      <span>
                                        العميل:{' '}
                                        <span className="font-medium text-[#374151]">
                                          {
                                            invoice
                                              .customer
                                              ?.name ||
                                            'عميل نقدي'
                                          }
                                        </span>
                                      </span>

                                      {/* Date */}

                                      <span>
                                        التاريخ:{' '}
                                        <span className="font-medium text-[#374151]">
                                          {formatInvoiceDate(
                                            invoice.date ||
                                              invoice.createdAt ||
                                              ''
                                          )}
                                        </span>
                                      </span>

                                      {/* Total */}

                                      <span>
                                        المجموع:{' '}
                                        <span className="font-bold text-[#2E7D32]">
                                          {formatCurrency(
                                            invoice.total
                                          )}{' '}
                                          ل.س
                                        </span>
                                      </span>

                                      {/* WhatsApp */}

                                      {invoice.customer
                                        ?.phone && (
                                        <span>
                                          WhatsApp:{' '}
                                          <span
                                            dir="ltr"
                                            className="font-medium text-[#374151]"
                                          >
                                            {
                                              invoice
                                                .customer
                                                .phone
                                            }
                                          </span>
                                        </span>
                                      )}

                                    </div>

                                  </div>

                                </div>

                                {/* Buttons */}

                                <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:justify-end">

                                  {/* WhatsApp */}

                                  <Button
                                    type="button"
                                    onClick={() =>
                                      sendInvoiceWhatsApp(
                                        invoice
                                      )
                                    }
                                    disabled={
                                      isSending ||
                                      isDownloading
                                    }
                                    className="h-11 w-full rounded-xl bg-[#25D366] px-5 text-white shadow-sm transition-all hover:bg-[#20BD5A] hover:shadow-md sm:w-auto"
                                  >

                                    {isSending ? (
                                      <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />

                                        جاري الإرسال...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="ml-2 h-4 w-4" />

                                        إرسال WhatsApp
                                      </>
                                    )}

                                  </Button>

                                  {/* Download PDF */}

                                  <Button
                                    type="button"
                                    onClick={() =>
                                      downloadPDF(
                                        invoice.id,
                                        invoice.number
                                      )
                                    }
                                    disabled={
                                      isDownloading ||
                                      isSending
                                    }
                                    className="h-11 w-full rounded-xl bg-[#2E7D32] px-5 text-white shadow-sm transition-all hover:bg-[#2E7D32]/90 hover:shadow-md sm:w-auto"
                                  >

                                    {isDownloading ? (
                                      <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />

                                        جاري تجهيز PDF...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="ml-2 h-4 w-4" />

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

          </section>
        )}

      </div>

      {/* =====================================================
          Payment Dialog
      ===================================================== */}

      <Dialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      >
        <DialogContent
          dir="rtl"
          className="w-[calc(100%-1rem)] max-w-md rounded-2xl p-5 sm:p-6"
        >

          <DialogHeader>

            <DialogTitle>
              تسجيل دفعة
            </DialogTitle>

            <DialogDescription>
              {selectedInvoice?.customer.name} · فاتورة{' '}
              {selectedInvoice?.number}
            </DialogDescription>

          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">

              <div className="rounded-xl bg-orange-50 p-4">

                <p className="text-xs text-gray-500">
                  المتبقي من الفاتورة
                </p>

                <p className="mt-1 text-2xl font-bold text-[#EF6C00]">
                  {formatCurrency(
                    selectedInvoice.remainingAmount
                  )}{' '}
                  <span className="text-sm font-normal">
                    ل.س
                  </span>
                </p>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  مبلغ الدفعة
                </label>

                <Input
                  inputMode="numeric"
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(
                      event.target.value.replace(
                        /[^0-9]/g,
                        ''
                      )
                    )
                  }
                  placeholder="0"
                  className="h-12 text-left text-lg font-semibold"
                  dir="ltr"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() =>
                    setPaymentAmount(
                      String(
                        selectedInvoice.remainingAmount
                      )
                    )
                  }
                  className="mt-2 text-xs font-semibold text-[#2E7D32] hover:underline"
                >
                  دفع كامل المتبقي (
                  {formatCurrency(
                    selectedInvoice.remainingAmount
                  )}{' '}
                  ل.س)
                </button>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    تاريخ الدفعة
                  </label>

                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(event) =>
                      setPaymentDate(
                        event.target.value
                      )
                    }
                    className="h-11"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    ملاحظة{' '}
                    <span className="font-normal text-gray-400">
                      (اختياري)
                    </span>
                  </label>

                  <Input
                    value={paymentNote}
                    onChange={(event) =>
                      setPaymentNote(
                        event.target.value
                      )
                    }
                    placeholder="مثلاً: نقداً"
                    className="h-11"
                  />

                </div>

              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

            </div>
          )}

          <DialogFooter className="gap-2 sm:flex-row-reverse">

            <Button
              type="button"
              onClick={
                handleAddPayment
              }
              disabled={savingPayment}
              className="h-11 bg-[#2E7D32] text-white hover:bg-[#256428]"
            >
              {savingPayment ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />

                  جارٍ الحفظ...
                </>
              ) : (
                'تسجيل الدفعة'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPaymentOpen(false)
              }
              className="h-11"
            >
              إلغاء
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* =====================================================
          Payment History Dialog
      ===================================================== */}

      <Dialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      >
        <DialogContent
          dir="rtl"
          className="w-[calc(100%-1rem)] max-w-lg rounded-2xl p-5 sm:p-6"
        >

          <DialogHeader>

            <DialogTitle>
              سجل الدفعات
            </DialogTitle>

            <DialogDescription>
              {selectedHistoryInvoice?.customer.name} · فاتورة{' '}
              {selectedHistoryInvoice?.number}
            </DialogDescription>

          </DialogHeader>

          {selectedHistoryInvoice && (
            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-2">

                <div className="rounded-xl bg-gray-50 p-3">

                  <p className="text-xs text-gray-500">
                    الإجمالي
                  </p>

                  <p className="mt-1 font-bold">
                    {formatCurrency(
                      selectedHistoryInvoice.total
                    )}{' '}
                    ل.س
                  </p>

                </div>

                <div className="rounded-xl bg-orange-50 p-3">

                  <p className="text-xs text-gray-500">
                    المتبقي
                  </p>

                  <p className="mt-1 font-bold text-[#EF6C00]">
                    {formatCurrency(
                      selectedHistoryInvoice.remainingAmount
                    )}{' '}
                    ل.س
                  </p>

                </div>

              </div>

              {historyLoading ? (

                <div className="flex items-center justify-center py-10 text-sm text-gray-500">

                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />

                  جارٍ تحميل الدفعات...

                </div>

              ) : payments.length === 0 ? (

                <EmptyState text="لا توجد دفعات مسجلة لهذه الفاتورة" />

              ) : (

                <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">

                  {payments.map(
                    (payment) => (
                      <div
                        key={payment.id}
                        className="rounded-xl border border-gray-100 bg-white p-4"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                            <CircleDollarSign className="h-5 w-5 text-[#2E7D32]" />
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="font-bold text-[#2E7D32]">
                                {formatCurrency(
                                  Number(
                                    payment.amount
                                  )
                                )}{' '}
                                ل.س
                              </p>

                              {payment.id ===
                                latestPaymentId && (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700"
                                >
                                  أحدث دفعة
                                </Badge>
                              )}

                            </div>

                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">

                              <Clock3 className="h-3 w-3" />

                              {formatPaymentDateTime(
                                payment
                              )}

                            </p>

                          </div>

                        </div>

                        {payment.note && (
                          <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            {payment.note}
                          </div>
                        )}

                      </div>
                    )
                  )}

                </div>
              )}

              <p className="text-xs text-gray-400">
                عدد الدفعات:{' '}
                {allPaymentsCount}
              </p>

            </div>
          )}

          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setHistoryOpen(false)
              }
            >
              إغلاق
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

    </main>
  );
}

// =====================================================
// Empty State
// =====================================================

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center shadow-sm">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
        <WalletCards className="h-5 w-5 text-gray-400" />
      </div>

      <p className="mt-3 text-sm font-semibold text-gray-700">
        {text}
      </p>

    </div>
  );
}

// =====================================================
// Invoice Card
// Used inside Receivables > Customer
// =====================================================

function InvoiceCard({
  invoice,
  onPay,
  onHistory,
}: {
  invoice: CustomerInvoice;
  onPay: (
    invoice: CustomerInvoice
  ) => void;
  onHistory: (
    invoice: CustomerInvoice
  ) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">

      <div className="flex flex-col gap-4">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
            <FileText className="h-5 w-5 text-gray-500" />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="font-bold text-gray-900">
                فاتورة {invoice.number}
              </h3>

              <Badge
                variant="outline"
                className={statusClass(
                  invoice.paymentStatus
                )}
              >
                {statusLabel(
                  invoice.paymentStatus
                )}
              </Badge>

            </div>

            <p className="mt-1 text-xs text-gray-400">
              {formatDate(
                invoice.date
              )}
            </p>

          </div>

        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3">

          <Metric
            label="الإجمالي"
            value={invoice.total}
          />

          <Metric
            label="المدفوع"
            value={invoice.paidAmount}
            positive
          />

          <Metric
            label="المتبقي"
            value={
              invoice.remainingAmount
            }
            warning
          />

        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">

          {invoice.remainingAmount >
            0 && (
            <Button
              type="button"
              onClick={() =>
                onPay(invoice)
              }
              className="h-10 bg-[#2E7D32] text-white hover:bg-[#256428]"
            >
              تحصيل دفعة
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onHistory(invoice)
            }
            className="h-10 border-gray-200"
          >
            سجل الدفعات
          </Button>

        </div>

      </div>

    </div>
  );
}

// =====================================================
// Metric
// =====================================================

function Metric({
  label,
  value,
  positive,
  warning,
}: {
  label: string;
  value: number;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="min-w-0">

      <p className="truncate text-[11px] text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-sm font-bold ${
          positive
            ? 'text-[#2E7D32]'
            : warning
              ? 'text-[#EF6C00]'
              : 'text-gray-900'
        }`}
      >
        {formatCurrency(value)}
      </p>

    </div>
  );
}