
import { useLanguage } from '@/context/language-context';
import { translations } from '@/data/translations';

export function useTranslation() {
  const { language, t: translate } = useLanguage();

  const t = (key: string) => translate(key);

  // Correctly gets the feature array for the current language.
  const getFeatures = (): Array<{title: string, description: string, featureList: string[]}> => {
    return translations['home'][language]?.features || [];
  }

  // Constructs navigation links with the *actual translated strings*.
  const navigationLinks = [
    { href: '/news-sleuth', name: t('navigation.newsSleuth') },
    { href: '/video-integrity', name: t('navigation.videoIntegrity') },
    { href: '/audio-authenticator', name: t('navigation.audioAuthenticator') },
    { href: '/image-verifier', name: t('navigation.imageVerifier') },
  ];

  return { t, navigationLinks, getFeatures };
}
