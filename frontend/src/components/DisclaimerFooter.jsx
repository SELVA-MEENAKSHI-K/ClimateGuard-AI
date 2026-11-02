import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { ShieldAlert, PhoneCall } from 'lucide-react';

export const DisclaimerFooter = ({ isMockMode }) => {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 pt-6 pb-20 md:pb-10 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs text-center space-y-3 theme-transition">
      {/* Official IMD Priority Notice */}
      <div className="max-w-2xl mx-auto p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 font-medium overflow-hidden">
        <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
        <span className="min-w-0">{t('app.footerNotice')}</span>
      </div>

      {/* Emergency Agricultural Helpline */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-slate-700 dark:text-slate-300 font-semibold">
        <span className="flex items-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-agri-700 dark:text-agri-400" />
          <span>{t('shelter.phone')}</span>
        </span>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <span className="text-slate-500 dark:text-slate-400">
          {isMockMode ? t('app.mockModeNotice') : t('app.liveModeNotice')}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        ClimateGuard AI • Tamil Nadu Agromet Hackathon Prototype • Open-Meteo & Strands Agents SDK
      </p>
    </footer>
  );
};
