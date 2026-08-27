import { Head, router, useForm } from '@inertiajs/react';
import { MapPin, Plus, Trash2, X } from 'lucide-react';

import { useState } from 'react';

import type { FormEvent } from 'react';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import Pagination from '../../../components/dashboard/Pagination';
import type { PaginationLink } from '../../../components/dashboard/Pagination';
import FieldError from '../../../components/public/FieldError';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { formatRupiah } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import {
    destroy as destroyZone,
    store as storeZone,
    update as updateZone,
} from '../../../routes/dashboard/zones';

interface Zone {
    id: number;
    name: string;
    slug: string;
    kecamatan: string;
    kelurahan: string;
    city: string;
    is_within_area: boolean;
    delivery_fee: number;
    is_active: boolean;
    addresses_count: number;
}

interface ZonesIndexProps {
    zones: {
        data: Zone[];
        links: PaginationLink[];
    };
}

interface FormValues {
    name: string;
    kecamatan: string;
    kelurahan: string;
    city: string;
    delivery_fee: string;
    is_within_area: boolean;
    is_active: boolean;
}

const EMPTY_FORM: FormValues = {
    name: '',
    kecamatan: '',
    kelurahan: '',
    city: 'Medan',
    delivery_fee: '0',
    is_within_area: true,
    is_active: true,
};

function toForm(zone: Zone | null): FormValues {
    if (!zone) {
        return { ...EMPTY_FORM };
    }

    return {
        name: zone.name,
        kecamatan: zone.kecamatan,
        kelurahan: zone.kelurahan,
        city: zone.city,
        delivery_fee: String(zone.delivery_fee),
        is_within_area: zone.is_within_area,
        is_active: zone.is_active,
    };
}

interface ZoneFormModalProps {
    editing: Zone | null;
    onClose: () => void;
}

function ZoneFormModal({ editing, onClose }: ZoneFormModalProps) {
    const { data, setData, errors, processing, post, put, reset } =
        useForm<FormValues>(toForm(editing));

    function submit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            put(updateZone.url({ zone: editing.id }));
        } else {
            post(storeZone.url());
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
                        {editing ? 'Ubah Zona' : 'Zona Baru'}
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
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="zone-name"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Nama Zona
                            </label>
                            <input
                                id="zone-name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.name && 'input-error',
                                )}
                                placeholder="cth: Tanah Enam Ratus, Medan Marelan"
                            />
                            <FieldError message={errors.name} />
                        </div>
                        <div>
                            <label
                                htmlFor="zone-kecamatan"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Kecamatan
                            </label>
                            <input
                                id="zone-kecamatan"
                                type="text"
                                value={data.kecamatan}
                                onChange={(e) =>
                                    setData('kecamatan', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.kecamatan && 'input-error',
                                )}
                                placeholder="cth: Medan Marelan"
                            />
                            <FieldError message={errors.kecamatan} />
                        </div>
                        <div>
                            <label
                                htmlFor="zone-kelurahan"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Kelurahan
                            </label>
                            <input
                                id="zone-kelurahan"
                                type="text"
                                value={data.kelurahan}
                                onChange={(e) =>
                                    setData('kelurahan', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.kelurahan && 'input-error',
                                )}
                                placeholder="cth: Tanah Enam Ratus"
                            />
                            <FieldError message={errors.kelurahan} />
                        </div>
                        <div>
                            <label
                                htmlFor="zone-city"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Kota
                            </label>
                            <input
                                id="zone-city"
                                type="text"
                                value={data.city}
                                onChange={(e) =>
                                    setData('city', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.city && 'input-error',
                                )}
                                placeholder="cth: Medan"
                            />
                            <FieldError message={errors.city} />
                        </div>
                        <div>
                            <label
                                htmlFor="zone-delivery-fee"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Ongkir (Rp)
                            </label>
                            <input
                                id="zone-delivery-fee"
                                type="text"
                                inputMode="numeric"
                                value={data.delivery_fee}
                                onChange={(e) =>
                                    setData(
                                        'delivery_fee',
                                        e.target.value.replace(/[^0-9]/g, ''),
                                    )
                                }
                                className={cn(
                                    'input',
                                    errors.delivery_fee && 'input-error',
                                )}
                                placeholder="0 = Gratis ongkir"
                            />
                            <FieldError message={errors.delivery_fee} />
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_within_area}
                                onChange={(e) =>
                                    setData('is_within_area', e.target.checked)
                                }
                                className="size-4 accent-[var(--brand)]"
                            />
                            <span className="text-sm text-heading">
                                Dalam area (gratis ongkir)
                            </span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                                className="size-4 accent-[var(--brand)]"
                            />
                            <span className="text-sm text-heading">Aktif</span>
                        </label>
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

export default function ZonesIndex({ zones }: ZonesIndexProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Zone | null>(null);

    function openCreate() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(zone: Zone) {
        setEditing(zone);
        setModalOpen(true);
    }

    const confirm = useConfirm();

    async function destroy(zone: Zone) {
        const confirmed = await confirm({
            title: 'Hapus zona?',
            description: `Zona "${zone.name}" akan dihapus permanen.`,
            confirmLabel: 'Ya, Hapus',
            tone: 'danger',
        });

        if (confirmed) {
            router.delete(destroyZone.url({ zone: zone.id }));
        }
    }

    return (
        <DashboardLayout>
            <Head title="Zona Pengiriman" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-2xl text-heading">
                            Zona Pengiriman
                        </h2>
                        <p className="text-sm text-body-subtle">
                            Kelola zona kecamatan/kelurahan dan biaya ongkir.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="btn btn-brand"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Zona Baru
                    </button>
                </div>

                {zones.data.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center rounded-sm bg-neutral-tertiary-soft px-6 py-16 text-center">
                        <MapPin
                            size={40}
                            aria-hidden="true"
                            className="text-body-subtle"
                        />
                        <p className="mt-4 font-semibold text-heading">
                            Belum ada zona
                        </p>
                        <p className="mt-1 text-sm text-body-subtle">
                            Tambahkan zona untuk mengatur biaya pengiriman per
                            kecamatan/kelurahan.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border-default text-xs text-body-subtle">
                                    <th className="px-4 py-3 font-semibold">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Kecamatan
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Kelurahan
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Kota
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Ongkir
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Alamat
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        <span className="sr-only">Aksi</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                                {zones.data.map((zone) => (
                                    <tr
                                        key={zone.id}
                                        className="transition-colors hover:bg-neutral-tertiary-soft"
                                    >
                                        <td className="px-4 py-3 font-semibold text-heading">
                                            {zone.name}
                                        </td>
                                        <td className="px-4 py-3 text-body">
                                            {zone.kecamatan}
                                        </td>
                                        <td className="px-4 py-3 text-body">
                                            {zone.kelurahan}
                                        </td>
                                        <td className="px-4 py-3 text-body">
                                            {zone.city}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-heading">
                                            {zone.delivery_fee > 0
                                                ? formatRupiah(
                                                      zone.delivery_fee,
                                                  )
                                                : 'Gratis'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    'inline-block px-2 py-0.5 text-xs font-semibold',
                                                    zone.is_within_area
                                                        ? 'bg-success-soft text-success-strong'
                                                        : 'bg-neutral-tertiary-soft text-body-subtle',
                                                )}
                                            >
                                                {zone.is_within_area
                                                    ? 'Dalam area'
                                                    : 'Luar area'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-body-subtle">
                                            {zone.addresses_count}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(zone)
                                                    }
                                                    className="text-xs font-semibold text-fg-brand hover:underline"
                                                >
                                                    Ubah
                                                </button>
                                                {zone.addresses_count === 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            destroy(zone)
                                                        }
                                                        className="text-xs font-semibold text-danger-strong hover:underline"
                                                    >
                                                        <Trash2
                                                            size={14}
                                                            aria-hidden="true"
                                                        />
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

                <Pagination links={zones.links} />
            </div>

            {modalOpen && (
                <ZoneFormModal
                    editing={editing}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </DashboardLayout>
    );
}
