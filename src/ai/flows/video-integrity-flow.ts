
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const VideoIntegrityInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

const VideoIntegrityOutputSchema = z.object({
  analysis: z.object({
    confidenceScore: z.number().describe("Overall confidence score (0-100) in the analysis provided."),
    summary: z.string().describe("A concise summary of the overall findings from the video analysis, including context from web search."),
    deepfake: z.boolean().describe("Indicates if deepfake techniques (e.g., face swapping) are detected."),
    videoManipulation: z.boolean().describe("Indicates if general video manipulations (e.g., cuts, speed changes, CGI) are detected."),
    syntheticVoice: z.boolean().describe("Indicates if the audio track contains synthetic or cloned voices."),
    fullyAiGenerated: z.boolean().describe("Indicates if the entire video is likely to be synthetically generated."),
    satireParody: z.boolean().describe("Indicates if the content is likely intended as satire or parody."),
    misleadingContext: z.boolean().describe("Indicates if the video might be authentic but used in a misleading context, based on web search."),
    audioTextAnalysis: z.object({
      detectedText: z.string().optional().describe("Transcribed text from the video's audio track."),
      analysis: z.string().optional().describe("An analysis of the transcribed text for misinformation or manipulation."),
    }).optional(),
  }),
});


export type VideoIntegrityInput = z.infer<typeof VideoIntegrityInputSchema>;
export type VideoIntegrityOutput = z.infer<typeof VideoIntegrityOutputSchema>;

export async function videoIntegrityAnalysis(input: VideoIntegrityInput): Promise<VideoIntegrityOutput> {
  return videoIntegrityFlow(input);
}


const prompt = ai.definePrompt({
    name: 'videoIntegrityPrompt',
    input: { schema: VideoIntegrityInputSchema },
    output: { schema: VideoIntegrityOutputSchema },
    tools: [
      {
        tool: 'googleSearch',
      }
    ],
    prompt: `You are an expert multimedia forensics AI specializing in video integrity. Your task is to analyze a video file to detect signs of deepfakery, manipulation, and misinformation, grounded in real-time web search results.

You will perform a multi-modal analysis:
1.  **Visual Analysis**:
    *   Examine each frame for artifacts related to deepfakes (e.g., unnatural facial movements, poor lip-syncing, edge anomalies).
    *   Look for signs of video manipulation (e.g., edits, CGI, doctored objects, temporal inconsistencies).
2.  **Audio Analysis**:
    *   Analyze the audio track for signs of voice cloning, synthesis, or manipulation.
    *   Check for inconsistencies between the audio and the visual scene.
3.  **Speech-to-Text & Content Analysis**:
    *   Transcribe any spoken words in the video.
    *   Analyze the transcribed text for misinformation, propaganda, or out-of-context statements.
4.  **Contextual Web Search**:
    *   Based on the visual content, transcribed text, and any identifiable people or locations, you MUST use the provided Google Search tool.
    *   Find news reports, fact-checks, or discussions related to this video to determine if it is being used in a misleading context.
5.  **Overall Assessment**:
    *   Synthesize findings from all analyses (visual, audio, and web search) to form a holistic judgment.
    *   Determine if the video is likely a deepfake, manipulated, fully AI-generated, satire, or being used in a misleading context.
    *   Provide a confidence score for your overall analysis.

The output language for the report and analysis must be in the language specified by the user: {{{language}}}.

Video for analysis:
{{media url=videoDataUri}}`,
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
