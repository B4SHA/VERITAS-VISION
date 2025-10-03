
'use server';
/**
 * @fileOverview An audio authentication AI agent.
 *
 * This file defines the server-side logic for the Audio Authenticator feature, which
 * analyzes audio files for authenticity using a Genkit flow.
 */

import {ai} from '@/ai/genkit';
import {
    AudioAuthenticatorInputSchema,
    AudioAuthenticatorOutputSchema,
    type AudioAuthenticatorInput,
    type AudioAuthenticatorOutput,
    type AudioAuthenticatorError,
} from '@/ai/schemas';

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
      details: error.message || 'The AI model failed to execute.',
    };
  }
}
