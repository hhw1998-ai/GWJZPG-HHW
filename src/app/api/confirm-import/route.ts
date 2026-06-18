import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// API响应接口
interface ImportResponse {
  success: boolean;
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: ImportError[];
}

// 导入错误
interface ImportError {
  companyName: string;
  positionName: string;
  error: string;
}

// 岗位数据接口
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

      // 批量检查和创建岗位
      for (const position of companyPositions) {
        // 检查岗位是否已存在
        const { data: existingPosition } = await client
          .from('positions')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', position.positionName)
          .single();

        if (!existingPosition) {
          // 创建新岗位
          const { error: insertError } = await client.from('positions').insert({
            company_id: companyId,
            department: position.department,
            name: position.positionName,
          });

          if (insertError) {
            console.error(`创建岗位失败: ${position.positionName}`, insertError);
            errors.push({
              companyName,
              positionName: position.positionName,
              error: '创建岗位失败',
            });
            skippedCount++;
          } else {
            importedCount++;
          }
        } else {
          // 岗位已存在，跳过
          skippedCount++;
        }
      }
    }

    // 构建响应
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
