"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, User } from "lucide-react";
import type { SubmittedEvaluator } from "./types";

interface UnlockTabProps {
  submittedEvaluators: SubmittedEvaluator[];
  onUnlockClick: (evaluatorName: string) => void;
}

export function UnlockTab({ submittedEvaluators, onUnlockClick }: UnlockTabProps) {
  return (
    <Card className="border-[#E8E3DD] shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#2C2825' }}>
          <Lock className="h-5 w-5" style={{ color: '#C8956C' }} />
          评分解锁管理
        </CardTitle>
        <CardDescription style={{ color: '#8B8580' }}>
          解锁已提交的评分，允许评估人修改数据
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submittedEvaluators.length === 0 ? (
          <div className="text-center py-16">
            <Lock className="h-12 w-12 mx-auto mb-4" style={{ color: '#E8E3DD' }} />
            <p style={{ color: '#8B8580' }}>暂无已提交的评分</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: '#FFF8F0', border: '1px solid #F0E0D0', color: '#8B6914' }}>
              以下评估人已提交评分并锁定，点击「解锁」按钮可允许其修改评分数据
            </div>
            <div className="grid gap-3">
              {submittedEvaluators.map((evaluator) => (
                <div
                  key={evaluator.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{ borderColor: '#E8E3DD', backgroundColor: '#FFFFFF' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0F7F0' }}>
                      <User className="h-4 w-4" style={{ color: '#5B8C5A' }} />
                    </div>
                    <div>
                      <div className="font-medium text-sm" style={{ color: '#2C2825' }}>{evaluator.name}</div>
                      <div className="text-xs" style={{ color: '#8B8580' }}>已提交 {evaluator.count} 个岗位评分</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#E8D5C4] text-[#D4954B] hover:bg-[#FFF8F0]"
                    onClick={() => onUnlockClick(evaluator.name)}
                  >
                    <Unlock className="h-3.5 w-3.5 mr-1.5" />
                    解锁
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
