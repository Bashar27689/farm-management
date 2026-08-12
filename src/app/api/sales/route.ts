// src/app/api/sales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { shopName, trayCount, pricePerTray, customerName, customerPhone, date } = await request.json();

    if (!shopName || !trayCount || !pricePerTray) {
      return NextResponse.json(
        { message: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const total = parseInt(trayCount) * parseInt(pricePerTray);
    let customer = null;

    // البحث عن العميل أو إنشاؤه
    if (customerName && customerPhone) {
      customer = await prisma.customer.upsert({
        where: { phone: customerPhone },
        update: { name: customerName },
        create: { name: customerName, phone: customerPhone }
      });
    }

    // إنشاء المبيعات
    const sales = await prisma.sales.create({
      data: {
        shopName,
        trayCount: parseInt(trayCount),
        pricePerTray: parseInt(pricePerTray),
        total,
        date: date ? new Date(date) : new Date(),
        customerId: customer?.id || null,
      },
      include: { customer: true }
    });

    // إنشاء فاتورة - إصلاح المشكلة
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // التأكد من وجود customerId
    let invoiceCustomerId = customer?.id;
    if (!invoiceCustomerId) {
      // إذا لم يكن هناك عميل، نستخدم عميل افتراضي أو ننشئ واحد
      const defaultCustomer = await prisma.customer.upsert({
        where: { phone: '000000000' },
        update: {},
        create: {
          name: 'عميل نقدي',
          phone: '000000000'
        }
      });
      invoiceCustomerId = defaultCustomer.id;
    }

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        date: sales.date,
        customerId: invoiceCustomerId,
        items: JSON.stringify({
          shopName: sales.shopName,
          trayCount: sales.trayCount,
          pricePerTray: sales.pricePerTray,
        }),
        total: sales.total,
        salesId: sales.id,
      }
    });

    // تحديث المبيعات برقم الفاتورة
    await prisma.sales.update({
      where: { id: sales.id },
      data: { invoiceId: invoice.id }
    });

    // جلب الفاتورة مع بيانات العميل
    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { customer: true }
    });

    return NextResponse.json({
      message: 'تم إدخال المبيعات بنجاح',
      sales,
      invoice: fullInvoice
    });

  } catch (error) {
    console.error('Error creating sales:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const sales = await prisma.sales.findMany({
      where,
      include: { 
        customer: true, 
        invoice: {
          include: { customer: true }
        } 
      },
      orderBy: { date: 'desc' }
    });

const totalRevenue = sales.reduce(
  (
    sum: number,
    s: { total: number }
  ) => sum + s.total,
  0
);

const totalTrays = sales.reduce(
  (
    sum: number,
    s: { trayCount: number }
  ) => sum + s.trayCount,
  0
);

    return NextResponse.json({
      sales,
      stats: {
        totalRevenue,
        totalTrays,
        totalOrders: sales.length
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}