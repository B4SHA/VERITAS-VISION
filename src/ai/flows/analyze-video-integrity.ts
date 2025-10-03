'use server';

/**
 * @fileOverview Video integrity analysis flow.
 *
 * - analyzeVideoIntegrity - Analyzes video files for deepfakes, AI-generated content, and misleading speech.
 * - AnalyzeVideoIntegrityInput - The input type for the analyzeVideoIntegrity function.
 * - AnalyzeVideoIntegrityOutput - The return type for the analyzeVideoIntegrity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVideoIntegrityInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'A video file as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' + 
      'Must be a supported video format such as mp4, mov, or webm.'
    ),
});
export type AnalyzeVideoIntegrityInput = z.infer<typeof AnalyzeVideoIntegrityInputSchema>;

const AnalyzeVideoIntegrityOutputSchema = z.object({
  isDeepfake: z.boolean().describe('Whether the video is likely a deepfake.'),
  isAiGenerated: z.boolean().describe('Whether the video is likely AI-generated.'),
  misleadingSpeechAnalysis: z.string().describe('Analysis of the speech content for misleading information.'),
});
export type AnalyzeVideoIntegrityOutput = z.infer<typeof AnalyzeVideoIntegrityOutputSchema>;

export async function analyzeVideoIntegrity(input: AnalyzeVideoIntegrityInput): Promise<AnalyzeVideoIntegrityOutput> {
  return analyzeVideoIntegrityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeVideoIntegrityPrompt',
  input: {schema: AnalyzeVideoIntegrityInputSchema},
  output: {schema: AnalyzeVideoIntegrityOutputSchema},
  prompt: `You are an expert in video forensics and AI-generated content detection.

You will analyze the provided video for signs of deepfakes, AI manipulation, and misleading speech.

Analyze the video and provide a determination as to whether it is a deepfake, AI-generated, and whether the speech within it is misleading. Set the corresponding output fields appropriately.

Video: {{media url=videoDataUri}}

Consider the following aspects during your analysis:

- Facial inconsistencies or unnatural movements.
- Artifacts or distortions that may indicate AI generation.
- Discrepancies between audio and video.
- The presence of generated speech and potential manipulation.
- Misleading information conveyed in the speech.
`,
});

const analyzeVideoIntegrityFlow = ai.defineFlow(
  {
    name: 'analyzeVideoIntegrityFlow',
    inputSchema: AnalyzeVideoIntegrityInputSchema,
    outputSchema: AnalyzeVideoIntegrityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
