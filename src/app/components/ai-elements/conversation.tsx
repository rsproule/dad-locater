import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ScrollContextValue = {
  setScrollEl: (el: HTMLDivElement | null) => void;
  getScrollEl: () => HTMLDivElement | null;
};

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function Conversation({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const value = useMemo<ScrollContextValue>(
    () => ({
      setScrollEl: (el) => {
        scrollElRef.current = el;
      },
      getScrollEl: () => scrollElRef.current,
    }),
    [],
  );

  return (
    <ScrollContext.Provider value={value}>
      <div className={`w-full flex flex-col gap-3 ${className || ""}`}>
        {children}
      </div>
    </ScrollContext.Provider>
  );
}

export function ConversationContent({
  children,
  className,
  autoScroll = true,
}: PropsWithChildren<{ className?: string; autoScroll?: boolean }>) {
  const ctx = useContext(ScrollContext);
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      ctx?.setScrollEl(el);
    },
    [ctx],
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ctx?.getScrollEl();
    if (!el) return;
    scrollRef.current = el;

    const atBottom = () =>
      el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    const scrollToBottom = () =>
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });

    // Initial
    if (autoScroll) {
      setTimeout(() => {
        if (atBottom()) scrollToBottom();
      }, 0);
    }

    const mo = new MutationObserver(() => {
      if (!autoScroll) return;
      if (atBottom()) scrollToBottom();
    });
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    const ro = new ResizeObserver(() => {
      if (!autoScroll) return;
      if (atBottom()) scrollToBottom();
    });
    ro.observe(el);

    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [ctx, autoScroll]);

  return (
    <div
      ref={setRef}
      className={`overflow-y-auto pr-1 ${className || ""}`}
    >
      {children}
    </div>
  );
}

export function ConversationScrollButton() {
  const ctx = useContext(ScrollContext);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ctx?.getScrollEl();
    if (!el) return;

    function updateVisibility() {
      if (!el) return;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      setVisible(!atBottom);
    }

    updateVisibility();
    el.addEventListener("scroll", updateVisibility, { passive: true });
    const ro = new ResizeObserver(() => updateVisibility());
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateVisibility as any);
      ro.disconnect();
    };
  }, [ctx]);

  if (!visible) return null;

  return (
    <div className="w-full flex justify-center">
      <button
        type="button"
        onClick={() => {
          const el = ctx?.getScrollEl();
          if (!el) return;
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }}
        className="px-3 py-1 text-xs rounded border bg-card hover:bg-muted"
      >
        Scroll to bottom
      </button>
    </div>
  );
}
