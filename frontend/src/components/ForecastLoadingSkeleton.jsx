import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useMotion } from '../context/MotionContext';
import { motion } from 'framer-motion';
import { CloudSun, Sparkles } from 'lucide-react';

export const ForecastLoadingSkeleton = () => {
  const { lang, t } = useTranslation();
  const { shouldReduceMotion } = useMotion();

  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-live="polite">
      {/* Friendly Animated "Checking the Forecast" State Banner */}
      <div className="rounded-2xl border border-agri-200/80 dark:border-slate-800 bg-gradient-to-r from-agri-50/80 via-emerald-50/50 to-agri-50/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-5 shadow-xs flex items-center gap-4">
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [-3, 3, -3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-2xl bg-agri-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-agri-600/30"
        >
          <CloudSun className="w-6 h-6 animate-pulse" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {lang === 'ta'
                ? 'வானிலை முன்னறிவிப்பு சரிபார்க்கப்படுகிறது...'
                : 'Checking Agro-Forecast...'}
            </span>
            <Sparkles className="w-4 h-4 text-agri-600 dark:text-agri-400 animate-spin" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'ta'
              ? 'Open-Meteo மாதிரி மற்றும் தமிழ்நாடு வேளாண் விதிகளின்படி தரவுகள் புதுப்பிக்கப்படுகின்றன.'
              : 'Synthesizing live Open-Meteo models and Tamil Nadu deterministic agronomic thresholds.'}
          </p>
        </div>
      </div>

      {/* Skeleton Shimmer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
            <div className="w-32 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastLoadingSkeleton;
