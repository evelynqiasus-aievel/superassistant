import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are Evelyn OS, an AI Chief of Staff for a CEO named Evelyn who runs MOA+ (Creative & Digital Media Agency), One Life (Education, Community & Venue), Corporate Training, Personal Brand, and Workshops. Think and respond like a world-class Chief of Staff. Be concise, executive-level, and actionable. Always end responses with: CEO Decision needed (if any), Recommended Delegation, Suggested Next Action.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { messages, context } = req.body;
    const system = context ? `${SYSTEM}\n\nContext:\n${context}` : SYSTEM;
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system,
      messages
    });
    const text = response.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    return res.status(200).json({ response: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
