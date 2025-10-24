
# Veritas Vision

Veritas Vision is a powerful, AI-driven web application designed to help users analyze and verify the authenticity of digital content. It provides a suite of tools to combat misinformation by examining news articles, videos, audio files, and images for signs of manipulation, bias, or AI generation.

Built with Next.js and leveraging Google's Gemini models through Genkit, Veritas Vision offers a modern, responsive, and intuitive user experience for critical content analysis.

## Core Features

Veritas Vision is composed of four primary tools, each targeting a different type of media:

### 1. News Sleuth
News Sleuth assesses the credibility of news articles. Users can submit an article via URL, its full text, or just a headline. The tool performs an in-depth analysis and returns:
- **Overall Credibility Score**: A score from 0-100.
- **Verdict**: A final judgment (e.g., 'Likely Real', 'Likely Fake').
- **Critical Analysis**: Detailed reasoning, bias detection, and a list of flagged content.
- **Sources**: A list of sources the AI checked to corroborate its findings.

### 2. Video Integrity
This tool scrutinizes video files for signs of manipulation. Upon uploading a video, it performs a multi-modal analysis of the video and its audio track to detect:
- **Deepfake Elements**: Such as face-swapping or altered likenesses.
- **Video Manipulation**: Including CGI, edits, and temporal inconsistencies.
- **Synthetic Voice**: Identifies voice cloning or AI-generated speech.
- **Speech Transcription**: Transcribes any spoken words in the video.

### 3. Audio Authenticator
The Audio Authenticator verifies the authenticity of audio recordings. It is fine-tuned to detect sophisticated AI-generated speech from platforms like ElevenLabs by analyzing:
- **Vocal Patterns & Prosody**: Checks for unnatural inflection, cadence, and inconsistencies.
- **Background Noise**: Identifies unnaturally clean or looped background tones.
- **Frequency Spectrum**: Looks for digital artifacts indicative of synthesis.
- **Speech Analysis**: Transcribes the audio and analyzes the text for misleading context.

### 4. Image Verifier
This tool examines images for signs of AI generation or digital tampering. It uses forensic analysis to spot:
- **AI-Generated Artifacts**: Identifies tell-tale signs from models like GANs and diffusion models.
- **Digital Manipulation**: Detects Photoshop-like alterations and inconsistencies.
- **Text & Context Analysis**: Extracts text from the image using OCR and analyzes it for misleading information.

## Multi-Language Support
The entire user interface and all analysis reports can be dynamically switched between several languages, including:
- English
- Hindi (हिन्दी)
- Bengali (বাংলা)
- Marathi (मराठी)
- Telugu (తెలుగు)
- Tamil (தமிழ்)

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **AI/Generative**: [Google Gemini](https://deepmind.google/technologies/gemini/) via [Genkit](https://firebase.google.com/docs/genkit)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Schema & Validation**: [Zod](https://zod.dev/)
- **Deployment**: [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) (via `apphosting.yaml`)

## Local Development Setup

To run Veritas Vision on your local machine, follow these steps.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or later)
- [npm](https://www.npmjs.com/) (usually included with Node.js)

### 2. Install Dependencies
Clone the repository and install the required npm packages:
```bash
npm install
```

### 3. Set Up Environment Variables
You will need a Google Gemini API key to use the AI features.

1.  Create a file named `.env` in the root of the project directory.
2.  Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  Add the key to your `.env` file:

    ```env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```

### 4. Run the Development Server
Start the Next.js development server:
```bash
npm run dev
```

The application will now be running locally at **[http://localhost:9002](http://localhost:9002)**.

## Project Structure

- `src/app/`: Contains the main pages and routing for the application.
- `src/components/`: Shared React components, including the primary UI for each tool.
- `src/ai/`: Houses all AI-related logic.
  - `src/ai/flows/`: Contains the Genkit flows that define the prompts and logic for interacting with the Gemini models.
  - `src/ai/schemas.ts`: Zod schemas for validating the inputs and outputs of the AI flows.
- `src/lib/`: Utility functions and translation files.
  - `src/lib/translations/`: JSON files for multi-language support.
- `src/context/`: React context providers, such as the `LanguageProvider`.
- `public/`: Static assets.
