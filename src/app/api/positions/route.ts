import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 通用岗位职级识别（基于关键词模糊匹配，不硬编码具体公司/岗位名）
function getPositionLevel(name: string): number {
  if (
    name.includes('总经理') || name.includes('董事长') || name.includes('总裁')
  ) return 0;
  if (name.includes('经理') || name.includes('部长') || name.includes('主任')) {
    if (name.includes('副')) return 2;
    return 1;
  }
  if (name.includes('主管') || name.includes('负责人')) return 3;
  return 99;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const client = getSupabaseClient();

    // 并行查询：公司信息 + 岗位列表 + 评分统计
    const [companiesResult, positionsResult, evaluationsResult] = await Promise.all([
      client.from('companies').select('*'),
      companyId 
        ? client.from('positions').select('*').eq('company_id', companyId)
        : client.from('positions').select('*'),
      // 使用流式查询获取所有评估记录
      (async () => {
        let allData: any[] = [];
        let page = 0;
        const pageSize = 1000;
        while (true) {
          const { data } = await client
            .from('evaluations')
            .select('position_id')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < pageSize) break;
          page++;
        }
        return { data: allData, error: null };
      })()
    ]);

    if (companiesResult.error) throw companiesResult.error;
    if (positionsResult.error) throw positionsResult.error;
    if (evaluationsResult.error) throw evaluationsResult.error;

    const companies = companiesResult.data || [];
    const positions = positionsResult.data || [];
    const evaluations = evaluationsResult.data || [];

    // 创建公司映射
    const companyMap = new Map(
      companies.map((c: any) => [c.id, c])
    );

    // 创建公司排序索引映射（通用：按名称拼音排序）
    const sortedCompanyNames = companies
      .map((c: any) => c.name)
      .sort((a: string, b: string) => a.localeCompare(b, 'zh-CN'));
    const companyOrderMap: Record<string, number> = {};
    companies.forEach((c: any) => {
      companyOrderMap[c.id] = sortedCompanyNames.indexOf(c.name);
    });

    // 统计每个岗位的评分数量（内存计算，避免N+1查询）
    const evaluationCountMap = new Map<string, number>();
    evaluations.forEach((e: any) => {
      const count = evaluationCountMap.get(e.position_id) || 0;
      evaluationCountMap.set(e.position_id, count + 1);
    });

    // 组装岗位数据
    const positionsWithStatus = positions.map((position: any) => {
      const count = evaluationCountMap.get(position.id) || 0;
      return {
        ...position,
        companies: companyMap.get(position.company_id) || null,
        hasEvaluation: count > 0,
        evaluationCount: count,
      };
    });

    // 按公司顺序、部门、岗位职级排序
    const sortedPositions = positionsWithStatus.sort((a: any, b: any) => {
      // 先按公司排序顺序
      const aCompanyOrder = companyOrderMap[a.company_id] ?? 999;
      const bCompanyOrder = companyOrderMap[b.company_id] ?? 999;
      
      if (aCompanyOrder !== bCompanyOrder) {
        return aCompanyOrder - bCompanyOrder;
      }
      
      // 同一公司内按部门排序
      if (a.department !== b.department) {
        return (a.department || '').localeCompare(b.department || '', 'zh-CN');
      }
      
      // 同一部门内按岗位职级从高到低排序
      const aLevel = getPositionLevel(a.name);
      const bLevel = getPositionLevel(b.name);
      
      if (aLevel !== bLevel) {
        return aLevel - bLevel; // 职级高的排前面（数字小的排前面）
      }
      
      // 同职级按名称排序
      return (a.name || '').localeCompare(b.name || '', 'zh-CN');
    });

    return NextResponse.json({ data: sortedPositions });
  } catch (error) {
    console.error('获取岗位列表失败:', error);
    return NextResponse.json({ error: '获取岗位列表失败' }, { status: 500 });
  }
}
