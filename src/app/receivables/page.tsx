'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  FileText,
  Phone,
  Search,
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


// =====================================================
// Types
// =====================================================

type PaymentStatus =
  | 'UNPAID'
  | 'PARTIAL'
  | 'PAID';

type CustomerInvoice = {
  id: string;
  number: string;
  date: string;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;

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


// =====================================================
// Helper - Currency
// =====================================================

function formatCurrency(
  value: number
) {
  return value.toLocaleString('ar-SY');
}


// =====================================================
// Helper - Date
// =====================================================

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    'ar-SY'
  );
}


// =====================================================
// Payment Status
// =====================================================

function getPaymentStatusLabel(
  status: PaymentStatus
) {
  switch (status) {

    case 'PAID':
      return 'مدفوعة';

    case 'PARTIAL':
      return 'دفع جزئي';

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

    case 'PARTIAL':
      return 'border-[#EF6C00]/30 bg-[#FFF3E0] text-[#EF6C00]';

    case 'UNPAID':
      return 'border-red-200 bg-red-50 text-red-600';

    case 'PAID':
      return 'border-[#2E7D32]/30 bg-[#E8F5E9] text-[#2E7D32]';

    default:
      return 'border-gray-200 bg-gray-50 text-[#374151]';
  }
}


// =====================================================
// Page
// =====================================================

export default function ReceivablesPage() {

  const [
    data,
    setData,
  ] = useState<ReceivablesData | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    expandedCustomer,
    setExpandedCustomer,
  ] = useState<string | null>(
    null
  );

  const [
    error,
    setError,
  ] = useState('');


  // ===================================================
  // Fetch Receivables
  // ===================================================

  const fetchReceivables =
    async () => {

      try {

        setLoading(true);

        setError('');

        const response =
          await fetch(
            '/api/receivables'
          );

        if (!response.ok) {

          throw new Error(
            'Failed to fetch receivables'
          );
        }

        const result =
          await response.json();

        setData(result);

      } catch (error) {

        console.error(
          'Error fetching receivables:',
          error
        );

        setError(
          'حدث خطأ أثناء تحميل بيانات المستحقات'
        );

      } finally {

        setLoading(false);
      }
    };


  // ===================================================
  // Initial Load
  // ===================================================

  useEffect(() => {

    fetchReceivables();

  }, []);


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


          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (

                <Card
                  key={item}
                  className="border-0 shadow-sm"
                >

                  <CardContent className="p-6">

                    <div className="h-24 animate-pulse rounded-xl bg-gray-100" />

                  </CardContent>

                </Card>

              )
            )}

          </div>


          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-6">

              <div className="space-y-4">

                {[1, 2, 3, 4, 5].map(
                  (item) => (

                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-lg bg-gray-100"
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
  // Error
  // ===================================================

  if (!data) {

    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#FDFBF7] p-4 md:p-6"
      >

        <div className="mx-auto max-w-7xl">

          <Card className="border-red-200 bg-white shadow-sm">

            <CardContent className="flex items-center justify-center p-8">

              <p className="text-sm font-medium text-red-600">

                {error ||
                  'حدث خطأ في تحميل بيانات المستحقات'}

              </p>

            </CardContent>

          </Card>

        </div>

      </main>
    );
  }


  // ===================================================
  // Search
  // ===================================================

  const searchValue =
    search
      .trim()
      .toLowerCase();


  const filteredCustomers =
    data.customers.filter(
      (customer) => {

        if (!searchValue) {
          return true;
        }

        const name =
          String(
            customer.name ?? ''
          ).toLowerCase();

        const phone =
          String(
            customer.phone ?? ''
          ).toLowerCase();

        return (
          name.includes(
            searchValue
          ) ||
          phone.includes(
            searchValue
          )
        );
      }
    );


  // ===================================================
  // Toggle Customer
  // ===================================================

  const toggleCustomer = (
    customerId: string
  ) => {

    setExpandedCustomer(
      (current) =>
        current === customerId
          ? null
          : customerId
    );
  };


  // ===================================================
  // Render
  // ===================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#FDFBF7] p-4 md:p-6"
    >

      <div className="mx-auto max-w-7xl space-y-6">


        {/* =================================================
            Header
        ================================================= */}
<div className="flex items-center gap-2">

  {/* زر الرجوع إلى لوحة التحكم */}

  <button
    type="button"
    onClick={() => {
      window.location.href = '/dashboard';
    }}
    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-[#374151] shadow-sm transition-colors hover:border-[#2E7D32]/30 hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
  >

    <ArrowRight className="h-4 w-4" />

    <span>
      لوحة التحكم
    </span>

  </button>


  {/* التاريخ */}

  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">

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
            Summary
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">


          {/* إجمالي المستحق */}

          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-[#374151]/60">

                    إجمالي المستحقات

                  </p>

                  <div className="mt-2 flex items-baseline gap-2">

                    <span className="text-2xl font-bold text-[#EF6C00]">

                      {formatCurrency(
                        data.summary
                          .totalOutstanding
                      )}

                    </span>

                    <span className="text-sm text-[#374151]/50">

                      ل.س

                    </span>

                  </div>

                </div>


                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF3E0]">

                  <CircleDollarSign className="h-6 w-6 text-[#EF6C00]" />

                </div>

              </div>

            </CardContent>

          </Card>


          {/* عدد العملاء */}

          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-[#374151]/60">

                    العملاء المدينون

                  </p>

                  <div className="mt-2 flex items-baseline gap-2">

                    <span className="text-2xl font-bold text-[#2E7D32]">

                      {formatCurrency(
                        data.summary
                          .totalCustomers
                      )}

                    </span>

                    <span className="text-sm text-[#374151]/50">

                      عميل

                    </span>

                  </div>

                </div>


                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5E9]">

                  <Users className="h-6 w-6 text-[#2E7D32]" />

                </div>

              </div>

            </CardContent>

          </Card>


          {/* عدد الفواتير */}

          <Card className="border-gray-100 bg-white shadow-sm">

            <CardContent className="p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-[#374151]/60">

                    الفواتير المستحقة

                  </p>

                  <div className="mt-2 flex items-baseline gap-2">

                    <span className="text-2xl font-bold text-[#2E7D32]">

                      {formatCurrency(
                        data.summary
                          .totalInvoices
                      )}

                    </span>

                    <span className="text-sm text-[#374151]/50">

                      فاتورة

                    </span>

                  </div>

                </div>


                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5E9]">

                  <FileText className="h-6 w-6 text-[#2E7D32]" />

                </div>

              </div>

            </CardContent>

          </Card>

        </div>


        {/* =================================================
            Main Card
        ================================================= */}

        <Card className="overflow-hidden border-gray-100 bg-white shadow-sm">


          {/* Header */}

          <CardHeader className="border-b border-gray-100">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">


              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">

                  <UserRound className="h-5 w-5 text-[#EF6C00]" />

                </div>


                <div>

                  <CardTitle className="text-lg text-[#374151]">

                    العملاء المستحق عليهم

                  </CardTitle>

                  <CardDescription>

                    يتم تجميع جميع الفواتير الخاصة بكل عميل

                  </CardDescription>

                </div>

              </div>


              {/* Search */}

              <div className="relative w-full md:w-80">

                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  className="h-10 border-gray-200 bg-[#FDFBF7] pr-9 text-right focus-visible:ring-[#2E7D32]"
                />

              </div>

            </div>

          </CardHeader>


          {/* Content */}

          <CardContent className="p-0">


            {/* لا يوجد مستحقات */}

            {filteredCustomers.length === 0 ? (

              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9]">

                  <WalletCards className="h-7 w-7 text-[#2E7D32]" />

                </div>


                <h3 className="mt-4 text-base font-bold text-[#374151]">

                  لا توجد مستحقات

                </h3>


                <p className="mt-1 text-sm text-[#374151]/50">

                  لا يوجد حاليًا عملاء لديهم مبالغ مستحقة

                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[950px]">


                  {/* Table Header */}

                  <thead>

                    <tr className="border-b border-gray-100 bg-[#FDFBF7]">

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">

                        العميل

                      </th>


                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">

                        الفواتير

                      </th>


                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">

                        إجمالي الفواتير

                      </th>


                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">

                        المدفوع

                      </th>


                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">

                        المتبقي

                      </th>


                      <th className="px-5 py-4 text-center text-sm font-bold text-[#374151]">

                        التفاصيل

                      </th>

                    </tr>

                  </thead>


                  {/* Table Body */}

                  <tbody>

                    {filteredCustomers.map(
                      (customer) => {

                        const isExpanded =
                          expandedCustomer ===
                          customer.id;


                        return (
                          <React.Fragment key={customer.id}>

                            {/* =================================
                                Customer Row
                            ================================= */}

                            <tr
                              key={customer.id}
                              className="border-b border-gray-100 transition-colors hover:bg-[#FDFBF7]"
                            >


                              {/* العميل */}

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F5E9]">

                                    <UserRound className="h-4 w-4 text-[#2E7D32]" />

                                  </div>


                                  <div>

                                    <p className="font-medium text-[#374151]">

                                      {customer.name}

                                    </p>


                                    {customer.phone && (

                                      <div className="mt-1 flex items-center gap-1 text-xs text-[#374151]/50">

                                        <Phone className="h-3 w-3 text-[#2E7D32]" />

                                        <span dir="ltr">

                                          {customer.phone}

                                        </span>

                                      </div>

                                    )}

                                  </div>

                                </div>

                              </td>


                              {/* عدد الفواتير */}

                              <td className="px-5 py-4">

                                <Badge
                                  variant="outline"
                                  className="border-[#2E7D32]/30 bg-[#E8F5E9] text-[#2E7D32]"
                                >

                                  {customer.invoiceCount}

                                  {' '}

                                  {customer.invoiceCount === 1
                                    ? 'فاتورة'
                                    : 'فواتير'}

                                </Badge>

                              </td>


                              {/* إجمالي الفواتير */}

                              <td className="px-5 py-4 font-semibold text-[#374151]">

                                {formatCurrency(
                                  customer.total
                                )}

                                {' '}

                                <span className="text-xs font-normal text-[#374151]/50">

                                  ل.س

                                </span>

                              </td>


                              {/* المدفوع */}

                              <td className="px-5 py-4 font-semibold text-[#2E7D32]">

                                {formatCurrency(
                                  customer.paidAmount
                                )}

                                {' '}

                                <span className="text-xs font-normal text-[#374151]/50">

                                  ل.س

                                </span>

                              </td>


                              {/* المتبقي */}

                              <td className="px-5 py-4">

                                <span className="font-bold text-[#EF6C00]">

                                  {formatCurrency(
                                    customer.remainingAmount
                                  )}

                                </span>

                                {' '}

                                <span className="text-xs text-[#374151]/50">

                                  ل.س

                                </span>

                              </td>


                              {/* التفاصيل */}

                              <td className="px-5 py-4">

                                <div className="flex justify-center">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleCustomer(
                                        customer.id
                                      )
                                    }
                                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#374151] transition-colors hover:border-[#2E7D32]/30 hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
                                  >

                                    {isExpanded
                                      ? 'إخفاء'
                                      : 'عرض الفواتير'}

                                    {isExpanded ? (

                                      <ChevronUp className="h-4 w-4" />

                                    ) : (

                                      <ChevronDown className="h-4 w-4" />

                                    )}

                                  </button>

                                </div>

                              </td>

                            </tr>


                            {/* =================================
                                Invoice Details
                            ================================= */}

                            {isExpanded && (

                              <tr
                                key={`${customer.id}-details`}
                                className="border-b border-gray-100 bg-[#FDFBF7]"
                              >

                                <td
                                  colSpan={6}
                                  className="px-5 py-5"
                                >

                                  <div className="rounded-xl border border-gray-200 bg-white">

                                    <div className="border-b border-gray-100 px-4 py-3">

                                      <div className="flex items-center gap-2">

                                        <FileText className="h-4 w-4 text-[#2E7D32]" />

                                        <span className="text-sm font-bold text-[#374151]">

                                          الفواتير المستحقة للعميل

                                        </span>

                                      </div>

                                    </div>


                                    <div className="overflow-x-auto">

                                      <table className="w-full min-w-[750px]">

                                        <thead>

                                          <tr className="border-b border-gray-100 bg-[#FDFBF7]">

                                            <th className="px-4 py-3 text-right text-xs font-bold text-[#374151]">

                                              التاريخ

                                            </th>


                                            <th className="px-4 py-3 text-right text-xs font-bold text-[#374151]">

                                              إجمالي الفاتورة

                                            </th>


                                            <th className="px-4 py-3 text-right text-xs font-bold text-[#374151]">

                                              المدفوع

                                            </th>


                                            <th className="px-4 py-3 text-right text-xs font-bold text-[#374151]">

                                              المتبقي

                                            </th>


                                            <th className="px-4 py-3 text-right text-xs font-bold text-[#374151]">

                                              الحالة

                                            </th>

                                          </tr>

                                        </thead>


                                        <tbody>

                                          {customer.invoices.map(
                                            (invoice) => (

                                              <tr
                                                key={invoice.id}
                                                className="border-b border-gray-100 last:border-b-0"
                                              >

                                                <td className="px-4 py-3 text-sm text-[#374151]/70">

                                                  {formatDate(
                                                    invoice.date
                                                  )}

                                                </td>


                                                <td className="px-4 py-3 font-semibold text-[#374151]">

                                                  {formatCurrency(
                                                    invoice.total
                                                  )}

                                                  {' '}

                                                  <span className="text-xs font-normal text-[#374151]/50">

                                                    ل.س

                                                  </span>

                                                </td>


                                                <td className="px-4 py-3 font-semibold text-[#2E7D32]">

                                                  {formatCurrency(
                                                    invoice.paidAmount
                                                  )}

                                                  {' '}

                                                  <span className="text-xs font-normal text-[#374151]/50">

                                                    ل.س

                                                  </span>

                                                </td>


                                                <td className="px-4 py-3 font-bold text-[#EF6C00]">

                                                  {formatCurrency(
                                                    invoice.remainingAmount
                                                  )}

                                                  {' '}

                                                  <span className="text-xs font-normal text-[#374151]/50">

                                                    ل.س

                                                  </span>

                                                </td>


                                                <td className="px-4 py-3">

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

                                              </tr>

                                            )
                                          )}

                                        </tbody>

                                      </table>

                                    </div>

                                  </div>

                                </td>

                              </tr>

                            )}

                            </React.Fragment>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </CardContent>

        </Card>


        {/* =================================================
            Footer Information
        ================================================= */}

        {data.customers.length > 0 && (

          <div className="flex items-center gap-2 rounded-xl border border-[#EF6C00]/20 bg-[#FFF3E0] px-4 py-3 text-sm text-[#374151]">

            <CircleDollarSign className="h-4 w-4 shrink-0 text-[#EF6C00]" />

            <span>

              إجمالي المبلغ المطلوب تحصيله من جميع العملاء:

            </span>

            <strong className="text-[#EF6C00]">

              {formatCurrency(
                data.summary.totalOutstanding
              )}

              {' '}

              ل.س

            </strong>

          </div>

        )}

      </div>

    </main>
  );
}