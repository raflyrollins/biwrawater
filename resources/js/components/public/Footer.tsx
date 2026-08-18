import { Clock, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';

const footerLinks = [
    { label: 'Layanan', href: '#layanan' },
    { label: 'Cara Pesan', href: '#cara-pesan' },
    { label: 'Zona Layanan', href: '#zona' },
    { label: 'FAQ', href: '#faq' },
];

export default function Footer() {
    return (
        <footer className="bg-gradient-dark">
            <div className="container-section py-16">
                <div className="grid gap-12 lg:grid-cols-3">
                    <div>
                        <Logo variant="dark" />
                        <p className="mt-5 max-w-xs text-sm leading-relaxed text-on-brand-muted">
                            Jasa pengisian air tangki bersih untuk Medan Marelan
                            dan sekitarnya. Pengiriman tertib, pembayaran aman.
                        </p>
                    </div>

                    <nav
                        aria-label="Navigasi footer"
                        className="lg:justify-self-center"
                    >
                        <p className="label-caps text-on-brand-muted">
                            Navigasi
                        </p>
                        <ul className="mt-5 space-y-3">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-on-brand-muted transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="lg:justify-self-end">
                        <p className="label-caps text-on-brand-muted">Kontak</p>
                        <ul className="mt-5 space-y-4">
                            <li className="flex items-center gap-3 text-sm text-on-brand-muted">
                                <MapPin size={16} aria-hidden="true" />
                                Medan Marelan, Sumatera Utara
                            </li>
                            <li className="flex items-center gap-3 text-sm text-on-brand-muted">
                                <Phone size={16} aria-hidden="true" />
                                08xx-xxxx-xxxx
                            </li>
                            <li className="flex items-center gap-3 text-sm text-on-brand-muted">
                                <Clock size={16} aria-hidden="true" />
                                Senin - Sabtu, 07.00 - 17.00 WIB
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-14 border-t border-white/15 pt-6">
                    <p className="text-sm text-on-brand-muted">
                        &copy; {new Date().getFullYear()} Biwrawater. Seluruh
                        hak cipta dilindungi.
                    </p>
                </div>
            </div>
        </footer>
    );
}
