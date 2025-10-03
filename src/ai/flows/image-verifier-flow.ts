
'use server';
/**
 * @fileOverview An image verification AI agent.
 *
 * This file defines the server-side logic for the Image Verifier feature, which
 * analyzes images for authenticity using a Genkit flow.
 */

import {ai} from '@/ai/genkit';
import {
    ImageVerifierInputSchema,
    ImageVerifierOutputSchema,
    type ImageVerifierInput,
    type ImageVerifierOutput,
    type ImageVerifierError,
} from '@/ai/schemas';
import { googleAI } from '@genkit-ai/google-genai';


const prompt = ai.definePrompt({
    name: 'imageVerifierPrompt',
    model: googleAI.model('gemini-2.5-flash'),
    input: { schema: ImageVerifierInputSchema },
    output: { schema: ImageVerifierOutputSchema },
    prompt: `You are an expert digital image forensics analyst. Analyze the provided image and generate an authenticity report in {{language}}.

Image: {{media url=imageDataUri}}

Your JSON output must include these fields:
- verdict: Your final judgment ('Likely Authentic', 'Likely AI-Generated/Manipulated', 'Uncertain').
- overallScore: A confidence score (0-100) in your verdict.
- summary: A brief summary of your findings.
- reasoning: Detailed reasoning for your verdict, analyzing artifacts, inconsistencies in shadows/reflections, and other forensic details.
- detectedText: If there is text in the image, extract it here. If not, this should be null.
`
});

const imageVerifierFlow = ai.defineFlow(
    {
        name: 'imageVerifierFlow',
        inputSchema: ImageVerifierInputSchema,
        outputSchema: ImageVerifierOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

export async function imageVerifierAnalysis(
  input: ImageVerifierInput
): Promise<ImageVerifierOutput | ImageVerifierError> {
  try {
    const result = await imageVerifierFlow(input);
    return result;
  } catch (error: any) {
    console.error("Error in imageVerifierAnalysis flow:", error);
    return {
      error: 'FLOW_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to execute.',
    };
  }
}
