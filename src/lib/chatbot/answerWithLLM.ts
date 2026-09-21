import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { FAQEntry } from './matchKeyword';

// Types for conversation history from route.ts
interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export async function answerWithLLM(
  userMessage: string,
  conversationHistory: ChatMessage[],
  topFaqMatches: FAQEntry[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "I'm having trouble connecting to my knowledge base right now. Please reach out to us on WhatsApp at +91 75067 67452 for immediate assistance.";
  }

  // Build FAQ context from top matches
  const top3Faqs = topFaqMatches.slice(0, 3);
  const faqContextText = top3Faqs
    .map(faq => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join('\n\n');

  const systemInstruction = `You are the Style Concierge for Bespokewala, a bespoke fashion design brand.

Rules:
- Answer in 1-3 short sentences. No greeting, no sign-off, no restating the question.
- Only use information from the Context below. Never invent prices, delivery dates, fabric availability, or policies.
- If the Context doesn't fully answer the question, say: "Let me connect you with our styling team for exact details on that."
- For sizing questions, always mention the size guide and offer to note measurements for the tailor.
- If the message expresses frustration or a complaint, respond briefly and empathetically, then say you're connecting them to the team — do not try to resolve disputes yourself.

Context:
${faqContextText || 'No specific FAQ context available for this query.'}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.4,
      },
    });

    // Build conversation history for Gemini (last 3 turns only to save tokens)
    const compactHistory = conversationHistory.slice(Math.max(0, conversationHistory.length - 3));
    // Gemini requires the history to start with a 'user' turn and alternate user/model.
    // Filter out any leading model turns.
    const validHistory = compactHistory.filter((_, i, arr) => {
      if (i === 0 && arr[0].role === 'model') return false;
      return true;
    });

    const chat = model.startChat({
      history: validHistory.map(msg => ({
        role: msg.role, // 'user' | 'model' — matches Gemini's expected format exactly
        parts: msg.parts,
      })),
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.response.text().trim();
    return text || "I'm sorry, I couldn't generate a response. Please reach out on WhatsApp at +91 75067 67452.";

  } catch (error) {
    console.error('[answerWithLLM] Gemini error:', error);
    return "I'm experiencing some technical difficulties. Please reach out to us on WhatsApp at +91 75067 67452.";
  }
}
