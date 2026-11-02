import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldAlert, Sprout, Cpu, CheckCircle2, CloudRain, Lock, Info } from 'lucide-react';

export const AboutView = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

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
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const features = [
    t('about.f1'),
    t('about.f2'),
    t('about.f3'),
    t('about.f4'),
    t('about.f5')
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-agri-600 text-white flex items-center justify-center shadow-md shadow-agri-200 dark:shadow-none">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('about.title')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {t('about.subtitle')}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-4">
          {t('about.missionDesc')}
        </p>
      </motion.div>

      {/* Safety & Deterministic Boundary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deterministic Boundary */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-agri-700 dark:text-agri-400 font-bold text-base">
            <Lock className="w-5 h-5 shrink-0" />
            <h3>{t('about.boundaryTitle')}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('about.boundaryDesc')}
          </p>
        </motion.div>

        {/* Official IMD Priority */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400 font-bold text-base">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h3>{t('about.officialTitle')}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('about.officialDesc')}
          </p>
        </motion.div>
      </div>

      {/* Core Features List */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-agri-600 dark:text-agri-400" />
          <span>{t('about.featuresTitle')}</span>
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-agri-600 dark:text-agri-400 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
};
