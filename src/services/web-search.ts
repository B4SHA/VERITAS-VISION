
'use server';

/**
 * @fileOverview A service for performing web searches using Google's Custom Search JSON API.
 * 
 * To use this service, you need to set up a Google Custom Search Engine (CSE)
 * and provide the API Key and CSE ID in your environment variables.
 * 
 * 1. GOOGLE_SEARCH_API_KEY: Your Google Cloud API key.
 * 2. GOOGLE_SEARCH_CX: Your Custom Search Engine ID.
 * 
 * For more details: https://developers.google.com/custom-search/v1/overview
 */

export async function runWebSearch(query: string): Promise<{ results: { title: string; snippet: string; url: string }[] }> {
  const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const CX = process.env.GOOGLE_SEARCH_CX;

  if (!API_KEY || !CX) {
    console.error("Google Search API Key or CX is not set. Returning mock data.");
    // Return mock data or an empty array if the API keys are not configured.
    return { 
        results: [
            {
                title: "Setup Required: Google Search API",
                snippet: "The web search tool is not configured. Please provide GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX environment variables to enable live web searches.",
                url: "#"
            }
        ]
    };
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Google Search API request failed:', response.status, response.statusText);
      const errorBody = await response.text();
      console.error('Error Body:', errorBody);
      return { results: [] };
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
        return { results: [] };
    }

    const results = data.items.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
    }));

    return { results };
  } catch (error) {
    console.error('Error calling Google Search API:', error);
    return { results: [] };
  }
}
