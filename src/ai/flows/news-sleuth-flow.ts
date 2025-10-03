
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
  verdict: z.enum(['Likely Real', 'Likely Fake', 'Uncertain']).describe('The final judgment on the article\'s credibility.'),
  summary: z.string().describe('A brief summary of the article\'s main points.'),
  biases: z.string().describe('An analysis of any detected biases (e.g., political, commercial).'),
  flaggedContent: z.string().describe('Description of any sensationalism, logical fallacies, or other flagged content.'),
  reasoning: z.string().describe('The reasoning behind the overall verdict and score.'),
  sources: z.array(z.string()).describe('A list of URLs used to corroborate facts.'),
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
    articleInfo += `You MUST fetch and analyze the content from this primary URL: ${input.articleUrl}\n\n`;
  }

  const prompt = `You are an advanced reasoning engine for detecting fake news. Analyze the provided article information and generate a credibility report in ${input.language}.

Your JSON output must include these fields:
- overallScore: A credibility score from 0-100.
- verdict: Your final judgment ('Likely Real', 'Likely Fake', or 'Uncertain').
- summary: A brief summary of the article.
- biases: Analysis of any detected political, commercial, or other biases.
- flaggedContent: Description of any sensationalism, logical fallacies, or other flagged content.
- reasoning: The reasoning behind your overall verdict and score.
- sources: An array of URLs you used to verify the information.

Article Information for Analysis:
${articleInfo}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // First, try to parse directly
    try {
      const parsed = JSON.parse(text);
      return NewsSleuthOutputSchema.parse(parsed);
    } catch (e) {
      // If direct parse fails, try to extract from markdown
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          return NewsSleuthOutputSchema.parse(parsed);
        } catch (e2) {
          console.error("Failed to parse extracted markdown JSON:", match[1]);
        }
      }

      // If markdown extraction fails, try to find the JSON object manually
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const jsonString = text.substring(startIndex, endIndex + 1);
        try {
            const parsed = JSON.parse(jsonString);
            return NewsSleuthOutputSchema.parse(parsed);
        } catch (e3) {
            console.error("Failed to parse substring JSON:", jsonString);
        }
      }
      
      // If all else fails, return the error object
      console.error("RAW AI RESPONSE THAT FAILED TO PARSE:", text);
      return { error: 'PARSING_FAILED', rawResponse: text };
    }
  } catch (error) {
    console.error("Error during AI generation:", error);
    return { error: 'GENERATION_FAILED', rawResponse: 'The AI model failed to generate a response.' };
  }
}
