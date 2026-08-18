import { router } from '@inertiajs/react';
import type { MouseEvent, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = {
    variant?: 'white' | 'brand';
    size?: 'default' | 'large';
    href?: string;
    method?: 'get' | 'post';
    children: ReactNode;
    className?: string;
} & Omit<React.ComponentPropsWithoutRef<'button'>, 'onClick'> & {
        onClick?: (
            e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
        ) => void;
    };

export default function Button({
    variant = 'brand',
    size = 'default',
    href,
    method = 'get',
    children,
    className,
    onClick,
}: ButtonProps) {
    const classes = cn(
        'btn',
        variant === 'white' ? 'btn-white' : 'btn-brand',
        size === 'large' ? 'btn-large' : '',
        className,
    );

    if (href) {
        const url = href;

        function handleClick(e: MouseEvent<HTMLAnchorElement>) {
            if (method !== 'get') {
                e.preventDefault();

                router.visit(url, { method });
            }

            onClick?.(e);
        }

        return (
            <a href={url} className={classes} onClick={handleClick}>
                {children}
            </a>
        );
    }

    return (
        <button type="button" className={classes} onClick={onClick}>
            {children}
        </button>
    );
}
