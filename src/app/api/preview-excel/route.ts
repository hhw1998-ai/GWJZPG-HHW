import { NextRequest, NextResponse } from 'next/server';
import {
  validateExcelFile,
  formatErrorForDisplay,
  generateErrorReport,
  ValidPositionData,
} from '@/lib/excel-validator';

// 预览响应接口
interface PreviewResponse {
  success: boolean;
  message: string;
  detectedCompanies: string[];
  totalPositions: number;
  validPositions: number;
  invalidPositions: number;
  positions: PreviewPosition[];
  errors: FormattedError[];
  errorReport?: string;
  canImport: boolean;  // 是否可以导入（至少有一个有效岗位）
}

// 预览岗位数据
interface PreviewPosition {
  companyName: string;
  department: string;
  positionName: string;
  rowIndex: number;
  sheetName: string;
}

// 格式化后的错误
interface FormattedError {
  companyName: string;
  rowIndex: number;
  errorType: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: '未上传文件' 
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
        message: '请上传 Excel 文件（.xlsx 或 .xls）' 
      }, { status: 400 });
    }

    // 读取文件数据
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 使用校验函数解析和校验Excel
    const validationResult = validateExcelFile(buffer);

    // 格式化岗位数据
    const positions: PreviewPosition[] = validationResult.validData.map(data => ({
      companyName: data.companyName,
      department: data.department,
      positionName: data.positionName,
      rowIndex: data.rowIndex,
      sheetName: data.sheetName,
    }));

    // 格式化错误信息
    const errors: FormattedError[] = validationResult.errors.map(error => ({
      companyName: error.companyName,
      rowIndex: error.rowIndex,
      errorType: String(error.errorType),
      message: error.message,
    }));

    // 构建响应
    const hasValidData = validationResult.validData.length > 0;
    const hasErrors = validationResult.errors.length > 0;

    let message = '';
    if (hasValidData && !hasErrors) {
      message = `识读成功！共发现 ${validationResult.validData.length} 个岗位，${validationResult.detectedCompanies.length} 个公司/中心`;
    } else if (hasValidData && hasErrors) {
      message = `部分成功：发现 ${validationResult.validData.length} 个有效岗位，${validationResult.errors.length} 个错误`;
    } else {
      message = `识读失败：未发现有效岗位数据，共 ${validationResult.errors.length} 个错误`;
    }

    const response: PreviewResponse = {
      success: true,
      message,
      detectedCompanies: validationResult.detectedCompanies,
      totalPositions: validationResult.totalRows,
      validPositions: validationResult.validRows,
      invalidPositions: validationResult.invalidRows,
      positions,
      errors,
      errorReport: hasErrors ? generateErrorReport(validationResult) : undefined,
      canImport: hasValidData,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Excel预览失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Excel预览失败：' + (error instanceof Error ? error.message : String(error)),
        detectedCompanies: [],
        totalPositions: 0,
        validPositions: 0,
        invalidPositions: 0,
        positions: [],
        errors: [],
        canImport: false,
      }, 
      { status: 500 }
    );
  }
}
