import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('companies')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('获取公司列表失败:', error);
    return NextResponse.json({ error: '获取公司列表失败' }, { status: 500 });
  }
}
