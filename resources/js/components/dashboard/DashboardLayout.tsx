import { Link, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    LayoutDashboard,
    LogOut,
    MapPin,
    Megaphone,
    Package,
    Ticket,
    Truck,
    UserRound,
    XCircle,
} from 'lucide-react';

import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { home } from '../../routes';
import { logout as authLogout } from '../../routes/auth';
import { index as dashboardIndex } from '../../routes/dashboard';
import { index as addressesIndex } from '../../routes/dashboard/addresses';
import { index as driversIndex } from '../../routes/dashboard/drivers';
import { index as ordersIndex } from '../../routes/dashboard/orders';
import { index as promoCodesIndex } from '../../routes/dashboard/promo-codes';
import { index as promotionsIndex } from '../../routes/dashboard/promotions';
import { index as trucksIndex } from '../../routes/dashboard/trucks';
import Logo from '../public/Logo';
import ThemeToggle from '../public/ThemeToggle';

interface NavItem {
    href: string;
    label: string;
    permission: string;
    icon: ReactNode;
    match?: string[];
}

function isNavItemActive(item: NavItem, url: string): boolean {
    if (url === item.href) {
        return true;
    }

    const prefixes = item.match ?? [item.href];

    return prefixes.some((path) => url.startsWith(`${path}/`));
}

const NAV_ITEMS: Record<string, NavItem[]> = {
    customer: [
        {
            href: dashboardIndex.url(),
            label: 'Pesanan Saya',
            permission: 'orders.view',
            icon: <Package size={16} aria-hidden="true" />,
            match: ['/dashboard/orders'],
        },
        {
            href: addressesIndex.url(),
            label: 'Alamat',
            permission: 'addresses.manage',
            icon: <MapPin size={16} aria-hidden="true" />,
            match: ['/dashboard/addresses'],
        },
    ],
    admin: [
        {
            href: dashboardIndex.url(),
            label: 'Ringkasan',
            permission: 'dashboard.view',
            icon: <LayoutDashboard size={16} aria-hidden="true" />,
            match: [],
        },
        {
            href: ordersIndex.url(),
            label: 'Pesanan',
            permission: 'orders.view',
            icon: <Package size={16} aria-hidden="true" />,
        },
        {
            href: promotionsIndex.url(),
            label: 'Promosi',
            permission: 'promotions.manage',
            icon: <Megaphone size={16} aria-hidden="true" />,
        },
        {
            href: promoCodesIndex.url(),
            label: 'Kode Promo',
            permission: 'promo-codes.manage',
            icon: <Ticket size={16} aria-hidden="true" />,
        },
        {
            href: trucksIndex.url(),
            label: 'Armada',
            permission: 'trucks.manage',
            icon: <Truck size={16} aria-hidden="true" />,
        },
        {
            href: driversIndex.url(),
            label: 'Driver',
            permission: 'drivers.manage',
            icon: <UserRound size={16} aria-hidden="true" />,
        },
    ],
    driver: [
        {
            href: dashboardIndex.url(),
            label: 'Jadwal',
            permission: 'deliveries.view',
            icon: <Truck size={16} aria-hidden="true" />,
            match: ['/dashboard/deliveries'],
        },
    ],
};

function navItemsFor(role: string, permissions: string[]): NavItem[] {
    const granted = new Set(permissions);

    return (NAV_ITEMS[role] ?? []).filter((item) =>
        granted.has(item.permission),
    );
}

const ROLE_LABELS: Record<string, string> = {
    'super-admin': 'Super Admin',
    admin: 'Admin',
    driver: 'Driver',
    customer: 'Pelanggan',
};

interface AuthUser {
    name: string;
    role: string;
    email: string;
    permissions: string[];
}

interface PageProps {
    auth: {
        user: AuthUser | null;
        permissions: string[];
    };
    flash: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: unknown;
}

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const page = usePage<PageProps>();
    const { auth, flash } = page.props;
    const user = auth.user;
    const role = user?.role ?? 'customer';
    const navItems = navItemsFor(role, auth.permissions);
    const url = page.url.split('?')[0];
    const activeLabel =
        navItems.find((item) => isNavItemActive(item, url))?.label ??
        'Dashboard';
    const roleLabel = ROLE_LABELS[role] ?? 'Pengguna';

    return (
        <div className="flex min-h-dvh">
            {/* Sidebar (desktop) */}
            <aside className="bg-gradient-dark sticky top-0 hidden h-dvh w-56 shrink-0 flex-col md:flex">
                <div className="flex h-20 items-center border-b border-white/15 px-6">
                    <Link href={home.url()} aria-label="Biwrawater - beranda">
                        <Logo variant="dark" />
                    </Link>
                </div>

                <nav
                    aria-label="Navigasi dashboard"
                    className="flex-1 px-3 py-6"
                >
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const active = isNavItemActive(item, url);

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        aria-current={
                                            active ? 'page' : undefined
                                        }
                                        className={cn(
                                            'flex items-center gap-3 rounded-none px-4 py-3 text-sm font-medium text-on-brand-muted no-underline transition-colors hover:bg-white/10 hover:text-white',
                                            active &&
                                                'bg-white/10 font-semibold text-white',
                                        )}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="border-t border-white/15 p-4">
                    <p className="truncate text-sm font-semibold text-white">
                        {user?.name}
                    </p>
                    <p className="truncate text-xs text-on-brand-muted">
                        {user?.email}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <Link
                            href={home.url()}
                            className="flex-1 text-center text-xs font-medium text-on-brand-muted no-underline transition-colors hover:text-white"
                        >
                            Lihat Situs
                        </Link>
                        <Link
                            href={authLogout.url()}
                            method="post"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-on-brand-muted no-underline transition-colors hover:text-white"
                        >
                            <LogOut size={14} aria-hidden="true" />
                            Keluar
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main area */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Navbar (semua breakpoint) */}
                <header className="sticky top-0 z-40 border-b border-border-default bg-neutral-primary-soft">
                    <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
                        <div className="flex min-w-0 items-center gap-4">
                            <Link
                                href={home.url()}
                                aria-label="Biwrawater - beranda"
                                className="shrink-0 md:hidden"
                            >
                                <Logo variant="light" className="h-9" />
                            </Link>
                            <p className="text-base font-bold text-heading md:text-lg">
                                {activeLabel}
                            </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 md:gap-4">
                            <div className="hidden items-center gap-3 md:flex">
                                <span className="flex h-9 w-9 items-center justify-center bg-brand text-sm font-bold text-on-brand">
                                    {user?.name.charAt(0).toUpperCase() ?? 'B'}
                                </span>
                                <span className="hidden lg:block">
                                    <span className="block text-sm font-semibold text-heading">
                                        {user?.name}
                                    </span>
                                    <span className="block text-xs text-body-subtle">
                                        {roleLabel}
                                    </span>
                                </span>
                            </div>

                            <ThemeToggle />

                            <Link
                                href={authLogout.url()}
                                method="post"
                                className="inline-flex items-center gap-2 text-sm font-medium text-body-subtle no-underline transition-colors hover:text-danger-strong"
                            >
                                <LogOut size={18} aria-hidden="true" />
                                <span className="hidden md:inline">Keluar</span>
                            </Link>
                        </div>
                    </div>

                    <nav
                        aria-label="Navigasi dashboard"
                        className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden"
                    >
                        {navItems.map((item) => {
                            const active = isNavItemActive(item, url);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'shrink-0 rounded-none px-3 py-2 text-sm font-medium text-body-subtle no-underline transition-colors hover:text-heading',
                                        active &&
                                            'bg-brand-soft font-semibold text-fg-brand-strong',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </header>

                <main className="flex-1">
                    {(flash.success || flash.error) && (
                        <div className="container-dashboard mt-6">
                            {flash.success && (
                                <div
                                    role="status"
                                    className="flex items-center gap-2 border border-border-default bg-success-soft px-4 py-3 text-sm text-success-strong"
                                >
                                    <CheckCircle2
                                        size={16}
                                        aria-hidden="true"
                                    />
                                    {flash.success}
                                </div>
                            )}
                            {flash.error && (
                                <div
                                    role="alert"
                                    className="flex items-center gap-2 border border-border-default bg-danger-soft px-4 py-3 text-sm text-danger-strong"
                                >
                                    <XCircle size={16} aria-hidden="true" />
                                    {flash.error}
                                </div>
                            )}
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
