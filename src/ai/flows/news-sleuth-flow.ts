
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent.
 *
 * - newsSleuthAnalysis - A function that handles the news credibility analysis.
 * - NewsSleuthInput - The input type for the newsSleuthAnalysis function.
 * - NewsSleuthOutput - The return type for the newsSleuthAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const NewsSleuthInputSchema = z.object({
  articleText: z.string().optional().describe('The full text of the news article.'),
  articleUrl: z.string().optional().describe('The URL of the news article.'),
  articleHeadline: z.string().optional().describe('The headline of the news article.'),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

export const NewsSleuthOutputSchema = z.object({
  overallScore: z.number().describe('A credibility score from 0-100.'),
  verdict: z.enum(['Likely Real', 'Likely Fake', 'Uncertain', 'Propaganda/Disinformation', 'Satire/Parody', 'Sponsored Content', 'Opinion/Analysis']).describe("The final judgment on the article's credibility."),
  summary: z.string().describe("A brief summary of the article's main points."),
  biases: z.string().describe('An analysis of any detected biases (e.g., political, commercial).'),
  flaggedContent: z.array(z.string()).describe('A list of specific issues found, such as sensationalism, logical fallacies, or unverified claims.'),
  reasoning: z.string().describe('The reasoning behind the overall verdict and score.'),
  sources: z.array(z.string()).describe('A list of URLs used to corroborate facts. This MUST be populated from the search results.'),
});


export type NewsSleuthInput = z.infer<typeof NewsSleuthInputSchema>;
export type NewsSleuthOutput = z.infer<typeof NewsSleuthOutputSchema>;
// Define a type for potential errors, though genkit handles many errors internally
export type NewsSleuthError = { error: string; details?: string };


const prompt = ai.definePrompt({
    name: 'newsSleuthPrompt',
    input: { schema: NewsSleuthInputSchema },
    output: { schema: NewsSleuthOutputSchema },
    prompt: `You are an advanced reasoning engine for detecting fake news. You MUST use your search grounding tool to corroborate facts and find related stories. Generate a credibility report in {{language}}.

Article Information for Analysis:
{{#if articleText}}
Full Article Text:
---
{{{articleText}}}
---
{{/if}}
{{#if articleHeadline}}
Headline: "{{{articleHeadline}}}"
{{/if}}
{{#if articleUrl}}
Primary Article URL: {{{articleUrl}}}
{{/if}}

Your JSON output must follow this structure exactly. You MUST list the URLs you used from your search grounding in the 'sources' array.
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
      details: error.message || 'The AI flow failed to execute.',
    };
  }
}
