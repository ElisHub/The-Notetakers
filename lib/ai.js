// lib/ai.js
// OpenAI integration for automatic note categorization.
//
// Scope note: We are USING an existing AI service (OpenAI's API) rather than
// building or training our own model. Same outcome — notes get intelligently
// sorted into folders — without the overhead of ML infrastructure.

import OpenAI from 'openai';

// Lazy-initialize the client so missing keys don't crash the app at import time.
let openaiClient = null;
function getClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in .env');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
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
    const prompt = buildPrompt(title, content, folderNames);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and inexpensive, plenty for classification
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that classifies student notes into folders. ' +
            'Respond with strict JSON only, no markdown, no extra text.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2, // Low temp = more consistent classification
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content || '{}';
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
    console.error('OpenAI categorization failed:', err.message);
    return keywordFallback(title, content, folderNames);
  }
}

// Build the classification prompt.
function buildPrompt(title, content, folderNames) {
  return `A student has written this note. Pick the single best folder from the list below.

Available folders: ${folderNames.map((f) => `"${f}"`).join(', ')}

Note title: ${title}
Note content: ${content.slice(0, 2000)}

Respond with JSON in this exact shape:
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
