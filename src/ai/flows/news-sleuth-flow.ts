
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent using the direct Gemini API.
 *
 * This file defines the server-side logic for the News Sleuth feature, which
 * analyzes news articles for credibility by calling the Gemini API directly.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  type NewsSleuthInput,
  type NewsSleuthOutput,
  type NewsSleuthError,
} from '@/ai/schemas';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


const NewsSleuthOutputJsonSchema = {
    "type": "object",
    "properties": {
        "overallScore": {
            "type": "number",
            "description": "A credibility score from 0 to 100."
        },
        "verdict": {
            "type": "string",
            "enum": ['Likely Real', 'Likely Fake', 'Uncertain', 'Propaganda/Disinformation', 'Satire/Parody', 'Sponsored Content', 'Opinion/Analysis'],
            "description": "The final judgment on the article's credibility."
        },
        "summary": {
            "type": "string",
            "description": "A brief summary of the article's main points."
        },
        "biases": {
            "type": "string",
            "description": "An analysis of any detected biases (e.g., political, commercial)."
        },
        "flaggedContent": {
            "type": "array",
            "items": { "type": "string" },
            "description": "A list of specific issues found, such as sensationalism, logical fallacies, or unverified claims."
        },
        "reasoning": {
            "type": "string",
            "description": "The reasoning behind the overall verdict and score."
        }
    },
    "required": ["overallScore", "verdict", "summary", "biases", "flaggedContent", "reasoning"]
};

export async function newsSleuthAnalysis(
  input: NewsSleuthInput
): Promise<NewsSleuthOutput | NewsSleuthError> {
  let articleInfo = '';
  if (input.articleText) articleInfo += `Full Text: ${input.articleText}\n`;
  if (input.articleHeadline) articleInfo += `Headline: ${input.articleHeadline}\n`;
  if (input.articleUrl) articleInfo += `URL: ${input.articleUrl}\n`;

  const prompt = `
    You are a world-class investigative journalist and fact-checker AI.
    Task:
    1. Analyze the provided articleInfo for credibility. If a URL is provided, you MUST fetch its content.
    2. Use googleSearch to find corroborating/contradictory sources in ${input.language}.
    3. Identify biases, flag misleading claims, and score credibility (0-100).
    4. Output in ${input.language} as a JSON object matching the provided schema.

    Article Info: ${articleInfo}
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: NewsSleuthOutputJsonSchema as any,
      },
    });

    const response = result.response;
    if (!response.text()) {
        throw new Error("The AI model returned an empty response.");
    }
    const output = JSON.parse(response.text());

    // Extract sources from grounding metadata
    const metadata = response.candidates?.[0]?.groundingMetadata;
    const searchResults = metadata?.groundingAttributions || [];
    const sources = searchResults.map(attribution => attribution.web?.uri || '').filter(uri => !!uri);

    return { ...output, sources: sources };
  } catch (error: any) {
    console.error('API Error:', error);
    return {
      error: 'API_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to generate a response.',
    };
  }
}
