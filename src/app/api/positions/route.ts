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
  // 高层管理
  '经理': 1,
  '部长': 1,
  '主任': 1,
  // 中层管理
  '副经理': 2,
  '副部长': 2,
  '副主任': 2,
  // 主管级
  '主管': 3,
  '项目负责人': 3,
  '业务经理': 3,
  '销售经理': 3,
  '海外业务经理': 3,
  '青岛公司经理': 3,
  '青岛公司销售经理': 3,
  // 专员级
  '经理（研学）': 2,
  '顾问': 3,
  '技术负责人': 3,
  // 普通岗位
  '文秘岗': 10,
  '行政管理岗': 10,
  '后勤管理岗': 10,
  '会计岗': 10,
  '出纳岗': 10,
  '内控岗': 10,
  '法务岗': 10,
  '人力资源岗': 10,
  '党群管理岗': 10,
  '文化宣传岗': 10,
  '纪检监察岗': 10,
  '现场管理岗': 10,
  '内业管理岗': 10,
  '投资管理岗': 10,
  '融资管理岗': 10,
  '安环管理岗': 10,
  '运营管理岗': 10,
  '资产管理岗': 10,
  '单证员': 10,
  '跟单员': 10,
  '青岛公司综合岗': 10,
  '招投标岗': 10,
  '采购岗': 10,
  '成本管理岗': 10,
  '综合管理岗': 10,
  '综合岗': 10,
  '质量技术岗': 10,
  '工程管理岗': 10,
  '工程内业岗': 10,
  '宣传岗': 10,
  '运营岗': 10,
};

// 获取岗位职级权重
function getPositionLevel(name: string): number {
  // 精确匹配
  if (POSITION_LEVEL[name] !== undefined) {
    return POSITION_LEVEL[name];
  }
  // 模糊匹配：岗位名包含"经理"、"部长"、"主任"等关键词
  if (name.includes('经理') || name.includes('部长') || name.includes('主任')) {
    if (name.includes('副')) {
      return 2; // 副经理、副部长、副主任
    }
    return 1; // 经理、部长、主任
  }
  if (name.includes('主管')) {
    return 3;
  }
  // 默认普通岗位
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

    // 创建公司排序索引映射
    const companyOrderMap: Record<string, number> = {};
    companies.forEach((c: any) => {
      const orderIndex = COMPANY_ORDER.indexOf(c.name);
      companyOrderMap[c.id] = orderIndex >= 0 ? orderIndex : 999;
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
