
'use server';

/**
 * @fileOverview A fake news detection AI agent with web cross-verification.
 */

import { ai } from '@/ai/genkit';
import { getArticleContentFromUrl } from '@/services/url-fetcher';
import { runWebSearch } from '@/services/web-search';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// ---------------------- Schemas ----------------------

const NewsSleuthInputSchema = z.object({
  articleText: z.string().optional().describe('The text content of the news article to analyze.'),
  articleUrl: z.string().url().optional().describe('The URL of the news article to analyze.'),
  articleHeadline: z.string().optional().describe('The headline of the news article to analyze.'),
}).refine(data => data.articleText || data.articleUrl || data.articleHeadline, {
  message: 'One of article text, URL, or headline must be provided.',
});
export type NewsSleuthInput = z.infer<typeof NewsSleuthInputSchema>;

const NewsSleuthOutputSchema = z.object({
  credibilityReport: z.object({
    overallScore: z.number().describe('An overall credibility score for the article (0-100).'),
    verdict: z.enum(['Likely Real', 'Likely Fake', 'Uncertain']).describe('The final verdict on the news article\'s authenticity.'),
    summary: z.string().describe('A brief summary of the article content.'),
    biases: z.array(z.string()).describe('A list of potential biases identified in the article.'),
    flaggedContent: z.array(z.string()).describe('Specific content flagged for low credibility.'),
    reasoning: z.string().describe('The reasoning behind the credibility assessment, including cross-check results.'),
    sourcesChecked: z.array(z.string()).optional().describe('List of external sources consulted.'),
  }),
});
export type NewsSleuthOutput = z.infer<typeof NewsSleuthOutputSchema>;

// ---------------------- Tools ----------------------

const fetcherTool = ai.defineTool(
  {
    name: 'getArticleContentFromUrl',
    description: 'Fetches the text content of a news article from a given URL. Use this tool if the user provides a URL.',
    inputSchema: z.object({
      url: z.string().url().describe('The URL of the news article to fetch.'),
    }),
    outputSchema: z.object({
      textContent: z.string().describe('The extracted text content of the article.'),
      error: z.string().optional().describe('An error message if fetching failed.'),
    }),
  },
  async (input) => getArticleContentFromUrl(input.url)
);

const webSearchTool = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Search the web to find corroborating or contradicting evidence for the claims made in the article.',
    inputSchema: z.object({
      query: z.string().describe('A claim or headline to verify.'),
    }),
    outputSchema: z.object({
      results: z.array(z.object({
        title: z.string(),
        snippet: z.string(),
        url: z.string(),
      })).describe('Search results with title, snippet, and URL.'),
    }),
  },
  async (input) => runWebSearch(input.query)
);

// ---------------------- Prompt ----------------------

const prompt = ai.definePrompt({
  name: 'newsSleuthPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  tools: [fetcherTool, webSearchTool],
  input: { schema: NewsSleuthInputSchema },
  output: { schema: NewsSleuthOutputSchema },
  prompt: `You are an expert fake news detector. 
Your job is to:
1. Analyze the article content. If a URL is provided, you MUST use the getArticleContentFromUrl tool first. If the tool returns an error, your report should state that the content could not be fetched and why.
2. Identify the major claims in the article.
3. For each major claim, use the "webSearch" tool to find corroborating or contradicting evidence.
4. Generate a credibility report.
5. In your reasoning, ONLY cite sources that come directly from the webSearch tool results. Do not invent or assume fact-checks if none were found. If the search tool returns no results or an error, state that you could not find sufficient evidence to confirm or deny the claims and grade credibility as 'Uncertain'.

Your report must include:
   - Overall credibility score (0-100).
   - Final verdict: "Likely Real", "Likely Fake", or "Uncertain".
   - A short summary of the article.
   - Potential biases.
   - Flagged low-credibility content.
   - Reasoning that explains your analysis AND references the external sources you found.
   - A list of the external source URLs you checked.

{{#if articleText}}
News Article Text:
{{articleText}}
{{/if}}

{{#if articleUrl}}
News Article URL to analyze:
{{articleUrl}}
{{/if}}

{{#if articleHeadline}}
News Article Headline:
{{articleHeadline}}
{{/if}}
`,
});

// ---------------------- Flow ----------------------

const newsSleuthFlow = ai.defineFlow(
  {
    name: 'newsSleuthFlow',
    inputSchema: NewsSleuthInputSchema,
    outputSchema: NewsSleuthOutputSchema,
  },
  async (input) => {
    let llmResponse = await prompt(input);

    // Loop to handle sequential tool calls (e.g., fetch then search)
    while (true) {
      const toolRequest = llmResponse.toolRequest;
      if (!toolRequest) {
        // No more tool requests, we have our final answer.
        break;
      }
      
      const toolResponse = await toolRequest.run();
      llmResponse = await prompt(input, { toolResponse });
    }

    if (!llmResponse.output) {
      // Handle cases where the model fails to produce a structured output
      return {
        credibilityReport: {
          overallScore: 0,
          verdict: 'Uncertain',
          summary: 'Analysis Error',
          biases: [],
          flaggedContent: [],
          reasoning: 'The AI model did not produce a valid analysis report. This may be due to an issue with the input or a temporary model failure.',
          sourcesChecked: [],
        },
      };
    }

    return llmResponse.output;
  }
);

export async function newsSleuthAnalysis(input: NewsSleuthInput): Promise<NewsSleuthOutput> {
  return newsSleuthFlow(input);
}
