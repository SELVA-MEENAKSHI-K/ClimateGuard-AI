import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Volume2, VolumeX, Sparkles, CheckCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * PageHeader: Title, one-line subtitle, and optional key action button.
 */
export const PageHeader = ({ title, subtitle, actionButton }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {actionButton && <div className="shrink-0">{actionButton}</div>}
    </div>
  );
};

/**
 * HeroDecisionCard: ONE large card with the single most important answer of the page
 * with a short reason sentence and a color accent.
 */
export const HeroDecisionCard = ({
  badge,
  decision,
  reason,
  colorAccent = 'emerald', // 'emerald' | 'amber' | 'indigo' | 'rose' | 'sky'
  icon: IconComponent = CheckCircle,
  extraDetails
}) => {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
      border: 'border-emerald-300 dark:border-emerald-800',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
      badgeText: 'text-emerald-900 dark:text-emerald-200',
      badgeBorder: 'border-emerald-300 dark:border-emerald-700',
      text: 'text-emerald-950 dark:text-emerald-100',
      subtext: 'text-emerald-800 dark:text-emerald-300/90',
      iconBg: 'bg-emerald-500 text-white'
    },
    amber: {
      bg: 'bg-amber-50/70 dark:bg-amber-950/30',
      border: 'border-amber-300 dark:border-amber-800',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
      badgeText: 'text-amber-900 dark:text-amber-200',
      badgeBorder: 'border-amber-300 dark:border-amber-700',
      text: 'text-amber-950 dark:text-amber-100',
      subtext: 'text-amber-800 dark:text-amber-300/90',
      iconBg: 'bg-amber-500 text-white'
    },
    indigo: {
      bg: 'bg-indigo-50/70 dark:bg-indigo-950/30',
      border: 'border-indigo-300 dark:border-indigo-800',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
      badgeText: 'text-indigo-900 dark:text-indigo-200',
      badgeBorder: 'border-indigo-300 dark:border-indigo-700',
      text: 'text-indigo-950 dark:text-indigo-100',
      subtext: 'text-indigo-800 dark:text-indigo-300/90',
      iconBg: 'bg-indigo-500 text-white'
    },
    rose: {
      bg: 'bg-rose-50/70 dark:bg-rose-950/30',
      border: 'border-rose-300 dark:border-rose-800',
      badgeBg: 'bg-rose-100 dark:bg-rose-900/60',
      badgeText: 'text-rose-900 dark:text-rose-200',
      badgeBorder: 'border-rose-300 dark:border-rose-700',
      text: 'text-rose-950 dark:text-rose-100',
      subtext: 'text-rose-800 dark:text-rose-300/90',
      iconBg: 'bg-rose-500 text-white'
    },
    sky: {
      bg: 'bg-sky-50/70 dark:bg-sky-950/30',
      border: 'border-sky-300 dark:border-sky-800',
      badgeBg: 'bg-sky-100 dark:bg-sky-900/60',
      badgeText: 'text-sky-900 dark:text-sky-200',
      badgeBorder: 'border-sky-300 dark:border-sky-700',
      text: 'text-sky-950 dark:text-sky-100',
      subtext: 'text-sky-800 dark:text-sky-300/90',
      iconBg: 'bg-sky-500 text-white'
    }
  };

  const style = colorStyles[colorAccent] || colorStyles.emerald;

  return (
    <div
      className={`rounded-2xl border-2 ${style.border} ${style.bg} p-5 sm:p-6 shadow-sm transition-all`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}
          >
            <IconComponent className="w-6 h-6 shrink-0" />
          </div>
          <div className="min-w-0">
            {badge && (
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.badgeBorder} ${style.badgeBg} ${style.badgeText} mb-1.5`}
              >
                {badge}
              </span>
            )}
            <h3 className={`text-lg sm:text-2xl font-black ${style.text} leading-snug`}>
              {decision}
            </h3>
            {reason && (
              <p className={`text-xs sm:text-sm font-medium ${style.subtext} mt-1.5 leading-relaxed`}>
                {reason}
              </p>
            )}
          </div>
        </div>
        {extraDetails && <div className="shrink-0 sm:self-center">{extraDetails}</div>}
      </div>
    </div>
  );
};

/**
 * AgentGuidanceCard: Guidance card at the bottom with audio voice playback button.
 */
export const AgentGuidanceCard = ({ title, explanationText }) => {
  const { t, lang, isPlayingAudio, speakText, stopSpeech } = useTranslation();

  const handleVoiceToggle = () => {
    if (isPlayingAudio) {
      stopSpeech();
    } else if (explanationText) {
      speakText(explanationText);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 theme-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-agri-600 dark:bg-agri-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {title || t('guidance.title')}
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {t('guidance.subtitle')}
            </span>
          </div>
        </div>

        {/* Voice Playback Button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto ${
            isPlayingAudio
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-agri-600 hover:bg-agri-700 text-white'
          }`}
          aria-label={isPlayingAudio ? t('guidance.stop') : t('guidance.listen')}
        >
          {isPlayingAudio ? (
            <>
              <VolumeX className="w-4 h-4 shrink-0" />
              <span>{t('guidance.stop')}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 shrink-0" />
              <span>{t('guidance.listen')}</span>
            </>
          )}
        </button>
      </div>

      <p className="mt-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
        {explanationText}
      </p>
    </div>
  );
};
