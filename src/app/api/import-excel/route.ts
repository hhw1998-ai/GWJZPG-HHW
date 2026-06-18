import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  validateExcelFile,
  formatErrorForDisplay,
  generateErrorReport,
  ValidationError,
  ValidationResult,
} from '@/lib/excel-validator';

// API响应接口
interface ImportResponse {
  success: boolean;
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: FormattedError[];
  errorReport?: string;
}

// 格式化后的错误（用于前端展示）
interface FormattedError {
  companyName: string;
  rowIndex: number;
  errorType: string;
  message: string;
  formatted: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: '未上传文件' 
      }, { status: 400 });
    }

    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ 
        success: false, 
        error: '请上传 Excel 文件（.xlsx 或 .xls）' 
      }, { status: 400 });
    }

    // 读取文件数据
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 使用校验函数解析和校验Excel
    const validationResult = validateExcelFile(buffer);

    const client = getSupabaseClient();
    let importedCount = 0;
    let skippedCount = 0;

    // 格式化错误信息
    const formattedErrors: FormattedError[] = validationResult.errors.map(error => ({
      companyName: error.companyName,
      rowIndex: error.rowIndex,
      errorType: error.errorType,
      message: error.message,
      formatted: formatErrorForDisplay(error),
    }));

    // 如果没有有效数据，直接返回错误
    if (validationResult.validData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Excel文件中没有有效的岗位数据',
        importedCount: 0,
        skippedCount: validationResult.totalRows,
        errorCount: formattedErrors.length,
        errors: formattedErrors,
        errorReport: generateErrorReport(validationResult),
      });
    }

    // 按公司分组有效数据
    const dataByCompany = new Map<string, typeof validationResult.validData>();
    for (const data of validationResult.validData) {
      if (!dataByCompany.has(data.companyName)) {
        dataByCompany.set(data.companyName, []);
      }
      dataByCompany.get(data.companyName)!.push(data);
    }

    // 导入有效数据
    for (const [companyName, positions] of dataByCompany) {
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
          // 将该公司的所有岗位标记为跳过
          skippedCount += positions.length;
          continue;
        }
        companyId = newCompany.id;
      } else {
        companyId = company.id;
      }

      // 批量检查和创建岗位
      for (const position of positions) {
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
            skippedCount++;
          } else {
            importedCount++;
          }
        } else {
          // 岗位已存在，跳过（不计入错误）
          skippedCount++;
        }
      }
    }

    // 构建响应
    const hasErrors = formattedErrors.length > 0;
    const response: ImportResponse = {
      success: importedCount > 0 || validationResult.validData.length > 0,
      message: hasErrors
        ? `成功导入 ${importedCount} 个岗位，跳过 ${skippedCount} 行，发现 ${formattedErrors.length} 个错误`
        : `成功导入 ${importedCount} 个岗位，跳过 ${skippedCount} 行`,
      importedCount,
      skippedCount,
      errorCount: formattedErrors.length,
      errors: hasErrors ? formattedErrors : undefined,
      errorReport: hasErrors ? generateErrorReport(validationResult) : undefined,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Excel导入失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Excel导入失败', 
        message: error instanceof Error ? error.message : String(error),
        importedCount: 0,
        skippedCount: 0,
        errorCount: 0,
      }, 
      { status: 500 }
    );
  }
}
