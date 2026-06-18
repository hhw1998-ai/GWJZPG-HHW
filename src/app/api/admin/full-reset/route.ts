import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 完全重置：清空所有数据（评分、岗位、公司、评估人）
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 清空评分记录
    const { error: evalError } = await client
      .from('evaluations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (evalError) {
      console.error('清空评分记录失败:', evalError);
    }

    // 清空评估人记录
    const { error: evaluatorError } = await client
      .from('evaluators')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (evaluatorError) {
      console.error('清空评估人记录失败:', evaluatorError);
    }

    // 清空岗位记录
    const { error: positionError } = await client
      .from('positions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (positionError) {
      console.error('清空岗位记录失败:', positionError);
    }

    // 清空公司记录
    const { error: companyError } = await client
      .from('companies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (companyError) {
      console.error('清空公司记录失败:', companyError);
    }

    console.log('系统已完全重置');
    return NextResponse.json({ success: true, message: '系统已完全重置' });
  } catch (error) {
    console.error('完全重置失败:', error);
    return NextResponse.json({ error: '完全重置失败' }, { status: 500 });
  }
}
