
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

const AudioAuthenticatorOutputSchema = z.object({
  overallScore: z.number().describe("A score from 0-100 indicating the confidence in the authenticity of the audio."),
  verdict: z.enum(['Likely Authentic', 'Potential AI/Manipulation', 'Uncertain']).describe("The final judgment on the audio's authenticity."),
  summary: z.string().describe("A brief summary of the findings."),
  reasoning: z.string().describe("A detailed report explaining the reasoning behind the verdict."),
  detectedText: z.string().optional().describe("The transcribed text from the audio, if any."),
});

const AudioAuthenticatorInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

export type AudioAuthenticatorInput = z.infer<typeof AudioAuthenticatorInputSchema>;
export type AudioAuthenticatorOutput = z.infer<typeof AudioAuthenticatorOutputSchema>;
export type AudioAuthenticatorError = { error: string; rawResponse: string };

export async function audioAuthenticatorAnalysis(input: AudioAuthenticatorInput): Promise<AudioAuthenticatorOutput | AudioAuthenticatorError> {
  const audioPart = dataUriToGenerativePart(input.audioDataUri);

  const prompt = `You are an expert audio forensics analyst. Analyze the provided audio file and generate an authenticity report in ${input.language}.

Your JSON output must include these fields:
- overallScore: A confidence score (0-100) on the audio's authenticity.
- verdict: Your final judgment ('Likely Authentic', 'Potential AI/Manipulation', 'Uncertain').
- summary: A brief summary of your findings.
- reasoning: Detailed reasoning behind your verdict, mentioning analysis of background noise, speaker tone, cadence, and frequency spectrum.
- detectedText: If the audio contains speech, transcribe it here. If not, this should be null.
`;

  try {
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [audioPart, { text: prompt }] }],
    });

    const response = result.response;
    let text = response.text();

    try {
      // First, try to parse directly
      try {
        const parsed = JSON.parse(text);
        return AudioAuthenticatorOutputSchema.parse(parsed);
      } catch (e) {
        // If direct parse fails, try to extract from markdown
        const match = text.match(/```json\n([\s\S]*?)\n```/);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          return AudioAuthenticatorOutputSchema.parse(parsed);
        }

        // If markdown extraction fails, try to find the JSON object manually
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
          const jsonString = text.substring(startIndex, endIndex + 1);
          const parsed = JSON.parse(jsonString);
          return AudioAuthenticatorOutputSchema.parse(parsed);
        }
        
        // If all else fails, return error object
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
