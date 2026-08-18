import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

const faqs = [
    {
        question: 'Bagaimana cara memesan air tangki?',
        answer: 'Anda bisa pesan langsung lewat web di jam buka, atau menghubungi kami lewat WhatsApp/telepon dan admin akan membuatkan pesanannya.',
    },
    {
        question: 'Kapan saya harus membayar?',
        answer: 'Setelah pesanan dikonfirmasi oleh admin, Anda akan dibawa ke pembayaran Midtrans. Pembayaran harus diselesaikan dalam 20 menit, jika lewat pesanan dibatalkan otomatis.',
    },
    {
        question: 'Berapa lama air sampai ke rumah?',
        answer: 'Pesanan yang dikonfirmasi dan lunas masuk antrian pengiriman. Jika tidak sempat diantar pada jam buka hari itu, pesanan dijadwalkan ke hari kerja berikutnya sesuai antrian.',
    },
    {
        question: 'Apakah melayani di luar area Marelan?',
        answer: 'Ya. Untuk alamat di luar zona Marelan dikenakan biaya pengiriman tambahan yang ditetapkan oleh Biwrawater.',
    },
    {
        question: 'Bagaimana jika saya tidak ada di rumah saat pengantaran?',
        answer: 'Driver akan menghubungi Anda langsung. Jika tidak berhasil, pengantaran ditandai gagal dan admin akan membantu menjadwalkan ulang.',
    },
    {
        question: 'Bisakah saya membatalkan pesanan?',
        answer: 'Sebelum air diisi ke tangki di gudang, pesanan bisa dibatalkan dengan pengembalian dana penuh. Setelah air diisi, pembatalan diproses melalui admin dengan pengembalian sebagian sesuai keputusan Biwrawater.',
    },
];

function FaqItem({
    question,
    answer,
}: {
    question: string;
    answer: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-border-default last:border-b-0">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center justify-between gap-6 bg-neutral-secondary-soft px-5 py-4 text-left text-base font-medium text-heading transition-colors duration-150',
                    'hover:bg-neutral-tertiary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    open && 'bg-neutral-tertiary-soft',
                )}
            >
                {question}
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={cn(
                        'shrink-0 text-body transition-transform duration-150',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {open && (
                <div className="border-t border-border-default bg-neutral-primary-soft px-5 py-4">
                    <p className="text-sm leading-relaxed text-body">
                        {answer}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function Faq() {
    return (
        <section id="faq" className="section bg-gradient-page">
            <div className="container-section">
                <div className="section-header grid gap-6 lg:grid-cols-2 lg:items-end">
                    <div>
                        <p className="label-caps text-fg-brand-strong">FAQ</p>
                        <h2 className="mt-4 text-heading">
                            Pertanyaan yang sering diajukan
                        </h2>
                    </div>
                    <p className="text-lg leading-relaxed text-body lg:max-w-md">
                        Belum menemukan jawabannya? Hubungi kami lewat telepon
                        atau WhatsApp.
                    </p>
                </div>

                <div className="card">
                    {faqs.map((faq) => (
                        <FaqItem
                            key={faq.question}
                            question={faq.question}
                            answer={faq.answer}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
