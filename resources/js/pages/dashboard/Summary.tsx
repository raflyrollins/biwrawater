import { Head, Link } from '@inertiajs/react';
import {
    Banknote,
    CalendarClock,
    Megaphone,
    PackageX,
    Truck,
} from 'lucide-react';

import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { formatDateTime, formatRupiah } from '../../lib/format';
import {
    index as ordersIndex,
    show as ordersShow,
} from '../../routes/dashboard/orders';

interface RecentOrder {
    id: number;
    uuid: string;
    order_number: string;
    status: string;
    grand_total: number;
    created_at: string;
    user: { name: string };
}

interface ScheduleItem {
    id: number;
    status: string;
    scheduled_at: string;
    order: { id: number; uuid: string; order_number: string };
    truck: { name: string; plate_number: string } | null;
    driver: { user: { name: string } } | null;
}

interface SummaryProps {
    stats: {
        revenue: number;
        pending_orders: number;
        today_deliveries: number;
        active_promos: number;
        trucks_available: number;
    };
    recentOrders: RecentOrder[];
    todaySchedule: ScheduleItem[];
}

export default function Summary({
    stats,
    recentOrders,
    todaySchedule,
}: SummaryProps) {
    useDashboardRealtime();

    const cards = [
        {
            label: 'Pendapatan (Selesai)',
            value: formatRupiah(stats.revenue),
            icon: <Banknote size={20} aria-hidden="true" />,
        },
        {
            label: 'Pesanan Menunggu',
            value: String(stats.pending_orders),
            icon: <PackageX size={20} aria-hidden="true" />,
        },
        {
            label: 'Pengiriman Hari Ini',
            value: String(stats.today_deliveries),
            icon: <CalendarClock size={20} aria-hidden="true" />,
        },
        {
            label: 'Promo Aktif',
            value: String(stats.active_promos),
            icon: <Megaphone size={20} aria-hidden="true" />,
        },
        {
            label: 'Armada Tersedia',
            value: String(stats.trucks_available),
            icon: <Truck size={20} aria-hidden="true" />,
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Ringkasan" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {cards.map((card) => (
                        <div key={card.label} className="card p-5">
                            <div className="flex items-center justify-between text-body-subtle">
                                <p className="label-caps">{card.label}</p>
                                {card.icon}
                            </div>
                            <p className="mt-3 text-2xl font-bold text-heading">
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="card">
                        <div className="flex items-center justify-between border-b border-border-default px-6 py-5">
                            <h2 className="mb-0 text-xl text-heading">
                                Pesanan Terbaru
                            </h2>
                            <Link
                                href={ordersIndex.url()}
                                className="text-sm font-semibold text-fg-brand no-underline hover:text-fg-brand-strong"
                            >
                                Semua Pesanan
                            </Link>
                        </div>
                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <PackageX
                                    size={32}
                                    aria-hidden="true"
                                    className="text-body-subtle"
                                />
                                <p className="mt-3 text-sm text-body-subtle">
                                    Belum ada pesanan.
                                </p>
                            </div>
                        ) : (
                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>No. Pesanan</th>
                                            <th>Pelanggan</th>
                                            <th>Status</th>
                                            <th className="text-right">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => (
                                            <tr key={order.id}>
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
                                                <td>{order.user.name}</td>
                                                <td>
                                                    <StatusBadge
                                                        status={order.status}
                                                    />
                                                </td>
                                                <td className="text-right font-semibold text-heading">
                                                    {formatRupiah(
                                                        order.grand_total,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="border-b border-border-default px-6 py-5">
                            <h2 className="mb-0 text-xl text-heading">
                                Jadwal Pengiriman Hari Ini
                            </h2>
                        </div>
                        {todaySchedule.length === 0 ? (
                            <p className="px-6 py-12 text-center text-sm text-body-subtle">
                                Tidak ada pengiriman terjadwal hari ini.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border-default">
                                {todaySchedule.map((delivery) => (
                                    <li
                                        key={delivery.id}
                                        className="flex items-center justify-between gap-4 px-6 py-4"
                                    >
                                        <div>
                                            <Link
                                                href={ordersShow.url({
                                                    order: delivery.order.uuid,
                                                })}
                                                className="text-sm font-semibold text-fg-brand no-underline hover:text-fg-brand-strong"
                                            >
                                                {delivery.order.order_number}
                                            </Link>
                                            <p className="mt-0.5 text-xs text-body-subtle">
                                                {formatDateTime(
                                                    delivery.scheduled_at,
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-body">
                                            <p>
                                                {delivery.truck
                                                    ? `${delivery.truck.name} · ${delivery.truck.plate_number}`
                                                    : '-'}
                                            </p>
                                            <p>
                                                {delivery.driver?.user.name ??
                                                    '-'}
                                            </p>
                                        </div>
                                        <StatusBadge status={delivery.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
