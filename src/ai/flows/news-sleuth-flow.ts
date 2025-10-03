
'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { z } from 'zod';
import { zodToJsonSchema } from "zod-to-json-schema";
import { cleanJsonSchema } from "@/lib/utils";

const NewsSleuthInputSchema = z.object({
  articleText: z.string().optional().describe('The full text of the news article.'),
  articleUrl: z.string().optional().describe('The URL of the news article.'),
  articleHeadline: z.string().optional().describe('The headline of the news article.'),
  language: z.string().describe('The language of the analysis, specified as a two-letter ISO 639-1 code (e.g., "en", "hi").'),
});

const NewsSleuthOutputSchema = z.object({
  credibilityReport: z.object({
    overallScore: z.number().describe('A credibility score from 0 to 100.'),
    verdict: z.enum(['Likely Real', 'Likely Fake', 'Uncertain']).describe('The final judgment on the credibility of the news.'),
    summary: z.string().describe('A brief summary of the findings.'),
    biases: z.array(z.string()).describe('A list of identified biases (e.g., "Confirmation Bias", "Sensationalism").'),
    flaggedContent: z.array(z.string()).describe('Specific phrases or claims that are flagged as potentially misleading or false.'),
    reasoning: z.string().describe('A detailed explanation of how the score and verdict were determined.'),
    sources: z.array(z.string()).describe('A list of URLs for sources consulted during the analysis.'),
  }),
});

export type NewsSleuthInput = z.infer<typeof NewsSleuthInputSchema>;
export type NewsSleuthOutput = z.infer<typeof NewsSleuthOutputSchema>;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const jsonSchema = zodToJsonSchema(NewsSleuthOutputSchema);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview",
    generationConfig: {
        response_mime_type: "application/json",
        // @ts-ignore
        response_schema: cleanJsonSchema(jsonSchema),
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
    // @ts-ignore
    tools: [{ "google_search": {} }],
});

export async function newsSleuthAnalysis(input: NewsSleuthInput): Promise<NewsSleuthOutput> {
  let articleInfo = '';
  if (input.articleText) {
    articleInfo += `Full Article Text:\n---\n${input.articleText}\n---\n`;
  }
  if (input.articleHeadline) {
    articleInfo += `Headline: "${input.articleHeadline}"\n`;
  }
  if (input.articleUrl) {
    articleInfo += `**You MUST fetch and analyze the content from this primary URL using your web search tool**: ${input.articleUrl}\n\n`;
  }
  
  const prompt = `You are an expert investigative journalist AI. Your primary task is to fetch the content from the provided URL (if available), analyze it, and then generate a credibility report in JSON format. You have access to Google Search to find real-time information and access URLs.

**Instructions:**
1.  **FETCH CONTENT**: If a URL is provided in the "Article Information for Analysis" section, you MUST access it using your search tool to read the full content of the article. Your entire analysis depends on this step. If only text or a headline is provided, use that.
2.  **ANALYZE**: Based on the fetched content, perform a detailed analysis. Check facts, identify the author and publication, and look for biases or manipulative language.
3.  **GENERATE JSON REPORT**: Your final output MUST be only a single JSON object that strictly adheres to the schema provided in the generation configuration. Do not include any other text, conversation, or markdown formatting.

The output language must be: **${input.language}**.

**Article Information for Analysis:**
${articleInfo}
`;

  const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const responseText = result.response.text();
  return NewsSleuthOutputSchema.parse(JSON.parse(responseText));
}
