'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 可拖拽悬浮 3D Logo
 * 右下角悬浮，鼠标可拖拽移动，自动缓慢旋转
 */
export function FloatingLogo() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const [rotation, setRotation] = useState(0);
  const logoRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // 初始化位置：右下角
  useEffect(() => {
    const updateInitialPos = () => {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
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
      setRotation((prev) => (prev + delta * 0.03) % 360);
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
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 64, e.clientX - dragStart.x)),
        y: Math.max(0, Math.min(window.innerHeight - 64, e.clientY - dragStart.y)),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 64, touch.clientX - dragStart.x)),
        y: Math.max(0, Math.min(window.innerHeight - 64, touch.clientY - dragStart.y)),
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

  return (
    <div
      ref={logoRef}
      className="fixed z-[9999] select-none"
      style={{
        left: position.x,
        top: position.y,
        width: 64,
        height: 64,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* 投影 */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#3D3630]/15 blur-md"
        style={{
          width: 48,
          height: 8,
          opacity: isDragging ? 0.3 : 0.5,
          transition: 'opacity 0.3s',
        }}
      />

      {/* 3D 立方体 */}
      <div
        className="relative h-full w-full"
        style={{
          perspective: '200px',
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(-25deg) rotateY(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s linear',
          }}
        >
          {/* 顶面 - 琥珀金 */}
          <div
            className="absolute inset-0"
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #C8956C 0%, #A67B52 100%)',
              transform: 'rotateX(90deg) translateZ(28px)',
              borderRadius: 8,
            }}
          />
          {/* 前面 - 深胡桃棕 */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #3D3630 0%, #2C2825 100%)',
              transform: 'translateZ(28px)',
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(61,54,48,0.35)',
            }}
          >
            <span
              className="font-mono font-bold text-white select-none"
              style={{ fontSize: 22, letterSpacing: '-0.5px' }}
            >
              HHW
            </span>
          </div>
          {/* 右面 */}
          <div
            className="absolute inset-0"
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #4A423A 0%, #3D3630 100%)',
              transform: 'rotateY(90deg) translateZ(28px)',
              borderRadius: 8,
            }}
          />
          {/* 底面 */}
          <div
            className="absolute inset-0"
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #8B7B6A 0%, #6B5D50 100%)',
              transform: 'rotateX(-90deg) translateZ(28px)',
              borderRadius: 8,
            }}
          />
          {/* 左面 */}
          <div
            className="absolute inset-0"
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #5A5046 0%, #4A423A 100%)',
              transform: 'rotateY(-90deg) translateZ(28px)',
              borderRadius: 8,
            }}
          />
        </div>
      </div>
    </div>
  );
}
