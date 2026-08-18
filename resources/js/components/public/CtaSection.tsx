import { ArrowRight } from 'lucide-react';
import Button from './Button';

export default function CtaSection() {
    return (
        <section className="section bg-gradient-brand-strong">
            <div className="container-section">
                <div className="grid items-center gap-10 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <p className="label-caps text-on-brand-muted">
                            Siap diantar
                        </p>
                        <h2 className="mt-4 text-white">
                            Air tangki Anda bisa diantar hari ini.
                        </h2>
                        <p className="mt-4 max-w-xl text-lg leading-relaxed text-on-brand-muted">
                            Pesan di jam buka, konfirmasi cepat, dan pembayaran
                            aman. Driver kami siap mengisi tangki Anda.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 lg:justify-end">
                        <Button href="#layanan" variant="white" size="large">
                            Pesan Sekarang
                            <ArrowRight size={20} aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
