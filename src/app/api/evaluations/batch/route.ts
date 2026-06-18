import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getAllDimensions, getScoreByLevel } from '@/lib/evaluation-standards';

// 批量保存评分 - 优化版本
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluatorName, scores, isSubmit = false } = body;

    if (!evaluatorName || !scores) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const positionIds = Object.keys(scores);
    
    if (positionIds.length === 0) {
      return NextResponse.json({ success: true, message: '无评分数据' });
    }

    // 优化1: 使用 upsert 创建或获取评估人（单次数据库调用）
    const { data: evaluator, error: evaluatorError } = await client
      .from('evaluators')
      .upsert({ name: evaluatorName }, { onConflict: 'name' })
      .select('id')
      .single();

    if (evaluatorError || !evaluator) {
      console.error('创建评估人失败:', evaluatorError);
      return NextResponse.json({ error: '创建评估人失败' }, { status: 500 });
    }

    const evaluatorId = evaluator.id;

    // 如果是正式提交，检查是否已经提交过
    if (isSubmit) {
      const { data: existingSubmitted } = await client
        .from('evaluations')
        .select('id')
        .eq('evaluator_id', evaluatorId)
        .eq('submitted', true)
        .limit(1);

      if (existingSubmitted && existingSubmitted.length > 0) {
        return NextResponse.json({ 
          error: '您已提交过评分，无法重复提交。如需修改请联系管理员。' 
        }, { status: 403 });
      }
    }

    // 优化2: 批量获取现有评分（单次数据库调用）
    const { data: existingEvaluations } = await client
      .from('evaluations')
      .select('id, position_id, submitted')
      .eq('evaluator_id', evaluatorId)
      .in('position_id', positionIds);

    const existingMap = new Map(
      (existingEvaluations || []).map(e => [e.position_id, e])
    );

    // 获取所有维度配置
    const allDimensions = getAllDimensions();

    // 准备批量数据
    const toInsert: any[] = [];
    const toUpdate: any[] = [];

    for (const positionId of positionIds) {
      const positionScores = scores[positionId];
      if (!positionScores) continue;

      // 计算总分
      let totalScore = 0;
      allDimensions.forEach(dimension => {
        const level = positionScores[dimension.fieldName] || 0;
        if (level > 0) {
          totalScore += getScoreByLevel(dimension, level);
        }
      });

      const evaluationData = {
        position_id: positionId,
        evaluator_id: evaluatorId,
        impact_range: positionScores.impactRange || 0,
        impact_level: positionScores.impactLevel || 0,
        problem_complexity: positionScores.problemComplexity || 0,
        problem_solving: positionScores.problemSolving || 0,
        leadership_range: positionScores.leadershipRange || 0,
        leadership_style: positionScores.leadershipStyle || 0,
        internal_communication: positionScores.internalCommunication || 0,
        external_communication: positionScores.externalCommunication || 0,
        knowledge_scope: positionScores.knowledgeScope || 0,
        knowledge_level: positionScores.knowledgeLevel || 0,
        environment_comfort: positionScores.environmentComfort || 0,
        work_balance: positionScores.workBalance || 0,
        work_time: positionScores.workTime || 0,
        replaceability: positionScores.replaceability || 0,
        total_score: totalScore,
        submitted: isSubmit ? true : false,
      };

      const existing = existingMap.get(positionId);
      if (existing) {
        // 已提交的不能修改（除非是提交操作）
        if (existing.submitted === true && !isSubmit) {
          continue;
        }
        toUpdate.push({ id: existing.id, ...evaluationData });
      } else {
        toInsert.push(evaluationData);
      }
    }

    // 优化3: 并行批量插入和更新
    const operations: Promise<any>[] = [];

    // 批量插入（单次数据库调用）
    if (toInsert.length > 0) {
      const insertPromise = client.from('evaluations').insert(toInsert);
      operations.push(Promise.resolve(insertPromise));
    }

    // 批量更新（并行执行）
    if (toUpdate.length > 0) {
      for (const item of toUpdate) {
        const { id, ...updateData } = item;
        const updatePromise = client.from('evaluations').update(updateData).eq('id', id);
        operations.push(Promise.resolve(updatePromise));
      }
    }

    // 并行执行所有操作
    const results = await Promise.all(operations);
    
    // 检查错误
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('批量操作部分失败:', errors);
    }

    // 如果是正式提交，确保所有评分标记为已提交
    if (isSubmit) {
      await client
        .from('evaluations')
        .update({ submitted: true })
        .eq('evaluator_id', evaluatorId);
    }

    return NextResponse.json({ 
      success: true,
      message: isSubmit ? '评分提交成功！' : '保存成功',
      stats: {
        inserted: toInsert.length,
        updated: toUpdate.length
      }
    });
  } catch (error) {
    console.error('批量保存评分失败:', error);
    return NextResponse.json({ error: '批量保存评分失败' }, { status: 500 });
  }
}
