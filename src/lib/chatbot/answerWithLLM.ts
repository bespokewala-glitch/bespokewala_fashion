import Anthropic from '@anthropic-ai/sdk';
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "I'm having trouble connecting to my knowledge base right now. Let me connect you with our styling team for exact details. Please reach out to us on WhatsApp at +91 75067 67452.";
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  // Take top 3 FAQs
  const top3Faqs = topFaqMatches.slice(0, 3);
  const faqContextText = top3Faqs
    .map(faq => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join('\n\n');

  // Take last 3 turns
  const compactHistory = conversationHistory.slice(Math.max(0, conversationHistory.length - 3));
  
  // Format history for Anthropic (roles are 'user' or 'assistant')
  const formattedHistory: Anthropic.MessageParam[] = compactHistory.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.parts[0]?.text || '',
  }));

  // Append current user message
  formattedHistory.push({
    role: 'user',
    content: userMessage
  });

  const systemPrompt = `You are the Style Concierge for Bespokewala, a bespoke fashion design brand.

Rules:
- Answer in 1-3 short sentences. No greeting, no sign-off, no restating the question.
- Only use information from the Context below. Never invent prices, delivery dates, fabric availability, or policies.
- If the Context doesn't fully answer the question, say: "Let me connect you with our styling team for exact details on that."
- For sizing questions, always mention the size guide and offer to note measurements for the tailor.
- If the message expresses frustration or a complaint, respond briefly and empathetically, then say you're connecting them to the team — do not try to resolve disputes yourself.

Context:
${faqContextText}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // "claude-haiku-4-5" doesn't strictly exist, Claude 3 Haiku is the current fast model
      max_tokens: 200,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: formattedHistory,
    });

    if (response.content[0].type === 'text') {
      return response.content[0].text;
    }
    return "I apologize, but I couldn't generate a proper response.";
  } catch (error) {
    console.error("LLM Error:", error);
    return "I'm experiencing some technical difficulties. Please reach out to us on WhatsApp at +91 75067 67452.";
  }
}
