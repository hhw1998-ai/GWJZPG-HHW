'use client';

/**
 * HHW Logo — 立体几何风格
 * 使用纯 CSS 3D 变换实现立体效果，无需外部图片
 */
export function Logo({ size = 40 }: { size?: number }) {
  const scale = size / 40;

  return (
    <div
      className="relative inline-flex select-none items-center"
      style={{ width: size * 2.4, height: size }}
    >
      {/* 3D 立方体 Logo */}
      <div
        className="relative"
        style={{
          width: size,
          height: size,
          perspective: `${size * 3}px`,
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(-20deg) rotateY(-30deg) scale(${scale})`,
          }}
        >
          {/* 顶面 */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #C8956C 0%, #A67B52 100%)',
              transform: 'rotateX(90deg) translateZ(20px)',
              borderRadius: 6,
            }}
          />
          {/* 前面 */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #3D3630 0%, #2C2825 100%)',
              transform: 'translateZ(20px)',
              borderRadius: 6,
              boxShadow: '0 2px 12px rgba(61,54,48,0.3)',
            }}
          >
            <span
              className="font-mono font-bold text-white select-none"
              style={{ fontSize: 18, letterSpacing: '-0.5px' }}
            >
              HHW
            </span>
          </div>
          {/* 右面 */}
          <div
            className="absolute inset-0"
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #4A423A 0%, #3D3630 100%)',
              transform: 'rotateY(90deg) translateZ(20px)',
              borderRadius: 6,
            }}
          />
        </div>
      </div>

      {/* 品牌文字 */}
      <div className="ml-3 flex flex-col justify-center" style={{ marginLeft: size * 0.3 }}>
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
export function LogoIcon({ size = 32 }: { size?: number }) {
  const scale = size / 32;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: `${size * 3}px`,
      }}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(-20deg) rotateY(-30deg) scale(${scale})`,
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #C8956C 0%, #A67B52 100%)',
            transform: 'rotateX(90deg) translateZ(16px)',
            borderRadius: 5,
          }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #3D3630 0%, #2C2825 100%)',
            transform: 'translateZ(16px)',
            borderRadius: 5,
            boxShadow: '0 1px 8px rgba(61,54,48,0.3)',
          }}
        >
          <span className="font-mono font-bold text-white" style={{ fontSize: 14, letterSpacing: '-0.5px' }}>
            HHW
          </span>
        </div>
        <div
          className="absolute inset-0"
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #4A423A 0%, #3D3630 100%)',
            transform: 'rotateY(90deg) translateZ(16px)',
            borderRadius: 5,
          }}
        />
      </div>
    </div>
  );
}
