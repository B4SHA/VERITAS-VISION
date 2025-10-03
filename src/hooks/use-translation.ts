
'use client';

import { useLanguage, type Language } from '@/context/language-context';
import en from '@/lib/translations/en.json';
import hi from '@/lib/translations/hi.json';
import bn from '@/lib/translations/bn.json';
import mr from '@/lib/translations/mr.json';
import te from '@/lib/translations/te.json';
import ta from '@/lib/translations/ta.json';
import { useMemo } from 'react';

const translations = { en, hi, bn, mr, te, ta };

function getTranslatedValue(langData: any, key: string): any {
    const keyParts = key.split('.');
    let currentObject: any = langData;

    for (const part of keyParts) {
        if (currentObject && typeof currentObject === 'object' && part in currentObject) {
            currentObject = currentObject[part];
        } else {
            return key; // Key path is invalid, return the key itself as a fallback
        }
    }
    
    return currentObject;
}

export function useTranslation() {
  const { language } = useLanguage();

  const activeTranslations = useMemo(() => translations[language] || en, [language]);

  const t = (key: string): string => {
    const value = getTranslatedValue(activeTranslations, key);
    if (typeof value === 'string') {
        return value;
    }
    return key;
  };

  const getFeatures = (): Array<{title: string, description: string, featureList: string[]}> => {
    return activeTranslations.home.features || [];
  }

  const navigationLinks = [
    { href: '/news-sleuth', name: t('navigation.newsSleuth') },
    { href: '/video-integrity', name: t('navigation.videoIntegrity') },
    { href: '/audio-authenticator', name: t('navigation.audioAuthenticator') },
    { href: '/image-verifier', name: t('navigation.imageVerifier') },
  ];

  return { t, navigationLinks, getFeatures, language };
}
