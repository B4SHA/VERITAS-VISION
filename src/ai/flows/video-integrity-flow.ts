
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
  confidenceScore: z.number().describe("Overall confidence score (0-100) in the analysis provided."),
  verdict: z.string().describe("A concise verdict on the video's authenticity (e.g., 'Likely Authentic', 'Contains Deepfake Elements', 'Manipulated')."),
  report: z.string().describe("A comprehensive report detailing all findings from the visual, audio, and contextual analysis."),
  detectedText: z.string().optional().describe("Transcribed text from the video's audio track."),
});

export type VideoIntegrityInput = z.infer<typeof VideoIntegrityInputSchema>;
export type VideoIntegrityOutput = z.infer<typeof VideoIntegrityOutputSchema>;


export async function videoIntegrityAnalysis(input: VideoIntegrityInput): Promise<VideoIntegrityOutput> {
  const videoPart = dataUriToGenerativePart(input.videoDataUri);

  const prompt = `You are an expert multimedia forensics AI specializing in video integrity. Your task is to analyze a video file to detect signs of deepfakery, manipulation, and misinformation. You have access to Google Search to find real-time information to ground your analysis.

You will perform a multi-modal analysis:
1.  **Visual Analysis**: Examine frames for artifacts related to deepfakes, CGI, edits, and other manipulations.
2.  **Audio Analysis**: Analyze the audio for voice cloning, synthesis, or manipulation.
3.  **Speech-to-Text**: Transcribe any spoken words and include them in the 'detectedText' field.
4.  **Contextual Web Search**: Use Google Search to find context, fact-checks, or the origin of the video.
5.  **Overall Assessment**: Synthesize all findings into a holistic judgment. Provide a final 'verdict', a 'confidenceScore' (0-100), and a detailed 'report' that explains your reasoning based on all analysis steps.

The output language for the report and analysis must be in the language specified by the user: ${input.language}.

Video for analysis is provided in the content.

Your final output MUST be only a single JSON object that strictly adheres to the provided schema. Do not include any other text, conversation, or markdown formatting like \`\`\`json.`;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [videoPart, { text: prompt }] }],
        tools: [{ "google_search": {} }],
    });

    const response = result.response;
    let text = response.text();

    try {
        // Find the start and end of the JSON object
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
          text = text.substring(startIndex, endIndex + 1);
        }

        const parsed = JSON.parse(text);
        return VideoIntegrityOutputSchema.parse(parsed);
    } catch (e) {
        console.error("Failed to parse LLM response:", text);
        throw new Error("The AI returned an invalid response format.");
    }
}
