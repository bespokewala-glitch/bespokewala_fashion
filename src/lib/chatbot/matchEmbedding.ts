import fs from 'fs';
import path from 'path';
import { FAQEntry } from './matchKeyword';

let extractor: any = null;
let cachedEmbeddings: Record<string, number[]> = {};

const EMBEDDINGS_FILE = path.join(process.cwd(), 'data', 'faq-embeddings.json');

// Initialize the embedding model — uses a DYNAMIC import so that if the
// @xenova/transformers native binary is missing (e.g. Vercel serverless),
// the module-load itself succeeds and only the function call throws.
// The try/catch in router.ts will then fall through to the LLM tier.
async function getExtractor() {
  if (!extractor) {
    // Dynamic import — only attempted when this function is actually called.
    // On Vercel, onnxruntime native binaries are absent; the import will throw
    // and the caller (router.ts) catches it and falls through to LLM.
    const { pipeline } = await import('@xenova/transformers');
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
  // Fast path: already loaded into memory this process lifetime
  if (Object.keys(cachedEmbeddings).length === faqList.length) {
    return;
  }

  // ── Priority 1: Load from the pre-computed disk cache ──────────────────────
  // This is the path that runs on every Vercel cold start.  The file is
  // committed to the repo and bundled via outputFileTracingIncludes in
  // next.config.ts, so it is always present in production.
  if (fs.existsSync(EMBEDDINGS_FILE)) {
    try {
      const data = fs.readFileSync(EMBEDDINGS_FILE, 'utf-8');
      const parsed: Record<string, number[]> = JSON.parse(data);

      // Accept the cache as long as it has entries — a partial cache is still
      // better than running a cold ML model inference on Vercel.
      if (Object.keys(parsed).length > 0) {
        cachedEmbeddings = parsed;
        return;
      }
    } catch (err) {
      console.warn('[matchEmbedding] Failed to read faq-embeddings.json cache, will recompute:', err);
    }
  }

  // ── Priority 2: Compute with ML model (localhost / build-time only) ─────────
  // Only reached if the cache file is missing or completely empty.
  // On Vercel this should never happen because the file is bundled; on
  // localhost it will run once and write the cache to disk for future use.
  console.log('[matchEmbedding] Pre-computing FAQ embeddings (no cache found)…');
  cachedEmbeddings = {};
  for (const faq of faqList) {
    cachedEmbeddings[faq.id] = await generateEmbedding(faq.question);
  }

  // Persist to disk so subsequent cold starts skip model inference
  try {
    fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(cachedEmbeddings));
  } catch (err) {
    console.error('[matchEmbedding] Failed to write FAQ embeddings cache:', err);
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
