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

// 定义岗位职级权重
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
    (companies || []).forEach((c: any) => {
      const orderIndex = COMPANY_ORDER.indexOf(c.name);
      companyOrderMap[c.id] = orderIndex >= 0 ? orderIndex : 999;
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
