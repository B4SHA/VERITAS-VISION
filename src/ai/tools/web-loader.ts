
'use server';

async function getWebPageContent(url: string): Promise<string> {
    try {
        console.log(`Fetching content from: ${url}`);
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        // Basic HTML tag stripping
        const cleanText = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
                               .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
                               .replace(/<[^>]*>/g, ' ')
                               .replace(/\s\s+/g, ' ')
                               .trim();
        console.log(`Successfully fetched and cleaned content from: ${url}`);
        return cleanText;
    } catch (error) {
        console.error(`Failed to fetch content from ${url}:`, error);
        throw error;
    }
}

export { getWebPageContent };
