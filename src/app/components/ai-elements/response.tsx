import { PropsWithChildren } from "react";

export function Response({ children }: PropsWithChildren) {
  return <div className="leading-relaxed">{children}</div>;
}

