import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { MessageSquare, Send, ChevronDown, ChevronUp, Cpu, Wrench, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

export const AgentChat = ({
  profile,
  onSendMessage,
  messages,
  loading,
  latestTrace,
  persona = 'farmer',
  provider = 'mock'
}) => {
  const { t, lang } = useTranslation();
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

  // Farmer prompts vs Public prompts (Requirement: "Remove the 'nearby relief camps' suggested question for farmers; it belongs to the public mode")
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

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-5 theme-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-agri-600 dark:text-agri-400" />
              <span>{t('chat.title')}</span>
            </h2>

            {/* Live agent (Gemini) or Mock mode badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                isLive
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isLive ? 'Live agent (Gemini)' : 'Mock mode'}</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t('chat.subtitle')} ({profile.district} • {t(`profile.crops.${profile.crop}`)} • {t(`profile.stages.${profile.growth_stage}`)})
          </p>
        </div>
      </div>

      {/* Quick Prompt Chips (Tailored by Persona: Farmer vs Public) */}
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
              className="touch-target px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-agri-50 dark:hover:bg-agri-950/60 hover:text-agri-900 dark:hover:text-agri-300 border border-slate-200 dark:border-slate-700 hover:border-agri-300 dark:hover:border-agri-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors text-left"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="max-h-96 overflow-y-auto space-y-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {t('chat.emptyHint')}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-agri-700 dark:bg-agri-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                {msg.role === 'user' ? t('chat.farmer') : t('chat.agent')}
              </span>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-agri-700 dark:text-agri-300 font-medium animate-pulse">
            <Cpu className="w-4 h-4 animate-spin text-agri-600 dark:text-agri-400" />
            <span>{t('chat.thinking')}</span>
          </div>
        )}
      </div>

      {/* Input Form with large tap targets */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t('chat.placeholder')}
          disabled={loading}
          className="touch-target flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-agri-500 dark:hover:border-agri-500 focus:border-agri-600 dark:focus:border-agri-400 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-slate-900 dark:text-white outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="touch-target px-5 py-2.5 bg-agri-700 dark:bg-agri-600 hover:bg-agri-800 dark:hover:bg-agri-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
          aria-label={t('chat.send')}
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{t('chat.send')}</span>
        </button>
      </form>

      {/* Collapsible Agent Trace Panel */}
      {latestTrace && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mt-3">
          <button
            type="button"
            onClick={() => setTraceOpen(!traceOpen)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 px-4 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('trace.title')}</span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  latestTrace.provider === 'gemini' && !latestTrace.is_mock
                    ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                {latestTrace.provider === 'gemini' && !latestTrace.is_mock ? 'Live agent (Gemini)' : 'Mock mode'}
              </span>
            </div>
            {traceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {traceOpen && (
            <div className="p-3.5 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto space-y-2">
              <div className="text-emerald-400 font-semibold border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>// {t('trace.orchestrator')}: {latestTrace.orchestrator}</span>
                <span className="text-[10px] text-slate-400">Mode: {latestTrace.mode}</span>
              </div>

              {latestTrace.reason && (
                <div className="text-amber-400/90 text-[11px] p-2 rounded bg-amber-950/30 border border-amber-900/50">
                  <span className="font-bold">Provider Status: </span>
                  <span>{latestTrace.reason}</span>
                </div>
              )}

              <div className="text-slate-400 text-[11px]">
                {t('trace.subagents')}
              </div>

              {/* Tool Calls list */}
              <div className="space-y-1.5 pt-1">
                <div className="text-amber-400 font-semibold text-[11px]">
                  &gt; {t('trace.toolCalls')}:
                </div>
                {latestTrace.tool_calls?.map((tool, idx) => (
                  <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                        @{tool.name}
                      </span>
                      <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {tool.status} ({tool.duration_ms}ms)
                      </span>
                    </div>
                    {tool.args && (
                      <pre className="text-[10px] text-slate-400 mt-1 whitespace-pre-wrap overflow-x-auto">
                        args: {JSON.stringify(tool.args)}
                      </pre>
                    )}
                    {tool.output && (
                      <pre className="text-[10px] text-slate-300 mt-0.5 whitespace-pre-wrap overflow-x-auto">
                        return: {typeof tool.output === 'object' ? JSON.stringify(tool.output, null, 2) : tool.output}
                      </pre>
                    )}
                  </div>
                ))}
              </div>

              {/* Pydantic Structured Output status */}
              {latestTrace.structured_output && (
                <div className="mt-2 text-emerald-400 text-[11px] flex items-center gap-1.5 border-t border-slate-800 pt-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{t('trace.structuredOutput')}: RiskAssessmentSchema</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Official IMD disclaimer in chat */}
      <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
        <span>{t('chat.disclaimer')}</span>
      </div>
    </section>
  );
};
