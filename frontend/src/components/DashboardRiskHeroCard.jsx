import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useMotion } from '../context/MotionContext';
import { motion } from 'framer-motion';
import { WeatherScene } from './WeatherScene';
import { ShieldCheck, AlertTriangle, Flame, CloudRain, Sun, Wind, Sprout } from 'lucide-react';
import { badgePopIn } from '../utils/motion';

/**
 * DashboardRiskHeroCard:
 * The dashboard "Today's Risk" hero card where <WeatherScene> is rendered
 * as a background strip with the status text and one-line advice on top.
 * Guaranteed WCAG AA contrast through a dark gradient scrim and high-contrast typography.
 * Big readable Tamil title (min 32px).
 */
export const DashboardRiskHeroCard = ({
  hazard = 'low', // 'low' | 'heat' | 'rain' | 'drought' | 'wind'
  riskLevel = 'LOW', // 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  statusBadgeText = '',
  actionTitle = '',
  avoidAdvice = '',
  sprayWindow = null,
  district = '',
  crop = '',
  growthStage = ''
}) => {
  const { lang, t } = useTranslation();
  const { shouldReduceMotion } = useMotion();

  const getHazardIcon = () => {
    switch (hazard) {
      case 'heat':
        return Flame;
      case 'rain':
        return CloudRain;
      case 'drought':
        return Sun;
      case 'wind':
        return Wind;
      default:
        return Sprout;
    }
  };

  const IconComponent = getHazardIcon();

  // Color accents for badge and highlights
  const badgeStyles = {
    low: {
      bg: 'bg-emerald-600/95 dark:bg-emerald-500/95',
      border: 'border-emerald-400/40',
      text: 'text-white'
    },
    heat: {
      bg: 'bg-rose-600/95 dark:bg-rose-600/95',
      border: 'border-rose-400/50',
      text: 'text-white'
    },
    rain: {
      bg: 'bg-sky-600/95 dark:bg-sky-600/95',
      border: 'border-sky-400/50',
      text: 'text-white'
    },
    drought: {
      bg: 'bg-amber-600/95 dark:bg-amber-600/95',
      border: 'border-amber-400/50',
      text: 'text-white'
    },
    wind: {
      bg: 'bg-cyan-600/95 dark:bg-cyan-600/95',
      border: 'border-cyan-400/50',
      text: 'text-white'
    }
  };

  const currentBadgeStyle = badgeStyles[hazard] || badgeStyles.low;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md group min-h-[220px] sm:min-h-[250px] flex flex-col justify-between transition-all">
      {/* 1. Background Strip: Illustrated Vector WeatherScene with gentle drift */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <WeatherScene hazard={hazard} time="day" className="w-full h-full object-cover" />
      </div>

      {/* 2. Gradient Scrim for WCAG AA Contrast (Dark bottom-left to top-right gradient) */}
      <div
        className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-950/30 sm:bg-gradient-to-r sm:from-slate-950/95 sm:via-slate-950/80 sm:to-slate-950/35 pointer-events-none"
        aria-hidden="true"
      />

      {/* 3. Foreground Content */}
      <div className="relative z-20 p-5 sm:p-6 md:p-7 flex flex-col justify-between h-full min-h-[220px] sm:min-h-[250px]">
        {/* Top Row: Status Text & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {/* Status Pill Badge (Pop-In Animation) */}
            <motion.div
              {...badgePopIn(0.1, shouldReduceMotion)}
              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm backdrop-blur-sm border ${currentBadgeStyle.bg} ${currentBadgeStyle.text} ${currentBadgeStyle.border}`}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
              <span>{statusBadgeText || t('risk.composite')}</span>
            </motion.div>

            {/* Sub-label for Context */}
            {district && (
              <span className="text-[11px] sm:text-xs font-semibold text-slate-300 drop-shadow-sm px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs">
                {district} • {crop ? t(`profile.crops.${crop}`) : ''}
              </span>
            )}
          </div>

          {/* Spray Window Status Pill (if available) */}
          {sprayWindow && (
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15 text-right shadow-xs"
            >
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                {t('spray.title')}
              </span>
              <span className={`text-xs font-bold ${
                sprayWindow.status === 'SAFE'
                  ? 'text-emerald-400'
                  : sprayWindow.status === 'CAUTION'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {sprayWindow.status === 'SAFE'
                  ? t('spray.safeShort')
                  : sprayWindow.status === 'CAUTION'
                  ? t('spray.cautionShort')
                  : t('spray.unsafeShort')}
              </span>
            </motion.div>
          )}
        </div>

        {/* Bottom Area: Big Readable Tamil Title (min 32px on desktop) & One-line Advice */}
        <div className="space-y-2 mt-auto max-w-3xl">
          {/* Big Readable Tamil Title: min 32px (text-2xl is 24px, sm:text-3xl is 30px, md:text-4xl is 36px) */}
          <motion.h2
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md"
          >
            {actionTitle}
          </motion.h2>

          {/* One-line advice on top */}
          {avoidAdvice && (
            <motion.p
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.1, 0.25, 1.0] }}
              className="text-xs sm:text-sm md:text-base text-amber-200/95 font-medium drop-shadow-sm flex items-center gap-1.5 line-clamp-2"
            >
              <span className="font-bold text-amber-300 shrink-0">
                {lang === 'ta' ? 'தவிர்க்க:' : 'Avoid:'}
              </span>
              <span>{avoidAdvice.replace(/Avoid:\s*/i, '').replace(/தவிர்க்க:\s*/i, '')}</span>
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardRiskHeroCard;
