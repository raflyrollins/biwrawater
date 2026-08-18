import { cn } from '../../lib/utils';

type LogoProps = {
    variant: 'light' | 'dark';
    className?: string;
};

export default function Logo({ variant, className }: LogoProps) {
    return (
        <span className="inline-flex items-center gap-2.5">
            <img
                src={
                    variant === 'dark'
                        ? '/images/logo_dark.png'
                        : '/images/logo_light.png'
                }
                alt=""
                className={cn('h-10 w-auto', className)}
            />
            <span
                className={cn(
                    'text-2xl font-bold tracking-tight',
                    variant === 'dark' ? 'text-white' : 'text-heading',
                )}
            >
                biwrawater
            </span>
        </span>
    );
}
