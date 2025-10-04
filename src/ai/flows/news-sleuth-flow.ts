
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent.
 *
 * This file defines the server-side logic for the News Sleuth feature, which
 * analyzes news articles for credibility.
 */

import {
  GoogleGenerativeAI,
  FunctionCall,
} from '@google/generative-ai';
import {
  NewsSleuthOutputSchema,
  type NewsSleuthInput,
  type NewsSleuthOutput,
  type NewsSleuthError,
} from '@/ai/schemas';

async function runNewsSleuthAnalysis(
  input: NewsSleuthInput
): Promise<NewsSleuthOutput | NewsSleuthError> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{googleSearch: {}}] });

  const { articleText, articleUrl, articleHeadline, language } = input;
  let articleInfo = '';
  if (articleText) articleInfo = `News Text: "${articleText}"`;
  else if (articleUrl) articleInfo = `URL: "${articleUrl}"`;
  else if (articleHeadline) articleInfo = `Headline: "${articleHeadline}"`;

  try {
    // Step 1: Perform search and gather facts
    const firstResult = await model.generateContent([
        `First, find information and sources about the following news item: ${articleInfo}.`,
        `Based on your search, provide a summary of the key facts, findings, and a list of all source URLs you used. Do not generate the final report yet.`
    ]);

    const searchResponse = firstResult.response;
    const searchSummary = searchResponse.text();
    const functionCalls = searchResponse.functionCalls();
    
    const sources: string[] = [];
    if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
            if (call.name === 'googleSearch' && call.args && Array.isArray(call.args.results)) {
                for (const searchResult of call.args.results) {
                    if (searchResult.url) {
                        sources.push(searchResult.url);
                    }
                }
            }
        }
    }
    
    // Step 2: Generate the final JSON report using the search results
    const finalPrompt = `
        You are an advanced reasoning engine for detecting fake news.
        Based on the initial research summary and the provided source URLs below, generate a final credibility report in ${language || 'en'}.

        Initial Research Summary:
        ${searchSummary}

        Sources Found:
        ${sources.join('\n')}

        Original News Item:
        ${articleInfo}
        
        Your output MUST be a single JSON object that conforms to the following schema. You must include the provided sources in the "sources" field of the JSON.
        {
          "type": "object",
          "properties": {
            "overallScore": { "type": "number", "description": "A credibility score from 0-100." },
            "verdict": { "type": "string", "description": "Your final judgment (e.g., 'Likely Real', 'Likely Fake', 'Uncertain')." },
            "summary": { "type": "string", "description": "A brief summary of the article's main points and the analysis findings." },
            "biases": { "type": "string", "description": "An analysis of any detected biases (e.g., political, commercial)." },
            "flaggedContent": { "type": "array", "items": { "type": "string" }, "description": "A list of specific issues found, such as sensationalism or unverified claims." },
            "reasoning": { "type": "string", "description": "The reasoning behind the overall verdict and score." },
            "sources": { "type": "array", "items": { "type": "string" }, "description": "A list of URLs used to corroborate facts." }
          },
          "required": ["overallScore", "verdict", "summary", "biases", "flaggedContent", "reasoning", "sources"]
        }
    `;

    // Use a model configured for JSON output for the final step
    const jsonModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
        }
    });

    const finalResult = await jsonModel.generateContent(finalPrompt);
    let responseText = finalResult.response.text();
    
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
