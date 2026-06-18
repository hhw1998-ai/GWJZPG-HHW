"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import type { PositionDetail } from "./types";

const dimensionNames: Record<string, string> = {
  impact_range: "影响范围",
  impact_level: "影响程度",
  problem_complexity: "问题复杂性",
  problem_solving: "问题解决",
  leadership_range: "领导范围",
  leadership_style: "领导方式",
  internal_communication: "内部沟通",
  external_communication: "外部沟通",
  knowledge_scope: "知识范围",
  knowledge_level: "知识水平",
  environment_comfort: "环境舒适度",
  work_balance: "工作均衡性",
  work_time: "工作时间",
  replaceability: "可替代性",
};

interface RankingsTabProps {
  positionDetails: PositionDetail[];
  onToggleExpand: (positionId: string) => void;
}

function ScoreBarChart({ details }: { details: PositionDetail[] }) {
  if (details.length === 0) return null;

  const maxScore = Math.max(...details.map(d => d.averageScore), 1);
  const barWidth = 220;
  const barHeight = 16;
  const gap = 6;
  const labelWidth = 120;
  const scoreWidth = 50;
  const chartWidth = labelWidth + barWidth + scoreWidth + 20;
  const chartHeight = Math.min(details.length, 15) * (barHeight + gap) + 20;

  const displayItems = details.slice(0, 15);

  return (
    <Card className="border-[#E8E3DD] shadow-none mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base" style={{ color: '#2C2825' }}>得分分布</CardTitle>
        <CardDescription style={{ color: '#8B8580' }}>各岗位平均得分对比（Top 15）</CardDescription>
      </CardHeader>
      <CardContent>
        <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="max-w-full">
          {displayItems.map((item, i) => {
            const y = i * (barHeight + gap) + 10;
            const w = (item.averageScore / maxScore) * barWidth;
            const isTop3 = i < 3;
            return (
              <g key={item.positionId}>
                <text x={0} y={y + barHeight - 4} fontSize="11" fill="#2C2825" fontFamily="PingFang SC, sans-serif">
                  {item.positionName.length > 8 ? item.positionName.slice(0, 8) + '\u2026' : item.positionName}
                </text>
                <rect x={labelWidth} y={y} width={w} height={barHeight} rx="3" fill={isTop3 ? '#C8956C' : '#E8E3DD'} />
                <text x={labelWidth + w + 6} y={y + barHeight - 4} fontSize="11" fill="#3D3630" fontWeight="600" fontFamily="JetBrains Mono, monospace">
                  {item.averageScore}
                </text>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

export function RankingsTab({ positionDetails, onToggleExpand }: RankingsTabProps) {
  return (
    <>
      <ScoreBarChart details={positionDetails} />
      <Card className="border-[#E8E3DD] shadow-none mt-3">
        <CardHeader>
          <CardTitle style={{ color: '#2C2825' }}>岗位价值排名</CardTitle>
          <CardDescription style={{ color: '#8B8580' }}>
            按平均得分从高到低排序，点击岗位行可查看每位评估人的详细评分
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positionDetails.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: '#E8E3DD' }} />
              <p style={{ color: '#8B8580' }}>暂无数据，请先在评分页面完成评分</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {positionDetails.map((position, index) => (
                <div key={position.positionId} className="border rounded-lg overflow-hidden" style={{ borderColor: '#E8E3DD' }}>
                  <div
                    className="flex items-center px-4 py-3 cursor-pointer hover:bg-[#FAF8F5] transition-colors"
                    onClick={() => onToggleExpand(position.positionId)}
                  >
                    <div className="w-12 flex-shrink-0">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: index === 0 ? '#C8956C' : index === 1 ? '#B8A99A' : index === 2 ? '#D4A574' : '#F5F2EE',
                          color: index < 3 ? '#FFFFFF' : '#8B8580',
                        }}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <div className="w-36 flex-shrink-0 truncate text-sm font-medium" style={{ color: '#2C2825' }}>{position.companyName}</div>
                    <div className="w-20 flex-shrink-0 truncate text-sm" style={{ color: '#8B8580' }}>{position.department}</div>
                    <div className="flex-1 text-sm font-medium" style={{ color: '#2C2825' }}>{position.positionName}</div>
                    <div className="w-20 text-right font-semibold text-base" style={{ color: '#3D3630', fontFamily: "JetBrains Mono, monospace" }}>{position.averageScore}</div>
                    <div className="w-16 text-right text-xs" style={{ color: '#8B8580' }}>{position.evaluationCount}人</div>
                    <div className="w-28 text-right text-xs truncate" style={{ color: '#8B8580' }}>{position.evaluators.join(', ')}</div>
                    <div className="w-8 flex justify-center">
                      {position.evaluationCount > 0 && (
                        position.expanded
                          ? <ChevronUp className="h-4 w-4" style={{ color: '#8B8580' }} />
                          : <ChevronDown className="h-4 w-4" style={{ color: '#8B8580' }} />
                      )}
                    </div>
                  </div>

                  {position.expanded && position.detailedScores.length > 0 && (
                    <div className="border-t px-4 py-3" style={{ backgroundColor: '#FAF8F5', borderColor: '#E8E3DD' }}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderColor: '#E8E3DD' }} className="border-b">
                              <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: '#8B8580' }}>评估人</th>
                              {Object.entries(dimensionNames).map(([key, name]) => (
                                <th key={key} className="text-center py-2 px-1.5 font-medium text-xs whitespace-nowrap" style={{ color: '#8B8580' }}>{name}</th>
                              ))}
                              <th className="text-center py-2 px-3 font-medium text-xs" style={{ color: '#8B8580' }}>总分</th>
                            </tr>
                          </thead>
                          <tbody>
                            {position.detailedScores.map((score, sIndex) => (
                              <tr key={score.id || sIndex} className="border-b last:border-0" style={{ borderColor: '#F5F2EE' }}>
                                <td className="py-2 px-3 font-medium text-xs" style={{ color: '#2C2825' }}>{score.evaluatorName}</td>
                                {Object.keys(dimensionNames).map((key) => (
                                  <td key={key} className="text-center py-2 px-1.5">
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: score.scores[key] >= 4 ? '#F0F7F0' : score.scores[key] >= 3 ? '#F5F2EE' : score.scores[key] >= 2 ? '#FFF8F0' : '#FFF0F0',
                                        color: score.scores[key] >= 4 ? '#5B8C5A' : score.scores[key] >= 3 ? '#3D3630' : score.scores[key] >= 2 ? '#D4954B' : '#CC5555',
                                      }}
                                    >
                                      {score.scores[key]}
                                    </span>
                                  </td>
                                ))}
                                <td className="text-center py-2 px-3 font-semibold text-xs" style={{ color: '#C8956C', fontFamily: "JetBrains Mono, monospace" }}>{score.totalScore}</td>
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
    </>
  );
}
