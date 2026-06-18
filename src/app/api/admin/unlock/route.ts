import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取已提交的评估人列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const evaluatorName = searchParams.get('evaluatorName');

    if (evaluatorName) {
      // 获取指定评估人的提交状态和评分详情
      const { data: evaluator } = await client
        .from('evaluators')
        .select('id, name')
        .eq('name', evaluatorName)
        .single();

      if (!evaluator) {
        return NextResponse.json({ data: null, submitted: false });
      }

      // 获取该评估人的所有评分
      const { data: evaluations, error } = await client
        .from('evaluations')
        .select(`
          id,
          position_id,
          submitted,
          total_score,
          positions (
            id,
            name,
            department,
            companies (name)
          )
        `)
        .eq('evaluator_id', evaluator.id)
        .limit(1000);  // 单个评估人最多1000条记录

      if (error) throw error;

      // 检查是否所有评分都已提交
      const allSubmitted = evaluations && evaluations.length > 0 && 
        evaluations.every(e => e.submitted === true);

      return NextResponse.json({ 
        data: evaluations,
        submitted: allSubmitted,
        evaluatorId: evaluator.id
      });
    }

    // 获取所有已提交的评估人
    const { data: submittedEvaluations, error } = await client
      .from('evaluations')
      .select(`
        evaluator_id,
        submitted,
        evaluators (name)
      `)
      .eq('submitted', true)
      .limit(10000);  // 移除Supabase默认的1000行限制

    if (error) {
      console.error('查询已提交评分失败:', error);
      // 如果查询失败，返回空数据而不是抛出错误
      return NextResponse.json({ data: [] });
    }

    // 按评估人分组
    const evaluatorMap = new Map<string, { name: string; count: number }>();
    
    submittedEvaluations?.forEach(e => {
      const name = (e.evaluators as any)?.name;
      if (name) {
        if (evaluatorMap.has(name)) {
          evaluatorMap.get(name)!.count++;
        } else {
          evaluatorMap.set(name, { name, count: 1 });
        }
      }
    });

    const evaluators = Array.from(evaluatorMap.values());

    return NextResponse.json({ data: evaluators });

  } catch (error) {
    console.error('获取提交状态失败:', error);
    return NextResponse.json({ error: '获取提交状态失败' }, { status: 500 });
  }
}

// 解锁评估人的评分
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluatorName, positionId, operatorName } = body;

    if (!evaluatorName || !operatorName) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 获取评估人ID
    const { data: evaluator } = await client
      .from('evaluators')
      .select('id')
      .eq('name', evaluatorName)
      .single();

    if (!evaluator) {
      return NextResponse.json({ error: '评估人不存在' }, { status: 404 });
    }

    // 构建更新条件
    let updateQuery = client
      .from('evaluations')
      .update({ submitted: false })
      .eq('evaluator_id', evaluator.id);

    // 如果指定了岗位ID，只解锁该岗位
    if (positionId) {
      updateQuery = updateQuery.eq('position_id', positionId);
    }

    // 执行更新
    const { error: updateError } = await updateQuery;

    if (updateError) throw updateError;

    // 获取岗位信息（如果指定了岗位ID）
    let positionName = null;
    if (positionId) {
      const { data: position } = await client
        .from('positions')
        .select('name')
        .eq('id', positionId)
        .single();
      positionName = position?.name;
    }

    // 记录操作日志
    await client
      .from('operation_logs')
      .insert({
        evaluator_name: evaluatorName,
        operation_type: positionId ? 'unlock_position' : 'unlock_all',
        position_id: positionId || null,
        position_name: positionName,
        operator_name: operatorName,
      });

    return NextResponse.json({ 
      success: true, 
      message: positionId 
        ? `已解锁 ${evaluatorName} 对岗位 ${positionName} 的评分` 
        : `已解锁 ${evaluatorName} 的所有评分`
    });

  } catch (error) {
    console.error('解锁失败:', error);
    return NextResponse.json({ error: '解锁失败' }, { status: 500 });
  }
}
