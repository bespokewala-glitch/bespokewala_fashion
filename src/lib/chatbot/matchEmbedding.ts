import fs from 'fs';
import path from 'path';
import { pipeline } from '@xenova/transformers';
import { FAQEntry } from './matchKeyword';

let extractor: any = null;
let cachedEmbeddings: Record<string, number[]> = {};

const EMBEDDINGS_FILE = path.join(process.cwd(), 'data', 'faq-embeddings.json');

// Initialize the embedding model
async function getExtractor() {
  if (!extractor) {
    // Dynamic import to avoid next.js build issues with top-level await/transformers
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true, // Use quantized for faster CPU inference
    });
  }
  return extractor;
}

// Generate an embedding for a text string
async function generateEmbedding(text: string): Promise<number[]> {
  const extract = await getExtractor();
  const output = await extract(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Load or pre-compute embeddings for FAQ
async function loadFAQEmbeddings(faqList: FAQEntry[]) {
  // If we already loaded in memory, check if KB matches
  if (Object.keys(cachedEmbeddings).length === faqList.length) {
    return;
  }

  // Try to load from disk cache
  if (fs.existsSync(EMBEDDINGS_FILE)) {
    try {
      const data = fs.readFileSync(EMBEDDINGS_FILE, 'utf-8');
      cachedEmbeddings = JSON.parse(data);
      // Verify cache validity (very basic check)
      if (Object.keys(cachedEmbeddings).length === faqList.length) {
        return;
      }
    } catch (err) {
      console.warn("Failed to read FAQ embeddings cache, recomputing...", err);
    }
  }

  // Pre-compute embeddings for all FAQ entries
  console.log("Pre-computing FAQ embeddings...");
  cachedEmbeddings = {};
  for (const faq of faqList) {
    cachedEmbeddings[faq.id] = await generateEmbedding(faq.question);
  }

  // Save to disk
  try {
    fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(cachedEmbeddings));
  } catch (err) {
    console.error("Failed to write FAQ embeddings cache", err);
  }
}

export async function matchByEmbedding(userMessage: string, faqList: FAQEntry[]): Promise<{ topMatch: FAQEntry | null, allMatches: FAQEntry[] }> {
  await loadFAQEmbeddings(faqList);

  const userEmbedding = await generateEmbedding(userMessage);

  const scoredFaqs = faqList.map(faq => {
    const faqEmbedding = cachedEmbeddings[faq.id];
    if (!faqEmbedding) return { faq, score: 0 };
    
    return {
      faq,
      score: cosineSimilarity(userEmbedding, faqEmbedding)
    };
  });

  // Sort descending by score
  scoredFaqs.sort((a, b) => b.score - a.score);
  
  const allMatches = scoredFaqs.map(s => s.faq);
  const topMatch = scoredFaqs.length > 0 && scoredFaqs[0].score >= 0.75 ? scoredFaqs[0].faq : null;

  return { topMatch, allMatches };
}
