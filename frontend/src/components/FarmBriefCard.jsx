import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { MessageSquare, Copy, Check, Smartphone, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const FarmBriefCard = ({ farmBrief }) => {
  const { t, lang } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!farmBrief) return null;

  const currentBrief = lang === 'ta'
    ? (farmBrief.brief_ta || farmBrief.brief_en || '')
    : (farmBrief.brief_en || farmBrief.brief_ta || '');

  const topRisk = lang === 'ta'
    ? (farmBrief.top_risk_ta || farmBrief.top_risk || '')
    : (farmBrief.top_risk || farmBrief.top_risk_ta || '');

  const actionToday = lang === 'ta'
    ? (farmBrief.action_today_ta || farmBrief.action_today_en || '')
    : (farmBrief.action_today_en || farmBrief.action_today_ta || '');

  const avoidToday = lang === 'ta'
    ? (farmBrief.avoid_today_ta || farmBrief.avoid_today_en || '')
    : (farmBrief.avoid_today_en || farmBrief.avoid_today_ta || '');

  const handleCopy = async () => {
    if (!currentBrief) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentBrief);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentBrief;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const charCount = currentBrief.length;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-5 theme-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t('farmBrief.title')}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {t('farmBrief.smsPreview')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {t('farmBrief.subtitle')}
            </p>
          </div>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
            copied
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
              : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white active:scale-95'
          }`}
          aria-label={copied ? t('farmBrief.copied') : t('farmBrief.copy')}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
              <span>{t('farmBrief.copied')}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>{t('farmBrief.copy')}</span>
            </>
          )}
        </button>
      </div>

      {/* SMS Preview Container */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('farmBrief.smsSender')}</span>
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
            charCount <= 300 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-rose-100 text-rose-700'
          }`}>
            {charCount}/300 {t('farmBrief.charCount')}
          </span>
        </div>

        {/* Realistic SMS Message Bubble */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 font-bold text-xs mt-1">
            KG
          </div>
          <div className="flex-1 max-w-2xl">
            <div className="relative bg-emerald-700 dark:bg-emerald-800 text-white rounded-2xl rounded-tl-sm p-4 shadow-sm text-sm sm:text-base leading-relaxed font-sans whitespace-pre-line selection:bg-emerald-900">
              {currentBrief}
            </div>

            {/* Structured Highlights Pill Row */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {topRisk && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate font-semibold">{t('farmBrief.topRisk')}: {topRisk}</span>
                </div>
              )}
              {actionToday && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate font-medium">{actionToday}</span>
                </div>
              )}
              {avoidToday && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="truncate font-medium">{avoidToday}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
