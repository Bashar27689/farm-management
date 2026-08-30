'use client';

import { useMemo, useState } from 'react';

import {
  ArrowRight,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  FileText,
  Loader2,
  Phone,
  UserRound,
  WalletCards,
} from 'lucide-react';

import {
  Card,
  CardContent,
} from '../../@/components/ui/card';

import { Input } from '../../@/components/ui/input';
import { Badge } from '../../@/components/ui/badge';
import { Button } from '../../@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../@/components/ui/dialog';

import type {
  Invoice,
  Customer,
} from './InvoiceManagement';


// =====================================================
// Types
// =====================================================

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  note: string | null;
  createdAt: string;
};


type ReceivableCustomer = {
  id: string;
  name: string;
  phone: string | null;
  invoiceCount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  invoices: Invoice[];
};


type ReceivablesListProps = {
  invoices: Invoice[];
  onRefresh: () => Promise<void>;
};


// =====================================================
// Helpers
// =====================================================

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString('ar-SY');
}


function formatDate(value: string) {
  if (!value) return '—';

  return new Date(
    value
  ).toLocaleDateString(
    'ar-SY',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );
}


function getTodayDate() {
  const date = new Date();

  const offset =
    date.getTimezoneOffset();

  return new Date(
    date.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .slice(0, 10);
}


function formatPaymentDateTime(
  payment: Payment
) {
  const date = new Date(
    payment.createdAt ||
      payment.paymentDate
  );

  return date.toLocaleString(
    'ar-SY',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}


function statusLabel(
  status: Invoice['paymentStatus']
) {
  if (status === 'PAID') {
    return 'مدفوعة بالكامل';
  }

  if (status === 'PARTIAL') {
    return 'مدفوعة جزئياً';
  }

  return 'غير مدفوعة';
}


function statusClass(
  status: Invoice['paymentStatus']
) {
  if (status === 'PAID') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'PARTIAL') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-red-200 bg-red-50 text-red-700';
}


// =====================================================
// Component
// =====================================================

export default function ReceivablesList({
  invoices,
  onRefresh,
}: ReceivablesListProps) {

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<ReceivableCustomer | null>(
    null
  );

  const [
    paymentOpen,
    setPaymentOpen,
  ] = useState(false);

  const [
    selectedInvoice,
    setSelectedInvoice,
  ] = useState<Invoice | null>(null);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState('');

  const [
    paymentDate,
    setPaymentDate,
  ] = useState(getTodayDate());

  const [
    paymentNote,
    setPaymentNote,
  ] = useState('');

  const [
    savingPayment,
    setSavingPayment,
  ] = useState(false);

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    selectedHistoryInvoice,
    setSelectedHistoryInvoice,
  ] = useState<Invoice | null>(null);

  const [
    payments,
    setPayments,
  ] = useState<Payment[]>([]);

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');


  // ===================================================
  // Outstanding invoices
  // ===================================================

  const outstandingInvoices =
    useMemo(() => {

      return invoices.filter(
        (invoice) =>
          Number(
            invoice.remainingAmount || 0
          ) > 0 &&
          invoice.paymentStatus !==
            'PAID'
      );

    }, [invoices]);


  // ===================================================
  // Customers
  // ===================================================

  const customers =
    useMemo<ReceivableCustomer[]>(
      () => {

        const map =
          new Map<
            string,
            ReceivableCustomer
          >();

        for (
          const invoice of
            outstandingInvoices
        ) {

          if (!invoice.customer) {
            continue;
          }

          const customer =
            invoice.customer;

          const existing =
            map.get(customer.id);

          if (existing) {

            existing.invoiceCount += 1;

            existing.total +=
              Number(
                invoice.total || 0
              );

            existing.paidAmount +=
              Number(
                invoice.paidAmount || 0
              );

            existing.remainingAmount +=
              Number(
                invoice.remainingAmount ||
                  0
              );

            existing.invoices.push(
              invoice
            );

          } else {

            map.set(
              customer.id,
              {
                id:
                  customer.id,

                name:
                  customer.name,

                phone:
                  customer.phone,

                invoiceCount: 1,

                total:
                  Number(
                    invoice.total || 0
                  ),

                paidAmount:
                  Number(
                    invoice.paidAmount || 0
                  ),

                remainingAmount:
                  Number(
                    invoice.remainingAmount ||
                      0
                  ),

                invoices: [
                  invoice,
                ],
              }
            );

          }
        }

        return Array.from(
          map.values()
        ).sort(
          (a, b) =>
            b.remainingAmount -
            a.remainingAmount
        );

      },
      [
        outstandingInvoices,
      ]
    );


  // ===================================================
  // Search customers
  // ===================================================

  const filteredCustomers =
    useMemo(() => {

      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          customer.name
            .toLowerCase()
            .includes(value) ||

          String(
            customer.phone || ''
          )
            .toLowerCase()
            .includes(value)
      );

    }, [
      customers,
      search,
    ]);


  // ===================================================
  // Search invoices
  // ===================================================

  const filteredInvoices =
    useMemo(() => {

      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return outstandingInvoices;
      }

      return outstandingInvoices.filter(
        (invoice) =>
          invoice.number
            .toLowerCase()
            .includes(value) ||

          invoice.customer?.name
            .toLowerCase()
            .includes(value) ||

          String(
            invoice.customer?.phone ||
            ''
          )
            .toLowerCase()
            .includes(value)
      );

    }, [
      outstandingInvoices,
      search,
    ]);


  // ===================================================
  // Open payment
  // ===================================================

  const openPaymentDialog = (
    invoice: Invoice
  ) => {

    setSelectedInvoice(
      invoice
    );

    setPaymentAmount('');
    setPaymentDate(
      getTodayDate()
    );
    setPaymentNote('');
    setError('');
    setPaymentOpen(true);
  };


  // ===================================================
  // Add payment
  // ===================================================

  const handleAddPayment =
    async () => {

      if (!selectedInvoice) {
        return;
      }

      const amount =
        Number(
          paymentAmount
        );

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {

        setError(
          'مبلغ الدفعة يجب أن يكون رقماً صحيحاً أكبر من صفر'
        );

        return;
      }

      if (
        amount >
        Number(
          selectedInvoice.remainingAmount
        )
      ) {

        setError(
          `المبلغ أكبر من المتبقي: ${formatCurrency(
            selectedInvoice.remainingAmount
          )} ل.س`
        );

        return;
      }

      if (!paymentDate) {

        setError(
          'يرجى اختيار تاريخ الدفعة'
        );

        return;
      }


      try {

        setSavingPayment(true);
        setError('');

        const response =
          await fetch(
            `/api/invoices/${selectedInvoice.id}/payments`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                amount,
                paymentDate,
                note:
                  paymentNote.trim() ||
                  null,
              }),
            }
          );


        const text =
          await response.text();

        let result: any = {};

        try {

          result =
            text
              ? JSON.parse(text)
              : {};

        } catch {

          throw new Error(
            `استجابة الخادم غير صالحة. HTTP ${response.status}`
          );
        }


        if (!response.ok) {

          throw new Error(
            result?.error ||
            result?.message ||
            'حدث خطأ أثناء تسجيل الدفعة'
          );
        }


        // =================================================
        // IMPORTANT
        //
        // لا نحدث الحالة المحلية يدوياً.
        //
        // نعيد جلب الفواتير من المصدر الرئيسي:
        // /api/invoices
        //
        // وهذا يجعل:
        // - الفاتورة تتحدث
        // - المدفوع يتحدث
        // - المتبقي يتحدث
        // - الحالة تتحدث
        // - تبويب المستحقات يتحدث
        // - تبويب الفواتير يتحدث
        // =================================================

        setPaymentOpen(false);

        setSelectedInvoice(
          null
        );

        setPaymentAmount('');
        setPaymentNote('');

        await onRefresh();

        setMessage(
          'تم تسجيل الدفعة وتحديث البيانات بنجاح'
        );

        setTimeout(
          () => setMessage(''),
          3000
        );

      } catch (err) {

        console.error(
          'Error adding payment:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'حدث خطأ أثناء تسجيل الدفعة'
        );

      } finally {

        setSavingPayment(false);
      }
    };


  // ===================================================
  // Payment history
  // ===================================================

  const openPaymentHistory =
    async (
      invoice: Invoice
    ) => {

      setSelectedHistoryInvoice(
        invoice
      );

      setHistoryOpen(true);
      setHistoryLoading(true);
      setPayments([]);
      setError('');

      try {

        const response =
          await fetch(
            `/api/invoices/${invoice.id}/payments`,
            {
              cache: 'no-store',
            }
          );

        const text =
          await response.text();

        let result: any = {};

        try {

          result =
            text
              ? JSON.parse(text)
              : {};

        } catch {

          throw new Error(
            `استجابة الخادم غير صالحة. HTTP ${response.status}`
          );
        }

        if (!response.ok) {

          throw new Error(
            result?.message ||
            result?.error ||
            'حدث خطأ أثناء جلب سجل الدفعات'
          );
        }


        setPayments(
          Array.isArray(
            result?.invoice?.payments
          )
            ? result.invoice.payments
            : []
        );


        if (result?.invoice) {

          setSelectedHistoryInvoice(
            (current) => {

              if (!current) {
                return current;
              }

              return {
                ...current,

                total:
                  Number(
                    result.invoice.total
                  ),

                paidAmount:
                  Number(
                    result.invoice.paidAmount
                  ),

                remainingAmount:
                  Number(
                    result.invoice.remainingAmount
                  ),

                paymentStatus:
                  result.invoice.paymentStatus,

                customer:
                  result.invoice.customer ||
                  current.customer,
              };

            }
          );

        }

      } catch (err) {

        console.error(
          'Error loading payment history:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'حدث خطأ أثناء جلب سجل الدفعات'
        );

      } finally {

        setHistoryLoading(false);
      }
    };


  // ===================================================
  // Latest payment
  // ===================================================

  const latestPaymentId =
    payments.reduce<
      string | null
    >(
      (
        latest,
        payment
      ) => {

        if (!latest) {
          return payment.id;
        }

        const current =
          payments.find(
            (item) =>
              item.id === latest
          );

        return new Date(
          payment.createdAt
        ).getTime() >
          new Date(
            current?.createdAt ?? 0
          ).getTime()
          ? payment.id
          : latest;

      },
      null
    );


  // ===================================================
  // Selected customer
  // ===================================================

  if (
    selectedCustomer
  ) {

    return (
      <>
        <section className="space-y-3">

          <Card className="border-0 bg-white shadow-sm">

            <CardContent className="p-4 sm:p-5">

              <button
                type="button"
                onClick={() =>
                  setSelectedCustomer(
                    null
                  )
                }
                className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4" />
                العودة إلى العملاء
              </button>


              <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">

                    <UserRound className="h-5 w-5 text-[#2E7D32]" />

                  </div>

                  <div>

                    <h2 className="font-bold text-gray-900">
                      {selectedCustomer.name}
                    </h2>

                    {selectedCustomer.phone && (
                      <p
                        dir="ltr"
                        className="mt-1 flex items-center gap-1 text-xs text-gray-500"
                      >
                        <Phone className="h-3 w-3" />
                        {selectedCustomer.phone}
                      </p>
                    )}

                  </div>

                </div>


                <div className="rounded-xl bg-orange-50 px-4 py-3">

                  <p className="text-xs text-gray-500">
                    المتبقي
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#EF6C00]">
                    {formatCurrency(
                      selectedCustomer.remainingAmount
                    )}{' '}
                    <span className="text-xs font-normal">
                      ل.س
                    </span>
                  </p>

                </div>

              </div>


              <div className="mt-5 space-y-3">

                {selectedCustomer.invoices.map(
                  (invoice) => (

                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onPay={
                        openPaymentDialog
                      }
                      onHistory={
                        openPaymentHistory
                      }
                    />

                  )
                )}

              </div>

            </CardContent>

          </Card>

        </section>


        <PaymentDialog
          open={paymentOpen}
          setOpen={setPaymentOpen}
          invoice={selectedInvoice}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          paymentDate={paymentDate}
          setPaymentDate={setPaymentDate}
          paymentNote={paymentNote}
          setPaymentNote={setPaymentNote}
          savingPayment={savingPayment}
          error={error}
          onSubmit={
            handleAddPayment
          }
        />


        <HistoryDialog
          open={historyOpen}
          setOpen={setHistoryOpen}
          invoice={
            selectedHistoryInvoice
          }
          payments={payments}
          loading={historyLoading}
          latestPaymentId={
            latestPaymentId
          }
          error={error}
        />

      </>
    );
  }


  // ===================================================
  // Main render
  // ===================================================

  return (

    <section className="space-y-3">

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}


      {/* Search */}

      <div className="relative">

        <WalletCards className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <Input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="ابحث باسم العميل أو رقم الفاتورة أو الهاتف..."
          className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-right shadow-sm focus-visible:ring-[#2E7D32]"
        />

      </div>


      {/* Customers */}

      <div className="space-y-3">

        {filteredCustomers.length === 0 ? (

          <EmptyState
            text={
              outstandingInvoices.length === 0
                ? 'لا توجد مستحقات حالياً'
                : 'لا توجد مستحقات مطابقة للبحث'
            }
          />

        ) : (

          filteredCustomers.map(
            (customer) => (

              <button
                key={customer.id}
                type="button"
                onClick={() =>
                  setSelectedCustomer(
                    customer
                  )
                }
                className="group w-full rounded-2xl border border-gray-100 bg-white p-4 text-right shadow-sm transition hover:border-gray-200 hover:shadow-md sm:p-5"
              >

                <div className="flex items-center gap-3 sm:gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">

                    <UserRound className="h-5 w-5 text-[#2E7D32]" />

                  </div>


                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">

                      <h3 className="truncate font-bold text-gray-900">
                        {customer.name}
                      </h3>

                      <Badge
                        variant="outline"
                        className="hidden border-gray-200 bg-gray-50 text-gray-500 sm:inline-flex"
                      >
                        {customer.invoiceCount}{' '}
                        {customer.invoiceCount === 1
                          ? 'فاتورة'
                          : 'فواتير'}
                      </Badge>

                    </div>


                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">

                      {customer.phone && (
                        <span dir="ltr">
                          {customer.phone}
                        </span>
                      )}

                      <span className="sm:hidden">
                        {customer.invoiceCount}{' '}
                        فواتير
                      </span>

                    </div>

                  </div>


                  <div className="text-left">

                    <p className="text-xs text-gray-400">
                      المتبقي
                    </p>

                    <p className="mt-1 whitespace-nowrap text-base font-bold text-[#EF6C00] sm:text-lg">
                      {formatCurrency(
                        customer.remainingAmount
                      )}{' '}
                      <span className="text-[10px] font-normal">
                        ل.س
                      </span>
                    </p>

                  </div>


                  <ChevronLeft className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:-translate-x-1 group-hover:text-gray-500" />

                </div>

              </button>

            )
          )

        )}

      </div>


      {/* Also show invoice-level results when searching */}

      {search.trim() &&
        filteredInvoices.length > 0 && (
          <div className="pt-3">

            <p className="mb-3 text-sm font-semibold text-gray-700">
              الفواتير المطابقة
            </p>

            <div className="space-y-3">

              {filteredInvoices.map(
                (invoice) => (

                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onPay={
                      openPaymentDialog
                    }
                    onHistory={
                      openPaymentHistory
                    }
                    showCustomer
                  />

                )
              )}

            </div>

          </div>
        )}


      <PaymentDialog
        open={paymentOpen}
        setOpen={setPaymentOpen}
        invoice={selectedInvoice}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentDate={paymentDate}
        setPaymentDate={setPaymentDate}
        paymentNote={paymentNote}
        setPaymentNote={setPaymentNote}
        savingPayment={savingPayment}
        error={error}
        onSubmit={
          handleAddPayment
        }
      />


      <HistoryDialog
        open={historyOpen}
        setOpen={setHistoryOpen}
        invoice={
          selectedHistoryInvoice
        }
        payments={payments}
        loading={historyLoading}
        latestPaymentId={
          latestPaymentId
        }
        error={error}
      />

    </section>
  );
}


// =====================================================
// Invoice Card
// =====================================================

function InvoiceCard({
  invoice,
  onPay,
  onHistory,
  showCustomer = false,
}: {
  invoice: Invoice;
  onPay: (invoice: Invoice) => void;
  onHistory: (invoice: Invoice) => void;
  showCustomer?: boolean;
}) {

  return (

    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">

      <div className="flex flex-col gap-4">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">

            <FileText className="h-5 w-5 text-gray-500" />

          </div>


          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="font-bold text-gray-900">
                فاتورة {invoice.number}
              </h3>

              <Badge
                variant="outline"
                className={statusClass(
                  invoice.paymentStatus
                )}
              >
                {statusLabel(
                  invoice.paymentStatus
                )}
              </Badge>

            </div>


            {showCustomer &&
              invoice.customer && (
                <p className="mt-1 text-sm text-gray-500">
                  {invoice.customer.name}
                </p>
              )}


            <p className="mt-1 text-xs text-gray-400">
              {formatDate(
                invoice.date ||
                  invoice.createdAt
              )}
            </p>

          </div>

        </div>


        <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3">

          <Metric
            label="الإجمالي"
            value={invoice.total}
          />

          <Metric
            label="المدفوع"
            value={
              invoice.paidAmount
            }
            positive
          />

          <Metric
            label="المتبقي"
            value={
              invoice.remainingAmount
            }
            warning
          />

        </div>


        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">

          {invoice.remainingAmount >
            0 && (

            <Button
              type="button"
              onClick={() =>
                onPay(invoice)
              }
              className="h-10 bg-[#2E7D32] text-white hover:bg-[#256428]"
            >
              تحصيل دفعة
            </Button>

          )}


          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onHistory(invoice)
            }
            className="h-10 border-gray-200"
          >
            سجل الدفعات
          </Button>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// Metric
// =====================================================

function Metric({
  label,
  value,
  positive,
  warning,
}: {
  label: string;
  value: number;
  positive?: boolean;
  warning?: boolean;
}) {

  return (

    <div className="min-w-0">

      <p className="truncate text-[11px] text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-sm font-bold ${
          positive
            ? 'text-[#2E7D32]'
            : warning
              ? 'text-[#EF6C00]'
              : 'text-gray-900'
        }`}
      >
        {formatCurrency(value)}
      </p>

    </div>
  );
}


// =====================================================
// Empty State
// =====================================================

function EmptyState({
  text,
}: {
  text: string;
}) {

  return (

    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center shadow-sm">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">

        <WalletCards className="h-5 w-5 text-gray-400" />

      </div>

      <p className="mt-3 text-sm font-semibold text-gray-700">
        {text}
      </p>

    </div>
  );
}


// =====================================================
// Payment Dialog
// =====================================================

function PaymentDialog({
  open,
  setOpen,
  invoice,
  paymentAmount,
  setPaymentAmount,
  paymentDate,
  setPaymentDate,
  paymentNote,
  setPaymentNote,
  savingPayment,
  error,
  onSubmit,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  invoice: Invoice | null;
  paymentAmount: string;
  setPaymentAmount: (value: string) => void;
  paymentDate: string;
  setPaymentDate: (value: string) => void;
  paymentNote: string;
  setPaymentNote: (value: string) => void;
  savingPayment: boolean;
  error: string;
  onSubmit: () => Promise<void>;
}) {

  return (

    <Dialog
      open={open}
      onOpenChange={setOpen}
    >

      <DialogContent
        dir="rtl"
        className="w-[calc(100%-1rem)] max-w-md rounded-2xl p-5 sm:p-6"
      >

        <DialogHeader>

          <DialogTitle>
            تسجيل دفعة
          </DialogTitle>

          <DialogDescription>
            {invoice?.customer?.name}{' '}
            · فاتورة {invoice?.number}
          </DialogDescription>

        </DialogHeader>


        {invoice && (

          <div className="space-y-4">

            <div className="rounded-xl bg-orange-50 p-4">

              <p className="text-xs text-gray-500">
                المتبقي من الفاتورة
              </p>

              <p className="mt-1 text-2xl font-bold text-[#EF6C00]">

                {formatCurrency(
                  invoice.remainingAmount
                )}{' '}

                <span className="text-sm font-normal">
                  ل.س
                </span>

              </p>

            </div>


            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                مبلغ الدفعة
              </label>

              <Input
                inputMode="numeric"
                value={paymentAmount}
                onChange={(event) =>
                  setPaymentAmount(
                    event.target.value.replace(
                      /[^0-9]/g,
                      ''
                    )
                  )
                }
                placeholder="0"
                className="h-12 text-left text-lg font-semibold"
                dir="ltr"
                autoFocus
              />

              <button
                type="button"
                onClick={() =>
                  setPaymentAmount(
                    String(
                      invoice.remainingAmount
                    )
                  )
                }
                className="mt-2 text-xs font-semibold text-[#2E7D32] hover:underline"
              >
                دفع كامل المتبقي (
                {formatCurrency(
                  invoice.remainingAmount
                )}{' '}
                ل.س)
              </button>

            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  تاريخ الدفعة
                </label>

                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(event) =>
                    setPaymentDate(
                      event.target.value
                    )
                  }
                  className="h-11"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ملاحظة{' '}
                  <span className="font-normal text-gray-400">
                    (اختياري)
                  </span>
                </label>

                <Input
                  value={paymentNote}
                  onChange={(event) =>
                    setPaymentNote(
                      event.target.value
                    )
                  }
                  placeholder="مثلاً: نقداً"
                  className="h-11"
                />

              </div>

            </div>


            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

          </div>

        )}


        <DialogFooter className="gap-2 sm:flex-row-reverse">

          <Button
            type="button"
            onClick={onSubmit}
            disabled={savingPayment}
            className="h-11 bg-[#2E7D32] text-white hover:bg-[#256428]"
          >

            {savingPayment ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جارٍ الحفظ...
              </>
            ) : (
              'تسجيل الدفعة'
            )}

          </Button>


          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setOpen(false)
            }
            className="h-11"
          >
            إلغاء
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
}


// =====================================================
// History Dialog
// =====================================================

function HistoryDialog({
  open,
  setOpen,
  invoice,
  payments,
  loading,
  latestPaymentId,
  error,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  invoice: Invoice | null;
  payments: Payment[];
  loading: boolean;
  latestPaymentId: string | null;
  error: string;
}) {

  return (

    <Dialog
      open={open}
      onOpenChange={setOpen}
    >

      <DialogContent
        dir="rtl"
        className="w-[calc(100%-1rem)] max-w-lg rounded-2xl p-5 sm:p-6"
      >

        <DialogHeader>

          <DialogTitle>
            سجل الدفعات
          </DialogTitle>

          <DialogDescription>
            {invoice?.customer?.name}{' '}
            · فاتورة {invoice?.number}
          </DialogDescription>

        </DialogHeader>


        {invoice && (

          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-2">

              <div className="rounded-xl bg-gray-50 p-3">

                <p className="text-xs text-gray-500">
                  الإجمالي
                </p>

                <p className="mt-1 font-bold">
                  {formatCurrency(
                    invoice.total
                  )}{' '}
                  ل.س
                </p>

              </div>


              <div className="rounded-xl bg-orange-50 p-3">

                <p className="text-xs text-gray-500">
                  المتبقي
                </p>

                <p className="mt-1 font-bold text-[#EF6C00]">
                  {formatCurrency(
                    invoice.remainingAmount
                  )}{' '}
                  ل.س
                </p>

              </div>

            </div>


            {loading ? (

              <div className="flex items-center justify-center py-10 text-sm text-gray-500">

                <Loader2 className="ml-2 h-5 w-5 animate-spin" />

                جارٍ تحميل الدفعات...

              </div>

            ) : payments.length === 0 ? (

              <EmptyState
                text="لا توجد دفعات مسجلة لهذه الفاتورة"
              />

            ) : (

              <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">

                {payments.map(
                  (payment) => (

                    <div
                      key={payment.id}
                      className="rounded-xl border border-gray-100 bg-white p-4"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">

                          <CircleDollarSign className="h-5 w-5 text-[#2E7D32]" />

                        </div>


                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="font-bold text-[#2E7D32]">
                              {formatCurrency(
                                Number(
                                  payment.amount
                                )
                              )}{' '}
                              ل.س
                            </p>

                            {payment.id ===
                              latestPaymentId && (

                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700"
                              >
                                أحدث دفعة
                              </Badge>

                            )}

                          </div>


                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">

                            <Clock3 className="h-3 w-3" />

                            {formatPaymentDateTime(
                              payment
                            )}

                          </p>

                        </div>

                      </div>


                      {payment.note && (

                        <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                          {payment.note}
                        </div>

                      )}

                    </div>

                  )
                )}

              </div>

            )}


            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}


            <p className="text-xs text-gray-400">
              عدد الدفعات: {payments.length}
            </p>

          </div>

        )}


        <DialogFooter>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setOpen(false)
            }
          >
            إغلاق
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
}