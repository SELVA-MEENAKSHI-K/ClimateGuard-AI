import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * WeatherScene: Reusable flat-vector illustrated landscape scene
 * Layers (inline SVG only):
 *  1. Gradient sky (changes per hazard: low | heat | rain | drought | wind, and time: day | dusk)
 *  2. Sun or clouds & atmospheric effects (shimmer, rain streaks, dust, drifting clouds)
 *  3. Distant layered hills (Western Ghats silhouettes)
 *  4. Stylized Tamil Nadu landscape:
 *     - Paddy field rows (with water reflections in rain, cracks in drought)
 *     - Coconut palms (swaying fronds)
 *     - Banana plants (broad leaves)
 *     - Small temple Gopuram silhouette on the distant horizon
 *  5. Foreground plants (paddy blades, tropical foliage framing)
 */
export const WeatherScene = ({
  hazard = 'low', // 'low' | 'heat' | 'rain' | 'drought' | 'wind'
  time = 'day',   // 'day' | 'dusk'
  className = ''
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Pause animations when the browser tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const normalizedHazard = (hazard || 'low').toLowerCase();

  // Palette definitions per hazard & time
  const palettes = {
    low: {
      day: {
        skyTop: '#FDA4AF',      // Rose dawn
        skyMid: '#FDBA74',      // Soft apricot
        skyBottom: '#FEF08A',   // Warm golden horizon
        sunColor: '#FEF08A',
        sunGlow: 'rgba(254, 240, 138, 0.35)',
        hillBack: '#93C5FD',    // Misty distant blue
        hillMid: '#60A5FA',
        fieldBack: '#22C55E',   // Fresh paddy green
        fieldMid: '#16A34A',
        fieldFront: '#15803D',
        gopuramColor: '#3B82F6',
        palmTrunk: '#78350F',
        palmFrond: '#166534',
        bananaColor: '#15803D'
      },
      dusk: {
        skyTop: '#F43F5E',
        skyMid: '#C084FC',
        skyBottom: '#FDE047',
        sunColor: '#FDE047',
        sunGlow: 'rgba(253, 224, 71, 0.4)',
        hillBack: '#6366F1',
        hillMid: '#4F46E5',
        fieldBack: '#15803D',
        fieldMid: '#166534',
        fieldFront: '#14532D',
        gopuramColor: '#4338CA',
        palmTrunk: '#451A03',
        palmFrond: '#14532D',
        bananaColor: '#166534'
      }
    },
    heat: {
      day: {
        skyTop: '#DC2626',      // Crimson heat
        skyMid: '#EA580C',      // Burning orange
        skyBottom: '#FDE047',   // Blazing solar yellow
        sunColor: '#FEF08A',
        sunGlow: 'rgba(249, 115, 22, 0.5)',
        hillBack: '#C2410C',
        hillMid: '#9A3412',
        fieldBack: '#84CC16',   // Heat-warmed lime/olive
        fieldMid: '#65A30D',
        fieldFront: '#4D7C0F',
        gopuramColor: '#7C2D12',
        palmTrunk: '#78350F',
        palmFrond: '#3F6212',
        bananaColor: '#4D7C0F'
      },
      dusk: {
        skyTop: '#991B1B',
        skyMid: '#C2410C',
        skyBottom: '#F97316',
        sunColor: '#FDE047',
        sunGlow: 'rgba(234, 88, 12, 0.5)',
        hillBack: '#7C2D12',
        hillMid: '#431407',
        fieldBack: '#65A30D',
        fieldMid: '#4D7C0F',
        fieldFront: '#365314',
        gopuramColor: '#431407',
        palmTrunk: '#451A03',
        palmFrond: '#365314',
        bananaColor: '#3F6212'
      }
    },
    rain: {
      day: {
        skyTop: '#0F172A',      // Midnight slate storm
        skyMid: '#1E293B',      // Dark steel navy
        skyBottom: '#334155',   // Rain haze
        sunColor: '#94A3B8',
        sunGlow: 'rgba(148, 163, 184, 0.15)',
        hillBack: '#334155',
        hillMid: '#1E293B',
        fieldBack: '#15803D',   // Saturated wet paddy
        fieldMid: '#166534',
        fieldFront: '#14532D',
        gopuramColor: '#1E293B',
        palmTrunk: '#451A03',
        palmFrond: '#14532D',
        bananaColor: '#166534',
        waterColor: '#38BDF8'   // Flooded field channels
      },
      dusk: {
        skyTop: '#020617',
        skyMid: '#0F172A',
        skyBottom: '#1E293B',
        sunColor: '#64748B',
        sunGlow: 'rgba(100, 116, 139, 0.15)',
        hillBack: '#1E293B',
        hillMid: '#0F172A',
        fieldBack: '#166534',
        fieldMid: '#14532D',
        fieldFront: '#052E16',
        gopuramColor: '#0F172A',
        palmTrunk: '#2A1005',
        palmFrond: '#052E16',
        bananaColor: '#14532D',
        waterColor: '#0284C7'
      }
    },
    drought: {
      day: {
        skyTop: '#78350F',      // Dusty brown haze
        skyMid: '#B45309',      // Arid ochre
        skyBottom: '#FDE68A',   // Bleached yellow
        sunColor: '#FEF9C3',
        sunGlow: 'rgba(245, 158, 11, 0.3)',
        hillBack: '#A16207',
        hillMid: '#854D0E',
        fieldBack: '#CA8A04',   // Parched straw
        fieldMid: '#A16207',
        fieldFront: '#78350F',  // Cracked dry earth
        gopuramColor: '#713F12',
        palmTrunk: '#78350F',
        palmFrond: '#854D0E',
        bananaColor: '#A16207'
      },
      dusk: {
        skyTop: '#451A03',
        skyMid: '#78350F',
        skyBottom: '#D97706',
        sunColor: '#FDE047',
        sunGlow: 'rgba(217, 119, 6, 0.35)',
        hillBack: '#78350F',
        hillMid: '#451A03',
        fieldBack: '#A16207',
        fieldMid: '#78350F',
        fieldFront: '#451A03',
        gopuramColor: '#451A03',
        palmTrunk: '#2A1005',
        palmFrond: '#713F12',
        bananaColor: '#854D0E'
      }
    },
    wind: {
      day: {
        skyTop: '#1E293B',      // Breezy cyan-slate
        skyMid: '#475569',
        skyBottom: '#94A3B8',
        sunColor: '#F8FAFC',
        sunGlow: 'rgba(248, 250, 252, 0.25)',
        hillBack: '#64748B',
        hillMid: '#475569',
        fieldBack: '#22C55E',
        fieldMid: '#16A34A',
        fieldFront: '#15803D',
        gopuramColor: '#334155',
        palmTrunk: '#78350F',
        palmFrond: '#166534',
        bananaColor: '#15803D'
      },
      dusk: {
        skyTop: '#0F172A',
        skyMid: '#334155',
        skyBottom: '#64748B',
        sunColor: '#E2E8F0',
        sunGlow: 'rgba(226, 232, 240, 0.25)',
        hillBack: '#475569',
        hillMid: '#334155',
        fieldBack: '#16A34A',
        fieldMid: '#15803D',
        fieldFront: '#14532D',
        gopuramColor: '#1E293B',
        palmTrunk: '#451A03',
        palmFrond: '#14532D',
        bananaColor: '#166534'
      }
    }
  };

  const themeTime = time === 'dusk' ? 'dusk' : 'day';
  const pal = (palettes[normalizedHazard] || palettes.low)[themeTime];

  const isPaused = !isTabVisible || shouldReduceMotion;

  return (
    <div className={`relative overflow-hidden w-full h-full select-none ${className}`}>
      {/* Inline styles for keyframe animations (paused when tab hidden or prefers-reduced-motion) */}
      <style>{`
        @keyframes scenePalmSwayLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(${normalizedHazard === 'wind' ? '7deg' : '2.5deg'}); }
        }
        @keyframes scenePalmSwayRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(${normalizedHazard === 'wind' ? '-7.5deg' : '-3deg'}); }
        }
        @keyframes sceneCloudDrift {
          0% { transform: translateX(0px); }
          100% { transform: translateX(260px); }
        }
        @keyframes sceneRainFall {
          0% { transform: translateY(-30px) translateX(15px); opacity: 0; }
          40% { opacity: 0.9; }
          100% { transform: translateY(110px) translateX(-55px); opacity: 0; }
        }
        @keyframes sceneHeatShimmer {
          0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.45; }
          50% { transform: scaleY(1.15) translateY(-3px); opacity: 0.8; }
        }
        @keyframes sceneSunPulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.08); opacity: 0.55; }
        }
        @keyframes sceneWindStream {
          0% { stroke-dashoffset: 200; opacity: 0; }
          40% { opacity: 0.7; }
          100% { stroke-dashoffset: -200; opacity: 0; }
        }

        .weather-scene-svg .palm-sway-left {
          transform-origin: 140px 450px;
          animation: scenePalmSwayLeft ${normalizedHazard === 'wind' ? '3s' : '6s'} ease-in-out infinite;
        }
        .weather-scene-svg .palm-sway-right {
          transform-origin: 1060px 460px;
          animation: scenePalmSwayRight ${normalizedHazard === 'wind' ? '3.5s' : '7s'} ease-in-out infinite;
        }
        .weather-scene-svg .cloud-drift-slow {
          animation: sceneCloudDrift 60s linear infinite alternate;
        }
        .weather-scene-svg .cloud-drift-fast {
          animation: sceneCloudDrift ${normalizedHazard === 'wind' ? '18s' : '40s'} linear infinite alternate;
        }
        .weather-scene-svg .rain-streak {
          animation: sceneRainFall 0.85s linear infinite;
        }
        .weather-scene-svg .heat-shimmer {
          animation: sceneHeatShimmer 3.2s ease-in-out infinite;
        }
        .weather-scene-svg .sun-pulse {
          transform-origin: 750px 140px;
          animation: sceneSunPulse 4.5s ease-in-out infinite;
        }
        .weather-scene-svg .wind-stream {
          animation: sceneWindStream 3s ease-in-out infinite;
        }

        ${isPaused ? `
          .weather-scene-svg * {
            animation-play-state: paused !important;
          }
        ` : ''}

        @media (prefers-reduced-motion: reduce) {
          .weather-scene-svg * {
            animation: none !important;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMidYMid slice"
        className="weather-scene-svg w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky Gradient */}
          <linearGradient id={`skyGrad-${normalizedHazard}-${themeTime}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.skyTop} />
            <stop offset="50%" stopColor={pal.skyMid} />
            <stop offset="100%" stopColor={pal.skyBottom} />
          </linearGradient>

          {/* Distant Back Hills Gradient */}
          <linearGradient id={`hillBackGrad-${normalizedHazard}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.hillBack} stopOpacity="0.85" />
            <stop offset="100%" stopColor={pal.fieldBack} stopOpacity="0.95" />
          </linearGradient>

          {/* Mid Hills Gradient */}
          <linearGradient id={`hillMidGrad-${normalizedHazard}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.hillMid} />
            <stop offset="100%" stopColor={pal.fieldMid} />
          </linearGradient>

          {/* Paddy Field Grad - Mid */}
          <linearGradient id={`fieldMidGrad-${normalizedHazard}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.fieldMid} />
            <stop offset="100%" stopColor={pal.fieldFront} />
          </linearGradient>

          {/* Flooded Water Channel Glow (Rain only) */}
          <linearGradient id="waterReflectionGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#BAE6FD" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* ============================================================ */}
        {/* 1. SKY BACKGROUND LAYER */}
        {/* ============================================================ */}
        <rect width="1200" height="500" fill={`url(#skyGrad-${normalizedHazard}-${themeTime})`} />

        {/* ============================================================ */}
        {/* 2. ATMOSPHERE / SUN / CLOUDS BASED ON HAZARD */}
        {/* ============================================================ */}

        {/* A. LOW HAZARD: Gentle Sunrise, Sun on horizon, peaceful birds */}
        {normalizedHazard === 'low' && (
          <g id="low-atmosphere">
            {/* Sunrise glow circles */}
            <circle cx="760" cy="240" r="140" fill={pal.sunGlow} className="sun-pulse" />
            <circle cx="760" cy="240" r="90" fill={pal.sunGlow} />
            <circle cx="760" cy="240" r="50" fill={pal.sunColor} />

            {/* Soft dawn clouds drifting */}
            <g className="cloud-drift-slow" opacity="0.45">
              <path
                d="M 180 120 Q 220 95 280 105 Q 330 85 390 105 Q 440 95 480 120 L 180 120 Z"
                fill="#FFFFFF"
              />
              <path
                d="M 820 90 Q 860 70 910 80 Q 950 65 1000 80 Q 1040 70 1080 90 L 820 90 Z"
                fill="#FFFFFF"
              />
            </g>

            {/* Flock of 4 graceful dawn birds */}
            <g opacity="0.6">
              <path d="M 440 130 Q 448 122 456 130 Q 464 122 472 130" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <path d="M 480 115 Q 487 108 494 115 Q 501 108 508 115" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 520 135 Q 526 129 532 135 Q 538 129 544 135" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M 460 145 Q 465 140 470 145 Q 475 140 480 145" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* B. HEAT HAZARD: Blazing high sun, heat shimmer waves */}
        {normalizedHazard === 'heat' && (
          <g id="heat-atmosphere">
            {/* Blazing Corona */}
            <circle cx="740" cy="115" r="170" fill={pal.sunGlow} className="sun-pulse" />
            <circle cx="740" cy="115" r="115" fill="rgba(254, 240, 138, 0.45)" />
            <circle cx="740" cy="115" r="70" fill={pal.sunColor} />

            {/* Heat Shimmer Waves across the horizon */}
            <g className="heat-shimmer" stroke="#FEF08A" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6">
              <path d="M 80 205 Q 240 195 400 205 T 720 205 T 1040 205" />
              <path d="M 160 225 Q 360 215 560 225 T 920 225 T 1160 225" />
              <path d="M 40 245 Q 280 235 520 245 T 980 245" />
            </g>
          </g>
        )}

        {/* C. RAIN HAZARD: Dark stormy clouds, falling animated rain streaks */}
        {normalizedHazard === 'rain' && (
          <g id="rain-atmosphere">
            {/* Storm Clouds Layer 1 (Upper Back) */}
            <path
              d="M -50 110 Q 60 45 190 75 Q 310 30 460 70 Q 590 20 760 65 Q 900 35 1040 75 Q 1150 45 1250 95 L 1250 0 L -50 0 Z"
              fill="#0F172A"
              opacity="0.95"
            />
            {/* Storm Clouds Layer 2 (Billowing Front) */}
            <path
              d="M -30 155 Q 90 95 240 120 Q 370 70 520 110 Q 670 75 830 120 Q 980 85 1110 125 Q 1190 100 1250 140 L 1250 0 L -30 0 Z"
              fill="#1E293B"
              opacity="0.9"
            />
            <path
              d="M 50 180 Q 200 135 380 155 Q 540 125 720 155 Q 890 130 1050 160 L 1200 175 L 1200 0 L 0 0 Z"
              fill="#334155"
              opacity="0.75"
            />

            {/* Falling Rain Streaks (Distributed across the width with staggered animations) */}
            <g stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round">
              {[
                [80, 160], [140, 210], [210, 150], [280, 240], [350, 180],
                [430, 220], [510, 160], [580, 230], [660, 170], [730, 250],
                [810, 190], [890, 230], [970, 160], [1040, 220], [1120, 170]
              ].map(([rx, ry], idx) => (
                <line
                  key={`rain-1-${idx}`}
                  x1={rx}
                  y1={ry}
                  x2={rx - 14}
                  y2={ry + 32}
                  className="rain-streak"
                  style={{ animationDelay: `${(idx * 0.08) % 0.8}s` }}
                />
              ))}

              {[
                [110, 260], [180, 310], [250, 270], [320, 330], [400, 290],
                [480, 340], [560, 280], [640, 330], [710, 290], [790, 350],
                [860, 300], [940, 340], [1010, 280], [1080, 330]
              ].map(([rx, ry], idx) => (
                <line
                  key={`rain-2-${idx}`}
                  x1={rx}
                  y1={ry}
                  x2={rx - 14}
                  y2={ry + 32}
                  className="rain-streak"
                  style={{ animationDelay: `${(0.4 + idx * 0.07) % 0.85}s` }}
                />
              ))}
            </g>
          </g>
        )}

        {/* D. DROUGHT HAZARD: Dusty bleached sun, parched hazy sky */}
        {normalizedHazard === 'drought' && (
          <g id="drought-atmosphere">
            {/* Bleached harsh sun */}
            <circle cx="760" cy="125" r="60" fill={pal.sunColor} />
            <circle cx="760" cy="125" r="110" fill={pal.sunGlow} />

            {/* Atmospheric dust haze layer */}
            <rect width="1200" height="280" fill="#B45309" opacity="0.18" />
          </g>
        )}

        {/* E. WIND HAZARD: Sweeping gust lines & fast drifting clouds */}
        {normalizedHazard === 'wind' && (
          <g id="wind-atmosphere">
            {/* Drifting breezy clouds */}
            <g className="cloud-drift-fast" opacity="0.55">
              <path
                d="M 120 110 Q 200 80 320 95 Q 410 70 540 95 L 540 120 L 120 120 Z"
                fill="#CBD5E1"
              />
              <path
                d="M 720 90 Q 800 65 920 80 Q 1020 60 1120 85 L 1120 110 L 720 110 Z"
                fill="#CBD5E1"
              />
            </g>

            {/* Sweeping wind gust vectors */}
            <g stroke="#E2E8F0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="25 15" className="wind-stream">
              <path d="M 50 90 Q 320 70 600 95 T 1150 85" />
              <path d="M 180 135 Q 460 115 780 140 T 1180 125" />
              <path d="M 20 175 Q 300 155 580 180 T 1100 165" />
            </g>
          </g>
        )}

        {/* ============================================================ */}
        {/* 3. DISTANT LAYERED HILLS (Western Ghats silhouettes) */}
        {/* ============================================================ */}
        {/* Back Hill Ridge */}
        <path
          d="M 0 310 Q 180 205 380 255 T 780 215 Q 960 175 1200 270 L 1200 500 L 0 500 Z"
          fill={`url(#hillBackGrad-${normalizedHazard})`}
        />

        {/* Mid Hill Ridge */}
        <path
          d="M 0 290 Q 220 245 440 275 T 880 240 Q 1060 215 1200 290 L 1200 500 L 0 500 Z"
          fill={`url(#hillMidGrad-${normalizedHazard})`}
        />

        {/* ============================================================ */}
        {/* 4. HORIZON LANDMARKS: TAMIL NADU GOPURAM & PALM SILHOUETTES */}
        {/* ============================================================ */}
        <g id="tamilnadu-horizon-landmarks" fill={pal.gopuramColor}>
          {/* Authentic Tamil Nadu Temple Gopuram Silhouette on Horizon */}
          {/* Base Gateway */}
          <path d="M 836 278 L 866 278 L 864 256 L 838 256 Z" />
          {/* Central Entrance Gateway Arch Cutout */}
          <path
            d="M 847 278 L 855 278 L 855 267 Q 851 264 847 267 Z"
            fill={pal.skyBottom}
          />
          {/* Tier 1 */}
          <path d="M 834 256 L 868 256 L 866 242 L 836 242 Z" />
          {/* Tier 2 */}
          <path d="M 838 242 L 864 242 L 862 230 L 840 230 Z" />
          {/* Tier 3 */}
          <path d="M 841 230 L 861 230 L 859 220 L 843 220 Z" />
          {/* Tier 4 */}
          <path d="M 844 220 L 858 220 L 856 211 L 846 211 Z" />
          {/* Barrel Vault Roof (Shikara) */}
          <path d="M 844 211 Q 851 204 858 211 Z" />
          {/* 5 Tiny Kalasams (Pinnacles) on Crest */}
          <rect x="845" y="202" width="1.5" height="4" />
          <rect x="848" y="200" width="1.5" height="6" />
          <rect x="851" y="198" width="1.5" height="8" />
          <rect x="854" y="200" width="1.5" height="6" />
          <rect x="857" y="202" width="1.5" height="4" />

          {/* Distant palm & palmyra micro-silhouettes along the ridge */}
          {/* Cluster Left */}
          <path d="M 230 268 L 232 250 M 231 250 Q 225 244 222 248 M 231 250 Q 237 244 240 248 M 231 250 Q 231 242 231 245" stroke={pal.gopuramColor} strokeWidth="1.8" />
          <path d="M 242 270 L 243 254 M 243 254 Q 238 248 235 252 M 243 254 Q 248 248 251 252" stroke={pal.gopuramColor} strokeWidth="1.5" />
          {/* Cluster Right */}
          <path d="M 980 256 L 981 240 M 981 240 Q 975 234 972 238 M 981 240 Q 987 234 990 238" stroke={pal.gopuramColor} strokeWidth="1.8" />
          <path d="M 994 259 L 995 244 M 995 244 Q 990 238 987 242 M 995 244 Q 1000 238 1003 242" stroke={pal.gopuramColor} strokeWidth="1.6" />
        </g>

        {/* ============================================================ */}
        {/* 5. PADDY FIELDS & AGRICULTURAL LANDSCAPE */}
        {/* ============================================================ */}
        {/* Far Field Terraced Strip */}
        <path
          d="M 0 300 Q 300 285 600 305 T 1200 295 L 1200 365 L 0 365 Z"
          fill={pal.fieldBack}
        />

        {/* Mid Field Terraced Strip */}
        <path
          d="M 0 350 Q 400 335 800 360 T 1200 345 L 1200 430 L 0 430 Z"
          fill={`url(#fieldMidGrad-${normalizedHazard})`}
        />

        {/* Foreground Field Strip */}
        <path
          d="M 0 410 Q 350 395 720 420 T 1200 405 L 1200 500 L 0 500 Z"
          fill={pal.fieldFront}
        />

        {/* Paddy Field Bunds & Perspective Furrows (வரப்புகள்) */}
        <g stroke={pal.fieldFront} strokeWidth="2.5" opacity="0.65" fill="none">
          <path d="M 0 350 Q 400 335 800 360 T 1200 345" />
          <path d="M 0 410 Q 350 395 720 420 T 1200 405" />
          {/* Perspective Furrow Rows leading toward vanishing point */}
          <line x1="260" y1="500" x2="380" y2="350" strokeWidth="2" />
          <line x1="480" y1="500" x2="520" y2="350" strokeWidth="2" />
          <line x1="720" y1="500" x2="680" y2="350" strokeWidth="2" />
          <line x1="940" y1="500" x2="840" y2="350" strokeWidth="2" />
        </g>

        {/* RAIN EFFECT: Flooded water channels reflecting the sky in field furrows */}
        {normalizedHazard === 'rain' && (
          <g id="flooded-water-channels">
            <path
              d="M 280 435 Q 450 420 640 435 Q 820 425 960 440 L 930 455 Q 780 442 610 452 Q 440 438 270 450 Z"
              fill="url(#waterReflectionGrad)"
            />
            <path
              d="M 120 375 Q 320 365 520 375 T 900 370 L 880 382 Q 680 378 480 385 T 100 385 Z"
              fill="url(#waterReflectionGrad)"
              opacity="0.8"
            />
          </g>
        )}

        {/* DROUGHT EFFECT: Parched cracked soil vector lines */}
        {normalizedHazard === 'drought' && (
          <g id="cracked-soil-texture" stroke="#451A03" strokeWidth="1.8" fill="none" opacity="0.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 400 440 L 420 455 L 415 475 L 435 490 M 420 455 L 445 460 L 460 480 M 415 475 L 390 485" />
            <path d="M 620 430 L 640 445 L 635 465 L 655 480 M 640 445 L 665 450 L 680 470" />
            <path d="M 800 450 L 820 462 L 815 482 M 820 462 L 845 470 L 860 495" />
          </g>
        )}

        {/* ============================================================ */}
        {/* 6. MIDDLEGROUND TAMIL NADU FLORA */}
        {/* ============================================================ */}

        {/* BANANA PLANTS (வாழை மரம்) - Broad arching leaves */}
        <g id="banana-plants" fill={pal.bananaColor} opacity="0.95">
          {/* Cluster Left (near x=240, y=390) */}
          <g transform="translate(230, 370)">
            {/* Trunk */}
            <path d="M 12 30 L 16 30 L 15 10 L 13 10 Z" fill="#713F12" />
            {/* Broad Oval Banana Leaves */}
            <path d="M 14 10 Q -15 -15 -35 5 Q -10 15 14 10 Z" />
            <path d="M 14 10 Q 35 -20 60 -5 Q 35 15 14 10 Z" />
            <path d="M 14 10 Q 5 -30 2 -45 Q 20 -25 14 10 Z" />
            <path d="M 14 10 Q -25 -5 -40 -25 Q -15 -10 14 10 Z" />
          </g>

          {/* Cluster Right (near x=940, y=390) */}
          <g transform="translate(940, 385)">
            <path d="M 12 30 L 16 30 L 15 10 L 13 10 Z" fill="#713F12" />
            <path d="M 14 10 Q -20 -18 -45 -2 Q -15 12 14 10 Z" />
            <path d="M 14 10 Q 40 -15 65 5 Q 35 18 14 10 Z" />
            <path d="M 14 10 Q 8 -28 5 -42 Q 22 -22 14 10 Z" />
          </g>
        </g>

        {/* COCONUT PALMS (தென்னை மரம்) - Iconic slender curved trunks & swaying fronds */}
        {/* LEFT PALM */}
        <g id="palm-tree-left" className="palm-sway-left">
          {/* Trunk */}
          <path
            d="M 130 460 Q 146 320 162 170 L 168 170 Q 152 320 138 460 Z"
            fill={pal.palmTrunk}
          />
          {/* Palm Fronds radiating from trunk apex (165, 170) */}
          <g fill={pal.palmFrond} stroke={pal.palmFrond} strokeWidth="1.2">
            {/* Frond 1: Arched Left-Up */}
            <path d="M 165 170 Q 120 120 70 145 Q 125 150 165 170 Z" />
            {/* Frond 2: Arched Far-Left */}
            <path d="M 165 170 Q 100 160 50 195 Q 110 185 165 170 Z" />
            {/* Frond 3: Top-Center Crest */}
            <path d="M 165 170 Q 155 100 160 70 Q 175 110 165 170 Z" />
            {/* Frond 4: Arched Right-Up */}
            <path d="M 165 170 Q 210 115 255 135 Q 205 145 165 170 Z" />
            {/* Frond 5: Arched Far-Right */}
            <path d="M 165 170 Q 225 155 270 185 Q 215 180 165 170 Z" />
            {/* Frond 6: Drooping Low-Left */}
            <path d="M 165 170 Q 120 190 85 225 Q 130 205 165 170 Z" />
            {/* Frond 7: Drooping Low-Right */}
            <path d="M 165 170 Q 205 195 240 230 Q 195 210 165 170 Z" />
            {/* Coconuts below crown */}
            <circle cx="163" cy="174" r="4.5" fill="#78350F" stroke="none" />
            <circle cx="169" cy="175" r="4" fill="#78350F" stroke="none" />
            <circle cx="165" cy="178" r="4" fill="#592909" stroke="none" />
          </g>
        </g>

        {/* RIGHT PALM */}
        <g id="palm-tree-right" className="palm-sway-right">
          {/* Trunk */}
          <path
            d="M 1065 470 Q 1045 330 1022 180 L 1028 180 Q 1051 330 1073 470 Z"
            fill={pal.palmTrunk}
          />
          {/* Fronds radiating from trunk apex (1025, 180) */}
          <g fill={pal.palmFrond} stroke={pal.palmFrond} strokeWidth="1.2">
            <path d="M 1025 180 Q 980 130 930 155 Q 985 160 1025 180 Z" />
            <path d="M 1025 180 Q 960 170 910 205 Q 970 195 1025 180 Z" />
            <path d="M 1025 180 Q 1015 110 1020 80 Q 1035 120 1025 180 Z" />
            <path d="M 1025 180 Q 1070 125 1115 145 Q 1065 155 1025 180 Z" />
            <path d="M 1025 180 Q 1085 165 1130 195 Q 1075 190 1025 180 Z" />
            <path d="M 1025 180 Q 980 200 945 235 Q 990 215 1025 180 Z" />
            <circle cx="1023" cy="184" r="4.5" fill="#78350F" stroke="none" />
            <circle cx="1029" cy="185" r="4" fill="#78350F" stroke="none" />
          </g>
        </g>

        {/* ============================================================ */}
        {/* 7. FOREGROUND PLANTS (Framing bottom-left and bottom-right) */}
        {/* ============================================================ */}
        <g id="foreground-grasses" fill={pal.fieldFront} opacity="0.95">
          {/* Bottom Left Paddy Blades & Grass */}
          <path d="M 0 500 L 15 420 Q 30 450 40 500 Z" />
          <path d="M 25 500 L 45 400 Q 60 440 75 500 Z" />
          <path d="M 60 500 L 85 430 Q 95 465 110 500 Z" />
          <path d="M 95 500 L 120 410 Q 135 450 150 500 Z" />

          {/* Bottom Right Sugarcane & Paddy Foliage */}
          <path d="M 1200 500 L 1180 415 Q 1165 455 1150 500 Z" />
          <path d="M 1165 500 L 1140 435 Q 1130 465 1115 500 Z" />
          <path d="M 1130 500 L 1105 405 Q 1090 445 1075 500 Z" />
        </g>
      </svg>
    </div>
  );
};

export default WeatherScene;
