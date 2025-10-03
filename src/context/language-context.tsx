
"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { translations } from '@/data/translations';

export type Language = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta';

export const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'mr', label: 'Marathi' },
  { value: 'te', label: 'Telugu' },
  { value: 'ta', label: 'Tamil' },
];

// This is the corrected function to recursively find the translation.
function getTranslatedValue(lang: Language, key: string): any {
    const keyParts = key.split('.');
    let currentObject: any = translations;

    for (const part of keyParts) {
        if (currentObject && typeof currentObject === 'object' && part in currentObject) {
            currentObject = currentObject[part];
        } else {
            // Key path is invalid
            return key;
        }
    }
    
    // After iterating through the key path, the final object should have the language key.
    if (currentObject && typeof currentObject === 'object' && lang in currentObject) {
        return currentObject[lang];
    }
    
    // Fallback if the final lookup fails
    return key;
}


interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // useMemo will re-create the `t` function only when the language changes.
  const t = useMemo(() => (key: string): any => {
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
