import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import { Cloud, Droplets, Thermometer, Wind, Umbrella, Waves } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { CountUp } from './CountUp';

export const WeatherSummary = ({ weatherData }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  if (!weatherData || !weatherData.current) return null;

  const current = weatherData.current;
  const daily = weatherData.daily || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-5 theme-transition">
      <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        <span>{t('weather.currentTitle')}</span>
      </h2>

      {/* Current Metrics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-5"
      >
        {/* Temp */}
        <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('weather.temp')}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            <CountUp value={current.temperature_2m} decimals={1} suffix="°C" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t('weather.feelsLike')} {current.apparent_temperature}°C
          </div>
        </motion.div>

        {/* Humidity */}
        <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            <span>{t('weather.humidity')}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            <CountUp value={current.relative_humidity_2m} decimals={0} suffix="%" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {current.relative_humidity_2m > 80 ? t('weather.highHumidity') : t('weather.normalHumidity')}
          </div>
        </motion.div>

        {/* Rain Probability */}
        <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <Umbrella className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t('weather.rainProb')}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            <CountUp value={daily.precipitation_probability_max?.[0] ?? 0} decimals={0} suffix="%" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t('weather.rainAmount')} {daily.precipitation_sum?.[0] ?? 0} mm
          </div>
        </motion.div>

        {/* Wind */}
        <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <Wind className="w-3.5 h-3.5 text-teal-500" />
            <span>{t('weather.wind')}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            <CountUp value={current.wind_speed_10m} decimals={1} />{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">km/h</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t('weather.max')} {daily.wind_speed_10m_max?.[0] ?? current.wind_speed_10m} km/h
          </div>
        </motion.div>

        {/* Evapotranspiration */}
        <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <Waves className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('weather.evapo')}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            <CountUp value={daily.et0_fao_evapotranspiration?.[0] ?? 4.0} decimals={1} />{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t('weather.faoEt0')}
          </div>
        </motion.div>

        {/* Today's Range */}
        <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <Thermometer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('weather.today')}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {daily.temperature_2m_max?.[0] ?? '--'}° / {daily.temperature_2m_min?.[0] ?? '--'}°
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t('weather.high')} / {t('weather.low')}
          </div>
        </motion.div>
      </motion.div>

      {/* 7-Day Forecast Strip with CSS 3D Tilt Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
          {t('weather.sevenDayForecast')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {daily.time?.map((dateStr, idx) => {
            const isToday = idx === 0;
            const rainSum = daily.precipitation_sum?.[idx] ?? 0;
            const rainProb = daily.precipitation_probability_max?.[idx] ?? 0;
            const maxTemp = daily.temperature_2m_max?.[idx] ?? '--';
            const minTemp = daily.temperature_2m_min?.[idx] ?? '--';

            return (
              <TiltCard
                key={dateStr}
                maxTilt={6}
                className={`rounded-xl p-2.5 text-center border text-xs shadow-xs ${
                  isToday
                    ? 'bg-agri-50 dark:bg-agri-950/40 border-agri-200 dark:border-agri-800 text-agri-950 dark:text-agri-200 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  {isToday ? t('weather.today') : idx === 1 ? t('weather.tomorrow') : dateStr.slice(5)}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {maxTemp}° <span className="text-slate-400 dark:text-slate-500 font-normal">/ {minTemp}°</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-sky-700 dark:text-sky-400">
                  <Cloud className="w-3 h-3 shrink-0" />
                  <span>{rainSum} mm ({rainProb}%)</span>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};
