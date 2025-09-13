import { openai } from "@/echo";
import { experimental_generateImage as generateImage, generateText } from "ai";

export async function POST(req: Request) {
  const { description } = (await req.json()) as { description: string };

  if (!description || typeof description !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: description" }),
      { status: 400 },
    );
  }

  // 1) Generate a free-form dad profile text we can pass to the LLM later
  const profilePrompt = `Create a short, vivid dad profile using the user's description.

Write plain text (no JSON). Include:
- Name (first name only)
- Personality style and speech mannerisms
- Interests/hobbies and a hint of appearance/clothing
- A one-sentence greeting line written in his voice starting with "Greeting:" (we will not parse strictly; it's okay if it's prose)

User description:
"""
${description}
"""`;

  const profileResult = await generateText({
    model: openai.chat("gpt-4o"),
    prompt: profilePrompt,
  });
  const profile = profileResult.text;

  // 2) Generate an image from the imagePrompt
  const imageResult = await generateImage({
    model: openai.image("gpt-image-1"),
    size: "1024x1024",
    providerOptions: {
      openai: {
        quality: "low",
      },
    },
    prompt: `Portrait photo of a dad based on this description: ${description}. Natural lighting, shallow depth of field, photorealistic.`,
  });

  const { image } = imageResult;

  // 3) Return the free-form profile text and image
  return Response.json({ profile, imageUrl: image });
}
