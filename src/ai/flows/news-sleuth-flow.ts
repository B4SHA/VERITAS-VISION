
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent using the direct Gemini API.
 *
 * This file defines the server-side logic for the News Sleuth feature, which
 * analyzes news articles for credibility by calling the Gemini API directly.
 */

import { GoogleGenerativeAI, type GenerateContentRequest } from '@google/generative-ai';
import {
  type NewsSleuthInput,
  type NewsSleuthOutput,
  type NewsSleuthError,
  NewsSleuthOutputSchema,
} from '@/ai/schemas';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


export async function newsSleuthAnalysis(
  input: NewsSleuthInput
): Promise<NewsSleuthOutput | NewsSleuthError> {
  let articleInfo = '';
  if (input.articleText) articleInfo += `Full Text: ${input.articleText}\n`;
  if (input.articleHeadline) articleInfo += `Headline: ${input.articleHeadline}\n`;
  if (input.articleUrl) articleInfo += `URL: ${input.articleUrl}\n`;

  const prompt = `
    You are a world-class investigative journalist and fact-checker AI.
    Your task is to analyze the provided article information for credibility and generate a report.
    
    1.  If a URL is provided in the Article Info, you MUST use the Google Search tool to fetch its content and analyze it. Do not analyze the URL string itself.
    2.  Use the Google Search tool to find corroborating or contradictory sources for the claims made in the article.
    3.  Identify any biases (political, commercial, etc.), sensationalism, or logical fallacies.
    4.  You MUST populate the "sources" field in the JSON output with the URLs of the web pages you consulted during your search. If you are not given a URL and cannot perform a search, this array must be empty.
    5.  You MUST output your final report in ${input.language}.
    6.  Your entire response MUST be a single, valid JSON object that strictly adheres to the following JSON schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
    
    JSON Schema: ${JSON.stringify(NewsSleuthOutputSchema.jsonSchema)}

    Article Info:
    ${articleInfo}
  `;

  try {

    const request: GenerateContentRequest = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: NewsSleuthOutputSchema.jsonSchema,
        },
    };

    if (input.articleUrl) {
        request.tools = [{ googleSearch: {} }];
    }

    const result = await model.generateContent(request);

    const response = result.response;
    let output: NewsSleuthOutput;
    
    // The response is already a parsed JSON object because of responseMimeType
    output = response.text() as unknown as NewsSleuthOutput;
    
    return output;

  } catch (error: any) {
    console.error('API Error:', error);
    if (error.message.includes('SAFETY')) {
        return {
          error: 'API_SAFETY_ERROR',
          details: 'The analysis was blocked due to the content safety policy. The article may contain sensitive topics.',
        };
    }
    return {
      error: 'API_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to generate a response.',
    };
  }
}
