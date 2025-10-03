
'use server';
/**
 * @fileOverview A video integrity analysis AI agent.
 *
 * This file defines the server-side logic for the Video Integrity feature, which
 * analyzes videos for authenticity and manipulation using a Genkit flow.
 */

import {ai} from '@/ai/genkit';
import {
    VideoIntegrityInputSchema,
    VideoIntegrityOutputSchema,
    type VideoIntegrityInput,
    type VideoIntegrityOutput,
    type VideoIntegrityError,
} from '@/ai/schemas';


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
      details: error.message || 'The AI model failed to execute.',
    };
  }
}
