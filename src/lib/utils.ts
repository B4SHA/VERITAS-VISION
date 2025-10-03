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
  const mimeTypeMatch = dataUri.substring(dataUri.indexOf(':') + 1, dataUri.indexOf(';'));
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);

  if (!mimeTypeMatch || !base64) {
    throw new Error('Invalid data URI');
  }

  return {
    inlineData: {
      mimeType: mimeTypeMatch,
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
