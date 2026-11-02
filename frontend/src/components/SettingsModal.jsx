import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useMotion } from '../context/MotionContext';
import { X, Globe, MapPin, Sprout, Clock, Sun, Moon, Users, Check, Sparkles } from 'lucide-react';

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

export const SettingsModal = ({
  isOpen,
  onClose,
  profile,
  onChangeProfile,
  persona,
  onChangePersona
}) => {
  const { lang, setLang, t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { reduceMotion, toggleReduceMotion } = useMotion();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div>
            <h2 id="settings-title" className="text-lg font-black text-slate-900 dark:text-white">
              {t('settings.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {t('settings.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Persona Switcher: Farmer vs General Public */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-agri-600 dark:text-agri-400" />
              <span>{t('settings.persona')}</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onChangePersona('farmer')}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  persona === 'farmer'
                    ? 'bg-agri-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sprout className="w-4 h-4" />
                <span>{t('persona.farmer')}</span>
              </button>

              <button
                type="button"
                onClick={() => onChangePersona('public')}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  persona === 'public'
                    ? 'bg-agri-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t('persona.public')}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 px-1">
              {persona === 'farmer' ? t('persona.farmerDesc') : t('persona.publicDesc')}
            </p>
          </div>

          {/* Language Switcher */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{t('settings.language')}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLang('ta')}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  lang === 'ta'
                    ? 'bg-agri-50 dark:bg-agri-950/60 border-agri-500 text-agri-900 dark:text-agri-200 ring-2 ring-agri-400/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>தமிழ் (Tamil)</span>
                {lang === 'ta' && <Check className="w-4 h-4 text-agri-600" />}
              </button>

              <button
                type="button"
                onClick={() => setLang('en')}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  lang === 'en'
                    ? 'bg-agri-50 dark:bg-agri-950/60 border-agri-500 text-agri-900 dark:text-agri-200 ring-2 ring-agri-400/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>English</span>
                {lang === 'en' && <Check className="w-4 h-4 text-agri-600" />}
              </button>
            </div>
          </div>

          {/* District Selector */}
          <div>
            <label htmlFor="settings-district" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{t('settings.district')}</span>
            </label>
            <select
              id="settings-district"
              value={profile.district}
              onChange={(e) => onChangeProfile({ ...profile, district: e.target.value })}
              className="touch-target w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-agri-500 outline-none"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {t(`profile.districts.${d}`) || d}
                </option>
              ))}
            </select>
          </div>

          {/* Farmer-Specific Settings (Crop & Stage) */}
          {persona === 'farmer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="settings-crop" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <span>{t('settings.crop')}</span>
                </label>
                <select
                  id="settings-crop"
                  value={profile.crop}
                  onChange={(e) => onChangeProfile({ ...profile, crop: e.target.value })}
                  className="touch-target w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-agri-500 outline-none"
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c}>
                      {t(`profile.crops.${c}`) || c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="settings-stage" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{t('settings.stage')}</span>
                </label>
                <select
                  id="settings-stage"
                  value={profile.growth_stage}
                  onChange={(e) => onChangeProfile({ ...profile, growth_stage: e.target.value })}
                  className="touch-target w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-agri-500 outline-none"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {t(`profile.stages.${s}`) || s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Theme Mode Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{t('settings.theme')}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => isDark && toggleTheme()}
                className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  !isDark
                    ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t('theme.light')}</span>
              </button>

              <button
                type="button"
                onClick={() => !isDark && toggleTheme()}
                className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-white ring-2 ring-slate-500/40'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4 text-amber-400" />
                <span>{t('theme.dark')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="touch-target px-5 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-sm font-bold shadow-md shadow-agri-600/30 transition-all active:scale-95"
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
