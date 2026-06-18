import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET /api/usage-logs — 查询使用日志（仅管理后台调用）
 * POST /api/usage-logs — 记录使用日志
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const action = searchParams.get('action');

    let query = supabase
      .from('usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 500));

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('查询使用日志失败:', error);
    return NextResponse.json({ error: error.message || '查询失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { visitor_name, action, page, detail } = body;

    if (!action) {
      return NextResponse.json({ error: '缺少 action 参数' }, { status: 400 });
    }

    // 获取客户端 IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip_address = forwarded?.split(',')[0]?.trim() || 'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    const { error } = await supabase.from('usage_logs').insert({
      visitor_name: visitor_name || null,
      action,
      page: page || null,
      detail: detail || null,
      ip_address,
      user_agent,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('记录使用日志失败:', error);
    return NextResponse.json({ error: error.message || '记录失败' }, { status: 500 });
  }
}
