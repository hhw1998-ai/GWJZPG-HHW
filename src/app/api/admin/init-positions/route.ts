import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 初始化集团总部岗位数据
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 集团总部岗位数据（格式：集团-部门-岗位）
    const positions = [
      // 综合管理部（5个）
      { company: '集团', department: '综合管理部', name: '经理' },
      { company: '集团', department: '综合管理部', name: '副经理' },
      { company: '集团', department: '综合管理部', name: '文秘岗' },
      { company: '集团', department: '综合管理部', name: '行政管理岗' },
      { company: '集团', department: '综合管理部', name: '后勤管理岗' },
      
      // 财务管理部（4个）
      { company: '集团', department: '财务管理部', name: '经理' },
      { company: '集团', department: '财务管理部', name: '副经理' },
      { company: '集团', department: '财务管理部', name: '会计岗' },
      { company: '集团', department: '财务管理部', name: '出纳岗' },
      
      // 风控法务部（3个）
      { company: '集团', department: '风控法务部', name: '经理' },
      { company: '集团', department: '风控法务部', name: '内控岗' },
      { company: '集团', department: '风控法务部', name: '法务岗' },
      
      // 党群工作部（人力资源部）（5个）
      { company: '集团', department: '党群工作部（人力资源部）', name: '经理' },
      { company: '集团', department: '党群工作部（人力资源部）', name: '人力资源岗' },
      { company: '集团', department: '党群工作部（人力资源部）', name: '党群管理岗' },
      { company: '集团', department: '党群工作部（人力资源部）', name: '文化宣传岗' },
      { company: '集团', department: '党群工作部（人力资源部）', name: '纪检监察岗' },
      
      // 项目管理部（4个）
      { company: '集团', department: '项目管理部', name: '经理' },
      { company: '集团', department: '项目管理部', name: '项目负责人' },
      { company: '集团', department: '项目管理部', name: '现场管理岗' },
      { company: '集团', department: '项目管理部', name: '内业管理岗' },
      
      // 投融资部（4个）
      { company: '集团', department: '投融资部', name: '经理' },
      { company: '集团', department: '投融资部', name: '副经理' },
      { company: '集团', department: '投融资部', name: '投资管理岗' },
      { company: '集团', department: '投融资部', name: '融资管理岗' },
      
      // 安全环保部（2个）
      { company: '集团', department: '安全环保部', name: '经理' },
      { company: '集团', department: '安全环保部', name: '安环管理岗' },
      
      // 运营管理部（3个）
      { company: '集团', department: '运营管理部', name: '经理' },
      { company: '集团', department: '运营管理部', name: '运营管理岗' },
      { company: '集团', department: '运营管理部', name: '资产管理岗' },
    ];

    // 先清空现有数据
    await client.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('evaluators').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('positions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('已清空现有数据');

    // 创建集团总公司
    const { data: company, error: companyError } = await client
      .from('companies')
      .insert({ name: '集团' })
      .select('id')
      .single();

    if (companyError) {
      console.error('创建公司失败:', companyError);
      throw companyError;
    }

    const companyId = company.id;
    console.log('创建公司成功，ID:', companyId);

    // 批量插入岗位
    const positionsToInsert = positions.map(p => ({
      company_id: companyId,
      department: p.department,
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

    console.log('插入岗位成功，共', insertedPositions?.length, '个');

    return NextResponse.json({
      success: true,
      message: `成功初始化集团总部岗位数据`,
      company: '集团',
      totalPositions: insertedPositions?.length || 0,
      departments: [
        { name: '综合管理部', count: 5 },
        { name: '财务管理部', count: 4 },
        { name: '风控法务部', count: 3 },
        { name: '党群工作部（人力资源部）', count: 5 },
        { name: '项目管理部', count: 4 },
        { name: '投融资部', count: 4 },
        { name: '安全环保部', count: 2 },
        { name: '运营管理部', count: 3 },
      ],
      positions: insertedPositions
    });
  } catch (error) {
    console.error('初始化岗位数据失败:', error);
    return NextResponse.json(
      { error: '初始化岗位数据失败', details: String(error) },
      { status: 500 }
    );
  }
}
