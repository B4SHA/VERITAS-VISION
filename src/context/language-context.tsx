
"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

export type Language = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta';

export const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'mr', label: 'Marathi' },
  { value: 'te', label: 'Telugu' },
  { value: 'ta', label: 'Tamil' },
];

const translations: Record<string, Record<Language, string>> = {
  "News": {
    "en": "News",
    "hi": "समाचार",
    "bn": "খবর",
    "mr": "बातम्या",
    "te": "వార్తలు",
    "ta": "செய்திகள்"
  },
  "Video": {
    "en": "Video",
    "hi": "वीडियो",
    "bn": "ভিডিও",
    "mr": "व्हिडिओ",
    "te": "వీడియో",
    "ta": "காணொளி"
  },
  "Audio": {
    "en": "Audio",
    "hi": "ऑडियो",
    "bn": "অডিও",
    "mr": "ऑडिओ",
    "te": "ఆడియో",
    "ta": "ஆடியோ"
  },
  "Image": {
    "en": "Image",
    "hi": "छवि",
    "bn": "ছবি",
    "mr": "प्रतिमा",
    "te": "చిత్రం",
    "ta": "படம்"
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useMemo(() => (key: string): string => {
    return translations[key]?.[language] || key;
  }, [language]);

  const value = { language, setLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
