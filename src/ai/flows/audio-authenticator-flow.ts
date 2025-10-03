
'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { z } from 'zod';
import { zodToJsonSchema } from "zod-to-json-schema";
import { dataUriToGenerativePart } from "@/lib/utils";

const AudioAuthenticatorInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

const AudioAuthenticatorOutputSchema = z.object({
  confidenceScore: z.number().describe("A score from 0-100 indicating the confidence in the authenticity of the audio."),
  verdict: z.enum(['Likely Authentic', 'Potential AI/Manipulation', 'Uncertain']).describe("The final judgment on the audio's authenticity."),
  report: z.string().describe("A detailed report explaining the reasoning behind the verdict, including forensic analysis details and contextual information from web searches."),
  textAnalysis: z.object({
    detectedText: z.string().optional().describe("The transcribed text from the audio, if any."),
    analysis: z.string().optional().describe("An analysis of the transcribed text for potential misinformation or manipulation."),
  }).optional(),
});

export type AudioAuthenticatorInput = z.infer<typeof AudioAuthenticatorInputSchema>;
export type AudioAuthenticatorOutput = z.infer<typeof AudioAuthenticatorOutputSchema>;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        response_mime_type: "application/json",
        // @ts-ignore
        response_schema: zodToJsonSchema(AudioAuthenticatorOutputSchema),
    },
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ],
});

export async function audioAuthenticatorAnalysis(input: AudioAuthenticatorInput): Promise<AudioAuthenticatorOutput> {
  const audioPart = dataUriToGenerativePart(input.audioDataUri);

  const prompt = `You are an expert audio forensics analyst. Your task is to analyze an audio file to determine its authenticity and detect any signs of AI generation, manipulation, or deepfakery. You have access to Google Search to find real-time information to ground your analysis.

You will perform the following analysis:
1.  **Forensic Analysis**: Analyze the audio for artifacts commonly associated with AI synthesis or manipulation. This includes examining background noise consistency, speaker tone and cadence, unnatural pauses, frequency spectrum anomalies, and other digital fingerprints.
2.  **Speech-to-Text (if applicable)**: If the audio contains speech, transcribe it.
3.  **Content Analysis & Web Search**:
    *   Analyze the transcribed text for signs of misinformation, propaganda, or unusual phrasing.
    *   Based on the transcribed text, speakers, or key topics, use Google Search to find context. Look for fact-checks, news reports, or the original source of the audio.
4.  **Verdict and Confidence**: Based on all available evidence (forensic and web search), provide a final verdict: 'Likely Authentic', 'Potential AI/Manipulation', or 'Uncertain'. Also, provide a confidence score (0-100) for your verdict.
5.  **Reporting**: Generate a comprehensive report detailing your findings and the reasoning for your verdict. Integrate information from your web search to provide context.

The output language for the report and analysis must be in the language specified by the user: ${input.language}.

Audio for analysis is provided in the content.`;

  const result = await model.generateContent({
      contents: [{ role: 'user', parts: [audioPart, { text: prompt }] }],
      // @ts-ignore
      tools: [{ "google_search": {} }],
  });

  const responseText = result.response.text();
  return AudioAuthenticatorOutputSchema.parse(JSON.parse(responseText));
}
