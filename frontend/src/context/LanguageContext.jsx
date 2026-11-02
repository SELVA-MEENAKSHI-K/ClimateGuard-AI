import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import taTranslations from '../locales/ta.json';
import enTranslations from '../locales/en.json';

const LanguageContext = createContext();

const translations = {
  ta: taTranslations,
  en: enTranslations,
};

export const LanguageProvider = ({ children }) => {
  // Default to Tamil (ta) per requirements
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('climateguard_lang') || 'ta';
  });

  const [tamilVoiceAvailable, setTamilVoiceAvailable] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    localStorage.setItem('climateguard_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Check speech synthesis voice availability
  useEffect(() => {
    const checkVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const hasTaVoice = voices.some(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
        setTamilVoiceAvailable(hasTaVoice);
      }
    };

    checkVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }
  }, []);

  // Translation helper: t('app.title')
  const t = useCallback((path, fallback = '') => {
    const keys = path.split('.');
    let current = translations[lang];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English if missing in current
        let fallbackVal = translations.en;
        for (const fbKey of keys) {
          if (fallbackVal && fallbackVal[fbKey] !== undefined) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            return fallback || path;
          }
        }
        return fallbackVal;
      }
    }
    return current;
  }, [lang]);

  // Audio speech synthesis
  const speakText = useCallback((text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (lang === 'ta') {
      const taVoice = voices.find(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
      if (taVoice) {
        utterance.voice = taVoice;
        utterance.lang = 'ta-IN';
      } else {
        utterance.lang = 'en-IN';
      }
    } else {
      const enVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  }, [lang]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{
      lang,
      setLang,
      t,
      tamilVoiceAvailable,
      isPlayingAudio,
      speakText,
      stopSpeech
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
