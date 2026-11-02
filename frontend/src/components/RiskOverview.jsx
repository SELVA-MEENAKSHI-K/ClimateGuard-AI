import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Flame, CloudRain, Sun, Wind } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { CountUp } from './CountUp';

export const RiskOverview = ({ riskData }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  if (!riskData) return null;

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200',
          badge: 'bg-rose-600 text-white',
          border: 'border-rose-400 dark:border-rose-800',
          iconColor: 'text-rose-600 dark:text-rose-400',
          gaugePercent: 100,
          gaugeColor: 'bg-rose-600'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
          badge: 'bg-amber-600 text-white',
          border: 'border-amber-400 dark:border-amber-800',
          iconColor: 'text-amber-600 dark:text-amber-400',
          gaugePercent: 75,
          gaugeColor: 'bg-amber-500'
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900 text-yellow-900 dark:text-yellow-200',
          badge: 'bg-yellow-500 text-white',
          border: 'border-yellow-300 dark:border-yellow-800',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          gaugePercent: 50,
          gaugeColor: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200',
          badge: 'bg-emerald-600 text-white',
          border: 'border-emerald-300 dark:border-emerald-800',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          gaugePercent: 25,
          gaugeColor: 'bg-emerald-500'
        };
    }
  };

  const compositeStyles = getRiskColor(riskData.composite_risk);

  const getConfidenceStyle = (level) => {
    switch (level) {
      case 'LOW':
        return {
          badge: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          dot: 'bg-rose-500'
        };
      case 'MEDIUM':
        return {
          badge: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          dot: 'bg-amber-500'
        };
      default:
        return {
          badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500'
        };
    }
  };

  const riskCards = [
    {
      key: 'heat',
      title: t('risk.heat'),
      level: riskData.heat_risk,
      confidence: riskData.confidence?.heat || 'HIGH',
      numValue: riskData.metrics?.temp_max ?? 0,
      decimals: 1,
      suffix: '°C',
      desc: t(`risk.heatDescs.${riskData.heat_risk || 'LOW'}`),
      icon: Flame,
    },
    {
      key: 'heavyRain',
      title: t('risk.heavyRain'),
      level: riskData.rain_risk,
      confidence: riskData.confidence?.rain || 'HIGH',
      numValue: riskData.metrics?.precipitation_sum ?? 0,
      decimals: 1,
      suffix: ' mm',
      desc: t(`risk.rainDescs.${riskData.rain_risk || 'LOW'}`),
      icon: CloudRain,
    },
    {
      key: 'drought',
      title: t('risk.drought'),
      level: riskData.drought_risk,
      confidence: riskData.confidence?.drought || 'HIGH',
      numValue: riskData.metrics?.consecutive_dry_days ?? 0,
      decimals: 0,
      suffix: ` ${t('proof.day')}s`,
      desc: t(`risk.droughtDescs.${riskData.drought_risk || 'LOW'}`),
      icon: Sun,
    },
    {
      key: 'wind',
      title: t('risk.wind'),
      level: riskData.wind_risk,
      confidence: riskData.confidence?.wind || 'HIGH',
      numValue: riskData.metrics?.wind_speed_max ?? 0,
      decimals: 1,
      suffix: ' km/h',
      desc: t(`risk.windDescs.${riskData.wind_risk || 'LOW'}`),
      icon: Wind,
    },
  ];

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-5 theme-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
            <span>{t('risk.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t('risk.ruleNote')}
          </p>
        </div>

        {/* Composite Hazard Status & Gauge */}
        <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
          <div className={`inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sm ${compositeStyles.bg} ${compositeStyles.border} max-w-full`}>
            <span className="truncate">{t('risk.compositeRisk')}:</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-extrabold uppercase shrink-0 ${compositeStyles.badge}`}>
              {t(`risk.levels.${riskData.composite_risk || 'LOW'}`)}
            </span>
          </div>

          {/* Animated Gauge Fill Bar */}
          <div className="w-full sm:w-44 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex border border-slate-200/60 dark:border-slate-700">
            <motion.div
              className={`h-full rounded-full ${compositeStyles.gaugeColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${compositeStyles.gaugePercent}%` }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 50, damping: 14 }
              }
            />
          </div>
        </div>
      </div>

      {/* 4 Deterministic Risk Cards with 3D Tilt & Count-Up Numbers */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
      >
        {riskCards.map((card) => {
          const styles = getRiskColor(card.level);
          const confStyles = getConfidenceStyle(card.confidence);
          const IconComponent = card.icon;

          return (
            <motion.div key={card.key} variants={itemVariants}>
              <TiltCard
                className={`rounded-xl border p-4 flex flex-col justify-between h-full shadow-sm ${styles.bg} ${styles.border}`}
                maxTilt={7}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate min-w-0">
                      <IconComponent className={`w-4 h-4 ${styles.iconColor} shrink-0`} />
                      <span className="truncate">{card.title}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0 whitespace-nowrap ${styles.badge}`}>
                      {t(`risk.levels.${card.level || 'LOW'}`)}
                    </span>
                  </div>

                  {/* Animated Count-up Metric */}
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                    <CountUp
                      value={card.numValue}
                      decimals={card.decimals}
                      suffix={card.suffix}
                      duration={0.9}
                    />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {card.desc}
                  </p>
                </div>

                {/* Forecast Confidence per Hazard */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {t('risk.confidenceTitle')}:
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] border shadow-xs ${confStyles.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${confStyles.dot}`} />
                      {t(`risk.confidence.${card.confidence}`) || `${card.confidence} Confidence`}
                    </span>
                  </div>

                  {/* Low Confidence Warning */}
                  {card.confidence === 'LOW' && (
                    <div className="p-2 rounded-lg bg-rose-100/90 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-[11px] font-semibold flex items-start gap-1.5 leading-snug">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <span>{t('risk.confidence.disagreeAlert') || 'Models disagree, check official IMD alert'}</span>
                    </div>
                  )}
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
