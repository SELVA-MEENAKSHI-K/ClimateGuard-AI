import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import {
  MapPin,
  PhoneCall,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Building,
  HeartPulse,
  Tent,
  Phone,
  ExternalLink
} from 'lucide-react';

export const NearbyHelp = ({ profile }) => {
  const { t, lang } = useTranslation();
  const [placesData, setPlacesData] = useState(null);
  const [loading, setLoading] = useState(false);

  const district = profile?.district || 'Madurai';

  useEffect(() => {
    let isMounted = true;
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/help-places?district=${district}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setPlacesData(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Backend help-places endpoint offline, using local fallback', e);
      }

      const fallbackPlaces = {
        district: district,
        notice: 'sample data, verify locally',
        places: [
          {
            id: 'help-1',
            name: `${district} Urban Primary Health Center (Sample Placeholder)`,
            type: 'Primary Health & First Aid',
            type_ta: 'ஆரம்ப சுகாதார நிலையம் மற்றும் முதலுதவி',
            address: `Sample Ward 12, Main Road, ${district} (Sample data, verify locally)`,
            phone: '0452-2530000 (Sample Placeholder)',
            operating_hours: '24/7 Emergency Care',
            operating_hours_ta: '24 மணி நேர அவசர சிகிச்சை',
            is_sample: true
          },
          {
            id: 'help-2',
            name: `District Cyclone & Flood Relief Shelter (Sample Placeholder)`,
            type: 'Community Evacuation Shelter',
            type_ta: 'சமுதாய வெள்ள நிவாரண மையம்',
            address: `Collectorate Complex, ${district} (Sample data, verify locally)`,
            phone: '0452-2531110 (Sample Placeholder)',
            operating_hours: 'Active during IMD Weather Alerts',
            operating_hours_ta: 'வானிலை எச்சரிக்கையின் போது இயங்கும்',
            is_sample: true
          },
          {
            id: 'help-3',
            name: `Government Community Disaster Care Unit (Sample Placeholder)`,
            type: 'Municipal Disaster Care & Relief Distribution',
            type_ta: 'மாநகராட்சி பேரிடர் மற்றும் நிவாரண உதவி மையம்',
            address: `Bus Stand Area, ${district} (Sample data, verify locally)`,
            phone: '0452-2532220 (Sample Placeholder)',
            operating_hours: 'Open 8:00 AM - 8:00 PM (Emergency 24h)',
            operating_hours_ta: 'காலை 8:00 - இரவு 8:00 (அவசரகாலம் 24 மணிநேரம்)',
            is_sample: true
          }
        ]
      };

      if (isMounted) {
        setPlacesData(fallbackPlaces);
        setLoading(false);
      }
    };

    fetchPlaces();
    return () => { isMounted = false; };
  }, [district]);

  const places = placesData?.places || [];

  return (
    <div className="space-y-6">
      {/* 1. Header & Mandatory Disclaimer */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
              <Building className="w-4 h-4 text-teal-600" />
              <span>Civic Relief Directory</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('nearby.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              {t('nearby.subtitle')} ({district})
            </p>
          </div>

          <div className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-center gap-2 self-start sm:self-center">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sample data, verify locally</span>
          </div>
        </div>

        {/* 24/7 Hotlines Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>Emergency Helplines (Tamil Nadu)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-300 font-medium">State Disaster Helpline</p>
                <p className="text-sm font-black text-emerald-400">1077</p>
              </div>
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-300 font-medium">Ambulance & Medical</p>
                <p className="text-sm font-black text-rose-400">108</p>
              </div>
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-300 font-medium">Kisan Call Center</p>
                <p className="text-sm font-black text-amber-400">1800-180-1551</p>
              </div>
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. List of Places */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {places.map((place) => {
          const isMedical = place.type.includes('Health') || place.type.includes('Medical');
          const Icon = isMedical ? HeartPulse : Tent;
          const iconColor = isMedical
            ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60'
            : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60';

          return (
            <div
              key={place.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`p-2.5 rounded-2xl ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Sample Data
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-1">
                  {place.name}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                  {lang === 'ta' && place.type_ta ? place.type_ta : place.type}
                </p>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{place.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{lang === 'ta' && place.operating_hours_ta ? place.operating_hours_ta : place.operating_hours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{place.phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400 italic">
                  * Verify with Village Administrative Officer (VAO) or Collectorate.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
