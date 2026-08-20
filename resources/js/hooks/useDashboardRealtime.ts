import { router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';

import { useEffect, useRef } from 'react';

export interface DashboardRealtimeEvent {
    order_id?: number;
    order_number?: string;
    user_id?: number;
    order_status?: string;
    delivery_status?: string;
    delivery_id?: number;
}

const EVENT_NAMES = [
    '.order.created',
    '.order.status-changed',
    '.order.payment-updated',
    '.delivery.status-changed',
];

interface UseDashboardRealtimeOptions {
    orderId?: number;
    events?: string[];
}

/**
 * Pantau event broadcast di channel private `dashboard` lalu muat ulang
 * halaman saat ini (debounced) bila event relevan dengan halaman.
 *
 * Nama event memakai awalan titik (`.order.created`) sesuai konvensi Echo:
 * EventFormatter hanya meneruskan nama apa adanya bila diawali titik,
 * sehingga cocok dengan nama dari `broadcastAs()`.
 */
export function useDashboardRealtime(
    options: UseDashboardRealtimeOptions = {},
): void {
    const { orderId, events = EVENT_NAMES } = options;
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const channel = echo().private('dashboard');

        const listeners = events.map((event) =>
            channel.listen(event, (payload: DashboardRealtimeEvent) => {
                if (orderId !== undefined && payload.order_id !== orderId) {
                    return;
                }

                if (timerRef.current !== null) {
                    window.clearTimeout(timerRef.current);
                }

                timerRef.current = window.setTimeout(() => {
                    router.reload();
                }, 500);
            }),
        );

        return () => {
            listeners.forEach((listener, index) => {
                channel.stopListening(events[index], listener);
            });
        };
    }, [orderId, events]);
}