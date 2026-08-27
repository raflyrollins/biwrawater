import { Head, router, useForm } from '@inertiajs/react';
import { CalendarOff, Clock, Plus, Save } from 'lucide-react';

import { useState } from 'react';

import type { FormEvent } from 'react';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import FieldError from '../../../components/public/FieldError';
import { cn } from '../../../lib/utils';
import {
    store as storeHoliday,
    destroy as destroyHoliday,
} from '../../../routes/dashboard/holidays';
import { update as updateOperatingHours } from '../../../routes/dashboard/operating-hours';

interface OperatingDay {
    day_of_week: number;
    label: string;
    is_closed: boolean;
    opens_at: string | null;
    closes_at: string | null;
}

interface Holiday {
    uuid: string;
    date: string;
    name: string;
}

interface OperatingHoursIndexProps {
    days: OperatingDay[];
    holidays: Holiday[];
}

export default function OperatingHoursIndex({
    days,
    holidays,
}: OperatingHoursIndexProps) {
    const { data, setData, errors, processing, put } = useForm({
        days: days.map((day) => ({ ...day })),
    });

    const [holidayDate, setHolidayDate] = useState('');
    const [holidayName, setHolidayName] = useState('');
    const [holidayError, setHolidayError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function setDay(index: number, patch: Partial<OperatingDay>) {
        const next = data.days.map((day, i) =>
            i === index ? { ...day, ...patch } : day,
        );
        setData('days', next);
    }

    function submitSchedule(e: FormEvent) {
        e.preventDefault();
        put(updateOperatingHours.url(), { preserveScroll: true });
    }

    function addHoliday(e: FormEvent) {
        e.preventDefault();
        setHolidayError('');

        if (!holidayDate || !holidayName.trim()) {
            setHolidayError('Tanggal dan nama wajib diisi.');

            return;
        }

        setSubmitting(true);

        router.post(
            storeHoliday.url(),
            { date: holidayDate, name: holidayName.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setHolidayDate('');
                    setHolidayName('');
                },
                onError: (errors) => {
                    setHolidayError(
                        errors.date ??
                            errors.name ??
                            'Gagal menambahkan hari libur.',
                    );
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    function removeHoliday(uuid: string) {
        if (!window.confirm('Hapus hari libur ini?')) {
            return;
        }

        router.delete(destroyHoliday({ holiday: uuid }), {
            preserveScroll: true,
        });
    }

    return (
        <DashboardLayout>
            <Head title="Jam Operasional" />

            <div className="container-dashboard py-8 md:py-12">
                <h2 className="mb-1 text-2xl text-heading">Jam Operasional</h2>
                <p className="text-sm text-body-subtle">
                    Atur jam buka-tutup mingguan dan hari libur.
                </p>

                {/* Jadwal Mingguan */}
                <form onSubmit={submitSchedule} className="card mt-8 p-6">
                    <div className="flex items-center gap-2">
                        <Clock
                            size={18}
                            className="text-fg-brand"
                            aria-hidden="true"
                        />
                        <h3 className="text-lg text-heading">
                            Jadwal Mingguan
                        </h3>
                    </div>
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
                                                ...(e.target.checked && {
                                                    opens_at:
                                                        day.opens_at ?? '08:00',
                                                    closes_at:
                                                        day.closes_at ??
                                                        '17:00',
                                                }),
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

                {/* Hari Libur */}
                <div className="card mt-6 p-6">
                    <div className="flex items-center gap-2">
                        <CalendarOff
                            size={18}
                            className="text-fg-brand"
                            aria-hidden="true"
                        />
                        <h3 className="text-lg text-heading">Hari Libur</h3>
                    </div>
                    <p className="mt-0.5 text-sm text-body-subtle">
                        Tambahkan tanggal libur. Toko otomatis tutup di tanggal
                        ini.
                    </p>

                    <form
                        onSubmit={addHoliday}
                        className="mt-4 flex flex-wrap items-end gap-3"
                    >
                        <div>
                            <label
                                htmlFor="holiday-date"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Tanggal
                            </label>
                            <input
                                id="holiday-date"
                                type="date"
                                value={holidayDate}
                                onChange={(e) => setHolidayDate(e.target.value)}
                                className={cn(
                                    'input !w-auto',
                                    holidayError && 'input-error',
                                )}
                            />
                        </div>
                        <div className="min-w-48 flex-1">
                            <label
                                htmlFor="holiday-name"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Nama Hari Libur
                            </label>
                            <input
                                id="holiday-name"
                                type="text"
                                value={holidayName}
                                onChange={(e) => setHolidayName(e.target.value)}
                                className={cn(
                                    'input',
                                    holidayError && 'input-error',
                                )}
                                placeholder="cth: Hari Raya Idul Fitri"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-brand shrink-0"
                        >
                            <Plus size={16} aria-hidden="true" />
                            {submitting ? 'Menambahkan...' : 'Tambah'}
                        </button>
                    </form>
                    {holidayError && (
                        <p className="mt-2 text-sm text-danger-strong">
                            {holidayError}
                        </p>
                    )}

                    {holidays.length === 0 ? (
                        <p className="mt-4 text-sm text-body-subtle">
                            Belum ada hari libur yang ditetapkan.
                        </p>
                    ) : (
                        <ul className="mt-4 divide-y divide-border-default border border-border-default">
                            {holidays.map((holiday) => (
                                <li
                                    key={holiday.uuid}
                                    className="flex items-center justify-between gap-3 bg-neutral-tertiary-soft px-4 py-3"
                                >
                                    <div>
                                        <span className="block text-sm font-semibold text-heading">
                                            {holiday.name}
                                        </span>
                                        <span className="text-xs text-body-subtle">
                                            {new Date(
                                                holiday.date + 'T00:00:00',
                                            ).toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeHoliday(holiday.uuid)
                                        }
                                        className="text-xs font-semibold text-danger-strong hover:underline"
                                    >
                                        Hapus
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
