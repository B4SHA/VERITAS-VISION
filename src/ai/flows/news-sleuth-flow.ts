
'use server';

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

async function callSonarWithSearch(prompt: string): Promise<string> {
  const apiKey = process.env.PPLX_API_KEY;
  if (!apiKey) {
    throw new Error("PPLX_API_KEY is not set in the environment variables.");
  }
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-large-reasoning-online",
      messages: [{ role: "user", content: prompt }],
      stream: false
    }),
  });
  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  console.log("Raw Perplexity API response:", JSON.stringify(data, null, 2));
  return data.choices?.[0]?.message?.content ?? '';
}

export async function newsSleuthAnalysis(input: NewsSleuthInput): Promise<NewsSleuthOutput> {
  let articleInfo = '';
  if (input.articleText) {
    articleInfo += `Full Article Text:\n---\n${input.articleText}\n---\n`;
  }
  if (input.articleHeadline) {
    articleInfo += `Headline: "${input.articleHeadline}"\n`;
  }
  if (input.articleUrl) {
    // This is the critical part for URL analysis
    articleInfo += `**You MUST fetch and analyze the content from this primary URL**: ${input.articleUrl}\n\n`;
  }

  const jsonSchema = zodToJsonSchema(NewsSleuthOutputSchema);
  
  const prompt = `You are an expert investigative journalist AI. Your primary task is to fetch the content from the provided URL, analyze it, and then generate a credibility report in JSON format.

**Instructions:**
1.  **FETCH CONTENT**: Access the URL provided below in the "Article Information for Analysis" section. You MUST read the full content of this article. Your entire analysis depends on this step.
2.  **ANALYZE**: Based on the fetched content, perform a detailed analysis. Check facts, identify the author and publication, and look for biases or manipulative language.
3.  **GENERATE JSON REPORT**: Your final output MUST be only a single JSON object that strictly adheres to the following schema. Do not include any other text, conversation, or markdown formatting.

\`\`\`json
${JSON.stringify(cleanJsonSchema(jsonSchema))}
\`\`\`

The output language must be: **${input.language}**.

**Article Information for Analysis:**
${articleInfo}
`;

  const responseText = await callSonarWithSearch(prompt);
  console.log("Raw response from Sonar model:", responseText);

  // More robust JSON extraction
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1] : responseText;

  try {
    return NewsSleuthOutputSchema.parse(JSON.parse(jsonText));
  } catch (e) {
    console.error("Failed to parse JSON response from model:", jsonText);
    throw new Error("Invalid response from Sonar model. Please try again.");
  }
}
