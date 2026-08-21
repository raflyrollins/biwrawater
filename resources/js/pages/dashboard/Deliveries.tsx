import { Head, router } from '@inertiajs/react';
import { Camera, MapPin, PackageCheck } from 'lucide-react';

import { useState } from 'react';

import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { formatDateTime } from '../../lib/format';
import {
    accept,
    depart,
    deliver,
    fail,
    fill,
    reject,
    unload,
} from '../../routes/dashboard/deliveries';
import photos from '../../routes/dashboard/deliveries/photos';

interface DeliveryOrder {
    id: number;
    uuid: string;
    order_number: string;
    address_snapshot: {
        recipient_name: string;
        phone: string;
        street_address: string;
        subdistrict: string;
        district: string;
        city: string;
    };
    status: string;
}

interface DeliveryPhotoItem {
    id: number;
    type: string;
    photo_url: string;
}

interface DeliveryItem {
    id: number;
    uuid: string;
    status: string;
    scheduled_at: string | null;
    filling_started_at: string | null;
    departed_at: string | null;
    delivered_at: string | null;
    note: string | null;
    order: DeliveryOrder;
    truck: { name: string; plate_number: string } | null;
    photos?: DeliveryPhotoItem[];
}

interface DeliveryPageProps {
    active: DeliveryItem[];
    history: DeliveryItem[];
}

const PHOTO_LABELS: Record<string, string> = {
    filling: 'Foto Pengisian (opsional)',
    completion_tank: 'Foto Tangki (wajib)',
    completion_person: 'Foto Penerima (wajib)',
};

function hasPhoto(delivery: DeliveryItem, type: string): boolean {
    return (delivery.photos ?? []).some((photo) => photo.type === type);
}

interface PhotoUploadProps {
    deliveryUuid: string;
    type: string;
    existing: DeliveryPhotoItem[];
}

function PhotoUpload({ deliveryUuid, type, existing }: PhotoUploadProps) {
    const [file, setFile] = useState<File | null>(null);

    function submit() {
        if (!file) {
            return;
        }

        router.post(photos.store.url({ delivery: deliveryUuid }), {
            type,
            photo: file,
        });
        setFile(null);
    }

    return (
        <div className="rounded-sm bg-neutral-tertiary-soft p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-heading">
                <Camera
                    size={14}
                    aria-hidden="true"
                    className="text-fg-brand"
                />
                {PHOTO_LABELS[type] ?? type}
            </p>

            {existing.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {existing.map((photo) => (
                        <img
                            key={photo.id}
                            src={photo.photo_url}
                            alt={PHOTO_LABELS[photo.type] ?? photo.type}
                            className="h-20 w-20 border border-border-default object-cover"
                        />
                    ))}
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                        setFile(event.target.files?.[0] ?? null)
                    }
                    className="text-xs text-body file:mr-3 file:border-0 file:bg-neutral-primary-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-heading"
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={!file}
                    className="btn btn-brand !px-3 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Unggah
                </button>
            </div>
        </div>
    );
}

export default function Deliveries({ active, history }: DeliveryPageProps) {
    useDashboardRealtime({
        events: ['.delivery.status-changed', '.order.status-changed'],
    });

    const confirm = useConfirm();
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);

    function act(url: string) {
        if (pendingUrl !== null) {
            return;
        }

        setPendingUrl(url);
        router.post(url, undefined, { onFinish: () => setPendingUrl(null) });
    }

    async function confirmAct(url: string, message: string) {
        if (pendingUrl !== null) {
            return;
        }

        const confirmed = await confirm({
            title: 'Konfirmasi',
            description: message,
            confirmLabel: 'Ya, Lanjutkan',
        });

        if (confirmed) {
            act(url);
        }
    }

    function renderActions(delivery: DeliveryItem) {
        if (delivery.status === 'scheduled') {
            return (
                <>
                    <button
                        type="button"
                        onClick={() =>
                            act(accept.url({ delivery: delivery.uuid }))
                        }
                        disabled={pendingUrl !== null}
                        className="btn btn-brand flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Terima Tugas
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            confirmAct(
                                reject.url({ delivery: delivery.uuid }),
                                'Tolak tugas pengiriman ini? Pesanan akan dikembalikan ke admin.',
                            )
                        }
                        disabled={pendingUrl !== null}
                        className="border border-danger-strong px-4 py-3 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Tolak
                    </button>
                </>
            );
        }

        if (delivery.status === 'accepted') {
            return (
                <button
                    type="button"
                    onClick={() => act(fill.url({ delivery: delivery.uuid }))}
                    disabled={pendingUrl !== null}
                    className="btn btn-brand flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Mulai Pengisian Air
                </button>
            );
        }

        if (delivery.status === 'filling') {
            return (
                <button
                    type="button"
                    onClick={() => act(depart.url({ delivery: delivery.uuid }))}
                    disabled={pendingUrl !== null}
                    className="btn btn-brand flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Mulai Perjalanan
                </button>
            );
        }

        if (delivery.status === 'on_the_way') {
            return (
                <>
                    <button
                        type="button"
                        onClick={() =>
                            act(unload.url({ delivery: delivery.uuid }))
                        }
                        disabled={pendingUrl !== null}
                        className="btn btn-brand flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Mulai Penurunan
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            confirmAct(
                                fail.url({ delivery: delivery.uuid }),
                                'Tandai pengiriman ini gagal?',
                            )
                        }
                        disabled={pendingUrl !== null}
                        className="border border-danger-strong px-4 py-3 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Gagal
                    </button>
                </>
            );
        }

        if (delivery.status === 'unloading') {
            const ready =
                hasPhoto(delivery, 'completion_tank') &&
                hasPhoto(delivery, 'completion_person');

            return (
                <>
                    <button
                        type="button"
                        onClick={() =>
                            confirmAct(
                                deliver.url({ delivery: delivery.uuid }),
                                'Konfirmasi pengiriman selesai?',
                            )
                        }
                        disabled={!ready || pendingUrl !== null}
                        title={
                            ready
                                ? undefined
                                : 'Unggah foto tangki dan foto penerima terlebih dahulu.'
                        }
                        className="btn btn-brand flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Pengiriman Selesai
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            confirmAct(
                                fail.url({ delivery: delivery.uuid }),
                                'Tandai pengiriman ini gagal?',
                            )
                        }
                        disabled={pendingUrl !== null}
                        className="border border-danger-strong px-4 py-3 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Gagal
                    </button>
                </>
            );
        }

        return null;
    }

    return (
        <DashboardLayout>
            <Head title="Jadwal Pengiriman" />

            <div className="container-dashboard py-8 md:py-12">
                <h2 className="mb-1 text-2xl text-heading">Pengiriman Aktif</h2>
                <p className="mb-8 text-sm text-body-subtle">
                    Terima tugas, isi air, berangkat, turunkan, lalu unggah foto
                    bukti sebelum menyelesaikan pengiriman.
                </p>

                {active.length === 0 ? (
                    <div className="card flex flex-col items-center px-6 py-16 text-center">
                        <PackageCheck
                            size={40}
                            aria-hidden="true"
                            className="text-body-subtle"
                        />
                        <p className="mt-4 font-semibold text-heading">
                            Tidak ada pengiriman aktif
                        </p>
                        <p className="mt-1 text-sm text-body-subtle">
                            Cek kembali jadwal baru dari admin.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {active.map((delivery) => (
                            <div
                                key={delivery.id}
                                className="card flex flex-col p-6"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-mono text-sm font-bold tracking-wider text-fg-brand">
                                            {delivery.order.order_number}
                                        </p>
                                        <p className="mt-0.5 text-xs text-body-subtle">
                                            {delivery.truck
                                                ? `${delivery.truck.name} · ${delivery.truck.plate_number}`
                                                : '-'}
                                        </p>
                                    </div>
                                    <StatusBadge status={delivery.status} />
                                </div>

                                <div className="mt-4 flex items-start gap-3 text-sm text-body">
                                    <MapPin
                                        size={16}
                                        aria-hidden="true"
                                        className="mt-0.5 shrink-0 text-body-subtle"
                                    />
                                    <div>
                                        <p className="font-semibold text-heading">
                                            {
                                                delivery.order.address_snapshot
                                                    .recipient_name
                                            }
                                        </p>
                                        <p>
                                            {
                                                delivery.order.address_snapshot
                                                    .street_address
                                            }
                                        </p>
                                        <p>
                                            {
                                                delivery.order.address_snapshot
                                                    .subdistrict
                                            }
                                            ,{' '}
                                            {
                                                delivery.order.address_snapshot
                                                    .district
                                            }
                                            ,{' '}
                                            {
                                                delivery.order.address_snapshot
                                                    .city
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-border-default pt-4 text-xs text-body-subtle">
                                    <span>
                                        Jadwal:{' '}
                                        <span className="font-semibold text-heading">
                                            {formatDateTime(
                                                delivery.scheduled_at,
                                            )}
                                        </span>
                                    </span>
                                </div>

                                {(delivery.status === 'filling' ||
                                    delivery.status === 'unloading') && (
                                    <div className="mt-4 space-y-3">
                                        {delivery.status === 'filling' && (
                                            <PhotoUpload
                                                deliveryUuid={delivery.uuid}
                                                type="filling"
                                                existing={(
                                                    delivery.photos ?? []
                                                ).filter(
                                                    (photo) =>
                                                        photo.type ===
                                                        'filling',
                                                )}
                                            />
                                        )}
                                        {delivery.status === 'unloading' && (
                                            <>
                                                <PhotoUpload
                                                    deliveryUuid={delivery.uuid}
                                                    type="completion_tank"
                                                    existing={(
                                                        delivery.photos ?? []
                                                    ).filter(
                                                        (photo) =>
                                                            photo.type ===
                                                            'completion_tank',
                                                    )}
                                                />
                                                <PhotoUpload
                                                    deliveryUuid={delivery.uuid}
                                                    type="completion_person"
                                                    existing={(
                                                        delivery.photos ?? []
                                                    ).filter(
                                                        (photo) =>
                                                            photo.type ===
                                                            'completion_person',
                                                    )}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}

                                {delivery.note && (
                                    <p className="mt-4 text-sm text-body">
                                        <span className="font-semibold text-heading">
                                            Catatan:{' '}
                                        </span>
                                        {delivery.note}
                                    </p>
                                )}

                                <div className="mt-auto pt-5">
                                    <div className="flex flex-wrap gap-3">
                                        {renderActions(delivery)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <h2 className="mt-12 mb-1 text-2xl text-heading">Riwayat</h2>
                <p className="mb-8 text-sm text-body-subtle">
                    10 pengiriman terakhir yang selesai atau gagal.
                </p>

                {history.length === 0 ? (
                    <p className="rounded-sm bg-neutral-tertiary-soft px-6 py-12 text-center text-sm text-body-subtle">
                        Belum ada riwayat pengiriman.
                    </p>
                ) : (
                    <div className="card">
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>No. Pesanan</th>
                                        <th>Jadwal</th>
                                        <th>Selesai</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((delivery) => (
                                        <tr key={delivery.id}>
                                            <td className="font-mono text-sm font-semibold text-heading">
                                                {delivery.order.order_number}
                                            </td>
                                            <td>
                                                {formatDateTime(
                                                    delivery.scheduled_at,
                                                )}
                                            </td>
                                            <td>
                                                {formatDateTime(
                                                    delivery.delivered_at ??
                                                        delivery.departed_at,
                                                )}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={delivery.status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
