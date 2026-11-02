import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldAlert,
  Sun,
  CloudRain,
  Waves,
  Wind,
  Users,
  Clock,
  Heart,
  Baby,
  Briefcase,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SafetyPlan = () => {
  const { t, lang, tamilVoiceAvailable, isPlayingAudio, speakText, stopSpeech } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const [activeHazard, setActiveHazard] = useState('heat');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSafety = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/safety-plan`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSafetyData(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Backend safety-plan offline, using embedded advice', e);
      }

      // Local fallback
      const fallbackData = {
        heat: {
          next_6h: [
            { group: 'elderly', action_en: 'Keep elderly family members indoors in well-ventilated, shaded rooms. Offer frequent sips of cool drinking water.', action_ta: 'முதியவர்களை நல்ல காற்றோட்டமான நிழலான அறைகளில் இருக்கச் செய்யவும். அடிக்கடி குளிர்ந்த குடிநீர் வழங்கவும்.' },
            { group: 'children', action_en: 'Restrict strenuous outdoor play and direct sun exposure between 11:00 AM and 3:30 PM. Dress in loose cotton clothing.', action_ta: 'காலை 11:00 முதல் பிற்பகல் 3:30 மணி வரை குழந்தைகள் வெயிலில் விளையாடுவதை தவிர்க்கவும். மெல்லிய பருத்தி ஆடைகளை அணியச் செய்யவும்.' },
            { group: 'outdoor_worker', action_en: 'Take mandatory 10-15 minute rest breaks in shaded spots every hour. Wear a wide-brimmed hat or damp cloth on head.', action_ta: 'மணிக்கு ஒருமுறை நிழலில் 10-15 நிமிடங்கள் கட்டாய ஓய்வெடுக்கவும். தலையில் தொப்பி அல்லது ஈரத்துணி அணியவும்.' },
            { group: 'everyone', action_en: 'Stay continuously hydrated with plain water, buttermilk, or tender coconut water. Never leave anyone inside parked vehicles.', action_ta: 'குடிநீர், மோர் அல்லது இளநீர் அருந்தி உடலில் நீர்ச்சத்து குறையாமல் பார்த்துக்கொள்ளவும். பூட்டிய வாகனங்களில் யாரையும் அமர வைக்க வேண்டாம்.' }
          ],
          next_24h: [
            { group: 'elderly', action_en: 'Check on elderly neighbors living alone. Sponge arms and forehead with cool water if indoor temperatures rise.', action_ta: 'தனியாக வசிக்கும் முதியவர்களின் நலனை விசாரிக்கவும். வெப்பம் அதிகமாக இருந்தால் குளிர்ந்த நீரால் உடலை ஒற்றி எடுக்கவும்.' },
            { group: 'children', action_en: 'Encourage indoor hobbies, puzzles, or reading during peak afternoon thermal hours.', action_ta: 'நண்பகல் வெயில் நேரத்தில் குழந்தைகளை வீட்டுக்குள்ளேயே விளையாட அல்லது படிக்க ஊக்குவிக்கவும்.' },
            { group: 'outdoor_worker', action_en: 'Shift physically demanding tasks to early morning (before 9 AM) or late evening (after 5 PM) when possible.', action_ta: 'கடினமான வேலைகளை காலை 9 மணிக்கு முன்போ அல்லது மாலை 5 மணிக்குப் பின்போ செய்ய திட்டமிடவும்.' },
            { group: 'everyone', action_en: 'Keep home curtains and blinds drawn on sun-facing windows during the day to block radiating heat.', action_ta: 'பகல் வேளையில் வெயில் படும் ஜன்னல் திரைகளை மூடி வைத்து அறையின் வெப்பத்தைக் குறைக்கவும்.' }
          ],
          next_48h: [
            { group: 'elderly', action_en: 'Plan grocery or essential errands early in the morning. Avoid stepping out during noon heat spikes.', action_ta: 'அத்தியாவசிய தேவைகளுக்கு காலை நேரத்திலேயே சென்று வரவும். நண்பகல் வேளையில் வெளியே செல்வதை தவிர்க்கவும்.' },
            { group: 'children', action_en: 'Ensure schools or daycare areas have accessible drinking water stations and shaded transit.', action_ta: 'பள்ளி மற்றும் குழந்தைகள் இருக்கும் இடங்களில் போதுமான குடிநீர் வசதி இருப்பதை உறுதி செய்யவும்.' },
            { group: 'outdoor_worker', action_en: 'Carry a 2-litre insulated water flask with oral fluids and light snacks to work sites.', action_ta: 'வேலை செய்யும் இடத்திற்கு 2 லிட்டர் குடிநீர் மற்றும் அவசர தேவையான உப்புக் கரைசலை கொண்டு செல்லவும்.' },
            { group: 'everyone', action_en: 'Avoid high-protein and spicy foods that increase metabolic heat. Prefer fresh fruits and seasonal vegetables.', action_ta: 'உடல் வெப்பத்தை அதிகரிக்கும் காரமான உணவுகளை தவிர்த்து பழங்கள் மற்றும் காய்கறிகளை உண்ணவும்.' }
          ]
        },
        rain: {
          next_6h: [
            { group: 'elderly', action_en: 'Ensure anti-slip footpaths at home. Avoid stepping outdoors in wet slippers.', action_ta: 'வீட்டு வாசலில் வழுக்கும் பகுதிகளை சரிசெய்யவும். ஈரமான தரையில் முதியவர்கள் கவனமாக நடக்க உதவவும்.' },
            { group: 'children', action_en: 'Do not allow children near stormwater canals, open drains, or submerged streets.', action_ta: 'திறந்திருக்கும் சாக்கடைகள், வாய்க்கால்கள் மற்றும் தேங்கிய மழைநீரில் குழந்தைகள் விளையாடுவதை தடுக்கவும்.' },
            { group: 'outdoor_worker', action_en: 'Stop outdoor iron-scaffolding and roof works immediately to prevent slip and fall accidents.', action_ta: 'கூரை வேலைகள் மற்றும் இரும்பு கம்பிகளில் ஏறி செய்யும் வேலைகளை உடனடியாக நிறுத்தவும்.' },
            { group: 'everyone', action_en: 'Charge mobile phones, flashlights, and power banks before potential power cuts.', action_ta: 'மின்தடை ஏற்படுவதற்கு முன் கைபேசிகள், டார்ச் விளக்குகள் மற்றும் பவர் பேங்குகளை முழுமையாக சார்ஜ் செய்யவும்.' }
          ],
          next_24h: [
            { group: 'everyone', action_en: 'Boil drinking water for at least 5 minutes to prevent water-borne gastroenteritis.', action_ta: 'குடிநீரை குறைந்தது 5 நிமிடங்கள் நன்றாக கொதிக்க வைத்து ஆறிய பின் பருகவும்.' }
          ],
          next_48h: [
            { group: 'everyone', action_en: 'Clear roof gutters and domestic downpipes to avoid structural dampness.', action_ta: 'வீட்டு கூரை வடிகால்களை தூய்மை செய்து மழைநீர் எளிதாக வடிய வழிவகை செய்யவும்.' }
          ]
        }
      };

      if (isMounted) {
        setSafetyData(fallbackData);
        setLoading(false);
      }
    };

    fetchSafety();
    return () => { isMounted = false; };
  }, []);

  const hazardList = [
    { id: 'heat', label_en: 'Heatwave', label_ta: 'வெப்ப அலை', icon: Sun, color: 'text-amber-500' },
    { id: 'rain', label_en: 'Heavy Rain', label_ta: 'கனமழை', icon: CloudRain, color: 'text-sky-500' },
    { id: 'flood', label_en: 'Flood Inundation', label_ta: 'வெள்ள அபாயம்', icon: Waves, color: 'text-indigo-500' },
    { id: 'cyclone', label_en: 'Cyclone & Wind', label_ta: 'புயல் & காற்று', icon: Wind, color: 'text-teal-500' }
  ];

  const groupFilter = [
    { id: 'all', label_en: 'All Groups', label_ta: 'அனைவருக்கும்', icon: Users },
    { id: 'elderly', label_en: 'Elderly', label_ta: 'முதியவர்கள்', icon: Heart },
    { id: 'children', label_en: 'Children', label_ta: 'குழந்தைகள்', icon: Baby },
    { id: 'outdoor_worker', label_en: 'Outdoor Workers', label_ta: 'வெளிப்புற பணியாளர்கள்', icon: Briefcase },
    { id: 'everyone', label_en: 'General', label_ta: 'பொது மக்கள்', icon: Users }
  ];

  const currentHazardData = safetyData?.[activeHazard] || { next_6h: [], next_24h: [], next_48h: [] };

  const filterAdvice = (list) => {
    if (!list) return [];
    if (selectedGroup === 'all') return list;
    return list.filter(item => item.group === selectedGroup || item.group === 'everyone');
  };

  const getGroupBadge = (grp) => {
    switch (grp) {
      case 'elderly':
        return { label_en: 'Elderly', label_ta: 'முதியவர்', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' };
      case 'children':
        return { label_en: 'Children', label_ta: 'குழந்தைகள்', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'outdoor_worker':
        return { label_en: 'Outdoor Worker', label_ta: 'தொழிலாளர்', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
      default:
        return { label_en: 'General Public', label_ta: 'அனைவரும்', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>Public Safety Guidelines</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('safety.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              {t('safety.subtitle')}
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-1.5 self-start sm:self-center">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Official IMD warnings take priority</span>
          </div>
        </div>

        {/* Hazard Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {hazardList.map((hazard) => {
            const Icon = hazard.icon;
            const isSelected = activeHazard === hazard.id;
            return (
              <button
                key={hazard.id}
                type="button"
                onClick={() => setActiveHazard(hazard.id)}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all border ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? (lang === 'ta' ? 'text-amber-400' : 'text-amber-300') : hazard.color}`} />
                <span>{lang === 'ta' ? hazard.label_ta : hazard.label_en}</span>
              </button>
            );
          })}
        </div>

        {/* Vulnerable Group Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
            {t('safety.filterGroup')}:
          </span>
          {groupFilter.map((grp) => {
            const isSelected = selectedGroup === grp.id;
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedGroup(grp.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {lang === 'ta' ? grp.label_ta : grp.label_en}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Safety Timelines: 6h, 24h, 48h */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Next 6 Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-rose-100 dark:border-rose-950/60">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {t('safety.next6h')}
              </h3>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Immediate Priority</p>
            </div>
          </div>

          <div className="space-y-3">
            {filterAdvice(currentHazardData.next_6h).map((item, idx) => {
              const badge = getGroupBadge(item.group);
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 space-y-2">
                  <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${badge.color}`}>
                    {lang === 'ta' ? badge.label_ta : badge.label_en}
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {lang === 'ta' ? item.action_ta : item.action_en}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next 24 Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-amber-100 dark:border-amber-950/60">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {t('safety.next24h')}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Planning Ahead</p>
            </div>
          </div>

          <div className="space-y-3">
            {filterAdvice(currentHazardData.next_24h).map((item, idx) => {
              const badge = getGroupBadge(item.group);
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 space-y-2">
                  <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${badge.color}`}>
                    {lang === 'ta' ? badge.label_ta : badge.label_en}
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {lang === 'ta' ? item.action_ta : item.action_en}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next 48 Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-sky-100 dark:border-sky-950/60">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {t('safety.next48h')}
              </h3>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">Sustained Resilience</p>
            </div>
          </div>

          <div className="space-y-3">
            {filterAdvice(currentHazardData.next_48h).map((item, idx) => {
              const badge = getGroupBadge(item.group);
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 space-y-2">
                  <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${badge.color}`}>
                    {lang === 'ta' ? badge.label_ta : badge.label_en}
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {lang === 'ta' ? item.action_ta : item.action_en}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
