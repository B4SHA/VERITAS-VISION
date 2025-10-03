
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { dataUriToGenerativePart } from '@/lib/utils';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

const ImageVerifierInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

const ImageVerifierOutputSchema = z.object({
    verdict: z.enum(['Likely Authentic', 'Likely AI-Generated/Manipulated', 'Uncertain']).describe("The final judgment on the image's authenticity."),
    overallScore: z.number().describe("A score from 0-100 indicating the confidence in the verdict."),
    summary: z.string().describe("A brief summary of the findings."),
    reasoning: z.string().describe("A detailed forensic report explaining the analysis, including details about artifacts, inconsistencies, etc."),
    detectedText: z.string().optional().describe("Text detected within the image."),
});

export type ImageVerifierInput = z.infer<typeof ImageVerifierInputSchema>;
export type ImageVerifierOutput = z.infer<typeof ImageVerifierOutputSchema>;
export type ImageVerifierError = { error: string; rawResponse: string };

export async function imageVerifierAnalysis(input: ImageVerifierInput): Promise<ImageVerifierOutput | ImageVerifierError> {
  const imagePart = dataUriToGenerativePart(input.imageDataUri);

  const prompt = `You are an expert digital image forensics analyst. Analyze the provided image and generate an authenticity report in ${input.language}.

Your JSON output must include these fields:
- overallScore: A confidence score (0-100) in your verdict.
- verdict: Your final judgment ('Likely Authentic', 'Likely AI-Generated/Manipulated', 'Uncertain').
- summary: A brief summary of your findings.
- reasoning: Detailed reasoning for your verdict, analyzing artifacts, inconsistencies in shadows/reflections, and other forensic details.
- detectedText: If there is text in the image, extract it here. If not, this should be null.
`;

  try {
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
    });

    const response = result.response;
    let text = response.text();

    try {
        // First, try to parse directly
        try {
          const parsed = JSON.parse(text);
          return ImageVerifierOutputSchema.parse(parsed);
        } catch (e) {
          // If direct parse fails, try to extract from markdown
          const match = text.match(/```json\n([\s\S]*?)\n```/);
          if (match && match[1]) {
            const parsed = JSON.parse(match[1]);
            return ImageVerifierOutputSchema.parse(parsed);
          }

          // If markdown extraction fails, try to find the JSON object manually
          const startIndex = text.indexOf('{');
          const endIndex = text.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            const jsonString = text.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonString);
            return ImageVerifierOutputSchema.parse(parsed);
          }
          
          // If all else fails, return the error object
          console.error("RAW AI RESPONSE THAT FAILED TO PARSE:", text);
          return { error: 'PARSING_FAILED', rawResponse: text };
        }
    } catch (e) {
        console.error("RAW AI RESPONSE THAT FAILED TO PARSE:", text);
        return { error: 'PARSING_FAILED', rawResponse: text };
    }
  } catch (error) {
    console.error("Error during AI generation:", error);
    return { error: 'GENERATION_FAILED', rawResponse: 'The AI model failed to generate a response.' };
  }
}
