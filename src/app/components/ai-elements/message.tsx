import { PropsWithChildren } from "react";

export function Message({
  from,
  children,
}: PropsWithChildren<{ from: "user" | "assistant" | "system" }>) {
  const isUser = from === "user";
  return (
    <div
      className={`p-3 rounded-lg border ${
        isUser ? "bg-primary/10 border-primary/20" : "bg-muted"
      }`}
    >
      <div className="font-medium text-sm text-muted-foreground mb-1">
        {isUser ? "You" : "Dad"}
      </div>
      {children}
    </div>
  );
}

export function MessageContent({ children }: PropsWithChildren) {
  return <div className="text-foreground whitespace-pre-wrap">{children}</div>;
}

