import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * CountUp: Smoothly animates numbers from previous to target value.
 * Immediately renders static number if prefers-reduced-motion is true.
 */
export const CountUp = ({
  value,
  decimals = 1,
  duration = 0.8,
  prefix = '',
  suffix = ''
}) => {
  const shouldReduceMotion = useReducedMotion();
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? numericValue : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(numericValue);
      return;
    }

    let start = 0;
    const end = numericValue;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    let frameId;
    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(end);
      }
    };

    frameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(frameId);
  }, [numericValue, duration, shouldReduceMotion]);

  if (isNaN(numericValue)) {
    return <span>{value}</span>;
  }

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toString();

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
};
