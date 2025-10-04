
'use server';
/**
 * @fileOverview An audio authentication AI agent.
 *
 * This file defines the server-side logic for the Audio Authenticator feature, which
 * analyzes audio files for authenticity using a Genkit flow.
 */

import {ai} from '@/ai/genkit';
import {
    AudioAuthenticatorInputSchema,
    AudioAuthenticatorOutputSchema,
    type AudioAuthenticatorInput,
    type AudioAuthenticatorOutput,
    type AudioAuthenticatorError,
} from '@/ai/schemas';
import { googleAI } from '@genkit-ai/google-genai';

const prompt = ai.definePrompt({
    name: 'audioAuthenticatorPrompt',
    model: googleAI.model('gemini-2.5-flash'),
    input: { schema: AudioAuthenticatorInputSchema },
    output: { schema: AudioAuthenticatorOutputSchema },
    prompt: `You are a highly specialized and vigilant audio forensics analyst, with expertise in detecting advanced AI-generated and manipulated audio, including outputs from state-of-the-art platforms like ElevenLabs. Your task is to analyze the provided audio file and generate a comprehensive authenticity report in {{language}}.

Audio: {{media url=audioDataUri}}

Your JSON output must include these fields:
- overallScore: A confidence score (0-100) on the audio's authenticity, where lower scores indicate higher suspicion of manipulation.
- verdict: Your definitive final judgment ('Likely Authentic', 'Potential AI/Manipulation', 'Uncertain'). If you detect *any* signs, however subtle, of AI generation, synthesis, or manipulation, you MUST select 'Potential AI/Manipulation'. Prioritize false positives over false negatives in this assessment.
- summary: A concise summary of your primary findings and the core reason for your verdict.
- reasoning: Detailed, granular reasoning behind your verdict, specifically focusing on advanced detection criteria.
    You MUST meticulously analyze:
    1.  **Background Noise/Room Tone:** Look for an unnatural absence of natural background variation, repetitive loops, or overly consistent/clean room tone that deviates from expected real-world audio imperfections. Note if noise seems digitally added or overly processed.
    2.  **Speaker Tone & Prosody:** Examine for subtle robotic tendencies, overly perfect or inconsistent emotional inflection, unnatural emphasis, or a lack of genuine human vocal imperfections (e.g., slight stutters, throat clearings, natural breath sounds, vocal fry, or subtle pitch drift). Also note any abrupt or unmotivated shifts in tone or volume.
    3.  **Cadence & Pacing:** Assess for unnaturally consistent rhythm, overly precise pauses between words/phrases, or unusual timing that lacks human spontaneity. Identify if speech feels "stitched together" or lacks the natural flow of human conversation.
    4.  **Frequency Spectrum & Audio Fingerprinting:** Conduct a spectral analysis for tell-tale signs of digital synthesis, such as unusual frequency cutoffs, overly smooth or flat spectral profiles, repetitive spectral patterns, digital artifacts at transition points, or a lack of the rich, complex harmonic content typical of natural human speech.
    5.  **Overall Cohesion & "Too Perfect" Syndrome:** Explicitly comment if the audio seems "too perfect" or unnaturally clean compared to a genuine recording of similar content and context. Highlight any instances where the audio lacks the organic imperfections expected in real-world recordings.
    Provide concrete examples or observations for each point you mention.
- detectedText: If the audio contains speech, provide a precise transcription here. If not, this should be null.
- speechAnalysis: After transcribing, meticulously analyze the 'detectedText' for misleading information or unusual contextual cues. If misleading content is identified, you MUST explain what the misleading information is, why it is misleading, and how it could potentially manipulate perception. If the speech is neutral/factual, respond with "There are no misleading contexts, but the transcript discusses..." and provide a brief summary of the topic. If no speech was detected, this MUST be null.`
});

const audioAuthenticatorFlow = ai.defineFlow(
    {
        name: 'audioAuthenticatorFlow',
        inputSchema: AudioAuthenticatorInputSchema,
        outputSchema: AudioAuthenticatorOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

export async function audioAuthenticatorAnalysis(
  input: AudioAuthenticatorInput
): Promise<AudioAuthenticatorOutput | AudioAuthenticatorError> {
  try {
    const result = await audioAuthenticatorFlow(input);
    return result;
  } catch (error: any) {
    console.error("Error in audioAuthenticatorAnalysis flow:", error);
    return {
      error: 'FLOW_EXECUTION_FAILED',
      details: error.message || 'The AI model failed to execute.',
    };
  }
}
