
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fetch from 'node-fetch';
import { load } from 'cheerio';

export const fetchWebContent = ai.defineTool(
  {
    name: 'fetchWebContent',
    description: 'Fetches the main text content of a given URL.',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to fetch content from.'),
    }),
    outputSchema: z.string().describe('The extracted main text content of the webpage.'),
  },
  async ({ url }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      const $ = load(html);

      // Remove script, style, nav, footer, and other non-content elements
      $('script, style, nav, footer, header, aside, .ad, .ads, .advert, .advertisement, .sidebar, .comments, .noprint').remove();
      
      // A simple heuristic: find the element with the most paragraph tags
      let bestCandidate: cheerio.Cheerio | null = null;
      let maxParagraphs = 0;

      $('body').find('div, article, main, section').each((_, element) => {
        const el = $(element);
        const pCount = el.find('p').length;
        if (pCount > maxParagraphs) {
          maxParagraphs = pCount;
          bestCandidate = el;
        }
      });
      
      const content = bestCandidate ? bestCandidate.text() : $('body').text();

      // Clean up the text
      const cleanedContent = content
        .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
        .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with spaces
        .trim();

      return cleanedContent.substring(0, 14000); // Limit content size to avoid oversized prompts

    } catch (error: any) {
      console.error(`Error fetching or parsing URL ${url}:`, error);
      return `Failed to fetch content from URL. Error: ${error.message}`;
    }
  }
);
