"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./ai-elements/conversation";
import { Message, MessageContent } from "./ai-elements/message";
import { Response } from "./ai-elements/response";

export default function DadChat({
  profile,
  onSearchAgain,
}: {
  profile?: string | null;
  onSearchAgain?: () => void;
}) {
  const [hasLeft, setHasLeft] = useState(false);
  console.log("hasLeft", hasLeft);

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
  });

  // Watch messages for LEAVE_CHAT and sanitize
  useEffect(() => {
    const last = (messages as any[])?.[messages.length - 1] as any;
    if (!last || last.role !== "assistant") return;
    const text = Array.isArray(last.parts)
      ? last.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text || "")
          .join("")
      : (last.content as string) || "";
    if (text && /LEAVE_CHAT/i.test(text)) {
      if (!hasLeft) setHasLeft(true);
      setMessages((prev: any[]) =>
        prev.map((m: any) => {
          if (m.id !== last.id) return m;
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
  }, [messages, hasLeft, setMessages]);

  // No client-side intent detection; handled server-side in /api/chat

  async function handleSend() {
    if (!input.trim() || hasLeft) return;
    await sendMessage({ text: input });
    setInput("");
  }

  const [input, setInput] = useState("");

  return (
    <div className="space-y-3">
      <Conversation>
        <ConversationContent className="h-[420px] rounded-lg border bg-card p-3 space-y-2">
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

      {hasLeft ? (
        <div className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-muted/40">
          <div className="text-sm text-muted-foreground">
            Dad has left again, it was your fault.
          </div>
          <button
            type="button"
            onClick={() => onSearchAgain?.()}
            className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Search for him again
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !(e.nativeEvent as any)?.isComposing
              ) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      )}

      {error && <div className="text-sm text-red-500">{String(error)}</div>}
    </div>
  );
}
