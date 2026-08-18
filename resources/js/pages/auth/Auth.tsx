import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

import LoginForm from '../../components/public/LoginForm';
import RegisterForm from '../../components/public/RegisterForm';

const LOGIN_IMG =
    'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800&q=80';
const REGISTER_IMG =
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80';

interface AuthProps {
    mode: 'login' | 'register';
}

const TRANSITION = {
    type: 'tween' as const,
    duration: 0.45,
    ease: 'easeInOut' as const,
};

// Konten panel kiri selalu mengalir menuju tengah (keluar ke kanan,
// masuk dari kanan); panel kanan sebaliknya (keluar ke kiri, masuk
// dari kiri). Efeknya: pindah ke register, form bergeser ke kiri dan
// gambar ke kanan; kembali ke login, kebalikannya.
const leftPanelVariants = {
    enter: { x: '100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
};

const rightPanelVariants = {
    enter: { x: '-100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
};

export default function Auth({ mode }: AuthProps) {
    const isLogin = mode === 'login';
    const imgSrc = isLogin ? LOGIN_IMG : REGISTER_IMG;

    function switchMode(nextMode: 'login' | 'register') {
        router.visit(nextMode === 'login' ? '/login' : '/register', {
            preserveState: true,
            replace: true,
        });
    }

    const mobileImageVariants = {
        enter: { x: '100%', opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: '-100%', opacity: 0 },
    };

    return (
        <>
            <Head title={isLogin ? 'Masuk' : 'Daftar'} />

            <div className="bg-gradient-dark relative flex min-h-dvh items-center justify-center p-4">
                <Link
                    href="/"
                    className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 text-sm font-medium text-on-brand-muted no-underline transition-colors hover:text-white"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Kembali
                </Link>

                {/* Mobile: stacked */}
                <div className="card flex w-full max-w-md flex-col overflow-y-auto md:hidden">
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={`${mode}-image`}
                            variants={mobileImageVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={TRANSITION}
                            className="relative aspect-[16/9] overflow-hidden bg-cover bg-center"
                            style={{ backgroundImage: `url(${imgSrc})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/30 to-transparent" />
                            <div className="relative flex h-full flex-col justify-end p-6">
                                <h3 className="text-white">
                                    {isLogin
                                        ? 'Selamat Datang Kembali'
                                        : 'Mulai Pesan Air Bersih'}
                                </h3>
                                <p className="mt-1 text-sm text-on-brand-muted">
                                    {isLogin
                                        ? 'Masuk ke akun Biwrawater Anda.'
                                        : 'Daftar untuk memesan air tangki langsung ke rumah Anda.'}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={TRANSITION}
                        >
                            {isLogin ? (
                                <LoginForm onSwitchMode={switchMode} />
                            ) : (
                                <RegisterForm onSwitchMode={switchMode} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Desktop: animated panels */}
                <div className="card hidden overflow-x-hidden md:flex md:h-[560px] md:w-full md:max-w-[900px]">
                    {/* Left panel */}
                    <div className="relative w-1/2">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={
                                    isLogin
                                        ? 'panel-left-image'
                                        : 'panel-left-form'
                                }
                                variants={leftPanelVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={TRANSITION}
                                className="absolute inset-0 overflow-x-hidden overflow-y-auto"
                            >
                                {isLogin ? (
                                    <div
                                        className="h-full bg-cover bg-center"
                                        style={{
                                            backgroundImage: `url(${LOGIN_IMG})`,
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/30 to-transparent" />
                                        <div className="relative flex h-full flex-col justify-end p-8 md:p-12">
                                            <h3 className="text-white">
                                                Selamat Datang Kembali
                                            </h3>
                                            <p className="mt-2 text-on-brand-muted">
                                                Masuk untuk melanjutkan
                                                pemesanan air bersih Anda
                                                bersama Biwrawater.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <RegisterForm onSwitchMode={switchMode} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right panel */}
                    <div className="relative w-1/2">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={
                                    isLogin
                                        ? 'panel-right-form'
                                        : 'panel-right-image'
                                }
                                variants={rightPanelVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={TRANSITION}
                                className="absolute inset-0 overflow-x-hidden overflow-y-auto"
                            >
                                {isLogin ? (
                                    <LoginForm onSwitchMode={switchMode} />
                                ) : (
                                    <div
                                        className="h-full bg-cover bg-center"
                                        style={{
                                            backgroundImage: `url(${REGISTER_IMG})`,
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/30 to-transparent" />
                                        <div className="relative flex h-full flex-col justify-end p-8 md:p-12">
                                            <h3 className="text-white">
                                                Mulai Pesan Air Bersih
                                            </h3>
                                            <p className="mt-2 text-on-brand-muted">
                                                Daftar sekarang dan nikmati
                                                kemudahan memesan air tangki
                                                bersama Biwrawater.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </>
    );
}
