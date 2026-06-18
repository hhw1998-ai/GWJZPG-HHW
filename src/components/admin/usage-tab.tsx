"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { UsageLog } from "./types";

interface UsageTabProps {
  usageLogs: UsageLog[];
  formatDateTime: (dateStr: string) => string;
  getUsageActionColor: (action: string) => { bg: string; text: string };
}

export function UsageTab({ usageLogs, formatDateTime, getUsageActionColor }: UsageTabProps) {
  return (
    <Card className="border-[#E8E3DD] shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#2C2825' }}>
          <Users className="h-5 w-5" style={{ color: '#C8956C' }} />
          使用日志
        </CardTitle>
        <CardDescription style={{ color: '#8B8580' }}>
          记录所有访客的操作行为，了解谁在使用系统、做了什么
        </CardDescription>
      </CardHeader>
      <CardContent>
        {usageLogs.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto mb-4" style={{ color: '#E8E3DD' }} />
            <p style={{ color: '#8B8580' }}>暂无使用记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E8E3DD' }}>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>时间</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>访客</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>操作</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>页面</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>详情</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: '#8B8580' }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {usageLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-[#FAF8F5] transition-colors" style={{ borderColor: '#F5F2EE' }}>
                    <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: '#8B8580', fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium" style={{ color: '#2C2825' }}>
                      {log.visitor_name || '匿名访客'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: getUsageActionColor(log.action).bg,
                          color: getUsageActionColor(log.action).text,
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: '#8B8580' }}>
                      {log.page || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs max-w-[200px] truncate" style={{ color: '#8B8580' }}>
                      {log.detail || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: '#D4CDC5', fontFamily: "'JetBrains Mono', monospace" }}>
                      {log.ip_address || '-'}
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
