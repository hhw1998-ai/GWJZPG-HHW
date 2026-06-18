import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 千分制分值表
const SCORE_TABLE: Record<string, Record<number, number>> = {
  impactRange: { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 },
  impactLevel: { 1: 30, 2: 60, 3: 90, 4: 120, 5: 150 },
  problemComplexity: { 1: 10, 2: 20, 3: 40, 4: 60, 5: 80 },
  problemSolving: { 1: 30, 2: 60, 3: 90, 4: 120 },
  leadershipRange: { 1: 20, 2: 30, 3: 40, 4: 50, 5: 70 },
  leadershipStyle: { 1: 10, 2: 20, 3: 40, 4: 60, 5: 80 },
  internalCommunication: { 1: 10, 2: 20, 3: 30, 4: 50, 5: 70 },
  externalCommunication: { 1: 10, 2: 30, 3: 50, 4: 80 },
  knowledgeScope: { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 },
  knowledgeLevel: { 1: 10, 2: 20, 3: 30, 4: 50 },
  environmentComfort: { 1: 5, 2: 10, 3: 20, 4: 30 },
  workBalance: { 1: 5, 2: 10, 3: 15, 4: 20, 5: 30 },
  workTime: { 1: 5, 2: 10, 3: 20, 4: 30, 5: 40 },
  replaceability: { 1: 10, 2: 20, 3: 30, 4: 50 }
};

// 维度配置
const DIMENSIONS = [
  { fieldName: 'impactRange', maxLevel: 5 },
  { fieldName: 'impactLevel', maxLevel: 5 },
  { fieldName: 'problemComplexity', maxLevel: 5 },
  { fieldName: 'problemSolving', maxLevel: 4 },
  { fieldName: 'leadershipRange', maxLevel: 5 },
  { fieldName: 'leadershipStyle', maxLevel: 5 },
  { fieldName: 'internalCommunication', maxLevel: 5 },
  { fieldName: 'externalCommunication', maxLevel: 4 },
  { fieldName: 'knowledgeScope', maxLevel: 5 },
  { fieldName: 'knowledgeLevel', maxLevel: 4 },
  { fieldName: 'environmentComfort', maxLevel: 4 },
  { fieldName: 'workBalance', maxLevel: 5 },
  { fieldName: 'workTime', maxLevel: 5 },
  { fieldName: 'replaceability', maxLevel: 4 }
];

function generateScores(positionName: string): Record<string, number> {
  const scores: Record<string, number> = {};
  
  // 根据岗位名称判断级别
  const isManager = /经理|部长|主任/.test(positionName) && !positionName.includes('副');
  const isDeputy = positionName.includes('副');
  const isSupervisor = /主管|负责人/.test(positionName);
  
  for (const dim of DIMENSIONS) {
    const maxLevel = dim.maxLevel;
    let base: number;
    
    if (isManager) {
      // 经理级别：评分偏高
      base = Math.floor(Math.random() * (maxLevel - 2)) + 3; // 3-5
    } else if (isDeputy) {
      // 副职：中等偏上
      base = Math.floor(Math.random() * (maxLevel - 1)) + 2; // 2-4
    } else if (isSupervisor) {
      // 主管：中等
      base = Math.floor(Math.random() * Math.min(3, maxLevel - 1)) + 2; // 2-4
    } else {
      // 普通岗位：中等偏低
      base = Math.floor(Math.random() * Math.min(3, maxLevel)) + 1; // 1-3
    }
    
    scores[dim.fieldName] = Math.min(base, maxLevel);
  }
  
  return scores;
}

function calculateTotal(scores: Record<string, number>): number {
  let total = 0;
  for (const [field, level] of Object.entries(scores)) {
    if (SCORE_TABLE[field] && SCORE_TABLE[field][level]) {
      total += SCORE_TABLE[field][level];
    }
  }
  return total;
}

export async function POST() {
  try {
    const client = getSupabaseClient();
    
    // 获取所有岗位
    const { data: positions, error: posError } = await client
      .from('positions')
      .select('id, name');
    
    if (posError) throw posError;
    
    // 获取所有评估人
    const { data: evaluators, error: evalError } = await client
      .from('evaluators')
      .select('id, name');
    
    if (evalError) throw evalError;
    
    // 清空现有评分
    await client.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 生成评分数据
    const evaluations = [];
    
    for (const position of positions || []) {
      for (const evaluator of evaluators || []) {
        const scores = generateScores(position.name);
        const totalScore = calculateTotal(scores);
        
        evaluations.push({
          position_id: position.id,
          evaluator_id: evaluator.id,
          impact_range: scores.impactRange,
          impact_level: scores.impactLevel,
          problem_complexity: scores.problemComplexity,
          problem_solving: scores.problemSolving,
          leadership_range: scores.leadershipRange,
          leadership_style: scores.leadershipStyle,
          internal_communication: scores.internalCommunication,
          external_communication: scores.externalCommunication,
          knowledge_scope: scores.knowledgeScope,
          knowledge_level: scores.knowledgeLevel,
          environment_comfort: scores.environmentComfort,
          work_balance: scores.workBalance,
          work_time: scores.workTime,
          replaceability: scores.replaceability,
          total_score: totalScore,
        });
      }
    }
    
    // 批量插入
    const { error: insertError } = await client
      .from('evaluations')
      .insert(evaluations);
    
    if (insertError) throw insertError;
    
    return NextResponse.json({
      success: true,
      message: `成功生成 ${(positions?.length || 0) * (evaluators?.length || 0)} 条评分记录`,
      positionCount: positions?.length || 0,
      evaluatorCount: evaluators?.length || 0,
      totalRecords: evaluations.length
    });
  } catch (error) {
    console.error('生成模拟数据失败:', error);
    return NextResponse.json({ 
      error: '生成模拟数据失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
