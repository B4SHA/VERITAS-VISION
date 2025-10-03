
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getWebPageContent as getWebPageContentTool } from '@/ai/tools/web-loader';

const getWebPageContent = ai.defineTool(
    {
      name: 'getWebPageContent',
      description: 'Fetches the text content of a given web page URL.',
      inputSchema: z.object({ url: z.string().url() }),
      outputSchema: z.object({
        content: z.string().optional(),
        error: z.string().optional(),
      }),
    },
    async ({ url }) => {
      try {
        const content = await getWebPageContentTool(url);
        return { content };
      } catch (e: any) {
        return { error: `Failed to fetch content from ${url}: ${e.message}` };
      }
    }
  );


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
    return newsSleuthFlow(input);
}


const prompt = ai.definePrompt({
    name: 'newsSleuthPrompt',
    input: { schema: NewsSleuthInputSchema },
    output: { schema: NewsSleuthOutputSchema },
    tools: [getWebPageContent],
    prompt: `You are a world-class investigative journalist and fact-checker AI, known as "News Sleuth." Your mission is to analyze a news article based on the provided text, URL, or headline and deliver a comprehensive credibility report.

**Input:**
You will receive one of the following: the full text of an article, a URL to an online article, or just a headline.

**Your Task:**
1.  **Analyze the Content:**
    *   If given a URL, you MUST use the 'getWebPageContent' tool to fetch the article content. If the tool fails, base your analysis on the error and the URL itself.
    *   Assess the language for sensationalism, emotional manipulation, and logical fallacies.
    *   Identify the main claims made in the article.
2.  **Fact-Check Claims:**
    *   Cross-reference the main claims with information from a diverse range of reputable, neutral sources (e.g., major news agencies, academic institutions, official reports).
    *   Verify data, statistics, and quotes.
3.  **Source & Author Analysis:**
    *   Investigate the reputation of the publication and the author (if available).
    *   Look for any conflicts of interest, historical biases, or patterns of spreading misinformation.
4.  **Identify Biases:**
    *   Detect and list any political, ideological, or commercial biases present in the article.
5.  **Generate Credibility Report:**
    *   **Overall Score:** Assign a credibility score from 0 (completely false) to 100 (highly credible).
    *   **Verdict:** Provide a clear verdict: 'Likely Real', 'Likely Fake', or 'Uncertain'.
    *   **Summary:** Write a concise summary of your findings.
    *   **Biases:** List the specific biases you identified.
    *   **Flagged Content:** Quote specific sentences or phrases that are factually incorrect, misleading, or unsubstantiated.
    *   **Reasoning:** Provide a detailed, step-by-step explanation for your conclusion, citing evidence.
    *   **Sources:** List the URLs of the primary sources you used for fact-checking.

The output language for the report must be in the language specified by the user: {{{language}}}.

**Article Information for Analysis:**
{{#if articleText}}
**Article Text:**
{{{articleText}}}
{{/if}}

{{#if articleUrl}}
**Article URL:**
{{{articleUrl}}}
{{/if}}

{{#if articleHeadline}}
**Article Headline:**
{{{articleHeadline}}}
{{/if}}`,
});

const newsSleuthFlow = ai.defineFlow(
  {
    name: 'newsSleuthFlow',
    inputSchema: NewsSleuthInputSchema,
    outputSchema: NewsSleuthOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
