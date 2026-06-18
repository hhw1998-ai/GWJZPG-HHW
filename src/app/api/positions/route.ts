import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getPositionLevel } from '@/lib/position-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const client = getSupabaseClient();

    const [companiesResult, positionsResult, evaluationsResult] = await Promise.all([
      client.from('companies').select('*'),
      companyId 
        ? client.from('positions').select('*').eq('company_id', companyId)
        : client.from('positions').select('*'),
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

    const companyMap = new Map(
      companies.map((c: any) => [c.id, c])
    );

    const sortedCompanyNames = companies
      .map((c: any) => c.name)
      .sort((a: string, b: string) => a.localeCompare(b, 'zh-CN'));
    const companyOrderMap: Record<string, number> = {};
    companies.forEach((c: any) => {
      companyOrderMap[c.id] = sortedCompanyNames.indexOf(c.name);
    });

    const evaluationCountMap = new Map<string, number>();
    evaluations.forEach((e: any) => {
      const count = evaluationCountMap.get(e.position_id) || 0;
      evaluationCountMap.set(e.position_id, count + 1);
    });

    const positionsWithStatus = positions.map((position: any) => {
      const count = evaluationCountMap.get(position.id) || 0;
      return {
        ...position,
        companies: companyMap.get(position.company_id) || null,
        hasEvaluation: count > 0,
        evaluationCount: count,
      };
    });

    const sortedPositions = positionsWithStatus.sort((a: any, b: any) => {
      const aCompanyOrder = companyOrderMap[a.company_id] ?? 999;
      const bCompanyOrder = companyOrderMap[b.company_id] ?? 999;
      
      if (aCompanyOrder !== bCompanyOrder) {
        return aCompanyOrder - bCompanyOrder;
      }
      
      if (a.department !== b.department) {
        return (a.department || '').localeCompare(b.department || '', 'zh-CN');
      }
      
      const aLevel = getPositionLevel(a.name);
      const bLevel = getPositionLevel(b.name);
      
      if (aLevel !== bLevel) {
        return aLevel - bLevel;
      }
      
      return (a.name || '').localeCompare(b.name || '', 'zh-CN');
    });

    return NextResponse.json({ data: sortedPositions });
  } catch (error) {
    console.error('获取岗位列表失败:', error);
    return NextResponse.json({ error: '获取岗位列表失败' }, { status: 500 });
  }
}
