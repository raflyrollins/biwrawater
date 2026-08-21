import { STATUS_LABELS } from '../../lib/labels';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
    pending: 'warning',
    confirmed: 'brand',
    in_delivery: 'brand',
    delivered: 'success',
    cancelled: 'danger',
    failed: 'danger',
    unpaid: 'warning',
    paid: 'success',
    refunded: 'neutral',
    scheduled: 'brand',
    accepted: 'brand',
    filling: 'warning',
    on_the_way: 'warning',
    unloading: 'warning',
    available: 'success',
    assigned: 'brand',
    maintenance: 'warning',
    retired: 'danger',
    on_duty: 'brand',
    off_duty: 'neutral',
};

interface StatusBadgeProps {
    status: string;
    label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
    const variant = STATUS_VARIANTS[status] ?? 'neutral';

    return (
        <span className={`badge badge-${variant}`}>
            {label ?? STATUS_LABELS[status] ?? status}
        </span>
    );
}
