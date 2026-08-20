import { Head, router } from '@inertiajs/react';
import { MapPin, PackageCheck } from 'lucide-react';

import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { formatDateTime } from '../../lib/format';
import { depart, deliver, fail } from '../../routes/dashboard/deliveries';

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

interface DeliveryItem {
    id: number;
    uuid: string;
    status: string;
    scheduled_at: string | null;
    departed_at: string | null;
    delivered_at: string | null;
    order: DeliveryOrder;
    truck: { name: string; plate_number: string } | null;
}

interface DeliveryPageProps {
    active: DeliveryItem[];
    history: DeliveryItem[];
}

export default function Deliveries({ active, history }: DeliveryPageProps) {
    useDashboardRealtime({
        events: ['delivery.status-changed', 'order.status-changed'],
    });

    function markDepart(delivery: DeliveryItem) {
        router.post(depart.url({ delivery: delivery.uuid }));
    }

    function markDeliver(delivery: DeliveryItem) {
        if (window.confirm('Konfirmasi pengiriman selesai?')) {
            router.post(deliver.url({ delivery: delivery.uuid }));
        }
    }

    function markFail(delivery: DeliveryItem) {
        if (window.confirm('Tandai pengiriman ini gagal?')) {
            router.post(fail.url({ delivery: delivery.uuid }));
        }
    }

    return (
        <DashboardLayout>
            <Head title="Jadwal Pengiriman" />

            <div className="container-dashboard py-8 md:py-12">
                <h2 className="mb-1 text-2xl text-heading">Pengiriman Aktif</h2>
                <p className="mb-8 text-sm text-body-subtle">
                    Tugas yang sedang berjalan.
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

                                <div className="mt-5 flex flex-wrap gap-3">
                                    {delivery.status === 'scheduled' && (
                                        <button
                                            type="button"
                                            onClick={() => markDepart(delivery)}
                                            className="btn btn-brand flex-1"
                                        >
                                            Mulai Perjalanan
                                        </button>
                                    )}
                                    {delivery.status === 'on_the_way' && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    markDeliver(delivery)
                                                }
                                                className="btn btn-brand flex-1"
                                            >
                                                Pengiriman Selesai
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    markFail(delivery)
                                                }
                                                className="border border-danger-strong px-4 py-3 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft"
                                            >
                                                Gagal
                                            </button>
                                        </>
                                    )}
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
