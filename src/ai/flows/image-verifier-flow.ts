
'use server';
/**
 * @fileOverview An image verification AI agent.
 *
 * - imageVerifierAnalysis - A function that handles the image verification process.
 * - ImageVerifierInput - The input type for the imageVerifierAnalysis function.
 * - ImageVerifierOutput - The return type for the imageVerifierAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


export const ImageVerifierInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

export const ImageVerifierOutputSchema = z.object({
    verdict: z.enum(['Likely Authentic', 'Likely AI-Generated/Manipulated', 'Uncertain']).describe("The final judgment on the image's authenticity."),
    overallScore: z.number().describe("A score from 0-100 indicating the confidence in the verdict."),
    summary: z.string().describe("A brief summary of the findings."),
    reasoning: z.string().describe("A detailed forensic report explaining the analysis, including details about artifacts, inconsistencies, etc."),
    detectedText: z.string().optional().describe("Text detected within the image. If none, this should be null."),
});


export type ImageVerifierInput = z.infer<typeof ImageVerifierInputSchema>;
export type ImageVerifierOutput = z.infer<typeof ImageVerifierOutputSchema>;
export type ImageVerifierError = { error: string; details?: string };


const prompt = ai.definePrompt({
    name: 'imageVerifierPrompt',
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
      details: error.message || 'The AI flow failed to execute.',
    };
  }
}
