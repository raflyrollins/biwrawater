import { Check, Droplets, Truck } from 'lucide-react';

const variants = [
    {
        name: 'Tangki 3.000L',
        description: 'Cocok untuk rumah tangga dan tempat usaha kecil.',
        features: [
            '1 pesanan = 1 tangki',
            'Dikonfirmasi sebelum pembayaran',
            'Foto bukti serah terima',
        ],
        icon: Droplets,
    },
    {
        name: 'Tangki 5.000L',
        description: 'Untuk kebutuhan lebih besar: ruko, kost, dan perumahan.',
        features: [
            '1 pesanan = 1 tangki',
            'Antrian pengiriman transparan',
            'Diantar sesuai jadwal antrian',
        ],
        icon: Truck,
    },
];

export default function Services() {
    return (
        <section id="layanan" className="section bg-gradient-page">
            <div className="container-section">
                <div className="section-header grid gap-6 lg:grid-cols-2 lg:items-end">
                    <div>
                        <p className="label-caps text-fg-brand-strong">
                            Layanan
                        </p>
                        <h2 className="mt-4 text-heading">
                            Pilih varian tangki sesuai kebutuhan
                        </h2>
                    </div>
                    <p className="text-lg leading-relaxed text-body lg:max-w-md">
                        Harga dihitung per tangki dan diatur oleh pihak
                        Biwrawater. Setiap varian dilayani armada khusus yang
                        terawat.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {variants.map((variant, index) => (
                        <article
                            key={variant.name}
                            className="card group relative p-8 transition-colors duration-150 hover:bg-neutral-secondary-soft lg:p-10"
                        >
                            <div className="flex items-start justify-between">
                                <span className="flex size-14 items-center justify-center bg-brand-softer text-fg-brand-strong">
                                    <variant.icon
                                        size={28}
                                        aria-hidden="true"
                                    />
                                </span>
                                <span className="label-caps text-body-subtle">
                                    0{index + 1}
                                </span>
                            </div>

                            <h3 className="mt-8 text-2xl text-heading lg:text-3xl">
                                {variant.name}
                            </h3>
                            <p className="mt-2 text-body">
                                {variant.description}
                            </p>

                            <ul className="mt-6 space-y-3">
                                {variant.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center gap-3 text-sm text-body"
                                    >
                                        <Check
                                            size={18}
                                            className="shrink-0 text-fg-brand"
                                            aria-hidden="true"
                                        />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="#cara-pesan"
                                className="btn btn-brand mt-8 w-full"
                            >
                                Pesan Varian Ini
                            </a>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
