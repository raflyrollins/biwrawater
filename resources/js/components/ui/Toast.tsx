import { CheckCircle2, X, XCircle } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import type { ReactNode } from 'react';

type ToastVariant = 'success' | 'error';

interface ToastItem {
    id: number;
    variant: ToastVariant;
    message: string;
}

interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4000;
const MAX_VISIBLE_TOASTS = 4;

let nextToastId = 0;

function ToastEntry({
    item,
    onDismiss,
}: {
    item: ToastItem;
    onDismiss: (id: number) => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(item.id), TOAST_DURATION);

        return () => clearTimeout(timer);
    }, [item.id, onDismiss]);

    const isSuccess = item.variant === 'success';

    return (
        <div
            role={isSuccess ? 'status' : 'alert'}
            className="animate-toast-in pointer-events-auto flex w-80 items-start gap-3 border border-border-default bg-neutral-primary-soft px-4 py-3"
        >
            {isSuccess ? (
                <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-success-strong"
                    aria-hidden="true"
                />
            ) : (
                <XCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-danger-strong"
                    aria-hidden="true"
                />
            )}
            <p className="flex-1 text-sm leading-5 text-body">
                {item.message}
            </p>
            <button
                type="button"
                onClick={() => onDismiss(item.id)}
                aria-label="Tutup notifikasi"
                className="-mt-1 -mr-1 shrink-0 p-1 text-body-subtle transition-colors hover:text-heading"
            >
                <X size={14} aria-hidden="true" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: number) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const push = useCallback((variant: ToastVariant, message: string) => {
        const id = nextToastId++;

        setItems((prev) => [
            ...prev.slice(-(MAX_VISIBLE_TOASTS - 1)),
            { id, variant, message },
        ]);
    }, []);

    const success = useCallback(
        (message: string) => push('success', message),
        [push],
    );
    const error = useCallback(
        (message: string) => push('error', message),
        [push],
    );

    return (
        <ToastContext.Provider value={{ success, error }}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col gap-2"
            >
                {items.map((item) => (
                    <ToastEntry key={item.id} item={item} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast harus dipakai di dalam ToastProvider.');
    }

    return context;
}
