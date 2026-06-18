import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 添加公司岗位数据（不清空现有数据）
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { companyName, positions } = body;

    if (!companyName || !positions || !Array.isArray(positions)) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 检查公司是否已存在
    const { data: existingCompany } = await client
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .single();

    let companyId: string;

    if (existingCompany) {
      companyId = existingCompany.id;
      // 删除该公司现有的岗位
      await client.from('positions').delete().eq('company_id', companyId);
      console.log('公司已存在，已清空原岗位数据，ID:', companyId);
    } else {
      // 创建新公司
      const { data: newCompany } = await client
        .from('companies')
        .insert({ name: companyName })
        .select('id')
        .single();
      companyId = newCompany!.id;
      console.log('创建新公司，ID:', companyId);
    }

    // 批量插入岗位
    const positionsToInsert = positions.map(p => ({
      company_id: companyId,
      department: p.department || '',
      name: p.name,
    }));

    const { data: insertedPositions, error: positionError } = await client
      .from('positions')
      .insert(positionsToInsert)
      .select('id, department, name');

    if (positionError) {
      console.error('插入岗位失败:', positionError);
      throw positionError;
    }

    console.log(`成功添加 ${companyName} 的 ${insertedPositions?.length} 个岗位`);

    return NextResponse.json({
      success: true,
      message: `成功添加 ${companyName} 的岗位数据`,
      companyName,
      totalPositions: insertedPositions?.length || 0,
      positions: insertedPositions
    });
  } catch (error) {
    console.error('添加公司岗位失败:', error);
    return NextResponse.json(
      { error: '添加公司岗位失败', details: String(error) },
      { status: 500 }
    );
  }
}
