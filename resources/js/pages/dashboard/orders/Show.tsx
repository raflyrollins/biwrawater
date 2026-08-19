import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import AssignDeliveryForm from '../../../components/dashboard/AssignDeliveryForm';
import type {
    AssignDriver,
    AssignTruck,
} from '../../../components/dashboard/AssignDeliveryForm';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { formatDateTime, formatRupiah } from '../../../lib/format';
import { index as dashboardIndex } from '../../../routes/dashboard';
import {
    cancel as ordersCancel,
    index as ordersIndex,
} from '../../../routes/dashboard/orders';
import {
    depart,
    deliver,
    fail,
} from '../../../routes/dashboard/orders/delivery';

interface OrderItem {
    service_name: string;
    volume_liters: number | null;
    quantity: number;
    unit_price: number;
    line_total: number;
}

interface OrderDetail {
    id: number;
    uuid: string;
    order_number: string;
    status: string;
    payment_method: string;
    payment_status: string;
    subtotal: number;
    discount_total: number;
    grand_total: number;
    customer_note: string | null;
    created_at: string;
    address_snapshot: Record<string, string>;
    user: { name: string; email: string; phone: string | null };
    items: OrderItem[];
    delivery: {
        id: number;
        uuid: string;
        status: string;
        scheduled_at: string | null;
        departed_at: string | null;
        delivered_at: string | null;
        note: string | null;
        truck: { name: string; plate_number: string } | null;
        driver: { user: { name: string; phone: string | null } } | null;
    } | null;
    payments: {
        id: number;
        method: string;
        amount: number;
        status: string;
        paid_at: string | null;
    }[];
}

interface OrderShowProps {
    order: OrderDetail;
    assignOptions: {
        trucks: AssignTruck[];
        drivers: AssignDriver[];
    };
}

interface PageProps {
    auth: {
        permissions: string[];
    };
    [key: string]: unknown;
}

export default function OrderShow({ order, assignOptions }: OrderShowProps) {
    const { auth } = usePage<PageProps>().props;
    const delivery = order.delivery;
    const permissions = new Set(auth.permissions);
    const isAdmin = permissions.has('dashboard.view');

    function action(url: string) {
        router.post(url);
    }

    function confirmAction(url: string, message: string) {
        if (window.confirm(message)) {
            router.post(url);
        }
    }

    return (
        <DashboardLayout>
            <Head title={`Pesanan ${order.order_number}`} />

            <div className="container-dashboard py-8 md:py-12">
                <Link
                    href={isAdmin ? ordersIndex.url() : dashboardIndex.url()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-brand no-underline hover:text-fg-brand-strong"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    {isAdmin ? 'Semua Pesanan' : 'Kembali ke dashboard'}
                </Link>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-2xl text-heading">
                            {order.order_number}
                        </h2>
                        <p className="text-sm text-body-subtle">
                            Dipesan {formatDateTime(order.created_at)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        <StatusBadge status={order.payment_status} />
                    </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Assign form / delivery status */}
                        {order.status === 'pending' &&
                            permissions.has('orders.assign') && (
                                <AssignDeliveryForm
                                    orderUuid={order.uuid}
                                    trucks={assignOptions.trucks}
                                    drivers={assignOptions.drivers}
                                />
                            )}

                        {delivery ? (
                            <div className="card p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="label-caps text-body-subtle">
                                        Pengiriman
                                    </p>
                                    <StatusBadge status={delivery.status} />
                                </div>

                                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-body-subtle">
                                            Armada
                                        </p>
                                        <p className="mt-1 font-semibold text-heading">
                                            {delivery.truck
                                                ? `${delivery.truck.name} · ${delivery.truck.plate_number}`
                                                : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-body-subtle">
                                            Driver
                                        </p>
                                        <p className="mt-1 font-semibold text-heading">
                                            {delivery.driver?.user.name ?? '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-body-subtle">
                                            Jadwal
                                        </p>
                                        <p className="mt-1 font-semibold text-heading">
                                            {formatDateTime(
                                                delivery.scheduled_at,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-body-subtle">
                                            Selesai
                                        </p>
                                        <p className="mt-1 font-semibold text-heading">
                                            {formatDateTime(
                                                delivery.delivered_at,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {delivery.note && (
                                    <p className="mt-4 border-t border-border-default pt-4 text-sm text-body">
                                        <span className="font-semibold text-heading">
                                            Catatan:{' '}
                                        </span>
                                        {delivery.note}
                                    </p>
                                )}

                                {permissions.has(
                                    'deliveries.update-status',
                                ) && (
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        {delivery.status === 'scheduled' && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    action(
                                                        depart.url({
                                                            order: order.uuid,
                                                            delivery:
                                                                delivery.uuid,
                                                        }),
                                                    )
                                                }
                                                className="btn btn-brand"
                                            >
                                                Tandai Berangkat
                                            </button>
                                        )}
                                        {delivery.status === 'on_the_way' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        confirmAction(
                                                            deliver.url({
                                                                order: order.uuid,
                                                                delivery:
                                                                    delivery.uuid,
                                                            }),
                                                            'Tandai pengiriman selesai?',
                                                        )
                                                    }
                                                    className="btn btn-brand"
                                                >
                                                    Tandai Selesai
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        confirmAction(
                                                            fail.url({
                                                                order: order.uuid,
                                                                delivery:
                                                                    delivery.uuid,
                                                            }),
                                                            'Tandai pengiriman gagal?',
                                                        )
                                                    }
                                                    className="border border-danger-strong px-4 py-3 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft"
                                                >
                                                    Gagal
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            !isAdmin && (
                                <div className="card p-6">
                                    <p className="label-caps text-body-subtle">
                                        Pengiriman
                                    </p>
                                    <p className="mt-4 text-sm text-body-subtle">
                                        Menunggu konfirmasi admin.
                                    </p>
                                </div>
                            )
                        )}

                        <div className="card p-6">
                            <p className="label-caps text-body-subtle">
                                Detail Pesanan
                            </p>
                            <div className="table-wrap mt-4">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Layanan</th>
                                            <th className="text-right">
                                                Jumlah
                                            </th>
                                            <th className="text-right">
                                                Harga
                                            </th>
                                            <th className="text-right">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    {item.service_name}
                                                    {item.volume_liters && (
                                                        <span className="block text-xs text-body-subtle">
                                                            {item.volume_liters.toLocaleString(
                                                                'id-ID',
                                                            )}{' '}
                                                            liter
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    {item.quantity}
                                                </td>
                                                <td className="text-right">
                                                    {formatRupiah(
                                                        item.unit_price,
                                                    )}
                                                </td>
                                                <td className="text-right font-semibold text-heading">
                                                    {formatRupiah(
                                                        item.line_total,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 space-y-2 border-t border-border-default pt-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-body-subtle">
                                        Subtotal
                                    </span>
                                    <span className="text-heading">
                                        {formatRupiah(order.subtotal)}
                                    </span>
                                </div>
                                {order.discount_total > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-body-subtle">
                                            Diskon
                                        </span>
                                        <span className="font-semibold text-success-strong">
                                            -
                                            {formatRupiah(order.discount_total)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-bold">
                                    <span className="text-heading">Total</span>
                                    <span className="text-heading">
                                        {formatRupiah(order.grand_total)}
                                    </span>
                                </div>
                            </div>

                            {order.customer_note && (
                                <p className="mt-6 border-t border-border-default pt-4 text-sm text-body">
                                    <span className="font-semibold text-heading">
                                        Catatan pelanggan:{' '}
                                    </span>
                                    {order.customer_note}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card p-6">
                            <p className="label-caps text-body-subtle">
                                Pelanggan
                            </p>
                            <div className="mt-4 space-y-1 text-sm text-body">
                                <p className="font-semibold text-heading">
                                    {order.user.name}
                                </p>
                                <p>{order.user.email}</p>
                                {order.user.phone && <p>{order.user.phone}</p>}
                            </div>
                        </div>

                        <div className="card p-6">
                            <p className="label-caps text-body-subtle">
                                Alamat Pengiriman
                            </p>
                            <div className="mt-4 space-y-1 text-sm text-body">
                                <p className="font-semibold text-heading">
                                    {order.address_snapshot.recipient_name}
                                </p>
                                <p>{order.address_snapshot.phone}</p>
                                <p>{order.address_snapshot.street_address}</p>
                                <p>
                                    {order.address_snapshot.subdistrict},{' '}
                                    {order.address_snapshot.district},{' '}
                                    {order.address_snapshot.city}
                                </p>
                            </div>
                        </div>

                        {order.payments.length > 0 && (
                            <div className="card p-6">
                                <p className="label-caps text-body-subtle">
                                    Pembayaran
                                </p>
                                <ul className="mt-4 space-y-3">
                                    {order.payments.map((payment) => (
                                        <li
                                            key={payment.id}
                                            className="flex items-center justify-between gap-3 text-sm"
                                        >
                                            <div>
                                                <p className="font-semibold text-heading">
                                                    {payment.method === 'cod'
                                                        ? 'COD'
                                                        : 'Transfer'}
                                                </p>
                                                <p className="text-xs text-body-subtle">
                                                    {formatDateTime(
                                                        payment.paid_at,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-heading">
                                                    {formatRupiah(
                                                        payment.amount,
                                                    )}
                                                </p>
                                                <StatusBadge
                                                    status={payment.status}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {!['cancelled', 'delivered'].includes(order.status) &&
                            permissions.has('orders.cancel') &&
                            (isAdmin || order.status === 'pending') && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        confirmAction(
                                            ordersCancel.url({
                                                order: order.uuid,
                                            }),
                                            `Batalkan pesanan ${order.order_number}?`,
                                        )
                                    }
                                    className="w-full border border-danger-strong px-4 py-3 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft"
                                >
                                    Batalkan Pesanan
                                </button>
                            )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
