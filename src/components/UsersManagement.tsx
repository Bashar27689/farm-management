// src/components/UsersManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Contact,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
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

import { Badge } from '../../@/components/ui/badge';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../@/components/ui/table';
export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'USER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ تم إضافة المستخدم بنجاح');
        setNewUser({ username: '', password: '', name: '', role: 'USER' });
        fetchUsers();
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (err) {
      setMessage('❌ حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('أدخل كلمة المرور الجديدة:');
    if (!newPassword || newPassword.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        alert('✅ تم إعادة تعيين كلمة المرور بنجاح');
      } else {
        alert('❌ حدث خطأ');
      }
    } catch (err) {
      alert('❌ حدث خطأ في الاتصال');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('✅ تم حذف المستخدم بنجاح');
        fetchUsers();
      } else {
        alert('❌ حدث خطأ');
      }
    } catch (err) {
      alert('❌ حدث خطأ في الاتصال');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <Card className="border-gray-100 bg-white shadow-sm">
  <CardHeader className="pb-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
        <Users className="h-5 w-5 text-[#EF6C00]" />
      </div>

      <div>
        <CardTitle className="text-xl font-bold text-[#EF6C00]">
          إدارة المستخدمين
        </CardTitle>

        <CardDescription className="mt-1 text-[#374151]/60">
          إضافة المستخدمين وإدارة صلاحياتهم
        </CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent className="space-y-6">

    {/* إضافة مستخدم جديد */}
    <Card className="border-gray-100 bg-[#FDFBF7] shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-[#2E7D32]" />

          <CardTitle className="text-base font-semibold text-[#374151]">
            إضافة مستخدم جديد
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleCreateUser}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* اسم المستخدم */}
            <div className="space-y-2">
              <Label
                htmlFor="newUsername"
                className="font-medium text-[#374151]"
              >
                اسم المستخدم
              </Label>

              <div className="relative">
                <User
                  className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]"
                />

                <Input
                  id="newUsername"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      username: e.target.value,
                    })
                  }
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="font-medium text-[#374151]"
              >
                كلمة المرور
              </Label>

              <div className="relative">
                <Lock
                  className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]"
                />

                <Input
                  id="newPassword"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      password: e.target.value,
                    })
                  }
                  required
                  minLength={6}
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                />
              </div>

              <p className="text-xs text-gray-500">
                يجب أن تكون كلمة المرور 6 أحرف على الأقل.
              </p>
            </div>

            {/* الاسم الكامل */}
            <div className="space-y-2">
              <Label
                htmlFor="newName"
                className="font-medium text-[#374151]"
              >
                الاسم الكامل
              </Label>

              <div className="relative">
                <Contact
                  className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]"
                />

                <Input
                  id="newName"
                  type="text"
                  placeholder="أدخل الاسم الكامل"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      name: e.target.value,
                    })
                  }
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-white pr-10 text-[#374151] placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/20"
                />
              </div>
            </div>

            {/* الدور */}
            <div className="space-y-2">
              <Label
                htmlFor="newRole"
                className="font-medium text-[#374151]"
              >
                الدور
              </Label>

              <div className="relative">
                <ShieldCheck
                  className="absolute right-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#2E7D32]"
                />

                <select
                  id="newRole"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value,
                    })
                  }
                  disabled={loading}
                  className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-[#374151] outline-none transition-all focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="USER">
                    عامل
                  </option>

                  <option value="ADMIN">
                    مدير
                  </option>
                </select>
              </div>
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

          {/* زر الإضافة */}
          <Button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-[#2E7D32] px-6 text-white transition-all hover:bg-[#2E7D32]/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري الإضافة...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                إضافة مستخدم
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* قائمة المستخدمين */}
    <Card className="border-gray-100 bg-white shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#2E7D32]" />

            <CardTitle className="text-base font-semibold text-[#374151]">
              المستخدمون
            </CardTitle>
          </div>

          <Badge
            variant="outline"
            className="border-[#2E7D32]/20 bg-[#E8F5E9] text-[#2E7D32]"
          >
            {users.length} مستخدم
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FDFBF7] hover:bg-[#FDFBF7]">
                <TableHead className="text-right font-semibold text-[#374151]">
                  الاسم
                </TableHead>

                <TableHead className="text-right font-semibold text-[#374151]">
                  اسم المستخدم
                </TableHead>

                <TableHead className="text-right font-semibold text-[#374151]">
                  الدور
                </TableHead>

                <TableHead className="text-right font-semibold text-[#374151]">
                  الإجراءات
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((user: any) => (
                <TableRow
                  key={user.id}
                  className="border-gray-100 hover:bg-[#FDFBF7]"
                >
                  <TableCell className="font-medium text-[#374151]">
                    {user.name}
                  </TableCell>

                  <TableCell className="text-[#374151]">
                    {user.username}
                  </TableCell>

                  <TableCell>
                    {user.role === 'ADMIN' ? (
                      <Badge
                        variant="outline"
                        className="border-[#EF6C00]/20 bg-[#FFF3E0] text-[#EF6C00]"
                      >
                        <ShieldCheck className="ml-1 h-3.5 w-3.5" />
                        مدير
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-[#2E7D32]/20 bg-[#E8F5E9] text-[#2E7D32]"
                      >
                        <User className="ml-1 h-3.5 w-3.5" />
                        عامل
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">

                      {/* تغيير كلمة المرور */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleResetPassword(user.id)
                        }
                        className="gap-2 rounded-lg border-gray-200 text-[#374151] hover:border-[#2E7D32]/30 hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
                      >
                        <KeyRound className="h-4 w-4" />
                        تغيير كلمة المرور
                      </Button>

                      {/* حذف */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteUser(user.id)
                        }
                        className="gap-2 rounded-lg border-gray-200 text-[#374151] hover:border-[#EF6C00]/30 hover:bg-[#FFF3E0] hover:text-[#EF6C00]"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDFBF7]">
              <Users className="h-6 w-6 text-gray-400" />
            </div>

            <p className="font-medium text-[#374151]">
              لا يوجد مستخدمون
            </p>

            <p className="mt-1 text-sm text-gray-500">
              قم بإضافة مستخدم جديد للبدء.
            </p>
          </div>
        )}
      </CardContent>
    </Card>

  </CardContent>
</Card>
    </div>
  );
}