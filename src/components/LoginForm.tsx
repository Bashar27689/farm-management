// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import farmLogo from "../../public/assets/farm-Logo.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Eye, EyeOff, User, Lock, LogIn } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.message || "خطأ في تسجيل الدخول");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10">
        {/* Top Accent Bar */}
        <div 
          className="h-1.5 w-full rounded-t-2xl"
        />
        
        <CardHeader className="text-center pt-8">
          <div className="relative inline-block mx-auto">
            <div 
              className="absolute inset-0 blur-2xl opacity-20 rounded-full"
              style={{ backgroundColor: '#EF6C00' }}
            />
            <Image
              src={farmLogo}
              alt="Logo"
              width={120}
              height={120}
              className="relative mx-auto w-28 h-28 object-contain"
              loading="eager" 
            />
          </div>
          <CardTitle 
            className="text-3xl font-bold mt-4"
            style={{ color: '#2E7D32' }}
          >
        بيض المراعي
          </CardTitle>
          <CardDescription 
            className="text-sm"
            style={{ color: '#374151' }}
          >
            نظام الإدارة المتكامل
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="username"
                style={{ color: '#374151' }}
                className="text-sm font-medium"
              >
                اسم المستخدم
              </Label>
              <div className="relative">
                <User 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: '#2E7D32' }}
                />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-13 pr-11 pl-12 rounded-xl transition-all duration-300 focus:ring-2 text-base"
                  style={{
                    backgroundColor: '#FDFBF7',
                    borderColor: '#E5E7EB',
                    color: '#374151'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2E7D32';
                    e.target.style.boxShadow = '0 0 0 4px rgba(46, 125, 50, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                  disabled={loading}
                  placeholder="أدخل اسم المستخدم"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="password"
                  style={{ color: '#374151' }}
                  className="text-sm font-medium"
                >
                  كلمة المرور
                </Label>
                
              </div>
              <div className="relative">
                <Lock 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: '#2E7D32' }}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-13 pr-11 pl-12 rounded-xl transition-all duration-300 focus:ring-2 text-base"
                  style={{
                    backgroundColor: '#FDFBF7',
                    borderColor: '#E5E7EB',
                    color: '#374151'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2E7D32';
                    e.target.style.boxShadow = '0 0 0 4px rgba(46, 125, 50, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                  disabled={loading}
                  placeholder="أدخل كلمة المرور"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" style={{ color: '#374151' }} />
                  ) : (
                    <Eye className="w-4 h-4" style={{ color: '#374151' }} />
                  )}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert 
                variant="destructive"
                className="rounded-xl border"
                style={{
                  backgroundColor: '#FEE2E2',
                  borderColor: '#FCA5A5'
                }}
              >
                <AlertDescription 
                  className="text-sm flex items-center gap-2"
                  style={{ color: '#DC2626' }}
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group h-13"
              style={{
                backgroundColor: '#2E7D32',
                color: '#FFFFFF',
              }}
            >
              <span className=" relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول
                  </>
                )}
              </span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{ backgroundColor: '#EF6C00' }}
              />
            </Button>
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#E5E7EB' }} />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2" style={{ backgroundColor: '#FFFFFF', color: '#6B7280' }}>
                  © {new Date().getFullYear()} جميع الحقوق محفوظة - بيض المراعي
                </span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}