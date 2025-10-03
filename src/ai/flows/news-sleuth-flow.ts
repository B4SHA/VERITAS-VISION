
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
    throw new Error("Perplexity API key (PPLX_API_KEY) is not set in the environment.");
  }
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-reasoning",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    throw new Error("Perplexity API error: " + (await response.text()));
  }
  const data = await response.json();
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
    articleInfo += `**PRIMARY URL TO ANALYZE**: ${input.articleUrl}\n\n`;
  }

  const jsonSchema = zodToJsonSchema(NewsSleuthOutputSchema);
  const prompt = `You are a world-class investigative journalist and fact-checker AI, known as "News Sleuth." Your mission is to analyze a news article based on the provided information and deliver a comprehensive credibility report, grounded in real-time web search results.

**Your Task:**
1. Gather information using your integrated web search.
2. Analyze the article's structure, language, and claims.
3. Fact-check claims against your web search results.
4. Investigate the reputation of the publication and the author.
5. Generate a credibility report in JSON that matches the schema below. Do not add any conversational text or markdown formatting before or after the JSON object.

\`\`\`json
${JSON.stringify(cleanJsonSchema(jsonSchema))}
\`\`\`

The output must be in the language specified by the user: **${input.language}**.

**Article Information for Analysis:**
${articleInfo}
`;

  const responseText = await callSonarWithSearch(prompt);

  console.log("Raw response from Sonar model:", responseText);

  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
  const jsonText = jsonMatch ? jsonMatch[1] : responseText;
  
  try {
    return NewsSleuthOutputSchema.parse(JSON.parse(jsonText));
  } catch (e) {
    console.error("Failed to parse JSON response from model:", jsonText);
    throw new Error("Invalid response from Sonar model. Please try again.");
  }
}
