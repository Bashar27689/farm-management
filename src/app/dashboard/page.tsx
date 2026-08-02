// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductionForm from '../../components/ProductionForm';
import SalesForm from '../../components/SalesForm';
import SupplyForm from '../../components/SupplyForm';
import UsersManagement from '../../components/UsersManagement';
import DashboardStats from '../../components/DashboardStats';
import Image from 'next/image';
import farmLogo from '../../../public/assets/farm Logo.png';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
          return;
        }
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  const tabs = [
    
    { id: 'production', label: '🥚 إنتاج' },
    { id: 'sales', label: '💰 مبيعات' },
    { id: 'supplies', label: '📦 مستلزمات' },
  ];

  if (user?.role === 'ADMIN') {
    tabs.push({ id: 'users', label: '👥 مستخدمين' });
    tabs.push({ id: 'stats', label: '📊 نظرة عامة' });
  }

  return (
    <div className="min-h-screen bg-gray-100 rtl" dir="rtl">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <header className="bg-white shadow-md p-4 rounded-2xl mb-6 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={farmLogo} alt="Logo" width={50} height={50} className="w-12 h-12" />
            <h1 className="text-xl font-bold text-green-700"> بيض الريف</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              مرحباً {user?.name}
              {user?.role === 'ADMIN' && (
                <span className="mr-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  مدير
                </span>
              )}
            </span>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition text-sm"
            >
              خروج
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'stats' && user?.role === 'ADMIN'  && <DashboardStats />}
          {activeTab === 'production' && <ProductionForm />}
          {activeTab === 'sales' && <SalesForm />}
          {activeTab === 'supplies' && <SupplyForm />}
          {activeTab === 'users' && user?.role === 'ADMIN' && <UsersManagement />}
        </div>
      </div>
    </div>
  );
}