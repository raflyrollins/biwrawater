import { useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { cn } from '../../lib/utils';
import { login as authLogin } from '../../routes/auth';
import FieldError from './FieldError';

interface LoginFormProps {
    onSwitchMode: (mode: 'login' | 'register') => void;
}

export default function LoginForm({ onSwitchMode }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, errors, processing, post } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(authLogin.url());
    }

    return (
        <div className="flex min-h-[440px] flex-col justify-center p-8 md:p-12">
            <h2 className="mb-1 text-heading">Masuk</h2>
            <p className="mb-8 text-body">
                Selamat datang kembali! Masuk ke akun Anda.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-5">
                <div>
                    <label
                        htmlFor="login-email"
                        className="mb-2 block text-sm font-semibold text-heading"
                    >
                        Email
                    </label>
                    <input
                        id="login-email"
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
                        htmlFor="login-password"
                        className="mb-2 block text-sm font-semibold text-heading"
                    >
                        Kata Sandi
                    </label>
                    <div className="relative">
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className={cn(
                                'input pr-11',
                                errors.password && 'input-error',
                            )}
                            placeholder="Masukkan kata sandi"
                            autoComplete="current-password"
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

                <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                            className="h-4 w-4 accent-brand"
                        />
                        <span className="text-sm text-body-subtle">
                            Ingat saya
                        </span>
                    </label>
                    <button
                        type="button"
                        className="text-sm font-semibold text-fg-brand underline underline-offset-4 transition-colors hover:text-fg-brand-strong"
                    >
                        Lupa kata sandi?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="btn btn-brand mt-2 w-full"
                >
                    {processing ? 'Memproses...' : 'Masuk'}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-body-subtle">
                Belum punya akun?{' '}
                <button
                    type="button"
                    onClick={() => onSwitchMode('register')}
                    className="inline font-bold text-fg-brand underline underline-offset-4 transition-colors hover:text-fg-brand-strong"
                >
                    Daftar sekarang
                </button>
            </p>
        </div>
    );
}
