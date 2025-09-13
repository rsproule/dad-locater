import { openai } from "@/echo";
import { generateText } from "ai";

export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };

  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "Missing text" }), {
      status: 400,
    });
  }

  const prompt = `You are a classifier. Determine if the USER is asking to meet in person or do an activity together with the dad (e.g., meet up, hang out, play catch, grab coffee, go to the park, go somewhere together).

Answer ONLY with a strict JSON object of the form {"shouldLeave": boolean}. Use true if the user's message is a request or suggestion to meet up or do an activity together IRL, otherwise false.

USER: """
${text}
"""`;

  try {
    const result = await generateText({
      model: openai.chat("gpt-4o-mini"),
      prompt,
    });

    let shouldLeave = false;
    try {
      const parsed = JSON.parse(result.text);
      shouldLeave = Boolean(parsed.shouldLeave);
    } catch {
      shouldLeave = /true/i.test(result.text);
    }

    return Response.json({ shouldLeave });
  } catch {
    return Response.json({ shouldLeave: false });
  }
}
