import fs from 'fs';
import path from 'path';
import { shouldEscalate, escalateToHuman } from './escalate';
import { matchByKeyword, FAQEntry } from './matchKeyword';
import { matchByEmbedding } from './matchEmbedding';
import { answerWithLLM } from './answerWithLLM';

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

let faqListCache: FAQEntry[] | null = null;

function getFaqList(): FAQEntry[] {
  if (faqListCache) return faqListCache;

  const faqPath = path.join(process.cwd(), 'data', 'faq-kb.json');
  try {
    const data = fs.readFileSync(faqPath, 'utf-8');
    faqListCache = JSON.parse(data) as FAQEntry[];
    return faqListCache;
  } catch (err) {
    console.error('Failed to load FAQ list', err);
    return [];
  }
}

export async function getResponse(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<{ text: string, tier: string }> {
  const faqList = getFaqList();

  // 1. Escalation check
  if (shouldEscalate(userMessage)) {
    return {
      text: escalateToHuman(),
      tier: 'escalated'
    };
  }

  // 2. Tier 1 - Keyword Matcher
  const t1 = matchByKeyword(userMessage, faqList);
  if (t1) {
    return {
      text: t1.answer,
      tier: 'tier1'
    };
  }

  // 3. Tier 2 - Embedding Matcher
  // NOTE: @xenova/transformers requires downloading a ML model at runtime.
  // On Vercel serverless this times out. We gracefully fall through to the
  // LLM if the embedding tier fails — never return an error to the user.
  let allMatches: FAQEntry[] = faqList; // default: give LLM all FAQs as context
  try {
    const result = await matchByEmbedding(userMessage, faqList);
    if (result.topMatch) {
      return {
        text: result.topMatch.answer,
        tier: 'tier2'
      };
    }
    allMatches = result.allMatches;
  } catch (embeddingError) {
    console.warn('[router] Embedding tier failed, falling through to LLM:', embeddingError);
    // allMatches stays as full faqList — LLM still gets FAQ context
  }

  // 4. Tier 3 - LLM Fallback
  try {
    const llmAnswer = await answerWithLLM(userMessage, conversationHistory, allMatches);
    return {
      text: llmAnswer,
      tier: 'tier3'
    };
  } catch (llmError) {
    console.error('[router] LLM tier failed:', llmError);
    return {
      text: "I'm having trouble retrieving information right now. Please connect with our styling team on WhatsApp at +91 75067 67452.",
      tier: 'error'
    };
  }
}
