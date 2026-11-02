import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sliders,
  AlertTriangle,
  Sun,
  CloudRain,
  Flame,
  Droplets,
  Wind,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  TrendingUp,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CountUp } from './CountUp';

export const WhatIfSimulator = ({ profile }) => {
  const { t, lang, tamilVoiceAvailable, isPlayingAudio, speakText, stopSpeech } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // Simulation Sliders State
  const [dryDays, setDryDays] = useState(3);
  const [tempIncrease, setTempIncrease] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Debounced API fetcher
  const runSimulation = useCallback(async (dry, temp) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/whatif?district=${profile.district}&crop=${profile.crop}&growth_stage=${profile.growth_stage}&dry_days_added=${dry}&temp_increase=${temp}`
      );
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Backend whatif endpoint offline, using local deterministic fallback', e);
    }

    // Local deterministic fallback engine
    const baseHeat = 'LOW';
    const baseDrought = 'LOW';
    const baseRain = 'LOW';
    const baseComposite = 'LOW';

    let simHeat = 'LOW';
    if (temp >= 3.0) simHeat = 'CRITICAL';
    else if (temp >= 1.5) simHeat = 'HIGH';
    else if (temp > 0.5) simHeat = 'MODERATE';

    let simDrought = 'LOW';
    if (dry >= 10) simDrought = 'CRITICAL';
    else if (dry >= 6) simDrought = 'HIGH';
    else if (dry >= 3) simDrought = 'MODERATE';

    const severityOrder = { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 };
    const maxSev = Math.max(severityOrder[simHeat], severityOrder[simDrought]);
    const simComposite = Object.keys(severityOrder).find(key => severityOrder[key] === maxSev) || 'MODERATE';

    const explanation_en = `Under this hypothetical scenario (+${temp.toFixed(1)}°C heat, ${dry} dry day(s)) for ${profile.crop} (${profile.growth_stage} stage) in ${profile.district}: Overall hazard shifts to ${simComposite}. Heat risk is ${simHeat} and drought stress is ${simDrought}. Action Plan: Apply protective organic mulch to preserve root zone moisture, prioritize evening light irrigation, and avoid midday spray. Official IMD warnings take priority.`;
    const explanation_ta = `இந்த மாதிரி சூழல் ஆய்வில் (+${temp.toFixed(1)}°C கூடுதல் வெப்பம், ${dry} நாட்கள் வறட்சி) ${profile.district} மாவட்டத்தில் ${profile.growth_stage} பருவ ${profile.crop} பயிருக்கு: ஒட்டுமொத்த இடர் நிலை: ${simComposite}. வெப்ப இடர்: ${simHeat}, வறட்சி இடர்: ${simDrought}. பாதுகாப்பு நடவடிக்கை: வேர் ஈரப்பதத்தை பாதுகாக்க மூடாக்கு இடவும், மாலை வேளையில் குறைந்த நீர் பாய்ச்சவும், நண்பகல் தெளிப்பை தவிர்க்கவும். அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முன்னுரிமை.`;

    setSimResult({
      is_scenario: true,
      disclaimer_en: 'Scenario, not a forecast.',
      disclaimer_ta: 'இது ஒரு மாதிரி சூழல் ஆய்வு (Scenario), உண்மையான வானிலை முன்னறிவிப்பு அல்ல.',
      params: {
        district: profile.district,
        crop: profile.crop,
        growth_stage: profile.growth_stage,
        dry_days_added: dry,
        temp_increase: temp
      },
      baseline_risk: {
        composite: baseComposite,
        heat: baseHeat,
        drought: baseDrought,
        rain: baseRain,
        wind: 'LOW',
        temp_max: 34.0,
        consecutive_dry_days: 1
      },
      simulated_risk: {
        composite: simComposite,
        heat: simHeat,
        drought: simDrought,
        rain: 'LOW',
        wind: 'LOW',
        temp_max: 34.0 + temp,
        consecutive_dry_days: 1 + dry
      },
      checklist: [
        { task: 'Apply paddy straw / organic mulch to reduce soil evaporative loss', urgency: 'high', hours: 24 },
        { task: 'Schedule light furrow wetting strictly between 5:30 PM and 7:00 PM', urgency: 'medium', hours: 12 },
        { task: 'Withhold nitrogen fertilizer topdressing until stress subsides', urgency: 'high', hours: 48 }
      ],
      explanation_en,
      explanation_ta
    });
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation(dryDays, tempIncrease);
    }, 250);
    return () => clearTimeout(timer);
  }, [dryDays, tempIncrease, runSimulation]);

  const explanation = lang === 'ta' ? simResult?.explanation_ta : simResult?.explanation_en;

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
      case 'HIGH':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
      case 'MODERATE':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/60 border-yellow-200 dark:border-yellow-800';
      default:
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Mandatory Scenario Disclaimer */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900 border-2 border-dashed border-amber-400 dark:border-amber-600/70 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('whatif.disclaimer')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('whatif.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {t('whatif.subtitle')}
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-2 self-start sm:self-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Deterministic Agro-Engine</span>
          </div>
        </div>

        {/* Tamil & English prominent disclaimer quote */}
        <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <span className="font-bold underline decoration-amber-500">
            {lang === 'ta'
              ? 'முக்கிய குறிப்பு: இது மாதிரி சூழல் ஆய்வு (Scenario), உண்மையான வானிலை முன்னறிவிப்பு அல்ல.'
              : 'Official Notice: Scenario analysis for stress testing, NOT an official weather forecast.'}
          </span>
          <span className="hidden sm:inline opacity-75">• Official IMD warnings take priority.</span>
        </div>
      </div>

      {/* 2. Interactive Sliders Control Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Agro-Climatic Stress Parameters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust sliders to model climate shocks on {profile.crop} ({profile.growth_stage} stage) in {profile.district}
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t('whatif.runSim')}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slider 1: Dry Days Added (0 to 14) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-sky-500" />
                <span>{t('whatif.sliderDry')}</span>
              </label>
              <span className="text-base font-black px-3 py-1 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300">
                +{dryDays} {lang === 'ta' ? 'நாட்கள்' : 'days'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              step="1"
              value={dryDays}
              onChange={(e) => setDryDays(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
            />
            <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2">
              <span>0 days (Normal)</span>
              <span>7 days (Dry spell)</span>
              <span>14 days (Drought)</span>
            </div>
          </div>

          {/* Slider 2: Temperature Increase (0.0 to 5.0 °C) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t('whatif.sliderTemp')}</span>
              </label>
              <span className="text-base font-black px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                +{tempIncrease.toFixed(1)}°C
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={tempIncrease}
              onChange={(e) => setTempIncrease(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none"
            />
            <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2">
              <span>+0.0°C (Current)</span>
              <span>+2.5°C (Moderate Heat)</span>
              <span>+5.0°C (Severe Heatwave)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Comparison Cards: Baseline vs Simulated Scenario */}
      {simResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Baseline Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('whatif.baseline')}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                Open-Meteo Current
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  {t('whatif.heatShift')}
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${getRiskColor(simResult.baseline_risk.heat)}`}>
                  {simResult.baseline_risk.heat}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-amber-500" />
                  {t('whatif.droughtShift')}
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${getRiskColor(simResult.baseline_risk.drought)}`}>
                  {simResult.baseline_risk.drought}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                  {t('whatif.overallShift')}
                </span>
                <span className={`text-xs font-black px-3 py-1 rounded-lg border ${getRiskColor(simResult.baseline_risk.composite)}`}>
                  {simResult.baseline_risk.composite}
                </span>
              </div>
            </div>
          </div>

          {/* Simulated Scenario Card */}
          <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/10 dark:from-slate-900 dark:to-amber-950/20 rounded-3xl p-5 shadow-sm border-2 border-amber-400 dark:border-amber-600/70">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-200/50 dark:border-amber-800/50">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                {t('whatif.simulated')}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 font-bold text-amber-900 dark:text-amber-200">
                Scenario Result
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-slate-850/80 border border-amber-200/50 dark:border-amber-800/50">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  {t('whatif.heatShift')}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${getRiskColor(simResult.simulated_risk.heat)}`}>
                    {simResult.simulated_risk.heat}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-slate-850/80 border border-amber-200/50 dark:border-amber-800/50">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-amber-500" />
                  {t('whatif.droughtShift')}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${getRiskColor(simResult.simulated_risk.drought)}`}>
                    {simResult.simulated_risk.drought}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-slate-850/80 border border-amber-200/50 dark:border-amber-800/50">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  {t('whatif.overallShift')}
                </span>
                <span className={`text-xs font-black px-3 py-1 rounded-lg border ${getRiskColor(simResult.simulated_risk.composite)}`}>
                  {simResult.simulated_risk.composite}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Agent Adaptive Action Plan & Speech Synthesis */}
      {simResult && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-agri-100 dark:bg-agri-950/60 text-agri-700 dark:text-agri-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  {t('whatif.actionPlan')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Strands Agent recommended proactive steps to counter this scenario
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => isPlayingAudio ? stopSpeech() : speakText(explanation)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isPlayingAudio
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                  : 'bg-agri-50 text-agri-800 border-agri-200 dark:bg-agri-950/60 dark:text-agri-300 hover:bg-agri-100'
              }`}
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
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-750 font-medium">
            {explanation}
          </p>

          {/* Actionable scenario checklist */}
          {simResult.checklist && simResult.checklist.length > 0 && (
            <div className="mt-5 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Scenario Defensive Action Checklist:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {simResult.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-agri-600 dark:text-agri-400 mt-0.5 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {typeof item === 'string' ? item : item.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
