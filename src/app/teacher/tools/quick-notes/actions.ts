'use server';
import { generateQuickNotesOutput, QuickNotesOutputType, generateGeminiSummary } from '@/lib/gemini-quick-notes';

export async function generateNotesWithGemini(notes: string[], outputType: QuickNotesOutputType, apiKey: string, customPrompt?: string) {
  return await generateQuickNotesOutput(notes, outputType, apiKey, customPrompt);
}

export async function generateSummaryWithGemini(text: string, apiKey: string) {
  return await generateGeminiSummary(text, apiKey);
}