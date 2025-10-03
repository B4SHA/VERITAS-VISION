
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';


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


/**
 * A local tool definition to simulate fetching content from a URL.
 * NOTE: In a real-world app, you'd use a robust library like 'cheerio' 
 * or an API to scrape the full article text safely and reliably.
 */
const fetchUrlTool = ai.defineTool(
    {
        name: 'fetchUrl',
        description: 'Fetches the text content of a publicly accessible web page URL.',
        inputSchema: z.object({
            url: z.string().describe('The full URL of the page to fetch.'),
        }),
        outputSchema: z.object({
            content: z.string().describe('The main text content of the article.'),
        }),
    },
    async ({ url }) => {
        console.log(`[Tool] Attempting to fetch content from: ${url}`);
        // *** DANGER: Standard fetch() cannot reliably scrape full article text 
        // from any random website. This is a placeholder for demonstration. ***
        try {
            const response = await fetch(url);
            // Simulate a simple, unreliable fetch of content.
            const text = await response.text(); 
            return { 
                content: `(Simulated Scrape) The article content from ${url} is too long to include directly, but the first 200 characters are: ${text.substring(0, 200)}... and the model should use this for analysis.` 
            };
        } catch (e) {
            console.error('Fetch failed:', e);
            return { content: `Could not reliably fetch content from the URL: ${url}. The model must proceed based on the headline/search results.` };
        }
    }
);

const newsSleuthPrompt = ai.definePrompt({
    name: 'newsSleuthPrompt',
    // The input schema is what the *prompt* receives, not the flow.
    // The flow will handle pre-processing.
    input: {
        schema: z.object({
            // The flow will pre-process and combine all article info into one field
            articleInfo: z.string(), 
            language: z.string(),
        })
    },
    output: { schema: NewsSleuthOutputSchema },
    // Tools are now 'googleSearch' (built-in) AND our custom tool
    tools: ['googleSearch', fetchUrlTool.name], 
    prompt: `You are a world-class investigative journalist and fact-checker AI, known as "News Sleuth." Your mission is to analyze a news article based on the provided information and deliver a comprehensive credibility report, grounded in real-time web search results.

**Your Task:**
1.  **Gather Information:**
    * The provided \`articleInfo\` may contain a URL, a headline, or the full text. If a URL is present, you **MUST** use the \`fetchUrl\` tool to get the content.
    * You **MUST** use the \`googleSearch\` tool to find corroborating and contradictory reports from various, diverse, and reputable sources.
2.  **Analyze the Content:** Assess the article's structure, language, and claims.
3.  **Fact-Check Claims:** Cross-reference all claims with evidence found via \`googleSearch\`.
4.  **Source & Author Analysis:** Investigate the reputation of the publication and the author.
5.  **Generate Credibility Report:** Fill out the JSON structure completely, ensuring all fields are present.

The output language for the report must be in the language specified by the user: **{{{language}}}**.

**Article Information for Analysis:**
{{{articleInfo}}}
`,
});


const newsSleuthFlow = ai.defineFlow(
  {
    name: 'newsSleuthFlow',
    inputSchema: NewsSleuthInputSchema,
    outputSchema: NewsSleuthOutputSchema,
  },
  async (input) => {
    // Step 1: Pre-process the input into a single 'articleInfo' string for the prompt
    let articleInfo = '';
    if (input.articleText) {
        articleInfo += `Full Article Text:\n---\n${input.articleText}\n---\n`;
    }
    if (input.articleHeadline) {
        articleInfo += `Headline: "${input.articleHeadline}"\n`;
    }
    if (input.articleUrl) {
        articleInfo += `**PRIMARY URL TO FETCH**: ${input.articleUrl}\n\n`;
        // The model is instructed to call fetchUrl on its own, 
        // but we ensure the URL is prominent.
    }

    // Step 2: Call the prompt/model, allowing it to use the tools (Google Search and fetchUrl)
    const { output } = await newsSleuthPrompt({ 
        articleInfo: articleInfo, 
        language: input.language 
    });

    // Step 3: Return the structured output
    return output!;
  }
);
