
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent.
 *
 * This file defines the server-side logic for the News Sleuth feature, which
 * analyzes news articles for credibility using a Genkit flow.
 */

import {
  GoogleGenerativeAI,
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
): Promise<NewsSleuthOutput | NewsSleuthError> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  // Use a model that supports tool use
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    tools: [{
        googleSearch: {},
    }],
  });

  const { articleText, articleUrl, articleHeadline, language } = input;
  let articleInfo = '';
  if (articleText) articleInfo = `News Text: "${articleText}"`;
  else if (articleUrl) articleInfo = `URL: "${articleUrl}"`;
  else if (articleHeadline) articleInfo = `Headline: "${articleHeadline}"`;
  
  const prompt = `
    You are an advanced reasoning engine for detecting fake news. You MUST use your search grounding tool to corroborate facts and find related stories.
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
        "reasoning": { "type": "string", "description": "The reasoning behind the overall verdict and score." }
      },
      "required": ["overallScore", "verdict", "summary", "biases", "flaggedContent", "reasoning"]
    }

    Do not include the sources in the JSON. The sources will be derived from your tool calls.

    Analyze the following:
    ${articleInfo}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let responseText = response.text();
    
    // Extract JSON from the response text
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        responseText = jsonMatch[1];
    }

    let parsedJson;
    try {
        parsedJson = JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse JSON:", responseText);
        return {
          error: 'INVALID_JSON',
          details: 'The AI model returned an invalid JSON format.',
        };
    }

    const validation = NewsSleuthOutputSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.error(`AI returned invalid JSON structure: ${validation.error.message}`);
      return {
        error: 'INVALID_JSON',
        details: `The AI model returned an invalid JSON structure: ${validation.error.message}`,
      };
    }
    
    const output = validation.data;

    // Extract sources from function calls
    const functionCalls = response.functionCalls();
    const sources: string[] = [];
    if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
            if (call.name === 'googleSearch' && call.args && call.args.results) {
                for (const result of call.args.results) {
                    if (result.url) {
                        sources.push(result.url);
                    }
                }
            }
        }
    }
    output.sources = sources;

    return output;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.response && error.response.promptFeedback) {
      return {
        error: 'API_SAFETY_ERROR',
        details: `The analysis was blocked due to a content safety policy: ${error.response.promptFeedback.blockReason}`,
      };
    }
    return {
      error: 'API_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to generate a response.',
    };
  }
}

export async function newsSleuthAnalysis(
  input: NewsSleuthInput
): Promise<NewsSleuthOutput | NewsSleuthError> {
  const result = await runNewsSleuthAnalysis(input);
  return result;
}
