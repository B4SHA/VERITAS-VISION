
"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { translations as allTranslations } from '@/data/translations';

export type Language = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta';

export const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'mr', label: 'Marathi' },
  { value: 'te', label: 'Telugu' },
  { value: 'ta', label: 'Tamil' },
];

function getTranslatedValue(language: string, key: string) {
    const keyParts = key.split('.');
    let currentObject: any = allTranslations;

    for (const part of keyParts) {
        if (currentObject[part] === undefined) {
            return key; // Key not found
        }
        currentObject = currentObject[part];
    }

    if (typeof currentObject === 'object' && currentObject !== null && currentObject[language] !== undefined) {
        // This handles keys that point to an object with language variants, like "home.heroTitle"
        return currentObject[language];
    } else if (typeof currentObject === 'string') {
        // This handles cases where the key itself might already be a translated string (less common in this structure)
        return currentObject;
    }

    // Fallback to English if the specific language is not available or if the structure is unexpected
    return (currentObject && currentObject['en']) || key;
}


interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useMemo(() => (key: string): string => {
    return getTranslatedValue(language, key);
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
