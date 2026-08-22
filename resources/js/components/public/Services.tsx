import { Check, Droplets, Truck } from 'lucide-react';

import { index as checkout } from '../../routes/checkout';

interface Service {
    id: number;
    name: string;
    description: string | null;
    price: number;
    volume_liters: number;
}

interface ServicesProps {
    services: Service[];
}

export default function Services({ services }: ServicesProps) {
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
                    {services.length === 0 ? (
                        <p className="col-span-full text-center text-body-subtle">
                            Belum ada varian tangki tersedia.
                        </p>
                    ) : (
                        services.map((service, index) => (
                            <article
                                key={service.id}
                                className="card group relative p-8 transition-colors duration-150 hover:bg-neutral-secondary-soft lg:p-10"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="flex size-14 items-center justify-center bg-brand-softer text-fg-brand-strong">
                                        {service.volume_liters >= 8000 ? (
                                            <Truck
                                                size={28}
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Droplets
                                                size={28}
                                                aria-hidden="true"
                                            />
                                        )}
                                    </span>
                                    <span className="label-caps text-body-subtle">
                                        0{index + 1}
                                    </span>
                                </div>

                                <h3 className="mt-8 text-2xl text-heading lg:text-3xl">
                                    {service.name}
                                </h3>
                                <p className="mt-2 text-body">
                                    {service.description ?? '-'}
                                </p>

                                <ul className="mt-6 space-y-3">
                                    <li className="flex items-center gap-3 text-sm text-body">
                                        <Check
                                            size={18}
                                            className="shrink-0 text-fg-brand"
                                            aria-hidden="true"
                                        />
                                        1 pesanan = 1 tangki
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-body">
                                        <Check
                                            size={18}
                                            className="shrink-0 text-fg-brand"
                                            aria-hidden="true"
                                        />
                                        Dikonfirmasi sebelum pembayaran
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-body">
                                        <Check
                                            size={18}
                                            className="shrink-0 text-fg-brand"
                                            aria-hidden="true"
                                        />
                                        Foto bukti serah terima
                                    </li>
                                </ul>

                                <a
                                    href={checkout.url()}
                                    className="btn btn-brand mt-8 w-full"
                                >
                                    Pesan Varian Ini
                                </a>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
