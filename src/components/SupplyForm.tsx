// src/components/SupplyForm.tsx
'use client';

import { useState } from 'react';
import {
  Banknote,
  CalendarClock,
  CalendarDays,
  FileText,
  Info,
  Layers,
  Loader2,
  Package,
  Save,
  Scale,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../@/components/ui/card';

import { Button } from '../../@/components/ui/button';
import { Input } from '../../@/components/ui/input';
import { Label } from '../../@/components/ui/label';

import {
  Alert,
  AlertDescription,
} from '../../@/components/ui/alert';
export default function SupplyForm() {
  const [formData, setFormData] = useState({
    type: 'FEED',
    name: '',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/supplies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          price: parseInt(formData.price),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ تم إدخال المستلزمات بنجاح');
        setFormData({
          type: 'FEED',
          name: '',
          quantity: '',
          price: '',
          date: new Date().toISOString().split('T')[0],
          expiryDate: ''
        });
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (err) {
      setMessage('❌ حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <Card className="border-gray-100 bg-white shadow-sm">
  <CardHeader className="pb-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
        <Package className="h-5 w-5 text-[#EF6C00]" />
      </div>

      <div>
        <CardTitle className="text-xl font-bold text-[#EF6C00]">
          إدخال المستلزمات
        </CardTitle>

        <CardDescription className="mt-1 text-[#374151]/60">
          تسجيل مستلزمات ومشتريات المزرعة
        </CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* بيانات المستلزم */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* النوع */}
        <div className="space-y-2">
          <Label
            htmlFor="supplyType"
            className="font-medium text-[#374151]"
          >
            النوع
          </Label>

          <div className="relative">
            <Layers className="absolute right-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

            <select
              id="supplyType"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                })
              }
              required
              disabled={loading}
              className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-[#FDFBF7] px-4 pr-10 text-sm text-[#374151] outline-none transition-all focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="FEED">علف</option>
              <option value="VACCINE">لقاح</option>
              <option value="OTHER">أخرى</option>
            </select>
          </div>
        </div>

        {/* الاسم */}
        <div className="space-y-2">
          <Label
            htmlFor="supplyName"
            className="font-medium text-[#374151]"
          >
            الاسم
          </Label>

          <div className="relative">
            <FileText className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

            <Input
              id="supplyName"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              required
              disabled={loading}
              placeholder="مثال: علف دواجن"
              className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
            />
          </div>
        </div>

        {/* الكمية */}
        <div className="space-y-2">
          <Label
            htmlFor="quantity"
            className="font-medium text-[#374151]"
          >
            الكمية
          </Label>

          <div className="relative">
            <Scale className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: e.target.value,
                })
              }
              required
              min="0"
              step="any"
              disabled={loading}
              placeholder="مثال: 100"
              className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
            />
          </div>
        </div>

        {/* السعر */}
        <div className="space-y-2">
          <Label
            htmlFor="price"
            className="font-medium text-[#374151]"
          >
            السعر (ل.س)
          </Label>

          <div className="relative">
            <Banknote className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: e.target.value,
                })
              }
              required
              min="0"
              step="any"
              disabled={loading}
              placeholder="مثال: 500000"
              className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
            />
          </div>
        </div>

        {/* التاريخ */}
        <div className="space-y-2">
          <Label
            htmlFor="supplyDate"
            className="font-medium text-[#374151]"
          >
            التاريخ
          </Label>

          <div className="relative">
            <CalendarDays className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

            <Input
              id="supplyDate"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: e.target.value,
                })
              }
              required
              disabled={loading}
              className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
            />
          </div>
        </div>

        {/* تاريخ الانتهاء */}
        <div className="space-y-2">
          <Label
            htmlFor="expiryDate"
            className="font-medium text-[#374151]"
          >
            تاريخ الانتهاء
            <span className="mr-1 text-xs font-normal text-gray-400">
              (اختياري)
            </span>
          </Label>

          <div className="relative">
            <CalendarClock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expiryDate: e.target.value,
                })
              }
              disabled={loading}
              className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
            />
          </div>
        </div>

      </div>

      {/* ملاحظة تاريخ الانتهاء */}
      <div className="flex items-start gap-2 rounded-xl border border-[#EF6C00]/20 bg-[#FFF3E0] p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#EF6C00]" />

        <p className="text-xs leading-5 text-[#374151]">
          تاريخ الانتهاء اختياري، ويُنصح بتعبئته للمواد التي لها
          مدة صلاحية مثل اللقاحات والأدوية.
        </p>
      </div>

      {/* رسالة العملية */}
      {message && (
        <Alert
          className={
            message.startsWith('✅')
              ? 'rounded-xl border-[#2E7D32]/20 bg-[#E8F5E9] text-[#2E7D32]'
              : 'rounded-xl border-[#EF6C00]/20 bg-[#FFF3E0] text-[#EF6C00]'
          }
        >
          <AlertDescription className="text-sm font-medium">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* زر الحفظ */}
      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-xl bg-[#2E7D32] text-white transition-all duration-300 hover:bg-[#2E7D32]/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            حفظ المستلزمات
          </>
        )}
      </Button>

    </form>
  </CardContent>
</Card>
    </div>
  );
}