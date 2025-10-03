
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

const VideoIntegrityInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

const VideoIntegrityOutputSchema = z.object({
  overallScore: z.number().describe('A confidence score (0-100) in the video\'s authenticity.'),
  verdict: z.enum(['Likely Authentic', 'Potential Manipulation', 'Uncertain']).describe('The final judgment on the video\'s integrity.'),
  summary: z.string().describe('A brief summary of the findings.'),
  deepfake: z.string().describe("Analysis of deepfake elements (e.g., face swapping)."),
  videoManipulation: z.string().describe("Analysis of general video manipulations (CGI, edits)."),
  syntheticVoice: z.string().describe("Analysis of voice cloning or synthetic speech."),
  reasoning: z.string().describe('The reasoning behind the overall verdict and score.'),
  detectedText: z.string().optional().describe("Transcribed text from the video's audio track, if any."),
});

export type VideoIntegrityInput = z.infer<typeof VideoIntegrityInputSchema>;
export type VideoIntegrityOutput = z.infer<typeof VideoIntegrityOutputSchema>;
export type VideoIntegrityError = { error: string; rawResponse: string };


export async function videoIntegrityAnalysis(input: VideoIntegrityInput): Promise<VideoIntegrityOutput | VideoIntegrityError> {
  const videoPart = dataUriToGenerativePart(input.videoDataUri);

  const prompt = `You are a multimedia forensics expert. Analyze the provided video and generate an integrity report in ${input.language}.

Your JSON output must include these fields:
- overallScore: A confidence score (0-100) in the video's authenticity.
- verdict: Your final judgment ('Likely Authentic', 'Potential Manipulation', 'Uncertain').
- summary: A brief summary of your findings.
- deepfake: Analysis of deepfake elements (e.g., face swapping). State 'Detected' or 'Not Detected' and explain why.
- videoManipulation: Analysis of general video manipulations (CGI, edits, temporal inconsistencies). State 'Detected' or 'Not Detected' and explain why.
- syntheticVoice: Analysis of voice cloning or synthetic speech. State 'Detected' or 'Not Detected' and explain why.
- reasoning: The overall reasoning behind your final verdict and score.
- detectedText: Transcribe any spoken words from the audio. If no speech, make this null.
`;

  try {
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [videoPart, { text: prompt }] }],
    });

    const response = result.response;
    let text = response.text();

    try {
      // First, try to parse directly
      try {
        const parsed = JSON.parse(text);
        return VideoIntegrityOutputSchema.parse(parsed);
      } catch (e) {
        // If direct parse fails, try to extract from markdown
        const match = text.match(/```json\n([\s\S]*?)\n```/);
        if (match && match[1]) {
          try {
            const parsed = JSON.parse(match[1]);
            return VideoIntegrityOutputSchema.parse(parsed);
          } catch (e2) {
             console.error("Failed to parse extracted markdown JSON:", match[1]);
          }
        }

        // If markdown extraction fails, try to find the JSON object manually
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
          const jsonString = text.substring(startIndex, endIndex + 1);
          try {
            const parsed = JSON.parse(jsonString);
            return VideoIntegrityOutputSchema.parse(parsed);
          } catch(e3) {
            console.error("Failed to parse substring JSON:", jsonString);
          }
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
