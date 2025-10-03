
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


export async function audioAuthenticatorAnalysis(input: AudioAuthenticatorInput): Promise<AudioAuthenticatorOutput> {
  const audioPart = dataUriToGenerativePart(input.audioDataUri);

  const prompt = `You are an expert audio forensics analyst. Your task is to analyze an audio file to determine its authenticity and detect any signs of AI generation, manipulation, or deepfakery. You have access to Google Search to find real-time information to ground your analysis.

Your final output MUST be only a single JSON object that strictly adheres to the provided schema. Do not include any other text, conversation, or markdown formatting.

You will perform the following analysis:
1.  **Forensic Analysis**: Analyze the audio for artifacts commonly associated with AI synthesis or manipulation. This includes examining background noise consistency, speaker tone and cadence, unnatural pauses, frequency spectrum anomalies, and other digital fingerprints.
2.  **Speech-to-Text (if applicable)**: If the audio contains speech, transcribe it.
3.  **Content Analysis & Web Search**:
    *   Analyze the transcribed text for signs of misinformation, propaganda, or unusual phrasing.
    *   Based on the transcribed text, speakers, or key topics, use Google Search to find context. Look for fact-checks, news reports, or the original source of the audio.
4.  **Verdict and Confidence**: Based on all available evidence (forensic and web search), provide a final verdict: 'Likely Authentic', 'Potential AI/Manipulation', 'Uncertain'. Also, provide a confidence score (0-100) for your verdict.
5.  **Reporting**: Generate a comprehensive report detailing your findings and the reasoning for your verdict. Integrate information from your web search to provide context.

The output language for the report and analysis must be in the language specified by the user: ${input.language}.

Audio for analysis is provided in the content.`;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [audioPart, { text: prompt }] }],
        tools: [{ "google_search": {} }],
        generationConfig: {
          responseMimeType: "application/json",
        },
    });

    const response = result.response;
    const text = response.text();

    try {
        const parsed = JSON.parse(text);
        return AudioAuthenticatorOutputSchema.parse(parsed);
    } catch (e) {
        console.error("Failed to parse LLM response:", text);
        throw new Error("The AI returned an invalid response format.");
    }
}
