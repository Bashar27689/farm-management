// src/components/UsersManagement.tsx
'use client';

import { useState, useEffect } from 'react';

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
      <h2 className="text-xl font-bold mb-4 text-amber-700">👥 إدارة المستخدمين</h2>

      {/* نموذج إضافة مستخدم */}
      <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-xl">
        <h3 className="font-medium mb-3 text-gray-600">إضافة مستخدم جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-amber-700"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-amber-700"
            required
            disabled={loading}
            minLength={6}
          />
          <input
            type="text"
            placeholder="الاسم الكامل"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-amber-700"
            required
            disabled={loading}
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-amber-700" 
            disabled={loading}
          >
            <option value="USER">عامل</option>
            <option value="ADMIN">مدير</option>
          </select>
        </div>
        {message && (
          <div className={`mt-3 p-3 rounded-xl text-sm ${
            message.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 '
          }`}>
            {message}
          </div>
        )}
        <button
          type="submit"
          className="mt-3 bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'جاري الإضافة...' : 'إضافة مستخدم'}
        </button>
      </form>

      {/* قائمة المستخدمين */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">اسم المستخدم</th>
              <th className="p-3 text-right">الدور</th>
              <th className="p-3 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-amber-700">{user.name}</td>
                <td className="p-3 text-amber-700">{user.username}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'ADMIN' ? 'مدير' : 'عامل'}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => handleResetPassword(user.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    تغيير كلمة المرور
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}