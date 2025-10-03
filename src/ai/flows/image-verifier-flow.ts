
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
    confidenceScore: z.number().describe("A score from 0-100 indicating the confidence in the verdict."),
    report: z.string().describe("A detailed forensic report explaining the analysis, including details about artifacts, inconsistencies, web search findings, or other findings."),
    detectedText: z.string().optional().describe("Text detected within the image."),
});

export type ImageVerifierInput = z.infer<typeof ImageVerifierInputSchema>;
export type ImageVerifierOutput = z.infer<typeof ImageVerifierOutputSchema>;


export async function imageVerifierAnalysis(input: ImageVerifierInput): Promise<ImageVerifierOutput> {
  const imagePart = dataUriToGenerativePart(input.imageDataUri);

  const prompt = `You are an expert digital image forensics analyst. Your task is to analyze an image to determine its authenticity and detect any signs of AI generation, digital manipulation, or misleading context. You have access to Google Search to find real-time information to ground your analysis.

You will perform the following analysis:
1.  **Forensic Analysis**: Analyze the image for artifacts characteristic of AI image synthesis (GANs, diffusion models), manipulation (e.g., cloning, splicing), and inconsistencies in shadows, reflections, or perspectives.
2.  **Contextual Analysis (Web Search)**: Use Google Search to perform a conceptual reverse image search. Determine the likely origin and context of the image. Find news articles, fact-checks, or other sources discussing the image.
3.  **Text Analysis (OCR)**: If there is text in the image, extract it and include it in the 'detectedText' field.
4.  **Verdict, Confidence, and Report**: Provide a final verdict ('Likely Authentic', 'Likely AI-Generated/Manipulated', 'Uncertain'), a confidence score (0-100), and a comprehensive report detailing your findings from all analysis steps.

The output language for the report and analysis must be in the language specified by the user: ${input.language}.

Image for analysis is provided in the content.

Your final output MUST be only a single JSON object that strictly adheres to the provided schema. Do not include any other text, conversation, or markdown formatting like \`\`\`json.`;

  const result = await model.generateContent({
      contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
      tools: [{ "google_search": {} }],
  });

  const response = result.response;
  let text = response.text();

  try {
      if (text.startsWith("```json")) {
        text = text.substring(7, text.length - 3);
      }
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        text = text.substring(startIndex, endIndex + 1);
      }

      const parsed = JSON.parse(text);
      return ImageVerifierOutputSchema.parse(parsed);
  } catch (e) {
      console.error("RAW AI RESPONSE THAT FAILED TO PARSE:", text);
      throw new Error("The AI returned an invalid response format. Check the server logs for the raw output.");
  }
}
