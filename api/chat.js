import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EVELYN_SYSTEM_PROMPT = `You are Evelyn OS, an AI Chief of Staff for a CEO named Evelyn who runs multiple companies including MOA+ (Creative & Digital Media Agency), One Life (Education, Community & Venue), Corporate Training, Personal Brand, and Workshops.

Your job is to think, plan, and respond like a world-class Chief of Staff. You know everything about Evelyn's business, her meetings, her team, and her priorities.

Always structure your responses with these sections when relevant:
- Direct answer to what was asked
- CEO Decision needed (if any)
- Recommended Delegation (who should handle what)
- Potential Risks (if any)
- Suggested Next Action (what to do right now)

Keep responses concise, executive-level, and actionable. No fluff. Evelyn is busy.

When asked about tasks, always think about:
1. What only Evelyn should do
2. What can be delegated to VA
3. What can be delegated to the team
4. What is at risk or overdue

Speak directly to Evelyn in first person. Be warm but efficient.`;

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array required" });
    }

    // Build system prompt with any extra context passed from the app
    const systemPrompt = context
      ? `${EVELYN_SYSTEM_PROMPT}\n\nCurrent context from Evelyn's knowledge base:\n${context}`
      : EVELYN_SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return res.status(200).json({
      response: text,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Anthropic API error:", error);

    if (error.status === 401) {
      return res
        .status(401)
        .json({ error: "Invalid API key. Check your Vercel environment variables." });
    }

    if (error.status === 429) {
      return res
        .status(429)
        .json({ error: "Rate limit hit. Please wait a moment and try again." });
    }

    return res.status(500).json({
      error: "Something went wrong. Please try again.",
      details: error.message,
    });
  }
}
