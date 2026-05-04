// lib/ai.js
// Google Gemini integration for automatic note categorization.
//
// Scope note: We are USING an existing AI service (Google's Gemini API) rather
// than building or training our own model. Same outcome — notes get
// intelligently sorted into folders — without the overhead of ML infrastructure.

import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy-initialize the client so missing keys don't crash the app at import time.
let geminiClient = null;
function getClient() {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in .env');
    }
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

/**
 * Ask the AI which of the user's existing folders best fits a note.
 * Falls back to a simple keyword match if the API call fails, so the
 * app remains functional without network access.
 *
 * @param {string} title - The note's title
 * @param {string} content - The note's body text
 * @param {string[]} folderNames - The user's existing folder names
 * @returns {Promise<{folder: string, reasoning: string}>}
 */
export async function suggestFolder(title, content, folderNames) {
  // If the user has no folders yet, suggest a sensible default
  if (!folderNames || folderNames.length === 0) {
    return { folder: 'General', reasoning: 'No existing folders — using default.' };
  }

  try {
    const client = getClient();
    // gemini-2.5-flash is fast, free, and plenty capable for classification
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2, // Low temp = more consistent classification
        responseMimeType: 'application/json',
      },
    });

    const prompt = buildPrompt(title, content, folderNames);
    const result = await model.generateContent(prompt);
    const raw = result.response.text() || '{}';
    const parsed = JSON.parse(raw);

    // Validate the AI picked one of our real folders
    if (folderNames.includes(parsed.folder)) {
      return {
        folder: parsed.folder,
        reasoning: parsed.reasoning || 'AI-suggested category.',
      };
    }

    // AI returned something unexpected — fall back
    return keywordFallback(title, content, folderNames);
  } catch (err) {
    console.error('Gemini categorization failed:', err.message);
    return keywordFallback(title, content, folderNames);
  }
}

// Build the classification prompt.
function buildPrompt(title, content, folderNames) {
  return `You are a helpful assistant that classifies student notes into folders. Pick the single best folder from the list below.

Available folders: ${folderNames.map((f) => `"${f}"`).join(', ')}

Note title: ${title}
Note content: ${content.slice(0, 2000)}

Respond with strict JSON only, no markdown, no extra text, in this exact shape:
{"folder": "<one folder name from the list>", "reasoning": "<one short sentence>"}`;
}

// Simple keyword-based fallback when the AI is unavailable.
// Matches folder names against the note text, case-insensitively.
function keywordFallback(title, content, folderNames) {
  const text = `${title} ${content}`.toLowerCase();
  for (const folder of folderNames) {
    if (text.includes(folder.toLowerCase())) {
      return { folder, reasoning: 'Matched by keyword (AI unavailable).' };
    }
  }
  return {
    folder: folderNames[0],
    reasoning: 'No clear match — defaulting to first folder.',
  };
}
