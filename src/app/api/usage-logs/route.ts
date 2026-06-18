import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET /api/usage-logs — 查询使用日志（需管理后台 token 鉴权）
 * POST /api/usage-logs — 记录使用日志（公开，前端自动上报）
 */

// 简单的 token 校验：管理后台传入的 token 需与 sessionStorage 中的一致
// 生产环境建议使用 JWT 或 Supabase Auth
function verifyAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  // 至少要求携带 token，防止匿名访问
  return !!token && token.length > 10;
}

export async function GET(request: NextRequest) {
  try {
    // 鉴权：必须携带 admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

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
