import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OpenAI not configured on server" }, { status: 503 });
  }

  const { systemPrompt, messages } = await req.json();
  if (!messages) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return Response.json({ error: data.error?.message || "OpenAI request failed" }, { status: response.status });
  }

  return Response.json({ content: data.choices[0].message.content });
};

export const config = { path: "/api/openai-chat" };
