'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 可拖拽悬浮 3D 立方体 Logo
 * 6 面完整封闭，每面均有文字，精致光影
 */
export function FloatingLogo() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const [rotateX, setRotateX] = useState(-25);
  const [rotateY, setRotateY] = useState(0);
  const logoRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const SIZE = 72;

  // 初始化位置：右下角
  useEffect(() => {
    const updateInitialPos = () => {
      setPosition({
        x: window.innerWidth - SIZE - 32,
        y: window.innerHeight - SIZE - 32,
      });
      setInitialized(true);
    };
    updateInitialPos();
    window.addEventListener('resize', updateInitialPos);
    return () => window.removeEventListener('resize', updateInitialPos);
  }, []);

  // 自动旋转
  useEffect(() => {
    if (isDragging) return;
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      setRotateX((prev) => (prev + delta * 0.008) % 360);
      setRotateY((prev) => (prev + delta * 0.025) % 360);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isDragging]);

  // 拖拽事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [position]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - SIZE, e.clientX - dragStart.x)),
        y: Math.max(0, Math.min(window.innerHeight - SIZE, e.clientY - dragStart.y)),
      });
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - SIZE, touch.clientX - dragStart.x)),
        y: Math.max(0, Math.min(window.innerHeight - SIZE, touch.clientY - dragStart.y)),
      });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, dragStart]);

  if (!initialized) return null;

  const half = SIZE / 2;

  // 面定义：面名、背景渐变、文字、文字颜色
  const faces = [
    {
      name: 'front',
      transform: `translateZ(${half}px)`,
      bg: 'linear-gradient(160deg, #3D3630 0%, #2C2520 100%)',
      text: '黄宏伟',
      textColor: '#C8956C',
      fontSize: 16,
      fontWeight: 700,
    },
    {
      name: 'back',
      transform: `rotateY(180deg) translateZ(${half}px)`,
      bg: 'linear-gradient(160deg, #2C2520 0%, #3D3630 100%)',
      text: 'HHW',
      textColor: '#C8956C',
      fontSize: 20,
      fontWeight: 700,
    },
    {
      name: 'right',
      transform: `rotateY(90deg) translateZ(${half}px)`,
      bg: 'linear-gradient(160deg, #4A4038 0%, #3D3630 100%)',
      text: '黄宏伟',
      textColor: '#D4A87C',
      fontSize: 15,
      fontWeight: 600,
    },
    {
      name: 'left',
      transform: `rotateY(-90deg) translateZ(${half}px)`,
      bg: 'linear-gradient(160deg, #3D3630 0%, #4A4038 100%)',
      text: 'HHW',
      textColor: '#D4A87C',
      fontSize: 18,
      fontWeight: 600,
    },
    {
      name: 'top',
      transform: `rotateX(90deg) translateZ(${half}px)`,
      bg: 'linear-gradient(160deg, #C8956C 0%, #A67B52 100%)',
      text: 'HHW',
      textColor: '#FFFFFF',
      fontSize: 18,
      fontWeight: 700,
    },
    {
      name: 'bottom',
      transform: `rotateX(-90deg) translateZ(${half}px)`,
      bg: 'linear-gradient(160deg, #8B7B6A 0%, #6B5D50 100%)',
      text: '黄宏伟',
      textColor: 'rgba(255,255,255,0.6)',
      fontSize: 14,
      fontWeight: 500,
    },
  ];

  return (
    <div
      ref={logoRef}
      className="fixed z-[9999] select-none"
      style={{
        left: position.x,
        top: position.y,
        width: SIZE,
        height: SIZE,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* 环境光晕 */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: SIZE + 40,
          height: SIZE + 40,
          left: -20,
          top: -20,
          background: 'radial-gradient(circle, rgba(200,149,108,0.12) 0%, transparent 70%)',
          opacity: isDragging ? 0.6 : 0.35,
          transition: 'opacity 0.4s',
        }}
      />

      {/* 底部投影 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full blur-md"
        style={{
          width: SIZE - 12,
          height: 10,
          bottom: -14,
          background: 'rgba(61,54,48,0.2)',
          opacity: isDragging ? 0.25 : 0.45,
          transition: 'opacity 0.4s',
        }}
      />

      {/* 3D 场景 */}
      <div
        className="relative h-full w-full"
        style={{ perspective: '300px' }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          }}
        >
          {faces.map((face) => (
            <div
              key={face.name}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                width: SIZE,
                height: SIZE,
                background: face.bg,
                transform: face.transform,
                borderRadius: 10,
                border: '1px solid rgba(200,149,108,0.15)',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.15)',
                backfaceVisibility: 'hidden',
              }}
            >
              {/* 面内光泽 */}
              <div
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                }}
              />
              {/* 文字 */}
              <span
                className="relative select-none tracking-wider"
                style={{
                  color: face.textColor,
                  fontSize: face.fontSize,
                  fontWeight: face.fontWeight,
                  fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                {face.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
