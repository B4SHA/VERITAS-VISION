
import { useLanguage, type Language } from '@/context/language-context';
import { translations } from '@/data/translations';

function getTranslatedValue(lang: Language, key: string): any {
    const keyParts = key.split('.');
    let currentObject: any = translations;

    for (const part of keyParts) {
        if (currentObject && typeof currentObject === 'object' && part in currentObject) {
            currentObject = currentObject[part];
        } else {
            // Key path is invalid, return the key itself as a fallback
            return key;
        }
    }
    
    // After iterating, the final object should have the language key.
    if (currentObject && typeof currentObject === 'object' && lang in currentObject) {
        return currentObject[lang];
    }
    
    // Fallback if the final lookup fails for any reason
    return key;
}


export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string): string => {
    const value = getTranslatedValue(language, key);
    // Ensure we always return a string for simple text translations
    if (typeof value === 'string') {
        return value;
    }
    // If we get an object or something else, return the key as a safe fallback
    return key;
  };

  const getFeatures = (): Array<{title: string, description: string, featureList: string[]}> => {
    // This function specifically gets the features array
    return translations.home?.[language]?.features || [];
  }

  const navigationLinks = [
    { href: '/news-sleuth', name: t('navigation.newsSleuth') },
    { href: '/video-integrity', name: t('navigation.videoIntegrity') },
    { href: '/audio-authenticator', name: t('navigation.audioAuthenticator') },
    { href: '/image-verifier', name: t('navigation.imageVerifier') },
  ];

  return { t, navigationLinks, getFeatures, language };
}
