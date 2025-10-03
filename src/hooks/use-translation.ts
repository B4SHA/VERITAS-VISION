
import { useLanguage } from '@/context/language-context';
import { translations } from '@/data/translations';

export function useTranslation() {
  const { language, t } = useLanguage();

  const getFeatures = () => {
    return translations['home'][language].features as Array<{title: string, description: string, featureList: string[]}>;
  }

  const navigationLinks = [
    { href: '/news-sleuth', name: t('navigation.newsSleuth') },
    { href: '/video-integrity', name: t('navigation.videoIntegrity') },
    { href: '/audio-authenticator', name: t('navigation.audioAuthenticator') },
    { href: '/image-verifier', name: t('navigation.imageVerifier') },
  ];

  return { t, navigationLinks, getFeatures };
}
