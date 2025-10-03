import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-audio-authenticity.ts';
import '@/ai/flows/analyze-news-article-credibility.ts';
import '@/ai/flows/analyze-image-authenticity.ts';
import '@/ai/flows/analyze-video-integrity.ts';