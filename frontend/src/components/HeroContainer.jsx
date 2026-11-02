import React, { Suspense, useState, useEffect } from 'react';
import { HeroIllustrationFallback } from './HeroIllustrationFallback';
import { useTranslation } from '../context/LanguageContext';
import { Sparkles, Eye } from 'lucide-react';

const LazyHero3DScene = React.lazy(() => import('./Hero3DScene'));

function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

export const HeroContainer = ({ riskData }) => {
  const { t } = useTranslation();
  const [canRender3D, setCanRender3D] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(false);

  useEffect(() => {
    const webglSupported = checkWebGLSupport();
    setHasWebGL(webglSupported);

    const checkDimensions = () => {
      // User rule: show 3D scene only on screens wider than 1024px and when WebGL is available
      const isDesktop = window.innerWidth >= 1024;
      setCanRender3D(isDesktop && webglSupported);
    };

    checkDimensions();
    window.addEventListener('resize', checkDimensions);
    return () => window.removeEventListener('resize', checkDimensions);
  }, []);

  // Determine top hazard from risk metrics
  const getTopHazard = () => {
    if (!riskData) return 'favorable';
    const { rain_risk, heat_risk, drought_risk, wind_risk, composite_risk } = riskData;

    if (rain_risk === 'CRITICAL' || rain_risk === 'HIGH') return 'rain';
    if (heat_risk === 'CRITICAL' || heat_risk === 'HIGH') return 'heat';
    if (drought_risk === 'CRITICAL' || drought_risk === 'HIGH') return 'drought';
    if (wind_risk === 'CRITICAL' || wind_risk === 'HIGH') return 'wind';

    if (composite_risk === 'MODERATE') {
      if (heat_risk === 'MODERATE') return 'heat';
      if (rain_risk === 'MODERATE') return 'rain';
      if (drought_risk === 'MODERATE') return 'drought';
      if (wind_risk === 'MODERATE') return 'wind';
    }

    return 'favorable';
  };

  const topHazard = getTopHazard();

  if (!canRender3D) {
    return (
      <div className="mb-5">
        <HeroIllustrationFallback topHazard={topHazard} />
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-agri-600 dark:text-agri-400" />
            <span>{t('hero3d.title')}</span>
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          <span>{t('hero3d.interactiveHint')}</span>
        </span>
      </div>

      <Suspense fallback={<HeroIllustrationFallback topHazard={topHazard} />}>
        <LazyHero3DScene topHazard={topHazard} />
      </Suspense>
    </div>
  );
};
