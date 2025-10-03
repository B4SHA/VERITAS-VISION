import { useLanguage } from '@/context/language-context';

export function useTranslation() {
  const { t } = useLanguage();

  const navigationLinks = [
    { href: '/news', name: t('News') },
    { href: '/video', name: t('Video') },
    { href: '/audio', name: t('Audio') },
    { href: '/image', name: t('Image') },
  ];

  return { t, navigationLinks };
}
