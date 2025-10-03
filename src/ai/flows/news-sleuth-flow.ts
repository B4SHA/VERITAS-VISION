
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

const NewsSleuthInputSchema = z.object({
  articleText: z.string().optional().describe('The full text of the news article.'),
  articleUrl: z.string().optional().describe('The URL of the news article.'),
  articleHeadline: z.string().optional().describe('The headline of the news article.'),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

const NewsSleuthOutputSchema = z.object({
  overallScore: z.number().describe('A credibility score from 0-100.'),
  verdict: z.enum(['Likely Real', 'Likely Fake', 'Uncertain', 'Propaganda/Disinformation', 'Satire/Parody', 'Sponsored Content', 'Opinion/Analysis']).describe('The final judgment on the article\'s credibility.'),
  summary: z.string().describe('A brief summary of the article\'s main points.'),
  biases: z.string().describe('An analysis of any detected biases (e.g., political, commercial).'),
  flaggedContent: z.array(z.string()).describe('A list of specific issues found, such as sensationalism, logical fallacies, or unverified claims.'),
  reasoning: z.string().describe('The reasoning behind the overall verdict and score.'),
  sources: z.array(z.string()).describe('A list of URLs used to corroborate facts. This MUST be populated from the search results.'),
});

export type NewsSleuthInput = z.infer<typeof NewsSleuthInputSchema>;
export type NewsSleuthOutput = z.infer<typeof NewsSleuthOutputSchema>;
export type NewsSleuthError = { error: string; rawResponse: string };

export async function newsSleuthAnalysis(input: NewsSleuthInput): Promise<NewsSleuthOutput | NewsSleuthError> {
  let articleInfo = '';
  if (input.articleText) {
    articleInfo += `Full Article Text:\n---\n${input.articleText}\n---\n`;
  }
  if (input.articleHeadline) {
    articleInfo += `Headline: "${input.articleHeadline}"\n`;
  }
  if (input.articleUrl) {
    articleInfo += `Primary Article URL: ${input.articleUrl}\n\n`;
  }

  const prompt = `You are an advanced reasoning engine for detecting fake news. You MUST use your search grounding tool to corroborate facts and find related stories. Generate a credibility report in ${input.language || 'en'}.

Your JSON output must follow this structure exactly:
- overallScore: A credibility score from 0-100.
- verdict: Your final judgment (e.g., 'Likely Real', 'Likely Fake', 'Uncertain', 'Satire/Parody', etc.).
- summary: A brief summary of the article.
- biases: Analysis of any detected political, commercial, or other biases.
- flaggedContent: An array of strings describing any sensationalism, logical fallacies, or other flagged content.
- reasoning: The reasoning behind your overall verdict and score.
- sources: You MUST list the URLs you used from your search grounding in the 'sources' array. This should not include the original article URL unless it's the only source.

Article Information for Analysis:
${articleInfo}`;

  try {
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{
          "google_search_retrieval": {}
        }]
    });
    
    const response = result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      return NewsSleuthOutputSchema.parse(parsed);
    } catch (e) {
      console.error("RAW AI RESPONSE THAT FAILED TO PARSE:", text);
      return { error: 'PARSING_FAILED', rawResponse: text };
    }
  } catch (error) {
    console.error("Error during AI generation:", error);
    return { error: 'GENERATION_FAILED', rawResponse: 'The AI model failed to generate a response.' };
  }
}
