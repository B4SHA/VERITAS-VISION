'use server';
/**
 * @fileOverview Analyzes news articles for credibility, misinformation, and bias.
 *
 * - analyzeNewsArticleCredibility - A function that handles the news article analysis process.
 * - AnalyzeNewsArticleCredibilityInput - The input type for the analyzeNewsArticleCredibility function.
 * - AnalyzeNewsArticleCredibilityOutput - The return type for the analyzeNewsArticleCredibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeNewsArticleCredibilityInputSchema = z.object({
  articleContent: z.string().describe('The content of the news article to analyze, either the text or a URL.'),
});
export type AnalyzeNewsArticleCredibilityInput = z.infer<typeof AnalyzeNewsArticleCredibilityInputSchema>;

const AnalyzeNewsArticleCredibilityOutputSchema = z.object({
  credibilityScore: z.number().describe('A score from 0 to 1 indicating the credibility of the article.'),
  misinformationDetected: z.boolean().describe('Whether misinformation was detected in the article.'),
  biasDetected: z.boolean().describe('Whether bias was detected in the article.'),
  summary: z.string().describe('A summary of the article and its potential issues.'),
});
export type AnalyzeNewsArticleCredibilityOutput = z.infer<typeof AnalyzeNewsArticleCredibilityOutputSchema>;

export async function analyzeNewsArticleCredibility(input: AnalyzeNewsArticleCredibilityInput): Promise<AnalyzeNewsArticleCredibilityOutput> {
  return analyzeNewsArticleCredibilityFlow(input);
}

const analyzeNewsArticleCredibilityPrompt = ai.definePrompt({
  name: 'analyzeNewsArticleCredibilityPrompt',
  input: {schema: AnalyzeNewsArticleCredibilityInputSchema},
  output: {schema: AnalyzeNewsArticleCredibilityOutputSchema},
  prompt: `You are an expert in analyzing news articles for credibility, misinformation, and bias.

  Analyze the following news article and provide a credibility score (0-1), indicate if misinformation or bias is present, and provide a summary of your findings.

  Article Content: {{{articleContent}}}`,
});

const analyzeNewsArticleCredibilityFlow = ai.defineFlow(
  {
    name: 'analyzeNewsArticleCredibilityFlow',
    inputSchema: AnalyzeNewsArticleCredibilityInputSchema,
    outputSchema: AnalyzeNewsArticleCredibilityOutputSchema,
  },
  async input => {
    const {output} = await analyzeNewsArticleCredibilityPrompt(input);
    return output!;
  }
);
