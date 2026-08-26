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
  try {
    const { topMatch, allMatches } = await matchByEmbedding(userMessage, faqList);
    if (topMatch) {
      return {
        text: topMatch.answer,
        tier: 'tier2'
      };
    }

    // 4. Tier 3 - LLM Fallback
    const llmAnswer = await answerWithLLM(userMessage, conversationHistory, allMatches);
    return {
      text: llmAnswer,
      tier: 'tier3'
    };
  } catch (error) {
    console.error("Error in getResponse embedding/llm tier:", error);
    // Fallback if embedding or LLM fails
    return {
      text: "I'm having trouble retrieving information right now. Please connect with our styling team on WhatsApp at +91 75067 67452.",
      tier: 'error'
    };
  }
}
