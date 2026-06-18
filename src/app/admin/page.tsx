'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  Upload,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Download,
  Unlock,
  History,
  CheckCircle,
  AlertCircle,
  FileWarning,
  BarChart3,
  Users,
  TrendingUp,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react';
import { LogoIcon } from '@/components/logo';
import { DashboardTab } from '@/components/admin/dashboard-tab';
import { RankingsTab } from '@/components/admin/rankings-tab';
import { UnlockTab } from '@/components/admin/unlock-tab';
import { LogsTab } from '@/components/admin/logs-tab';
import { UsageTab } from '@/components/admin/usage-tab';
import type {
  RankingItem,
  PositionDetail,
  SubmittedEvaluator,
  OperationLog,
  UsageLog,
  PreviewResult,
  ImportResult,
} from '@/components/admin/types';
import * as XLSX from 'xlsx';

const AUTH_KEY = 'hhw_admin_authed';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [positionDetails, setPositionDetails] = useState<PositionDetail[]>([]);
  const [submittedEvaluators, setSubmittedEvaluators] = useState<SubmittedEvaluator[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rankingsRes, unlockRes, logsRes, usageLogsRes] = await Promise.all([
        fetch('/api/rankings'),
        fetch('/api/admin/unlock'),
        fetch('/api/admin/operation-logs'),
        fetch('/api/usage-logs?limit=200', {
          headers: { 'x-admin-token': sessionStorage.getItem('hhw_admin_token') || '' },
        }),
      ]);

      if (rankingsRes.ok) {
        const data = await rankingsRes.json();
        setRankings(data.rankings || []);
        setPositionDetails(
          (data.rankings || []).map((r: RankingItem) => ({
            ...r,
            expanded: false,
            detailedScores: [],
          }))
        );
      }

      if (unlockRes.ok) {
        const data = await unlockRes.json();
        setSubmittedEvaluators(data.evaluators || []);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setOperationLogs(data.logs || []);
      }

      if (usageLogsRes.ok) {
        const data = await usageLogsRes.json();
        setUsageLogs(data.data || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 密码验证检查
  useEffect(() => {
    const authed = sessionStorage.getItem(AUTH_KEY);
    if (authed !== 'true') {
      router.replace('/admin-login');
    } else {
      setIsAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthChecked) {
      loadData();
    }
  }, [loadData, isAuthChecked]);

  const togglePositionExpand = async (positionId: string) => {
    const updated = positionDetails.map((p) => {
      if (p.positionId === positionId) {
        return { ...p, expanded: !p.expanded };
      }
      return p;
    });
    setPositionDetails(updated);

    const target = updated.find((p) => p.positionId === positionId);
    if (target?.expanded && target.detailedScores.length === 0) {
      try {
        const res = await fetch(`/api/admin/detailed-scores?positionId=${positionId}`);
        if (res.ok) {
          const data = await res.json();
          setPositionDetails((prev) =>
            prev.map((p) =>
              p.positionId === positionId
                ? { ...p, detailedScores: data.scores || [] }
                : p
            )
          );
        }
      } catch (error) {
        console.error('加载详细评分失败:', error);
      }
    }
  };

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluatorName: selectedEvaluator }),
      });
      if (res.ok) {
        setShowUnlockDialog(false);
        await loadData();
      } else {
        alert('解锁失败，请重试');
      }
    } catch (error) {
      console.error('解锁失败:', error);
      alert('解锁失败，请重试');
    } finally {
      setUnlocking(false);
    }
  };

  const handleClearScores = async () => {
    setIsOperating(true);
    try {
      const res = await fetch('/api/admin/reset', { method: 'DELETE' });
      if (res.ok) {
        setShowClearDialog(false);
        await loadData();
      } else {
        alert('清空失败，请重试');
      }
    } catch (error) {
      console.error('清空失败:', error);
      alert('清空失败，请重试');
    } finally {
      setIsOperating(false);
    }
  };

  const handleFullReset = async () => {
    setIsOperating(true);
    try {
      const res = await fetch('/api/admin/full-reset', { method: 'DELETE' });
      if (res.ok) {
        setShowResetDialog(false);
        await loadData();
      } else {
        alert('重置失败，请重试');
      }
    } catch (error) {
      console.error('重置失败:', error);
      alert('重置失败，请重试');
    } finally {
      setIsOperating(false);
    }
  };

  const handlePreviewExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPreviewing(true);
    setPreviewResult(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/preview-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setPreviewResult(data);
    } catch (error) {
      console.error('预览失败:', error);
      alert('文件识读失败，请检查文件格式');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewResult) return;

    setIsConfirming(true);
    try {
      const res = await fetch('/api/confirm-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: previewResult.positions }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请重试');
    } finally {
      setIsConfirming(false);
    }
  };

  const downloadPreviewErrorReport = () => {
    if (!previewResult?.errors.length) return;
    const ws = XLSX.utils.json_to_sheet(
      previewResult.errors.map((e) => ({
        '行号': e.rowIndex,
        '公司': e.companyName,
        '错误类型': e.errorType,
        '错误描述': e.message,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '错误报告');
    XLSX.writeFile(wb, `Excel导入错误报告_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadImportErrorReport = () => {
    if (!importResult?.errors?.length) return;
    const ws = XLSX.utils.json_to_sheet(
      importResult.errors.map((e) => ({
        '行号': e.rowIndex,
        '公司': e.companyName,
        '错误类型': e.errorType,
        '错误描述': e.message,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '导入错误报告');
    XLSX.writeFile(wb, `导入错误报告_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportExcel = async () => {
    try {
      const exportData: Record<string, string | number>[] = [];

      for (const position of positionDetails) {
        if (position.detailedScores.length === 0) {
          try {
            const res = await fetch(`/api/admin/detailed-scores?positionId=${position.positionId}`);
            if (res.ok) {
              const data = await res.json();
              position.detailedScores = data.scores || [];
            }
          } catch (error) {
            console.error('加载详细评分失败:', error);
          }
        }

        position.detailedScores.forEach((score) => {
          exportData.push({
            '排名': '',
            '公司': position.companyName,
            '部门': position.department,
            '岗位': position.positionName,
            '评估人': score.evaluatorName,
            '影响范围': score.scores.impact_range || '',
            '影响程度': score.scores.impact_level || '',
            '问题复杂性': score.scores.problem_complexity || '',
            '问题解决': score.scores.problem_solving || '',
            '领导范围': score.scores.leadership_range || '',
            '领导方式': score.scores.leadership_style || '',
            '内部沟通': score.scores.internal_communication || '',
            '外部沟通': score.scores.external_communication || '',
            '知识范围': score.scores.knowledge_scope || '',
            '知识水平': score.scores.knowledge_level || '',
            '环境舒适度': score.scores.environment_comfort || '',
            '工作均衡性': score.scores.work_balance || '',
            '工作时间': score.scores.work_time || '',
            '可替代性': score.scores.replaceability || '',
            '总分': score.totalScore,
            '备注': '',
          });
        });

        exportData.push({
          '排名': '', '公司': '', '部门': '', '岗位': '', '评估人': '',
          '影响范围': '', '影响程度': '', '问题复杂性': '', '问题解决': '',
          '领导范围': '', '领导方式': '', '内部沟通': '', '外部沟通': '',
          '知识范围': '', '知识水平': '', '环境舒适度': '', '工作均衡性': '',
          '工作时间': '', '可替代性': '', '总分': '', '备注': '',
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 6 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 8 }, { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '岗位价值评估明细');

      const sortedPositions = [...positionDetails].sort((a, b) => b.averageScore - a.averageScore);
      const rankingData = sortedPositions.map((position, index) => ({
        '排名': index + 1,
        '公司': position.companyName,
        '部门': position.department,
        '岗位': position.positionName,
        '千分制得分': position.averageScore,
        '评分人数': position.evaluationCount,
        '备注': '',
      }));

      const rankingSheet = XLSX.utils.json_to_sheet(rankingData);
      rankingSheet['!cols'] = [
        { wch: 6 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 10 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, rankingSheet, '岗位排名总表');

      const fileName = `岗位价值评估明细_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // Helpers
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const formatOperationType = (type: string) => {
    if (type.includes('unlock')) return '解锁';
    if (type.includes('modify')) return '修改';
    return type;
  };

  const getUsageActionColor = (action: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      '开始评估': { bg: '#F0F7F0', text: '#5B8C5A' },
      '进入评分': { bg: '#F5F2EE', text: '#3D3630' },
      '提交评分': { bg: '#FFF8F0', text: '#D4954B' },
      '后台登录': { bg: '#FDF5ED', text: '#C8956C' },
    };
    return map[action] || { bg: '#F5F2EE', text: '#8B8580' };
  };

  // Compute dashboard stats
  const totalPositions = rankings.length;
  const evaluatedPositions = rankings.filter((r) => r.evaluationCount > 0).length;
  const totalEvaluators = new Set(rankings.flatMap((r) => r.evaluators)).size;
  const avgScore =
    rankings.length > 0
      ? Math.round(rankings.reduce((sum, r) => sum + r.averageScore, 0) / rankings.length)
      : 0;
  const topScore = rankings.length > 0 ? rankings[0].averageScore : 0;
  const bottomScore = rankings.length > 0 ? rankings[rankings.length - 1].averageScore : 0;
  const evaluationRate = totalPositions > 0 ? Math.round((evaluatedPositions / totalPositions) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#E8E3DD', borderTopColor: '#C8956C' }} />
          <p className="text-sm" style={{ color: '#8B8580' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderColor: '#E8E3DD' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="hover:bg-[#F5F2EE]"
            >
              <ChevronLeft className="h-5 w-5" style={{ color: '#3D3630' }} />
            </Button>
            <div className="flex items-center gap-3">
              <LogoIcon size={28} />
              <div>
                <h1 className="text-base font-semibold" style={{ color: '#2C2825', fontFamily: "'DM Serif Display', serif" }}>
                  评估管理后台
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#D4CDC5] hidden sm:inline">黄宏伟</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-sm"
              style={{ color: '#8B8580' }}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              退出后台
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Page Title & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium tracking-wider uppercase" style={{ color: '#C8956C' }}>Admin Workspace</p>
            <h2 className="text-xl font-semibold mt-0.5" style={{ color: '#2C2825' }}>数据总览与系统管理</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
              className="border-[#E8E3DD] text-[#3D3630] hover:bg-[#F5F2EE]"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              导入数据
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="border-[#E8E3DD] text-[#3D3630] hover:bg-[#F5F2EE]"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              刷新
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={rankings.length === 0}
              className="border-[#E8E3DD] text-[#3D3630] hover:bg-[#F5F2EE]"
            >
              <Download className="h-4 w-4 mr-1.5" />
              导出 Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="border-[#E8E3DD] text-[#D4954B] hover:bg-[#FFF8F0]"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              清空评分
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="border-[#E8E3DD] text-red-600 hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              完全重置
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start gap-0 border-b rounded-none bg-transparent p-0" style={{ borderColor: '#E8E3DD' }}>
            {[
              { value: 'dashboard', label: '仪表盘', icon: BarChart3 },
              { value: 'rankings', label: '岗位排名', icon: TrendingUp },
              { value: 'unlock', label: '评分解锁', icon: Unlock },
              { value: 'logs', label: '操作日志', icon: History },
              { value: 'usage', label: '使用日志', icon: Users },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 px-4 py-3 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-[#C8956C] data-[state=active]:text-[#3D3630] data-[state=active]:shadow-none text-[#8B8580] hover:text-[#3D3630] transition-colors"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <DashboardTab
              totalPositions={totalPositions}
              evaluatedPositions={evaluatedPositions}
              evaluationRate={evaluationRate}
              totalEvaluators={totalEvaluators}
              avgScore={avgScore}
              topScore={topScore}
              bottomScore={bottomScore}
              rankings={rankings}
              operationLogs={operationLogs}
              onImportClick={() => setShowImportDialog(true)}
              onExportClick={handleExportExcel}
              onUnlockTabClick={() => setActiveTab('unlock')}
              formatDateTime={formatDateTime}
              formatOperationType={formatOperationType}
            />
          </TabsContent>

          <TabsContent value="rankings" className="mt-6">
            <RankingsTab
              positionDetails={positionDetails}
              onToggleExpand={togglePositionExpand}
            />
          </TabsContent>

          <TabsContent value="unlock" className="mt-6">
            <UnlockTab
              submittedEvaluators={submittedEvaluators}
              onUnlockClick={(name) => {
                setSelectedEvaluator(name);
                setShowUnlockDialog(true);
              }}
            />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <LogsTab
              operationLogs={operationLogs}
              formatDateTime={formatDateTime}
              formatOperationType={formatOperationType}
            />
          </TabsContent>

          <TabsContent value="usage" className="mt-6">
            <UsageTab
              usageLogs={usageLogs}
              formatDateTime={formatDateTime}
              getUsageActionColor={getUsageActionColor}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Unlock Confirm Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="border-[#E8E3DD]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: '#D4954B' }}>
              <Unlock className="h-5 w-5" />
              解锁评分
            </DialogTitle>
            <DialogDescription style={{ color: '#8B8580' }}>
              解锁后，该评估人可以重新修改评分数据
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg p-4 my-4 text-sm" style={{ backgroundColor: '#FFF8F0', border: '1px solid #F0E0D0', color: '#8B6914' }}>
            确定要解锁 <strong>{selectedEvaluator}</strong> 的评分吗？
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlockDialog(false)} disabled={unlocking} className="border-[#E8E3DD]">
              取消
            </Button>
            <Button onClick={handleUnlock} disabled={unlocking} style={{ backgroundColor: '#D4954B' }} className="hover:opacity-90 text-white">
              {unlocking ? '处理中...' : '确认解锁'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Scores Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="border-[#E8E3DD]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: '#D4954B' }}>
              <Trash2 className="h-5 w-5" />
              清空评分数据
            </DialogTitle>
            <DialogDescription style={{ color: '#8B8580' }}>
              此操作将删除所有评分记录和评估人数据，但保留岗位和公司信息。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg p-4 my-4 text-sm" style={{ backgroundColor: '#FFF8F0', border: '1px solid #F0E0D0', color: '#8B6914' }}>
            此操作不可恢复，请确认是否继续？
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)} disabled={isOperating} className="border-[#E8E3DD]">
              取消
            </Button>
            <Button variant="destructive" onClick={handleClearScores} disabled={isOperating}>
              {isOperating ? '处理中...' : '确认清空'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="border-[#E8E3DD]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              完全重置系统
            </DialogTitle>
            <DialogDescription style={{ color: '#8B8580' }}>
              此操作将删除所有数据，包括评分记录、评估人、岗位和公司信息。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg p-4 my-4 text-sm" style={{ backgroundColor: '#FFF0F0', border: '1px solid #F0D0D0', color: '#CC5555' }}>
            危险操作！此操作将完全清空系统，所有数据将无法恢复！
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} disabled={isOperating} className="border-[#E8E3DD]">
              取消
            </Button>
            <Button variant="destructive" onClick={handleFullReset} disabled={isOperating}>
              {isOperating ? '处理中...' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-[#E8E3DD]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: '#5B8C5A' }}>
              <Upload className="h-5 w-5" />
              导入岗位数据
            </DialogTitle>
            <DialogDescription style={{ color: '#8B8580' }}>
              支持 Excel 文件 (.xlsx, .xls)，用于初始化或更新岗位数据
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 格式说明卡片 */}
            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: '#E8E3DD', backgroundColor: '#FAF8F5' }}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold" style={{ color: '#3D3630' }}>Excel 格式规范</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-[#C8956C] text-[#C8956C] hover:bg-[#FDF5ED]"
                  onClick={() => {
                    const wb = XLSX.utils.book_new();
                    const wsData = [
                      ['XX公司', '', ''],
                      ['', '', ''],
                      ['', '', ''],
                      ['', '', ''],
                      ['序号', '部门', '岗位名称'],
                      ['1', '办公室', '主任'],
                      ['2', '办公室', '副主任'],
                      ['3', '财务部', '经理'],
                      ['4', '财务部', '会计'],
                      ['5', '人力资源部', '经理'],
                      ['6', '人力资源部', '专员'],
                      ['7', '市场部', '经理'],
                      ['8', '市场部', '主管'],
                      ['', '', ''],
                      ['', '', ''],
                      ['XX中心', '', ''],
                      ['', '', ''],
                      ['', '', ''],
                      ['', '', ''],
                      ['序号', '部门', '岗位名称'],
                      ['1', '技术部', '总监'],
                      ['2', '技术部', '工程师'],
                      ['3', '运营部', '经理'],
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(wsData);
                    ws['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 16 }];
                    XLSX.utils.book_append_sheet(wb, ws, 'XX公司');
                    XLSX.writeFile(wb, '岗位数据导入模板.xlsx');
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  下载模板
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs" style={{ color: '#6B6560' }}>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#C8956C] whitespace-nowrap">第1行A列</span>
                  <span>填写公司/中心名称（如：XX公司、XX中心），系统自动识读</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#C8956C] whitespace-nowrap">第2-4行</span>
                  <span>可留空或填写备注信息（系统自动跳过）</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#C8956C] whitespace-nowrap">第5行</span>
                  <span>列标题行（A列：序号、B列：部门、C列：岗位名称）</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#C8956C] whitespace-nowrap">第6行起</span>
                  <span>逐行填写岗位数据，<strong>C列岗位名称必填</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#C8956C] whitespace-nowrap">多公司</span>
                  <span>不同公司放在不同工作表（Sheet）中，每个 Sheet 格式同上</span>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handlePreviewExcel}
              className="hidden"
              id="admin-excel-upload"
            />
            <Button
              variant="outline"
              className="w-full border-[#E8E3DD] text-[#3D3630] hover:bg-[#F5F2EE]"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPreviewing || isConfirming}
            >
              {isPreviewing ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin mr-2" style={{ borderColor: '#E8E3DD', borderTopColor: '#C8956C' }} />
                  识读中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {previewResult ? '重新选择文件' : '选择 Excel 文件'}
                </>
              )}
            </Button>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-xs" style={{ color: '#8B8580' }}>
              <span className="px-2 py-1 rounded" style={{ backgroundColor: previewResult ? '#F0F7F0' : '#F5F2EE', color: previewResult ? '#5B8C5A' : '#3D3630' }}>
                {previewResult ? '\u2713' : '1.'} 选择文件
              </span>
              <span style={{ color: '#E8E3DD' }}>&rarr;</span>
              <span className="px-2 py-1 rounded" style={{
                backgroundColor: importResult ? '#F0F7F0' : previewResult ? '#F5F2EE' : '#F5F2EE',
                color: importResult ? '#5B8C5A' : previewResult ? '#3D3630' : '#C0B8B0',
              }}>
                {importResult ? '\u2713' : '2.'} 确认导入
              </span>
            </div>

            {/* Preview Result */}
            {previewResult && !importResult && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{
                  backgroundColor: previewResult.success
                    ? previewResult.errors.length > 0 ? '#FFF8F0' : '#F0F7F0'
                    : '#FFF0F0',
                  color: previewResult.success
                    ? previewResult.errors.length > 0 ? '#8B6914' : '#3D5A3D'
                    : '#CC5555',
                }}>
                  {previewResult.success ? (
                    previewResult.errors.length > 0 ? <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{previewResult.message}</p>
                  </div>
                </div>

                {previewResult.detectedCompanies.length > 0 && (
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#D0E8D0' }}>
                    <div className="px-3 py-2" style={{ backgroundColor: '#F0F7F0' }}>
                      <span className="text-sm font-medium" style={{ color: '#3D5A3D' }}>
                        识别到 {previewResult.detectedCompanies.length} 个公司/中心
                      </span>
                    </div>
                    <div className="p-2 flex flex-wrap gap-1">
                      {previewResult.detectedCompanies.map((company, index) => (
                        <span key={index} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#F0F7F0', color: '#3D5A3D' }}>
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded" style={{ backgroundColor: '#F5F2EE' }}>
                    <div className="text-lg font-bold" style={{ color: '#3D3630', fontFamily: "'JetBrains Mono', monospace" }}>{previewResult.totalPositions}</div>
                    <div className="text-xs" style={{ color: '#8B8580' }}>总行数</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: '#F0F7F0' }}>
                    <div className="text-lg font-bold" style={{ color: '#5B8C5A', fontFamily: "'JetBrains Mono', monospace" }}>{previewResult.validPositions}</div>
                    <div className="text-xs" style={{ color: '#5B8C5A' }}>有效岗位</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: '#FFF0F0' }}>
                    <div className="text-lg font-bold" style={{ color: '#CC5555', fontFamily: "'JetBrains Mono', monospace" }}>{previewResult.invalidPositions}</div>
                    <div className="text-xs" style={{ color: '#CC5555' }}>错误行数</div>
                  </div>
                </div>

                {previewResult.positions.length > 0 && (
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E8E3DD' }}>
                    <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: '#F5F2EE' }}>
                      <span className="text-sm font-medium" style={{ color: '#3D3630' }}>
                        有效岗位列表（共 {previewResult.positions.length} 个）
                      </span>
                    </div>
                    <ScrollArea className="h-40">
                      <div className="p-2 space-y-1">
                        {previewResult.positions.slice(0, 50).map((pos, index) => (
                          <div key={index} className="text-xs p-2 rounded border" style={{ borderColor: '#F5F2EE' }}>
                            <span className="font-medium" style={{ color: '#3D3630' }}>
                              [{pos.companyName}]
                            </span>
                            <span style={{ color: '#8B8580' }} className="ml-1">
                              {pos.department ? `${pos.department} - ` : ''}
                            </span>
                            <span style={{ color: '#5B8C5A' }}>
                              {pos.positionName}
                            </span>
                          </div>
                        ))}
                        {previewResult.positions.length > 50 && (
                          <div className="text-xs text-center py-2" style={{ color: '#C0B8B0' }}>
                            还有 {previewResult.positions.length - 50} 个岗位未显示...
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {previewResult.errors.length > 0 && (
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#F0D0D0' }}>
                    <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: '#FFF0F0' }}>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#CC5555' }}>
                        <FileWarning className="h-4 w-4" />
                        <span className="font-medium">发现 {previewResult.errors.length} 个错误</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={downloadPreviewErrorReport} className="h-7 text-xs border-[#E8E3DD]">
                        <Download className="h-3 w-3 mr-1" />
                        下载错误报告
                      </Button>
                    </div>
                    <ScrollArea className="h-40">
                      <div className="p-2 space-y-1">
                        {previewResult.errors.slice(0, 30).map((err, index) => (
                          <div key={index} className="text-xs p-2 rounded border" style={{ borderColor: '#F5E0E0', backgroundColor: '#FFF5F5' }}>
                            <span className="font-medium" style={{ color: '#CC5555' }}>第{err.rowIndex}行</span>
                            <span className="ml-2" style={{ color: '#8B8580' }}>[{err.companyName}]</span>
                            <span className="ml-2" style={{ color: '#CC5555' }}>{err.message}</span>
                          </div>
                        ))}
                        {previewResult.errors.length > 30 && (
                          <div className="text-xs text-center py-2" style={{ color: '#C0B8B0' }}>
                            还有 {previewResult.errors.length - 30} 个错误未显示...
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {previewResult.success && (
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: '#5B8C5A' }}
                    onClick={handleConfirmImport}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <>
                        <div className="w-4 h-4 border-2 rounded-full animate-spin mr-2" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF' }} />
                        导入中...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        确认导入 {previewResult.validPositions} 个岗位
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{
                  backgroundColor: importResult.success ? '#F0F7F0' : '#FFF0F0',
                  color: importResult.success ? '#3D5A3D' : '#CC5555',
                }}>
                  {importResult.success ? <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-medium">{importResult.message}</p>
                    <p className="text-xs mt-1">
                      创建 {importResult.created} 个岗位，跳过 {importResult.skipped} 个重复岗位
                    </p>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#F0D0D0' }}>
                    <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: '#FFF0F0' }}>
                      <span className="text-sm font-medium" style={{ color: '#CC5555' }}>
                        导入失败 {importResult.errors.length} 条
                      </span>
                      <Button variant="outline" size="sm" onClick={downloadImportErrorReport} className="h-7 text-xs border-[#E8E3DD]">
                        <Download className="h-3 w-3 mr-1" />
                        下载错误报告
                      </Button>
                    </div>
                    <ScrollArea className="h-32">
                      <div className="p-2 space-y-1">
                        {importResult.errors.slice(0, 20).map((err, index) => (
                          <div key={index} className="text-xs p-2 rounded border" style={{ borderColor: '#F5E0E0', backgroundColor: '#FFF5F5' }}>
                            <span className="font-medium" style={{ color: '#CC5555' }}>第{err.rowIndex}行</span>
                            <span className="ml-2" style={{ color: '#CC5555' }}>{err.message}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
