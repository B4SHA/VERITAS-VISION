
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {googleSearch} from '@genkit-ai/google-search';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta'
    }),
    googleSearch(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
