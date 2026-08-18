import { ArrowRight, Phone } from 'lucide-react';
import Button from './Button';

const heroStats = [
    { value: '3.000L', label: 'Kapasitas tersedia' },
    { value: '1 Tangki', label: 'Per pesanan' },
    { value: '100%', label: 'Bukti serah terima' },
];

export default function Hero() {
    return (
        <section
            id="beranda"
            className="bg-gradient-brand relative overflow-hidden"
        >
            <div
                aria-hidden="true"
                className="absolute -top-24 -right-24 hidden h-96 w-96 bg-white/15 lg:block"
            />
            <div
                aria-hidden="true"
                className="absolute -bottom-32 left-1/3 hidden h-72 w-72 bg-white/10 lg:block"
            />

            <div className="container-section relative">
                <div className="grid items-center gap-16 py-16 lg:grid-cols-2 lg:py-24">
                    <div>
                        <p className="label-caps text-on-brand-muted">
                            Medan Marelan &amp; sekitarnya
                        </p>
                        <h1 className="mt-4 text-white">
                            Air bersih sampai ke rumah Anda, tepat waktu.
                        </h1>
                        <p className="max-w-xl text-lg leading-relaxed text-on-brand-muted">
                            Biwrawater melayani pengisian air tangki bersih
                            dengan armada terawat, antrian pengiriman yang
                            jelas, dan pembayaran aman setelah pesanan
                            dikonfirmasi.
                        </p>

                        <div className="mt-10 flex flex-wrap items-center gap-4">
                            <Button
                                href="#layanan"
                                variant="white"
                                size="large"
                            >
                                Pesan Sekarang
                                <ArrowRight size={20} aria-hidden="true" />
                            </Button>
                            <a
                                href="tel:+62812"
                                className="inline-flex items-center gap-2 text-base font-medium text-white underline underline-offset-4 hover:no-underline"
                            >
                                <Phone size={18} aria-hidden="true" />
                                Hubungi Kami
                            </a>
                        </div>

                        <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-white/15 pt-8">
                            {heroStats.map((stat) => (
                                <div key={stat.label}>
                                    <dt className="sr-only">{stat.label}</dt>
                                    <dd className="text-2xl font-bold text-white">
                                        {stat.value}
                                    </dd>
                                    <dd className="mt-1 text-sm text-on-brand-muted">
                                        {stat.label}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="relative">
                        <div className="card p-3">
                            <img
                                src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=1200&q=80"
                                alt="Tetesan air bersih"
                                className="aspect-[4/3] w-full object-cover"
                                loading="eager"
                            />
                            <div className="flex items-center justify-between px-3 py-4">
                                <div>
                                    <p className="text-sm font-medium text-heading">
                                        Air tangki bersih siap antar
                                    </p>
                                    <p className="text-sm text-body-subtle">
                                        Diisi dari gudang, diantar dengan bukti
                                        foto
                                    </p>
                                </div>
                                <span className="inline-flex size-3 shrink-0 rounded-full bg-success-strong" />
                            </div>
                        </div>

                        <div className="card absolute -bottom-8 -left-4 hidden max-w-56 p-5 sm:block lg:-left-10">
                            <p className="text-sm font-medium text-heading">
                                Antrian transparan
                            </p>
                            <p className="mt-1 text-sm text-body-subtle">
                                Setiap pesanan terkonfirmasi masuk antrian
                                pengiriman hari itu atau hari kerja berikutnya.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
