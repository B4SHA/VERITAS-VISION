
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


const newsSleuthPrompt = ai.definePrompt({
    name: 'newsSleuthPrompt',
    input: {
        schema: z.object({
            articleInfo: z.string(), 
            language: z.string(),
        })
    },
    output: { schema: NewsSleuthOutputSchema },
    tools: ['googleSearch'], 
    prompt: `You are a world-class investigative journalist and fact-checker AI, known as "News Sleuth." Your mission is to analyze a news article based on the provided information and deliver a comprehensive credibility report. You must use the 'googleSearch' tool to find real-time information to ground your analysis.

**Your Task:**
1.  **Gather Information:**
    * The provided \`articleInfo\` may contain a URL, a headline, or the full text.
    * Use the 'googleSearch' tool to find corroborating and contradictory reports from various, diverse, and reputable sources.
2.  **Analyze the Content:** Assess the article's structure, language, and claims.
3.  **Fact-Check Claims:** Cross-reference all claims with evidence found via your search capabilities.
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
    let articleInfo = '';
    if (input.articleText) {
        articleInfo += `Full Article Text:\n---\n${input.articleText}\n---\n`;
    }
    if (input.articleHeadline) {
        articleInfo += `Headline: "${input.articleHeadline}"\n`;
    }
    if (input.articleUrl) {
        articleInfo += `Article URL (for context and search): ${input.articleUrl}\n\n`;
    }

    const { output } = await newsSleuthPrompt({ 
        articleInfo: articleInfo, 
        language: input.language 
    });

    return output!;
  }
);
