'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Users, ChevronRight, QrCode } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [evaluatorName, setEvaluatorName] = useState('');
  const [positionCount, setPositionCount] = useState(0);

  // 加载岗位数量
  useEffect(() => {
    const loadPositionCount = async () => {
      try {
        const response = await fetch('/api/positions');
        const result = await response.json();
        if (result.data) {
          setPositionCount(result.data.length);
        }
      } catch (error) {
        console.error('加载岗位数量失败:', error);
      }
    };
    loadPositionCount();
  }, []);

  const handleStartEvaluation = () => {
    if (!evaluatorName.trim()) {
      alert('请填写评估人姓名');
      return;
    }

    // 存储评估人姓名
    localStorage.setItem('evaluator_name', evaluatorName.trim());

    // 跳转到评分页面
    router.push('/evaluation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            岗位价值评估系统
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            高唐县财信投资发展集团有限公司
          </p>
        </div>

        {/* 主卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>开始评估</CardTitle>
            <CardDescription>
              请填写评估人信息，系统将加载集团所有岗位
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 评估人姓名 */}
            <div className="space-y-2">
              <Label htmlFor="evaluator">评估人姓名</Label>
              <Input
                id="evaluator"
                placeholder="请输入评估人姓名"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && evaluatorName.trim()) {
                    handleStartEvaluation();
                  }
                }}
              />
            </div>

            {/* 信息提示 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-100">
                <Users className="h-5 w-5" />
                <span className="font-medium">评估范围</span>
              </div>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-7">
                <li>• 集团总部 + 所有下属公司</li>
                <li>• 共 {positionCount} 个岗位</li>
                <li>• 14 个评估维度</li>
              </ul>
            </div>

            {/* 开始按钮 */}
            <Button
              onClick={handleStartEvaluation}
              disabled={!evaluatorName.trim()}
              className="w-full"
              size="lg"
            >
              开始评分
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 二维码入口 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/qr-code')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                  <QrCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">扫码评估入口</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">获取二维码，支持微信扫码评估</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* 底部提示 */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>请认真填写评分，确保评估结果的准确性</p>
        </div>
      </div>
    </div>
  );
}
