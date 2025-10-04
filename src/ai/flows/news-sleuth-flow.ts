
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent.
 *
 * This file defines the server-side logic for the News Sleuth feature, which
 * analyzes news articles for credibility using a Genkit flow.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import {
  NewsSleuthInputSchema,
  NewsSleuthOutputSchema,
  type NewsSleuthInput,
  type NewsSleuthOutput,
  type NewsSleuthError,
} from '@/ai/schemas';


async function runNewsSleuthAnalysis(
  input: NewsSleuthInput
): Promise<NewsSleuthOutput> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const { articleText, articleUrl, articleHeadline, language } = input;
  let articleInfo = '';
  if (articleText) articleInfo = `News Text: "${articleText}"`;
  else if (articleUrl) articleInfo = `URL: "${articleUrl}"`;
  else if (articleHeadline) articleInfo = `Headline: "${articleHeadline}"`;
  
  const prompt = `
    You are an advanced reasoning engine for detecting fake news. You MUST use your search capabilities to corroborate facts and find related stories.
    Generate a credibility report in ${language || 'en'}.
    Your output MUST be a single JSON object that conforms to the following schema:
    {
      "type": "object",
      "properties": {
        "overallScore": { "type": "number", "description": "A credibility score from 0-100." },
        "verdict": { "type": "string", "description": "Your final judgment (e.g., 'Likely Real', 'Likely Fake', 'Uncertain')." },
        "summary": { "type": "string", "description": "A brief summary of the article's main points and the analysis findings." },
        "biases": { "type": "string", "description": "An analysis of any detected biases (e.g., political, commercial)." },
        "flaggedContent": { "type": "array", "items": { "type": "string" }, "description": "A list of specific issues found, such as sensationalism or unverified claims." },
        "reasoning": { "type": "string", "description": "The reasoning behind the overall verdict and score." },
        "sources": { "type": "array", "items": { "type": "string" }, "description": "A list of URLs you used to corroborate facts. This MUST be populated from your search results." }
      },
      "required": ["overallScore", "verdict", "summary", "biases", "flaggedContent", "reasoning", "sources"]
    }

    Analyze the following:
    ${articleInfo}
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // The response is now guaranteed to be JSON because of responseMimeType.
  const parsedJson = JSON.parse(responseText);

  // Validate with Zod schema before returning
  const validation = NewsSleuthOutputSchema.safeParse(parsedJson);
  if (!validation.success) {
    throw new Error(`AI returned invalid JSON structure: ${validation.error.message}`);
  }

  return validation.data;
}


export async function newsSleuthAnalysis(
  input: NewsSleuthInput
): Promise<NewsSleuthOutput | NewsSleuthError> {
  try {
    const result = await runNewsSleuthAnalysis(input);
    return result;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.message.includes('SAFETY')) {
        return {
          error: 'API_SAFETY_ERROR',
          details: 'The analysis was blocked due to the content safety policy. The article may contain sensitive topics.',
        };
    }
     if (error.message.includes('invalid JSON')) {
      return {
        error: 'INVALID_JSON',
        details: `The AI model returned an invalid JSON format. Details: ${error.message}`,
      }
    }
    return {
      error: 'API_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to generate a response.',
    };
  }
}
