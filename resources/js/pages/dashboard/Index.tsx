import { Head, Link, router } from '@inertiajs/react';

import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Pagination from '../../components/dashboard/Pagination';
import type { PaginationLink } from '../../components/dashboard/Pagination';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { formatDate, formatRupiah } from '../../lib/format';
import { home } from '../../routes';
import {
    cancel as dashboardOrdersCancel,
    show as dashboardOrdersShow,
} from '../../routes/dashboard/orders';

interface OrderSummary {
    id: number;
    uuid: string;
    order_number: string;
    status: string;
    grand_total: number;
    created_at: string;
    delivery: {
        status: string | null;
        scheduled_at: string | null;
    } | null;
}

interface DashboardProps {
    orders: {
        data: OrderSummary[];
        links: PaginationLink[];
    };
    stats: {
        total_orders: number;
        pending_count: number;
    };
}

export default function DashboardIndex({ orders, stats }: DashboardProps) {
    useDashboardRealtime();

    function cancelOrder(order: OrderSummary) {
        if (window.confirm('Batalkan pesanan ini?')) {
            router.post(dashboardOrdersCancel.url({ order: order.uuid }));
        }
    }

    return (
        <DashboardLayout>
            <Head title="Dashboard" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="card p-6">
                        <p className="label-caps text-body-subtle">
                            Total Pesanan
                        </p>
                        <p className="mt-2 text-3xl font-bold text-heading">
                            {stats.total_orders}
                        </p>
                    </div>
                    <div className="card p-6">
                        <p className="label-caps text-body-subtle">
                            Menunggu Konfirmasi
                        </p>
                        <p className="mt-2 text-3xl font-bold text-heading">
                            {stats.pending_count}
                        </p>
                    </div>
                </div>

                <div className="card mt-8">
                    <div className="flex items-center justify-between border-b border-border-default px-6 py-5">
                        <h2 className="mb-0 text-xl text-heading md:text-2xl">
                            Riwayat Pesanan
                        </h2>
                        <a
                            href={`${home.url()}#layanan`}
                            className="text-sm font-semibold text-fg-brand no-underline hover:text-fg-brand-strong"
                        >
                            Pesan Lagi
                        </a>
                    </div>

                    {orders.data.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <p className="text-body">Belum ada pesanan.</p>
                            <a
                                href={`${home.url()}#layanan`}
                                className="btn btn-brand mt-6"
                            >
                                Pesan Air Sekarang
                            </a>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>No. Pesanan</th>
                                        <th>Tanggal</th>
                                        <th>Status</th>
                                        <th>Pengiriman</th>
                                        <th className="text-right">Total</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.map((order) => (
                                        <tr key={order.id}>
                                            <td className="font-semibold text-heading">
                                                {order.order_number}
                                            </td>
                                            <td>
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={order.status}
                                                />
                                            </td>
                                            <td>
                                                {order.delivery?.scheduled_at
                                                    ? formatDate(
                                                          order.delivery
                                                              .scheduled_at,
                                                      )
                                                    : '-'}
                                            </td>
                                            <td className="text-right font-semibold text-heading">
                                                {formatRupiah(
                                                    order.grand_total,
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link
                                                        href={dashboardOrdersShow.url(
                                                            {
                                                                order: order.uuid,
                                                            },
                                                        )}
                                                        className="text-sm font-semibold text-fg-brand no-underline hover:text-fg-brand-strong"
                                                    >
                                                        Detail
                                                    </Link>
                                                    {order.status ===
                                                        'pending' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                cancelOrder(
                                                                    order,
                                                                )
                                                            }
                                                            className="text-sm font-semibold text-danger-strong hover:underline"
                                                        >
                                                            Batalkan
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
                </div>

                <Pagination links={orders.links} />
            </div>
        </DashboardLayout>
    );
}
