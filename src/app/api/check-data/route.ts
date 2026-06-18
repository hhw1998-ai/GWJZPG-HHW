import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();

    // 获取所有公司
    const { data: companies } = await client
      .from('companies')
      .select('*')
      .order('name');

    // 获取所有岗位
    const { data: positions } = await client
      .from('positions')
      .select('*')
      .order('company_id, department, name');

    // 按公司分组统计
    const stats = (companies || []).map((company: any) => {
      const companyPositions = (positions || []).filter((p: any) => p.company_id === company.id);
      return {
        company: company.name,
        count: companyPositions.length,
        positions: companyPositions
      };
    });

    return NextResponse.json({
      totalPositions: (positions || []).length,
      totalCompanies: (companies || []).length,
      stats
    });
  } catch (error) {
    console.error('查询数据失败:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
