"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import type { OperationLog } from "./types";

interface LogsTabProps {
  operationLogs: OperationLog[];
  formatDateTime: (dateStr: string) => string;
  formatOperationType: (type: string) => string;
}

export function LogsTab({ operationLogs, formatDateTime, formatOperationType }: LogsTabProps) {
  return (
    <Card className="border-[#E8E3DD] shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#2C2825' }}>
          <History className="h-5 w-5" style={{ color: '#C8956C' }} />
          操作日志
        </CardTitle>
        <CardDescription style={{ color: '#8B8580' }}>
          记录所有解锁和修改操作，用于审计追溯
        </CardDescription>
      </CardHeader>
      <CardContent>
        {operationLogs.length === 0 ? (
          <div className="text-center py-16">
            <History className="h-12 w-12 mx-auto mb-4" style={{ color: '#E8E3DD' }} />
            <p style={{ color: '#8B8580' }}>暂无操作记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E8E3DD' }}>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>时间</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>评估人</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>操作类型</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>岗位</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>操作人</th>
                </tr>
              </thead>
              <tbody>
                {operationLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-[#FAF8F5] transition-colors" style={{ borderColor: '#F5F2EE' }}>
                    <td className="py-3 px-4 text-xs" style={{ color: '#8B8580', fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium" style={{ color: '#2C2825' }}>{log.evaluator_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: log.operation_type.includes('unlock') ? '#FFF8F0' : '#F0F7F0',
                          color: log.operation_type.includes('unlock') ? '#D4954B' : '#5B8C5A',
                        }}
                      >
                        {formatOperationType(log.operation_type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm" style={{ color: '#8B8580' }}>
                      {log.position_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm" style={{ color: '#8B8580' }}>
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
  );
}
