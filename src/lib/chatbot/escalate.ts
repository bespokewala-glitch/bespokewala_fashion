export function shouldEscalate(userMessage: string): boolean {
  const normalizedMessage = userMessage.toLowerCase();
  
  const escalationKeywords = [
    "refund",
    "cancel",
    "wrong",
    "complaint",
    "urgent",
    "not happy",
    "damaged",
    "speak to someone",
    "human",
    "manager"
  ];

  for (const keyword of escalationKeywords) {
    if (normalizedMessage.includes(keyword)) {
      return true;
    }
  }

  return false;
}

export function escalateToHuman(): string {
  return "I'm connecting you to our styling and support team to help you further. Please reach out to us on WhatsApp at +91 75067 67452 or wait for a representative to join this chat.";
}
