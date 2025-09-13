"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./ai-elements/conversation";
import { Message, MessageContent } from "./ai-elements/message";
import { Response } from "./ai-elements/response";

export default function DadChat({ profile }: { profile?: string | null }) {
  const [hasLeft, setHasLeft] = useState(false);

  const chatId = useMemo(() => {
    const text = profile ?? "default";
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    return `dad:${Math.abs(hash)}`;
  }, [profile]);

  const { messages, sendMessage, setMessages, error, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { profile: profile ?? undefined },
    }),
    id: chatId,
    onFinish: (message: any) => {
      try {
        const text = Array.isArray(message?.parts)
          ? message.parts
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text || "")
              .join("")
          : (message?.content as string) || "";
        if (text && /LEAVE_CHAT/i.test(text)) {
          setHasLeft(true);
          setMessages((prev: any[]) =>
            prev.map((m: any) => {
              if (m.id !== message.id) return m;
              if (Array.isArray(m.parts)) {
                return {
                  ...m,
                  parts: m.parts.map((p: any) =>
                    p.type === "text"
                      ? {
                          ...p,
                          text: String(p.text || "")
                            .replace(/LEAVE_CHAT/gi, "")
                            .trim(),
                        }
                      : p,
                  ),
                };
              }
              return {
                ...m,
                content: String(m.content || "")
                  .replace(/LEAVE_CHAT/gi, "")
                  .trim(),
              };
            }),
          );
        }
      } catch {}
    },
  });

  // No client-side intent detection; handled server-side in /api/chat

  async function onSubmit(e: React.FormEvent<HTMLFormElement>, input: string) {
    e.preventDefault();
    if (!input.trim() || hasLeft) return;

    await sendMessage({ text: input });
  }

  const [input, setInput] = useState("");

  return (
    <div className="space-y-4">
      <Conversation>
        <ConversationContent>
          {messages.map((message) => (
            <Message key={(message as any).id} from={(message as any).role}>
              <MessageContent>
                {(message as any).parts?.map((part: any, i: number) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Response key={`${(message as any).id}-${i}`}>
                          {String(part.text || "")
                            .replace(/LEAVE_CHAT/gi, "")
                            .trim()}
                        </Response>
                      );
                    default:
                      return null;
                  }
                })}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        {hasLeft && (
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Dad has left the chat.
          </div>
        )}
        <ConversationScrollButton />
      </Conversation>

      <form
        onSubmit={(e) => {
          onSubmit(e, input);
          setInput("");
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder={hasLeft ? "Dad left the chat." : "Type your message..."}
          disabled={hasLeft}
          className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || hasLeft}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasLeft ? "Left" : "Send"}
        </button>
      </form>

      {error && <div className="text-sm text-red-500">{String(error)}</div>}
    </div>
  );
}
