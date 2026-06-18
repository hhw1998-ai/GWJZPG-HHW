import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 清空所有评分数据（保留岗位和公司数据）
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 清空评分记录
    const { error: evalError } = await client
      .from('evaluations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录

    if (evalError) {
      console.error('清空评分记录失败:', evalError);
      throw evalError;
    }

    // 清空评估人记录
    const { error: evaluatorError } = await client
      .from('evaluators')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (evaluatorError) {
      console.error('清空评估人记录失败:', evaluatorError);
      throw evaluatorError;
    }

    console.log('评分数据已清空');
    return NextResponse.json({ success: true, message: '评分数据已清空' });
  } catch (error) {
    console.error('清空数据失败:', error);
    return NextResponse.json({ error: '清空数据失败' }, { status: 500 });
  }
}
