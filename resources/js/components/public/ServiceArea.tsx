import { Clock, MapPin, Truck } from 'lucide-react';

interface Zone {
    name: string;
    detail: string;
    note: string;
    included: boolean;
}

interface ScheduleStatus {
    is_open: boolean;
    message: string;
}

interface ServiceAreaProps {
    schedule_status: ScheduleStatus;
}

export default function ServiceArea({ schedule_status }: ServiceAreaProps) {
    const zones: Zone[] = [
        {
            name: 'Zona Marelan',
            detail: 'Marelan, Marelan I & II, Rengas Pulau, Tanah Enam Ratus',
            note: 'Gratis ongkir',
            included: true,
        },
        {
            name: 'Luar Zona',
            detail: 'Tanjung Mulia, Paya Pasir, dan sekitarnya',
            note: 'Biaya kirim sesuai ketentuan',
            included: false,
        },
    ];

    return (
        <section id="zona" className="section bg-gradient-page">
            <div className="container-section">
                <div className="section-header grid gap-6 lg:grid-cols-2 lg:items-end">
                    <div>
                        <p className="label-caps text-fg-brand-strong">
                            Zona Layanan
                        </p>
                        <h2 className="mt-4 text-heading">
                            Area pengiriman & jam operasional
                        </h2>
                    </div>
                    <p className="text-lg leading-relaxed text-body lg:max-w-md">
                        Pesanan hanya bisa dibuat pada jam buka. Pengiriman
                        mengikuti antrian: pesanan yang tidak sempat diantar
                        hari itu dijadwalkan ke hari kerja berikutnya.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    <div className="card p-8 lg:col-span-3">
                        <img
                            src="https://images.unsplash.com/photo-1571757767119-68b8dbed8c97?auto=format&fit=crop&w=1200&q=80"
                            alt="Air bersih siap diantar"
                            className="aspect-[16/9] w-full object-cover"
                            loading="lazy"
                        />
                        <ul className="mt-8 space-y-6">
                            {zones.map((zone) => (
                                <li
                                    key={zone.name}
                                    className="flex items-start justify-between gap-6"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center bg-brand-softer text-fg-brand-strong">
                                            <MapPin
                                                size={20}
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-heading">
                                                {zone.name}
                                            </p>
                                            <p className="mt-1 text-sm text-body">
                                                {zone.detail}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-sm font-medium text-fg-brand">
                                        {zone.note}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="card p-8 lg:col-span-2">
                        <span className="flex size-12 items-center justify-center bg-brand text-white">
                            <Clock size={24} aria-hidden="true" />
                        </span>
                        <h3 className="mt-6 text-2xl text-heading">
                            Jam operasional
                        </h3>

                        <div className="mt-6 flex items-center gap-3">
                            <span
                                className={
                                    schedule_status.is_open
                                        ? 'inline-flex size-3 shrink-0 rounded-full bg-success-strong'
                                        : 'inline-flex size-3 shrink-0 rounded-full bg-danger-strong'
                                }
                            />
                            <span
                                className={
                                    schedule_status.is_open
                                        ? 'text-sm font-medium text-success-strong'
                                        : 'text-sm font-medium text-danger-strong'
                                }
                            >
                                {schedule_status.is_open ? 'Buka' : 'Tutup'}
                            </span>
                        </div>

                        {!schedule_status.is_open && (
                            <p className="mt-3 text-sm leading-relaxed text-body">
                                {schedule_status.message}
                            </p>
                        )}

                        <div className="mt-8 flex items-center gap-4 border-t border-border-default pt-6">
                            <span className="flex size-10 shrink-0 items-center justify-center bg-brand-softer text-fg-brand-strong">
                                <Truck size={20} aria-hidden="true" />
                            </span>
                            <p className="text-sm leading-relaxed text-body">
                                Titik awal driver selalu di gudang — pengisian
                                air dimulai langsung setelah tugas diterima.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
