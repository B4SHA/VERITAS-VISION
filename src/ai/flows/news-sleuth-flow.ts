
'use server';
/**
 * @fileOverview A news article credibility analysis AI agent using the direct Gemini API.
 *
 * This file defines the server-side logic for the News Sleuth feature, which
 * analyzes news articles for credibility by calling the Gemini API directly.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  type NewsSleuthInput,
  type NewsSleuthOutput,
  type NewsSleuthError,
} from '@/ai/schemas';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


const NewsSleuthOutputJsonSchema = {
    "type": "object",
    "properties": {
        "overallScore": {
            "type": "number",
            "description": "A credibility score from 0 to 100."
        },
        "verdict": {
            "type": "string",
            "enum": ['Likely Real', 'Likely Fake', 'Uncertain', 'Propaganda/Disinformation', 'Satire/Parody', 'Sponsored Content', 'Opinion/Analysis'],
            "description": "The final judgment on the article's credibility."
        },
        "summary": {
            "type": "string",
            "description": "A brief summary of the article's main points."
        },
        "biases": {
            "type": "string",
            "description": "An analysis of any detected biases (e.g., political, commercial)."
        },
        "flaggedContent": {
            "type": "array",
            "items": { "type": "string" },
            "description": "A list of specific issues found, such as sensationalism, logical fallacies, or unverified claims. If no issues, return an empty array."
        },
        "reasoning": {
            "type": "string",
            "description": "The reasoning behind the overall verdict and score. You MUST cite the specific URLs of the sources you find via the search tool within this field."
        },
        "sources": {
          "type": "array",
          "items": { "type": "string" },
          "description": "A list of all URLs to sources you checked and cited for credibility analysis. If no sources were found or used, return an empty array."
        }
    },
    "required": ["overallScore", "verdict", "summary", "biases", "flaggedContent", "reasoning", "sources"]
};

async function unshortenUrl(url: string): Promise<string> {
  // This is a simple unshortener that handles Google's redirect URLs.
  if (url.startsWith('https://vertexaisearch.cloud.google.com/grounding-api-redirect/')) {
    try {
      // Use a HEAD request to be more efficient as we only need the final URL from headers
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      return response.url;
    } catch (error) {
      // If fetching fails, return the original URL
      console.error(`Failed to unshorten URL: ${url}`, error);
      return url;
    }
  }
  return url;
}


export async function newsSleuthAnalysis(
  input: NewsSleuthInput
): Promise<NewsSleuthOutput | NewsSleuthError> {
  let articleInfo = '';
  if (input.articleText) articleInfo += `Full Text: ${input.articleText}\n`;
  if (input.articleHeadline) articleInfo += `Headline: ${input.articleHeadline}\n`;
  if (input.articleUrl) articleInfo += `URL: ${input.articleUrl}\n`;

  const prompt = `
    You are a world-class investigative journalist and fact-checker AI.
    Your task is to analyze the provided article information for credibility and generate a report.
    
    1.  If a URL is provided in the Article Info, you MUST use the Google Search tool to fetch its content and analyze it. Do not analyze the URL string itself.
    2.  Use the Google Search tool to find corroborating or contradictory sources for the claims made in the article. The search must be performed in the specified language: ${input.language}.
    3.  In your 'reasoning' field, you MUST cite the specific URLs of the sources you find via the search tool.
    4.  In the 'sources' array, you MUST list all URLs you found and referenced during your search.
    5.  Identify any biases (political, commercial, etc.), sensationalism, or logical fallacies.
    6.  Provide an overall credibility score from 0 (completely untrustworthy) to 100 (highly credible).
    7.  You MUST output your final report in ${input.language}.
    8.  Your entire response MUST be a single, valid JSON object that strictly adheres to the following JSON schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
    
    JSON Schema: ${JSON.stringify(NewsSleuthOutputJsonSchema)}

    Article Info:
    ${articleInfo}
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
    });

    const response = result.response;
    let responseText = response.text();

    if (!responseText) {
        throw new Error("The AI model returned an empty response.");
    }
    
    let output: NewsSleuthOutput;
    try {
        // Find the start and end of the JSON object
        const startIndex = responseText.indexOf('{');
        const endIndex = responseText.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            responseText = responseText.substring(startIndex, endIndex + 1);
        }
        output = JSON.parse(responseText);
    } catch(e) {
        console.error("Failed to parse JSON from model response:", responseText);
        throw new Error("The AI model returned an invalid JSON format. Please try again.");
    }

    // Extract sources from grounding metadata (Gemini API)
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    let sources: string[] = [];

    if (groundingMetadata && Array.isArray(groundingMetadata.groundingAttributions)) {
      const redirectUrls = groundingMetadata.groundingAttributions
        .map((a: any) => a.web?.uri)
        .filter(Boolean);
      // Resolve redirect URLs to get the final destination
      sources = await Promise.all(redirectUrls.map(url => unshortenUrl(url)));
    }


    // Fallback: parse URLs directly mentioned in output.reasoning if sources is empty
    if ((!sources || sources.length === 0) && output.reasoning) {
      const urlRegex = /(https?:\/\/[^\s)]+)/g;
      const found = output.reasoning.match(urlRegex);
      if (found) {
        // Use a Set to get unique URLs, then convert back to an array
        sources = Array.from(new Set(found.filter(Boolean)));
      }
    }
    
    // Also add any sources the model put directly in its output
    if(output.sources && output.sources.length > 0) {
        const combinedSources = new Set([...sources, ...output.sources]);
        sources = Array.from(combinedSources);
    }


    return { ...output, sources: sources };
  } catch (error: any) {
    console.error('API Error:', error);
    return {
      error: 'API_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to generate a response.',
    };
  }
}

    