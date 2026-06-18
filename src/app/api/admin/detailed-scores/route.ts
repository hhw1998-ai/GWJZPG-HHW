import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getPositionLevel } from '@/lib/position-utils';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 使用流式查询获取所有评估记录（Supabase限制单次最多1000行）
    let allEvaluations: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: pageData, error } = await client
        .from('evaluations')
        .select(`id, total_score, impact_range, impact_level, problem_complexity, problem_solving,
          leadership_range, leadership_style, internal_communication, external_communication,
          knowledge_scope, knowledge_level, environment_comfort, work_balance, work_time,
          replaceability, created_at, position_id, evaluator_id`)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      if (!pageData || pageData.length === 0) break;
      allEvaluations = allEvaluations.concat(pageData);
      if (pageData.length < pageSize) break;
      page++;
    }

    const { data: evaluators } = await client.from('evaluators').select('id, name');
    const { data: positions } = await client.from('positions').select('id, name, department, company_id');
    const { data: companies } = await client.from('companies').select('id, name');

    const evaluatorMap = new Map(evaluators?.map(e => [e.id, e.name]) || []);
    const positionMap = new Map(positions?.map(p => [p.id, p]) || []);
    const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);
    
    const companyOrderMap: Record<string, number> = {};
    const sortedCompanyNames = (companies || [])
      .map((c: any) => c.name)
      .sort((a: string, b: string) => a.localeCompare(b, 'zh-CN'));
    (companies || []).forEach((c: any) => {
      companyOrderMap[c.id] = sortedCompanyNames.indexOf(c.name);
    });

    const dimensionNames: Record<string, string> = {
      impact_range: '影响范围', impact_level: '影响程度',
      problem_complexity: '问题复杂性', problem_solving: '问题解决',
      leadership_range: '领导范围', leadership_style: '领导方式',
      internal_communication: '内部沟通', external_communication: '外部沟通',
      knowledge_scope: '知识范围', knowledge_level: '知识水平',
      environment_comfort: '环境舒适度', work_balance: '工作均衡性',
      work_time: '工作时间', replaceability: '可替代性'
    };

    let detailedData = allEvaluations?.map(e => {
      const position = positionMap.get(e.position_id);
      return {
        id: e.id,
        positionId: e.position_id,
        positionName: position?.name || '',
        department: position?.department || '',
        companyName: position ? companyMap.get(position.company_id) || '' : '',
        companyOrder: position ? (companyOrderMap[position.company_id] ?? 999) : 999,
        positionLevel: getPositionLevel(position?.name || ''),
        evaluatorId: e.evaluator_id,
        evaluatorName: evaluatorMap.get(e.evaluator_id) || '未知',
        totalScore: e.total_score,
        scores: {
          impact_range: e.impact_range, impact_level: e.impact_level,
          problem_complexity: e.problem_complexity, problem_solving: e.problem_solving,
          leadership_range: e.leadership_range, leadership_style: e.leadership_style,
          internal_communication: e.internal_communication, external_communication: e.external_communication,
          knowledge_scope: e.knowledge_scope, knowledge_level: e.knowledge_level,
          environment_comfort: e.environment_comfort, work_balance: e.work_balance,
          work_time: e.work_time, replaceability: e.replaceability,
        },
        dimensionNames,
        createdAt: e.created_at,
      };
    }) || [];

    // 按公司顺序、部门、岗位职级排序
    detailedData.sort((a, b) => {
      if (a.companyOrder !== b.companyOrder) return a.companyOrder - b.companyOrder;
      if (a.department !== b.department) return (a.department || '').localeCompare(b.department || '', 'zh-CN');
      if (a.positionLevel !== b.positionLevel) return a.positionLevel - b.positionLevel;
      return (a.positionName || '').localeCompare(b.positionName || '', 'zh-CN');
    });

    return NextResponse.json({ data: detailedData, dimensionNames });
  } catch (error) {
    console.error('获取详细评分数据失败:', error);
    return NextResponse.json({ error: '获取详细评分数据失败' }, { status: 500 });
  }
}
