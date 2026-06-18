'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Download, RefreshCw, Trash2, AlertTriangle, ChevronDown, ChevronUp, Upload, CheckCircle, Lock, Unlock, History, User, FileWarning, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as XLSX from 'xlsx';

interface Ranking {
  id: string;
  name: string;
  department: string;
  companyName: string;
  averageScore: number;
  evaluationCount: number;
  evaluators: string[];
}

interface DetailedScore {
  id: string;
  positionId: string;
  positionName: string;
  department: string;
  companyName: string;
  evaluatorId: string;
  evaluatorName: string;
  totalScore: number;
  scores: Record<string, number>;
  createdAt: string;
}

interface PositionDetail {
  positionId: string;
  positionName: string;
  department: string;
  companyName: string;
  averageScore: number;
  evaluationCount: number;
  evaluators: string[];
  detailedScores: DetailedScore[];
  expanded: boolean;
}

// 已提交的评估人信息
interface SubmittedEvaluator {
  name: string;
  count: number;
}

// 操作日志
interface OperationLog {
  id: string;
  evaluator_name: string;
  operation_type: string;
  position_id: string | null;
  position_name: string | null;
  operator_name: string;
  created_at: string;
}

// 导入错误接口
interface ImportError {
  companyName: string;
  rowIndex: number;
  errorType: string;
  message: string;
}

// 预览岗位数据接口
interface PreviewPosition {
  companyName: string;
  department: string;
  positionName: string;
  rowIndex: number;
  sheetName: string;
}

// 预览结果接口
interface PreviewResult {
  success: boolean;
  message: string;
  detectedCompanies: string[];
  totalPositions: number;
  validPositions: number;
  invalidPositions: number;
  positions: PreviewPosition[];
  errors: ImportError[];
  errorReport?: string;
  canImport: boolean;
}

// 导入结果接口
interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: ImportError[];
  errorReport?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [detailedScores, setDetailedScores] = useState<DetailedScore[]>([]);
  const [positionDetails, setPositionDetails] = useState<PositionDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 预览相关状态
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // 解锁功能相关状态
  const [submittedEvaluators, setSubmittedEvaluators] = useState<SubmittedEvaluator[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>('');
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('rankings');

  const dimensionNames: Record<string, string> = {
    impact_range: '影响范围',
    impact_level: '影响程度',
    problem_complexity: '问题复杂性',
    problem_solving: '问题解决',
    leadership_range: '领导范围',
    leadership_style: '领导方式',
    internal_communication: '内部沟通',
    external_communication: '外部沟通',
    knowledge_scope: '知识范围',
    knowledge_level: '知识水平',
    environment_comfort: '环境舒适度',
    work_balance: '工作均衡性',
    work_time: '工作时间',
    replaceability: '可替代性'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 并行加载排名数据和详细评分数据
      const [rankingsRes, detailedRes] = await Promise.all([
        fetch('/api/rankings'),
        fetch('/api/admin/detailed-scores')
      ]);

      const rankingsResult = await rankingsRes.json();
      const detailedResult = await detailedRes.json();

      if (rankingsRes.ok) {
        setRankings(rankingsResult.data || []);
      }

      if (detailedRes.ok) {
        setDetailedScores(detailedResult.data || []);
        // 组装岗位详细数据
        assemblePositionDetails(rankingsResult.data || [], detailedResult.data || []);
      }

      // 加载已提交的评估人和操作日志
      await loadUnlockData();
    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载解锁相关数据
  const loadUnlockData = async () => {
    try {
      // 加载已提交的评估人列表
      const submittedRes = await fetch('/api/admin/unlock');
      if (submittedRes.ok) {
        const submittedResult = await submittedRes.json();
        setSubmittedEvaluators(submittedResult.data || []);
      }

      // 加载操作日志
      const logsRes = await fetch('/api/admin/operation-logs');
      if (logsRes.ok) {
        const logsResult = await logsRes.json();
        setOperationLogs(logsResult.data || []);
      }
    } catch (error) {
      console.error('加载解锁数据失败:', error);
    }
  };

  const assemblePositionDetails = (rankingsData: Ranking[], scoresData: DetailedScore[]) => {
    const details: PositionDetail[] = rankingsData.map(ranking => {
      const positionScores = scoresData.filter(s => s.positionId === ranking.id);
      return {
        positionId: ranking.id,
        positionName: ranking.name,
        department: ranking.department,
        companyName: ranking.companyName,
        averageScore: ranking.averageScore,
        evaluationCount: ranking.evaluationCount,
        evaluators: ranking.evaluators,
        detailedScores: positionScores,
        expanded: false
      };
    });
    setPositionDetails(details);
  };

  const togglePositionExpand = (positionId: string) => {
    setPositionDetails(prev => prev.map(p => 
      p.positionId === positionId ? { ...p, expanded: !p.expanded } : p
    ));
  };

  // 解锁评估人评分
  const handleUnlock = async () => {
    if (!selectedEvaluator) {
      alert('请选择要解锁的评估人');
      return;
    }

    setUnlocking(true);
    try {
      const response = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluatorName: selectedEvaluator,
          operatorName: '管理员',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '解锁失败');
      }

      alert(result.message || '解锁成功');
      setShowUnlockDialog(false);
      setSelectedEvaluator('');
      
      // 刷新数据
      loadUnlockData();
    } catch (error) {
      console.error('解锁失败:', error);
      alert(error instanceof Error ? error.message : '解锁失败，请重试');
    } finally {
      setUnlocking(false);
    }
  };

  // 格式化操作类型
  const formatOperationType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'unlock_all': '解锁全部评分',
      'unlock_position': '解锁单个岗位',
      'modify': '修改评分',
    };
    return typeMap[type] || type;
  };

  // 格式化时间
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClearScores = async () => {
    setIsOperating(true);
    try {
      const response = await fetch('/api/admin/reset', { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      alert('评分数据已清空');
      setShowClearDialog(false);
      loadData();
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
      const response = await fetch('/api/admin/full-reset', { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      alert('系统已完全重置');
      setShowResetDialog(false);
      loadData();
    } catch (error) {
      console.error('重置失败:', error);
      alert('重置失败，请重试');
    } finally {
      setIsOperating(false);
    }
  };

  // 预览Excel文件
  const handlePreviewExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传 Excel 文件（.xlsx 或 .xls）');
      return;
    }

    setIsPreviewing(true);
    setPreviewResult(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/preview-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setPreviewResult(result);
    } catch (error) {
      console.error('预览失败:', error);
      setPreviewResult({
        success: false,
        message: error instanceof Error ? error.message : '预览失败，请重试',
        detectedCompanies: [],
        totalPositions: 0,
        validPositions: 0,
        invalidPositions: 0,
        positions: [],
        errors: [],
        canImport: false,
      });
    } finally {
      setIsPreviewing(false);
      // 清空文件输入，允许重新选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!previewResult || !previewResult.canImport) return;

    setIsConfirming(true);

    try {
      const response = await fetch('/api/confirm-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positions: previewResult.positions,
        }),
      });

      const result = await response.json();
      setImportResult(result);

      // 如果有成功导入的数据，刷新页面数据
      if (result.importedCount > 0) {
        loadData();
        // 清空预览结果
        setPreviewResult(null);
      }
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : '导入失败，请重试',
        importedCount: 0,
        skippedCount: 0,
        errorCount: 0,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // 下载预览错误报告
  const downloadPreviewErrorReport = () => {
    if (!previewResult?.errorReport) return;

    const blob = new Blob([previewResult.errorReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `识读错误报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 下载导入错误报告
  const downloadImportErrorReport = () => {
    if (!importResult?.errorReport) return;

    const blob = new Blob([importResult.errorReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `导入错误报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    try {
      // 准备详细导出数据
      const exportData: any[] = [];

      positionDetails.forEach((position, index) => {
        // 添加汇总行
        exportData.push({
          '排名': index + 1,
          '公司': position.companyName,
          '部门': position.department,
          '岗位': position.positionName,
          '评估人': '【汇总】',
          '影响范围': '',
          '影响程度': '',
          '问题复杂性': '',
          '问题解决': '',
          '领导范围': '',
          '领导方式': '',
          '内部沟通': '',
          '外部沟通': '',
          '知识范围': '',
          '知识水平': '',
          '环境舒适度': '',
          '工作均衡性': '',
          '工作时间': '',
          '可替代性': '',
          '总分': position.averageScore,
          '备注': `共${position.evaluationCount}人评分`
        });

        // 添加每个评估人的详细评分
        position.detailedScores.forEach(score => {
          exportData.push({
            '排名': '',
            '公司': '',
            '部门': '',
            '岗位': '',
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
            '备注': ''
          });
        });

        // 添加空行分隔
        exportData.push({
          '排名': '',
          '公司': '',
          '部门': '',
          '岗位': '',
          '评估人': '',
          '影响范围': '',
          '影响程度': '',
          '问题复杂性': '',
          '问题解决': '',
          '领导范围': '',
          '领导方式': '',
          '内部沟通': '',
          '外部沟通': '',
          '知识范围': '',
          '知识水平': '',
          '环境舒适度': '',
          '工作均衡性': '',
          '工作时间': '',
          '可替代性': '',
          '总分': '',
          '备注': ''
        });
      });

      // 创建工作簿
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // 设置列宽
      worksheet['!cols'] = [
        { wch: 6 },  // 排名
        { wch: 25 }, // 公司
        { wch: 15 }, // 部门
        { wch: 15 }, // 岗位
        { wch: 12 }, // 评估人
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // 维度
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // 维度
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // 维度
        { wch: 10 }, { wch: 10 }, // 维度
        { wch: 8 },  // 总分
        { wch: 15 }, // 备注
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '岗位价值评估明细');

      // 创建岗位排名总表（按总分从高到低排序）
      const sortedPositions = [...positionDetails].sort((a, b) => b.averageScore - a.averageScore);
      const rankingData = sortedPositions.map((position, index) => ({
        '排名': index + 1,
        '公司': position.companyName,
        '部门': position.department,
        '岗位': position.positionName,
        '千分制得分': position.averageScore,
        '评分人数': position.evaluationCount,
        '备注': ''
      }));

      const rankingSheet = XLSX.utils.json_to_sheet(rankingData);
      rankingSheet['!cols'] = [
        { wch: 6 },  // 排名
        { wch: 25 }, // 公司
        { wch: 15 }, // 部门
        { wch: 15 }, // 岗位
        { wch: 12 }, // 千分制得分
        { wch: 10 }, // 评分人数
        { wch: 15 }, // 备注
      ];
      XLSX.utils.book_append_sheet(workbook, rankingSheet, '岗位排名总表');

      // 导出文件
      const fileName = `岗位价值评估明细_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                后台管理
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                数据统计与导出
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              导入数据
            </Button>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新数据
            </Button>
            <Button variant="destructive" onClick={() => setShowClearDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              清空评分
            </Button>
            <Button variant="destructive" onClick={() => setShowResetDialog(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              完全重置
            </Button>
            <Button onClick={handleExportExcel} disabled={rankings.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              导出Excel
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总岗位数</CardDescription>
              <CardTitle className="text-3xl">{rankings.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>已评分岗位</CardDescription>
              <CardTitle className="text-3xl">
                {rankings.filter(r => r.evaluationCount > 0).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>最高得分</CardDescription>
              <CardTitle className="text-3xl">
                {rankings.length > 0 ? rankings[0].averageScore : 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>最低得分</CardDescription>
              <CardTitle className="text-3xl">
                {rankings.length > 0 ? rankings[rankings.length - 1].averageScore : 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* 使用 Tabs 来组织内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rankings">岗位排名</TabsTrigger>
            <TabsTrigger value="unlock">评分解锁</TabsTrigger>
            <TabsTrigger value="logs">操作日志</TabsTrigger>
          </TabsList>

          {/* 岗位排名 Tab */}
          <TabsContent value="rankings">
            <Card>
              <CardHeader>
                <CardTitle>岗位价值排名（点击展开查看详细评分）</CardTitle>
                <CardDescription>
                  按平均得分从高到低排序，点击岗位行可查看每位评估人的详细评分
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rankings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      暂无数据，请先在评分页面完成评分
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {positionDetails.map((position, index) => (
                      <div key={position.positionId} className="border rounded-lg overflow-hidden">
                        {/* 汇总行 */}
                        <div
                          className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                            index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                          }`}
                          onClick={() => togglePositionExpand(position.positionId)}
                        >
                          {/* 排名 */}
                          <div className="w-16 flex-shrink-0">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                              index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                          {/* 公司 */}
                          <div className="w-40 flex-shrink-0 truncate text-sm">{position.companyName}</div>
                          {/* 部门 */}
                          <div className="w-24 flex-shrink-0 truncate text-sm">{position.department}</div>
                          {/* 岗位 */}
                      <div className="flex-1 font-medium">{position.positionName}</div>
                      {/* 平均得分 */}
                      <div className="w-20 text-right font-semibold text-lg">{position.averageScore}</div>
                      {/* 评分人数 */}
                      <div className="w-20 text-right text-sm text-gray-500">{position.evaluationCount}人</div>
                      {/* 评估人 */}
                      <div className="w-32 text-right text-sm text-gray-500 truncate">
                        {position.evaluators.join(', ')}
                      </div>
                      {/* 展开图标 */}
                      <div className="w-10 flex justify-center">
                        {position.evaluationCount > 0 && (
                          position.expanded 
                            ? <ChevronUp className="h-5 w-5 text-gray-400" />
                            : <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* 详细评分 */}
                    {position.expanded && position.detailedScores.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 font-medium">评估人</th>
                                {Object.entries(dimensionNames).map(([key, name]) => (
                                  <th key={key} className="text-center py-2 px-2 font-medium whitespace-nowrap">{name}</th>
                                ))}
                                <th className="text-center py-2 px-3 font-medium">总分</th>
                              </tr>
                            </thead>
                            <tbody>
                              {position.detailedScores.map((score, sIndex) => (
                                <tr key={score.id || sIndex} className="border-b last:border-0">
                                  <td className="py-2 px-3 font-medium">{score.evaluatorName}</td>
                                  {Object.keys(dimensionNames).map(key => (
                                    <td key={key} className="text-center py-2 px-2">
                                      <span className={`inline-block w-6 h-6 rounded text-xs leading-6 ${
                                        score.scores[key] >= 4 ? 'bg-green-100 text-green-800' :
                                        score.scores[key] >= 3 ? 'bg-blue-100 text-blue-800' :
                                        score.scores[key] >= 2 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {score.scores[key]}
                                      </span>
                                    </td>
                                  ))}
                                  <td className="text-center py-2 px-3 font-bold text-blue-600">{score.totalScore}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* 评分解锁 Tab */}
          <TabsContent value="unlock">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  评分解锁管理
                </CardTitle>
                <CardDescription>
                  解锁已提交的评分，允许评估人修改数据
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submittedEvaluators.length === 0 ? (
                  <div className="text-center py-12">
                    <Lock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      暂无已提交的评分
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 以下评估人已提交评分并锁定，点击"解锁"按钮可允许其修改评分数据
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {submittedEvaluators.map((evaluator) => (
                        <div 
                          key={evaluator.name}
                          className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {evaluator.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                已提交 {evaluator.count} 个岗位评分
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="border-amber-300 text-amber-600 hover:bg-amber-50"
                            onClick={() => {
                              setSelectedEvaluator(evaluator.name);
                              setShowUnlockDialog(true);
                            }}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            解锁
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 操作日志 Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  操作日志
                </CardTitle>
                <CardDescription>
                  记录所有解锁和修改操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operationLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      暂无操作记录
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">时间</th>
                          <th className="text-left py-3 px-4 font-medium">评估人</th>
                          <th className="text-left py-3 px-4 font-medium">操作类型</th>
                          <th className="text-left py-3 px-4 font-medium">岗位</th>
                          <th className="text-left py-3 px-4 font-medium">操作人</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operationLogs.map((log) => (
                          <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              {formatDateTime(log.created_at)}
                            </td>
                            <td className="py-3 px-4 font-medium">{log.evaluator_name}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                log.operation_type === 'unlock_all' || log.operation_type === 'unlock_position'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {formatOperationType(log.operation_type)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              {log.position_name || '-'}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              {log.operator_name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 解锁确认对话框 */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Unlock className="h-5 w-5" />
              解锁评分
            </DialogTitle>
            <DialogDescription>
              解锁后，该评估人可以重新修改评分数据
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 my-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ 确定要解锁 <strong>{selectedEvaluator}</strong> 的评分吗？
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlockDialog(false)} disabled={unlocking}>
              取消
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700" 
              onClick={handleUnlock} 
              disabled={unlocking}
            >
              {unlocking ? '处理中...' : '确认解锁'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清空评分确认对话框 */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Trash2 className="h-5 w-5" />
              清空评分数据
            </DialogTitle>
            <DialogDescription>
              此操作将删除所有评分记录和评估人数据，但保留岗位和公司信息。
            </DialogDescription>
          </DialogHeader>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 my-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ 此操作不可恢复，请确认是否继续？
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)} disabled={isOperating}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleClearScores} disabled={isOperating}>
              {isOperating ? '处理中...' : '确认清空'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 完全重置确认对话框 */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              完全重置系统
            </DialogTitle>
            <DialogDescription>
              此操作将删除所有数据，包括评分记录、评估人、岗位和公司信息。
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ 危险操作！此操作将完全清空系统，所有数据将无法恢复！
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} disabled={isOperating}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleFullReset} disabled={isOperating}>
              {isOperating ? '处理中...' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导入数据对话框 */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Upload className="h-5 w-5" />
              导入岗位数据
            </DialogTitle>
            <DialogDescription>
              支持 Excel 文件 (.xlsx, .xls)，用于初始化或更新岗位数据
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPreviewing || isConfirming}
            >
              {isPreviewing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  识读中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {previewResult ? '重新选择文件' : '选择 Excel 文件'}
                </>
              )}
            </Button>

            {/* 步骤指示器 */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`px-2 py-1 rounded ${previewResult ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {previewResult ? '✓' : '1.'} 选择文件
              </span>
              <span className="text-gray-300">→</span>
              <span className={`px-2 py-1 rounded ${importResult ? 'bg-green-100 text-green-700' : previewResult ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                {importResult ? '✓' : '2.'} 确认导入
              </span>
            </div>
            
            {/* 预览结果 */}
            {previewResult && !importResult && (
              <div className="space-y-3">
                {/* 总体结果 */}
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  previewResult.success
                    ? previewResult.errors.length > 0
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {previewResult.success ? (
                    previewResult.errors.length > 0 ? (
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    )
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{previewResult.message}</p>
                  </div>
                </div>

                {/* 识别到的公司 */}
                {previewResult.detectedCompanies.length > 0 && (
                  <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
                    <div className="bg-green-50 dark:bg-green-900/30 px-3 py-2">
                      <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                        识别到 {previewResult.detectedCompanies.length} 个公司/中心
                      </span>
                    </div>
                    <div className="p-2 flex flex-wrap gap-1">
                      {previewResult.detectedCompanies.map((company, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-lg font-bold text-gray-700 dark:text-gray-200">{previewResult.totalPositions}</div>
                    <div className="text-xs text-gray-500">总行数</div>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded">
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">{previewResult.validPositions}</div>
                    <div className="text-xs text-green-600 dark:text-green-400">有效岗位</div>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded">
                    <div className="text-lg font-bold text-red-700 dark:text-red-300">{previewResult.invalidPositions}</div>
                    <div className="text-xs text-red-600 dark:text-red-400">错误行数</div>
                  </div>
                </div>

                {/* 岗位列表预览 */}
                {previewResult.positions.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        有效岗位列表（共 {previewResult.positions.length} 个）
                      </span>
                    </div>
                    <ScrollArea className="h-40">
                      <div className="p-2 space-y-1">
                        {previewResult.positions.slice(0, 50).map((pos, index) => (
                          <div 
                            key={index}
                            className="text-xs p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-700"
                          >
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              【{pos.companyName}】
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 ml-1">
                              {pos.department ? `${pos.department} - ` : ''}
                            </span>
                            <span className="text-green-600 dark:text-green-400">
                              {pos.positionName}
                            </span>
                          </div>
                        ))}
                        {previewResult.positions.length > 50 && (
                          <div className="text-xs text-center text-gray-400 py-2">
                            还有 {previewResult.positions.length - 50} 个岗位未显示...
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* 错误列表 */}
                {previewResult.errors.length > 0 && (
                  <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/30 px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                        <FileWarning className="h-4 w-4" />
                        <span className="font-medium">发现 {previewResult.errors.length} 个错误</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPreviewErrorReport}
                        className="h-7 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        下载错误报告
                      </Button>
                    </div>
                    <ScrollArea className="h-32">
                      <div className="p-2 space-y-1">
                        {previewResult.errors.map((error, index) => (
                          <div 
                            key={index}
                            className="text-xs p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">✕</span>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  【{error.companyName}】
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  第{error.rowIndex}行：
                                </span>
                                <span className="text-red-600 dark:text-red-400">
                                  {error.errorType}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  - {error.message}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* 确认导入按钮 */}
                {previewResult.canImport && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmImport}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        导入中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        确认导入 {previewResult.positions.length} 个岗位
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* 导入结果 */}
            {importResult && (
              <div className="space-y-3">
                {/* 总体结果 */}
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  importResult.success
                    ? importResult.errorCount > 0
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {importResult.success ? (
                    importResult.errorCount > 0 ? (
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    )
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{importResult.message}</p>
                    <div className="mt-1 text-xs space-x-3">
                      <span>导入：{importResult.importedCount} 个</span>
                      <span>跳过：{importResult.skippedCount} 行</span>
                      {importResult.errorCount > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-medium">错误：{importResult.errorCount} 个</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 错误列表 */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/30 px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                        <FileWarning className="h-4 w-4" />
                        <span className="font-medium">发现 {importResult.errors.length} 个错误</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadImportErrorReport}
                        className="h-7 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        下载错误报告
                      </Button>
                    </div>
                    <ScrollArea className="h-48">
                      <div className="p-2 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <div 
                            key={index}
                            className="text-xs p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">✕</span>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  【{error.companyName}】
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  第{error.rowIndex}行：
                                </span>
                                <span className="text-red-600 dark:text-red-400">
                                  {error.errorType}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  - {error.message}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* 重新导入按钮 */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPreviewResult(null);
                    setImportResult(null);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  导入新文件
                </Button>
              </div>
            )}

            {/* 格式说明 - 只在没有预览结果时显示 */}
            {!previewResult && !importResult && (
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded p-3 space-y-2">
                <p className="font-medium">📋 Excel 文件格式要求（严格遵守）：</p>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <p className="font-medium text-gray-700 dark:text-gray-300">一、公司/中心名称（自动识读）</p>
                  <div className="ml-4 mt-1 bg-white dark:bg-gray-900 rounded p-2 font-mono text-[11px]">
                    <div className="text-blue-600">✓ 系统自动识读，无需预设公司列表</div>
                    <div className="text-green-600">✓ 支持任意公司/中心名称</div>
                    <div className="text-amber-600">⚠️ 名称必须填写在第1行A列</div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-[10px]">示例：集团、XX公司、XX中心、XX部门等</p>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <p className="font-medium text-gray-700 dark:text-gray-300">二、行结构（必须严格遵守）</p>
                  <div className="ml-4 mt-1 bg-white dark:bg-gray-900 rounded p-2 font-mono text-[11px]">
                    <div><span className="text-blue-600">第1行 A列：</span><span className="text-green-600">公司/中心名称</span>（系统自动识读）</div>
                    <div><span className="text-gray-400">第2-4行：</span>可留空或填写其他信息（系统会跳过）</div>
                    <div><span className="text-blue-600">第5行：</span>列标题（部门、岗位名称...）</div>
                    <div><span className="text-blue-600">第6行开始：</span><span className="text-green-600">岗位数据（每行一个岗位）</span></div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <p className="font-medium text-gray-700 dark:text-gray-300">三、列结构（必须严格遵守）</p>
                  <div className="ml-4 mt-1 bg-white dark:bg-gray-900 rounded p-2 font-mono text-[11px]">
                    <div><span className="text-blue-600">A列：</span>序号或留空</div>
                    <div><span className="text-blue-600">B列：</span><span className="text-green-600">部门名称</span>（可留空，无部门填"无"）</div>
                    <div><span className="text-blue-600">C列：</span><span className="text-red-600">岗位名称</span>（必填，不能为空）</div>
                    <div><span className="text-gray-400">D列及之后：</span>评分维度数据（导入时忽略）</div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <p className="font-medium text-amber-600 dark:text-amber-400">⚠️ 常见错误</p>
                  <ul className="space-y-0.5 ml-4 mt-1 text-amber-600 dark:text-amber-400">
                    <li>• 公司/中心名称不在第1行A列</li>
                    <li>• 第1行A列为空</li>
                    <li>• 岗位数据从第5行开始（应从第6行开始）</li>
                    <li>• 使用合并单元格导致解析错位</li>
                    <li>• 岗位名称列（C列）为空</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImportDialog(false);
              setPreviewResult(null);
              setImportResult(null);
            }}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
