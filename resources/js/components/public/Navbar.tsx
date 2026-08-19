import { usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

import { useTheme } from '../../hooks/useTheme';
import { login, register } from '../../routes';
import { logout as authLogout } from '../../routes/auth';
import type { User } from '../../types/auth';
import Button from './Button';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const navLinks = [
    { label: 'Layanan', href: '#layanan' },
    { label: 'Cara Pesan', href: '#cara-pesan' },
    { label: 'Zona Layanan', href: '#zona' },
    { label: 'FAQ', href: '#faq' },
];

interface PageProps {
    auth: {
        user: User | null;
    };
    [key: string]: unknown;
}

export default function Navbar() {
    const { dark } = useTheme();
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    return (
        <header className="sticky top-0 z-50 border-b border-border-default bg-neutral-primary-soft">
            <div className="container-section flex items-center justify-between py-4">
                <a href="#beranda" aria-label="Biwrawater - beranda">
                    <Logo variant={dark ? 'dark' : 'light'} />
                </a>

                <nav
                    aria-label="Navigasi utama"
                    className="hidden items-center gap-8 lg:flex"
                >
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-body transition-colors hover:text-heading"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {user ? (
                        <>
                            <span className="hidden text-sm font-medium text-body sm:inline">
                                Halo, {user.name}
                            </span>
                            <Button
                                href={authLogout.url()}
                                method="post"
                                className="inline-flex items-center gap-2"
                            >
                                <LogOut size={16} aria-hidden="true" />
                                Keluar
                            </Button>
                        </>
                    ) : (
                        <>
                            <a
                                href={login.url()}
                                className="text-sm font-medium text-body transition-colors hover:text-heading"
                            >
                                Masuk
                            </a>
                            <Button href={register.url()} variant="brand">
                                Daftar
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
