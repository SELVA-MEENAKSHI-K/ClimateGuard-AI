import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { ShieldAlert, PhoneCall } from 'lucide-react';

export const DisclaimerFooter = ({ isMockMode }) => {
  const { t, lang } = useTranslation();

  return (
    <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-12 pt-6 pb-24 md:pb-10 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs text-center space-y-4 theme-transition">
      {/* Official IMD Priority Notice Banner */}
      <div className="max-w-3xl mx-auto p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2.5 font-medium shadow-xs">
        <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 animate-pulse" />
        <span className="min-w-0 text-left sm:text-center leading-relaxed">
          {t('app.footerNotice')}
        </span>
      </div>

      {/* Emergency Agricultural Helpline */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-slate-700 dark:text-slate-300 font-semibold">
        <span className="flex items-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-agri-700 dark:text-agri-400" />
          <span>{t('shelter.phone')}</span>
        </span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
          {isMockMode ? t('app.mockModeNotice') : t('app.liveModeNotice')}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {lang === 'ta'
          ? 'காலநிலை காப்பான் AI • தமிழ்நாடு வேளாண் காலநிலை முடிவெடுக்கும் தளம்'
          : 'ClimateGuard AI • Tamil Nadu Agro-Climatic Intelligence Platform'}
      </p>
    </footer>
  );
};
