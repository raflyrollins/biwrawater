import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';

import { useState } from 'react';

import type { FormEvent, ReactNode } from 'react';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import Pagination from '../../../components/dashboard/Pagination';
import type { PaginationLink } from '../../../components/dashboard/Pagination';
import FieldError from '../../../components/public/FieldError';
import DatePicker from '../../../components/ui/DatePicker';
import { combineDateTime, splitDateTime } from '../../../lib/date';
import { formatDate, formatRupiah } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import {
    destroy as destroyPromotion,
    store as storePromotion,
    toggle as togglePromotion,
    update as updatePromotion,
} from '../../../routes/dashboard/promotions';

interface Promotion {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_subtotal: number;
    max_discount_amount: number | null;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
}

interface PromotionsIndexProps {
    promotions: {
        data: Promotion[];
        links: PaginationLink[];
    };
}

interface FormValues {
    name: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: string;
    min_order_subtotal: string;
    max_discount_amount: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
}

const EMPTY_FORM: FormValues = {
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_subtotal: '0',
    max_discount_amount: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
};

function toForm(promotion: Promotion | null): FormValues {
    if (!promotion) {
        return { ...EMPTY_FORM };
    }

    return {
        name: promotion.name,
        description: promotion.description ?? '',
        discount_type: promotion.discount_type,
        discount_value: String(promotion.discount_value),
        min_order_subtotal: String(promotion.min_order_subtotal),
        max_discount_amount:
            promotion.max_discount_amount === null
                ? ''
                : String(promotion.max_discount_amount),
        starts_at: promotion.starts_at.slice(0, 16),
        ends_at: promotion.ends_at ? promotion.ends_at.slice(0, 16) : '',
        is_active: promotion.is_active,
    };
}

interface PromotionFormModalProps {
    editing: Promotion | null;
    onClose: () => void;
}

function PromotionFormModal({ editing, onClose }: PromotionFormModalProps) {
    const { data, setData, errors, processing, post, put, reset } = useForm(
        toForm(editing),
    );

    function submit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            put(updatePromotion.url({ promotion: editing.uuid }));
        } else {
            post(storePromotion.url());
        }
    }

    function close() {
        reset();
        onClose();
    }

    const starts = splitDateTime(data.starts_at);
    const ends = splitDateTime(data.ends_at);

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
                        {editing ? 'Ubah Promosi' : 'Promosi Baru'}
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
                    <div>
                        <label
                            htmlFor="promo-name"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Nama Promosi
                        </label>
                        <input
                            id="promo-name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={cn(
                                'input',
                                errors.name && 'input-error',
                            )}
                            placeholder="cth: Diskon Tahun Baru"
                        />
                        <FieldError message={errors.name} />
                    </div>

                    <div>
                        <label
                            htmlFor="promo-description"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Deskripsi
                        </label>
                        <textarea
                            id="promo-description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            className={cn(
                                'input min-h-24',
                                errors.description && 'input-error',
                            )}
                            placeholder="Syarat & ketentuan singkat"
                        />
                        <FieldError message={errors.description} />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-heading">
                                Jenis Diskon
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData('discount_type', 'percentage')
                                    }
                                    className={cn(
                                        'px-4 py-3 text-sm font-semibold transition-colors',
                                        data.discount_type === 'percentage'
                                            ? 'bg-brand text-white'
                                            : 'bg-neutral-tertiary-soft text-body hover:text-heading',
                                    )}
                                >
                                    Persen
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData('discount_type', 'fixed')
                                    }
                                    className={cn(
                                        'px-4 py-3 text-sm font-semibold transition-colors',
                                        data.discount_type === 'fixed'
                                            ? 'bg-brand text-white'
                                            : 'bg-neutral-tertiary-soft text-body hover:text-heading',
                                    )}
                                >
                                    Rupiah
                                </button>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="promo-value"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                {data.discount_type === 'percentage'
                                    ? 'Persentase'
                                    : 'Nominal Diskon'}
                            </label>
                            <input
                                id="promo-value"
                                type="number"
                                min="1"
                                step={
                                    data.discount_type === 'percentage'
                                        ? '1'
                                        : '1000'
                                }
                                value={data.discount_value}
                                onChange={(e) =>
                                    setData('discount_value', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.discount_value && 'input-error',
                                )}
                            />
                            <FieldError message={errors.discount_value} />
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="promo-min-subtotal"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Minimal Pembelian (Rp)
                            </label>
                            <input
                                id="promo-min-subtotal"
                                type="number"
                                min="0"
                                step="1000"
                                value={data.min_order_subtotal}
                                onChange={(e) =>
                                    setData(
                                        'min_order_subtotal',
                                        e.target.value,
                                    )
                                }
                                className={cn(
                                    'input',
                                    errors.min_order_subtotal && 'input-error',
                                )}
                            />
                            <FieldError message={errors.min_order_subtotal} />
                        </div>

                        <div>
                            <label
                                htmlFor="promo-max-discount"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Maks. Potongan (Rp, opsional)
                            </label>
                            <input
                                id="promo-max-discount"
                                type="number"
                                min="0"
                                step="1000"
                                value={data.max_discount_amount}
                                onChange={(e) =>
                                    setData(
                                        'max_discount_amount',
                                        e.target.value,
                                    )
                                }
                                className={cn(
                                    'input',
                                    errors.max_discount_amount && 'input-error',
                                )}
                            />
                            <FieldError message={errors.max_discount_amount} />
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <DatePicker
                                label="Mulai"
                                value={starts.date}
                                onChange={(value) =>
                                    setData(
                                        'starts_at',
                                        combineDateTime(value, starts.time),
                                    )
                                }
                                error={errors.starts_at}
                                clearable
                            />
                            <div className="mt-3">
                                <label
                                    htmlFor="promo-starts-time"
                                    className="mb-2 block text-sm font-semibold text-heading"
                                >
                                    Waktu
                                </label>
                                <input
                                    id="promo-starts-time"
                                    type="time"
                                    value={starts.time}
                                    onChange={(e) =>
                                        setData(
                                            'starts_at',
                                            combineDateTime(
                                                starts.date,
                                                e.target.value,
                                            ),
                                        )
                                    }
                                    className="input"
                                />
                            </div>
                        </div>

                        <div>
                            <DatePicker
                                label="Berakhir"
                                value={ends.date}
                                onChange={(value) =>
                                    setData(
                                        'ends_at',
                                        combineDateTime(value, ends.time),
                                    )
                                }
                                error={errors.ends_at}
                                clearable
                            />
                            <div className="mt-3">
                                <label
                                    htmlFor="promo-ends-time"
                                    className="mb-2 block text-sm font-semibold text-heading"
                                >
                                    Waktu
                                </label>
                                <input
                                    id="promo-ends-time"
                                    type="time"
                                    value={ends.time}
                                    onChange={(e) =>
                                        setData(
                                            'ends_at',
                                            combineDateTime(
                                                ends.date,
                                                e.target.value,
                                            ),
                                        )
                                    }
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-heading">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) =>
                                setData('is_active', e.target.checked)
                            }
                            className="h-4 w-4"
                        />
                        Aktif
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

function RowValue({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <p className="text-xs text-body-subtle">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-heading">
                {children}
            </p>
        </div>
    );
}

export default function PromotionsIndex({ promotions }: PromotionsIndexProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Promotion | null>(null);

    function openCreate() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(promotion: Promotion) {
        setEditing(promotion);
        setModalOpen(true);
    }

    function toggle(promotion: Promotion) {
        router.post(togglePromotion.url({ promotion: promotion.uuid }));
    }

    function destroy(promotion: Promotion) {
        if (
            window.confirm(
                `Hapus promosi "${promotion.name}"? Pesanan lama tidak terpengaruh.`,
            )
        ) {
            router.delete(destroyPromotion.url({ promotion: promotion.uuid }));
        }
    }

    return (
        <DashboardLayout>
            <Head title="Promosi" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-2xl text-heading">Promosi</h2>
                        <p className="text-sm text-body-subtle">
                            Diskon yang otomatis diterapkan saat checkout.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="btn btn-brand"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Promosi Baru
                    </button>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {promotions.data.length === 0 && (
                        <p className="col-span-full rounded-sm bg-neutral-tertiary-soft px-6 py-12 text-center text-sm text-body-subtle">
                            Belum ada promosi.
                        </p>
                    )}
                    {promotions.data.map((promotion) => (
                        <div
                            key={promotion.id}
                            className="card flex flex-col p-6"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="mb-0 text-lg text-heading">
                                        {promotion.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-body-subtle">
                                        {formatDate(promotion.starts_at)}
                                        {promotion.ends_at &&
                                            ` – ${formatDate(promotion.ends_at)}`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggle(promotion)}
                                    className={cn(
                                        'shrink-0 text-sm font-semibold no-underline',
                                        promotion.is_active
                                            ? 'text-success-strong'
                                            : 'text-body-subtle',
                                    )}
                                >
                                    {promotion.is_active ? 'Aktif' : 'Nonaktif'}
                                </button>
                            </div>

                            {promotion.description && (
                                <p className="mt-3 text-sm text-body">
                                    {promotion.description}
                                </p>
                            )}

                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-default pt-4">
                                <RowValue label="Diskon">
                                    {promotion.discount_type === 'percentage'
                                        ? `${promotion.discount_value}%`
                                        : formatRupiah(
                                              promotion.discount_value,
                                          )}
                                </RowValue>
                                <RowValue label="Min. Pembelian">
                                    {formatRupiah(promotion.min_order_subtotal)}
                                </RowValue>
                                {promotion.max_discount_amount && (
                                    <RowValue label="Maks. Potongan">
                                        {formatRupiah(
                                            promotion.max_discount_amount,
                                        )}
                                    </RowValue>
                                )}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => openEdit(promotion)}
                                    className="flex-1 border border-border-default px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-neutral-tertiary-soft"
                                >
                                    Ubah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => destroy(promotion)}
                                    className="flex-1 border border-danger-strong px-4 py-2.5 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <Pagination links={promotions.links} />
            </div>

            {modalOpen && (
                <PromotionFormModal
                    editing={editing}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </DashboardLayout>
    );
}
