import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取评分记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get('positionId');
    const evaluatorName = searchParams.get('evaluatorName');

    const client = getSupabaseClient();

    let evaluatorId: string | null = null;

    // 如果提供了评估人姓名，先查找评估人ID
    if (evaluatorName) {
      const { data: evaluator, error: evaluatorError } = await client
        .from('evaluators')
        .select('id')
        .eq('name', evaluatorName)
        .single();
      
      if (evaluatorError || !evaluator) {
        // 评估人不存在，返回空数据
        return NextResponse.json({ data: [] });
      }
      
      evaluatorId = evaluator.id;
    }

    let query = client.from('evaluations').select('*').limit(10000);

    if (positionId) {
      query = query.eq('position_id', positionId);
    }

    if (evaluatorId) {
      query = query.eq('evaluator_id', evaluatorId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('获取评分记录失败:', error);
    return NextResponse.json({ error: '获取评分记录失败' }, { status: 500 });
  }
}

// 提交或更新评分
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      positionId,
      evaluatorName,
      scores,
      totalScore,
    } = body;

    if (!positionId || !evaluatorName || !scores || totalScore === undefined) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 创建或获取评估人
    const { data: evaluator } = await client
      .from('evaluators')
      .select('id')
      .eq('name', evaluatorName)
      .single();

    let evaluatorId: string;
    if (!evaluator) {
      const { data: newEvaluator } = await client
        .from('evaluators')
        .insert({ name: evaluatorName })
        .select('id')
        .single();
      evaluatorId = newEvaluator!.id;
    } else {
      evaluatorId = evaluator.id;
    }

    // 检查是否已有该评估人对该岗位的评分
    const { data: existingEvaluation } = await client
      .from('evaluations')
      .select('id')
      .eq('position_id', positionId)
      .eq('evaluator_id', evaluatorId)
      .single();

    let result;
    if (existingEvaluation) {
      // 更新评分
      result = await client
        .from('evaluations')
        .update({
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
        })
        .eq('id', existingEvaluation.id)
        .select();
    } else {
      // 插入新评分
      result = await client
        .from('evaluations')
        .insert({
          position_id: positionId,
          evaluator_id: evaluatorId,
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
        })
        .select();
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('保存评分失败:', error);
    return NextResponse.json({ error: '保存评分失败' }, { status: 500 });
  }
}
