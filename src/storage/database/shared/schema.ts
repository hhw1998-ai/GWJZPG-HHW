import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  serial,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 保留系统表定义
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 公司/部门表
export const companies = pgTable(
  "companies",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index("companies_name_idx").on(table.name),
  ]
);

// 岗位表
export const positions = pgTable(
  "positions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    companyId: varchar("company_id", { length: 36 }).notNull(),
    department: varchar("department", { length: 255 }),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index("positions_company_idx").on(table.companyId),
    index("positions_name_idx").on(table.name),
  ]
);

// 评估人表
export const evaluators = pgTable(
  "evaluators",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index("evaluators_name_idx").on(table.name),
  ]
);

// 评分表
export const evaluations = pgTable(
  "evaluations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    positionId: varchar("position_id", { length: 36 }).notNull(),
    evaluatorId: varchar("evaluator_id", { length: 36 }).notNull(),

    // 六因素十四维度的评分（1-5分）
    // 因素1：影响
    impactRange: integer("impact_range").notNull(), // 影响范围
    impactLevel: integer("impact_level").notNull(), // 影响程度

    // 因素2：解决问题
    problemComplexity: integer("problem_complexity").notNull(), // 问题复杂性
    problemSolving: integer("problem_solving").notNull(), // 解决问题要求

    // 因素3：领导力
    leadershipRange: integer("leadership_range").notNull(), // 领导范围
    leadershipStyle: integer("leadership_style").notNull(), // 领导方式

    // 因素4：沟通
    internalCommunication: integer("internal_communication").notNull(), // 内部沟通协调
    externalCommunication: integer("external_communication").notNull(), // 外部沟通协调

    // 因素5：知识经验
    knowledgeScope: integer("knowledge_scope").notNull(), // 知识经验范围
    knowledgeLevel: integer("knowledge_level").notNull(), // 知识经验级别

    // 因素6：岗位性质
    environmentComfort: integer("environment_comfort").notNull(), // 环境舒适性
    workBalance: integer("work_balance").notNull(), // 工作均衡性
    workTime: integer("work_time").notNull(), // 工作时间特征
    replaceability: integer("replaceability").notNull(), // 可替代性

    // 总分（计算字段，不对外显示）
    totalScore: integer("total_score").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index("evaluations_position_idx").on(table.positionId),
    index("evaluations_evaluator_idx").on(table.evaluatorId),
    index("evaluations_total_idx").on(table.totalScore),
  ]
);

// Zod schemas
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

export const insertCompanySchema = createCoercedInsertSchema(companies).pick({
  name: true,
});

export const insertPositionSchema = createCoercedInsertSchema(positions).pick({
  companyId: true,
  department: true,
  name: true,
});

export const insertEvaluatorSchema = createCoercedInsertSchema(evaluators).pick({
  name: true,
});

export const insertEvaluationSchema = createCoercedInsertSchema(evaluations).pick({
  positionId: true,
  evaluatorId: true,
  impactRange: true,
  impactLevel: true,
  problemComplexity: true,
  problemSolving: true,
  leadershipRange: true,
  leadershipStyle: true,
  internalCommunication: true,
  externalCommunication: true,
  knowledgeScope: true,
  knowledgeLevel: true,
  environmentComfort: true,
  workBalance: true,
  workTime: true,
  replaceability: true,
  totalScore: true,
});

// TypeScript types
export type Company = typeof companies.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Evaluator = typeof evaluators.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
