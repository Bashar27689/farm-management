// src/components/SalesForm.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Banknote,
  CalendarDays,
  Download,
  FileCheck2,
  Loader2,
  Package,
  Phone,
  Save,
  ShoppingCart,
  Store,
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
} from '../../@/components/ui/alert'

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
};

type Invoice = {
  id: number;
  number: string;
};

type FormData = {
  shopName: string;
  trayCount: string;
  pricePerTray: string;
  customerName: string;
  customerPhone: string;
  date: string;
};

const getLocalDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialFormData = (): FormData => ({
  shopName: "",
  trayCount: "",
  pricePerTray: "",
  customerName: "",
  customerPhone: "",
  date: getLocalDate(),
});

export default function SalesForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData());

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const [message, setMessage] = useState("");
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

  /**
   * جلب العملاء
   */
  const fetchCustomers = async () => {
    setLoadingCustomers(true);

    try {
      const res = await fetch("/api/customers", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid customers response");
      }

      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
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
   * تغيير حقول النموذج
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * تغيير العميل المختار
   */
  const handleCustomerChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const customerId = e.target.value;

    setSelectedCustomer(customerId);

    /**
     * إذا تم اختيار عميل موجود
     * يمكن ملء بياناته تلقائيًا
     */
    if (customerId) {
      const customer = customers.find(
        (item) => String(item.id) === customerId
      );

      if (customer) {
        setFormData((prev) => ({
          ...prev,
          customerName: customer.name,
          customerPhone: customer.phone ?? "",
        }));
      }
    } else {
      /**
       * في حالة اختيار "عميل جديد"
       */
      setFormData((prev) => ({
        ...prev,
        customerName: "",
        customerPhone: "",
      }));
    }
  };

  /**
   * إرسال المبيعات
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);
    setLastInvoice(null);

    try {
      /**
       * التحقق من الحقول الأساسية
       */
      if (!formData.shopName.trim()) {
        setMessage("❌ يرجى إدخال اسم المحل");
        return;
      }

      if (!formData.trayCount.trim()) {
        setMessage("❌ يرجى إدخال عدد الأطباق");
        return;
      }

      if (!formData.pricePerTray.trim()) {
        setMessage("❌ يرجى إدخال سعر الطبق");
        return;
      }

      const trayCount = Number(formData.trayCount);
      const pricePerTray = Number(formData.pricePerTray);

      /**
       * التحقق من الأرقام
       */
      if (!Number.isInteger(trayCount) || trayCount <= 0) {
        setMessage("❌ عدد الأطباق يجب أن يكون رقمًا صحيحًا أكبر من صفر");
        return;
      }

      if (!Number.isFinite(pricePerTray) || pricePerTray <= 0) {
        setMessage("❌ سعر الطبق يجب أن يكون رقمًا أكبر من صفر");
        return;
      }

      /**
       * التحقق من بيانات العميل
       */
      if (!selectedCustomer) {
        if (!formData.customerName.trim()) {
          setMessage("❌ يرجى إدخال اسم العميل");
          return;
        }
      }

      /**
       * إنشاء Payload واضح
       */
      const payload = {
        shopName: formData.shopName.trim(),
        trayCount,
        pricePerTray,
        date: formData.date,

        ...(selectedCustomer
          ? {
              customerId: Number(selectedCustomer),
            }
          : {
              customerName: formData.customerName.trim(),
              customerPhone: formData.customerPhone.trim(),
            }),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          data?.message || "حدث خطأ أثناء إدخال المبيعات"
        );
      }

      /**
       * التأكد من وجود بيانات الفاتورة
       */
      if (data?.invoice) {
        setLastInvoice(data.invoice);
      }

      setMessage("✅ تم إدخال المبيعات بنجاح");

      /**
       * إعادة ضبط النموذج
       */
      setFormData(initialFormData());
      setSelectedCustomer("");

      /**
       * تحديث قائمة العملاء
       */
      await fetchCustomers();
    } catch (error) {
      console.error("Error creating sale:", error);

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ حدث خطأ غير متوقع"
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * تنزيل الفاتورة PDF
   */
  /*const downloadPDF = async () => {
    if (!lastInvoice) {
      alert("لا توجد فاتورة للتنزيل");
      return;
    }

    setDownloadingPDF(true);

    let url: string | null = null;

    try {
      const res = await fetch("/api/invoice-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: lastInvoice.id,
        }),
      });

      if (!res.ok) {
        let errorMessage = "فشل إنشاء ملف PDF";

        try {
          const data = await res.json();

          if (data?.message) {
            errorMessage = data.message;
          }
        } catch {
          // تجاهل الخطأ إذا لم تكن الاستجابة JSON
        }

        throw new Error(errorMessage);
      }

      const contentType = res.headers.get("content-type");

      if (!contentType?.includes("application/pdf")) {
        throw new Error("الخادم لم يُرجع ملف PDF");
      }

     
       // تحويل الاستجابة إلى Blob
       
      const blob = await res.blob();

      if (!blob.size) {
        throw new Error("ملف PDF فارغ");
      }

      
      // إنشاء رابط مؤقت للملف
      
      url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `invoice-${lastInvoice.number}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);

      alert(
        error instanceof Error
          ? error.message
          : "حدث خطأ في تحميل الفاتورة"
      );
    } finally {
      
     // تحرير الرابط المؤقت
       
      if (url) {
        window.URL.revokeObjectURL(url);
      }

      setDownloadingPDF(false);
    }
  };
*/
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
    <form onSubmit={handleSubmit} className="space-y-5">

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
                type="text"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerName: e.target.value,
                  })
                }
                disabled={loading || !!selectedCustomer}
                placeholder="أدخل اسم العميل"
                className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
              />
            </div>
          </div>

          {/* رقم الهاتف */}
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
                type="tel"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerPhone: e.target.value,
                  })
                }
                disabled={loading || !!selectedCustomer}
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
            onChange={(e) =>
              setSelectedCustomer(e.target.value)
            }
            disabled={loading}
            className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-[#FDFBF7] px-4 pr-10 text-sm text-[#374151] outline-none transition-all focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              -- عميل جديد --
            </option>

            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.phone}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-gray-500">
          يمكنك اختيار عميل مسجل مسبقاً أو إدخال بيانات عميل جديد.
        </p>
      </div>

      {/* بيانات البيع */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-[#2E7D32]" />

          <h3 className="font-semibold text-[#374151]">
            تفاصيل المبيعات
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* اسم الدكان */}
          <div className="space-y-2">
            <Label
              htmlFor="shopName"
              className="font-medium text-[#374151]"
            >
              اسم الدكان
            </Label>

            <div className="relative">
              <Store className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

              <Input
                id="shopName"
                type="text"
                value={formData.shopName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shopName: e.target.value,
                  })
                }
                required
                disabled={loading}
                placeholder="أدخل اسم الدكان"
                className="h-12 rounded-xl border-gray-200 bg-[#FDFBF7] pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
              />
            </div>
          </div>

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
                type="number"
                value={formData.trayCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trayCount: e.target.value,
                  })
                }
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
                type="number"
                value={formData.pricePerTray}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricePerTray: e.target.value,
                  })
                }
                required
                min="0"
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

        </div>
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

      {/* حفظ المبيعات */}
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

    {/* الفاتورة */}
    
    {/* {lastInvoice && (
      <Card className="mt-5 border-[#2E7D32]/20 bg-[#E8F5E9] shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-[#2E7D32]" />

                <p className="font-semibold text-[#2E7D32]">
                  تم إنشاء الفاتورة
                </p>
              </div>

              <p className="mt-1 text-sm text-[#374151]">
                رقم الفاتورة:{' '}
                <span className="font-bold">
                  {lastInvoice.number}
                </span>
              </p>

              <p className="mt-1 text-sm text-[#374151]">
                المجموع:{' '}
                <span className="font-bold text-[#2E7D32]">
                  {lastInvoice.total.toLocaleString()} ل.س
                </span>
              </p>
            </div>

            <Button
              type="button"
              onClick={downloadPDF}
              className="h-11 gap-2 rounded-xl bg-[#EF6C00] px-5 text-white hover:bg-[#EF6C00]/90"
            >
              <Download className="h-4 w-4" />
              تنزيل PDF
            </Button>

          </div>
        </CardContent>
      </Card>
    )} */}
  </CardContent>
</Card>
    </div>
  );
}