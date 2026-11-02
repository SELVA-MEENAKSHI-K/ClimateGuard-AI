import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldAlert,
  Globe,
  Sprout,
  Home,
  Droplets,
  Sliders,
  MessageSquareText,
  History,
  Settings,
  Sun,
  Moon,
  X
} from 'lucide-react';

export const Header = ({
  activeTab,
  setActiveTab,
  persona = 'farmer',
  onOpenSettings,
  isMockMode = false
}) => {
  const { lang, setLang, t } = useTranslation();
  const { toggleTheme, isDark } = useTheme();
  const [showImdBanner, setShowImdBanner] = useState(true);

  // Exactly 5 main navigation links (Max 2 words in Tamil)
  const navLinks = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'irrigation', label: t('nav.irrigation'), icon: Droplets },
    { id: 'whatif', label: t('nav.whatif'), icon: Sliders },
    { id: 'chat', label: t('nav.askAgent'), icon: MessageSquareText },
    { id: 'impact', label: t('nav.impact'), icon: History }
  ];

  return (
    <>
      {/* Slim Dismissible IMD Priority Strip (Optional, can be dismissed) */}
      {showImdBanner && (
        <div className="bg-amber-600 dark:bg-amber-700 text-white px-3 py-1 text-xs font-semibold tracking-wide flex items-center justify-between shadow-inner w-full">
          <div className="flex items-center gap-1.5 mx-auto truncate text-[11px] sm:text-xs">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span className="truncate">{t('app.imdPriorityBanner')}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowImdBanner(false)}
            className="p-1 hover:bg-amber-700/80 rounded transition-colors text-amber-100 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sticky Glass Navbar */}
      <header className="w-full sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs theme-transition">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Brand Logo + App Name */}
            <div
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-2 cursor-pointer select-none min-w-0 shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-agri-600 dark:bg-agri-600 text-white flex items-center justify-center shadow-md shadow-agri-200 dark:shadow-none transition-transform hover:scale-105 active:scale-95 shrink-0">
                <Sprout className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                  {t('app.title')}
                </h1>
                <span className="text-[10px] font-bold text-agri-700 dark:text-agri-400 block -mt-0.5 truncate">
                  {t('persona.farmer')}
                </span>
              </div>
            </div>

            {/* Middle: Max 5 links (Desktop & Tablet) */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shrink-0">
              {navLinks.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all select-none whitespace-nowrap ${
                      isActive
                        ? 'bg-agri-600 dark:bg-agri-600 text-white shadow-sm shadow-agri-600/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: ONLY small icon buttons + compact provider pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Compact Provider Badge Pill */}
              <div
                title={isMockMode ? t('provider.mockLong') : t('provider.liveLong')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-bold select-none ${
                  !isMockMode
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isMockMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{!isMockMode ? t('provider.live') : t('provider.mock')}</span>
              </div>

              {/* Settings (Gear Icon) */}
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors shadow-xs shrink-0"
                aria-label={t('settings.title')}
                title={t('settings.title')}
              >
                <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors shadow-xs shrink-0"
                aria-label={t('theme.toggle')}
                title={isDark ? t('theme.light') : t('theme.dark')}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                )}
              </button>

              {/* Bilingual Language Switcher (Compact Button) */}
              <button
                type="button"
                onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
                className="h-8 sm:h-9 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs shrink-0"
                aria-label="Switch Language"
                title={lang === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
              >
                <Globe className="w-3.5 h-3.5 text-agri-600 dark:text-agri-400 shrink-0" />
                <span className="text-[11px] font-bold">{lang === 'ta' ? 'EN' : 'தமிழ்'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar with exactly 5 icons */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 py-1 shadow-2xl w-full grid grid-cols-5 items-center justify-items-stretch"
        aria-label="Mobile Navigation"
      >
        {navLinks.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[50px] flex flex-col items-center justify-center gap-0.5 px-0.5 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-agri-600 dark:text-agri-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive
                    ? 'bg-agri-100 dark:bg-agri-950/70 scale-105'
                    : 'bg-transparent'
                }`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[9px] leading-tight truncate max-w-[60px] text-center font-bold">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
