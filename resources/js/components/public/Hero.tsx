import { ArrowRight, Phone, Clock } from 'lucide-react';

import { index as checkout } from '../../routes/checkout';
import Button from './Button';

interface HeroProps {
    is_open: boolean;
    closed_message: string;
}

export default function Hero({ is_open, closed_message }: HeroProps) {
    return (
        <main id="beranda" className="relative min-h-[85vh] overflow-hidden">
            <div className="grid min-h-full lg:grid-cols-2">
                {/* DESKTOP LEFT - INFO (RESPONSIVE BG) */}
                <section className="relative flex hidden items-center overflow-hidden bg-[var(--neutral-primary-soft)] px-7 py-20 sm:px-12 lg:block lg:min-h-[760px] lg:px-[7vw] lg:py-24">
                    <div
                        className="pointer-events-none absolute top-[-30px] -right-16 h-[430px] w-[620px] rotate-[-18deg] rounded-[50%] border-b-[3px] border-brand/20 dark:border-brand/30"
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-none absolute top-[70px] -right-20 h-[380px] w-[570px] rotate-[-18deg] rounded-[50%] border-b-2 border-brand/10 dark:border-brand/20"
                        aria-hidden="true"
                    />

                    <div className="relative z-10 max-w-[570px]">
                        <h1 className="m-0 text-[48px] leading-[.98] font-semibold tracking-[-.045em] text-brand sm:text-[58px] lg:text-[64px]">
                            Biwra siap antar.
                        </h1>

                        <p className="mt-7 max-w-[430px] text-[17px] leading-7 text-[var(--body)]">
                            Pesan air tangki dengan mudah. Kami antar langsung
                            ke lokasi Anda di Medan Marelan.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                href={checkout.url()}
                                variant="brand"
                                size="large"
                                disabled={!is_open}
                            >
                                Pesan Sekarang
                                <ArrowRight size={20} aria-hidden="true" />
                            </Button>
                            <a
                                href="tel:+62812"
                                className="inline-flex items-center justify-center border border-brand px-7 py-3.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
                            >
                                <Phone size={18} aria-hidden="true" />
                                Hubungi Kami
                            </a>
                        </div>

                        <dl className="border-neutral-border border-neutral-border mt-14 grid grid-cols-3 gap-6 border-t pt-8">
                            {[
                                {
                                    value: '3.000L',
                                    label: 'Kapasitas tersedia',
                                },
                                { value: '1 Tangki', label: 'Per pesanan' },
                                { value: '100%', label: 'Bukti serah terima' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <dt className="sr-only">{stat.label}</dt>
                                    <dd className="font-display text-2xl font-bold text-[var(--heading)] lg:text-3xl">
                                        {stat.value}
                                    </dd>
                                    <dd className="mt-1 text-sm text-[var(--body)]">
                                        {stat.label}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* DESKTOP RIGHT - WORDMARK CENTERED VERTICAL & HORIZONTAL */}
                <section className="relative hidden min-h-[520px] w-full overflow-hidden bg-brand lg:flex lg:min-h-[760px] lg:items-center lg:justify-center">
                    <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-7 pt-16 text-center sm:px-12 lg:px-12 lg:pt-24">
                        <div>
                            <div className="text-[70px] leading-[.82] font-bold tracking-[-.065em] text-white sm:text-[100px] lg:text-[116px]">
                                biwrawater
                            </div>
                            <p className="mt-4 text-[18px] leading-[1.4] font-medium tracking-[.02em] text-white/80 sm:text-[22px]">
                                solusi air tangki medan marelan
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* TRUK VERTICAL - DESKTOP CENTER OVERLAP */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:top-1/2 lg:left-1/2 lg:block lg:-translate-x-1/2 lg:-translate-y-1/2">
                <img
                    src="/images/truck_vertical.png"
                    alt="Armada Biwra Water"
                    className="h-auto w-full max-w-[400px] drop-shadow-[0_24px_28px_rgba(0,0,0,0.18)]"
                />
            </div>

            {/* MOBILE: 2 SECTIONS WITH TRUCK OVERLAP AT BOUNDARY */}
            <div className="relative lg:hidden">
                {/* SECTION 1: TOP (THEME BACKGROUND) */}
                <section className="relative bg-[var(--neutral-primary-soft)] px-7 pt-12 pb-36 sm:px-12">
                    <div className="mx-auto max-w-[570px] text-center">
                        <h1 className="m-0 text-[36px] leading-[1.1] font-semibold tracking-[-.03em] text-brand sm:text-[44px]">
                            Biwra siap antar.
                        </h1>

                        <p className="dark:text-neutral-light mx-auto mt-5 max-w-[430px] text-[16px] leading-7 text-slate-700">
                            Pesan air tangki dengan mudah. Kami antar langsung
                            ke lokasi Anda di Medan Marelan.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Button
                                href={checkout.url()}
                                variant="brand"
                                size="large"
                                disabled={!is_open}
                            >
                                Pesan Sekarang
                                <ArrowRight size={20} aria-hidden="true" />
                            </Button>
                            <a
                                href="tel:+62812"
                                className="inline-flex items-center justify-center border border-brand px-7 py-3.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
                            >
                                <Phone size={18} aria-hidden="true" />
                                Hubungi Kami
                            </a>
                        </div>
                    </div>
                </section>

                {/* TRUCK OVERLAP - EXACTLY AT BOUNDARY BETWEEN SECTION 1 & 2 */}
                <div className="pointer-events-none absolute left-1/2 z-20 flex w-full max-w-[320px] -translate-x-1/2 -translate-y-1/2 justify-center">
                    <img
                        src="/images/truck.png"
                        alt="Armada Biwra Water"
                        className="h-auto w-full drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)]"
                    />
                </div>

                {/* SECTION 2 - BRAND BLUE WITH WORDMARK + INFO */}
                <section className="relative bg-brand px-7 pt-36 pb-16 text-center">
                    <div className="relative z-10 px-7 text-center">
                        <div className="text-[48px] leading-[.85] font-bold tracking-[-.05em] text-white sm:text-[72px]">
                            biwrawater
                        </div>
                        <p className="mt-2 text-sm text-white/90">
                            solusi air tangki medan marelan
                        </p>

                        <dl className="mt-10 grid grid-cols-3 gap-4 text-center">
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
                                    <dd className="font-display text-xl font-bold text-white sm:text-2xl">
                                        {stat.value}
                                    </dd>
                                    <dd className="mt-0.5 text-xs text-white/90">
                                        {stat.label}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>
            </div>

            {/* Central dividing line - desktop only */}
            <div
                className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-white/20 lg:block"
                aria-hidden="true"
            />

            {/* CLOSED MESSAGE */}
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
        </main>
    );
}
