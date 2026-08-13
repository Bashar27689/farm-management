'use client';

import { useEffect, useState } from 'react';
import {
  ArrowUpLeft,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Egg,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../@/components/ui/card';

import { Badge } from '../../@/components/ui/badge';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../@/components/ui/table';

export default function DashboardStats() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      setLoading(false);
    }
  };

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
              <Card key={item} className="border-0 shadow-sm">
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

  const todayStats = [
    {
      title: 'بيض اليوم',
      value: data.today?.eggs || 0,
      unit: 'بيضة',
      icon: Egg,
      color: '#2E7D32',
      background: '#E8F5E9',
    },
    {
      title: 'مبيعات اليوم',
      value: (data.today?.revenue || 0).toLocaleString(),
      unit: 'ل.س',
      icon: CircleDollarSign,
      color: '#EF6C00',
      background: '#FFF3E0',
    },
    {
      title: 'أطباق اليوم',
      value: data.today?.trays || 0,
      unit: 'طبق',
      icon: Package,
      color: '#2E7D32',
      background: '#E8F5E9',
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#FDFBF7] p-4 md:p-6"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <TrendingUp className="h-5 w-5 text-[#2E7D32]" />
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
              {new Date().toLocaleDateString('ar-SY', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Today */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-[#2E7D32]" />

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
                            style={{ color: stat.color }}
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
                        style={{ backgroundColor: stat.background }}
                      >
                        <Icon
                          className="h-6 w-6"
                          style={{ color: stat.color }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* General Statistics */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-[#2E7D32]" />

            <h2 className="text-lg font-bold text-[#374151]">
              الإحصائيات العامة
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <Card className="border-gray-100 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
                    <Users className="h-5 w-5 text-[#2E7D32]" />
                  </div>

                  <div>
                    <CardTitle className="text-base text-[#374151]">
                      العملاء
                    </CardTitle>

                    <CardDescription>
                      إجمالي العملاء
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-2xl font-bold text-[#2E7D32]">
                  {data.total?.customers || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-100 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
                    <Warehouse className="h-5 w-5 text-[#EF6C00]" />
                  </div>

                  <div>
                    <CardTitle className="text-base text-[#374151]">
                      المستلزمات
                    </CardTitle>

                    <CardDescription>
                      إجمالي المستلزمات
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-2xl font-bold text-[#EF6C00]">
                  {data.total?.supplies || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-100 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
                    <CircleDollarSign className="h-5 w-5 text-[#2E7D32]" />
                  </div>

                  <div>
                    <CardTitle className="text-base text-[#374151]">
                      تكلفة المستلزمات
                    </CardTitle>

                    <CardDescription>
                      إجمالي التكلفة
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-2xl font-bold text-[#2E7D32]">
                  {(data.total?.supplyCost || 0).toLocaleString()}
                  <span className="mr-1 text-sm font-normal text-[#374151]/50">
                    ل.س
                  </span>
                </p>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Recent Sales */}
        {data.recent?.sales?.length > 0 && (
          <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
                    <ShoppingCart className="h-5 w-5 text-[#EF6C00]" />
                  </div>

                  <div>
                    <CardTitle className="text-lg text-[#374151]">
                      آخر المبيعات
                    </CardTitle>

                    <CardDescription>
                      أحدث عمليات البيع
                    </CardDescription>
                  </div>
                </div>

                <ArrowUpLeft className="h-5 w-5 text-[#374151]/30" />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {data.recent.sales.map((sale: any) => (
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
                          {sale.shopName}
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Production */}
        {data.recent?.production?.length > 0 && (
          <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
                  <Egg className="h-5 w-5 text-[#2E7D32]" />
                </div>

                <div>
                  <CardTitle className="text-lg text-[#374151]">
                    آخر الإنتاج
                  </CardTitle>

                  <CardDescription>
                    أحدث عمليات إنتاج البيض
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {data.recent.production.map((prod: any) => (
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
                          {new Date(prod.date).toLocaleDateString('ar-SY')}
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Supplies */}
        {data.recent?.supplies?.length > 0 && (
          <Card className="overflow-hidden border-gray-100 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
                  <Boxes className="h-5 w-5 text-[#EF6C00]" />
                </div>

                <div>
                  <CardTitle className="text-lg text-[#374151]">
                    آخر المستلزمات
                  </CardTitle>

                  <CardDescription>
                    أحدث المشتريات والمستلزمات
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FDFBF7] hover:bg-[#FDFBF7]">
                      <TableHead className="text-right font-bold text-[#374151]">
                        التاريخ
                      </TableHead>

                      <TableHead className="text-right font-bold text-[#374151]">
                        النوع
                      </TableHead>

                      <TableHead className="text-right font-bold text-[#374151]">
                        المورد
                      </TableHead>

                      <TableHead className="text-right font-bold text-[#374151]">
                        الكمية
                      </TableHead>

                      <TableHead className="text-right font-bold text-[#374151]">
                        السعر
                      </TableHead>

                      <TableHead className="text-right font-bold text-[#374151]">
                        المجموع
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.recent.supplies.map((supply: any) => (
                      <TableRow
                        key={supply.id}
                        className="hover:bg-[#FDFBF7]"
                      >
                        <TableCell className="text-sm text-[#374151]/70">
                          {new Date(supply.date).toLocaleDateString('ar-SY')}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              supply.type === 'FEED'
                                ? 'border-[#2E7D32]/30 bg-[#E8F5E9] text-[#2E7D32]'
                                : supply.type === 'VACCINE'
                                  ? 'border-[#EF6C00]/30 bg-[#FFF3E0] text-[#EF6C00]'
                                  : 'border-gray-200 bg-gray-50 text-[#374151]'
                            }
                          >
                            {supply.type === 'FEED'
                              ? 'علف'
                              : supply.type === 'VACCINE'
                                ? 'لقاح'
                                : 'أخرى'}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-medium text-[#374151]">
                          {supply.name}
                        </TableCell>

                        <TableCell className="font-medium text-[#374151]">
                          {supply.quantity}{' '}
                          <span className="text-xs font-normal text-[#374151]/50">
                            {supply.type === 'FEED' ? 'كجم' : 'وحدة'}
                          </span>
                        </TableCell>

                        <TableCell className="font-semibold text-[#2E7D32]">
                          {supply.price.toLocaleString()} ل.س
                        </TableCell>

                        <TableCell className="font-bold text-[#EF6C00]">
                          {(
                            supply.quantity * supply.price
                          ).toLocaleString()}{' '}
                          ل.س
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                  <TableFooter>
                    <TableRow className="bg-[#FDFBF7] hover:bg-[#FDFBF7]">
                      <TableCell
                        colSpan={5}
                        className="text-left font-bold text-[#374151]"
                      >
                        إجمالي التكلفة
                      </TableCell>

                      <TableCell className="font-bold text-[#EF6C00]">
                        {data.recent.supplies
                          .reduce(
                            (sum: number, s: any) =>
                              sum + s.quantity * s.price,
                            0
                          )
                          .toLocaleString()}{' '}
                        ل.س
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  );
}