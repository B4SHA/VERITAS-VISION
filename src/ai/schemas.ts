
import { z } from 'zod';

// News Sleuth Schemas
export const NewsSleuthInputSchema = z.object({
  articleText: z.string().optional().describe('The text content of the news article to analyze.'),
  articleUrl: z.string().url().optional().describe('The URL of the news article to analyze.'),
  articleHeadline: z.string().optional().describe('The headline of the news article to analyze.'),
}).refine(data => data.articleText || data.articleUrl || data.articleHeadline, {
  message: 'One of article text, URL, or headline must be provided.',
});
export type NewsSleuthInput = z.infer<typeof NewsSleuthInputSchema>;

export const NewsSleuthOutputSchema = z.object({
  credibilityReport: z.object({
    overallScore: z.number().describe('An overall credibility score for the article (0-100).'),
    verdict: z.enum(['Likely Real', 'Likely Fake', 'Uncertain']).describe('The final verdict on the news article\'s authenticity.'),
    summary: z.string().describe('A brief summary of the article content.'),
    biases: z.array(z.string()).describe('A list of potential biases identified in the article.'),
    flaggedContent: z.array(z.string()).describe('Specific content flagged for low credibility.'),
    reasoning: z.string().describe('The reasoning behind the credibility assessment.'),
  }),
});
export type NewsSleuthOutput = z.infer<typeof NewsSleuthOutputSchema>;
export type NewsSleuthError = { error: string; details?: string };


// Image Verifier Schemas
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
    detectedText: z.string().optional().nullable().describe("Text detected within the image. If none, this should be null."),
});

export type ImageVerifierInput = z.infer<typeof ImageVerifierInputSchema>;
export type ImageVerifierOutput = z.infer<typeof ImageVerifierOutputSchema>;
export type ImageVerifierError = { error: string; details?: string };


// Audio Authenticator Schemas
export const AudioAuthenticatorInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g-en", "hi").'),
});

export const AudioAuthenticatorOutputSchema = z.object({
  overallScore: z.number().describe("A score from 0-100 indicating the confidence in the authenticity of the audio."),
  verdict: z.enum(['Likely Authentic', 'Potential AI/Manipulation', 'Uncertain']).describe("The final judgment on the audio's authenticity."),
  summary: z.string().describe("A brief summary of the findings."),
  reasoning: z.string().describe("A detailed report explaining the reasoning behind the verdict."),
  detectedText: z.string().optional().nullable().describe("The transcribed text from the audio, if any. If not, this should be null."),
});

export type AudioAuthenticatorInput = z.infer<typeof AudioAuthenticatorInputSchema>;
export type AudioAuthenticatorOutput = z.infer<typeof AudioAuthenticatorOutputSchema>;
export type AudioAuthenticatorError = { error: string; details?: string };


// Video Integrity Schemas
export const VideoIntegrityInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

export const VideoIntegrityOutputSchema = z.object({
  overallScore: z.number().describe('A confidence score (0-100) in the video\'s authenticity.'),
  verdict: z.enum(['Likely Authentic', 'Potential Manipulation', 'Uncertain']).describe('The final judgment on the video\'s integrity.'),
  summary: z.string().describe('A brief summary of the findings.'),
  deepfake: z.string().describe("Analysis of deepfake elements (e.g., face swapping). State 'Detected' or 'Not Detected' and explain why."),
  videoManipulation: z.string().describe("Analysis of general video manipulations (CGI, edits). State 'Detected' or 'Not Detected' and explain why."),
  syntheticVoice: z.string().describe("Analysis of voice cloning or synthetic speech. State 'Detected' or 'Not Detected' and explain why."),
  reasoning: z.string().describe('The reasoning behind the overall verdict and score.'),
  detectedText: z.string().optional().nullable().describe("Transcribed text from the video's audio track, if any. If none, this should be null."),
});

export type VideoIntegrityInput = z.infer<typeof VideoIntegrityInputSchema>;
export type VideoIntegrityOutput = z.infer<typeof VideoIntegrityOutputSchema>;
export type VideoIntegrityError = { error: string; details?: string };
