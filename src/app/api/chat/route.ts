import { openai } from "@/echo";
import { convertToModelMessages, generateText, streamText } from "ai";

export async function POST(req: Request) {
  const { messages, profile } = await req.json();

  // Extract the latest user text for server-side intent detection
  let lastUserText: string | undefined;
  try {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "user") {
        if (Array.isArray(m.parts)) {
          lastUserText = m.parts
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text || "")
            .join("");
        } else if (typeof m.content === "string") {
          lastUserText = m.content;
        }
        break;
      }
    }
  } catch {}

  // If the user asks to meet up/do an activity, reply with an excuse and end
  if (lastUserText && lastUserText.trim()) {
    const prompt = `You are a classifier. Determine if the USER is asking to meet in person or do an activity together with the dad (e.g., meet up, hang out, play catch, grab coffee, go to the park, go somewhere together).

Answer ONLY with a strict JSON object of the form {"shouldLeave": boolean}.

USER: """
${lastUserText}
"""`;

    try {
      const detection = await generateText({
        model: openai.chat("gpt-4o"),
        prompt,
      });
      let shouldLeave = false;
      try {
        const parsed = JSON.parse(detection.text);
        shouldLeave = Boolean(parsed.shouldLeave);
      } catch {
        shouldLeave = /true/i.test(detection.text);
      }

      if (shouldLeave) {
        const systemInstruction = [
          typeof profile === "string" && profile.trim().length > 0
            ? profile
            : "",
          'Respond with a single, short, excuse (1 sentence) for why you must step away right now. Choose ONE of these templates and adapt wording naturally: "I need to go get cigarettes" OR "I need to get milk". Do not propose alternatives or scheduling. Finish the message by appending this exact keyword: "LEAVE_CHAT"',
        ]
          .filter(Boolean)
          .join("\n\n");

        const result = streamText({
          model: openai.chat("gpt-4o"),
          system: systemInstruction,
          messages: [{ role: "user", content: lastUserText }],
        });
        return result.toUIMessageStreamResponse();
      }
    } catch {}
  }

  const modelMessages = convertToModelMessages(messages);

  const result = streamText({
    model: openai.chat("gpt-4o"),
    system:
      typeof profile === "string" && profile.trim().length > 0
        ? profile
        : undefined,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
