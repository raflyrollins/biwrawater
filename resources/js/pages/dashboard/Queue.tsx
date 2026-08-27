import { Head, Link, useForm } from '@inertiajs/react';
import { ListOrdered, Truck, UserRound } from 'lucide-react';

import { useState } from 'react';

import type { FormEvent } from 'react';

import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import FieldError from '../../components/public/FieldError';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { formatDateTime, formatRupiah } from '../../lib/format';
import { show as ordersShow } from '../../routes/dashboard/orders';

interface QueueOrder {
    id: number;
    uuid: string;
    order_number: string;
    grand_total: number;
    delivery_fee: number;
    updated_at: string;
    total_liters: number;
    address_snapshot: Record<string, string>;
    user: { name: string; phone: string | null };
    zone: { name: string; delivery_fee: number } | null;
}

interface TruckUnitDelivery {
    id: number;
    status: string;
    order: { id: number; order_number: string };
    driver: { user: { name: string } } | null;
}

interface AssignedQueueOrder {
    id: number;
    uuid: string;
    order_number: string;
    grand_total: number;
    delivery_fee: number;
    updated_at: string;
    total_liters: number;
    address_snapshot: Record<string, string>;
    user: { name: string; phone: string | null };
    zone: { name: string; delivery_fee: number } | null;
    delivery: {
        id: number;
        status: string;
        scheduled_at: string | null;
        truck: {
            name: string;
            plate_number: string;
            capacity_liters: number;
        } | null;
        driver: { user: { name: string } } | null;
    };
}

interface TruckUnit {
    id: number;
    uuid: string;
    name: string;
    plate_number: string;
    capacity_liters: number;
    status: string;
    default_driver_id: number | null;
    defaultDriver: {
        user: { name: string };
    } | null;
    deliveries_count: number;
    deliveries: TruckUnitDelivery[];
}

interface QueueProps {
    pendingOrders: QueueOrder[];
    assignedOrders: AssignedQueueOrder[];
    truckUnits: TruckUnit[];
}

export default function Queue({
    pendingOrders,
    assignedOrders,
    truckUnits,
}: QueueProps) {
    useDashboardRealtime();
    const [assigningOrder, setAssigningOrder] = useState<QueueOrder | null>(
        null,
    );

    const availableCount = truckUnits.filter(
        (t) => t.status === 'available' && t.default_driver_id !== null,
    ).length;
    const assignedCount = truckUnits.filter(
        (t) => t.status === 'assigned',
    ).length;

    function matchingOrderFor(truck: TruckUnit): QueueOrder | undefined {
        return pendingOrders.find(
            (o) => o.total_liters === truck.capacity_liters,
        );
    }

    return (
        <DashboardLayout>
            <Head title="Antrian Pengiriman" />

            <div className="container-dashboard py-8 md:py-12">
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="card p-5">
                        <div className="flex items-center justify-between text-body-subtle">
                            <p className="label-caps">Menunggu</p>
                            <ListOrdered size={20} aria-hidden="true" />
                        </div>
                        <p className="mt-3 text-2xl font-bold text-heading">
                            {pendingOrders.length}
                        </p>
                    </div>
                    <div className="card p-5">
                        <div className="flex items-center justify-between text-body-subtle">
                            <p className="label-caps">Armada Siap</p>
                            <Truck size={20} aria-hidden="true" />
                        </div>
                        <p className="mt-3 text-2xl font-bold text-heading">
                            {availableCount}
                        </p>
                    </div>
                    <div className="card p-5">
                        <div className="flex items-center justify-between text-body-subtle">
                            <p className="label-caps">Sedang Bertugas</p>
                            <UserRound size={20} aria-hidden="true" />
                        </div>
                        <p className="mt-3 text-2xl font-bold text-heading">
                            {assignedCount}
                        </p>
                    </div>
                </div>

                {/* Truck Units */}
                <div className="mt-8">
                    <h2 className="mb-1 text-xl text-heading">Armada</h2>
                    <p className="mb-4 text-sm text-body-subtle">
                        Truk + driver default. Klik "Tugaskan" untuk menugaskan
                        pesanan berikutnya (FIFO).
                    </p>

                    {truckUnits.length === 0 ? (
                        <div className="card flex flex-col items-center px-6 py-12 text-center">
                            <Truck
                                size={32}
                                aria-hidden="true"
                                className="text-body-subtle"
                            />
                            <p className="mt-3 text-sm text-body-subtle">
                                Belum ada armada.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {truckUnits.map((truck) => (
                                <div
                                    key={truck.id}
                                    className="card flex flex-col p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-mono text-sm font-bold tracking-wider text-heading">
                                                {truck.plate_number}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-body-subtle">
                                                {truck.name} ·{' '}
                                                {truck.capacity_liters.toLocaleString(
                                                    'id-ID',
                                                )}{' '}
                                                L
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 text-xs font-semibold ${
                                                truck.status === 'available'
                                                    ? 'text-success-strong'
                                                    : truck.status ===
                                                        'maintenance'
                                                      ? 'text-warning-strong'
                                                      : 'text-body-subtle'
                                            }`}
                                        >
                                            {truck.status === 'available'
                                                ? 'Tersedia'
                                                : truck.status === 'assigned'
                                                  ? 'Bertugas'
                                                  : 'Perbaikan'}
                                        </span>
                                    </div>

                                    <div className="mt-3 text-sm">
                                        <span className="text-body-subtle">
                                            Driver:{' '}
                                        </span>
                                        <span className="font-semibold text-heading">
                                            {truck.defaultDriver?.user.name ??
                                                '-'}
                                        </span>
                                    </div>

                                    {truck.deliveries_count > 0 && (
                                        <div className="mt-2 text-xs text-body-subtle">
                                            {truck.deliveries_count} tugas aktif
                                        </div>
                                    )}

                                    {truck.deliveries.length > 0 && (
                                        <div className="mt-3 space-y-1.5 border-t border-border-default pt-3">
                                            {truck.deliveries.map((d, i) => (
                                                <div
                                                    key={d.id}
                                                    className="flex items-center gap-2 text-xs"
                                                >
                                                    <span className="inline-flex h-5 w-5 items-center justify-center bg-brand text-[10px] font-bold text-on-brand">
                                                        {i + 1}
                                                    </span>
                                                    <span className="font-semibold text-heading">
                                                        {d.order.order_number}
                                                    </span>
                                                    <span className="text-body-subtle">
                                                        ·{' '}
                                                        {d.driver?.user.name ??
                                                            '-'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-auto pt-4">
                                        {truck.status === 'available' &&
                                        truck.default_driver_id !== null ? (
                                            <button
                                                type="button"
                                                disabled={
                                                    !matchingOrderFor(truck)
                                                }
                                                className="btn btn-brand w-full text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                                onClick={() => {
                                                    const order =
                                                        matchingOrderFor(truck);

                                                    if (order) {
                                                        setAssigningOrder(
                                                            order,
                                                        );
                                                    }
                                                }}
                                            >
                                                Tugaskan Pesanan
                                            </button>
                                        ) : truck.deliveries_count > 0 ? (
                                            <p className="text-center text-xs text-body-subtle">
                                                {truck.deliveries_count} antrean
                                            </p>
                                        ) : !truck.default_driver_id ? (
                                            <p className="text-warning-strong text-center text-xs">
                                                Belum ada driver default
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Orders FIFO */}
                <div className="card mt-8">
                    <div className="border-b border-border-default px-6 py-5">
                        <h2 className="mb-0 text-xl text-heading">
                            Antrian Pesanan
                        </h2>
                        <p className="mt-1 text-sm text-body-subtle">
                            Pesanan diurutkan berdasarkan waktu pembayaran.
                            Paling lama dibayar di atas.
                        </p>
                    </div>

                    {pendingOrders.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-12 text-center">
                            <ListOrdered
                                size={32}
                                aria-hidden="true"
                                className="text-body-subtle"
                            />
                            <p className="mt-3 text-sm text-body-subtle">
                                Tidak ada pesanan dalam antrian.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="w-12">#</th>
                                        <th>No. Pesanan</th>
                                        <th>Pelanggan</th>
                                        <th>Volume</th>
                                        <th>Alamat</th>
                                        <th className="text-right">Total</th>
                                        <th>Dibayar</th>
                                        <th className="text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingOrders.map((order, index) => (
                                        <tr key={order.id}>
                                            <td className="font-semibold text-body-subtle">
                                                {index + 1}
                                            </td>
                                            <td>
                                                <Link
                                                    href={ordersShow.url({
                                                        order: order.uuid,
                                                    })}
                                                    className="font-semibold text-fg-brand no-underline hover:text-fg-brand-strong"
                                                >
                                                    {order.order_number}
                                                </Link>
                                            </td>
                                            <td>
                                                <p className="font-semibold text-heading">
                                                    {order.user.name}
                                                </p>
                                                {order.user.phone && (
                                                    <p className="text-xs text-body-subtle">
                                                        {order.user.phone}
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                <span className="font-semibold text-heading">
                                                    {order.total_liters.toLocaleString(
                                                        'id-ID',
                                                    )}{' '}
                                                    L
                                                </span>
                                            </td>
                                            <td>
                                                <p className="text-sm text-body">
                                                    {order.address_snapshot
                                                        .street_address ?? '-'}
                                                </p>
                                                <p className="text-xs text-body-subtle">
                                                    {[
                                                        order.address_snapshot
                                                            .subdistrict,
                                                        order.address_snapshot
                                                            .district,
                                                        order.address_snapshot
                                                            .city,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ') || '-'}
                                                </p>
                                            </td>
                                            <td className="text-right font-semibold text-heading">
                                                {formatRupiah(
                                                    order.grand_total,
                                                )}
                                            </td>
                                            <td>
                                                <span className="text-sm text-body-subtle">
                                                    {formatDateTime(
                                                        order.updated_at,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAssigningOrder(order)
                                                    }
                                                    disabled={
                                                        availableCount === 0
                                                    }
                                                    className="btn btn-brand text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Tugaskan
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Assigned (pre-assign) status */}
                <div className="card mt-8">
                    <div className="border-b border-border-default px-6 py-5">
                        <h2 className="mb-0 text-xl text-heading">
                            Sudah Ditugaskan
                        </h2>
                        <p className="mt-1 text-sm text-body-subtle">
                            Pesanan sudah di-pre-assign ke armada. Driver
                            otomatis dari armada terkait; belum memulai
                            pengisian sampai tugas dimulai.
                        </p>
                    </div>

                    {assignedOrders.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-12 text-center">
                            <Truck
                                size={32}
                                aria-hidden="true"
                                className="text-body-subtle"
                            />
                            <p className="mt-3 text-sm text-body-subtle">
                                Belum ada pesanan yang ditugaskan.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="w-12">#</th>
                                        <th>No. Pesanan</th>
                                        <th>Volume</th>
                                        <th>Armada</th>
                                        <th>Driver</th>
                                        <th>Status</th>
                                        <th className="text-right">Jadwal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignedOrders.map((order, index) => (
                                        <tr key={order.id}>
                                            <td className="font-semibold text-body-subtle">
                                                {index + 1}
                                            </td>
                                            <td>
                                                <Link
                                                    href={ordersShow.url({
                                                        order: order.uuid,
                                                    })}
                                                    className="font-semibold text-fg-brand no-underline hover:text-fg-brand-strong"
                                                >
                                                    {order.order_number}
                                                </Link>
                                                <p className="text-xs text-body-subtle">
                                                    {order.user.name}
                                                </p>
                                            </td>
                                            <td>
                                                <span className="font-semibold text-heading">
                                                    {order.total_liters.toLocaleString(
                                                        'id-ID',
                                                    )}{' '}
                                                    L
                                                </span>
                                            </td>
                                            <td>
                                                {order.delivery.truck ? (
                                                    <>
                                                        <p className="text-sm font-semibold text-heading">
                                                            {
                                                                order.delivery
                                                                    .truck.name
                                                            }{' '}
                                                            ·{' '}
                                                            {
                                                                order.delivery
                                                                    .truck
                                                                    .plate_number
                                                            }
                                                        </p>
                                                        <p className="text-xs text-body-subtle">
                                                            {order.delivery.truck.capacity_liters.toLocaleString(
                                                                'id-ID',
                                                            )}{' '}
                                                            L
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-body-subtle">
                                                        -
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                <p className="text-sm font-semibold text-heading">
                                                    {order.delivery.driver?.user
                                                        .name ?? '-'}
                                                </p>
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={
                                                        order.delivery.status
                                                    }
                                                />
                                            </td>
                                            <td className="text-right">
                                                <span className="text-xs text-body-subtle">
                                                    {formatDateTime(
                                                        order.delivery
                                                            .scheduled_at,
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick assign modal */}
            {assigningOrder && (
                <QuickAssignModal
                    order={assigningOrder}
                    truckUnits={truckUnits.filter(
                        (t) =>
                            t.status === 'available' &&
                            t.default_driver_id !== null &&
                            t.capacity_liters === assigningOrder.total_liters,
                    )}
                    onClose={() => setAssigningOrder(null)}
                />
            )}
        </DashboardLayout>
    );
}

function QuickAssignModal({
    order,
    truckUnits,
    onClose,
}: {
    order: QueueOrder;
    truckUnits: TruckUnit[];
    onClose: () => void;
}) {
    const { data, setData, errors, processing, post } = useForm({
        truck_id: '',
        note: '',
    });

    const selectedTruck = truckUnits.find(
        (t) => String(t.id) === data.truck_id,
    );
    const driverName = selectedTruck?.defaultDriver?.user.name ?? '-';

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/dashboard/orders/${order.uuid}/assign`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="card w-full max-w-lg p-6">
                <p className="label-caps text-body-subtle">
                    Tugaskan Pengiriman
                </p>
                <p className="mt-2 text-sm text-body">
                    <span className="font-semibold text-heading">
                        {order.order_number}
                    </span>{' '}
                    &mdash; {order.user.name}
                </p>
                <p className="mt-1 text-sm text-body-subtle">
                    Volume:{' '}
                    <span className="font-semibold text-heading">
                        {order.total_liters.toLocaleString('id-ID')} liter
                    </span>
                </p>
                <p className="text-xs text-body-subtle">
                    {order.address_snapshot.street_address}
                    {order.address_snapshot.district &&
                        `, ${order.address_snapshot.district}`}
                    {order.address_snapshot.city &&
                        `, ${order.address_snapshot.city}`}
                </p>

                <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-heading">
                            Armada & Driver
                        </label>
                        <select
                            value={data.truck_id}
                            onChange={(e) =>
                                setData('truck_id', e.target.value)
                            }
                            className="input w-full"
                        >
                            <option value="">Pilih armada</option>
                            {truckUnits.map((truck) => (
                                <option key={truck.id} value={String(truck.id)}>
                                    {truck.name} · {truck.plate_number} (
                                    {truck.capacity_liters.toLocaleString(
                                        'id-ID',
                                    )}{' '}
                                    L) —{' '}
                                    {truck.defaultDriver?.user.name ??
                                        'Tanpa driver'}
                                </option>
                            ))}
                        </select>
                        {truckUnits.length === 0 && (
                            <p className="text-warning-strong mt-1 text-xs">
                                Tidak ada armada yang cocok untuk volume{' '}
                                {order.total_liters.toLocaleString('id-ID')} L
                            </p>
                        )}
                        {errors.truck_id && (
                            <FieldError message={errors.truck_id} />
                        )}
                    </div>

                    {selectedTruck && (
                        <div className="rounded-sm bg-neutral-tertiary-soft px-4 py-3 text-sm">
                            <span className="text-body-subtle">Driver: </span>
                            <span className="font-semibold text-heading">
                                {driverName}
                            </span>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="queue-note"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Catatan (opsional)
                        </label>
                        <input
                            id="queue-note"
                            type="text"
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                            className="input"
                            placeholder="Catatan untuk driver"
                        />
                        <FieldError message={errors.note} />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-semibold text-body-subtle transition-colors hover:text-heading"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.truck_id}
                            className="btn btn-brand disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Tugaskan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
