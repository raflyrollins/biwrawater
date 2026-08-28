import { Head, Link, useForm } from '@inertiajs/react';
import { ListOrdered, Truck } from 'lucide-react';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import FieldError from '../../components/public/FieldError';
import Select from '../../components/ui/Select';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { formatDateTime, formatRupiah } from '../../lib/format';
import type { SelectOption } from '../../lib/types';
import { cn } from '../../lib/utils';
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
            id: number;
            name: string;
            plate_number: string;
            capacity_liters: number;
        } | null;
        driver: { id: number; user: { name: string } } | null;
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

interface TruckUnitDelivery {
    id: number;
    status: string;
    order: { id: number; order_number: string };
    driver: { user: { name: string } } | null;
}

interface DriverOption {
    id: number;
    user_id: number;
    user: { name: string };
}

interface QueueProps {
    pendingOrders: QueueOrder[];
    assignedOrders: AssignedQueueOrder[];
    truckUnits: TruckUnit[];
    drivers: DriverOption[];
}

type QueueTab = 'pending' | 'assigned';

export default function Queue({
    pendingOrders,
    assignedOrders,
    truckUnits,
    drivers,
}: QueueProps) {
    useDashboardRealtime();
    const [activeTab, setActiveTab] = useState<QueueTab>('pending');
    const [capacity, setCapacity] = useState('');
    const [armada, setArmada] = useState('');
    const [driver, setDriver] = useState('');
    const [assigningOrder, setAssigningOrder] = useState<QueueOrder | null>(
        null,
    );

    const capacityOptions: SelectOption[] = useMemo(() => {
        const sizes = new Set<number>();

        truckUnits.forEach((truck) => sizes.add(truck.capacity_liters));
        pendingOrders.forEach((order) => sizes.add(order.total_liters));
        assignedOrders.forEach((order) => {
            if (order.delivery.truck) {
                sizes.add(order.delivery.truck.capacity_liters);
            }
        });

        return [
            { value: '', label: 'Semua Kapasitas' },
            ...[...sizes]
                .sort((a, b) => a - b)
                .map((size) => ({
                    value: String(size),
                    label: `${size.toLocaleString('id-ID')} L`,
                })),
        ];
    }, [truckUnits, pendingOrders, assignedOrders]);

    const armadaOptions: SelectOption[] = useMemo(
        () => [
            { value: '', label: 'Semua Armada' },
            ...truckUnits
                .map((truck) => ({
                    value: String(truck.id),
                    label: `${truck.name} · ${truck.plate_number} (${truck.capacity_liters.toLocaleString('id-ID')} L)`,
                }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        ],
        [truckUnits],
    );

    const driverOptions: SelectOption[] = useMemo(() => {
        const byId = new Map<number, string>();

        drivers.forEach((d) => byId.set(d.id, d.user.name));
        assignedOrders.forEach((order) => {
            if (order.delivery.driver) {
                byId.set(
                    order.delivery.driver.id,
                    order.delivery.driver.user.name,
                );
            }
        });

        return [
            { value: '', label: 'Semua Driver' },
            ...[...byId.entries()]
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([id, name]) => ({
                    value: String(id),
                    label: name,
                })),
        ];
    }, [drivers, assignedOrders]);

    const selectedTruck = useMemo(
        () => truckUnits.find((truck) => String(truck.id) === armada) ?? null,
        [truckUnits, armada],
    );

    const filteredPending = useMemo(
        () =>
            pendingOrders.filter((order) => {
                const requiredSize = selectedTruck
                    ? selectedTruck.capacity_liters
                    : capacity
                      ? Number(capacity)
                      : null;

                if (
                    requiredSize != null &&
                    order.total_liters !== requiredSize
                ) {
                    return false;
                }

                return true;
            }),
        [pendingOrders, capacity, selectedTruck],
    );

    const filteredAssigned = useMemo(
        () =>
            assignedOrders.filter((order) => {
                if (
                    capacity &&
                    (!order.delivery.truck ||
                        order.delivery.truck.capacity_liters !==
                            Number(capacity))
                ) {
                    return false;
                }

                if (
                    armada &&
                    (!order.delivery.truck ||
                        String(order.delivery.truck.id) !== armada)
                ) {
                    return false;
                }

                if (
                    driver &&
                    (!order.delivery.driver ||
                        String(order.delivery.driver.id) !== driver)
                ) {
                    return false;
                }

                return true;
            }),
        [assignedOrders, capacity, armada, driver],
    );

    function hasFit(order: QueueOrder) {
        return truckUnits.some(
            (truck) =>
                truck.status === 'available' &&
                truck.capacity_liters === order.total_liters,
        );
    }

    const tabButton = (tab: QueueTab) =>
        cn(
            'border-b-2 pb-3 text-sm font-semibold transition-colors',
            activeTab === tab
                ? 'border-brand text-heading'
                : 'border-transparent text-body-subtle hover:text-heading',
        );

    return (
        <DashboardLayout>
            <Head title="Antrian Pengiriman" />

            <div className="container-dashboard py-8 md:py-12">
                <div>
                    <h2 className="mb-1 text-2xl text-heading">
                        Antrian Pengiriman
                    </h2>
                    <p className="text-sm text-body-subtle">
                        Kelola pesanan dari antrian sampai ditugaskan ke armada.
                    </p>
                </div>

                <div className="card mt-8 pt-4">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center gap-6 border-b border-border-default px-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('pending')}
                            className={tabButton('pending')}
                        >
                            Antrian Pesanan ({pendingOrders.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('assigned')}
                            className={tabButton('assigned')}
                        >
                            Sudah Ditugaskan ({assignedOrders.length})
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-end gap-4 border-b border-border-default px-6 py-4">
                        <div className="w-52">
                            <Select
                                label="Kapasitas"
                                value={capacity}
                                onChange={(value) => setCapacity(String(value))}
                                options={capacityOptions}
                                placeholder="Semua Kapasitas"
                                searchPlaceholder="Cari kapasitas..."
                            />
                        </div>
                        <div className="w-56">
                            <Select
                                label="Armada"
                                value={armada}
                                onChange={(value) => setArmada(String(value))}
                                options={armadaOptions}
                                placeholder="Semua Armada"
                                searchPlaceholder="Cari armada..."
                            />
                        </div>
                        {activeTab === 'assigned' && (
                            <div className="w-56">
                                <Select
                                    label="Driver"
                                    value={driver}
                                    onChange={(value) =>
                                        setDriver(String(value))
                                    }
                                    options={driverOptions}
                                    placeholder="Semua Driver"
                                    searchPlaceholder="Cari driver..."
                                />
                            </div>
                        )}
                        {activeTab === 'pending' && (
                            <p className="pb-2 text-xs text-body-subtle">
                                Antrian FIFO &mdash; paling lama dibayar di
                                atas. Filter Armada menampilkan pesanan yang
                                muat di armada tersebut.
                            </p>
                        )}
                    </div>

                    {activeTab === 'pending' ? (
                        filteredPending.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-16 text-center">
                                <ListOrdered
                                    size={40}
                                    aria-hidden="true"
                                    className="text-body-subtle"
                                />
                                <p className="mt-4 font-semibold text-heading">
                                    Tidak ada pesanan dalam antrian
                                </p>
                                <p className="mt-1 text-sm text-body-subtle">
                                    Coba ubah filter kapasitas atau armada.
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
                                            <th className="text-right">
                                                Total
                                            </th>
                                            <th>Dibayar</th>
                                            <th className="text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPending.map((order, index) => (
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
                                                            .street_address ??
                                                            '-'}
                                                    </p>
                                                    <p className="text-xs text-body-subtle">
                                                        {[
                                                            order
                                                                .address_snapshot
                                                                .subdistrict,
                                                            order
                                                                .address_snapshot
                                                                .district,
                                                            order
                                                                .address_snapshot
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
                                                            setAssigningOrder(
                                                                order,
                                                            )
                                                        }
                                                        disabled={
                                                            !hasFit(order)
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
                        )
                    ) : filteredAssigned.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <Truck
                                size={40}
                                aria-hidden="true"
                                className="text-body-subtle"
                            />
                            <p className="mt-4 font-semibold text-heading">
                                Tidak ada pesanan ditugaskan
                            </p>
                            <p className="mt-1 text-sm text-body-subtle">
                                Coba ubah filter kapasitas, armada, atau driver.
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
                                    {filteredAssigned.map((order, index) => (
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
                        (truck) =>
                            truck.status === 'available' &&
                            truck.capacity_liters ===
                                assigningOrder.total_liters,
                    )}
                    drivers={drivers}
                    onClose={() => setAssigningOrder(null)}
                />
            )}
        </DashboardLayout>
    );
}

function QuickAssignModal({
    order,
    truckUnits,
    drivers,
    onClose,
}: {
    order: QueueOrder;
    truckUnits: TruckUnit[];
    drivers: DriverOption[];
    onClose: () => void;
}) {
    const { data, setData, errors, processing, post } = useForm({
        truck_id: '',
        driver_id: '',
        note: '',
    });

    const selectedTruck = truckUnits.find(
        (truck) => String(truck.id) === data.truck_id,
    );
    const defaultDriverName = selectedTruck?.defaultDriver?.user.name ?? null;

    const truckOptions: SelectOption[] = useMemo(
        () =>
            truckUnits.map((truck) => ({
                value: String(truck.id),
                label: `${truck.name} · ${truck.plate_number} (${truck.capacity_liters.toLocaleString('id-ID')} L)`,
            })),
        [truckUnits],
    );

    const driverOptions: SelectOption[] = useMemo(
        () =>
            drivers.map((driver) => ({
                value: String(driver.id),
                label:
                    driver.user.name +
                    (selectedTruck?.default_driver_id === driver.id
                        ? ' (Default)'
                        : ''),
            })),
        [drivers, selectedTruck],
    );

    function selectTruck(truckId: string) {
        setData('truck_id', truckId);
        const truck = truckUnits.find((unit) => String(unit.id) === truckId);
        const defaultDriverId = truck?.default_driver_id;

        setData(
            'driver_id',
            defaultDriverId != null ? String(defaultDriverId) : '',
        );
    }

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
                        <Select
                            label="Armada"
                            value={data.truck_id}
                            onChange={(value) => selectTruck(String(value))}
                            options={truckOptions}
                            placeholder="Pilih armada"
                            searchPlaceholder="Cari armada..."
                            error={errors.truck_id}
                        />
                        {truckUnits.length === 0 && (
                            <p className="text-warning-strong mt-1 text-xs">
                                Tidak ada armada yang cocok untuk volume{' '}
                                {order.total_liters.toLocaleString('id-ID')} L
                            </p>
                        )}
                    </div>

                    <div>
                        <Select
                            label="Driver"
                            value={data.driver_id}
                            onChange={(value) =>
                                setData('driver_id', String(value))
                            }
                            options={driverOptions}
                            placeholder={
                                defaultDriverName
                                    ? `Driver default (${defaultDriverName})`
                                    : 'Pilih driver'
                            }
                            searchPlaceholder="Cari driver..."
                            disabled={!selectedTruck}
                            error={errors.driver_id}
                        />
                        <p className="mt-1 text-xs text-body-subtle">
                            Pilihan pertama memakai driver default truk.
                        </p>
                    </div>

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
