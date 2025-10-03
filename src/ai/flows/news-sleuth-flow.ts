
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

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

  const prompt = `You are an expert investigative journalist AI. Your primary task is to analyze the provided article content and generate a credibility report.

**Instructions:**
1.  **ANALYZE**: Based on the provided content, perform a detailed analysis. Check facts, identify the author and publication, and look for biases or manipulative language (sensationalism, logical fallacies).
2.  **GENERATE JSON REPORT**: The output language must be: **${input.language}**.

Article Information for Analysis:
${articleInfo}

Your final output MUST be only a single JSON object that strictly adheres to the provided schema. Do not include any other text, conversation, or markdown formatting like \`\`\`json.`;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{text: prompt}] }],
    });

    const response = result.response;
    let text = response.text();

    try {
        // First, try to parse directly
        try {
          const parsed = JSON.parse(text);
          return NewsSleuthOutputSchema.parse(parsed);
        } catch (e) {
          // If direct parse fails, try to extract from markdown
          const match = text.match(/```json\n([\s\S]*?)\n```/);
          if (match && match[1]) {
            const parsed = JSON.parse(match[1]);
            return NewsSleuthOutputSchema.parse(parsed);
          }
  
          // If markdown extraction fails, try to find the JSON object manually
          const startIndex = text.indexOf('{');
          const endIndex = text.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            const jsonString = text.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonString);
            return NewsSleuthOutputSchema.parse(parsed);
          }
          
          // If all else fails, throw the original error
          throw new Error("Failed to find a valid JSON object in the response.");
        }
    } catch (e) {
        console.error("RAW AI RESPONSE THAT FAILED TO PARSE:", text);
        throw new Error("The AI returned an invalid response format. Check the server logs for the raw output.");
    }
}
