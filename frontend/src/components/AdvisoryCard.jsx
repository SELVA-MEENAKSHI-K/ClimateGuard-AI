import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Volume2, VolumeX, AlertCircle, Wind, Droplet } from 'lucide-react';

const ChecklistItem = ({ taskId, isDone, onToggle, text, shouldReduceMotion }) => {
  return (
    <li
      onClick={() => onToggle(taskId)}
      className={`cursor-pointer flex items-start gap-2.5 p-2 rounded-lg text-xs sm:text-sm transition-colors select-none ${
        isDone
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
          : 'hover:bg-white dark:hover:bg-slate-800'
      }`}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : isDone
            ? { scale: [1, 1.2, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.25 }}
        className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-colors ${
          isDone
            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
        }`}
      >
        {isDone && (
          <svg
            className="w-3 h-3 text-white"
            viewBox="0 0 16 16"
            fill="none"
          >
            <motion.path
              d="M3.5 8.5L6.5 11.5L12.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1.0] }}
            />
          </svg>
        )}
      </motion.div>
      <motion.span
        animate={{
          opacity: isDone ? 0.45 : 1,
        }}
        transition={{ duration: 0.25 }}
        className={`transition-all ${
          isDone
            ? 'line-through text-slate-400 dark:text-slate-500'
            : 'text-slate-800 dark:text-slate-200'
        }`}
      >
        {text}
      </motion.span>
    </li>
  );
};

export const AdvisoryCard = ({ advisory, checklist, sprayWindow }) => {
  const { t, lang, tamilVoiceAvailable, isPlayingAudio, speakText, stopSpeech } = useTranslation();
  const [completedTasks, setCompletedTasks] = useState({});
  const shouldReduceMotion = useReducedMotion();

  if (!advisory) return null;

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const explanationText = lang === 'ta' ? (advisory.explanation_ta || advisory.explanation) : advisory.explanation;

  return (
    <div className="space-y-5 mb-5">
      {/* AI Explanation & Advisory Card */}
      <section className="bg-gradient-to-br from-agri-50 to-white dark:from-slate-900 dark:to-slate-900/90 rounded-2xl shadow-sm border border-agri-200 dark:border-slate-800 p-4 sm:p-5 theme-transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-agri-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-agri-600 dark:bg-agri-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t('checklist.title')}
              </h2>
              <span className="text-xs text-agri-800 dark:text-agri-400 font-medium">
                {t('risk.ruleNote')}
              </span>
            </div>
          </div>

          {/* Optional Tamil TTS Audio Readout */}
          {(lang === 'en' || tamilVoiceAvailable) && (
            <button
              type="button"
              onClick={() => isPlayingAudio ? stopSpeech() : speakText(explanationText)}
              className={`touch-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                isPlayingAudio
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-agri-700 hover:bg-agri-800 dark:bg-agri-600 text-white'
              }`}
              aria-label={isPlayingAudio ? t('audio.stop') : t('audio.listenTamil')}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>{t('audio.stop')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>{lang === 'ta' ? t('audio.listenTamil') : t('audio.listenEnglish')}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Narrative Explanation */}
        <div className="bg-white/90 dark:bg-slate-800/80 rounded-xl p-4 border border-agri-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed mb-4 shadow-xs">
          <p className="whitespace-pre-line font-medium">
            {explanationText}
          </p>
        </div>

        {/* Spray Window Guidance */}
        {sprayWindow && (
          <div className={`rounded-xl p-3.5 border mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            sprayWindow.status === 'SAFE'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200'
              : sprayWindow.status === 'CAUTION'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 shrink-0 ${
                sprayWindow.status === 'SAFE' ? 'text-emerald-600 dark:text-emerald-400' : sprayWindow.status === 'CAUTION' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`} />
              <div>
                <span className="font-bold text-sm block">
                  {t('spray.title')}: {
                    sprayWindow.status === 'SAFE' ? t('spray.safe') :
                    sprayWindow.status === 'CAUTION' ? t('spray.caution') :
                    t('spray.unsafe')
                  }
                </span>
                <span className="text-xs opacity-90 block">
                  {lang === 'ta' ? sprayWindow.reason_ta : sprayWindow.reason_en}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5" />
                {sprayWindow.wind_speed} km/h
              </span>
              <span className="flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5" />
                {sprayWindow.rain_probability}% {t('weather.rain')}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Proactive Action Checklist Grouped by 6h / 24h / 48h */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 theme-transition">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          {t('checklist.title')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {t('checklist.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Next 6 Hours */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  ⚡ {t('checklist.next6h')}
                </span>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                  {t('checklist.urgent')}
                </span>
              </div>
              <ul className="space-y-2.5">
                {(checklist?.next_6h || []).map((item, idx) => {
                  const taskId = `6h_${idx}`;
                  const isDone = !!completedTasks[taskId];
                  const text = lang === 'ta' ? (item.action_ta || item.action) : item.action;
                  return (
                    <ChecklistItem
                      key={taskId}
                      taskId={taskId}
                      isDone={isDone}
                      onToggle={toggleTask}
                      text={text}
                      shouldReduceMotion={shouldReduceMotion}
                    />
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Next 24 Hours */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  ⏱️ {t('checklist.next24h')}
                </span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                  {t('checklist.pending')}
                </span>
              </div>
              <ul className="space-y-2.5">
                {(checklist?.next_24h || []).map((item, idx) => {
                  const taskId = `24h_${idx}`;
                  const isDone = !!completedTasks[taskId];
                  const text = lang === 'ta' ? (item.action_ta || item.action) : item.action;
                  return (
                    <ChecklistItem
                      key={taskId}
                      taskId={taskId}
                      isDone={isDone}
                      onToggle={toggleTask}
                      text={text}
                      shouldReduceMotion={shouldReduceMotion}
                    />
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Next 48 Hours */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  📅 {t('checklist.next48h')}
                </span>
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full">
                  {t('checklist.pending')}
                </span>
              </div>
              <ul className="space-y-2.5">
                {(checklist?.next_48h || []).map((item, idx) => {
                  const taskId = `48h_${idx}`;
                  const isDone = !!completedTasks[taskId];
                  const text = lang === 'ta' ? (item.action_ta || item.action) : item.action;
                  return (
                    <ChecklistItem
                      key={taskId}
                      taskId={taskId}
                      isDone={isDone}
                      onToggle={toggleTask}
                      text={text}
                      shouldReduceMotion={shouldReduceMotion}
                    />
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
