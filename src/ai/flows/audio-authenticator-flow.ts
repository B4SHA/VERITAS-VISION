
'use server';
/**
 * @fileOverview An audio authentication AI agent.
 *
 * - audioAuthenticatorAnalysis - A function that handles the audio authentication process.
 * - AudioAuthenticatorInput - The input type for the audioAuthenticatorAnalysis function.
 * - AudioAuthenticatorOutput - The return type for the audioAuthenticatorAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


export const AudioAuthenticatorInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

export const AudioAuthenticatorOutputSchema = z.object({
  overallScore: z.number().describe("A score from 0-100 indicating the confidence in the authenticity of the audio."),
  verdict: z.enum(['Likely Authentic', 'Potential AI/Manipulation', 'Uncertain']).describe("The final judgment on the audio's authenticity."),
  summary: z.string().describe("A brief summary of the findings."),
  reasoning: z.string().describe("A detailed report explaining the reasoning behind the verdict."),
  detectedText: z.string().optional().describe("The transcribed text from the audio, if any. If not, this should be null."),
});


export type AudioAuthenticatorInput = z.infer<typeof AudioAuthenticatorInputSchema>;
export type AudioAuthenticatorOutput = z.infer<typeof AudioAuthenticatorOutputSchema>;
export type AudioAuthenticatorError = { error: string; details?: string };


const prompt = ai.definePrompt({
    name: 'audioAuthenticatorPrompt',
    input: { schema: AudioAuthenticatorInputSchema },
    output: { schema: AudioAuthenticatorOutputSchema },
    prompt: `You are an expert audio forensics analyst. Analyze the provided audio file and generate an authenticity report in {{language}}.

Audio: {{media url=audioDataUri}}

Your JSON output must include these fields:
- overallScore: A confidence score (0-100) on the audio's authenticity.
- verdict: Your final judgment ('Likely Authentic', 'Potential AI/Manipulation', 'Uncertain').
- summary: A brief summary of your findings.
- reasoning: Detailed reasoning behind your verdict, mentioning analysis of background noise, speaker tone, cadence, and frequency spectrum.
- detectedText: If the audio contains speech, transcribe it here. If not, this should be null.
`
});

const audioAuthenticatorFlow = ai.defineFlow(
    {
        name: 'audioAuthenticatorFlow',
        inputSchema: AudioAuthenticatorInputSchema,
        outputSchema: AudioAuthenticatorOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

export async function audioAuthenticatorAnalysis(
  input: AudioAuthenticatorInput
): Promise<AudioAuthenticatorOutput | AudioAuthenticatorError> {
  try {
    const result = await audioAuthenticatorFlow(input);
    return result;
  } catch (error: any) {
    console.error("Error in audioAuthenticatorAnalysis flow:", error);
    return {
      error: 'FLOW_EXECUTION_FAILED',
      details: error.message || 'The AI flow failed to execute.',
    };
  }
}
