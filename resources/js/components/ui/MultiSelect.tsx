import { ChevronDown, Check, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { SelectOption } from '../../lib/types';
import { cn } from '../../lib/utils';

interface MultiSelectProps {
    label?: string;
    value: SelectOption['value'][];
    onChange: (value: SelectOption['value'][]) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
}

export default function MultiSelect({
    label,
    value,
    onChange,
    options,
    placeholder = 'Pilih...',
    error,
    searchPlaceholder = 'Cari...',
    disabled,
}: MultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const selectedOptions = options.filter((option) =>
        value.includes(option.value),
    );
    const firstSelected = selectedOptions[0] ?? null;
    const extraCount = Math.max(selectedOptions.length - 1, 0);
    const extraLabels = selectedOptions
        .slice(1)
        .map((option) => option.label)
        .join(', ');
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

    function toggle(option: SelectOption) {
        const next = value.includes(option.value)
            ? value.filter((item) => item !== option.value)
            : [...value, option.value];

        onChange(next);
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
                        'input flex cursor-pointer items-center gap-2',
                        disabled && 'cursor-not-allowed opacity-60',
                        error && 'input-error',
                    )}
                >
                    {!firstSelected ? (
                        <span className="flex-1 truncate text-body-subtle">
                            {placeholder}
                        </span>
                    ) : (
                        <ul className="flex min-w-0 flex-1 items-center gap-2">
                            <li className="min-w-0">
                                <span className="inline-flex max-w-full items-center gap-1 bg-brand-soft px-2 py-1 text-xs font-semibold text-fg-brand-strong">
                                    <span className="truncate">
                                        {firstSelected.label}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggle(firstSelected);
                                        }}
                                        className="shrink-0 text-fg-brand-strong transition-colors hover:text-brand-strong"
                                        aria-label={`Hapus ${firstSelected.label}`}
                                    >
                                        <X size={12} aria-hidden="true" />
                                    </button>
                                </span>
                            </li>
                            {extraCount > 0 && (
                                <li>
                                    <span
                                        className="inline-flex items-center bg-neutral-tertiary-soft px-2 py-1 text-xs font-semibold text-body-subtle"
                                        title={extraLabels}
                                    >
                                        +{extraCount}
                                    </span>
                                </li>
                            )}
                        </ul>
                    )}
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
                                    const isSelected = value.includes(
                                        option.value,
                                    );

                                    return (
                                        <li key={String(option.value)}>
                                            <button
                                                type="button"
                                                onClick={() => toggle(option)}
                                                className={cn(
                                                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                                                    isSelected
                                                        ? 'bg-brand-soft font-semibold text-fg-brand-strong'
                                                        : 'text-body hover:bg-neutral-tertiary-soft hover:text-heading',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'flex h-4 w-4 shrink-0 items-center justify-center border',
                                                        isSelected
                                                            ? 'border-brand bg-brand'
                                                            : 'border-border-default bg-neutral-primary-soft',
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <Check
                                                            size={12}
                                                            aria-hidden="true"
                                                            className="text-on-brand"
                                                        />
                                                    )}
                                                </span>
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
