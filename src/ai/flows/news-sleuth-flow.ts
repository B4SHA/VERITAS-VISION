
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent using structured output.
 *
 * This file defines the server-side logic for generating a news credibility report
 * via a single, highly constrained Gemini API call, ensuring reliable JSON output
 * and using Google Search grounding for fact-checking.
 */

import type {
  NewsSleuthInput,
  NewsSleuthOutput,
  NewsSleuthError,
} from '@/ai/schemas';
import { ai } from '@/ai/genkit';
import { CREDIBILITY_REPORT_SCHEMA } from '@/ai/schemas';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Extracts source URIs from the Gemini grounding metadata.
 * @param response The raw response object from the Gemini API.
 * @returns An array of string URIs.
 */
const extractSources = (response: any): string[] => {
    let sources: string[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingAttributions) {
        sources = groundingMetadata.groundingAttributions
            .map((attr: any) => attr.web?.uri)
            .filter((uri: string) => uri);
    }
    return sources;
};

async function runNewsSleuthAnalysis(input: NewsSleuthInput): Promise<NewsSleuthOutput | NewsSleuthError> {
    const { articleText, articleUrl, articleHeadline, language } = input;
    
    // 1. Construct the most specific query for the AI to use
    let articleInfo = '';
    if (articleUrl) {
        // Instruct the AI to use search tool to access the URL content
        articleInfo = `the article found at this URL: ${articleUrl}. The AI MUST use its search tool to verify and fetch the content from this URL.`;
    } else if (articleText) {
        articleInfo = `the following article text: "${articleText}"`;
    } else if (articleHeadline) {
        articleInfo = `the article with the headline: "${articleHeadline}"`;
    } else {
        return { error: 'INVALID_INPUT', details: 'No URL, text, or headline was provided for analysis.' };
    }

    // 2. Define System and User Prompts
    const systemPrompt = `You are a world-class investigative journalist AI specializing in debunking fake news and analyzing media bias. Your task is to perform a detailed credibility check on the provided news item.
    
    **Instructions:**
    1. **USE GOOGLE SEARCH GROUNDING** to find context, corroborating sources, and the content of the news item. If a URL is provided, you MUST attempt to access it.
    2. **IF THE URL IS INACCESSIBLE** (e.g., returns a 'Page Not Found' or 404 error), you MUST state this clearly in your analysis. If the URL contains a date that is in the future, you should point this out as a likely reason for the page not being found. Then, base your analysis on the headline from the URL and other information found via search.
    3. **STRICTLY** adhere to the following JSON schema and format your entire output as a single JSON object.
    4. **YOUR FINAL OUTPUT MUST BE THE JSON OBJECT WRAPPED IN A MARKDOWN CODE BLOCK LIKE THIS: \`\`\`json\n{...}\n\`\`\`**
    5. All assessments and reasoning must be based only on the facts and sources retrieved via your search tool.
    6. The analysis should be sharp, objective, and focus on factual accuracy, source transparency, and manipulative language.
    7. Generate the entire report in the ${language || 'English'} language.`;

    const userPrompt = `Analyze the credibility of ${articleInfo}`;

    // 3. Call the API and Parse the Markdown-wrapped JSON
    try {
        const response = await ai.generate({
            model: googleAI.model('gemini-2.5-flash'),
            prompt: userPrompt,
            system: systemPrompt,
        });

        const rawText = response.text;
        if (rawText) {
            let jsonText = ''; 
            
            // 4a. Attempt to extract JSON from ```json ... ``` markdown block (most reliable way)
            const markdownMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
            if (markdownMatch && markdownMatch[1]) {
                jsonText = markdownMatch[1].trim();
            } else {
                // 4b. Fallback: Search for the first '{' and last '}'
                const startIndex = rawText.indexOf('{');
                const endIndex = rawText.lastIndexOf('}');
                
                if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                    jsonText = rawText.substring(startIndex, endIndex + 1);
                } else {
                    // If no JSON block is found at all, we can't parse it.
                    console.error("No JSON block or curly braces found in AI response.");
                    return { 
                        error: 'INVALID_JSON_BLOCK', 
                        details: 'The AI response did not contain the expected JSON markdown block or curly braces.',
                    };
                }
            }
            
            let parsedData: NewsSleuthOutput;
            
            try {
                // 4c. Attempt to parse the cleaned JSON string
                parsedData = JSON.parse(jsonText);
            } catch (e) {
                console.error("Failed to parse JSON string:", jsonText);
                return { 
                    error: 'INVALID_JSON_FORMAT', 
                    details: 'The AI model returned text that could not be parsed as valid JSON after extraction.',
                };
            }

            // Extract sources from the grounding metadata in the original response
            const fetchedSources = extractSources(response);

            // Attach sources and return the validated data
            parsedData.sources = fetchedSources;
            return parsedData;

        } else {
            const blockReason = response.candidates?.[0]?.finishReason || 'Unknown failure';
            console.error('AI content generation failed:', response);
            return { error: 'AI_FAILURE', details: `AI content generation failed. Reason: ${blockReason}` };
        }

    } catch (e: any) {
        console.error("API or Network Error:", e);
        return { error: 'API_EXECUTION_FAILED', details: e.message || 'The AI model failed to generate a response.' };
    }
};

export { runNewsSleuthAnalysis as newsSleuthAnalysis };
