import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Truck as TruckIcon, X } from 'lucide-react';

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
    destroy as destroyTruck,
    store as storeTruck,
    toggle as toggleTruck,
    update as updateTruck,
} from '../../../routes/dashboard/trucks';

interface Truck {
    id: number;
    uuid: string;
    plate_number: string;
    name: string;
    capacity_liters: number;
    status: string;
    notes: string | null;
    default_driver_id: number | null;
    default_driver: {
        user: { name: string };
    } | null;
}

interface TrucksIndexProps {
    trucks: {
        data: Truck[];
        links: PaginationLink[];
    };
    drivers: {
        id: number;
        user: { name: string };
    }[];
}

interface FormValues {
    plate_number: string;
    name: string;
    capacity_liters: string;
    notes: string;
    default_driver_id: string;
}

const EMPTY_FORM: FormValues = {
    plate_number: '',
    name: '',
    capacity_liters: '',
    notes: '',
    default_driver_id: '',
};

function toForm(truck: Truck | null): FormValues {
    if (!truck) {
        return { ...EMPTY_FORM };
    }

    return {
        plate_number: truck.plate_number,
        name: truck.name,
        capacity_liters: String(truck.capacity_liters),
        notes: truck.notes ?? '',
        default_driver_id: truck.default_driver_id
            ? String(truck.default_driver_id)
            : '',
    };
}

interface TruckFormModalProps {
    editing: Truck | null;
    drivers: { id: number; user: { name: string } }[];
    onClose: () => void;
}

function TruckFormModal({ editing, drivers, onClose }: TruckFormModalProps) {
    const { data, setData, errors, processing, post, reset } = useForm(
        toForm(editing),
    );

    function submit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            post(updateTruck.url({ truck: editing.uuid }));
        } else {
            post(storeTruck.url());
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
                        {editing ? 'Ubah Armada' : 'Armada Baru'}
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
                                htmlFor="truck-plate"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                No. Polisi
                            </label>
                            <input
                                id="truck-plate"
                                type="text"
                                value={data.plate_number}
                                onChange={(e) =>
                                    setData(
                                        'plate_number',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                className={cn(
                                    'input font-mono uppercase',
                                    errors.plate_number && 'input-error',
                                )}
                                placeholder="cth: B 1234 CDE"
                            />
                            <FieldError message={errors.plate_number} />
                        </div>

                        <div>
                            <label
                                htmlFor="truck-name"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Nama Armada
                            </label>
                            <input
                                id="truck-name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.name && 'input-error',
                                )}
                                placeholder="cth: Truk Tangki 1"
                            />
                            <FieldError message={errors.name} />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="truck-capacity"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Kapasitas (liter)
                        </label>
                        <input
                            id="truck-capacity"
                            type="text"
                            inputMode="numeric"
                            value={data.capacity_liters}
                            onChange={(e) =>
                                setData(
                                    'capacity_liters',
                                    e.target.value.replace(/[^0-9]/g, ''),
                                )
                            }
                            className={cn(
                                'input',
                                errors.capacity_liters && 'input-error',
                            )}
                            placeholder="cth: 5000"
                        />
                        <FieldError message={errors.capacity_liters} />
                    </div>

                    <div>
                        <label
                            htmlFor="truck-notes"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Catatan (opsional)
                        </label>
                        <textarea
                            id="truck-notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className={cn(
                                'input min-h-20',
                                errors.notes && 'input-error',
                            )}
                            placeholder="cth: Servis rutin tiap 10.000 km"
                        />
                        <FieldError message={errors.notes} />
                    </div>

                    <div>
                        <label
                            htmlFor="truck-driver"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Driver Default
                        </label>
                        <select
                            id="truck-driver"
                            value={data.default_driver_id}
                            onChange={(e) =>
                                setData('default_driver_id', e.target.value)
                            }
                            className={cn(
                                'input w-full',
                                errors.default_driver_id && 'input-error',
                            )}
                        >
                            <option value="">Tanpa driver</option>
                            {drivers.map((driver) => (
                                <option
                                    key={driver.id}
                                    value={String(driver.id)}
                                >
                                    {driver.user.name}
                                </option>
                            ))}
                        </select>
                        <FieldError message={errors.default_driver_id} />
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

function statusActionLabel(status: string): string {
    if (status === 'available') {
        return 'Jadwalkan Perbaikan';
    }

    if (status === 'maintenance') {
        return 'Kembalikan';
    }

    return 'Aktifkan Kembali';
}

export default function TrucksIndex({ trucks, drivers }: TrucksIndexProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Truck | null>(null);

    function openCreate() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(truck: Truck) {
        setEditing(truck);
        setModalOpen(true);
    }

    function toggle(truck: Truck) {
        router.post(toggleTruck.url({ truck: truck.uuid }));
    }

    const confirm = useConfirm();

    async function destroy(truck: Truck) {
        const confirmed = await confirm({
            title: 'Nonaktifkan armada?',
            description: `Armada ${truck.plate_number} akan berstatus nonaktif.`,
            confirmLabel: 'Ya, Nonaktifkan',
            tone: 'danger',
        });

        if (confirmed) {
            router.delete(destroyTruck.url({ truck: truck.uuid }));
        }
    }

    return (
        <DashboardLayout>
            <Head title="Armada" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-2xl text-heading">Armada</h2>
                        <p className="text-sm text-body-subtle">
                            Truk tangki yang digunakan untuk pengiriman.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="btn btn-brand"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Armada Baru
                    </button>
                </div>

                <div className="card mt-8">
                    {trucks.data.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <TruckIcon
                                size={40}
                                aria-hidden="true"
                                className="text-body-subtle"
                            />
                            <p className="mt-4 font-semibold text-heading">
                                Belum ada armada
                            </p>
                            <p className="mt-1 text-sm text-body-subtle">
                                Tambahkan truk tangki untuk mulai menugaskan
                                pengiriman.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Armada</th>
                                        <th>Kapasitas</th>
                                        <th>Driver Default</th>
                                        <th>Status</th>
                                        <th>
                                            <span className="sr-only">
                                                Aksi
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trucks.data.map((truck) => (
                                        <tr key={truck.id}>
                                            <td>
                                                <p className="font-mono text-sm font-bold tracking-wider text-heading">
                                                    {truck.plate_number}
                                                </p>
                                                <p className="mt-0.5 text-xs text-body-subtle">
                                                    {truck.name}
                                                </p>
                                                {truck.notes && (
                                                    <p className="mt-0.5 text-xs text-body-subtle">
                                                        {truck.notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                {truck.capacity_liters.toLocaleString(
                                                    'id-ID',
                                                )}{' '}
                                                liter
                                            </td>
                                            <td>
                                                {truck.default_driver?.user
                                                    ?.name ?? '-'}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={truck.status}
                                                />
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(truck)
                                                        }
                                                        className="text-xs font-semibold text-fg-brand hover:underline"
                                                    >
                                                        Ubah
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggle(truck)
                                                        }
                                                        className="text-xs font-semibold text-body-subtle hover:text-heading hover:underline"
                                                    >
                                                        {statusActionLabel(
                                                            truck.status,
                                                        )}
                                                    </button>
                                                    {truck.status !==
                                                        'retired' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                destroy(truck)
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

                <Pagination links={trucks.links} />
            </div>

            {modalOpen && (
                <TruckFormModal
                    editing={editing}
                    drivers={drivers}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </DashboardLayout>
    );
}
