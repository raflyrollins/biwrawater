import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    MapPin,
    ShieldCheck,
    Truck,
} from 'lucide-react';

import { useState } from 'react';

import type { FormEvent } from 'react';

import FieldError from '../components/public/FieldError';
import { formatRupiah } from '../lib/format';
import { cn } from '../lib/utils';
import { home } from '../routes';
import {
    promo as checkoutPromo,
    store as checkoutStore,
} from '../routes/checkout';

interface Service {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    volume_liters: number | null;
    price: number;
}

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

interface Promotion {
    id: number;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_total: number;
}

interface PromoPreview {
    name: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_discount_amount: number | null;
    discount_total: number;
}

interface CheckoutProps {
    services: Service[];
    addresses: Address[];
    promotions: Promotion[];
    promo_preview?: PromoPreview | null;
}

interface CheckoutFormValues {
    service_id: string;
    address_id: string;
    label: string;
    recipient_name: string;
    phone: string;
    street_address: string;
    district: string;
    subdistrict: string;
    city: string;
    postal_code: string;
    notes: string;
    promo_code: string;
    customer_note: string;
}

const EMPTY_NEW_ADDRESS = {
    label: '',
    recipient_name: '',
    phone: '',
    street_address: '',
    district: '',
    subdistrict: '',
    city: '',
    postal_code: '',
    notes: '',
};

export default function Checkout({
    services,
    addresses,
    promotions,
    promo_preview,
}: CheckoutProps) {
    const { data, setData, errors, processing, post } =
        useForm<CheckoutFormValues>({
            service_id: services[0] ? String(services[0].id) : '',
            address_id: addresses[0] ? String(addresses[0].id) : '',
            ...EMPTY_NEW_ADDRESS,
            promo_code: '',
            customer_note: '',
        });
    const [usingNewAddress, setUsingNewAddress] = useState(
        addresses.length === 0,
    );

    function toggleAddressMode() {
        setUsingNewAddress((value) => {
            setData(
                'address_id',
                value ? (addresses[0] ? String(addresses[0].id) : '') : '',
            );

            return !value;
        });
    }

    const selectedService =
        services.find((service) => String(service.id) === data.service_id) ??
        null;

    const appliedPromo =
        promo_preview && promo_preview.code === data.promo_code.trim()
            ? promo_preview
            : null;
    const grandTotal = selectedService
        ? selectedService.price - (appliedPromo?.discount_total ?? 0)
        : 0;

    function checkPromo() {
        if (!selectedService || data.promo_code.trim() === '') {
            return;
        }

        router.post(
            checkoutPromo.url(),
            {
                service_id: data.service_id,
                promo_code: data.promo_code,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post(checkoutStore.url());
    }

    return (
        <div className="min-h-dvh bg-neutral-primary-soft">
            <Head title="Pesan Air Tangki" />

            <header className="border-b border-border-default bg-white/70">
                <div className="container-section flex h-16 items-center justify-between">
                    <Link
                        href={home.url()}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-brand no-underline hover:text-fg-brand-strong"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        Beranda
                    </Link>
                    <p className="text-base font-bold text-heading">
                        Pesan Air Tangki
                    </p>
                    <span aria-hidden="true" />
                </div>
            </header>

            <main className="container-section py-8 md:py-12">
                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Pilih tangki */}
                        <section className="card p-6">
                            <p className="label-caps text-body-subtle">
                                1. Pilih Tangki
                            </p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                {services.map((service) => {
                                    const active =
                                        String(service.id) === data.service_id;

                                    return (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    'service_id',
                                                    String(service.id),
                                                )
                                            }
                                            className={cn(
                                                'relative flex flex-col items-start gap-3 border p-5 text-left transition-colors',
                                                active
                                                    ? 'border-brand bg-brand-soft'
                                                    : 'border-border-default bg-white hover:bg-neutral-tertiary-soft',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'flex size-11 items-center justify-center',
                                                    active
                                                        ? 'bg-brand text-on-brand'
                                                        : 'bg-brand-softer text-fg-brand-strong',
                                                )}
                                            >
                                                <Truck
                                                    size={22}
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <span>
                                                <span className="block text-base font-bold text-heading">
                                                    {service.name}
                                                </span>
                                                {service.volume_liters && (
                                                    <span className="block text-sm text-body-subtle">
                                                        {service.volume_liters.toLocaleString(
                                                            'id-ID',
                                                        )}{' '}
                                                        liter
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-lg font-bold text-heading">
                                                {formatRupiah(service.price)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <FieldError message={errors.service_id} />
                        </section>

                        {/* Alamat pengiriman */}
                        <section className="card p-6">
                            <div className="flex items-center justify-between gap-3">
                                <p className="label-caps text-body-subtle">
                                    2. Alamat Pengiriman
                                </p>
                                {addresses.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => toggleAddressMode()}
                                        className="text-sm font-semibold text-fg-brand no-underline hover:text-fg-brand-strong"
                                    >
                                        {usingNewAddress
                                            ? 'Pakai alamat tersimpan'
                                            : 'Pakai alamat baru'}
                                    </button>
                                )}
                            </div>

                            {!usingNewAddress ? (
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    {addresses.map((address) => {
                                        const active =
                                            data.address_id ===
                                            String(address.id);

                                        return (
                                            <button
                                                key={address.id}
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        'address_id',
                                                        String(address.id),
                                                    )
                                                }
                                                className={cn(
                                                    'relative flex flex-col items-start gap-1 border p-5 text-left transition-colors',
                                                    active
                                                        ? 'border-brand bg-brand-soft'
                                                        : 'border-border-default bg-white hover:bg-neutral-tertiary-soft',
                                                )}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <MapPin
                                                        size={16}
                                                        className={
                                                            active
                                                                ? 'text-fg-brand-strong'
                                                                : 'text-body-subtle'
                                                        }
                                                        aria-hidden="true"
                                                    />
                                                    <span className="text-sm font-bold text-heading">
                                                        {address.label}
                                                    </span>
                                                    {address.is_default && (
                                                        <span className="bg-brand-soft px-2 py-0.5 text-xs font-semibold text-fg-brand-strong">
                                                            Utama
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-sm font-semibold text-heading">
                                                    {address.recipient_name} ·{' '}
                                                    {address.phone}
                                                </span>
                                                <span className="text-sm text-body-subtle">
                                                    {address.street_address}
                                                </span>
                                                <span className="text-sm text-body-subtle">
                                                    {address.subdistrict && (
                                                        <>
                                                            {
                                                                address.subdistrict
                                                            }
                                                            ,{' '}
                                                        </>
                                                    )}
                                                    {address.district},{' '}
                                                    {address.city}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                                                setData(
                                                    'recipient_name',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                'input',
                                                errors.recipient_name &&
                                                    'input-error',
                                            )}
                                            placeholder="Nama lengkap"
                                        />
                                        <FieldError
                                            message={errors.recipient_name}
                                        />
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
                                                setData(
                                                    'street_address',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                'input',
                                                errors.street_address &&
                                                    'input-error',
                                            )}
                                            placeholder="Jalan, nomor, RT/RW"
                                        />
                                        <FieldError
                                            message={errors.street_address}
                                        />
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
                                                setData(
                                                    'district',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                'input',
                                                errors.district &&
                                                    'input-error',
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
                                                setData(
                                                    'subdistrict',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                'input',
                                                errors.subdistrict &&
                                                    'input-error',
                                            )}
                                        />
                                        <FieldError
                                            message={errors.subdistrict}
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
                                                setData(
                                                    'postal_code',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                'input',
                                                errors.postal_code &&
                                                    'input-error',
                                            )}
                                        />
                                        <FieldError
                                            message={errors.postal_code}
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
                                            className={cn(
                                                'input',
                                                errors.notes && 'input-error',
                                            )}
                                            placeholder="cth: dekat masjid, gerbang kuning"
                                        />
                                        <FieldError message={errors.notes} />
                                    </div>
                                </div>
                            )}
                            <FieldError message={errors.address_id} />
                        </section>

                        {/* Catatan */}
                        <section className="card p-6">
                            <label
                                htmlFor="customer-note"
                                className="label-caps block text-body-subtle"
                            >
                                3. Catatan (opsional)
                            </label>
                            <textarea
                                id="customer-note"
                                value={data.customer_note}
                                onChange={(e) =>
                                    setData('customer_note', e.target.value)
                                }
                                className={cn(
                                    'input mt-4 min-h-24',
                                    errors.customer_note && 'input-error',
                                )}
                                placeholder="Catatan untuk admin atau driver"
                            />
                            <FieldError message={errors.customer_note} />
                        </section>
                    </div>

                    <aside className="h-fit space-y-6 lg:sticky lg:top-8">
                        <div className="card p-6">
                            <p className="label-caps text-body-subtle">
                                Ringkasan Pesanan
                            </p>

                            <div className="mt-4 space-y-3 text-sm">
                                <div className="flex justify-between gap-3">
                                    <span className="text-body-subtle">
                                        Layanan
                                    </span>
                                    <span className="text-right font-semibold text-heading">
                                        {selectedService?.name ?? '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-body-subtle">
                                        Harga
                                    </span>
                                    <span className="font-semibold text-heading">
                                        {selectedService
                                            ? formatRupiah(
                                                  selectedService.price,
                                              )
                                            : '-'}
                                    </span>
                                </div>
                                {appliedPromo && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-body-subtle">
                                            Diskon kupon{' '}
                                            <span className="font-mono">
                                                {appliedPromo.code}
                                            </span>
                                        </span>
                                        <span className="font-semibold text-success-strong">
                                            -
                                            {formatRupiah(
                                                appliedPromo.discount_total,
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between gap-3 border-t border-border-default pt-3 text-base font-bold">
                                    <span className="text-heading">Total</span>
                                    <span className="text-heading">
                                        {selectedService
                                            ? formatRupiah(grandTotal)
                                            : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label
                                    htmlFor="promo-code"
                                    className="mb-2 block text-sm font-semibold text-heading"
                                >
                                    Kode Promo
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="promo-code"
                                        type="text"
                                        value={data.promo_code}
                                        onChange={(e) =>
                                            setData(
                                                'promo_code',
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                checkPromo();
                                            }
                                        }}
                                        className={cn(
                                            'input min-w-0 flex-1 font-mono uppercase',
                                            errors.promo_code && 'input-error',
                                        )}
                                        placeholder="cth: BWR10"
                                    />
                                    <button
                                        type="button"
                                        onClick={checkPromo}
                                        disabled={
                                            processing ||
                                            !selectedService ||
                                            data.promo_code.trim() === ''
                                        }
                                        className="btn btn-white shrink-0"
                                    >
                                        Cek Kupon
                                    </button>
                                </div>
                                {appliedPromo && !errors.promo_code && (
                                    <div
                                        role="status"
                                        className="mt-2 flex items-start gap-2 border border-border-default bg-success-soft px-3 py-2 text-sm leading-5 text-success-strong"
                                    >
                                        <CheckCircle2
                                            size={16}
                                            className="mt-0.5 shrink-0"
                                            aria-hidden="true"
                                        />
                                        <span>
                                            Kupon{' '}
                                            <span className="font-mono font-semibold">
                                                {appliedPromo.code}
                                            </span>{' '}
                                            aktif — hemat{' '}
                                            {formatRupiah(
                                                appliedPromo.discount_total,
                                            )}
                                        </span>
                                    </div>
                                )}
                                <FieldError message={errors.promo_code} />
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !selectedService}
                                className="btn btn-brand mt-6 w-full"
                            >
                                {processing
                                    ? 'Membuat pesanan...'
                                    : 'Buat Pesanan'}
                            </button>

                            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-body-subtle">
                                <ShieldCheck
                                    size={14}
                                    className="mt-0.5 shrink-0 text-success-strong"
                                    aria-hidden="true"
                                />
                                Pembayaran hanya dapat dilakukan setelah pesanan
                                dikonfirmasi admin, melalui Midtrans.
                            </p>
                        </div>

                        {promotions.length > 0 && (
                            <div className="card p-6">
                                <p className="label-caps text-body-subtle">
                                    Promo Berjalan
                                </p>
                                <ul className="mt-4 space-y-3">
                                    {promotions.map((promotion) => (
                                        <li
                                            key={promotion.id}
                                            className="text-sm text-body"
                                        >
                                            <span className="font-semibold text-heading">
                                                {promotion.type === 'percentage'
                                                    ? `${promotion.value}%`
                                                    : formatRupiah(
                                                          promotion.value,
                                                      )}
                                            </span>{' '}
                                            — {promotion.name}
                                            {promotion.min_order_total > 0 && (
                                                <span className="block text-xs text-body-subtle">
                                                    Min. pembelian{' '}
                                                    {formatRupiah(
                                                        promotion.min_order_total,
                                                    )}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="card flex items-start gap-3 p-6">
                            <Truck
                                size={20}
                                className="mt-0.5 shrink-0 text-fg-brand"
                                aria-hidden="true"
                            />
                            <p className="text-sm leading-relaxed text-body">
                                Setiap pesanan{' '}
                                <span className="font-semibold text-heading">
                                    1 tangki
                                </span>
                                . Pesanan Anda masuk antrian pengiriman setelah
                                admin mengonfirmasi.
                            </p>
                        </div>
                    </aside>
                </form>
            </main>
        </div>
    );
}
