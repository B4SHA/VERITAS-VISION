
import { useLanguage } from '@/context/language-context';
import { translations } from '@/data/translations';

function getTranslatedValue(language: string, key: string) {
    const keyParts = key.split('.');
    let currentObject: any = translations;

    for (const part of keyParts) {
        if (currentObject[part] === undefined) {
            return key; // Key not found
        }
        currentObject = currentObject[part];
    }

    if (currentObject[language] === undefined) {
        // Fallback to English if the specific language is not available
        return currentObject['en'] || key;
    }

    return currentObject[language];
}


export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string) => getTranslatedValue(language, key);

  const getFeatures = () => {
    const features = translations.home[language]?.features || translations.home['en'].features;
    return features as Array<{title: string, description: string, featureList: string[]}>;
  }

  const navigationLinks = [
    { href: '/news-sleuth', name: t('navigation.newsSleuth') },
    { href: '/video-integrity', name: t('navigation.videoIntegrity') },
    { href: '/audio-authenticator', name: t('navigation.audioAuthenticator') },
    { href: '/image-verifier', name: t('navigation.imageVerifier') },
  ];

  return { t, navigationLinks, getFeatures };
}
