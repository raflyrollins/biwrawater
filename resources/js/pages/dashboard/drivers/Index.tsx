import { Head, router, useForm } from '@inertiajs/react';
import { IdCard, Plus, X } from 'lucide-react';

import { useState } from 'react';

import type { FormEvent } from 'react';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import Pagination from '../../../components/dashboard/Pagination';
import type { PaginationLink } from '../../../components/dashboard/Pagination';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import FieldError from '../../../components/public/FieldError';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { cn } from '../../../lib/utils';
import {
    destroy as destroyDriver,
    setStatus as setDriverStatusRoute,
    store as storeDriver,
    update as updateDriver,
} from '../../../routes/dashboard/drivers';

interface DriverItem {
    id: number;
    uuid: string;
    license_number: string | null;
    status: string;
    notes: string | null;
    user: { name: string; email: string; phone: string | null };
}

interface DriversIndexProps {
    drivers: {
        data: DriverItem[];
        links: PaginationLink[];
    };
}

interface FormValues {
    name: string;
    email: string;
    phone: string;
    license_number: string;
    password: string;
    notes: string;
}

const EMPTY_FORM: FormValues = {
    name: '',
    email: '',
    phone: '',
    license_number: '',
    password: '',
    notes: '',
};

function toForm(driver: DriverItem | null): FormValues {
    if (!driver) {
        return { ...EMPTY_FORM };
    }

    return {
        name: driver.user.name,
        email: driver.user.email,
        phone: driver.user.phone ?? '',
        license_number: driver.license_number ?? '',
        password: '',
        notes: driver.notes ?? '',
    };
}

interface DriverFormModalProps {
    editing: DriverItem | null;
    onClose: () => void;
}

function DriverFormModal({ editing, onClose }: DriverFormModalProps) {
    const { data, setData, errors, processing, post, put, reset } = useForm(
        toForm(editing),
    );

    function submit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            put(updateDriver.url({ driver: editing.uuid }));
        } else {
            post(storeDriver.url());
        }
    }

    function close() {
        reset();
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
            onClick={close}
        >
            <div
                className="card mt-12 w-full max-w-xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="mb-0 text-xl text-heading">
                        {editing ? 'Ubah Driver' : 'Driver Baru'}
                    </h3>
                    <button
                        type="button"
                        onClick={close}
                        className="text-body-subtle hover:text-heading"
                        aria-label="Tutup"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="driver-name"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Nama
                            </label>
                            <input
                                id="driver-name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.name && 'input-error',
                                )}
                                placeholder="Nama lengkap"
                            />
                            <FieldError message={errors.name} />
                        </div>

                        <div>
                            <label
                                htmlFor="driver-phone"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Telepon (opsional)
                            </label>
                            <input
                                id="driver-phone"
                                type="tel"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.phone && 'input-error',
                                )}
                                placeholder="cth: 081234567890"
                            />
                            <FieldError message={errors.phone} />
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="driver-email"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Email
                            </label>
                            <input
                                id="driver-email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.email && 'input-error',
                                )}
                                placeholder="cth: driver@biwrawater.id"
                            />
                            <FieldError message={errors.email} />
                        </div>

                        <div>
                            <label
                                htmlFor="driver-password"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                {editing
                                    ? 'Password Baru (opsional)'
                                    : 'Password'}
                            </label>
                            <input
                                id="driver-password"
                                type="password"
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.password && 'input-error',
                                )}
                                placeholder={
                                    editing
                                        ? 'Kosongkan jika tidak diganti'
                                        : 'Minimal 8 karakter'
                                }
                            />
                            <FieldError message={errors.password} />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="driver-license"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            No. SIM (opsional)
                        </label>
                        <input
                            id="driver-license"
                            type="text"
                            value={data.license_number}
                            onChange={(e) =>
                                setData('license_number', e.target.value)
                            }
                            className={cn(
                                'input',
                                errors.license_number && 'input-error',
                            )}
                            placeholder="cth: 1234-567890"
                        />
                        <FieldError message={errors.license_number} />
                    </div>

                    <div>
                        <label
                            htmlFor="driver-notes"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Catatan (opsional)
                        </label>
                        <textarea
                            id="driver-notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className={cn(
                                'input min-h-20',
                                errors.notes && 'input-error',
                            )}
                            placeholder="cth: Kompeten rute Bandung selatan"
                        />
                        <FieldError message={errors.notes} />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={close}
                            className="border border-border-default px-4 py-3 text-sm font-semibold text-body transition-colors hover:bg-neutral-tertiary-soft"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-brand"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DriversIndex({ drivers }: DriversIndexProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<DriverItem | null>(null);

    function openCreate() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(driver: DriverItem) {
        setEditing(driver);
        setModalOpen(true);
    }

    function setDriverStatus(
        driver: DriverItem,
        status: 'available' | 'off_duty',
    ) {
        router.post(setDriverStatusRoute.url({ driver: driver.uuid }), {
            status,
        });
    }

    const confirm = useConfirm();

    async function destroy(driver: DriverItem) {
        const confirmed = await confirm({
            title: 'Nonaktifkan driver?',
            description: `Driver ${driver.user.name} akan berstatus istirahat.`,
            confirmLabel: 'Ya, Nonaktifkan',
            tone: 'danger',
        });

        if (confirmed) {
            router.delete(destroyDriver.url({ driver: driver.uuid }));
        }
    }

    return (
        <DashboardLayout>
            <Head title="Driver" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-2xl text-heading">Driver</h2>
                        <p className="text-sm text-body-subtle">
                            Sopir armada beserta akun masuknya.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="btn btn-brand"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Driver Baru
                    </button>
                </div>

                <div className="card mt-8">
                    {drivers.data.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <IdCard
                                size={40}
                                aria-hidden="true"
                                className="text-body-subtle"
                            />
                            <p className="mt-4 font-semibold text-heading">
                                Belum ada driver
                            </p>
                            <p className="mt-1 text-sm text-body-subtle">
                                Tambahkan driver agar bisa menugaskan
                                pengiriman.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Driver</th>
                                        <th>Telepon</th>
                                        <th>No. SIM</th>
                                        <th>Status</th>
                                        <th>
                                            <span className="sr-only">
                                                Aksi
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drivers.data.map((driver) => (
                                        <tr key={driver.id}>
                                            <td>
                                                <p className="font-semibold text-heading">
                                                    {driver.user.name}
                                                </p>
                                                <p className="mt-0.5 text-xs text-body-subtle">
                                                    {driver.user.email}
                                                </p>
                                                {driver.notes && (
                                                    <p className="mt-0.5 text-xs text-body-subtle">
                                                        {driver.notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td>{driver.user.phone ?? '-'}</td>
                                            <td>
                                                {driver.license_number ?? '-'}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={driver.status}
                                                />
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(driver)
                                                        }
                                                        className="text-xs font-semibold text-fg-brand hover:underline"
                                                    >
                                                        Ubah
                                                    </button>
                                                    {driver.status ===
                                                        'available' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDriverStatus(
                                                                    driver,
                                                                    'off_duty',
                                                                )
                                                            }
                                                            className="text-xs font-semibold text-body-subtle hover:text-heading hover:underline"
                                                        >
                                                            Istirahatkan
                                                        </button>
                                                    )}
                                                    {driver.status ===
                                                        'off_duty' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDriverStatus(
                                                                    driver,
                                                                    'available',
                                                                )
                                                            }
                                                            className="text-xs font-semibold text-fg-brand hover:underline"
                                                        >
                                                            Aktifkan Kembali
                                                        </button>
                                                    )}
                                                    {driver.status !==
                                                        'on_duty' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                destroy(driver)
                                                            }
                                                            className="text-xs font-semibold text-danger-strong hover:underline"
                                                        >
                                                            Nonaktifkan
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <Pagination links={drivers.links} />
            </div>

            {modalOpen && (
                <DriverFormModal
                    editing={editing}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </DashboardLayout>
    );
}
