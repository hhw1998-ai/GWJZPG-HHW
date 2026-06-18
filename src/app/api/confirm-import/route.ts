import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface ImportResponse {
  success: boolean;
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: ImportError[];
}

interface ImportError {
  companyName: string;
  positionName: string;
  error: string;
}

interface PositionData {
  companyName: string;
  department: string;
  positionName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positions } = body as { positions: PositionData[] };

    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '没有有效的岗位数据' 
      }, { status: 400 });
    }

    const client = getSupabaseClient();
    let importedCount = 0;
    let skippedCount = 0;
    const errors: ImportError[] = [];

    // 按公司分组
    const dataByCompany = new Map<string, PositionData[]>();
    for (const data of positions) {
      if (!dataByCompany.has(data.companyName)) {
        dataByCompany.set(data.companyName, []);
      }
      dataByCompany.get(data.companyName)!.push(data);
    }

    // 导入数据
    for (const [companyName, companyPositions] of dataByCompany) {
      // 创建或获取公司
      const { data: company } = await client
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .single();

      let companyId: string;
      if (!company) {
        const { data: newCompany, error: createError } = await client
          .from('companies')
          .insert({ name: companyName })
          .select('id')
          .single();
        
        if (createError || !newCompany) {
          console.error(`创建公司失败: ${companyName}`, createError);
          for (const pos of companyPositions) {
            errors.push({
              companyName,
              positionName: pos.positionName,
              error: '创建公司失败',
            });
          }
          skippedCount += companyPositions.length;
          continue;
        }
        companyId = newCompany.id;
      } else {
        companyId = company.id;
      }

      // 优化：批量查询已存在的岗位（单次 DB 调用替代 N 次逐条查询）
      const positionNames = companyPositions.map(p => p.positionName);
      const { data: existingPositions } = await client
        .from('positions')
        .select('id, name')
        .eq('company_id', companyId)
        .in('name', positionNames);

      const existingNames = new Set((existingPositions || []).map((p: any) => p.name));

      // 过滤出需要新建的岗位
      const toCreate = companyPositions.filter(p => !existingNames.has(p.positionName));

      // 统计跳过的
      skippedCount += companyPositions.length - toCreate.length;

      // 批量插入新岗位
      if (toCreate.length > 0) {
        const insertData = toCreate.map(p => ({
          company_id: companyId,
          department: p.department,
          name: p.positionName,
        }));

        const { error: insertError } = await client.from('positions').insert(insertData);

        if (insertError) {
          console.error(`批量创建岗位失败: ${companyName}`, insertError);
          for (const pos of toCreate) {
            errors.push({
              companyName,
              positionName: pos.positionName,
              error: '创建岗位失败',
            });
          }
          skippedCount += toCreate.length;
        } else {
          importedCount += toCreate.length;
        }
      }
    }

    const response: ImportResponse = {
      success: importedCount > 0,
      message: errors.length > 0
        ? `成功导入 ${importedCount} 个岗位，跳过 ${skippedCount} 行，失败 ${errors.length} 个`
        : `成功导入 ${importedCount} 个岗位，跳过 ${skippedCount} 行`,
      importedCount,
      skippedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('导入失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '导入失败：' + (error instanceof Error ? error.message : String(error)),
        importedCount: 0,
        skippedCount: 0,
        errorCount: 0,
      }, 
      { status: 500 }
    );
  }
}
