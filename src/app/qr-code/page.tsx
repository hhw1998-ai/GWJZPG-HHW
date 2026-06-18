'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Share2, Copy, Check, Smartphone, Lock, Shield, AlertCircle } from 'lucide-react';

export default function QRCodePage() {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const ADMIN_PASSWORD = '8888';

  useEffect(() => {
    // 获取当前页面的完整URL（去掉 qr-code 路径）
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.pathname = '/';
      const fullUrl = url.toString();
      setCurrentUrl(fullUrl);
      console.log('二维码 URL:', fullUrl);
    }
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '岗位价值评估系统',
          text: '请扫描二维码或点击链接进行岗位价值评估',
          url: currentUrl,
        });
      } catch (error) {
        console.error('分享失败:', error);
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleAdminLogin = () => {
    setAdminError('');
    
    if (!adminPassword.trim()) {
      setAdminError('请输入密码');
      return;
    }

    if (adminPassword.trim() === ADMIN_PASSWORD) {
      // 验证成功，跳转到管理后台
      setShowAdminDialog(false);
      setAdminPassword('');
      window.location.href = '/admin-login';
    } else {
      setAdminError('密码错误，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Smartphone className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              扫码进入评估
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            请使用微信扫描下方二维码
          </p>
        </div>

        {/* 二维码 */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            {currentUrl ? (
              <QRCodeCanvas
                value={currentUrl}
                size={240}
                level="H"
                includeMargin={true}
              />
            ) : (
              <div className="w-[240px] h-[240px] flex items-center justify-center text-gray-400">
                加载中...
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            <p>二维码有效期：长期有效</p>
            <p className="mt-1">适用于微信、支付宝等扫码工具</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  复制链接
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </Button>
          </div>
          <Button
            onClick={() => setShowAdminDialog(true)}
            variant="ghost"
            className="w-full text-gray-600 dark:text-gray-400"
          >
            <Shield className="h-4 w-4 mr-2" />
            进入控制后台
          </Button>
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            使用说明
          </h3>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
            <li>使用微信扫描二维码</li>
            <li>填写评估人姓名</li>
            <li>进入评分页面开始评估</li>
            <li>完成评分后点击保存</li>
          </ol>
        </div>

        {/* 底部提示 */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>如有问题，请联系系统管理员</p>
        </div>
      </Card>

      {/* 管理员登录对话框 */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              管理员验证
            </DialogTitle>
            <DialogDescription>
              请输入管理员密码以访问控制后台
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">管理员密码</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="请输入密码"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminLogin();
                  }
                }}
              />
              {adminError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{adminError}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdminDialog(false);
                setAdminPassword('');
                setAdminError('');
              }}
            >
              取消
            </Button>
            <Button onClick={handleAdminLogin}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

