// src/components/DashboardStats.tsx
'use client';

import { useEffect, useState } from 'react';

export default function DashboardStats() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setData(data);
    } catch (err) {
      console.error('Error fetching dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <p className="text-gray-600">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <p className="text-red-600">حدث خطأ في تحميل البيانات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات اليوم */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl">
          <div className="text-3xl mb-1">🥚</div>
          <div className="text-2xl font-bold text-green-700">{data.today?.eggs || 0}</div>
          <div className="text-gray-600">بيض اليوم</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl">
          <div className="text-3xl mb-1">💰</div>
          <div className="text-2xl font-bold text-blue-700">{data.today?.revenue || 0} ل.س</div>
          <div className="text-gray-600">مبيعات اليوم</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl">
          <div className="text-3xl mb-1">📦</div>
          <div className="text-2xl font-bold text-purple-700">{data.today?.trays || 0}</div>
          <div className="text-gray-600">أطباق اليوم</div>
        </div>
      </div>

      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="font-bold mb-2 text-amber-600">📊 إحصائيات عامة</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">عدد العملاء</span>
              <span className="font-bold text-gray-600">{data.total?.customers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">عدد المستلزمات</span>
              <span className="font-bold text-gray-600">{data.total?.supplies || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تكلفة المستلزمات</span>
              <span className="font-bold text-gray-600">{data.total?.supplyCost || 0} ل.س</span>
            </div>
          </div>
        </div>
      </div>

      {/* آخر المبيعات */}
      {data.recent?.sales && data.recent.sales.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="font-bold mb-3 text-amber-600">🔄 آخر المبيعات</h3>
          <div className="space-y-2">
            {data.recent.sales.map((sale: any) => (
              <div key={sale.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="font-medium text-gray-600">{sale.shopName}</span>
                  <span className="text-gray-500 text-sm mr-2">
                    ({sale.trayCount} طبق)
                  </span>
                </div>
                <div className="text-green-600 font-bold">
                  {sale.total} ل.س
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* آخر الإنتاج */}
      {data.recent?.production && data.recent.production.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="font-bold mb-3 text-amber-600">🥚 آخر الإنتاج</h3>
          <div className="space-y-2">
            {data.recent.production.map((prod: any) => (
              <div key={prod.id} className="flex justify-between items-center border-b pb-2">
                <span className='text-gray-600'>{new Date(prod.date).toLocaleDateString('ar-SY')}</span>
                <span className="font-bold text-green-600">{prod.eggCount} بيضة</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* آخر المستلزمات */}
   {data.recent?.supplies && data.recent.supplies.length > 0 && (
  <div className="bg-white p-6 rounded-2xl shadow-md">
    <h3 className="font-bold mb-3 text-amber-600">📦 آخر المستلزمات</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-amber-50 border-b-2 border-amber-200">
            <th className="p-3 text-right text-sm font-bold text-amber-700">التاريخ</th>
            <th className="p-3 text-right text-sm font-bold text-amber-700">النوع</th>
            <th className="p-3 text-right text-sm font-bold text-amber-700">المورد</th>
            <th className="p-3 text-right text-sm font-bold text-amber-700">الكمية</th>
            <th className="p-3 text-right text-sm font-bold text-amber-700">السعر</th>
            <th className="p-3 text-right text-sm font-bold text-amber-700">المجموع</th>
          </tr>
        </thead>
        <tbody>
          {data.recent.supplies.map((supply: any) => (
            <tr key={supply.id} className="border-b hover:bg-gray-50 transition">
              <td className="p-3 text-gray-600 text-sm">
                {new Date(supply.date).toLocaleDateString('ar-SY')}
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  supply.type === 'FEED' 
                    ? 'bg-green-100 text-green-700' 
                    : supply.type === 'VACCINE' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {supply.type === 'FEED' ? 'علف' : supply.type === 'VACCINE' ? 'لقاح' : 'أخرى'}
                </span>
              </td>
              <td className="p-3 font-medium text-gray-800">
                {supply.name}
              </td>
              <td className="p-3 font-bold text-amber-600">
                {supply.quantity} {supply.type === 'FEED' ? 'كجم' : 'وحدة'}
              </td>
              <td className="p-3 font-bold text-green-600">
                {supply.price.toLocaleString()} ل.س
              </td>
              <td className="p-3 font-bold text-purple-600">
                {(supply.quantity * supply.price).toLocaleString()} ل.س
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-amber-50 border-t-2 border-amber-200">
          <tr>
            <td colSpan={5} className="p-3 text-left font-bold text-amber-700">
              إجمالي التكلفة
            </td>
            <td className="p-3 font-bold text-purple-700">
              {data.recent.supplies.reduce((sum: number, s: any) => sum + (s.quantity * s.price), 0).toLocaleString()} ل.س
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)}
    </div>
  );
}