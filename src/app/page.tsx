'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Upload,
  Edit3,
  BarChart3,
  Shield,
  FileSpreadsheet,
  Users,
  TrendingUp,
  ChevronRight,
  Star,
  Sparkles,
  Zap,
  Layers,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  const router = useRouter();
  const [evaluatorName, setEvaluatorName] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleStartEvaluation = () => {
    if (!evaluatorName.trim()) return;
    setIsStarting(true);
    localStorage.setItem('evaluator_name', evaluatorName.trim());

    // 记录使用日志
    fetch('/api/usage-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_name: evaluatorName.trim(),
        action: '开始评估',
        page: '/',
        detail: `评估人: ${evaluatorName.trim()}`,
      }),
    }).catch(() => {});

    router.push('/evaluation');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* ====== Navbar ====== */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[#E8E3DD] bg-[#FAF8F5]/95 shadow-sm backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-0 no-underline">
            <Logo size={36} />
          </Link>
          <div className="flex items-center gap-5">
            <a
              href="#features"
              className="text-sm font-medium text-[#8B8580] transition-colors hover:text-[#3D3630]"
            >
              功能
            </a>
            <a
              href="#workflow"
              className="text-sm font-medium text-[#8B8580] transition-colors hover:text-[#3D3630]"
            >
              流程
            </a>
            <a
              href="#model"
              className="text-sm font-medium text-[#8B8580] transition-colors hover:text-[#3D3630]"
            >
              模型
            </a>
            <Link
              href="/admin"
              className="group flex items-center gap-1.5 rounded-lg border border-[#E8E3DD] bg-white px-4 py-2 text-sm font-medium text-[#6B6560] transition-all hover:border-[#C8956C] hover:text-[#C8956C] hover:shadow-sm"
            >
              管理后台
              <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section ref={heroRef} className="relative overflow-hidden px-6 pb-28 pt-28">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 top-10 h-[700px] w-[700px] rounded-full bg-[#F0EDE8] opacity-50 blur-3xl" />
          <div className="absolute -right-32 bottom-10 h-[500px] w-[500px] rounded-full bg-[#F5F1EC] opacity-40 blur-3xl" />
          {/* 装饰网格 */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(#3D3630 1px, transparent 1px), linear-gradient(90deg, #3D3630 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          {/* 标签 */}
          <div
            className="mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full border border-[#E8E3DD] bg-white/80 px-5 py-2 shadow-sm backdrop-blur-sm"
            style={{ animationDelay: '0ms' }}
          >
            <Sparkles className="h-4 w-4 text-[#C8956C]" />
            <span className="text-xs font-semibold tracking-wide text-[#8B8580] uppercase">
              专业岗位价值评估工具
            </span>
            <span className="h-3 w-px bg-[#E8E3DD]" />
            <span className="text-xs font-medium text-[#C8956C]">by HHW</span>
          </div>

          <h1
            className="mb-6 animate-fade-in font-serif text-5xl leading-[1.15] tracking-tight text-[#3D3630] md:text-6xl lg:text-7xl"
            style={{ animationDelay: '100ms' }}
          >
            让每一个岗位的
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-[#C8956C]">价值</span>
              <span className="absolute bottom-1 left-0 -z-0 h-3 w-full rounded-sm bg-[#C8956C]/15" />
            </span>
            都被精准衡量
          </h1>

          <p
            className="mx-auto mb-12 max-w-xl animate-fade-in text-lg leading-relaxed text-[#8B8580]"
            style={{ animationDelay: '200ms' }}
          >
            基于国际通用的六因素十四维度评估模型，为企业提供从数据导入、在线评分到排名分析的一站式解决方案。
          </p>

          {/* 快速开始 */}
          <div
            className="mx-auto mb-5 flex max-w-md animate-fade-in items-center gap-3 rounded-2xl border border-[#E8E3DD] bg-white p-2 shadow-lg shadow-[#3D3630]/5 transition-shadow hover:shadow-xl hover:shadow-[#3D3630]/8"
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F1EC]">
              <Zap className="h-5 w-5 text-[#C8956C]" />
            </div>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartEvaluation()}
              placeholder="输入您的姓名开始评估"
              className="flex-1 border-0 bg-transparent py-2 text-[15px] text-[#2C2825] placeholder-[#D4CDC5] outline-none"
            />
            <button
              onClick={handleStartEvaluation}
              disabled={!evaluatorName.trim() || isStarting}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#3D3630] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2C2825] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isStarting ? '进入中...' : '开始评估'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="animate-fade-in text-xs text-[#D4CDC5]" style={{ animationDelay: '400ms' }}>
            输入姓名即可开始，无需注册
          </p>
        </div>
      </section>

      {/* ====== 数据亮点 ====== */}
      <section className="border-y border-[#E8E3DD] bg-white px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-[#E8E3DD]">
          {[
            { value: '6', unit: '大因素', desc: '全面覆盖岗位价值维度' },
            { value: '14', unit: '个维度', desc: '精细量化每个岗位' },
            { value: '1000', unit: '分制', desc: '国际通用评分标准' },
          ].map((item, i) => (
            <div
              key={item.desc}
              className="flex flex-col items-center gap-1.5 px-8"
              style={{ animationDelay: `${500 + i * 100}ms` }}
            >
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold tracking-tight text-[#3D3630]">
                  {item.value}
                </span>
                <span className="text-sm font-semibold text-[#C8956C]">{item.unit}</span>
              </div>
              <span className="text-xs text-[#8B8580]">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 功能介绍 ====== */}
      <section id="features" className="px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block font-mono text-xs font-semibold tracking-widest text-[#C8956C] uppercase">
              Features
            </span>
            <h2 className="mb-4 font-serif text-4xl font-semibold tracking-tight text-[#3D3630]">
              一站式评估工作台
            </h2>
            <p className="text-[#8B8580]">覆盖评估全流程，从数据准备到结果分析，每一步都精准高效</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Upload className="h-5 w-5" />,
                title: 'Excel 批量导入',
                desc: '下载标准模板，填写公司岗位信息后一键上传。系统自动校验格式，预览确认后入库。',
              },
              {
                icon: <Edit3 className="h-5 w-5" />,
                title: '矩阵式在线评分',
                desc: '岗位 × 维度矩阵布局，分页浏览、自动保存、断点续评，评分体验流畅高效。',
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: '智能排名分析',
                desc: '多维度加权排序，自动生成岗位排名总表，支持按公司、部门筛选对比。',
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: '提交锁定机制',
                desc: '评分提交后自动锁定防篡改，管理员可一键解锁，操作全程留痕可追溯。',
              },
              {
                icon: <FileSpreadsheet className="h-5 w-5" />,
                title: '结果一键导出',
                desc: '评估结果导出 Excel，包含排名总表与详细评分矩阵，便于存档和汇报。',
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: '多评估人协作',
                desc: '支持多人同时在线评分互不干扰，管理员实时监控评估进度。',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-[#E8E3DD] bg-white p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#C8956C]/25 hover:shadow-xl hover:shadow-[#3D3630]/5"
              >
                {/* 卡片顶部装饰线 */}
                <div className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-[#C8956C] to-transparent transition-transform duration-500 group-hover:scale-x-100" />

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F1EC] text-[#C8956C] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C8956C] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#C8956C]/25">
                  {feature.icon}
                </div>
                <h3 className="mb-2.5 font-serif text-lg font-semibold text-[#3D3630]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#8B8580]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 使用流程 ====== */}
      <section id="workflow" className="border-t border-[#E8E3DD] bg-white px-6 py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block font-mono text-xs font-semibold tracking-widest text-[#C8956C] uppercase">
              Workflow
            </span>
            <h2 className="mb-4 font-serif text-4xl font-semibold tracking-tight text-[#3D3630]">
              三步完成评估
            </h2>
            <p className="text-[#8B8580]">简单高效，从零到结果只需三步</p>
          </div>

          <div className="relative">
            {/* 连接线 */}
            <div className="absolute left-[27px] top-0 hidden h-full w-px bg-gradient-to-b from-[#C8956C] via-[#E8E3DD] to-transparent md:block" />

            {[
              {
                step: '01',
                title: '导入数据',
                desc: '下载标准 Excel 模板，填写公司、岗位信息后上传。系统自动校验并预览，确认无误后一键导入。',
                icon: <Upload className="h-5 w-5" />,
              },
              {
                step: '02',
                title: '在线评分',
                desc: '评估人输入姓名进入评分页面，在矩阵式界面中为每个岗位的 14 个维度打分。支持自动保存和断点续评。',
                icon: <Edit3 className="h-5 w-5" />,
              },
              {
                step: '03',
                title: '查看结果',
                desc: '管理员在后台查看排名统计和详细评分矩阵。支持一键导出 Excel 报告，便于存档和决策分析。',
                icon: <TrendingUp className="h-5 w-5" />,
              },
            ].map((item, i) => (
              <div key={item.step} className="relative flex gap-8 pb-14 last:pb-0">
                <div className="relative z-10 flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-[#3D3630] font-mono text-sm font-bold text-white shadow-lg shadow-[#3D3630]/15 ring-4 ring-[#FAF8F5]">
                  {item.step}
                </div>
                <div className="min-w-0 pt-1.5">
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="text-[#C8956C]">{item.icon}</span>
                    <h3 className="font-serif text-xl font-semibold text-[#3D3630]">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[#8B8580]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 评估模型预览 ====== */}
      <section id="model" className="px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block font-mono text-xs font-semibold tracking-widest text-[#C8956C] uppercase">
              Model
            </span>
            <h2 className="mb-4 font-serif text-4xl font-semibold tracking-tight text-[#3D3630]">
              六因素十四维度评估模型
            </h2>
            <p className="text-[#8B8580]">科学、系统、全面的岗位价值评估体系</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                factor: '影响因素',
                weight: '250分',
                dims: '影响范围、影响程度',
                borderColor: 'border-l-[#C8956C]',
              },
              {
                factor: '解决问题',
                weight: '200分',
                dims: '问题复杂度、解决能力',
                borderColor: 'border-l-[#C8956C]',
              },
              {
                factor: '领导力',
                weight: '150分',
                dims: '领导范围、领导方式',
                borderColor: 'border-l-[#C8956C]',
              },
              {
                factor: '沟通',
                weight: '150分',
                dims: '内部沟通、外部沟通',
                borderColor: 'border-l-[#C8956C]',
              },
              {
                factor: '知识经验',
                weight: '100分',
                dims: '知识范围、知识深度',
                borderColor: 'border-l-[#C8956C]',
              },
              {
                factor: '环境条件',
                weight: '150分',
                dims: '舒适度、工作均衡、工作时间、可替代性',
                borderColor: 'border-l-[#C8956C]',
              },
            ].map((item) => (
              <div
                key={item.factor}
                className={`group rounded-xl border border-[#E8E3DD] border-l-[3px] bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#3D3630]/5 ${item.borderColor}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-serif text-base font-semibold text-[#3D3630]">
                    {item.factor}
                  </h4>
                  <span className="font-mono text-sm font-bold text-[#C8956C]">{item.weight}</span>
                </div>
                <p className="text-xs text-[#8B8580]">{item.dims}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="relative overflow-hidden border-t border-[#E8E3DD] bg-[#3D3630] px-6 py-28">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#C8956C]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[#C8956C]/8 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="mb-4 font-serif text-4xl font-semibold tracking-tight text-white">
            准备好开始评估了吗？
          </h2>
          <p className="mb-10 text-[#D4CDC5]">
            无需注册，输入姓名即可开始。让数据为岗位价值说话。
          </p>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-[#6B6560] bg-[#2C2825] p-2 shadow-lg">
              <input
                type="text"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartEvaluation()}
                placeholder="输入您的姓名"
                className="w-48 border-0 bg-transparent px-3 py-2 text-white placeholder-[#8B8580] outline-none"
              />
              <button
                onClick={handleStartEvaluation}
                disabled={!evaluatorName.trim() || isStarting}
                className="flex items-center gap-2 rounded-xl bg-[#C8956C] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#B07D58] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                开始评估
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Footer ====== */}
      <footer className="border-t border-[#E8E3DD] bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            {/* 左侧品牌 */}
            <div className="flex flex-col items-center gap-3 md:items-start">
              <Logo size={32} />
              <p className="max-w-xs text-center text-xs leading-relaxed text-[#8B8580] md:text-left">
                基于国际通用六因素十四维度模型的岗位价值评估工作台，为企业提供专业、精准、高效的评估解决方案。
              </p>
            </div>

            {/* 中间链接 */}
            <div className="flex items-center gap-8 text-sm">
              <a href="#features" className="text-[#8B8580] transition-colors hover:text-[#3D3630]">
                功能介绍
              </a>
              <a href="#workflow" className="text-[#8B8580] transition-colors hover:text-[#3D3630]">
                使用流程
              </a>
              <Link href="/admin" className="text-[#8B8580] transition-colors hover:text-[#3D3630]">
                管理后台
              </Link>
            </div>

            {/* 右侧开发者信息 */}
            <div className="flex flex-col items-center gap-2 md:items-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#6B6560]">黄宏伟</span>
                <span className="h-3 w-px bg-[#E8E3DD]" />
                <span className="text-xs text-[#8B8580]">和君咨询 · 咨询顾问</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8B8580]">
                <span className="font-mono text-[#C8956C]">HHWSDQC</span>
                <span className="text-[#D4CDC5]">（微信）</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#F0EDE8] pt-6 text-center">
            <p className="text-xs text-[#D4CDC5]">
              本网页为作者开源，如需商用请告知 · 由黄宏伟设计开发
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
