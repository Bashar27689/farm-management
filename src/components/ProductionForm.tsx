// src/components/ProductionForm.tsx
'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Egg,
  Loader2,
  Save,
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
export default function ProductionForm() {
  const [eggCount, setEggCount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eggCount: parseInt(eggCount), date }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ تم إدخال الإنتاج بنجاح');
        setEggCount('');
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
        <Egg className="h-5 w-5 text-[#EF6C00]" />
      </div>

      <div>
        <CardTitle className="text-xl font-bold text-[#EF6C00]">
          إدخال الإنتاج اليومي
        </CardTitle>

        <CardDescription className="mt-1 text-[#374151]/60">
          تسجيل كمية البيض المنتج خلال اليوم
        </CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* عدد البيض */}
      <div className="space-y-2">
        <Label
          htmlFor="eggCount"
          className="font-medium text-[#374151]"
        >
          عدد البيض المنتج
        </Label>

        <div className="relative">
          <Egg className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

          <Input
            id="eggCount"
            type="number"
            value={eggCount}
            onChange={(e) => setEggCount(e.target.value)}
            required
            disabled={loading}
            placeholder="مثال: 300"
            min="1"
            className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] transition-all placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
          />
        </div>
      </div>

      {/* التاريخ */}
      <div className="space-y-2">
        <Label
          htmlFor="productionDate"
          className="font-medium text-[#374151]"
        >
          التاريخ
        </Label>

        <div className="relative">
          <CalendarDays className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

          <Input
            id="productionDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={loading}
            className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] transition-all focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
          />
        </div>
      </div>

      {/* الرسالة */}
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
            حفظ الإنتاج
          </>
        )}
      </Button>

    </form>
  </CardContent>
</Card>
    </div>
  );
}