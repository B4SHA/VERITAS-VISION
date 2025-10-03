
import { clsx, type ClassValue } from "clsx"
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
  const [_, mimeType, base64] = match;
  return {
    inlineData: {
      mimeType,
      data: base64,
    },
  };
}

export function cleanJsonSchema(schema: any): any {
  if (schema && typeof schema === 'object') {
    delete schema.$schema;
    delete schema.additionalProperties;
    for (const key in schema.properties) {
      if (schema.properties.hasOwnProperty(key)) {
        schema.properties[key] = cleanJsonSchema(schema.properties[key]);
      }
    }
  }
  return schema;
}
