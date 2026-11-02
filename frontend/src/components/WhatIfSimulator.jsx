import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sliders,
  Sun,
  Flame,
  Droplets,
  Wind,
  CloudRain,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { PageHeader, HeroDecisionCard, AgentGuidanceCard } from './PageTemplate';

export const WhatIfSimulator = ({ profile }) => {
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // Simulation Sliders State
  const [dryDays, setDryDays] = useState(3);
  const [tempIncrease, setTempIncrease] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Debounced API fetcher
  const runSimulation = useCallback(
    async (dry, temp) => {
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
      const simComposite =
        Object.keys(severityOrder).find((key) => severityOrder[key] === maxSev) || 'MODERATE';

      const explanation_en = `Under this hypothetical scenario (+${temp.toFixed(1)}°C heat, ${dry} dry day(s)) for ${profile.crop} (${profile.growth_stage} stage) in ${profile.district}: Overall hazard shifts to ${simComposite}. Heat risk is ${simHeat} and drought stress is ${simDrought}. Action Plan: Apply protective organic mulch to preserve root zone moisture, prioritize evening light irrigation, and avoid midday spray. Official IMD warnings take priority.`;
      const explanation_ta = `இந்த மாதிரி சூழல் ஆய்வில் (+${temp.toFixed(1)}°C கூடுதல் வெப்பம், ${dry} நாட்கள் வறட்சி) ${profile.district} மாவட்டத்தில் ${profile.growth_stage} பருவ ${profile.crop} பயிருக்கு: ஒட்டுமொத்த இடர் நிலை: ${simComposite}. வெப்ப இடர்: ${simHeat}, வறட்சி இடர்: ${simDrought}. பாதுகாப்பு நடவடிக்கை: வேர் ஈரப்பதத்தை பாதுகாக்க மூடாக்கு இடவும், மாலை வேளையில் குறைந்த நீர் பாய்ச்சவும், நண்பகல் தெளிப்பை தவிர்க்கவும். அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முன்னுரிமை.`;

      setSimResult({
        is_scenario: true,
        disclaimer_en: 'Scenario, not a forecast.',
        disclaimer_ta: 'இது ஒரு மாதிரி சூழல் ஆய்வு, அதிகாரப்பூர்வ முன்னறிவிப்பு அல்ல.',
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
        explanation_en,
        explanation_ta
      });
      setLoading(false);
    },
    [profile]
  );

  useEffect(() => {
    runSimulation(dryDays, tempIncrease);
  }, [dryDays, tempIncrease, runSimulation]);

  const handleReset = () => {
    setDryDays(0);
    setTempIncrease(0);
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800';
      case 'HIGH':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800';
      case 'MODERATE':
        return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      default:
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800';
    }
  };

  const compositeRisk = simResult?.simulated_risk?.composite || 'LOW';
  let heroAccent = 'emerald';
  if (compositeRisk === 'CRITICAL' || compositeRisk === 'HIGH') heroAccent = 'rose';
  else if (compositeRisk === 'MODERATE') heroAccent = 'amber';

  const explanation = lang === 'ta' ? simResult?.explanation_ta : simResult?.explanation_en;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title={t('whatif.title')}
        subtitle={`${t('whatif.subtitle')} • ${profile.district} (${t(`profile.crops.${profile.crop}`)})`}
        actionButton={
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'மீட்டமைக்க' : 'Reset Sliders'}</span>
          </button>
        }
      />

      {/* 2. Hero Decision Card for What If Scenario */}
      <HeroDecisionCard
        badge={t('whatif.disclaimer')}
        decision={`${t('whatif.overallShift')}: ${t(`risk.levels.${compositeRisk}`)}`}
        reason={
          lang === 'ta'
            ? `+${tempIncrease.toFixed(1)}°C கூடுதல் வெப்பம் மற்றும் ${dryDays} நாட்கள் வறட்சிக்கு கணிக்கப்பட்ட மாதிரி இடர் நிலை. வேர் ஈரப்பதம் காக்க மூடாக்கு இடவும்.`
            : `Projected scenario outcome with +${tempIncrease.toFixed(1)}°C heat and ${dryDays} days without rain. Increase field mulching and schedule night wetting.`
        }
        colorAccent={heroAccent}
        icon={compositeRisk === 'LOW' ? CheckCircle : AlertTriangle}
        extraDetails={
          <div className="bg-white/90 dark:bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 text-center shadow-xs">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">
              {lang === 'ta' ? 'மாதிரி அளவு' : 'Stress Parameters'}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              +{tempIncrease}°C • {dryDays}D
            </span>
          </div>
        }
      />

      {/* 3. 12-Column Grid Content: Sliders (6 cols) & Comparison Cards (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Parametric Sliders */}
        <section className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-6 theme-transition">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-agri-600 dark:text-agri-400" />
              <span>{lang === 'ta' ? 'மாதிரி அளவீடுகள்' : 'Scenario Controls'}</span>
            </h3>
            {loading && (
              <span className="text-xs font-bold text-agri-600 dark:text-agri-400 animate-pulse">
                {t('whatif.runSim')}
              </span>
            )}
          </div>

          {/* Slider 1: Dry Days (0 - 14) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>{t('whatif.sliderDry')}</span>
              </span>
              <span className="text-base font-black text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800">
                {dryDays} {lang === 'ta' ? 'நாட்கள்' : 'Days'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              step="1"
              value={dryDays}
              onChange={(e) => setDryDays(Number(e.target.value))}
              className="w-full accent-agri-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
              <span>0 {lang === 'ta' ? 'நாள்' : 'days'}</span>
              <span>7 {lang === 'ta' ? 'நாட்கள்' : 'days'}</span>
              <span>14 {lang === 'ta' ? 'நாட்கள்' : 'days'}</span>
            </div>
          </div>

          {/* Slider 2: Temperature Increase (+0 to +5°C) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>{t('whatif.sliderTemp')}</span>
              </span>
              <span className="text-base font-black text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800">
                +{tempIncrease.toFixed(1)}°C
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={tempIncrease}
              onChange={(e) => setTempIncrease(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
              <span>+0°C</span>
              <span>+2.5°C</span>
              <span>+5.0°C</span>
            </div>
          </div>
        </section>

        {/* Right Column (6 cols): Baseline vs Simulated Comparison */}
        <section className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4 theme-transition">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-agri-600 dark:text-agri-400" />
              <span>{lang === 'ta' ? 'இடர் ஒப்பீடு' : 'Risk Shift Comparison'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {lang === 'ta' ? 'துல்லிய விதிகள்' : 'Deterministic Engine'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Baseline */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                {t('whatif.baseline')}
              </span>
              <div className="space-y-1.5 font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">{t('risk.heat')}:</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {simResult?.baseline_risk?.heat || 'LOW'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">{t('risk.drought')}:</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {simResult?.baseline_risk?.drought || 'LOW'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-900 dark:text-white">{t('risk.compositeRisk')}:</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {simResult?.baseline_risk?.composite || 'LOW'}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Outcome */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                {t('whatif.simulated')}
              </span>
              <div className="space-y-1.5 font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">{t('risk.heat')}:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] border ${getRiskColor(
                      simResult?.simulated_risk?.heat || 'LOW'
                    )}`}
                  >
                    {simResult?.simulated_risk?.heat || 'LOW'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">{t('risk.drought')}:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] border ${getRiskColor(
                      simResult?.simulated_risk?.drought || 'LOW'
                    )}`}
                  >
                    {simResult?.simulated_risk?.drought || 'LOW'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-900 dark:text-white">{t('risk.compositeRisk')}:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] border ${getRiskColor(
                      simResult?.simulated_risk?.composite || 'LOW'
                    )}`}
                  >
                    {simResult?.simulated_risk?.composite || 'LOW'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Agent Guidance Card at Bottom with Voice Readout */}
      <AgentGuidanceCard
        title={t('whatif.actionPlan')}
        explanationText={explanation}
      />
    </div>
  );
};
