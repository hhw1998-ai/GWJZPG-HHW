-- 添加 submitted 字段到 evaluations 表
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT false;

-- 为 submitted 字段创建索引，方便查询
CREATE INDEX IF NOT EXISTS idx_evaluations_submitted ON evaluations(submitted);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluator_name VARCHAR(255) NOT NULL,
  operation_type VARCHAR(50) NOT NULL, -- 'unlock', 'modify'
  position_id UUID,
  position_name VARCHAR(255),
  operator_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 为操作日志表创建索引
CREATE INDEX IF NOT EXISTS idx_operation_logs_evaluator ON operation_logs(evaluator_name);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);

-- 添加注释
COMMENT ON COLUMN evaluations.submitted IS '是否已正式提交，提交后不可修改';
COMMENT ON TABLE operation_logs IS '记录解锁和修改操作的历史';
