import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 通用岗位职级识别（基于关键词模糊匹配，不硬编码具体公司/岗位名）
function getPositionLevel(name: string): number {
  // 高层管理
  if (
    name.includes('总经理') || name.includes('董事长') || name.includes('总裁')
  ) return 0;
  // 中层管理
  if (name.includes('经理') || name.includes('部长') || name.includes('主任')) {
    if (name.includes('副')) return 2;
    return 1;
  }
  // 主管级
  if (name.includes('主管') || name.includes('负责人')) return 3;
  // 普通岗位
  return 99;
}

export async function GET() {
  try {
    const client = getSupabaseClient();

    const { data: positions } = await client.from('positions').select('*');
    if (!positions) return NextResponse.json({ data: [] });

    const { data: companies } = await client.from('companies').select('*');
    const companyMap = new Map((companies || []).map((c: any) => [c.id, c]));
    
    // 通用排序：按公司名称拼音排序，生成排序索引
    const sortedCompanyNames = (companies || [])
      .map((c: any) => c.name)
      .sort((a: string, b: string) => a.localeCompare(b, 'zh-CN'));
    const companyOrderMap: Record<string, number> = {};
    (companies || []).forEach((c: any) => {
      companyOrderMap[c.id] = sortedCompanyNames.indexOf(c.name);
    });

    const { data: evaluators } = await client.from('evaluators').select('*');
    const evaluatorMap = new Map((evaluators || []).map((e: any) => [e.id, e]));

    // 使用流式查询获取所有评估记录（Supabase限制单次最多1000行）
    let allEvaluations: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: pageData } = await client
        .from('evaluations')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!pageData || pageData.length === 0) break;
      allEvaluations = allEvaluations.concat(pageData);
      if (pageData.length < pageSize) break; // 最后一页
      page++;
    }
    
    if (allEvaluations.length === 0) return NextResponse.json({ data: [] });

    const evaluationsByPosition = new Map<string, any[]>();
    allEvaluations.forEach((evaluation: any) => {
      if (!evaluationsByPosition.has(evaluation.position_id)) {
        evaluationsByPosition.set(evaluation.position_id, []);
      }
      evaluationsByPosition.get(evaluation.position_id)!.push({
        total_score: evaluation.total_score,
        evaluator_id: evaluation.evaluator_id,
      });
    });

    const rankingData = positions
      .map((position: any) => {
        const positionEvaluations = evaluationsByPosition.get(position.id) || [];
        const evaluationCount = positionEvaluations.length;
        if (evaluationCount === 0) return null;

        const totalScore = positionEvaluations.reduce((sum: number, e: any) => sum + e.total_score, 0);
        const averageScore = Math.round(totalScore / evaluationCount);

        const evaluatorIds = positionEvaluations.map((e: any) => e.evaluator_id);
        const evaluatorNames = evaluatorIds
          .map(id => evaluatorMap.get(id)?.name)
          .filter(name => name) as string[];

        return {
          id: position.id,
          name: position.name,
          department: position.department,
          companyName: companyMap.get(position.company_id)?.name || '',
          companyOrder: companyOrderMap[position.company_id] ?? 999,
          positionLevel: getPositionLevel(position.name),
          averageScore,
          evaluationCount,
          evaluators: evaluatorNames,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 按平均分从高到低排序
    rankingData.sort((a, b) => {
      // 主要排序：按平均分从高到低
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      // 分数相同时，按公司顺序
      if (a.companyOrder !== b.companyOrder) {
        return a.companyOrder - b.companyOrder;
      }
      // 再按部门
      return (a.department || '').localeCompare(b.department || '', 'zh-CN');
    });

    return NextResponse.json({ data: rankingData });
  } catch (error) {
    console.error('获取排名数据失败:', error);
    return NextResponse.json({ error: '获取排名数据失败' }, { status: 500 });
  }
}
