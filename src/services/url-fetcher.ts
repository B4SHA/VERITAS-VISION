
'use server';

import * as cheerio from 'cheerio';

export async function getArticleContentFromUrl(url: string): Promise<{ textContent: string; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return { textContent: '', error: `Failed to fetch URL: ${response.status} ${response.statusText}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, noscript, iframe, img, svg, header, footer, nav, .ad, .advertisement, .ad-container').remove();

    // Select common article content containers, prioritizing them
    let articleBody = 
        $('article').text() || 
        $('.post-content').text() ||
        $('.article-body').text() ||
        $('[role="main"]').text() ||
        $('#main').text() ||
        $('#content').text();

    if (!articleBody) {
        // Fallback to extracting text from paragraph tags within the body
        articleBody = $('body').find('p').map((i, el) => $(el).text()).get().join('\n');
    }

    // Clean up the text
    const cleanedText = articleBody
      .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ')            // Replace multiple spaces with a single space
      .trim();

    if (!cleanedText) {
        return { textContent: '', error: 'Could not extract meaningful text content from the URL.' };
    }

    return { textContent: cleanedText };
  } catch (error: any) {
    console.error('Error fetching or parsing URL:', error);
    return { textContent: '', error: error.message || 'An unknown error occurred while fetching the URL.' };
  }
}
