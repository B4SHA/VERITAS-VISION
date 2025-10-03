
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
    prompt: `You are an advanced reasoning engine for detecting fake news. Analyze the provided article content and generate a credibility report in {{language}}.

If an 'articleUrl' is provided, you MUST use your search tool to retrieve the article's content and corroborate facts before performing your analysis. If 'articleText' is provided, use that directly.

{{#if articleUrl}}
Article URL: {{articleUrl}}
{{/if}}
{{#if articleText}}
Article Text:
---
{{articleText}}
---
{{/if}}
{{#if articleHeadline}}
Article Headline: {{articleHeadline}}
{{/if}}

Your JSON output must include these fields:
- overallScore: A credibility score from 0-100.
- verdict: Your final judgment ('Likely Real', 'Likely Fake', 'Uncertain').
- summary: A brief summary of the article's main points.
- biases: An analysis of any detected biases (e.g., political, commercial).
- flaggedContent: A list of specific issues found (e.g., sensationalism, logical fallacies).
- reasoning: The reasoning behind the overall verdict and score.
- sources: A list of URLs you used from your search tool to corroborate facts. This MUST be populated from your search results.
`,
});


const newsSleuthFlow = ai.defineFlow(
  {
    name: 'newsSleuthFlow',
    inputSchema: NewsSleuthInputSchema,
    outputSchema: NewsSleuthOutputSchema,
    tools: [{tool: 'googleSearch'}],
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
    // Attempt to parse Genkit's structured error
    const match = error.message.match(/An error occurred during generation: (\{.*\})/);
    if (match && match[1]) {
        try {
            const parsedError = JSON.parse(match[1]);
            return {
                error: 'FLOW_EXECUTION_FAILED',
                details: parsedError.message || "The AI model returned a structured error.",
            };
        } catch (e) {
            // Fallback if parsing fails
        }
    }
    
    // Fallback for generic errors
    return {
      error: 'FLOW_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to generate a response.',
    };
  }
}
