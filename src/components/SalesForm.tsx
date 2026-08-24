// src/components/SalesForm.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  Loader2,
  Package,
  Phone,
  Save,
  ShoppingCart,
  User,
  Users,
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

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
};

type Invoice = {
  id: string;
  number: string;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
};

type FormData = {
  trayCount: string;
  pricePerTray: string;
  paidAmount: string;
  customerName: string;
  customerPhone: string;
  date: string;
};

const getLocalDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const initialFormData = (): FormData => ({
  trayCount: '',
  pricePerTray: '',
  paidAmount: '',
  customerName: '',
  customerPhone: '',
  date: getLocalDate(),
});

export default function SalesForm() {
  const [formData, setFormData] = useState<FormData>(
    initialFormData()
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<string>('');

  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] =
    useState(false);

  const [message, setMessage] = useState('');
  const [lastInvoice, setLastInvoice] =
    useState<Invoice | null>(null);

  /**
   * حساب إجمالي البيع
   */
  const trayCount = Number(formData.trayCount);
  const pricePerTray = Number(formData.pricePerTray);

  const total =
    Number.isFinite(trayCount) &&
    Number.isFinite(pricePerTray) &&
    trayCount > 0 &&
    pricePerTray > 0
      ? trayCount * pricePerTray
      : 0;

  /**
   * المبلغ المستلم
   */
  const paidAmount =
    formData.paidAmount.trim() === ''
      ? 0
      : Number(formData.paidAmount);

  /**
   * حساب المتبقي
   */
  const remainingAmount =
    total > 0 && Number.isFinite(paidAmount)
      ? Math.max(total - paidAmount, 0)
      : total;

  /**
   * حالة الدفع
   */
  const paymentStatus =
    paidAmount <= 0
      ? 'UNPAID'
      : paidAmount < total
        ? 'PARTIAL'
        : 'PAID';

  /**
   * تنسيق المبالغ
   */
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US');
  };

  /**
   * جلب العملاء
   */
  const fetchCustomers = async () => {
    setLoadingCustomers(true);

    try {
      const res = await fetch('/api/customers', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid customers response');
      }

      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  /**
   * تحميل العملاء عند فتح الصفحة
   */
  useEffect(() => {
    fetchCustomers();
  }, []);

  /**
   * تغيير الحقول
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * تغيير العميل
   */
  const handleCustomerChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const customerId = e.target.value;

    setSelectedCustomer(customerId);

    if (customerId) {
      const customer = customers.find(
        (item) => item.id === customerId
      );

      if (customer) {
        setFormData((prev) => ({
          ...prev,
          customerName: customer.name,
          customerPhone: customer.phone ?? '',
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        customerName: '',
        customerPhone: '',
      }));
    }
  };

  /**
   * إرسال المبيعات
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage('');
    setLoading(true);
    setLastInvoice(null);

    try {
      /**
       * التحقق من العميل
       */
      if (!selectedCustomer) {
        if (!formData.customerName.trim()) {
          setMessage('❌ يرجى إدخال اسم العميل');
          return;
        }
      }

      /**
       * التحقق من عدد الأطباق
       */
      if (!formData.trayCount.trim()) {
        setMessage('❌ يرجى إدخال عدد الأطباق');
        return;
      }

      /**
       * التحقق من السعر
       */
      if (!formData.pricePerTray.trim()) {
        setMessage('❌ يرجى إدخال سعر الطبق');
        return;
      }

      /**
       * التحقق من عدد الأطباق
       */
      if (!Number.isInteger(trayCount) || trayCount <= 0) {
        setMessage(
          '❌ عدد الأطباق يجب أن يكون رقمًا صحيحًا أكبر من صفر'
        );
        return;
      }

      /**
       * التحقق من السعر
       */
      if (
        !Number.isInteger(pricePerTray) ||
        pricePerTray <= 0
      ) {
        setMessage(
          '❌ سعر الطبق يجب أن يكون رقمًا صحيحًا أكبر من صفر'
        );
        return;
      }

      /**
       * التحقق من المبلغ المدفوع
       */
      if (
        !Number.isInteger(paidAmount) ||
        paidAmount < 0
      ) {
        setMessage(
          '❌ المبلغ المستلم يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي صفر'
        );
        return;
      }

      /**
       * منع دفع مبلغ أكبر من قيمة الفاتورة
       */
      if (paidAmount > total) {
        setMessage(
          '❌ المبلغ المستلم لا يمكن أن يكون أكبر من إجمالي الفاتورة'
        );
        return;
      }

      /**
       * إنشاء Payload
       */
      const payload = {
        trayCount,
        pricePerTray,
        paidAmount,
        date: formData.date,

        ...(selectedCustomer
          ? {
              customerId: selectedCustomer,
            }
          : {
              customerName:
                formData.customerName.trim(),
              customerPhone:
                formData.customerPhone.trim(),
            }),
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
            'حدث خطأ أثناء إدخال المبيعات'
        );
      }

      /**
       * حفظ بيانات الفاتورة
       */
      if (data?.invoice) {
        setLastInvoice(data.invoice);
      }

      setMessage(
        data?.invoice?.paymentStatus === 'PAID'
          ? '✅ تم حفظ البيع — الفاتورة مدفوعة بالكامل'
          : data?.invoice?.paymentStatus === 'PARTIAL'
            ? `⚠️ تم حفظ البيع — المتبقي ${formatAmount(
                data.invoice.remainingAmount
              )} ل.س`
            : `⚠️ تم حفظ البيع — الفاتورة غير مدفوعة`
      );

      /**
       * إعادة ضبط النموذج
       */
      setFormData(initialFormData());
      setSelectedCustomer('');

      /**
       * تحديث العملاء
       */
      await fetchCustomers();
    } catch (error) {
      console.error('Error creating sale:', error);

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : '❌ حدث خطأ غير متوقع'
      );
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
              <ShoppingCart className="h-5 w-5 text-[#EF6C00]" />
            </div>

            <div>
              <CardTitle className="text-xl font-bold text-[#EF6C00]">
                إدخال المبيعات
              </CardTitle>

              <CardDescription className="mt-1 text-[#374151]/60">
                تسجيل عملية بيع جديدة
              </CardDescription>
            </div>

          </div>
        </CardHeader>

        <CardContent>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* بيانات العميل */}

            <div className="rounded-2xl border border-gray-100 bg-[#FDFBF7] p-4">

              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-[#2E7D32]" />

                <h3 className="font-semibold text-[#374151]">
                  بيانات العميل
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* اسم العميل */}

                <div className="space-y-2">

                  <Label
                    htmlFor="customerName"
                    className="font-medium text-[#374151]"
                  >
                    اسم العميل
                  </Label>

                  <div className="relative">

                    <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

                    <Input
                      id="customerName"
                      name="customerName"
                      type="text"
                      value={formData.customerName}
                      onChange={handleChange}
                      disabled={
                        loading || !!selectedCustomer
                      }
                      placeholder="أدخل اسم العميل"
                      className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                    />

                  </div>

                </div>

                {/* الهاتف */}

                <div className="space-y-2">

                  <Label
                    htmlFor="customerPhone"
                    className="font-medium text-[#374151]"
                  >
                    رقم الهاتف
                  </Label>

                  <div className="relative">

                    <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      disabled={
                        loading || !!selectedCustomer
                      }
                      placeholder="مثال: 09xxxxxxxx"
                      className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                    />

                  </div>

                </div>

              </div>
            </div>

            {/* اختيار عميل موجود */}

            <div className="space-y-2">

              <Label
                htmlFor="customer"
                className="font-medium text-[#374151]"
              >
                اختر عميلاً موجوداً
              </Label>

              <div className="relative">

                <Users className="absolute right-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

                <select
                  id="customer"
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  disabled={
                    loading || loadingCustomers
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-[#FDFBF7] px-4 pr-10 text-sm text-[#374151] outline-none transition-all focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <option value="">
                    -- عميل جديد --
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                      {customer.phone
                        ? ` - ${customer.phone}`
                        : ''}
                    </option>
                  ))}

                </select>

              </div>

              <p className="text-xs text-gray-500">
                يمكنك اختيار عميل مسجل مسبقاً أو إدخال بيانات عميل جديد.
              </p>

            </div>

            {/* تفاصيل البيع */}

            <div className="rounded-2xl border border-gray-100 bg-white p-4">

              <div className="mb-4 flex items-center gap-2">

                <ShoppingCart className="h-5 w-5 text-[#2E7D32]" />

                <h3 className="font-semibold text-[#374151]">
                  تفاصيل المبيعات
                </h3>

              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* عدد الأطباق */}

                <div className="space-y-2">

                  <Label
                    htmlFor="trayCount"
                    className="font-medium text-[#374151]"
                  >
                    عدد الأطباق
                  </Label>

                  <div className="relative">

                    <Package className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

                    <Input
                      id="trayCount"
                      name="trayCount"
                      type="number"
                      value={formData.trayCount}
                      onChange={handleChange}
                      required
                      min="1"
                      disabled={loading}
                      placeholder="مثال: 10"
                      className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                    />

                  </div>

                </div>

                {/* سعر الطبق */}

                <div className="space-y-2">

                  <Label
                    htmlFor="pricePerTray"
                    className="font-medium text-[#374151]"
                  >
                    سعر الطبق (ل.س)
                  </Label>

                  <div className="relative">

                    <Banknote className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

                    <Input
                      id="pricePerTray"
                      name="pricePerTray"
                      type="number"
                      value={formData.pricePerTray}
                      onChange={handleChange}
                      required
                      min="1"
                      disabled={loading}
                      placeholder="مثال: 150000"
                      className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                    />

                  </div>

                </div>

                {/* التاريخ */}

                <div className="space-y-2">

                  <Label
                    htmlFor="salesDate"
                    className="font-medium text-[#374151]"
                  >
                    التاريخ
                  </Label>

                  <div className="relative">

                    <CalendarDays className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

                    <Input
                      id="salesDate"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                    />

                  </div>

                </div>

                {/* المبلغ المستلم */}

                <div className="space-y-2">

                  <Label
                    htmlFor="paidAmount"
                    className="font-medium text-[#374151]"
                  >
                    المبلغ المستلم (ل.س)
                  </Label>

                  <div className="relative">

                    <Banknote className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

                    <Input
                      id="paidAmount"
                      name="paidAmount"
                      type="number"
                      value={formData.paidAmount}
                      onChange={handleChange}
                      min="0"
                      max={total || undefined}
                      disabled={loading}
                      placeholder="0"
                      className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                    />

                  </div>

                  <p className="text-xs text-gray-500">
                    اتركه 0 إذا لم يدفع العميل أي مبلغ.
                  </p>

                </div>

              </div>

              {/* ملخص الدفع */}

              {total > 0 && (

                <div className="mt-5 rounded-2xl border border-gray-100 bg-[#FDFBF7] p-4">

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    {/* الإجمالي */}

                    <div>

                      <p className="text-sm text-gray-500">
                        إجمالي البيع
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#374151]">
                        {formatAmount(total)} ل.س
                      </p>

                    </div>

                    {/* المدفوع */}

                    <div>

                      <p className="text-sm text-gray-500">
                        المبلغ المستلم
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#2E7D32]">
                        {formatAmount(
                          Number.isFinite(paidAmount)
                            ? paidAmount
                            : 0
                        )}{' '}
                        ل.س
                      </p>

                    </div>

                    {/* المتبقي */}

                    <div>

                      <p className="text-sm text-gray-500">
                        المبلغ المتبقي
                      </p>

                      <p
                        className={`mt-1 text-xl font-bold ${
                          remainingAmount === 0
                            ? 'text-[#2E7D32]'
                            : 'text-[#EF6C00]'
                        }`}
                      >
                        {formatAmount(
                          remainingAmount
                        )}{' '}
                        ل.س
                      </p>

                    </div>

                  </div>

                  {/* حالة الدفع */}

                  <div className="mt-4 border-t border-gray-200 pt-4">

                    {paymentStatus === 'PAID' && (
                      <p className="font-semibold text-[#2E7D32]">
                        ✅ الفاتورة مدفوعة بالكامل
                      </p>
                    )}

                    {paymentStatus === 'PARTIAL' && (
                      <p className="font-semibold text-[#EF6C00]">
                        ⚠️ دفع جزئي — يوجد مبلغ متبقي
                      </p>
                    )}

                    {paymentStatus === 'UNPAID' && (
                      <p className="font-semibold text-red-600">
                        ⚠️ لم يتم استلام أي مبلغ
                      </p>
                    )}

                  </div>

                </div>

              )}

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

            {/* حفظ */}

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
                  حفظ المبيعات
                </>
              )}

            </Button>

          </form>

          {/* نتيجة الفاتورة */}

          {lastInvoice && (

            <div className="mt-5 rounded-2xl border border-[#2E7D32]/20 bg-[#E8F5E9] p-4">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="font-semibold text-[#2E7D32]">
                    تم إنشاء الفاتورة
                  </p>

                  <p className="mt-1 text-sm text-[#374151]">
                    رقم الفاتورة:{' '}
                    <span className="font-bold">
                      {lastInvoice.number}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-[#374151]">
                    المتبقي:{' '}
                    <span className="font-bold">
                      {formatAmount(
                        lastInvoice.remainingAmount
                      )}{' '}
                      ل.س
                    </span>
                  </p>

                </div>

              </div>

            </div>

          )}

        </CardContent>

      </Card>
    </div>
  );
}