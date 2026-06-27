import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { cn } from "@/utils/cn";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((currentItems) => [...currentItems, { ...toast, id }]);
    window.setTimeout(() => {
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

function ToastViewport({ items }: { items: ToastItem[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn("rounded-lg border bg-card p-4 text-card-foreground shadow-soft")}
        >
          <p className="text-sm font-semibold">{item.title}</p>
          {item.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
