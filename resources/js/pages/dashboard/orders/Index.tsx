import { Head, Link, router } from '@inertiajs/react';
import { PackageSearch, Search } from 'lucide-react';

import type { FormEvent } from 'react';
import { useState } from 'react';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import Pagination from '../../../components/dashboard/Pagination';
import type { PaginationLink } from '../../../components/dashboard/Pagination';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import MultiSelect from '../../../components/ui/MultiSelect';
import { useDashboardRealtime } from '../../../hooks/useDashboardRealtime';
import { formatDate, formatRupiah } from '../../../lib/format';
import { STATUS_LABELS } from '../../../lib/labels';
import {
    index as ordersIndex,
    show as ordersShow,
} from '../../../routes/dashboard/orders';

interface AdminOrder {
    id: number;
    uuid: string;
    order_number: string;
    status: string;
    grand_total: number;
    created_at: string;
    user: { name: string };
    delivery: { status: string | null } | null;
    items: { volume_liters: number | null; quantity: number }[];
}

interface OrdersIndexProps {
    orders: {
        data: AdminOrder[];
        links: PaginationLink[];
        total: number;
    };
    filters: {
        status: string[];
        search: string | null;
    };
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export default function OrdersIndex({ orders, filters }: OrdersIndexProps) {
    const [status, setStatus] = useState<string[]>(filters.status);

    useDashboardRealtime();

    function submitFilters(e: FormEvent) {
        e.preventDefault();

        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);

        router.get(ordersIndex.url(), {
            status,
            search: formData.get('search'),
        });
    }

    return (
        <DashboardLayout>
            <Head title="Pesanan" />

            <div className="container-dashboard py-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-2xl text-heading">Pesanan</h2>
                        <p className="text-sm text-body-subtle">
                            {orders.total} pesanan ditemukan
                        </p>
                    </div>

                    <form
                        onSubmit={submitFilters}
                        className="flex flex-wrap items-end gap-3"
                    >
                        <div>
                            <label
                                htmlFor="order-search"
                                className="mb-1 block text-xs font-semibold text-body-subtle"
                            >
                                Cari
                            </label>
                            <div className="relative">
                                <Search
                                    size={16}
                                    aria-hidden="true"
                                    className="absolute top-1/2 left-4 -translate-y-1/2 text-body-subtle"
                                />
                                <input
                                    id="order-search"
                                    name="search"
                                    type="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="No. pesanan / nama"
                                    className="input w-56 pl-10"
                                />
                            </div>
                        </div>
                        <div className="w-56">
                            <MultiSelect
                                label="Status"
                                value={status}
                                onChange={(value) =>
                                    setStatus(value.map(String))
                                }
                                options={STATUS_OPTIONS}
                                placeholder="Semua Status"
                                searchPlaceholder="Cari status..."
                            />
                        </div>
                        <button type="submit" className="btn btn-brand">
                            Terapkan
                        </button>
                    </form>
                </div>

                <div className="card mt-8">
                    {orders.data.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <PackageSearch
                                size={40}
                                aria-hidden="true"
                                className="text-body-subtle"
                            />
                            <p className="mt-4 font-semibold text-heading">
                                Tidak ada pesanan ditemukan
                            </p>
                            <p className="mt-1 text-sm text-body-subtle">
                                Coba ubah filter pencarian atau status.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>No. Pesanan</th>
                                        <th>Pelanggan</th>
                                        <th>Volume</th>
                                        <th>Tanggal</th>
                                        <th>Status</th>
                                        <th>Pengiriman</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.map((order) => (
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
                                                <span className="text-sm font-semibold text-heading">
                                                    {(() => {
                                                        const total = order.items?.reduce(
                                                            (sum, item) => sum + (item.volume_liters ?? 0) * item.quantity,
                                                            0,
                                                        ) ?? 0;

                                                        return total > 0 ? `${total.toLocaleString('id-ID')} L` : '-';
                                                    })()}
                                                </span>
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
                                                {order.delivery ? (
                                                    <StatusBadge
                                                        status={
                                                            order.delivery
                                                                .status ??
                                                            'scheduled'
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-sm text-body-subtle">
                                                        -
                                                    </span>
                                                )}
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

                <Pagination links={orders.links} />
            </div>
        </DashboardLayout>
    );
}
