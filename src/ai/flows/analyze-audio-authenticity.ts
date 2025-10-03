'use server';

/**
 * @fileOverview Analyzes audio clips for authenticity, identifying potential AI-generated forgeries.
 *
 * - analyzeAudioAuthenticity - A function that handles the audio analysis process.
 * - AnalyzeAudioAuthenticityInput - The input type for the analyzeAudioAuthenticity function.
 * - AnalyzeAudioAuthenticityOutput - The return type for the analyzeAudioAuthenticity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAudioAuthenticityInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'An audio clip, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type AnalyzeAudioAuthenticityInput = z.infer<
  typeof AnalyzeAudioAuthenticityInputSchema
>;

const AnalyzeAudioAuthenticityOutputSchema = z.object({
  verdict: z.string().describe('The verdict on the audio\'s authenticity.'),
  confidence: z
    .number()
    .describe('The confidence level of the authenticity assessment.'),
  analysis: z.string().describe('Detailed analysis of the audio clip.'),
});
export type AnalyzeAudioAuthenticityOutput = z.infer<
  typeof AnalyzeAudioAuthenticityOutputSchema
>;

export async function analyzeAudioAuthenticity(
  input: AnalyzeAudioAuthenticityInput
): Promise<AnalyzeAudioAuthenticityOutput> {
  return analyzeAudioAuthenticityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAudioAuthenticityPrompt',
  input: {schema: AnalyzeAudioAuthenticityInputSchema},
  output: {schema: AnalyzeAudioAuthenticityOutputSchema},
  prompt: `You are an expert in audio forensics and AI-generated audio detection.

You will analyze the provided audio clip and determine its authenticity.

Provide a verdict on whether the audio is likely to be authentic or AI-generated.
Include a confidence level (as a percentage) for your assessment.
Provide a detailed analysis of the audio clip, highlighting any indicators of AI generation or manipulation.

Audio Clip: {{media url=audioDataUri}}

Format your response as a JSON object conforming to the following schema:
${JSON.stringify(AnalyzeAudioAuthenticityOutputSchema.describe())}`,
});

const analyzeAudioAuthenticityFlow = ai.defineFlow(
  {
    name: 'analyzeAudioAuthenticityFlow',
    inputSchema: AnalyzeAudioAuthenticityInputSchema,
    outputSchema: AnalyzeAudioAuthenticityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
