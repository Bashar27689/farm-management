'use client';

import { useEffect, useState } from 'react';

import {
  CalendarDays,
  Edit,
  Loader2,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../@/components/ui/card';

import { Button } from '../../../@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../@/components/ui/dialog';

import { Input } from '../../../@/components/ui/input';

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);


  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // =====================================================
  // جلب العملاء
  // =====================================================

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/customers');

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();

      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);

      setError('حدث خطأ أثناء تحميل بيانات العملاء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // =====================================================
  // فتح نافذة التعديل
  // =====================================================

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);

    setName(customer.name);
    setPhone(customer.phone);

    setMessage('');
    setError('');

    setEditOpen(true);
  };

  // =====================================================
  // تعديل العميل
  // =====================================================

  const handleUpdate = async () => {
    if (!selectedCustomer) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError('اسم العميل مطلوب');
      return;
    }

    if (!trimmedPhone) {
      setError('رقم الهاتف مطلوب');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const response = await fetch(
        `/api/customers/${selectedCustomer.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
            phone: trimmedPhone,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'حدث خطأ أثناء تعديل العميل'
        );
      }

      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          customer.id === selectedCustomer.id
            ? result
            : customer
        )
      );

      setEditOpen(false);
      setSelectedCustomer(null);

      setMessage('تم تعديل بيانات العميل بنجاح');

      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating customer:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء تعديل العميل'
      );
    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // البحث
  // =====================================================
const filteredCustomers = customers.filter((customer) => {
  const searchValue = search.trim().toLowerCase();

  if (!searchValue) {
    return true;
  }

  const customerName = String(customer.name ?? '').toLowerCase();
  const customerPhone = String(customer.phone ?? '').toLowerCase();

  return (
    customerName.includes(searchValue) ||
    customerPhone.includes(searchValue)
  );
});

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

          <Card className="border-gray-100 bg-white shadow-sm">
            <CardContent className="p-6">

              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-14 animate-pulse rounded-lg bg-gray-100"
                  />
                ))}
              </div>

            </CardContent>
          </Card>

        </div>
      </main>
    );
  }

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

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5E9]">

              <Users className="h-5 w-5 text-[#2E7D32]" />

            </div>

            <div>

              <h1 className="text-2xl font-bold text-[#374151]">
                العملاء
              </h1>

              <p className="text-sm text-[#374151]/60">
                إدارة بيانات العملاء
              </p>

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

        {/* =====================================================
            Messages
        ===================================================== */}

        {message && (
          <div className="rounded-xl border border-[#2E7D32]/20 bg-[#E8F5E9] px-4 py-3 text-sm font-medium text-[#2E7D32]">
            {message}
          </div>
        )}

        {/* =====================================================
            Customers Card
        ===================================================== */}

        <Card className="overflow-hidden border-gray-100 bg-white shadow-sm">

          <CardHeader className="border-b border-gray-100">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">

                  <UserRound className="h-5 w-5 text-[#2E7D32]" />

                </div>

                <div>

                  <CardTitle className="text-lg text-[#374151]">
                    قائمة العملاء
                  </CardTitle>

                  <CardDescription>
                    {customers.length} عميل مسجل
                  </CardDescription>

                </div>

              </div>

              {/* البحث */}

              <div className="relative w-full md:w-80">

                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  className="h-10 border-gray-200 bg-[#FDFBF7] pr-9 text-right focus-visible:ring-[#2E7D32]"
                />

              </div>

            </div>

          </CardHeader>

          <CardContent className="p-0">

            {filteredCustomers.length === 0 ? (

              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9]">

                  <Users className="h-7 w-7 text-[#2E7D32]" />

                </div>

                <h3 className="mt-4 text-base font-bold text-[#374151]">
                  لا يوجد عملاء
                </h3>

                <p className="mt-1 text-sm text-[#374151]/50">
                  لم يتم العثور على عملاء مطابقين للبحث
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px]">

                  <thead>

                    <tr className="border-b border-gray-100 bg-[#FDFBF7]">

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        العميل
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        رقم الهاتف
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        تاريخ الإضافة
                      </th>

                      <th className="px-5 py-4 text-center text-sm font-bold text-[#374151]">
                        الإجراءات
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredCustomers.map((customer) => (

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

                            <span className="font-medium text-[#374151]">
                              {customer.name}
                            </span>

                          </div>

                        </td>

                        {/* الهاتف */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2 text-sm text-[#374151]/70">

                            <Phone className="h-4 w-4 text-[#2E7D32]" />

                            <span dir="ltr">
                              {customer.phone}
                            </span>

                          </div>

                        </td>

                        {/* التاريخ */}

                        <td className="px-5 py-4 text-sm text-[#374151]/60">

                          {new Date(
                            customer.createdAt
                          ).toLocaleDateString('ar-SY')}

                        </td>

                        {/* الإجراءات */}

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-center gap-2">

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleEdit(customer)
                              }
                              className="border-[#2E7D32]/20 bg-white text-[#2E7D32] hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
                            >

                              <Edit className="ml-1 h-4 w-4" />

                              تعديل

                            </Button>
                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </CardContent>

        </Card>

        {/* =====================================================
            Edit Dialog
        ===================================================== */}

        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            if (!saving) {
              setEditOpen(open);
            }
          }}
        >

          <DialogContent
            dir="rtl"
            className="sm:max-w-md"
          >

            <DialogHeader>

              <DialogTitle className="text-right text-[#374151]">
                تعديل بيانات العميل
              </DialogTitle>

              <DialogDescription className="text-right">
                قم بتعديل اسم العميل ورقم الهاتف.
              </DialogDescription>

            </DialogHeader>

            <div className="space-y-4 py-4">

              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">
                  اسم العميل
                </label>

                <Input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="اسم العميل"
                  className="text-right focus-visible:ring-[#2E7D32]"
                />

              </div>

              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">
                  رقم الهاتف
                </label>

                <Input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="رقم الهاتف"
                  dir="ltr"
                  className="text-left focus-visible:ring-[#2E7D32]"
                />

              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

            </div>

            <DialogFooter className="gap-2 sm:justify-start">

              <Button
                variant="outline"
                disabled={saving}
                onClick={() => setEditOpen(false)}
              >
                إلغاء
              </Button>

              <Button
                disabled={saving}
                onClick={handleUpdate}
                className="bg-[#2E7D32] text-white hover:bg-[#256428]"
              >

                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  'حفظ التعديلات'
                )}

              </Button>

            </DialogFooter>

          </DialogContent>

        </Dialog>

        

      </div>
    </main>
  );
}