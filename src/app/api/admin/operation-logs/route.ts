import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取操作日志
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const evaluatorName = searchParams.get('evaluatorName');
    const operationType = searchParams.get('operationType');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = client
      .from('operation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (evaluatorName) {
      query = query.eq('evaluator_name', evaluatorName);
    }

    if (operationType) {
      query = query.eq('operation_type', operationType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });

  } catch (error) {
    console.error('获取操作日志失败:', error);
    return NextResponse.json({ error: '获取操作日志失败' }, { status: 500 });
  }
}
