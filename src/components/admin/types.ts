export interface RankingItem {
  positionId: string;
  companyName: string;
  department: string;
  positionName: string;
  averageScore: number;
  evaluationCount: number;
  evaluators: string[];
}

export interface PositionDetail extends RankingItem {
  expanded: boolean;
  detailedScores: DetailedScore[];
}

export interface DetailedScore {
  id: string;
  evaluatorName: string;
  scores: Record<string, number>;
  totalScore: number;
}

export interface SubmittedEvaluator {
  name: string;
  count: number;
}

export interface OperationLog {
  id: string;
  evaluator_name: string;
  operation_type: string;
  position_name: string | null;
  operator_name: string;
  created_at: string;
}

export interface UsageLog {
  id: string;
  visitor_name: string | null;
  action: string;
  page: string | null;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface PreviewResult {
  success: boolean;
  message: string;
  detectedCompanies: string[];
  totalPositions: number;
  validPositions: number;
  invalidPositions: number;
  positions: Array<{
    companyName: string;
    department: string;
    positionName: string;
  }>;
  errors: Array<{
    rowIndex: number;
    companyName: string;
    errorType: string;
    message: string;
  }>;
}

export interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  skipped: number;
  errors: Array<{
    rowIndex: number;
    companyName: string;
    errorType: string;
    message: string;
  }>;
}
