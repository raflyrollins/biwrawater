import {
    ClipboardCheck,
    CreditCard,
    MessagesSquare,
    Truck,
} from 'lucide-react';

const steps = [
    {
        number: '01',
        title: 'Buat pesanan',
        description:
            'Pesan lewat web, atau hubungi kami lewat WhatsApp dan telepon.',
        icon: MessagesSquare,
    },
    {
        number: '02',
        title: 'Tunggu konfirmasi',
        description:
            'Admin memastikan pesanan bisa diantar hari itu atau hari berikutnya.',
        icon: ClipboardCheck,
    },
    {
        number: '03',
        title: 'Bayar dengan aman',
        description:
            'Setelah dikonfirmasi, bayar via Midtrans. Pembayaran lewat 20 menit dibatalkan otomatis.',
        icon: CreditCard,
    },
    {
        number: '04',
        title: 'Air diantar',
        description:
            'Pesanan masuk antrian, ditugaskan ke driver, dan diantar dengan bukti foto.',
        icon: Truck,
    },
];

export default function HowItWorks() {
    return (
        <section id="cara-pesan" className="section bg-gradient-brand-strong">
            <div className="container-section">
                <div className="section-header">
                    <p className="label-caps text-on-brand-muted">Cara Pesan</p>
                    <h2 className="mt-4 max-w-2xl text-white">
                        Empat langkah sampai air di rumah Anda
                    </h2>
                </div>

                <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step) => (
                        <li key={step.number} className="card relative p-6">
                            <span
                                aria-hidden="true"
                                className="absolute top-0 right-0 size-16 translate-x-1/2 -translate-y-1/2 bg-brand-soft"
                            />
                            <span className="flex size-12 items-center justify-center bg-brand text-lg font-bold text-white">
                                {step.number}
                            </span>
                            <span className="mt-6 flex size-10 items-center justify-center text-fg-brand-strong">
                                <step.icon size={24} aria-hidden="true" />
                            </span>
                            <h3 className="mt-4 text-xl text-heading">
                                {step.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-body">
                                {step.description}
                            </p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
