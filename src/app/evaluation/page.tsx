'use client';

import { useState, useEffect, Fragment, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { evaluationStandards, getAllDimensions } from '@/lib/evaluation-standards';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronLeft, ChevronRight, Save, Users, CheckCircle, AlertCircle, ArrowDown, Menu, X, Loader2, Lock, Info, HelpCircle, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogoIcon } from '@/components/logo';

interface Position {
  id: string;
  name: string;
  department: string;
  companies: {
    id: string;
    name: string;
  };
  hasEvaluation: boolean;
  evaluationCount: number;
}

// 骨架屏组件
function SkeletonRow() {
  return (
    <tr className="border-b border-[#E8E3DD] animate-pulse">
      <td 
        className="border-r border-[#E8E3DD] px-2 py-2 bg-[#FAF8F5]"
        style={{ position: 'sticky', left: 0, zIndex: 25, width: '100px', minWidth: '100px' }}
      >
        <div className="h-3 bg-[#E8E3DD] rounded w-16"></div>
      </td>
      <td 
        className="border-r border-[#E8E3DD] px-2 py-2 bg-[#FAF8F5]"
        style={{ position: 'sticky', left: '100px', zIndex: 25, width: '70px', minWidth: '70px' }}
      >
        <div className="flex flex-col gap-1">
          <div className="h-3 bg-[#E8E3DD] rounded w-12"></div>
          <div className="h-2 bg-[#E8E3DD] rounded w-8"></div>
        </div>
      </td>
      {Array.from({ length: 14 }).map((_, i) => (
        <td key={i} className="border-r border-[#E8E3DD] px-0.5 py-2 bg-[#FAF8F5]">
          <div className="flex justify-center items-center gap-0.5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 w-4 bg-[#E8E3DD] rounded-full"></div>
            ))}
          </div>
        </td>
      ))}
    </tr>
  );
}

export default function EvaluationPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [evaluatorName, setEvaluatorName] = useState('');
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const firstUnfilledRef = useRef<HTMLTableCellElement>(null);

  // 提交状态
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 自动保存相关状态
  const [unsavedScores, setUnsavedScores] = useState<Record<string, Record<string, number>>>({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showAutoSaveToast, setShowAutoSaveToast] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const scoresRef = useRef(scores);
  const unsavedScoresRef = useRef(unsavedScores);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [showGuide, setShowGuide] = useState(false);
  const pageSize = 20; // 每页20个岗位

  // 获取所有维度
  const allDimensions = getAllDimensions();
  const totalDimensions = allDimensions.length;

  // 计算总页数
  const totalPages = useMemo(() => Math.ceil(positions.length / pageSize), [positions.length]);

  // 当前页的岗位
  const currentPagePositions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return positions.slice(start, end);
  }, [positions, currentPage, pageSize]);

  useEffect(() => {
    loadEvaluationInfo();
  }, []);

  // 记录使用日志
  const logUsage = async (action: string, detail?: string) => {
    try {
      const name = localStorage.getItem('evaluator_name');
      await fetch('/api/usage-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_name: name,
          action,
          page: '/evaluation',
          detail,
        }),
      });
    } catch {
      // 静默失败，不影响主流程
    }
  };

  const loadEvaluationInfo = async () => {
    const storedEvaluatorName = localStorage.getItem('evaluator_name');

    if (!storedEvaluatorName) {
      alert('请先返回首页填写评估人信息');
      router.push('/');
      return;
    }

    // 记录进入评分页面
    logUsage('进入评分', `评估人: ${storedEvaluatorName}`);

    setEvaluatorName(storedEvaluatorName);
    
    // 先检查提交状态
    await checkSubmitStatus(storedEvaluatorName);
    
    // 加载数据
    await loadAllPositions(storedEvaluatorName);
  };

  // 检查提交状态
  const checkSubmitStatus = async (evaluator: string) => {
    try {
      const response = await fetch('/api/evaluations/submit-status?evaluatorName=' + encodeURIComponent(evaluator));
      const result = await response.json();
      
      if (response.ok && result.submitted) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('检查提交状态失败:', error);
    }
  };

  const loadAllPositions = async (evaluator: string) => {
    setIsLoading(true);
    try {
      // 并行加载岗位列表和已有评分
      const [positionsRes, scoresRes] = await Promise.all([
        fetch('/api/positions'),
        fetch('/api/evaluations?evaluatorName=' + encodeURIComponent(evaluator))
      ]);

      const positionsResult = await positionsRes.json();
      const scoresResult = await scoresRes.json();

      if (!positionsRes.ok) {
        throw new Error(positionsResult.error || '加载失败');
      }

      setPositions(positionsResult.data || []);

      // 处理已有评分数据
      if (scoresRes.ok && scoresResult.data) {
        const scoresMap: Record<string, Record<string, number>> = {};
        scoresResult.data.forEach((evaluation: any) => {
          scoresMap[evaluation.position_id] = {
            impactRange: evaluation.impact_range,
            impactLevel: evaluation.impact_level,
            problemComplexity: evaluation.problem_complexity,
            problemSolving: evaluation.problem_solving,
            leadershipRange: evaluation.leadership_range,
            leadershipStyle: evaluation.leadership_style,
            internalCommunication: evaluation.internal_communication,
            externalCommunication: evaluation.external_communication,
            knowledgeScope: evaluation.knowledge_scope,
            knowledgeLevel: evaluation.knowledge_level,
            environmentComfort: evaluation.environment_comfort,
            workBalance: evaluation.work_balance,
            workTime: evaluation.work_time,
            replaceability: evaluation.replaceability,
          };
        });
        setScores(scoresMap);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (positionId: string, fieldName: string, value: number) => {
    // 如果已提交，不允许修改
    if (isSubmitted) {
      return;
    }
    
    setScores(prev => ({
      ...prev,
      [positionId]: {
        ...prev[positionId],
        [fieldName]: value,
      },
    }));
    
    // 同时更新未保存数据
    setUnsavedScores(prev => ({
      ...prev,
      [positionId]: {
        ...prev[positionId],
        [fieldName]: value,
      },
    }));
  };

  // 中途保存（随时可保存）
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const response = await fetch('/api/evaluations/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluatorName,
          scores,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '保存失败');
      }

      // 手动保存成功后，清空未保存数据
      setUnsavedScores({});
      alert('草稿保存成功！已保存当前进度。');
    } catch (error) {
      console.error('保存草稿失败:', error);
      alert('保存草稿失败，请重试');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 自动保存核心函数
  const performAutoSave = useCallback(async () => {
    // 检查是否有未保存数据
    const hasUnsavedData = Object.keys(unsavedScoresRef.current).length > 0;
    if (!hasUnsavedData || isSavingRef.current) {
      return;
    }

    setIsAutoSaving(true);
    setShowAutoSaveToast(true);
    isSavingRef.current = true;

    try {
      const response = await fetch('/api/evaluations/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluatorName,
          scores: scoresRef.current,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '自动保存失败');
      }

      // 自动保存成功，清空未保存数据
      setUnsavedScores({});
      
      // 延迟隐藏提示
      setTimeout(() => {
        setShowAutoSaveToast(false);
      }, 1500);
    } catch (error) {
      console.error('自动保存失败:', error);
      setShowAutoSaveToast(false);
    } finally {
      setIsAutoSaving(false);
      isSavingRef.current = false;
    }
  }, [evaluatorName]);

  // 更新 ref 引用
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    unsavedScoresRef.current = unsavedScores;
  }, [unsavedScores]);

  // 30秒定时器自动保存
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      performAutoSave();
    }, 30000); // 30秒

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [performAutoSave]);

  // 页面关闭/切换时触发自动保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedData = Object.keys(unsavedScoresRef.current).length > 0;
      if (hasUnsavedData) {
        // 尝试同步保存（使用 sendBeacon 或直接调用 API）
        // 注意：beforeunload 中异步请求可能被取消，但我们可以尝试
        const data = JSON.stringify({
          evaluatorName,
          scores: scoresRef.current,
        });
        
        // 使用 sendBeacon 确保请求被发送
        if (navigator.sendBeacon) {
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon('/api/evaluations/batch', blob);
        }
        
        // 提示用户
        e.preventDefault();
        e.returnValue = '您有未保存的评分数据，确定要离开吗？';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面切换到后台时触发自动保存
        const hasUnsavedData = Object.keys(unsavedScoresRef.current).length > 0;
        if (hasUnsavedData && !isSavingRef.current) {
          performAutoSave();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [evaluatorName, performAutoSave]);

  // 正式提交（必须全部完成）
  const handleSubmitScores = async () => {
    // 检查是否已提交
    if (isSubmitted) {
      alert('您已提交过评分，无法重复提交。');
      return;
    }

    const progress = getProgress();
    if (progress.completed < progress.total) {
      const unfilled = getFirstUnfilledItem();
      if (unfilled) {
        // 跳转到未填项所在页
        const pageIndex = positions.findIndex(p => p.id === unfilled.positionId);
        if (pageIndex >= 0) {
          const targetPage = Math.floor(pageIndex / pageSize) + 1;
          setCurrentPage(targetPage);
          setTimeout(() => scrollToFirstUnfilled(), 100);
        }
        alert(`请完成所有评分后再提交。第一个未填项：${unfilled.positionName} - ${unfilled.dimensionName}`);
      } else {
        alert('请完成所有评分后再提交');
      }
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/evaluations/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluatorName,
          scores,
          isSubmit: true, // 标记为正式提交
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '保存失败');
      }

      // 设置已提交状态
      setIsSubmitted(true);
      // 清空未保存数据
      setUnsavedScores({});

      // 记录提交日志
      logUsage('提交评分', `评估人: ${evaluatorName}, 岗位数: ${scores.length}`);
      
      alert('评分提交成功！您的评分已锁定，如需修改请联系管理员。');
    } catch (error) {
      console.error('提交评分失败:', error);
      alert(error instanceof Error ? error.message : '提交评分失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 计算总体进度（所有岗位）
  const getProgress = () => {
    const totalFields = positions.length * totalDimensions;
    let completedFields = 0;
    Object.values(scores).forEach(positionScores => {
      completedFields += Object.values(positionScores).filter(v => v > 0).length;
    });
    return { completed: completedFields, total: totalFields };
  };

  // 计算当前页进度
  const getCurrentPageProgress = () => {
    const totalFields = currentPagePositions.length * totalDimensions;
    let completedFields = 0;
    currentPagePositions.forEach(position => {
      const positionScores = scores[position.id] || {};
      completedFields += Object.values(positionScores).filter(v => v > 0).length;
    });
    return { completed: completedFields, total: totalFields };
  };

  // 获取第一个未填项信息
  const getFirstUnfilledItem = () => {
    for (const position of positions) {
      const positionScores = scores[position.id] || {};
      for (const dimension of allDimensions) {
        if (!positionScores[dimension.fieldName] || positionScores[dimension.fieldName] === 0) {
          return {
            positionId: position.id,
            positionName: `${getAffiliationName(position)}-${position.name}`,
            dimensionName: dimension.name,
            fieldName: dimension.fieldName,
          };
        }
      }
    }
    return null;
  };

  // 获取当前页第一个未填项
  const getFirstUnfilledItemInCurrentPage = () => {
    for (const position of currentPagePositions) {
      const positionScores = scores[position.id] || {};
      for (const dimension of allDimensions) {
        if (!positionScores[dimension.fieldName] || positionScores[dimension.fieldName] === 0) {
          return {
            positionId: position.id,
            positionName: `${getAffiliationName(position)}-${position.name}`,
            dimensionName: dimension.name,
            fieldName: dimension.fieldName,
          };
        }
      }
    }
    return null;
  };

  // 滚动到第一个未填项
  const scrollToFirstUnfilled = () => {
    if (firstUnfilledRef.current) {
      firstUnfilledRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 检查是否为当前页第一个未填项
  const isFirstUnfilledItemInCurrentPage = (positionId: string, fieldName: string): boolean => {
    const unfilled = getFirstUnfilledItemInCurrentPage();
    return unfilled?.positionId === positionId && unfilled?.fieldName === fieldName;
  };

  // 检查单元格是否未填写
  const isUnfilled = (positionId: string, fieldName: string): boolean => {
    const positionScores = scores[positionId] || {};
    return !positionScores[fieldName] || positionScores[fieldName] === 0;
  };

  // 通用公司名截断（超过6字截断）
  const getShortCompanyName = (fullCompanyName: string): string => {
    if (fullCompanyName.length <= 6) return fullCompanyName;
    return fullCompanyName.slice(0, 6) + '…';
  };

  // 通用部门名截断（超过4字截断）
  const getShortDeptName = (deptName: string): string => {
    if (deptName.length <= 4) return deptName;
    return deptName.slice(0, 4) + '…';
  };

  // 获取归属单位名称
  const getAffiliationName = (position: Position): string => {
    const company = getShortCompanyName(position.companies.name);
    const dept = position.department ? getShortDeptName(position.department) : '';
    return dept ? `${company}·${dept}` : company;
  };

  // 分页导航
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] p-2 sm:p-4">
        <div className="w-full mx-auto space-y-2 sm:space-y-4">
          {/* 头部骨架 */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E3DD] p-3 sm:p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-[#F5F1EC] rounded-lg"></div>
              <div className="flex-1">
                <div className="h-6 bg-[#F5F1EC] rounded w-32 mb-2"></div>
                <div className="h-4 bg-[#F5F1EC] rounded w-24"></div>
              </div>
            </div>
            <div className="h-2 bg-[#F5F1EC] rounded-full mb-3"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-[#F5F1EC] rounded-lg w-20"></div>
              <div className="h-8 bg-[#F5F1EC] rounded-lg w-20"></div>
            </div>
          </div>
          
          {/* 表格骨架 */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E3DD] overflow-hidden">
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <table className="w-full border-collapse" style={{ minWidth: 'max-content' }}>
                <thead className="sticky top-0 z-40">
                  <tr className="bg-[#F5F1EC]">
                    <th className="border-b border-r border-[#E8E3DD] px-2 py-2" style={{ width: '100px' }}>
                      <div className="h-3 bg-[#E8E3DD] rounded w-12"></div>
                    </th>
                    <th className="border-b border-r border-[#E8E3DD] px-2 py-2" style={{ width: '70px' }}>
                      <div className="h-3 bg-[#E8E3DD] rounded w-10"></div>
                    </th>
                    {Array.from({ length: 14 }).map((_, i) => (
                      <th key={i} className="border-b border-[#E8E3DD] px-1 py-2">
                        <div className="h-6 bg-[#E8E3DD] rounded w-12 mx-auto"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgress();
  const currentPageProgress = getCurrentPageProgress();
  const isAllComplete = progress.completed === progress.total;
  const unfilledItem = getFirstUnfilledItemInCurrentPage();

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-2">
      {/* 评分指引 - 可折叠 */}
      <div className="mb-1.5">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between bg-white rounded-xl shadow-sm border border-[#E8E3DD] p-2.5 text-left hover:bg-[#FAF8F5] transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#C8956C]" />
            <span className="text-sm font-medium text-[#3D3630]">评分指引</span>
            <span className="text-xs text-[#8B8580]">了解六因素十四维度评估模型</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-[#8B8580] transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`} />
        </button>
        {showGuide && (
          <div className="bg-white rounded-b-xl border-x border-b border-[#E8E3DD] p-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {evaluationStandards.factors.map((factor) => (
                <div key={factor.id} className="border border-[#F5F1EC] rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#C8956C' }}>
                      {factor.weight}%
                    </span>
                    <span className="text-sm font-semibold text-[#3D3630]">{factor.name}</span>
                  </div>
                  <div className="space-y-1">
                    {factor.dimensions.map((dim) => (
                      <div key={dim.id} className="text-xs text-[#8B8580]">
                        <span className="font-medium text-[#2C2825]">{dim.name}</span>
                        <span className="mx-1">·</span>
                        <span>{dim.maxLevel}级</span>
                        <span className="mx-1">·</span>
                        <span>{dim.maxScore}分</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#8B8580] mt-2 text-center">
              请根据岗位实际情况，在每个维度中选择最符合的等级。全部完成后点击「提交评分」锁定结果。
            </p>
          </div>
        )}
      </div>
      
      {/* 自动保存提示 Toast */}
      {showAutoSaveToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#C8956C] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
          {isAutoSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">自动保存中...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">自动保存成功</span>
            </>
          )}
        </div>
      )}
      
      <div className="w-full mx-auto space-y-1.5">
        {/* 头部 - 紧凑布局 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E3DD] p-2 sm:p-3">
          {/* 第一行：返回按钮 + 标题 */}
          <div className="flex items-center gap-2 mb-1.5">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="shrink-0 h-8 w-8 text-[#6B6560] hover:text-[#3D3630] hover:bg-[#F5F1EC]">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <LogoIcon size={24} />
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-[#3D3630] truncate">
                岗位价值评估
              </h1>
              <p className="text-[10px] sm:text-xs text-[#8B8580] flex items-center gap-1">
                <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="truncate">{evaluatorName} · {positions.length}岗位 · {currentPage}/{totalPages}页</span>
              </p>
            </div>
          </div>
          
          {/* 第二行：进度条 */}
          <div className="mb-1.5">
            <div className="flex items-center justify-between text-[10px] sm:text-xs mb-0.5">
              <span className="text-[#8B8580]">总体进度</span>
              <span className={`font-medium ${isAllComplete ? 'text-[#5B8C5A]' : 'text-[#D4954B]'}`}>
                {progress.completed}/{progress.total}
                {!isAllComplete && ` (剩${progress.total - progress.completed})`}
              </span>
            </div>
            <div className="h-1.5 bg-[#F5F1EC] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${isAllComplete ? 'bg-[#5B8C5A]' : 'bg-[#C8956C]'}`}
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
            {/* 当前页进度 */}
            <div className="flex items-center justify-between text-[10px] text-[#8B8580]">
              <span>当前页</span>
              <span>{currentPageProgress.completed}/{currentPageProgress.total}</span>
            </div>
          </div>
          
          {/* 第三行：按钮组 - 紧凑 */}
          <div className="flex flex-wrap gap-1.5">
            {/* 已提交状态提示 */}
            {isSubmitted ? (
              <>
                <div className="flex items-center gap-1.5 text-[#5B8C5A] text-xs sm:text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  <span>已提交，不可修改</span>
                </div>
                <div className="text-[10px] sm:text-xs text-[#8B8580] flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>如需修改请联系管理员</span>
                </div>
              </>
            ) : (
              <>
                {/* 跳转未填项按钮 */}
                {!isAllComplete && unfilledItem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scrollToFirstUnfilled}
                    className="text-[#D4954B] border-[#E8E3DD] hover:bg-[#F5F1EC] text-[10px] sm:text-xs h-7 px-2"
                  >
                    <ArrowDown className="h-3 w-3 sm:mr-0.5" />
                    <span className="hidden sm:inline">跳转</span>
                  </Button>
                )}
                
                {/* 中途保存按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || progress.completed === 0}
                  className="text-[10px] sm:text-xs h-7 px-2 border-[#E8E3DD] text-[#6B6560] hover:bg-[#F5F1EC]"
                >
                  {isSavingDraft ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                  ) : (
                    '保存'
                  )}
                </Button>
                
                {/* 正式提交按钮 */}
                <Button
                  size="sm"
                  onClick={handleSubmitScores}
                  disabled={isSaving || !isAllComplete}
                  className={`text-[10px] sm:text-xs h-7 px-2 bg-[#C8956C] hover:bg-[#B07D58] text-white ${!isAllComplete ? 'opacity-50' : ''}`}
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  ) : (
                    <>
                      <Save className="h-3 w-3 sm:mr-0.5" />
                      <span className="hidden sm:inline">提交</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 已提交锁定提示 */}
        {isSubmitted && (
          <div className="bg-[#F0EDE8] border border-[#E8E3DD] rounded-xl p-2 sm:p-3">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-[#5B8C5A] mt-0.5 shrink-0" />
              <div className="text-xs sm:text-sm text-[#3D3630]">
                <p className="font-medium">您的评分已提交并锁定</p>
                <p className="text-[10px] sm:text-xs mt-1 text-[#8B8580]">
                  评分数据已保存，如需修改请联系管理员进行解锁操作。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 未完成提示 - 紧凑 */}
        {!isSubmitted && !isAllComplete && unfilledItem && (
          <div className="bg-[#F5F1EC] border border-[#E8E3DD] rounded-xl p-1.5 sm:p-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-[#D4954B] shrink-0" />
            <span className="text-[10px] sm:text-xs text-[#6B6560]">
              请完成 <strong>{unfilledItem.positionName}</strong> 的 <strong>{unfilledItem.dimensionName}</strong> 等 {progress.total - progress.completed} 项
            </span>
          </div>
        )}

        {/* 评分矩阵 - 移动端优化 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E3DD] overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto -webkit-overflow-scrolling-touch" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <table className="w-full border-collapse" style={{ minWidth: 'max-content' }}>
              <thead className="sticky top-0 z-40">
                <tr className="bg-[#F5F1EC]">
                  <th className="border-b-2 border-r-2 border-[#E8E3DD] px-2 py-2.5 text-left text-sm font-bold text-[#3D3630] bg-[#F5F1EC]" style={{ position: 'sticky', left: 0, zIndex: 50, width: '110px', minWidth: '110px' }}>
                    归属单位
                  </th>
                  <th className="border-b-2 border-r-2 border-[#E8E3DD] px-2 py-2.5 text-left text-sm font-bold text-[#3D3630] bg-[#F5F1EC]" style={{ position: 'sticky', left: '110px', zIndex: 50, width: '80px', minWidth: '80px' }}>
                    岗位名称
                  </th>
                  {evaluationStandards.factors.map((factor) => (
                    <Fragment key={factor.id}>
                      {factor.dimensions.map((dimension) => (
                        <th 
                          key={dimension.id} 
                          className="border-b-2 border-r border-[#E8E3DD] px-1 py-2 text-center"
                          style={{ minWidth: `${dimension.maxLevel * 20 + 12}px` }}
                          title={dimension.name}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="text-[11px] sm:text-xs text-[#8B8580] font-medium">
                              {factor.name.substring(0, 2)}
                            </div>
                            <div className="text-xs sm:text-sm font-semibold text-[#3D3630] leading-tight whitespace-nowrap">
                              {dimension.name}
                            </div>
                          </div>
                        </th>
                      ))}
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentPagePositions.map((position) => {
                  const positionScores = scores[position.id] || {};
                  const completedCount = Object.values(positionScores).filter(v => v > 0).length;
                  const isPositionComplete = completedCount === totalDimensions;
                  
                  return (
                    <tr 
                      key={position.id} 
                      className="border-b border-[#E8E3DD]"
                    >
                      <td 
                        className={`border-r-2 border-[#E8E3DD] px-2 py-2 ${!isPositionComplete ? 'bg-[#F5F1EC]' : 'bg-white'}`}
                        style={{ position: 'sticky', left: 0, zIndex: 25, width: '110px', minWidth: '110px' }}
                        title={position.companies.name + (position.department ? '-' + position.department : '')}
                      >
                        <div className="text-xs sm:text-sm text-[#6B6560] leading-tight whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                          {getAffiliationName(position)}
                        </div>
                      </td>
                      <td 
                        className={`border-r-2 border-[#E8E3DD] px-2 py-2 ${!isPositionComplete ? 'bg-[#F5F1EC]' : 'bg-white'}`}
                        style={{ position: 'sticky', left: '110px', zIndex: 25, width: '80px', minWidth: '80px' }}
                        title={position.name}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="text-xs sm:text-sm font-semibold text-[#3D3630] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                            {position.name}
                          </div>
                          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-[#8B8580]">
                            <span className={isPositionComplete ? 'text-[#5B8C5A] font-medium' : ''}>
                              {completedCount}/{totalDimensions}
                            </span>
                            {isPositionComplete ? (
                              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#5B8C5A]" />
                            ) : (
                              <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#D4954B]" />
                            )}
                          </div>
                        </div>
                      </td>
                      {allDimensions.map((dimension) => {
                        const currentScore = positionScores[dimension.fieldName] || 0;
                        const unfilled = isUnfilled(position.id, dimension.fieldName);
                        const isFirstUnfilled = isFirstUnfilledItemInCurrentPage(position.id, dimension.fieldName);
                        
                        return (
                          <td 
                            key={dimension.id} 
                            ref={isFirstUnfilled ? firstUnfilledRef : null}
                            className={`border-r border-[#E8E3DD] px-0.5 py-2 transition-colors ${
                              unfilled && !isSubmitted
                                ? 'bg-[#F5F1EC]' 
                                : 'bg-[#FAF8F5]'
                            } ${
                              isFirstUnfilled 
                                ? 'ring-2 ring-[#D4954B] ring-inset' 
                                : ''
                            } ${
                              isSubmitted ? 'opacity-70' : ''
                            }`}
                          >
                            <div className="flex justify-center items-center">
                              <RadioGroup
                                value={currentScore.toString()}
                                onValueChange={(value) =>
                                  handleScoreChange(position.id, dimension.fieldName, parseInt(value))
                                }
                                disabled={isSubmitted}
                                className="flex justify-center"
                              >
                                {/* 根据维度的maxLevel动态生成评分选项 */}
                                {Array.from({ length: dimension.maxLevel }, (_, i) => i + 1).map((level) => (
                                  <div key={level} className="flex items-center px-0.5">
                                    <RadioGroupItem
                                      value={level.toString()}
                                      id={`${position.id}-${dimension.id}-${level}`}
                                      disabled={isSubmitted}
                                      className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${unfilled ? 'border-[#D4CDC5]' : ''} ${isSubmitted ? 'cursor-not-allowed' : ''}`}
                                    />
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页控件 - 紧凑 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E3DD] p-1.5 sm:p-2">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-[10px] sm:text-xs h-7 px-2 border-[#E8E3DD] text-[#6B6560] hover:bg-[#F5F1EC]"
              >
                <ChevronLeft className="h-3 w-3" />
                <span className="hidden sm:inline">上页</span>
              </Button>
              
              <div className="flex items-center gap-0.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className={`h-6 w-6 sm:h-7 sm:w-7 p-0 text-[10px] sm:text-xs ${
                        currentPage === pageNum 
                          ? 'bg-[#3D3630] text-white hover:bg-[#2C2825]' 
                          : 'border-[#E8E3DD] text-[#6B6560] hover:bg-[#F5F1EC]'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span className="px-0.5 text-[#D4CDC5] text-xs">...</span>}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-[10px] sm:text-xs h-7 px-2 border-[#E8E3DD] text-[#6B6560] hover:bg-[#F5F1EC]"
              >
                <span className="hidden sm:inline">下页</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* 底部提示 - 紧凑 */}
        <div className="text-center text-[10px] sm:text-xs text-[#8B8580] bg-white rounded-xl shadow-sm border border-[#E8E3DD] p-1.5 sm:p-2 flex items-center justify-center gap-2 flex-wrap">
          <span>左右滑动查看更多维度 · 暖色背景为未填项 · 完成后点击"提交"</span>
          {Object.keys(unsavedScores).length > 0 && (
            <span className="text-[#D4954B] font-medium">
              · {Object.keys(unsavedScores).length} 个岗位待保存
            </span>
          )}
          <span className="text-[#C8956C]">
            · 自动保存已启用 (30秒)
          </span>
        </div>
      </div>
    </div>
  );
}
