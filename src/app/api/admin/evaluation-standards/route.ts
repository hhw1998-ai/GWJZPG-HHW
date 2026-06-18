import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取评估标准配置
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('evaluation_standards_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data?.config_data || null,
      updatedAt: data?.updated_at || null,
    });
  } catch (error) {
    console.error('获取评估标准配置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取配置失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新评估标准配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config_data } = body;

    if (!config_data) {
      return NextResponse.json(
        { success: false, message: '缺少配置数据' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('evaluation_standards_config')
      .insert({
        config_data,
        updated_by: 'admin',
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: '配置已更新' });
  } catch (error) {
    console.error('更新评估标准配置失败:', error);
    return NextResponse.json(
      { success: false, message: '更新配置失败' },
      { status: 500 }
    );
  }
}
