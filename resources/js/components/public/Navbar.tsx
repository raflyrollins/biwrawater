import { useTheme } from '../../hooks/useTheme';
import Button from './Button';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const navLinks = [
    { label: 'Layanan', href: '#layanan' },
    { label: 'Cara Pesan', href: '#cara-pesan' },
    { label: 'Zona Layanan', href: '#zona' },
    { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
    const { dark } = useTheme();

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
                    <Button href="#layanan" variant="brand">
                        Pesan Sekarang
                    </Button>
                </div>
            </div>
        </header>
    );
}
