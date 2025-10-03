
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

const fetchUrlTool = {
    "function_declarations": [
        {
            "name": "fetchUrl",
            "description": "Fetches the text content of a publicly accessible web page URL.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": { "type": "string", "description": "The full URL of the page to fetch." },
                },
                "required": ["url"],
            }
        }
    ]
};

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
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
});

async function fetchUrl(url: string): Promise<any> {
    try {
        console.log(`Fetching URL: ${url}`);
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) {
            return { error: `Failed to fetch URL: ${response.statusText}` };
        }
        const text = await response.text();
        return { content: `Content from ${url}: ${text.substring(0, 500)}...` };
    } catch (e: any) {
        console.error('Fetch failed:', e);
        return { error: `Failed to fetch URL: ${url}. Error: ${e.message}` };
    }
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
        articleInfo += `**PRIMARY URL TO FETCH AND ANALYZE**: ${input.articleUrl}\n\n`;
    }

    const jsonSchema = zodToJsonSchema(NewsSleuthOutputSchema);

    const prompt = `You are a world-class investigative journalist and fact-checker AI, known as "News Sleuth." Your mission is to analyze a news article based on the provided information and deliver a comprehensive credibility report, grounded in real-time web search results.

**Your Task:**
1.  **Gather Information:**
    * The provided \`articleInfo\` may contain a URL, a headline, or the full text. If a URL is present in the \`PRIMARY URL TO FETCH AND ANALYZE\` field, you **MUST** use the \`fetchUrl\` tool to get the content. Do not use Google Search for this initial fetch.
    * After fetching the primary URL (if provided), you **MUST** use Google Search to find corroborating and contradictory reports from various, diverse, and reputable sources.
2.  **Analyze the Content:** Assess the article's structure, language, and claims.
3.  **Fact-Check Claims:** Cross-reference all claims with evidence found via your search.
4.  **Source & Author Analysis:** Investigate the reputation of the publication and the author.
5.  **Generate Credibility Report:** You must respond with a valid JSON object that conforms to the following JSON Schema. Do not output any text or markdown formatting before or after the JSON object.
    
    \`\`\`json
    ${JSON.stringify(cleanJsonSchema(jsonSchema))}
    \`\`\`

The output language for the report must be in the language specified by the user: **${input.language}**.

**Article Information for Analysis:**
${articleInfo}
`;
    
    const chat = model.startChat({
        tools: [fetchUrlTool, { "google_search": {} }],
    });

    const result = await chat.sendMessage(prompt);
    let response = result.response;

    if (response.functionCalls() && response.functionCalls().length > 0) {
        const functionCalls = response.functionCalls();
        const functionResponses = [];

        for (const call of functionCalls) {
            if (call.name === 'fetchUrl') {
                const url = call.args.url;
                const content = await fetchUrl(url);
                functionResponses.push({
                    functionResponse: {
                        name: 'fetchUrl',
                        response: content,
                    },
                });
            }
        }
        
        if (functionResponses.length > 0) {
            const result2 = await chat.sendMessage(functionResponses);
            response = result2.response;
        }
    }
    
    const responseText = response.text();
    const jsonText = responseText.replace(/```json\n?/, '').replace(/```$/, '');
    
    try {
        return NewsSleuthOutputSchema.parse(JSON.parse(jsonText));
    } catch(e) {
        console.error("Failed to parse JSON response from model:", jsonText);
        throw new Error("The model returned an invalid response. Please try again.");
    }
}
