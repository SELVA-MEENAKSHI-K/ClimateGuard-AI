import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Header } from './components/Header';
import { LocationCropSelector } from './components/LocationCropSelector';
import { HeroContainer } from './components/HeroContainer';
import { RiskOverview } from './components/RiskOverview';
import { FarmBriefCard } from './components/FarmBriefCard';
import { WeatherSummary } from './components/WeatherSummary';
import { AdvisoryCard } from './components/AdvisoryCard';
import { AgentChat } from './components/AgentChat';
import { ImpactPage } from './components/ImpactPage';
import { AboutView } from './components/AboutView';
import { DisclaimerFooter } from './components/DisclaimerFooter';
import { SettingsModal } from './components/SettingsModal';
import { IrrigationPlan } from './components/IrrigationPlan';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { SafetyPlan } from './components/SafetyPlan';
import { NearbyHelp } from './components/NearbyHelp';

// Resilient default fallback data for immediate demo responsiveness
const INITIAL_RISK_DATA = {
  composite_risk: 'LOW',
  heat_risk: 'LOW',
  rain_risk: 'LOW',
  drought_risk: 'LOW',
  wind_risk: 'LOW',
  confidence: {
    composite: 'HIGH',
    heat: 'HIGH',
    rain: 'HIGH',
    drought: 'HIGH',
    wind: 'HIGH',
    disagree_alert: 'Models disagree, check official IMD alert'
  },
  metrics: {
    temp_max: 33.2,
    precipitation_sum: 2.5,
    consecutive_dry_days: 3,
    wind_speed_max: 14.2
  }
};

const INITIAL_FARM_BRIEF = {
  brief_en: "[Madurai Paddy Brief]\n⚠️ Top Risk: Low Risk / Favorable\n✅ Today: Maintain 2-3 cm shallow water level in fields.\n❌ Avoid: Fertilizer top-dressing during cloudy sky.\nOfficial IMD warnings take priority.",
  brief_ta: "[மதுரை நெல் சுருக்கம்]\n⚠️ இடர்: குறைந்த இடர் / சாதகமானது\n✅ இன்று: 2-3 செ.மீ சீரான நீர்மட்டம் பராமரிக்கவும்.\n❌ தவிர்க்க: மேகமூட்டத்தின் போது உரம் இடுவதை.\nIMD எச்சரிக்கைக்கு முன்னுரிமை.",
  top_risk: "Low Risk / Favorable",
  top_risk_ta: "குறைந்த இடர் / சாதகமானது",
  action_today_en: "Maintain 2-3 cm shallow water level in fields.",
  action_today_ta: "2-3 செ.மீ சீரான நீர்மட்டம் பராமரிக்கவும்.",
  avoid_today_en: "Fertilizer top-dressing during cloudy sky.",
  avoid_today_ta: "மேகமூட்டத்தின் போது உரம் இடுவதை."
};

const INITIAL_WEATHER_DATA = {
  current: {
    temperature_2m: 30.5,
    relative_humidity_2m: 72,
    apparent_temperature: 34.0,
    precipitation: 0.0,
    wind_speed_10m: 11.5
  },
  daily: {
    time: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'],
    temperature_2m_max: [33.2, 32.8, 33.0, 31.5, 30.2, 31.0, 32.1],
    temperature_2m_min: [24.1, 23.9, 24.0, 23.5, 23.0, 23.2, 23.8],
    precipitation_sum: [0.5, 1.2, 0.0, 8.5, 14.2, 3.1, 0.8],
    precipitation_probability_max: [25, 35, 20, 65, 75, 45, 25],
    wind_speed_10m_max: [14.2, 12.0, 11.5, 16.0, 18.5, 12.0, 10.5],
    et0_fao_evapotranspiration: [4.2, 4.1, 4.3, 3.8, 3.5, 3.9, 4.0]
  }
};

const INITIAL_ADVISORY = {
  explanation: "Weather in Madurai is favorable for paddy during vegetative stage. Light rainfall anticipated over the next 48 hours. Soil moisture levels are satisfactory.",
  explanation_ta: "மதுரையில் நெல் வளர்ச்சிப் பருவத்திற்கு வானிலை தற்போது சாதகமாக உள்ளது. அடுத்த 48 மணி நேரத்தில் லேசான மழை வாய்ப்புள்ளது. மண்ணில் போதுமான ஈரப்பதம் உள்ளது."
};

const INITIAL_CHECKLIST = {
  next_6h: [
    { action: "Check bund heights and ensure irrigation channels are clear.", action_ta: "வயல் வரப்புகளின் உயரத்தை சரிபார்த்து நீர் வரத்து வாய்க்கால்களை சுத்தம் செய்யவும்." }
  ],
  next_24h: [
    { action: "Maintain 2-3 cm shallow water level in vegetative paddy fields.", action_ta: "நெல் வயலில் 2-3 செ.மீ அளவு சீரான நீர்மட்டம் இருக்குமாறு பராமரிக்கவும்." }
  ],
  next_48h: [
    { action: "Observe skies for cloud cover before planning any nitrogen top-dressing.", action_ta: "மேகமூட்டத்தை கண்காணித்து தழைச்சத்து உரம் இடுவதை திட்டமிடவும்." }
  ]
};

const INITIAL_SPRAY = {
  status: "SAFE",
  wind_speed: 11.5,
  rain_probability: 25,
  reason_en: "Wind speed is under 15 km/h and rain probability is low. Suitable for foliar spraying.",
  reason_ta: "காற்றின் வேகம் 15 கி.மீ/மணிக்கு குறைவாகவும் மழை வாய்ப்பு குறைவாகவும் உள்ளதால் தெளிப்புக்கு உகந்தது."
};

function MainApp() {
  const { lang } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const [persona, setPersona] = useState('farmer'); // 'farmer' | 'public'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [profile, setProfile] = useState({
    district: 'Madurai',
    crop: 'paddy',
    growth_stage: 'vegetative'
  });

  const [weatherData, setWeatherData] = useState(INITIAL_WEATHER_DATA);
  const [riskData, setRiskData] = useState(INITIAL_RISK_DATA);
  const [farmBrief, setFarmBrief] = useState(INITIAL_FARM_BRIEF);
  const [advisory, setAdvisory] = useState(INITIAL_ADVISORY);
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [sprayWindow, setSprayWindow] = useState(INITIAL_SPRAY);
  const [isMockMode, setIsMockMode] = useState(false);
  const [chatProvider, setChatProvider] = useState('mock');
  const [loading, setLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [latestTrace, setLatestTrace] = useState(null);

  const shouldReduceMotion = useReducedMotion();

  // Fetch full weather + risk + advisory from backend
  const fetchAgroWeather = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/weather?district=${profile.district}&crop=${profile.crop}&growth_stage=${profile.growth_stage}`);
      if (res.ok) {
        const data = await res.json();
        if (data.weather) setWeatherData(data.weather);
        if (data.risk) {
          if (data.confidence) data.risk.confidence = data.confidence;
          setRiskData(data.risk);
        }
        if (data.farm_brief) setFarmBrief(data.farm_brief);
        if (data.advisory) setAdvisory(data.advisory);
        if (data.checklist) setChecklist(data.checklist);
        if (data.spray_window) setSprayWindow(data.spray_window);
        if (data.is_mock_mode !== undefined) {
          setIsMockMode(data.is_mock_mode);
          setChatProvider(data.is_mock_mode ? 'mock' : 'gemini');
        }
      }
    } catch (err) {
      console.warn('Backend not reached yet, using client state', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchAgroWeather();
  }, [fetchAgroWeather]);

  // Handle Chat Message
  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          district: profile.district,
          crop: profile.crop,
          growth_stage: profile.growth_stage,
          language: lang
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = { role: 'assistant', text: data.response };
        setMessages(prev => [...prev, aiMsg]);
        if (data.provider) {
          setChatProvider(data.provider);
        }
        if (data.trace) {
          setLatestTrace(data.trace);
        }
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (err) {
      const fallbackAi = {
        role: 'assistant',
        text: lang === 'ta'
          ? `[ClimateGuard AI] ${profile.district} மாவட்டத்தில் ${profile.crop} (${profile.growth_stage} பருவம்) பயிருக்கு: கணிக்கப்பட்ட இடர் நிலை ${riskData.composite_risk}. தெளிப்பு நேரம்: ${sprayWindow.status}. வடிகால் வாய்க்கால்களை சுத்தமாக வைத்திருக்கவும்.`
          : `[ClimateGuard AI] For ${profile.crop} in ${profile.district} (${profile.growth_stage} stage): Current computed risk is ${riskData.composite_risk}. Weather spray window is currently ${sprayWindow.status}. Keep drainage channels clear.`
      };
      setMessages(prev => [...prev, fallbackAi]);
      setLatestTrace({
        orchestrator: 'ClimateGuardOrchestrator',
        provider: 'mock',
        mode: 'mock_fallback',
        is_mock: true,
        reason: 'Client-side fallback due to network disconnection',
        tool_calls: [
          { name: 'get_forecast', status: 'SUCCESS', duration_ms: 120, args: { district: profile.district }, output: 'Temp 30.5°C, Rain 0.5mm' },
          { name: 'assess_risk', status: 'SUCCESS', duration_ms: 45, args: { rules: 'thresholds.py' }, output: { composite: riskData.composite_risk } },
          { name: 'crop_advice', status: 'SUCCESS', duration_ms: 60, args: { crop: profile.crop, stage: profile.growth_stage }, output: 'Drainage and vegetative moisture management' }
        ],
        structured_output: true
      });
    } finally {
      setChatLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } },
    exit: { opacity: 0, y: shouldReduceMotion ? 0 : -8, transition: { duration: 0.15, ease: 'easeIn' } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans theme-transition pb-20 md:pb-6">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        persona={persona}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMockMode={isMockMode}
      />

      <main className="max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 flex-1">
        <AnimatePresence mode="wait">
          {/* Home / Dashboard View */}
          {(activeTab === 'home' || activeTab === 'dashboard') && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <LocationCropSelector
                profile={profile}
                onChangeProfile={setProfile}
                onRefresh={fetchAgroWeather}
                loading={loading}
              />

              {/* 3D Hero Scene on Desktop / 2D Fallback on Mobile & Non-WebGL */}
              <HeroContainer riskData={riskData} />

              <RiskOverview riskData={riskData} />

              <FarmBriefCard farmBrief={farmBrief} />

              <AdvisoryCard
                advisory={advisory}
                checklist={checklist}
                sprayWindow={sprayWindow}
              />

              <WeatherSummary weatherData={weatherData} />

              {/* Quick Chat Entry in Dashboard */}
              <AgentChat
                profile={profile}
                onSendMessage={handleSendMessage}
                messages={messages}
                loading={chatLoading}
                latestTrace={latestTrace}
                persona={persona}
                provider={chatProvider}
              />
            </motion.div>
          )}

          {/* Farmer: Irrigation Plan */}
          {activeTab === 'irrigation' && (
            <motion.div
              key="irrigation"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <IrrigationPlan profile={profile} />
            </motion.div>
          )}

          {/* Farmer: What If? Simulator */}
          {activeTab === 'whatif' && (
            <motion.div
              key="whatif"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <WhatIfSimulator profile={profile} />
            </motion.div>
          )}

          {/* Public: Safety Plan */}
          {activeTab === 'safety' && (
            <motion.div
              key="safety"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <SafetyPlan />
            </motion.div>
          )}

          {/* Public: Nearby Help */}
          {activeTab === 'nearby' && (
            <motion.div
              key="nearby"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <NearbyHelp profile={profile} />
            </motion.div>
          )}

          {/* Shared: Ask Agent Chat */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AgentChat
                profile={profile}
                onSendMessage={handleSendMessage}
                messages={messages}
                loading={chatLoading}
                latestTrace={latestTrace}
                persona={persona}
                provider={chatProvider}
              />
            </motion.div>
          )}

          {/* Farmer: Impact Page (Formerly Proof) */}
          {(activeTab === 'impact' || activeTab === 'proof') && (
            <motion.div
              key="impact"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ImpactPage />
            </motion.div>
          )}

          {/* About View */}
          {activeTab === 'about' && (
            <motion.div
              key="about"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AboutView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onChangeProfile={setProfile}
        persona={persona}
        onChangePersona={(p) => {
          setPersona(p);
          setActiveTab('home');
        }}
      />

      <DisclaimerFooter isMockMode={isMockMode} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
