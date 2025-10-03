'use server';
/**
 * @fileOverview Image authenticity analysis flow.
 *
 * analyzeImageAuthenticity - Analyzes an image for authenticity, manipulation, and AI generation.
 * AnalyzeImageAuthenticityInput - Input schema for the analysis.
 * AnalyzeImageAuthenticityOutput - Output schema containing the analysis results.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageAuthenticityInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      'The image to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' /* data */
    ),
});
export type AnalyzeImageAuthenticityInput = z.infer<
  typeof AnalyzeImageAuthenticityInputSchema
>;

const AnalyzeImageAuthenticityOutputSchema = z.object({
  isAuthentic: z
    .boolean()
    .describe('Whether the image is likely to be authentic.'),
  analysis: z.string().describe('Detailed analysis of the image.'),
});
export type AnalyzeImageAuthenticityOutput = z.infer<
  typeof AnalyzeImageAuthenticityOutputSchema
>;

export async function analyzeImageAuthenticity(
  input: AnalyzeImageAuthenticityInput
): Promise<AnalyzeImageAuthenticityOutput> {
  return analyzeImageAuthenticityFlow(input);
}

const analyzeImageAuthenticityPrompt = ai.definePrompt({
  name: 'analyzeImageAuthenticityPrompt',
  input: {schema: AnalyzeImageAuthenticityInputSchema},
  output: {schema: AnalyzeImageAuthenticityOutputSchema},
  prompt: `Analyze the image provided and determine its authenticity.

Consider factors such as AI-generated content, manipulation, and misleading contexts.

Image: {{media url=imageDataUri}}
\nReturn the analysis in a comprehensive manner, determining if the image is authentic or not.`,
});

const analyzeImageAuthenticityFlow = ai.defineFlow(
  {
    name: 'analyzeImageAuthenticityFlow',
    inputSchema: AnalyzeImageAuthenticityInputSchema,
    outputSchema: AnalyzeImageAuthenticityOutputSchema,
  },
  async input => {
    const {output} = await analyzeImageAuthenticityPrompt(input);
    return output!;
  }
);
