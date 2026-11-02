/**
 * frontend/src/utils/motion.js
 * 
 * Shared animation and motion configuration for ClimateGuard AI.
 * Follows 250-500ms durations with fluid ease-out curves.
 * Respects prefers-reduced-motion and user motion preferences.
 */

// Fluid ease-out curve [x1, y1, x2, y2]
export const EASING_EASE_OUT = [0.25, 0.1, 0.25, 1.0];
export const EASING_SPRING = { type: 'spring', stiffness: 420, damping: 28 };

// 1. Page Transition Variants (AnimatePresence)
export const getPageVariants = (shouldReduceMotion = false) => ({
  initial: {
    opacity: 0,
    y: shouldReduceMotion ? 0 : 8
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: shouldReduceMotion ? 0.15 : 0.28,
      ease: EASING_EASE_OUT
    }
  },
  exit: {
    opacity: 0,
    y: shouldReduceMotion ? 0 : -6,
    transition: {
      duration: 0.18,
      ease: EASING_EASE_OUT
    }
  }
});

export const pageVariants = getPageVariants(false);

// 2. Container Stagger Variants
export const containerStagger = (staggerDelay = 0.07, shouldReduceMotion = false) => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
      delayChildren: 0.05
    }
  }
});

// 3. Card Fade-Up Variants
export const cardFadeUp = (shouldReduceMotion = false) => ({
  initial: {
    opacity: 0,
    y: shouldReduceMotion ? 0 : 16
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: shouldReduceMotion ? 0.15 : 0.35,
      ease: EASING_EASE_OUT
    }
  }
});

// 4. Hover Lift & Button Tap Scales
export const cardHoverLift = (shouldReduceMotion = false) =>
  shouldReduceMotion
    ? {}
    : {
        whileHover: { y: -3, transition: { duration: 0.2, ease: EASING_EASE_OUT } }
      };

export const buttonPressScale = (shouldReduceMotion = false) =>
  shouldReduceMotion
    ? {}
    : {
        whileHover: { scale: 1.02, transition: { duration: 0.15 } },
        whileTap: { scale: 0.96, transition: { duration: 0.1 } }
      };

// 5. Badge Pop-In (Spring)
export const badgePopIn = (delay = 0, shouldReduceMotion = false) => ({
  initial: {
    opacity: 0,
    scale: shouldReduceMotion ? 1 : 0.75
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: shouldReduceMotion
      ? { duration: 0.1 }
      : {
          delay,
          type: 'spring',
          stiffness: 500,
          damping: 24
        }
  }
});

// 6. Gentle CTA Pulse for Hero Action Button
export const ctaPulse = (shouldReduceMotion = false) =>
  shouldReduceMotion
    ? {}
    : {
        animate: {
          scale: [1, 1.025, 1],
          boxShadow: [
            '0 10px 25px -5px rgba(5, 150, 105, 0.4)',
            '0 15px 30px -5px rgba(5, 150, 105, 0.65)',
            '0 10px 25px -5px rgba(5, 150, 105, 0.4)'
          ]
        },
        transition: {
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      };
