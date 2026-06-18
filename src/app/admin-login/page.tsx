'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

const ADMIN_PASSWORD = '199821';
const AUTH_KEY = 'admin_authenticated';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // 检查是否已登录
  useEffect(() => {
    const authed = sessionStorage.getItem(AUTH_KEY);
    if (authed === 'true') {
      router.replace('/admin');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      // 记录后台登录日志
      fetch('/api/usage-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_name: '管理员',
          action: '登录后台',
          page: '/admin-login',
          detail: '管理员通过密码验证进入后台',
        }),
      }).catch(() => {});
      router.replace('/admin');
    } else {
      setError('密码错误，请重试');
      setPassword('');
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C8956C] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Logo size={40} />
        </div>

        {/* 登录卡片 */}
        <div className="rounded-2xl border border-[#E8E3DD] bg-white p-8 shadow-lg shadow-[#3D3630]/5">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F1EC]">
              <Lock className="h-6 w-6 text-[#C8956C]" />
            </div>
            <h1 className="font-serif text-xl font-semibold text-[#3D3630]">管理后台</h1>
            <p className="mt-1.5 text-sm text-[#8B8580]">请输入密码以继续</p>
          </div>

          {/* 密码输入 */}
          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="请输入管理密码"
                autoFocus
                className="w-full rounded-xl border border-[#E8E3DD] bg-[#FAF8F5] px-4 py-3 text-[15px] text-[#2C2825] placeholder-[#D4CDC5] outline-none transition-all focus:border-[#C8956C] focus:ring-2 focus:ring-[#C8956C]/15"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={!password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D3630] py-3 text-sm font-semibold text-white transition-all hover:bg-[#2C2825] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              进入后台
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="mt-6 text-center text-xs text-[#D4CDC5]">
          仅限管理员访问 · 如遗忘密码请联系开发者
        </p>
      </div>
    </div>
  );
}
