/**
 * Excel 导入校验核心函数库
 * 用于解析和校验岗位价值评估系统的Excel数据
 * 
 * 公司名称识读规则：
 * - 公司名称必须在第1行A列
 * - 系统自动识读，无需预设公司列表
 * - 工作表名称仅作为备用参考
 */

import * as XLSX from 'xlsx';

// 校验错误类型
export enum ValidationErrorType {
  MISSING_COMPANY_NAME = '公司名称缺失',
  MISSING_DEPARTMENT = '部门名称缺失',
  MISSING_POSITION_NAME = '岗位名称缺失',
  EMPTY_ROW = '空行',
  INVALID_FORMAT = '格式错误',
}

// 校验错误接口
export interface ValidationError {
  companyName: string;      // 工作表/公司名称
  rowIndex: number;         // Excel中的行号（从1开始）
  errorType: ValidationErrorType;
  message: string;
  rawData?: {               // 原始数据
    department?: string;
    positionName?: string;
    companyName?: string;
  };
}

// 校验结果接口
export interface ValidationResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  validData: ValidPositionData[];
  detectedCompanies: string[];  // 识别到的公司列表
}

// 有效的岗位数据
export interface ValidPositionData {
  companyName: string;
  department: string;
  positionName: string;
  rowIndex: number;
  sheetName: string;
}

// 工作表解析结果
export interface SheetParseResult {
  sheetName: string;
  companyName: string;
  isValid: boolean;
  headerRow: string[];
  dataRows: any[][];
  errors: ValidationError[];
}

/**
 * 清理公司名称（去除空格和特殊字符）
 */
export function cleanCompanyName(name: string): string {
  return name.trim().replace(/[\s\u00A0\u3000]+/g, '');
}

/**
 * 校验单行数据
 */
export function validateRow(
  row: any[],
  rowIndex: number,
  companyName: string,
  sheetName: string
): { valid: boolean; errors: ValidationError[]; data?: ValidPositionData } {
  const errors: ValidationError[] = [];
  
  // 检查是否为空行
  if (!row || row.length === 0 || row.every(cell => !cell && cell !== 0)) {
    return { valid: false, errors: [] }; // 空行不报错，直接跳过
  }
  
  // B列(index=1)：部门名称
  const department = String(row[1] || '').trim();
  // C列(index=2)：岗位名称
  const positionName = String(row[2] || '').trim();
  
  // 校验岗位名称（必填）
  if (!positionName) {
    errors.push({
      companyName,
      rowIndex,
      errorType: ValidationErrorType.MISSING_POSITION_NAME,
      message: `第${rowIndex}行C列岗位名称为空`,
      rawData: { department, positionName: '' },
    });
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    errors: [],
    data: {
      companyName,
      department: department || '',
      positionName,
      rowIndex,
      sheetName,
    },
  };
}

/**
 * 解析单个工作表
 * 
 * 数据格式要求：
 * - 第1行A列：公司/中心名称（必填）
 * - 第2-4行：可留空或填写其他信息（系统跳过）
 * - 第5行：列标题（部门、岗位名称等）
 * - 第6行开始：岗位数据
 */
export function parseSheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string
): SheetParseResult {
  const errors: ValidationError[] = [];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  // 检查最小行数（至少6行：第1行公司名，第5行列标题，第6行开始数据）
  if (jsonData.length < 6) {
    return {
      sheetName,
      companyName: '',
      isValid: false,
      headerRow: [],
      dataRows: [],
      errors: [{
        companyName: sheetName,
        rowIndex: 0,
        errorType: ValidationErrorType.INVALID_FORMAT,
        message: `数据行数不足6行，当前仅${jsonData.length}行。正确格式：第1行A列填写公司名称，第5行为列标题，第6行开始为岗位数据`,
      }],
    };
  }
  
  // 第1行A列：公司/中心名称（自动识读，无需预设）
  const rawCompanyName = String(jsonData[0][0] || '').trim();
  const companyName = cleanCompanyName(rawCompanyName);
  
  // 校验公司名称是否为空
  if (!companyName) {
    return {
      sheetName,
      companyName: '',
      isValid: false,
      headerRow: [],
      dataRows: [],
      errors: [{
        companyName: sheetName,
        rowIndex: 1,
        errorType: ValidationErrorType.MISSING_COMPANY_NAME,
        message: `第1行A列未找到公司/中心名称。请在第1行A列填写公司或中心名称（如：集团、XX公司、XX中心等）`,
      }],
    };
  }
  
  // 第5行：列标题
  const headerRow = jsonData[4] || [];
  
  // 提取数据行（从第6行开始，索引为5）
  const dataRows: any[][] = [];
  for (let i = 5; i < jsonData.length; i++) {
    const row = jsonData[i];
    // 跳过完全空的行
    if (row && row.length > 0 && !row.every(cell => !cell && cell !== 0)) {
      dataRows.push(row);
    }
  }
  
  return {
    sheetName,
    companyName,
    isValid: true,
    headerRow,
    dataRows,
    errors,
  };
}

/**
 * 校验整个Excel文件
 */
export function validateExcelFile(buffer: Buffer): ValidationResult {
  const result: ValidationResult = {
    success: true,
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
    validData: [],
    detectedCompanies: [],
  };
  
  // 读取Excel
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;
  
  // 跳过的表名关键词
  const skipKeywords = ['因素', '分数矩阵', '说明', '汇总', '总表', '模板', '示例'];
  
  // 记录识别到的公司（去重）
  const companySet = new Set<string>();
  
  for (const sheetName of sheetNames) {
    // 跳过非岗位数据表
    if (skipKeywords.some(keyword => sheetName.includes(keyword))) {
      continue;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const parseResult = parseSheet(worksheet, sheetName);
    
    // 如果工作表解析失败，记录错误
    if (!parseResult.isValid) {
      result.errors.push(...parseResult.errors);
      result.success = false;
      continue;
    }
    
    // 记录识别到的公司
    companySet.add(parseResult.companyName);
    
    // 校验每一行数据
    for (let i = 0; i < parseResult.dataRows.length; i++) {
      const row = parseResult.dataRows[i];
      const excelRowIndex = 6 + i; // Excel中的实际行号（从第6行开始）
      
      result.totalRows++;
      
      const rowResult = validateRow(row, excelRowIndex, parseResult.companyName, sheetName);
      
      if (rowResult.valid && rowResult.data) {
        result.validRows++;
        result.validData.push(rowResult.data);
      } else if (rowResult.errors.length > 0) {
        result.invalidRows++;
        result.errors.push(...rowResult.errors);
        result.success = false;
      }
    }
  }
  
  // 记录所有识别到的公司
  result.detectedCompanies = Array.from(companySet);
  
  // 如果没有识别到任何公司，标记为失败
  if (result.detectedCompanies.length === 0 && result.errors.length === 0) {
    result.success = false;
    result.errors.push({
      companyName: '',
      rowIndex: 0,
      errorType: ValidationErrorType.INVALID_FORMAT,
      message: '未找到有效的数据表。请确保Excel中有包含岗位数据的工作表，且第1行A列填写了公司/中心名称',
    });
  }
  
  return result;
}

/**
 * 格式化错误信息为可读文本
 */
export function formatErrorForDisplay(error: ValidationError): string {
  const { companyName, rowIndex, errorType, message } = error;
  return `【${companyName || '未知'}】第${rowIndex}行：${errorType} - ${message}`;
}

/**
 * 生成错误报告文本
 */
export function generateErrorReport(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push('========================================');
  lines.push('     岗位价值评估系统 - 数据导入错误报告');
  lines.push('========================================');
  lines.push('');
  lines.push(`生成时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push('');
  
  // 显示识别到的公司
  if (result.detectedCompanies.length > 0) {
    lines.push('--- 识别到的公司/中心 ---');
    for (const company of result.detectedCompanies) {
      lines.push(`  • ${company}`);
    }
    lines.push('');
  }
  
  lines.push('--- 统计信息 ---');
  lines.push(`总数据行数：${result.totalRows}`);
  lines.push(`有效数据行数：${result.validRows}`);
  lines.push(`无效数据行数：${result.invalidRows}`);
  lines.push(`错误数量：${result.errors.length}`);
  lines.push('');
  
  if (result.errors.length > 0) {
    lines.push('--- 错误详情 ---');
    lines.push('');
    
    // 按公司分组
    const errorsByCompany = new Map<string, ValidationError[]>();
    for (const error of result.errors) {
      const key = error.companyName || '未知公司';
      if (!errorsByCompany.has(key)) {
        errorsByCompany.set(key, []);
      }
      errorsByCompany.get(key)!.push(error);
    }
    
    for (const [companyName, errors] of errorsByCompany) {
      lines.push(`【${companyName}】`);
      for (const error of errors) {
        lines.push(`  第${error.rowIndex}行：${error.errorType} - ${error.message}`);
        if (error.rawData) {
          if (error.rawData.department) {
            lines.push(`    部门：${error.rawData.department}`);
          }
          if (error.rawData.positionName !== undefined) {
            lines.push(`    岗位：${error.rawData.positionName || '(空)'}`);
          }
        }
      }
      lines.push('');
    }
  }
  
  lines.push('--- 数据格式说明 ---');
  lines.push('• 第1行A列：公司/中心名称（必填，系统自动识读）');
  lines.push('• 第2-4行：可留空或填写其他信息');
  lines.push('• 第5行：列标题（部门、岗位名称等）');
  lines.push('• 第6行开始：岗位数据');
  lines.push('• A列：序号（可留空）');
  lines.push('• B列：部门名称');
  lines.push('• C列：岗位名称（必填）');
  lines.push('');
  lines.push('========================================');
  
  return lines.join('\n');
}
