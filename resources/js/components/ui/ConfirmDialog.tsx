import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'brand' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((nextOptions) => {
        setOptions(nextOptions);

        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const settle = useCallback((value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setOptions(null);
    }, []);

    useEffect(() => {
        if (!options) {
            return undefined;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                settle(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [options, settle]);

    const tone = options?.tone ?? 'brand';

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {options && (
                <div className="animate-overlay-fade fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4">
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                        aria-describedby={
                            options.description
                                ? 'confirm-dialog-description'
                                : undefined
                        }
                        className="animate-modal-pop w-full max-w-md border border-border-default bg-neutral-primary-soft p-6"
                    >
                        <h2
                            id="confirm-dialog-title"
                            className="text-lg font-bold text-heading"
                        >
                            {options.title}
                        </h2>
                        {options.description && (
                            <p
                                id="confirm-dialog-description"
                                className="mt-2 text-sm leading-6 text-body"
                            >
                                {options.description}
                            </p>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => settle(false)}
                                className="border border-border-default px-4 py-2 text-sm font-medium text-body transition-colors hover:bg-neutral-tertiary"
                            >
                                {options.cancelLabel ?? 'Batal'}
                            </button>
                            <button
                                type="button"
                                onClick={() => settle(true)}
                                autoFocus
                                className={
                                    tone === 'danger'
                                        ? 'bg-danger-strong px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90'
                                        : 'btn btn-brand'
                                }
                            >
                                {options.confirmLabel ?? 'Ya, Lanjutkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const context = useContext(ConfirmContext);

    if (!context) {
        throw new Error('useConfirm harus dipakai di dalam ConfirmProvider.');
    }

    return context;
}
