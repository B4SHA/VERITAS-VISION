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
  // App Titles
  app_title_short: { en: "Veritas", hi: "वेरिटास", bn: "ভেরিটাস", mr: "व्हेरिटास", te: "వెరిటాస్", ta: "வெரிடாஸ்" },
  app_title_long: { en: "Veritas Vision", hi: "वेरिटास विजन", bn: "ভেরিটাস ভিশন", mr: "व्हेरिटास व्हिजन", te: "వెరిటాస్ విజన్", ta: "வெரிடாஸ் விஷன்" },

  // Nav
  news_sleuth_nav: { en: "News Sleuth", hi: "न्यूज स्लूथ", bn: "নিউজ স্লুথ", mr: "न्यूज स्लथ", te: "న్యూస్ స్లూత్", ta: "நியூஸ் ஸ்லூத்" },
  video_integrity_nav: { en: "Video Integrity", hi: "वीडियो इंटीग्रिटी", bn: "ভিডিও ইন্টিগ্রিটি", mr: "व्हिडिओ इंटिग्रिटी", te: "వీడియో ఇంటిగ్రిటీ", ta: "வீடியோ இன்டெக்ரிட்டி" },
  audio_authenticator_nav: { en: "Audio Authenticator", hi: "ऑडियो ऑथेंटिकेटर", bn: "অডিও অথেন্টিকেটর", mr: "ऑडिओ ऑथेंटिकेटर", te: "ఆడియో ప్రామాణీకరణ", ta: "ஆடியோ அங்கீகரிப்பாளர்" },
  image_verifier_nav: { en: "Image Verifier", hi: "इमेज वेरिफायर", bn: "ইমেজ ভেরিফায়ার", mr: "इमेज व्हेरिफायर", te: "చిత్ర ధృవీకరణ", ta: "பட சரிபார்ப்பு" },
  
  // Page Titles
  news_sleuth_title: { en: "News Article Analysis", hi: "समाचार लेख विश्लेषण", bn: "সংবাদ নিবন্ধ বিশ্লেষণ", mr: "बातम्या लेख विश्लेषण", te: "వార్తా కథన విశ్లేషణ", ta: "செய்தி கட்டுரை பகுப்பாய்வு" },
  video_integrity_title: { en: "Video Integrity Analysis", hi: "वीडियो इंटीग्रिटी विश्लेषण", bn: "ভিডিও ইন্টিগ্রেটি বিশ্লেষণ", mr: "व्हिडिओ इंटिग्रिटी विश्लेषण", te: "వీడియో ఇంటిగ్రిటీ విశ్లేషణ", ta: "வீடியோ ஒருமைப்பாடு பகுப்பாய்வு" },
  audio_authenticator_title: { en: "Audio Authenticity Analysis", hi: "ऑडियो प्रामाणिकता विश्लेषण", bn: "অডিওর সত্যতা বিশ্লেষণ", mr: "ऑडिओ प्रामाणिकता विश्लेषण", te: "ఆడియో ప్రామాణికత విశ్లేషణ", ta: "ஆடியோ நம்பகத்தன்மை பகுப்பாய்வு" },
  image_verifier_title: { en: "Image Authenticity Analysis", hi: "छवि प्रामाणिकता विश्लेषण", bn: "ছবির সত্যতা বিশ্লেষণ", mr: "प्रतिमा प्रामाणिकता विश्लेषण", te: "చిత్ర ప్రామాణికత విశ్లేషణ", ta: "படத்தின் நம்பகத்தன்மை பகுப்பாய்வு" },

  // Common
  analyze: { en: "Analyze", hi: "विश्लेषण करें", bn: "বিশ্লেষণ করুন", mr: "विश्लेषण करा", te: "విశ్లేషించండి", ta: "பகுப்பாய்வு செய்" },
  analysis_report: { en: "Analysis Report", hi: "विश्लेषण रिपोर्ट", bn: "বিশ্লেষণ প্রতিবেদন", mr: "विश्लेषण अहवाल", te: "విశ్లేషణ నివేదిక", ta: "பகுப்பாய்வு அறிக்கை" },
  summary: { en: "Summary", hi: "सारांश", bn: "সারসংক্ষেপ", mr: "सारांश", te: "సారాంశం", ta: "சுருக்கம்" },
  analysis: { en: "Analysis", hi: "विश्लेषण", bn: "বিশ্লেষণ", mr: "विश्लेषण", te: "విశ్లేషణ", ta: "பகுப்பாய்வு" },
  confidence: { en: "Confidence", hi: "आत्मविश्वास", bn: "আত্মবিশ্বাস", mr: "आत्मविश्वास", te: "ఆత్మవిశ్వాసం", ta: "நம்பிக்கை" },
  
  // News Sleuth Specific
  paste_article_text: { en: "Paste article text", hi: "लेख का टेक्स्ट पेस्ट करें", bn: "নিবন্ধের পাঠ্য পেস্ট করুন", mr: "लेखाचा मजकूर पेस्ट करा", te: "వ్యాసం టెక్స్ట్ అతికించండి", ta: "கட்டுரை உரையை ஒட்டவும்" },
  or_enter_url: { en: "or enter a URL", hi: "या एक यूआरएल दर्ज करें", bn: "অথবা একটি URL লিখুন", mr: "किंवा URL प्रविष्ट करा", te: "లేదా ఒక URL నమోదు చేయండి", ta: "அல்லது ஒரு URL ஐ உள்ளிடவும்" },
  article_url: { en: "Article URL", hi: "लेख यूआरएल", bn: "নিবন্ধের URL", mr: "लेखाचा URL", te: "వ్యాసం URL", ta: "கட்டுரை URL" },
  credibility_score: { en: "Credibility Score", hi: "विश्वसनीयता स्कोर", bn: "বিশ্বাসযোগ্যতা স্কোর", mr: "विश्वसनीयता गुण", te: "విశ్వసనీయత స్కోరు", ta: "நம்பகத்தன்மை மதிப்பெண்" },
  misinformation: { en: "Misinformation", hi: "गलत सूचना", bn: "ভুল তথ্য", mr: "चुकीची माहिती", te: "తప్పుడు సమాచారం", ta: "தவறான தகவல்" },
  bias: { en: "Bias", hi: "पक्षपात", bn: "পক্ষপাত", mr: "पक्षपात", te: "పక్షపాతం", ta: "சார்பு" },
  detected: { en: "Detected", hi: "पता चला", bn: "শনাক্ত করা হয়েছে", mr: "शोधले", te: "గుర్తించబడింది", ta: "கண்டறியப்பட்டது" },
  not_detected: { en: "Not Detected", hi: "पता नहीं चला", bn: "শনাক্ত করা হয়নি", mr: "शोधले नाही", te: "గుర్తించబడలేదు", ta: "கண்டறியப்படவில்லை" },
  text: { en: "Text", hi: "टेक्स्ट", bn: "পাঠ্য", mr: "मजकूर", te: "టెక్స్ట్", ta: "உரை" },
  url: { en: "URL", hi: "यूआरएल", bn: "URL", mr: "URL", te: "URL", ta: "URL" },
  
  // File upload
  drop_file_here: { en: "Drop the file here ...", hi: "फ़ाइल यहाँ छोड़ें ...", bn: "ফাইলটি এখানে ফেলুন...", mr: "फाईल येथे टाका...", te: "ఫైల్ను ఇక్కడ వదలండి ...", ta: "கோப்பை இங்கே விடுங்கள் ..." },
  drag_drop_file: { en: "Drag 'n' drop a file here, or click to select a file", hi: "फ़ाइल को यहाँ खींचें और छोड़ें, या फ़ाइल चुनने के लिए क्लिक करें", bn: "এখানে একটি ফাইল টেনে আনুন, অথবা একটি ফাইল নির্বাচন করতে ক্লিক করুন", mr: "येथे फाईल ड्रॅग-एन-ड्रॉप करा, किंवा फाईल निवडण्यासाठी क्लिक करा", te: "ఇక్కడ ఫైల్ను లాగండి, లేదా ఫైల్ను ఎంచుకోవడానికి క్లిక్ చేయండి", ta: "ஒரு கோப்பை இங்கே இழுத்து விடுங்கள், அல்லது ஒரு கோப்பைத் தேர்ந்தெடுக்க கிளிக் செய்யவும்" },

  // Verdicts
  authentic: { en: "Authentic", hi: "प्रामाणिक", bn: "খাঁটি", mr: "अस्सल", te: "ప్రామాణికమైనది", ta: "உண்மையானது" },
  likely_authentic: { en: "Likely Authentic", hi: "संभवतः प्रामाणिक", bn: "সম্ভবত খাঁটি", mr: "बहुतेक अस्सल", te: "బహుశా ప్రామాణికమైనది", ta: "அநேகமாக உண்மையானது" },
  inconclusive: { en: "Inconclusive", hi: "अनिर्णायक", bn: "অমীমাংসিত", mr: "अनिर्णायक", te: "అసంపూర్ణం", ta: "முடிவற்றது" },
  potential_manipulation: { en: "Potential Manipulation", hi: "संभावित हेरफेर", bn: "সম্ভাব্য কারসাজি", mr: "संभाव्य फेरफार", te: "సంభావ్య తారుమారు", ta: "சாத்தியமான கையாளுதல்" },
  likely_ai_generated: { en: "Likely AI-Generated", hi: "संभवतः एआई-जनरेटेड", bn: "সম্ভবত এআই-জেনারেটেড", mr: "बहुतेक AI-व्युत्पन्न", te: "బహుశా AI-ఉత్పత్తి", ta: "அநேகமாக AI-உருவாக்கப்பட்டது" },
  deepfake: { en: "Deepfake", hi: "डीपफेक", bn: "ডিপফেক", mr: "डीपफेक", te: "డీప్ఫేక్", ta: "டீப்ஃபேக்" },
  ai_generated: { en: "AI-Generated", hi: "एआई-जनरेटेड", bn: "এআই-জেনারেটেড", mr: "AI-व्युत्पन्न", te: "AI-ఉత్పత్తి", ta: "AI-உருவாக்கப்பட்டது" },
  misleading_speech: { en: "Misleading Speech", hi: "भ्रामक भाषण", bn: "বিভ্রান্তিকর বক্তৃতা", mr: "दिशाभूल करणारी भाषण", te: "తప్పుదారి పట్టించే ప్రసంగం", ta: "தவறான பேச்சு" },

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
