
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent.
 *
 * This file defines the server-side logic for the News Sleuth feature, which
 * analyzes news articles for credibility using a Genkit flow.
 */

import {ai} from '@/ai/genkit';
import {
  NewsSleuthInputSchema,
  NewsSleuthOutputSchema,
  type NewsSleuthInput,
  type NewsSleuthOutput,
  type NewsSleuthError,
} from '@/ai/schemas';
import { googleAI } from '@genkit-ai/google-genai';

const prompt = ai.definePrompt({
    name: 'newsSleuthPrompt',
    model: googleAI.model('gemini-2.5-flash'),
    input: { schema: NewsSleuthInputSchema },
    output: { schema: NewsSleuthOutputSchema },
    prompt: `You are an advanced reasoning engine for detecting fake news. Generate a credibility report in {{language}}.

Your JSON output must include these fields:
- overallScore: A credibility score from 0-100.
- verdict: Your final judgment ('Likely Real', 'Likely Fake', 'Uncertain').
- summary: A brief summary of the article's main points.
- biases: An analysis of any detected biases (e.g., political, commercial).
- flaggedContent: A list of specific issues found (e.g., sensationalism, logical fallacies).
- reasoning: The reasoning behind the overall verdict and score.
- sources: A list of URLs used to corroborate facts. This MUST be populated from the search results.
`,
});


const newsSleuthFlow = ai.defineFlow(
  {
    name: 'newsSleuthFlow',
    inputSchema: NewsSleuthInputSchema,
    outputSchema: NewsSleuthOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
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
    console.error("Error in newsSleuthAnalysis flow:", error);
    return {
      error: 'FLOW_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to execute.',
    };
  }
}
