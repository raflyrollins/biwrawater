import { ChevronDown, Check, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { SelectOption } from '../../lib/types';
import { cn } from '../../lib/utils';

interface SelectProps {
    label?: string;
    value: SelectOption['value'];
    onChange: (value: SelectOption['value']) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
}

export default function Select({
    label,
    value,
    onChange,
    options,
    placeholder = 'Pilih...',
    error,
    searchPlaceholder = 'Cari...',
    disabled,
}: SelectProps) {
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const selected = options.find((option) => option.value === value);
    const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase()),
    );

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (
                open &&
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onClickOutside);

        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener('keydown', onKeyDown);
        }

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    function toggleOpen() {
        if (disabled) {
            return;
        }

        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();

            setDropUp(window.innerHeight - rect.bottom < 320);
        }

        setSearch('');
        setOpen((prev) => !prev);
    }

    function select(option: SelectOption) {
        onChange(option.value);
        setOpen(false);
        setSearch('');
    }

    return (
        <div>
            {label && (
                <label className="mb-2 block text-sm font-semibold text-heading">
                    {label}
                </label>
            )}

            <div ref={wrapperRef} className="relative">
                <div
                    ref={triggerRef}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onClick={toggleOpen}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleOpen();
                        }
                    }}
                    className={cn(
                        'input flex cursor-pointer items-center gap-3',
                        disabled && 'cursor-not-allowed opacity-60',
                        error && 'input-error',
                    )}
                >
                    <span
                        className={cn(
                            'flex-1 truncate',
                            selected ? 'text-heading' : 'text-body-subtle',
                        )}
                    >
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className={cn(
                            'shrink-0 text-body-subtle transition-transform',
                            open && 'rotate-180',
                        )}
                    />
                </div>

                {open && (
                    <div
                        className={cn(
                            'card absolute left-0 right-0 z-50 max-h-64 overflow-auto shadow-2xl',
                            dropUp ? 'bottom-full mb-1' : 'top-full mt-1',
                        )}
                    >
                        <div className="sticky top-0 border-b border-border-default bg-neutral-primary-soft p-2">
                            <div className="flex items-center gap-2 border border-border-default bg-neutral-tertiary px-3 py-2">
                                <Search
                                    size={16}
                                    aria-hidden="true"
                                    className="shrink-0 text-body-subtle"
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    autoFocus
                                    className="w-full bg-transparent text-sm text-heading outline-none placeholder:text-body-subtle"
                                />
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-body-subtle">
                                Tidak ada hasil
                            </p>
                        ) : (
                            <ul className="py-1">
                                {filtered.map((option) => {
                                    const isSelected =
                                        option.value === value;

                                    return (
                                        <li key={String(option.value)}>
                                            <button
                                                type="button"
                                                onClick={() => select(option)}
                                                className={cn(
                                                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                                                    isSelected
                                                        ? 'bg-brand-soft font-semibold text-fg-brand-strong'
                                                        : 'text-body hover:bg-neutral-tertiary-soft hover:text-heading',
                                                )}
                                            >
                                                <Check
                                                    size={16}
                                                    aria-hidden="true"
                                                    className={cn(
                                                        'shrink-0',
                                                        isSelected
                                                            ? 'text-fg-brand'
                                                            : 'text-transparent',
                                                    )}
                                                />
                                                <span className="flex-1">
                                                    {option.label}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-sm leading-5 text-danger-strong">
                    {error}
                </p>
            )}
        </div>
    );
}
