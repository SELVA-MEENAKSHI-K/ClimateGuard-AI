import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flame, CloudRain, Sun, Wind, Sprout } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

/**
 * 2D Animated Illustration Fallback
 * Displayed on mobile/tablet (<1024px) or when WebGL is unavailable.
 */
export const HeroIllustrationFallback = ({ topHazard = 'favorable' }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const getHazardMeta = () => {
    switch (topHazard) {
      case 'heat':
        return {
          title: t('hero3d.hazardHeat'),
          icon: Flame,
          gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
          borderColor: 'border-amber-300 dark:border-amber-800',
          textColor: 'text-amber-700 dark:text-amber-400',
          accentBg: 'bg-amber-500'
        };
      case 'rain':
        return {
          title: t('hero3d.hazardRain'),
          icon: CloudRain,
          gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
          borderColor: 'border-sky-300 dark:border-sky-800',
          textColor: 'text-sky-700 dark:text-sky-400',
          accentBg: 'bg-sky-500'
        };
      case 'drought':
        return {
          title: t('hero3d.hazardDrought'),
          icon: Sun,
          gradient: 'from-orange-500/20 via-amber-600/10 to-transparent',
          borderColor: 'border-orange-300 dark:border-orange-800',
          textColor: 'text-orange-700 dark:text-orange-400',
          accentBg: 'bg-orange-500'
        };
      case 'wind':
        return {
          title: t('hero3d.hazardWind'),
          icon: Wind,
          gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
          borderColor: 'border-teal-300 dark:border-teal-800',
          textColor: 'text-teal-700 dark:text-teal-400',
          accentBg: 'bg-teal-500'
        };
      default:
        return {
          title: t('hero3d.hazardFavorable'),
          icon: Sprout,
          gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
          borderColor: 'border-emerald-300 dark:border-emerald-800',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          accentBg: 'bg-emerald-500'
        };
    }
  };

  const meta = getHazardMeta();
  const IconComp = meta.icon;

  return (
    <div className={`w-full py-3.5 px-3.5 sm:px-6 rounded-2xl bg-gradient-to-r ${meta.gradient} border ${meta.borderColor} flex items-center justify-between gap-3 overflow-hidden relative`}>
      <div className="z-10 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-2 h-2 rounded-full ${meta.accentBg} animate-pulse shrink-0`} />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {t('hero3d.title')}
          </span>
        </div>
        <h3 className={`text-sm sm:text-lg font-extrabold ${meta.textColor} leading-tight`}>
          {meta.title}
        </h3>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 max-w-md">
          {t('app.footerNotice')}
        </p>
      </div>

      {/* Animated 2D Illustration graphic */}
      <div className="relative shrink-0 flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18">
        <motion.div
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.08, 1],
            rotate: [0, 4, -4, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${meta.accentBg} text-white flex items-center justify-center shadow-md shadow-black/10`}
        >
          <IconComp className="w-6 h-6 sm:w-8 sm:h-8" />
        </motion.div>
      </div>
    </div>
  );
};
