import { Head, router, useForm } from '@inertiajs/react';
import { CalendarOff, Clock, Save, Trash2 } from 'lucide-react';

import { useState } from 'react';

import type { FormEvent } from 'react';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import FieldError from '../../../components/public/FieldError';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import DatePicker from '../../../components/ui/DatePicker';
import { cn } from '../../../lib/utils';
import {
    destroy as destroyHoliday,
    store as storeHoliday,
} from '../../../routes/dashboard/holidays';
import { update as updateOperatingHours } from '../../../routes/dashboard/operating-hours';

interface OperatingDay {
    day_of_week: number;
    label: string;
    is_closed: boolean;
    opens_at: string | null;
    closes_at: string | null;
}

interface HolidayItem {
    uuid: string;
    date: string;
    name: string;
}

interface TodayStatus {
    is_open: boolean;
    message: string;
}

interface OperatingHoursIndexProps {
    days: OperatingDay[];
    holidays: HolidayItem[];
    today: TodayStatus;
}

export default function OperatingHoursIndex({
    days,
    holidays,
    today,
}: OperatingHoursIndexProps) {
    const { data, setData, errors, processing, put } = useForm({
        days: days.map((day) => ({ ...day })),
    });

    function setDay(index: number, patch: Partial<OperatingDay>) {
        const next = data.days.map((day, i) =>
            i === index ? { ...day, ...patch } : day,
        );
        setData('days', next);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        put(updateOperatingHours.url(), { preserveScroll: true });
    }

    return (
        <DashboardLayout>
            <Head title="Jam Operasional" />

            <div className="container-dashboard py-8 md:py-12">
                <h2 className="mb-1 text-2xl text-heading">Jam Operasional</h2>
                <p className="text-sm text-body-subtle">
                    Atur jam buka-tutup mingguan dan kalender hari libur.
                    Customer hanya dapat memesan saat toko buka.
                </p>

                <div className={cn('card mt-6 flex items-center gap-4 p-5')}>
                    <Clock
                        size={20}
                        aria-hidden="true"
                        className={
                            today.is_open
                                ? 'text-success-strong'
                                : 'text-danger-strong'
                        }
                    />
                    <div>
                        <p className="text-sm font-semibold text-heading">
                            {today.is_open
                                ? 'Toko Sedang Buka'
                                : 'Toko Sedang Tutup'}
                        </p>
                        <p className="text-xs text-body-subtle">
                            {today.message}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="card mt-8 p-6">
                    <h3 className="text-lg text-heading">Jadwal Mingguan</h3>
                    <p className="mt-0.5 text-sm text-body-subtle">
                        Zona waktu Asia/Jakarta (WIB).
                    </p>

                    <div className="mt-6 space-y-4">
                        {data.days.map((day, index) => (
                            <div
                                key={day.day_of_week}
                                className="flex flex-wrap items-center gap-4 rounded-sm bg-neutral-tertiary-soft p-4"
                            >
                                <label className="flex min-w-32 items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={!day.is_closed}
                                        onChange={(e) =>
                                            setDay(index, {
                                                is_closed: !e.target.checked,
                                            })
                                        }
                                        className="size-4 accent-[var(--brand)]"
                                    />
                                    <span className="text-sm font-semibold text-heading">
                                        {day.label}
                                    </span>
                                </label>

                                {day.is_closed ? (
                                    <span className="text-sm font-semibold text-danger-strong">
                                        Tutup
                                    </span>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div>
                                            <input
                                                type="time"
                                                aria-label={`Jam buka ${day.label}`}
                                                value={day.opens_at ?? ''}
                                                onChange={(e) =>
                                                    setDay(index, {
                                                        opens_at:
                                                            e.target.value ||
                                                            null,
                                                    })
                                                }
                                                className={cn(
                                                    'input !w-auto',
                                                    errors[
                                                        `days.${index}.opens_at`
                                                    ] && 'input-error',
                                                )}
                                            />
                                            <FieldError
                                                message={
                                                    errors[
                                                        `days.${index}.opens_at`
                                                    ]
                                                }
                                            />
                                        </div>
                                        <span className="text-sm text-body-subtle">
                                            s.d.
                                        </span>
                                        <div>
                                            <input
                                                type="time"
                                                aria-label={`Jam tutup ${day.label}`}
                                                value={day.closes_at ?? ''}
                                                onChange={(e) =>
                                                    setDay(index, {
                                                        closes_at:
                                                            e.target.value ||
                                                            null,
                                                    })
                                                }
                                                className={cn(
                                                    'input !w-auto',
                                                    errors[
                                                        `days.${index}.closes_at`
                                                    ] && 'input-error',
                                                )}
                                            />
                                            <FieldError
                                                message={
                                                    errors[
                                                        `days.${index}.closes_at`
                                                    ]
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-brand"
                        >
                            <Save size={16} aria-hidden="true" />
                            {processing ? 'Menyimpan...' : 'Simpan Jadwal'}
                        </button>
                    </div>
                </form>

                <HolidaySection holidays={holidays} />
            </div>
        </DashboardLayout>
    );
}

function HolidaySection({ holidays }: { holidays: HolidayItem[] }) {
    const [date, setDate] = useState('');
    const [name, setName] = useState('');

    const confirm = useConfirm();

    function store(e: FormEvent) {
        e.preventDefault();

        router.post(
            storeHoliday.url(),
            { date, name },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDate('');
                    setName('');
                },
            },
        );
    }

    async function destroy(uuid: string, holidayName: string) {
        const confirmed = await confirm({
            title: 'Hapus hari libur?',
            description: `Tanggal merah "${holidayName}" akan dihapus dari kalender.`,
            confirmLabel: 'Ya, Hapus',
            tone: 'danger',
        });

        if (confirmed) {
            router.delete(destroyHoliday.url({ holiday: uuid }), {
                preserveScroll: true,
            });
        }
    }

    return (
        <div className="card mt-8 p-6">
            <div className="flex items-center gap-2">
                <CalendarOff
                    size={18}
                    aria-hidden="true"
                    className="text-fg-brand"
                />
                <h3 className="mb-0 text-lg text-heading">Kalender Libur</h3>
            </div>
            <p className="mt-1 text-sm text-body-subtle">
                Tanggal non-kerja; pesanan tidak dapat dibuat pada tanggal ini.
            </p>

            <form
                onSubmit={store}
                className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row"
            >
                <div className="flex min-w-0 flex-1 flex-col sm:max-w-[280px]">
                    <label
                        htmlFor="holiday-date"
                        className="mb-1.5 block text-sm font-semibold text-heading"
                    >
                        Tanggal Libur
                    </label>
                    <DatePicker
                        value={date}
                        onChange={setDate}
                        placeholder="Pilih tanggal..."
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <label
                        htmlFor="holiday-name"
                        className="mb-1.5 block text-sm font-semibold text-heading"
                    >
                        Nama Hari Libur
                    </label>
                    <input
                        id="holiday-name"
                        type="text"
                        aria-label="Keterangan libur"
                        placeholder="cth: Idul Fitri 1447 H"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        required
                        className="input h-full"
                    />
                </div>
                <div className="flex min-w-[120px] flex-col">
                    <label
                        htmlFor="holiday-submit"
                        className="invisible mb-1.5 block text-sm font-semibold text-heading"
                        aria-hidden="true"
                    >
                        &nbsp;
                    </label>
                    <button
                        type="submit"
                        id="holiday-submit"
                        className="btn btn-brand h-full w-full px-6 whitespace-nowrap disabled:border disabled:border-border-default disabled:bg-brand/40 disabled:text-fg-brand/60 disabled:hover:bg-brand/40"
                        disabled={!date || !name}
                    >
                        Tambah
                    </button>
                </div>
            </form>

            {holidays.length === 0 ? (
                <div className="mt-6 rounded-sm bg-neutral-tertiary-soft p-10 text-center">
                    <CalendarOff
                        size={32}
                        aria-hidden="true"
                        className="mx-auto text-body-subtle"
                    />
                    <p className="mt-3 font-semibold text-heading">
                        Belum ada hari libur terjadwal
                    </p>
                    <p className="mt-1 text-sm text-body-subtle">
                        Tambahkan tanggal merah di formulir di atas.
                    </p>
                </div>
            ) : (
                <ul className="mt-5 divide-y divide-[var(--border-default)] border border-border-default">
                    {holidays.map((holiday) => (
                        <li
                            key={holiday.uuid}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                            <div>
                                <p className="font-mono text-sm font-bold text-heading">
                                    {holiday.date}
                                </p>
                                <p className="text-sm text-body">
                                    {holiday.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    destroy(holiday.uuid, holiday.name)
                                }
                                aria-label={`Hapus ${holiday.name}`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center border border-danger-strong text-danger-strong transition-colors hover:bg-danger-soft"
                            >
                                <Trash2 size={14} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
