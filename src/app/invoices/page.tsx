'use client';

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Eye,
  FileText,
  History,
  Loader2,
  Plus,
  Search,
  UserRound,
  WalletCards,
  X,
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


// =====================================================
// Types
// =====================================================

type PaymentStatus =
  | 'UNPAID'
  | 'PARTIAL'
  | 'PAID';

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  note: string | null;
  createdAt: string;
};

type Invoice = {
  id: string;
  number: string;
  date: string;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;

  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
};

type InvoiceWithRemaining = Invoice & {
  remainingAmount: number;
};

type StatusFilter =
  | 'ALL'
  | PaymentStatus;


// =====================================================
// Currency
// =====================================================

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString('ar-SY');
}


// =====================================================
// Local Date For <input type="date">
// =====================================================

function getTodayForDateInput() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


// =====================================================
// Date
// =====================================================

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString(
    'ar-SY',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  );
}


// =====================================================
// Payment Date + Time
// =====================================================

function formatPaymentDateTime(
  payment: Payment
) {
  const paymentDate = new Date(
    payment.paymentDate
  );

  const createdAt = new Date(
    payment.createdAt
  );

  const date =
    Number.isNaN(paymentDate.getTime())
      ? '-'
      : paymentDate.toLocaleDateString(
          'ar-SY',
          {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }
        );

  const time =
    Number.isNaN(createdAt.getTime())
      ? '-'
      : createdAt.toLocaleTimeString(
          'ar-SY',
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        );

  return `${date} — ${time}`;
}


// =====================================================
// Payment Status Label
// =====================================================

function getPaymentStatusLabel(
  status: PaymentStatus
) {
  switch (status) {
    case 'PAID':
      return 'مكتملة';

    case 'PARTIAL':
      return 'مدفوعة جزئياً';

    case 'UNPAID':
      return 'غير مدفوعة';

    default:
      return status;
  }
}


// =====================================================
// Payment Status Style
// =====================================================

function getPaymentStatusClass(
  status: PaymentStatus
) {
  switch (status) {
    case 'PAID':
      return 'border-[#2E7D32]/30 bg-[#E8F5E9] text-[#2E7D32]';

    case 'PARTIAL':
      return 'border-[#EF6C00]/30 bg-[#FFF3E0] text-[#EF6C00]';

    case 'UNPAID':
      return 'border-red-200 bg-red-50 text-red-600';

    default:
      return 'border-gray-200 bg-gray-50 text-[#374151]';
  }
}


// =====================================================
// Page
// =====================================================

export default function InvoicesPage() {

  // ===================================================
  // Data
  // ===================================================

  const [invoices, setInvoices] =
    useState<InvoiceWithRemaining[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');


  // ===================================================
  // Search / Filter
  // ===================================================

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL');


  // ===================================================
  // Details Dialog
  // ===================================================

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceWithRemaining | null>(
      null
    );


  // ===================================================
  // Payment Dialog
  // ===================================================

  const [paymentOpen, setPaymentOpen] =
    useState(false);

  const [paymentAmount, setPaymentAmount] =
    useState('');

  const [paymentDate, setPaymentDate] =
    useState('');

  const [paymentNote, setPaymentNote] =
    useState('');

  const [savingPayment, setSavingPayment] =
    useState(false);


  // ===================================================
  // Payment History
  // ===================================================

  const [historyOpen, setHistoryOpen] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyInvoice, setHistoryInvoice] =
    useState<InvoiceWithRemaining | null>(
      null
    );

  const [payments, setPayments] =
    useState<Payment[]>([]);


  // ===================================================
  // Fetch Invoices
  // ===================================================

  const fetchInvoices = async () => {

    try {

      setLoading(true);

      setError('');

      const response =
        await fetch(
          '/api/invoices',
          {
            cache: 'no-store',
          }
        );

      if (!response.ok) {
        throw new Error(
          'حدث خطأ أثناء جلب الفواتير'
        );
      }

      const result =
        await response.json();

      if (!Array.isArray(result)) {
        throw new Error(
          'بيانات الفواتير غير صالحة'
        );
      }

      const normalizedInvoices =
        result.map(
          (
            invoice: Invoice
          ) => {

            const total =
              Number(invoice.total);

            const paidAmount =
              Number(invoice.paidAmount);

            const remainingAmount =
              Math.max(
                total - paidAmount,
                0
              );

            return {
              ...invoice,
              total,
              paidAmount,
              remainingAmount,
            };
          }
        );

      setInvoices(
        normalizedInvoices
      );

    } catch (error) {

      console.error(
        'GET /api/invoices error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء تحميل الفواتير'
      );

    } finally {

      setLoading(false);

    }
  };


  // ===================================================
  // Initial Load
  // ===================================================

  useEffect(() => {
    fetchInvoices();
  }, []);


  // ===================================================
  // Statistics
  // ===================================================

  const summary =
    useMemo(() => {

      const totalInvoiceValue =
        invoices.reduce(
          (sum, invoice) =>
            sum + invoice.total,
          0
        );

      const totalPaidAmount =
        invoices.reduce(
          (sum, invoice) =>
            sum + invoice.paidAmount,
          0
        );

      const totalOutstanding =
        invoices.reduce(
          (sum, invoice) =>
            sum + invoice.remainingAmount,
          0
        );

      const paidInvoices =
        invoices.filter(
          (invoice) =>
            invoice.paymentStatus ===
            'PAID'
        ).length;

      const partialInvoices =
        invoices.filter(
          (invoice) =>
            invoice.paymentStatus ===
            'PARTIAL'
        ).length;

      const unpaidInvoices =
        invoices.filter(
          (invoice) =>
            invoice.paymentStatus ===
            'UNPAID'
        ).length;

      return {
        totalInvoices:
          invoices.length,

        totalInvoiceValue,

        totalPaidAmount,

        totalOutstanding,

        paidInvoices,

        partialInvoices,

        unpaidInvoices,
      };

    }, [invoices]);


  // ===================================================
  // Filtered Invoices
  // ===================================================

  const filteredInvoices =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();

      return invoices.filter(
        (invoice) => {

          const matchesStatus =
            statusFilter === 'ALL' ||
            invoice.paymentStatus ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!searchValue) {
            return true;
          }

          const number =
            String(
              invoice.number ?? ''
            ).toLowerCase();

          const customerName =
            String(
              invoice.customer?.name ?? ''
            ).toLowerCase();

          const phone =
            String(
              invoice.customer?.phone ?? ''
            ).toLowerCase();

          return (
            number.includes(searchValue) ||
            customerName.includes(searchValue) ||
            phone.includes(searchValue)
          );
        }
      );

    }, [
      invoices,
      search,
      statusFilter,
    ]);


  // ===================================================
  // Open Details
  // ===================================================

  const openDetails = (
    invoice: InvoiceWithRemaining
  ) => {

    setSelectedInvoice(
      invoice
    );

    setDetailsOpen(true);

  };


  // ===================================================
  // Open Payment Dialog
  // ===================================================

  const openPaymentDialog = (
    invoice: InvoiceWithRemaining
  ) => {

    if (
      invoice.remainingAmount <= 0 ||
      invoice.paymentStatus === 'PAID'
    ) {
      return;
    }

    setSelectedInvoice(
      invoice
    );

    setPaymentAmount('');

    /*
     * مهم:
     * لا نستخدم toISOString() هنا.
     *
     * toISOString() يحول التاريخ إلى UTC
     * وقد يؤدي ذلك إلى ظهور تاريخ مختلف.
     *
     * نستخدم التاريخ المحلي للجهاز.
     */
    setPaymentDate(
      getTodayForDateInput()
    );

    setPaymentNote('');

    setError('');

    setPaymentOpen(true);
  };


  // ===================================================
  // Add Payment
  // ===================================================

  const handleAddPayment = async () => {

    if (!selectedInvoice) {
      return;
    }

    const amount =
      Number(paymentAmount);

    if (
      !Number.isFinite(amount) ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {

      setError(
        'مبلغ الدفعة يجب أن يكون رقماً صحيحاً أكبر من صفر'
      );

      return;
    }

    if (
      amount >
      selectedInvoice.remainingAmount
    ) {

      setError(
        `المبلغ أكبر من المتبقي وهو ${formatCurrency(
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

      const response =
        await fetch(
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

      const responseText =
        await response.text();

      let result: any = {};

      try {

        result =
          responseText
            ? JSON.parse(
                responseText
              )
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

      setPaymentDate('');

      setMessage(
        'تم تسجيل الدفعة وتحديث الفاتورة بنجاح'
      );

      await fetchInvoices();

      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {

      console.error(
        'ADD PAYMENT ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء تسجيل الدفعة'
      );

    } finally {

      setSavingPayment(false);

    }
  };


  // ===================================================
  // Open Payment History
  // ===================================================

  const openPaymentHistory = async (
    invoice: InvoiceWithRemaining
  ) => {

    setHistoryInvoice(
      invoice
    );

    setHistoryOpen(true);

    setHistoryLoading(true);

    setPayments([]);

    setError('');

    try {

      const response =
        await fetch(
          `/api/invoices/${invoice.id}/payments`,
          {
            cache: 'no-store',
          }
        );

      const responseText =
        await response.text();

      let result: any = {};

      try {

        result =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};

      } catch {

        throw new Error(
          `استجابة سجل الدفعات غير صالحة. HTTP ${response.status}`
        );

      }

      if (!response.ok) {

        throw new Error(
          result.message ||
            result.error ||
            'حدث خطأ أثناء جلب سجل الدفعات'
        );

      }

      const historyPayments =
        Array.isArray(
          result.invoice?.payments
        )
          ? result.invoice.payments
          : [];

      setPayments(
        historyPayments
      );

      if (result.invoice) {

        const updatedInvoice =
          result.invoice;

        setHistoryInvoice(
          (current) => {

            if (!current) {
              return current;
            }

            const total =
              Number(
                updatedInvoice.total
              );

            const paidAmount =
              Number(
                updatedInvoice.paidAmount
              );

            return {
              ...current,

              total,

              paidAmount,

              remainingAmount:
                Math.max(
                  total -
                    paidAmount,
                  0
                ),

              paymentStatus:
                updatedInvoice.paymentStatus,

              customer:
                updatedInvoice.customer ||
                current.customer,
            };

          }
        );

      }

    } catch (error) {

      console.error(
        'PAYMENT HISTORY ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء جلب سجل الدفعات'
      );

    } finally {

      setHistoryLoading(false);

    }
  };


  // ===================================================
  // Latest Payment
  // ===================================================

  const latestPaymentId =
    payments.length > 0
      ? payments.reduce(
          (
            latest,
            payment
          ) =>
            new Date(
              payment.createdAt
            ).getTime() >
            new Date(
              latest.createdAt
            ).getTime()
              ? payment
              : latest
        ).id
      : null;


  // ===================================================
  // Loading
  // ===================================================

  if (loading) {

    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#FDFBF7] p-4 md:p-6"
      >

        <div className="mx-auto max-w-7xl space-y-6">

          <div className="space-y-2">

            <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />

            <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />

          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (

                <Card
                  key={item}
                  className="border-0 shadow-sm"
                >

                  <CardContent className="p-4 md:p-5">

                    <div className="h-20 animate-pulse rounded-xl bg-gray-100" />

                  </CardContent>

                </Card>

              )
            )}

          </div>

          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-4 md:p-6">

              <div className="space-y-3">

                {[1, 2, 3, 4, 5].map(
                  (item) => (

                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-xl bg-gray-100"
                    />

                  )
                )}

              </div>

            </CardContent>

          </Card>

        </div>

      </main>
    );
  }


  // ===================================================
  // Render
  // ===================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#FDFBF7] p-3 sm:p-4 md:p-6"
    >

      <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">


        {/* =================================================
            Header
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                window.history.back()
              }
              className="h-10 w-10 shrink-0 rounded-xl border-gray-200 bg-white p-0 hover:bg-[#E8F5E9]"
              title="العودة"
            >

              <ArrowRight className="h-5 w-5 text-[#2E7D32]" />

            </Button>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">

              <FileText className="h-5 w-5 text-[#2E7D32]" />

            </div>

            <div className="min-w-0">

              <h1 className="text-xl font-bold text-[#374151] md:text-2xl">
                إدارة الفواتير
              </h1>

              <p className="mt-0.5 text-xs text-[#374151]/60 md:text-sm">
                عرض ومتابعة الفواتير وحالات الدفع
              </p>

            </div>

          </div>

          <div className="hidden items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm sm:flex">

            <CalendarDays className="h-4 w-4 text-[#2E7D32]" />

            <span className="text-sm font-medium text-[#374151]">

              {new Date().toLocaleDateString(
                'ar-SY',
                {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}

            </span>

          </div>

        </div>


        {/* =================================================
            Messages
        ================================================= */}

        {message && (

          <div className="rounded-xl border border-[#2E7D32]/20 bg-[#E8F5E9] px-4 py-3 text-sm font-medium text-[#2E7D32]">

            {message}

          </div>

        )}

        {error && (

          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

            <span className="min-w-0">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="shrink-0"
            >

              <X className="h-4 w-4" />

            </button>

          </div>

        )}


        {/* =================================================
            Summary
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-4 md:p-5">

              <div className="flex items-center justify-between gap-2">

                <div className="min-w-0">

                  <p className="truncate text-xs font-medium text-[#374151]/60 md:text-sm">
                    إجمالي الفواتير
                  </p>

                  <div className="mt-1.5 flex items-baseline gap-1.5">

                    <span className="text-xl font-bold text-[#374151] md:text-2xl">
                      {formatCurrency(
                        summary.totalInvoices
                      )}
                    </span>

                    <span className="hidden text-xs text-[#374151]/50 sm:inline">
                      فاتورة
                    </span>

                  </div>

                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] md:h-12 md:w-12">

                  <FileText className="h-5 w-5 text-[#2E7D32]" />

                </div>

              </div>

            </CardContent>

          </Card>


          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-4 md:p-5">

              <div className="flex items-center justify-between gap-2">

                <div className="min-w-0">

                  <p className="truncate text-xs font-medium text-[#374151]/60 md:text-sm">
                    قيمة الفواتير
                  </p>

                  <div className="mt-1.5 flex items-baseline gap-1">

                    <span className="truncate text-lg font-bold text-[#374151] md:text-xl">
                      {formatCurrency(
                        summary.totalInvoiceValue
                      )}
                    </span>

                    <span className="text-xs text-[#374151]/50">
                      ل.س
                    </span>

                  </div>

                </div>

                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 sm:flex">

                  <WalletCards className="h-6 w-6 text-[#374151]" />

                </div>

              </div>

            </CardContent>

          </Card>


          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-4 md:p-5">

              <div className="flex items-center justify-between gap-2">

                <div className="min-w-0">

                  <p className="truncate text-xs font-medium text-[#374151]/60 md:text-sm">
                    إجمالي المدفوع
                  </p>

                  <div className="mt-1.5 flex items-baseline gap-1">

                    <span className="truncate text-lg font-bold text-[#2E7D32] md:text-xl">
                      {formatCurrency(
                        summary.totalPaidAmount
                      )}
                    </span>

                    <span className="text-xs text-[#374151]/50">
                      ل.س
                    </span>

                  </div>

                </div>

                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] sm:flex">

                  <CircleDollarSign className="h-6 w-6 text-[#2E7D32]" />

                </div>

              </div>

            </CardContent>

          </Card>


          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-4 md:p-5">

              <div className="flex items-center justify-between gap-2">

                <div className="min-w-0">

                  <p className="truncate text-xs font-medium text-[#374151]/60 md:text-sm">
                    إجمالي المتبقي
                  </p>

                  <div className="mt-1.5 flex items-baseline gap-1">

                    <span className="truncate text-lg font-bold text-[#EF6C00] md:text-xl">
                      {formatCurrency(
                        summary.totalOutstanding
                      )}
                    </span>

                    <span className="text-xs text-[#374151]/50">
                      ل.س
                    </span>

                  </div>

                </div>

                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E0] sm:flex">

                  <CircleDollarSign className="h-6 w-6 text-[#EF6C00]" />

                </div>

              </div>

            </CardContent>

          </Card>

        </div>


        {/* =================================================
            Status Filters
        ================================================= */}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

          <button
            type="button"
            onClick={() =>
              setStatusFilter('ALL')
            }
            className={`rounded-xl border p-3 text-right transition ${
              statusFilter === 'ALL'
                ? 'border-[#2E7D32]/40 bg-[#E8F5E9]'
                : 'border-gray-200 bg-white hover:bg-[#FDFBF7]'
            }`}
          >

            <div className="flex items-center justify-between gap-2">

              <span className="text-xs font-medium text-[#374151] sm:text-sm">
                الكل
              </span>

              <span className="text-lg font-bold text-[#374151]">
                {formatCurrency(
                  summary.totalInvoices
                )}
              </span>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              setStatusFilter('UNPAID')
            }
            className={`rounded-xl border p-3 text-right transition ${
              statusFilter === 'UNPAID'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white hover:bg-[#FDFBF7]'
            }`}
          >

            <div className="flex items-center justify-between gap-2">

              <span className="text-xs font-medium text-[#374151] sm:text-sm">
                غير مدفوعة
              </span>

              <span className="text-lg font-bold text-red-600">
                {formatCurrency(
                  summary.unpaidInvoices
                )}
              </span>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              setStatusFilter('PARTIAL')
            }
            className={`rounded-xl border p-3 text-right transition ${
              statusFilter === 'PARTIAL'
                ? 'border-[#EF6C00]/40 bg-[#FFF3E0]'
                : 'border-gray-200 bg-white hover:bg-[#FDFBF7]'
            }`}
          >

            <div className="flex items-center justify-between gap-2">

              <span className="text-xs font-medium text-[#374151] sm:text-sm">
                جزئياً
              </span>

              <span className="text-lg font-bold text-[#EF6C00]">
                {formatCurrency(
                  summary.partialInvoices
                )}
              </span>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              setStatusFilter('PAID')
            }
            className={`rounded-xl border p-3 text-right transition ${
              statusFilter === 'PAID'
                ? 'border-[#2E7D32]/40 bg-[#E8F5E9]'
                : 'border-gray-200 bg-white hover:bg-[#FDFBF7]'
            }`}
          >

            <div className="flex items-center justify-between gap-2">

              <span className="text-xs font-medium text-[#374151] sm:text-sm">
                مكتملة
              </span>

              <span className="text-lg font-bold text-[#2E7D32]">
                {formatCurrency(
                  summary.paidInvoices
                )}
              </span>

            </div>

          </button>

        </div>


        {/* =================================================
            Main Card
        ================================================= */}

        <Card className="overflow-hidden border-gray-100 bg-white shadow-sm">

          <CardHeader className="border-b border-gray-100 p-4 md:p-6">

            <div className="flex flex-col gap-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">

                  <FileText className="h-5 w-5 text-[#2E7D32]" />

                </div>

                <div>

                  <CardTitle className="text-base text-[#374151] md:text-lg">
                    الفواتير
                  </CardTitle>

                  <CardDescription className="text-xs md:text-sm">
                    اختر الفاتورة لعرض التفاصيل وإدارة الدفعات
                  </CardDescription>

                </div>

              </div>


              <div className="relative w-full">

                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="البحث برقم الفاتورة أو اسم العميل..."
                  className="h-11 border-gray-200 bg-[#FDFBF7] pr-9 text-right focus-visible:ring-[#2E7D32]"
                />

              </div>

            </div>

          </CardHeader>


          <CardContent className="p-0">

            {filteredInvoices.length === 0 ? (

              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9]">

                  <FileText className="h-7 w-7 text-[#2E7D32]" />

                </div>

                <h3 className="mt-4 text-base font-bold text-[#374151]">
                  لا توجد فواتير
                </h3>

                <p className="mt-1 max-w-sm text-sm text-[#374151]/50">
                  لا توجد فواتير تطابق البحث أو الفلتر المحدد
                </p>

              </div>

            ) : (

              <>

                {/* =================================================
                    Desktop Table
                ================================================= */}

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full">

                    <thead>

                      <tr className="border-b border-gray-100 bg-[#FDFBF7]">

                        <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                          رقم الفاتورة
                        </th>

                        <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                          العميل
                        </th>

                        <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                          التاريخ
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-bold text-[#374151]">
                          إجمالي الفاتورة
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-bold text-[#374151]">
                          المبلغ المستلم
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-bold text-[#374151]">
                          المبلغ المتبقي
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-bold text-[#374151]">
                          حالة الدفع
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-bold text-[#374151]">
                          الإجراءات
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredInvoices.map(
                        (invoice) => (

                          <tr
                            key={invoice.id}
                            className="border-b border-gray-100 transition-colors hover:bg-[#FDFBF7]"
                          >

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F5E9]">

                                  <FileText className="h-4 w-4 text-[#2E7D32]" />

                                </div>

                                <span className="font-bold text-[#374151]">
                                  {invoice.number}
                                </span>

                              </div>

                            </td>


                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">

                                  <UserRound className="h-4 w-4 text-[#374151]" />

                                </div>

                                <p className="font-medium text-[#374151]">
                                  {invoice.customer?.name ||
                                    'غير معروف'}
                                </p>

                              </div>

                            </td>


                            <td className="px-5 py-4 text-sm text-[#374151]/70">

                              {formatDate(
                                invoice.date
                              )}

                            </td>


                            {/* Total */}

                            <td className="px-5 py-4 text-center">

                              <span className="font-bold text-[#374151]">

                                {formatCurrency(
                                  invoice.total
                                )}

                                <span className="mr-1 text-xs font-normal text-[#374151]/50">
                                  ل.س
                                </span>

                              </span>

                            </td>


                            {/* Paid */}

                            <td className="px-5 py-4 text-center">

                              <span className="font-bold text-[#2E7D32]">

                                {formatCurrency(
                                  invoice.paidAmount
                                )}

                                <span className="mr-1 text-xs font-normal text-[#374151]/50">
                                  ل.س
                                </span>

                              </span>

                            </td>


                            {/* Remaining */}

                            <td className="px-5 py-4 text-center">

                              <span
                                className={
                                  invoice.remainingAmount > 0
                                    ? 'font-bold text-[#EF6C00]'
                                    : 'font-bold text-[#2E7D32]'
                                }
                              >

                                {formatCurrency(
                                  invoice.remainingAmount
                                )}

                                <span className="mr-1 text-xs font-normal text-[#374151]/50">
                                  ل.س
                                </span>

                              </span>

                            </td>


                            {/* Status */}

                            <td className="px-5 py-4 text-center">

                              <Badge
                                variant="outline"
                                className={getPaymentStatusClass(
                                  invoice.paymentStatus
                                )}
                              >

                                {getPaymentStatusLabel(
                                  invoice.paymentStatus
                                )}

                              </Badge>

                            </td>


                            {/* Actions */}

                            <td className="px-5 py-4">

                              <div className="flex items-center justify-center gap-2">

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openDetails(
                                      invoice
                                    )
                                  }
                                  className="border-gray-200 bg-white text-[#374151] hover:bg-[#FDFBF7]"
                                >

                                  <Eye className="ml-1 h-4 w-4" />

                                  التفاصيل

                                </Button>


                                {invoice.remainingAmount > 0 &&
                                  invoice.paymentStatus !==
                                    'PAID' && (

                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        openPaymentDialog(
                                          invoice
                                        )
                                      }
                                      className="bg-[#2E7D32] text-white hover:bg-[#256428]"
                                    >

                                      <Plus className="ml-1 h-4 w-4" />

                                      إضافة دفعة

                                    </Button>

                                  )}

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>


                {/* =================================================
                    Mobile Cards
                ================================================= */}

                <div className="divide-y divide-gray-100 md:hidden">

                  {filteredInvoices.map(
                    (invoice) => (

                      <div
                        key={invoice.id}
                        className="p-4"
                      >

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                          <div className="flex items-start justify-between gap-3">

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">

                                <FileText className="h-5 w-5 text-[#2E7D32]" />

                              </div>

                              <div className="min-w-0">

                                <p className="text-xs text-[#374151]/50">
                                  رقم الفاتورة
                                </p>

                                <p className="truncate text-base font-bold text-[#374151]">
                                  {invoice.number}
                                </p>

                              </div>

                            </div>


                            <Badge
                              variant="outline"
                              className={`shrink-0 ${getPaymentStatusClass(
                                invoice.paymentStatus
                              )}`}
                            >

                              {getPaymentStatusLabel(
                                invoice.paymentStatus
                              )}

                            </Badge>

                          </div>


                          <div className="mt-4 grid grid-cols-2 gap-3">

                            <div className="min-w-0">

                              <p className="text-xs text-[#374151]/50">
                                العميل
                              </p>

                              <div className="mt-1 flex min-w-0 items-center gap-2">

                                <UserRound className="h-4 w-4 shrink-0 text-[#374151]/50" />

                                <p className="truncate text-sm font-semibold text-[#374151]">
                                  {invoice.customer?.name ||
                                    'غير معروف'}
                                </p>

                              </div>

                            </div>


                            <div>

                              <p className="text-xs text-[#374151]/50">
                                التاريخ
                              </p>

                              <div className="mt-1 flex items-center gap-2">

                                <CalendarDays className="h-4 w-4 shrink-0 text-[#374151]/50" />

                                <p className="text-sm font-semibold text-[#374151]">
                                  {formatDate(
                                    invoice.date
                                  )}
                                </p>

                              </div>

                            </div>

                          </div>


                          {/* Amounts */}

                          <div className="mt-4 grid grid-cols-3 gap-2">

                            <div className="rounded-lg bg-gray-50 p-2.5">

                              <p className="text-[11px] text-[#374151]/50">
                                الإجمالي
                              </p>

                              <p className="mt-1 text-sm font-bold text-[#374151]">

                                {formatCurrency(
                                  invoice.total
                                )}

                              </p>

                              <p className="text-[10px] text-[#374151]/40">
                                ل.س
                              </p>

                            </div>


                            <div className="rounded-lg bg-[#E8F5E9] p-2.5">

                              <p className="text-[11px] text-[#374151]/50">
                                المستلم
                              </p>

                              <p className="mt-1 text-sm font-bold text-[#2E7D32]">

                                {formatCurrency(
                                  invoice.paidAmount
                                )}

                              </p>

                              <p className="text-[10px] text-[#374151]/40">
                                ل.س
                              </p>

                            </div>


                            <div className="rounded-lg bg-[#FFF3E0] p-2.5">

                              <p className="text-[11px] text-[#374151]/50">
                                المتبقي
                              </p>

                              <p className="mt-1 text-sm font-bold text-[#EF6C00]">

                                {formatCurrency(
                                  invoice.remainingAmount
                                )}

                              </p>

                              <p className="text-[10px] text-[#374151]/40">
                                ل.س
                              </p>

                            </div>

                          </div>


                          <div className="mt-4 flex gap-2">

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                openDetails(
                                  invoice
                                )
                              }
                              className="h-10 flex-1 border-gray-200 bg-white text-[#374151] hover:bg-[#FDFBF7]"
                            >

                              <Eye className="ml-1.5 h-4 w-4" />

                              التفاصيل

                            </Button>


                            {invoice.remainingAmount > 0 &&
                              invoice.paymentStatus !==
                                'PAID' && (

                                <Button
                                  type="button"
                                  onClick={() =>
                                    openPaymentDialog(
                                      invoice
                                    )
                                  }
                                  className="h-10 flex-1 bg-[#2E7D32] text-white hover:bg-[#256428]"
                                >

                                  <Plus className="ml-1.5 h-4 w-4" />

                                  إضافة دفعة

                                </Button>

                              )}

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </>

            )}

          </CardContent>

        </Card>


        {/* =================================================
            Footer
        ================================================= */}

        {invoices.length > 0 && (

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EF6C00]/20 bg-[#FFF3E0] px-4 py-3 text-sm text-[#374151]">

            <CircleDollarSign className="h-4 w-4 shrink-0 text-[#EF6C00]" />

            <span>
              إجمالي المتبقي:
            </span>

            <strong className="text-[#EF6C00]">

              {formatCurrency(
                summary.totalOutstanding
              )}

              {' '}

              ل.س

            </strong>

          </div>

        )}

      </div>


      {/* ===================================================
          Invoice Details Dialog
      =================================================== */}

      <Dialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      >

        <DialogContent
          dir="rtl"
          className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-lg sm:p-6"
        >

          <DialogHeader>

            <DialogTitle className="text-right text-[#374151]">
              تفاصيل الفاتورة
            </DialogTitle>

            <DialogDescription className="text-right text-xs sm:text-sm">
              جميع معلومات الفاتورة وإدارة الدفعات.
            </DialogDescription>

          </DialogHeader>


          {selectedInvoice && (

            <div className="space-y-4 py-3">

              <div className="rounded-xl border border-gray-200 bg-[#FDFBF7] p-4">

                <div className="flex items-center justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-xs text-[#374151]/50">
                      رقم الفاتورة
                    </p>

                    <p className="mt-1 truncate text-lg font-bold text-[#374151]">
                      {selectedInvoice.number}
                    </p>

                  </div>


                  <Badge
                    variant="outline"
                    className={`shrink-0 ${getPaymentStatusClass(
                      selectedInvoice.paymentStatus
                    )}`}
                  >

                    {getPaymentStatusLabel(
                      selectedInvoice.paymentStatus
                    )}

                  </Badge>

                </div>

              </div>


              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-xl border border-gray-200 bg-white p-4">

                  <p className="text-xs text-[#374151]/50">
                    العميل
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    <UserRound className="h-4 w-4 text-[#374151]/50" />

                    <p className="font-bold text-[#374151]">
                      {selectedInvoice.customer?.name ||
                        'غير معروف'}
                    </p>

                  </div>

                </div>


                <div className="rounded-xl border border-gray-200 bg-white p-4">

                  <p className="text-xs text-[#374151]/50">
                    تاريخ الفاتورة
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    <CalendarDays className="h-4 w-4 text-[#374151]/50" />

                    <p className="font-semibold text-[#374151]">
                      {formatDate(
                        selectedInvoice.date
                      )}
                    </p>

                  </div>

                </div>

              </div>


              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-xl border border-gray-200 bg-white p-4">

                  <p className="text-xs text-[#374151]/50">
                    الإجمالي
                  </p>

                  <p className="mt-1 font-bold text-[#374151]">

                    {formatCurrency(
                      selectedInvoice.total
                    )}

                    {' '}

                    <span className="text-xs font-normal">
                      ل.س
                    </span>

                  </p>

                </div>


                <div className="rounded-xl border border-[#2E7D32]/20 bg-[#E8F5E9] p-4">

                  <p className="text-xs text-[#374151]/60">
                    المدفوع
                  </p>

                  <p className="mt-1 font-bold text-[#2E7D32]">

                    {formatCurrency(
                      selectedInvoice.paidAmount
                    )}

                    {' '}

                    <span className="text-xs font-normal">
                      ل.س
                    </span>

                  </p>

                </div>


                <div className="rounded-xl border border-[#EF6C00]/20 bg-[#FFF3E0] p-4">

                  <p className="text-xs text-[#374151]/60">
                    المتبقي
                  </p>

                  <p className="mt-1 font-bold text-[#EF6C00]">

                    {formatCurrency(
                      selectedInvoice.remainingAmount
                    )}

                    {' '}

                    <span className="text-xs font-normal">
                      ل.س
                    </span>

                  </p>

                </div>

              </div>


              {selectedInvoice.customer?.phone && (

                <div className="rounded-xl border border-gray-200 bg-white p-4">

                  <p className="text-xs text-[#374151]/50">
                    رقم الهاتف
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 text-right text-sm font-semibold text-[#374151]"
                  >
                    {selectedInvoice.customer.phone}
                  </p>

                </div>

              )}


              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    openPaymentHistory(
                      selectedInvoice
                    )
                  }
                  className="h-11 border-[#EF6C00]/30 bg-white text-[#EF6C00] hover:bg-[#FFF3E0] hover:text-[#EF6C00]"
                >

                  <History className="ml-2 h-4 w-4" />

                  سجل الدفعات

                </Button>


                {selectedInvoice.remainingAmount > 0 &&
                  selectedInvoice.paymentStatus !==
                    'PAID' && (

                    <Button
                      type="button"
                      onClick={() => {

                        setDetailsOpen(false);

                        openPaymentDialog(
                          selectedInvoice
                        );

                      }}
                      className="h-11 bg-[#2E7D32] text-white hover:bg-[#256428]"
                    >

                      <Plus className="ml-2 h-4 w-4" />

                      إضافة دفعة

                    </Button>

                  )}

              </div>

            </div>

          )}


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDetailsOpen(false)
              }
              className="w-full sm:w-auto"
            >
              إغلاق
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>


      {/* ===================================================
          Add Payment Dialog
      =================================================== */}

      <Dialog
        open={paymentOpen}
        onOpenChange={(open) => {

          if (!savingPayment) {
            setPaymentOpen(open);
          }

        }}
      >

        <DialogContent
          dir="rtl"
          className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-md sm:p-6"
        >

          <DialogHeader>

            <DialogTitle className="text-right text-[#374151]">
              إضافة دفعة
            </DialogTitle>

            <DialogDescription className="text-right text-xs sm:text-sm">
              تسجيل دفعة جديدة على الفاتورة.
            </DialogDescription>

          </DialogHeader>


          {selectedInvoice && (

            <div className="space-y-4 py-3">

              <div className="rounded-xl border border-gray-200 bg-[#FDFBF7] p-4">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-xs text-[#374151]/50">
                      رقم الفاتورة
                    </p>

                    <p className="mt-1 font-bold text-[#374151]">
                      {selectedInvoice.number}
                    </p>

                  </div>

                  <div className="text-left">

                    <p className="text-xs text-[#374151]/50">
                      المتبقي
                    </p>

                    <p className="mt-1 font-bold text-[#EF6C00]">

                      {formatCurrency(
                        selectedInvoice.remainingAmount
                      )}

                      {' '}

                      <span className="text-xs">
                        ل.س
                      </span>

                    </p>

                  </div>

                </div>

              </div>


              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">
                  مبلغ الدفعة
                </label>

                <Input
                  type="number"
                  min="1"
                  max={
                    selectedInvoice.remainingAmount
                  }
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(
                      event.target.value
                    )
                  }
                  placeholder="أدخل مبلغ الدفعة"
                  dir="ltr"
                  className="h-11 text-left focus-visible:ring-[#2E7D32]"
                />

                <p className="text-xs text-[#374151]/50">

                  الحد الأقصى:

                  {' '}

                  {formatCurrency(
                    selectedInvoice.remainingAmount
                  )}

                  {' '}

                  ل.س

                </p>

              </div>


              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">
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
                  dir="ltr"
                  className="h-11 text-left focus-visible:ring-[#2E7D32]"
                />

              </div>


              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">

                  ملاحظة

                  <span className="mr-1 text-xs font-normal text-[#374151]/40">
                    اختياري
                  </span>

                </label>

                <Input
                  value={paymentNote}
                  onChange={(event) =>
                    setPaymentNote(
                      event.target.value
                    )
                  }
                  placeholder="مثال: دفعة نقدية"
                  className="h-11 text-right focus-visible:ring-[#2E7D32]"
                />

              </div>

            </div>

          )}


          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-start">

            <Button
              type="button"
              variant="outline"
              disabled={savingPayment}
              onClick={() =>
                setPaymentOpen(false)
              }
              className="w-full sm:w-auto"
            >
              إلغاء
            </Button>


            <Button
              type="button"
              disabled={
                savingPayment ||
                !selectedInvoice
              }
              onClick={handleAddPayment}
              className="w-full bg-[#2E7D32] text-white hover:bg-[#256428] sm:w-auto"
            >

              {savingPayment ? (

                <>

                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />

                  جارٍ تسجيل الدفعة...

                </>

              ) : (

                <>

                  <Plus className="ml-2 h-4 w-4" />

                  تسجيل الدفعة

                </>

              )}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>


      {/* ===================================================
          Payment History Dialog
      =================================================== */}

      <Dialog
        open={historyOpen}
        onOpenChange={(open) => {

          if (!historyLoading) {
            setHistoryOpen(open);
          }

        }}
      >

        <DialogContent
          dir="rtl"
          className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-2xl sm:p-6"
        >

          <DialogHeader>

            <DialogTitle className="text-right text-[#374151]">
              سجل الدفعات
            </DialogTitle>

            <DialogDescription className="text-right text-xs sm:text-sm">
              جميع الدفعات المسجلة لهذه الفاتورة.
            </DialogDescription>

          </DialogHeader>


          {historyInvoice && (

            <div className="space-y-4 py-3">

              <div className="rounded-xl border border-gray-200 bg-[#FDFBF7] p-4">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs text-[#374151]/50">
                      الفاتورة
                    </p>

                    <p className="mt-1 font-bold text-[#374151]">
                      {historyInvoice.number}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-[#374151]/50">
                      العميل
                    </p>

                    <p className="mt-1 font-bold text-[#374151]">
                      {historyInvoice.customer?.name ||
                        'غير معروف'}
                    </p>

                  </div>


                  <Badge
                    variant="outline"
                    className={`self-start sm:self-auto ${getPaymentStatusClass(
                      historyInvoice.paymentStatus
                    )}`}
                  >

                    {getPaymentStatusLabel(
                      historyInvoice.paymentStatus
                    )}

                  </Badge>

                </div>


                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-200 pt-4">

                  <div>

                    <p className="text-[11px] text-[#374151]/50">
                      قيمة الفاتورة
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#374151]">
                      {formatCurrency(
                        historyInvoice.total
                      )}
                    </p>

                  </div>


                  <div>

                    <p className="text-[11px] text-[#374151]/50">
                      المدفوع
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#2E7D32]">
                      {formatCurrency(
                        historyInvoice.paidAmount
                      )}
                    </p>

                  </div>


                  <div>

                    <p className="text-[11px] text-[#374151]/50">
                      المتبقي
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#EF6C00]">
                      {formatCurrency(
                        historyInvoice.remainingAmount
                      )}
                    </p>

                  </div>

                </div>

              </div>


              {historyLoading ? (

                <div className="flex items-center justify-center py-12">

                  <div className="flex items-center gap-2 text-sm text-[#374151]/60">

                    <Loader2 className="h-5 w-5 animate-spin text-[#2E7D32]" />

                    جارٍ تحميل سجل الدفعات...

                  </div>

                </div>

              ) : payments.length === 0 ? (

                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-[#FDFBF7] px-6 py-10 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">

                    <History className="h-6 w-6 text-gray-400" />

                  </div>

                  <p className="mt-3 text-sm font-bold text-[#374151]">
                    لا توجد دفعات مسجلة
                  </p>

                  <p className="mt-1 text-xs text-[#374151]/50">
                    لم يتم تسجيل أي دفعة لهذه الفاتورة حتى الآن.
                  </p>

                </div>

              ) : (

                <div className="space-y-3">

                  {payments.map(
                    (payment) => (

                      <div
                        key={payment.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >

                        <div className="flex items-start gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">

                            <CircleDollarSign className="h-5 w-5 text-[#2E7D32]" />

                          </div>


                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="font-bold text-[#2E7D32]">

                                {formatCurrency(
                                  Number(
                                    payment.amount
                                  )
                                )}

                                {' '}

                                <span className="text-xs font-normal">
                                  ل.س
                                </span>

                              </p>


                              {payment.id ===
                                latestPaymentId && (

                                <Badge
                                  variant="outline"
                                  className="border-[#2E7D32]/30 bg-[#E8F5E9] text-xs text-[#2E7D32]"
                                >
                                  أحدث دفعة
                                </Badge>

                              )}

                            </div>


                            <p className="mt-1 text-xs text-[#374151]/50">

                              {formatPaymentDateTime(
                                payment
                              )}

                            </p>


                            {payment.note && (

                              <div className="mt-3 rounded-lg bg-[#FDFBF7] px-3 py-2 text-sm text-[#374151]/70">

                                <span className="font-medium text-[#374151]">
                                  ملاحظة:
                                </span>

                                {' '}

                                {payment.note}

                              </div>

                            )}

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          )}


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setHistoryOpen(false)
              }
              className="w-full sm:w-auto"
            >
              إغلاق
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </main>
  );
}