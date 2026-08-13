// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import {
  BarChart3,
  Egg,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
} from 'lucide-react';

import ProductionForm from '../../components/ProductionForm';
import SalesForm from '../../components/SalesForm';
import SupplyForm from '../../components/SupplyForm';
import UsersManagement from '../../components/UsersManagement';
import DashboardStats from '../../components/DashboardStats';

import farmLogo from '../../../public/assets/farm Logo.png';

import {
  Card,
  CardContent,
} from '../../../@/components/ui/card';

import { Button } from '../../../@/components/ui/button';

import { Badge } from '../../../@/components/ui/badge';

type TabId =
  | 'stats'
  | 'production'
  | 'sales'
  | 'supplies'
  | 'users';

type User = {
  id?: string;
  name?: string;
  role?: 'ADMIN' | 'USER';
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('stats');
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');

        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();

        setUser(data);

        // المستخدم العادي لا يملك Dashboard Stats
        if (data?.role !== 'ADMIN') {
          setActiveTab('production');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#FDFBF7]"
      >
        <Card className="w-[calc(100%-2rem)] max-w-sm border-gray-100 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
              <Egg className="h-7 w-7 animate-pulse text-[#2E7D32]" />
            </div>

            <p className="text-sm font-medium text-[#374151]">
              جاري تحميل لوحة التحكم...
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const tabs = [
    {
      id: 'production' as TabId,
      label: 'الإنتاج',
      icon: Egg,
    },
    {
      id: 'sales' as TabId,
      label: 'المبيعات',
      icon: ShoppingCart,
    },
    {
      id: 'supplies' as TabId,
      label: 'المستلزمات',
      icon: Package,
    },
  ];

  if (user?.role === 'ADMIN') {
    tabs.push(
      {
        id: 'stats' as TabId,
        label: 'نظرة عامة',
        icon: BarChart3,
      },
      {
        id: 'users' as TabId,
        label: 'المستخدمون',
        icon: Users,
      },
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#FDFBF7]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">

        {/* Header */}
        <Card className="mb-6 border-gray-100 bg-white shadow-sm">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#E8F5E9]">
                  <Image
                    src={farmLogo}
                    alt="بيض الريف"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                    priority
                  />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-[#2E7D32]">
                    بيض الريف
                  </h1>

                  <p className="text-xs text-[#374151]/60">
                    نظام الإدارة المتكامل
                  </p>
                </div>
              </div>

              {/* User */}
              <div className="flex items-center justify-between gap-3 sm:justify-end">

                <div className="flex items-center gap-3">
                  <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9] sm:flex">
                    {user?.role === 'ADMIN' ? (
                      <ShieldCheck className="h-5 w-5 text-[#2E7D32]" />
                    ) : (
                      <Users className="h-5 w-5 text-[#2E7D32]" />
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#374151]">
                      مرحباً {user?.name || 'المستخدم'}
                    </p>

                    {user?.role === 'ADMIN' && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-[#2E7D32]/30 bg-[#E8F5E9] text-[#2E7D32]"
                      >
                        مدير النظام
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2 rounded-xl border-gray-200 bg-white text-[#374151] transition-all hover:border-[#EF6C00]/30 hover:bg-[#FFF3E0] hover:text-[#EF6C00]"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    تسجيل الخروج
                  </span>
                </Button>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="mb-6 border-gray-100 bg-white shadow-sm">
          <CardContent className="p-2">
            <nav
              className="flex gap-2 overflow-x-auto"
              aria-label="التنقل الرئيسي"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'shrink-0 gap-2 rounded-xl px-4 py-2.5 transition-all duration-200',
                      isActive
                        ? 'bg-[#2E7D32] text-white shadow-sm hover:bg-[#2E7D32] hover:text-white'
                        : 'text-[#374151] hover:bg-[#FDFBF7] hover:text-[#2E7D32]',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Page Content */}
        <section>
          {activeTab === 'stats' &&
            user?.role === 'ADMIN' && (
              <DashboardStats />
            )}

          {activeTab === 'production' && (
            <ProductionForm />
          )}

          {activeTab === 'sales' && (
            <SalesForm />
          )}

          {activeTab === 'supplies' && (
            <SupplyForm />
          )}

          {activeTab === 'users' &&
            user?.role === 'ADMIN' && (
              <UsersManagement />
            )}
        </section>

      </div>
    </main>
  );
}