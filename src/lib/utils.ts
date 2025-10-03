import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Part } from "@google/generative-ai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUriToGenerativePart(dataUri: string): Part {
  const match = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URI');
  }
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}