'use client';

/**
 * Logo — 用于导航栏的简洁品牌标识
 * 3D 立方体已移至 FloatingLogo 组件（右下角悬浮可拖拽）
 */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="inline-flex select-none items-center gap-2.5">
      {/* 品牌文字 */}
      <div className="flex flex-col justify-center">
        <span
          className="font-serif font-semibold leading-tight tracking-tight text-[#3D3630]"
          style={{ fontSize: size * 0.42 }}
        >
          岗位价值评估
        </span>
        <span
          className="text-[#C8956C] leading-tight"
          style={{ fontSize: size * 0.26 }}
        >
          Job Value Assessment
        </span>
      </div>
    </div>
  );
}

/**
 * 小尺寸 Logo（仅图标，用于 favicon 等场景）
 */
export function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-lg"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #3D3630 0%, #2C2825 100%)',
      }}
    >
      <span
        className="font-mono font-bold text-white select-none"
        style={{ fontSize: size * 0.45, letterSpacing: '-0.5px' }}
      >
        HHW
      </span>
    </div>
  );
}
