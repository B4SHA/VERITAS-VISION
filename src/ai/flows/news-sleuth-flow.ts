
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent.
 *
 * This file defines the server-side logic for the News Sleuth feature, which
 * analyzes news articles for credibility using a Genkit flow.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  NewsSleuthInputSchema,
  NewsSleuthOutputSchema,
  type NewsSleuthInput,
  type NewsSleuthOutput,
  type NewsSleuthError,
} from '@/ai/schemas';

const newsSleuthPrompt = ai.definePrompt({
  name: 'newsSleuthPrompt',
  tools: [googleAI.tool('googleSearch')],
  output: {
    schema: NewsSleuthOutputSchema,
    format: 'json',
  },
  prompt: `You are a world-class investigative journalist and fact-checker AI.
Your task is to analyze the provided article information for credibility and generate a report.
You MUST use the Google Search tool to find corroborating or contradictory sources for the claims made in the article.

Your final JSON report must be in {{language}} and include:
- overallScore: A credibility score from 0-100.
- verdict: Your final judgment (e.g., 'Likely Real', 'Likely Fake', 'Uncertain').
- summary: A brief summary of the article's main points and the analysis findings.
- biases: An analysis of any detected biases (e.g., political, commercial).
- flaggedContent: A list of specific issues found, such as sensationalism or unverified claims.
- reasoning: The reasoning behind the overall verdict and score.
- sources: A list of URLs you used to corroborate facts. This MUST be populated from the search results.

Analyze the following:
{{#if articleText}}Article Text: "{{articleText}}"{{/if}}
{{#if articleUrl}}Article URL: "{{articleUrl}}"{{/if}}
{{#if articleHeadline}}Article Headline: "{{articleHeadline}}"{{/if}}
`,
});

const newsSleuthFlow = ai.defineFlow(
  {
    name: 'newsSleuthFlow',
    inputSchema: NewsSleuthInputSchema,
    outputSchema: NewsSleuthOutputSchema,
  },
  async (input) => {
    const { output } = await newsSleuthPrompt(input);
    return output!;
  }
);


export async function newsSleuthAnalysis(
  input: NewsSleuthInput
): Promise<NewsSleuthOutput | NewsSleuthError> {
  try {
    const result = await newsSleuthFlow(input);
    return result;
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
