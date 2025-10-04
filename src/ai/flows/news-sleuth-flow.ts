
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent using structured output.
 *
 * This file defines the server-side logic for generating a news credibility report
 * via a single, highly constrained Gemini API call, ensuring reliable JSON output
 * and using Google Search grounding for fact-checking.
 */
import {
  GoogleGenerativeAI,
} from '@google/generative-ai';

import type {
  NewsSleuthInput,
  NewsSleuthOutput,
  NewsSleuthError,
} from '@/ai/schemas';

// --- JSON Schema for Structured Output ---
const CREDIBILITY_REPORT_SCHEMA = {
  type: "OBJECT",
  properties: {
    report_title: { "type": "STRING", "description": "A concise title for the credibility report." },
    article_details: {
      "type": "OBJECT",
      "properties": {
        "title": { "type": "STRING", "description": "The exact title of the article being analyzed." },
        "main_claim": { "type": "STRING", "description": "The single, most important claim made in the article." }
      },
      "required": ["title", "main_claim"]
    },
    analysis: {
      "type": "OBJECT",
      "properties": {
        "factual_accuracy": {
          "type": "OBJECT",
          "properties": {
            "assessment": { "type": "STRING", "description": "Overall judgment (e.g., 'Low', 'High', 'Speculative')." },
            "supporting_points": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "3-5 bullet points confirming or refuting the facts based on search grounding." }
          },
          "required": ["assessment", "supporting_points"]
        },
        "source_reliability": {
          "type": "OBJECT",
          "properties": {
            "assessment": { "type": "STRING", "description": "Overall judgment (e.g., 'Verifiable', 'Anonymous', 'Social Media Rumor')." },
            "supporting_points": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "3-5 bullet points analyzing the article's sources and citing the search results." }
          },
          "required": ["assessment", "supporting_points"]
        },
        "bias_manipulation": {
          "type": "OBJECT",
          "properties": {
            "assessment": { "type": "STRING", "description": "Overall judgment (e.g., 'Clickbait', 'Neutral', 'Sensationalist')." },
            "supporting_points": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "3-5 bullet points on biased language, tone, or cherry-picking of facts." }
          },
          "required": ["assessment", "supporting_points"]
        }
      },
      "required": ["factual_accuracy", "source_reliability", "bias_manipulation"]
    },
    overall_credibility_score: {
      "type": "OBJECT",
      "properties": {
        "score": { "type": "NUMBER", "description": "A final score from 1.0 (Very Low) to 5.0 (Very High), as a floating point number." },
        "reasoning": { "type": "STRING", "description": "A concise paragraph justifying the final score based on the analysis." }
      },
      "required": ["score", "reasoning"]
    },
    recommendations: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "3 practical recommendations for the reader (e.g., 'Verify with official sources.')." }
  },
  "required": ["report_title", "article_details", "analysis", "overall_credibility_score", "recommendations"]
};

// --- Helper Functions ---

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
            .filter(Boolean); // Filter out any null/undefined URIs
    }
    return sources;
};

/**
 * Fetches data with exponential backoff for handling transient errors like rate limiting.
 */
const exponentialBackoffFetch = async (url: string, options: RequestInit, maxRetries = 5): Promise<Response> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 || response.status >= 500) { // Retry on rate limit or server errors
                 if (i === maxRetries - 1) throw new Error(`Request failed after ${maxRetries} retries with status ${response.status}.`);
                 console.warn(`Request failed with status ${response.status}. Retrying in ${1000 * (i + 1)}ms...`);
                 await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                 continue;
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.error("Network error during fetch. Retrying...", error);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw new Error("Fetch failed after multiple retries.");
};


// --- Main Analysis Function ---

async function runNewsSleuthAnalysis(input: NewsSleuthInput): Promise<NewsSleuthOutput | NewsSleuthError> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: `You are a world-class investigative journalist AI specializing in debunking fake news and analyzing media bias. Your task is to perform a detailed credibility check on the provided news item.
    
        **Instructions:**
        1. **USE GOOGLE SEARCH GROUNDING** to find context, corroborating sources, and the content of the news item.
        2. **STRICTLY** adhere to the JSON schema provided in the user prompt for your final output. Your entire output must be a single JSON object.
        3. All assessments and reasoning must be based only on the facts and sources retrieved via your search tool.
        4. The analysis should be sharp, objective, and focus on factual accuracy, source transparency, and manipulative language.
        5. Generate the entire report in the ${input.language || 'English'} language.`
    });

    const { articleText, articleUrl, articleHeadline } = input;
    
    let articleInfo = '';
    if (articleUrl) {
        articleInfo = `the article found at this URL: ${articleUrl}. You MUST use your search tool to verify and fetch the content from this URL.`;
    } else if (articleText) {
        articleInfo = `the following article text: "${articleText}"`;
    } else if (articleHeadline) {
        articleInfo = `the article with the headline: "${articleHeadline}"`;
    } else {
        return { error: 'INVALID_INPUT', details: 'No URL, text, or headline was provided for analysis.' };
    }

    const prompt = `Analyze the credibility of ${articleInfo}. Your output MUST be a single JSON object that conforms to the following schema: ${JSON.stringify(CREDIBILITY_REPORT_SCHEMA)}`;

    try {
        const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ "googleSearch": {} }],
        });
        
        const response = result.response;
        
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts?.[0]?.text) {
            const jsonText = response.candidates[0].content.parts[0].text;
            let parsedData: NewsSleuthOutput;
            
            try {
                parsedData = JSON.parse(jsonText);
            } catch (e) {
                console.error("Failed to parse JSON:", jsonText);
                return { error: 'INVALID_JSON', details: 'The AI model returned an invalid JSON format, preventing structural parsing.' };
            }

            const fetchedSources = extractSources(response);

            // Attach sources and return the validated data
            parsedData.sources = fetchedSources;
            return parsedData;

        } else {
            const blockReason = response.promptFeedback?.blockReason || 'Unknown failure';
            console.error('AI content generation failed:', response.promptFeedback);
            return { error: 'AI_FAILURE', details: `AI content generation failed. Reason: ${blockReason}` };
        }

    } catch (e: any)       {
        console.error("API or Network Error:", e);
        // Check for the specific error message and provide a more user-friendly response.
        if (e.message && e.message.includes("is unsupported")) {
            return { error: 'API_CONFIG_ERROR', details: "The current AI configuration doesn't support the combination of features being requested. Please contact support." };
        }
        return { error: 'API_EXECUTION_FAILED', details: e.message || 'The AI model failed to generate a response.' };
    }
};

export { runNewsSleuthAnalysis as newsSleuthAnalysis };
