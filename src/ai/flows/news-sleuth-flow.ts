
'use server';

/**
 * @fileOverview A fake news detection AI agent.
 *
 * - newsSleuthAnalysis - A function that handles the news analysis process.
 * - NewsSleuthInput - The input type for the newsSleuthAnalysis function.
 * - NewsSleuthOutput - The return type for the newsSleuthAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {getArticleContentFromUrl} from '@/services/url-fetcher';
import {z} from 'genkit';
import { NewsSleuthInputSchema, NewsSleuthOutputSchema, type NewsSleuthInput, type NewsSleuthOutput } from '@/ai/schemas';


export async function newsSleuthAnalysis(input: NewsSleuthInput): Promise<NewsSleuthOutput> {
  return newsSleuthFlow(input);
}

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

const prompt = ai.definePrompt({
  name: 'newsSleuthPrompt',
  tools: [fetcherTool],
  input: {schema: NewsSleuthInputSchema},
  output: {schema: NewsSleuthOutputSchema},
  prompt: `You are an expert in identifying fake news and assessing the credibility of news articles.

  Your goal is to analyze news information for potential biases, low credibility content, and overall trustworthiness. Provide a detailed report including:
  1. An overall credibility score (0-100).
  2. A final verdict of 'Likely Real', 'Likely Fake', or 'Uncertain'.
  3. A brief summary of the article.
  4. A list of potential biases identified.
  5. Specific content flagged for low credibility.
  6. The reasoning behind your assessment.

  The user has provided one of the following: the full text of a news article, its URL, or just its headline.

  - If the user provides a URL, you MUST use the 'getArticleContentFromUrl' tool to fetch the article's text content first.
  - If the tool returns an error, explain to the user that you were unable to retrieve the content from the URL and that they should try pasting the article text directly. In this case, set the verdict to 'Uncertain' and the score to 0.
  - Your analysis should be based on the provided or fetched information.

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

const newsSleuthFlow = ai.defineFlow(
  {
    name: 'newsSleuthFlow',
    inputSchema: NewsSleuthInputSchema,
    outputSchema: NewsSleuthOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const toolRequest = llmResponse.toolRequests.find(
      (req) => req.tool.name === 'getArticleContentFromUrl'
    );

    if (toolRequest) {
      const toolResponse = await toolRequest.run();
      const articleContent = (toolResponse as any).textContent;
      const fetchError = (toolResponse as any).error;

      if (fetchError || !articleContent) {
        return {
          credibilityReport: {
            overallScore: 0,
            verdict: 'Uncertain',
            summary: 'Could not analyze the article.',
            biases: [],
            flaggedContent: [],
            reasoning: `I was unable to retrieve the content from the provided URL. The website may be blocking automated access, or the URL may be incorrect. Please try copying and pasting the article text directly for analysis. Error: ${fetchError || 'Could not extract article text.'}`,
          },
        };
      }
      
      const finalInput = { ...input, articleText: articleContent };
      const finalResponse = await prompt(finalInput);
      return finalResponse.output!;

    } else {
        return llmResponse.output!;
    }
  }
);
