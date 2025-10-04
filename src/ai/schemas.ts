
import { z } from 'zod';

// A more detailed analysis structure
const AnalysisDetailSchema = z.object({
  assessment: z.string().describe("Overall judgment (e.g., 'Low', 'High', 'Speculative')."),
  supporting_points: z.array(z.string()).describe("3-5 bullet points confirming or refuting the facts based on search grounding."),
});

// News Sleuth Schemas (Updated based on example)
export const NewsSleuthInputSchema = z.object({
  articleText: z.string().optional().describe('The full text of the news article.'),
  articleUrl: z.string().optional().describe('The URL of the news article to be fetched and analyzed.'),
  articleHeadline: z.string().optional().describe('The headline of the news article.'),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

export const NewsSleuthOutputSchema = z.object({
    report_title: z.string().describe("A concise title for the credibility report."),
    article_details: z.object({
        title: z.string().describe("The exact title of the article being analyzed."),
        main_claim: z.string().describe("The single, most important claim made in the article."),
    }),
    analysis: z.object({
        factual_accuracy: AnalysisDetailSchema,
        source_reliability: AnalysisDetailSchema,
        bias_manipulation: AnalysisDetailSchema,
    }),
    overall_credibility_score: z.object({
        score: z.number().describe("A final score from 1.0 (Very Low) to 5.0 (Very High), as a floating point number."),
        reasoning: z.string().describe("A concise paragraph justifying the final score based on the analysis."),
    }),
    recommendations: z.array(z.string()).describe("3 practical recommendations for the reader (e.g., 'Verify with official sources.')."),
    sources: z.array(z.string()).optional().describe('A list of URLs used to corroborate facts. This is populated from search results.'),
});


export type NewsSleuthInput = z.infer<typeof NewsSleuthInputSchema>;
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
