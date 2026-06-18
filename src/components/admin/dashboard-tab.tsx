"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, FileSpreadsheet, Unlock } from "lucide-react";
import type { RankingItem, OperationLog } from "./types";

interface DashboardTabProps {
  totalPositions: number;
  evaluatedPositions: number;
  evaluationRate: number;
  totalEvaluators: number;
  avgScore: number;
  topScore: number;
  bottomScore: number;
  rankings: RankingItem[];
  operationLogs: OperationLog[];
  onImportClick: () => void;
  onExportClick: () => void;
  onUnlockTabClick: () => void;
  formatDateTime: (dateStr: string) => string;
  formatOperationType: (type: string) => string;
}

export function DashboardTab({
  totalPositions,
  evaluatedPositions,
  evaluationRate,
  totalEvaluators,
  avgScore,
  topScore,
  bottomScore,
  rankings,
  operationLogs,
  onImportClick,
  onExportClick,
  onUnlockTabClick,
  formatDateTime,
  formatOperationType,
}: DashboardTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#E8E3DD] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs" style={{ color: '#8B8580' }}>岗位总数</CardDescription>
            <CardTitle className="text-2xl" style={{ color: '#2C2825', fontFamily: "'JetBrains Mono', monospace" }}>
              {totalPositions}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#E8E3DD] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs" style={{ color: '#8B8580' }}>已评估岗位</CardDescription>
            <CardTitle className="text-2xl" style={{ color: '#2C2825', fontFamily: "'JetBrains Mono', monospace" }}>
              {evaluatedPositions}
              <span className="text-sm font-normal ml-1" style={{ color: '#8B8580' }}>/ {evaluationRate}%</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#E8E3DD] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs" style={{ color: '#8B8580' }}>评估人数</CardDescription>
            <CardTitle className="text-2xl" style={{ color: '#2C2825', fontFamily: "'JetBrains Mono', monospace" }}>
              {totalEvaluators}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#E8E3DD] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs" style={{ color: '#8B8580' }}>平均得分</CardDescription>
            <CardTitle className="text-2xl" style={{ color: '#2C2825', fontFamily: "'JetBrains Mono', monospace" }}>
              {avgScore}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Score Range */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-[#E8E3DD] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs" style={{ color: '#8B8580' }}>得分分布</CardDescription>
          </CardHeader>
          <CardContent>
            {rankings.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#8B8580' }}>暂无数据</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#8B8580' }}>最高分</span>
                  <span className="font-semibold" style={{ color: '#5B8C5A', fontFamily: "'JetBrains Mono', monospace" }}>{topScore}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F5F2EE' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((topScore / 1000) * 100, 100)}%`, backgroundColor: '#C8956C' }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#8B8580' }}>最低分</span>
                  <span className="font-semibold" style={{ color: '#D4954B', fontFamily: "'JetBrains Mono', monospace" }}>{bottomScore}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F5F2EE' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((bottomScore / 1000) * 100, 100)}%`, backgroundColor: '#E8D5C4' }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E8E3DD] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs" style={{ color: '#8B8580' }}>快速操作</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start border-[#E8E3DD] text-[#3D3630] hover:bg-[#F5F2EE]"
              onClick={onImportClick}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              导入 Excel 岗位数据
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-[#E8E3DD] text-[#3D3630] hover:bg-[#F5F2EE]"
              onClick={onExportClick}
              disabled={rankings.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              导出评估结果
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-[#E8E3DD] text-[#3D3630] hover:bg-[#F5F2EE]"
              onClick={onUnlockTabClick}
            >
              <Unlock className="h-4 w-4 mr-2" />
              管理评分解锁
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-[#E8E3DD] shadow-none">
        <CardHeader className="pb-3">
          <CardDescription className="text-xs" style={{ color: '#8B8580' }}>最近操作</CardDescription>
        </CardHeader>
        <CardContent>
          {operationLogs.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#8B8580' }}>暂无操作记录</p>
          ) : (
            <div className="space-y-2">
              {operationLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center gap-3 text-sm py-2 border-b last:border-0" style={{ borderColor: '#F5F2EE' }}>
                  <span className="text-xs" style={{ color: '#8B8580', fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatDateTime(log.created_at)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{
                    backgroundColor: log.operation_type.includes('unlock') ? '#FFF8F0' : '#F0F7F0',
                    color: log.operation_type.includes('unlock') ? '#D4954B' : '#5B8C5A',
                  }}>
                    {formatOperationType(log.operation_type)}
                  </span>
                  <span style={{ color: '#2C2825' }}>{log.evaluator_name}</span>
                  {log.position_name && (
                    <span style={{ color: '#8B8580' }}>- {log.position_name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
