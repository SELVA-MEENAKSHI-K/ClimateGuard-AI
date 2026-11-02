import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Cpu,
  Wrench,
  CheckCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CloudSun,
  Droplets,
  Loader2
} from 'lucide-react';
import { PageHeader, HeroDecisionCard, AgentGuidanceCard } from './PageTemplate';

const ToolStepItem = ({ tc, index, shouldReduceMotion }) => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDone(true);
    }, 450 + index * 300);
    return () => clearTimeout(timer);
  }, [index]);

  const toolName = tc.tool || tc.name || 'tool';
  const getToolIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('weather') || lower.includes('rain') || lower.includes('temp')) return CloudSun;
    if (lower.includes('irrigation') || lower.includes('water') || lower.includes('et0')) return Droplets;
    if (lower.includes('risk') || lower.includes('safety') || lower.includes('alert')) return ShieldCheck;
    return Wrench;
  };
  const ToolIcon = getToolIcon(toolName);

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: shouldReduceMotion ? 0 : index * 0.12 }}
      className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-[11px] space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ToolIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-sky-300 font-bold font-mono">{toolName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {done ? (
            <motion.span
              initial={shouldReduceMotion ? {} : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full"
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>Success</span>
            </motion.span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>Running</span>
            </span>
          )}
        </div>
      </div>
      {tc.arguments && (
        <pre className="text-slate-300 mt-1 overflow-x-auto text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800 font-mono">
          {JSON.stringify(tc.arguments, null, 2)}
        </pre>
      )}
    </motion.div>
  );
};

export const AgentChat = ({
  profile,
  onSendMessage,
  messages,
  loading,
  latestTrace,
  persona = 'farmer',
  provider = 'mock',
  onClearChat
}) => {
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [inputQuery, setInputQuery] = useState('');
  const [traceOpen, setTraceOpen] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleChipClick = (prompt) => {
    if (loading) return;
    onSendMessage(prompt);
  };

  // Farmer prompts vs Public prompts (no relief camp prompts for farmers)
  const farmerPrompts = [
    lang === 'ta' ? 'இன்று மருந்து தெளிக்க உகந்த நேரமா?' : 'Is it safe to spray today?',
    lang === 'ta' ? 'மழை வருவதற்குள் நிலத்தில் என்ன செய்ய வேண்டும்?' : 'What should I do before the rain arrives?',
    lang === 'ta' ? 'அதிக வெப்பத்திலிருந்து பயிரை எப்படி காப்பது?' : 'How to protect my crop from extreme heat?',
    lang === 'ta' ? 'அடுத்த பாசனத்தை எப்போது செய்ய வேண்டும்?' : 'When should I plan the next irrigation?'
  ];

  const publicPrompts = [
    lang === 'ta' ? 'அருகிலுள்ள நிவாரண முகாம்கள் எங்குள்ளன?' : 'Where is the nearest relief shelter?',
    lang === 'ta' ? 'வெப்ப அலையிலிருந்து குழந்தைகளை காப்பது எப்படி?' : 'How to protect children from heatwave?',
    lang === 'ta' ? 'இன்று வெளியில் செல்வது பாதுகாப்பானதா?' : 'Is it safe to go outdoors today?'
  ];

  const activePrompts = persona === 'public' ? publicPrompts : farmerPrompts;
  const currentProvider = latestTrace?.provider || provider;
  const isLive = currentProvider === 'gemini' && (!latestTrace || !latestTrace.is_mock);

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')?.text;
  const defaultGuidance =
    lang === 'ta'
      ? 'காலநிலை காப்பான் AI ஆலோசகர் Open-Meteo வானிலை மற்றும் தமிழ்நாடு வேளாண் வழிகாட்டுதல்களை அடிப்படையாகக் கொண்டு துல்லிய பதில்களை வழங்குகிறது. அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முன்னுரிமை.'
      : 'ClimateGuard AI leverages Open-Meteo meteorological models coupled with deterministic Tamil Nadu agromet rules. Official IMD alerts strictly take precedence.';

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title={t('chat.title')}
        subtitle={`${t('chat.subtitle')} • ${profile.district} (${t(`profile.crops.${profile.crop}`)})`}
        actionButton={
          messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('chat.clear')}</span>
            </button>
          )
        }
      />

      {/* 2. Hero Decision Card for Ask Agent */}
      <HeroDecisionCard
        badge={isLive ? t('provider.liveLong') : t('provider.mockLong')}
        decision={
          lang === 'ta'
            ? 'தெளிப்பு நேரம்: சாதகமானது (காலை 6:00 - 9:00)'
            : 'Foliar Spray Window: SAFE (Optimal: 6:00 AM - 9:00 AM)'
        }
        reason={
          lang === 'ta'
            ? `மதுரை மாவட்டத்தில் தற்போதைய காற்றின் வேகம் 14 கி.மீ/ம மற்றும் குறைந்த மழை வாய்ப்பு உள்ளதால், இலைவழி ஊட்டச்சத்து தெளிக்க உகந்தது.`
            : `Wind speed in ${profile.district} is 14 km/h with low rain probability. Safe for vegetative foliar nutrition application.`
        }
        colorAccent="emerald"
        icon={ShieldCheck}
        extraDetails={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isLive
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isLive ? 'Gemini 2.5 Flash' : 'Deterministic Mock'}</span>
            </span>
          </div>
        }
      />

      {/* 3. 12-Column Grid Content: Interactive Chat Conversation */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm theme-transition">
        {/* Quick Prompts */}
        <div className="mb-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
            {t('chat.quickPromptsTitle')}
          </span>
          <div className="flex flex-wrap gap-2">
            {activePrompts.map((promptText, i) => (
              <button
                key={i}
                type="button"
                disabled={loading}
                onClick={() => handleChipClick(promptText)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors text-left"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Message History */}
        <div className="max-h-96 overflow-y-auto space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t('chat.emptyHint')}
            </div>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-agri-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 font-semibold">
                  {msg.role === 'user' ? t('chat.farmer') : t('chat.agent')}
                </span>
              </motion.div>
            ))
          )}

          {/* Typing Indicator: Three Bouncing Dots */}
          {loading && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-agri-700 dark:text-agri-300 font-medium w-fit shadow-xs"
            >
              <div className="flex items-center gap-1.5 px-1">
                <motion.span
                  animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-2 h-2 rounded-full bg-agri-600 dark:bg-agri-400 inline-block"
                />
                <motion.span
                  animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                  className="w-2 h-2 rounded-full bg-agri-600 dark:bg-agri-400 inline-block"
                />
                <motion.span
                  animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                  className="w-2 h-2 rounded-full bg-agri-600 dark:bg-agri-400 inline-block"
                />
              </div>
              <span className="font-semibold text-slate-600 dark:text-slate-300 ml-1">
                {t('chat.thinking')}
              </span>
            </motion.div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={t('chat.placeholder')}
            disabled={loading}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-agri-500 focus:border-agri-600 dark:focus:border-agri-400 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-5 py-2.5 bg-agri-600 hover:bg-agri-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
            aria-label={t('chat.send')}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t('chat.send')}</span>
          </button>
        </form>

        {/* Collapsible Agent Trace with Sequential Tool Steps */}
        {latestTrace && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mt-3 shadow-xs">
            <button
              type="button"
              onClick={() => setTraceOpen(!traceOpen)}
              className="w-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 px-4 py-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-agri-600 dark:text-agri-400" />
                <span>
                  {t('trace.title')} ({latestTrace.provider} •{' '}
                  {latestTrace.is_mock ? 'Mock Fallback' : 'Strands Live'})
                </span>
              </span>
              {traceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {traceOpen && (
              <div className="p-4 bg-slate-900 text-slate-200 text-xs font-mono space-y-3 overflow-x-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold">
                    Provider: {latestTrace.provider}
                  </span>
                  <span className="text-slate-400">Mode: {latestTrace.mode}</span>
                </div>
                {latestTrace.reason && (
                  <div className="text-amber-400 text-[11px]">
                    Note: {latestTrace.reason}
                  </div>
                )}
                {latestTrace.tool_calls && latestTrace.tool_calls.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <span className="text-slate-400 font-bold block text-[11px] uppercase tracking-wider">
                      Executed Strands Tools:
                    </span>
                    {latestTrace.tool_calls.map((tc, idx) => (
                      <ToolStepItem
                        key={idx}
                        tc={tc}
                        index={idx}
                        shouldReduceMotion={shouldReduceMotion}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Agent Guidance Card at Bottom with Voice Readout */}
      <AgentGuidanceCard
        title={t('guidance.title')}
        explanationText={lastAssistantMessage || defaultGuidance}
      />
    </div>
  );
};
