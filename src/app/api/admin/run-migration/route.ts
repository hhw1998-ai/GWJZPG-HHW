import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查数据库迁移状态
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 测试 submitted 字段是否存在
    const { error: testError } = await client
      .from('evaluations')
      .select('submitted')
      .limit(1);

    if (testError && testError.message.includes('column')) {
      return NextResponse.json({ 
        success: false, 
        message: 'submitted 字段不存在，需要执行迁移',
        migrationSql: `
-- 请在 Supabase 控制台执行以下 SQL：
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_evaluations_submitted ON evaluations(submitted);
        `
      });
    }

    // 测试 operation_logs 表是否存在
    const { error: logsTableError } = await client
      .from('operation_logs')
      .select('id')
      .limit(1);

    if (logsTableError && logsTableError.message.includes('relation')) {
      return NextResponse.json({ 
        success: false, 
        message: 'operation_logs 表不存在，需要执行迁移',
        migrationSql: `
-- 请在 Supabase 控制台执行以下 SQL：
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluator_name VARCHAR(255) NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  position_id UUID,
  position_name VARCHAR(255),
  operator_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS idx_operation_logs_evaluator ON operation_logs(evaluator_name);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);
        `
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: '数据库结构已就绪'
    });

  } catch (error) {
    console.error('迁移检查失败:', error);
    return NextResponse.json({ 
      success: false,
      error: '迁移检查失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
