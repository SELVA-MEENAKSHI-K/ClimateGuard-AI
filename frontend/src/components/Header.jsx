import React from 'react';
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
  Building,
  Settings,
  Sun,
  Moon,
  Sparkles
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

  // Links for Farmer mode
  const farmerLinks = [
    { id: 'home', label: t('nav.home') || 'Home', icon: Home, isAction: false },
    { id: 'irrigation', label: t('nav.irrigation') || 'Irrigation Plan', icon: Droplets, isAction: false },
    { id: 'whatif', label: t('nav.whatif') || 'What If?', icon: Sliders, isAction: false },
    { id: 'chat', label: t('nav.askAgent') || 'Ask Agent', icon: MessageSquareText, isAction: false },
    { id: 'impact', label: t('nav.impact') || 'Impact', icon: History, isAction: false },
    { id: 'settings', label: t('nav.settings') || 'Settings', icon: Settings, isAction: true, onClick: onOpenSettings }
  ];

  // Links for Public mode
  const publicLinks = [
    { id: 'home', label: t('nav.home') || 'Home', icon: Home, isAction: false },
    { id: 'safety', label: t('nav.safetyPlan') || 'Safety Plan', icon: ShieldAlert, isAction: false },
    { id: 'nearby', label: t('nav.nearbyHelp') || 'Nearby Help', icon: Building, isAction: false },
    { id: 'chat', label: t('nav.askAgent') || 'Ask Agent', icon: MessageSquareText, isAction: false },
    { id: 'settings', label: t('nav.settings') || 'Settings', icon: Settings, isAction: true, onClick: onOpenSettings }
  ];

  const currentNavItems = persona === 'farmer' ? farmerLinks : publicLinks;

  const handleNavClick = (item) => {
    if (item.isAction && item.onClick) {
      item.onClick();
    } else {
      setActiveTab(item.id);
    }
  };

  return (
    <>
      {/* Sticky Glass Navbar (Desktop + Tablet) */}
      <header className="w-full sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs theme-transition">
        {/* Official IMD Priority Banner */}
        <div className="bg-amber-600 dark:bg-amber-700 text-white px-3 py-1.5 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-inner overflow-hidden w-full">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <span className="truncate text-center text-[11px] sm:text-xs">{t('app.imdPriorityBanner')}</span>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Brand Logo & Name */}
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 cursor-pointer select-none min-w-0 shrink-0 mr-1"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-agri-600 dark:bg-agri-700 text-white flex items-center justify-center shadow-md shadow-agri-200 dark:shadow-none transition-transform hover:scale-105 active:scale-95 shrink-0">
                <Sprout className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                  {t('app.title')}
                </h1>
                <span className="text-[10px] font-bold text-agri-700 dark:text-agri-400 block -mt-0.5">
                  {persona === 'farmer' ? (lang === 'ta' ? 'விவசாயி பயன்முறை' : 'Farmer Mode') : (lang === 'ta' ? 'பொதுமக்கள் பயன்முறை' : 'Public Safety')}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links (Sticky Glass Style) */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/70 dark:border-slate-750/70">
              {currentNavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id && !item.isAction;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all select-none whitespace-nowrap ${
                      isActive
                        ? 'bg-agri-600 dark:bg-agri-600 text-white shadow-sm shadow-agri-600/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Controls Right: Provider Badge, Dark Mode, Language Switcher */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Provider Badge */}
              <div
                title={isMockMode ? t('app.mockModeNotice') : t('app.liveModeNotice')}
                className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                  !isMockMode
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${!isMockMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="truncate max-w-[130px]">
                  {!isMockMode ? t('provider.live') : t('provider.mock')}
                </span>
              </div>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors shadow-xs shrink-0"
                aria-label={t('theme.toggle')}
                title={isDark ? t('theme.light') : t('theme.dark')}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                )}
              </button>

              {/* Bilingual Language Switcher (Big Tap Target) */}
              <button
                type="button"
                onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs shrink-0"
                aria-label="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-agri-600 dark:text-agri-400 shrink-0" />
                <span className="text-[11px] font-bold">{lang === 'ta' ? 'EN' : 'தமிழ்'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (Big Tap Targets >= 48px, Icons & Labels) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 py-1 shadow-2xl items-center justify-items-stretch w-full grid ${
          persona === 'farmer' ? 'grid-cols-6' : 'grid-cols-5'
        }`}
        aria-label="Mobile Navigation"
      >
        {currentNavItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id && !item.isAction;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
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
              <span className="text-[9px] sm:text-[10px] leading-tight truncate max-w-[55px] text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
