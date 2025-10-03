
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
});

const AudioAuthenticatorOutputSchema = z.object({
  confidenceScore: z.number().describe("A score from 0-100 indicating the confidence in the authenticity of the audio."),
  verdict: z.enum(['Likely Authentic', 'Potential AI/Manipulation', 'Uncertain']).describe("The final judgment on the audio's authenticity."),
  report: z.string().describe("A detailed report explaining the reasoning behind the verdict, including forensic analysis details and contextual information from web searches."),
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


export async function audioAuthenticatorAnalysis(input: AudioAuthenticatorInput): Promise<AudioAuthenticatorOutput> {
  const audioPart = dataUriToGenerativePart(input.audioDataUri);

  const prompt = `You are an expert audio forensics analyst. Your task is to analyze an audio file to determine its authenticity and detect any signs of AI generation, manipulation, or deepfakery.

You will perform the following analysis:
1.  **Forensic Analysis**: Analyze the audio for artifacts commonly associated with AI synthesis or manipulation. This includes examining background noise consistency, speaker tone and cadence, unnatural pauses, frequency spectrum anomalies, and other digital fingerprints.
2.  **Speech-to-Text (if applicable)**: If the audio contains speech, transcribe it and include it in the 'detectedText' field.
3.  **Content Analysis**: Analyze the transcribed text for signs of misinformation, propaganda, or unusual phrasing.
4.  **Verdict, Confidence, and Report**: Based on all available evidence, provide a final verdict ('Likely Authentic', 'Potential AI/Manipulation', 'Uncertain'), a confidence score (0-100), and generate a comprehensive report detailing your findings and the reasoning for your verdict.

The output language for the report and analysis must be in the language specified by the user: ${input.language}.

Audio for analysis is provided in the content.

Your final output MUST be only a single JSON object that strictly adheres to the provided schema. Do not include any other text, conversation, or markdown formatting like \`\`\`json.`;

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
        
        // If all else fails, throw the original error
        throw new Error("Failed to find a valid JSON object in the response.");
      }
    } catch (e) {
        console.error("RAW AI RESPONSE THAT FAILED TO PARSE:", text);
        throw new Error("The AI returned an invalid response format. Check the server logs for the raw output.");
    }
}
