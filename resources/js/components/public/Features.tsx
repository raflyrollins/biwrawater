import { Camera, CreditCard, Droplets, RotateCcw } from 'lucide-react';

const features = [
    {
        title: 'Air bersih & terawat',
        description:
            'Setiap pengisian di gudang memastikan kualitas air untuk kebutuhan sehari-hari.',
        icon: Droplets,
    },
    {
        title: 'Antrian yang jelas',
        description:
            'Pesanan terkonfirmasi masuk antrian terbuka. Tidak ada pesanan yang mengambang.',
        icon: RotateCcw,
    },
    {
        title: 'Pembayaran aman',
        description:
            'Bayar hanya setelah pesanan dikonfirmasi, lewat Midtrans dengan banyak pilihan metode.',
        icon: CreditCard,
    },
    {
        title: 'Bukti serah terima',
        description:
            'Driver memotret tangki bersama Anda saat air selesai diturunkan.',
        icon: Camera,
    },
];

export default function Features() {
    return (
        <section id="keunggulan" className="section bg-gradient-brand">
            <div className="container-section">
                <div className="section-header grid gap-6 lg:grid-cols-2 lg:items-end">
                    <div>
                        <p className="label-caps text-on-brand-muted">
                            Kenapa Biwrawater
                        </p>
                        <h2 className="mt-4 text-white">
                            Bukan sekadar mengantar air
                        </h2>
                    </div>
                    <p className="text-lg leading-relaxed text-on-brand-muted lg:max-w-md">
                        Proses yang tertib dari pesanan sampai serah terima —
                        supaya Anda selalu tahu air Anda ada di mana.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                        <article
                            key={feature.title}
                            className="card p-6 transition-colors duration-150 hover:bg-neutral-secondary-soft"
                        >
                            <span className="flex size-12 items-center justify-center bg-brand-softer text-fg-brand-strong">
                                <feature.icon size={24} aria-hidden="true" />
                            </span>
                            <h3 className="mt-5 text-lg text-heading">
                                {feature.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-body">
                                {feature.description}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
