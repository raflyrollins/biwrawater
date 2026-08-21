import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Clock } from 'lucide-react';

import { useEffect, useState } from 'react';

import AssignDeliveryForm from '../../../components/dashboard/AssignDeliveryForm';
import type {
    AssignDriver,
    AssignTruck,
} from '../../../components/dashboard/AssignDeliveryForm';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { useDashboardRealtime } from '../../../hooks/useDashboardRealtime';
import { formatDateTime, formatRupiah } from '../../../lib/format';
import { openSnapPayment } from '../../../lib/midtrans';
import { index as dashboardIndex } from '../../../routes/dashboard';
import {
    cancel as ordersCancel,
    confirm as ordersConfirm,
    index as ordersIndex,
    pay as ordersPay,
    payStatus as ordersPayStatus,
} from '../../../routes/dashboard/orders';

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
    payment_due_at: string | null;
    payment_due_passed: boolean;
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
    snap: {
        token: string;
        client_key: string;
        script: string;
    } | null;
    [key: string]: unknown;
}

export default function OrderShow({ order, assignOptions }: OrderShowProps) {
    const { auth, snap } = usePage<PageProps>().props;
    const delivery = order.delivery;
    const permissions = new Set(auth.permissions);
    const isAdmin = permissions.has('dashboard.view');
    const [pendingAction, setPendingAction] = useState(false);
    const hasActiveDelivery =
        delivery !== null &&
        [
            'scheduled',
            'accepted',
            'filling',
            'on_the_way',
            'unloading',
        ].includes(delivery.status);

    useDashboardRealtime({ orderId: order.id });

    useEffect(() => {
        if (!snap) {
            return;
        }

        const timer = setTimeout(() => {
            openSnapPayment({
                token: snap.token,
                clientKey: snap.client_key,
                script: snap.script,
                onSuccess: () => {
                    router.get(ordersPayStatus.url({ order: order.uuid }));
                },
                onPending: () => {
                    router.reload();
                },
                onClose: () => {
                    router.reload();
                },
            });
        }, 400);

        return () => {
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [snap]);

    function action(url: string) {
        if (pendingAction) {
            return;
        }

        setPendingAction(true);
        router.post(url, undefined, {
            onFinish: () => setPendingAction(false),
        });
    }

    const confirm = useConfirm();

    async function confirmAction(url: string, message: string) {
        if (pendingAction) {
            return;
        }

        const confirmed = await confirm({
            title: 'Konfirmasi',
            description: message,
            confirmLabel: 'Ya, Lanjutkan',
        });

        if (confirmed) {
            action(url);
        }
    }

    function paymentMethodLabel(method: string): string {
        if (method === 'midtrans') {
            return 'Midtrans';
        }

        if (method === 'cod') {
            return 'COD';
        }

        return 'Transfer';
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
                        {/* Konfirmasi admin */}
                        {order.status === 'pending' &&
                            permissions.has('orders.confirm') && (
                                <div className="card p-6">
                                    <p className="label-caps text-body-subtle">
                                        Konfirmasi Pesanan
                                    </p>
                                    <p className="mt-4 text-sm leading-relaxed text-body">
                                        Setelah dikonfirmasi, pelanggan mendapat
                                        batas waktu 20 menit untuk membayar
                                        melalui Midtrans. Pengiriman baru bisa
                                        ditugaskan setelah pembayaran lunas.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            confirmAction(
                                                ordersConfirm.url({
                                                    order: order.uuid,
                                                }),
                                                `Konfirmasi pesanan ${order.order_number}?`,
                                            )
                                        }
                                        disabled={pendingAction}
                                        className="btn btn-brand mt-5 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Konfirmasi Pesanan
                                    </button>
                                </div>
                            )}

                        {/* Assign form / delivery status */}
                        {order.status === 'confirmed' &&
                            order.payment_status === 'paid' &&
                            permissions.has('orders.assign') &&
                            !hasActiveDelivery && (
                                <AssignDeliveryForm
                                    orderUuid={order.uuid}
                                    trucks={assignOptions.trucks}
                                    drivers={assignOptions.drivers}
                                />
                            )}

                        {order.status === 'confirmed' &&
                            order.payment_status === 'paid' &&
                            permissions.has('orders.assign') &&
                            hasActiveDelivery && (
                                <div className="card p-6">
                                    <p className="label-caps text-body-subtle">
                                        Penugasan
                                    </p>
                                    <p className="mt-4 text-sm leading-relaxed text-body">
                                        Pengiriman sedang berjalan. Selesaikan
                                        atau gagalkan pengiriman saat ini
                                        sebelum menugaskan ulang.
                                    </p>
                                </div>
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
                            </div>
                        ) : (
                            !isAdmin && (
                                <div className="card p-6">
                                    <p className="label-caps text-body-subtle">
                                        Pengiriman
                                    </p>
                                    <p className="mt-4 text-sm text-body-subtle">
                                        {order.status === 'pending'
                                            ? 'Menunggu konfirmasi admin.'
                                            : order.payment_status === 'unpaid'
                                              ? 'Menunggu pembayaran Anda untuk memulai pengiriman.'
                                              : 'Menunggu penugasan pengiriman.'}
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

                        {order.status === 'confirmed' &&
                            order.payment_status === 'unpaid' && (
                                <div className="card p-6">
                                    <p className="label-caps text-body-subtle">
                                        Pembayaran
                                    </p>
                                    {order.payment_due_passed ? (
                                        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-danger-strong">
                                            <Clock
                                                size={16}
                                                className="mt-0.5 shrink-0"
                                                aria-hidden="true"
                                            />
                                            Batas waktu pembayaran telah lewat.{' '}
                                            {isAdmin
                                                ? 'Pesanan dapat dibatalkan.'
                                                : 'Hubungi admin untuk bantuan.'}
                                        </p>
                                    ) : (
                                        <>
                                            <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-body">
                                                <Clock
                                                    size={16}
                                                    className="mt-0.5 shrink-0 text-fg-brand"
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    Batas pembayaran:{' '}
                                                    <span className="font-semibold text-heading">
                                                        {formatDateTime(
                                                            order.payment_due_at,
                                                        )}
                                                    </span>
                                                    . Pembayaran melalui
                                                    Midtrans (Virtual Account,
                                                    QRIS, dll).
                                                </span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    action(
                                                        ordersPay.url({
                                                            order: order.uuid,
                                                        }),
                                                    )
                                                }
                                                disabled={pendingAction}
                                                className="btn btn-brand mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Bayar Sekarang
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.get(
                                                        ordersPayStatus.url({
                                                            order: order.uuid,
                                                        }),
                                                    )
                                                }
                                                className="mt-3 w-full border border-border-default px-4 py-3 text-sm font-semibold text-body transition-colors hover:bg-neutral-tertiary-soft"
                                            >
                                                Cek Status Pembayaran
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

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
                                                    {paymentMethodLabel(
                                                        payment.method,
                                                    )}
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
                                    disabled={pendingAction}
                                    className="w-full border border-danger-strong px-4 py-3 text-sm font-semibold text-danger-strong transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
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
