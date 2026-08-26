import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutocompleteItem {
    kecamatan: string;
    kelurahan: string;
    city: string;
    delivery_fee: number;
    is_within_area: boolean;
}

interface AutocompleteProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onSelect?: (item: AutocompleteItem) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    name: string;
    onBlur?: () => void;
}

export default function Autocomplete({
    label,
    value,
    onChange,
    onSelect,
    placeholder = 'Ketik untuk mencari...',
    error,
    required,
    disabled,
    name,
    onBlur,
}: AutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const search = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `/area/search?q=${encodeURIComponent(q)}`,
            );
            if (response.ok) {
                const data: AutocompleteItem[] = await response.json();
                setSuggestions(data);
            }
        } catch {
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            search(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (val: string) => {
        setQuery(val);
        onChange(val);
        setIsOpen(true);
        setSelectedIndex(-1);
    };

    const handleSelect = (item: AutocompleteItem) => {
        setQuery(item.kelurahan);
        onChange(item.kelurahan);
        onSelect?.(item);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) =>
                    Math.min(prev + 1, suggestions.length - 1),
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label
                htmlFor={`address-${name}`}
                className="mb-2 block text-sm font-semibold text-heading"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    id={`address-${name}`}
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onBlur={onBlur}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={cn(
                        'input w-full',
                        'pr-10',
                        error && 'input-error',
                    )}
                    aria-autocomplete="list"
                    aria-controls={`${name}-list`}
                    aria-expanded={isOpen}
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            onChange('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-body-subtle hover:text-danger-strong"
                        aria-label="Hapus"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                )}
            </div>

            {isOpen && (
                <ul
                    id={`${name}-list`}
                    role="listbox"
                    className="absolute z-50 mt-1 w-full max-h-60 overflow-auto border border-border-default bg-white shadow-lg dark:bg-neutral-primary"
                >
                    {isLoading && (
                        <li className="px-4 py-3 text-center text-sm text-body-subtle">
                            Mencari...
                        </li>
                    )}
                    {!isLoading && suggestions.length === 0 && query.length >= 2 && (
                        <li className="px-4 py-3 text-center text-sm text-body-subtle">
                            Tidak ditemukan kecamatan/kelurahan
                        </li>
                    )}
                    {suggestions.map((item, index) => (
                        <li
                            key={`${item.kecamatan}-${item.kelurahan}`}
                            role="option"
                            aria-selected={index === selectedIndex}
                            className={cn(
                                'cursor-pointer px-4 py-2 transition-colors',
                                index === selectedIndex
                                    ? 'bg-brand-soft text-brand'
                                    : 'hover:bg-brand-soft',
                            )}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(item);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="text-sm font-medium text-heading">
                                {item.kelurahan}, {item.kecamatan}
                            </div>
                            <div className="text-xs text-body-subtle">
                                {item.city}
                                {item.is_within_area ? (
                                    <span className="ml-2 text-success-strong">
                                        Gratis ongkir
                                    </span>
                                ) : (
                                    <span className="ml-2 text-fg-brand">
                                        +Rp{item.delivery_fee.toLocaleString('id-ID')}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {error && (
                <p className="mt-1.5 text-sm leading-5 text-danger-strong">
                    {error}
                </p>
            )}
        </div>
    );
}
