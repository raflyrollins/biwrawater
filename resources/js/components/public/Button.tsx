import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = {
    variant?: 'white' | 'brand';
    size?: 'default' | 'large';
    href?: string;
    children: ReactNode;
    className?: string;
} & ComponentPropsWithoutRef<'button'>;

export default function Button({
    variant = 'brand',
    size = 'default',
    href,
    children,
    className,
    ...props
}: ButtonProps) {
    const classes = cn(
        'btn',
        variant === 'white' ? 'btn-white' : 'btn-brand',
        size === 'large' ? 'btn-large' : '',
        className,
    );

    if (href) {
        return (
            <a href={href} className={classes}>
                {children}
            </a>
        );
    }

    return (
        <button type="button" className={classes} {...props}>
            {children}
        </button>
    );
}
