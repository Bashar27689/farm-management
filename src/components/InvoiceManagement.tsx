'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  WalletCards,
  Users,
} from 'lucide-react';

import { Card, CardContent } from '../../@/components/ui/card';

import InvoiceList from './InvoiceList';
import ReceivablesList from './ReceivablesList';


// =====================================================
// Types
// =====================================================

export type PaymentStatus =
  | 'UNPAID'
  | 'PARTIAL'
  | 'PAID';

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  date: string;
  createdAt: string;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  customer: Customer | null;
};

export type InvoiceSummary = {
  totalInvoices: number;
  totalInvoiceValue: number;
  totalPaidAmount: number;

  completedInvoicesCount: number;
  completedInvoiceValue: number;

  outstandingInvoicesCount: number;
  outstandingAmount: number;

  outstandingCustomersCount: number;
};

type Tab = 'invoices' | 'receivables';


// =====================================================
// Helpers
// =====================================================

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString('ar-SY');
}


// =====================================================
// Component
// =====================================================

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tab, setTab] = useState<Tab>('invoices');


  // ===================================================
  // Fetch invoices
  // ===================================================

  const fetchInvoices = async () => {
    try {
      setError('');

      const response = await fetch(
        '/api/invoices',
        {
          cache: 'no-store',
        }
      );

      const text = await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          `استجابة الخادم غير صالحة. HTTP ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'حدث خطأ أثناء جلب الفواتير'
        );
      }

      const formattedInvoices =
        Array.isArray(data?.invoices)
          ? data.invoices
          : [];

      setInvoices(formattedInvoices);

      setSummary(
        data?.summary || null
      );

    } catch (err) {
      console.error(
        'Error fetching invoices:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء جلب الفواتير'
      );

      setInvoices([]);
      setSummary(null);

    } finally {
      setLoading(false);
    }
  };


  // ===================================================
  // Initial load
  // ===================================================

  useEffect(() => {
    fetchInvoices();
  }, []);


  // ===================================================
  // Derived summary
  //
  // هذا يجعل الكروت صحيحة حتى لو احتجنا الاعتماد
  // على البيانات الحالية في الواجهة.
  // ===================================================

  const calculatedSummary =
    useMemo<InvoiceSummary>(() => {
      const completedInvoices =
        invoices.filter(
          (invoice) =>
            invoice.remainingAmount <= 0 ||
            invoice.paymentStatus === 'PAID'
        );

      const outstandingInvoices =
        invoices.filter(
          (invoice) =>
            invoice.remainingAmount > 0 &&
            invoice.paymentStatus !== 'PAID'
        );

      const outstandingCustomerIds =
        new Set(
          outstandingInvoices
            .map(
              (invoice) =>
                invoice.customer?.id
            )
            .filter(Boolean)
        );

      return {
        totalInvoices:
          invoices.length,

        totalInvoiceValue:
          invoices.reduce(
            (sum, invoice) =>
              sum + Number(invoice.total || 0),
            0
          ),

        totalPaidAmount:
          invoices.reduce(
            (sum, invoice) =>
              sum + Number(invoice.paidAmount || 0),
            0
          ),

        completedInvoicesCount:
          completedInvoices.length,

        completedInvoiceValue:
          completedInvoices.reduce(
            (sum, invoice) =>
              sum + Number(invoice.total || 0),
            0
          ),

        outstandingInvoicesCount:
          outstandingInvoices.length,

        outstandingAmount:
          outstandingInvoices.reduce(
            (sum, invoice) =>
              sum +
              Number(
                invoice.remainingAmount || 0
              ),
            0
          ),

        outstandingCustomersCount:
          outstandingCustomerIds.size,
      };
    }, [invoices]);


  const currentSummary =
    summary || calculatedSummary;


  // ===================================================
  // Loading
  // ===================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#F8FAF8] p-4 md:p-8"
      >
        <div className="mx-auto max-w-6xl space-y-5">

          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-white"
                />
              )
            )}
          </div>

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


  // ===================================================
  // Error
  // ===================================================

  if (error && invoices.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#F8FAF8] p-4 md:p-8"
      >
        <div className="mx-auto max-w-6xl">

          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">

            <p className="font-semibold text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchInvoices}
              className="mt-4 rounded-xl bg-[#2E7D32] px-5 py-2 text-sm font-semibold text-white hover:bg-[#256428]"
            >
              إعادة المحاولة
            </button>

          </div>

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
      className="min-h-screen bg-[#F8FAF8] p-3 sm:p-4 md:p-8"
    >
      <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">

        {/* =================================================
            Header
        ================================================= */}

        <header className="flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <WalletCards className="h-5 w-5 text-[#EF6C00]" />
            </div>

            <div className="min-w-0">

              <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl">
                إدارة الفواتير
              </h1>

              <p className="hidden text-sm text-gray-500 sm:block">
                إدارة الفواتير والمدفوعات والمبالغ المستحقة
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
            Summary Cards
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          {/* Completed invoices */}

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
                </div>

                <div className="min-w-0">

                  <p className="text-xs text-gray-500">
                    الفواتير المكتملة
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {currentSummary.completedInvoicesCount}
                  </p>

                </div>

              </div>

              <p className="mt-3 text-sm font-semibold text-[#2E7D32]">
                {formatCurrency(
                  currentSummary.completedInvoiceValue
                )}{' '}
                <span className="text-xs font-normal">
                  ل.س
                </span>
              </p>

            </CardContent>
          </Card>


          {/* Outstanding invoices */}

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <WalletCards className="h-5 w-5 text-[#EF6C00]" />
                </div>

                <div className="min-w-0">

                  <p className="text-xs text-gray-500">
                    الفواتير المستحقة
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {currentSummary.outstandingInvoicesCount}
                  </p>

                </div>

              </div>

              <p className="mt-3 text-sm font-semibold text-[#EF6C00]">
                {formatCurrency(
                  currentSummary.outstandingAmount
                )}{' '}
                <span className="text-xs font-normal">
                  ل.س
                </span>
              </p>

            </CardContent>
          </Card>


          {/* Outstanding customers */}

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>

                <div className="min-w-0">

                  <p className="text-xs text-gray-500">
                    العملاء المستحقون
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {currentSummary.outstandingCustomersCount}
                  </p>

                </div>

              </div>

              <p className="mt-3 text-xs text-gray-400">
                عملاء لديهم مبالغ مستحقة
              </p>

            </CardContent>
          </Card>


          {/* Total invoices */}

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>

                <div className="min-w-0">

                  <p className="text-xs text-gray-500">
                    إجمالي الفواتير
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {currentSummary.totalInvoices}
                  </p>

                </div>

              </div>

              <p className="mt-3 text-xs text-gray-400">
                إجمالي قيمة الفواتير:{' '}
                {formatCurrency(
                  currentSummary.totalInvoiceValue
                )}{' '}
                ل.س
              </p>

            </CardContent>
          </Card>

        </div>


        {/* =================================================
            Error while data exists
        ================================================= */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}


        {/* =================================================
            Tabs
        ================================================= */}

        <div className="sticky top-0 z-10 rounded-2xl bg-[#F8FAF8]/95 p-1 backdrop-blur">

          <div className="grid grid-cols-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">

            <button
              type="button"
              onClick={() => setTab('invoices')}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                tab === 'invoices'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>الفواتير</span>
            </button>


            <button
              type="button"
              onClick={() => setTab('receivables')}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                tab === 'receivables'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <WalletCards className="h-4 w-4" />
              <span>المستحقات</span>
            </button>

          </div>

        </div>


        {/* =================================================
            Tab Content
        ================================================= */}

        {tab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            onRefresh={fetchInvoices}
          />
        )}


        {tab === 'receivables' && (
          <ReceivablesList
            invoices={invoices}
            onRefresh={fetchInvoices}
          />
        )}

      </div>
    </main>
  );
}