
'use server';
/**
 * @fileOverview A video integrity analysis AI agent.
 *
 * - videoIntegrityAnalysis - A function that handles the video integrity analysis.
 * - VideoIntegrityInput - The input type for the videoIntegrityAnalysis function.
 * - VideoIntegrityOutput - The return type for the videoIntegrityAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


export const VideoIntegrityInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

export const VideoIntegrityOutputSchema = z.object({
  overallScore: z.number().describe('A confidence score (0-100) in the video\'s authenticity.'),
  verdict: z.enum(['Likely Authentic', 'Potential Manipulation', 'Uncertain']).describe('The final judgment on the video\'s integrity.'),
  summary: z.string().describe('A brief summary of the findings.'),
  deepfake: z.string().describe("Analysis of deepfake elements (e.g., face swapping). State 'Detected' or 'Not Detected' and explain why."),
  videoManipulation: z.string().describe("Analysis of general video manipulations (CGI, edits). State 'Detected' or 'Not Detected' and explain why."),
  syntheticVoice: z.string().describe("Analysis of voice cloning or synthetic speech. State 'Detected' or 'Not Detected' and explain why."),
  reasoning: z.string().describe('The reasoning behind the overall verdict and score.'),
  detectedText: z.string().optional().describe("Transcribed text from the video's audio track, if any. If none, this should be null."),
});


export type VideoIntegrityInput = z.infer<typeof VideoIntegrityInputSchema>;
export type VideoIntegrityOutput = z.infer<typeof VideoIntegrityOutputSchema>;
export type VideoIntegrityError = { error: string; details?: string };


const prompt = ai.definePrompt({
    name: 'videoIntegrityPrompt',
    input: { schema: VideoIntegrityInputSchema },
    output: { schema: VideoIntegrityOutputSchema },
    prompt: `You are a multimedia forensics expert. Analyze the provided video and generate an integrity report in {{language}}.

Video: {{media url=videoDataUri}}

Your JSON output must include these fields:
- overallScore: A confidence score (0-100) in the video's authenticity.
- verdict: Your final judgment ('Likely Authentic', 'Potential Manipulation', 'Uncertain').
- summary: A brief summary of your findings.
- deepfake: Analysis of deepfake elements (e.g., face swapping). State 'Detected' or 'Not Detected' and explain why.
- videoManipulation: Analysis of general video manipulations (CGI, edits, temporal inconsistencies). State 'Detected' or 'Not Detected' and explain why.
- syntheticVoice: Analysis of voice cloning or synthetic speech. State 'Detected' or 'Not Detected' and explain why.
- reasoning: The overall reasoning behind your final verdict and score.
- detectedText: Transcribe any spoken words from the audio. If no speech, make this null.
`
});


const videoIntegrityFlow = ai.defineFlow(
    {
        name: 'videoIntegrityFlow',
        inputSchema: VideoIntegrityInputSchema,
        outputSchema: VideoIntegrityOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

export async function videoIntegrityAnalysis(
  input: VideoIntegrityInput
): Promise<VideoIntegrityOutput | VideoIntegrityError> {
  try {
    const result = await videoIntegrityFlow(input);
    return result;
  } catch (error: any) {
    console.error("Error in videoIntegrityAnalysis flow:", error);
    return {
      error: 'FLOW_EXECUTION_FAILED',
      details: error.message || 'The AI flow failed to execute.',
    };
  }
}
