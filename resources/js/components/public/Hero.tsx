import { ArrowRight, Phone, Clock } from 'lucide-react';

import { index as checkout } from '../../routes/checkout';
import Button from './Button';

interface HeroProps {
    is_open: boolean;
    closed_message: string;
}

function TruckTopView() {
    return (
        <svg
            viewBox="0 0 200 120"
            className="mx-auto h-full w-full max-w-[480px]"
            aria-hidden="true"
            role="img"
            aria-label="Truk tangki air tampak atas"
        >
            <defs>
                <linearGradient
                    id="waterGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#0094D9" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#005E8A" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#003D6B" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient
                    id="truckGrad"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#1a1a2e" />
                    <stop offset="100%" stopColor="#0f0f1a" />
                </linearGradient>
                <radialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0094D9" stopOpacity="0.6" />
                    <stop offset="70%" stopColor="#005E8A" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#003D6B" stopOpacity="0" />
                </radialGradient>
                <filter
                    id="waterBlur"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                >
                    <feGaussianBlur stdDeviation="1.5" />
                </filter>
            </defs>

            <g className="truck-top" transform="translate(100, 60) scale(0.85)">
                <g className="truck-body">
                    <rect
                        x="-60"
                        y="-25"
                        width="120"
                        height="50"
                        rx="6"
                        fill="url(#truckGrad)"
                    />
                    <rect
                        x="-50"
                        y="-50"
                        width="100"
                        height="25"
                        rx="4"
                        fill="#1a1a2e"
                    />
                    <ellipse
                        cx="-35"
                        cy="25"
                        rx="15"
                        ry="10"
                        fill="#0f0f1a"
                        stroke="#333"
                        strokeWidth="1"
                    />
                    <ellipse
                        cx="35"
                        cy="25"
                        rx="15"
                        ry="10"
                        fill="#0f0f1a"
                        stroke="#333"
                        strokeWidth="1"
                    />
                    <rect
                        x="-40"
                        y="-55"
                        width="30"
                        height="20"
                        rx="2"
                        fill="#0094D9"
                        opacity="0.3"
                    />
                </g>

                <g className="hose-splash" filter="url(#waterBlur)">
                    <path
                        d="M-5,0 Q0,-35 5,-60"
                        stroke="url(#waterGrad)"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        className="water-drop"
                    />
                    <circle
                        cx="0"
                        cy="-70"
                        r="8"
                        fill="#0094D9"
                        className="splash-main"
                    />
                    <circle
                        cx="0"
                        cy="-72"
                        r="4"
                        fill="#00D4FF"
                        className="splash-core"
                    />
                </g>
            </g>
        </svg>
    );
}

function Wordmark() {
    return (
        <div
            className="font-display text-left leading-[0.92] font-extrabold tracking-tight text-white/90 select-none"
            aria-hidden="true"
        >
            <div className="line-clamp-1">biw</div>
            <div className="line-clamp-1">raw</div>
            <div className="line-clamp-1">ater</div>
        </div>
    );
}

export default function Hero({ is_open, closed_message }: HeroProps) {
    return (
        <section
            id="beranda"
            className="bg-gradient-brand relative flex min-h-[85vh] items-center overflow-hidden"
        >
            <div
                aria-hidden="true"
                className="absolute -top-24 -right-24 hidden h-96 w-96 bg-white/15 lg:block"
            />
            <div
                aria-hidden="true"
                className="absolute -bottom-32 left-1/3 hidden h-72 w-72 bg-white/10 lg:block"
            />

            <div className="container-section relative py-16 lg:py-24">
                <div className="relative lg:grid lg:min-h-[65vh] lg:grid-cols-[2fr_1fr] lg:items-start lg:gap-12">
                    {/* KOLOM KIRI - KONTEN BISNIS */}
                    <div className="relative z-10 lg:pr-8">
                        <p className="label-caps text-on-brand-muted">
                            Medan Marelan & sekitarnya
                        </p>
                        <h1 className="font-display mt-4 max-w-2xl text-4xl leading-[1.1] font-extrabold tracking-tight text-white lg:text-5xl xl:text-6xl">
                            Air bersih sampai ke rumah Anda, tepat waktu.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-brand-muted lg:text-xl">
                            Biwrawater melayani pengisian air tangki bersih
                            dengan armada terawat, antrian pengiriman yang
                            jelas, dan pembayaran aman setelah pesanan
                            dikonfirmasi.
                        </p>

                        {!is_open && (
                            <div className="mt-8 flex items-center gap-3 border border-danger-strong bg-danger-soft p-4">
                                <Clock
                                    size={18}
                                    aria-hidden="true"
                                    className="text-danger-strong"
                                />
                                <span className="text-sm font-medium text-danger-strong">
                                    {closed_message}
                                </span>
                            </div>
                        )}

                        <div className="mt-10 flex flex-wrap items-center gap-4">
                            <Button
                                href={checkout.url()}
                                variant="white"
                                size="large"
                                disabled={!is_open}
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

                        <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
                            {[
                                {
                                    value: '3.000L',
                                    label: 'Kapasitas tersedia',
                                },
                                { value: '1 Tangki', label: 'Per pesanan' },
                                { value: '100%', label: 'Bukti serah terima' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <dt className="sr-only">{stat.label}</dt>
                                    <dd className="font-display text-2xl font-bold text-white lg:text-3xl">
                                        {stat.value}
                                    </dd>
                                    <dd className="mt-1 text-sm text-on-brand-muted">
                                        {stat.label}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* KOLOM KANAN - WORDMARK BESAR */}
                    <div className="hidden lg:flex lg:items-center lg:justify-start lg:pt-8 lg:pr-4">
                        <Wordmark />
                    </div>

                    {/* TRUK TENGAH - OVERLAP KEDUA KOLOM */}
                    <div className="pointer-events-none absolute mx-auto w-full max-w-[480px] lg:top-1/2 lg:left-1/2 lg:z-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
                        <TruckTopView />
                    </div>
                </div>

                {/* MOBILE STACK */}
                <div className="mt-10 lg:hidden">
                    <TruckTopView />
                </div>

                <div className="mt-6 text-center lg:hidden">
                    <Wordmark />
                </div>

                {/* CLOSED MESSAGE - MOBILE FIXED BOTTOM, DESKTOP INLINE */}
                {!is_open && (
                    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 lg:static lg:hidden lg:max-w-none lg:translate-x-0 lg:py-0">
                        <div className="flex items-center gap-3 border border-danger-strong bg-danger-soft p-4">
                            <Clock
                                size={18}
                                aria-hidden="true"
                                className="shrink-0 text-danger-strong"
                            />
                            <span className="text-sm font-medium text-danger-strong">
                                {closed_message}
                            </span>
                        </div>
                    </div>
                )}
                {!is_open && (
                    <div className="mt-8 lg:block lg:hidden">
                        <div className="flex items-center gap-3 border border-danger-strong bg-danger-soft p-4">
                            <Clock
                                size={18}
                                aria-hidden="true"
                                className="shrink-0 text-danger-strong"
                            />
                            <span className="text-sm font-medium text-danger-strong">
                                {closed_message}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
