import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { WeatherScene } from './WeatherScene';
import { ArrowRight, Droplets, ShieldAlert, Sparkles, MessageSquareText, ShieldCheck } from 'lucide-react';

/**
 * LandingPage:
 * Flat vector landscape hero inspired card with gradient sky, layered hills,
 * stylized Tamil Nadu landscape, big readable title (min 32px), tagline, and soft "Get started" pill button.
 */
export const LandingPage = ({
  hazard = 'low', // 'low' | 'heat' | 'rain' | 'drought' | 'wind'
  time = 'day',
  onGetStarted
}) => {
  const { lang, t } = useTranslation();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Flat Vector Landscape Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl min-h-[380px] sm:min-h-[460px] md:min-h-[500px] flex items-center justify-center text-center p-6 sm:p-10 md:p-14">
        {/* Background Strip: Illustrated Vector WeatherScene */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <WeatherScene hazard={hazard} time={time} className="w-full h-full object-cover" />
        </div>

        {/* Gradient Scrim for WCAG AA Contrast */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/92 via-slate-950/65 to-slate-950/35 pointer-events-none"
          aria-hidden="true"
        />

        {/* Center Hero Content */}
        <div className="relative z-20 max-w-3xl mx-auto flex flex-col items-center">
          {/* Top Pill: Subtitle / Purpose */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-bold tracking-wide shadow-xs mb-4">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>{t('app.subtitle')}</span>
          </div>

          {/* Big Readable Tamil Title (min 32px) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg leading-tight mb-4">
            {t('app.title')}
          </h1>

          {/* Tagline */}
          <p className="text-sm sm:text-lg md:text-xl text-slate-200 font-medium max-w-2xl drop-shadow-md mb-8 leading-relaxed">
            {t('app.tagline')}
          </p>

          {/* Soft Start Button (Pill shape, smooth hover scale, high contrast) */}
          <button
            type="button"
            onClick={onGetStarted}
            className="group px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 border border-emerald-400/40"
          >
            <span>{t('landing.getStarted')}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* 2. Three Feature Pillar Cards (Warm Earth cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Precision Irrigation */}
        <div
          onClick={onGetStarted}
          className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Droplets className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
            {t('landing.featIrrigation')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('landing.featIrrigationDesc')}
          </p>
        </div>

        {/* Card 2: Deterministic Risk Engine */}
        <div
          onClick={onGetStarted}
          className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
            {t('landing.featWarning')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('landing.featWarningDesc')}
          </p>
        </div>

        {/* Card 3: Bilingual Voice Agent */}
        <div
          onClick={onGetStarted}
          className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
            {t('landing.featAgent')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('landing.featAgentDesc')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
