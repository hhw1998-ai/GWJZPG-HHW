'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Lock, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminCode, setAdminCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState('');

  // 简单的管理员验证码（实际项目中应该使用更安全的认证方式）
  const ADMIN_CODE = 'admin888';

  const handleLogin = () => {
    setError('');
    
    if (!adminCode.trim()) {
      setError('请输入验证码');
      return;
    }

    if (adminCode.trim() === ADMIN_CODE) {
      // 验证成功，跳转到管理后台
      console.log('验证成功，跳转到后台管理');
      try {
        router.push('/admin');
      } catch (err) {
        console.error('跳转失败:', err);
        setError('跳转失败，请重试');
      }
    } else {
      setError('验证码错误，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              管理员入口
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            请输入管理员验证码
          </p>
        </div>

        {/* 登录卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>身份验证</CardTitle>
            <CardDescription>
              仅授权管理员可访问后台管理功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 验证码输入 */}
            <div className="space-y-2">
              <Label htmlFor="adminCode">管理员验证码</Label>
              <Input
                id="adminCode"
                type="text"
                placeholder="请输入验证码"
                value={adminCode}
                onChange={(e) => {
                  setAdminCode(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* 提示信息 */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-100">
                <Lock className="h-5 w-5" />
                <span className="font-medium">安全提示</span>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                验证码：<span className="font-mono font-bold">{ADMIN_CODE}</span>
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                请妥善保管验证码，不要泄露给他人
              </p>
            </div>

            {/* 登录按钮 */}
            <Button
              onClick={handleLogin}
              disabled={!adminCode.trim()}
              className="w-full"
              size="lg"
            >
              进入后台
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowQR(!showQR)}
              className="w-full"
            >
              {showQR ? '隐藏扫码入口' : '查看扫码入口'}
            </Button>
            {showQR && (
              <Button
                variant="ghost"
                onClick={() => router.push('/qr-code')}
                className="w-full"
              >
                跳转到二维码页面
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="w-full"
            >
              返回首页
            </Button>
          </CardContent>
        </Card>

        {/* 底部提示 */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>管理员请妥善保管验证码</p>
        </div>
      </div>
    </div>
  );
}

