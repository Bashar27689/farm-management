'use client';

import { useEffect, useState } from 'react';

import {
  Boxes,
  CalendarDays,
  Edit,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  Warehouse,
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

type Supply = {
  id: string;
  type: string;
  name: string;
  quantity: number;
  price: number;
  date: string;
  expiryDate: string | null;
  createdAt: string;
};

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedSupply, setSelectedSupply] =
    useState<Supply | null>(null);

  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // =====================================================
  // جلب المستلزمات
  // =====================================================

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/supplies');

      if (!response.ok) {
        throw new Error('Failed to fetch supplies');
      }

      const result = await response.json();

      setSupplies(result.supplies || []);
    } catch (error) {
      console.error('Error fetching supplies:', error);

      setError('حدث خطأ أثناء تحميل بيانات المستلزمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  // =====================================================
  // فتح نافذة التعديل
  // =====================================================

  const handleEdit = (supply: Supply) => {
    setSelectedSupply(supply);

    setType(supply.type);
    setName(supply.name);
    setQuantity(String(supply.quantity));
    setPrice(String(supply.price));

    setDate(
      supply.date
        ? new Date(supply.date).toISOString().split('T')[0]
        : ''
    );

    setExpiryDate(
      supply.expiryDate
        ? new Date(supply.expiryDate).toISOString().split('T')[0]
        : ''
    );

    setMessage('');
    setError('');

    setEditOpen(true);
  };

  // =====================================================
  // تعديل المستلزم
  // =====================================================

  const handleUpdate = async () => {
    if (!selectedSupply) {
      return;
    }

    const trimmedType = type.trim();
    const trimmedName = name.trim();

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (!trimmedType) {
      setError('نوع المستلزم مطلوب');
      return;
    }

    if (!trimmedName) {
      setError('اسم المستلزم مطلوب');
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError('الكمية يجب أن تكون رقمًا صحيحًا أكبر من صفر');
      return;
    }

    if (
      !Number.isInteger(parsedPrice) ||
      parsedPrice < 0
    ) {
      setError(
        'السعر يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي صفر'
      );
      return;
    }

    if (!date) {
      setError('تاريخ المستلزم مطلوب');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const response = await fetch(
        `/api/supplies/${selectedSupply.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: trimmedType,
            name: trimmedName,
            quantity: parsedQuantity,
            price: parsedPrice,
            date,
            expiryDate: expiryDate || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'حدث خطأ أثناء تعديل المستلزم'
        );
      }

      const updatedSupply = result.supply || result;

      setSupplies((currentSupplies) =>
        currentSupplies.map((supply) =>
          supply.id === selectedSupply.id
            ? updatedSupply
            : supply
        )
      );

      setEditOpen(false);
      setSelectedSupply(null);

      setMessage('تم تعديل بيانات المستلزم بنجاح');

      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating supply:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء تعديل المستلزم'
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // فتح نافذة الحذف
  // =====================================================

  const handleDeleteClick = (supply: Supply) => {
    setSelectedSupply(supply);

    setError('');
    setMessage('');

    setDeleteOpen(true);
  };

  // =====================================================
  // حذف المستلزم
  // =====================================================

  const handleDelete = async () => {
    if (!selectedSupply) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      setMessage('');

      const response = await fetch(
        `/api/supplies/${selectedSupply.id}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'حدث خطأ أثناء حذف المستلزم'
        );
      }

      setSupplies((currentSupplies) =>
        currentSupplies.filter(
          (supply) =>
            supply.id !== selectedSupply.id
        )
      );

      setDeleteOpen(false);
      setSelectedSupply(null);

      setMessage('تم حذف المستلزم بنجاح');

      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting supply:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء حذف المستلزم'
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // البحث
  // =====================================================

  const filteredSupplies = supplies.filter((supply) => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    const supplyName = String(
      supply.name ?? ''
    ).toLowerCase();

    const supplyType = String(
      supply.type ?? ''
    ).toLowerCase();

    return (
      supplyName.includes(searchValue) ||
      supplyType.includes(searchValue)
    );
  });

  // =====================================================
  // نوع المستلزم
  // =====================================================

  const getSupplyTypeLabel = (type: string) => {
    switch (type) {
      case 'FEED':
        return 'علف';

      case 'VACCINE':
        return 'لقاح';

      case 'OTHER':
        return 'أخرى';

      default:
        return type || 'أخرى';
    }
  };

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

  // =====================================================
  // الصفحة
  // =====================================================

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

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3E0]">

              <Warehouse className="h-5 w-5 text-[#EF6C00]" />

            </div>

            <div>

              <h1 className="text-2xl font-bold text-[#374151]">
                المستلزمات
              </h1>

              <p className="text-sm text-[#374151]/60">
                إدارة بيانات المستلزمات والمشتريات
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

        {error && !editOpen && !deleteOpen && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* =====================================================
            Supplies Card
        ===================================================== */}

        <Card className="overflow-hidden border-gray-100 bg-white shadow-sm">

          <CardHeader className="border-b border-gray-100">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">

                  <Boxes className="h-5 w-5 text-[#EF6C00]" />

                </div>

                <div>

                  <CardTitle className="text-lg text-[#374151]">
                    قائمة المستلزمات
                  </CardTitle>

                  <CardDescription>
                    {supplies.length} سجل مستلزمات
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
                  placeholder="البحث باسم المستلزم أو النوع..."
                  className="h-10 border-gray-200 bg-[#FDFBF7] pr-9 text-right focus-visible:ring-[#2E7D32]"
                />

              </div>

            </div>

          </CardHeader>

          <CardContent className="p-0">

            {filteredSupplies.length === 0 ? (

              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3E0]">

                  <Package className="h-7 w-7 text-[#EF6C00]" />

                </div>

                <h3 className="mt-4 text-base font-bold text-[#374151]">
                  لا توجد مستلزمات
                </h3>

                <p className="mt-1 text-sm text-[#374151]/50">
                  لم يتم العثور على مستلزمات مطابقة للبحث
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1050px]">

                  <thead>

                    <tr className="border-b border-gray-100 bg-[#FDFBF7]">

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        المستلزم
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        النوع
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        الكمية
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        السعر
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        الإجمالي
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        التاريخ
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-[#374151]">
                        انتهاء الصلاحية
                      </th>

                      <th className="px-5 py-4 text-center text-sm font-bold text-[#374151]">
                        الإجراءات
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredSupplies.map((supply) => (

                      <tr
                        key={supply.id}
                        className="border-b border-gray-100 transition-colors hover:bg-[#FDFBF7]"
                      >

                        {/* المستلزم */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3E0]">

                              <Package className="h-4 w-4 text-[#EF6C00]" />

                            </div>

                            <span className="font-medium text-[#374151]">
                              {supply.name}
                            </span>

                          </div>

                        </td>

                        {/* النوع */}

                        <td className="px-5 py-4">

                          <span
                            className={
                              supply.type === 'FEED'
                                ? 'inline-flex rounded-lg border border-[#2E7D32]/20 bg-[#E8F5E9] px-3 py-1 text-xs font-medium text-[#2E7D32]'
                                : supply.type === 'VACCINE'
                                  ? 'inline-flex rounded-lg border border-[#EF6C00]/20 bg-[#FFF3E0] px-3 py-1 text-xs font-medium text-[#EF6C00]'
                                  : 'inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-[#374151]'
                            }
                          >
                            {getSupplyTypeLabel(supply.type)}
                          </span>

                        </td>

                        {/* الكمية */}

                        <td className="px-5 py-4">

                          <span className="font-medium text-[#374151]">
                            {supply.quantity.toLocaleString()}
                          </span>

                          <span className="mr-1 text-xs text-[#374151]/50">
                            {supply.type === 'FEED'
                              ? 'كجم'
                              : 'وحدة'}
                          </span>

                        </td>

                        {/* السعر */}

                        <td className="px-5 py-4 font-semibold text-[#2E7D32]">

                          {supply.price.toLocaleString()} ل.س

                        </td>

                        {/* الإجمالي */}

                        <td className="px-5 py-4 font-bold text-[#EF6C00]">

                          {(
                            supply.quantity *
                            supply.price
                          ).toLocaleString()} ل.س

                        </td>

                        {/* التاريخ */}

                        <td className="px-5 py-4 text-sm text-[#374151]/60">

                          {new Date(
                            supply.date
                          ).toLocaleDateString('ar-SY')}

                        </td>

                        {/* انتهاء الصلاحية */}

                        <td className="px-5 py-4 text-sm">

                          {supply.expiryDate ? (
                            <span className="text-[#374151]/70">
                              {new Date(
                                supply.expiryDate
                              ).toLocaleDateString('ar-SY')}
                            </span>
                          ) : (
                            <span className="text-[#374151]/40">
                              —
                            </span>
                          )}

                        </td>

                        {/* الإجراءات */}

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-center gap-2">

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleEdit(supply)
                              }
                              className="border-[#2E7D32]/20 bg-white text-[#2E7D32] hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
                            >

                              <Edit className="ml-1 h-4 w-4" />

                              تعديل

                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteClick(supply)
                              }
                              className="border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                            >

                              <Trash2 className="ml-1 h-4 w-4" />

                              حذف

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
            className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
          >

            <DialogHeader>

              <DialogTitle className="text-right text-[#374151]">
                تعديل بيانات المستلزم
              </DialogTitle>

              <DialogDescription className="text-right">
                قم بتعديل بيانات المستلزم ثم اضغط حفظ التعديلات.
              </DialogDescription>

            </DialogHeader>

            <div className="space-y-4 py-4">

              {/* النوع */}

              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">
                  نوع المستلزم
                </label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-right text-sm outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
                >

                  <option value="">
                    اختر النوع
                  </option>

                  <option value="FEED">
                    علف
                  </option>

                  <option value="VACCINE">
                    لقاح
                  </option>

                  <option value="OTHER">
                    أخرى
                  </option>

                </select>

              </div>

              {/* الاسم */}

              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">
                  اسم المستلزم
                </label>

                <Input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="اسم المستلزم"
                  className="text-right focus-visible:ring-[#2E7D32]"
                />

              </div>

              {/* الكمية والسعر */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="space-y-2">

                  <label className="text-sm font-medium text-[#374151]">
                    الكمية
                  </label>

                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    placeholder="الكمية"
                    dir="ltr"
                    className="text-left focus-visible:ring-[#2E7D32]"
                  />

                </div>

                <div className="space-y-2">

                  <label className="text-sm font-medium text-[#374151]">
                    السعر
                  </label>

                  <Input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    placeholder="السعر"
                    dir="ltr"
                    className="text-left focus-visible:ring-[#2E7D32]"
                  />

                </div>

              </div>

              {/* التاريخ */}

              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">
                  التاريخ
                </label>

                <Input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  dir="ltr"
                  className="text-left focus-visible:ring-[#2E7D32]"
                />

              </div>

              {/* انتهاء الصلاحية */}

              <div className="space-y-2">

                <label className="text-sm font-medium text-[#374151]">
                  تاريخ انتهاء الصلاحية
                </label>

                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(event) =>
                    setExpiryDate(event.target.value)
                  }
                  dir="ltr"
                  className="text-left focus-visible:ring-[#2E7D32]"
                />

              </div>

              {/* الخطأ */}

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

        {/* =====================================================
            Delete Dialog
        ===================================================== */}

        <Dialog
          open={deleteOpen}
          onOpenChange={(open) => {
            if (!deleting) {
              setDeleteOpen(open);
            }
          }}
        >

          <DialogContent
            dir="rtl"
            className="sm:max-w-md"
          >

            <DialogHeader>

              <DialogTitle className="text-right text-[#374151]">
                حذف المستلزم
              </DialogTitle>

              <DialogDescription className="text-right leading-6">
                هل أنت متأكد من حذف هذا المستلزم؟
                <br />

                <span className="font-semibold text-[#374151]">
                  {selectedSupply?.name}
                </span>

                <br />

                لا يمكن التراجع عن عملية الحذف بعد تنفيذها.
              </DialogDescription>

            </DialogHeader>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2 sm:justify-start">

              <Button
                variant="outline"
                disabled={deleting}
                onClick={() =>
                  setDeleteOpen(false)
                }
              >
                إلغاء
              </Button>

              <Button
                disabled={deleting}
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >

                {deleting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف المستلزم
                  </>
                )}

              </Button>

            </DialogFooter>

          </DialogContent>

        </Dialog>

      </div>
    </main>
  );
}