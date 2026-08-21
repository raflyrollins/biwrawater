import { Head, router, useForm } from '@inertiajs/react';
import { Dices, Plus, X } from 'lucide-react';

import { useState } from 'react';

import type { FormEvent, ReactNode } from 'react';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import Pagination from '../../../components/dashboard/Pagination';
import type { PaginationLink } from '../../../components/dashboard/Pagination';
import FieldError from '../../../components/public/FieldError';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import DatePicker from '../../../components/ui/DatePicker';
import { combineDateTime, splitDateTime } from '../../../lib/date';
import { formatDate, formatRupiah } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import {
    destroy as destroyPromoCode,
    store as storePromoCode,
    toggle as togglePromoCode,
    update as updatePromoCode,
} from '../../../routes/dashboard/promo-codes';

interface PromoCode {
    id: number;
    uuid: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_subtotal: number;
    max_discount_amount: number | null;
    max_uses: number | null;
    used_count: number;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    creator: { id: number; name: string } | null;
}

interface PromoCodesIndexProps {
    promoCodes: {
        data: PromoCode[];
        links: PaginationLink[];
        total: number;
    };
}

interface FormValues {
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: string;
    min_order_subtotal: string;
    max_discount_amount: string;
    max_uses: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
}

const EMPTY_FORM: FormValues = {
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_subtotal: '0',
    max_discount_amount: '',
    max_uses: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
};

function toForm(promoCode: PromoCode | null): FormValues {
    if (!promoCode) {
        return { ...EMPTY_FORM };
    }

    return {
        code: promoCode.code,
        description: promoCode.description ?? '',
        discount_type: promoCode.discount_type,
        discount_value: String(promoCode.discount_value),
        min_order_subtotal: String(promoCode.min_order_subtotal),
        max_discount_amount:
            promoCode.max_discount_amount === null
                ? ''
                : String(promoCode.max_discount_amount),
        max_uses: promoCode.max_uses === null ? '' : String(promoCode.max_uses),
        starts_at: promoCode.starts_at ? promoCode.starts_at.slice(0, 16) : '',
        ends_at: promoCode.ends_at ? promoCode.ends_at.slice(0, 16) : '',
        is_active: promoCode.is_active,
    };
}

function generateCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BWR';

    for (let i = 0; i < 4; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return code;
}

interface PromoCodeFormModalProps {
    editing: PromoCode | null;
    onClose: () => void;
}

function PromoCodeFormModal({ editing, onClose }: PromoCodeFormModalProps) {
    const { data, setData, errors, processing, post, put, reset } = useForm(
        toForm(editing),
    );

    function submit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            put(updatePromoCode.url({ promoCode: editing.uuid }));
        } else {
            post(storePromoCode.url());
        }
    }

    function close() {
        reset();
        onClose();
    }

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
                        {editing ? 'Ubah Kode Promo' : 'Kode Promo Baru'}
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
                            htmlFor="code-input"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Kode
                        </label>
                        <div className="flex gap-3">
                            <input
                                id="code-input"
                                type="text"
                                value={data.code}
                                onChange={(e) =>
                                    setData(
                                        'code',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                className={cn(
                                    'input flex-1 font-mono uppercase',
                                    errors.code && 'input-error',
                                )}
                                placeholder="cth: BWR10"
                            />
                            {!editing && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData('code', generateCode())
                                    }
                                    className="border border-border-default px-4 text-sm font-semibold text-body transition-colors hover:bg-neutral-tertiary-soft"
                                    title="Generate kode acak"
                                >
                                    <Dices size={18} aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <FieldError message={errors.code} />
                    </div>

                    <div>
                        <label
                            htmlFor="code-description"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Deskripsi
                        </label>
                        <textarea
                            id="code-description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            className={cn(
                                'input min-h-20',
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
                                htmlFor="code-value"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                {data.discount_type === 'percentage'
                                    ? 'Persentase'
                                    : 'Nominal Diskon'}
                            </label>
                            <input
                                id="code-value"
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
                                htmlFor="code-min-subtotal"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Minimal Pembelian (Rp)
                            </label>
                            <input
                                id="code-min-subtotal"
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
                                htmlFor="code-max-discount"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Maks. Potongan (Rp, opsional)
                            </label>
                            <input
                                id="code-max-discount"
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
                            <label
                                htmlFor="code-max-uses"
                                className="mb-2 block text-sm font-semibold text-heading"
                            >
                                Maks. Pemakaian (opsional)
                            </label>
                            <input
                                id="code-max-uses"
                                type="number"
                                min="1"
                                value={data.max_uses}
                                onChange={(e) =>
                                    setData('max_uses', e.target.value)
                                }
                                className={cn(
                                    'input',
                                    errors.max_uses && 'input-error',
                                )}
                                placeholder="Tanpa batas"
                            />
                            <FieldError message={errors.max_uses} />
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
                                    htmlFor="code-ends-time"
                                    className="mb-2 block text-sm font-semibold text-heading"
                                >
                                    Waktu
                                </label>
                                <input
                                    id="code-ends-time"
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

export default function PromoCodesIndex({ promoCodes }: PromoCodesIndexProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<PromoCode | null>(null);

    function openCreate() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(promoCode: PromoCode) {
        setEditing(promoCode);
        setModalOpen(true);
    }

    function toggle(promoCode: PromoCode) {
        router.post(togglePromoCode.url({ promoCode: promoCode.uuid }));
    }

    const confirm = useConfirm();

    async function destroy(promoCode: PromoCode) {
        const confirmed = await confirm({
            title: 'Hapus kode promo?',
            description: `Kode promo ${promoCode.code} akan dihapus.`,
            confirmLabel: 'Ya, Hapus',
            tone: 'danger',
        });

        if (confirmed) {
            router.delete(destroyPromoCode.url({ promoCode: promoCode.uuid }));
        }
    }

    return (
        <DashboardLayout>
            <Head title="Kode Promo" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-2xl text-heading">
                            Kode Promo
                        </h2>
                        <p className="text-sm text-body-subtle">
                            {promoCodes.total} kode terdaftar
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="btn btn-brand"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Kode Baru
                    </button>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {promoCodes.data.length === 0 && (
                        <p className="col-span-full rounded-sm bg-neutral-tertiary-soft px-6 py-12 text-center text-sm text-body-subtle">
                            Belum ada kode promo.
                        </p>
                    )}
                    {promoCodes.data.map((promoCode) => (
                        <div
                            key={promoCode.id}
                            className="card flex flex-col p-6"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-mono text-lg font-bold tracking-wider text-heading">
                                        {promoCode.code}
                                    </h3>
                                    <p className="mt-1 text-sm text-body-subtle">
                                        {promoCode.description ??
                                            (promoCode.creator
                                                ? `Dibuat oleh ${promoCode.creator.name}`
                                                : '-')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggle(promoCode)}
                                    className={cn(
                                        'shrink-0 text-sm font-semibold no-underline',
                                        promoCode.is_active
                                            ? 'text-success-strong'
                                            : 'text-body-subtle',
                                    )}
                                >
                                    {promoCode.is_active ? 'Aktif' : 'Nonaktif'}
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-default pt-4">
                                <RowValue label="Diskon">
                                    {promoCode.discount_type === 'percentage'
                                        ? `${promoCode.discount_value}%`
                                        : formatRupiah(
                                              promoCode.discount_value,
                                          )}
                                </RowValue>
                                <RowValue label="Min. Pembelian">
                                    {formatRupiah(promoCode.min_order_subtotal)}
                                </RowValue>
                                <RowValue label="Pemakaian">
                                    {promoCode.max_uses === null
                                        ? `${promoCode.used_count}×`
                                        : `${promoCode.used_count} / ${promoCode.max_uses}×`}
                                </RowValue>
                                <RowValue label="Berlaku">
                                    {promoCode.ends_at
                                        ? `s.d. ${formatDate(promoCode.ends_at)}`
                                        : 'Tanpa batas'}
                                </RowValue>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => openEdit(promoCode)}
                                    className="flex-1 border border-border-default px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-neutral-tertiary-soft"
                                >
                                    Ubah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => destroy(promoCode)}
                                    className="flex-1 border border-danger-strong px-4 py-2.5 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <Pagination links={promoCodes.links} />
            </div>

            {modalOpen && (
                <PromoCodeFormModal
                    editing={editing}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </DashboardLayout>
    );
}
