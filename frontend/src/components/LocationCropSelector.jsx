import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { MapPin, Sprout, Clock } from 'lucide-react';

const DISTRICTS = [
  'Madurai',
  'Thanjavur',
  'Coimbatore',
  'Tirunelveli',
  'Salem',
  'Cuddalore',
  'Nagapattinam',
  'Tiruvannamalai',
  'Dharmapuri',
  'Theni',
  'Tiruchirappalli',
  'Ramanathapuram'
];

const CROPS = [
  'paddy',
  'banana',
  'groundnut',
  'sugarcane',
  'cotton',
  'maize',
  'millets',
  'vegetables',
  'coconut'
];

const STAGES = [
  'sowing',
  'vegetative',
  'flowering',
  'harvest'
];

export const LocationCropSelector = ({ profile, onChangeProfile, onRefresh, loading }) => {
  const { t } = useTranslation();

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-5 theme-transition">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Sprout className="w-5 h-5 text-agri-600 dark:text-agri-400 shrink-0" />
          <span>{t('profile.title')}</span>
        </h2>
        {loading && (
          <span className="text-[11px] font-semibold text-agri-700 dark:text-agri-300 bg-agri-50 dark:bg-agri-950/60 px-2.5 py-0.5 rounded-full animate-pulse border border-agri-200 dark:border-agri-800 truncate max-w-[200px] sm:max-w-none">
            {t('chat.thinking')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* District Selector */}
        <div>
          <label htmlFor="district-select" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{t('profile.district')}</span>
          </label>
          <select
            id="district-select"
            value={profile.district}
            onChange={(e) => onChangeProfile({ ...profile, district: e.target.value })}
            className="touch-target w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-agri-500 focus:outline-none transition-colors"
          >
            {DISTRICTS.map((dist) => (
              <option key={dist} value={dist}>
                {t(`profile.districts.${dist}`) || dist}
              </option>
            ))}
          </select>
        </div>

        {/* Crop Selector */}
        <div>
          <label htmlFor="crop-select" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{t('profile.crop')}</span>
          </label>
          <select
            id="crop-select"
            value={profile.crop}
            onChange={(e) => onChangeProfile({ ...profile, crop: e.target.value })}
            className="touch-target w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-agri-500 focus:outline-none transition-colors"
          >
            {CROPS.map((cropKey) => (
              <option key={cropKey} value={cropKey}>
                {t(`profile.crops.${cropKey}`) || cropKey}
              </option>
            ))}
          </select>
        </div>

        {/* Growth Stage Selector */}
        <div>
          <label htmlFor="stage-select" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{t('profile.stage')}</span>
          </label>
          <select
            id="stage-select"
            value={profile.growth_stage}
            onChange={(e) => onChangeProfile({ ...profile, growth_stage: e.target.value })}
            className="touch-target w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-agri-500 focus:outline-none transition-colors"
          >
            {STAGES.map((stg) => (
              <option key={stg} value={stg}>
                {t(`profile.stages.${stg}`) || stg}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};
