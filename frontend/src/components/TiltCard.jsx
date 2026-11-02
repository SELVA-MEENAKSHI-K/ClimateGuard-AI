import React, { useRef, useState, useEffect } from 'react';

/**
 * TiltCard: Applies CSS 3D tilt & dynamic light glare on hover.
 * Automatically disabled on touch-only devices per user requirement 3a.
 */
export const TiltCard = ({
  children,
  className = '',
  maxTilt = 8,
  glare = true,
  onClick
}) => {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Detect touch / non-hover device
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
      setIsTouchDevice(!mediaQuery.matches);

      const handleChange = (e) => setIsTouchDevice(!e.matches);
      mediaQuery.addEventListener?.('change', handleChange);
      return () => mediaQuery.removeEventListener?.('change', handleChange);
    }
  }, []);

  const handlePointerMove = (e) => {
    if (isTouchDevice || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    // Normalizing between -0.5 and 0.5
    const dx = x / rect.width - 0.5;
    const dy = y / rect.height - 0.5;

    const rotX = (-dy * maxTilt * 2).toFixed(2);
    const rotY = (dx * maxTilt * 2).toFixed(2);

    setTransform(`perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`);

    if (glare) {
      setGlareStyle({
        opacity: 0.35,
        background: `radial-gradient(circle at ${xPercent}% ${yPercent}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)`
      });
    }
  };

  const handlePointerEnter = () => {
    if (isTouchDevice) return;
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    if (isTouchDevice) return;
    setIsHovered(false);
    setTransform('perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlareStyle({ opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`relative overflow-hidden transition-transform duration-200 ease-out preserve-3d ${className}`}
      style={{
        transform: isHovered && !isTouchDevice ? transform : 'none',
        transformStyle: 'preserve-3d',
        willChange: isHovered ? 'transform' : 'auto'
      }}
    >
      {children}

      {/* Dynamic light glare layer */}
      {glare && !isTouchDevice && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 ease-out"
          style={glareStyle}
        />
      )}
    </div>
  );
};
