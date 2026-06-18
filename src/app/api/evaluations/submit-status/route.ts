import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取评估人的提交状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const evaluatorName = searchParams.get('evaluatorName');

    if (!evaluatorName) {
      return NextResponse.json({ error: '缺少评估人姓名' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 获取评估人ID
    const { data: evaluator } = await client
      .from('evaluators')
      .select('id')
      .eq('name', evaluatorName)
      .single();

    if (!evaluator) {
      return NextResponse.json({ submitted: false, hasScores: false });
    }

    // 检查是否有已提交的评分
    const { data: submittedCount } = await client
      .from('evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('evaluator_id', evaluator.id)
      .eq('submitted', true);

    // 检查是否有任何评分
    const { count: totalCount } = await client
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('evaluator_id', evaluator.id);

    const hasSubmitted = (submittedCount as any)?.count > 0;
    const hasScores = totalCount && totalCount > 0;

    return NextResponse.json({ 
      submitted: hasSubmitted,
      hasScores: hasScores,
      evaluatorId: evaluator.id
    });

  } catch (error) {
    console.error('获取提交状态失败:', error);
    return NextResponse.json({ error: '获取提交状态失败' }, { status: 500 });
  }
}
