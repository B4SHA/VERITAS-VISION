
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  },
};

export default function Home() {
  const { t } = useTranslation();

  const features = t('home.features') as Array<{title: string, description: string, featureList: string[]}>;

  const tryNowFeatures = [
    {
        Icon: Icons.news,
        title: t('navigation.newsSleuth'),
        description: t('home.features.0.description').substring(0,45) + '...',
        href: '/news-sleuth',
    },
    {
        Icon: Icons.video,
        title: t('navigation.videoIntegrity'),
        description: t('home.features.1.description').substring(0,45) + '...',
        href: '/video-integrity',
    },
    {
        Icon: Icons.audio,
        title: t('navigation.audioAuthenticator'),
        description: t('home.features.2.description').substring(0,45) + '...',
        href: '/audio-authenticator',
    },
    {
        Icon: Icons.image,
        title: t('navigation.imageVerifier'),
        description: t('home.features.3.description').substring(0,45) + '...',
        href: '/image-verifier',
    },
]

  const featureIcons = [Icons.news, Icons.video, Icons.audio, Icons.image];
  const featureHrefs = ['/news-sleuth', '/video-integrity', '/audio-authenticator', '/image-verifier'];


  return (
    <div className="w-full flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center relative p-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-primary via-orange-500 to-primary dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              {t('home.heroTitle')}
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto">
              {t('home.heroSubtitle')}
            </p>
          </motion.div>
        </div>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10"
        >
            <ChevronDown className="h-8 w-8 text-muted-foreground animate-bounce" />
        </motion.div>
      </section>

      {/* Try It Now Section */}
      <motion.section
        className="w-full py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="container">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">{t('home.tryNowTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {tryNowFeatures.map((feature) => (
                    <Link key={feature.href} href={feature.href} className="group">
                        <Card className="p-8 h-full flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-primary">
                            <feature.Icon className="h-20 w-20 mb-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                            <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
      </motion.section>

      {/* Feature Sections */}
      {features.map((feature, index) => {
          const Icon = featureIcons[index];
          const href = featureHrefs[index];
          return (
            <motion.section
              key={feature.title}
              className="w-full flex items-center justify-center py-20 md:py-28"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={sectionVariants}
            >
              <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
                  <div className={cn("flex justify-center", index % 2 === 1 && "md:order-last")}>
                    <Icon className="w-48 h-48 md:w-64 md:h-64 text-primary" />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">{feature.title}</h2>
                    <p className="text-lg text-muted-foreground mb-6">{feature.description}</p>
                    <ul className="space-y-3 text-left mb-8">
                      {feature.featureList.map((item, i) => (
                         <li key={i} className="flex items-start">
                            <Icons.checkCircle className="h-5 w-5 text-primary mr-3 mt-1 shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                         </li>
                      ))}
                    </ul>
                    <Link href={href}>
                      <Button size="lg" className="group text-lg">
                        {t('home.launchButton')} {feature.title}
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          )
        })}
    </div>
  );
}
