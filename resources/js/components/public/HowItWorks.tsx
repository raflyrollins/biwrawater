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
        <section
            id="cara-pesan"
            className="relative overflow-hidden bg-brand py-16 sm:py-24"
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-sm">
                        Cara Pesan
                    </span>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Empat langkah sampai air di rumah Anda
                    </h2>
                </div>

                {/* Steps List Container */}
                <div className="relative mt-12 sm:mt-16">
                    {/* Decorative Connecting Line for Desktop */}
                    <div
                        className="absolute top-1/2 left-0 hidden h-0.5 w-full -translate-y-12 bg-white/20 lg:block"
                        aria-hidden="true"
                    />

                    <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {steps.map((step) => {
                            const IconComponent = step.icon;

                            return (
                                <li
                                    key={step.number}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:bg-neutral-900"
                                >
                                    {/* Accent Top Border */}
                                    <div className="absolute inset-x-0 top-0 h-1 bg-brand opacity-80 transition-opacity group-hover:opacity-100" />

                                    <div>
                                        {/* Header inside Card: Number Badge + Icon */}
                                        <div className="flex items-center justify-between">
                                            <span className="dark:text-brand-light flex size-10 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand dark:bg-brand/20">
                                                {step.number}
                                            </span>
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-brand group-hover:text-white dark:bg-neutral-800 dark:text-neutral-300">
                                                <IconComponent
                                                    aria-hidden="true"
                                                    size={20}
                                                />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">
                                            {step.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-neutral-400">
                                            {step.description}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </section>
    );
}
