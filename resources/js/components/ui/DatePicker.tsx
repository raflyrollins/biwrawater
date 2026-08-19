import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '../../lib/utils';

const MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const MONTH_ROWS = [MONTHS.slice(0, 4), MONTHS.slice(4, 8), MONTHS.slice(8, 12)];

type View = 'days' | 'months' | 'years';

interface DatePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    min?: string;
    placeholder?: string;
    clearable?: boolean;
}

function toDate(iso: string | undefined): Date {
    return new Date(iso ? `${iso}T00:00:00` : '');
}

function toIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

export default function DatePicker({
    label,
    value,
    onChange,
    error,
    min,
    placeholder = 'Pilih tanggal...',
    clearable,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [view, setView] = useState<View>('days');
    const [viewDate, setViewDate] = useState(() => {
        const d = value ? toDate(value) : new Date();

        return d;
    });
    const [decadeStart, setDecadeStart] = useState(() => {
        const d = value ? toDate(value) : new Date();

        return Math.floor(d.getFullYear() / 10) * 10;
    });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const today = new Date();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const minDate = min ? toDate(min) : null;
    const selectedDate = value ? toDate(value) : null;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

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
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();

            setDropUp(window.innerHeight - rect.bottom < 360);
        }

        setView('days');
        setOpen((prev) => !prev);
    }

    function selectDay(day: number) {
        onChange(toIso(new Date(year, month, day)));
        setOpen(false);
    }

    function selectMonth(m: number) {
        setViewDate(new Date(year, m, 1));
        setView('days');
    }

    function selectYear(y: number) {
        setViewDate(new Date(y, month, 1));
        setDecadeStart(Math.floor(y / 10) * 10);
        setView('months');
    }

    function formatDisplay(iso: string) {
        const d = toDate(iso);

        return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }

    function isDisabled(day: number) {
        if (!minDate) {
            return false;
        }

        return new Date(year, month, day) < minDate;
    }

    function isSelected(day: number) {
        return (
            !!selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year
        );
    }

    function isToday(day: number) {
        return (
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year
        );
    }

    function dayClasses(day: number) {
        if (isSelected(day)) {
            return 'bg-brand font-bold text-on-brand';
        }

        if (isToday(day)) {
            return 'font-bold text-fg-brand hover:bg-neutral-tertiary-soft';
        }

        if (isDisabled(day)) {
            return 'cursor-not-allowed text-fg-disabled';
        }

        return 'text-body hover:bg-neutral-tertiary-soft hover:text-heading';
    }

    const navButton =
        'flex h-8 w-8 items-center justify-center text-body-subtle transition-colors hover:text-fg-brand';

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
                    tabIndex={0}
                    onClick={toggleOpen}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleOpen();
                        }
                    }}
                    className={cn(
                        'input flex cursor-pointer items-center gap-3',
                        error && 'input-error',
                    )}
                >
                    <span
                        className={cn(
                            'flex-1 truncate',
                            value ? 'text-heading' : 'text-body-subtle',
                        )}
                    >
                        {value ? formatDisplay(value) : placeholder}
                    </span>
                    {clearable && value && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            className="shrink-0 text-body-subtle transition-colors hover:text-danger-strong"
                            aria-label="Hapus tanggal"
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                    )}
                    <CalendarDays
                        size={18}
                        aria-hidden="true"
                        className="shrink-0 text-body-subtle"
                    />
                </div>

                {open && (
                    <div
                        className={cn(
                            'card absolute z-50 w-[320px] p-4 shadow-2xl',
                            dropUp ? 'bottom-full mb-1' : 'top-full mt-1',
                        )}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            {view === 'days' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setViewDate(
                                                new Date(year, month - 1, 1),
                                            )
                                        }
                                        className={navButton}
                                        aria-label="Bulan sebelumnya"
                                    >
                                        <ChevronLeft size={20} aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setView('years')}
                                        className="text-sm font-bold text-heading transition-colors hover:text-fg-brand"
                                    >
                                        {MONTHS[month]} {year}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setViewDate(
                                                new Date(year, month + 1, 1),
                                            )
                                        }
                                        className={navButton}
                                        aria-label="Bulan berikutnya"
                                    >
                                        <ChevronRight size={20} aria-hidden="true" />
                                    </button>
                                </>
                            )}
                            {view === 'months' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setView('years')}
                                        className={navButton}
                                        aria-label="Pilih tahun"
                                    >
                                        <ChevronLeft size={20} aria-hidden="true" />
                                    </button>
                                    <span className="text-sm font-bold text-heading">
                                        {year}
                                    </span>
                                    <div className="h-8 w-8" />
                                </>
                            )}
                            {view === 'years' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDecadeStart((prev) => prev - 10)
                                        }
                                        className={navButton}
                                        aria-label="Dekade sebelumnya"
                                    >
                                        <ChevronLeft size={20} aria-hidden="true" />
                                    </button>
                                    <span className="text-sm font-bold text-heading">
                                        {decadeStart} – {decadeStart + 9}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDecadeStart((prev) => prev + 10)
                                        }
                                        className={navButton}
                                        aria-label="Dekade berikutnya"
                                    >
                                        <ChevronRight size={20} aria-hidden="true" />
                                    </button>
                                </>
                            )}
                        </div>

                        {view === 'years' && (
                            <div className="grid grid-cols-5 gap-1">
                                {Array.from({ length: 10 }).map((_, i) => {
                                    const y = decadeStart + i;
                                    const isCurrentYear = y === year;
                                    const isSelectedYear =
                                        !!selectedDate &&
                                        selectedDate.getFullYear() === y;

                                    return (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => selectYear(y)}
                                            className={cn(
                                                'py-2 text-sm transition-colors',
                                                isSelectedYear
                                                    ? 'bg-brand font-bold text-on-brand'
                                                    : isCurrentYear
                                                      ? 'font-bold text-fg-brand hover:bg-neutral-tertiary-soft'
                                                      : 'text-body hover:bg-neutral-tertiary-soft hover:text-heading',
                                            )}
                                        >
                                            {y}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {view === 'months' && (
                            <div className="grid grid-cols-3 gap-1">
                                {MONTH_ROWS.map((row) =>
                                    row.map((monthName) => {
                                        const mIndex = MONTHS.indexOf(monthName);
                                        const isCurrentMonth = month === mIndex;
                                        const isSelectedMonth =
                                            !!selectedDate &&
                                            selectedDate.getMonth() === mIndex &&
                                            selectedDate.getFullYear() === year;

                                        return (
                                            <button
                                                key={monthName}
                                                type="button"
                                                onClick={() => selectMonth(mIndex)}
                                                className={cn(
                                                    'py-2.5 text-sm transition-colors',
                                                    isSelectedMonth
                                                        ? 'bg-brand font-bold text-on-brand'
                                                        : isCurrentMonth
                                                          ? 'font-bold text-fg-brand hover:bg-neutral-tertiary-soft'
                                                          : 'text-body hover:bg-neutral-tertiary-soft hover:text-heading',
                                                )}
                                            >
                                                {monthName.slice(0, 3)}
                                            </button>
                                        );
                                    }),
                                )}
                            </div>
                        )}

                        {view === 'days' && (
                            <>
                                <div className="grid grid-cols-7 justify-items-center">
                                    {WEEKDAYS.map((day) => (
                                        <span
                                            key={day}
                                            className="flex h-10 w-10 items-center justify-center text-xs font-medium text-body-subtle"
                                        >
                                            {day}
                                        </span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 justify-items-center">
                                    {Array.from({ length: firstDay }).map(
                                        (_, i) => (
                                            <div key={`empty-${i}`} className="h-10 w-10" />
                                        ),
                                    )}
                                    {Array.from({ length: daysInMonth }).map(
                                        (_, i) => {
                                            const day = i + 1;

                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    disabled={isDisabled(day)}
                                                    onClick={() => selectDay(day)}
                                                    className={cn(
                                                        'flex h-10 w-10 items-center justify-center text-sm transition-colors',
                                                        dayClasses(day),
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </>
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
