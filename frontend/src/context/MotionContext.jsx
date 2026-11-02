import React, { createContext, useContext, useState, useEffect } from 'react';
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

const MotionContext = createContext();

export const MotionProvider = ({ children }) => {
  const systemReducedMotion = useFramerReducedMotion();
  const [userReduceMotion, setUserReduceMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('climateguard_reduce_motion');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const toggleReduceMotion = () => {
    setUserReduceMotion(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('climateguard_reduce_motion', String(next));
      }
      return next;
    });
  };

  const shouldReduceMotion = Boolean(userReduceMotion || systemReducedMotion);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (shouldReduceMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    }
  }, [shouldReduceMotion]);

  return (
    <MotionContext.Provider
      value={{
        reduceMotion: userReduceMotion,
        toggleReduceMotion,
        shouldReduceMotion
      }}
    >
      {children}
    </MotionContext.Provider>
  );
};

export const useMotion = () => {
  const context = useContext(MotionContext);
  if (!context) {
    return {
      reduceMotion: false,
      toggleReduceMotion: () => {},
      shouldReduceMotion: false
    };
  }
  return context;
};

export default MotionContext;
