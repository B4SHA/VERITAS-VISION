
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
    model: "gemini-1.5-pro",
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
    articleInfo += `**PRIMARY URL TO ANALYZE AND FETCH CONTENT FROM**: ${input.articleUrl}\n\n`;
  }

  const prompt = `You are a world-class investigative journalist and fact-checker AI, known as "News Sleuth." Your mission is to analyze a news article based on the provided information and deliver a comprehensive credibility report.

**Critically, if a URL is provided, you MUST fetch its content and base your entire analysis on that content.**

**Your Task:**
1.  **Fetch Content**: If a URL is provided, access it and retrieve the full article text. All subsequent steps depend on this.
2.  **Analyze Content**: Analyze the article's structure, language, and claims.
3.  **Fact-Check**: Use Google Search to fact-check specific claims against multiple reputable sources.
4.  **Investigate Reputation**: Investigate the reputation of the publication and the author using search.
5.  **Generate Report**: Generate a credibility report in JSON that matches the required schema. Do not add any conversational text or markdown formatting before or after the JSON object.

The output must be in the language specified by the user: **${input.language}**.

**Article Information for Analysis:**
${articleInfo}
`;
  
  const result = await model.generateContent(prompt);

  const responseText = result.response.text();
  console.log("Raw response from Gemini model:", responseText);

  try {
    return NewsSleuthOutputSchema.parse(JSON.parse(responseText));
  } catch (e) {
    console.error("Failed to parse JSON response from model:", responseText);
    throw new Error("Invalid response from Gemini model. Please try again.");
  }
}
