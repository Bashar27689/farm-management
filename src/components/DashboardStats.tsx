'use client';

import { useEffect, useState } from 'react';

import {
  CalendarDays,
  CircleDollarSign,
  Egg,
  FileText,
  ShoppingCart,
  TrendingUp,
  SlidersVertical,
  ArrowLeft,
} from 'lucide-react';

import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../@/components/ui/card';

type Receivable = {
  id: string;
  date: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
};

export default function DashboardStats() {
  const [data, setData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');

        if (!res.ok) {
          throw new Error('Failed to fetch dashboard');
        }

        const result = await res.json();

        setData(result);
      } catch (err) {
        console.error(
          'Error fetching dashboard',
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // =====================================================
  // Loading
  // =====================================================

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
            {[1, 2, 3].map((item) => (
              <Card
                key={item}
                className="border-0 shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </main>
    );
  }

  // =====================================================
  // Error
  // =====================================================

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
                حدث خطأ في تحميل بيانات لوحة التحكم
              </p>

            </CardContent>
          </Card>

        </div>
      </main>
    );
  }

  // =====================================================
  // Today's Statistics
  // =====================================================

  const todayStats = [
    {
      title: 'إنتاج اليوم',
      value: data.today?.eggs || 0,
      unit: 'بيضة',
      icon: Egg,
      color: '#2E7D32',
      background: '#E8F5E9',
    },
    {
      title: 'مبيعات اليوم',
      value: (
        data.today?.revenue || 0
      ).toLocaleString(),
      unit: 'ل.س',
      icon: CircleDollarSign,
      color: '#EF6C00',
      background: '#FFF3E0',
    },
    {
      title: 'عدد الأطباق',
      value: data.today?.trays || 0,
      unit: 'طبق',
      icon: Egg,
      color: '#2E7D32',
      background: '#E8F5E9',
    },
  ];

  // =====================================================
  // Receivables
  // =====================================================

  const receivables: Receivable[] =
    data.receivables?.invoices || [];

  const totalReceivables =
    data.receivables?.totalAmount || 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#FDFBF7] p-4 md:p-6"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =====================================================
            Header
        ===================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">

                <SlidersVertical className="h-5 w-5 text-[#2E7D32]" />

              </div>

              <div>

                <h1 className="text-2xl font-bold text-[#374151]">
                  لوحة التحكم
                </h1>

                <p className="text-sm text-[#374151]/60">
                  نظرة سريعة على أداء المزرعة
                </p>

              </div>

            </div>

          </div>

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

        {/* =====================================================
            Today's Statistics
        ===================================================== */}

        <section className="space-y-3">

          <div className="flex items-center gap-2">

            <div className="h-5 w-1 rounded-full bg-[#2E7D32]" />

            <TrendingUp className="h-5 w-5 text-[#2E7D32]" />

            <h2 className="text-lg font-bold text-[#374151]">
              إحصائيات اليوم
            </h2>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {todayStats.map((stat) => {

              const Icon = stat.icon;

              return (
                <Card
                  key={stat.title}
                  className="border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >

                  <CardContent className="p-5">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-sm font-medium text-[#374151]/60">
                          {stat.title}
                        </p>

                        <div className="mt-2 flex items-baseline gap-2">

                          <span
                            className="text-2xl font-bold"
                            style={{
                              color: stat.color,
                            }}
                          >
                            {stat.value}
                          </span>

                          <span className="text-sm text-[#374151]/50">
                            {stat.unit}
                          </span>

                        </div>

                      </div>

                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor:
                            stat.background,
                        }}
                      >

                        <Icon
                          className="h-6 w-6"
                          style={{
                            color: stat.color,
                          }}
                        />

                      </div>

                    </div>

                  </CardContent>

                </Card>
              );
            })}

          </div>

        </section>

        {/* =====================================================
            Receivables
        ===================================================== */}

        <section className="space-y-3">

          <div className="flex items-center gap-2">

            <div className="h-5 w-1 rounded-full bg-[#EF6C00]" />

            <CircleDollarSign className="h-5 w-5 text-[#EF6C00]" />

            <h2 className="text-lg font-bold text-[#374151]">
              المستحقات
            </h2>

          </div>

          <Card className="overflow-hidden border-gray-100 bg-white shadow-sm">

            <CardHeader className="border-b border-gray-100">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">

                    <FileText className="h-5 w-5 text-[#EF6C00]" />

                  </div>

                  <div>

                    <CardTitle className="text-lg text-[#374151]">
                      أعلى 5 مستحقات
                    </CardTitle>

                    <CardDescription>
                      الفواتير التي لم يتم تحصيل كامل قيمتها
                    </CardDescription>

                  </div>

                </div>

                {receivables.length > 0 && (
                  <div className="rounded-lg bg-[#FFF3E0] px-3 py-2">

                    <p className="text-xs text-[#374151]/60">
                      إجمالي المستحقات المعروضة
                    </p>

                    <p className="mt-0.5 text-lg font-bold text-[#EF6C00]">

                      {totalReceivables.toLocaleString()} ل.س

                    </p>

                  </div>
                )}

              </div>

            </CardHeader>

            <CardContent className="p-0">

              {receivables.length === 0 ? (

                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">

                    <CircleDollarSign className="h-6 w-6 text-[#2E7D32]" />

                  </div>

                  <h3 className="mt-4 text-base font-bold text-[#374151]">
                    لا توجد مستحقات
                  </h3>

                  <p className="mt-1 text-sm text-[#374151]/50">
                    جميع الفواتير مسددة بالكامل
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-gray-100">

                  {receivables.map(
                    (invoice) => (

                      <div
                        key={invoice.id}
                        className="flex flex-col gap-4 p-4 transition-colors hover:bg-[#FDFBF7] sm:flex-row sm:items-center sm:justify-between"
                      >

                        {/* العميل والتاريخ */}

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E0]">

                            <FileText className="h-5 w-5 text-[#EF6C00]" />

                          </div>

                          <div>

                            <p className="font-semibold text-[#374151]">

                              {invoice.customer.name}

                            </p>

                            <p className="mt-1 text-xs text-[#374151]/50">

                              تاريخ الفاتورة:{' '}

                              {new Date(
                                invoice.date
                              ).toLocaleDateString(
                                'ar-SY'
                              )}

                            </p>

                          </div>

                        </div>

                        {/* المبلغ */}

                        <div className="flex items-center justify-between gap-6 sm:justify-end">

                          <div className="text-right">

                            <p className="text-xs text-[#374151]/50">
                              المبلغ المستحق
                            </p>

                            <p className="mt-1 text-lg font-bold text-[#EF6C00]">

                              {invoice.remainingAmount.toLocaleString()}{' '}
                              ل.س

                            </p>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </CardContent>

           

          </Card>

        </section>

        {/* =====================================================
            Recent Sales
        ===================================================== */}

        {data.recent?.sales?.length > 0 && (
          <Card className="border-gray-100 bg-white shadow-sm">

            <CardHeader className="border-b border-gray-100">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">

                  <ShoppingCart className="h-5 w-5 text-[#EF6C00]" />

                </div>

                <div>

                  <CardTitle className="text-lg text-[#374151]">
                    آخر 5 مبيعات
                  </CardTitle>

                  <CardDescription>
                    أحدث عمليات البيع
                  </CardDescription>

                </div>

              </div>

            </CardHeader>

            <CardContent className="p-0">

              <div className="divide-y divide-gray-100">

                {data.recent.sales.map(
                  (sale: any) => (

                    <div
                      key={sale.id}
                      className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-[#FDFBF7]"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F5E9]">

                          <ShoppingCart className="h-4 w-4 text-[#2E7D32]" />

                        </div>

                        <div>

                          <p className="font-medium text-[#374151]">

                            {sale.customer?.name || 'عميل نقدي'}

                          </p>

                          <p className="text-xs text-[#374151]/50">

                            {sale.trayCount} طبق

                          </p>

                        </div>

                      </div>

                      <p className="font-bold text-[#2E7D32]">

                        {sale.total.toLocaleString()} ل.س

                      </p>

                    </div>

                  )
                )}

              </div>

            </CardContent>

          </Card>
        )}

        {/* =====================================================
            Recent Production
        ===================================================== */}

        {data.recent?.production?.length > 0 && (
          <Card className="border-gray-100 bg-white shadow-sm">

            <CardHeader className="border-b border-gray-100">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">

                  <Egg className="h-5 w-5 text-[#2E7D32]" />

                </div>

                <div>

                  <CardTitle className="text-lg text-[#374151]">
                    آخر 5 إنتاج
                  </CardTitle>

                  <CardDescription>
                    أحدث عمليات إنتاج البيض
                  </CardDescription>

                </div>

              </div>

            </CardHeader>

            <CardContent className="p-0">

              <div className="divide-y divide-gray-100">

                {data.recent.production.map(
                  (prod: any) => (

                    <div
                      key={prod.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F5E9]">

                          <Egg className="h-4 w-4 text-[#2E7D32]" />

                        </div>

                        <div>

                          <p className="text-sm font-medium text-[#374151]">

                            {new Date(
                              prod.date
                            ).toLocaleDateString(
                              'ar-SY'
                            )}

                          </p>

                          <p className="text-xs text-[#374151]/50">
                            تاريخ الإنتاج
                          </p>

                        </div>

                      </div>

                      <p className="font-bold text-[#2E7D32]">

                        {prod.eggCount.toLocaleString()} بيضة

                      </p>

                    </div>

                  )
                )}

              </div>

            </CardContent>

          </Card>
        )}

      </div>
    </main>
  );
}