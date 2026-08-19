import { useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { cn } from '../../lib/utils';
import { register as authRegister } from '../../routes/auth';
import FieldError from './FieldError';

interface RegisterFormProps {
    onSwitchMode: (mode: 'login' | 'register') => void;
}

export default function RegisterForm({ onSwitchMode }: RegisterFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, errors, processing, post } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(authRegister.url());
    }

    return (
        <div className="flex min-h-[440px] flex-col justify-center p-8 md:p-12">
            <h2 className="mb-1 text-heading">Daftar</h2>
            <p className="mb-8 text-body">
                Buat akun baru untuk mulai memesan.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-5">
                <div>
                    <label
                        htmlFor="reg-name"
                        className="mb-2 block text-sm font-semibold text-heading"
                    >
                        Nama Lengkap
                    </label>
                    <input
                        id="reg-name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={cn('input', errors.name && 'input-error')}
                        placeholder="Nama lengkap Anda"
                        autoComplete="name"
                    />
                    <FieldError message={errors.name} />
                </div>

                <div>
                    <label
                        htmlFor="reg-email"
                        className="mb-2 block text-sm font-semibold text-heading"
                    >
                        Email
                    </label>
                    <input
                        id="reg-email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className={cn('input', errors.email && 'input-error')}
                        placeholder="contoh@email.com"
                        autoComplete="email"
                    />
                    <FieldError message={errors.email} />
                </div>

                <div>
                    <label
                        htmlFor="reg-password"
                        className="mb-2 block text-sm font-semibold text-heading"
                    >
                        Kata Sandi
                    </label>
                    <div className="relative">
                        <input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className={cn(
                                'input pr-11',
                                errors.password && 'input-error',
                            )}
                            placeholder="Minimal 8 karakter"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-body-subtle transition-colors hover:text-heading"
                            tabIndex={-1}
                            aria-label={
                                showPassword
                                    ? 'Sembunyikan kata sandi'
                                    : 'Tampilkan kata sandi'
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={18} aria-hidden="true" />
                            ) : (
                                <Eye size={18} aria-hidden="true" />
                            )}
                        </button>
                    </div>
                    <FieldError message={errors.password} />
                </div>

                <div>
                    <label
                        htmlFor="reg-password-confirm"
                        className="mb-2 block text-sm font-semibold text-heading"
                    >
                        Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                        <input
                            id="reg-password-confirm"
                            type={showConfirm ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            className={cn(
                                'input pr-11',
                                errors.password_confirmation && 'input-error',
                            )}
                            placeholder="Ulangi kata sandi"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((p) => !p)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-body-subtle transition-colors hover:text-heading"
                            tabIndex={-1}
                            aria-label={
                                showConfirm
                                    ? 'Sembunyikan kata sandi'
                                    : 'Tampilkan kata sandi'
                            }
                        >
                            {showConfirm ? (
                                <EyeOff size={18} aria-hidden="true" />
                            ) : (
                                <Eye size={18} aria-hidden="true" />
                            )}
                        </button>
                    </div>
                    <FieldError message={errors.password_confirmation} />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="btn btn-brand mt-2 w-full"
                >
                    {processing ? 'Memproses...' : 'Daftar'}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-body-subtle">
                Sudah punya akun?{' '}
                <button
                    type="button"
                    onClick={() => onSwitchMode('login')}
                    className="inline font-bold text-fg-brand underline underline-offset-4 transition-colors hover:text-fg-brand-strong"
                >
                    Masuk di sini
                </button>
            </p>
        </div>
    );
}
