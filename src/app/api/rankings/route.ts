import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 定义公司排序顺序
const COMPANY_ORDER = [
  '集团',
  '海内外贸易业务中心',
  '工程建设业务中心',
  '物业服务业务中心',
  '文化旅游业务中心',
  '同建建筑',
  '高唐水务',
];

// 定义岗位职级权重（数字越小，职级越高）
const POSITION_LEVEL: Record<string, number> = {
  '经理': 1, '部长': 1, '主任': 1,
  '副经理': 2, '副部长': 2, '副主任': 2,
  '主管': 3, '项目负责人': 3, '业务经理': 3, '销售经理': 3,
  '海外业务经理': 3, '青岛公司经理': 3, '青岛公司销售经理': 3,
  '经理（研学）': 2, '顾问': 3, '技术负责人': 3,
  '文秘岗': 10, '行政管理岗': 10, '后勤管理岗': 10,
  '会计岗': 10, '出纳岗': 10, '内控岗': 10, '法务岗': 10,
  '人力资源岗': 10, '党群管理岗': 10, '文化宣传岗': 10, '纪检监察岗': 10,
  '现场管理岗': 10, '内业管理岗': 10, '投资管理岗': 10, '融资管理岗': 10,
  '安环管理岗': 10, '运营管理岗': 10, '资产管理岗': 10,
  '单证员': 10, '跟单员': 10, '青岛公司综合岗': 10,
  '招投标岗': 10, '采购岗': 10, '成本管理岗': 10,
  '综合管理岗': 10, '综合岗': 10, '质量技术岗': 10,
  '工程管理岗': 10, '工程内业岗': 10, '宣传岗': 10, '运营岗': 10,
};

function getPositionLevel(name: string): number {
  if (POSITION_LEVEL[name] !== undefined) return POSITION_LEVEL[name];
  if (name.includes('经理') || name.includes('部长') || name.includes('主任')) {
    return name.includes('副') ? 2 : 1;
  }
  if (name.includes('主管')) return 3;
  return 99;
}

export async function GET() {
  try {
    const client = getSupabaseClient();

    const { data: positions } = await client.from('positions').select('*');
    if (!positions) return NextResponse.json({ data: [] });

    const { data: companies } = await client.from('companies').select('*');
    const companyMap = new Map((companies || []).map((c: any) => [c.id, c]));
    
    const companyOrderMap: Record<string, number> = {};
    (companies || []).forEach((c: any) => {
      const orderIndex = COMPANY_ORDER.indexOf(c.name);
      companyOrderMap[c.id] = orderIndex >= 0 ? orderIndex : 999;
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
