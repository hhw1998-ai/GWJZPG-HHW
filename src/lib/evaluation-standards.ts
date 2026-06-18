// 评分标准配置 - 六因素十四维度
// 每个维度有不同的等级数量（4级或5级）和对应的千分制分值

export interface Level {
  level: number;
  score: number; // 千分制分值
  description: string;
}

export interface Dimension {
  id: string;
  name: string;
  fieldName: string;
  maxLevel: number; // 最大等级（4或5）
  maxScore: number; // 该维度的最大千分制分值
  levels: Level[];
}

export interface Factor {
  id: string;
  name: string;
  weight: number; // 权重百分比
  dimensions: Dimension[];
}

export interface EvaluationStandard {
  factors: Factor[];
  totalScore: number;
}

// 获取维度某等级的分数
export function getScoreByLevel(dimension: Dimension, level: number): number {
  const levelData = dimension.levels.find(l => l.level === level);
  return levelData?.score || 0;
}

// 六因素十四维度评价标准（根据Excel数据配置）
export const evaluationStandards: EvaluationStandard = {
  totalScore: 1000,
  factors: [
    {
      id: "impact",
      name: "影响（25%）",
      weight: 25,
      dimensions: [
        {
          id: "impactRange",
          name: "影响范围",
          fieldName: "impactRange",
          maxLevel: 5,
          maxScore: 100,
          levels: [
            { level: 1, score: 20, description: "一般不对他人产生影响" },
            { level: 2, score: 40, description: "对部门内部小组团队的目标达成产生影响" },
            { level: 3, score: 60, description: "对本部门整体目标的达成产生影响" },
            { level: 4, score: 80, description: "对其他部门整体目标的达成产生影响" },
            { level: 5, score: 100, description: "对集团整体目标的达成产生影响" }
          ]
        },
        {
          id: "impactLevel",
          name: "影响程度",
          fieldName: "impactLevel",
          maxLevel: 5,
          maxScore: 150,
          levels: [
            { level: 1, score: 30, description: "无任何风险" },
            { level: 2, score: 60, description: "仅有一些小风险，一旦发生问题，不会给集团造成多大损失和影响" },
            { level: 3, score: 90, description: "有一定的风险，一旦发生问题，会给集团造成能明显感觉到的损失和影响" },
            { level: 4, score: 120, description: "有较大的风险，一旦发生问题，会给集团造成严重损失和影响" },
            { level: 5, score: 150, description: "有极大风险，一旦发生问题，会给集团造成重大损失和影响" }
          ]
        }
      ]
    },
    {
      id: "problemSolving",
      name: "解决问题（20%）",
      weight: 20,
      dimensions: [
        {
          id: "problemComplexity",
          name: "问题复杂性",
          fieldName: "problemComplexity",
          maxLevel: 5,
          maxScore: 80,
          levels: [
            { level: 1, score: 10, description: "很少或不需要灵活处理问题" },
            { level: 2, score: 20, description: "需要处理工作中的一些简单问题" },
            { level: 3, score: 40, description: "需要灵活处理工作中的困难问题" },
            { level: 4, score: 60, description: "需要灵活处理工作中的复杂问题" },
            { level: 5, score: 80, description: "需要灵活处理工作中的超级复杂问题" }
          ]
        },
        {
          id: "problemSolvingReq",
          name: "解决问题要求",
          fieldName: "problemSolving",
          maxLevel: 4, // 只有4级
          maxScore: 120,
          levels: [
            { level: 1, score: 30, description: "工作为程序化、规范化的，只需遵守相关标准，无需开拓创新" },
            { level: 2, score: 60, description: "工作基本规范化，为解决工作中的问题，需要对已有的工具或解决方法进行日常性调整" },
            { level: 3, score: 90, description: "为了在一定程度上提升现有的工作成果，需要对已有的模式、方法或技术进行大幅度的改进" },
            { level: 4, score: 120, description: "为了显著提升工作成果，需要根据相关方法论，建立新的模式、方法或技术" }
          ]
        }
      ]
    },
    {
      id: "leadership",
      name: "领导力（15%）",
      weight: 15,
      dimensions: [
        {
          id: "leadershipRange",
          name: "领导范围",
          fieldName: "leadershipRange",
          maxLevel: 5,
          maxScore: 70,
          levels: [
            { level: 1, score: 20, description: "不领导管理任何人，只对自己负责" },
            { level: 2, score: 30, description: "领导管理一般人员" },
            { level: 3, score: 40, description: "领导管理岗位中有中层副职" },
            { level: 4, score: 50, description: "领导管理岗位中有中层正职" },
            { level: 5, score: 70, description: "领导管理岗位中有跨部门中层管理人员" }
          ]
        },
        {
          id: "leadershipStyle",
          name: "领导方式",
          fieldName: "leadershipStyle",
          maxLevel: 5,
          maxScore: 80,
          levels: [
            { level: 1, score: 10, description: "被督导。按照明确的流程和标准进行工作，工作结果受到严格的监督" },
            { level: 2, score: 20, description: "被限定。可以自主调节和改变当前工作流程、方法，工作进度会受到定期的监督" },
            { level: 3, score: 40, description: "督导。为他人诠释具体的工作任务、流程、方法，对他人的工作进行监督、指导" },
            { level: 4, score: 60, description: "管理。控制、分配他人的工作任务，对他人实施管理，为他人协调资源" },
            { level: 5, score: 80, description: "规划。诠释组织愿景，建立组织政策、方针，为他人制定和诠释长期工作方向及目标" }
          ]
        }
      ]
    },
    {
      id: "communication",
      name: "沟通（15%）",
      weight: 15,
      dimensions: [
        {
          id: "internalCommunication",
          name: "内部沟通协调",
          fieldName: "internalCommunication",
          maxLevel: 5,
          maxScore: 70,
          levels: [
            { level: 1, score: 10, description: "不需要与任何人进行协调，若有，也是偶尔与本部门的一般员工" },
            { level: 2, score: 20, description: "仅与本部门员工进行工作协调，偶尔与其他部门进行一些个人协调" },
            { level: 3, score: 30, description: "与本部门员工和其他部门/权属公司员工有密切的工作联系，协调不利会影响双方的工作" },
            { level: 4, score: 50, description: "几乎与集团所有一般员工都有密切的工作联系，协调不利对集团有一定的影响" },
            { level: 5, score: 70, description: "与各部门/权属公司的负责人有密切的联系，协调不利对整个集团有重大影响" }
          ]
        },
        {
          id: "externalCommunication",
          name: "外部沟通协调",
          fieldName: "externalCommunication",
          maxLevel: 4, // 只有4级
          maxScore: 80,
          levels: [
            { level: 1, score: 10, description: "不需要与外界保持密切联系，若有，也是偶尔与一般人员" },
            { level: 2, score: 30, description: "工作需要与外界某些固定部门、政府机构的一般人员发生较频繁的业务联系" },
            { level: 3, score: 50, description: "需要与厂商、政府机构、外商保持密切的联系，需要进行具体业务范围内的商议/谈判" },
            { level: 4, score: 80, description: "需要与上级或其他主管部门的负责人保持密切联系，联系涉及重大问题或重要决策" }
          ]
        }
      ]
    },
    {
      id: "knowledge",
      name: "知识经验（10%）",
      weight: 10,
      dimensions: [
        {
          id: "knowledgeScope",
          name: "知识经验范围",
          fieldName: "knowledgeScope",
          maxLevel: 5,
          maxScore: 50,
          levels: [
            { level: 1, score: 10, description: "掌握单一领域的简单知识或技能，工作不需要变换专业领域" },
            { level: 2, score: 20, description: "掌握相关领域的专业知识，工作偶尔需要变换专业领域" },
            { level: 3, score: 30, description: "熟练掌握多领域的专业知识，工作经常需要变换专业领域" },
            { level: 4, score: 40, description: "精通跨领域的专业知识，工作需要经常变换专业领域并解决复杂问题" },
            { level: 5, score: 50, description: "全面掌握多领域的综合知识或经验，工作要求频繁变换专业领域" }
          ]
        },
        {
          id: "knowledgeLevel",
          name: "知识经验级别",
          fieldName: "knowledgeLevel",
          maxLevel: 4, // 只有4级
          maxScore: 50,
          levels: [
            { level: 1, score: 10, description: "了解专业技术知识，经过1年以内的学习积累即可胜任" },
            { level: 2, score: 20, description: "掌握专业技术知识，经过1-3年的学习积累才能胜任" },
            { level: 3, score: 30, description: "熟练掌握专业技术知识，经过3-5年的学习积累才能胜任" },
            { level: 4, score: 50, description: "精通专业技术知识，经过5年以上的学习积累才能掌握" }
          ]
        }
      ]
    },
    {
      id: "jobNature",
      name: "岗位性质（15%）",
      weight: 15,
      dimensions: [
        {
          id: "environmentComfort",
          name: "环境舒适性",
          fieldName: "environmentComfort",
          maxLevel: 4, // 只有4级
          maxScore: 30,
          levels: [
            { level: 1, score: 5, description: "工作环境舒适，无不良感觉，办公环境为办公室环境" },
            { level: 2, score: 10, description: "工作环境较不舒适，30%-50%的时间为办公室以外的环境" },
            { level: 3, score: 20, description: "工作环境很不舒适，50%-70%的时间为办公室以外的环境" },
            { level: 4, score: 30, description: "工作环境极不舒适，70%以上的时间为办公室以外的环境" }
          ]
        },
        {
          id: "workBalance",
          name: "工作均衡性",
          fieldName: "workBalance",
          maxLevel: 5,
          maxScore: 30,
          levels: [
            { level: 1, score: 5, description: "一般没有忙闲不均的现象" },
            { level: 2, score: 10, description: "有时忙闲不均，但有规律性" },
            { level: 3, score: 15, description: "经常有忙闲不均的现象，且没有明显的规律性" },
            { level: 4, score: 20, description: "经常忙闲不均，没有明显的规律，且可能影响正常的作息时间" },
            { level: 5, score: 30, description: "经常忙闲不均，而且忙的时间持续很长，打破正常的作息时间" }
          ]
        },
        {
          id: "workTime",
          name: "工作时间特征",
          fieldName: "workTime",
          maxLevel: 5,
          maxScore: 40,
          levels: [
            { level: 1, score: 5, description: "按正常时间上下班" },
            { level: 2, score: 10, description: "基本按正常时间上下班，偶尔需要加班" },
            { level: 3, score: 20, description: "按正常时间上下班，经常需要加班" },
            { level: 4, score: 30, description: "上下班时间按照工作具体情况而定，但有一定规律，自己可以控制、安排" },
            { level: 5, score: 40, description: "上下班时间根据工作具体情况而定，且无规律可循，自己无法控制、安排" }
          ]
        },
        {
          id: "replaceability",
          name: "可替代性",
          fieldName: "replaceability",
          maxLevel: 4, // 只有4级
          maxScore: 50,
          levels: [
            { level: 1, score: 10, description: "辅助性人才即可胜任，在人才市场能轻松招到，几乎不需要耗费时间和成本" },
            { level: 2, score: 20, description: "通用性人才方可胜任，外部有很多符合要求的候选人，获取需耗费一定必要的时间，但成本低" },
            { level: 3, score: 30, description: "专家性人才可胜任，具有很强的专业性，可在外部获得，但到位时间较长，甚至需要支出必要的成本" },
            { level: 4, score: 50, description: "核心性人才可胜任，专业性或技术性特强，很难在外部市场招到合适的人员，人才获取周期长，成本高" }
          ]
        }
      ]
    }
  ]
};

// 获取所有维度的列表（方便遍历）
export function getAllDimensions(): Dimension[] {
  const dimensions: Dimension[] = [];
  evaluationStandards.factors.forEach(factor => {
    factor.dimensions.forEach(dimension => {
      dimensions.push(dimension);
    });
  });
  return dimensions;
}

// 根据fieldName获取维度信息
export function getDimensionByFieldName(fieldName: string): Dimension | undefined {
  for (const factor of evaluationStandards.factors) {
    const dimension = factor.dimensions.find(d => d.fieldName === fieldName);
    if (dimension) return dimension;
  }
  return undefined;
}

// 计算岗位总分（根据各维度等级）
export function calculateTotalScore(scores: Record<string, number>): number {
  let total = 0;
  const dimensions = getAllDimensions();
  
  dimensions.forEach(dimension => {
    const level = scores[dimension.fieldName];
    if (level && level > 0) {
      const score = getScoreByLevel(dimension, level);
      total += score;
    }
  });
  
  return total;
}
