import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '岗位价值评估 — 通用型岗位价值评估工作台',
    template: '%s | 岗位价值评估',
  },
  description:
    '基于国际通用的六因素十四维度评估模型，为企业提供从数据导入、在线评分到排名分析的一站式岗位价值评估解决方案。',
  keywords: [
    '岗位价值评估',
    '岗位评估',
    '职位评估',
    'HR工具',
    '人力资源管理',
    '薪酬体系',
    '六因素十四维度',
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://fonts.googleapis.cn" />
        <link rel="preconnect" href="https://fonts.gstatic.cn" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.cn/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
