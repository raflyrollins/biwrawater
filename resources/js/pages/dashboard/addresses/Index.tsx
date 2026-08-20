import { Head, router, useForm } from '@inertiajs/react';
import { MapPin, Plus, X } from 'lucide-react';

import { useState } from 'react';

import type { FormEvent } from 'react';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import FieldError from '../../../components/public/FieldError';
import { cn } from '../../../lib/utils';
import {
    destroy as destroyAddress,
    store as storeAddress,
    update as updateAddress,
} from '../../../routes/dashboard/addresses';

interface Address {
    id: number;
    label: string;
    recipient_name: string;
    phone: string;
    street_address: string;
    district: string;
    subdistrict: string | null;
    city: string;
    postal_code: string | null;
    notes: string | null;
    is_default: boolean;
}

interface AddressesIndexProps {
    addresses: Address[];
}

interface FormValues {
    label: string;
    recipient_name: string;
    phone: string;
    street_address: string;
    district: string;
    subdistrict: string;
    city: string;
    postal_code: string;
    notes: string;
    is_default: boolean;
}

const EMPTY_FORM: FormValues = {
    label: '',
    recipient_name: '',
    phone: '',
    street_address: '',
    district: '',
    subdistrict: '',
    city: '',
    postal_code: '',
    notes: '',
    is_default: false,
};

function toForm(address: Address | null): FormValues {
    if (!address) {
        return { ...EMPTY_FORM };
    }

    return {
        label: address.label,
        recipient_name: address.recipient_name,
        phone: address.phone,
        street_address: address.street_address,
        district: address.district,
        subdistrict: address.subdistrict ?? '',
        city: address.city,
        postal_code: address.postal_code ?? '',
        notes: address.notes ?? '',
        is_default: address.is_default,
    };
}

interface AddressFormModalProps {
    editing: Address | null;
    onClose: () => void;
}

function AddressFormModal({ editing, onClose }: AddressFormModalProps) {
    const { data, setData, errors, processing, post, put, reset } =
        useForm<FormValues>(toForm(editing));

    function submit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            put(updateAddress.url({ address: editing.id }));
        } else {
            post(storeAddress.url());
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
                        {editing ? 'Ubah Alamat' : 'Alamat Baru'}
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
                                htmlFor="address-label"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Label
                            </label>
                            <input
                                id="address-label"
                                type="text"
                                value={data.label}
                                onChange={(e) =>
                                    setData('label', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.label && 'input-error',
                                )}
                                placeholder="cth: Rumah"
                            />
                            <FieldError message={errors.label} />
                        </div>
                        <div>
                            <label
                                htmlFor="address-recipient"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Nama Penerima
                            </label>
                            <input
                                id="address-recipient"
                                type="text"
                                value={data.recipient_name}
                                onChange={(e) =>
                                    setData('recipient_name', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.recipient_name && 'input-error',
                                )}
                            />
                            <FieldError message={errors.recipient_name} />
                        </div>
                        <div>
                            <label
                                htmlFor="address-phone"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                No. HP
                            </label>
                            <input
                                id="address-phone"
                                type="tel"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.phone && 'input-error',
                                )}
                                placeholder="08xxxxxxxxxx"
                            />
                            <FieldError message={errors.phone} />
                        </div>
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="address-street"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Alamat Jalan
                            </label>
                            <input
                                id="address-street"
                                type="text"
                                value={data.street_address}
                                onChange={(e) =>
                                    setData('street_address', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.street_address && 'input-error',
                                )}
                            />
                            <FieldError message={errors.street_address} />
                        </div>
                        <div>
                            <label
                                htmlFor="address-district"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Kecamatan
                            </label>
                            <input
                                id="address-district"
                                type="text"
                                value={data.district}
                                onChange={(e) =>
                                    setData('district', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.district && 'input-error',
                                )}
                            />
                            <FieldError message={errors.district} />
                        </div>
                        <div>
                            <label
                                htmlFor="address-subdistrict"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Kelurahan (opsional)
                            </label>
                            <input
                                id="address-subdistrict"
                                type="text"
                                value={data.subdistrict}
                                onChange={(e) =>
                                    setData('subdistrict', e.target.value)
                                }
                                className="input"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="address-city"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Kota
                            </label>
                            <input
                                id="address-city"
                                type="text"
                                value={data.city}
                                onChange={(e) =>
                                    setData('city', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.city && 'input-error',
                                )}
                            />
                            <FieldError message={errors.city} />
                        </div>
                        <div>
                            <label
                                htmlFor="address-postal"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Kode Pos (opsional)
                            </label>
                            <input
                                id="address-postal"
                                type="text"
                                value={data.postal_code}
                                onChange={(e) =>
                                    setData('postal_code', e.target.value)
                                }
                                className="input"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="address-notes"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Patokan (opsional)
                            </label>
                            <input
                                id="address-notes"
                                type="text"
                                value={data.notes}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                                className="input"
                                placeholder="cth: dekat masjid, gerbang kuning"
                            />
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-heading">
                        <input
                            type="checkbox"
                            checked={data.is_default}
                            onChange={(e) =>
                                setData('is_default', e.target.checked)
                            }
                            className="h-4 w-4"
                        />
                        Jadikan alamat utama
                    </label>

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

export default function AddressesIndex({ addresses }: AddressesIndexProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Address | null>(null);

    function openCreate() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(address: Address) {
        setEditing(address);
        setModalOpen(true);
    }

    function setDefault(address: Address) {
        router.post(updateAddress.url({ address: address.id }), {
            label: address.label,
            recipient_name: address.recipient_name,
            phone: address.phone,
            street_address: address.street_address,
            district: address.district,
            subdistrict: address.subdistrict ?? '',
            city: address.city,
            postal_code: address.postal_code ?? '',
            notes: address.notes ?? '',
            is_default: true,
        });
    }

    function destroy(address: Address) {
        if (window.confirm(`Hapus alamat "${address.label}"?`)) {
            router.delete(destroyAddress.url({ address: address.id }));
        }
    }

    return (
        <DashboardLayout>
            <Head title="Alamat Saya" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-2xl text-heading">
                            Alamat Saya
                        </h2>
                        <p className="text-sm text-body-subtle">
                            {addresses.length} alamat tersimpan
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="btn btn-brand"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Alamat Baru
                    </button>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    {addresses.length === 0 && (
                        <p className="col-span-full rounded-sm bg-neutral-tertiary-soft px-6 py-12 text-center text-sm text-body-subtle">
                            Belum ada alamat tersimpan.
                        </p>
                    )}
                    {addresses.map((address) => (
                        <article
                            key={address.id}
                            className="card flex flex-col p-6"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <MapPin
                                        size={16}
                                        className="text-fg-brand"
                                        aria-hidden="true"
                                    />
                                    <h3 className="text-base font-bold text-heading">
                                        {address.label}
                                    </h3>
                                    {address.is_default && (
                                        <span className="bg-brand-soft px-2 py-0.5 text-xs font-semibold text-fg-brand-strong">
                                            Utama
                                        </span>
                                    )}
                                </div>
                                {!address.is_default && (
                                    <button
                                        type="button"
                                        onClick={() => setDefault(address)}
                                        className="text-sm font-semibold text-fg-brand no-underline hover:text-fg-brand-strong"
                                    >
                                        Jadikan utama
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 space-y-1 text-sm text-body">
                                <p className="font-semibold text-heading">
                                    {address.recipient_name} · {address.phone}
                                </p>
                                <p>{address.street_address}</p>
                                <p>
                                    {address.subdistrict && (
                                        <>{address.subdistrict}, </>
                                    )}
                                    {address.district}, {address.city}
                                    {address.postal_code &&
                                        ` ${address.postal_code}`}
                                </p>
                                {address.notes && (
                                    <p className="text-body-subtle">
                                        {address.notes}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => openEdit(address)}
                                    className="flex-1 border border-border-default px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-neutral-tertiary-soft"
                                >
                                    Ubah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => destroy(address)}
                                    className="flex-1 border border-danger-strong px-4 py-2.5 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft"
                                >
                                    Hapus
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {modalOpen && (
                <AddressFormModal
                    editing={editing}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </DashboardLayout>
    );
}
