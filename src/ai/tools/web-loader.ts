
'use server';

async function getWebPageContent(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        // Basic HTML tag stripping
        return text.replace(/<[^>]*>/g, ' ').replace(/\s\s+/g, ' ').trim();
    } catch (error) {
        console.error(`Failed to fetch content from ${url}:`, error);
        throw error;
    }
}

export { getWebPageContent };
